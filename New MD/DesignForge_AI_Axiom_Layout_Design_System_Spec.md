# DesignForge AI / Axiom
## Editor Layout, UX Interaction & Design System Specification
**Version:** 1.0  
**Date:** 27 October 2026  
**Status:** Product design specification  
**Basis:** `axiom_complete_design_specification.md` supplied by the product owner, expanded with current public guidance from Sketch, Figma, Apple HIG, W3C WCAG 2.2, the Design Tokens Community Group, and Radix UI.

---

## 1. Executive direction

DesignForge AI should feel like a **professional design instrument, not a web dashboard with a canvas inside it**. The interface must support long, repeated sessions, high precision, keyboard-driven work, rapid visual scanning, deep document navigation, and a seamless transition between manual and AI-assisted design.

### Recommended brand architecture

- **Market-facing product:** **DesignForge AI** — keep continuity with the existing product concept and communicate design creation plus AI assistance.
- **Internal design system / visual language:** **Axiom** — a name already present in the supplied specification. “Axiom” describes the product's interaction rules, visual tokens, components, and patterns.
- **Design personality:** Industrial Precision, Calm Control, Visible Structure, Human-in-Control AI.
- **Short brand promise:** *Design with precision. Move with AI. Stay in control.*
- **Brand guardrail:** Be recognizably its own product. Learn from established design-tool workflows, but do not imitate competitors’ logos, icon combinations, exact panel treatments, language, or proprietary visual assets. Complete domain and trademark clearance before committing to public brand use.

The supplied Axiom document gives a useful visual foundation: `#0D0D0F` base chrome, `#141417` raised surfaces, indigo selection/accent, a large infinite canvas, a left layer/tool area, a context-sensitive right inspector, status feedback, numeric scrubbing, and explicit row states. This document preserves that direction while improving the hierarchy and accessibility of the working layout.

**Important terminology correction:** no theme can guarantee “zero fatigue.” Dark interfaces are a preference and context choice, not a medical benefit. Provide dark, light, high-contrast, and system themes; allow zoom, density, animation, and panel customisation; and validate the experience with real designers across long sessions.

---

## 2. Design principles for a 9+ hour workstation

1. **Canvas first.** The editor's primary content is the work itself. Sidebars and controls must not dominate the canvas.
2. **Stable geography.** Keep core commands, selection behavior, tool shortcuts, page navigation, and inspector placement consistent across modes.
3. **Context over clutter.** Show the properties relevant to the selected object. Keep advanced controls discoverable rather than permanently visible.
4. **Progressive disclosure without hiding power.** Beginners get understandable labels and suggested next actions; experts can expose dense controls, command search, and shortcuts.
5. **Direct manipulation plus exact inputs.** Every important operation should work on-canvas and through keyboard/numeric property controls.
6. **Reversible work.** Make edits undoable, multi-step AI work previewable, and destructive operations recoverable.
7. **Visible state.** Always communicate selection, focus, save/sync, read-only status, active mode, active tool, and ongoing AI operations.
8. **No colour-only meaning.** Use icons, labels, shape, and text in addition to colour for layer types, errors, selection, and AI status.
9. **User-controlled workspace.** Panels can resize, collapse, reset, and remember per-user preferences. Do not force one layout on every role.
10. **Accessible by construction.** Keyboard use, screen-reader semantics, contrast, target size, zoom, reduced motion, and alternate methods for drag-only operations are part of the component contract, not a later polish task.
11. **AI is a collaborator, not an authority.** Suggestions have explanations, provenance, and preview states. The user can inspect, adjust, reject, or revert them.
12. **Predictable performance.** Canvas manipulation should not wait for model inference or network round trips.

### Interaction quality goals

- Common editing operations work offline or during degraded connectivity when they do not require remote services.
- Selection, panning, zooming, typing into an inspector field, and moving a shape remain responsive while AI calls run in the background.
- No silent layout changes, no surprise panel switching, and no automatic overwriting of established components or tokens.
- Use short, purposeful transitions. Respect `prefers-reduced-motion` and provide an application-level motion setting.
- Save and sync messages must be specific: “Saved”, “Saving…”, “Offline — changes stored locally”, “Sync conflict”, or “Could not save”. Never use a spinner as the only status.

---

## 3. Application shell: recommended desktop layout

### 3.1 Primary shell map

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ A. GLOBAL COMMAND BAR — workspace / document / search / undo-redo / share / export      │
├─────┬────────────────────────────┬─────────────────────────────────────┬────────────────┤
│     │ B. NAVIGATOR PANEL         │ C. WORKSPACE                        │ D. INSPECTOR   │
│     │                            │                                     │                │
│ E.  │ Page selector              │ Contextual tool shelf               │ Design         │
│ MODE│ Layers | Assets | Library  │ Canvas / frames / artboards         │ Prototype      │
│ RAIL│ Search + filter            │ Rulers, guides, selection overlays  │ Accessibility  │
│     │ Layer tree or assets       │ Minimap and zoom controls           │ Export         │
│     │                            │                                     │                │
├─────┴────────────────────────────┴─────────────────────────────────────┴────────────────┤
│ F. OPTIONAL BOTTOM DRAWER (collapsed by default): Prototype timeline / Variables /      │
│    Comments / Issues / Console / AI activity                                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ G. STATUS BAR — active tool hint / zoom / selection info / save-sync / collaboration    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Base dimensions

Treat these as desktop defaults, not immutable constants.

| Zone | Default | Minimum / behavior | Purpose |
|---|---:|---|---|
| Global command bar | 48 px high | Remains stable; optional compact mode | Document identity, global commands, search, share/export |
| Mode rail | 48 px wide | Collapsible to 40 px; icons with labels on hover/focus | Switch between Design, Prototype, System, Dev, Comments, AI |
| Navigator panel | 272 px wide | 224 px min, 400 px max; resizable | Pages, layers, assets, libraries, flows |
| Canvas tool shelf | 40 px high | Can float, dock, or collapse | Selection/drawing tools and selection-context actions |
| Inspector | 312 px wide | 272 px min, 420 px max; resizable | Selection properties and context-specific settings |
| Bottom drawer | 220 px expanded default | Collapsible; min 140 px; resizable | Timeline, variables, console, issues, AI activity |
| Status bar | 28 px high | Can hide optional details in compact mode | Save/sync, zoom, shortcut hints, diagnostics |

At a 1440 px viewport, the default 48 + 272 + 312 px side zones leave around 808 px for the canvas before accounting for inner gutters. At 1280 px, automatically offer a compact workspace profile that collapses the mode rail labels and reduces the navigator/inspector to their configured minimums. Avoid a permanent three-column squeeze on smaller screens; switch to a temporary drawer for one side panel at a time.

### 3.3 Global command bar

**Left group**
- Brand mark and workspace switcher.
- Editable document name and optional page breadcrumb.
- Save/sync state; tooltip or menu details for offline state and conflicts.

**Middle group**
- Command/search field: search commands, layers, pages, components, tokens, files, and documentation.
- Keyboard shortcut hint displayed when the field is focused (for example, `⌘/Ctrl + K`, user-customisable).
- Search results grouped by type. Show the target and explain the action; never make a natural-language command execute a destructive action without preview/confirmation.

**Right group**
- Undo and redo.
- Collaboration avatars / cursors and comment notification.
- AI assistant toggle.
- Share.
- Export (primary action when export is relevant; otherwise normal prominence).
- Overflow menu for less common actions.

Rules:
- Keep three logical control groups rather than a continuous strip of unrelated icons.
- Use tooltips for icon-only buttons, accessible names for assistive technology, and a 500–700 ms tooltip delay. Do not use tooltips as the only way to learn core commands.
- Never communicate save state only with a small coloured dot; pair the state with a label in the document menu or status area.
- Make the document title and active page clear in multi-document sessions.

### 3.4 Mode rail

Top-to-bottom modes:
1. **Design** — draw, edit, arrange, create layouts.
2. **Prototype** — flows, triggers, actions, variables, animation, overlays.
3. **System** — components, variants, styles, variables, token collections, libraries.
4. **Dev** — inspect properties, map tokens, export assets, generate code, open IDE project.
5. **Comments** — review pins, threads, annotations, approvals.
6. **AI** — prompt workspace, selection-aware actions, proposals, history.

Keep mode names in a hover/focus tooltip and provide a visible active indicator, not colour alone. The mode rail switches the navigator content and relevant inspector tabs; it must not discard selection or close the current document. On narrow windows, it can become a compact top-level menu, but users must retain one-step access to the active mode.

### 3.5 Navigator panel

Top area:
- Page selector with page count and page menu.
- Search field (“Search layers, assets, components…”).
- Tabs based on current mode, such as `Layers`, `Assets`, `Library` in Design; `Flows`, `Interactions` in Prototype; `Tokens`, `Components`, `Themes` in System; `Assets`, `Files`, `Code` in Dev.
- Collapsible panel section headers with item counts where helpful.

Panel design:
- The navigator should not also contain an always-expanded grid of drawing tools. The supplied Axiom direction placed the tool palette above the tree; separate the core drawing tools into the canvas tool shelf so the tree has more vertical space.
- Preserve document/page hierarchy at the top and canvas-object hierarchy below. Never mix files, pages, frames, and leaf layers into one ambiguous list.
- Support splitter dragging, collapse/expand buttons, “Reset workspace layout”, and per-workspace saved layouts.
- Use virtualization for documents with very large layer counts. Keep row identity and keyboard focus stable while items are added or removed.
- Provide an empty state with the shortest useful next step and sample content; do not show a blank dark panel with no explanation.

### 3.6 Contextual canvas tool shelf

Core tools:
- Select / Move
- Frame / Artboard
- Section
- Shapes (rectangle, ellipse, line, arrow, polygon, star)
- Pen / Vector edit
- Pencil / freehand
- Text
- Image / media placement
- Component creation / insertion
- Comment / annotation
- Hand / pan
- Slice / export region (where supported)

Advanced or less-used tools may live in menus, but menu items must remain searchable and their location should not change arbitrarily.

Rules:
- Tool groups use consistent separators and labels in tooltips.
- A tool with variants has a small dropdown affordance and keyboard access. The most recently used tool variant may be remembered.
- Active tool state is obvious. Do not rely on a tiny dot alone.
- The shelf can be docked, floated, or hidden. Always preserve a reliable “Show tools” command.
- When a tool is active, the shelf and status bar show its name and a concise shortcut hint.
- When a selection exists, contextual actions such as align, distribute, flip, boolean operations, flatten, mask, group, and component actions appear when valid.
- The shelf does not steal keyboard focus from a text field while the user is editing a property.

---

## 4. Canvas and document interaction

### 4.1 Canvas

- Infinite or practically unbounded canvas with smooth pan/zoom and a configurable canvas background.
- Optional dot grid, line grid, layout grids, rulers, guides, measurement overlays, snapping, and pixel preview.
- Minimap available for large documents and can be toggled independently.
- Frame/artboard labels are outside the artwork bounds and visually distinct from the design itself.
- Canvas background contrast is user-adjustable. Actual artboard contents remain exactly as designed; app-theme changes must not recolour the user's design.
- Offer a presentation/focus mode that hides surrounding panels and restores the previous layout when exited.

### 4.2 Navigation and pointer behavior

- Space + drag pans by default; trackpad gestures and middle-button pan are supported where available.
- Mouse wheel/trackpad zoom behavior is consistent and user-configurable (for example, zoom to pointer vs. zoom to viewport centre).
- Zoom-to-selection, zoom-to-fit, zoom-to-100%, zoom-to-page, and previous/next viewport are available through shortcuts or a menu.
- Clicking a visible object selects it. Alt/Option-click or a dedicated pick-through gesture can select behind overlapping layers.
- Shift adds/removes from selection where appropriate. Modifier keys must be configurable and shown in the shortcut reference.
- Dragging an object previews its new position and snapping relationships; dropping commits one undoable transaction.
- Press Escape once to cancel the current sub-operation, twice to leave a nested editing mode only where that behavior is predictable; do not close the document.
- Inline text editing and numeric inputs should not conflict with canvas shortcuts. When focus is inside an editable field, typing must remain text unless a documented command shortcut is used.

### 4.3 Selection and on-canvas feedback

- Selection bounds use a high-contrast accent outline with corner/midpoint handles where relevant.
- Handle hit areas must be comfortable; visual handles may be small, but the effective pointer hit area should be larger than the visible mark.
- Multi-selection shows a group bounding box and identifies mixed values in the inspector.
- Smart guides and distance labels use a guide colour (recommended cyan) distinct from destructive/error red. Provide a colour-safe alternative.
- Hovered layers can show a temporary canvas outline, bounds, dimensions, and a breadcrumb. This preview must not obscure the artwork and must be disableable.
- Selection, hover, keyboard focus, AI proposal, component instance, and error states must be visually distinct. Do not reuse the exact same treatment for all states.

### 4.4 Undo, redo, and transactions

- Each direct manipulation action is one undo step; related micro-steps made by a single gesture are grouped into one logical operation.
- AI operations are grouped by a named transaction (e.g., “AI: Create checkout wireframe”) and can be previewed and accepted as one step, or reverted as a complete set.
- Never mix a user gesture and a background AI change into one indistinguishable history event.
- History details show actor, time, operation summary, and scope. For collaborative changes, distinguish local changes from synced changes.
- Destructive commands use a clear confirmation or easy recovery path, proportionate to impact. Do not add confirmation dialogs to routine reversible actions.

---

## 5. Robust, beginner-friendly layer tree

The tree is a core differentiator: it should be precise for advanced designers and understandable to a person opening a design tool for the first time.

### 5.1 Separate three hierarchies

1. **Workspace/file hierarchy:** workspace → project → document.
2. **Document hierarchy:** pages → sections / flows / shared resources.
3. **Canvas hierarchy:** frame/artboard → semantic containers/groups → components/instances → text, vector, media, and other leaf layers.

Do not put projects and file navigation into the same tree as individual canvas nodes. Use breadcrumbs or a separate file browser for workspace/file context.

### 5.2 Default row anatomy

```text
[ disclosure ] [ type icon ] [ layer name or editable name ] [ state badges ] [ quick actions ]
```

- Comfortable row: **32 px** height.
- Compact row: **28 px** height, user-selected.
- Every interactive control has a pointer hit target appropriate to the accessibility design; tiny eye/lock glyphs must not be the only 14 px target.
- Nest indentation: 12 px per depth level, with optional guide rails. Cap the visual indentation after approximately eight levels and show path context/breadcrumbs for deeper nodes so nested content does not disappear off-screen.
- Default type icons are mostly monochrome to reduce colour noise. Type names appear in tooltips and optional badges. A user may enable optional “Colourize layer types” mode, but colour is never the only indication of type.
- Long names truncate gracefully with full name on hover/focus. Rename is inline and supports Enter to commit and Escape to cancel.

### 5.3 Type taxonomy and mental models

Every node has a type and a clear description:
- **Page:** top-level design workspace within a document.
- **Section:** visual organization/grouping of related frames.
- **Frame / Artboard:** bounded parent container that can define viewport, layout, constraints, and overflow behavior.
- **Group:** a selection/grouping structure for joint manipulation; not automatically a responsive layout.
- **Auto Layout / Stack / Grid container:** a layout-aware container with spacing, alignment, padding, sizing, wrap, and overflow rules.
- **Component / Main component:** reusable source object.
- **Component instance:** linked usage of a component with overridable properties where allowed.
- **Text, Vector, Shape, Image, Video, Mask, Boolean result, Path, Slice, Embed, Annotation:** leaf or specialised node types.

These definitions should be accessible through short descriptions, onboarding hints, and context menus. Never assume new designers already know the distinction between a group, frame, section, and component.

### 5.4 Tree row states

- **Default:** readable label and clear type icon.
- **Hover:** reveal quick actions and canvas hover preview.
- **Selected:** indigo-tinted neutral surface plus a left accent stripe and text contrast; preserve a non-colour cue.
- **Keyboard focused:** strong visible focus ring that is distinct from selection.
- **Multi-selected:** selected rows share a background and the primary anchor row is identified. Show count and batch actions.
- **Hidden:** lower-contrast label plus eye-off icon; still discoverable and selectable in the tree.
- **Locked:** padlock icon and disabled on-canvas manipulation; user can still inspect unless permissions prohibit it.
- **Component instance:** component icon plus “Instance” status badge; stale/unlinked/overridden states use labels.
- **Layout-managed:** compact badge like `Stack`, `Grid`, or `Constraints`; hover/focus reveals exact rules.
- **AI suggested:** label such as “Suggested name: Primary action background” or a subtle `AI suggestion` badge. Do not silently rename layers based on inference.
- **Warning/error:** icon plus actionable text; do not rely on red alone.

### 5.5 Tree interactions

- Click a row to select its node and sync selection with the canvas and inspector.
- Click disclosure control or use Left/Right arrows to collapse/expand. Left/Right behavior must follow conventional tree patterns.
- Up/Down changes keyboard focus between visible tree items; Home/End jumps to first/last visible row. Enter/Space behavior is context-aware and explained in help.
- F2 or a documented rename shortcut edits the layer name inline.
- Dragging reorders or reparents nodes. Show a clear insertion line or parent highlight before drop; support a keyboard alternative via “Move to…” and layer-order commands.
- To prevent accidental nesting, reparent only after an explicit drag-intent threshold and show the new parent visually before committing. Keep the operation undoable.
- Right-click or keyboard context-menu key opens a context menu at the focused row; all menu commands are keyboard reachable.
- Hovering or focusing a row highlights its bounds on the canvas and reveals a breadcrumb, size, parent, visibility, and lock state. This feature can be disabled in preferences.
- Eye and lock quick actions appear on hover/focus, but never change state when a row is clicked. Clicking the row and clicking a specific action remain separate targets.
- Search supports name, node type, visibility, lock state, component status, token usage, and optional semantic search. Search result selection reveals the full ancestor path.
- Provide `Collapse all`, `Expand to selection`, `Reveal in tree`, `Select parent`, `Select children`, `Rename`, `Move to…`, and `Copy path`.
- For very deep trees, use hierarchy breadcrumbs and capped indentation rather than shrinking labels or forcing horizontal scrolling.
- Support bulk hide, lock, rename, group, component conversion, and delete with the selection count explicitly shown.
- When the same instance appears on multiple pages or in multiple frames, distinguish the current location and component source.

### 5.6 AI assistance in the tree

AI may suggest:
- Semantic layer names.
- Group boundaries.
- Candidate componentisation.
- Potential parent-child mistakes.
- Duplicate or near-duplicate assets.
- Unused or missing token links.
- Suspected layout problems.

Every suggestion must include a confidence label or reason, affected node IDs, a preview of changed names/structure, and accept/reject controls. Never present an inference as a known fact. Automatic batch naming is allowed only as a previewable, undoable operation.

---

## 6. Right inspector: context-aware without being unpredictable

### 6.1 General rules

- Default width 312 px, configurable within limits.
- Top of inspector contains a stable identity row: icon, editable layer name, type, lock, visibility, and overflow menu.
- Tabs adapt by mode: **Design**, **Prototype**, **Accessibility**, **Export**; the visible tab set should be predictable and documented.
- The panel changes contents based on selection type, but maintains a consistent section order wherever the concepts overlap.
- Remember open/closed accordion state per user and layer type. Offer “Expand all / Collapse all.”
- Mixed selection values display “Mixed” or a mixed-state indicator; never silently display one selected layer’s value as if it applied to all.
- Numeric fields support typing, arrow-key stepping, modifier-scaled stepping, clipboard paste, reset, and scrubbing on the numeric label where appropriate. Scrubbing must not be the only method.
- Field focus has a persistent visible focus indicator. Do not use a subtle glow as the only focus cue.
- On a failed edit, keep the current value visible, show the reason, and offer a clear correction path.

### 6.2 Design tab: baseline order

1. **Position & Transform** — X, Y, W, H, rotation, flip, resize behavior, aspect ratio.
2. **Layout & Resizing** — constraints, Auto Layout / stacks, grid, gaps, padding, alignment, hug/fill/fixed size, wrap, min/max size, overflow and clipping.
3. **Appearance** — fill, opacity, blend mode, corner radius, stroke.
4. **Effects** — shadow, inner shadow, blur, background blur, other effect stack.
5. **Typography** — when text is selected: font family, weight, size, line height, letter spacing, paragraph spacing, alignment, decoration, text resizing, list settings.
6. **Image / Media** — fit, crop, focal point, mask, image adjustments, alt text, media metadata where relevant.
7. **Component / Variant** — component link, properties, variant selection, overrides, detach or swap.
8. **Advanced** — vector/path attributes, boolean operation data, blend modes, exports, metadata. Show only when relevant.

A selected text layer should not display irrelevant geometry or image controls expanded by default. A selected frame should surface its layout and child organization. A component instance should make its component link and overrides easy to find.

### 6.3 Prototype tab

- Trigger type: click/tap, hover, press, drag, key, variable/state change, or supported device event.
- Action: navigate, back, open/close overlay, scroll to, change variable, set visibility, swap component variant, condition, or supported custom action.
- Destination and source are named; link graph errors are explicit.
- Animation: preset, duration, delay, easing, transition direction, reduced-motion fallback.
- Scroll behavior: vertical/horizontal/both, fixed/sticky elements, clipping, preserved scroll position.
- Flow start points and device viewport are configurable.
- Interactions are visible in a graph and in a source/destination list. A designer can edit a link without dragging a tiny connector.
- Validate missing targets, cycles that have no exit where relevant, unreachable screens, and unsupported actions before presenting the prototype as complete.

### 6.4 Accessibility tab

- Contrast checks for text, icons, controls, focus indicators, and relevant non-text objects.
- Text-role prediction (body, label, heading, helper, error, caption) must be marked as a suggestion unless explicitly assigned.
- Readability checks for small text, line height, line length, spacing, zoom and responsive overflow.
- Focus order, control label, hit target, keyboard support, state announcement, and color-only dependency checks.
- Show the rule and measured value, affected node, impact, and one or more fixes. Do not label a screen “accessible” merely because it passes colour checks.
- Distinguish machine-checkable findings from items that require manual or user testing.

### 6.5 Export tab

- Formats: PNG, JPEG, SVG, PDF, and a structured `.dforge` project.
- Export scope: selection, frame/artboard, section, page, or complete document.
- Scale/resolution, transparent background, colour profile options, naming pattern, slices, and batch export.
- Code export / IDE project generation is a separate workflow, not a file-format checkbox. It needs framework, styling, routing, asset, token, and project structure decisions.

---

## 7. AI assistant UX

The AI must work like a design-aware operator inside the editor, not a separate chat page that ignores document context.

### 7.1 Entry points

- Global AI command in the top bar.
- Context-menu action on selected object(s).
- Canvas prompt for “create a wireframe/design from…”.
- Inline suggestions in the navigator and inspector.
- Command palette and keyboard shortcut.
- Accessibility and quality-audit actions on current selection/page/document.

### 7.2 AI side panel

- Dock as a tab beside the inspector or open in a resizable bottom drawer.
- Remember the last position; never take over the canvas without the user choosing that layout.
- Conversation context clearly names the active file, page, selection, design system, target platform, and constraints.
- Show `Proposed → Validating → Preview ready → Applied` states.
- Display a structured change summary: what changes, which nodes, which tokens, which links, what might break.
- Preview before applying changes that create or substantially modify a design.
- Offer Apply, Apply selected, Edit proposal, Reject, and Revert.
- AI output can be annotated with “Uses existing component”, “Uses existing token”, “New component”, “New token”, or “Not in design system”.
- Do not claim validation that was not run. Surface missing context and uncertainty.
- A generated design should be editable with native layers, constraints, components, tokens, text and prototype wiring—not only a bitmap.

### 7.3 AI safety and predictable behavior

- Model suggestions are not allowed to write directly to persistent state. Route them through typed commands and validation.
- Validate permissions, node existence, references, bounds, layout constraints, token use, and supported export paths.
- Require explicit approval for destructive/broad changes, library-wide changes, publishing, external sharing, or code execution.
- Treat imported files, comments, pasted prompts, links, and design text as untrusted content rather than privileged agent instructions.
- Keep provenance: AI model/config, prompt/action summary, source references, changes applied, validation result, and user approval. Avoid retaining sensitive prompt contents longer than needed.
- Apply rate/cost limits and cancellation controls. Cancelled AI operations must not continue to apply changes.
- A hallucinated or invalid operation must fail safely without corrupting the document.
- Quality dashboard metrics: accepted-proposal rate, post-apply rollback rate, invalid-command rate, validation failure rate, median time-to-first-preview, latency, and cost per accepted task.

---

## 8. Branding and visual language

### 8.1 Design personality

**Industrial Precision + Calm Workspace + Human-Controlled Intelligence**

Use surfaces, geometry, subtle separators, and disciplined spacing to express precision. Use indigo sparingly for active state, selection, and core actions. Allow user work on the canvas to supply the visual colour; avoid turning the entire shell into a neon AI dashboard.

### 8.2 Core palette

The Axiom base colours are retained and formalised into semantic tokens.

| Token | Dark value | Usage |
|---|---|---|
| `surface.canvasChrome` | `#0D0D0F` | Main application shell |
| `surface.raised` | `#141417` | Panels, menu base |
| `surface.input` | `#1A1A1E` | Inputs and restrained inset controls |
| `surface.hover` | `#1E1F24` | Hover and elevated hover state |
| `surface.selected` | `#312E81` | Selected navigation/layer surface |
| `border.subtle` | `#27272C` | Panel separators and standard borders |
| `border.strong` | `#3F3F46` | Focus-adjacent, active controls, resize dividers |
| `text.primary` | `#FAFAFA` | Primary text |
| `text.secondary` | `#A1A1AA` | Labels, hints, secondary content |
| `text.muted` | `#71717A` | De-emphasised or disabled text only where contrast is acceptable |
| `brand.accent` | `#6366F1` | Selection outline, brand accents, non-text highlights |
| `brand.action` | `#4F46E5` | High-priority buttons with white text |
| `brand.accentSoft` | `#A5B4FC` | Contrast-friendly highlight on dark chrome |
| `guide.info` | `#22D3EE` | Smart guides and dimension feedback |
| `status.success` | `#22C55E` | Success state, paired with text/icon |
| `status.warning` | `#F59E0B` | Warning state, paired with text/icon |
| `status.danger` | `#F87171` | Errors/destructive issues, paired with text/icon |

The original spec uses crimson smart guides; change the default guide colour to cyan so guide/dimension geometry is not visually conflated with error feedback. Keep a per-user guide-colour option.

### 8.3 Themes

Provide:
- **Axiom Dark** — the base dark chrome from the supplied specification.
- **Axiom Light** — neutral light chrome for users who prefer it.
- **High Contrast** — stronger borders, focus indicators, and text.
- **Follow System** — follow the operating-system preference.

Theme changes only the app chrome, controls, and editor UI. It never changes artwork, actual artboard fills, exported images, or document tokens. Theme preferences are per user; project-specific artboard settings are stored with the document.

### 8.4 Typography

- **UI family:** Inter Variable, with a resilient system-sans fallback.
- **Numeric/code family:** a legible monospace family such as JetBrains Mono, with OS monospace fallback.
- Avoid using the brand display typeface for dense inspector controls.
- Default UI text should be 13–14 px where space is constrained, with 14 px as the comfortable default for primary controls and labels.
- Provide UI scaling (80–150% or a platform-appropriate equivalent) and density options independent of operating-system zoom.
- Suggested scale: 11 (micro metadata), 12 (secondary labels), 13 (dense control value), 14 (default control/body), 16 (panel lead), 20 (dialog/title), 24 (major workspace title). Do not use 11–12 px for sustained reading or essential instructions.
- Use tabular numerals for measurement fields. Keep line height around 1.35–1.5 for reading content; compact numeric controls may use a tighter line height.
- Avoid long all-caps labels, overly light font weights, and low-contrast grey text.

### 8.5 Geometry and spacing

- Base spacing unit: 4 px; primary scale: 4, 8, 12, 16, 20, 24, 32, 40, 48.
- Control height: 32 px default; 28 px compact; 36 px comfortable / touch-oriented.
- Corner radii: 4 px for dense fields, 6 px for default controls, 8 px for popovers, 10–12 px for larger dialogs. Keep chrome restrained and avoid nested cards inside every panel.
- Standard panel border: 1 px. Resize handles/dividers must have larger invisible hit areas than their visible line.
- Elevation comes from subtle border and tonal contrast first, shadows second. Avoid excessive blur and glassmorphism around the canvas.
- Use one consistent icon family (e.g., Lucide-style line icons), with consistent 16/18/20 px sizes and strokes. The final icon set and licence should be reviewed before distribution.

### 8.6 Logo and brand mark direction

Develop an original **geometric forge/spark built from aligned vector planes or nested frames**. It should:
- Work in one colour at 16–24 px.
- Have an unmistakable silhouette without a gradient.
- Avoid visually copying Figma's multicoloured mark, Sketch's diamond language, or Adobe XD's letters/colour treatment.
- Have clear space and minimum-size rules in the brand guide.
- Support monochrome for the editor chrome and a restrained indigo accent for marketing/AI entry points.

Do not use a glowing gradient AI logo in every toolbar. The AI capability is a product function, not the identity of every control.

### 8.7 Voice and microcopy

- Speak like a capable design partner, not a sales chatbot.
- Use action-first labels: “Apply 3 changes”, “Show 6 layers”, “Fix contrast”, “Keep current layout”.
- State what the system knows versus what it infers: “Suggested: this may be a button background.”
- Prefer precise states: “Saved 2:41 PM”, “3 changes awaiting sync”, “Prototype has 2 unreachable frames”.
- Avoid alarmist copy and vague states such as “Something went wrong” where a useful cause can be shown.

---

## 9. Recommended design-system technology

### Recommendation: build an original Axiom system, based on interoperable tokens and accessible primitives

Do **not** adopt Material UI, Carbon, or Fluent wholesale as the visual identity of the editor. They are valuable references, but a professional canvas tool needs specialised components—selection handles, vector controls, measurement fields, layer rows, token pickers, component-variant controls, prototype graph nodes, and export inspectors—that should belong to Axiom.

Use the following layers:

1. **Design tokens:** adopt the Design Tokens Community Group (DTCG) stable format v2025.10 as the exchange contract for colours, typography, spacing, radii, elevation, themes and aliases. Keep a canonical semantic token model internally and map it to DTCG on import/export.
2. **Accessible primitives:** Radix UI Primitives is a strong option for general menus, dialogs, tabs, popovers, tooltips, checkboxes, selects and keyboard/focus behavior. Style them with Axiom tokens. Audit each use in the actual editor and wrap it in Axiom-owned components.
3. **App-specific components:** implement custom components for the canvas, tool shelf, layer tree, property scrubbing fields, alignment controls, constraints, token-aware colour picker, component selector, prototype graph and design-to-code inspector.
4. **Visual rules:** tokens are the source of truth; do not hardcode brand hex values across components.
5. **Platform adaptors:** support mouse, keyboard, trackpad and touch preview; never assume all input comes from a mouse.
6. **Documentation:** every component entry includes anatomy, variants, interaction states, keyboard behavior, accessibility notes, design tokens, examples, anti-patterns, and a visual regression fixture.

Why this combination:
- The DTCG specification provides a vendor-neutral exchange format for design decisions rather than locking the app into one competitor's file structure.
- Radix gives accessible baseline behavior for conventional web UI primitives while preserving freedom to define a distinctive design language.
- The custom layer handles the features generic UI libraries do not know about: canvas gestures, selection geometry, tree semantics, property scrubbing, and a transactional design engine.

Material, Carbon, Fluent, and Apple HIG should be reference libraries for evaluating established interaction patterns, not copied skins. Take what fits—clear hierarchy, accessibility, consistent control placement, sensible density, and predictable keyboard behavior—then encode it in Axiom.

---

## 10. Component specification checklist

Every Axiom component must document:

- Purpose and when to use / not use it.
- Anatomy and semantic structure.
- Variants and size options.
- Default, hover, focus, active, pressed, selected, disabled, loading, error, warning, read-only, and high-contrast states as applicable.
- Keyboard operation, focus order, accessible name/description and screen-reader announcement.
- Pointer target size and spacing.
- Contrast and visible focus treatment.
- Responsive/collapsed behavior.
- Token dependencies and theme support.
- Undoable versus non-undoable actions.
- Motion duration/easing and reduced-motion fallback.
- Empty, zero-state, partial-data, offline and error states.
- Analytics/instrumentation events where useful; do not collect sensitive design contents unnecessarily.
- Unit, interaction, accessibility, and visual regression tests.

### Required component families

- Shell/navigation: command bar, mode rail, document tabs, page selector, breadcrumbs, tool shelf, status bar, split panes, bottom drawer.
- General controls: icon button, button, segmented control, tabs, menu, context menu, command palette, tooltip, popover, dialog, toast, form field, combo box, checkbox, radio, select, slider.
- Editor: canvas viewport, minimap, rulers, guides, selection box, resize/rotation handles, smart-guide overlay, artboard title, viewport controls.
- Tree: tree row, disclosure button, layer icon, type badge, state badge, inline rename field, virtualised tree, tree search, tree context menu, ancestor breadcrumb.
- Inspector: numeric/scrub field, colour field/picker, token selector, typography editor, layout-direction control, padding/gap control, 9-point alignment selector, constraints editor, effects stack, mixed value field.
- Design system: token browser, token reference chip, variable/collection picker, component browser, variant/property editor, override panel, library publish/update flow.
- Prototype: flow list, connection handle, interaction card, trigger/action editor, transition editor, overlay preview, timeline, variable/state panel, validation result.
- AI: task composer, context chips, intent clarification, proposal diff, change summary, validation report, apply/reject controls, execution progress, history, error and cancellation states.
- Dev/export: inspect panel, code preview, asset exporter, project generator, mapping/override warnings, build status, IDE handoff panel.
- Collaboration: presence indicator, remote cursor, comments/threads, approval status, conflict resolver, activity history.

---

## 11. Accessibility and comfort acceptance criteria

Target **WCAG 2.2 AA** for the web interface as a baseline and independently test desktop, canvas, and mobile preview workflows. This includes more than colour contrast.

- Normal text contrast at least 4.5:1; large text at least 3:1, where WCAG applies.
- Essential component boundaries, state indicators, and graphical objects have sufficient contrast against adjacent colours.
- Pointer targets meet WCAG 2.2 minimum target-size requirements or satisfy a documented exception; aim for 28–32 px controls in the editor and enlarge small hit areas invisibly where necessary.
- All actions have keyboard alternatives; drag/reparent and drag-to-connect operations have non-drag alternatives.
- Visible, persistent keyboard focus indicator; focus is not obscured by floating panels.
- Screen-reader labels for icon buttons, tree node roles/states, numeric fields, validation messages, and progress updates.
- Do not encode selected, locked, invalid, or AI-generated status using colour alone.
- Zoom and UI scaling do not clip critical inspector fields. Provide reflow/collapsed panels at smaller widths.
- Respect OS high-contrast settings and reduced motion.
- Error messaging identifies the field or object, the problem, and the next useful step.
- Provide a way to disable hover previews, animations, smart-guide overlays, and unsolicited AI suggestions.
- Support left-handed / custom toolbar placement only if it can be delivered without compromising core interaction consistency.
- Test with keyboard-only workflows, screen readers, zoom, high contrast, touch/motor accessibility, and real user research. Automated audits are necessary but insufficient.

### Comfort features

- Comfortable / Standard / Compact density presets.
- UI scale separate from canvas zoom.
- Dockable, resizable, collapsible side panels.
- Adjustable canvas contrast/grid strength and guide colour.
- Reduce motion and disable animated cursor/AI embellishments.
- Shortcut mapping and discoverable shortcut sheet.
- Optional focus mode, optional dimming of inactive app chrome, and easily restored hidden panels.
- No enforced breaks or claims of health benefit; avoid aggressive gamification and attention-grabbing idle animations.

---

## 12. Workspace profiles and responsive behavior

### Profile A — Standard (default)
- Mode rail visible.
- Navigator 272 px.
- Inspector 312 px.
- Tool shelf visible.
- Bottom drawer collapsed.

### Profile B — Canvas Focus
- Navigator and inspector collapsed.
- Minimal floating tool shelf.
- Minimap and zoom controls accessible.
- Exit button plus shortcut always visible.

### Profile C — Design Systems
- Navigator prioritises Components/Libraries.
- Inspector prioritises component properties, variants, tokens, and documentation.
- Bottom drawer may open token references or component audit.

### Profile D — Prototyping
- Flow navigator active.
- Connection graph and interaction list accessible without obscuring the canvas.
- Timeline/variables drawer can be expanded.

### Profile E — Developer Handoff
- Inspector prioritises exact geometry, CSS/token mapping, asset export and code mapping.
- Visual comparison and implementation warnings available.
- No code is declared production-ready unless export validation and build checks have passed.

### Width adaptation

- **≥ 1440 px:** full split-pane desktop layout.
- **1280–1439 px:** compact rail labels, user-adjustable sidebars, hidden secondary controls in menus.
- **1024–1279 px:** one sidebar may collapse; inspector can open as a drawer; keep canvas and primary tool shelf visible.
- **Below 1024 px:** present a compact review/prototype experience or a reduced editor layout, not the entire desktop UI crushed into tiny controls. Full design editing may require a desktop-sized window.
- Mobile devices primarily access prototype preview, review, comments, and remote testing. Do not promise parity with the full desktop vector editor until touch precision and viewport constraints are designed and tested.

---

## 13. First-run experience and discoverability

### First open
- Ask the user what they want to do: Start a design, Import, Open a recent file, Generate with AI, or Explore a sample.
- Offer designer experience choices (New to design / Experienced / Developer) as customisation, not as capability gates.
- Create a small starter canvas and tooltips only when the relevant tool is first encountered.
- Teach the difference between page, section, frame, group, component, and instance in context.
- Provide `Undo` prominently and demonstrate that AI changes can be previewed and reverted.
- Include a one-click “Reset workspace layout” at all times.

### In-context guidance
- Prefer short inline descriptions and contextual keyboard hints over repeated modal tours.
- Allow “Show me how this works” on unfamiliar controls.
- Learn from user dismissals; do not repeatedly show the same onboarding hint after it is dismissed.
- Every AI suggestion labels if it reuses the design system or creates something new.
- Introduce advanced capabilities incrementally, but do not hide advanced controls from experienced users who search for them.

---

## 14. Implementation priorities

### P0 — Interaction foundation
1. Axiom token foundation and theme switcher.
2. App shell with resizable/collapsible rail, navigator, canvas, inspector and status bar.
3. Basic accessible primitives and keyboard focus system.
4. Robust layer tree semantics, selection synchronization, search, lock/hide and inline rename.
5. Document selection/undo transactions and autosave/sync states.
6. Preference store for theme, density, panel widths, last-used tools and shortcuts.

### P1 — Design productivity
1. Tool shelf and canvas hover/selection feedback.
2. Context-aware inspector and mixed-value handling.
3. Component/asset browser and token-aware controls.
4. Command palette, contextual menus and shortcut help.
5. Accessibility audit panel and contrast checks.
6. Workspace profiles and responsive panel behavior.

### P2 — Prototyping and AI
1. Interactive prototype graph and flow navigator.
2. AI proposal/diff/validation/apply/revert workflow.
3. AI layer naming, design-system-aware wireframe generation and layout critique.
4. Prototype preview and remote mobile testing.
5. AI history, operation logs and quality evaluation.

### P3 — Developer workflow
1. Dev inspector and token mapping.
2. Export to PDF/PNG/JPEG/SVG and `.dforge`.
3. React/TypeScript project generation with deterministic mappings.
4. Build/test validation, project download and IDE opening instructions.
5. Collaboration, branching/versioning, review and library governance at production scale.

Do not begin by implementing every toolbar item as a visual mock. Make each visible control functional, accessible, undoable where appropriate, and represented in the document/API model.

---

## 15. Quality evaluation and user testing

Run task-based studies with first-time designers, mid-level product designers, design-system specialists, and developers. Test representative jobs:

- Find a deeply nested layer by name and by semantic context.
- Understand why an object is a group rather than a frame.
- Edit spacing/typography using both canvas and inspector.
- Apply a component update and understand the impact.
- Generate a wireframe with AI, review the diff, accept two changes, reject one, and undo the result.
- Find a low-contrast label and fix it using a token-aware recommendation.
- Create an interaction and preview it on a phone.
- Export assets and create a React project with understandable warnings.
- Recover from offline sync or a conflicting edit.
- Complete common tasks with keyboard only.

Measure task completion, time on task, misclicks, undo frequency, loss of selection, panel changes, shortcut discovery, perceived workload, comfort, confidence in AI suggestions, and successful recovery from error. Compare results across themes and density settings. Do not infer that dark mode is more comfortable without observed user data.

### Release acceptance gate

A release should not ship if:
- The canvas becomes unresponsive during normal AI inference.
- An AI operation can overwrite the user's work without an explicit, reversible action.
- A layer tree change loses selected node identity or keyboard focus.
- Core controls lack accessible labels or keyboard operation.
- Hidden/locked state, sync conflict, or export failure cannot be explained.
- A theme or density change alters actual artwork.
- A desktop layout at supported width hides essential tools without a discoverable route back.

---

## 16. Reference guidance

The following sources informed interaction and standards decisions; consult the live sources during implementation because guidance evolves.

- Sketch, **The Mac app interface** — layer list, toolbar, infinite canvas, inspector, minimap: https://go.sketch.com/docs/interface-and-settings/the-mac-app-interface/
- Sketch, **What is Sketch?** — Mac design app, web collaboration, iOS preview: https://www.sketch.com/docs/getting-started/what-is-sketch/
- Sketch, **Prototyping** — links, overlays, scrolling, fixed elements and preview: https://www.sketch.com/docs/prototyping/
- Figma, **Right sidebar** — context-sensitive design and prototype properties: https://help.figma.com/hc/en-us/articles/360039832014-Design-prototype-and-explore-layer-properties
- Figma, **Components, styles and shared libraries**: https://www.figma.com/best-practices/components-styles-and-shared-libraries/
- Apple, **Human Interface Guidelines** — platform interaction foundations: https://developer.apple.com/design/human-interface-guidelines
- Apple, **Toolbars** — action grouping, discoverability and hiding controls: https://developer.apple.com/design/human-interface-guidelines/toolbars
- Apple, **Sidebars** — hierarchy, customisation and collapse behavior: https://developer.apple.com/design/human-interface-guidelines/sidebars
- W3C, **WCAG 2.2** — accessibility conformance requirements: https://www.w3.org/TR/WCAG22/
- Design Tokens Community Group, **stable token format v2025.10**: https://www.designtokens.org/tr/2025.10/
- Radix UI, **Accessibility** — focus management, semantics and keyboard behavior: https://www.radix-ui.com/primitives/docs/overview/accessibility
- Adobe, **XD Help** — XD maintenance-mode notice: https://www.adobe.com/products/xd.html

---

## 17. Final recommendation

Build **DesignForge AI with Axiom as its own design system**. Preserve the industrial-precision dark chrome of the current Axiom spec, but make it configurable, less colour-noisy, and more comfortable to operate over long sessions. Use a separate mode rail, contextual tool shelf, semantic layer tree, predictable right inspector, and reversible AI proposal workflow.

The differentiator is not a particular shade of indigo or a denser toolbar. It is a consistent design engine in which a designer can directly manipulate the canvas, understand any layer, maintain a system of reusable tokens and components, test real interactions, and ask AI to help without giving up control.
