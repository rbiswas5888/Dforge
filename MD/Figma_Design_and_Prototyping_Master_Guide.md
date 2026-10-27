# Figma-Level Design and Prototyping: Comprehensive Product, UX, and Engineering Guide

> **Purpose:** A practical, implementation-oriented guide to how a
> professional visual design application should behave from first canvas
> interaction through design systems, responsive layouts, advanced
> prototyping, testing, collaboration, and developer handoff.
>
> **Primary source:** *Figma Design Comprehensive Guide.pdf* uploaded
> for this project (33 pages). The guide preserves its main topics:
> hybrid rendering architecture, multiplayer synchronization, vector
> networks, Boolean geometry, Auto Layout, components, variables,
> prototype logic, and developer handoff.
>
> **Important accuracy note:** This document describes observable Figma
> workflows and proposes a Figma-like architecture. Figma's complete
> production source code and internal implementation are not public.
> Technical claims in the uploaded PDF about exact internal
> technologies, performance numbers, synchronization algorithms, or
> proprietary implementation details should be treated as claims in that
> document, not independently verified facts. Where architecture is
> proposed for DesignForge AI, it is labelled as a **recommended
> implementation** rather than a claim about Figma internals.

## How to use this guide

-   **Designer:** Read Sections 1--8 to learn how tools, selection, the
    right panel, components, variables, and prototyping should work.
-   **Product designer / design-system lead:** Read Sections 4--7 and 9
    to establish scalable component, token, and interaction conventions.
-   **Frontend / graphics engineer:** Read Sections 10--15 for the
    document model, rendering, interaction dispatch, persistence,
    collaboration, compiler, and testing.
-   **Product owner:** Use the acceptance criteria and checklist at the
    end to turn this guide into an implementation roadmap.

## Table of contents

1.  Product principles and mental model
2.  Application workspace and navigation
3.  Canvas, selection, hit-testing, and editing behavior
4.  Tool-by-tool design reference
5.  The contextual right-side properties panel
6.  Frames, constraints, Auto Layout, and responsive behavior
7.  Components, instances, variants, and properties
8.  Variables, collections, modes, and design tokens
9.  Prototyping: foundations to advanced real-life simulations
10. Recommended frontend architecture
11. Recommended document model and design engine
12. Rendering, geometry, and precision
13. State, undo/redo, persistence, and collaboration
14. Prototype runtime and state engine
15. Design-to-code and developer handoff
16. Performance, accessibility, security, and recovery
17. End-to-end tutorials and scenario recipes
18. Testing strategy and acceptance criteria
19. Implementation roadmap
20. Source notes and references

------------------------------------------------------------------------

# 1. Product principles and mental model

## 1.1 What a professional design application is

A design application is not merely a drawing canvas. It is a structured
document editor that allows people to create, organize, reuse, inspect,
connect, test, and hand off interface systems.

The application must keep five models coherent:

1.  **Document model:** what exists---pages, sections, frames, layers,
    components, styles, variables, assets, and prototype connections.
2.  **Visual model:** how objects look---geometry, text, fills, strokes,
    effects, masks, blend modes, and image/video content.
3.  **Layout model:** how objects respond to parent and viewport
    dimensions---fixed sizing, hug content, fill container, constraints,
    wrapping, grids, and scroll containers.
4.  **Interaction model:** what happens when a person clicks, taps,
    hovers, presses a key, scrolls, waits, or changes state.
5.  **Application model:** current selection, active tool, zoom, panels,
    permissions, collaboration state, undo history, and open dialogs.

A change in one model must trigger only the necessary updates in the
others. Changing a fill should not rebuild the whole document tree;
changing a component's main definition should invalidate its dependent
instances; changing the selected layer should update the inspector
without modifying the design.

## 1.2 Core principles

-   **Selection drives context.** The inspector must show properties
    relevant to the selected object, not a generic fixed form.
-   **The canvas is the primary workspace.** Tools should support direct
    manipulation with precise numeric controls as a complementary path.
-   **Structure before pixels.** Frames, layout rules, reusable
    components, and tokens should express design intent rather than
    relying exclusively on absolute coordinates.
-   **Non-destructive by default.** Preserve source geometry and
    editable structure unless the user explicitly flattens, rasterizes,
    or destructively modifies content.
-   **Predictable edits.** The same command should have consistent
    behavior across shapes, text, frames, and instances where
    applicable.
-   **Progressive disclosure.** Expose frequent properties first and
    advanced controls when relevant, without hiding essential
    functionality.
-   **Fast feedback.** Show previews, alignment guides, dimension
    labels, interaction wires, and validation messages during editing.
-   **Recovery is a feature.** Undo, redo, autosave, version history,
    and conflict recovery are core product behavior.
-   **Design and prototype are connected but distinct.** The same
    document nodes provide visuals; prototype definitions add behavior
    without corrupting design structure.
-   **Accessibility and responsive behavior are designed, not patched
    on.**

## 1.3 Key vocabulary

  -----------------------------------------------------------------------
  Term                    Meaning                 Example
  ----------------------- ----------------------- -----------------------
  Document                The complete editable   Checkout app project
                          design file             

  Page                    A workspace inside a    Mobile checkout
                          document                

  Section                 A named canvas region   "Payment flows"
                          for grouping related    
                          work                    

  Node / layer            One structured object   Text, rectangle, frame
                          in the document tree    

  Frame                   A container with        iPhone screen
                          bounds, clipping,       
                          layout, and often       
                          screen semantics        

  Group                   A grouping of layers    Icon parts
                          without the full        
                          behavior of a frame     

  Component               A reusable source       Primary button
                          definition              

  Instance                A linked use of a       Button on a screen
                          component               

  Variant                 A named alternative of  Button:
                          a component             default/disabled

  Component property      A root-level control    Label, icon toggle,
                          for an instance         swap

  Variable                A reusable value with   `color/text/primary`
                          type and optional modes 

  Style                   A reusable set of       Text style or effect
                          visual properties       style

  Prototype flow          A testable user journey Login → Home
                          with a starting point   

  Interaction             Trigger + action(s) +   Tap → open overlay
                          transition behavior     

  Inspector               The contextual          X/Y, fill, layout
                          properties panel,       
                          usually on the right    

  Render tree             Runtime representation  GPU draw operations
                          used to draw nodes      

  Hit-testing             Determining which       Selecting a small icon
                          object is under the     
                          pointer                 

  Constraint              Rule describing how a   Pin left/right
                          child behaves when its  
                          parent resizes          

  Auto Layout             Flow-based arrangement  Vertical form
                          and sizing system       
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 2. Application workspace and navigation

The uploaded PDF focuses on the engine and design system, while Figma's
public help documentation describes the observable workspace. A typical
editor has a top bar, navigation/left sidebar, central canvas, toolbar,
and contextual right sidebar. Exact placements and labels can change
with product updates.

## 2.1 Main workspace zones

### A. Top bar

Common responsibilities:

-   Document name and save/sync status.
-   Undo and redo.
-   Zoom and view controls.
-   Share, permissions, and collaboration actions.
-   Mode switcher or tool/workspace switcher.
-   Search, quick actions, help, and account controls.

**Behavior requirements** - Save status must distinguish local unsaved
changes, syncing, saved, and error states. - Undo/redo availability must
reflect the active document history. - Zoom controls should never change
object geometry. - A mode switch must preserve selection and document
state where possible. - Destructive commands should be undoable and,
where needed, confirmed.

### B. Left navigation and sidebar

Responsibilities may include: - Pages and sections. - Layers tree. -
Assets and component libraries. - Variables and design resources. -
Plugins, widgets, or other extension entry points. - File warnings,
missing fonts, and library updates.

**Layers tree behavior** - Reflect parent-child structure and z-order. -
Expand/collapse nested frames and groups. - Select a layer by clicking
its row. - Rename with a direct action. - Toggle visibility and lock
state. - Support drag-and-drop reordering and reparenting. - Clearly
distinguish frames, components, instances, text, shapes, images, media,
and sections. - Synchronize selection with the canvas and inspector. -
Preserve stable node identity when a layer is renamed or moved.

### C. Canvas

The canvas is an effectively large workspace, not a normal web page. It
supports: - Pan and zoom. - Object selection and direct manipulation. -
Drawing tools. - Text editing. - Alignment and distribution. - Snapping
and guides. - Context menus. - Prototype connection editing. -
Multi-selection and marquee selection. - Hover and selection outlines. -
Contextual insertion and keyboard shortcuts.

### D. Toolbar

Toolbar controls should be grouped by purpose: - Select and move. -
Frame and section. - Shape tools. - Pen/vector tools. - Text. - Hand/pan
and zoom. - Comment or review tools where supported. - Prototype
connection mode or relevant workspace switch. - Quick actions.

Toolbar tooltips should include tool name, shortcut, and a concise
description. Tool activation must be visibly indicated and must not
unexpectedly modify selected nodes.

### E. Right-side inspector

The inspector is contextual. It changes according to: - Current
workspace/mode (Design, Prototype, inspection/handoff). - Whether a
selection exists. - Selected node type. - Number of selected nodes. -
Whether selection includes a component, instance, or mixed types. -
Whether the selection is inside Auto Layout. - Whether the user has
edit, view, or inspect permissions. - Which advanced properties are
relevant.

See Section 5 for the full decision model.

## 2.2 Workspace states

The application should explicitly model these states:

-   `NoSelection`
-   `SingleSelection(nodeId)`
-   `MultiSelection(nodeIds[])`
-   `TextEditing(nodeId, range)`
-   `VectorEditing(nodeId, selectedPointIds[])`
-   `PrototypeConnectionEditing(sourceId, connectionId?)`
-   `Dragging(nodes[], startPointer, initialGeometry)`
-   `Resizing(nodeId, handle, initialGeometry)`
-   `Panning(startPointer, initialViewport)`
-   `ModalOpen(modalType)`
-   `ReadOnly`
-   `Syncing` / `Offline` / `Conflict`

Do not implement every behavior as unrelated booleans. A state machine
prevents contradictory states---for example, text editing and frame
resizing should not both consume the same pointer event.

## 2.3 Permissions and context

A user with view-only access may be able to inspect or play a prototype
but must not receive editable controls that silently fail. Disabled
controls need an explanation. Permission checks must be enforced by the
backend, not just hidden in the frontend.

------------------------------------------------------------------------

# 3. Canvas, selection, hit-testing, and editing behavior

## 3.1 Selection lifecycle

A normal selection interaction follows this sequence:

1.  Pointer moves over the canvas.
2.  Hit-testing identifies candidate nodes under the pointer.
3.  The UI displays a hover outline or layer hint.
4.  Pointer down captures the initial selection and geometry.
5.  Pointer movement may initiate drag after a movement threshold.
6.  Modifier keys determine whether to replace, add to, or subtract from
    the selection.
7.  Pointer up commits one undoable transaction.
8.  The selected node IDs become the inspector's input.
9.  The inspector computes common and node-specific properties.
10. The canvas and layer tree render the resulting state.

**Critical rule:** Do not commit a new undo history entry for every
pixel of a drag. Use a transient preview during movement and commit one
operation when the gesture ends.

## 3.2 Hit-testing order

A robust hit-test should account for: - Viewport transform (pan and
zoom). - Nested frame transforms. - Rotation and scale. - Clipping and
masks. - Visibility and lock state. - Z-order. - Stroke width and vector
path geometry. - Text glyph bounds and editable text regions. - Pointer
tolerance for small targets. - Whether a modifier allows selection
through or into nested layers.

Recommended selection priority: 1. Respect explicit locked/hidden
behavior. 2. Identify the topmost eligible hit. 3. Prefer the smallest
directly hit child when the user clicks inside nested content, subject
to current selection and modifier behavior. 4. Offer "select layer
beneath" or a layers picker when objects overlap densely. 5. Never
select an invisible clipped region as if it were visible.

The exact priority can differ by tool, but it must be deterministic and
documented.

## 3.3 Selection outline and handles

For one selected object, show: - Bounding box transformed to canvas
coordinates. - Resize handles at corners and edges when applicable. -
Rotation handle. - Alignment/spacing feedback when relevant. -
Measurement labels while moving/resizing. - A clear distinction between
selected object bounds and visible painted bounds.

For multiple objects: - Show a combined selection box. - Preserve each
object's individual geometry. - Group property controls into common
properties and mixed values. - Avoid silently applying a combined
transform when the user expects independent edits.

For vector editing: - Show anchor points, Bézier handles, selected
nodes, segment highlights, and point-specific controls. - Support
selecting one or many points, moving points, editing handles, converting
point types, and inserting/removing points. - A double-click on a vector
shape should enter point-edit mode when that behavior is appropriate; a
double-click on text should enter text editing; a double-click on a
component instance may enter deeper selection or component navigation
depending on context. The action must be consistent and discoverable.

## 3.4 Move, resize, rotate, and transform

### Move

-   Drag selected nodes.
-   Use keyboard nudges.
-   Show snapping to edges, centers, grids, guides, and sibling spacing.
-   Allow numeric X/Y edits in the inspector.
-   In Auto Layout, distinguish reordering from free positioning.
-   If a child is in normal Auto Layout flow, dragging may reorder it;
    free positioning requires an explicit
    absolute-position/ignore-layout behavior.

### Resize

-   Corner handles usually preserve free aspect ratio unless a
    constraint/modifier says otherwise.
-   Edge handles adjust one axis.
-   Provide numeric width and height.
-   Support aspect-ratio lock where applicable.
-   Enforce min/max dimensions and parent constraints.
-   Recompute layout after resize and show overflow warnings where
    content becomes clipped.
-   Resizing an instance should not accidentally detach it from its main
    component.

### Rotate

-   Rotate around a defined transform origin.
-   Show angle values during rotation.
-   Support numeric rotation.
-   For multi-selection, rotate around the selection transform center
    unless a different pivot mode is explicitly chosen.
-   Preserve children and transform hierarchy correctly.

### Flip and transform origin

-   Horizontal/vertical flip should be deterministic and undoable.
-   Flipping a vector should preserve editable paths.
-   Transform-origin/pivot controls should be explicit for advanced
    cases and should not be confused with the object's visual center.

## 3.5 Multi-selection and mixed properties

When selecting several layers: - Show properties shared by all selected
nodes. - Show a mixed/indeterminate state when values differ. - Editing
a common field applies that value to all compatible nodes. - Hide
irrelevant properties or explain why they cannot be applied. - Preserve
each node's type and unique settings. - If the selection contains a
component instance and a normal shape, do not expose instance-only
controls as if they apply to all nodes.

Example: selecting three rectangles with different fills should show a
mixed fill. Setting the fill to blue changes all three. Selecting a
rectangle and a text node may expose shared opacity and
position/transform operations but not a single shared fill control
unless the application has a clearly defined multi-node paint model.

## 3.6 Keyboard and pointer ergonomics

A professional tool should provide: - Discoverable shortcuts and a
searchable shortcut reference. - Escape to cancel a transient operation
or exit a deeper editing mode. - Enter/double-click to enter the
relevant child-editing mode. - Tab/Shift+Tab or an equivalent
predictable method to move through editable controls. - Arrow-key
nudges, with a modifier for larger increments. - Duplicate, copy/paste,
paste-in-place, group/ungroup, lock/unlock, hide/show, rename, and
zoom-to-selection. - Context menus that reflect node type and
permission. - A command/search menu for infrequent actions. - Pointer
capture during drag so the gesture continues if the pointer briefly
leaves the canvas.

Avoid shortcut conflicts with operating-system text-editing shortcuts.
Shortcuts must be configurable or at least documented.

------------------------------------------------------------------------

# 4. Tool-by-tool design reference

This section defines expected behavior and use cases. Names and
shortcuts may vary by product version.

## 4.1 Select / Move tool

**Use for:** Selecting, moving, resizing, rotating, and inspecting
layers.

Expected properties: - Selection outline and handles. - Position and
dimensions. - Rotation. - Constraints/resizing behavior. - Layer order
and parent context. - Component/instance metadata when relevant.

Important behaviors: - Click selects; modifier-click adds/removes from
selection. - Drag starts move only after a threshold. - Empty-canvas
drag starts marquee selection. - Space-drag or a hand tool pans the
viewport. - Double-click enters the appropriate nested editing
context. - Locked nodes can be selected through the layer tree but not
moved unless unlocked.

## 4.2 Frame tool

**Use for:** Screens, containers, reusable layout boundaries, and
scrollable regions.

Properties: - Width/height and position. - Device or preset
dimensions. - Fill/background. - Clip content. - Layout grid/guides. -
Auto Layout direction, alignment, gap, padding, wrap, and sizing
rules. - Min/max dimensions. - Prototype scrolling and fixed/sticky
child behavior. - Component creation when appropriate.

A frame establishes a parent coordinate system and can contain children.
A frame is not merely a rectangle with a label: it may control clipping,
layout, responsive behavior, scrolling, and prototype semantics.

**Create a mobile screen** 1. Activate Frame. 2. Choose a device preset
or draw custom bounds. 3. Name the frame. 4. Add content and establish a
layout structure. 5. Set background and clipping. 6. Decide whether
content scrolls. 7. Define constraints or Auto Layout. 8. Add prototype
starting point if it is a flow entry screen.

## 4.3 Section tool

**Use for:** Organizing a canvas into named regions such as
"Exploration," "Final screens," or "Archive."

Sections should: - Have a label and visual boundary. - Organize without
changing the design's visual output. - Support moving or collapsing a
group of related canvas work. - Help collaborators navigate large
documents. - Not be confused with runtime frames or prototype
destinations.

## 4.4 Rectangle, line, ellipse, polygon, star, and shape tools

**Use for:** Basic geometry, placeholders, diagrams, icons, and visual
construction.

Common properties: - X/Y, width/height, rotation. - Fill, stroke,
opacity. - Corner radius where supported. - Blend mode and effects. -
Export settings. - Constraints and layout behavior when contained.

Specific behavior: - Rectangle: per-corner radii where supported. -
Line: endpoints, stroke, caps, joins, dash style. - Ellipse:
ellipse/circle bounds and arc controls where supported. - Polygon/star:
point count, radius/inner radius, rotation. - Shapes inside Auto Layout
should follow parent flow unless explicitly set to absolute positioning.

## 4.5 Pen and vector editing

The uploaded guide describes **vector networks** as a major geometry
concept: a node may connect to multiple edges, allowing branching paths
rather than only a single linear path. It also describes closed-loop
detection for fills and dynamic insertion of a node when an edge is
split. This is a useful target for an advanced vector engine; the
precise implementation is a design decision for DesignForge AI.

Required user capabilities: - Create points and segments. - Draw
straight and curved segments. - Edit Bézier handles. - Convert between
point types. - Join and close paths. - Split segments. - Add/delete
points. - Select multiple points and move them together. - Control
stroke caps, joins, width, and dashes. - Apply fills to closed
regions. - Create vector networks where supported. - Preserve point IDs
through ordinary edits so selection and undo remain stable.

**Precision rules** - Store geometry in document-space floating-point
coordinates, not rounded screen pixels. - Convert screen-space pointer
coordinates back through the inverse viewport and parent transforms. -
Use tolerance scaled to zoom so small points remain selectable. - Avoid
accumulating rounding errors across repeated transforms. - Show the
actual selected anchor, not merely its nearest visible pixel.

## 4.6 Text tool

**Use for:** Labels, body copy, headings, interface content, and
text-based components.

Properties should include, where relevant: - Font family and
style/weight. - Font size. - Line height. - Letter spacing. - Paragraph
spacing. - Text alignment and vertical alignment. - Text decoration and
case. - Text color/fill. - Text resizing mode: fixed size, auto width,
auto height, or equivalent supported behavior. - Text container
dimensions. - List and paragraph formatting if supported. - Variable
binding for content and applicable typography values. - Text style and
font availability warnings.

**Editing behavior** - Click to create or edit a text node according to
tool state. - Double-click an existing text node to edit text. -
Preserve selection/caret ranges and IME composition for international
text. - Do not replace the entire string when only a range is edited. -
Support undo at meaningful text-edit boundaries. - Font substitution
should be visible; never silently pretend a missing font is identical. -
Text measurement must feed Auto Layout and parent resizing. - Dynamic
content, long translations, and accessibility font scaling should be
part of responsive testing.

## 4.7 Image and media tools

Image properties may include: - Source asset and replacement. - Crop,
fill, fit, and focal point. - Width/height and clipping. - Corner radius
through parent or mask where appropriate. - Opacity, blend mode, and
effects. - Asset export and compression settings.

Media support may include GIF/video nodes, but availability and playback
behavior vary by product. A prototype runtime should define autoplay,
pause, loop, playback reset, and fallback poster behavior explicitly.

## 4.8 Hand, zoom, and viewport tools

-   Pan changes viewport translation, never object coordinates.
-   Zoom changes viewport scale around a defined anchor (pointer,
    center, or selection).
-   Zoom-to-selection fits the selected object's visible bounds with
    margin.
-   Zoom-to-fit fits the page or relevant content.
-   Minimap or page overview is valuable for large documents.
-   Zoom should preserve the cursor's target point where possible.
-   Rendering quality should remain acceptable at high zoom and low
    zoom.

## 4.9 Eyedropper, measurement, guides, and grids

Useful capabilities: - Sample rendered color from a permitted design
object. - Display spacing and distance between objects. - Create
alignment guides and layout grids. - Show baseline/grid alignment. -
Offer snapping toggles and configurable thresholds. - Distinguish
temporary smart guides from persistent guides. - Make measurements
available in an inspection/handoff mode.

## 4.10 Boolean operations and flattening

The uploaded guide identifies four Boolean operations: - **Union:**
combine overlapping geometry. - **Subtract:** subtract upper geometry
from the bottommost shape. - **Intersect:** retain only overlapping
geometry. - **Exclude:** remove overlapping regions while preserving
non-overlapping areas.

Recommended implementation: - Preserve operands and operation type in a
live Boolean group. - Recompute the result when source geometry
changes. - Allow editing each operand through the layer tree. - Clearly
indicate which shape controls output styling if the engine uses that
rule. - Provide a separate explicit Flatten/Expand operation for
converting the result to a static path. - Warn when flattening will
remove editable source structure. - Test holes, nested overlaps,
self-intersections, winding rules, zero-area regions, and open paths.

## 4.11 Fill, stroke, effects, opacity, and blend modes

A layer may have multiple fills and strokes if supported. Each paint
entry should have a stable ID and an order.

Fill types may include: - Solid color. - Linear gradient. - Radial
gradient. - Angular/conic gradient. - Image fill. - Variable-bound
color.

Stroke controls: - Width. - Inside/center/outside alignment where
supported. - Cap and join. - Dash pattern. - Arrowheads or endpoint
decorations. - Stroke paint.

Effects: - Drop shadow. - Inner shadow. - Layer blur. - Background
blur. - Other effects only if renderer and export pipeline can reproduce
them.

**Rules** - Keep paint order deterministic. - Do not mutate a shared
style when a user intends to override only one instance. - Show
variable/style binding and allow detach/unbind where appropriate. -
Distinguish object opacity from fill opacity. - Test blend modes across
nested groups, clipping, masks, and exports.

## 4.12 Masks, clipping, and grouping

-   **Frame clipping:** hide content outside a frame's bounds.
-   **Mask:** use one or more layers to determine visibility of another
    layer.
-   **Group:** logically group layers for selection and transformation.
-   **Frame:** adds layout, clipping, and parent semantics beyond
    grouping.

The inspector should explain which clipping or masking model is active.
Moving a mask must not unexpectedly change unrelated layer order. Mask
rendering must be consistent in canvas, export, and prototype playback.

## 4.13 Export and asset preparation

Export controls should cover: - Selected layer, frame, section, or page
scope. - PNG, JPEG, SVG, PDF, or other supported formats. - Scale
multiplier and target dimensions. - Background inclusion/transparency. -
SVG outline/text handling where relevant. - Naming conventions and
suffixes. - Batch export. - Warnings for unsupported effects, missing
assets, font substitution, or rasterization.

Export is a pipeline: resolve variables and styles, evaluate layout,
render at target scale, process masks/effects, and encode output. A
screenshot of the canvas is not a substitute for a proper export
pipeline.

------------------------------------------------------------------------

# 5. The contextual right-side properties panel

## 5.1 The rule: selection determines the inspector

The right panel should be driven by a **selection context resolver**. It
should not be a static list of every property in the application.

Inputs: - Active mode (`design`, `prototype`, `inspect`). - Selected
node IDs. - Node types and hierarchy. - Parent layout mode. - Main
component / instance relationship. - Variables and style bindings. -
User permissions. - Active editing submode (text, vector, crop, etc.). -
Current document capabilities.

Output: - Ordered sections. - Applicable controls. - Mixed-value
states. - Disabled controls with explanations. - Contextual actions. -
Validation errors and warnings.

### Suggested resolver pipeline

1.  Read selection IDs from application state.
2.  Resolve nodes from the document index.
3.  Normalize selected node types.
4.  Detect single, multiple, and mixed selection.
5.  Detect parent constraints and Auto Layout membership.
6.  Detect component/instance and variant properties.
7.  Resolve bindings to variables and styles.
8.  Apply permission rules.
9.  Build a property schema for the current context.
10. Render sections and controls from that schema.
11. Route user edits to typed document commands.
12. Recompute dependent properties and render affected nodes.

## 5.2 Right panel by selection type

  ---------------------------------------------------------------------------------
  Selection                   Design panel should show      Prototype panel should
                                                            show
  --------------------------- ----------------------------- -----------------------
  Nothing selected            Local                         File/page prototype
                              variables/styles/resources,   settings and flow
                              page/canvas settings, export  overview where
                              scope                         applicable

  Frame                       Position, size, rotation,     Flow starting point,
                              fill, stroke/effects,         interactions, overflow,
                              clipping, layout grid, Auto   fixed/sticky child
                              Layout, constraints,          behavior,
                              children-related layout       device/background
                              settings, export              settings where
                                                            applicable

  Section                     Position/size and             Usually no normal
                              section-specific organization destination behavior
                              properties                    unless explicitly
                                                            supported

  Group                       Transform, opacity,           Interactions if the
                              appearance, child             group is a valid hit
                              organization                  target

  Rectangle/ellipse/polygon   Transform, geometry, fills,   Triggers/actions and
                              strokes, effects,             interaction list
                              radius/shape controls         

  Line                        Transform,                    Interactions if hit
                              endpoints/geometry, stroke,   target is sufficiently
                              caps, arrows, effects         usable

  Text                        Transform, text content,      Interactions and state
                              typography, resizing, fill,   actions
                              effects, text style/variable  
                              binding                       

  Image/media                 Transform, crop/fit, asset,   Interactions; playback
                              fills/effects, export         settings if supported

  Vector path/network         Transform, fills, strokes,    Interactions
                              point-edit context, effects   

  Main component              Component identity, component Interactions on
                              properties, layout and visual component/interactive
                              properties, variant set       states

  Component instance          Instance identity, exposed    Instance interactions
                              properties, overrides, swap,  and state transitions
                              reset/revert controls, layout 
                              overrides allowed by rules    

  Multi-selection             Common properties; mixed      Compatible interactions
                              values; compatible shared     only if the selection
                              commands                      model supports them

  Locked node                 Inspectable metadata; editing Depends on permission
                              controls disabled or hidden   and product policy
                              with explanation              

  Read-only selection         Inspection values and         Playback or inspectable
                              copyable specs                prototype behavior
                                                            without edit controls
  ---------------------------------------------------------------------------------

The precise property set depends on the actual node type and application
capability. Do not show a text font selector for a rectangle or
component-swap controls for a normal frame.

## 5.3 Panel behavior when selecting different things

### Scenario A: Select a rectangle

Show geometry, corner radius if supported, fill, stroke, effects,
opacity, blend mode, constraints/layout sizing, export.

### Scenario B: Select text inside a button component instance

Show the exposed component text property at the instance root if the
main component has exposed it. If the user enters deep text-edit mode,
show text-edit controls. Do not force the user to traverse the entire
layer tree just to change a button label.

### Scenario C: Select a child inside Auto Layout

Show: - Child width/height behavior: fixed, hug, fill, or supported
equivalent. - Alignment/self-alignment if supported. - Min/max
dimensions. - Absolute positioning toggle. - Position controls only
where meaningful. - Parent layout context, such as flow direction and
available space.

If the child is in normal flow, X/Y fields may be secondary or
unavailable because flow rules determine placement. Do not pretend free
XY positioning controls are authoritative when the layout engine will
override them.

### Scenario D: Select an instance with a Boolean component property

Show the named Boolean toggle, e.g. `Show leading icon`. Toggling it
changes the mapped layer visibility without detaching the instance.

### Scenario E: Select an instance with a text property

Show an editable label field. Update the designated text node,
preserving component linkage and unrelated overrides.

### Scenario F: Select an instance with an instance-swap property

Show a component picker limited to compatible components/library items.
Preserve size/layout as far as supported and show a preview before
replacing.

### Scenario G: Select a variable-bound fill

Show the resolved value and the variable binding. Permit changing the
binding, switching modes where applicable, or unbinding to a literal
value. Make it clear whether the user is editing the shared variable or
only the selected node's binding.

### Scenario H: Select multiple nodes with mixed values

Show a mixed state (e.g. `—` or "Mixed") for fields whose values differ.
On edit, apply the new value to all compatible nodes. Never silently
report the first node's value as if it applied to all.

## 5.4 Property controls and their contracts

Each inspector control should have: - A stable property key. - Display
label and optional help text. - Data type and validation. - Applicable
node types. - Read/write permission requirements. - Mixed-value
support. - Variable/style binding support if relevant. - Commit
semantics (immediate, on blur, on Enter, or transaction). - Undo
behavior. - Accessibility label and keyboard support. - Error and
unsupported-value states.

Example schema (conceptual):

``` ts
type InspectorControl = {
  key: string;
  label: string;
  appliesTo: NodeType[];
  valueType: "number" | "boolean" | "string" | "color" | "enum";
  editable: boolean;
  supportsMixed: boolean;
  supportsVariableBinding?: boolean;
  commit: "immediate" | "blur" | "enter" | "gesture";
};
```

## 5.5 Inspector update rules

-   Selection changes should update the panel promptly.
-   Editing a control should update the document and canvas without
    losing focus.
-   External collaboration changes should update values while preserving
    an active local text/input edit when safe.
-   If a node is deleted remotely while selected, clear or recover
    selection gracefully.
-   If a component definition changes, update dependent instance
    controls.
-   If a variable mode changes, update all bound values in the affected
    scope.
-   Use optimistic UI for local edits only when rollback is safe and
    visible.
-   Avoid re-rendering unrelated controls on every pointer movement.

## 5.6 Empty, loading, error, and read-only states

-   **No selection:** show resources, canvas/page properties, and
    helpful next actions.
-   **Mixed selection:** indicate mixed values clearly.
-   **Unsupported property:** explain why it cannot be edited.
-   **Missing font/asset:** show a warning and a recovery action.
-   **Read-only:** allow inspection but disable writes.
-   **Syncing/offline:** permit safe local work if supported and show
    pending status.
-   **Invalid value:** keep the previous valid value or show a
    reversible invalid draft; never silently coerce without feedback.

------------------------------------------------------------------------

# 6. Frames, constraints, Auto Layout, and responsive behavior

The uploaded guide describes Auto Layout as a flow-based layout system
comparable in spirit to CSS Flexbox/Grid, with fixed, hug-content, and
fill-container sizing. Figma's official Auto Layout guide also documents
vertical, horizontal, and grid flows, wrapping, padding, spacing, and
content-responsive behavior.

## 6.1 Choose the correct layout model

Use **absolute positioning** for: - Decorative overlays. - Badges pinned
to corners. - Illustrations with intentional overlap. - Floating
controls. - Complex freeform compositions.

Use **Auto Layout / flow layout** for: - Buttons and chips. - Forms and
field stacks. - Navigation bars. - Cards and lists. - Repeated rows. -
Dialogs and menus. - Responsive sections.

Use **constraints** for: - Pinning content to edges. - Centering
elements. - Scaling or stretching relative to parent dimensions. -
Maintaining distance from selected edges.

Use **grid layout** for: - Dashboard columns. - Product grids. -
Repeated card layouts. - Two-dimensional alignment.

## 6.2 Auto Layout controls

A comprehensive layout panel should support, as applicable: -
Horizontal, vertical, and grid flow. - Primary-axis alignment. -
Cross-axis alignment. - Gap between children. - Independent or linked
padding. - Wrap. - Canvas stacking order. - Child order. - Child sizing:
fixed, hug, fill. - Min/max width and height. - Absolute positioning /
ignore flow. - Alignment overrides for individual children. - Clip
content. - Nested layout. - Responsive behavior when text or children
change.

### Fixed

The node preserves its specified dimension along the relevant axis.

### Hug contents

The parent computes its size from its children, padding, and gaps.
Useful for buttons, tags, menus, and content-driven cards.

### Fill container

The child uses available parent space according to the layout model.
Useful for flexible columns, search bars, and cards in a row.

**Important:** Exact availability of these options depends on the node,
axis, and parent layout. The inspector must not offer an impossible
combination.

## 6.3 Layout calculation pipeline

Recommended order: 1. Resolve variable values and typography. 2. Measure
text and intrinsic content. 3. Resolve fixed and min/max dimensions. 4.
Calculate parent available content box. 5. Determine child flow and
order. 6. Resolve hug/fill sizing. 7. Apply gap and padding. 8. Apply
alignment and wrap. 9. Resolve absolute-positioned children. 10. Apply
constraints where appropriate. 11. Calculate clipping and paint bounds.
12. Produce layout diagnostics.

Avoid circular sizing dependencies. Detect cycles and return a useful
warning instead of entering endless recalculation.

## 6.4 Constraints

Common behaviors: - Left / top. - Right / bottom. - Left and right
(stretch). - Top and bottom (stretch). - Center. - Scale proportionally
where supported.

The UI must explain constraints relative to the parent. When a frame is
resized, a child with left-and-right constraints should update its width
while maintaining edge offsets. A centered child should remain centered.
A fixed-size child should retain its size.

Constraints and Auto Layout are related but not identical. When a child
is governed by flow layout, the layout engine---not arbitrary X/Y
constraints---usually determines its position.

## 6.5 Responsive design and breakpoints

A screen is not "responsive" just because a frame has a mobile size. A
good system should support: - Multiple device presets. - Width and
height constraints. - Auto Layout and wrapping. - Min/max dimensions. -
Fluid widths and fixed controls. - Text wrapping and localization. -
Reflowing columns. - Scrollable content. - Optional breakpoint-specific
variants or modes. - A viewport preview tool.

Recommended testing widths for a project should be configurable.
Example: 360, 390, 768, 1024, 1280, and 1440 CSS pixels. These are test
examples, not universal breakpoints.

### Device-switching requirement

If a prototype is on an OTP screen and the viewer switches from desktop
to mobile preview, the prototype should preserve the **logical screen
identity and runtime state** where possible. It should not restart at
the home screen simply because the viewport changed.

Recommended implementation: - Store a logical route/screen key
independently of viewport dimensions. - Associate responsive frame
variants with a shared screen/route identity. - On viewport change, find
the matching responsive frame. - Transfer supported prototype variables,
form state, and route history. - Re-evaluate layout at the new
viewport. - If no equivalent frame exists, use a responsive layout or
show a clear fallback. - Avoid duplicating business state inside each
breakpoint-specific frame.

## 6.6 Scrolling, fixed, and sticky elements

For a scrollable frame: - Content must exceed the viewport in the
relevant direction. - Set vertical, horizontal, both-direction, or
no-scroll behavior. - Choose each child's scroll behavior: scroll with
parent, fixed, or sticky where supported. - Preserve or reset scroll
position according to the interaction. - Support nested scroll
containers without stealing scroll events unpredictably.

Examples: - Long article: vertical scrolling. - Product image carousel:
horizontal scrolling. - Map-like canvas: both directions. - Top app bar:
fixed. - Section heading: sticky. - Anchor navigation: scroll to a
target node.

## 6.7 Responsive acceptance tests

-   Long translated button label expands without clipping.
-   A card with min/max width respects bounds.
-   Hidden children update layout correctly.
-   A fill child never becomes negative width.
-   A wrapped row creates a new line deterministically.
-   Absolute children do not reserve flow space.
-   Resizing a desktop screen does not destroy the logical prototype
    state.
-   Text, effects, and clipping match in canvas, preview, and export
    within defined tolerances.

------------------------------------------------------------------------

# 7. Components, instances, variants, and properties

The uploaded PDF frames components as a reusable source of truth and
instances as linked copies with overrides. It also explains why variants
should not replace every possible combination of component properties:
huge variant matrices can become difficult to manage, while variables
can represent values that do not require different geometry.

## 7.1 Main components and instances

A **main component** defines reusable structure and defaults. An
**instance** references that definition and may hold allowed overrides.

Expected behavior: - Create a component from one or more selected
layers. - Name it using a predictable convention. - Publish it to a
local or shared library if supported. - Insert instances from assets. -
Update the main component and propagate changes. - Preserve explicitly
allowed instance overrides. - Identify detached or missing-source
instances. - Navigate from an instance to its main component. - Revert
an override or reset all overrides. - Avoid copying all source geometry
for every instance when a shared definition plus override model is
practical.

## 7.2 Component property types

### Boolean property

Use for a true/false choice such as showing an icon, badge, or optional
description. It should map to a known layer/property and expose a clear
toggle at the instance root.

### Text property

Use for editable content such as button labels, headings, or status
messages. It should map to a known text node and preserve text styling.

### Instance swap property

Use when a nested component can be replaced with a compatible
alternative, such as swapping one icon for another. Show a component
picker and preview.

### Variant properties

Use for discrete structural or visual states such as
`Size=Small|Medium|Large`, `State=Default|Disabled`, or
`Style=Primary|Secondary`.

## 7.3 Variant strategy

Use variants when the component changes in meaningful structural or
visual ways: - Button state. - Input state. - Checkbox
checked/unchecked. - Navigation item active/inactive. - Card type. -
Size when geometry differs substantially.

Use variables when only values change: - Brand color. - Light/dark
surface color. - Spacing token. - Border radius. - A numeric counter or
state value. - Text content when a text property/variable is more
appropriate.

Avoid Cartesian explosions. A component with 4 sizes × 5 states × 3
themes × 2 icon options could create 120 combinations if represented
entirely as variants. Prefer a deliberate mix of variant dimensions,
component properties, and variables.

## 7.4 Instance override model

Recommended data: - `componentId` - `componentVersion` or source
revision - `overrides[]` - `propertyValues` -
`nestedInstanceOverrides` - `overrideStatus` - `missingSourceStatus`

Override rules: - Inherited properties update when the main component
changes. - Explicit overrides remain if the property still exists and is
compatible. - Removed source properties produce a warning and a
reversible resolution path. - Renaming a layer should not break an
override if the override targets a stable property/node ID. - Reordering
children should not corrupt property mappings. - Resetting an override
returns to the current source default. - Detaching an instance is
explicit and should warn about losing source linkage.

## 7.5 Nested components

Nested components should support: - Exposed nested properties. - Stable
instance swap mappings. - Predictable override inheritance. - Parent
variant changes without unintentionally resetting unrelated nested
overrides. - Clear ownership when a property exists at multiple
levels. - Performance-safe dependency updates.

## 7.6 Component workflow: create a reusable button

1.  Draw a frame or use a suitable container.
2.  Add text and optional icon placeholder.
3.  Apply Auto Layout, padding, gap, alignment, and hug/fill behavior.
4.  Apply semantic color and typography variables.
5.  Create the main component.
6.  Expose a text property for the label.
7.  Expose a Boolean property for icon visibility if needed.
8.  Expose an instance swap property for icon replacement if needed.
9.  Create variants for genuinely different states/sizes.
10. Add interactive component behavior if useful.
11. Test long labels, absent icons, and disabled state.
12. Insert multiple instances and verify source updates and overrides.

------------------------------------------------------------------------

# 8. Variables, collections, modes, and design tokens

The uploaded guide describes four primary variable types---color,
number, string, and Boolean---and a three-tier token architecture:
primitive, semantic, and component tokens. It also describes modes for
themes and nested dimensions such as brand × light/dark. Figma's public
documentation confirms variables can be used in design systems and
prototypes; exact capabilities and limits can depend on plan and product
version.

## 8.1 Variable types

  -----------------------------------------------------------------------
  Type                    Example                 Common uses
  ----------------------- ----------------------- -----------------------
  Color                   `#2563EB`               Fills, text, strokes,
                                                  compatible effects

  Number                  `16`                    Spacing, dimensions,
                                                  radius, typography
                                                  values where supported

  String                  `"Continue"`            Text content and other
                                                  supported string
                                                  properties

  Boolean                 `true`                  Visibility and
                                                  supported state logic
  -----------------------------------------------------------------------

Do not assume every variable type can be bound to every property. The
property picker must filter by type, scope, and supported target.

## 8.2 Collections and modes

A **collection** groups related variables. A **mode** supplies a set of
values for those variables, such as Light and Dark. An active mode
determines which value resolves in a given context.

Recommended example collections: - `Core primitives` -
`Semantic color` - `Spacing and dimensions` - `Typography` -
`Component tokens` - `Brand themes`

Possible modes: - `Light` - `Dark` - `High contrast` - `Brand A` -
`Brand B`

Avoid creating a single collection with every possible combination if
that makes it difficult to understand or maintain. Separate independent
dimensions when the application supports reliable mode resolution and
aliasing.

## 8.3 Token tiers

### Primitive tokens

Raw values with no semantic intent.

Examples: - `color/blue/600 = #2563EB` - `space/4 = 16` - `radius/2 = 8`

### Semantic tokens

Describe purpose.

Examples: - `color/text/primary` - `color/surface/default` -
`color/border/strong` - `space/card/padding`

### Component tokens

Describe component-specific intent.

Examples: - `button/primary/background` - `button/primary/foreground` -
`input/border/focus`

A component should generally use semantic or component tokens rather
than hardcoded hex values. This permits theme changes without manually
editing every instance.

## 8.4 Alias resolution

Recommended resolution: 1. Read the variable binding. 2. Determine the
active collection/mode context. 3. Resolve aliases recursively. 4.
Detect missing references and cycles. 5. Return the resolved value and
its source chain. 6. Invalidate only dependent nodes when a value
changes.

Cycle detection is mandatory. A variable alias cycle must produce a
validation error, not an infinite resolver loop.

## 8.5 Scope and guardrails

Variable scope limits where a variable is offered. A spacing variable
should not appear as a color choice. The inspector should filter options
by: - Type. - Scope. - Property compatibility. - Library availability. -
Current mode. - Permission. - Deprecation state.

## 8.6 AI-assisted token generation workflow

A useful AI token wizard should not silently invent a complete design
system. It should gather context, produce a preview, validate
relationships, and request approval.

### Step 1: Ask the user what to generate

Options may include: - Color system. - Typography. - Spacing and
sizing. - Radius and borders. - Elevation/effects. - Breakpoints and
layout. - Motion tokens. - Component tokens. - Full token system.

### Step 2: Ask for relevant inputs

For color: - Brand colors or uploaded reference. - Light/dark support. -
Contrast target. - Semantic roles. - Supported output platforms.

For typography: - Font families available. - Type scale preference. -
Language/localization needs. - Heading/body/label roles. - Line-height
policy.

For spacing: - Base unit. - Density (compact, standard, spacious). -
Responsive needs. - Allowed token range.

For motion: - Product tone. - Duration scale. - Easing conventions. -
Reduced-motion behavior.

### Step 3: Generate draft tokens

-   Create primitives first.
-   Build semantic aliases.
-   Build component tokens.
-   Propose modes and scopes.
-   Identify duplicate or near-duplicate values.

### Step 4: Validate

-   Color contrast checks.
-   Type and scope validation.
-   Alias cycle detection.
-   Missing values in modes.
-   Naming convention checks.
-   Token usage coverage.
-   Duplicate-value review.

### Step 5: Preview and approve

Show a token table and sample components. Allow edits before creating or
updating the collection.

### Step 6: Apply safely

-   Preserve existing tokens by default.
-   Show a diff.
-   Ask before overwriting or renaming.
-   Record provenance: user-created, imported, or AI-suggested.
-   Support undo and rollback.

## 8.7 Variables and prototypes

Variables can hold prototype state such as: - `cart/count` (number) -
`auth/isAuthenticated` (Boolean) - `form/email` (string) -
`ui/showError` (Boolean) - `checkout/total` (number) - `theme/current`
or a mode selection where supported

A prototype interaction can update variables; bound layers then reflect
the new values. This allows fewer duplicate frames and more realistic
stateful flows.

------------------------------------------------------------------------

# 9. Prototyping: foundations to advanced real-life simulations

Figma's public prototyping guide defines an interaction through a
trigger, action, and animation/transition. It also documents flows and
starting points, overlays, scroll behavior, variables, expressions,
conditionals, multiple actions, and variable modes. Use official
documentation for the current availability and exact control names.

## 9.1 What prototyping is---and is not

A prototype simulates selected aspects of an application to communicate
behavior and test usability. It can be very high fidelity, but it is not
automatically a production backend. A prototype can represent login,
validation, filtering, cart state, conditional navigation, and many
multi-step journeys, but it cannot prove real authentication, payment
settlement, server authorization, or data integrity unless connected to
real services in an appropriate implementation.

## 9.2 Basic interaction model

An interaction includes:

-   **Trigger:** what begins the interaction.
-   **Action:** what should happen.
-   **Destination or target:** where the action applies, if relevant.
-   **Transition:** how the visual change occurs.
-   **Conditions:** optional logic that determines which action path
    runs.
-   **State mutation:** optional variable changes.
-   **Action order:** order of multiple actions triggered by one event.

### Common trigger categories

Depending on supported product capabilities: - Click/tap. - Hover. -
Press/down. - Drag. - Key/gamepad input. - After delay. - Pointer
enter/leave. - Other explicit input triggers supported by the editor.

### Common action categories

-   Navigate to a frame.
-   Back.
-   Open overlay.
-   Close overlay.
-   Swap/change component variant.
-   Set or modify a variable.
-   Set variable mode.
-   Conditional branch.
-   Scroll to target.
-   Open URL.
-   Show/hide layer where supported.
-   Other supported state actions.

### Transition properties

-   Instant.
-   Dissolve/fade.
-   Move in/out.
-   Push/slide.
-   Smart Animate or matching-object interpolation.
-   Duration.
-   Direction.
-   Easing.
-   Spring/physics-like motion where supported.
-   Overlay placement and closing behavior.

The action and transition options should be context-aware; not every
transition is meaningful for every action.

## 9.3 Creating a basic flow

1.  Create the screens as frames.
2.  Name frames with meaningful screen names.
3.  Switch to Prototype mode.
4.  Choose a starting point.
5.  Select a trigger object, such as a button.
6.  Drag a connection to the destination frame or configure the
    interaction in the panel.
7.  Set trigger, action, and transition.
8.  Play the prototype.
9.  Test the happy path and at least one alternate path.
10. Fix broken or ambiguous connections.
11. Add a second flow for a distinct user journey if necessary.

A file may contain multiple flows: for example, new-user onboarding,
returning-user login, checkout, and an error-recovery flow.

## 9.4 Prototype panel and connection behavior

When an object is selected in Prototype mode, show: - Existing
interactions. - Trigger/action summaries. - Connection target. -
Transition details. - Add/remove interaction. - Variable and conditional
configuration where supported. - Scroll settings if the selection is a
relevant frame/child. - Flow starting point controls for frames.

Canvas connections should: - Have a visible source and target. - Be
selectable and editable. - Avoid obscuring important artwork where
possible. - Support reconnection and deletion. - Show warnings for
missing targets. - Update when a destination frame is renamed or
moved. - Preserve logical node references rather than depending on
canvas coordinates.

## 9.5 Overlays

Use overlays for: - Menus. - Dialogs. - Confirmation sheets. -
Tooltips. - Dropdowns. - On-screen keyboards. - Quick-view panels. -
Error and success messages.

Overlay properties should include supported options such as: -
Placement. - Positioning relative to a trigger or viewport. -
Background/dim layer. - Outside-click closing. - Escape closing. -
Scroll behavior. - Transition. - Whether the underlying frame remains
active. - Focus behavior and focus return.

**Quality rule:** An overlay must have a clear close path. Do not make a
modal that traps the viewer without an intentional exit.

## 9.6 Smart Animate and motion

The uploaded guide describes Smart Animate as matching layers between
frames---often using names and hierarchy---and interpolating properties
such as position, size, rotation, opacity, and fill. That description is
a useful simplified model; actual matching behavior can depend on the
product version and supported properties.

To improve matching: - Keep corresponding layer names consistent. - Keep
hierarchy and component structure predictable. - Avoid renaming
equivalent objects between states. - Make intentional enter/exit states
explicit. - Test both directions of a transition. - Use separate
transitions when a single interpolation creates unwanted movement.

Good motion: - Clarifies cause and effect. - Preserves spatial
context. - Communicates hierarchy. - Gives feedback. - Does not delay
the task unnecessarily.

Example timing conventions (design recommendations, not fixed product
limits): - Micro-feedback: 100--200 ms. - Common UI transition: 180--350
ms. - Larger panel/scene change: 250--500 ms. - Longer motion needs a
clear reason and user testing.

Reduced-motion requirements should be captured even if the prototype
tool does not automatically simulate every accessibility preference.

## 9.7 Scroll prototypes

To create a scrolling page: 1. Make a frame that represents the
viewport. 2. Ensure content extends beyond the frame in the scroll
direction. 3. Enable vertical, horizontal, or both-direction overflow.
4. Set fixed/sticky behavior for relevant children. 5. Test scrolling in
preview. 6. Test nested scroll regions and interactions inside them. 7.
Decide whether navigation preserves or resets scroll position.

Common scenarios: - Long marketing page. - Product listing with
horizontal category chips. - Image carousel. - Map-like pan surface. -
Fixed bottom CTA. - Sticky section header. - Scroll-to-anchor
navigation.

## 9.8 Variables and conditional logic

A conditional evaluates a condition and chooses an action path.
Example: - If `cart/count > 0`, navigate to checkout. - Else, show an
empty-cart message.

Variables can store: - User selections. - Counters. - Form values. -
Selected tabs. - Filter states. - Expanded/collapsed state. - Theme
modes. - Simple simulated authentication status.

Use typed variables and explicit initial values. The runtime should
validate operations and define what happens when a variable is missing,
has the wrong type, or has an invalid value.

### Expressions

A prototype engine may support: - Arithmetic. - Comparisons. - Boolean
logic. - String operations where supported. - Variable references. -
Mode references. - Safe type conversion only where explicitly defined.

Do not treat arbitrary user-entered expressions as unrestricted code.
Parse them into a restricted expression tree; do not evaluate arbitrary
JavaScript.

## 9.9 Multiple actions and ordering

A single trigger may need several actions, for example: 1. Increment
cart count. 2. Set `toast/visible = true`. 3. Navigate to a cart preview
or open a confirmation overlay.

The engine must define ordering and transaction semantics. Recommended
default: - Execute actions in authored order. - Evaluate a conditional
when its step is reached. - Apply state changes deterministically. -
Resolve visual updates after the action transaction. - Report errors
without leaving state half-mutated where possible.

## 9.10 Interactive components

Interactive components are ideal for: - Buttons with
hover/pressed/disabled states. - Toggles and checkboxes. - Tabs. -
Accordions. - Dropdowns. - Carousels. - Menus. - Tooltips. - Switches
and segmented controls.

The component author should configure the interaction once, then
instances should reuse it. Test keyboard, pointer, and touch behavior
where relevant.

## 9.11 How to make prototyping easier and more fun

### A. Start with intent, not wires

Ask the designer to select a goal: - Click-through flow. -
Overlay/menu. - Form validation. - Responsive flow. - Interactive
component. - Stateful scenario. - Scroll/anchor navigation. - Complex
conditional flow.

Then offer a guided setup that creates sensible defaults without hiding
the underlying controls.

### B. Contextual connection suggestions

When a button is selected, suggest likely destinations based on frame
names and flow structure. These are recommendations only; the user must
approve them.

### C. Prototype health panel

Detect and explain: - Frames without a start point. - Unreachable
screens. - Dead-end screens. - Missing destinations. - Invalid variable
references. - Conditions with no meaningful fallback. - Overlays without
a close path. - Duplicate/conflicting triggers. - Broken component state
transitions. - Responsive screens without equivalent logical route
IDs. - Scroll settings where content does not overflow.

### D. Reusable interaction recipes

Provide editable templates for: - Login and OTP. - Password
visibility. - Search and empty results. - Filters and sort. -
Add-to-cart. - Quantity stepper. - Checkout steps. - Form validation. -
Delete confirmation. - Toast success/error. - Tabs and accordions. -
Responsive navigation. - Loading, success, and failure states.

### E. Visual state debugger

During playback, optionally show: - Current screen/route. - Active
variables. - Current variable modes. - Action history. - Current overlay
stack. - Scroll positions. - Trigger fired and branch chosen. - Errors
and validation warnings.

The debugger must be optional and must not alter the production-like
presentation.

### F. Prototype recording and replay

Allow a designer/tester to record a path, replay it, and annotate the
step where behavior diverged. A replay should capture interaction events
and relevant state---not only a video---when the application can do so
safely.

### G. Responsive device switcher

Switch preview width/device while preserving logical route and prototype
state where possible. Show a warning if the destination lacks a
responsive equivalent.

### H. AI assistance

An AI helper may: - Generate a proposed flow from a written user
journey. - Suggest variables for stateful interactions. - Draft
conditionals. - Find unreachable screens. - Explain why a connection is
broken. - Propose missing error/empty/loading states. - Create a test
plan. - Generate interaction documentation.

AI-generated changes must be previewed as a diff, validated, and
undoable. Never let the model silently overwrite a user's working
prototype.

## 9.12 Real-life prototype scenarios

### Scenario 1: Login with validation

Variables: - `auth/email` (string) - `auth/password` (string) -
`auth/error` (string or supported equivalent) - `auth/isAuthenticated`
(Boolean)

Flow: 1. User enters credentials. 2. Continue action checks that fields
are not empty. 3. Invalid fields display inline errors. 4. Valid-looking
credentials can simulate success or failure. 5. Success sets the
simulated auth state and navigates to home. 6. Failure shows an error
overlay or inline message. 7. Back navigation preserves fields if
intended.

**Boundary:** This simulates UX only. It does not verify real
credentials.

### Scenario 2: OTP verification

Variables: - `otp/entered` (string) - `otp/attempts` (number) -
`otp/isVerified` (Boolean) - `otp/canResend` (Boolean)

Flow: 1. Enter OTP. 2. Validate length and simulated correctness. 3. If
correct, mark verified and navigate. 4. If incorrect, increment attempts
and show error. 5. If attempts exceed the designed threshold, show a
locked/error state. 6. Resend toggles a simulated state or uses a real
service only in an integrated implementation. 7. Switching
desktop/mobile preview should preserve the logical OTP route and
relevant state.

### Scenario 3: Product filters

Variables: - `filters/category` (string) - `filters/inStockOnly`
(Boolean) - `filters/maxPrice` (number) - `filters/applied` (Boolean)

Flow: 1. Open filter overlay. 2. Change filter variables. 3. Apply
filters. 4. Show a results state consistent with selected values. 5.
Clear filters resets defaults. 6. Back/close behavior follows the
product's intended UX.

### Scenario 4: Shopping cart

Variables: - `cart/count` (number) - `cart/total` (number) -
`cart/hasItems` (Boolean)

Flow: 1. Add product. 2. Update count and total. 3. Show toast. 4. Open
cart. 5. If count \> 0, show checkout CTA; otherwise show empty state.
6. Remove item and recalculate total. 7. Test repeated clicks and edge
cases such as zero quantity.

### Scenario 5: Multi-step checkout

Model: - Delivery address. - Delivery method. - Payment method. -
Review. - Success/failure.

State: - `checkout/step` - `checkout/addressComplete` -
`checkout/deliveryMethod` - `checkout/paymentMethod` -
`checkout/total` - `checkout/status`

Use conditionals to prevent progression when required fields are
missing. Keep a consistent back path. Show loading and failure states.
For a real payment flow, use a secure integration rather than treating
the prototype as proof of payment behavior.

### Scenario 6: Data table with filters and row details

-   Select a row to open a side panel/overlay.
-   Filter and sort controls update the simulated table state.
-   Tabs switch between details, history, and attachments.
-   Status changes update the visible badge.
-   Confirmation appears before destructive actions.
-   Test large content, empty results, and permission-specific states.

### Scenario 7: Enterprise admin workflow

Simulate: - Search and filter. - Open record detail. - Assign owner. -
Change status. - Add comment. - Confirm action. - Display audit/history
state. - Handle denied/invalid action. - Navigate between desktop and
tablet layout without losing the logical record context.

### Scenario 8: Map, booking, or location flow

Prototype: - Search location. - Choose a result. - Adjust filters. -
Open detail. - Confirm selection. - Show permission-denied or
empty-result state.

**Boundary:** Live GPS, routing, external APIs, and accurate geospatial
data require real integration or deliberately mocked data.

## 9.13 Prototype complexity ladder

  -----------------------------------------------------------------------
  Level                   Capability              Example
  ----------------------- ----------------------- -----------------------
  1                       Static click-through    Landing → Details

  2                       Transitions             Slide/fade between
                                                  screens

  3                       Overlays                Menu, modal, tooltip

  4                       Scrolling               Long page, carousel,
                                                  sticky header

  5                       Interactive components  Tabs, toggles,
                                                  accordion

  6                       Variables               Cart count, selected
                                                  option

  7                       Conditionals            Form validation and
                                                  branching

  8                       Multi-action flows      Update state, show
                                                  toast, navigate

  9                       Responsive route        Same logical screen
                          continuity              across devices

  10                      End-to-end scenario     Onboarding, checkout,
                          simulation              admin workflow

  11                      Data-backed prototype   Real API responses with
                                                  controlled environment

  12                      Production application  Real auth, backend
                                                  rules, persistence,
                                                  security, monitoring
  -----------------------------------------------------------------------

Levels 10--11 can be highly realistic, but production-grade behavior
requires actual implementation, integration, and validation. A visual
prototype alone cannot guarantee production correctness.

------------------------------------------------------------------------

# 10. Recommended frontend architecture

This section proposes an architecture for DesignForge AI. It is not a
claim that Figma uses this exact stack.

## 10.1 Separation of responsibilities

Recommended layers: 1. **Application shell:** top bar, navigation,
panels, menus, dialogs. 2. **Editor state:** selection, active tool,
viewport, modal, focus, current mode. 3. **Document commands:** typed
operations such as move, resize, set fill, reparent, create node. 4.
**Document model:** pages, nodes, components, variables, assets,
prototype definitions. 5. **Layout engine:** constraints, Auto Layout,
intrinsic sizing, text measurement. 6. **Geometry engine:** paths,
transforms, bounds, intersections, Boolean operations. 7. **Renderer:**
canvas drawing, clipping, masks, effects, text, images. 8. **Hit-test
engine:** pointer-to-node mapping and selection rules. 9. **Prototype
editor:** wires, triggers, actions, transitions, conditions. 10.
**Prototype runtime:** route stack, state variables, action executor,
animation scheduler. 11. **Persistence/sync layer:** local operations,
autosave, collaboration, versioning. 12. **Import/export layer:** file
adapters, asset pipelines, code/spec/token exports. 13. **Plugin/AI
integration:** permissioned extensions and proposed edits.

## 10.2 Frontend module map

Example conceptual modules:

``` text
src/
  app/
    EditorShell
    TopBar
    Navigation
    LayersPanel
    AssetsPanel
    PropertiesInspector
    PrototypePanel
  canvas/
    CanvasSurface
    ViewportController
    PointerRouter
    SelectionOverlay
    SmartGuides
    HitTesting
  tools/
    SelectTool
    FrameTool
    ShapeTools
    PenTool
    TextTool
    HandTool
  document/
    schema
    commands
    selectors
    validation
    transactions
  engine/
    geometry
    transforms
    layout
    text
    renderer
    export
  components/
    definitions
    instances
    variants
    properties
  variables/
    collections
    modes
    aliasResolver
    scopes
  prototype/
    graphEditor
    interactionSchema
    expressionParser
    runtime
    actions
    transitions
    debugger
  persistence/
    localStore
    autosave
    syncClient
    migrations
  collaboration/
    presence
    operations
    conflictResolution
  importExport/
    adapters
    assets
    reports
  tests/
    unit
    integration
    visual
    performance
```

The directory names are illustrative. Choose a structure consistent with
the team's stack and build tooling.

## 10.3 React and rendering boundary

React is well suited for application chrome, inspector controls, menus,
dialogs, and navigation. A large interactive canvas should not
necessarily represent every vector point and every shape as a DOM node.

A practical hybrid: - React for UI and accessible controls. - A canvas
renderer for the design surface. - WebGL/WebGPU or a 2D canvas backend
depending on performance needs and implementation cost. -
WebAssembly/native compiled modules only for measured compute
bottlenecks. - Workers for non-UI computations where feasible. - Shared
typed document commands so canvas and inspector edits use the same
logic.

Do not choose WebAssembly or GPU rendering solely because a competitor
may use it. Start with performance profiling, establish document scale
targets, then select the simplest architecture that meets them.

## 10.4 Inspector as schema-driven UI

Do not hardcode a separate right panel for every node type. Use property
schemas and capability selectors. Each schema section defines: -
Applicability. - Control type. - Read/write adapter. - Validation. -
Mixed-value behavior. - Binding support. - Help text. - Permission
behavior. - Commit policy.

This allows new node types and properties to be added without rewriting
the entire inspector.

## 10.5 Event and command architecture

UI components should dispatch typed commands, not mutate arbitrary
nested objects directly.

Example: - `SetNodeFill(nodeId, paint)` - `MoveNodes(nodeIds, delta)` -
`ResizeNode(nodeId, bounds)` - `SetAutoLayout(nodeId, layoutConfig)` -
`SetVariableValue(variableId, modeId, value)` -
`CreatePrototypeInteraction(sourceId, interaction)` -
`ReparentNodes(nodeIds, parentId, index)`

Benefits: - Undo/redo. - Validation. - Collaboration. - Auditability. -
Deterministic testing. - Consistent behavior between keyboard, canvas,
inspector, AI, and imports.

------------------------------------------------------------------------

# 11. Recommended document model and design engine

## 11.1 Node tree

A document should use stable IDs and a structured hierarchy. A
simplified model:

``` ts
type NodeId = string;

type BaseNode = {
  id: NodeId;
  name: string;
  type: NodeType;
  parentId: NodeId | null;
  childIds: NodeId[];
  visible: boolean;
  locked: boolean;
  opacity: number;
  rotation: number;
  transform: Transform;
  fills: Paint[];
  strokes: Stroke[];
  effects: Effect[];
  blendMode: BlendMode;
  layout?: LayoutConfig;
  constraints?: Constraints;
  exportSettings?: ExportSetting[];
};

type FrameNode = BaseNode & {
  type: "frame";
  width: number;
  height: number;
  clipContent: boolean;
  background?: Paint[];
};

type TextNode = BaseNode & {
  type: "text";
  text: RichTextDocument;
  typography: Typography;
  textSizing: TextSizingMode;
};

type ComponentInstanceNode = BaseNode & {
  type: "instance";
  componentId: NodeId;
  overrides: InstanceOverride[];
};

type PrototypeInteraction = {
  id: string;
  trigger: Trigger;
  actions: PrototypeAction[];
  conditions?: ConditionExpression[];
  transition?: Transition;
};
```

This is illustrative pseudocode, not a complete production schema. Split
fields into composable structures if that reduces duplication. Define
schema versioning and migrations before the file format becomes widely
used.

## 11.2 Stable identity

Never rely only on layer names or array indexes to identify nodes. Names
change; order changes; multiple nodes can have the same name. Use stable
IDs for: - Nodes. - Components. - Variables. - Prototype interactions. -
Assets. - Paint entries. - Vector points and edges where needed.

Names remain important for human readability and may help Smart Animate
matching, but they are not sufficient as the only identity key.

## 11.3 Document operations and transactions

Every user edit should be a typed operation or transaction: - Create. -
Delete. - Rename. - Reparent. - Move. - Resize. - Set property. -
Reorder. - Create/update component. - Change variable binding. - Update
prototype interaction.

A drag can generate many transient previews but should commit as one
logical transaction. A "create component" action may include several
underlying changes but should undo as one user-level action.

## 11.4 Dependency graph

Track dependencies: - Component → instances. - Variable → bound
properties. - Variable alias → referenced variable. - Parent frame →
child layout. - Prototype interaction → source and destination nodes. -
Asset → nodes using it. - Text style → text nodes using it.

When a dependency changes, invalidate only the affected outputs. Detect
cycles in variable aliases and layout dependencies. Missing references
should create explicit diagnostics.

## 11.5 Layout and render caches

Cache: - Intrinsic text measurements. - Layout results. - World
transforms. - Bounding boxes. - Vector tessellation. - Rasterized
effects where safe. - Asset decoding. - Dependency resolution.

Invalidate caches based on relevant commands. A fill-color edit should
not require recomputing every text measurement. A font change should
invalidate text measurements and downstream layout. A parent size change
may invalidate its descendants' layout.

## 11.6 Command validation

Before applying a command: - Confirm target IDs exist. - Check
permissions. - Validate data types and ranges. - Ensure the operation is
legal for the node type. - Check parent/child constraints. - Prevent
invalid hierarchy cycles. - Check component and variable references. -
Validate prototype action targets. - Create a reversible transaction.

After applying: - Recompute dependencies. - Update selection if
required. - Record undo information. - Schedule persistence/sync. -
Notify renderer and inspector subscribers.

------------------------------------------------------------------------

# 12. Rendering, geometry, and precision

## 12.1 Coordinate spaces

At minimum, distinguish: - Local node coordinates. - Parent
coordinates. - Document/canvas coordinates. - Viewport coordinates. -
Device/screen pixels.

The transform chain typically combines translation, rotation, scale, and
possibly skew if supported. Use matrices or an equivalent consistent
transform representation. Pointer hit-tests must use the inverse
transform chain to map screen coordinates into local geometry.

## 12.2 Rendering pipeline

Recommended pipeline: 1. Resolve visible document nodes. 2. Resolve
inherited styles, variable values, and component properties. 3. Evaluate
layout. 4. Compute world transforms and bounds. 5. Determine viewport
culling. 6. Build render commands. 7. Render in z-order with
clipping/masks/effects. 8. Draw selection overlays and smart guides in a
separate interaction layer. 9. Handle text and image caches. 10. Update
only invalidated regions where practical.

Separate the design content renderer from editor overlays. Selection
handles should not be exported as part of the design.

## 12.3 GPU and WebAssembly decisions

The uploaded PDF discusses WebAssembly and GPU-accelerated rendering as
strategies for graphics-heavy applications. For a new implementation: -
Benchmark realistic files before choosing a rendering backend. - Keep
network requests and collaboration transport in the application/network
layer. - Use compiled modules for CPU-heavy geometry only if profiling
justifies the complexity. - Keep the UI responsive during expensive
calculations. - Handle GPU context loss and renderer fallback. - Provide
a non-GPU or reduced-effects fallback if the platform requires it.

Do not promise a specific frame rate across all devices without a
defined benchmark and hardware target.

## 12.4 Vector networks

If supporting graph-based vector networks: - Represent nodes and edges
with stable IDs. - Each edge references endpoint IDs and optional curve
controls. - Closed loops can define fillable regions. - Splitting an
edge creates a new node and replaces the edge with two edges. - Joining
nodes must resolve duplicate/near-duplicate geometry carefully. -
Deleting a node must define what happens to incident edges. - Fill
calculation should handle self-intersections and winding rules. -
Provide a point editor with multi-select and precise numeric
positioning.

## 12.5 Boolean geometry

Keep source operands and Boolean operation separate from the computed
render geometry. The renderer may cache the resulting outline, but the
document should preserve source shapes until explicit flattening.
Handle: - Nested Boolean groups. - Holes and contours. - Open paths. -
Degenerate shapes. - Near-coincident edges. - Self-intersection. -
Fill-rule consistency. - Stroke behavior after Boolean calculation.

## 12.6 Text layout

Text is often the largest source of subtle layout errors. Define: - Font
resolution and fallback. - Glyph measurement. - Line wrapping. - Line
height. - Baseline and font metrics. - Rich text runs. - Bidirectional
text. - Emoji and fallback fonts. - International composition input. -
Overflow and clipping. - Text autosizing. - Export parity.

A missing font should be a surfaced issue, not a silent layout mutation.

------------------------------------------------------------------------

# 13. State, undo/redo, persistence, and collaboration

## 13.1 Separate state categories

Keep distinct: - **Document state:** durable design content. - **Editor
state:** selection, zoom, active tool, open panels. - **Prototype
runtime state:** variables, route stack, overlays, scroll position. -
**Presence state:** cursors, active users, temporary selections. -
**Sync state:** pending operations, server acknowledgements, conflicts.

Do not persist ephemeral pointer coordinates as document edits. Do not
write prototype variable changes back into the authored design unless
the user explicitly performs a design edit.

## 13.2 Undo/redo

Undo should reverse logical transactions: - Drag → one move
transaction. - Resize gesture → one resize transaction. - Multi-field
operation → one transaction where appropriate. - Text edits → sensible
typing groups. - Component creation → one compound operation. -
AI-assisted edits → one reviewable transaction or grouped set.

Undo must restore: - Geometry. - Parent-child relationships. - Paint and
effects. - Variable bindings. - Component overrides. - Prototype
connections. - Layer order.

Undo/redo should not accidentally undo remote collaborators' changes as
if they were local edits. Collaboration-aware history needs an explicit
policy.

## 13.3 Autosave and recovery

Recommended behavior: - Save locally or queue operations promptly. -
Persist server-side with version/revision tracking. - Display
unsaved/syncing/saved/error states. - Retry transient failures with
backoff. - Preserve pending changes after a network interruption. -
Recover from a browser crash using the latest durable local checkpoint
where supported. - Offer a conflict-resolution path when concurrent
edits cannot be merged safely. - Never report "saved" until the required
persistence acknowledgement has occurred.

## 13.4 Multiplayer collaboration

The uploaded guide discusses operational transformation and CRDTs, then
describes a centralized server and property-level conflict handling as a
possible Figma architecture. Treat those details as source-document
claims. For DesignForge AI, choose a collaboration strategy based on
required offline support, document size, operation semantics, and
engineering expertise.

Requirements: - Live cursors and collaborator identity. - Presence and
selection indicators. - Document operations with stable targets. -
Deterministic ordering for layers. - Conflict resolution for
simultaneous edits. - Reconnection and replay. - Permission checks. -
Versioning and audit logs for important actions. - Bounded memory and
network payloads. - Clear offline and conflict status.

A collaboration algorithm must be tested for concurrent reparenting,
deletion while editing, simultaneous reordering, variable updates,
component changes, and offline reconnection---not just simultaneous text
changes.

## 13.5 Layer ordering

Do not rely on unstable array indexes alone for multiplayer ordering. A
position-key or sequence data structure can allow insertions without
renumbering every sibling. The chosen algorithm must define
deterministic tie-breaking and periodic key compaction if needed.

## 13.6 File versioning and migrations

Each saved document should have: - Schema version. - App version or
feature compatibility metadata. - Stable IDs. - Asset references. -
Migration history or a supported migration path. - Integrity validation.

Older files should either migrate safely or open in a clear
compatibility mode. Never silently drop unsupported properties during
import.

------------------------------------------------------------------------

# 14. Prototype runtime and state engine

## 14.1 Prototype graph

Represent prototype destinations and interactions as structured data,
not just canvas wires. A graph may include: - Screen/frame nodes. -
Source object IDs. - Trigger definitions. - Ordered action lists. -
Destination IDs. - Conditions. - Transition settings. - Overlay stack
behavior. - Flow starting points.

Wires are a visualization of graph edges; they are not the source of
truth.

## 14.2 Runtime state

A runtime session can include: - Current logical screen. - Navigation
history. - Variable store. - Variable mode context. - Active overlays. -
Interactive component states. - Scroll offsets. - Media playback
state. - Focused element. - Pending timed interactions. - Action
execution queue.

On reset, define whether all state resets or whether selected state is
preserved. Offer a clear "restart flow" behavior.

## 14.3 Action execution

Recommended lifecycle: 1. Receive user event. 2. Find matching
interactions for the hit target. 3. Filter by trigger and enabled state.
4. Evaluate conditions in a restricted expression evaluator. 5. Execute
actions in authored order. 6. Validate each state mutation. 7. Resolve
navigation and overlays. 8. Apply transition. 9. Re-render affected
nodes. 10. Record diagnostics for the optional debugger.

Prevent accidental double firing when a pointer event bubbles from a
child to a parent with its own interaction. Define event propagation
rules.

## 14.4 Navigation and route continuity

Each screen may have: - A frame ID. - A logical route/screen key. -
Responsive variants. - Optional route parameters. - Entry/exit
behavior. - State preservation rules.

On viewport change: 1. Determine the current logical route. 2. Find a
suitable frame variant for the new viewport. 3. Preserve compatible
variable state. 4. Preserve or reset scroll according to policy. 5.
Recompute layout. 6. Continue playback. 7. If no variant exists, use the
current responsive frame or show a warning.

## 14.5 Animation engine

Use an animation scheduler independent of the inspector UI. It should: -
Interpolate supported properties. - Respect easing/duration. - Avoid
mutating authored design values permanently. - Support interruption or
reversal policies. - Handle hidden/unmounted objects. - Avoid layout
thrashing. - Provide reduced-motion or instant transition options where
required. - Keep animation progress deterministic enough for automated
tests.

## 14.6 Expression safety

A safe expression engine should: - Parse expressions into an AST. -
Allow only documented operators and functions. - Type-check variable
references. - Bound execution time and expression size. - Disallow
arbitrary code execution, network access, filesystem access, and
reflection. - Produce understandable errors. - Make division-by-zero,
missing variables, and invalid types explicit.

## 14.7 Prototype debugging

Optional debug view: - Current route. - Trigger event. - Selected
interaction. - Evaluated condition. - Actions executed. - Variable
changes. - Overlay changes. - Scroll changes. - Errors. - Time spent per
action.

Debug mode must be separate from normal playback and should not change
the runtime semantics.

------------------------------------------------------------------------

# 15. Design-to-code and developer handoff

The uploaded guide describes Dev Mode and token pipelines as the bridge
between design and implementation. Figma's public developer platform
documents programmatic access to design data; exact API access and
payload capabilities depend on endpoint, permissions, and product
version.

## 15.1 Handoff information

A developer should be able to inspect: - Dimensions and position. -
Layout and constraints. - Padding and gap. - Typography. - Fills and
strokes. - Effects and blend modes. - Variables and styles. - Component
identity. - Asset export settings. - Prototype behavior and destination
flow. - Relevant responsive variants. - Notes and implementation
guidance.

## 15.2 Design-to-code mapping

Suggested mapping: - Auto Layout → Flexbox or CSS Grid where
appropriate. - Fixed dimensions → fixed CSS dimensions only when
semantically intended. - Hug content → content-driven sizing. - Fill
container → flex/grid growth behavior. - Constraints → anchored or
responsive positioning. - Variables → CSS custom properties, platform
tokens, or theme objects. - Component instances → reusable frontend
components. - Variants → component props/state variants. - Prototype
interactions → interaction specifications; not necessarily production
code.

Do not generate brittle code that absolutely positions every element
simply because the source design has coordinates. Preserve design intent
wherever possible.

## 15.3 Token pipeline

Recommended pipeline: 1. Read token definitions through supported
API/export mechanisms. 2. Resolve or preserve aliases according to
target format. 3. Validate naming, types, modes, and missing references.
4. Transform tokens to target platforms. 5. Generate CSS variables,
TypeScript constants, iOS values, Android resources, or other outputs.
6. Run tests and formatting. 7. Produce a diff. 8. Require review before
committing or deploying.

The uploaded guide mentions Style Dictionary as one possible
transformation tool. It is an option, not a mandatory choice.

## 15.4 Handoff warnings

Report: - Missing fonts. - Unsupported effects. - Raster-only assets
where vector output was expected. - Unresolved variables. - Detached or
missing components. - Unclear responsive behavior. - Absolute
positioning where flow layout may be intended. - Inconsistent spacing. -
Prototype interactions with no implementation note. - Low contrast or
accessibility concerns.

## 15.5 API and import/export boundaries

Use official API documentation and supported export paths. Do not assume
every internal document property is available through a public endpoint.
External file formats such as `.fig`, `.sketch`, `.xd`, `.psd`, or `.ai`
may have format/version restrictions and may not preserve all
interactions, effects, components, or editable structure. Every import
adapter should produce a fidelity report instead of promising perfect
round-trip conversion.

------------------------------------------------------------------------

# 16. Performance, accessibility, security, and recovery

## 16.1 Performance budgets

Set measurable targets for: - Initial document load. - Time to first
interactive canvas. - Selection latency. - Drag/resize frame pacing. -
Inspector update latency. - Layout recomputation. - Prototype transition
start. - Autosave acknowledgement. - Memory use for large documents.

Benchmark by document complexity: - Small file: a few dozen nodes. -
Medium file: several thousand nodes. - Large file: tens of thousands of
nodes with nested frames, images, and components.

These are test categories, not claims about any competitor's supported
limits.

## 16.2 Optimization strategies

-   Viewport culling.
-   Render caching.
-   Layout dependency invalidation.
-   Shared component definitions.
-   Asset decode caching.
-   Avoid unnecessary React re-renders.
-   Batch document mutations.
-   Debounce expensive inspector-derived calculations where safe.
-   Move non-UI computation off the main thread where feasible.
-   Use progressive loading for assets.
-   Keep prototype runtime independent from editor overlays.
-   Profile real interaction traces, not only static render benchmarks.

## 16.3 Accessibility

The editor should support: - Keyboard navigation. - Visible focus
states. - Accessible labels for inspector controls. - Screen-reader
names for layer types and actions. - High-contrast UI where possible. -
Reduced-motion options in playback where supported. - Text contrast
checks. - Clear errors and status messages. - Non-color-only indicators
for states. - Accessible exported prototypes where the output technology
supports it.

## 16.4 Security

-   Enforce document permissions on the server.
-   Validate all imported file structures.
-   Sanitize SVG and embedded content.
-   Restrict plugin capabilities.
-   Keep AI-generated edits reviewable.
-   Do not execute arbitrary expressions or imported scripts.
-   Validate external URLs before opening them.
-   Avoid exposing private document data to third-party services without
    consent.
-   Protect tokens and API credentials.
-   Provide auditability for sensitive enterprise operations.

## 16.5 Error recovery

Provide explicit handling for: - Renderer/GPU failure. - Missing or
corrupted assets. - Invalid document nodes. - Failed autosave. - Sync
conflicts. - Unsupported imported properties. - Missing fonts. - Invalid
variable aliases. - Broken prototype destinations. - Expression errors.

An error should identify the affected object and provide an actionable
next step. Preserve the user's work even when a subsystem fails.

------------------------------------------------------------------------

# 17. End-to-end tutorials and scenario recipes

## 17.1 Build a responsive login screen

1.  Create a page called `Authentication`.
2.  Add a desktop frame and a mobile frame.
3.  Create a semantic token collection for surfaces, text, borders, and
    actions.
4.  Build the form as nested Auto Layout frames.
5.  Use hug sizing for labels and buttons where appropriate.
6.  Use fill sizing for fields that should stretch.
7.  Add min/max widths to the form container.
8.  Create field, button, and error-message components.
9.  Expose text and Boolean component properties where useful.
10. Add variables for email, password, and error state.
11. Add submit interaction and conditional validation.
12. Add success and failure paths.
13. Map both desktop and mobile frames to the same logical route.
14. Preview at multiple widths and test long text.
15. Check keyboard order, contrast, and missing-font warnings.

## 17.2 Build a dropdown menu

1.  Create a button component.
2.  Create a menu frame with Auto Layout.
3.  Create an open state as an overlay or interactive component.
4.  Add click/tap interaction to open it.
5.  Add selection actions to update the selected value.
6.  Close the menu after selection if intended.
7.  Add outside-click and Escape close behavior where supported.
8.  Test menu clipping, viewport edges, long labels, and keyboard
    accessibility.

## 17.3 Build a form with validation

1.  Identify required and optional fields.
2.  Create variables with correct types.
3.  Define valid/invalid conditions.
4.  Use inline error states and a summary if appropriate.
5.  Prevent progression when required conditions fail.
6.  Preserve valid fields when another field fails.
7.  Provide success, loading, and failure states.
8.  Test empty input, malformed input, long input, and repeated
    submission.
9.  Document which behavior is simulated and which is real integration.

## 17.4 Build a stateful shopping cart

1.  Define product, count, and total variables.
2.  Create reusable product cards and quantity controls.
3.  Use one component for repeated card structure.
4.  Add actions to increment/decrement quantity.
5.  Guard against negative quantities.
6.  Update total consistently.
7.  Use conditionals for empty/non-empty cart.
8.  Add a confirmation or toast overlay.
9.  Test repeated actions, removing the last item, and returning from
    checkout.

## 17.5 Build a complex enterprise workflow

1.  Define the journey and screen states.
2.  Create shared components for navigation, tables, forms, badges, and
    dialogs.
3.  Define variables for selected record, status, owner, filters, and
    validation.
4.  Build detail panels and overlays.
5.  Add conditional transitions for permitted and blocked actions.
6.  Simulate loading and server failure.
7.  Add a debugger/test plan.
8.  Validate responsive route continuity.
9.  Document production-only behaviors requiring backend implementation.

------------------------------------------------------------------------

# 18. Testing strategy and acceptance criteria

## 18.1 Unit tests

Test: - Transform math. - Bounds and hit-testing. - Layout
calculations. - Text measurement adapters. - Variable alias
resolution. - Scope/type filtering. - Component override resolution. -
Prototype expression parsing. - Conditional evaluation. - Action
ordering. - Undo/redo transactions. - Serialization and migrations.

## 18.2 Integration tests

Test: - Selecting a node updates the inspector. - Editing a fill updates
canvas and document. - Moving a child in Auto Layout changes order or
position as designed. - Changing a component updates instances but
preserves allowed overrides. - Changing a variable mode updates bound
nodes. - Prototype action changes a variable and the rendered UI. - A
conditional selects the expected branch. - Overlay open/close behavior
works. - Scrolling and fixed elements work together. - Responsive
switching preserves route/state where configured. - Save/reload restores
the document and prototype definitions.

## 18.3 Visual regression tests

Create fixtures for: - Text wrapping. - Nested Auto Layout. - Min/max
constraints. - Rotated and clipped shapes. - Gradients and shadows. -
Masks and Boolean operations. - Light/dark modes. - Component
overrides. - Dense tables. - Large images. - Prototype transitions.

Define pixel tolerances and account for font/rendering differences
across environments.

## 18.4 Property-panel acceptance checklist

-   [ ] No selection shows file/page resources rather than stale layer
    properties.
-   [ ] Selecting a frame exposes frame/layout controls.
-   [ ] Selecting text exposes text controls.
-   [ ] Selecting a component instance exposes its declared component
    properties.
-   [ ] Boolean property toggles the mapped layer.
-   [ ] Text property updates the mapped text node.
-   [ ] Instance-swap property replaces only a compatible nested
    component.
-   [ ] Mixed selections show mixed values.
-   [ ] Editing a shared property applies to all compatible selected
    nodes.
-   [ ] Auto Layout children show relevant sizing and alignment options.
-   [ ] Variable bindings are visible and can be changed intentionally.
-   [ ] Read-only users cannot commit edits.
-   [ ] Undo restores the previous value.
-   [ ] External updates do not unexpectedly steal focus.
-   [ ] Missing references produce actionable warnings.

## 18.5 Prototype acceptance checklist

-   [ ] Each flow has a valid starting point.
-   [ ] Triggers fire only under the intended conditions.
-   [ ] Actions execute in documented order.
-   [ ] Conditions handle true and false paths.
-   [ ] Variables have valid types and initial values.
-   [ ] Variable changes update all bound nodes.
-   [ ] Overlay has a valid close path.
-   [ ] Scroll containers have overflow content.
-   [ ] Fixed/sticky elements behave as intended.
-   [ ] Transitions can be interrupted/reset according to policy.
-   [ ] Responsive device switching preserves logical route/state when
    configured.
-   [ ] Broken connections are detected.
-   [ ] The debugger can explain the last action.
-   [ ] Resetting the flow returns to a defined initial state.
-   [ ] Production-only behavior is labelled as simulated unless
    integrated.

## 18.6 Import/export acceptance checklist

-   [ ] Imported files are validated before parsing.
-   [ ] Unsupported features appear in a fidelity report.
-   [ ] Assets are extracted and referenced correctly.
-   [ ] Layer hierarchy is preserved where possible.
-   [ ] Components and variables are mapped or explicitly reported as
    unsupported.
-   [ ] Prototype interactions are imported only when the source adapter
    can interpret them reliably.
-   [ ] Exported files preserve supported vector, text, fill, stroke,
    and effect semantics.
-   [ ] Round-trip tests identify expected losses rather than claiming
    perfect fidelity.

------------------------------------------------------------------------

# 19. Implementation roadmap

## Phase 1 --- Reliable editor foundation

-   Document schema and stable IDs.
-   Canvas viewport.
-   Basic shapes, text, frames, and images.
-   Selection, multi-selection, hit-testing.
-   Move, resize, rotate, zoom, pan.
-   Layers tree.
-   Contextual inspector.
-   Undo/redo.
-   Save/load and schema versioning.

**Exit criteria:** Core editing is deterministic, recoverable, and
testable.

## Phase 2 --- Layout and design systems

-   Auto Layout / flow engine.
-   Constraints and min/max dimensions.
-   Text measurement and wrapping.
-   Styles and variables.
-   Component definitions and instances.
-   Overrides, variants, and component properties.
-   Library publishing/importing.

**Exit criteria:** Reusable components and responsive layouts survive
content and viewport changes.

## Phase 3 --- Advanced geometry and export

-   Pen/vector editing.
-   Boolean operations.
-   Masks and clipping.
-   Advanced fills, strokes, and effects.
-   SVG/PNG/PDF export as supported.
-   Performance caches and visual regression suite.

**Exit criteria:** Vector edits remain precise and exported output
matches supported canvas rendering.

## Phase 4 --- Prototyping foundation

-   Prototype graph and starting points.
-   Triggers, navigation, back, overlays.
-   Transition and animation system.
-   Scroll behavior.
-   Interactive components.
-   Playback and reset.
-   Prototype panel and connection wires.

**Exit criteria:** Complete basic and intermediate user journeys can be
authored and played.

## Phase 5 --- Stateful prototyping

-   Typed variable store.
-   Variable bindings and modes.
-   Restricted expression parser.
-   Conditionals and multiple actions.
-   Runtime debugger.
-   Responsive route continuity.
-   Prototype validation and health panel.

**Exit criteria:** Complex stateful flows work with deterministic,
inspectable behavior.

## Phase 6 --- Collaboration and handoff

-   Operation-based persistence and sync.
-   Presence and conflict handling.
-   Version history.
-   Developer inspection.
-   Token export pipeline.
-   API integrations.
-   Import adapters and fidelity reports.

**Exit criteria:** Teams can collaborate safely and developers can
consume reliable specifications.

## Phase 7 --- AI-assisted workflows

-   AI-assisted token generation.
-   AI-generated prototype flow proposals.
-   Missing-state and broken-flow analysis.
-   Design-to-code proposals.
-   Diff review and undo.
-   Permissioned AI actions and audit trail.

**Exit criteria:** AI saves time without making unreviewable or
destructive changes.

------------------------------------------------------------------------

# 20. Source notes and references

## 20.1 Uploaded primary reference

**Figma Design Comprehensive Guide.pdf** (33 pages), supplied with this
request.

Key source topics: - Pages 1--4: browser-based design architecture,
hybrid client architecture, WebAssembly, WebGL. - Pages 5--8:
multiplayer synchronization concepts, OT/CRDT discussion, fractional
indexing. - Pages 9--10: vector networks and Boolean operations. - Pages
11--13: Auto Layout, resizing, constraints, absolute positioning. -
Pages 14--18: components, variants, variables, token tiers, modes. -
Pages 19--20: Smart Animate, variables, conditionals, Dev Mode, APIs,
token pipelines. - Pages 21--33: synthesis and a list of external
reading/reference links.

The source is useful as a technical framing document. Claims about
proprietary internals and exact performance figures should be verified
independently before being used as engineering requirements.

## 20.2 Official Figma documentation consulted

1.  **Explore design files** --- workspace, canvas, toolbar, sidebars,
    and layers:\
    https://help.figma.com/hc/en-us/articles/15297425105303-Explore-design-files

2.  **Design, prototype, and explore layer properties in the right
    sidebar** --- contextual properties and Design/Prototype panels:\
    https://help.figma.com/hc/en-us/articles/360039832014-Design-prototype-and-explore-layer-properties-in-the-right-sidebar

3.  **Guide to Auto Layout in Figma** --- layout flow, spacing, sizing,
    wrapping, and responsive behavior:\
    https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout-in-Figma

4.  **Guide to prototyping in Figma** --- flows, starting points,
    triggers, actions, transitions, overlays, scrolling, and advanced
    interactions:\
    https://help.figma.com/hc/en-us/articles/360040314193-Guide-to-prototyping-in-Figma

5.  **Use variables in prototypes** --- variable-backed state, actions,
    expressions, and conditionals:\
    https://help.figma.com/hc/en-us/articles/14506587589399-Use-variables-in-prototypes

6.  **Guide to variables in Figma** --- variables for design systems and
    advanced prototyping:\
    https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma

7.  **Prototype scroll and overflow behavior** --- vertical/horizontal
    scrolling, fixed/sticky elements, and scroll position:\
    https://help.figma.com/hc/en-us/articles/360039818734-Prototype-scroll-and-overflow-behavior

8.  **Create overlays in your prototypes** --- overlay use cases and
    configuration:\
    https://help.figma.com/hc/en-us/articles/360039818254-Create-overlays-in-your-prototypes

9.  **Prototype actions** --- action types including conditionals and
    scroll-to:\
    https://help.figma.com/hc/en-us/articles/360040035874-Prototype-actions

10. **Variable modes in prototypes** --- mode changes and mode-aware
    expressions:\
    https://help.figma.com/hc/en-us/articles/15253268379799-Variable-modes-in-prototypes

11. **Explore the navigation bar and left sidebar** --- current
    navigation, layers, assets, and variable access:\
    https://help.figma.com/hc/en-us/articles/360039831974-Explore-the-navigation-bar-and-left-sidebar

12. **Figma Developer Documentation** --- API and developer platform
    entry point:\
    https://developers.figma.com/docs/

## 20.3 How claims are separated

-   **Source-derived:** concepts explicitly covered by the uploaded PDF,
    such as Auto Layout, components/instances, variables, modes, vector
    networks, Boolean operations, prototype state, and handoff.
-   **Official product behavior:** workflows described in the linked
    Figma Help Center pages.
-   **Recommended design for DesignForge AI:** schemas, module
    boundaries, inspector resolver, runtime architecture, testing
    strategy, AI workflow, and roadmap.
-   **Requires validation:** claims about Figma's proprietary backend,
    exact synchronization algorithms, rendering internals, performance
    figures, or behavior not documented in official public sources.

## 20.4 Final implementation principle

The most important lesson is that a professional design tool is a
coordinated system. The canvas, layer tree, inspector, component model,
variable resolver, layout engine, prototype runtime, persistence layer,
and export pipeline must all operate on the same stable document model.
If they are implemented as disconnected features, the product may look
convincing but will fail under real editing, responsive behavior,
stateful prototyping, collaboration, and handoff.
