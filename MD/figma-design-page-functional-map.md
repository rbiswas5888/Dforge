# Figma Design Page: Complete Functional Map

*Left panel, canvas, right panel, plus every day-to-day designer interaction (media, fills, vector editing, text, components, prototyping, handoff). Written against Figma's current UI3 layout. Shortcuts are Cmd (Mac) / Ctrl (Windows). Verify exact shortcuts and limits against Figma's in-app shortcut list and help center, as they change between releases.*

---

## Part A. Layout overview

| Zone | Purpose |
|---|---|
| **Left panel** | Pages, Layers, Assets, file menu |
| **Bottom toolbar** (top in legacy UI2) | Move, Frame, Shapes, Pen, Text, Comment, Dev Mode, Actions |
| **Center canvas** | Infinite workspace |
| **Right panel** | Design / Prototype tabs (Dev Mode is a separate view) |
| **Top bar** | File name, Share, multiplayer avatars, zoom, Present |

### Interaction modes (important for any clone)
Figma behaves as a set of modes. Most "how do I edit this?" questions are really "which mode am I in?"

| Mode | How you enter | How you leave | What changes |
|---|---|---|---|
| **Object mode** (default) | `V` | n/a | Select, move, resize, rotate whole objects |
| **Drill-in** | Double-click a group/frame, or `Enter` | `Esc` / `Shift+Enter` | Select children inside containers |
| **Vector edit mode** | Double-click a vector/shape, or select + `Enter` | `Esc` or click empty canvas | Edit anchor points, handles, segments |
| **Text edit mode** | Double-click text, or select + `Enter` | `Esc` | Cursor inside text; character-level formatting |
| **Image crop mode** | Double-click an image fill / use Crop | `Esc` / Enter | Move and scale the image inside its frame |
| **Gradient edit mode** | Click a gradient fill swatch (selection stays) | `Esc` | On-canvas gradient handles and stops |
| **Prototype mode** | Prototype tab | Design tab | Connection nodes and flows |
| **Dev Mode** | `Shift+D` | `Shift+D` | Read-only inspection and specs |

---

## Part B. Left panel

### B1. Main menu and file header
- **Figma logo menu:** File, Edit, View, Object, Vector, Text, Arrange, Plugins, Widgets, Preferences, Help.
- **File name / location:** rename, move to project, add to favorites, view version history.
- **Preferences:** nudge amount, snap to geometry/pixel grid/objects, keep tool selected after use, invert zoom direction, theme (light/dark), highlight layers on hover, flip objects while resizing, UI scale.

### B2. Pages
- Add, rename, duplicate, delete, drag to reorder, add dividers (a page named with dashes).
- Each page has its own canvas; styles, variables and components are file-wide.
- Typical pages: Cover, Explorations, Wireframes, Components, Final UI, Archive.

### B3. Layers panel (scene hierarchy)

| Node | Meaning |
|---|---|
| **Frame** | Container with fill, clip, layout, constraints, prototype settings |
| **Section** | Organizational canvas region with a label |
| **Group** | Light folder, no layout/clip |
| **Component / Component set** | Reusable master / variants collection |
| **Instance** | Linked copy of a component |
| **Auto layout frame** | Frame with flow rules |
| **Boolean group** | Union, Subtract, Intersect, Exclude result |
| **Mask group** | Top layer clips the ones beneath |
| **Vector / Shape / Text / Image / Video** | Leaf objects |
| **Slice** | Export region |

**Per-layer controls:** eye (hide), lock, rename (`Cmd+R` or double-click), drag to reorder (top = front), expand/collapse arrows (`Alt+click` expands all), search/filter by name or type, right-click menu (Group, Frame selection, Add auto layout, Create component, Use as mask, Flatten, Copy/Paste properties, Show/Hide, Lock/Unlock, Pin to viewport, Select matching layers).

**Bulk renaming:** select many layers, `Cmd+R`, use patterns (for example `Card / $n`, `Row #`), or find and replace within names.

### B4. Assets panel
- Local components, enabled team libraries, search, grid/list view.
- Drag onto canvas to create an instance; swap library; review and accept library updates (badge shows when a published library has changes).
- Libraries can contain components, styles and variables.

---

## Part C. Toolbar

| Tool | Key | Notes |
|---|---|---|
| Move | `V` | Select/move/resize |
| Scale | `K` | Resizes children, text and strokes proportionally |
| Frame | `F` | Device presets appear in the right panel |
| Section | `Shift+S` | Label region |
| Slice | `S` | Export region |
| Rectangle | `R` | Hold `Shift` for square |
| Line / Arrow | `L` / `Shift+L` | Hold `Shift` for 15° angles |
| Ellipse | `O` | Also makes arcs and donuts via handles |
| Polygon, Star | menu | Adjust side count/ratio via handles or right panel |
| Place image/video | `Cmd+Shift+K` | File picker |
| Pen | `P` | Bezier paths |
| Pencil | `Shift+P` | Freehand |
| Text | `T` | Click or drag |
| Hand | `H` or hold `Space` | Pan |
| Comment | `C` | Pin threads |
| Dev Mode | `Shift+D` | Inspect |
| Actions | `Cmd+K` | Search commands, plugins, widgets, components, AI actions |

**Keep-tool-selected:** a Preference controls whether the tool returns to Move after one use.

---

## Part D. Center canvas

### D1. Navigation
- Pan: scroll, `Space+drag`, hand tool, trackpad two-finger.
- Zoom: `Cmd+scroll`, pinch, `Cmd +/-`, `Shift+0` (100%), `Shift+1` (fit all), `Shift+2` (zoom to selection).
- **Outline view** (`Cmd+Y`), **Pixel preview** (View menu), **Pixel grid** (`Shift+'`), **Rulers** (`Shift+R`), **Layout grids** (`Ctrl+G`), **Snap to geometry** toggle, **Hide UI** (`Cmd+\`).

### D2. Selection rules
- Click = top-level object; double-click = drill in; `Cmd+click` = deep select a nested child directly.
- `Shift+click` multi-select; marquee drag selects fully-enclosed objects (starting a drag from a frame's empty area selects frame children; drag from outside to select the frame).
- `Tab` / `Shift+Tab` next/previous sibling; `Enter` select children; `Shift+Enter` select parent.
- Right-click > **Select matching layers** (similar fill, stroke, text, and so on); `Cmd+A` select all in the current container.
- The Selection colors section in the right panel lists every color used in the selection for one-click bulk replacement.

### D3. Transformation
- **Resize:** handles; `Shift` keeps ratio; `Alt` scales from center.
- **Rotate:** hover just outside a corner; `Shift` snaps 15°.
- **Flip:** `Shift+H` / `Shift+V`.
- **Nudge:** arrows 1px; `Shift+arrow` 10px (configurable).
- **Duplicate:** `Cmd+D`, `Alt+drag` (copy), or `Cmd+D` repeatedly to repeat the last move offset (very common for building lists and grids).
- **Smart guides:** pink alignment lines; hold `Alt` to show distance to a hovered object; `Ctrl` temporarily disables snap.
- **Tidy up** (right-click menu): evenly arranges loose selected objects into rows/columns with consistent spacing.
- **Copy/Paste properties:** `Cmd+Alt+C` / `Cmd+Alt+V`.
- **Paste over selection** (`Cmd+Shift+V`): pastes into the selected frame, replacing contents or placing inside.

### D4. Multiplayer
- Live cursors; click an avatar to **follow**; **Observation mode** to watch a presenter; **Cursor chat** (`/`); **Spotlight** to bring everyone to your viewport; comment threads with @mentions and resolve.

---

## Part E. Right panel: Design tab, top to bottom

### E1. Alignment and distribution
Align left/center/right/top/middle/bottom; distribute horizontally or vertically; relative to selection (many objects) or parent frame (single object). `Alt+A/D/W/S/V/H` are the classic alignment shortcuts.

### E2. Position and dimensions
X, Y, W, H, rotation, corner radius (uniform or per-corner), corner smoothing, **lock aspect ratio**, **clip content** (frames), and **resize to fit** after content edits.

### E3. Constraints (frames without auto layout)
Horizontal: Left, Right, Left & Right, Center, Scale. Vertical: Top, Bottom, Top & Bottom, Center, Scale. These define how children respond when the parent resizes.

### E4. Auto layout (`Shift+A`)
Figma's flexbox equivalent.
- Direction: horizontal, vertical, wrap.
- Gap: fixed or **Auto** (space between).
- Padding: uniform or per-side.
- Alignment: 9-point grid plus baseline for text rows.
- Child sizing: **Fixed**, **Hug contents**, **Fill container**; min/max width and height.
- **Absolute position** (child ignores flow), **canvas stacking** (first on top), **strokes included in layout**, **clip content**.
- Nested auto layouts model nearly every real UI: buttons, chips, cards, nav bars, lists, forms, tables.

### E5. Layout grid
Columns, Rows, Grid; count, gutter, margin, type (stretch/left/center), color; multiple grids stack on one frame.

### E6. Layer
Blend mode (Normal, Darken, Multiply, Color burn, Lighten, Screen, Overlay, and so on), opacity, visibility, and Pass through for groups/frames.

### E7. Text properties
Font family and weight (variable-font axes), size, line height, letter spacing, paragraph spacing and indent, horizontal/vertical alignment, case, underline/strikethrough, lists (bullets/numbers), truncate with ellipsis and max lines, text resizing (auto width, auto height, fixed), OpenType features, text styles.

### E8. Fill
Solid, Linear, Radial, Angular, Diamond gradients, Image, Video. Multiple fills stack. Details in Part F.

### E9. Stroke
Color, weight, position (Inside, Center, Outside), per-side weights, dash and gap, caps (None, Round, Square, arrows), joins (Miter, Bevel, Round), miter angle, **variable width** and **brush** presets, multiple strokes, gradient strokes.

### E10. Effects
Drop shadow, Inner shadow, Layer blur, Background blur, plus newer effects such as Noise, Texture and Glass in recent builds. Each has X/Y/blur/spread/color. Reusable via effect styles.

### E11. Export
Multiple settings per layer or slice; PNG, JPG, SVG, PDF; scale 0.5x to 4x or custom width/height (`512w`, `256h`); suffix; **Copy as PNG/SVG/CSS**; export frames as PDF pages.

### E12. Nothing selected
Page background, local styles, local variables (collections with modes, for example Light/Dark, Mobile/Desktop, EN/FR), and file-level settings.

### E13. Components and instances
- **Component properties:** Boolean, Text, Instance swap, Variant.
- **Variants:** a component set organized by properties (Type=Primary, State=Hover, Size=Large).
- Instance actions: Detach, Reset overrides, Swap, Go to main component, Push overrides to main.
- Overrides allowed on text, fills, visibility, nested instances, and component property values.
- Nested component swaps are supported through instance-swap properties.

### E14. Prototype tab
- **Flow starting points** per frame; multiple flows per page.
- **Triggers:** On click, On drag, While hovering, While pressing, Key/Gamepad, Mouse enter/leave/down/up, After delay.
- **Actions:** Navigate to, Back, Scroll to, Open/Swap/Close overlay, Open link, Set variable, Set variable mode, Conditional.
- **Animation:** Instant, Dissolve, Smart animate, Move in/out, Push, Slide in/out; easing (ease in/out, spring, custom bezier); duration.
- **Scroll behavior:** frame overflow (none, horizontal, vertical, both) and per-layer fixed/sticky positioning.
- **Overlay options:** position, close on outside click, dim background.
- **Interactive components:** variants that change on hover/press inside the prototype.
- **Variables and expressions** drive state (counters, toggles, form validation).
- **Media in prototypes:** video fills can play/pause with interactions; GIFs animate in Present mode.
- **Preview device and frame:** phone/desktop chrome; Figma Mirror app for on-device testing.

### E15. Dev Mode
Inspect CSS, iOS, Android code; measurements; variables used; **Ready for dev** status; annotations; compare changes between versions; plugin integrations (VS Code, Storybook, Jira, GitHub).

---

## Part F. Day-to-day designer tasks (the part usually missed)

### F1. Adding images (any format, GIF, video)

**Ways to add**
1. **Place:** `Cmd+Shift+K`, then click or drag on the canvas to size it.
2. **Drag and drop** files from the desktop or browser onto the canvas (multiple files place side by side).
3. **Paste** (`Cmd+V`) from clipboard, a screenshot, or another app.
4. **Image fill:** select any shape, frame or text, Fill > `+` > Image, upload or choose a recent image.
5. **Replace image:** select the layer, Fill > image thumbnail > Choose image (keeps size, corner radius, effects).
6. **Plugins / Resources:** stock photo, avatar, placeholder content and icon plugins (Unsplash, Iconify, and so on).

**Supported media** (limits change; check current Figma help)

| Type | Formats | Behavior |
|---|---|---|
| Raster | PNG, JPG, GIF, WebP, HEIC and others | Becomes a rectangle with an image fill |
| Animated GIF | GIF | Animates in Present/prototype mode; static on canvas |
| Vector | SVG | Imported as editable vector layers (frame/groups/paths) |
| Video | MP4, MOV, WebM | Becomes a video fill; poster frame on canvas; plays in prototypes |

Size limits apply (large images are downscaled; video has a file size cap). Keep originals for export-quality work.

**Image fill controls**
- **Fill modes:** *Fill* (cover, may crop), *Fit* (contain, may letterbox), *Crop* (manual), *Tile* (repeat with scale).
- **Crop mode:** double-click the image (or choose Crop) to move and scale the image inside its container with on-canvas handles; the container size stays fixed.
- **Rotate** the image fill in 90° steps; **scale** and **tile scale** numerically.
- **Image adjustments:** exposure, contrast, saturation, temperature, tint, highlights, shadows (non-destructive).
- **Opacity and blend mode** per fill; stack multiple image fills.
- **Mask with shape:** place the shape on top, select both, `Cmd+Alt+M`; or simply apply the image as the shape's fill (circle avatar, rounded card photo).
- **Rounded/clipped photos:** set corner radius on the image rectangle; or put the image in a frame with *Clip content*.
- **AI-assisted editing** (where available): remove background, replace background, generate or edit image from prompt.
- **Export:** export the image layer or frame at 1x to 4x; image fills export correctly in PNG/JPG/PDF.

**Video details**
- Add as a fill; control autoplay, loop and mute in the fill panel.
- In prototypes: use interactions to play, pause or restart a video.

### F2. Solid fills, gradients and color work

**Solid**
- Click the swatch to open the color picker: color area, hue slider, opacity slider, **eyedropper** (`I`), HEX/RGB/HSL/HSB/CSS input.
- **Recent / document colors**, and **Libraries** tab for team color styles and variables.
- **Variables:** bind a fill to a color variable (modes for dark/light).
- **Styles:** four-dot icon to apply or create a color style.

**Gradients**
- Change fill type to Linear, Radial, Angular or Diamond.
- **On-canvas gradient editor:** drag the start and end handles; on radial/angular/diamond also drag the width handle.
- **Gradient bar (right panel):** click the bar to add a stop, drag stops to move, select + `Delete` to remove, each stop has its own color and opacity.
- **Reverse** and **rotate** the gradient; **swap** stop colors.
- Gradients work on fills, strokes and text; can be saved as styles.
- Stack gradients with solids using multiple fills plus blend modes for glassmorphism, glows and overlays.

**Other color tasks**
- **Selection colors:** replace one color everywhere in the selection.
- **Copy/paste color values** as hex between layers.
- **Contrast and accessibility:** use plugins (Stark, A11y) or Dev Mode checks; use variables for light and dark themes.

### F3. Vector editing (double-click behaviors and manual tweaking)

This is the core "hand-tweak the shape" workflow.

**Entering and leaving**
- Double-click a vector, shape or boolean result, or press `Enter` while it is selected.
- Double-click a rectangle, ellipse or polygon: converts it into an editable vector path (rounded rectangles keep their curves as editable points).
- `Esc` or click empty canvas to leave.

**Selecting points and segments**
- Click a point; `Shift+click` to add; **drag a marquee** to select several.
- Click a segment to select it (moves with its two end points).
- `Cmd+A` selects all points in the path.

**Moving and shaping**
- Drag points to move; arrow keys nudge (`Shift+arrow` 10px).
- **Handles:** selecting a curved point shows its Bezier handles; drag to change tangent and curvature.
- **Handle mirroring options (right panel):** *No mirror* (independent handles), *Mirror angle*, *Mirror angle and length*.
- `Alt+drag` a handle to break mirroring temporarily.
- **Bend:** `Cmd+drag` a segment to bend it into a curve without adding points; or use the **Bend tool**.
- **Convert corner and curve:** double-click a point to toggle between a sharp corner and a smooth curve.
- **Corner radius at a point:** drag the radius dot, or type it in the right panel.

**Adding and removing**
- **Add points:** with the Pen tool (`P`) click on a segment.
- **Delete a point:** select + `Delete` / `Backspace` (path reconnects); **delete a segment:** select the segment + `Delete` (breaks the path open).
- **Extend a path:** with an end point selected, Pen tool click to continue drawing.
- **Join points:** select two end points and `Cmd+J` (or Join); closes open paths.
- **Pencil** (`Shift+P`) for freehand strokes, then clean up points in edit mode.

**Vector networks and fills**
- Figma paths are **vector networks** (not strictly single linear paths), so points can connect to more than two others, forming branching shapes.
- **Paint bucket** (`B` in vector edit) fills enclosed regions of a network with different colors.

**Related operations (Object / Vector menu)**

| Operation | Use |
|---|---|
| **Flatten** (`Cmd+E`) | Merge selected shapes into one editable path |
| **Outline stroke** (`Cmd+Shift+O`) | Convert a stroke into filled vector shape |
| **Offset path** | Expand or contract a shape by N px |
| **Boolean operations** | Union, Subtract, Intersect, Exclude (non-destructive until flattened) |
| **Use as mask** (`Cmd+Alt+M`) | Clip layers with top shape |
| **Simplify path** | Reduce points while keeping shape (plugins or newer builds) |
| **Create outlines from text** | Convert text to editable vector shapes |
| **Flip / rotate / scale** | Standard transforms while editing |

**Shape-specific double-click and handle behaviors**
- **Rectangle/frame:** drag inner corner dots for radius; independent corners in the right panel.
- **Ellipse:** handles for arc sweep and inner ratio (donuts, pie slices, rings).
- **Polygon/star:** handles or panel for number of sides/points and inner radius ratio.
- **Line/arrow:** endpoints draggable; set arrowheads in stroke caps.
- **Boolean group:** double-click drills into component shapes; change each operation from the right panel or toolbar.

### F4. Text work
- **Create:** `T` then click (auto width) or drag (fixed width area with wrapping).
- **Edit:** double-click text, or select + `Enter`. Select all text with `Cmd+A`.
- **Mixed formatting:** select a range inside text and change weight, color, size, link, underline.
- **Resize modes:** auto width, auto height, fixed; truncate with ellipsis.
- **Links:** select text, `Cmd+K` in text edit to add a URL.
- **Fonts:** Google Fonts and Adobe fonts are available; local fonts need the Figma font installer or desktop app; missing fonts show a warning with replacement picker.
- **Lists and indent:** bullets, numbers, indentation.
- **Text on path:** not native; use plugins. **Convert text to outlines** for logos and fixed art.
- **Text styles and variables:** keep typography consistent via styles and number/string variables.
- **Find and replace text** and **spell check** (Edit menu, right-click suggestions).

### F5. Frames, devices and responsive layout
- Draw a frame or choose a **preset** (iPhone, Android, iPad, Desktop, Watch, Presentation, Paper, Social, and so on) from the right panel.
- **Resize with constraints** or auto layout so designs adapt across breakpoints.
- **Duplicate frames** for breakpoints (Mobile, Tablet, Desktop) and use variable modes to switch spacing and type scale.
- **Layout grids** for 4/8/12-column systems.
- **Sections** group related screens; sections can be dragged as a whole and used as flow containers.

### F6. Building reusable UI
1. Draw a button; add auto layout (`Shift+A`) for padding and gap.
2. Create component (`Cmd+Alt+K`).
3. Add variants (Type, State, Size) via *Add variant* in the component set.
4. Add component properties (label text, icon swap, show/hide).
5. Publish to a team library for others to use.
6. Update and review changes (library update badge in Assets).

### F7. Icons and illustration
- Paste SVG directly (`Cmd+V` of SVG code) to get editable vector.
- Use icon plugins and libraries, resize with the Scale tool (`K`) to keep stroke weight proportional.
- Wrap icons in **fixed-size frames** (24x24) with consistent padding, then turn into components with color variables.

### F8. Everyday productivity
- **Quick actions** (`Cmd+/`) to search any command.
- **Copy as code / as PNG / as SVG** from the right-click menu.
- **Rename layers in bulk**, **tidy up**, **select matching**, **multi-edit** (select instances of the same component to change shared properties at once).
- **Pin to viewport**, **hide/lock** selection, **layer search** with filters.
- **Version history:** auto versions, named checkpoints, restore, **branching and merging** (on supported plans) for safe explorations.
- **Comments:** pin on canvas, @mention, resolve, attach to frames; use filters (unresolved only).
- **Plugins and widgets:** content fillers (Lorem, avatars), accessibility checkers, image tools, iconography, Lottie, export automation.
- **AI-assisted features** (where enabled): generate first drafts, rename layers, create variations, remove backgrounds, generate or edit imagery.

### F9. Review, present and hand off
- **Present** (▶): full-screen prototype; **Share prototype link** with view-only access and a chosen starting flow.
- **Share file:** invite by email, set can view / can edit, link access, password protection (plan dependent).
- **Dev Mode:** mark frames *Ready for dev*, add annotations and measurements, link components to code, **Compare changes**.
- **Export assets:** slices or exports per layer in multiple scales; batch-export from the right panel.
- **Design tokens:** export variables via plugins or APIs.

---

## Part G. Worked examples (how a designer actually uses it)

**Example 1: Profile card with photo and gradient banner**
1. `F` and draw a 360x480 frame; set corner radius 24.
2. `R` draw a banner rectangle; Fill > Linear gradient; click the gradient bar to add a middle stop.
3. Drag an image onto the canvas; resize; draw an ellipse and drag the image into its Fill (or `Cmd+Alt+M` to mask).
4. Add name text with `T`; select the card and press `Shift+A` for vertical auto layout with 16px gap.
5. Add a button component; set Fill container width.
6. Export the frame at 2x PNG.

**Example 2: Custom icon tweak**
1. Paste SVG; double-click the path to enter vector edit mode.
2. Marquee-select the points to change; nudge with arrow keys.
3. Double-click a corner point to smooth it; adjust handles; use Bend for gentle curves.
4. `Cmd+J` to join gaps; `Cmd+E` to flatten; set stroke to outline for a solid icon.

**Example 3: Clickable prototype**
1. Create Home and Detail frames; mark Home as the flow start.
2. Prototype tab: drag the connector from a card to Detail; On click > Navigate to > Smart animate.
3. Add a back button with the Back action; add an overlay for a modal.
4. Press Present; share the link.

---

## Part H. Specification checklist for building a faithful clone

| Subsystem | Must support |
|---|---|
| **Scene graph** | Frame, Section, Group, Component/Instance, Vector, Text, Image, Video, Slice, Boolean, Mask; z-order; locked/hidden flags |
| **Property model** | Transform, constraints, layout, fills[], strokes[], effects[], blend, opacity, corner radius, export settings per node |
| **Mode manager** | Object, drill-in, vector edit, text edit, crop, gradient edit, prototype, dev (see Part A table) with per-mode input handling |
| **Selection engine** | Click, deep select, marquee rules, siblings/parent navigation, select matching |
| **Layout engine** | Constraints; auto layout with wrap, hug/fill/fixed, min/max, absolute position; layout grids |
| **Vector engine** | Vector networks, Bezier handles with mirror modes, bend, join, delete point/segment, paint bucket, booleans, flatten, outline stroke, offset path |
| **Paint system** | Solid, 4 gradient types with stops and on-canvas handles, image (fill/fit/crop/tile + adjustments), video, multiple fills, blend modes |
| **Media pipeline** | Import PNG/JPG/GIF/WebP/SVG/video, downscale, crop, replace, drag and drop, paste, export |
| **Text engine** | Rich text, variable fonts, OpenType, auto-resize modes, links, lists, outlines |
| **Component system** | Main/instance, overrides, variants, properties (boolean/text/swap/variant), library publish and update |
| **Styles and variables** | Color, text, effect, grid styles; variables with modes; binding to properties |
| **Prototype engine** | Triggers, actions, animations (smart animate), overlays, scroll, variables, conditionals, interactive components |
| **Collaboration** | Multiplayer cursors, follow, comments, version history, branching |
| **Export and Dev Mode** | Raster/vector/PDF export, copy as code, specs, ready-for-dev, annotations |
| **Command system** | Quick actions, shortcut registry, plugin API |

---

*Companion note: this file combines the original left/center/right panel map (Parts A to E) with the missing media, fill, vector-editing, text, component and workflow details (Parts F to H).*
