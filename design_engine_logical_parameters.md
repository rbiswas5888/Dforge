# DesignForge — Design Engine Logical Parameters & Figma-Inspired Interaction Specification

**Expanded specification:** v2.0 addendum added 23 October 2026. Original sections 1–21 are preserved in full; new whole-app interaction, micro-interaction and production-prototyping requirements are appended in sections 22–44.

**Purpose:** Turn the Design workspace into a professional, direct-manipulation design editor with interaction quality comparable to Figma, while retaining DesignForge’s existing brand, application shell, and extensible AI architecture.

**Audience:** Product, UX, frontend, canvas/rendering, AI, QA, and platform engineering teams.

**Implementation principle:** Reproduce the *interaction model and workflow principles* users expect from a mature design editor; do not copy Figma branding, icons, proprietary assets, or exact visual styling. Preserve DesignForge’s established visual language outside the Design workspace.

---

**Navigation**

- [1. Non-negotiable product requirements](#1-non-negotiable-product-requirements)
- [2. Workspace layout and panel contract](#2-workspace-layout-and-panel-contract)
- [3. Document model and geometry parameters](#3-document-model-and-geometry-parameters)
- [4. Interaction state machine](#4-interaction-state-machine)
- [5. Object creation and drag-and-drop placement](#5-object-creation-and-drag-and-drop-placement)
- [6. Selection, hierarchy, and z-order rules](#6-selection-hierarchy-and-z-order-rules)
- [7. Snapping, smart guides, measurement, and alignment](#7-snapping-smart-guides-measurement-and-alignment)
- [8. Auto Layout and responsive behavior](#8-auto-layout-and-responsive-behavior)
- [9. Design properties and style engine](#9-design-properties-and-style-engine)
- [10. Components, variants, and design system](#10-components-variants-and-design-system)
- [11. Prototype and inspect integration](#11-prototype-and-inspect-integration)
- [12. Editing commands, undo/redo, and persistence](#12-editing-commands-undoredo-and-persistence)
- [13. AI enhancements — more advanced than a conventional editor](#13-ai-enhancements-more-advanced-than-a-conventional-editor)
- [14. Input handling and cross-platform shortcuts](#14-input-handling-and-cross-platform-shortcuts)
- [15. Performance, rendering, and precision](#15-performance-rendering-and-precision)
- [16. Accessibility and usability](#16-accessibility-and-usability)
- [17. Error handling and edge cases](#17-error-handling-and-edge-cases)
- [18. QA acceptance criteria](#18-qa-acceptance-criteria)
- [19. Recommended implementation sequence](#19-recommended-implementation-sequence)
- [20. Master implementation prompt for the coding agent](#20-master-implementation-prompt-for-the-coding-agent)
- [21. Reference material](#21-reference-material)
- [22. Product-wide interaction contract](#22-product-wide-interaction-contract)
- [23. Full interface anatomy and layout behavior](#23-full-interface-anatomy-and-layout-behavior)
- [24. Cross-surface synchronization matrix](#24-cross-surface-synchronization-matrix)
- [25. Detailed object/layer lifecycle](#25-detailed-objectlayer-lifecycle)
- [26. Micro-interaction design system](#26-micro-interaction-design-system)
- [27. Advanced design-engine interaction rules](#27-advanced-design-engine-interaction-rules)
- [28. Prototype experience: simple to start, powerful to master](#28-prototype-experience-simple-to-start-powerful-to-master)
- [29. Canonical prototype data model](#29-canonical-prototype-data-model)
- [30. Prototype inspector: full field-level interaction specification](#30-prototype-inspector-full-field-level-interaction-specification)
- [31. Wiring and flow-graph micro-interactions](#31-wiring-and-flow-graph-micro-interactions)
- [32. Animation and transition engine](#32-animation-and-transition-engine)
- [33. Overlays, dialogs, nested contexts and dismiss behavior](#33-overlays-dialogs-nested-contexts-and-dismiss-behavior)
- [34. Scrolling, fixed/sticky elements and nested viewports](#34-scrolling-fixedsticky-elements-and-nested-viewports)
- [35. Runtime variables, expressions, conditions and mock data](#35-runtime-variables-expressions-conditions-and-mock-data)
- [36. Realistic preview/player application](#36-realistic-previewplayer-application)
- [37. Prototype diagnostics, testing and coverage](#37-prototype-diagnostics-testing-and-coverage)
- [38. AI support across Design and Prototype](#38-ai-support-across-design-and-prototype)
- [39. Persistence, import/export and project compatibility](#39-persistence-importexport-and-project-compatibility)
- [40. Collaboration and concurrency rules (if collaboration is supported)](#40-collaboration-and-concurrency-rules-if-collaboration-is-supported)
- [41. Quality assurance matrix — required scenarios](#41-quality-assurance-matrix-required-scenarios)
- [42. Delivery phases and readiness gates](#42-delivery-phases-and-readiness-gates)
- [43. Final expanded master implementation prompt](#43-final-expanded-master-implementation-prompt)
- [44. Added official references for prototyping behavior](#44-added-official-references-for-prototyping-behavior)

## 1. Non-negotiable product requirements

1. The canvas is the source of truth for spatial editing. The Layers panel, canvas selection, breadcrumbs, and right inspector must all reflect the same document state.
2. Every visible control must work. No placeholder buttons, simulated drag-and-drop, fake property fields, or changes that only affect a preview.
3. All design mutations must update one canonical document model, be undoable/redoable, persist to the project, and render consistently.
4. Selecting an element on the canvas selects its corresponding layer. Selecting a layer selects and reveals its corresponding canvas object. Both routes must behave identically.
5. The right inspector is context-sensitive. It changes based on selection count, object type, edit mode, Design/Prototype/Inspect mode, and the capabilities of the current object.
6. Move, resize, rotate, reorder, align, distribute, group, frame, and layout changes must preserve children and relationships correctly.
7. Pointer interactions must be deterministic. Hover, press, drag, drop, release, escape, and modifier-key behavior must have defined outcomes.
8. Keyboard shortcuts must be platform-aware: macOS uses Command/Option; Windows and Linux use Ctrl/Alt where appropriate. Shortcuts must be discoverable, configurable where safe, and never fire while the user is typing into a text field.
9. The engine must handle large documents through viewport culling, incremental rendering, and indexed hit-testing rather than rerendering every object on every pointer move.
10. AI suggestions are non-destructive by default. The user previews proposed changes and explicitly applies them; normal drag-and-drop never invokes AI unexpectedly.

## 2. Workspace layout and panel contract

### 2.1 Overall workspace

Use a three-part editor layout beneath a persistent file/application header:

- **Left navigation/panel:** Pages, Layers, Assets/Components, and optional outline/design-system navigation.
- **Center canvas viewport:** Infinite or effectively unbounded workspace, frames/artboards, objects, selection affordances, rulers/guides, contextual canvas overlays.
- **Right properties inspector:** Contextual Design, Prototype, and Inspect/Dev properties.
- **Tool dock:** The app’s toolbar for select, frame, shapes, pen/vector, text, hand/pan, comments, resources, and other supported tools. Prefer the current Figma-like floating/bottom dock paradigm if it fits the existing application shell; if DesignForge already has a top toolbar, keep its visual placement but preserve the same tool behavior and discoverability.

The panel system must be resizable, collapsible, and persistent per workspace/user. Panel resizing may not change document geometry; it only changes the viewport’s available screen area.

### 2.2 Left panel

Provide clearly separated tabs or modes:

**Pages**
- Add, rename, duplicate, reorder, delete, and switch pages.
- The active page is visibly indicated.
- Deleting a page requires confirmation when it contains objects; offer undo.
- Page switching changes the visible page tree and canvas contents without resetting the user’s preferred zoom behavior unnecessarily.

**Layers**
- Hierarchical tree with an icon and name for each layer type: Section, Frame, Component Set, Component, Instance, Group, Text, Shape/Vector, Image/Video, Boolean/Union, Connector, and other supported nodes.
- Expand/collapse containers; search by name; rename inline; multi-select; drag to reorder and reparent; hide/show; lock/unlock; copy/paste; duplicate; delete; select parent/children; reveal selected layer in the tree.
- Hovering a row highlights the corresponding object on canvas. Hovering a canvas object can highlight its matching row without changing selection.
- Use clear drop indicators: an insertion line means reorder among siblings; an indented highlight means nest inside the target container; a no-entry indicator means the drop is invalid.
- Reordering in the layer tree changes z-order among siblings. Reparenting changes the parent and converts position coordinates while preserving visual placement.
- Hidden or locked state must be reflected both in the tree and canvas behavior. Hidden nodes are not hit-testable; locked nodes may be inspected/selected only through a deliberate layer-tree action or a lock override, but cannot be transformed normally.
- Tree changes must be virtualization-friendly for thousands of layers.

**Assets / Components**
- Search local and enabled library assets by name, category, tag, component description, and variant.
- Dragging an asset onto the canvas creates an instance or places the asset depending on asset type.
- Dragging a local component onto a frame inserts an instance under the target frame; the drop position is converted from viewport coordinates into the destination parent’s local coordinates.
- Provide grid/list view, asset preview, component metadata, variants, and missing/unavailable library states.
- Asset drag must show a preview ghost and a clear destination indicator before committing.

### 2.3 Center canvas

- The canvas is a viewport onto a document-space scene graph; it is not the document itself.
- Allow pan, zoom, fit-to-screen, zoom-to-selection, and zoom-to-100% without changing object coordinates.
- Draw only visible objects plus a small overscan region. Keep a separate overlay layer for selection outlines, handles, cursor previews, snap guides, distance measurements, prototype links, comments, and AI proposals.
- Empty-canvas click clears selection unless a modifier/tool explicitly says otherwise.
- Click selects the topmost eligible object under the pointer. Repeated click or a modifier drills into nested objects. Provide a contextual “Select layer”/overlap picker when many objects overlap.
- Dragging empty canvas with the selection tool begins marquee selection; dragging with Hand/Pan tool pans the viewport. Spacebar temporarily activates pan when not typing.
- Frame boundaries, clipping, masks, z-order, and hit-testing must agree with the renderer.
- Selection overlays are rendered in screen space so handle sizes stay usable at any zoom.

### 2.4 Right properties inspector

The inspector is contextual, compact, and composed of collapsible sections. Keep the selected layer name and type near the top. The visible sections depend on selection type.

**No selection:** page/canvas background, page-level styles/variables, layout guides, local assets/variables access, page export.

**Single selection:**
- Position and size (X, Y, W, H), rotation, corner radii where relevant, flip, alignment, resizing modes, clipping, constraints, and layout options.
- Object-specific properties: text/font/paragraph for text; fill/stroke/effects for shapes; crop/fit/opacity for images; vector/path controls for vector layers; component/variant/instance controls for components; frame/layout/grid controls for frames.
- Appearance: opacity, blend mode, fill, stroke, shadows/blur and supported effects.
- Export presets/settings for exportable nodes.

**Multiple selection:**
- Show common properties and mixed values; do not silently erase individual values because they differ.
- Alignment, distribution, group/frame/component actions, shared fill/stroke editing where supported, and bulk export.

**Prototype mode:** show trigger, action, destination, animation, delay, scroll behavior, overlay settings, starting points and flow settings relevant to selection.

**Inspect/Dev mode:** show read-only geometry/styles and implementation-oriented values such as CSS/layout information, design tokens, component metadata, and export/copy options. Do not silently permit edits in a read-only mode.

**Property editing rules:**
- Inputs accept precise values and support scrubbing where appropriate.
- `Enter` commits a field; `Escape` cancels the active edit; focus is retained sensibly after commit.
- Invalid values are rejected or normalized with clear feedback; never allow NaN, negative dimensions where unsupported, or corrupted geometry.
- Batch edits run as one logical undo transaction.
- A property update renders immediately and is saved through the same document update pipeline as a canvas gesture.

## 3. Document model and geometry parameters

Use a canonical scene graph independent of the UI framework. Suggested high-level model:

```ts
type NodeType =
  | 'page' | 'section' | 'frame' | 'group' | 'component' | 'componentSet'
  | 'instance' | 'text' | 'rect' | 'ellipse' | 'line' | 'polygon'
  | 'vector' | 'image' | 'video' | 'boolean' | 'connector' | 'comment';

interface Transform { x: number; y: number; rotation: number; scaleX: number; scaleY: number; }
interface Size { width: number; height: number; }
interface DesignNode {
  id: string;
  type: NodeType;
  name: string;
  parentId: string | null;
  childIds: string[];            // ordered back-to-front or front-to-back; define once globally
  transform: Transform;          // local to parent coordinate system
  size: Size;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode?: string;
  clipping?: boolean;
  constraints?: ConstraintConfig;
  layout?: LayoutConfig;
  style: StyleConfig;
  content?: unknown;             // type-specific payload
  componentRef?: string;
  instanceOverrides?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  revision: number;
}
```

The final schema can differ, but must preserve these concepts: stable node IDs, ordered hierarchy, local transforms, appearance, type-specific content, constraints/layout, component linkage, and revision/history metadata.

### 3.1 Coordinate spaces

Keep these spaces distinct:

1. **Screen space:** browser/app pixels.
2. **Viewport space:** canvas coordinates relative to the canvas viewport.
3. **Document/world space:** coordinates used by the canvas scene.
4. **Parent-local space:** coordinates relative to the immediate parent.

Maintain a camera transform `screen = viewportOrigin + zoom * (world - cameraOrigin)` or an equivalent matrix model. All conversions must go through shared functions:

- `screenToWorld(pointer)`
- `worldToScreen(point)`
- `worldToLocal(parentId, point)`
- `localToWorld(nodeId, point)`
- `getWorldTransform(nodeId)`
- `getWorldBounds(nodeId)`

Never add screen pixels directly to document X/Y. At any zoom level, a pointer drag of 100 screen pixels changes world position by `100 / zoom` (adjust for device-pixel ratio only in renderer backing-store logic, not in geometry semantics).

### 3.2 Transform composition

- A child’s world transform is the multiplication of its ancestor transforms and its own local transform.
- Moving a parent moves the rendered children without rewriting each child’s local X/Y.
- Moving a child changes its local transform relative to its parent.
- Reparenting must preserve world transform by default: calculate the child’s old world transform, calculate the inverse transform of the new parent, then derive the new local transform. If exact preservation is impossible due to unsupported skew/nonuniform-rotation combinations, either constrain the operation or warn; do not silently change appearance.
- Rotation handles and hit-testing must use transformed geometry, not only axis-aligned bounds.

### 3.3 Geometry invariants

- IDs are stable across renames, reorder, undo/redo, import/export and component updates.
- All dimensions are finite numeric design units; use one canonical unit system (recommended CSS-like logical pixels).
- A frame’s clipping setting controls whether children outside its bounds are visible and hit-testable.
- Child ordering is deterministic. Define whether the last child is topmost and apply it consistently in rendering, hit-testing, layer tree and export.
- Text layout bounds are not assumed to equal glyph bounds; image content bounds are not assumed to equal the image layer’s frame.

## 4. Interaction state machine

Implement interactions as explicit states, not loosely coupled pointer handlers.

Suggested states:

- `Idle`
- `Hovering(targetId?)`
- `Pressed(targetId, startPoint, modifiers)`
- `DraggingSelection(selectionIds, initialTransforms, startWorldPoint)`
- `ResizingSelection(selectionIds, handle, initialBounds, initialTransforms)`
- `RotatingSelection(selectionIds, pivot, initialAngles)`
- `MarqueeSelecting(startWorldPoint, currentWorldPoint, mode)`
- `Panning(startScreenPoint, initialCamera)`
- `DrawingShape(toolType, startWorldPoint, currentWorldPoint)`
- `DrawingVector(pathState)`
- `EditingText(nodeId, caret/selection)`
- `DraggingAsset(assetId, preview, dropTarget?)`
- `ReorderingLayers(nodeIds, insertionTarget)`
- `ConnectingPrototype(sourceId, endpoint, targetId?)`
- `ScrubbingProperty(propertyRef, startValue, startPointer)`

### 4.1 Pointer down / move / up

- Pointer down records the initial selection, target, coordinates, modifier keys and initial transforms; it must not yet mutate geometry unless the tool requires a click-to-create action.
- Start a drag only after a configurable movement threshold (e.g. 3–5 screen pixels) to prevent accidental movement on clicks. Make it accessible/configurable.
- During a transform gesture, compute every frame from the gesture’s initial state plus current pointer delta; do not repeatedly accumulate rounded deltas, which causes drift.
- Preview updates may be transient during drag; commit one undoable operation on pointer up.
- Pointer cancel, window blur, Escape, lost pointer capture and tool switch must safely terminate/cancel the active gesture according to its semantics and release pointer capture.
- Use pointer capture for active drags so the operation continues if the pointer leaves the object or viewport.
- A drop must be validated before mutation. Invalid targets show an explicit visual rejection and preserve the pre-drag document state.

### 4.2 Dragging a selected object

1. Hit-test the pointer against visible, unlocked, eligible nodes in z-order.
2. Apply selection semantics: plain click selects; Shift toggles/adds to selection; platform modifier may drill into nested content or select through a parent, depending on the app’s shortcut map.
3. On drag threshold, freeze the gesture’s initial selection and initial world transforms.
4. Convert current pointer to world coordinates; compute delta from pointer-down world position.
5. Apply delta to each selected root node only. If a selected node’s ancestor is also selected, do not transform that descendant a second time.
6. Run snapping and alignment evaluation against eligible guides/edges/centers without modifying the document until the drag commits.
7. Render live preview, measurement tooltips and guides.
8. On release, commit the resulting transforms as one undoable transaction. If the net delta is zero, produce no history entry.

### 4.3 Resizing

- Handles are screen-space hit targets large enough to use comfortably at any zoom (e.g. 8–10 CSS px minimum).
- Corner handles affect width and height; edge handles affect one dimension unless a modifier enables proportional resize.
- Define pivot behavior explicitly: ordinary resize uses the opposite handle as anchor; modifier key can resize from center; Shift can constrain aspect ratio when appropriate. Because conventions vary by tool/platform, document and make modifier behavior configurable.
- Minimum size depends on object type and must never become negative. For shapes, dimensions may have a lower limit; for text, resize mode governs whether bounds, font size or wrapping changes.
- Resizing a frame must recompute child positions/sizes according to layout mode and constraints.
- Resizing a child in Auto Layout must honor Fixed, Hug contents, Fill container, Min/Max sizing and Ignore Auto Layout/absolute-position behavior where supported.
- Do not use the parent frame’s axis-aligned bounds to calculate a rotated child’s resize unless the transform math explicitly accounts for rotation.

### 4.4 Rotation

- Rotation previews around the correct pivot and updates the rotation field live.
- Optional snapping to common angles (e.g. 15° increments) while a modifier is pressed.
- Multi-selection rotation rotates each selected object around a common group pivot while preserving each object’s relative position and individual rotation.
- Normalize stored angles to a consistent range for predictable comparisons; presentation can display equivalent values.

### 4.5 Marquee selection

- Dragging empty canvas creates a marquee in world space.
- Define two modes: fully-contained selection and intersecting selection; select via a modifier or configurable preference.
- Nested-object selection behavior must be deterministic. A modifier can target descendants instead of parent containers.
- Ignore hidden nodes; handle locked nodes according to selection rules.
- Shift adds/removes objects from the current selection according to the chosen selection model.

## 5. Object creation and drag-and-drop placement

### 5.1 Tool-driven drawing

- Choosing Frame, Rectangle, Ellipse, Line, Text, Pen/Vector, Image, or Connector enters a dedicated tool state.
- Click-to-create tools create an object at a documented default size or caret insertion point; click-drag tools create dimensions from the start/end points.
- Press Escape before commit to cancel. Press Escape after commit should exit the active tool or clear selection according to the standard editor pattern.
- Objects are inserted into the currently active/eligible parent context. Default: insert into the frame under the pointer when the drop point is inside that frame and it is an eligible parent; otherwise insert at the page root or active selected frame.
- When creating inside a frame, convert the pointer’s world coordinate to the frame’s local coordinate before storing X/Y.
- Creating a frame by dragging around existing objects offers a distinct “Frame selection” action; it must not accidentally reparent unrelated objects.

### 5.2 Asset and file drop

- Dropping an image/video/vector file onto the canvas creates a supported media node at the drop point. When dropped inside a frame, place it inside that frame.
- For an image: choose an explicit default fit mode (e.g. Fill/Cover or Fit/Contain based on user preference), preserve aspect ratio unless the user explicitly changes it, and offer crop controls.
- For SVG: preserve valid vectors as editable vector nodes when feasible; if unsupported features exist, fall back safely to an image and report the conversion.
- For multi-file drops, create a deterministic arrangement with consistent gaps and provide a placement preview before commit.
- External file drops must validate type, size, format and security. Do not execute embedded scripts or trust metadata from external files.

### 5.3 Dragging an asset from Assets panel

- Pointer down starts a drag preview, not an instance mutation.
- On canvas hover, highlight valid frame/parent destinations and display the insertion point.
- On release, instantiate the selected asset once and position it using world-to-local transforms.
- Dropping a component inside a component instance must not mutate the main component accidentally; show a clear warning or require an explicit detach/edit-main action if this is prohibited.
- Dropping into Auto Layout follows one consistent policy: insert at the nearest valid order position in the flow by default; modifier/setting can place as absolute/Ignore Auto Layout if supported.

### 5.4 Nesting and reparenting

- While moving an object, eligible containers highlight when the pointer enters their valid drop area.
- Define drop intent from pointer zone: **inside container** means reparent; **between siblings** means reorder; **outside any container** means remain with or move to page root only when explicitly allowed.
- If reparenting, preserve visual position using world-transform conversion. If the target uses Auto Layout, default to insertion in the flow and let layout compute position. Provide a clear indicator before releasing.
- Prevent cycles (a node cannot be dropped into itself or any descendant), illegal parent-child combinations, and invalid component relationships.
- If an object is dropped on a container boundary, use a stable tie-break rule (e.g. the interior region wins only when pointer is clearly inside; boundary pixels use insertion intent).

## 6. Selection, hierarchy, and z-order rules

- Maintain a single canonical ordered `selectionIds` set/list and a `primarySelectionId` for inspector focus.
- Selection can be initiated from canvas, layer tree, search results, assets references and breadcrumbs; all surfaces update together.
- Selecting a container highlights the container bounds. Child editing requires a direct click/drill-in or layer-tree selection; dragging a container moves its contents as one unit.
- Multi-select transformation operates only on selected hierarchy roots to avoid double movement.
- Grouping creates a new parent and preserves visual placement; ungrouping removes the parent and converts children back into the former parent’s coordinate system.
- Bring-to-front/send-to-back and step-forward/backward change sibling order without changing geometry or parent.
- When layers overlap, provide a “pick layer” menu (with type, name and parent) rather than forcing repeated blind clicks.
- Search results and keyboard navigation should scroll the layer panel to the matching item and reveal its ancestors.

## 7. Snapping, smart guides, measurement, and alignment

### 7.1 Snapping engine

Use a dedicated snapping service that compares candidate geometry against a spatial index. Candidate targets may include:

- Frame edges and centers
- Selected/unselected object edges and centers
- Equal gaps between neighboring objects
- Layout guides and ruler guides
- Grid lines and pixel grid (optional)
- Parent padding/inner edges
- Baselines for compatible text nodes (advanced)

Parameters:
- Snap threshold is expressed in **screen pixels**, not world units, so the interaction remains consistent at different zoom levels.
- Rank snap candidates deterministically by distance, candidate priority, axis, and stable node ID.
- Support independent horizontal and vertical snapping.
- Show smart guide lines, equal-gap indicators and distance labels in overlay space.
- Holding the designated bypass modifier temporarily disables snapping. The modifier is platform-aware and configurable.
- Snapping is a visual/temporary constraint during the gesture. Only the resulting geometry is persisted on commit.
- Avoid unstable “jitter” between nearly tied snap candidates; use hysteresis so the active snap remains until another candidate is meaningfully better.

### 7.2 Alignment and distribution

- Provide left, horizontal-center, right, top, vertical-center, bottom, distribute-horizontal, distribute-vertical and tidy/reflow actions.
- Define the reference bounds once: for alignment, use the primary selection or union bounds according to the selected command; for distribution, keep the outermost object positions fixed and evenly space the inner objects.
- Tidy-up may rearrange selected objects into a row, column or grid; always preview and allow undo.
- Uniform spacing may be edited using an inspector value and direct manipulation handles.
- Do not confuse spatial distribution (fixed positions on the canvas) with Auto Layout (flow-based reflow). Explain the difference through tooltips when helpful.

## 8. Auto Layout and responsive behavior

Treat Auto Layout as a first-class layout engine, not as a styling decoration.

### 8.1 Supported configuration

- Flow: vertical, horizontal, grid; extensible to wrap where supported.
- Gap: row and column gap; allow fixed gap and advanced spacing modes if needed.
- Padding: top/right/bottom/left with linked/unlinked controls.
- Alignment: primary-axis distribution and cross-axis alignment.
- Sizing per axis: Fixed, Hug contents, Fill container, Min/Max limits.
- Child behavior: participates in flow or Ignore Auto Layout/absolute positioning.
- Optional layout grids, clipping, and breakpoints/responsive previews.

### 8.2 Recalculation contract

When a node changes, recompute only the affected layout subtree in dependency order:
1. Update the changed content or constraints.
2. Measure intrinsic size of affected text/media/children.
3. Resolve child sizing modes and min/max limits.
4. Resolve container flow, wrapping/grid placement, gap and padding.
5. Resolve parent Hug contents dimensions.
6. Propagate resulting dimensions to ancestors as required.
7. Recompute world transforms and bounds for descendants.
8. Update render/hit-test/snap indexes for affected nodes only.

Avoid cycles: define valid dependency rules and surface an error state for unsupported circular sizing rather than repeatedly recalculating.

### 8.3 Convert existing layout to Auto Layout

- “Add Auto Layout” on a selection creates a frame around the selection (or adds layout to the selected frame) and infers the most likely direction based on relative positions.
- Show a preview of the inferred result where practical.
- Preserve the original visual arrangement as closely as possible; do not reorder items arbitrarily.
- Offer an optional “Suggest Auto Layout” action that identifies likely rows, columns, cards and grids. Suggestions are previews and require confirmation.

### 8.4 Constraints

For regular frames, support left/right/center, top/bottom/center, scale and stretch behaviors as relevant. For children participating in Auto Layout, use sizing and alignment rules rather than applying incompatible free-position constraints. If a node ignores Auto Layout, allow position/constraints within the parent. Keep this distinction explicit in the inspector.

## 9. Design properties and style engine

### 9.1 Appearance model

Support reusable and local values for:
- Fill: solid, gradient, image and supported patterns.
- Stroke: color, width, alignment, dash style, cap/join where relevant.
- Effects: shadow, blur and additional implemented effects.
- Opacity and blend mode.
- Corner radius: linked or per-corner.
- Color and typography tokens/variables.
- Component properties, variants and instance overrides.

All property values must have a typed schema. Shared styles/variables should be references rather than copied literal values where the user chooses to bind them.

### 9.2 Mixed selection

- When selected objects share a value, display the value normally.
- When values differ, show a mixed state. Typing a value explicitly applies it to every eligible selected node.
- If a property is not compatible across the selection, hide it or disable it with an explanation rather than applying a lossy conversion.

### 9.3 Typography

- Inline text editing must support caret movement, selection, copy/paste, font family, weight, size, line height, letter spacing, alignment, decoration, list controls as implemented, and text resizing behavior.
- Do not let global canvas shortcuts trigger while a text input/editor has focus, except explicit editor-level shortcuts.
- Changing a font must handle unavailable fonts gracefully and render a consistent fallback while preserving the intended family reference.
- Text node measurement changes must trigger Auto Layout recalculation and update bounds/indexes.

## 10. Components, variants, and design system

- Any supported object or selection can become a main component.
- Instances reference the main component and store only explicit overrides; do not fork a full independent copy unless detached.
- Editing the main component propagates to instances, except for overridden properties/children.
- Support variants and typed component properties (e.g. text, boolean, instance swap, variant selection).
- Maintain clear visual distinction for main component, component set, and instance in canvas and Layers panel.
- Support local libraries, optional shared libraries, component search, descriptions, change propagation and stale/missing-library states.
- Variables should support typed collections (color, number, string, boolean where supported), modes (e.g. light/dark), aliases/references and safe renaming.
- Token-to-code mapping must retain stable names and export predictable values.
- Add a design-system validation service for color, type, spacing, corner-radius and component consistency; violations should be explainable and opt-in to auto-fix.

## 11. Prototype and inspect integration

### Prototype mode
- Let an object connect to a destination frame or object when supported.
- Configure trigger, action, destination, animation, delay, overlay, scroll behavior and flow starting point.
- Draw connections in a dedicated overlay. Connection lines must not participate in normal hit-testing unless the Prototype mode is active.
- Preview the flow in a presentation/player surface without mutating design objects.
- Validate broken destinations and unreachable screens; never silently remove prototype links when frames are renamed or moved.

### Inspect/Dev mode
- Expose dimensions, positions, colors, typography, effects, variables, component identity and export information.
- Provide code snippets for supported targets (e.g. CSS/React/native formats) only when values are grounded in the document model.
- Clearly distinguish illustrative code from production-ready code.
- Respect read-only permissions if collaboration/roles exist.

## 12. Editing commands, undo/redo, and persistence

All mutations go through a command/transaction layer. Suggested commands include:

- `CreateNode`, `DeleteNodes`, `RenameNode`, `SetNodeProperty`
- `MoveNodes`, `ResizeNodes`, `RotateNodes`
- `ReparentNodes`, `ReorderSiblings`, `GroupNodes`, `UngroupNodes`
- `AlignNodes`, `DistributeNodes`, `TidyNodes`
- `SetAutoLayout`, `UpdateLayoutConfig`, `SetConstraints`
- `CreateComponent`, `CreateInstance`, `UpdateComponent`, `DetachInstance`
- `AddPrototypeConnection`, `UpdatePrototypeConnection`
- `CreatePage`, `DuplicatePage`, `DeletePage`

Requirements:
- Each user-level gesture creates one atomic transaction when committed.
- Undo restores geometry, hierarchy, styles, component overrides, and relevant selection when practical.
- Redo reapplies the transaction deterministically.
- Text keystrokes can be batched into sensible undo chunks; do not make each individual character a separate history entry unless the product explicitly chooses that behavior.
- Autosave uses a revision-aware change queue and indicates saving/saved/error states.
- A save failure must not discard unsaved local edits. Retry and recovery are required.
- Serialization/import/export preserves stable IDs, child order, transforms, assets references, variables, component links, fonts and prototype links where supported.

## 13. AI enhancements — more advanced than a conventional editor

AI capabilities should layer onto the deterministic design engine, not bypass it.

### 13.1 AI command bar

Natural-language commands such as:
- “Align these cards to an 8 px gap.”
- “Make this frame responsive on tablet and desktop.”
- “Convert the selected form into vertical Auto Layout.”
- “Find components that do not use our spacing tokens.”
- “Create three layout alternatives without changing the current design.”

AI flow:
1. Parse the request into a typed action plan.
2. Resolve target nodes and design-system references.
3. Check capability, constraints and ambiguity.
4. Build a preview diff (before/after) and explain likely consequences.
5. Ask for clarification only when target or effect is materially ambiguous; otherwise make a safe proposal.
6. Apply only after confirmation, except for explicitly enabled low-risk commands.
7. Commit as one undoable command transaction and record provenance.

### 13.2 Context-aware design copilot
- Use current selection, layer tree, variable/style libraries, layout structure, viewport context and user prompt as grounded context.
- Suggest object names, hierarchy cleanup, component extraction, layout conversion, accessibility improvements and responsive behavior.
- Keep content generation separate from geometry mutation. Generating copy should not move objects unless requested or required by a previewed reflow.
- Never hallucinate that an unavailable font, component or library item exists. Clearly report missing capabilities.

### 13.3 AI layout inference
- Detect rows, columns, card grids, repeated gaps, alignment lines, likely parent-child relationships and responsive patterns.
- Score each inference by confidence; show low-confidence cases as suggestions.
- Preview inferred Auto Layout/group/frame structure. Confirm before reparenting or changing sizing modes.
- Preserve screenshot/pixel-like fidelity when the user selects “preserve current appearance”; use semantic layout only when the user selects a responsive/structured goal.

### 13.4 AI design-system guardian
- Check variables, typography, colors, spacing, contrast, component variants, naming and inconsistent radius/shadow usage.
- Show issues with layer links and actionable fixes.
- Fix one issue, selected issues or the whole page, with a preview diff and undo support.
- Do not overwrite locally intentional exceptions without flagging them.

### 13.5 AI-assisted prototyping
- Suggest plausible flow links based on names, interaction cues and matching component patterns.
- Identify missing destinations and dead ends.
- Keep suggestions separate from confirmed prototype wires.
- Provide an interactive preview of suggested behavior before accepting it.

## 14. Input handling and cross-platform shortcuts

Implement a shortcut registry rather than hardcoding key handling into individual components.

- Translate physical/logical keys through a platform abstraction (macOS vs Windows/Linux).
- Use a central dispatch order: text editing/input focus → active modal/menu → active drawing/edit tool → canvas command → application command.
- Never execute a canvas shortcut while typing into an input, textarea, code editor, or text layer unless it is an intentional editor shortcut.
- Show shortcut hints in tooltips and command search.
- Support command search for every major action.
- Include Escape behavior for canceling the current operation, closing transient UI, exiting text/vector edit mode and clearing selection in a predictable hierarchy.
- Include arrow-key nudges and larger modifier nudges; units should be document units and independent of zoom.
- Provide settings to customize conflicting shortcuts without breaking platform defaults.

**Initial shortcut targets (verify conflicts in the product before finalizing):**

| Action | Suggested shortcut |
|---|---|
| Select/move | V |
| Frame tool | F |
| Rectangle | R |
| Text | T |
| Pen/vector | P |
| Hand/pan | H; Space temporarily pans |
| Group selection | Cmd/Ctrl + G |
| Ungroup | Shift + Cmd/Ctrl + G |
| Duplicate | Cmd/Ctrl + D |
| Undo / Redo | Cmd/Ctrl + Z / Shift + Cmd/Ctrl + Z (platform-aware variant) |
| Auto Layout | Shift + A |
| Create component | Option/Alt + Cmd/Ctrl + K |
| Zoom to fit | Shift + 1 |
| Zoom to selection | Shift + 2 |
| Show shortcuts | platform shortcut displayed in Help/Actions |

This is a starter map, not a claim that every shortcut matches every current Figma version. Ship a searchable shortcut reference and ensure shortcuts are consistent inside DesignForge.

## 15. Performance, rendering, and precision

- Use an efficient scene graph with stable node IDs and incremental updates.
- Use spatial indexes (e.g. R-tree/quadtree or equivalent) for hit-testing, snapping and viewport queries.
- Virtualize the Layers panel and large asset lists.
- Separate static scene rendering from dynamic overlays such as selection handles and guides.
- Keep input latency low during drag; coalesce pointer movement to animation frames and avoid expensive document serialization during each pointer event.
- Use transient gesture state while moving/resizing; commit canonical model changes at the end of the gesture.
- Avoid floating-point drift: keep full-precision numbers internally, round only for presentation/export when required.
- Provide deterministic geometry across high-DPI displays and browsers.
- Add performance test documents with thousands of nodes, deep nesting and multiple selected objects.

## 16. Accessibility and usability

- All toolbar, panel and property controls are keyboard reachable and have accessible names.
- Use visible focus indicators and sufficient contrast.
- Make drag operations available through keyboard alternatives where practical (nudge, reorder commands, alignment commands, move-to-parent menus).
- Announce selection count, active tool, operation completion/cancel and key errors to assistive technology.
- Do not encode state by color alone; pair highlights with line styles, labels or icons.
- Keep handle hit areas usable regardless of zoom.

## 17. Error handling and edge cases

Test explicitly:
- Drop into self or descendant: reject without mutation.
- Drag from canvas outside app/window and release: operation completes or cancels safely according to pointer-capture rules.
- Delete selected parent and child simultaneously: delete the hierarchy once, not twice.
- Move parent and selected descendant together: transform each hierarchy root once.
- Hide or lock a selected object during a multi-step operation: cancel or reconcile selection deterministically.
- Undo/redo after reparent, group/ungroup, Auto Layout, component propagation and multi-property edits.
- Auto Layout containing long text, images, hidden nodes, absolute-position children and min/max sizing.
- Rotated objects with snapping, resize handles, multi-select and reparenting.
- Zero-size or very small objects, empty frames, missing fonts, unresolved assets and unsupported SVG features.
- Zoom extremes, browser resize, panel collapse/expand and device-pixel-ratio changes.
- Save failure while a gesture is in progress or queued changes are pending.
- Read-only state, permission changes and collaborative edits if multiplayer support exists.

## 18. QA acceptance criteria

The Design Engine is not complete until all of these pass:

1. Canvas selection and Layer-tree selection remain synchronized for every node type.
2. Dragging at 25%, 100% and 400% zoom produces the same intended document-space displacement.
3. Moving a parent preserves child-local coordinates and moves its descendants visually as expected.
4. Reparenting a node between differently transformed parents preserves its visible world position unless Auto Layout intentionally reflows it.
5. Dropping a local component creates a valid instance, never a duplicate main component.
6. Snap lines appear within the configured screen-space threshold and do not cause jitter.
7. Escape, pointer cancellation and window blur do not leave ghost objects, stale guides, stuck handles or lost pointer capture.
8. A click without a real drag does not move the object or create an undo item.
9. One drag gesture equals one undoable transaction; undo and redo restore geometry and hierarchy exactly.
10. Mixed property values are represented accurately in multi-selection.
11. Auto Layout changes propagate through affected ancestors without infinite layout loops.
12. Hidden nodes are not drawn or hit-tested; locked nodes follow the defined selection policy.
13. Text editing suppresses unrelated global shortcuts.
14. Saving/importing/exporting a project preserves structure, transforms, appearance and supported references.
15. AI changes always provide a preview/confirmation path and one-click undo.
16. At least one performance benchmark verifies acceptable drag response for a large test page.

## 19. Recommended implementation sequence

### Phase 1 — Interaction foundation
- Canonical scene graph, coordinate conversions, viewport camera.
- Selection, hit-testing, transform handles, drag, resize, rotate, pan/zoom.
- Synchronized Layers panel, show/hide/lock, z-order, undo/redo.

### Phase 2 — Creation and inspector
- Frame/shape/text/image tools, type-aware inspector, snapping/guides, alignment/distribution.
- Working serialization, autosave, import/export and shortcut registry.

### Phase 3 — Layout and reusable design systems
- Auto Layout, constraints, min/max sizing, components/instances/variants, variables/styles.
- Multi-selection mixed properties and asset drag-and-drop.

### Phase 4 — Prototyping and inspect
- Connections, transitions, preview player, inspect values and code handoff.

### Phase 5 — Advanced AI and scale
- AI command plans and previews, layout inference, design-system guardian, responsive suggestions.
- Spatial indexing, rendering optimization, accessibility, collaboration/conflict handling.

Do not build the AI layer on top of broken drag/selection behavior. The interaction foundation must be stable first.

## 20. Master implementation prompt for the coding agent

> **Act as the principal engineer for DesignForge’s Design Engine.** Inspect the existing repository, architecture, state management, renderer, styling, file format, and interaction code before changing anything. Preserve the application’s existing branding and overall UI style. Implement a Figma-grade direct-manipulation design workspace using the requirements in this specification.
>
> Start by mapping the current implementation against the requirements. Produce a concise gap report that identifies what already works, what is incomplete, and which files/modules should change. Then implement in vertical slices with working tests; do not replace working architecture unnecessarily and do not create a mock-only interface.
>
> Establish one canonical scene graph and command/transaction pipeline. Build shared coordinate transforms and hit-testing before adding drag, resize, rotate, snap, reparent and Auto Layout behavior. Keep the Layers panel, canvas, inspector, assets, prototype connections and persistence synchronized through the same document model. Make every mutation undoable and saveable.
>
> Implement explicit pointer interaction states, pointer capture, drag thresholds, live previews, cancellation, valid drop-target feedback, screen-space snap thresholds and world-to-parent-local conversion. Prevent hierarchy cycles, double-transforming descendants, coordinate drift, invalid parent-child relationships and unintended main-component edits.
>
> The left panel must support pages, hierarchical layers and reusable assets/components. The center canvas must support reliable selection, drawing, movement, resizing, rotation, zoom, pan, marquee selection, guides and contextual overlays. The right inspector must be context-sensitive and fully functional for single and multi-selection, with distinct Design, Prototype and Inspect/Dev modes.
>
> Implement real Auto Layout and constraints as layout logic, not CSS-like labels. Recompute only affected layout subtrees. Implement component/instance overrides and variables with typed data. Add prototype connections and inspect/code-handoff behavior only after core editing is stable.
>
> Add AI exclusively through typed action plans, grounded document context, before/after previews, validation and explicit confirmation for structural or visual changes. AI must never silently reposition, rename, reparent, restyle or restructure a user’s design. Every accepted AI change must be a normal undoable transaction.
>
> Verify all behavior on macOS, Windows and Linux shortcut mappings, and ensure text fields/editors suppress unrelated canvas shortcuts. Add automated tests for coordinate conversion at multiple zoom levels, selection synchronization, drag/drop/reparenting, nested transforms, snapping, layout recalculation, undo/redo, serialization, and cancellation/error cases. Do not mark a requirement complete merely because its button is visible; demonstrate that its state mutation, rendering, persistence, keyboard behavior and error handling all work.
>
> Deliver: (1) an architecture/gap report, (2) a phased implementation plan, (3) working implementation, (4) tests and test results, (5) updated shortcut/help reference, and (6) a remaining-gaps list. If an existing architectural limitation prevents exact behavior, explain it and implement the closest safe equivalent rather than faking functionality.

## 21. Reference material

The interaction and layout principles above are grounded primarily in Figma’s public help documentation, supplemented by the tutorial links supplied for this task. The editor changes over time, so treat this document as a behavioral specification and verify exact shortcuts/labels against the version being studied.

### User-provided YouTube tutorials
- https://www.youtube.com/watch?v=3m0TXas0Vjw
- https://www.youtube.com/watch?v=1SNZRCVNizg — page title surfaced as “Free Figma Crash Course for Beginners 2026”
- https://www.youtube.com/watch?v=WqWldGvZdNw
- https://www.youtube.com/watch?v=mT_Jjn8RJdo — page title surfaced as “Learn Figma in 6 Hours – Full Course for 2026”
- https://www.youtube.com/watch?v=lsgVRCJ4fko
- https://www.youtube.com/watch?v=Vjw47lNNbeA
- https://www.youtube.com/watch?v=L-tpK7Eeuow — advanced variables/design-system workflow reference
- https://www.youtube.com/watch?v=opTANvl9G1g&t=4488s — design-system course reference
- https://www.youtube.com/playlist?list=PLXDU_eVOJTx5IuSrbtanZHnDuPB3Hx0hq
- https://www.youtube.com/watch?v=Od7AfBvBwWo — page title surfaced as “Free Figma Advanced Course: Become a Figma Pro!”

**Access note:** YouTube’s pages did not expose complete transcripts for every provided link during this review. The specification does not claim a full transcript-level analysis of every video; it uses the supplied tutorials as learning references and verifies core editor behavior against the official documentation below.

### Official Figma documentation
- Right properties panel, Design and Prototype modes: https://help.figma.com/hc/en-us/articles/360039832014-Design-prototype-and-explore-layer-properties-in-the-right-sidebar
- Left navigation and panel: https://help.figma.com/hc/en-us/articles/360039831974-Explore-the-navigation-bar-and-left-sidebar
- Explore files and layer hierarchy: https://help.figma.com/hc/en-us/articles/15297425105303-Explore-design-files
- Select layers and objects: https://help.figma.com/hc/en-us/articles/360040449873-Select-layers-and-objects
- Frames: https://help.figma.com/hc/en-us/articles/360041539473-Frames-in-Figma-Design
- Auto Layout: https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout-in-Figma
- Constraints: https://help.figma.com/hc/en-us/articles/360039957734-Apply-constraints-to-define-how-layers-resize
- Smart selection: https://help.figma.com/hc/en-us/articles/360040450233-Arrange-layers-with-Smart-selection
- Position, dimensions, alignment and distribution: https://help.figma.com/hc/en-us/articles/360039956914-Adjust-alignment-rotation-position-and-dimensions
- Keyboard controls: https://help.figma.com/hc/en-us/articles/360040328653-Use-Figma-products-with-a-keyboard
- Components: https://help.figma.com/hc/en-us/articles/360038663154-Create-components-to-reuse-in-designs
- Vector editing: https://help.figma.com/hc/en-us/articles/360039957634-Edit-vector-layers
- Variables and modes: https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables/

---

**Definition of done:** A designer can create an object, select it from either canvas or layer tree, drag it, snap it, nest it, change its properties, apply layout rules, turn it into a reusable component, prototype it, undo/redo the entire workflow, save/reopen the file, and observe consistent behavior across all editor surfaces—with AI available as a controlled accelerator rather than a source of unpredictable changes.

# Expanded Addendum v2.0 — Whole-Application Interaction Contract, Micro-interactions, and Production-Grade Prototyping

**Revision date:** 23 October 2026  
**Relationship to the base specification:** This addendum extends sections 1–21 above. The entire original specification remains part of this document and must be treated as binding. If this addendum adds specificity, use the more detailed rule; if a conflict is discovered, report it in the implementation gap report instead of silently choosing an interpretation.

## 22. Product-wide interaction contract

### 22.1 One application, multiple synchronized surfaces

DesignForge must behave as one coherent editor, not a collection of separate tools that happen to share a screen. Every surface reads from the same canonical document and uses the same command pipeline:

- **Document model:** pages, nodes, parent-child relationships, transforms, layout, styles, components, variables, assets, prototype definitions, and metadata.
- **Editor-session state:** current page, viewport camera, active tool, current selection, open panel/tab, expanded layer rows, hover target, active modal, active text editor, temporary drag preview, and active gesture.
- **Prototype-authoring state:** selected prototype node/connection, current flow, connection draft, open interaction editor, highlighted path, validation results, and prototype panel filters.
- **Prototype-runtime state:** variable values, component state, overlay stack, current frame, back stack, scroll offsets, focused element, timers, media position, form input, and transient animation progress.
- **Persistence state:** current revision, last saved revision, pending operations, save status, conflict state, recovery snapshot, and export status.
- **Collaboration state, if enabled:** remote presence, remote selections, incoming document operations, permissions, conflict indicators, and comment anchors.
- **AI task state:** request, context snapshot, parsed plan, target IDs, preview diff, confidence, validation messages, approval status, and applied transaction ID.

Never store the same authoritative value independently in multiple UI components. For example, do not keep one selected node ID in the canvas, another in the layer tree and a third in the inspector. Store selection once and let all surfaces subscribe to it.

### 22.2 Interaction lifecycle

Every user interaction must follow a recognizable lifecycle:

1. **Intent:** identify the control, tool, target, trigger, keyboard modifiers, and current permissions.
2. **Preflight:** validate target type, active mode, locks, constraints, destination validity and whether the action is allowed.
3. **Preview:** show a reversible preview for spatial changes, layout inference, prototype wiring, AI proposals, destructive changes, or expensive operations.
4. **Commit:** submit a typed command or transaction to the canonical state layer.
5. **Recompute:** update derived layout, world transforms, bounds, selection indexes, snapping indexes, component instances, prototype graph checks and other dependencies.
6. **Render:** update the canvas and all affected panels from the new revision.
7. **Persist:** queue the revision for autosave; show saving/saved/error state accurately.
8. **Feedback:** provide the smallest useful response, such as a changed field, toast, guide, checkmark, validation message or undo affordance.
9. **Recover:** if the operation fails, leave the last valid model intact, explain the problem and preserve the user's work.

Pointer-move previews are transient session state, not dozens of committed document mutations. A successful drag usually becomes one document transaction. Hover and focus usually do not create document history entries.

### 22.3 Typed event contract

Use a centralized event/command vocabulary. These are conceptual event names; adapt syntax to the app's state architecture while preserving semantics.

**Session events:** `ActivePageChanged`, `SelectionChanged`, `PrimarySelectionChanged`, `ActiveToolChanged`, `EditorModeChanged`, `ViewportChanged`, `PanelVisibilityChanged`, `PanelWidthChanged`, `HoverTargetChanged`, `ContextMenuOpened`, `ContextMenuClosed`, `ModalOpened`, `ModalClosed`.

**Document commands:** `CreateNode`, `DeleteNodes`, `RenameNode`, `SetProperties`, `MoveNodes`, `ResizeNodes`, `RotateNodes`, `ReparentNodes`, `ReorderNodes`, `GroupNodes`, `UngroupNodes`, `SetVisibility`, `SetLock`, `SetStyle`, `SetLayout`, `CreateComponent`, `UpdateComponent`, `CreateInstance`, `SetVariable`, `AddPrototypeFlow`, `AddPrototypeInteraction`, `UpdatePrototypeInteraction`, `DeletePrototypeInteraction`.

**Derived events:** `LayoutRecomputed`, `WorldBoundsChanged`, `SpatialIndexUpdated`, `PrototypeGraphChanged`, `ValidationCompleted`, `ComponentInstancesUpdated`, `AssetResolved`, `DocumentRevisionChanged`.

**Persistence events:** `SaveQueued`, `SaveStarted`, `SaveSucceeded`, `SaveFailed`, `RecoverySnapshotCreated`, `ImportStarted`, `ImportCompleted`, `ExportStarted`, `ExportCompleted`, `ExportFailed`.

**Prototype runtime events:** `PrototypeStarted`, `PrototypeStopped`, `PrototypeReset`, `PrototypeTriggerFired`, `PrototypeActionStarted`, `PrototypeActionCompleted`, `PrototypeActionFailed`, `VariableChanged`, `OverlayOpened`, `OverlayClosed`, `FrameEntered`, `FrameExited`, `ScrollChanged`, `MediaStateChanged`, `ValidationWarningRaised`.

**AI events:** `AIPlanRequested`, `AIPlanCreated`, `AIPlanRejected`, `AIPreviewCreated`, `AIPlanApproved`, `AIPlanApplied`, `AIPlanFailed`, `AIPlanUndone`.

Events may inform downstream services, but a derived event must not secretly perform a second mutation. Mutations must go through commands so they can be validated, recorded, undone, persisted and tested.

### 22.4 Update propagation order

When a node property changes, use a consistent dependency order:

1. Validate the incoming typed value.
2. Apply the command to a draft/transaction state.
3. Recalculate directly affected node data.
4. Recalculate text/image intrinsic measurements if affected.
5. Recompute the smallest impacted Auto Layout/constraint subtree.
6. Recompute ancestor sizes when Hug/Min/Max rules require it.
7. Recompute descendant world transforms and effective clipping/visibility.
8. Update spatial, hit-test, snapping and rendering indexes.
9. Recalculate selection bounds, handles, measurements and inspector values.
10. Revalidate prototype anchors only where frame/node identity or structure changed.
11. Publish one new document revision.
12. Queue persistence and history metadata.

If a stage fails, abort or roll back to the last valid state. Avoid partial states where the canvas has new geometry but the inspector or serializer holds the previous geometry.

## 23. Full interface anatomy and layout behavior

### 23.1 Global application header

The application header is a stable shell above the workspace. Its controls must have defined behavior, active/disabled states, tooltips, and keyboard support.

**File identity area:**
- Display document name, file location/workspace, and a modified-state indicator.
- Clicking the name permits inline rename. Enter commits; Escape cancels; duplicate names follow workspace rules.
- A breadcrumb or location menu opens file location and parent folder navigation without discarding unsaved work.
- Autosave state must distinguish `Saving`, `Saved`, `Offline`, `Save failed`, `Conflict`, and `Read-only`; do not use a generic green check at all times.

**History area:**
- Undo and redo reflect actual command history. Disable them when no operation is available.
- Hovering shows the command label and shortcut. Undoing/redoing updates every subscribed surface and the document revision.
- If the latest operation is a multi-stage operation, undo reverses the whole committed transaction, not just the last internal setter.

**Mode/workspace area:**
- Design, Prototype and Inspect/Dev are explicit modes or tabs. Switching modes changes contextual tools and inspector sections, but does not reset the document, selection or camera unless necessary and communicated.
- If switching modes mid-gesture, first commit or safely cancel according to gesture policy; never strand a pointer capture.
- Keep the mode indicator visible so the user understands whether a click selects design geometry, a prototype wire, or inspect data.

**Preview/share area:**
- `Preview` opens an inline player without changing the document.
- `Present` opens the full prototype player/presentation window.
- `Share` opens permissions/link options only if supported. Show current access level, copy-link feedback and permission errors.
- Export actions must show progress and clear file/failure feedback.

**Overflow/application menu:**
- Keep file operations, import/export, settings, help, shortcuts, libraries and advanced tools in a searchable menu.
- Destructive file/page actions require confirmation when recovery is not trivial. Undo remains available for undoable document changes.

### 23.2 Tool dock and active tools

Each tool has four visual/behavior states: idle, hovered, active, and disabled. Keyboard focus is separate from hover. Tooltips show the tool name, shortcut, and useful modifier hint after a small hover delay.

- Selecting a tool changes the current tool but does not mutate the document.
- The cursor changes to indicate tool behavior: selection, move, text insertion, drawing crosshair, vector pen, pan hand, prototype connector, comment or prohibited action.
- A click-drag tool begins a draft object; the draft is not committed until release.
- A click-to-place tool shows an insertion indicator before placement if the action would otherwise be ambiguous.
- Escape cancels a draft first; a second Escape exits the current tool or clears the active contextual mode following the global Escape priority rules.
- Tool-specific keyboard shortcuts must not hijack text input, numeric property fields, menus, dialogs, or prototype form inputs.
- Tool availability must be capability-based. If video editing, pen editing or a specific vector operation is not implemented, disable it with a clear explanation instead of drawing an active-looking icon.

### 23.3 Left sidebar/panel

The left sidebar contains Pages, Layers, Assets/Components and optional libraries or outline navigation. It can be collapsed, resized and restored.

**Panel geometry:**
- Use a reasonable default width and enforce minimum/maximum widths so labels and controls remain usable. Store width per user/workspace preference.
- Resize by a distinct divider with a resize cursor. Panel resizing changes available canvas viewport area only; it must not move document objects.
- Collapse/expand animation is subtle and short. Maintain the selected layer and scroll position when switching between left-panel tabs.
- If the window becomes too narrow, allow panels to collapse or become overlays rather than overlapping the canvas unpredictably.

**Pages list:**
- Show the current page clearly; double-click or a defined edit action renames it.
- Context menu includes duplicate, rename, reorder, delete and any implemented page-level actions.
- Dragging a page shows a reorder insertion marker; it does not reorder layers.
- Switching pages saves the current editor-session camera per page where useful and restores the target page camera/selection safely. If the selection is not on the new page, clear it and update the inspector.

**Layers tree rows:**
- A row consists of disclosure control, type icon, readable name, optional component/status markers, selection background, and hover-only actions.
- Single click selects. A second click on the name (not the disclosure control) enters rename mode only when the click interval and pointer movement meet the defined double-click/edit rule.
- Disclosure toggles children only; it must not unintentionally change selection if the control is targeted correctly.
- Hover can reveal hide/lock or row menu controls. Pointer movement from label to a hover action should not make the action vanish before it can be clicked.
- Inline rename preserves the existing ID. Enter commits; Escape cancels; blur commits only when the field is valid and the product explicitly uses that convention.
- Dragging a row begins only after the drag threshold. While dragging, auto-scroll near the panel edges, indicate sibling reorder versus nesting, and show prohibited targets.
- Shift selects a range where the tree model supports range selection; platform modifier toggles individual rows. Multi-selection must behave consistently with canvas selection.
- Hidden and locked states show icon/state cues and accessible text. The row menu offers explicit unlock/show actions even when normal canvas operations are blocked.
- Row height, hit targets and disclosure controls must remain comfortable at supported display scale. Large trees should virtualize rendering without breaking keyboard navigation or drag targets.

### 23.4 Canvas viewport and overlays

The canvas viewport contains separate rendering layers:

1. document content layer;
2. transient interaction preview layer;
3. selection bounds and transform handles;
4. snapping/measurement/ruler-guide overlay;
5. prototype connection/wire overlay, visible in Prototype mode;
6. comments/presence overlay, if enabled;
7. accessibility/focus affordances and contextual hints.

The overlay layers must not contaminate the document model unless the overlay represents a real document object. Selection handles and snap guides must remain visually readable at low/high zoom. Document objects must not inherit overlay colors, opacity, clipping or transforms.

**Viewport gestures:**
- Wheel/trackpad policy must be configurable and documented: zoom gesture zooms around the pointer when modifier/gesture conventions request it; ordinary wheel scroll pans or vertically moves through the canvas as appropriate.
- Space+drag pans temporarily when not typing. Middle mouse drag may pan where supported.
- Pinch zoom uses the gesture focal point to preserve the content under the fingers.
- Zooming keeps a stable visual anchor. Fit-to-content and zoom-to-selection use visible bounds and leave a margin for selection handles and interface chrome.
- The canvas camera never modifies node coordinates. Panel resizing may require a camera adjustment to keep the same focal world point in view, but must not change document geometry.
- The editor must preserve predictable cursor/selection behavior when the viewport scrollbars, rulers, minimap or panel edges are used.

**Canvas context menu:**
- Content-aware menu includes only valid actions for the clicked target(s): edit text, copy/paste, duplicate, rename, group/frame, component actions, arrange/z-order, alignment, layout, add interaction, select parent/children, lock/hide, export and delete where appropriate.
- If no object is targeted, show paste, select all, canvas settings, guides/grid, create tool choices and zoom actions.
- A context menu opens at the pointer while remaining inside the app viewport; it must not render offscreen. Escape closes it; keyboard arrows navigate and Enter activates.

### 23.5 Right inspector and input semantics

Each property control needs a defined label, value type, validation range, mixed-value behavior, keyboard model, scrubbing model and commit policy.

- Numeric inputs support click-to-edit, select-all, typing, keyboard stepping and optional scrub drag from the label or scrub affordance. Scrub sensitivity may decrease with a modifier and increase with another modifier, with the exact map shown in the tooltip.
- During scrubbing, show live preview. Commit on pointer release as one transaction. Escape cancels and restores initial value.
- Enter commits. Tab commits and advances focus according to a predictable section order. Shift+Tab moves backward. Escape cancels only the current field edit before it cancels a higher-level operation.
- Unitless design geometry uses logical pixels internally. Display formatting may round sensibly, but copy/export must preserve adequate precision.
- Color fields support direct input, picker, eyedropper where available, alpha, recent colors, library/variable assignment and clear unbinding actions. Invalid color strings must not corrupt the model.
- Mixed values display a mixed placeholder/state. Typing or selecting an explicit value applies it to compatible nodes only after communicating the affected count where that matters.
- Collapsible sections preserve their open/closed state per workspace or selection type. Updating a property must not unexpectedly jump scroll position or close the active section.
- A property change on a node bound to a shared variable should clarify whether the change edits the variable, unbinds the property, or creates a local override. Never silently update every use of a token when the user intended one local change.

### 23.6 Bottom/status region and transient surfaces

A compact status area may show zoom, selection count, canvas hints, active tool, saving state, collaboration status and accessibility messages. It should not become an always-open log panel.

- Toasts are reserved for completed actions, recoverable warnings and important failures. Avoid a toast for every tiny hover or property change.
- Popovers are anchored to their triggering control and close on Escape or outside click according to standard behavior. Interactive popovers must not close when the user moves the pointer from trigger into content.
- Drawers are used for substantial secondary tasks; dialogs are used when a decision or focused editing task requires attention. Use one overlay hierarchy so a dropdown cannot appear behind a modal or prototype preview.
- Modal stacks must define focus trapping, focus return, Escape handling and background interaction policy.

## 24. Cross-surface synchronization matrix

Every action must specify which surfaces update. This table is a mandatory integration test map.

| User action | Canonical state changed | Surfaces that must update | History/persistence |
|---|---|---|---|
| Click canvas object | Selection session state | Canvas outline, layer row, inspector, breadcrumb, selection count | No document history; session state may persist separately |
| Click layer row | Selection session state | Canvas outline/reveal, inspector, breadcrumbs, other selected rows | No document history |
| Hover layer row | Hover session state | Canvas hover outline, row hover state | No history |
| Hide/show layer | Node visibility | Canvas render/hit-test, layer icon, applicable parent controls, exports | One command; saved |
| Lock/unlock layer | Node lock state | Canvas transform affordance, tree icon, context menu behavior | One command; saved |
| Drag object | Node transform and possibly parent/order | Canvas, layers if reparented/reordered, inspector geometry, prototype anchors if needed, minimap | One transaction on release; autosaved |
| Reparent object | Parent ID, order, local transform | Tree hierarchy, canvas placement/layout, inspector, snap index | One transaction; saved |
| Edit X/Y/W/H | Geometry/layout input | Canvas render, parent layout if relevant, bounds, handles, all mirrored fields | One commit transaction; saved |
| Change shared token | Variable/style value | Every bound object, previews, inspector references, library summary, export values | One transaction; saved |
| Edit main component | Component definition | Main component and non-overridden instances, tree markers, previews | One transaction; saved |
| Edit instance override | Instance override data | Instance only, property inspector, instance status | One transaction; saved |
| Create prototype wire | Prototype graph | Source affordance, wire, destination highlight, Prototype inspector, flow validator | One transaction; saved |
| Change interaction action | Prototype graph | Wire label, inspector form, graph validator, player behavior | One transaction; saved |
| Run prototype | Runtime state only | Player canvas, runtime controls, optional console | No design document mutation; run log may persist separately |
| Change runtime variable | Prototype runtime state | All runtime elements bound to the variable, derived values, current UI state | No design document history; reset/session behavior per run setting |
| Apply AI suggestion | Normal canonical command(s) | All impacted editor surfaces, AI task panel, history, persistence | One grouped transaction with AI provenance |
| Undo/redo | Canonical document revision | All affected surfaces and derived indexes | History advances; persistence queued |

When an action can affect multiple surfaces, do not implement separate local update paths in each panel. Send one canonical command, then compute and publish derived state.

## 25. Detailed object/layer lifecycle

### 25.1 Creating an object

1. User selects a creation tool or drags an asset.
2. The tool defines object type, default style, default dimensions, intended parent policy and pointer semantics.
3. Pointer-down creates a non-persistent draft object or placement ghost.
4. Pointer movement updates the draft in world space and applies temporary snapping if the tool supports it.
5. A valid parent is inferred from the pointer location, selection context and active layout configuration.
6. A pre-commit validation checks parent compatibility, finite geometry, document limits and asset readiness.
7. Pointer-up commits `CreateNode` with generated stable ID, final local transform, z-order and style.
8. The new object becomes selected according to the tool's selection policy, the Layers tree reveals it, and the inspector displays type-specific fields.
9. Autosave and history record the operation.

For click-to-create, use a documented default size. For click-drag creation, normalize drag direction so dragging up/left still creates positive width/height with the expected origin. Shift can constrain aspect ratio when appropriate; Alt/Option can draw from center if the tool convention permits. These modifiers must be discoverable and tested.

### 25.2 Duplicating and copying

- Duplicate assigns new IDs to every duplicated node and rewrites internal parent/child references. It preserves component references but not main component identity.
- Copy stores a portable clipboard payload, with asset references packaged or embedded according to security/size policy.
- Paste prefers the current selected/active parent if valid; otherwise paste to page root. Center the pasted selection around a sensible viewport position and offset repeated pastes predictably.
- Paste in place preserves document/world coordinates when source and target context are equivalent. If a different parent is active, convert world transforms into the target parent local space.
- Cross-document paste resolves font/asset/variable/component dependencies, reporting missing dependencies and offering safe fallbacks.
- Clipboard data from external applications is untrusted. Sanitize SVG, HTML, URLs and embedded assets.

### 25.3 Delete and recovery

- Delete removes selected hierarchy roots once; selecting both parent and descendant must not issue duplicate deletions.
- Before delete, preserve child order, transforms, links and related metadata in the undo record.
- If a deleted design node is a prototype hotspot or destination, mark corresponding prototype connections broken or remove them as a visible, reversible part of the same transaction. Never leave invisible dangling references without validation feedback.
- Deleting a page with meaningful content requires confirmation and offers undo/recovery where practical.
- If an asset is referenced elsewhere, deleting the visible instance must not delete the library asset.

### 25.4 Group, frame, component and layout distinctions

- **Group:** logical transform/order container; children usually retain free-position semantics.
- **Frame:** clipping and layout container with explicit dimensions, constraints and potentially scroll/auto-layout behavior.
- **Component:** reusable source definition.
- **Instance:** linked copy of a component with explicit overrides.
- **Auto Layout container:** frame/container whose children are arranged by deterministic layout rules.

Menu labels and tooltips must explain meaningful differences. Do not silently turn a Group into a Frame simply because the user selected a frame-like toolbar icon. When a conversion is destructive or changes child placement, show a before/after preview and preserve undo.

### 25.5 Rename and semantic identity

Renaming changes `name`, not stable ID. Prototype smart matching, node references, comments, variables and accessibility labels must not rely exclusively on mutable display names. If the animation engine uses names as a fallback match, show a diagnostic for duplicate or ambiguous names and always prefer stable IDs/matching metadata.

## 26. Micro-interaction design system

Micro-interactions are product behavior, not decorative animation. Use a shared token set for duration, easing, motion distance, opacity, focus ring, border, and feedback intensity. These values are defaults to validate against DesignForge's existing design system.

### 26.1 Suggested timing tokens

| Token | Initial target | Use |
|---|---:|---|
| `motion.instant` | 0–80 ms | Immediate color/focus response; do not animate core geometry unnecessarily |
| `motion.fast` | 100–150 ms | Button press/release, checkbox, small icon state |
| `motion.standard` | 150–220 ms | Hover fill, tab change, short popover, selection tint |
| `motion.panel` | 180–260 ms | Panel expand/collapse, properties-section expansion |
| `motion.overlay` | 180–300 ms | Menu, modal and drawer entrance/exit, adjusted for reduced motion |
| `motion.tooltipDelay` | 400–600 ms | Tooltip delay to avoid flicker during quick pointer travel |
| `motion.dragThreshold` | 3–5 CSS px | Distinguish click from drag; configurable for accessibility |
| `motion.snapHysteresis` | Tuned in screen px | Keep snap target stable until another candidate is clearly better |

Use consistent easing families: standard ease-out for surfaces entering, ease-in for leaving, ease-in-out for state changes, and spring-based easing only where it improves a physical interaction. Don't use elastic/bouncy motion on precision canvas operations by default.

### 26.2 Reduced motion and user preferences

- Respect operating-system `prefers-reduced-motion` and provide an app-level reduced-motion setting.
- Under reduced motion, minimize large translations, parallax, spring overshoot, and lengthy transition sequences. Keep state change cues through opacity, focus, or instant transition.
- Never animate a geometry update in a way that makes the object temporarily appear at a location different from the canonical model while the user is dragging.
- Let users disable prototype animations or set a reduced-motion preview preset for accessibility testing.

### 26.3 Component-state behavior

Every interactive UI component must explicitly cover: default, hover, pressed, focused, selected/active, disabled, loading, success and error where relevant.

- **Buttons:** hover changes only appearance; press gives immediate tactile feedback; release invokes the action only if pointer release remains valid; keyboard activation works with Enter/Space; disabled buttons never fire.
- **Toggle/switch:** optimistic visual switch only if state transition is accepted; on failure revert and explain; keyboard interaction and accessible checked state are required.
- **Checkbox/radio:** distinguish focus from selection; Space toggles a focused checkbox; arrow keys move between radios according to the control pattern.
- **Inputs:** show focus and validation independently; preserve cursor position during controlled updates; error text is attached to the field, not only shown in a toast.
- **Tabs:** active tab persists focus appropriately; arrow navigation moves among tab controls; tab contents update without recreating unrelated editor state.
- **Menus:** opening positions the menu; the first item or current item receives logical focus; pointer exits do not close a submenu before the pointer can enter it; Escape closes the topmost menu and restores focus to the trigger.
- **Tooltips:** are not the only source of essential information; do not cover the pointer target; never trap focus.
- **Draggable objects:** show grab/grabbing cursor, selection bounds and drop preview. While dragging, do not flicker selection due to hover target changes.
- **Toasts:** announce useful feedback to assistive technology; remain long enough to read; persistent destructive/error messages offer a recovery route.

### 26.4 Canvas micro-interactions

- Hovering a selectable object shows a thin hover outline only when it is not already selected, and never obscures the selection outline.
- Clicking changes selection immediately. Selection handles appear after the selection state is committed; they must not wait for an animation to finish.
- Starting a drag changes cursor/visual feedback only after the movement threshold is crossed.
- Snap guides fade in quickly and remain stable using hysteresis; they fade away after release/cancel without affecting the object.
- Measurement labels appear only when meaningful and must not obscure the pointer or selected content. Labels update at a throttled frame rate while values are derived from the current preview transforms.
- Invalid drop targets use a prohibited cursor/indicator plus optional text; color alone is insufficient.
- On successful drop, the ghost disappears and the real object is rendered at the committed position without a visible jump.
- Resize handles remain screen-sized at every zoom. Cursor angle/shape is based on transformed geometry.
- Rotation angle feedback updates continuously but is committed only on release.
- Marquee selection uses a translucent fill and clear border; Shift-add/remove mode is communicated with a modifier cue where useful.
- During multi-selection, show one overall boundary plus per-object cues only when they help. Do not overwhelm the canvas with nested handles.

### 26.5 Drag-and-drop micro-interactions

A drag must distinguish a click, a drag preview, a valid target, and an invalid target.

- On pointer-down: retain current selection and capture initial pointer/transform state; do not mutate hierarchy.
- After threshold: show active drag cursor and move preview.
- Over a valid container: highlight the container and indicate whether the action will insert into a flow, use absolute positioning, or reorder siblings.
- Over a sibling gap: show a precise insertion marker.
- Over a forbidden container: show rejection state and suppress release mutation.
- Near the edge of a scrollable panel: auto-scroll smoothly while keeping drag mapping correct.
- On release: validate again because the target may have changed; commit one transaction or cancel entirely.
- On Escape, pointercancel, blur or lost capture: restore the last committed state and clear guides/ghosts.

### 26.6 Feedback and errors

Use inline errors for field validation, contextual banners for save/conflict states, toasts for operation outcomes, and dialogs only for consequential decisions. Each error should state what happened and one available next action. Do not surface raw stack traces to designers. Keep diagnostic details available to developers through a debug console when enabled.

## 27. Advanced design-engine interaction rules

### 27.1 Central input router

Create one input router that routes events by priority:

1. active text/code/input editor;
2. modal/dialog/popover/menu currently owning focus;
3. active direct-manipulation gesture;
4. active tool operation;
5. Prototype mode wire/interaction operations;
6. canvas selection and viewport gestures;
7. application-level shortcuts.

The router must use actual focus ownership and current mode, not guess from event target classes scattered across the app. It must handle keydown, keyup, pointerdown/move/up/cancel, wheel, touch, composition events, focus/blur and window visibility changes.

### 27.2 Gesture arbitration

- A gesture can be claimed by only one active operation at a time.
- Pointer-down may establish candidates (select, drag, resize, rotate, draw, pan, connect) but the movement threshold and hit priority determine which operation owns the pointer.
- Resize/rotate handles have priority over object body hit-testing.
- Tool mode has priority over selection dragging; for example, clicking with the Text tool inserts/edits text rather than moving the text node.
- When a gesture starts, pin the target IDs and initial geometry. Hover changes must not replace those targets mid-gesture.
- Pointer events must be deduplicated across mouse/touch abstraction to prevent one physical action generating two commits.

### 27.3 Hit-testing and overlap picker

- Hit-test in reverse render order but respect clipping, masks, hidden state, hit-test eligibility and pointer-events-like metadata.
- Consider text glyph bounds, vector paths, transformed shapes, image frame bounds and explicit hotspots according to node type.
- If several objects overlap near the same point, show a compact picker anchored near the cursor or provide a modifier-based cycle-through behavior.
- Overlap picker rows include layer name, type, parent, component status and a small visual preview when practical.
- Clicking an entry selects exactly that node and closes the picker; Escape closes the picker without changing selection.

### 27.4 Layout/geometry diagnostics

Show actionable diagnostics for: Auto Layout cycles, impossible Fill/Hug combinations, conflicting min/max dimensions, unsupported transforms, missing fonts/assets, overflow/clipping surprises, prototype targets deleted or moved out of supported scope, and constraints that cannot be satisfied.

- A diagnostic links to the implicated layer/property.
- A suggested fix describes the consequence before applying it.
- A diagnostic may be warning, error or informational; distinguish all three with icon, text and semantics rather than color alone.
- Suppress duplicate warnings caused by the same root issue; don't create a log storm while dragging.

### 27.5 Viewport-aware performance

- Render only the visible world-space region plus a small overscan margin. Keep selection/interaction overlays in a lightweight separate layer.
- Throttle/coalesce pointer movement to rendering frames but preserve final pointer-up precision.
- Update spatial indexes incrementally for changed nodes and descendants only.
- Cache expensive text measurement, vector tessellation, raster effects and image thumbnails with invalidation keys tied to actual input revisions.
- Avoid re-rendering the full React/application tree on every pointer move; isolate high-frequency canvas state.
- Instrument selection latency, drag frame time, layout cost, save queue age and prototype frame time in development builds.

## 28. Prototype experience: simple to start, powerful to master

### 28.1 Design goals

Prototype should feel easier than a traditional flowchart tool while retaining professional controls:

1. Beginners can create a working click-through flow in a few actions.
2. Experienced designers have precise triggers, state, conditional logic, animation, scrolling, overlays and device simulation.
3. The visual flow graph remains readable at scale.
4. Editing interactions must not disturb design geometry accidentally.
5. The live player must execute the same interaction definitions that the inspector and flow map display.
6. Prototyping remains a simulation unless real services are deliberately connected; never imply that a mock payment/authentication action is a live transaction.

### 28.2 Two authoring levels

**Quick Prototype (default for new users):**
- User selects a button or hotspot and drags the connector to a destination frame.
- A compact popover asks what should happen: Navigate, Open overlay, Scroll to, Change component state, or Back.
- A safe default trigger is proposed from the object context, usually click/tap.
- The app picks a sensible default transition and duration, with a one-click `Test` action.
- The interaction appears as a readable sentence, such as `On click → Navigate to Checkout → Smart transition`.
- A guided flow checklist shows remaining screens without requiring the user to understand the full runtime model.

**Advanced Prototype:**
- Exposes the complete interaction configuration, ordered actions, conditions, variables, state scope, overlay behavior, scroll settings, gesture/key triggers, custom animation details, and diagnostics.
- All advanced configuration stays tied to the same canonical interaction object as Quick Prototype.
- Switching between levels must preserve every configured property; Quick mode may summarize advanced actions but cannot delete or reset them.

Add one global preference for starting in Quick or Advanced mode, but keep an explicit switch in the Prototype inspector.

### 28.3 First-run onboarding

Offer a small, skippable interactive guide:
1. Select a button in the canvas.
2. Drag its prototype handle to another frame.
3. Test the flow in Preview.

The guide uses a disposable example or reversible suggestions, not the user's actual project. A `Skip` control and a Help entry remain available. Mark the guide completed only after the user actually performs the step or explicitly skips.

### 28.4 Quick-create paths

Support these shortcuts without requiring a complex graph editor:

- **Connect screens:** select source and destination frames, then use `Connect` to create a default hotspot/connection from a selected child or frame-level hotspot.
- **Auto-wire obvious navigation:** detect exact patterns such as named `Continue`, `Next`, `Back`, `Close`, and navigation menu items. Show a preview map and allow selective accept/reject; never silently create dozens of wires.
- **Make a modal:** select an overlay frame, then choose `Use as overlay`; the tool can create an Open overlay interaction from the selected hotspot.
- **Prototype a component:** select a component set and choose `Make interactive`; offer suggested hover, pressed, selected, disabled and expanded state transitions when matching variants exist.
- **Add a flow start:** use a visible start-point badge on top-level frames; drag/reorder flows separately from visual layer order.
- **Test from here:** start preview at selected frame/hotspot and optionally reset all runtime variables.

### 28.5 Prototype workspace modes

Provide three coordinated views:
- **Canvas connections view:** wires on the design canvas; best for direct editing.
- **Flow map view:** a dedicated overview for arranging and understanding screens/flows; frame arrangement in this map must not modify design-frame world positions unless the user explicitly chooses to move the real frames.
- **Interaction list view:** an accessibility-friendly, searchable list of all interactions with source, trigger, ordered actions, destination and validation status.

The same interaction IDs and graph power all three views. Editing a wire updates the inspector and list; editing in the list updates the wire and player immediately.

## 29. Canonical prototype data model

Use a structured graph instead of encoding connections only as visual arrows.

```ts
type PrototypeTrigger =
  | { type: 'click' | 'tap' | 'hover' | 'whileHover' | 'press' | 'release' }
  | { type: 'drag'; direction?: 'left' | 'right' | 'up' | 'down' | 'any'; threshold?: number }
  | { type: 'swipe'; direction: 'left' | 'right' | 'up' | 'down' }
  | { type: 'key'; key: string; modifiers?: string[] }
  | { type: 'afterDelay'; delayMs: number }
  | { type: 'mediaEnded' }
  | { type: 'submit' }
  | { type: 'scroll'; threshold?: number; direction?: string };

type PrototypeAction =
  | { type: 'navigateTo'; destinationFrameId: string; transition?: TransitionConfig; preserveState?: boolean }
  | { type: 'back' }
  | { type: 'openOverlay'; destinationFrameId: string; overlay?: OverlayConfig; transition?: TransitionConfig }
  | { type: 'closeOverlay'; policy?: 'top' | 'all' }
  | { type: 'swapOverlay'; destinationFrameId: string; overlay?: OverlayConfig }
  | { type: 'scrollTo'; destinationNodeId: string; behavior?: 'instant' | 'animated' }
  | { type: 'changeVariant'; nodeId: string; variantProperties: Record<string, string> }
  | { type: 'setVariable'; variableId: string; expression: ExpressionNode }
  | { type: 'setVariableMode'; collectionId: string; modeId: string }
  | { type: 'setVisibility'; nodeId: string; visible: boolean }
  | { type: 'openUrl'; url: string; target?: 'same' | 'new' }
  | { type: 'playMedia' | 'pauseMedia' | 'toggleMedia'; nodeId: string }
  | { type: 'focusNode'; nodeId: string }
  | { type: 'submitMockForm'; formId: string; result: MockFormResult }
  | { type: 'wait'; durationMs: number }
  | { type: 'conditional'; condition: ExpressionNode; then: PrototypeAction[]; else?: PrototypeAction[] }
  | { type: 'emitEvent'; eventName: string; payload?: Record<string, unknown> };

interface PrototypeInteraction {
  id: string;
  sourceNodeId: string;
  trigger: PrototypeTrigger;
  actions: PrototypeAction[]; // deterministic sequential order; async actions must declare blocking/non-blocking behavior
  enabled: boolean;
  label?: string;
  scope: 'local' | 'component' | 'flow';
  priority?: number;
  guard?: ExpressionNode;
  conflictPolicy?: 'firstMatch' | 'priority' | 'allowParallel';
  createdAt?: string;
  updatedAt?: string;
}

interface PrototypeFlow {
  id: string;
  name: string;
  startFrameId: string;
  description?: string;
  devicePresetId?: string;
  viewport?: { width: number; height: number; scale?: number };
  background?: string;
  runtimeDefaults?: Record<string, unknown>;
}

interface TransitionConfig {
  type: 'instant' | 'dissolve' | 'smart' | 'move' | 'slide' | 'push' | 'scroll' | 'custom';
  durationMs: number;
  easing: string;
  direction?: 'left' | 'right' | 'up' | 'down';
  spring?: { mass: number; stiffness: number; damping: number; initialVelocity?: number };
  delayMs?: number;
  reduceMotionFallback?: string;
}

interface OverlayConfig {
  positioning: 'manual' | 'center' | 'top' | 'bottom' | 'left' | 'right' | 'anchored';
  anchorNodeId?: string;
  backdrop: 'none' | 'dim' | 'custom';
  backdropOpacity?: number;
  closeOnOutsideClick: boolean;
  closeOnEscape: boolean;
  trapFocus: boolean;
  preserveBackgroundState: boolean;
  stackPolicy: 'stack' | 'replaceTop' | 'replaceAll';
}
```

This schema is illustrative. Keep it typed and serializable, and validate every enum, reference and expression. Any action that can't be supported in a given runtime must be visibly marked unsupported rather than silently ignored.

### 29.1 Stable prototype references

- Reference nodes and frames by stable IDs, not canvas positions or array indexes.
- Deleting/renaming/moving a node must be handled through explicit graph-update policy.
- Renaming a frame must not break a connection.
- Duplicating a frame must not automatically clone all outgoing interactions without an explicit user setting; copied links should be predictable.
- Copying a flow or page must remap internal node IDs and preserve only the links the user elected to copy.

### 29.2 Prototype graph model

Represent a prototype as a directed, labeled graph:
- frame/screen nodes;
- interaction hotspots on layers or frames;
- ordered action sequences and optional conditions;
- transition edges;
- flow start nodes;
- overlay relationships;
- component-internal state transitions;
- variable dependencies and data-flow references.

Graph edges must be independent of wire coordinates. Wire bends and routing are presentation metadata, not interaction semantics. The flow map can reroute wires without changing prototype logic.

## 30. Prototype inspector: full field-level interaction specification

### 30.1 When nothing is selected

Show:
- flows and starting points;
- prototype runtime/device defaults;
- flow-level variable defaults/reset policy;
- preview device, viewport and background;
- reduced-motion and test options;
- graph validation summary;
- button to create the first flow or run the selected flow.

### 30.2 When a frame is selected

Show:
- Add/remove flow starting point;
- flow membership and incoming/outgoing connections;
- device/viewport override where allowed;
- scroll/overflow axis and clipping;
- fixed/sticky elements, if implemented;
- runtime state preservation policy;
- frame-level hotspot fallback behavior;
- interaction/connection count and broken-link warnings.

A starting point is a flow entry, not merely the visually leftmost frame. Show an unmistakable start badge and a label with the flow name. Multiple flows may coexist on one page.

### 30.3 When a hotspot/layer is selected

Show an interaction list with each row containing:
- trigger icon and readable trigger phrase;
- ordered action summary;
- destination/target, if any;
- transition summary;
- enabled/disabled state;
- warnings/errors;
- overflow menu for duplicate, disable, delete and reorder where relevant.

Selecting an interaction row highlights its hotspot and wire. Selecting a wire highlights its interaction row and sets inspector context to that connection. If an object has multiple interactions, don't overwrite the currently edited interaction merely because the pointer hovers over another wire.

### 30.4 Interaction builder

Use progressive disclosure: simple fields first, advanced controls collapsed but discoverable.

**Basic fields:** Trigger, Action, Destination/Target, Animation/Transition, and a live mini-preview where feasible.

**Advanced fields:** delay, condition/guard, ordered follow-up actions, variable updates, interaction priority/conflict policy, state preservation, event cancellation, gesture direction/threshold, accessibility fallback, reduced-motion fallback, and per-action error behavior.

The builder should update the wire label and interaction list as values change. Unsaved edits remain a local draft until Save/Apply. Cancel reverts the draft. If a connection is changed by a concurrent operation, detect the revision conflict and offer reload/reconcile instead of overwriting silently.

### 30.5 Trigger catalog

Provide only triggers the selected hotspot can meaningfully support; include search and plain-language descriptions.

- Click/tap.
- While hovering, hover enter/leave.
- Press down/release where device semantics support it.
- Drag and directional swipe.
- Keyboard key/shortcut with optional modifiers.
- After delay (with a bounded duration).
- Scroll/visibility threshold.
- Form submit.
- Media ended, play, pause or state change.
- Component state/variant event.
- Custom named event for advanced connected scenarios.

Desktop-only triggers should be paired with touch/accessibility fallbacks where possible. Hover interactions must not be the only route to essential functionality.

### 30.6 Action catalog

Support, by roadmap, the following actions through the same action registry:

- Navigate to frame; Back; reset flow.
- Open, close, swap, or close-all overlays.
- Scroll to a node/anchor; set scroll position; preserve/reset scroll.
- Change component variant/state.
- Set variable; set variable mode; evaluate a condition; execute ordered action branches.
- Show/hide a node; toggle visibility.
- Focus a field; set mock input value; submit a mock form; show success/error result.
- Play/pause/toggle video or audio preview; respect media loading/end events.
- Open external URL, with safe URL validation and a presentation security warning for unsupported schemes.
- Wait/delay; emit a local custom event.
- Reset local/component/flow state according to an explicit scope.

A mock form, checkout, login or payment action is a simulation. Label demo/test data; do not submit credentials to unknown endpoints or imply a real service completed an operation.

## 31. Wiring and flow-graph micro-interactions

### 31.1 Creating a connection

1. In Prototype mode, hovering an eligible node shows a connector handle with a generous screen-space hit target.
2. Pointer-down on the handle starts a connection draft; the canvas selection stays stable.
3. A preview wire follows the pointer. Valid destination frames glow subtly; invalid node targets show rejection feedback.
4. On hover over a frame, show the destination label and thumbnail/size where practical.
5. On pointer-up on a valid destination, create a connection draft and open Quick interaction builder; do not auto-select an arbitrary existing interaction.
6. If the user cancels the builder, discard only the new draft connection, not the source selection or surrounding design.
7. On save, commit one `AddPrototypeInteraction` transaction and display the wire as a committed link.

When a selected source already has a compatible connection, the connector handle can offer a clear choice to create another interaction or retarget the existing one. Never silently replace a connection.

### 31.2 Editing and deleting wires

- Clicking a wire selects it; it becomes stronger, its endpoints/labels appear, and the matching inspector row is selected.
- Double-clicking the wire or selecting `Edit interaction` opens the editor.
- Dragging a destination endpoint previews the new destination. Release over a valid destination changes target; release elsewhere cancels.
- Wire bends can be dragged or auto-routed, but bend changes are presentation-only unless the graph schema explicitly stores them.
- Delete removes the selected interaction only after confirming which one if several share the same visual path. The action is undoable.
- Selecting multiple hotspots/frames and connecting to the same destination should support batch creation with the same configuration, while maintaining unique interaction IDs.

### 31.3 Wire routing and readability

- Route wires around frames and avoid obscuring hotspots as much as possible.
- Use stable routing with limited jitter as frames move; do not reroute the entire graph unpredictably after each pixel of drag.
- Add labels for destination/action on hover or selection. Use distinct but accessible line patterns/icons for navigation, overlay, component state and invalid links.
- At high density, bundle parallel connections and allow expansion; keep individual connections available in the interaction list.
- A graph-minimap and fit-to-flow action help large flows. Flow-map layout must be separate from actual design geometry unless the user explicitly moves design frames.

### 31.4 Frame movement and prototype links

Moving a design frame changes its canvas world position but not graph semantics. Incoming/outgoing wires re-route based on current bounds. Renaming preserves references. Deleting or duplicating frames follows an explicit link-copy policy. Reparenting an interactive object inside a component may change the interaction scope, so validate and communicate any scope changes.

## 32. Animation and transition engine

### 32.1 Transition presets

Provide beginner-friendly presets plus advanced controls:

- Instant.
- Dissolve/fade.
- Smart object matching.
- Move in/out.
- Slide in/out.
- Push.
- Scroll-to-anchor.
- Overlay entrance/exit.
- Spring transition.
- Custom/keyframe animation, where supported.

Each preset has valid parameters. Avoid displaying irrelevant controls (direction for a pure crossfade, for instance). Show one inline visual preview and a reset-to-default control.

### 32.2 Animation parameters

- Duration in milliseconds, with accessible numeric input and scrub support.
- Easing preset and curve visualization where feasible.
- Direction for directional transitions.
- Delay where supported.
- Spring parameters (mass, stiffness, damping, velocity) only in Advanced mode.
- Reduced-motion fallback for animations that depend on movement.
- Optional stagger/order for compatible collections.
- Cancellation/interruption semantics for rapid repeat triggers.

Use explicit units and bounded values. Duration zero maps to Instant. Out-of-range values are rejected/normalized with feedback. When an interaction is triggered again during animation, apply a declared policy: ignore, queue, reverse, or interrupt/re-target. Defaults must be predictable and stable.

### 32.3 Smart matching

Match layers using, in priority order:
1. explicit stable matching key or authored pair;
2. stable component identity plus instance path;
3. node ID where cross-frame references intentionally retain identity;
4. matching name plus compatible parent/hierarchy/type as a fallback;
5. conservative type/geometry heuristic only when high-confidence and shown in preview.

Do not match unrelated layers merely because their names are equal. If two possible targets compete, warn or choose the non-animated fallback rather than teleporting the wrong object. Handle enter/exit objects with fade or declared fallback. Animate geometry and appearance without changing canonical design geometry in the editor. Prototype animation is a runtime interpolation, not a document mutation.

### 32.4 Custom timeline and keyframes (advanced roadmap)

For high-end motion work, add an optional timeline editor with:
- timeline ruler, duration and playhead;
- keyframes for position, scale, rotation, opacity, color and supported properties;
- motion curves and bezier handles;
- staggered child timing;
- path-following for vector objects where supported;
- timeline scrubbing and live preview;
- named animation presets and reusable motion tokens;
- reduced-motion variants;
- export of supported animation data with an explicit fidelity report.

Keep this separate from the simplified transition inspector so beginner interactions remain fast. Timeline editing must be nondestructive and separate from static design geometry. Any unsupported properties need clear boundaries; don't claim full motion-design parity before it exists.

## 33. Overlays, dialogs, nested contexts and dismiss behavior

An overlay is a runtime surface rendered above the current frame, not a destructive replacement of the underlying screen.

- Overlay positioning options: center, manual, anchored to a source node, top/bottom/left/right and responsive placement.
- Backdrop: none, dimmed or custom with defined opacity and optional blur if supported.
- Dismiss policy: click outside, Escape, explicit close action, navigation, or no automatic dismissal.
- Stack policy: add to stack, replace top, or replace all. Defaults should avoid accidental overlay accumulation.
- Focus: initial focus target, focus trap for modal dialogs, return focus to source hotspot on close, and keyboard dismissal when enabled.
- State: underlying frame/scroll should remain unchanged by default; configurable reset/preserve policies are required for complex flows.
- Responsive positioning: keep overlay within the viewport and safe areas; apply documented fallback when anchor is outside the visible scroll area.
- Overlay-to-overlay flows must work without forcing a full screen navigation.
- Touch devices need appropriate tap target sizes and must not rely on hover-only dismissal.

Add prebuilt patterns (confirmation dialog, dropdown menu, side sheet, bottom sheet, tooltip, lightbox, command palette) as configurable recipes that use the same overlay engine. Templates create normal editable frames/interactions, not hidden proprietary primitives.

## 34. Scrolling, fixed/sticky elements and nested viewports

### 34.1 Scroll-container model

Each frame/container can declare overflow behavior per axis: none, vertical, horizontal or both. Nested scroll containers have explicit ownership and gesture arbitration.

- Content bounds larger than the viewport enable scrolling only when the chosen axis allows it.
- Clip content defines visual clipping; hit-testing must respect the effective clipped region unless the prototype target policy explicitly allows offscreen scroll targets for programmatic Scroll To actions.
- Scrollbars, wheel, trackpad and touch drag update runtime scroll state only.
- Scroll state must not mutate static design position values.
- Nested scroll consumes a gesture until it reaches a boundary, then parent scroll may consume further movement if that is consistent with the configured behavior.
- Add overscroll/spring only as an optional runtime setting; do not make editor-canvas panning behave like prototype scroll.

### 34.2 Fixed and sticky elements

- Fixed-to-viewport nodes remain anchored during scroll.
- Sticky nodes stay in normal flow until the configured edge threshold, then stick within their containing scroll frame and release at its boundary.
- Show fixed/sticky badges and a preview indicator in the editor.
- Runtime bounds, hit-testing and accessibility navigation must use the displayed position rather than the original flow position.
- Support safe-area offsets and top/bottom sticky values when prototyping mobile navigation bars, tabs and action bars.

### 34.3 Scroll To and preserved scroll state

- Scroll To references a stable node ID and its containing scrollable frame.
- Support instant or animated scroll, alignment (start/center/end/nearest), and optional offset.
- Validate when the target is not inside an eligible scroll container; offer a fix.
- Define state by scope: preserve on Back, preserve when revisiting a matching frame, reset on flow restart, or reset on explicit action.
- Scroll states must not leak between independent prototype runs unless the flow/runtime preset requests persistence.

## 35. Runtime variables, expressions, conditions and mock data

### 35.1 Variable types and scope

Support typed variables such as string, number, boolean, color and optional enum/object/array types as the runtime matures. Each variable has stable ID, name, type, default value, optional validation, description and scope.

Scopes:
- **Run/flow:** reset when the flow restarts.
- **Page/frame:** scoped to a defined frame/session as supported.
- **Component instance:** isolated state for each instance.
- **Shared prototype session:** shared by explicitly bound parts of a demo.
- **Design token/variable:** design-time values that may supply prototype defaults but are not changed by prototype playback unless the project explicitly defines an editable design mode.

The editor must label scope clearly. If two variables have the same display name but different scopes, show scope in the picker.

### 35.2 Expressions and conditional actions

- Use a restricted, typed expression parser; never run arbitrary JavaScript or eval supplied in a design file.
- Support a documented set of arithmetic, comparison, boolean and string operations, with explicit coercion rules.
- Validate type compatibility and missing variables while editing.
- Provide a visual condition builder (`If value`, operator, comparison value) plus optional expression syntax for experts.
- Conditional branches contain ordered actions and can be nested within a safe limit; display nesting clearly and guard against loops/recursive action chains.
- Limit execution count/time per trigger and surface an error if a cycle or excessive sequence occurs.
- Multiple actions execute top-to-bottom unless explicitly marked concurrent. Async actions define whether later actions wait for completion.
- If an action fails, follow the declared failure policy: stop branch, continue, or run error branch. Do not silently skip failures.

### 35.3 Mock forms and realistic flows

Make common UX research prototypes possible without backend implementation:
- editable text, email, password, search, number and date inputs;
- form validation rules and error/success states;
- dropdown/select, checkbox, radio and toggles;
- list filtering, sorting and tab changes from variables;
- dynamic counters, totals, progress, cart quantity and summary text;
- mock loading and latency states;
- pagination, empty, loading, error and success states;
- configurable local mock data sets with safe sample records;
- state reset and deterministic test data.

A form field must accept real keyboard input in the player, support focus/blur, display validation, and be operable via keyboard and touch. It must not route typed input to the canvas editor. Password-like fields should not be logged in analytics or visible in general runtime logs.

### 35.4 Runtime state reset policy

A prototype session can reset:
- all flow variables;
- component states;
- overlay stack;
- form values;
- scroll positions;
- navigation/back history;
- media playback;
- pending timers/async actions.

Provide clear buttons for `Restart current screen`, `Restart flow`, and `Reset all test state` where applicable. Their behavior must be distinct and documented. Restart stops active animations and pending timers before reinitializing state.

## 36. Realistic preview/player application

### 36.1 Player modes

- **Inline Preview:** fast feedback beside the editor; shows the current flow at a useful size and returns to editing without changing document selection.
- **Presentation Player:** clean, chrome-light full-window experience with flows, device frame, background, fullscreen, reset, and optional navigation controls.
- **Device Preview:** viewport/device presets, DPR scaling, orientation, safe areas, browser chrome simulation where useful, keyboard appearance and touch input.
- **Responsive Playground:** editable viewport dimensions and breakpoint presets; resize live while watching reflow.
- **Research/Test Mode:** scenario checklist, task instructions, optional observer view, test notes and interaction event log.

Every player mode executes the same prototype runtime. Avoid having inline preview and presentation view implement separate interaction semantics.

### 36.2 Device presets and viewport behavior

Maintain an extensible preset library for common phone, tablet, desktop and custom viewport sizes, with safe area/inset metadata when relevant. Device shells and brand-specific imagery are optional and must be licensed/accurate; a generic viewport is always available.

- The visual frame and runtime viewport dimensions are separate concepts; zooming the editor must not alter preview viewport size.
- Rotation changes the viewport orientation only when the target preset supports it.
- Browser scaling and device pixel ratio must not alter logical layout semantics.
- Provide custom width/height input and presets for responsive breakpoints.
- Test portrait/landscape navigation and viewport resizing without deleting or mutating frames.

### 36.3 Player controls and return behavior

- Start, pause/resume, restart flow, reset state, switch flow and exit player.
- Optional debug panel shows current frame, variable values, transition status, action errors, pending timers and scroll state. Hide it from share/presentation by default.
- Exit returns to the same document, mode, selected interaction and editor camera whenever the app's context has not changed.
- Preview must be isolated from document editing: runtime values never overwrite design-time defaults or saved styles.
- Open URL actions are sandbox-aware and visibly leave the prototype context; use allowlisted URL schemes and do not execute arbitrary local scripts.

### 36.4 Accessibility and input simulation

- Support mouse, touch, keyboard, focus and screen-reader semantics as far as the browser/runtime allows.
- Provide keyboard navigation through hotspots and visible focus indicators.
- Include a viewport option for reduced motion, and simulation options for hover-unavailable/touch-first behavior.
- Focus management on navigation/overlay transitions must be deterministic. For screen navigation, move focus to a logical heading or top-level container; for modal open, focus the modal; for close, restore focus to source control.
- Avoid keyboard traps except within a modal with proper escape/close behavior.

## 37. Prototype diagnostics, testing and coverage

### 37.1 Graph validator

The validator should detect:
- missing or deleted destinations;
- hotspots that cannot be triggered due to hidden/locked/runtime-ineligible state;
- unreachable frames or flows with no start point;
- self-links that are likely accidental, while permitting intentional ones;
- duplicate triggers with conflicting destinations;
- missing overlay dismissal routes;
- invalid Scroll To target/scroll-frame relationships;
- invalid variable IDs/types/expressions;
- variable dependency cycles;
- incomplete component state transitions;
- action loops or excessive action sequences;
- invalid/external URLs;
- unsupported transition/property combinations;
- inaccessible hover-only controls or focus dead ends;
- empty/error/loading states with no recovery path where flagged by the test template.

Validation has severity, explanation, affected node/interaction and optional fix. Selecting an issue reveals the source node and opens the corresponding inspector control.

### 37.2 Flow coverage and simulation

- Show all frames in the selected flow and mark visited, unvisited, unreachable and error states in test mode.
- Provide a step log: trigger fired → action N → variable changes → frame/overlay transition → result.
- Allow users to replay the last interaction and reset to a known state.
- Record test scenarios in the project, such as successful login, invalid form, empty cart, item added, modal dismissed, and mobile navigation.
- Support deterministic seed data and optional delayed actions so the same test can be reproduced.
- Provide an interaction coverage report for user tests, not a claim of production telemetry unless instrumentation is actually connected.

### 37.3 Debug console and observability

In debug mode, show a timestamped and filterable event stream with runtime variable diffs and action outcome. Keep private input values redacted where sensitive. Export a local report if needed; do not send data to external services without permission.

When an action fails, include enough context to reproduce it: flow ID, frame ID, interaction ID, action index, error category and current runtime revision. Avoid leaking full document content or secrets into generic logs.

### 37.4 Shareable prototype package

- A shared prototype link opens the selected flow, not an arbitrary frame; respect access permissions.
- Define whether shared links use live project state or a frozen version/snapshot. Show the selected option clearly.
- Support a read-only presentation mode and optional feedback/comments.
- Allow export of a self-contained prototype package where supported, including referenced assets, fonts/variables and prototype graph, with a clear report for remote assets, unsupported actions and external dependencies.
- Do not describe an exported static video or static HTML snapshot as equivalent to a functional runtime prototype.

## 38. AI support across Design and Prototype

### 38.1 Design copilot and interaction copilot share context safely

Both assistants can inspect document IDs, type/geometry/layout, component properties, flow graph, interaction triggers/actions, variable schema and validation findings. They must not infer inaccessible source files or secrets.

- **Design copilot:** creates and revises visuals, component systems, layout and responsive rules.
- **Prototype copilot:** creates interaction plans, recommends destinations, sets transitions, generates a form-state matrix and identifies missing paths.
- Both produce typed action plans; neither writes directly to the renderer or bypasses command validation.

### 38.2 Examples

- “Make this checkout button open the shipping overlay, then navigate to confirmation when the form is valid.”
- “Create a light and dark flow using a boolean variable and show me the state transitions.”
- “Connect all obvious Next and Back buttons but preview every suggested link first.”
- “Add hover, pressed, disabled and loading states to this button component.”
- “Test the mobile flow at 360 px and identify any unreachable controls.”
- “Create three animation alternatives for this menu without changing the base design.”

### 38.3 AI safety and approval

- Show exact source node, trigger, action sequence, target, variable writes and animation changes in a reviewable diff.
- Never apply a broad auto-wire request without showing created/changed link count and affected frames.
- Validate the plan against interaction conflicts, unsupported actions and graph loops before approval.
- Apply approved plans as one undoable transaction or clearly grouped transactions; preserve author and AI provenance.
- Never place external URLs, real APIs or real authentication/payment calls into a prototype automatically.
- If no safe interpretation is available, present alternatives rather than guessing.

## 39. Persistence, import/export and project compatibility

The native project serializer must include:
- document/page/node scene graph;
- design styles, variable collections/modes and component definitions/overrides;
- embedded or referenced assets with integrity metadata;
- prototype flows, interactions, triggers, ordered actions, animations, variables, state scopes and device presets;
- stable IDs, revision information and compatibility version;
- source/provenance for AI-generated changes where practical;
- optional test scenarios and user-created prototype presets.

Requirements:
- Prototype runtime state is not written into the design document unless explicitly saved as a named test fixture/default.
- Migrations are versioned and reversible where possible. Unknown fields from a newer compatible project version should be retained safely when feasible rather than silently stripped.
- Saving is atomic or journaled. A crash should restore the latest recoverable committed revision.
- Export to web/code must disclose mapping gaps (e.g. expressions, complex animation, blend modes, unsupported fonts). Never claim pixel-perfect/behavior-perfect parity when the target format cannot represent the prototype.
- Import must sanitize assets and validate all actions/expressions before execution.
- If the application uses the `.dforge` project extension, include both design and prototype definitions in the same versioned project bundle. Keep prototypes linked to stable frame IDs; do not export interactions into a detached sidecar unless the format explicitly defines that relationship.

## 40. Collaboration and concurrency rules (if collaboration is supported)

- Remote selection, cursors and comments are session decorations, not document geometry.
- A remote edit arriving during a local drag must not unexpectedly move the object under the cursor. Reconcile after the gesture using the latest revision and surface a conflict if the targeted transform cannot be merged safely.
- If a connection is edited concurrently, compare interaction revision and offer merge/reload rather than discarding changes.
- Permission changes must immediately disable unauthorized mutations and explain why.
- AI previews must be based on a revision snapshot. If the document changes before approval, revalidate the plan and ask for reconfirmation when the impact changes.

## 41. Quality assurance matrix — required scenarios

### Design editor tests
1. Select by canvas, layer tree, breadcrumb and search; verify a single canonical selection.
2. Drag, resize, rotate and snap at 25%, 100% and 400% zoom.
3. Reparent between transformed parents and preserve world transform.
4. Drag an asset into ordinary frames, Auto Layout frames, component instances and invalid targets.
5. Change property by inspector typing, scrubbing, step keys, copy/paste and undo/redo.
6. Edit component definition and check non-overridden instances; edit an instance and ensure only the override changes.
7. Test hide/lock during selection, tool switch during drag, Escape, pointer cancel, window blur and browser resize.
8. Verify layer order equals render order and overlap picker order.
9. Save/reopen project and verify geometry, fonts, variables, prototype links and assets.

### Prototyping tests
1. Create a connection by dragging a handle and verify it appears identically in canvas, flow map and interaction list.
2. Cancel a new link and confirm no saved edge remains.
3. Change destination, trigger, action order, easing and duration; verify player behavior and inspector state match.
4. Navigate forward/back, open/close/swap overlays and verify focus restoration and back-stack semantics.
5. Scroll nested viewports with fixed/sticky elements; verify boundaries, Scroll To and state preservation.
6. Set/modify string, number, boolean and color variables; verify bound components/text/visibility update correctly.
7. Test conditionals true/false branches, type errors, missing variables, action loops and asynchronous failures.
8. Type into prototype form fields and verify global editor shortcuts do not fire.
9. Test component variants for hover, press, release, leave-while-pressed, saved/unsaved and repeated activation.
10. Interrupt animation with a second input and verify the configured conflict policy.
11. Restart screen/flow and confirm the expected variables, scroll, form, overlay, media and timers reset/persist.
12. Run keyboard-only and touch-first flows; no essential action requires hover.
13. Validate graph issues, follow issue links, apply suggested fixes and undo.
14. Test preview versus presentation player equivalence.
15. Export/import the native project and verify interactions, assets and state schema remain intact.

### Performance and resilience tests
- Large scene with thousands of nodes and deep nesting.
- Many prototype wires and several independent flows.
- High-DPI and browser zoom changes.
- Save failure/offline queue while a gesture or prototype edit is active.
- Missing fonts/assets and invalid SVGs.
- Rapid input sequences, double clicks, pointercancel and long-running animation.
- Reduced-motion preferences and accessibility focus navigation.

## 42. Delivery phases and readiness gates

**Phase A — Shared interaction infrastructure:** typed state domains, central command pipeline, event routing, undo/redo, persistence, layer/canvas/inspector synchronization.

**Gate A:** all original section 18 acceptance criteria pass; no critical selection, geometry or save inconsistency.

**Phase B — Design editor completion:** tools, object lifecycle, context menus, drag/drop, snapping, panels, property inputs, components and layout engine.

**Gate B:** all original sections 2–10 scenarios pass and geometry/layout calculations are deterministic.

**Phase C — Prototype foundations:** canonical graph schema, connector creation/editing, interaction builder, basic flows, navigate/back/overlay, transitions and inline preview.

**Gate C:** a designer can build and test a complete multi-screen flow without code; saved behavior matches runtime behavior.

**Phase D — Realistic prototyping:** scroll/fixed/sticky, component states, variables, conditionals, mock forms, responsive/device preview, test mode and diagnostics.

**Gate D:** representative website and mobile-app journeys can be demonstrated reliably at multiple viewport sizes, with meaningful validation feedback.

**Phase E — Advanced capability:** custom motion timeline, advanced expressions, flow-map graph editing, AI interaction copilot, collaboration and export fidelity reports.

**Gate E:** advanced features are backed by tests and exported limitations are reported honestly.

Do not mark a phase complete because its controls render. Readiness requires real document/runtime behavior, error handling, tests and persistence.

## 43. Final expanded master implementation prompt

> **Role:** Act as the principal product engineer, interaction architect and prototyping-runtime engineer for DesignForge. Build on the existing repository and retain every valid requirement in sections 1–21 of this specification plus this v2.0 addendum. Do not replace functional parts merely for aesthetic reasons. Preserve the application's current visual identity while implementing professional editor behavior.
>
> **First, inspect before coding.** Map the existing architecture, renderer/canvas library, data model, command/state management, inspector, Layers panel, asset system, undo/redo, autosave, file format, prototype preview and tests. Produce a gap report tied to exact modules and acceptance tests. Clearly distinguish working features from visual-only controls and unsupported behavior.
>
> **Establish a single source of truth.** Use a canonical scene graph for design objects and a typed prototype graph for interactions. Separate document state, editor-session state, prototype-authoring state, prototype-runtime state, persistence state, AI task state and collaboration state. Implement one command/transaction pipeline and centralized input router. Canvas, layer tree, inspector, assets, flow map, interaction list and prototype player must not maintain conflicting copies of authoritative values.
>
> **Implement every interaction explicitly.** Define hit-testing, tool priority, selection, modifier behavior, pointer capture, drag thresholds, cancellation, context menus, keyboard focus, numeric field commit/scrubbing, hover, pressed/focused/disabled/loading/error states, panel resize/collapse and Escape priority. All pointer gestures need preflight validation, transient preview, atomic commit, recovery on cancel and one undo entry. Use shared coordinate functions; never store screen-pixel deltas directly as document geometry.
>
> **Make the editor surfaces cooperate.** Selecting by canvas or layer tree must synchronize everything. Dragging or reparenting updates hierarchy, local/world transforms, layout, inspector, bounds and spatial indexes in a deterministic order. Property edits update the real scene graph and rendering. Styles, variables and component instances must propagate by typed references and explicit overrides. Reordering in layers and visual z-order must agree. Autosave must preserve recent committed changes and report failures without losing work.
>
> **Design the entire interface behavior.** Implement the header, file state, history controls, tools, Pages/Layers/Assets tabs, viewport overlays, right inspector, bottom/status feedback, command search, menus/popovers/dialogs and error messages with complete interaction states. Panels must be resizable/collapsible without changing document geometry. Every visible control needs an action contract, focus behavior, validation, undo/persistence policy and automated test. Do not ship active-looking placeholder controls.
>
> **Build the design engine before advanced AI.** Deliver robust object creation, move/resize/rotate, marquee and multi-selection, hierarchy operations, align/distribute, snapping, Auto Layout, constraints, reusable components, variables, typed styles, media assets and serialization. Recalculate only affected dependency subtrees. Prevent invalid hierarchy cycles, transform drift, double transforms, hit-test/render mismatch, unsupported conversions and hidden/locked-object inconsistencies.
>
> **Make prototyping easy but powerful.** Provide Quick Prototype and Advanced Prototype views over one canonical graph. Quick flow must allow selecting a hotspot, dragging a connection to a target, accepting a sensible default trigger/action/transition and pressing Test. Advanced mode must expose triggers, ordered multi-actions, destinations, overlays, variable updates, conditions, component-state changes, animations, scroll behavior, state persistence and device settings. Switching modes must preserve all settings.
>
> **Implement a real prototype runtime.** Support named flows and start points; click/tap/hover/press/drag/swipe/key/delay/form/media triggers as appropriate; navigate/back; open/close/swap overlays; Scroll To; component variants; typed variables and modes; safe expressions and conditionals; mock forms and dynamic text/totals; media controls; and explicit state reset/preservation. Execute actions in deterministic order and declare asynchronous, failure, interruption and loop behavior. Treat prototype runtime state as separate from saved design state. Never imply a mock authentication/payment action made a real transaction.
>
> **Make animation trustworthy.** Implement instant, dissolve, smart object matching, directional moves/slides/push, overlays and scroll transitions with duration/easing controls. Use stable matching metadata and conservative fallbacks. Support reduced motion. Advanced custom timelines and spring physics can follow only after core transitions are reliable. Animation must not alter canonical design geometry.
>
> **Deliver a high-end player.** Provide inline preview, full presentation, device/viewport presets, custom responsive sizing, orientation, safe areas where relevant, keyboard/touch navigation, reduced-motion testing, reset controls, runtime debug console and optional research scenario mode. Preview and presentation must use the same runtime semantics. Exit should return users to their previous editor context.
>
> **Add graph intelligence and AI safely.** Validate broken links, unreachable frames, missing start points, dead ends, invalid variables, action loops, focus traps, invalid overlays and unsupported transitions. AI may recommend connections, state matrices, responsive behavior and animation alternatives, but it must produce an explicit plan and preview diff, validate its effect, request confirmation for structural or visual changes, and commit through normal undoable commands. It must never call arbitrary script/eval or external URLs/APIs without explicit user intent and safety checks.
>
> **Verify rather than assume.** Implement automated unit, integration and end-to-end tests for coordinate transforms at multiple zoom levels, synchronized surfaces, gestures, drag/drop, reparenting, component overrides, layout recalculation, save recovery, prototype wire editing, variables, actions, overlays, scrolling, animations, keyboard/touch accessibility and preview equivalence. Measure performance with large documents and complex flows. Test macOS, Windows and Linux shortcut maps; never run canvas shortcuts while typing in inputs or prototype forms.
>
> **Definition of delivery:** provide (1) a requirements-to-code gap report, (2) an architecture diagram and state/event contracts, (3) phased implementation, (4) working functionality rather than mock-only controls, (5) automated tests and results, (6) keyboard/accessibility documentation, (7) a prototype feature matrix, and (8) a list of remaining unsupported items. Report limitations honestly. Do not claim parity for behavior that is not implemented.

## 44. Added official references for prototyping behavior

Use these public help articles to validate terminology and the baseline interaction concepts. DesignForge should implement compatible mental models while maintaining its own original visual identity and adding more advanced functionality where specified above.

- Figma — Guide to prototyping: https://help.figma.com/hc/en-us/articles/360040314193-Guide-to-prototyping-in-Figma
- Figma — Connect your prototype: https://help.figma.com/hc/en-us/articles/360040315773-Connect-your-prototype
- Figma — Prototype triggers: https://help.figma.com/hc/en-us/articles/360040035834-Prototype-triggers
- Figma — Prototype actions: https://help.figma.com/hc/en-us/articles/360040035874-Prototype-actions
- Figma — Prototype animations: https://help.figma.com/hc/en-us/articles/360040522373-Prototype-animations
- Figma — Smart animate layers between frames: https://help.figma.com/hc/en-us/articles/360039818874-Smart-animate-layers-between-frames
- Figma — Create overlays in prototypes: https://help.figma.com/hc/en-us/articles/360039818254-Create-overlays-in-your-prototypes
- Figma — Prototype scroll and overflow behavior: https://help.figma.com/hc/en-us/articles/360039818734-Prototype-scroll-and-overflow-behavior
- Figma — Use variables in prototypes: https://help.figma.com/hc/en-us/articles/14506587589399-Use-variables-in-prototypes
- Figma — Use expressions in prototypes: https://help.figma.com/hc/en-us/articles/15253194385943-Use-expressions-in-prototypes
- Figma — Multiple actions and conditionals: https://help.figma.com/hc/en-us/articles/15253220891799-Multiple-actions-and-conditionals
- Figma — Interactive components with variants: https://help.figma.com/hc/en-us/articles/360061175334-Create-interactive-components-with-variants
- Figma — State management for prototypes: https://help.figma.com/hc/en-us/articles/14397859494295-State-management-for-prototypes
- Figma — Play prototypes: https://help.figma.com/hc/en-us/articles/360040318013-Play-your-prototypes
- Figma — Right sidebar properties: https://help.figma.com/hc/en-us/articles/360039832014-Design-prototype-and-explore-layer-properties-in-the-right-sidebar

**Final definition of done:** DesignForge is a unified design and prototyping environment in which every editor surface reflects the same canonical document; all design gestures have predictable, reversible behavior; all micro-interactions communicate state; prototypes can simulate realistic responsive user journeys with dynamic state, overlays, scroll, animation and keyboard/touch inputs; and every supported action is tested, saved, inspectable and recoverable. The interface may feel simple at first use, but the underlying system must be extensible enough for advanced product designers, motion designers, researchers and engineers.
