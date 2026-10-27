# Design Engine, Prototype Engine, Realtime Rendering and Embedded AI: Logic Specification

*Prepared 26 October 2026. Companion to the Figma Design and Prototype capability reference. Assumes a TypeScript application shell (web or Electron) with a performance-critical core in Rust or C++ compiled to WebAssembly. Each algorithm is specified so it can be implemented and unit tested on its own.*

## 0. Targets, constraints and hardware reality

**Performance targets**

- Pan, zoom and drag at 60 fps (16.6 ms budget: input 1 ms, engine 3 ms, render submit 6 ms, GPU 6 ms) with 10,000 visible nodes.
- Edit-to-pixel latency under 50 ms for property changes; auto layout relayout of a 2,000-node subtree under 8 ms.
- Prototype playback at 60 fps including transitions; input-to-response under 100 ms.
- Cold open of a 50,000-node file under 3 s (pages and node data streamed lazily).

**Development machine (MacBook Pro, 8-core Intel Core i9, Intel UHD Graphics 630, 32 GB DDR4-2400)**

- The integrated GPU has modest fill-rate and shares system memory. Rendering must be damage-aware, tile-cached and adaptive (section 4), with expensive effects (blur, glass, shaders) downgraded during gestures.
- Ollama has no GPU path for this GPU on macOS and the MLX build targets Apple Silicon only, so qwen3.8:27b runs on the CPU here. The default Q4\_K\_M build is about 18 GB: it fits in 32 GB but leaves roughly 12 to 14 GB for the OS, the editor and the KV cache. Section 6 gives estimated speeds and the design rules that follow.
- Rule that follows: **AI is never on the render path or the edit path.** The canvas stays at full speed while the model works.

## 1. Architecture

```
UI shell (panels, canvas host)            main thread
   | commands / events
Command bus + Transaction manager          engine worker (WASM)
   |                          |
Document model (scene graph)  |-- Variable / Style / Component resolver
   |                          |-- Layout engine (auto layout, constraints, grid)
   |                          |-- Text engine (shaping, line breaking)
   |                          |-- Geometry engine (paths, booleans, strokes)
   |                          |-- Spatial index (R-tree) + snapping
   | display list + change set
Render engine                              render worker (OffscreenCanvas, WebGL2 / WebGPU)
Prototype runtime (state machine)          engine worker, reads the same document
AI engine (provider router)                AI worker -> HTTP to Ollama at localhost:11434
   | validated ops                         never writes directly: goes through the command bus
```

**Principles**

1. **Single source of truth**: the document model. UI, renderer, prototype runtime and AI read it; mutation happens only through commands.
2. **Commands are data** (serialisable, invertible, batchable): one mechanism gives undo/redo, multiplayer, macros, scripting and AI edits.
3. **Derived data is cached and invalidated by dirty flags**, never recomputed wholesale: layout boxes, resolved paints, geometry, text runs, bounds.
4. **Thread separation**: the UI thread never runs layout or tessellation; messages carry compact patches and transferable buffers.

## 2. Document model and command system

```ts
type NodeId = number;               // 32-bit session id; stable UUID kept in persistence
interface Node {
  id: NodeId; type: NodeType; parent: NodeId | null; children: NodeId[];
  props: PropBag;                   // sparse: only explicitly set properties
  rev: number;                      // increments on any change (cache key)
}
type Command =
  | { op: 'create'; node: NodeInit; parent: NodeId; index: number }
  | { op: 'delete'; id: NodeId }
  | { op: 'set'; id: NodeId; key: PropKey; value: PropValue }
  | { op: 'reparent'; id: NodeId; parent: NodeId; index: number }
  | { op: 'batch'; cmds: Command[]; label: string };
```

**Transaction manager**

- `begin(label)`, `apply(cmd)`, `commit()`. Each applied command returns its inverse, pushed on the undo stack. Continuous gestures (drag, scrub) share a gesture id: intermediate states are applied live, only the final state becomes one undo step.
- Commit emits a **change set** `{ created, deleted, changed: Map<NodeId, Set<PropKey>> }` consumed by the dirty-flag system, renderer, prototype runtime and sync layer.
- Multiplayer: per-property last-writer-wins using Lamport timestamps; child order by fractional indexing; deleted nodes tombstoned for a grace period to settle concurrent reparenting. Undo is per user (inverse of the user's own commands, re-applied as new commands).

**Dirty flags** (bitmask per node): `LAYOUT_SELF`, `LAYOUT_CHILDREN`, `PAINT`, `GEOMETRY`, `TEXT`, `BOUNDS`, `RESOLVE`.

- Size, padding, gap, text content, child add/remove, layout mode: `LAYOUT_SELF` on the node, then walk up while the ancestor's size depends on content (Hug); the first ancestor with Fixed or Fill size becomes the **relayout root** (`LAYOUT_CHILDREN`).
- Fill, stroke, effect, opacity: `PAINT` only, no layout.
- Path, radius, boolean operand: `GEOMETRY`, propagating to boolean parents.
- Variable, style, mode or main-component change: `RESOLVE` on every dependent node, found through reverse indexes (variable to nodes, style to nodes, component to instances).

## 3. Design engine logic

### 3.1 Pipeline after each commit

1. **Resolve** effective property values for `RESOLVE` nodes (3.2).
2. **Layout** from relayout roots, top-down (3.3, 3.4). Text measurement is called from inside layout (Hug depends on text size) and memoised on `(node.rev, width constraint)`.
3. **Geometry**: rebuild paths for `GEOMETRY` nodes (vector networks, booleans, strokes, smoothed corners).
4. **Bounds and index**: update world transforms and render bounds (stroke outer width, shadow offset plus blur extent), update the R-tree.
5. **Publish** the change set and invalidated rectangles to the renderer.

### 3.2 Property resolution order

For property P on node N, the effective value is the first defined of:

1. Transient override (prototype playback, hover preview, AI ghost preview).
2. Instance override of P on N (stored on the instance, keyed by the path of node ids).
3. Variable binding on N for P, resolved in the active mode (3.6).
4. Style reference covering P (fill, text, effect, grid style); style values may themselves be variable-bound.
5. Explicit local value on N.
6. For instance sub-nodes: the value on the matching node of the main component or selected variant.
7. Default. Cache the resolved bag per node with key `(node.rev, mode-context hash, library rev)`.

### 3.3 Auto layout algorithm

Inputs: frame F with `layoutMode` H, V or GRID, padding, gap, alignment, wrap. Two passes:

```
measure(node, avail):                      // bottom-up, returns preferred size
  if leaf: return intrinsic size (text = shaped size, image = fixed)
  for child in flowChildren(node): child.pref = measure(child, availFor(child))
  main  = sum(child.pref.main) + gap*(n-1) + padMainStart + padMainEnd
  cross = max(child.pref.cross) + padCrossStart + padCrossEnd
  if wrap: run the line breaker first (below)
  clamp to min/max; map main/cross to w/h by direction

arrange(node, box):                         // top-down, assigns final boxes
  inner = box minus padding
  fixedSum = sum(Fixed and Hug child main sizes) + gaps
  free = inner.main - fixedSum
  fills = children with Fill on main axis
  if fills: share = free / count (or weighted); clamp each to min/max, remove clamped
            children, redistribute leftover; repeat until stable (max 4 passes)
  main-axis position by primaryAxisAlign:
      MIN -> start | CENTER -> free/2 | MAX -> free | SPACE_BETWEEN -> gap = free/(n-1)
  cross-axis per child: Fill -> inner.cross; else MIN / CENTER / MAX / BASELINE
  absolute children skip the flow and use constraints against the node box
  recurse arrange(child, childBox)
```

- **Wrap**: greedy line breaking on the main axis against the available width; each line gets its own cross size; lines stack with `counterAxisSpacing`; Hug height is the sum of line heights plus spacing.
- **Grid**: resolve column and row tracks (fixed, fill with fr weights, hug as the max of spanning content), place children by row, column and span, then align inside each cell.
- **Reverse stacking** changes draw order only. **Strokes in layout** adds stroke weight to the box when enabled.
- **Complexity guard**: results memoised per `(node.rev, constraint box)`; relayout never descends into a subtree whose box and flags are unchanged.

### 3.4 Constraints (parents without auto layout)

When the parent box changes from `P0` to `P1`, for each child with box `c` relative to the parent:

- Horizontal LEFT: `x` unchanged. RIGHT: `x' = x + (P1.w - P0.w)`. LEFT\_RIGHT: keep both margins, `w' = w + (P1.w - P0.w)`. CENTER: `x' = x + (P1.w - P0.w)/2`. SCALE: `x' = x*P1.w/P0.w`, `w' = w*P1.w/P0.w`.
- Vertical works the same on y and h. Rotated children use their rotated bounding box for the maths, then the transform is re-solved. Auto-width text keeps its intrinsic width.
- Constraints apply recursively; for instances, the main component size is the baseline `P0`.

### 3.5 Components, variants and instances

- An **instance** stores `mainId`, `variantProps` (for example `{ Size: 'M', State: 'Hover' }`), `overrides: Map<path, PropBag>` and component property values (boolean, text, instance-swap, slot).
- **Variant selection**: pick the child of the component set whose property map equals `variantProps`; with no exact match, take the closest by matching property count, ties broken by definition order.
- **Lazy instantiation**: sub-nodes are virtual (reference to the main node plus an override bag) and become real nodes only when edited. Files with thousands of instances stay small and fast.
- **Propagation**: editing a main component marks all instances `RESOLVE`. Overrides whose target layer was deleted are kept but flagged orphaned.
- **Component properties**: boolean toggles a bound layer's visibility, text sets characters, instance-swap replaces a nested instance's `mainId` (respecting preferred instances), slot accepts arbitrary children.
- **Detach** copies the resolved tree into real nodes and drops the link; **reset overrides** clears the map; **push overrides to main** writes the override value to the main node.

### 3.6 Variables and modes

- Collection `{ id, modes[], variables[] }`; variable `{ id, type, valuesByMode, scopes, codeSyntax }`. A value is a literal or an alias `{ aliasOf: variableId }`.
- **Active mode** of a collection at node N: the nearest ancestor (including N) with an explicit mode for that collection, otherwise the collection default. In prototype playback, `Set variable mode` pushes a runtime override at the root.
- **Alias resolution**: follow aliases until a literal appears, using the active mode of each hop's own collection at N. Detect cycles with a visited set; on a cycle return the type default and raise a diagnostic.
- Reverse index (variable to bound nodes) updates incrementally whenever a binding changes.
- Bindable properties: number to width, height, padding, gap, radius, opacity, stroke weight, font size, line height; string to text content and variant properties; boolean to visibility and component booleans; colour to fills, strokes, effect colours and gradient stops.

### 3.7 Selection, hit-testing, transform and snapping

- **Hit test**: pointer to world space; query the R-tree; walk candidates in reverse paint order; exact tests per shape (rect, rounded rect, ellipse with arc, polygon, path with fill rule, text bounds, stroke with half-width plus 4 screen px tolerance); skip locked and hidden nodes; honour selection context (top-level inside the current frame unless deep-select).
- **Transform handles**: eight resize handles plus rotation zones outside corners. Shift keeps aspect ratio, Option resizes from the centre, Cmd scales children. Resizing a group applies constraints to children; the Scale tool scales fills, strokes, text size and effects.
- **Snapping** (default threshold 5 screen px, converted to world units by zoom):
  1. Collect candidate lines from visible siblings and the parent (left, centre, right, top, middle, bottom), plus guides, layout grid lines and the pixel grid.
  2. Test the moving box's three x-lines and three y-lines against candidates; take the minimum delta per axis.
  3. Equal spacing: sort neighbours along the axis; if the moving box sits between A and B with gaps `gA`, `gB` and `abs(gA - gB) < threshold`, snap to equalise; also detect repeated gaps between existing neighbours and match them.
  4. Emit guide and distance overlays for the overlay renderer.
- Nudge, repeat-duplicate (remembers the last offset), align, distribute and tidy up are pure commands.

### 3.8 Vector, boolean and stroke geometry

- **Vector network**: vertices with optional in/out tangents, segments between two vertices, regions as loops with a fill rule. Regions are found by planar face detection and converted to path loops for rendering.
- **Flattening**: adaptive Bezier subdivision with tolerance `0.25 / zoom` px so curves stay smooth at any zoom; flattened polylines cached per zoom bucket.
- **Booleans**: flatten operands, run a robust polygon clipper (Martinez-Rueda-Feito, or a Clipper-style integer grid at 1/64 px) for union, subtract, intersect, exclude. Booleans stay live until Flatten refits curves.
- **Stroker**: offset each segment by half the weight; joins (miter with limit, bevel, round); caps (butt, round, square, arrows as inserted geometry); inside and outside positions by clipping against the fill; dashes by arc-length walk; variable width by sampling a width profile along arc length.
- **Corner smoothing**: radius per corner clamped to `min(w, h)/2`; smoothing `s` in \[0, 1\] extends the transition curve to roughly `r*(1+s)` along each edge for continuous curvature.

### 3.9 Text engine

- Shaping with HarfBuzz (WASM); line breaking per UAX #14; bidi per UAX #9; grapheme clusters per UAX #29; per-script font fallback. OpenType features and variable axes are shaping parameters.
- Layout per paragraph: runs, line breaks to width (unbounded for Auto width), letter spacing, line height (auto from font metrics), paragraph spacing and indent, vertical trim, alignment, truncation with ellipsis after N lines.
- Cache keyed by `(text, style runs, width bucket, font versions)`; glyph outlines cached per font and size bucket.
- Editing: caret and selection over grapheme clusters; mixed styles stored as run-length arrays; IME composition through a hidden input proxy.

### 3.10 Colour and blending

- Compositing in linear-light premultiplied float. UI values stored in sRGB or Display P3 per the document profile. sRGB to linear: `c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4`. P3 to sRGB through a 3x3 matrix after linearisation, with gamut mapping by chroma reduction in Oklch.
- Gradients interpolate in sRGB by default with an optional Oklab mode for smoother ramps; stops are sorted `(t, rgba)`; angular and diamond gradients are computed per fragment from the transformed coordinate.
- Blend modes as shader functions: Multiply `B*S`, Screen `1-(1-B)(1-S)`, Overlay, Soft light (W3C formula), Hard light, Color dodge and burn, Difference, Exclusion, plus Hue, Saturation, Color and Luminosity using the standard Lum and Sat helpers.
- HEX, RGB, HSL, HSB and CSS string conversions are pure functions with round-trip tests.

## 4. Realtime rendering engine

### 4.1 Backend and abstraction

- A render hardware interface (RHI) with two backends: **WebGL2** (baseline, runs everywhere including the Intel UHD 630) and **WebGPU** (when available). A native Skia or Metal backend can sit behind the same RHI if the app moves to desktop-native.
- The canvas is an `OffscreenCanvas` owned by a render worker; the UI thread only sends camera, selection and overlay data.

### 4.2 From scene to display list

1. Each frame, compute the visible world rectangle from the camera.
2. Query the R-tree for intersecting nodes; skip hidden nodes and nodes projected under 0.5 px (a whole tiny frame becomes one average-colour quad).
3. Traverse in paint order and emit **draw items**: `{ shader, geometry, paint params, clip, transform, blend, layerFlag }`.
4. Within the same layer, merge consecutive items that share shader and texture into instanced draws, never changing paint order.
5. **Offscreen layers** are created only when required: group opacity below 1 with overlapping children, non-normal blend on groups, masks, background blur, layer blur, shadows on groups, and rounded clips that cannot use a scissor.

### 4.3 Primitive rendering

- **Rect and rounded rect**: one instanced quad with an SDF fragment shader (per-corner radius, smoothing, stroke inside, centre or outside, anti-aliasing from the SDF). Thousands of boxes cost one draw call.
- **Ellipse and arcs**: SDF shader with an angular mask.
- **Paths**: tessellate fills (monotone partition with the winding rule) and strokes on the engine worker; cache vertex buffers per zoom bucket; use stencil-then-cover for self-overlapping paths; MSAA or analytic edge coverage for anti-aliasing.
- **Text**: multi-channel SDF glyph atlas below 64 px (crisp during zoom), outline tessellation above; subpixel positioning; decorations as quads.
- **Images**: mipmapped textures streamed progressively (low-res placeholder first); LRU texture cache with a VRAM budget (default 256 MB on integrated GPUs); crop and tile by texture matrix; exposure, contrast, saturation, temperature, tint, highlights and shadows in a fragment shader.
- **Gradients**: stops in a 1D texture or uniform array; linear, radial, angular and diamond per fragment.
- **Video fills**: external texture updated per frame only for visible, playing nodes.

### 4.4 Effects

- **Drop and inner shadow**: render shape alpha to a small target, blur, tint, composite beneath or inside; cache the blurred alpha per `(shape rev, blur, scale)`.
- **Gaussian blur**: separable two-pass at reduced resolution (downsample factor `max(1, blur/8)`), upsample on composite; mip-chain blur above 64 px.
- **Background blur and glass**: capture the backdrop under the layer bounds, blur, composite through the layer shape as mask. Glass adds refraction (UV offset along the shape SDF gradient), dispersion (per-channel offsets) and frost noise.
- **Noise and texture**: procedural hash-based shader in layer space. **Progressive blur**: mix two blur levels by a gradient mask.
- **Shader fills and effects**: user or AI authored shaders compiled to GLSL or WGSL with a restricted interface (time, resolution, parameters) and a compile-time instruction budget.

### 4.5 Tile cache and progressive rendering

- Cache the rasterised canvas in 512x512 tiles per zoom bucket (powers of two). Panning reuses tiles and rasterises only the strip entering view.
- During continuous zoom, draw existing tiles scaled (soft but instant), re-raster the sharp level over several frames, then crossfade.
- Invalidation is **per tile**: the union of old and new render bounds marks touched tiles dirty; only those are re-rasterised.
- Very large frames use a coarse LOD while interacting (tiny text as bars, lower image mips) and refine on idle.

### 4.6 Overlay and interaction layer

- Selection boxes, handles, guides, snap lines, distance labels, multiplayer cursors, comment pins, layout grids, rulers and the pixel grid draw in a **separate overlay pass** with no dependency on the tile cache.
- While dragging, lift the selected nodes into a **floating layer** (own textures positioned by a transform). A drag is then one transform update per frame instead of tile re-raster; commit and merge back on drop.

### 4.7 Frame loop and adaptive quality

```
onInput(event) -> engine.queue(event)
rAF(t):
  engine.drain(budget = 3ms)             // commands, layout, geometry
  displayList = scene.visibleItems(camera)
  quality = governor.level()              // 0 full .. 3 draft
  renderer.draw(displayList, quality)     // tiles + floating layer + overlay
  governor.record(frameTimeMs)
governor: rolling p95 frame time > 14 ms during a gesture -> level++
          (DPR to 1x, skip blur/glass/shader effects, lower mip and LOD)
          after 150 ms idle -> level = 0 and re-raster at full quality over idle frames
```

- Render only when something changed or an animation is active; otherwise the loop sleeps.
- Device pixel ratio capped at 2 on integrated GPUs; texture and tile memory budgets enforced by LRU eviction.

### 4.8 Prototype playback rendering

- The same renderer draws prototype frames. Transitions use **snapshot compositing**: capture outgoing and incoming frames to textures, then composite per frame (dissolve alpha, move, push, slide). Cost is two textured quads regardless of content complexity.
- **Smart animate** renders live nodes: interpolated values go into the transient override layer (priority 1 in 3.2), only tiles of animating nodes re-raster, and trees above a layer-count threshold fall back to snapshot animation of their static parts.
- Scroll containers rasterise content once into an oversized texture and translate it per frame, re-rastering only when content changes.
- Fixed-timestep simulation (internal 240 Hz steps, rendered at display rate) keeps animations deterministic under frame drops.

### 4.9 Metrics and test plan

- HUD: frame-time histogram, draw calls, triangles, tile hits and misses, texture memory, layout time, geometry time.
- Release-gating benchmarks: 10k rectangles pan and zoom; 2k text layers; 500 shadowed cards; 200 background-blurred layers (must degrade gracefully via the governor); 50 images at 4K; a 5k-instance component page.
- Golden-image tests for every paint type, effect and blend mode with per-pixel and SSIM tolerance.

## 5. Prototype engine logic

### 5.1 Data model

```ts
interface PrototypeGraph {
  flows: { id: string; name: string; start: NodeId }[];
  interactions: Map<NodeId, Interaction[]>;      // owning layer -> interactions
  variables: VariableStore;                      // shared with design variables (3.6)
}
interface Interaction { id: string; trigger: Trigger; when?: Expr; actions: Action[] }
type Trigger =
  | { t: 'click' } | { t: 'drag'; dir?: 'any' | 'left' | 'right' | 'up' | 'down'; slop?: number }
  | { t: 'hover' } | { t: 'press' } | { t: 'mouseEnter' } | { t: 'mouseLeave' }
  | { t: 'mouseDown' } | { t: 'mouseUp' } | { t: 'key'; keys: string[]; gamepad?: string }
  | { t: 'after'; ms: number };
type Action =
  | { a: 'navigate'; to: NodeId; tr: Transition; resetScroll?: boolean; resetVars?: boolean }
  | { a: 'back' } | { a: 'scrollTo'; target: NodeId; tr: Transition }
  | { a: 'openOverlay'; frame: NodeId; tr: Transition; pos: OverlayPos; closeOutside: boolean; backdrop?: Fill }
  | { a: 'swapOverlay'; frame: NodeId; tr: Transition } | { a: 'closeOverlay' }
  | { a: 'openLink'; url: string; newTab: boolean }
  | { a: 'setVar'; id: VarId; expr: Expr } | { a: 'setMode'; collection: string; mode: string }
  | { a: 'if'; branches: { cond: Expr; actions: Action[] }[]; else?: Action[] }
  | { a: 'changeTo'; variant: Record<string, string>; target?: NodeId; tr: Transition }
  | { a: 'media'; op: 'play' | 'pause' | 'toggle' | 'mute' | 'unmute' | 'skip'; target: NodeId; time?: number };
interface Transition { type: 'instant' | 'dissolve' | 'smart' | 'moveIn' | 'moveOut' | 'push' | 'slideIn' | 'slideOut';
  dir?: 'left' | 'right' | 'up' | 'down'; easing: Easing; durationMs: number }
```

**Runtime state**: `{ baseFrame, history: NodeId[], overlays: Overlay[], vars, modeOverrides, scroll: Map<NodeId, ScrollState>, variants: Map<path, VariantProps>, timers, transitions: Active[], media }`. The runtime reads the design document read-only and writes only to its own state and the transient override layer.

### 5.2 Event dispatch

```
onPointer(e):
  p = toPrototypeSpace(e)
  leaf = hitTest(p): overlays top-down, then base frame; scroll containers hit-tested in
         scrolled coordinates; nodes hidden by variable-bound visibility are skipped
  node = leaf
  while node:                                   // bubble up the layer tree
    matches = node.interactions.filter(i => i.trigger matches e)
    if matches non-empty:
       for i in matches (in order): if eval(i.when) is true: schedule(i.actions)
       break                                    // bubbling stops at the first handling node
    node = node.parent
  else if e is click and top overlay has closeOutside: schedule(closeOverlay)
```

- **Drag** is recognised after movement exceeds the slop (default 8 px) with a dominant direction. Arbitration: a descendant with an explicit drag interaction in that direction wins; otherwise the nearest scroll container whose overflow allows that direction claims the gesture and chains to its parent at the scroll edge.
- **Hover and press** are stateful: actions apply on enter or press and a revert entry is pushed so leaving the layer or releasing the pointer restores the previous state (for example variant back to default, overlay closed).
- **After delay** timers arm when a frame (or overlay) becomes active and are cancelled when it deactivates; each activation re-arms them.
- **Key and gamepad** triggers match on key down against the focused prototype, with modifier sets compared exactly.

### 5.3 Action semantics

- **Navigate**: replaces the base frame, pushes the previous one on history, closes all overlays (including when triggered from inside an overlay), optionally resets scroll and variables.
- **Back**: if an overlay is open it closes the top overlay; otherwise it pops history and plays the reverse of the original transition.
- **Open overlay**: pushes onto the overlay stack. Position presets compute from the overlay size and the base frame bounds; manual position keeps the offset relative to the trigger layer. Optional backdrop fill and click-outside close. **Swap overlay** replaces the top entry; **Close overlay** removes the overlay containing the trigger (or the top one).
- **Scroll to**: animates the scroll offset of the target's scroll container so the target aligns to the viewport start, using the action's transition.
- **Set variable / mode**: sequential semantics. Each write is visible to later actions in the same interaction and marks dependents `RESOLVE`. **Conditional**: first branch whose condition is true runs, otherwise the else list.
- **Change to**: updates the nearest ancestor instance's `variantProps` (or the named target), then transitions between the old and new variant subtrees (smart animate or other types). Interactions inside the new variant become active immediately.
- **Media**: updates the playback state of the target video; scheduling follows the media clock.
- **Interruption policy**: a new user action during a transition retargets it. Smart animate starts the new tween from the currently interpolated values (preserving velocity for springs); snapshot transitions jump the old one to its end state, then start the new one. Programmatic actions (timers) queue instead of interrupting.

### 5.4 Expression language

```
expr    := or
or      := and ( '||' and )*
and     := cmp ( '&&' cmp )*
cmp     := add ( ('==' | '!=' | '<' | '<=' | '>' | '>=') add )?
add     := mul ( ('+' | '-') mul )*
mul     := unary ( ('*' | '/' | '%') unary )*
unary   := ('!' | '-') unary | primary
primary := number | string | bool | color | varRef | '(' expr ')' | ident '(' args ')'
builtins: min max abs round floor ceil clamp len concat toString toNumber contains
```

- Types: number, string, boolean, color. `+` on strings concatenates; mixed-type comparison is a static error flagged in the editor.
- Pure and bounded: no loops or recursion, evaluation capped at 1,000 AST nodes, division by zero yields 0 with a diagnostic. Assignments are type-checked against the variable type at authoring time.
- Computed (derived) variables form a dependency graph; changes recompute in topological order exactly once per event (glitch-free).

### 5.5 Smart animate algorithm

```
smartAnimate(from, to, tr):
  1. key(layer) = name + parent-chain names (+ mainId for instances); duplicates get an
     order index among same-named siblings
  2. pair layers by key: same parent first, then same name within the same top-level ancestor
  3. for each pair diff animatable properties: box (x, y, w, h from resolved layout),
     rotation, opacity, corner radii, solid fills, gradient stops (same type and count),
     strokes, shadow parameters, text size, colour and spacing, clip, vector paths
     (only when vertex and segment topology match; otherwise crossfade)
  4. unpaired 'from' layers fade out; unpaired 'to' layers fade in
  5. build one track per property { from, to, easing, duration }; sample at eased progress
  6. z-order follows the destination; outgoing unmatched layers sit beneath incoming ones
  7. each tick write sampled values to the transient override layer
```

- Interpolation: numbers lerp; colours lerp in sRGB (Oklab option); rotation uses the plain angle difference; layouts animate their **resulting boxes**, not their layout inputs.

### 5.6 Easing and spring solver

- **Cubic bezier** `(x1, y1, x2, y2)`: solve `x(s) = progress` for the curve parameter `s` with 4 Newton-Raphson iterations and a bisection fallback, then return `y(s)`. Presets: ease in `(0.42, 0, 1, 1)`, ease out `(0, 0, 0.58, 1)`, ease in-out `(0.42, 0, 0.58, 1)`; back variants use overshooting control points (for example ease out back near `(0.34, 1.56, 0.64, 1)`).
- **Spring** with mass `m`, stiffness `k`, damping `c`: `w0 = sqrt(k/m)`, `zeta = c / (2*sqrt(k*m))`, normalised target 1, initial velocity `v0`.
  - Under-damped (`zeta < 1`), `wd = w0*sqrt(1-zeta^2)`: `x(t) = 1 - e^(-zeta*w0*t) * ( cos(wd*t) + ((zeta*w0 - v0)/wd) * sin(wd*t) )`.
  - Critically damped (`zeta = 1`): `x(t) = 1 - e^(-w0*t) * ( 1 + (w0 - v0)*t )`.
  - Over-damped (`zeta > 1`): `r1,2 = -w0*(zeta -/+ sqrt(zeta^2-1))`, `x(t) = 1 + A*e^(r1*t) + B*e^(r2*t)` with `A = (v0 + r2)/(r1 - r2)`, `B = -1 - A`.
  - Duration is derived, not authored: precompute at 1/240 s steps the first time after which `abs(x-1) < 0.001` and `abs(x') < 0.001`.
  - Presets (match Figma): Gentle `k=100, c=15, m=1`; Quick `k=300, c=20, m=1`; Bouncy `k=600, c=15, m=1`; Slow `k=80, c=20, m=1`.

### 5.7 Gestures and scroll physics

- **Velocity**: least-squares slope over the last 100 ms of pointer samples.
- **Momentum**: exponential decay `v(t) = v0*e^(-t/tau)`, `x(t) = x0 + v0*tau*(1 - e^(-t/tau))`, `tau` about 0.33 s; stop below 0.5 px/s.
- **Overscroll**: rubber band `d(x) = (1 - 1/(x*0.55/dim + 1)) * dim`; on release spring back with a critically damped spring seeded with the release velocity.
- **Nested scroll**: gesture claimed by direction; chaining to the parent at the edge; fixed-position children excluded from the scrolled transform.
- **Fixed timestep** (1/240 s accumulator) for decay and springs; closed-form springs make results exact even when frames are skipped.

### 5.8 Logic layer for near-real-life apps (extensions beyond Figma parity)

- **Data**: mock data sources (JSON fixtures) and a `fetchMock` action with configurable latency and error rate, writing results into list and object variables.
- **Repeaters**: a layer bound to a list variable instantiates one component per item with item bindings, plus filter, sort and paging expressions.
- **Forms**: input components as state machines (idle, focus, filled, error, disabled) with validation expressions and derived error variables.
- **Navigation**: stack and tab navigators with a per-tab back stack, route parameters and guards (conditions on navigate).
- **State machines**: a visual statechart per component or screen compiles to ordinary interactions, so one runtime executes everything.
- **Environment variables**: orientation, online/offline, keyboard open, theme, locale, to test responsive and error states.
- **Persistence**: sandboxed key-value store per prototype session, reset on restart.
- **Scenarios to ship as templates**: login with validation, e-commerce cart with quantity maths, todo add/complete/filter, multi-step onboarding, live search filter, dark-mode toggle via mode switching, toast overlay with auto-dismiss, pull to refresh, carousel with snap and indicators, form wizard, chat with mock streaming.

### 5.9 Authoring, debugging and validation

- **Debugger**: event log (trigger, matched interaction, condition result, actions run), variable inspector with live edit, transition timeline scrubber, step mode, breakpoints on interactions.
- **Validator** (runs on every change set): unreachable frames, dead ends with no back path, unset or mistyped variables, overlays with no close path, after-delay loops with no exit, drag arbitration conflicts.
- **Hot reload**: design change sets patch the runtime without resetting state when node ids persist.
- **Determinism**: event traces can be recorded and replayed (virtual clock) for regression tests; unit tests cover expression evaluation, spring solver versus numeric integration, smart animate pairing fixtures, and navigation stack properties.

## 6. Embedded AI engine (Ollama, qwen3.8:27b)

### 6.1 Model facts and setup

- Model: Qwen3.8 27B, a dense 27B-parameter model under Apache 2.0, weights released 14 August 2026. Ollama tag `qwen3.8:27b`: default Q4\_K\_M build of about 18 GB (weights plus a vision projector), context up to 262K, capability tags vision, tools and thinking, with thinking on by default. These figures come from third-party pages reporting the Ollama library listing, so confirm them with `ollama show qwen3.8:27b` after pulling.
- Ollama serves HTTP on `127.0.0.1:11434` (`/api/chat`, `/api/generate`, `/api/tags`, `/api/ps`). The app detects or launches it, checks `/api/tags`, offers `ollama pull qwen3.8:27b` with progress, then runs a health and calibration check. Keep the port bound to loopback.
- Recommended server settings: `OLLAMA_NUM_PARALLEL=1`, `OLLAMA_MAX_LOADED_MODELS=1`, `OLLAMA_KEEP_ALIVE=30m`, `OLLAMA_FLASH_ATTENTION=1`, `OLLAMA_KV_CACHE_TYPE=q8_0` (requires flash attention).
- Per-request defaults: `options.num_ctx = 8192` (raise only when needed, check `ollama ps`), `temperature = 0.2`, an `num_predict` cap per task tier, and `think: false` for interactive tasks.

### 6.2 Speed expectations on the current machine (estimates, measure them)

- On CPU, generation is memory-bandwidth bound. Dual-channel DDR4-2400 peaks near 38 GB/s and each token reads roughly 17 GB of weights, so the ceiling is about 2 tokens/s and a realistic range is 1 to 1.5. Prompt processing is compute-bound on 8 cores and may run at roughly 5 to 15 tokens/s, so a cold 2,000-token prompt can take minutes.
- `ollama run qwen3.8:27b --verbose` prints prompt and generation rates. The app repeats this as a calibration step and derives every budget and ETA from measured numbers, not from these estimates.
- Practical scale at about 1.2 tokens/s: a 40-token edit takes about 35 s, a 300-token section about 4 minutes, so generating a whole screen directly is a background job, not an interactive one.

**Design rules that follow**

1. Every AI job is asynchronous, cancellable, shows progress and an ETA, and never blocks the canvas.
2. Keep prompts small and **prefix-stable**: the system prompt plus op schema (about 800 tokens) never changes, so Ollama reuses its KV cache for the prefix while the model stays loaded. Variable content goes last.
3. Make output **compact**: a terse line-based op language (about 8 to 15 tokens per node) and short codes from a catalogue, not verbose JSON.
4. Decompose: outline first (small), then one section per request, applying each result as it lands.
5. Let deterministic code do the heavy lifting (templates, auto layout, pattern library, token resolution); the model chooses and parameterises.
6. Thinking off for interactive work; thinking on only for explicit deep jobs that run in the background.
7. Keep one provider interface with a **fast tier** (a smaller local model you choose, or a cloud agent) and a **deep tier** (qwen3.8:27b, offline). qwen3.8:27b stays the embedded default as requested; this is a latency trade-off, and the same code gets far faster on Apple Silicon (MLX build) or a machine with a 24 GB GPU.

### 6.3 Provider abstraction

```ts
interface AIProvider {
  id: string; kind: 'local' | 'cloud';
  capabilities: { stream: boolean; schemaOutput: boolean; tools: boolean; vision: boolean; maxContext: number };
  health(): Promise<{ ok: boolean; model?: string; tokensPerSec?: number }>;
  chat(req: ChatRequest, signal: AbortSignal): AsyncIterable<Chunk>;
}
// OllamaProvider: POST /api/chat { model, messages, stream: true, think: false,
//   format?: schema, options: { num_ctx, temperature, num_predict }, keep_alive }
class Router { pick(task: AITask): AIProvider }  // by tier, offline flag, privacy flag, measured latency, with fallback chain
```

The Ollama provider is an adapter registered in the existing provider registry; existing agent and tool contracts stay untouched, and cloud agents (Claude, Google, OpenAI or others) plug in through the same interface.

### 6.4 Context assembly (token budgets)

1. **Static prefix** (at most 900 tokens): role, rules, op language grammar, tier instructions. Never edited at runtime.
2. **Catalogue** (about 400 tokens): design tokens (colour, type, spacing, radius, shadow) and components (id, name, props) as short codes, filtered by relevance (name match, BM25 or optional embeddings).
3. **Selection digest** (about 300 tokens): selected subtree to depth 2, listing only non-default properties.
4. **Instruction**: the user's request.

- The budget manager estimates tokens (about 3.5 characters each) and drops lower-priority content first. File text such as layer names and copy is inserted inside a delimited data block.

### 6.5 Output protocol: line ops, streamed and applied progressively

```
frame F1 'Login' 390x844 parent=page layout=V gap=16 pad=24 fill=$bg
text  T1 'Welcome back' parent=F1 style=$h1
inst  C1 comp=#btn.primary parent=F1 label='Sign in'
set   F1.radius 16
bind  T1.fill var=color.text.primary
ix    C1 click nav F2 smart 300 easeOut
```

- Verbs: `frame rect ellipse text inst group set bind style layout constraint move del ix var mode note`. One op per line; local ids (F1, T1) map to real node ids at commit.
- **Streaming applier**: split the token stream on newlines; parse and validate each complete line; apply valid ops to a **ghost transaction** (a transient overlay drawn at reduced opacity), so the user watches the design appear while the model writes. Accept commits everything as one undo step; reject discards it.
- Invalid lines are skipped and logged; after the stream ends one repair request (with the parser errors) is allowed if more than a threshold of lines failed.
- Where structure matters more than token cost (prototype graphs), use Ollama's JSON-schema `format` for constrained output instead of the line language.

### 6.6 Tokens, components and wireframe fallback

- Every colour, text style, spacing, radius and component reference must be a `$token` or `#component` present in the catalogue.
- If a needed token or component is missing, the engine substitutes a **wireframe placeholder** (neutral box, dashed outline, note text `component not available: <name>`) and lists it in a job report. The model never invents raw hex values or sizes in standard mode.

### 6.7 Task tiers

- **T0 deterministic** (no model): rename, align, tidy up, contrast check, suggested auto layout from geometry heuristics.
- **T1 micro edit** (at most 40 output tokens): set a property, swap a variant, rename layers.
- **T2 section generation** (at most 300 tokens): one card, list, form or header from catalogue components.
- **T3 screen or flow generation**: outline (at most 80 tokens), then one T2 per section, applied sequentially.
- **T4 prototype wiring** (at most 200 tokens): interactions between selected frames, followed by the validator.
- **T5 read-only**: explain a lint warning or a prototype trace.
- **Vision** (screenshot to design) is off by default on this hardware and available in the deep tier.

### 6.8 AI inside the prototype engine

- **Flow synthesis**: input is the list of frames with names and roles plus a goal; output is interaction ops and variables; the validator (5.9) checks reachability, dead ends and types before the ghost preview is offered.
- **Logic authoring**: a natural-language rule (for example, disable the button until the email is valid) becomes an expression in the grammar of 5.4; it is parsed and type-checked before acceptance, and the parsed form is shown.
- **Debug assistant**: deterministic analysis first (validator plus trace diff against the expected path); the model only phrases and ranks hypotheses from the last 20 events and variable values.
- **Test generation**: produce replayable event traces from a described scenario.

### 6.9 Safety, validation and privacy

- Model output is untrusted: whitelisted verbs, schema validation, numeric bounds (sizes up to 20,000, at most 300 nodes per job, depth up to 12). No shader or code generation unless a sandboxed code mode is enabled with a compile budget.
- Prompt-injection resistance: file text is data inside a delimited block; ops can only touch the document; the model gets no network or filesystem tools.
- Dry-run on a cloned subtree, check invariants (no cycles, valid ids, valid references), then commit; automatic rollback on failure.
- Local-first: cloud providers only when enabled, with a visible indicator, and a per-file privacy flag that blocks cloud use. Job metadata (tokens per second, latency, accepted or rejected) is logged locally for calibration; content is not logged by default.

### 6.10 Job scheduler

```
priority: interactive (T1) > generation (T2, T3, T4) > background (deep, embeddings)
one in-flight request (NUM_PARALLEL=1); cancel with AbortController, which closes the stream
if the selection changes while a job runs: mark the ghost stale and offer a re-run
model warm-up ping on app start (keep_alive); unload when idle under memory pressure
UI: job chip with ETA = remaining tokens / measured tokens-per-second; accept / reject bar; history
```

## 7. Module contracts and implementation plan

```ts
interface Engine { apply(cmds: Command[]): ChangeSet; subscribe(fn: (c: ChangeSet) => void): () => void;
                   hitTest(p: Point, opts?: HitOpts): NodeId | null; snapshot(): DisplayList; }
interface Renderer { setCamera(c: Camera): void; submit(dl: DisplayList, invalid: Rect[]): void;
                     setOverlay(o: Overlay): void; readPixels(r: Rect): ImageData; }
interface ProtoRuntime { load(g: PrototypeGraph, doc: Doc): void; dispatch(e: InputEvent): void;
                         tick(dtMs: number): FrameOverrides; state(): RuntimeState; reset(flow?: string): void; }
interface AIEngine { run(job: AIJob): AsyncIterable<GhostOp>; accept(id: string): void; reject(id: string): void;
                     calibrate(): Promise<Calibration>; }
```

**Modules**: `doc-core` (nodes, commands, transactions), `resolve` (styles, variables, components), `layout`, `text`, `geometry`, `spatial` (R-tree, snapping), `render-rhi`, `render-scene` (display list, tiles, effects), `proto-expr`, `proto-runtime`, `proto-anim` (easing, springs, smart animate, scroll), `ai-router`, `ai-ops` (parser, ghost applier, catalogue).

**Milestones and acceptance**

1. **M1 Core and canvas**: doc-core with undo/redo, R-tree, WebGL2 rect and text rendering, camera. Accept: 10k rectangles pan and zoom at 60 fps.
2. **M2 Layout and text**: auto layout, constraints, text engine, tile cache. Accept: 2k-node relayout under 8 ms; golden tests for wrap and Hug.
3. **M3 Resolve**: styles, variables, modes, components, instances, overrides. Accept: mode switch on a 5k-instance page under 50 ms.
4. **M4 Geometry and effects**: vector networks, booleans, strokes, shadows, blur, masks. Accept: boolean and stroke golden tests pass; effect governor degrades gracefully.
5. **M5 Prototype base**: navigation, overlays, triggers, variables, expressions, validator. Accept: login, cart and onboarding scenarios run from templates.
6. **M6 Motion**: smart animate, springs, scroll physics, snapshot transitions. Accept: spring solver within 1e-3 of numeric integration; 60 fps transitions.
7. **M7 AI core**: Ollama provider, calibration, op language, ghost applier, catalogue retrieval. Accept: a T2 section appears progressively and commits as one undo step; canvas stays at 60 fps during generation.
8. **M8 AI for prototypes**: flow synthesis, logic authoring, debug assistant, test generation. Accept: AI-wired flows pass the validator.
9. **M9 Hardening**: adaptive quality tuning, multiplayer, export. Accept: all release benchmarks in 4.9 pass on the Intel UHD 630 machine at governor level 1 or better.

## 8. Assumptions and open decisions

- Platform assumed to be TypeScript with a Rust or C++ WASM core; a native build would swap the RHI for Skia or Metal and keep every other module.
- qwen3.8:27b details come from third-party reports of the Ollama listing, and the speed numbers in 6.2 are estimates. Measure with the calibration step before fixing UX budgets.
- Decisions to make: which model fills the fast tier; whether vision is enabled; line op language versus JSON everywhere; multiplayer scope for the first release; shader authoring by AI (sandbox policy); font licensing and bundling.
