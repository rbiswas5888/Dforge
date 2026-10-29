# DesignForge AI — Vector Editing and Color Management Requirements

**Document type:** Product requirements + interaction specification + IDE implementation contract  
**Version:** 1.0  
**Status:** Implementation reference  
**Product area:** DesignForge AI vector editor, canvas interactions, appearance inspector, color picker, design tokens and color libraries

---

## 0. Instructions for the IDE AI Agent — Read First

This document defines the target requirements for extending the existing DesignForge AI application. It is **not** permission to rewrite the app, replace its architecture, redesign unrelated screens, or remove functionality.

### 0.1 Non-negotiable preservation contract

1. **Preserve all existing working functionality.** Existing tools, navigation, routes, canvas behavior, data, API contracts, keyboard shortcuts, design-system components, styling conventions and integrations must continue working unless a specific change is required by an item in this document.
2. **Audit before editing.** Inspect the codebase and identify the existing canvas/rendering engine, document model, selection state, path/shape abstractions, property panels, color handling, state management, persistence, undo/redo, keyboard dispatch, component library and tests before implementing anything.
3. **Extend instead of replace.** Prefer extending existing modules and abstractions. Do not build a second independent vector engine or color system when an existing one can be enhanced safely.
4. **Do not perform broad refactors as a side effect.** Do not rename or reorganize unrelated modules, change frameworks, replace state management, migrate UI libraries, restyle unrelated components, or modify unrelated user flows merely to make implementation easier.
5. **Maintain current visual design.** Use the application's existing layout, spacing, typography, colors, iconography, responsive behavior and component patterns. New controls must look native to DesignForge AI. Functional inspiration from Illustrator and Figma does not mean copying their exact UI or branding.
6. **Do not regress current behavior.** Before changing an interaction, capture its current behavior and add or update regression tests. When a requirement conflicts with existing behavior, prefer a backward-compatible extension and document the conflict rather than silently removing functionality.
7. **No fake functionality.** Do not add buttons that do nothing, mock state that does not persist when persistence is expected, decorative controls that appear functional, or success messages without an actual successful operation.
8. **No invented assumptions.** If a requirement cannot be mapped confidently to the current architecture, inspect nearby code and tests first. Choose the smallest compatible implementation. Record unresolved limitations clearly in the final implementation report.
9. **Preserve user data.** Schema changes must be backward-compatible or include safe migrations and defaults. Never discard existing document nodes, vector properties, saved colors, libraries, tokens, styles, or unsupported imported data without explicit handling.
10. **Keep changes scoped.** Implement only the vector and color capabilities in this document and any necessary shared infrastructure. Do not alter unrelated DesignForge AI features.
11. **Do not claim completion without verification.** Run the available type checks, linting, unit tests, integration tests and build. Add targeted tests for new behaviors. Report commands run, results, known gaps and any functionality that could not be tested.
12. **Keep the product usable at every step.** Prefer incremental, reviewable changes. Avoid leaving the branch in a state where the application cannot run or existing workflows are broken.

### 0.2 Required workflow

Follow this sequence in the existing repository:

**Phase A — Inspect:** inventory modules, identify current behavior and tests, run the app if possible, and locate the existing vector and color pathways. Do not begin with a rewrite.

**Phase B — Map requirements:** create a traceability table with columns `Requirement ID`, `Current implementation`, `Gap`, `Proposed smallest change`, `Dependencies`, and `Regression tests`. Mark each requirement as `Exists`, `Partial`, `Missing`, `Blocked` or `Not applicable`.

**Phase C — Plan implementation:** group changes into small, dependency-aware tasks. Reuse current components and data models. If an existing capability already meets a requirement, preserve it rather than reimplement it.

**Phase D — Implement incrementally:** build the foundational data/interaction changes first, followed by UI controls and advanced capabilities. Keep document state, canvas rendering and inspector state consistent.

**Phase E — Validate:** run regression and feature tests. Manually check pointer interactions, keyboard modifiers, canvas rendering, undo/redo, persistence and representative imports/exports where those features already exist.

**Phase F — Report:** list implemented requirements, touched files, tests run, remaining gaps, migration notes, and any behavior that remains intentionally unchanged.

Do not stop after writing a plan if the repository gives enough information to proceed. Do not ask the user to repeat information already present in this document. If an implementation is blocked by missing infrastructure, implement the safe, useful subset and report the blocker explicitly.

### 0.3 Requirement interpretation rules

- `MUST` means required for the applicable release scope.
- `SHOULD` means expected unless the repository architecture or a documented constraint makes it disproportionate; report any exception.
- `MAY` means optional or roadmap functionality.
- P0/P1/P2/P3 are priority bands, not permission to delete existing functionality.
- Advanced tools do not need to ship in the first milestone, but the architecture should not make them unnecessarily difficult to add.
- “Illustrator-level” means comparable functional breadth where explicitly listed; it does not mean copying proprietary code or reproducing every minor implementation detail.
- “Figma-inspired” refers to workflow patterns such as an anchored color popover, quick value entry, reusable color variables, libraries and selection-color summaries. Maintain DesignForge AI's own visual identity.

---

## 1. Objective and Scope

Deliver a reliable vector-editing and color-management system in which designers can create, select, draw, edit, style, transform, combine, organize and export editable vector artwork. The color experience must support both quick visual picking and precise, design-system-aware editing.

The complete workflow should let a designer create a shape, edit its geometry, combine it with other shapes, apply fills and strokes, use gradients or brushes, bind colors to reusable tokens, change a semantic theme, and export the result without unintended loss of editability.

### In scope

- Vector object model and geometry
- Selection, hit testing and direct manipulation
- Path drawing and anchor editing
- Shape tools and editable/live parameters
- Transformations and reshaping
- Boolean operations, cutting and clipping
- Fill, stroke and appearance stacks
- Color picker, sampling, palettes, styles, variables and gradients
- Selection colors and bulk recoloring
- Layers, groups, symbols, patterns and artboards
- Typography-related vector interactions
- Navigation, precision and snapping
- Accessibility, undo/redo, performance and reliability
- Import/export behavior relevant to vector artwork
- Optional AI-assisted vector creation and recoloring

### Out of scope unless already present or separately requested

- Rewriting the entire DesignForge AI application
- Replacing existing frameworks, routing or state-management libraries
- Replacing the established design system
- Changing unrelated prototype, AI-agent, collaboration or project-management workflows
- Copying Adobe or Figma branding, proprietary assets, icons or code
- Implementing advanced tools by displaying nonfunctional controls

---

## 2. Core Product Principles

1. **One editable document model:** all vector tools must operate on the same source of truth for document geometry, style, hierarchy and transforms.
2. **Non-destructive by default:** preserve source geometry when an effect, mask, live shape or editable operation can represent the result without flattening it.
3. **Predictable interactions:** pointer targets, shortcuts, modifiers, cursor states and cancellation behavior should be consistent across tools.
4. **Precision and approachability:** direct manipulation and numeric property entry must complement each other.
5. **Immediate, reversible feedback:** preview operations during interaction, commit at a clear point and support undo/redo.
6. **Design-system awareness:** colors, styles and variables should remain linked when the user intends them to be linked.
7. **Transparent AI assistance:** AI recommendations must show what will change, why, and which objects/tokens are affected; never apply broad changes silently.
8. **Accessible states:** communicate selection and validation through more than color alone; support keyboard access and understandable labels.
9. **Format honesty:** warn when an import/export target cannot preserve a particular feature or editable relationship.
10. **Performance under complexity:** frequent pointer movement must not cause unnecessary full-document work.

---

## 3. Functional Architecture and Shared Infrastructure

The implementation should map onto the current architecture rather than force a prescribed framework. The following logical responsibilities must nevertheless be covered.

### 3.1 Document and object model

Every editable object should have a stable ID, a type, geometry or content, a transform, appearance properties, visibility/locking state and an explicit parent/hierarchy relationship where applicable.

The model must support, as relevant:

- Paths and path anchors
- Open and closed paths
- Straight line and cubic Bézier segments
- Live shapes with editable construction parameters
- Groups and nested groups
- Compound paths and fill rules
- Text objects and outlined text
- Image/placed assets where supported
- Symbols and symbol instances
- Clipping relationships and masks
- Ordered fill and stroke/appearance stacks
- Gradients and gradient stops
- Brushes and brush-specific settings
- Style and variable references
- Artboard and document coordinate systems
- Object visibility, lock state and stacking order

Do not force all objects into one generic path representation if doing so loses editable properties. Live rectangles, stars, text, gradient geometry and other structured objects should remain structured until the user explicitly converts or expands them.

### 3.2 Coordinate systems and rendering

- Store document geometry independently of zoom and screen pixels.
- Keep document-space, viewport-space and device-pixel conversions explicit.
- Use stable transform semantics and avoid repeated lossy rounding during pointer movement.
- Separate source geometry from rendered appearance.
- Perform hit testing in screen space with usable tolerances at different zoom levels.
- Use viewport-aware/incremental rendering where supported by the current renderer.
- Keep guides, handles, bounding boxes and cursor overlays separate from document artwork where the existing rendering architecture allows it.

### 3.3 Editing transactions and history

- Every completed user action that changes document state must create a coherent undoable transaction.
- Pointer-move previews should not create one history entry per frame.
- Cancellation should restore the pre-operation state.
- Undo/redo must restore geometry, style, opacity, variable bindings, hierarchy and selection where that is part of the current history model.
- Batch operations such as recoloring a selection or applying a boolean operation should normally create one sensible history step, not hundreds of unrelated entries.
- AI-applied edits must be reversible and attributable to the accepted operation.

### 3.4 Selection and hit testing

- Distinguish whole-object selection from anchor/segment selection.
- Identify overlapping targets predictably and provide a path to select obscured objects.
- Respect hidden and locked layers.
- Make modifier behavior consistent and discoverable.
- Keep selection state synchronized across canvas, layers panel and properties inspector.

### 3.5 Persistence and migrations

- Preserve existing saved document compatibility.
- Add defaults for newly introduced properties so older documents continue to load.
- Version serialized data when appropriate.
- Never discard unknown or unsupported source data silently during import/export.
- If a migration is required, make it reversible where practical and test with representative older documents.

---

## 4. Vector Tool Inventory

This is the capability inventory the application must account for. Priority determines sequencing, not permission to remove an existing tool.

| Tool family | Tools/capabilities | Main interaction |
|---|---|---|
| Selection | Selection, Direct Selection, Group Selection, Lasso, Magic Wand/attribute selection | Click, marquee, point selection, attribute-based selection |
| Path drawing | Pen, Curvature, Pencil, Add Anchor, Delete Anchor, Anchor Point conversion, Smooth, Join, Path Eraser | Click, click-drag, add/remove points, adjust handles, freehand drawing |
| Shape creation | Rectangle, Rounded Rectangle, Ellipse, Polygon, Star, Line, Arc, Spiral, Rectangular Grid, Polar Grid, Flare where supported | Drag, constrain proportions, edit parameters |
| Paint and color | Paintbrush, Blob Brush, Gradient, Mesh, Live Paint, Eyedropper | Draw brush strokes, paint regions, edit stops, sample appearance |
| Transformation | Move, Rotate, Reflect, Scale, Shear, Free Transform, Reshape | Drag handles, pivot manipulation, numeric transforms |
| Shape modification | Shape Builder, boolean/Pathfinder operations, Eraser, Scissors, Knife, Width | Merge, subtract, split, trim, erase, vary stroke width |
| Appearance/effects | Brushes, Patterns, Opacity, Blend, Warp, Twirl, Pucker, Bloat, Scallop, Crystallize, Wrinkle, Puppet Warp, envelope-style distortion where supported | Apply/edit appearance or deform contours |
| Typography | Point Type, Area Type, Type on a Path, Vertical Type, Touch Type, Outline Conversion | Text entry, flow, path text, character manipulation |
| Organization | Layers, Groups, Symbols, Repeats/Patterns, Arrange, Align, Distribute | Organize, reorder, duplicate and reuse |
| Specialized drawing | Perspective Grid/Selection, Graphs, Symbol tools, Objects on Path, Measurement/Dimension where supported | Perspective construction, charts, repeated objects and measurements |
| Navigation/precision | Hand, Zoom, Rotate View, Rulers, Grids, Guides, Snapping, Measurement | Pan, zoom, constrain and measure |
| Import/output | Image Trace, Clipping Masks, Artboards, Slices, Import/Export | Place assets, vectorize raster art, define export regions |
| AI assistance | Prompt-to-vector, path cleanup, palette generation, recoloring, vector pattern generation | Prompt, preview, refine, approve or reject |

The agent must first map this inventory against the current app. Do not mark a tool implemented merely because a button or icon is visible; the tool must perform its advertised operation.

---

## 5. Selection and Object Interaction Requirements

### 5.1 Functional requirements

| ID | Requirement | Expected behavior |
|---|---|---|
| SEL-001 | Object selection | Click selects an object and exposes its bounds/available contextual controls. |
| SEL-002 | Multi-selection | Modifier-click and selection marquee add/remove objects according to a consistent rule. |
| SEL-003 | Direct selection | Select individual anchors, handles and segments without selecting unrelated geometry. |
| SEL-004 | Group selection | Enter/select nested children without repeatedly destroying groups. |
| SEL-005 | Selection cycling | Reach overlapping/covered objects using an intentional cycling method or hierarchy panel. |
| SEL-006 | Attribute selection | Find/select objects sharing fill, stroke, opacity, object type, style or appearance when supported. |
| SEL-007 | Lasso | Select points or objects enclosed by a freeform boundary. |
| SEL-008 | Marquee | Select objects according to a consistent documented containment/intersection rule. |
| SEL-009 | Feedback | Clearly distinguish selected objects, anchors, handles, segments and mixed states. |
| SEL-010 | Lock/visibility | Prevent accidental canvas selection of locked/hidden content and preserve access through hierarchy controls where appropriate. |
| SEL-011 | Layer synchronization | Keep selection consistent between canvas, layers and inspector. |
| SEL-012 | Keyboard selection | Support focusable selection and predictable modifier behavior. |

### 5.2 Expected interactions

- **Click object:** selects the whole object. Clicking it again must not unexpectedly jump to an internal anchor.
- **Drag object:** moves it with live preview, distances, snapping and alignment guides. Commit on pointer release.
- **Select several objects:** preserves/modifies selection according to the active modifier; additions/removals are visually clear.
- **Select anchor:** highlights the active anchor, its applicable handles and connected segments.
- **Select overlapping artwork:** prioritize the actual hit target; provide clear visual feedback and an alternate route to the obscured item.
- **Click empty canvas:** follows the app's existing deselection rule; do not change that rule without a regression-tested reason.

Hit testing must distinguish clicking an object's interior, stroke, anchor, handle and transform control. Use appropriate screen-space hit tolerances that remain usable at different zoom factors.

---

## 6. Path Creation and Anchor Editing

### 6.1 Pen tool

The Pen tool must:

- Create a new path from anchor points.
- Create straight segments by clicking successive positions.
- Create curved segments by dragging to establish direction handles.
- Support straight and curved segments within the same path.
- Close a path by connecting to its starting anchor.
- Continue an existing open path from a suitable endpoint.
- Support corner, smooth and independent-handle configurations.
- Add or remove anchors during editing.
- Finish an open path without accidentally closing it.
- Cancel unfinished work without leaving malformed or orphaned geometry.

**Expected workflow:** activate Pen; place the first anchor; click to create straight segments or drag to create curve handles; continue the path; show a closure cue when hovering over the start point; close deliberately or finish open; then refine using Direct Selection.

### 6.2 Anchor and Bézier editing

| ID | Feature | Expected behavior |
|---|---|---|
| PATH-001 | Add anchor | Insert a point into an existing path while preserving adjacent shape as closely as practical. |
| PATH-002 | Delete anchor | Remove the selected anchor and reconstruct adjacent segments without deleting the rest of the path. |
| PATH-003 | Convert corner/smooth | Change the point's continuity/handle behavior. |
| PATH-004 | Edit handles | Drag direction handles to alter tangent and curve curvature. |
| PATH-005 | Independent handles | Change one side's handle without forcing the opposite side to mirror it. |
| PATH-006 | Move point | Move selected anchors and update adjacent segments. |
| PATH-007 | Move segment | Reshape the segment between anchors while keeping unrelated segments stable. |
| PATH-008 | Join paths | Join eligible endpoints and support a defined corner/smooth result. |
| PATH-009 | Break/split path | Split at a valid anchor or segment when the operation supports it. |
| PATH-010 | Close path | Connect endpoints and expose a valid closed contour/fill area. |
| PATH-011 | Simplify path | Reduce unnecessary points while maintaining an acceptable silhouette/tolerance. |
| PATH-012 | Reverse path | Reverse path direction for directional brushes, text-on-path and compatible operations. |
| PATH-013 | Smooth tool | Smooth path irregularities without unexpectedly changing topology. |
| PATH-014 | Path eraser | Remove targeted portions of paths when supported. |

### 6.3 Curvature, Pencil and freehand drawing

- Curvature tool: build and refine curves through point placement and smooth interpolation.
- Pencil tool: draw freehand paths with configurable smoothing/fidelity.
- Smooth tool: brush over existing geometry to reduce jitter.
- Join tool: join eligible open paths or endpoints.
- Brush-based drawing: create paths using a selected brush appearance.
- All such tools must provide pointer tracking, cancellation, undo and clear cursor/preview states.

### 6.4 Path interaction rules

- Hovering near an anchor must not mutate path topology.
- The active point and handles must be obvious.
- Distinguish a point from its handle and adjacent segment hit zones.
- When targets overlap, highlight the intended target before committing the edit where practical.
- Invalid operations must fail safely and leave the document unchanged.

---

## 7. Shape Tools and Live Geometry

Support the following shape types to the extent applicable to the existing editor. If a type already exists, preserve its current operation and extend it only where needed.

| Shape/tool | Required capabilities |
|---|---|
| Rectangle | Width, height, position, fill, stroke and corner controls. |
| Rounded rectangle | Uniform or independent corner radii subject to geometric constraints. |
| Ellipse | Width, height, circle constraint, and arc/pie editing where implemented. |
| Polygon | Side count, size, rotation and regularity controls. |
| Star | Point count, inner radius, outer radius and rotation. |
| Line | Length, angle, endpoints and stroke. |
| Arc | Radius, curvature, angle and endpoints. |
| Spiral | Radius, turns, direction and spacing where supported. |
| Rectangular grid | Rows, columns, subdivisions and spacing. |
| Polar grid | Concentric divisions and radial segments. |
| Flare | Editable center, rays, rings and appearance if the tool is supported. |
| Freeform shape | Arbitrary shape from Pen, Pencil or freehand tools. |

### 7.1 Creation interactions

Every applicable shape tool should support:

- Click-and-drag creation.
- Constrained proportions (for example, square/circle) using the app's consistent modifier convention.
- Center-out creation using the appropriate modifier where supported.
- Live dimension feedback during drawing.
- Exact numeric width/height/position entry.
- Repositioning during creation where supported.
- Post-creation parameter editing in the Properties panel.
- Transformation without automatic conversion to a generic path.
- Explicit conversion/expansion when the user requests ordinary path geometry.

**Live shape invariant:** a rounded rectangle remains a rounded rectangle with editable corner parameters until intentionally converted. Similarly, stars and polygons retain their meaningful construction parameters while possible.

---

## 8. Transformations and Reshaping

### 8.1 Standard transformations

| ID | Operation | Expected behavior |
|---|---|---|
| XFM-001 | Move | Drag or set exact X/Y coordinates. |
| XFM-002 | Resize | Drag bounds or enter exact dimensions. |
| XFM-003 | Rotate | Use rotation control or numeric angle. |
| XFM-004 | Reflect | Flip around a selected/configurable reference axis. |
| XFM-005 | Scale | Uniformly or independently scale horizontally/vertically. |
| XFM-006 | Shear | Slant geometry by angle or drag. |
| XFM-007 | Free Transform | Combine supported transformations/distortions. |
| XFM-008 | Duplicate | Duplicate through explicit commands, shortcuts or existing drag-modifier behavior. |
| XFM-009 | Repeat | Repeat objects/arrangements with editable spacing and orientation where supported. |
| XFM-010 | Reshape | Adjust parts of a path while maintaining the surrounding geometry as far as practical. |

### 8.2 Bounding box and precision

- Separate hit zones for edges, corners, rotation controls and applicable skew/distortion controls.
- Edge handles resize one dimension; corner handles follow the established proportional/free-scale modifier model.
- Support a configurable transform reference point/pivot.
- Support numeric width, height, angle and position.
- Support transformation around an anchor, cursor or custom pivot where applicable.
- Support horizontal/vertical reflection.
- Distinguish transformations of geometry from transformations of appearance where those semantics exist.
- Show live preview and correct cursors.
- Avoid unintended distortion when a modifier is released or the pointer is cancelled.

### 8.3 Advanced reshaping

Where implemented, advanced tools should have configurable and editable effects:

- Width tool: add variable-width points along a stroke and shape the width profile/taper.
- Warp/Twirl/Pucker/Bloat: reshape with configurable brush size, intensity and relevant parameters.
- Scallop/Crystallize/Wrinkle: apply controlled contour distortions.
- Puppet Warp: add pins and bend artwork while preserving unaffected regions as much as possible.
- Envelope-style distortion: deform with editable enclosing geometry and provide edit/release behavior.

Advanced deformations must preserve the source or have reliable undo/release behavior. Do not expose nonfunctional tool icons merely to imply parity.

---

## 9. Boolean Operations, Shape Builder and Cutting

### 9.1 Required operations

| Operation | Result |
|---|---|
| Union | Combine overlapping areas into a single silhouette. |
| Subtract | Remove the cutter's area from the target according to defined stacking/selection rules. |
| Intersect | Keep only the common overlap. |
| Exclude | Remove shared overlap and keep non-overlapping areas. |
| Divide | Split overlap regions into separate vector regions. |
| Trim | Remove covered areas according to a documented stacking rule. |
| Merge | Combine compatible adjacent regions. |
| Crop | Keep the permitted region within a boundary, according to the supported semantics. |
| Outline stroke | Convert a stroke to filled vector geometry. |
| Expand appearance | Convert supported appearance attributes into editable geometry. |
| Compound path | Treat multiple contours as one path, including holes under the chosen fill rule. |
| Clipping mask | Hide content outside a vector boundary without deleting hidden artwork. |

### 9.2 Shape Builder interaction

1. Select two or more eligible shapes.
2. Activate Shape Builder.
3. Hover over an eligible region and highlight the region that will be affected.
4. Drag across regions to merge.
5. Use the documented remove action to remove regions.
6. Preview the result before committing where feasible.
7. Commit as editable geometry and create an undoable transaction.

### 9.3 Cutting tools

- Scissors: split a path at a valid point.
- Knife: cut artwork along a freeform line.
- Eraser: remove geometry or regions according to the selected mode.
- Path Eraser: remove only the targeted path portion where supported.

Clearly communicate whether the operation splits a stroke, changes an object, removes fill regions or creates separate closed paths.

### 9.4 Destructive versus non-destructive behavior

Favor reversible operations where practical. Provide editable and committed variants where the current architecture supports them. Releasing or moving a clipping mask must reveal masked content rather than permanently delete it. Avoid irreversible conversion unless the user requests it or the target format requires it; warn about material losses.

---

## 10. Appearance System: Fill, Stroke, Brushes and Effects

### 10.1 Fill and stroke

Each compatible object should support:

- Solid fill, no fill, and supported gradient/pattern/image fills.
- Solid stroke and no stroke.
- Stroke thickness/width, cap, join, miter limit and dash pattern.
- Stroke alignment where supported.
- Independent fill/stroke opacity where the document model supports it.
- Multiple appearance entries for advanced styling.
- Eyedropper sampling of supported color/appearance properties.
- Reusable color swatches, variables and style presets.

### 10.2 Gradients

At minimum, support linear and radial gradients. Support angular and diamond gradients where the renderer/architecture can implement them correctly.

Users must be able to:

- Add, select, move, reorder and remove color stops.
- Edit a stop's color and alpha.
- Change position and gradient angle/geometry.
- Edit gradients directly on canvas using handles.
- Change gradient direction/spread as applicable.
- Reverse a gradient.
- Reuse/synchronize saved gradient styles where implemented.
- Bind eligible stops to color variables.
- Apply gradients to fills and strokes where supported.

Handle coincident stops, transparent stops, very short gradients and multi-object application predictably. Validate values without silently changing the intended appearance.

### 10.3 Gradient mesh

A mesh system, if supported, should allow mesh points/lines, local point movement and local color editing for complex continuous transitions. If the engine cannot implement it safely in the current milestone, report it as a roadmap gap rather than rendering a dummy control.

### 10.4 Brush system

The broad brush architecture should account for:

- Calligraphic brushes: directional/pen-like stroke widths.
- Scatter brushes: repeated objects distributed along a path.
- Art brushes: source artwork stretched along a path.
- Bristle brushes: painterly/bristle-like appearance where technically feasible.
- Pattern brushes: repeating vector elements with configurable sections/tiles.

Users should be able to apply a brush to an existing path, draw a new brush path, edit supported brush options and update affected strokes when its source changes. Unsupported brush types must be clearly identified.

### 10.5 Transparency and visual effects

Support object opacity, supported blend modes, graphic styles and editable visual effects. Keep effects separate from base geometry when the operation is intended to remain editable. Respect stacking order, clipping and masking relationships when rendering.

---

## 11. Typography as Editable Artwork

Where text features exist or are introduced, support:

- Editable point text and area text.
- Text flowing within a suitable closed shape.
- Text along open or closed paths.
- Path position, alignment and direction controls where appropriate.
- Typeface, weight, size, tracking, leading and other existing text properties.
- Individual character transformations through a dedicated interaction where supported.
- Editable text as the default representation.
- Explicit text-to-outline conversion when vector contours are required.

Outlining text must be an intentional operation. Explain that normal text editing will no longer be available after conversion. Preserve text content and font metadata where the current document format permits.

---

## 12. Layers, Groups, Symbols, Patterns and Arrangement

### 12.1 Hierarchy

Support where applicable:

- Group, ungroup and nested groups.
- Add, delete, rename, reorder, hide, lock, duplicate and nest layers/sublayers.
- Move objects between layers.
- Arrange front/back/forward/backward.
- Select children within a group without unnecessary ungrouping.
- Keep clipping/mask relationships intact when reordering.

### 12.2 Alignment and distribution

Provide left/right/top/bottom/center alignment and distribution by centers or gaps. Support alignment to selection, key object and artboard where implemented. Show a clear target/reference mode; do not silently change the alignment basis.

### 12.3 Symbols and repeats

- Create reusable symbols from artwork.
- Create instances connected to a shared source where supported.
- Update instances when the source changes according to the product's symbol model.
- Support symbol placement/manipulation: move, scale, rotate, recolor, transparency and styling where applicable.
- Provide editable source artwork and repeat settings for patterns/repeats where supported.
- Avoid unexpectedly detaching instances or flattening patterns.

---

## 13. Navigation, Measurement and Precision

Required capabilities, as applicable:

- Zoom in/out, fit artwork, focus selection and pan.
- Rotate canvas view without changing object coordinates.
- Rulers and unit-aware coordinates.
- Create, move, lock and remove guides.
- Configurable grids and subdivisions.
- Snap to anchors, intersections, edges, centers, guides and applicable grid points.
- Temporary alignment indicators and distances while moving.
- Measure distance, angle, radius and supported area types.
- Dimension annotations for relevant geometry.
- Optional pixel-aware alignment for screen-oriented artwork.

Distinguish canvas/view rotation from object rotation, snapping from numeric positioning, and document units from screen pixels. Preserve established modifier/shortcut behavior where present.

---

## 14. Advanced and Specialist Capabilities

The following belong in the complete capability inventory; implement according to priority and actual architecture:

| Capability | Requirement |
|---|---|
| Image Trace | Convert a placed raster into editable vector regions with adjustable tracing controls. |
| Perspective Grid | Display/configure perspective planes and vanishing-point controls. |
| Perspective Selection | Position/transform compatible artwork in perspective. |
| Graph tools | Create supported column, stacked column, bar, stacked bar, line, area, scatter, pie, radar and related charts as editable graphs where supported. |
| Symbol tools | Create symbol sets and adjust their layout and appearance. |
| Slice tools | Define, select, move and edit export regions. |
| Objects on Path | Attach/repeat objects along a path and control placement/orientation. |
| Artboards | Create, resize, move, duplicate and manage multiple artboards. |
| Export | Export objects, selections, artboards or regions to supported formats. |
| AI vector generation | Generate actual editable vectors from prompts, not merely raster previews. |

These features must not be marked complete based only on toolbar presence. Where not implementable in the current phase, record the gap and keep the UI honest.

---

## 15. Universal Pointer and Keyboard Interaction Contract

### 15.1 Pointer states

The editor should distinguish at least these states and give clear visual feedback:

- Idle
- Hovering an object/anchor/segment/handle
- Ready to draw
- Drawing/creating geometry
- Dragging/moving
- Transforming
- Editing anchor/handle
- Valid target/operation
- Invalid target/operation
- Preview/committing
- Cancelled/restored

Cursor states, tool previews, hover highlights and handles must be consistent across tools. A pointer passing over a target must not commit an operation.

### 15.2 Keyboard and modifiers

- Single-key shortcuts activate tools when canvas focus permits.
- Modifiers constrain drawing/transforms according to a consistent, discoverable convention.
- Arrow keys nudge objects and adjust compatible numeric values where currently supported.
- Delete/Backspace acts on the current context: object, anchor or segment as applicable.
- Escape cancels the in-progress action or exits the current drawing context without leaving partial geometry.
- Undo/redo restore complete operations.
- Temporary navigation modifiers should return to the previous tool where that is the product's interaction model.
- Shortcuts should be configurable if the current architecture supports it.
- Do not break text-field editing, OS/browser shortcuts or existing app shortcuts.

### 15.3 Contextual inspector

Show relevant properties according to selection:

- Star: point count, inner/outer radius, rotation and appearance.
- Bézier path: anchors, handles, fill, stroke and applicable path options.
- Text: typography controls and text-specific settings.
- Brush stroke: brush and stroke controls.
- Gradient: gradient type, geometry and stops.
- Multi-selection: shared values, mixed states and appropriate bulk actions.

Changing selection must refresh the inspector without overwriting unrelated object values. Mixed values must be shown as mixed/indeterminate rather than choosing an arbitrary value.

---

# PART II — COLOR PICKER AND COLOR MANAGEMENT

## 16. Color System Goals

Implement a professional color workflow inspired by Figma's interaction patterns while preserving DesignForge AI's current design and interaction conventions.

The color system must serve two complementary jobs:

1. **Quick visual editing:** select a swatch, adjust hue/saturation/brightness, alter opacity and sample artwork.
2. **Precise design-system editing:** enter exact values, bind variables, use shared libraries, manage themes, bulk recolor selected objects and retain semantic token relationships.

The color experience should be available for compatible fills, strokes, gradient stops, text, shadows/effects and other color-bearing properties already present in the application.

---

## 17. Color Picker UI and Core Interaction

### 17.1 Opening and closing

- Clicking a Fill or Stroke swatch opens a contextual color popover anchored to that property.
- The popover should open near its trigger and remain within the visible viewport.
- Clicking outside, using Escape or closing the popover follows a consistent existing popover convention.
- Closing the popover must not lose a valid edit already applied to the document.
- Provide a clear route to color resources, variables and saved styles without making the primary picker unnecessarily complex.
- On narrow screens or constrained panels, use the app's established responsive overlay pattern.

### 17.2 Picker contents

At minimum, the picker should account for:

- Current color preview.
- Solid/gradient/pattern/image fill-type selection where applicable.
- Color field for saturation/brightness or equivalent visual selection.
- Hue control.
- Alpha/opacity control.
- Color model switcher.
- Precise numeric inputs.
- Eyedropper access.
- Recent colors.
- Document colors.
- Styles/variables/libraries access.
- Optional saved swatches/palette management.

These controls can be arranged according to the existing DesignForge AI UI; the requirement is functional coverage, not a forced visual clone.

### 17.3 Interaction flow

1. Select a vector object, text layer, group or multiple objects.
2. Open Fill or Stroke in the Properties inspector.
3. Open the color picker from the associated swatch.
4. Pick visually, enter a precise value, sample a supported source or choose a saved color/variable.
5. Update the canvas immediately after a valid change.
6. Commit the operation using the existing editing/history model.
7. Keep the new appearance undoable and persistent according to the document save model.

The picker must distinguish between selecting a new base color and changing opacity or blend behavior.

---

## 18. Color Models, Parsing and Precision

Support these models/notations to the extent consistent with the current rendering engine:

| Model | Required input | Typical use |
|---|---|---|
| HEX | `#5B5CE2`, and alpha notation such as `#5B5CE2CC` where supported | Design handoff and web workflows |
| RGB | Red, green and blue component entry | Screen color precision |
| HSL | Hue, saturation and lightness | Color adjustment |
| HSB/HSV | Hue, saturation and brightness/value | Visual color selection |
| CSS | Supported `rgb()`, `rgba()`, `hsl()` and other supported CSS color syntax | Web implementation and handoff |
| OKLCH | Optional advanced perceptual color entry if the color engine can support conversions reliably | Perceptually oriented palette work |

### Required behavior

- Switching model must preserve the intended rendered color as closely as conversion permits.
- Each component must be independently editable.
- Alpha may be represented in the color value or a separate opacity field; do not double-apply it.
- Validate input and show a clear invalid-value state.
- Support paste and quick select-all in inputs.
- Update canvas after a valid change.
- Preserve adequate numeric precision and avoid repeated rounding drift.
- Remember the last-selected color notation if compatible with existing preferences.
- Define rounding/serialization rules once and use them consistently.
- Invalid input must not corrupt the current valid color.

### Color profiles

Where supported by the renderer, provide a clear profile setting for spaces such as sRGB and Display P3. Profile conversion must be explicit where it changes interpretation or appearance. Avoid pretending all devices can display all colors identically. Imported profiles and unsupported data should be handled honestly.

---

## 19. Fill, Stroke and Appearance Color Requirements

| ID | Requirement | Expected behavior |
|---|---|---|
| CLR-001 | Apply fill | Change the selected object's fill without changing unrelated properties. |
| CLR-002 | Apply stroke | Change stroke color while preserving stroke width, caps, joins and dashes. |
| CLR-003 | Multiple fills | Support multiple independently editable fill entries where the renderer/model allows. |
| CLR-004 | Multiple strokes | Support multiple independently editable stroke entries where the renderer/model allows. |
| CLR-005 | Visibility | Hide/show a fill or stroke without deleting its configuration. |
| CLR-006 | Appearance ordering | Reorder fills/strokes when the appearance model supports ordering. |
| CLR-007 | Remove appearance | Remove one fill/stroke without affecting other entries. |
| CLR-008 | Opacity | Control opacity independently at the proper level: object, paint entry or gradient stop. |
| CLR-009 | Blend modes | Support appropriate blend modes (for example Normal, Multiply, Screen and Overlay) where the renderer supports them. |
| CLR-010 | No fill/no stroke | Represent absence of paint as an explicit state, distinct from transparent paint. |
| CLR-011 | Sampling | Sample supported color/appearance sources. |
| CLR-012 | History | Undo/redo color, alpha, binding and appearance-stack edits correctly. |
| CLR-013 | Mixed values | Show mixed state for multi-selection when objects differ. |
| CLR-014 | Property isolation | Editing Fill must not unexpectedly modify Stroke or other appearance properties. |

Multiple fill/stroke stacks must only be exposed as functional controls if the current renderer can render and persist them properly. Do not add dummy entries that are ignored by render/export.

---

## 20. Eyedropper and Color Sampling

### Required behavior

- Activate from the picker and/or a shortcut consistent with current app conventions.
- Show a preview of the sampled color and its value on hover where feasible.
- Click applies the selected sample to the active property.
- Support sampling from vector fills/strokes, text, compatible gradient stops, raster images and canvas background where relevant.
- Support copying sampled color as HEX/RGB/CSS.
- Return to the prior tool after a successful sample if that matches existing tool behavior.
- Cancel without mutation.
- Make source sampling behavior predictable when content overlaps or uses transparency.

### Source color versus rendered pixel

The implementation must distinguish two modes where feasible:

1. **Source-property sampling:** get the object's underlying fill/stroke color or selected gradient stop.
2. **Rendered-pixel sampling:** sample the composited on-screen pixel, including relevant transparency and background effects.

Do not silently conflate them. If only one mode is supported in the current phase, name and document it accurately. Sampling a translucent object must not unexpectedly replace its underlying source value with a visually blended color unless that is the requested mode.

---

## 21. Color Styles, Variables, Tokens and Libraries

DesignForge AI must support reusable color resources separately from the objects that reference them.

### 21.1 Resource types

- **Plain color value:** locally stored color components and alpha.
- **Color variable/token:** named reusable value, optionally with values per theme/mode and aliases to other variables.
- **Color/appearance style:** reusable definition for a color or supported set of appearance properties.
- **Collection/library:** organizes local or shared variables/styles and controls scope/access as applicable.
- **Theme/mode:** selects an appropriate value for a token collection, such as light or dark mode.

### 21.2 Suggested hierarchy

1. Color collections: Brand, Semantic, Neutral, Product, Campaign.
2. Palette/base tokens: `color.palette.indigo.600`, `color.neutral.900`.
3. Semantic tokens: `color.text.primary`, `color.surface.default`, `color.border.subtle`.
4. Aliases/modes: semantic tokens reference base colors and may resolve differently by theme.
5. Applied properties: fills, strokes, text, gradient stops and supported effects reference variables/styles.

This hierarchy is a suggestion, not permission to rename or replace the user's existing token naming scheme. Use the current design-system convention if one exists.

### 21.3 Functional requirements

| ID | Requirement | Expected behavior |
|---|---|---|
| TOK-001 | Create variable | Save a color as a reusable named variable. |
| TOK-002 | Apply variable | Bind a compatible color property to a variable. |
| TOK-003 | Create style | Save a reusable color/appearance style. |
| TOK-004 | Organize/search | Rename, organize, filter and search variables/styles. |
| TOK-005 | Global update | Updating a variable updates linked content in its intended scope. |
| TOK-006 | Theme modes | Support multiple values for the same variable across configured modes. |
| TOK-007 | Aliases | Let a semantic variable reference another variable where supported. |
| TOK-008 | Unlink/detach | Allow a property to become an independent plain value without unintended appearance change. |
| TOK-009 | Library support | Publish/consume shared resources only where permissions and current infrastructure support it. |
| TOK-010 | Missing references | Show unresolved references clearly; do not silently substitute an unrelated color. |
| TOK-011 | Rename safety | Renaming a resource preserves its ID and bindings. |
| TOK-012 | Delete safety | Warn about/resolve existing references before deleting a used resource. |
| TOK-013 | Mode preview | Let users preview/switch modes without destructively overwriting base values. |
| TOK-014 | Auditability | Where feasible, show the resource origin and affected references before broad edits. |

### 21.4 Variable application example

If a user binds `color.text.primary` to hundreds of text and icon properties, switching from Light to Dark mode should resolve linked values without requiring manual recoloring. Only properties with that binding should change. Detached/plain colors should remain independent.

The inspector should show variable name, resolved value, active mode, collection/source and alias relationship where available.

---

## 22. Selection Colors and Bulk Recoloring

When multiple objects are selected, provide a **Selection colors** summary similar in workflow to Figma.

### Requirements

1. Inspect the current selection's visible, editable solid fills and supported gradients.
2. Summarize each distinct applicable color/resource once.
3. Identify whether each entry is a plain color, a style, a variable or a gradient stop where possible.
4. Let the user replace a color across matching properties in the current selection.
5. Provide an action to select all matching objects where supported.
6. Allow creation/application of a variable or style from a selected color.
7. Allow explicit unlink/detach of variable-bound properties.
8. Preserve each object's independent opacity and unrelated appearance properties unless the user changes them explicitly.
9. Update the summary immediately when selection changes.
10. Treat identical numerical colors with different variable references as distinct resources when the distinction affects update behavior.
11. Handle mixed values and partial selection safely.
12. Commit bulk recoloring as a coherent undoable operation.

Bulk recoloring must not overwrite approved semantic tokens simply because the resolved colors currently match. The UI must distinguish “replace these color values” from “edit this linked variable globally.”

---

## 23. Gradient Color Editing

At minimum, support linear and radial gradients. Add angular and diamond forms only when rendering, persistence and import/export semantics are correct.

| Feature | Required behavior |
|---|---|
| Linear | Edit endpoints/direction and transitions. |
| Radial | Edit origin, radii/extent and stops. |
| Angular | Edit rotation and angular color distribution if supported. |
| Diamond | Edit center, extent and stops if supported. |
| Gradient stops | Add, select, reorder, move and remove stops. |
| Stop color | Edit through the same color picker/model controls. |
| Stop alpha | Control stop transparency separately and consistently. |
| On-canvas editing | Drag gradient handles and stops directly on the selected object. |
| Reverse | Reverse direction/order predictably. |
| Recolor | Change individual stops without rebuilding the entire gradient. |
| Variable binding | Bind a stop to a compatible color variable. |
| Saved gradients | Reuse supported gradient styles/resources. |
| Gradient stroke | Apply/edit gradient strokes where supported. |

All gradient edits must render immediately and remain undoable. Handle coincident stops, alpha, tiny gradients and multi-selection without corrupting geometry or style references.

Pattern and image fills should be available in the same fill-type family when supported, with their own contextual configuration rather than forcing them through solid-color controls.

---

## 24. Recent Colors, Document Palettes and Libraries

Provide the following sections as supported by the current app:

- **Recent colors:** recently applied colors under a predictable recency rule.
- **Document colors:** colors used in the current document or selected objects.
- **Local styles:** reusable styles stored in the current file.
- **Variables:** named tokens and resolved values.
- **Libraries:** shared colors/variables from accessible libraries.
- **Suggested colors:** optional AI recommendations with clear distinction from approved resources.

Users should be able to click a swatch to apply it, search resources by name, filter by library/collection, inspect source and create a resource from the selected value. Support grid/list views where helpful, keyboard navigation, labels and tooltips.

AI suggestions must not silently create, rename or replace approved tokens. Suggested colors must be visually distinguished from existing design resources, and acceptance must be an explicit user action.

---

## 25. Accessibility and AI-Assisted Recoloring

### 25.1 Contrast and accessibility checks

- Calculate text/background contrast where both effective colors can be determined.
- Identify when combinations fail the chosen WCAG criterion.
- Suggest alternatives while respecting user-provided brand constraints where possible.
- Preview suggestions before application.
- Explain affected elements and reasons for suggestions.
- Account for transparency/compositing when relevant.
- Communicate uncertainty when the true background, profile or rendered appearance cannot be determined.
- Do not claim definitive compliance from an incomplete analysis.

### 25.2 AI recoloring workflow

Example request: “Replace the current primary blue with a darker indigo. Preserve semantic color tokens and maintain readable text contrast.”

The system should:

1. Identify selected colors and the resources that own them.
2. Separate plain colors from styles and variable bindings.
3. Generate candidate values with rationale and any relevant contrast metrics.
4. Preview changes on the actual affected artwork.
5. List objects, fills, strokes, gradients and tokens that would change.
6. Ask for/require explicit approval before applying bulk changes.
7. Apply approved changes as one undoable transaction where practical.
8. Provide a clear undo and retain a record of the accepted operation where current history/audit infrastructure supports it.

The AI must not hallucinate that an unverified change succeeded, invent token names, silently alter global variables, or claim accessibility compliance without the required calculation/context.

---

## 26. Proposed Data Model Guidance

The snippets below are conceptual examples. The IDE agent must first inspect existing types and extend them compatibly; do not paste these models over existing production types without reconciliation.

### 26.1 Path geometry example

```ts
type Point = { x: number; y: number };

type PathAnchor = {
  id: string;
  position: Point;
  inHandle: Point | null;
  outHandle: Point | null;
  type: "corner" | "smooth" | "symmetric";
};

type PathGeometry = {
  anchors: PathAnchor[];
  closed: boolean;
  fillRule: "nonzero" | "evenodd";
};
```

### 26.2 Color value and variable example

```ts
type ColorValue = {
  colorSpace: "srgb" | "display-p3";
  model: "rgb" | "hsl" | "hsb" | "oklch";
  components: number[];
  alpha: number;
};

type ColorVariable = {
  id: string;
  name: string;
  collectionId: string;
  valuesByMode: Record<string, ColorValue>;
  aliasVariableId?: string;
};
```

### 26.3 Fill paint example

```ts
type SolidFill = {
  id: string;
  type: "solid";
  color: ColorValue;
  colorVariableId?: string;
  visible: boolean;
  opacity: number;
  blendMode: string;
};

type GradientFill = {
  id: string;
  type: "gradient";
  gradientType: "linear" | "radial" | "angular" | "diamond";
  geometry: Record<string, number>;
  stops: Array<{
    id: string;
    position: number;
    color: ColorValue;
    colorVariableId?: string;
  }>;
  visible: boolean;
  opacity: number;
  blendMode: string;
};

type FillPaint = SolidFill | GradientFill;
```

### Model rules

- Keep color components, alpha, color space and variable references distinguishable.
- Model object opacity separately from fill/stroke/stop opacity when the rendering semantics require it; avoid accidental double application of alpha.
- Use stable IDs for objects, anchors, paint entries, stops, variables and styles.
- Keep transforms, geometry, appearance and hierarchy logically separate.
- Use discriminated unions or the existing equivalent for shape-specific parameters.
- Support serialization, compatibility defaults and migration tests.
- Resolve variable aliases with cycle detection and clear error handling.
- Preserve unknown imported fields where safe rather than deleting them silently.

---

## 27. Performance, Reliability and Accessibility

### Performance

- Use viewport-aware drawing and efficient hit testing.
- Avoid a complete document recompute on every pointer-move if a local update is sufficient.
- Cache geometry/rendered results where the architecture allows and invalidate them correctly.
- Keep multi-selection and selection-color summary updates responsive for realistic document sizes.
- Prevent repeated gradient/color conversions from degrading precision.
- Keep the UI interactive while expensive tasks such as tracing or complex boolean operations run; report progress where appropriate.

### Reliability

- Invalid geometry operations must fail safely.
- Cancelled interactions must restore the pre-action state.
- Undo/redo must cover geometry, appearance, bindings, styles and hierarchy updates.
- Save/reload should preserve editable geometry and color metadata.
- Import/export should clearly report unsupported features or losses when material.
- Do not silently flatten or rasterize artwork when an editable representation is expected.

### Accessibility

- Provide keyboard access to tools and properties where appropriate.
- Use visible focus states and informative labels/tooltips.
- Do not communicate selection or validation by color alone.
- Make numeric controls usable with keyboard input.
- Provide meaningful invalid-input and error messages.
- Respect application-level accessibility and theme conventions.

---

## 28. Implementation Priorities

The implementation agent must map existing capabilities first. Priorities govern sequencing, not permission to remove anything already shipped.

### P0 — Foundational editor and core color interaction

- Vector object/path model or compatible extension
- Object selection and direct selection
- Pen tool, anchor editing and core shapes
- Move/scale/rotate, snapping and numeric transform controls
- Fill/stroke solid colors and opacity
- Color picker with HEX/RGB editing
- Eyedropper basic workflow
- Layers/groups and basic arrangement
- Undo/redo, cancellation and regression coverage
- SVG/vector import/export to the extent already supported

### P1 — Professional workflows and design-system basics

- Live shapes and richer path editing
- Boolean operations and Shape Builder
- Clipping/compound paths
- Gradients, multiple fills/strokes where supported
- Color model switcher (HSL/HSB/CSS)
- Recent/document colors and Selection colors
- Color variables, styles and aliases
- Theme modes
- Alignment/distribution, brushes, text-on-path and symbols as supported

### P2 — Advanced vector and color capability

- Mesh gradients
- Variable-width strokes
- Advanced warps/Puppet Warp/envelope effects
- Perspective and specialist graph/symbol tools
- Image Trace
- Display P3 and advanced color workflows
- Shared libraries and robust gradient-variable integration
- Contrast/accessibility feedback

### P3 — AI enhancement

- Prompt-to-vector generation
- Intelligent path cleanup/simplification
- Semantic recoloring
- Palette generation and token suggestions
- Natural-language geometry edits
- Explainable previews, approval and reversible application

If existing code already provides a P1/P2/P3 feature, do not defer or remove it simply because this sequence lists it later.

---

## 29. Acceptance Criteria and Regression Checklist

Use the checklists below to validate actual behavior. A requirement is not complete because a control is visible; it is complete when the operation works, renders, persists as applicable and has tests.

### 29.1 Core vector behavior

- [ ] Select and move one object without altering its geometry.
- [ ] Multi-select and transform objects together.
- [ ] Select an anchor and edit it without moving unrelated geometry.
- [ ] Draw straight, curved, open and closed paths.
- [ ] Add, delete, convert and join anchors while maintaining a valid path.
- [ ] Create supported shapes and edit dimensions numerically.
- [ ] Constrain shapes during drawing and verify consistent modifiers.
- [ ] Edit live-shape properties without automatic conversion to a generic path.
- [ ] Resize, rotate, reflect and scale around the expected reference point.
- [ ] Merge, subtract, intersect and divide eligible geometry.
- [ ] Apply/edit fills, strokes and gradients.
- [ ] Move/release masks without deleting hidden content.
- [ ] Group, ungroup and reorder layers without unintended stacking changes.
- [ ] Undo/redo each edit and restore correct geometry and appearance.
- [ ] Cancel in-progress operations without partial changes.
- [ ] Verify snapping, selection and handle hit areas at different zoom levels.

### 29.2 Color system behavior

- [ ] Opening Fill/Stroke swatches shows the correct contextual picker.
- [ ] HEX, RGB, HSL, HSB and supported CSS values parse and display correctly.
- [ ] Switching color models preserves the intended rendered value within documented precision.
- [ ] Alpha/opacity changes do not accidentally double-apply transparency.
- [ ] Fill edits do not unexpectedly change Stroke, or vice versa.
- [ ] Multiple fills/strokes, if exposed, actually render and persist.
- [ ] Eyedropper samples the intended source/rendered color and supports cancellation.
- [ ] Selection colors summarizes the current selection and recolors only intended properties.
- [ ] Identical values with different variable bindings remain distinguishable where necessary.
- [ ] Variable updates propagate to linked objects in the intended scope/mode.
- [ ] Detached/plain values remain independent when a variable changes.
- [ ] Gradient stop position, color, opacity and geometry can be edited and undone.
- [ ] Recent colors, document colors and library resources are selectable/searchable where implemented.
- [ ] Contrast feedback explains its context and limitations.
- [ ] Undo/redo restores colors, bindings, opacity, gradient stops and appearance order.

### 29.3 Application stability and regression

- [ ] Existing tools, routes and unrelated workflows still work.
- [ ] Existing documents open without lost geometry or appearance.
- [ ] Save/reload preserves new data and backwards compatibility defaults.
- [ ] Import/export tests cover supported formats and unsupported-feature warnings.
- [ ] No newly displayed control is inert or misleading.
- [ ] Keyboard shortcuts do not break existing shortcuts, text entry or browser/OS interactions.
- [ ] Type checks, linting, tests and production build pass, or failures are reported with exact reasons.
- [ ] Performance remains acceptable on representative documents and selections.
- [ ] Known limitations are documented; no unsupported capability is described as complete.

---

## 30. Definition of Done

A change is ready when all applicable conditions below are met:

1. The relevant requirement IDs are implemented or explicitly marked blocked/not applicable with reasons.
2. Existing functionality remains intact and regression tests pass.
3. New interaction is functional, not decorative or mocked.
4. The canvas and inspector stay synchronized.
5. Geometry/appearance updates are undoable and save/reload correctly where applicable.
6. Keyboard, pointer and cancellation paths are tested.
7. New data is backward-compatible or includes a tested migration.
8. Existing DesignForge AI styles and conventions are respected.
9. The app builds and the applicable automated checks run successfully.
10. The implementation report lists files changed, requirements delivered, tests, known gaps and any risks.

### Required IDE completion report format

At the end of the work, provide:

- **Repository findings:** existing systems reused.
- **Requirements implemented:** requirement IDs and brief outcome.
- **Files changed:** path and purpose.
- **Tests run:** exact commands and results.
- **Regression verification:** existing flows checked.
- **Data/schema changes:** compatibility and migration notes.
- **Known gaps:** requirements not delivered and why.
- **Next recommended tasks:** only the most relevant remaining work.

Do not claim a test passed unless it was run. Do not claim a feature is complete unless its interaction and state update are connected to the underlying model and verified.

---

## 31. Reference Documentation

These links are reference material for expected behavior. They do not override DesignForge AI's existing architecture or justify a broad redesign.

### Adobe Illustrator

- [Illustrator tools reference](https://helpx.adobe.com/illustrator/using/tools-in-illustrator.html)
- [Paths and shapes basics](https://helpx.adobe.com/illustrator/desktop/draw-shapes-and-paths/learn-drawing-basics/paths-and-shapes-in-illustrator.html)
- [Draw curves with the Pen tool](https://helpx.adobe.com/illustrator/desktop/draw-shapes-and-paths/draw-shapes/draw-curves-with-the-pen-tool.html)
- [Create and modify live shapes](https://helpx.adobe.com/illustrator/desktop/draw-shapes-and-paths/modify-live-shapes/create-and-modify-live-shapes.html)
- [Shape Builder tool](https://helpx.adobe.com/illustrator/using/tool-techniques/shape-builder-tool.html)
- [Brushes overview](https://helpx.adobe.com/illustrator/desktop/paint-and-fill/apply-and-edit-strokes/about-brushes.html)
- [Clipping masks](https://helpx.adobe.com/illustrator/desktop/manage-objects/edit-objects/about-clipping-masks.html)

### Figma

- [Figma Help Center](https://help.figma.com/)
- [Color and gradient workflows](https://help.figma.com/hc/en-us/search?query=colors%20gradients)
- [Variables and modes](https://help.figma.com/hc/en-us/search?query=variables%20modes)
- [Selection colors](https://help.figma.com/hc/en-us/search?query=selection%20colors)

---

## Final Instruction to the IDE Agent

**Treat this document as an additive requirements specification for the existing DesignForge AI codebase. First understand the current implementation, then fulfill the gaps with the smallest safe, testable changes. Preserve all existing working functionality, document structure, visual conventions and user data. Do not rewrite or remove unrelated functionality.**
