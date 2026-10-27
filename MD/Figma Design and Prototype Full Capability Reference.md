# Figma Design and Prototype: Full Capability Reference for Building a Replica

*Prepared 26 October 2026. Covers the Design tab, the Prototype tab, the left sidebar, canvas behaviour, every tool and property panel, plus build notes for a replica. Shortcuts are macOS; on Windows swap Cmd for Ctrl and Option for Alt.*

## 1. Application shell (UI regions)

- **Top/main menu** (Figma logo menu): File, Edit, View, Object, Vector, Text, Arrange, Plugins, Widgets, Preferences, Libraries, Help.
- **Toolbar**: floating bar at bottom centre (current UI) or top bar (classic UI). Holds tool groups, plus Dev Mode toggle.
- **Left sidebar**: File tab (pages and layers), Assets tab (components, styles, libraries), search. Newer builds add a left-nav entry for plugins, shaders and Weave image tools.
- **Canvas**: infinite workspace in the centre, with rulers, guides, grids, comments, multiplayer cursors.
- **Right sidebar**: two tabs, **Design** and **Prototype**, plus a zoom/view control and a Share button in the header. Content changes with the selection.
- **Modes**: Design mode, Dev Mode (Shift+D, inspect and handoff), and presentation/prototype view.
- **File header**: file name, project breadcrumb, multiplayer avatars, Share, Present (play), zoom percentage menu.

## 2. Main menu in detail

**File**: new design/FigJam file, place image or video, save local copy, save to version history, show version history, export (frames to PDF, selection), file settings (colour profile sRGB or Display P3), duplicate, move to project, copy link, pin, close tab.

**Edit**: undo/redo, cut/copy/paste, paste over selection, copy as text/CSS/SVG/PNG, copy and paste properties, duplicate, delete, select all, select inverse, select none, select matching layers, find and replace text, rename, flip horizontal/vertical, rotate, pick colour.

**View**: pixel grid, layout grids, rulers, guides, pixel preview, outlines, multiplayer cursors, comments visibility, snap to geometry / pixel grid / objects, zoom in/out/fit/selection/100%/200%/50%, hide UI, focus mode.

**Object**: group, ungroup, frame selection, section, mask, flatten, outline stroke, boolean groups (union, subtract, intersect, exclude), create/detach component, reset overrides, add/remove auto layout, constraints, lock/hide, ordering (bring to front, forward, backward, send to back), wrap in layout, replace with.

**Vector**: edit object, join, flatten, outline stroke, bend/smooth, vector tools.

**Text**: bold, italic, underline, strikethrough, lists, alignment, case, link, increase/decrease size and weight, truncate.

**Arrange**: align and distribute, tidy up, order.

**Plugins and Widgets**: run, manage, development, publish.

## 3. Left sidebar

### 3.1 Pages

- Add, rename (double click), reorder (drag), duplicate, delete pages. Each page is an independent infinite canvas.
- Page properties (right panel with nothing selected): background colour, local variables, local styles, export settings for the page, and plugin data.
- Section dividers via page names (for example a page named with dashes acts as a visual separator).

### 3.2 Layers panel

- Tree of every node: frames, groups, sections, components, instances, shapes, text, vectors, boolean groups, slices, images.
- Per-row controls: type icon, name, lock toggle, eye (visibility) toggle, expand/collapse arrow.
- Behaviours: click to select, Shift-click range select, Cmd-click multi-select, drag to reorder or reparent, double-click to rename, Option-click arrow to expand all children, selection syncs with canvas (auto-scroll), hover highlights node on canvas, right-click context menu.
- Layer search with filters (name, type: frame, component, text, image, section, and so on), plus find-and-replace.
- Icons distinguish: Frame (#), Section, Group, Component (diamond, purple), Instance (hollow diamond), Variant set (purple dashed frame), Mask, Boolean, Vector, Text (T), Image, Slice, Auto layout frames (stacked bars icon).
- Auto-rename conventions: text layers take their content, shapes take type names; AI rename available.

### 3.3 Assets panel

- Lists local components, then components from each enabled team library, grouped by file and by folder (slash naming).
- Search by name and description, grid or list view, drag to canvas to create an instance, swap library, enable/disable libraries, update available changes.
- Shows variants as a thumbnail with property controls; styles and variables from libraries are discoverable through pickers.
- Recents and favourites; component descriptions and documentation links appear on hover.

## 4. Toolbar tools

**Move group**

- **Move (V)**: select, drag, resize via handles, rotate from outside corners, nudge with arrows (1 px, Shift 10 px, configurable).
- **Scale (K)**: parametric scaling that also scales text size, stroke weight, effects and radius proportionally.

**Region group**

- **Frame (A or F)**: draw a frame or pick a preset (Phone, Tablet, Desktop, Watch, Presentation, Paper, Social media). Frames clip content, support auto layout, constraints, grids, prototype flows, and nest infinitely.
- **Section (Shift+S)**: organise frames on canvas, has fill, can be marked ready for dev.
- **Slice (S)**: invisible export region.

**Shape group**

- **Rectangle (R)**, **Line (L)**, **Arrow (Shift+L)**, **Ellipse (O)**, **Polygon**, **Star**, **Place image/video (Shift+Cmd+K)**.
- Shape drawing modifiers: Shift constrains proportion (or 45 degrees for lines), Option draws from centre, Cmd while resizing keeps child proportions.
- On-canvas handles: corner radius dots on rectangles, arc handles on ellipses (start, sweep, inner ratio for donuts), count and ratio handles for polygon and star.

**Creation group**

- **Pen (P)**: click for corner points, click-drag for curves, closes paths, builds vector networks. **Pencil (Shift+P)**: freehand, auto-smooths into vector. **Brush (B)** and **Shape Builder (Shift+M)** from the Draw toolset.
- **Text (T)**: click for auto-width text, drag for fixed box.

**Utility**

- **Hand (H)** or hold Space to pan; **Zoom (Z)** drag to zoom to region; **Comment (C)** drops threaded pins; **Colour picker (I)**; **Dev Mode (Shift+D)**; **Actions / quick actions (Cmd+/)** command palette; **Plugins**.

## 5. Canvas behaviour

- **Infinite canvas**, zoom roughly 2% to 25600%. Zoom: Cmd+scroll, pinch, Cmd+plus/minus, Shift+1 (fit all), Shift+2 (fit selection), Shift+0 (100%), Shift+Cmd+... presets in the zoom menu.
- **Pan**: Space-drag, middle mouse, trackpad two-finger scroll, Hand tool.
- **Rulers** (Shift+R): drag from a ruler to create guides; Shift+Cmd+... toggles guide visibility; guides are per page and can be locked or removed by dragging back.
- **Pixel grid** (Cmd+'): appears above roughly 800% zoom. **Snap to pixel grid** (Shift+Cmd+').
- **Layout grids** (Ctrl+G): overlays for frames.
- **Outlines mode** (Cmd+Y): wireframe view. **Pixel preview** (Option+Cmd+Y): rasterised preview at 1x or 2x.
- **Smart guides**: red alignment lines and spacing indicators snap to edges, centres, equal spacing, parent edges, pixel grid.
- **Measurement**: hold Option and hover another layer to see distance overlays to the selection.
- **Selection model**: click selects top-level object in the current context; double-click enters group/frame; Cmd-click deep-selects; Enter selects children; Shift+Enter selects parent; Tab and Shift+Tab move between siblings; marquee drag selects frames/objects fully or partly inside; Shift adds to selection.
- **Duplicate**: Option-drag copies; Cmd+D duplicates and repeats the last move offset.
- **Rotation**: drag outside a corner handle; Shift snaps to 15 degrees; rotation pivot is the centre (a rotation origin can be changed in UI3).
- **Multiplayer**: live cursors with name labels, selection outlines per user, follow/observation mode, spotlight, chat (Cmd+/ in FigJam), voice.
- **Comments**: pins anchored to canvas or layers, threads, mentions, resolve, filters, notifications.
- **Canvas background**: set per page (right panel, nothing selected).
- **Cursor chat, reactions, stamps** exist in design files for collaboration.

## 6. Right sidebar: Design tab (every property)

Panels appear in this order for a typical layer. Missing panels simply do not apply to the layer type.

### 6.1 Selection header and page properties

- Breadcrumb of the selection (frame > group > layer), component/instance badge with go-to-main, detach, reset-overrides actions.
- With nothing selected: Page background colour, Local variables, Local styles, Export (page), Plugins data.

### 6.2 Alignment

- Align left, horizontal centre, right, top, vertical centre, bottom (Option+A, H, D, W, V, S).
- Distribute horizontal and vertical spacing (Ctrl+Option+H and V), tidy up, align relative to selection or parent frame.

### 6.3 Position

- **X, Y** (relative to parent frame, top-left reference unless changed), **Rotation** angle, **Flip** horizontal/vertical.
- Constraints and position mode (absolute, or ignore auto layout for children inside an auto layout frame).

### 6.4 Layout (size and structure)

- **W, H**, lock aspect ratio, **Resizing**: Fixed, Hug contents, Fill container; min and max width/height; aspect ratio lock.
- **Clip content** (frames), **Show in prototype / outline**.
- **Auto layout** (Shift+A to add, Option+Shift+A to remove):
  - Direction: horizontal, vertical, wrap; grid flow (rows and columns, with spans) in newer versions.
  - Gap between items (fixed number or Auto/space-between), plus row gap in wrap.
  - Padding: uniform or separate horizontal/vertical or four independent sides.
  - Alignment: 3x3 pad (nine positions) for main and cross axes; text baseline alignment for horizontal flows.
  - Canvas stacking: first-on-top or last-on-top.
  - Include strokes in layout toggle.
  - Child options: Fill/Hug/Fixed per axis, absolute position within the frame, align self, min/max sizes.
- **Constraints** (for children of non-auto-layout frames): horizontal Left, Right, Left and Right, Center, Scale; vertical Top, Bottom, Top and Bottom, Center, Scale. A mini diagram on the panel toggles each edge.

### 6.5 Frame-specific

- Frame presets and device list, orientation swap, W and H input, resize to fit contents.
- Corner radius, individual corners, corner smoothing (squircle, 0 to 100%).
- Clip content, layout grid, prototype device and background (shown in Prototype tab).

### 6.6 Appearance

- **Opacity** (0 to 100%, also by typing a digit key on canvas, 1 = 10% up to 0 = 100%).
- **Corner radius**: single value or four independent corners, smoothing.
- **Blend mode**: Pass through (groups/frames), Normal, Darken, Multiply, Plus darker, Color burn, Lighten, Screen, Plus lighter, Color dodge, Overlay, Soft light, Hard light, Difference, Exclusion, Hue, Saturation, Color, Luminosity.
- **Visibility** toggle, lock toggle, mask toggle, "Use as mask" (Ctrl+Cmd+M) with mask types alpha, vector, luminance.

### 6.7 Typography (text layers)

- Font family (with search, recent, filters, local and shared fonts), style/weight, size.
- Line height: auto, px, percent. Letter spacing: percent or px. Paragraph spacing, paragraph indent, list spacing.
- Horizontal alignment (left, centre, right, justify), vertical alignment (top, middle, bottom).
- Resize mode: Auto width, Auto height, Fixed size. Truncate text with max lines.
- Case: original, UPPER, lower, Title, Small caps, All small caps.
- Decoration: underline, strikethrough, with style, skip-ink, offset and thickness.
- Lists: bullets, numbered, with hanging punctuation and indent.
- Vertical trim (cap height to baseline).
- Advanced: OpenType features (ligatures, fractions, numerals, tabular figures, stylistic sets, small caps, contextual alternates), variable font axes, language, font fallbacks, missing font replacement.
- Mixed-value editing for partial text selection, hyperlinks, text styles.

### 6.8 Fill

- Stackable list of fills with drag reorder, visibility, add and remove.
- **Types**: Solid, Gradient (Linear, Radial, Angular, Diamond), Image, Video, Pattern, Shader (newer).
- **Colour picker**: spectrum square, hue slider, alpha slider, formats HEX, RGB, CSS, HSL, HSB, eyedropper, document colours, library colours, styles list, variable picker. Document profile sRGB or Display P3.
- **Gradient editing**: on-canvas handles, stops with colour and alpha, add by click, delete, reverse, rotate, scale.
- **Image fill**: Fill, Fit, Crop, Tile modes, scale, rotation, and adjustments (exposure, contrast, saturation, temperature, tint, highlights, shadows). Replace image, reset.
- **Fill as style or variable**: binds to colour styles or colour variables.

### 6.9 Stroke

- Stackable strokes with colour, opacity, style/variable binding.
- **Position**: Inside, Center, Outside. **Weight** (number, per-side for frames and rectangles: top, right, bottom, left).
- **Style**: solid, dash and gap pattern, with custom dash arrays.
- **Caps** (start and end): none, round, square, arrows (line arrow, triangle arrow, reversed triangle), circle, diamond. **Joins**: miter, bevel, round, with miter angle.
- Variable width and brush strokes (Draw tools): width profiles, scatter/stretch brushes, dynamic strokes with frequency, wiggle and smoothing.
- Outline stroke (Shift+Cmd+O) converts to a filled vector.

### 6.10 Effects

- Stackable and reorderable. Each has toggle, settings popover, and style binding.
- **Drop shadow**: X, Y, blur, spread, colour, opacity, blend mode, show behind transparent areas.
- **Inner shadow**: X, Y, blur, spread, colour, blend.
- **Layer blur** (Gaussian) and **Progressive blur** (start/end blur with angle).
- **Background blur** (frosted glass behind translucent layers).
- **Noise** (mono, multitone, duo), **Texture**, **Glass** (light angle, intensity, refraction, depth, dispersion, frost).
- **Shader effects** (WebGPU-based, parameterised controls on canvas, recent addition).
- Effect styles save and reuse stacks.

### 6.11 Layout grid (frames)

- Types: Grid (square cells), Columns, Rows. Multiple grids per frame.
- Properties: size or count, alignment (stretch, left, centre, right), margin, gutter, offset, colour and opacity.
- Grid styles; toggle visibility with Ctrl+G.

### 6.12 Export

- Add multiple export settings per layer or slice: scale (0.5x, 1x, 2x, 3x, 4x, or width/height targets), suffix, format PNG, JPG, SVG, PDF (and WebP in newer builds).
- SVG options: include id attribute, outline text, simplify strokes. PDF multi-frame export from the File menu. Preview before export.
- Export frames at once, or copy as PNG/SVG/CSS.

### 6.13 Component, variants and properties

- **Create component** (Option+Cmd+K), **create variants** (variant set with property grid, naming Property=Value), **instances**, **main components**.
- **Property types**: Boolean, Text, Instance swap (with preferred instances), Variant, and Slot in newer builds.
- **Overrides**: text, fills, strokes, effects, visibility, nested instance swap. **Reset overrides**, **detach instance** (Option+Cmd+B), **go to main**, **restore**, **push overrides** when applicable.
- Descriptions, documentation links, publishing to team libraries, library updates, usage analytics (organisation plans).

### 6.14 Variables and modes

- Types: Color, Number, String, Boolean. Collections with **modes** (light/dark, breakpoints, languages, density), aliases (variable references), scopes, code syntax for web/Android/iOS, folder grouping with slash names, extended collections for enterprise.
- Bind to fills, strokes, radius, spacing (padding and gap), width/height, opacity, text content, visibility, component properties, stroke weight, font properties.
- Set explicit variable modes on frames and instances to preview themes.

### 6.15 Styles

- Colour (fill and stroke), Text, Effect, and Grid styles; folder naming with slashes; descriptions; detach; publish to libraries; swap.

## 7. Vector editing and shapes

- **Vector networks**: points can join any number of segments (not just paths).
- Edit mode (Enter on a vector): move points, add points with Pen, delete, join, split, curve handles with mirroring modes (angle and length, angle only, none), per-point corner radius, Bend tool for dragging curves, lasso select.
- **Boolean operations**: union, subtract, intersect, exclude (Ctrl+Cmd+U, S, I, X), remain live until flattened (Cmd+E). Draw tool adds **Shape Builder** to merge and subtract regions interactively.
- **Flatten**, **Outline stroke**, **Mask** (any shape, group, or image), **Offset/outline** via plugins.
- Polygon: 3 to 60 sides; Star: points count and inner ratio; Ellipse: arc sweep and ratio; Rectangle: independent radii; Line: weight through stroke only; Arrow: line with end cap.
- Paste SVG text from clipboard to create editable vectors.

## 8. Prototype tab (every property)

### 8.1 Flows and starting points

- Select a frame, click **+ Flow starting point** in the right panel (or the play icon next to the frame name). Name flows, add multiple per page, reorder, rename.
- Each flow becomes an entry point in Present and Share modes.

### 8.2 Interactions (select any layer)

Click **+** in the Interactions section, then configure four things: Trigger, Action, Destination or details, Animation.

**Triggers**

- On click / On tap, On drag, While hovering, While pressing, Key / Gamepad (key combinations and gamepad buttons), Mouse enter, Mouse leave, Mouse down, Mouse up, After delay (milliseconds timer).

**Actions**

- **Navigate to** (frame), **Back**, **Scroll to** (layer in scroll container), **Open link** (new tab option), **Open overlay**, **Swap overlay**, **Close overlay**.
- **Change to** (swap component variant, enabling interactive components such as hover states, toggles, tabs).
- **Set variable** (number, string, boolean, colour; with expressions), **Set variable mode** (switch themes, languages).
- **Conditional** (if / else if / else branches, each with nested actions).
- **Media** actions on video layers: play, pause, toggle play, mute, unmute, toggle mute, skip forward, skip backward, skip to time.

**Animation**

- Types: Instant, Dissolve, **Smart animate** (matches layers by name and hierarchy across frames and interpolates position, size, rotation, opacity, fill, stroke, effects and radius), Move in, Move out, Push, Slide in, Slide out.
- Direction for move/push/slide: left, right, top, bottom.
- **Easing**: Linear, Ease in, Ease out, Ease in and out, Ease in back, Ease out back, Ease in and out back, Custom cubic bezier, spring presets (Gentle, Quick, Bouncy, Slow), and Custom spring (mass, stiffness, damping, initial velocity).
- **Duration** in milliseconds.

### 8.3 Overlay settings

- Position: centre, top left/centre/right, bottom left/centre/right, manual (placed where designed).
- Close when clicking outside; add background overlay with colour and opacity.

### 8.4 Scroll and fixed behaviour

- Frame overflow: no scrolling, horizontal, vertical, both directions.
- Children set to "fix position when scrolling" to behave as sticky headers/footers.
- Scroll-to targets, snap-free scrolling through nested frames.

### 8.5 Frame prototype settings

- Device preset (phone, tablet, desktop, watch) with rotation, device frame display, background colour (shown outside the frame), starting frame.
- Presentation view scaling: min zoom, zoom to fit, fit width, fill, 100%.

### 8.6 Variables, conditions and expressions

- Use variables as counters, toggles, form validation, cart totals, themes.
- Numeric operators + - \* /; string concatenation; boolean operators NOT, AND, OR; comparisons ==, !=, >, >=, <, <=.
- Conditionals can chain several actions per branch (set variable, navigate, change variant).
- Variable values display in present mode, reset on restart.

### 8.7 Present and share

- Present (Option+Cmd+Enter) opens a new window or tab; Preview on phone through the mobile app mirror.
- Viewer controls: restart, zoom, hotspot hints toggle, comment, show/hide UI, fit-to-screen.
- Share prototype link with permissions (view, comment, edit), password, starting point selection, hide UI, embed code, scaling and fidelity settings.
- Collaboration: comments in prototype view, multiplayer viewers, flow switching.
- Connections on canvas: arrow lines (noodles) from layers to destination frames, drag connection handle to create, click to edit, flows listed in right panel.

### 8.8 Interactive components

- Add interactions inside a component set's variants (hover, pressed, selected). Instances inherit behaviour automatically.
- Smart animate between variants for micro-interactions, plus nested interactions on instance children.

### 8.9 Motion and timeline (recent addition)

- A timeline-based motion tool on the canvas supports keyframes for position, opacity, scale and rotation, with easing. 3D transforms are in early access.

## 9. Collaboration, files, and handoff features worth replicating

- **Real-time multiplayer** with cursors, selection, observation (follow) mode.
- **Version history**: autosave versions, named versions, restore, compare.
- **Branching and merging** for library files.
- **Team libraries**: components, styles, variables published and consumed across files.
- **Dev Mode**: inspect panel (CSS, iOS, Android), measurements, code snippets, ready-for-dev status, annotations, variables in code.
- **Plugins and widgets** API; **generative plugins** that turn prompts into custom tools.
- **Comments**, **annotations**, **sticky notes**, **stamps**.
- **Permissions**: view, comment, edit, with link sharing and org roles.
- **Offline cache** and local fonts.

## 10. Recent additions (Config 2026, rolled out in phases)

- **Figma Motion** (timeline animation on the canvas), **Code layers** (clone a repo, convert designs to running code and sync back; early access), **Shaders** as fills and effects (WebGPU, parameterised), **Weave tools** (AI image tasks inside Design), **Generative plugins**, and an updated **Figma agent** with skills, web search, and file attachments.
- Earlier additions worth keeping in a replica: Figma Draw (vector brushes, variable width), auto layout grid, slots, extended variable collections, Dev Mode annotations.

## 11. Keyboard shortcut cheat sheet (macOS)

- Tools: V Move, K Scale, F or A Frame, Shift+S Section, S Slice, R Rectangle, O Ellipse, L Line, Shift+L Arrow, P Pen, Shift+P Pencil, T Text, H Hand, C Comment, I Picker, Z Zoom.
- Edit: Cmd+Z undo, Shift+Cmd+Z redo, Cmd+D duplicate, Cmd+G group, Shift+Cmd+G ungroup, Option+Cmd+G frame selection, Cmd+E flatten, Shift+Cmd+O outline stroke, Shift+Cmd+L lock, Shift+Cmd+H hide, Cmd+\[ and Cmd+\] send/bring.
- Component: Option+Cmd+K create, Option+Cmd+B detach.
- Auto layout: Shift+A add, Option+Shift+A remove.
- View: Shift+1 fit, Shift+2 selection, Shift+0 100%, Shift+R rulers, Cmd+' pixel grid, Ctrl+G layout grids, Cmd+Y outlines, Cmd+\\ hide UI.
- Copy/paste props: Option+Cmd+C and Option+Cmd+V. Present: Option+Cmd+Enter. Quick actions: Cmd+/. Dev Mode: Shift+D.

## 12. Build notes for a replica

### 12.1 Node types to model

DOCUMENT, PAGE, FRAME, GROUP, SECTION, COMPONENT, COMPONENT\_SET, INSTANCE, RECTANGLE, ELLIPSE, POLYGON, STAR, LINE, VECTOR, BOOLEAN\_OPERATION, TEXT, SLICE, IMAGE/VIDEO (as paint), plus comments and annotations.

### 12.2 Core property schema (mirrors the Figma plugin API)

- Geometry: x, y, width, height, rotation, relativeTransform, constrainProportions, minWidth, maxWidth, minHeight, maxHeight.
- Layout: layoutMode (NONE, HORIZONTAL, VERTICAL, GRID), layoutWrap, primaryAxisSizingMode, counterAxisSizingMode, primaryAxisAlignItems, counterAxisAlignItems, itemSpacing, counterAxisSpacing, paddingLeft/Right/Top/Bottom, layoutPositioning (AUTO, ABSOLUTE), layoutSizingHorizontal/Vertical (FIXED, HUG, FILL), itemReverseZIndex, strokesIncludedInLayout.
- Constraints: constraints { horizontal, vertical }.
- Appearance: opacity, blendMode, visible, locked, isMask, maskType, clipsContent, cornerRadius and per-corner radii, cornerSmoothing.
- Paints: fills\[\], strokes\[\], strokeWeight (and per-side), strokeAlign, strokeCap, strokeJoin, strokeMiterLimit, dashPattern; paint types SOLID, GRADIENT\_LINEAR, GRADIENT\_RADIAL, GRADIENT\_ANGULAR, GRADIENT\_DIAMOND, IMAGE, VIDEO, with gradientStops and imageTransform plus filters.
- Effects: effects\[\] with DROP\_SHADOW, INNER\_SHADOW, LAYER\_BLUR, BACKGROUND\_BLUR, and newer types.
- Text: characters, fontName, fontSize, lineHeight, letterSpacing, paragraphSpacing, textAlignHorizontal/Vertical, textAutoResize, textCase, textDecoration, openTypeFeatures, ranged style segments.
- Layout grids: layoutGrids\[\] (GRID, COLUMNS, ROWS with count, gutterSize, offset, alignment).
- Styles and variables: fillStyleId, textStyleId, effectStyleId, gridStyleId, boundVariables, explicitVariableModes.
- Components: componentPropertyDefinitions, componentProperties, overrides, mainComponent.
- Prototype: reactions\[\] each with trigger { type, timeout, keyCodes }, actions\[\] { type, destinationId, navigation, transition { type, easing, duration, direction }, resetScrollPosition, resetVariableValues, conditional blocks }, plus flowStartingPoints, overflowDirection, overlayPositionType, overlayBackground.
- Export: exportSettings\[\] { format, suffix, constraint { type: SCALE | WIDTH | HEIGHT, value } }.

### 12.3 Engine architecture suggestions

- **Renderer**: GPU-accelerated 2D (WebGL or WebGPU) with tile-based caching, a scene graph, hit testing via spatial index (R-tree or quadtree), and a separate vector tessellation module for strokes, joins, caps and boolean ops.
- **Layout engine**: flexbox-like solver for auto layout (hug/fill/fixed, wrap, grid), constraint resolver for resize propagation, text measurement via shaping engine (HarfBuzz) for line breaking.
- **State and sync**: operation-based document model with undo/redo transactions, per-property last-writer-wins CRDT or OT for multiplayer, presence channel for cursors.
- **Prototype runtime**: finite-state machine over frames with variable store, expression evaluator, conditional branching, overlay stack, and a smart-animate diffing step that matches layers by name and hierarchy, then interpolates with the easing or spring solver (damped spring ODE for mass/stiffness/damping).
- **Colour**: store in linear or sRGB with Display P3 support, HEX/RGB/HSL/HSB converters, gradient interpolation, blend mode shaders for the 16 non-pass-through modes.
- **Assets and libraries**: component registry with version hashes, variable collections with mode resolution order (instance override, frame explicit mode, page default), style references.
- **Plugin and automation surface**: expose the node API above so AI agents, scripts and plugins operate on the same schema.

### 12.4 Suggested build order

1. Canvas, zoom/pan, selection, transform handles, snapping, layers panel.
2. Frames, shapes, text, fills/strokes/effects, right panel Design tab.
3. Auto layout, constraints, alignment and distribution.
4. Pen and vector networks, booleans, masks.
5. Components, variants, instances, overrides.
6. Styles, variables, modes.
7. Prototype interactions, smart animate, overlays, scroll, variables and conditionals.
8. Export, libraries, version history, multiplayer, Dev Mode.
