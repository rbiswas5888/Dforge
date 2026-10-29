# Part. 1
# DesignForge AI — Complete Vector Editor & Color System Roadmap

**Document type:** Comprehensive product roadmap + tool taxonomy + interaction specification + IDE implementation contract  
**Version:** 1.2  
**Status:** Implementation reference  
**Product area:** DesignForge AI vector editor, canvas interactions, appearance inspector, color picker, design tokens and color libraries

**Document map:** Sections 0–31 define the core requirements, color system, implementation priorities and original acceptance criteria. Section 32 expands the tool-by-tool interaction roadmap, including recommended tool grouping, double-click/edit-mode behavior, Boolean Add/Subtract semantics and transform pivots. Section 33 closes with the IDE agent's implementation contract.

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

## 31. Preservation Reminder Before the Expanded Roadmap

**Treat this document as an additive requirements specification for the existing DesignForge AI codebase. First understand the current implementation, then fulfill the gaps with the smallest safe, testable changes. Preserve all existing working functionality, document structure, visual conventions and user data. Do not rewrite or remove unrelated functionality.**

---

## 32. Comprehensive Vector & Color Roadmap — IDE Implementation Addendum


**Purpose:** This addendum expands the original specification into a tool-by-tool implementation and interaction roadmap. It covers what each tool is for, how to use it, what it changes in vector geometry, how selection and double-click behave, how to add/subtract geometry, how pivot/reference points work, and how color properties interact with vectors.

**Reference approach:** Use Figma and Sketch as interaction benchmarks, not as instructions to copy proprietary UI or undocumented behavior. Figma's documented vector editing includes vector networks, Move, Pen, Variable Width, Shape Builder, Cut, Bend, Eraser, Lasso and Paint tools; its Boolean operations are non-destructive. Sketch documents point types, point editing, Boolean operations, Offset Path, pixel snapping and color variables. Sources are listed at the end. Product behavior below is a DesignForge AI specification and should be validated against the current codebase.

### 32.1 Recommended Tool Grouping and Toolbar Architecture

This is the recommended logical grouping for DesignForge AI. It defines **where tools belong and when they should appear**, not a requirement to replace the application's current toolbar layout. The IDE agent must map these groups onto the existing UI and preserve its established shell, navigation, visual language, and shortcut behavior.

#### Grouping principles

1. Keep the always-visible toolbar compact. Frequently used creation and navigation tools belong in the primary toolbar; related or specialist tools belong in labeled flyouts.
2. Show point-level operations only while vector-edit mode is active. Do not permanently display every anchor, cut, bend, and region-paint tool when the user is arranging whole objects.
3. Prefer contextual controls for operations that require a specific selection. Boolean actions should appear when compatible objects are selected; point-type controls should appear when anchors are selected; gradient handles should appear when a gradient is being edited.
4. Put detailed numeric properties in the Inspector, not into a crowded toolbar. The toolbar starts an action; the Inspector specifies exact values.
5. Keep color picking attached to Fill/Stroke and other color-bearing properties. Do not make users leave the current workflow to reach a separate color application.
6. Use menus/overflow for advanced, infrequent tools. A feature must not be represented as enabled unless its operation is implemented.
7. A group may be visually represented by one icon and a flyout, but every item must have an accessible name, tooltip, keyboard route and clear active/disabled state.

#### A. Recommended tool groups

| Group | Placement | Tools included | Why they belong together / availability |
|---|---|---|---|
| **1. Select & Move** | Primary toolbar | Select/Move, marquee selection, group selection; Direct Selection appears as a related tool or contextual mode | The starting point for choosing and manipulating objects. Whole-object selection must be distinct from anchor/segment editing. |
| **2. Frame & Artboard** | Primary toolbar or Insert flyout | Frame/container creation, Artboard creation/selection/resizing | Defines design surfaces and containment; separate from drawing a visible vector shape. Keep this group only to the extent these document concepts exist in the app. |
| **3. Shape tools** | Shape flyout | Rectangle, Rounded Rectangle, Ellipse/Oval, Line, Arrow, Polygon, Star, Arc, Spiral, Rectangular Grid, Polar Grid, Flare where supported | These tools create live primitives with relevant parameters. The flyout prevents the main toolbar becoming overloaded while preserving quick access to common shapes. |
| **4. Draw & Edit Vectors** | Primary Pen/Vector tool plus a contextual vector-edit toolbar | Pen, Curvature/Bend, Pencil, Move Point, Direct Selection, Add/Delete Anchor, point-type conversion, handle editing, close/open path, Join/Split, Reverse Path, Smooth, Simplify | All operations that create or directly modify path geometry. Show the detailed point-edit toolbar only after entering vector-edit mode. |
| **5. Boolean & Shape Construction** | Contextual toolbar, Inspector, and Object/Path menu | Union/Add, Subtract, Intersect, Exclude/Difference, Divide, Trim/Merge/Crop where supported, Shape Builder, Compound Path, Outline Stroke, Expand Appearance | Operations combine or derive geometry. Show Boolean actions only when the selection is valid. Keep Boolean Add/Combine distinct from Shape Builder's region-add mode and from adding an anchor point. |
| **6. Cut & Path Repair** | Vector-edit flyout / contextual toolbar | Scissors, Knife, Path Eraser, Eraser, Join, Close/Open, Split Path, delete segment | These operations remove or separate geometry. Their labels and previews must explain whether they cut a stroke, split a path, delete a region or remove an entire object. |
| **7. Transform & Reshape** | Selection handles, contextual toolbar, and Inspector | Move, Resize/Scale, Rotate, Reflect/Flip, Shear, Free Transform, Reshape, custom Pivot/Transform Origin, Variable Width, Warp, Twirl, Pucker, Bloat, Scallop, Crystallize, Wrinkle, Puppet Warp, Envelope distortion | Standard transforms should be immediately available through selection handles and numeric properties. Specialized deformations should be grouped in a Transform/Reshape flyout or advanced menu. Pivot controls appear when a transform supports them. |
| **8. Paint & Region Fill** | Paint/Appearance flyout; region tools also in vector-edit mode | Paintbrush, Blob Brush, Live Paint/Region Fill, Mesh, Gradient tool, Eyedropper/Sampler | These tools paint strokes, fill closed regions or edit color transitions. Distinguish creating a brush stroke from filling an existing vector region. |
| **9. Color & Appearance** | Right Inspector with anchored color popovers | Fill stack, Stroke stack, Color Picker, HEX/RGB/HSL/HSB/CSS entry, Opacity, Blend Mode, gradients, pattern/image fills, brushes, effects, swatches, recent/document colors, Color Styles, Variables/Tokens, Libraries, Selection Colors | Color is primarily a property of selected objects. Clicking a fill/stroke swatch opens the color picker in context. Keep the full resource browser in the picker/Inspector rather than consuming permanent toolbar space. |
| **10. Text & Typography** | Primary toolbar plus text-context Inspector | Point Text, Area Text, Type on Path, Vertical Type where supported, Touch Type/character transforms, text formatting, Outline Text | Text needs a clear tool entry and a dedicated editing state. Conversion to outlines is an explicit operation and must warn that ordinary text editing is lost. |
| **11. Layers, Groups & Reusable Assets** | Layers panel and Object/Insert menus | Group/Ungroup, enter/exit group, layer ordering/lock/hide, Components/Symbols, symbol instances, Repeats, Patterns, Objects on Path, reusable styles | These manage hierarchy and reuse rather than drawing primitive geometry. Maintain stable IDs and relationships when objects move within the hierarchy. |
| **12. Align, Distribute & Arrange** | Contextual toolbar and Inspector/menu | Align, Distribute, spacing, key-object alignment, bring forward/back, bring to front/back, flip | These actions position objects or selected points. They should become available when their selection requirements are met and should not unexpectedly resize objects. |
| **13. Navigate & Measure** | Persistent navigation controls, View menu and shortcuts | Hand/Pan, Zoom, Fit Selection/Artboard, Rotate View, Rulers, Guides, Grid, Smart Guides/Snapping, Pixel Grid/Snapping, Measure, Dimension annotations | Navigation should not edit artwork. Measurement and view rotation must remain distinct from object transforms. |
| **14. Import, Trace & Export** | File menu, Insert menu, Export panel, and advanced tools menu | Place/import assets, Image Trace/vectorization, Artboards, Slices, export selection/artboard/region, SVG and supported vector formats | These are document and production workflows, not everyday path-drawing tools. Present progress/errors and warn when output cannot preserve editability. |
| **15. Specialist & Advanced Tools** | Advanced/More tools flyout and contextual panels | Perspective Grid/Selection, Graph tools, Symbol manipulation tools, Flare, advanced mesh/warp operations, specialized measurement/dimension features | Keep available for advanced workflows without crowding core drawing controls. Each specialist tool needs its own contextual controls and documented supported object types. |
| **16. AI-assisted Vector & Color** | Existing AI panel/command surface, with contextual actions on selected objects | Prompt-to-vector, path cleanup, semantic recoloring, palette generation, token suggestions, explainable batch edits | AI is an assistive workflow, not a replacement for direct tools. Always preview changes, identify affected objects/tokens and require acceptance before applying a broad change. |

#### B. Suggested physical layout (adapt to the existing application)

- **Primary toolbar:** Select/Move, Frame/Artboard (if applicable), Shapes flyout, Pen/Vector, Text, Hand/Pan and Zoom. If the existing app places tools elsewhere, preserve that layout and apply the same logical grouping rather than moving the whole interface.
- **Vector-edit secondary toolbar:** Move Point, Pen/Add Point, Bend, point types/corners, Join/Close/Open, Boolean/Shape Builder where applicable, Cut/Scissors, Eraser, Lasso, Paint/Region Fill, Variable Width. This toolbar is visible only in vector-edit mode or when vector objects are selected.
- **Contextual selection controls:** Align/Distribute, Boolean operations, transform pivot, flip/rotate, group/ungroup and relevant object actions. Hide or disable actions that do not apply to the current selection.
- **Right Inspector:** Transform, Constraints/Resize behavior if supported, Geometry, selected-point properties, Fill, Stroke, Effects, Color Variables/Styles and Export. Sections must be selection-aware and preserve user-entered values when moving between compatible objects.
- **Color popover:** A swatch click opens the picker anchored to the relevant Fill/Stroke/gradient stop. Provide visual field, hue, alpha, direct color-model input, eyedropper, recent/document colors, styles/variables and library access without leaving the current property context.
- **Layers/Assets panel:** Layers, groups, masks, Boolean groups, components/symbols and reusable resources. A hierarchy operation must preserve the visual position of child objects unless local-coordinate behavior is explicitly intended.
- **Advanced/More menu:** Perspective, graphs, image trace, slices, specialist deformation tools, advanced path operations and infrequently used utilities. Searchable command access is recommended if the app already has a command palette or menu search.
- **Menus/command search:** Keep file/document actions, path operations, arrange, view/precision options, import/export and shortcuts discoverable. Do not duplicate every operation as a permanent toolbar icon.

#### C. Tool availability and contextual behavior

| Context | Tools/actions that should be emphasized | Tools that should not hijack the context |
|---|---|---|
| Nothing selected | Document settings, shape creation, Pen/Vector, Text, navigation | Object-specific fill/stroke changes, Boolean actions, anchor editing |
| Whole object selected | Move/resize/rotate, pivot, geometry, Fill/Stroke, align/arrange, duplicate | Point-level editing controls unless the user enters vector-edit mode |
| Vector edit mode | Anchor/segment selection, handles, point-type conversion, add/delete point, join/split, close/open, Bend | Whole-object commands that would unexpectedly exit point editing |
| Two or more compatible shapes selected | Union, Subtract, Intersect, Exclude, align/distribute, shared appearance, Selection Colors | Boolean operations that do not support the current object mix |
| Boolean group selected | Operation hierarchy, editable children, parent appearance, expand/flatten as explicit actions | Silent destructive flattening or per-child appearance controls if parent appearance governs them |
| Fill/Stroke swatch active | Color picker, direct color values, eyedropper, variables/styles, recent colors | Unrelated transform or layer commands taking keyboard focus |
| Gradient editing active | Gradient type, stop selection, stop position/color/alpha, on-canvas geometry | Object selection changes caused by clicking a gradient handle |
| Text editing active | Text content and typography controls | Canvas shortcuts that intercept ordinary text input |
| Locked or hidden object | Unlock/reveal actions from hierarchy | Dragging, point-editing or color editing through the locked/hidden state |

#### D. Avoid ambiguous “Add” and “Subtract” controls

DesignForge AI must name and visually distinguish these actions according to context:

- **Boolean Add/Union:** combine the filled areas of selected objects into a composite shape/group.
- **Add/Combine Paths:** place multiple paths in one editable container without calculating a Boolean union; useful for open paths and independent contours.
- **Shape Builder Add:** add highlighted regions to the constructed result.
- **Add Anchor Point:** insert a new point into an existing path segment.
- **Add Fill/Stroke:** add an appearance row to the selected object's Fill or Stroke stack.
- **Subtract Boolean:** subtract one or more selected operands from the designated base shape according to the documented stacking rule.
- **Shape Builder Subtract:** remove highlighted region(s) from the constructed result.
- **Delete Anchor/Segment:** remove a point or segment while reconstructing the remaining path; it does not mean Boolean Subtract.
- **Remove Fill/Stroke:** remove an appearance row, not vector geometry.

Every Add/Subtract action must show a hover/selection preview when possible, indicate the target and resulting operation, respect layer order where relevant, and create one coherent undo step.

#### E. Reference behavior and product adaptation

Figma documents a dedicated vector-edit mode with Move, Pen, Variable Width, Shape Builder, Cut, Bend, Eraser, Lasso and Paint tools. Sketch documents entering vector edit mode by double-click or Return, inserting points by clicking a path, changing point types, and using non-destructive Boolean operations. Use these as references for mode separation and interaction predictability, while preserving DesignForge AI's established UI and architecture.

- Figma vector editing: https://help.figma.com/hc/en-us/articles/360039957634-Edit-vector-layers
- Figma vector networks: https://help.figma.com/hc/en-us/articles/360040450213-Vector-networks
- Figma Boolean operations: https://help.figma.com/hc/en-us/articles/360039957534-Boolean-operations
- Sketch vector editing: https://www.sketch.com/docs/designing/vector-editing/
- Sketch Boolean operations: https://www.sketch.com/docs/designing/shapes/boolean-operations/
- Sketch shapes: https://www.sketch.com/docs/designing/shapes/

---

### 32.2 Non-negotiable preservation contract for the IDE agent

Before changing code, the IDE agent MUST:

1. Inspect the current repository, package scripts, app entry points, routing, editor/canvas architecture, state management, rendering engine, selection model, property inspector, toolbar, shortcuts, persistence, import/export and tests.
2. Identify which listed tools already exist, including partial implementations, and map them to existing components and data structures.
3. Create a gap analysis: `Implemented`, `Partial`, `Missing`, `Broken`, `Blocked by architecture`.
4. Preserve existing UI styling, layout, design tokens, routes, file navigation, project/file behavior, saved documents, keyboard shortcuts, working features and integrations unless a change is explicitly required and approved.
5. Prefer extending existing components and services over introducing parallel implementations. Do not replace the canvas renderer, state manager, router, data model, or component system merely to match this document.
6. Make small, reversible changes. Add or update tests before broad refactoring. Keep each change isolated and easy to review.
7. Never fabricate a working tool with a visual-only button. A tool must perform the behavior it advertises, or be visibly marked as unavailable/roadmapped.
8. Do not silently rasterize vectors, flatten groups, destroy editable geometry, change unrelated object styles, or rewrite existing files/data.
9. Keep document operations transactional. A single user gesture should create a coherent undo step unless the current application has a documented different convention.
10. Run existing tests and relevant new tests after each milestone. Report actual commands/results; do not claim tests passed if they were not run.
11. If a requested feature conflicts with the existing architecture or would break a current workflow, explain the conflict and implement the smallest compatible alternative rather than deleting existing behavior.
12. Do not add dependencies without checking whether the repository already provides equivalent functionality, whether the dependency is compatible, and whether its licensing and bundle cost are acceptable.

#### Required agent deliverables before implementation

- Repository and architecture summary.
- Tool inventory with current status.
- Interaction/shortcut conflicts list.
- Proposed implementation sequence with files/components likely to change.
- Regression test plan.
- Explicit list of out-of-scope changes.

The agent may then implement in milestones. Do not attempt to implement every advanced feature in one giant unreviewable change.

### 32.3 Core interaction vocabulary and state machine

All vector tools must use shared interaction infrastructure rather than implement incompatible pointer logic independently.

#### Pointer/keyboard events

Support pointer down/move/up/cancel, double-click/double-tap where appropriate, hover, modifier-key changes during a gesture, keyboard focus, Escape/cancel, and pointer capture while dragging. If the pointer leaves the canvas during a drag, the operation must continue or cancel predictably; it must not leave a stuck drag state.

#### Common states

- `idle`: no active gesture.
- `hovering`: a valid object, anchor, segment, handle, control, guide or Boolean region is under the pointer.
- `armed`: pointer-down target has been identified; no document mutation yet.
- `previewing`: live geometry or style preview is being shown.
- `committing`: validate and apply the operation as a single transaction.
- `cancelled`: restore the pre-gesture state.
- `editing-object`: object-specific controls are available.
- `editing-vector`: anchors, handles, segments and path operations are active.
- `editing-text`: text editing owns keyboard input.
- `editing-gradient`: gradient handles and stops are active.
- `editing-mask` / `editing-boolean`: user is explicitly editing a nested source object.

#### Target priority and hit testing

Use screen-space hit tolerances so anchors and handles remain usable at different zoom levels. Hit-test in a deterministic order: active drag handle/control; selected anchor or handle; visible anchor/segment in vector edit mode; object transform handle; object body/stroke; canvas background. This order may be adjusted for a tool's explicit mode, but must be consistent and documented.

When several objects overlap, provide a predictable way to cycle or reach obscured objects via layer hierarchy/context menus. Locked objects must not be modified through canvas gestures. Hidden objects must not be hit-tested unless the user deliberately targets them through a supported hierarchy action.

#### Gesture lifecycle

1. Resolve the target and operation before mutating document state.
2. Capture a pre-gesture snapshot or create a transaction boundary.
3. Render a preview during pointer movement; do not repeatedly commit history entries per frame.
4. On pointer-up, validate geometry, constraints, permissions and object references.
5. Commit one operation and one undo record.
6. On Escape, pointer cancellation or invalid operation, restore the pre-gesture state.
7. Restore the previous tool after temporary tools (for example, eyedropper or hand) where that is the established interaction pattern.

### 32.4 Tool catalogue: creation and drawing

The list below is the intended product coverage. Some tools may share an implementation or live under a tool flyout. A tool should only appear enabled when its action is implemented for the active object/context.

#### A. Select / Move tool

**Purpose:** Select and transform whole objects, groups, text layers, images, vector paths, Boolean groups and components.

**Use:** Click an object; drag it to move; drag bounding-box handles to resize; use numeric properties for precise position and size.

**Vector behavior:** Moves/transforms the object's transform, not its individual path anchors, unless the object is in vector edit mode or the selected handle explicitly edits geometry.

**Required options:** single select, modifier multi-select, marquee select, move, duplicate-drag, align/snap feedback, transform box toggle, transform origin, numeric X/Y/W/H/rotation, constrain proportions, flip, lock aspect ratio.

**Double-click:** Enter the object's supported nested editing mode only when the object type supports it (e.g., vector edit mode, text edit mode, group/component entry). Double-clicking an ordinary shape must not unexpectedly create a second object or alter geometry. Provide an unambiguous visual state and a reliable exit action.

#### B. Direct Selection / Vector Point Selection

**Purpose:** Edit geometry within an existing vector object.

**Use:** Enter vector-edit mode, click one anchor/segment, Shift-click to add/remove points, drag a marquee to select points, drag a selected point or handle, use arrow keys for nudging, and use the inspector for exact coordinates.

**Vector behavior:** Selected anchors and their connected segments change; unrelated anchors remain fixed unless the geometry operation requires a local adjacent adjustment. A selected anchor may affect its incoming/outgoing handles according to its point type.

**Required options:** point selection, segment selection, handle selection, multi-point selection, invert/select all points, point navigation, point-type controls, point coordinates, handle coordinates, point alignment/distribution, close/open path.

**Double-click:** Double-clicking a supported anchor toggles or cycles its point type only if that action is clearly signaled; recommended baseline is double-click to toggle corner ↔ smooth/mirrored, with a contextual inspector control for exact types. Do not assign this behavior to the object body.

#### C. Pen tool

**Purpose:** Create precise paths and vector networks using anchors and Bézier curves.

**Use:** Click for a corner/straight segment; click-drag to create a curved point and handles; click a valid starting anchor to close a contour; Escape to finish/cancel according to whether a valid path has already been created.

**Vector behavior:** Adds points and segments to a new path/network or continues an open path when an endpoint is explicitly targeted. Closing a path creates a fillable contour, subject to fill rule.

**Required options:** straight segment, curve segment, close path, continue path from either endpoint, add point on path, create independent handles using modifier, snap angle, preview next segment, finish open path, cancel in-progress path.

**Double-click:** Double-clicking an existing path/shape enters vector edit mode; double-clicking an anchor may convert its point type only when the anchor itself is the hit target. It must not create a duplicate path.

#### D. Bend / Curvature tool

**Purpose:** Add or refine curvature with fewer explicit handle operations.

**Use:** Click/drag a path segment or point; drag to control curve amount; use handles/inspector for precision.

**Vector behavior:** Adjusts local segment curvature, adding handles/anchors only when necessary. Preserve the surrounding contour as closely as possible.

**Required options:** bend segment, adjust curvature, convert straight segment to curved, local smoothing, preview, cancel.

#### E. Pencil / Freehand Vector tool

**Purpose:** Draw paths by pointer/stylus movement.

**Use:** Press and drag to draw, release to finish; use pressure data where supported.

**Vector behavior:** Samples pointer input and fits a path with configurable fidelity/smoothing. It should avoid excessive anchor creation and retain a useful editable path.

**Required options:** fidelity, smoothing, pressure sensitivity, close path when near start, edit selected path, replace selected path only when explicitly enabled.

#### F. Brush / Paint tool

**Purpose:** Create expressive vector strokes or paint selected vector regions, depending on the tool mode.

**Use:** Drag a stroke; configure brush, width, pressure, color and smoothing. In vector-edit mode, Paint may target vector regions only if the app supports the relevant vector-network/region model.

**Vector behavior:** A stroke is stored as editable path geometry plus brush/style metadata where supported. Do not silently convert it to a raster image.

**Required options:** brush presets, size, pressure, smoothing, opacity, color, erase/paint mode, edit stroke path, expand/outline stroke as explicit conversion.

#### G. Rectangle / Rounded Rectangle

**Purpose:** Create box geometry and UI-oriented shapes.

**Use:** Drag diagonally; use modifier for square; use center-draw modifier where supported; edit width/height and corner radii in the inspector or on-canvas controls.

**Vector behavior:** Retain live rectangle parameters until conversion is requested. Individual corner radii must be preserved where supported.

**Double-click:** Enter shape-specific editing only if there are live controls to expose; otherwise enter vector-edit mode. Never rasterize the shape.

#### H. Ellipse / Oval / Arc

**Purpose:** Create circles, ovals, arcs and pie/wedge forms.

**Use:** Drag bounds; constrain to circle; edit start/end angle and inner/outer radius for arc/pie forms when implemented.

**Vector behavior:** Preserve ellipse/arc parameters until explicit path conversion.

#### I. Polygon / Star

**Purpose:** Create regular polygons and star shapes.

**Use:** Drag to set size/rotation; adjust sides, points, inner radius, outer radius and corner rounding through live controls.

**Vector behavior:** Keep construction parameters editable; conversion to path is explicit.

#### J. Line / Arrow / Arc / Spiral / Grid

**Purpose:** Build line-based diagrams, arrows, arcs, spirals, rectangular grids and polar grids.

**Use:** Drag endpoints or bounds; set angles, turns, divisions, spacing and arrowheads in the inspector.

**Vector behavior:** Lines remain open paths; arrowheads are appearance attributes until converted to outlines. Grids/spirals retain parameters when possible.

#### K. Shape Builder

**Purpose:** Combine or remove selected vector regions by dragging across them.

**Use:** Select eligible shapes; activate Shape Builder; hover to highlight the current region; drag across regions to add/merge; use an explicit subtract mode/modifier to remove regions; click a region to act on it if click-to-apply is supported.

**Vector behavior:** Preview the resulting regions before commit. Preserve source geometry in an editable operation or retain an undoable original. Do not remove source objects before the operation validates.

**Add/subtract interaction:** A visible mode control must state `Add/Merge` or `Subtract/Remove`. A modifier may temporarily reverse the mode, but the current mode must be visibly indicated. Clicking empty space must not delete anything.

#### L. Eraser

**Purpose:** Remove portions of vector paths or regions.

**Use:** Drag across geometry. Offer clearly separated modes such as erase path segment, erase whole object, or erase filled region if supported.

**Vector behavior:** Split or trim geometry; preserve remaining valid subpaths. Preview the affected geometry and commit as one operation.

#### M. Scissors / Cut

**Purpose:** Split paths at selected points or where a cut line intersects them.

**Use:** Click a segment/anchor with Scissors to create a split; for Cut tool, draw a line across the target geometry.

**Vector behavior:** Produces open endpoints or separate subpaths as specified. Must not create invisible zero-length fragments or unexpectedly delete a segment.

#### N. Offset Path

**Purpose:** Expand or contract a path contour to create borders, insets, outlines or parallel paths.

**Use:** Enter an offset distance; preview outward/inward result; choose whether to replace or duplicate original; confirm or cancel.

**Vector behavior:** Generates new geometry. Preserve the source unless replace mode is explicitly selected. Define joins/corners and self-intersection handling.

#### O. Simplify / Smooth / Reshape

**Purpose:** Reduce unnecessary anchors, smooth irregular contours, or reshape a local path region.

**Use:** Adjust tolerance/smoothing; preview the result; confirm.

**Vector behavior:** Preserve the silhouette within tolerance; avoid topology changes unless requested; show before/after where helpful.

#### P. Variable Width / Width tool

**Purpose:** Create non-uniform stroke width along a path.

**Use:** Add width points along the stroke; drag handles to increase/decrease width; set width numerically.

**Vector behavior:** Store width profile along the path or create editable outline geometry where the rendering model requires it. Converting to outlines must be explicit.

#### Q. Rotate / Scale / Reflect / Shear / Free Transform

**Purpose:** Apply geometric transforms to selected objects or selected points.

**Use:** Drag handles, numeric controls or enter values in inspector. Use reference point/pivot controls to choose the transform origin.

**Vector behavior:** Transform matrix changes object placement/geometry according to the app's established model. Avoid applying transform twice (once to matrix and again to points).

#### R. Warp / Twirl / Pucker / Bloat / Wrinkle / Puppet Warp

**Purpose:** Advanced contour deformation.

**Use:** Apply a configurable brush or pins to the selected artwork; preview; confirm or cancel.

**Vector behavior:** Preserve editable geometry or retain a live effect. For complex deformation, make the cost and reversibility clear. Do not flatten to raster.

#### S. Gradient tool

**Purpose:** Create and edit gradient fills/strokes.

**Use:** Drag gradient axis/handles; select stops; change color, alpha and position; use inspector for exact values.

**Vector behavior:** Store gradient geometry and stops as appearance data, separate from base path geometry.

#### T. Eyedropper

**Purpose:** Sample color or supported appearance from artwork.

**Use:** Activate; hover to preview sample; click to apply. Provide a clear switch between sampling rendered pixel color and source object color when both are available.

**Vector behavior:** Changes only the active appearance property unless the user chooses a broader style-copy action.

#### U. Text / Type on Path / Area Text / Outline Text

**Purpose:** Create editable typography and text shaped by paths.

**Use:** Click for point text, drag area text box, select path for type-on-path; adjust typography and path placement in inspector.

**Vector behavior:** Text remains editable until explicit conversion to outlines. Outlined text becomes vector contours and loses ordinary text editing; warn before irreversible conversion.

#### V. Layers / Groups / Components / Symbols

**Purpose:** Organize artwork, preserve hierarchy and reuse design elements.

**Use:** Group/ungroup, reorder, rename, lock/hide, enter group, create component/symbol, edit master/source and manage instances/overrides.

**Vector behavior:** Child geometry stays intact. Moving a child between groups must preserve its visual position unless the user explicitly requests local-coordinate changes.

#### W. Align / Distribute / Arrange

**Purpose:** Align objects or selected anchors and manage stacking order.

**Use:** Choose alignment target (selection, key object, artboard); choose distribute centers/gaps; arrange front/back.

**Vector behavior:** Changes transforms/positions only; must not change dimensions unless the selected command is explicitly resize/distribute-spacing.

#### X. Mask / Clipping Mask / Compound Path

**Purpose:** Hide artwork outside a boundary, or make multiple contours behave as a single filled path.

**Use:** Select mask and content; create mask; enter mask editing to reposition content or mask; release mask to restore access to source artwork.

**Vector behavior:** Masking is non-destructive. Compound path uses an explicit fill rule (`nonzero`/`evenodd`) and preserves its contours.

#### Y. Blend / Repeat / Pattern / Objects on Path

**Purpose:** Generate intermediate shapes, repeated layouts, pattern fills or objects distributed along a path.

**Use:** Select source objects/path; specify steps, spacing, orientation and alignment; preview and commit.

**Vector behavior:** Prefer editable generated/repeat structures. Provide an explicit expand-to-independent-objects command.

#### Z. Image Trace / Perspective / Graph / Slice / Dimension tools

**Purpose:** Specialist workflows for raster-to-vector conversion, perspective construction, data graphs, export regions and measurement annotations.

**Use:** Provide contextual panels for trace thresholds, perspective plane selection, graph data, slice bounds and dimension settings.

**Vector behavior:** Trace creates editable paths; graphs retain data where feasible; dimensions remain annotations where supported; slices define output regions rather than modifying source artwork.

### 32.5 Double-click and enter/exit editing behavior

Double-click behavior must be consistent, discoverable, and context-aware. Do not use a single ambiguous double-click behavior for every object type.

| Current target | Single click | Double-click / Enter | Exit |
|---|---|---|---|
| Ordinary shape | Select whole shape | Enter vector edit mode or live-shape edit mode | Escape or click outside according to current app convention |
| Custom vector path | Select path | Show anchors, segments and handles | Escape/Enter or select another tool |
| Group | Select group | Enter group and allow child selection | Breadcrumb/back or Escape |
| Text object | Select text layer | Enter text-edit mode and place caret | Escape or click outside |
| Boolean group | Select combined result | Enter nested Boolean edit mode or expand source layers | Exit edit mode; retain Boolean operation |
| Gradient-filled object | Select object | If double-clicking the gradient control, enter gradient editing; object-body double-click still follows object type | Done/Escape |
| Component/symbol instance | Select instance | Enter instance editing only if supported; otherwise expose instance overrides | Return to parent context |
| Anchor point | Select point | Toggle point type only if pointer hit-test resolves specifically to anchor | Continue editing or exit vector mode |
| Empty canvas | Deselect or begin tool action | No destructive side effect | N/A |

Rules:

- Avoid relying on double-click alone; provide keyboard alternatives and a visible edit-mode indicator.
- Double-click timing must be configurable or use platform-standard thresholds.
- If the first click moves or selects an object, the second click must not accidentally duplicate, delete or commit a destructive operation.
- Nested editing must preserve selection context and provide a way back to the parent object.
- For touch/stylus, provide a context menu or explicit edit action because double-tap may be ambiguous.

### 32.6 Add, subtract, intersect and exclude: explicit operation semantics

The words **Add** and **Subtract** refer to different operations in different contexts. The UI must label the active context and avoid one generic plus/minus action that means something different in each tool.

#### A. Boolean operations on whole objects

- **Union:** combine filled areas into one composite result.
- **Subtract:** remove the areas of higher-order operand(s) from the designated base/lower object according to the documented stacking rule.
- **Intersect:** keep only the shared overlapping area.
- **Exclude / Difference:** remove the overlapping areas, retaining non-overlapping regions.
- **Add / Combine paths (non-Boolean):** place paths together in one container without calculating a Boolean union; preserve open paths and independent contours.

For Boolean operations, display a live preview, clearly show which layer is the base/operand, and retain source children in an editable Boolean group. Provide `Flatten/Expand` as explicit actions, not silent defaults.

#### B. Shape Builder region operations

- **Add/Merge mode:** drag through highlighted adjacent regions to combine them.
- **Subtract/Remove mode:** click or drag across highlighted regions to remove them from the result.
- The modifier key may temporarily switch modes, but must be shown in cursor/UI feedback and be configurable.
- Hover preview must indicate the exact region(s) that will be affected.
- An invalid/non-closed region must not be removed silently.

#### C. Path point insertion/deletion

- **Add anchor:** click a segment; split the segment while maintaining curve continuity as closely as possible.
- **Delete anchor:** remove the selected anchor and reconnect neighboring segments; preserve the remaining contour.
- **Remove segment:** split/open the path at a segment rather than deleting an entire object.
- **Delete object:** available only when whole-object selection is active or confirmed in context.

These actions must remain distinct. The Delete key must target the active editing context: selected anchors in vector mode, selected text/content where appropriate, or whole selected objects in object mode.

### 32.7 Pivot / transform origin / reference point

The pivot point is the reference origin used for rotation, scaling, reflection and some deformations. It is not necessarily an anchor point and must not change the object's actual geometry simply because the user moves it.

#### Required pivot behaviors

1. Display a pivot/reference-point control when transform mode is active.
2. Allow the user to drag the pivot to any valid point on or around the selected object's bounds.
3. Allow the pivot to snap to corners, edge centers, object center, selected anchor, guide, grid or a numeric coordinate.
4. Provide a nine-point reference selector (top-left, top-center, top-right, center-left, center, center-right, bottom-left, bottom-center, bottom-right) for bounding-box-based objects.
5. Support multi-selection pivot behavior: use a shared group bounding-box origin by default, with an explicit option to transform each object around its own origin.
6. Allow numeric pivot X/Y coordinates in document or object-local coordinates where supported.
7. Keep pivot position separate from object geometry and transform matrix semantics.
8. Define persistence: pivot should remain during the current transform session; whether it persists after deselection must follow a consistent app setting.
9. Reset pivot to object center or default reference point via an explicit command.
10. Show a live preview of the result before committing a transform.

#### Pivot use examples

- **Rotate around center:** circle or object rotates around its own center.
- **Rotate around a corner:** a door, arm or hinged component swings around the selected corner.
- **Scale from opposite corner:** the chosen pivot remains stationary while the object expands/contracts.
- **Reflect around custom axis:** mirror a shape around a line defined by a pivot/axis rather than its center.
- **Multi-object rotation:** rotate a group around a shared pivot, or rotate each object around its own origin when explicitly selected.

#### Pivot acceptance tests

- Moving pivot alone does not change geometry.
- Rotation around pivot keeps pivot fixed in canvas coordinates.
- Scaling around pivot keeps the pivot fixed and changes dimensions predictably.
- Reflection around an axis produces the expected mirrored placement.
- Changing pivot during a live transform updates the preview without adding multiple undo entries.
- Cancel restores both the original transform and original pivot state where appropriate.

### 32.8 Point types, handles and corner behavior

Support at least these point types:

- **Corner/Straight:** no automatic smoothness constraint; adjacent segments may form an angle.
- **Mirrored/Symmetric:** incoming and outgoing handles share angle and length.
- **Aligned/Mirror-angle:** handles share a tangent direction but can differ in length.
- **Independent/Disconnected:** incoming and outgoing handles can be adjusted independently.

Support handle length/angle numeric editing where practical, handle visibility toggles, converting between types, and corner radius/smoothing where geometry supports it.

#### Anchor editing behavior

- Drag anchor: move anchor and connected segments.
- Drag handle: alter curvature on its associated side; other handle responds according to point type.
- Modifier-drag: temporarily break handle coupling if supported and clearly indicated.
- Delete handle: convert that side to a sharp/straight condition without deleting the anchor unless the explicit command is Delete Anchor.
- Add point on segment: insert an anchor while preserving the existing curve as closely as mathematically possible.
- Double-click anchor: apply the documented point-type toggle, with a visible indicator.
- Select multiple anchors: move them together, align/distribute them, or change point type where valid.
- Move anchors with arrow keys: use configurable small/large nudges; respect axis constraints when requested.

#### Corner radius and smoothing

- Allow a global radius for compatible live shapes.
- Allow per-corner radii for compatible vector shapes.
- Support smoothing separately from radius; smoothing changes the corner transition profile rather than merely increasing radius.
- Handle invalid or self-intersecting corners gracefully and clamp/normalize only with clear feedback.
- Preserve per-corner values when switching selection and avoid flattening the shape unless necessary.

### 32.9 Color tools and appearance operations: complete coverage

The color subsystem must integrate with vector object styles, not exist as a disconnected picker.

#### Color picker

- Solid color, HEX, RGB, HSL, HSB/HSV and supported CSS syntax.
- Alpha/opacity, color profile awareness, input validation, copy/paste values.
- Recent colors, document colors, local styles, variables, shared libraries and AI suggestions clearly distinguished.
- Eyedropper with source-color vs rendered-pixel sampling where supported.
- Keyboard navigation and accessible contrast indicators.

#### Fill tools

- No fill, solid fill, linear/radial/angular/diamond gradient where supported, pattern fill, image fill, variable-bound fill.
- Multiple fills, visibility, ordering, opacity, blend mode and removal.
- Color variables and styles on supported fills and gradient stops.
- Preserve fill stack through copy/paste, duplication, import/export where format allows.

#### Stroke tools

- Add/remove one or more strokes.
- Color/variable/style, width, alignment/side where supported, caps, joins, miter limit, dash pattern, dash offset, arrowheads, opacity, blend mode.
- Gradient stroke where supported by renderer.
- Variable width profiles and brush appearance.
- Convert/outline stroke only by explicit action.

#### Gradients

- Create/edit stops, stop color, alpha, position, type, angle, geometry, spread/repeat behavior where supported, reverse, duplicate, save as style.
- On-canvas editing handles and numeric inspector values.
- Preserve gradient geometry when the object transforms according to chosen scaling behavior.
- Multi-selection must not silently replace different gradients unless the user confirms the intended replacement.

#### Color variables and styles

- Create, rename, group, search, apply, detach, update and delete variables/styles.
- Support semantic aliases and modes (light/dark/other configured themes).
- Detect unused variables, unresolved references and cyclic aliases.
- Bulk recolor selected objects with an explicit scope.
- Distinguish same raw color values from different semantic token references.
- Offer a safe migration from literal colors to tokens with preview and undo.

#### Color accessibility and AI

- Contrast calculation with documented assumptions and source/background context.
- Suggest alternatives without silently changing brand tokens.
- Preview all AI changes; explain the target properties and rationale.
- Require user approval for batch edits and keep them undoable.

### 32.10 Object geometry, rendering and document model requirements

Use the current project's data model if it already supports these concepts. The following is a logical capability model, not a mandate to replace the current schema.

#### Object types

- Primitive/live shapes: rectangle, rounded rectangle, ellipse, polygon, star, line, arc, spiral, grid.
- Path: open/closed path, line/cubic Bézier segments, anchors and handles.
- Vector network: connected paths that may branch or have multiple regions without a single linear path direction, if the renderer supports it.
- Compound path: multiple contours plus fill rule.
- Boolean group: ordered child operands plus operation semantics.
- Group/frame/container: child hierarchy, clipping and transform context.
- Text: editable text and typography properties.
- Image: placed raster content with transforms and crop metadata.
- Appearance resources: fill stack, stroke stack, effects, gradients, brushes and variable references.

#### Geometry constraints

- Keep document-space coordinates independent of screen zoom and device pixel ratio.
- Use stable object/anchor IDs; do not identify anchors by array index alone if reordering can invalidate references.
- Separate base geometry from transform, style, effect and rendering cache.
- Support local and global coordinate conversion explicitly.
- Keep the rendering preview derived from the model; do not treat rendered pixels as the source of truth for vectors.
- Validate finite coordinates, valid path references and supported fill rules.
- Preserve imported metadata and unsupported attributes where possible rather than silently dropping them.
- Use robust path operations for curves, self-intersections, holes, and stroke expansion.

#### History and persistence

- One logical gesture = one undo transaction.
- Undo restores geometry, styles, token references, hierarchy, visibility/lock state and pivot where applicable.
- Autosave/recovery must not serialize transient drag previews as committed document state.
- Reopen a document and confirm the same editable geometry and appearance.
- If a format cannot preserve a feature, warn and offer the closest valid export option.

### 32.11 Tool/context property inspector matrix

The inspector must be contextual, but it should preserve familiar placement and naming in the existing application.

| Selection/context | Inspector controls |
|---|---|
| No selection | Document settings, units, grid, guides, color profile where supported |
| One primitive | X/Y/W/H, rotation, pivot/reference point, shape-specific parameters, fill, stroke, effects, opacity |
| Vector path | Path closure, anchor count, selected point type, coordinates, handle values, fill rule, fill/stroke, simplify/offset |
| Selected anchors | Point coordinates, point type, handle constraints, radius/smoothing where applicable, align/distribute |
| Multiple objects | Shared transforms, alignment/distribution, shared fills/strokes, Selection colors, group/Boolean actions |
| Boolean group | Operation type, ordered operands, parent appearance, expand/flatten, child visibility/editing |
| Gradient editing | Type, stops, stop position/color/alpha, angle/geometry, variable/style binding |
| Text | Content, font, size, line height, letter spacing, alignment, fill/stroke, text-on-path options |
| Brush stroke | Brush type, width/profile, pressure, smoothing, outline/expand action |
| Mask | Mask source, content transform, clipping behavior, invert/release where supported |
| Locked/hidden object | Clear locked/hidden state and safe unlock/reveal actions; no accidental canvas edits |

### 32.12 Keyboard shortcut policy

Do not overwrite existing shortcuts without a conflict audit. Build a shortcut registry with platform-specific mappings and visible discoverability. Figma/Sketch shortcuts may be used as a reference but DesignForge AI's current mappings take precedence unless deliberately changed.

Required shortcut categories:

- Select/move, direct/vector edit, Pen, shape tools, text, hand/pan, zoom.
- Enter/exit vector edit mode, group entry/exit, select all points, next/previous anchor.
- Add/delete anchor, close/open path, join/split path, reverse path.
- Union/subtract/intersect/exclude/add-path, Shape Builder add/subtract mode.
- Undo/redo, duplicate, group/ungroup, front/back, lock/hide.
- Nudge and large nudge; constrain to axis/angle; toggle snapping/guides/grid.
- Temporary hand/eyedropper if supported.

Every shortcut must be testable and documented. Keyboard events should not be intercepted by the canvas when a text field, color value input or text-edit mode owns focus, except for explicitly global shortcuts such as undo when safe.

### 32.13 QA matrix and definition of done

A feature is complete only when its interaction, data model, rendering, history, persistence and error states work together.

#### P0 — Core editor reliability

- Select/move/resize/rotate objects; numeric transforms; multi-selection.
- Draw/edit paths; add/delete anchors; point types and handles; close/open/join paths.
- Live rectangle/ellipse/polygon/star parameters.
- Fill/stroke, HEX/RGB, opacity, eyedropper, undo/redo.
- Snap/grid/guides; layers/groups; SVG import/export baseline.
- Double-click/Enter edit-mode consistency and pivot behavior for standard transforms.

#### P1 — Professional vector workflows

- Boolean groups and source editing; Shape Builder add/subtract; Cut/Scissors/Eraser.
- Per-corner radius/smoothing; Offset Path and Simplify.
- Multiple fills/strokes; gradient editing; Selection colors; color variables/styles.
- Masks, compound paths, outline strokes/text, align/distribute points.
- Reliable persistence and keyboard shortcut conflict coverage.

#### P2 — Advanced illustration and design system

- Brush families, variable width, mesh gradients, advanced transforms/deformations.
- Pattern/repeat/objects-on-path; color modes and shared libraries; advanced export.
- Image Trace, perspective, graph/measurement tools where product scope requires them.
- Accessibility contrast checks and color-token migration previews.

#### P3 — AI-assisted creation

- Prompt-to-vector generation that returns editable paths/shapes.
- AI-assisted path cleanup, palette generation and semantic recoloring.
- Natural-language edits with a preview of all affected objects and properties.
- AI explanation of operations, uncertainty handling and user approval before applying batch edits.

#### Definition of done for each tool

- Tool has a documented purpose and supported object types.
- Toolbar/menu/context-menu entry is wired to a real action.
- Pointer and keyboard interactions are specified and implemented.
- Hover, active, disabled, invalid, preview, commit and cancel states exist as applicable.
- Geometry/style result matches the tool's documented semantics.
- Operation is undoable and redoable.
- Document saves/reopens without losing editability.
- Relevant unit, integration and regression tests pass.
- No unrelated behavior changed; existing functionality is regression-tested.
- Unsupported cases produce a clear message rather than a silent no-op or corrupt output.

### 32.14 Regression test scenarios that must never break

1. Open an existing project and design file; navigate between files; save and reopen.
2. Select/move/resize an existing object; verify no unrelated object changes.
3. Enter vector edit mode by double-click/Enter; edit a point; exit; verify object remains selected correctly.
4. Draw a path, cancel before commit, and verify no ghost object remains.
5. Insert a point into a curved segment and verify shape continuity.
6. Delete one point and verify remaining geometry is valid.
7. Apply Boolean Subtract and edit a source operand; verify the result updates non-destructively.
8. Change pivot and rotate; verify pivot remains fixed and geometry changes as expected.
9. Apply a color variable; update variable; verify only linked properties update.
10. Recolor a mixed selection; verify unrelated styles and token references remain unchanged.
11. Edit gradient stops; save/reopen; verify stops and geometry persist.
12. Undo/redo each operation and verify geometry, styles, hierarchy and selection context.
13. Export SVG and reopen/import it; compare geometry, fill, stroke, gradient and masks within supported format limits.
14. Use locked, hidden, nested, overlapping and partially transparent objects; verify hit testing is deterministic.
15. Test keyboard shortcuts while canvas, inspector inputs and text editing each have focus.

### 32.15 Recommended implementation workflow for the IDE agent

**Phase 0 — Audit only:** inspect the repo, map existing features, write a gap analysis and test baseline. Do not change code.

**Phase 1 — Interaction foundation:** normalize pointer gesture lifecycle, selection hit testing, editing modes, undo transactions, pivot model and shortcut registry, reusing existing services.

**Phase 2 — Core path geometry:** point types, handles, add/delete point, open/close/join/split, curve continuity and vector edit mode.

**Phase 3 — Shape construction and Boolean operations:** live shapes, add/subtract/intersect/exclude, Shape Builder, non-destructive child editing and explicit flatten/expand.

**Phase 4 — Appearance and color:** fill/stroke stacks, picker, eyedropper, gradients, Selection colors, variables/styles and theme modes.

**Phase 5 — Precision and organization:** snapping, guides, alignment/distribution, masks, compound paths, layer/group behavior, keyboard consistency.

**Phase 6 — Advanced tools:** offset/simplify, brushes, variable width, mesh, deformation, repeat/pattern, specialized tools as scope allows.

**Phase 7 — AI and polish:** prompt-to-vector, explainable batch edits, accessibility and design-token-aware recommendations.

At each phase: implement a thin vertical slice, add tests, run regression checks, document limitations and only then proceed. If the current codebase already implements a phase, do not rewrite it; validate it and move to the missing behavior.

### 32.16 Official reference documentation

Use these sources to verify terminology and interaction patterns; they do not override DesignForge AI's preservation contract or existing product architecture.

- Figma — Vector networks: https://help.figma.com/hc/en-us/articles/360040450213-Vector-networks
- Figma — Edit vector layers: https://help.figma.com/hc/en-us/articles/360039957634-Edit-vector-layers
- Figma — Boolean operations: https://help.figma.com/hc/en-us/articles/360039957534-Boolean-operations
- Figma — Corner radius and smoothing: https://help.figma.com/hc/en-us/articles/360050986854-Adjust-corner-radius-and-smoothing
- Figma — Stroke properties: https://help.figma.com/hc/en-us/articles/360049283914-Apply-and-adjust-stroke-properties
- Sketch — Vector editing: https://www.sketch.com/docs/designing/vector-editing/
- Sketch — Boolean operations: https://www.sketch.com/docs/designing/shapes/boolean-operations/
- Sketch — Color variables: https://www.sketch.com/docs/symbols-and-styles/color-variables/
- Sketch — General design documentation: https://www.sketch.com/docs/designing/

---

## 33. Final instruction to the IDE AI agent

Treat this Markdown file as a **requirements and roadmap specification**, not permission to rebuild the application. Start by auditing the existing repository and producing a feature gap matrix. Preserve current functionality, existing design language, data and project workflows. Implement missing behavior in small, tested increments. Keep editable vector geometry and color resources as first-class document data. Make destructive operations explicit. Ensure double-click, point editing, Add/Subtract, pivot transforms, fills/strokes and color variables have predictable and documented behavior. Do not mark any feature complete until its interaction, rendering, undo/redo, persistence and regression tests have been verified.



# Part. 2

# DesignForge AI — Application Launch, Workspace Navigation & Multi-Document Switching

**Document type:** Engineering requirements / implementation specification  
**Priority:** High  
**Primary objective:** Add a familiar, Figma-inspired application opening experience and multi-file navigation while preserving all existing DesignForge AI functionality.

---

## 1. Mission and non-negotiable constraint

Update the application shell and document-navigation experience so users can open DesignForge AI, find their work, open multiple design files, and switch between them efficiently.

**Do not regress, remove, replace, or unnecessarily refactor any existing functionality.** This is a navigation and document-session enhancement, not an editor rebuild.

The implementation agent must inspect the current codebase first and reuse existing architecture wherever possible. Do not assume a framework, router, state manager, file schema, persistence mechanism, or directory structure without verifying it.

### Existing functionality that must remain intact

Preserve all existing capabilities, including but not limited to:

- Design canvas, rendering, zoom, pan, pages, frames, and viewport behavior.
- Selection, multi-selection, movement, resizing, alignment, constraints, and transforms.
- Vector tools, paths, boolean operations, stroke, fill, gradients, and color controls.
- Text editing, typography, fonts, and text-related interactions.
- Layers panel, object hierarchy, ordering, grouping, and visibility/locking.
- Components, component instances, variants, assets, libraries, variables, and design tokens.
- Prototyping, connections, interactions, flows, and previews.
- AI design generation, contextual suggestions, and AI operations.
- Undo/redo, clipboard, keyboard shortcuts, and context menus.
- Import, export, save, autosave, recovery, and existing file formats.
- Collaboration, permissions, and sharing, if already implemented.
- Current visual language, UI components, design tokens, and interaction conventions.

Do not create duplicate implementations of existing capabilities.

## 2. Required implementation approach

Separate concerns while keeping the existing editor as the source of truth:

1. **Application shell:** global navigation, workspace header, Home, Projects, Recents, and account/workspace controls.
2. **Document navigation:** open-file tabs, file switcher, tab activation, and close behavior.
3. **Document session coordination:** associates each open document with its own state and asynchronous operations.
4. **Existing editor:** continues to own design editing, canvas behavior, and existing tools.
5. **Existing persistence layer:** remains responsible for saving/loading unless codebase inspection proves a small adapter is needed.

Use adapters or thin integration layers where possible. Do not rewrite the editor or persistence system simply to fit this design.

## 3. Application launch behavior

Implement these entry paths:

### 3.1 First-time user
- Open the workspace Home screen.
- Present a clear **New Design** action.
- Show useful onboarding or empty-state guidance without blocking access to the editor.

### 3.2 Returning user
- Open Home with recent files, projects, and drafts.
- Provide a **Continue Working** action for the last active document.
- Restore the last active document automatically only if this is consistent with the current product behavior and does not unexpectedly bypass required workspace or permission checks.

### 3.3 Direct file URL or internal file link
- Resolve the requested document ID and permissions.
- Load the requested document directly when authorized.
- Show a useful loading, missing-file, or permission-denied state.
- Never display a different document as if it were the requested one.

### 3.4 Reopening the application
- Restore workspace context and open-document tabs only when the existing persistence and product expectations support it.
- If session restoration is not currently supported, implement a safe, minimal version without changing existing document storage formats.
- A failed restoration must fall back to Home or a recovery state, not a blank or broken editor.

## 4. Workspace navigation

Provide these entry points, adapting names and locations to the existing UI:

- **Home:** workspace overview and recent work.
- **Projects:** existing project/folder hierarchy.
- **Recents:** recently opened files.
- **Shared:** shared documents, only if sharing already exists.
- **New Design:** calls the existing document-creation flow.
- **Quick File Switcher:** searchable overlay for quickly locating and opening files.

Navigation must not delete, reset, or silently close open documents. Returning to Home should not itself discard an editor session.

Do not invent backend features such as team management, sharing, cloud storage, or permissions if they do not already exist. If a required capability is absent, expose only the UI that can be supported and document the dependency.

## 5. Multi-document tab bar

Add a document tab bar within the editor shell.

Each open tab should:
- Refer to a stable, unique document ID—not a file name or list index.
- Display a readable file name, truncating long names safely.
- Indicate unsaved changes using the application's existing status conventions.
- Clearly distinguish the active document.
- Provide a close control that closes the tab only, not the underlying file.
- Support opening the same document only once per workspace session unless the existing product intentionally supports multiple views of one document.
- Preserve a usable layout with many tabs (for example, overflow/scrolling and an accessible way to find tabs).

Tab activation must switch the active document context without remounting or resetting unrelated global application services.

### New tab behavior
- The `+` action must call the existing New Design flow.
- Use the current document creation defaults and format.
- Do not create a separate, incompatible document schema.

### Close tab behavior
- If there are no unsaved changes, close the tab.
- If there are unsaved changes, use the existing save/recovery flow where available. Otherwise, present a clear Save / Don't Save / Cancel confirmation.
- **Cancel** leaves the document open and unchanged.
- **Save** closes only after persistence succeeds or the existing system confirms the changes are safely recoverable.
- **Don't Save** may discard edits only after explicit user confirmation and only if this is consistent with the product's existing recovery policy.
- If saving fails, keep the tab open and preserve the user's work.

## 6. Quick File Switcher

Implement a searchable overlay accessible from the UI and a keyboard shortcut.

Required behavior:
- Search by file name; include project/folder names or paths when available.
- Show useful file identity information so similarly named files can be distinguished.
- Display recent files first where useful.
- Selecting an already-open file activates its existing tab.
- Selecting a file that is not open resolves permissions and opens it in a new tab.
- Support keyboard navigation, Enter to open, and Escape to close.
- Provide loading, no-results, and error states.
- Do not fabricate search results or treat a failed lookup as a valid file.
- Reuse the existing search/API layer if one exists.

## 7. Keyboard shortcuts

Add shortcuts only after auditing the current shortcut registry. Preserve all existing editor shortcuts and avoid conflicts with vector, text, canvas, zoom, undo/redo, and prototype interactions.

Suggested defaults, subject to conflict review:

| Action | macOS | Windows/Linux |
|---|---|---|
| Quick File Switcher | `Cmd+P` | `Ctrl+P` |
| Next open tab | `Ctrl+Tab` | `Ctrl+Tab` |
| Previous open tab | `Ctrl+Shift+Tab` | `Ctrl+Shift+Tab` |
| Close active tab | `Cmd+W` | `Ctrl+W` |
| New Design | `Cmd+N` | `Ctrl+N` |
| Save active document | `Cmd+S` | `Ctrl+S` |

Rules:
- The existing shortcut registry is the source of truth.
- Do not bind a shortcut if it conflicts with a currently supported action.
- Reuse existing save and document-creation handlers.
- Handle browser and operating-system limitations honestly; do not promise interception of shortcuts the platform does not allow.
- Shortcut handling must respect text-editing fields and modal dialogs.

## 8. Document identity and session isolation

Every open document must have a stable ID. Use existing document types and session stores wherever possible; the following is conceptual only, not a requirement to replace current models:

```ts
type OpenDocument = {
  documentId: string;
  fileName: string;
  projectId?: string;
  status: "loading" | "ready" | "saving" | "error";
  isDirty: boolean;
  lastOpenedAt?: number;
};

type WorkspaceState = {
  openDocumentIds: string[];
  activeDocumentId: string | null;
};
```

Do not add a second source of truth for document state. If the current application already has equivalent types, extend or adapt them instead of duplicating them.

### State that must remain document-specific

Where supported by the current editor, keep the following isolated per document:
- Document content, layer hierarchy, vector geometry, and object IDs.
- Active page/frame, selection, viewport zoom and pan.
- Undo/redo history and pending operations.
- Document-local components, variables, styles, and design-token references.
- Prototype connections, interactions, flows, and preview state.
- AI requests and results that depend on a document or selection.
- Document-specific temporary editing state.
- Save status, revision/version, and persistence operations.

Global preferences such as theme and interface density may remain global. Do not move state between global and document scope without a code audit.

### Asynchronous safety
Every asynchronous operation that can update document state must be associated with the originating document ID and, where applicable, revision or operation token.

Examples include:
- Autosave and manual save.
- AI generation and AI recommendations.
- File loading and thumbnail generation.
- Asset or font loading that mutates document data.
- Background rendering or import operations.

A late response for Document A must never mutate Document B just because B became active while the request was pending. Use cancellation, request IDs, revision checks, or equivalent protections appropriate to the existing architecture.

## 9. Safe file-switching lifecycle

Use a controlled transition:

1. User requests a different document.
2. Resolve the target document identity.
3. If it is already open, activate its existing session.
4. If it is not open, check access and load/validate it through the existing loader.
5. Check the current document's dirty/pending state.
6. Save or safely preserve pending changes according to the existing persistence policy.
7. If saving or preservation fails, keep the current document active and show an actionable error.
8. Deactivate the previous document context without destroying recoverable state.
9. Activate the target document context.
10. Restore that document's supported viewport, selection, page, and editing state.
11. Verify the active document ID before rendering or accepting mutations.
12. Display the target document only after its state is ready.

The exact ordering may be adapted to the existing editor architecture, but the safety guarantees must remain.

## 10. Persistence and recovery

- Reuse existing load, save, autosave, and recovery services.
- Do not introduce a parallel persistence implementation.
- Never report a save as successful before the existing persistence layer confirms success.
- Keep dirty status accurate.
- Handle network failures, permission failures, conflicts, and invalid documents without crashing the app.
- If the application supports offline work, preserve its current offline behavior.
- Do not change file formats or backend schemas unless separately approved and justified.
- Keep recovery data tied to the correct document ID and revision.

## 11. Performance and resource management

- Keep the application shell mounted while switching documents where the architecture allows.
- Avoid reinitializing global services or expensive editor subsystems on every tab activation.
- Load unopened documents on demand.
- Use the existing rendering and caching strategy.
- If memory pressure requires unloading inactive document sessions, first persist or otherwise safely preserve all recoverable state, then restore it on activation.
- Prevent duplicate loads and stale render/save operations during rapid switching.
- Keep tab interactions responsive without compromising document integrity.

Do not add arbitrary tab limits or silently unload user work. If a limit is necessary, make it explicit and safe.

## 12. Error and empty states

Provide understandable, actionable states for:
- No recent files.
- File not found or deleted.
- Permission denied.
- File loading or validation failure.
- Save/autosave failure.
- Network or backend failure, where applicable.
- Conflicting or stale document revision.
- Failed session restoration.
- Empty search results.
- Unsaved changes when closing or leaving a document.

Error handling must not erase the user's current work or present a different file as the requested document.

## 13. Visual and interaction constraints

- Follow the existing DesignForge AI design system and UI styling.
- Reuse current components, tokens, icon library, spacing, typography, and interaction patterns.
- Do not redesign the canvas, toolbar, left/right panels, or properties UI as part of this task.
- The new tab bar and workspace screens must visually integrate with the existing application.
- Support the existing responsive behavior and accessibility conventions.
- Provide keyboard focus, visible focus states, meaningful accessible labels, and appropriate tooltips for icon-only controls.
- Do not add decorative UI that blocks core editing work.

## 14. Implementation plan

### Phase 0 — Mandatory codebase audit
Before editing, identify:
- Application entry point and current routing.
- Existing Home/dashboard or project-browser implementation.
- Document model and stable document identifiers.
- Editor mount/unmount lifecycle.
- State management and current active-document mechanism.
- Load/save/autosave/recovery services.
- Undo/redo and history ownership.
- AI request lifecycle and async mutation patterns.
- Keyboard shortcut registry.
- Existing UI components, tokens, and icon library.
- Relevant tests and current known limitations.

Produce a short map of existing modules and the smallest proposed changes. Do not start a broad refactor.

### Phase 1 — Shell and workspace navigation
- Add or adapt Home, Projects, Recents, and New Design entry points.
- Reuse current file and project APIs.
- Verify that returning to Home does not discard active sessions.

### Phase 2 — Tabs and document switching
- Add tab bar and stable document identity integration.
- Add active-tab switching and safe close behavior.
- Preserve per-document editor state and history.

### Phase 3 — Quick File Switcher and shortcuts
- Add searchable overlay and keyboard navigation.
- Integrate shortcuts through the existing registry.
- Resolve conflicts before enabling defaults.

### Phase 4 — Persistence, race safety, and recovery
- Validate dirty-state tracking and save failures.
- Guard async operations against stale document context.
- Verify recovery and rapid-switch behavior.

### Phase 5 — Regression and release
- Run existing tests before and after the changes.
- Add focused tests for navigation and multi-document behavior.
- Run the full relevant regression suite.
- Report any test that cannot be run and why; do not claim unexecuted tests passed.

## 15. Acceptance criteria

The work is complete only when all applicable criteria pass:

- [ ] App opens to the correct Home, restored workspace, or direct document route.
- [ ] Existing files open using the current loader and document format.
- [ ] Multiple files can remain open as tabs.
- [ ] Clicking a tab activates the correct document.
- [ ] Each document retains its own supported viewport, page, selection, history, and local editing state.
- [ ] Undo/redo in one document does not affect another.
- [ ] Switching does not silently discard unsaved changes.
- [ ] Save failure keeps recoverable work available.
- [ ] Quick File Switcher opens existing tabs or loads a new document correctly.
- [ ] Closing a tab does not delete the underlying file.
- [ ] Direct URLs and permission checks continue to work.
- [ ] Rapid switching cannot cause stale async results to mutate the wrong document.
- [ ] Existing shortcuts remain functional and conflicts are documented/resolved.
- [ ] Existing canvas, vector, text, layers, components, tokens, AI, prototype, import/export, and persistence features pass regression tests.
- [ ] The existing visual language remains intact.
- [ ] No duplicate editor engine, document model, persistence layer, or shortcut manager is introduced.
- [ ] No unrelated files or functionality are refactored without explicit justification.

## 16. Required implementation-agent response

Before making code changes, summarize:
1. The relevant existing modules and their responsibilities.
2. The current document lifecycle and persistence behavior.
3. The smallest safe implementation plan.
4. Any architectural gaps or risks discovered.

After implementation, report:
1. Files/modules changed and why.
2. Existing functionality preserved.
3. Tests executed and their actual results.
4. Known limitations or tests not run.
5. Any follow-up work requiring approval.

Do not claim that functionality is preserved solely because the code compiles. Verify it through relevant regression tests.

---

## Final directive

**Implement the smallest safe change that delivers the requested launch, workspace navigation, multi-file tabs, and file switching. Preserve DesignForge AI's current functionality, visual language, data model, and editor behavior. Audit first, reuse existing systems, isolate new navigation logic, and validate with regression tests. If a requirement conflicts with the current architecture, explain the conflict and propose a minimal solution rather than silently rewriting existing functionality.**

