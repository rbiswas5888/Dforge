# MASTER PROMPT v2: Upgrade Existing Design Application into an AI-Native Professional Design Editor That Goes Beyond Figma and Sketch

## 0. How to Read and Use This Prompt

- Each section has: **What** (the feature), **Daily use** (why a UI/UX designer needs it), and **Done when** (verifiable acceptance).
- Priorities: **[P0]** = must work before anything else is claimed complete. **[P1]** = the advanced differentiators. **[P2]** = polish and ecosystem.
- Build in the phase order given in Section 24. Do not start P1 work while any P0 control is nonfunctional.
- Never ship decorative UI. Every button, tab, menu item and toggle in scope must execute real logic against the design document.

---

## 1. Project Objective

Upgrade my **existing** design application into a professional, Figma-class UI/UX design editor that is **more advanced** in AI-native workflows, design-system governance, responsive logic, prototyping, developer handoff and code export.

Target users: product designers, UI/UX designers, design-system designers, UX researchers, design engineers, and front-end developers.

**This is an upgrade to my existing application, not a new application from scratch.**

Before making changes:
1. Inspect the repository, framework, dependencies, state management, rendering approach, design tokens and existing features.
2. List working functionality and protect it with regression tests before refactoring.
3. Map the current UI and architecture against this specification.
4. Produce a gap analysis and a prioritized implementation plan (P0/P1/P2).
5. Implement directly in the existing codebase, reusing components, tokens, state and services.
6. Never replace working functionality with mockups, placeholders or dead controls.

Do not stop after planning. Implement, test, validate and report honestly.

---

## 2. Product Vision and Competitive Advantages

Build a professional design tool using familiar Figma/Sketch conventions, with its own visual identity. Exclude Figma Make as a feature; build a native AI design agent instead.

### 2.1 Where this application must be more advanced than Figma

| Area | Typical limitation in current tools | Advanced capability to build | Daily benefit |
|---|---|---|---|
| AI | Prompt-to-frame generation is often detached from design systems | Native agent that edits the real document through validated operations, reuses components/tokens, previews diffs, undoes as one transaction | Hours saved on first drafts, audits and bulk edits |
| Specs to design | Designers manually translate PRDs | Markdown/PRD/URL/screenshot/sketch → editable, system-compliant frames with ambiguity flags | Faster kickoff, fewer misreads of requirements |
| Responsive design | Frames resized by hand; no true breakpoints | Breakpoint-aware layouts, container queries, fluid typography, live multi-breakpoint view | One design, every screen, without duplicating frames |
| Design system | Drift between design and code; hard to find hard-coded values | Continuous design-system linter, token auto-binding, drift detection, governance rules | Consistent products, easier audits |
| Prototyping | Mostly click-through flows | State machines, variables, conditions, expressions, data-driven mock content, real-device preview | Prototypes that behave like the product |
| Code | Dev Mode shows CSS snippets | Deterministic React/TS compiler, live code preview, round-trip token sync, build validation | Designers and developers share one source of truth |
| Accessibility | Done through plugins after the fact | Live WCAG checks, contrast, focus order, touch targets, color-blind simulation, annotations | Accessibility built in, not bolted on |
| Content | Lorem ipsum | AI-generated realistic content, tone control, localization and text-expansion stress tests | Realistic designs and fewer late surprises |
| Versioning | Linear version history | Branches, merge with visual diff, named checkpoints, AI-written change summaries | Safe experimentation and cleaner reviews |
| Automation | Plugins only | Command palette, macros/recipes, scripting API, CLI, and MCP server for external agents | Repetitive work automated |
| Research loop | Feedback lives elsewhere | Comments, review mode, task linking, design-to-spec traceability | Fewer tools and cleaner handoffs |

### 2.2 Core pillars
1. Professional vector and interface editor with an effectively infinite canvas.
2. One typed, canonical design document used by the renderer, properties panel, AI, prototype runtime and code compiler.
3. AI agent operating through a structured, validated tool interface.
4. Design-system engine with governance.
5. Responsive and logic-aware layout system.
6. Prototype runtime with state and logic.
7. Deterministic React/TypeScript compiler.
8. Collaboration, versioning and local-first persistence.
9. Extensibility through plugins, scripting, CLI and MCP.

---

## 3. Application Layout

Desktop-first, persistent workspace with independent panels.

### A. Top application bar [P0]
**What:** Logo and editable project name; File, Edit, View, Object, Text, Arrange, Components, Prototype, Plugins, Help menus; undo/redo; tool group (Move, Frame, Rectangle/Ellipse/Line/Polygon/Star, Pen, Pencil, Text, Hand, Comment); zoom control; Preview; Share; save/sync status.
**Daily use:** Fast access to tools and file operations with minimal chrome.
**Done when:** Every menu item either executes or is hidden. Menu items show shortcuts from the central registry.

### A2. Command palette [P1]
**What:** `Cmd/Ctrl+K` opens a searchable palette for every command, layer, page, component, variable, setting, plugin and AI action. Supports fuzzy search, recent commands and typed arguments (for example "set gap 16", "rename to Card/Primary").
**Daily use:** Keyboard-first designers avoid hunting through menus.
**Done when:** Any registered command is invokable from the palette and results respect current selection.

### B. Left sidebar [P0]
Switchable tabs, independent of the right sidebar:

**Layers**
- Pages, sections, frames, groups, shapes, text, images, components, instances, nested hierarchy.
- Search with filters (type, name, hidden, locked, has-override, uses-style/variable, has-issue).
- Rename, reorder, hide, lock, duplicate, delete, drag-and-drop with drop indicators and cross-frame reparenting.
- Multi-select with Shift/Cmd; bulk rename with patterns and numbering [P1].
- Layer badges: component, instance, auto layout, constraint, prototype link, AI-generated [P1], lint issue [P1].
**Daily use:** Navigating dense files without losing context.

**Assets**
- Local assets, components, component libraries, icons, images, text styles, color styles, effect styles, grid styles, variables and tokens.
- Search, categories, favorites, drag onto canvas, usage count and "where used" [P1].
- Unused-asset finder and safe cleanup [P1].

**Pages**
- Create, rename, duplicate, reorder, delete, navigate; page-specific content preserved.
- Page thumbnails and page status labels (Draft, In review, Approved, Handed off) [P1].

**Outline / Flow** [P1]
- Flow view that lists prototype flows and starting points, and a screen map showing how frames connect.

### C. Central canvas [P0]
**What:**
- Infinite canvas with pan/zoom, zoom to fit, zoom to selection, zoom to 100%.
- Grids, rulers, guides, pixel grid at high zoom, pixel-snapped output.
- Smart guides: edge/center alignment, equal spacing, distances to neighbors shown on Alt-hover.
- Frames/artboards with device presets and custom sizes.
- Selection, multi-selection, marquee, deep select, select-same, select-children.
- Move, resize (with Shift for aspect ratio, Alt from center), rotate, align, distribute, tidy-up (auto-arrange loose objects into rows/columns/grids).
- Vector editing: pen, bezier handles, node add/remove/convert, boolean operations (union, subtract, intersect, exclude), flatten, outline stroke.
- Text editing in place with rich formatting.
- Image placement, fit/fill/crop/tile, masks.
- Nested frames, groups, sections.
- Auto layout and constraints.
- Component instances.
- Context menus aware of selection type.
- Drag-and-drop from assets and from the OS (images, SVG, `.md`, fonts).
- Efficient rendering of large documents (viewport culling, tiling or incremental rendering, GPU-accelerated drawing such as WebGL/WebGPU or Canvas where appropriate).
**Daily use:** The primary working surface; must stay smooth with thousands of layers.
**Done when:** Each operation writes to the design document via the command bus and is undoable; 60fps pan/zoom on a 5,000-layer test file on target hardware (state measured results).

---

## 4. Right Sidebar: Properties, AI, and Workspace Modes

**This is a critical product requirement.**

The right sidebar has persistent top-level modes: **Properties**, **AI**, and, as secondary tabs, **Prototype**, **Inspect/Code**, **Export**, and **Comments** [P1 for the last four].

Rules:
- Switching modes never clears selection, resets the document, interrupts a running AI operation, or discards unsent input.
- Selecting an object opens Properties (unless the designer pinned AI).
- AI can be pinned and docked alongside Properties when width allows (split view) [P1].
- AI conversation history is preserved per document; unsent prompt and Markdown drafts are preserved per document and per mode.
- Running, success, warning and error states are always visible, including as a badge on the AI tab when it is not active.
- Sidebar is resizable with sensible minimum/maximum widths, collapsible, with a responsive fallback (drawer or overlay) on narrow windows.
- Keyboard shortcut to switch tabs.

### 4.1 Properties tab [P0]
Controls adapt to selection type. Every input updates the document and canvas immediately, supports scrubbing numeric fields, math expressions (for example `24*2`), arrow-key nudging, undo/redo, and variable/style binding via a picker.

**Frame:** X/Y, W/H, rotation, fill, corner radius (uniform or per corner, with corner smoothing), clip content, layout direction, padding (uniform or per side), gap (including auto/space-between), alignment and distribution, Fixed/Hug/Fill sizing with min/max width and height, constraints, layout grids (column, row, grid), export settings, responsive rules [P1].

**Text:** content, font family, size, weight, style, line height, letter spacing, paragraph spacing, alignment (horizontal/vertical), color, text box dimensions, resizing behavior (auto width, auto height, fixed), truncation and max lines, OpenType features and variable font axes [P1], text styles, language and direction (RTL) [P1].

**Shapes and vectors:** position/size, rotation, fill (solid, gradient, image, pattern), stroke (position, width, dash, cap, join), per-corner radius, opacity, blend modes, effects (drop/inner shadow, layer/background blur, noise [P2]), path editing, boolean ops.

**Images:** position/size, crop, fit/fill/tile, opacity, radius, replace image, alt text, asset metadata, export options, image adjustments (exposure, contrast, saturation) [P1].

**Components and instances:** component source, variant properties, boolean/text/instance-swap properties, slots for nested content [P1], override list with per-override reset, reset all, detach, go to main component, "used in" list.

**Multiple selection:** shared properties, clear mixed-value indicator, bulk editing, relative edits (for example "+8 to all gaps").

**Done when:** A test selects each object type and verifies each control changes the correct field in the document, and undo restores it.

### 4.2 Prototype tab [P1]
Interactions per selected layer: trigger (click, hover, press, drag, key, timer, variable change), action (navigate, overlay, back, scroll-to, set variable, conditional, open URL), animation (instant, dissolve, slide, push, smart animate with easing and spring), and device frame preview.

### 4.3 Inspect/Code tab [P1]
Live generated CSS/React/TypeScript for the selected layer, token references (not raw values when a variable is bound), measurements and redlines on hover, and copy/export actions. See Section 13.

### 4.4 Export tab [P0/P1]
Per-layer and per-frame exports: PNG, JPG, SVG, PDF, WebP; 1x/2x/3x; suffixes; batch export; export presets; React export entry point.

### 4.5 Comments tab [P1]
Threads pinned to canvas coordinates or layers, mentions, resolve/reopen, filters, and task linking.

---

## 5. AI Assistant Tab

Native AI agent in the right sidebar. It is a **design operator**, not a chat decoration.

### 5.1 What the AI must understand
- Current document, active page, selection and layer hierarchy.
- Components, variants, styles, variables, modes and tokens.
- Layout rules (auto layout, constraints, grids).
- Assets and existing conventions (naming, spacing scale, type scale).
- Attached specifications (Markdown, PRD text, images, URLs [P1]).
- Conversation history and recent user edits.

### 5.2 Panel interface [P0]
- Header with agent name, configured model, processing state.
- Conversation history with timestamps, per-document persistence, New conversation action.
- **Context chip row** showing scope: Selection (name + type), Frame, Page, Document, Attached spec. Clicking a chip changes scope. Includes a "tokens/context size" indicator.
- Prompt composer: multiline, retained across tab switches, `Cmd/Ctrl+Enter` to send, slash-commands (`/analyze`, `/mobile`, `/darkmode`, `/a11y`, `/componentize`, `/tokenize`, `/content`, `/variants`).
- Input modes: Natural language, Markdown spec; attachments: `.md`, text, images/screenshots [P1], URL reference [P1].
- Import Markdown file, Paste Markdown, Attach specification.
- Send/Generate and Stop.
- **Plan card** before execution: steps, scope, objects affected, assumptions, ambiguities, unsupported items.
- **Preview** button (renders proposed changes as real objects on a ghost layer or temporary frame) and **Apply** button (commits).
- **Diff view** [P1]: before/after toggle, changed-layers list, property-level diff, side-by-side or onion-skin overlay on canvas.
- **Undo AI changes**: one click reverts the whole transaction; each AI run is a single history entry.
- Partial apply [P1]: accept or reject individual operations or frames.
- Progress feedback: phases (Parsing → Planning → Validating → Building preview), with cancel at any phase.
- Clear errors: no model configured, rate limit, invalid output, unsupported feature, schema validation failure, with retry/edit options.
- Change summary after apply, listing created, modified, and skipped items and warnings.

### 5.3 Agent modes [P1]
| Mode | Behavior | Daily use |
|---|---|---|
| **Generate** | Create new frames/components from prompt or spec | First drafts, alternate directions |
| **Edit** | Modify selection only | Spacing fixes, copy changes, restyling |
| **Review/Critique** | Read-only analysis with annotations on canvas | Pre-review self-checks |
| **Systemize** | Find repeated patterns, propose components/tokens | Design-system cleanup |
| **Responsive** | Create breakpoints/variants from a base frame | Mobile/tablet versions |
| **Content** | Fill realistic copy, data, avatars, localization | Replace placeholder content |
| **Handoff** | Write annotations, specs, acceptance notes, code export | Developer handoff |

Read-only modes must be guaranteed not to mutate the document.

### 5.4 Design critique [P1]
Analyze hierarchy, alignment, spacing consistency, contrast, tap-target sizes, density, reading order and brand compliance. Output is a ranked list of issues. Each issue links to the layer, explains why it matters and offers a one-click fix (as a previewable operation).

### 5.5 Done when
- With no model configured, the panel shows a setup message and no fake generation occurs.
- A prompt on a selected card changes only that card (and children) unless the scope was explicitly widened.
- A multi-step run applies as one undo step and fully reverts.

---

## 6. Specification-to-Design Workflow

### 6.1 Inputs
- Markdown (`.md`) pasted or imported [P0].
- Natural-language prompt [P0].
- PRD text, user stories, acceptance criteria [P0 via Markdown].
- Screenshot or wireframe image to structured layout [P1].
- URL reference to extract structure/tokens [P1, only where policy and runtime permit].
- Hand sketch photo [P2].
- JSON tokens (for example W3C design tokens) [P1].

### 6.2 Example Markdown input
```md
# Dashboard Design

## Objective
Create a modern enterprise analytics dashboard.

## Layout
- Desktop frame: 1440 x 1024
- Left navigation: 240px wide
- Top header: 72px high
- Main content with responsive grid

## Components
- Navigation sidebar
- Search header
- KPI cards
- Analytics chart
- Recent activity table
- Primary action button

## Design System
- Font: Inter
- Spacing scale: 4, 8, 12, 16, 24, 32
- Border radius: 8px
- Primary color: #2563EB
- Neutral background: #F8FAFC

## Behavior
- Sidebar items are selectable
- KPI cards use reusable components
- Cards align consistently
- Main content responds to frame resizing

## Output
- Editable design frames
- Reusable components
- Responsive layout
- Preserved design tokens
- React and TypeScript export
```

### 6.3 Required workflow
1. Designer pastes or imports Markdown (or other input).
2. Parser produces a structured spec tree (sections, requirements, tokens, components, behaviors, screens).
3. Spec panel shows what was understood, side by side with the source, and **flags ambiguities and unsupported items** with suggested resolutions the designer can pick.
4. AI builds a structured design plan (screens, components, tokens, layout, interactions).
5. Plan is validated against the design schema (types, IDs, value ranges, supported features).
6. Application builds an editable **preview** using real design objects.
7. Designer reviews: diff, coverage checklist ("requirement → generated layer"), warnings.
8. Designer applies all or part of the changes.
9. Designer edits freely through the normal editor.
10. Result is saveable, exportable, and linked back to the spec.

### 6.4 Markdown parsing support [P0]
Headings, bullet/numbered lists, tables, code blocks, front matter, design tokens (colors, spacing, radius, typography, shadows, breakpoints), layout specs, component definitions with variants/states, responsive behavior, interaction requirements, screen-by-screen requirements, export instructions, and acceptance criteria.
- Long specs show parsing and generation progress.
- Original spec is preserved, editable, versioned and re-runnable.

### 6.5 Spec traceability [P1]
- Each generated layer stores `sourceRef` (spec section/line).
- **Spec coverage report**: lists each requirement as Covered / Partially covered / Not covered / Unsupported.
- **Spec drift**: when the design diverges from the spec, flag differences and offer "update spec" or "update design".
**Daily use:** Product, design and engineering share one agreed source and can see what is done.

### 6.6 Done when
Importing the example Markdown above yields a 1440×1024 frame with sidebar (240), header (72), KPI card instances of one component, chart placeholder, table, primary button, variables for the listed tokens, and a coverage report that flags anything not generated.

---

## 7. AI Design Generation Engine

The AI operates **only** through a structured, typed tool interface. It never executes arbitrary code.

### 7.1 Operation categories

**Create:** frames, text, shapes, images/placeholders, components, variants, layout containers, tokens/variables, styles, pages, prototype links.

**Modify:** resize, spacing/alignment, typography, fills/strokes/effects, auto layout, text replacement, variable binding, responsive rules, hierarchy reorganization, component property updates, rename.

**Analyze (read-only):** inspect frame, visual hierarchy, spacing inconsistencies, repeated patterns, hard-coded values, component opportunities, overflow/clipping, accessibility, spec comparison, naming conventions, unused styles.

**Transform:** convert repetition to components, create breakpoint/dark-mode/theme variants, refactor styles, replace values with tokens, improve alignment, generate alternate directions, localize/RTL mirror [P1].

### 7.2 Operation schema requirements
- Each operation: `id`, `type`, `targetIds`, `payload`, `rationale`, `risk` (safe/destructive).
- JSON-schema validated; unknown fields rejected; object IDs resolved against the document; property types and ranges checked.
- Operations are dry-run first on a cloned document; the result feeds the preview.
- Executed through the same command bus as manual edits.

### 7.3 Safety and reliability [P0]
- Destructive operations (delete, detach, overwrite styles) require explicit confirmation and appear highlighted in the plan.
- Permission checks (read-only files, locked layers, library components not editable by the user).
- Cancellation at any stage; partial results discarded cleanly.
- One transaction per run; full undo.
- Unrelated objects untouched (verified by diffing before/after outside scope).
- Unsupported features reported, not faked.
- Never state success until the design engine confirms the commit.
- Rate limit, timeout and retry policies; deterministic fallback for failure.
- API keys stored securely and never embedded in the document or exports.
- Model selection and provider abstraction (cloud or local model) [P1].
- Audit log of AI operations per document [P1].

### 7.4 Design-system awareness
AI prefers existing components, variables and styles. It must report which were reused, which were created and why.

---

## 8. AI Context and Scope Control

Scopes: Selected object(s), Selected frame, Current page, Entire document, Selected components, Attached spec.

- When an object is selected, show name and type, and default scope to Selection.
- With no selection, ask the designer to choose: Create new frame, Edit current page, Analyze document.
- Vague prompts never silently widen scope. If scope is unclear, the AI asks or shows the plan for approval.
- Scope is enforced by the engine: operations targeting IDs outside scope are rejected unless the designer expands scope.

Example prompts to support:
- "Improve the spacing in this selected card."
- "Create a mobile version of this frame."
- "Convert these buttons into a component set."
- "Apply the attached design system to the selected screen."
- "Create the dashboard described in the attached Markdown."
- "Analyze the current page and identify inconsistencies."
- "Fill this table with realistic data for a fintech app."
- "Stress-test this layout with German and Arabic text."
- "Make a dark theme using existing variables."

---

## 9. Design Engine Architecture [P0]

Single typed document as the source of truth.

**Document model:** stable UUIDs, parent/child tree, pages, geometry and transforms, text runs, vector paths, image assets, fills/strokes/effects, auto layout, constraints, components/variants, styles, variables/modes, prototype graph, annotations, comments, metadata, schema version.

**Systems:**
- **Command bus:** every change (manual, AI, plugin, collaboration) is a command with `do`/`undo`, batched into transactions.
- **History:** per-document undo/redo, grouped by gesture; survives panel switches.
- **Schema validation and migrations:** versioned schema; migration functions; reject or repair corrupted files safely.
- **Selection and viewport state** kept separate from document data.
- **Layout solver:** deterministic auto layout, constraints and responsive rules; shared by renderer, prototype runtime and compiler.
- **Reactive subscriptions:** panels subscribe to the slices they need (no whole-document rerender).
- **CRDT/OT-ready structure** [P1] so real-time multi-user collaboration can be added without redesigning the model.
- **Serialization:** JSON (human-diffable) plus binary/compressed container with assets.

The renderer, properties panel, AI, prototype runtime and React compiler must all consume this model. No parallel representations.

**Done when:** Property tests apply random command sequences, undo them all, and confirm the document equals the original.

---

## 10. Design System and Components

### 10.1 Core [P0/P1]
- Component creation, instances, properties (variant, boolean, text, instance-swap), variants and variant sets, nested components, slots [P1].
- Text, color, effect and grid styles.
- **Variables:** color, number, string, boolean; collections; **modes** (light/dark, brand, density, locale, breakpoint); aliasing; scoping (which properties a variable may bind to).
- Component libraries: publish, consume, update notifications, selective accept, breaking-change detection [P1].
- Override management and reset; update propagation.

### 10.2 Advanced differentiators [P1]
- **Design-system linter (live):** flags hard-coded colors/spacing/type, detached instances, off-scale values, inconsistent radii, orphan styles. One-click "bind to nearest token".
- **Auto-tokenize:** scan a file, propose a token set (colors, spacing scale, radii, type scale) and apply with preview.
- **Drift detection:** compare instances vs. main components, and design tokens vs. code tokens, listing differences.
- **Component health:** usage counts, detach rate, last updated, accessibility status.
- **Theme engine:** multi-brand/multi-mode previews on the canvas simultaneously.
- **Token pipeline:** import/export W3C design tokens JSON, CSS variables, Tailwind config, and Style Dictionary format.
- **Governance:** roles (Admin, Editor, Viewer), locked library components, approval workflow for system changes [P2].
- **Documentation generation:** generate component docs pages (anatomy, props, variants, usage, accessibility) from the library [P2].

**Done when:** Changing a primary-color variable updates every bound layer and instance on canvas, in preview, and in code export.

---

## 11. Advanced Layout, Responsive and Content Tools

### 11.1 Auto layout 2.0 [P0/P1]
- Horizontal, vertical, wrap, and **grid** auto layout.
- Fixed/Hug/Fill with min/max constraints, aspect ratio lock, per-child absolute positioning, negative gaps, reverse order, stroke-included sizing.
- Layout-aware drag: drop indicators, reorder inside containers, drag out to reparent.
- Show/hide children by variable or breakpoint.

### 11.2 Responsive design [P1]
- **Breakpoints** defined as variables (for example 375/768/1024/1440). A frame can show several breakpoints side by side live, bound to one source layout.
- **Container queries** for components (a card changes layout depending on its container width).
- **Fluid typography and spacing** with min/max and clamp curves.
- **Responsive preview slider:** drag to resize a frame and watch the layout adapt, with overflow warnings.
- **One-click variants:** generate Mobile/Tablet from Desktop with AI plus the layout solver, producing linked variants instead of detached copies.

### 11.3 Content and data [P1]
- **Realistic content generation:** names, addresses, product data, charts, avatars (placeholder policy respected), in selectable locales and tone.
- **Data-bound repeat grids:** connect a list/table/card grid to JSON/CSV sample data; rows/cards instantiate from data and update live.
- **Text expansion tester:** simulate +30–40% expansion, long German strings, CJK, and RTL; highlight overflow and truncation.
- **Localization:** string table per locale with variables for locale modes.

### 11.4 Productivity tools [P1]
- Tidy-up, smart distribute, even-spacing, match size, swap, replace with, select-similar, rename layers by AI (semantic names), organize layers into sections/groups, find-and-replace across text/colors/fonts.
- Multi-edit (edit many text layers/properties in one pass).
- Pixel-precise measuring with Alt-hover redlines.

---

## 12. Prototyping

### 12.1 Core [P0/P1]
- Frame-to-frame navigation, click/tap, hover, drag, keyboard triggers, overlays, transitions, starting frames, scrollable frames (horizontal/vertical, sticky headers), device frames, preview mode, shareable preview link (or exported standalone HTML).

### 12.2 Advanced logic [P1]
- **Variables and expressions:** set/toggle/increment variables; conditions (`if cart.count > 0`); computed values; text bound to variables.
- **State machines:** component states (default, hover, pressed, disabled, loading, error) with transitions and smart-animate.
- **Form behaviors:** input fields, validation states, checkboxes/toggles/dropdowns that really work in preview.
- **Micro-interaction timeline:** keyframes, easing curves, spring physics, stagger, looping.
- **Mock data and API simulation:** a prototype can fetch from local mock JSON with loading/empty/error states [P2].
- **Flow management:** named flows, flow map, dead-end detection, unreachable-frame warnings.
- **Real-device preview:** QR/URL for testing on phone, with touch gestures [P2].
- **User-testing helpers:** record click paths and timing for a session [P2].

### 12.3 AI prototyping [P1]
AI may create prototype links from explicit Markdown requirements and suggest missing states (empty, error, loading). All links stay editable in the prototype editor. The prototype runtime is separate from the editor canvas.

---

## 13. Developer Handoff and React/TypeScript Export

### 13.1 Export targets [P0/P1]
Selected component, selected frame, current page, entire document.
Formats: React + TypeScript (TSX), CSS Modules or plain CSS, Tailwind (optional), design tokens as CSS variables, reusable component files, assets (SVG/PNG/WebP, fonts), project scaffolding (Vite or Next.js template selectable), Storybook stories [P1], and JSON spec.

### 13.2 Deterministic compiler pipeline
1. Read the native document.
2. Resolve components, variants, variables and modes.
3. Normalize hierarchy (collapse redundant wrappers, detect lists/repeats).
4. Map layout: auto layout → Flexbox/Grid; constraints → responsive rules; absolute positioning only when necessary and flagged.
5. Choose semantic elements (`header`, `nav`, `main`, `button`, `a`, `ul`, `table`, `h1–h6`, `img` with `alt`) from layer metadata and heuristics, overridable by the designer via an "HTML tag/role" property.
6. Generate typed props from component properties and variants.
7. Generate CSS using tokens (`var(--color-primary)`), not raw values.
8. Package fonts and images.
9. Generate project files (`package.json`, `tsconfig`, entry, theme file).
10. **Validate:** TypeScript compile, ESLint, import resolution; run a build where the environment supports it; report errors.
11. Output a warnings report (unsupported effects, absolute positioning fallbacks, missing alt text, unmapped fonts).

The LLM is **not** the sole compiler. It may only assist with naming, semantic tag suggestions and comments, and its output is validated.

### 13.3 Advanced handoff [P1]
- **Live code preview:** inspect tab shows generated code that updates as the design changes; side-by-side rendered preview of the generated React.
- **Visual regression check:** render generated code in a headless browser and compare screenshots with the design frame; report pixel difference [P2].
- **Round-trip token sync:** import tokens from code repo and export changes back as a patch/PR file.
- **Code Connect-style mapping:** map a design component to an existing code component (path, props mapping) so exports reference real components rather than regenerating them.
- **Annotations and acceptance notes:** designers attach behavior notes, a11y notes, and ready-for-dev status to layers; included in the export as comments or docs.
- **Redlines and measurement overlays** and asset export presets.
- **Changelog for developers:** what changed since last handoff, with diff images and code diff.

**Done when:** The exported project installs and builds, renders the dashboard, uses CSS variables for tokens, uses Flexbox/Grid for auto layout, and the build/lint check is reported in the UI.

---

## 14. Collaboration, Review and Versioning

### 14.1 Collaboration [P1/P2]
- Local-first architecture with optional sync server; real-time cursors, presence, follow mode, multiplayer editing (CRDT).
- Comments, mentions, threads, resolved state, notifications; review mode with approve/request-changes per page or flow.
- Roles and permissions; shareable view-only links; password/expiry [P2].
- Presentation mode and a "spotlight" for design reviews.

### 14.2 Versioning [P1]
- Autosaved history plus **named checkpoints**.
- **Branching and merging** with visual diff of frames/layers/properties and conflict resolution.
- Restore any version as a copy or in place.
- **AI-written change summaries** ("Updated spacing tokens, added empty state to Orders table") for each checkpoint and merge.
- Compare any two versions.

**Daily use:** Explore risky ideas without breaking the main file; give stakeholders a clean review.

---

## 15. Accessibility and Quality Assurance (Built In) [P1]

- **Live accessibility panel:** contrast (WCAG AA/AAA and APCA), text size, tap targets (44px/48px), focus order editor, reading order, heading structure, alt text, landmark roles.
- **Vision simulations:** protanopia, deuteranopia, tritanopia, low vision blur, grayscale.
- **Dynamic type and zoom testing:** preview 200% text.
- **Reduced-motion variants** for prototypes.
- **Pre-handoff checklist:** unresolved comments, lint issues, missing states, missing alt text, overflow, detached instances, unnamed layers.
- Issues are clickable, filterable and exportable as a report.

**Done when:** A frame with insufficient contrast shows a flagged layer, a suggested compliant color from the same variable scale, and a one-click fix.

---

## 16. Extensibility and Automation [P1/P2]

- **Plugin API:** sandboxed, permission-based, typed; can read/write the document through the command bus; UI panel support; plugin manager with enable/disable.
- **Scripting console and macros:** record a sequence of commands as a reusable recipe; parameterize ("apply to selection").
- **CLI:** headless operations (export, lint, validate, compile to React) for CI pipelines.
- **MCP/server interface:** expose the design engine as tools so external agents (for example coding assistants) can read and edit designs under the same validation and permission rules.
- **Import/export:** SVG, PNG, JPG, PDF, `.fig`-style import where feasible [P2], Sketch file import where feasible [P2], JSON tokens, Markdown spec, Lottie/animation export [P2].
- **Integrations:** Git (token/code sync), issue trackers (link layers to tickets) [P2].

---

## 17. Save, Local Files and Project Management [P0]

- Create/rename design files; save locally; open native files; autosave; restore after crash (recovery snapshots); import/export assets; versioned schema with migrations; project browser with thumbnails; recent files.
- Desktop runtime: native file system via a secure bridge (scoped file access). Browser runtime: IndexedDB/OPFS persistence plus explicit export/import of the native file; use the File System Access API only where supported.
- Do not claim direct local filesystem access if the runtime does not support it.
- Clear sync/save indicators: Saved, Saving, Offline, Unsaved changes, Conflict, Error with retry.
- Multi-file projects and shared libraries [P1].

---

## 18. Keyboard Shortcuts and Input

- **Central shortcut registry** (single source for toolbar tooltips, menus, palette, and a searchable shortcuts dialog). User-remappable [P1], with presets (Figma-like, Sketch-like).
- Mac/Windows/Linux variants (`Cmd` vs `Ctrl`).
- Coverage: selection, frame (F), text (T), rectangle (R), ellipse (O), line (L), pen (P), pencil, hand (H/Space), comment (C), copy/paste/duplicate (Cmd+D), paste-in-place, paste-over-selection, group/ungroup, frame selection, align/distribute, zoom (+/−, Shift+1, Shift+2), undo/redo, add/remove auto layout (Shift+A), create component (Cmd+Alt+K), command palette (Cmd+K), prototype preview (Cmd+Alt+Enter or equivalent), switch Properties/AI, send AI prompt, cancel AI generation, toggle UI (Cmd+\), rename (Cmd+R), nudge/big nudge.
- Respect focus: shortcuts do not fire in text inputs, prompt composer, or in-canvas text editing, except explicitly designed ones (for example `Cmd+Enter` to send).
- Input support: mouse, trackpad gestures (pinch zoom, two-finger pan), stylus pressure for pencil [P2], touch fallback [P2].

---

## 19. Visual Design and Experience

- Neutral gray chrome with light and dark UI themes; compact toolbars; clear hover/selected/focus states; consistent typography and spacing; subtle dividers.
- Application's own brand and identity; do not copy Figma's logos, proprietary assets or exact product identity.
- AI panel looks like a native workspace panel (plan cards, diff views, scope chips), not a floating chatbot.
- Customizable workspace: dock, collapse, reorder panels; remember layout per user; focus mode (hide UI); multiple window/monitor support on desktop [P2].
- Onboarding: sample file, interactive tips, "what's new", and empty states that teach.
- Accessible editor UI: keyboard navigation, screen-reader labels, high-contrast option.

---

## 20. Performance Requirements

- Responsive canvas under load; viewport culling; layer-level dirty tracking; offscreen caching for complex layers; GPU-accelerated rendering.
- Debounced/incremental layout recalculation; web workers for parsing, layout solving, export and AI post-processing.
- Lazy loading and downsampled previews for large images; memory budgets.
- AI is asynchronous and cancellable; the editor stays interactive while AI runs.
- Selection and viewport preserved across AI operations.
- Benchmarks (document and publish results): 5,000- and 20,000-layer files, large images, 100 component instances updating from one change, Markdown spec of 5,000+ words.
- Telemetry for performance is opt-in and privacy-respecting.

---

## 21. Day-to-Day Designer Workflows (Use Cases the Product Must Support)

1. **Kickoff from a PRD:** import `.md` → review ambiguity flags → preview → apply → refine manually → coverage report.
2. **Design-system hygiene:** run the linter → bind hard-coded values to tokens → componentize repeated patterns → publish library update.
3. **Responsive adaptation:** select desktop frame → generate mobile/tablet linked variants → adjust container queries → test with long text.
4. **Design review:** switch to Review mode → AI critique + accessibility panel → leave comments → resolve → checkpoint with auto summary.
5. **Prototype for testing:** create flow → add state-driven interactions → preview on device → fix dead ends.
6. **Developer handoff:** mark ready for dev → add annotations → live code preview → export React/TS → run build check → share changelog.
7. **Theming/rebrand:** switch variable mode → compare brand A vs. B side by side → apply to selection or document.
8. **Content realism:** populate tables/cards from sample data and locales → run text-expansion stress test.
9. **Exploration:** branch the file → generate alternative directions → compare visually → merge the chosen one.
10. **Automation:** record a macro for repetitive cleanups and run it on a selection.

Add an end-to-end test or documented manual script for each.

---

## 22. Security, Privacy and Data Handling

- AI requests send only the scoped context necessary; show what will be sent (context inspector) [P1].
- Option for local-only mode or bring-your-own-model/API key; keys stored in the OS keychain or encrypted storage.
- No document content used for training by default; clear data policy in settings.
- Sandboxed plugins; permissions prompts; content security policy; sanitize imported SVG/HTML; validate imported files.
- Export never includes secrets or metadata the designer did not choose to include.

---

## 23. Testing and Acceptance Criteria

### Editor [P0]
Create, select, move, resize, rotate, delete; edit text and vectors; manage layers/pages; save and reopen; undo/redo; shortcuts respect focus.

### Right panel [P0]
Properties reflect selection; edits update canvas and document; mixed values display; Properties↔AI switching preserves selection, history, drafts and running operations.

### AI [P0/P1]
Prompts and Markdown accepted; plan, preview, apply, partial apply; modifies only scoped selection; reuses components/tokens; one-step undo; honest errors; no-model state; cancellation; operation schema validation rejects bad IDs/types; read-only modes do not mutate.

### Spec workflow [P1]
Ambiguity flags appear; coverage report accurate; spec drift detected.

### Design system [P1]
Variable change propagates; modes switch; linter detects seeded violations; library update flow works.

### Layout/responsive [P1]
Auto layout matches expected geometry on fixtures; breakpoints and container queries behave; text-expansion tester flags overflow.

### Prototype [P1]
Variables, conditions and state transitions work in preview; dead-end detection works.

### React compiler [P0/P1]
Valid TSX; project builds; tokens as CSS variables; Flexbox/Grid used where applicable; assets packaged; warnings reported; snapshot tests on fixture documents; visual comparison where supported.

### Accessibility [P1]
Contrast, tap target and alt-text checks produce correct results on fixtures.

### Performance [P0/P1]
Benchmarks meet stated targets, with results reported.

### Reliability [P0]
No existing feature silently removed (regression suite); no silent data loss; autosave/recovery verified by killing the app mid-edit; migrations tested on older files; clear errors and recovery paths.

Write unit tests (document model, commands, schema, parser, compiler), integration tests (panels, AI pipeline with a mocked model), and end-to-end tests (core workflows). Report what was run and the results.

---

## 24. Required Implementation Process and Phases

**Step 1 – Audit.** Inspect repo, architecture, dependencies, UI, features. Create a regression test baseline.
**Step 2 – Gap analysis.** Compare to this spec; label gaps P0/P1/P2; note architectural blockers.
**Step 3 – Architecture.** Define document model, command bus, properties schema, AI operation schema, layout solver interface, compiler interface, persistence layer.
**Step 4 – Phase 1 (P0 core):** toolbar, layers/assets/pages, canvas interactions, properties panel, undo/redo, save/open/autosave, export basics, shortcut registry.
**Step 5 – Phase 2 (P0 right sidebar + AI foundation):** Properties/AI switcher with preserved state, AI panel, provider setup, context chips, prompt composer, Markdown parser, plan/preview/apply/undo pipeline with schema validation.
**Step 6 – Phase 3 (design system + layout):** components, variants, variables/modes, styles, auto layout 2.0, constraints.
**Step 7 – Phase 4 (React compiler):** deterministic compiler, validation, project scaffolding, inspect tab.
**Step 8 – Phase 5 (P1 differentiators):** command palette, critique/systemize/responsive agent modes, design-system linter, breakpoints/container queries, spec coverage and drift, accessibility panel, prototype logic, versioning/branching, live code preview.
**Step 9 – Phase 6 (P2 ecosystem):** collaboration, plugin API, CLI/MCP, token pipeline, documentation generation, device preview.
**Step 10 – Validation.** Run all tests, benchmarks and the workflows in Section 21; fix defects.
**Step 11 – Delivery report:**
- Features implemented (with P-level) and verified.
- Files/modules changed.
- Architecture changes and migration notes.
- AI configuration required.
- Export capabilities.
- Tests executed and results; benchmark results.
- Known limitations and unsupported features.
- Recommended next phase.

Do not report any feature as complete unless it is implemented and verified. Mark everything else as partial, planned or not started.

---

## Final Instruction

Upgrade the existing application into a cohesive, AI-native professional design editor that is more capable than Figma and Sketch in AI-assisted workflows, design-system governance, responsive and logic-aware design, accessibility, and design-to-code handoff.

Prioritize: a reliable canvas, a contextual Properties panel, a native AI panel that accepts prompts and Markdown specs, editable AI-generated designs with preview/diff/undo, and deterministic React/TypeScript export. Then build the P1 differentiators.

Preserve existing functionality, follow codebase conventions, avoid unnecessary rewrites, and deliver working software rather than a visual prototype.

---

# APPENDIX A: Expanded Specification for Left Panel, Right Panel and Design Tools (Figma-Parity and Beyond)

This appendix **extends and, where more specific, overrides** Sections 3, 4 and 11. Everything here follows the same priority tags: **[P0]** core, **[P1]** advanced, **[P2]** ecosystem. Every control must read from and write to the canonical document through the command bus, support undo/redo, and respect focus rules.

---

## A1. Left Panel: Full Functionality

### A1.1 Panel structure [P0]
- Tabs: **Layers**, **Assets**, **Pages** (collapsible section above the layer tree), plus **Variables & Styles** [P1] and **Find/Outline** [P1].
- Collapsible, resizable (min/max width), with a one-key toggle for the left panel only and a toggle for all UI (focus mode).
- Remembers scroll position, expanded nodes and search per page.

### A1.2 Layers panel in detail
| Feature | Behavior | Daily use |
|---|---|---|
| Tree display | Indented hierarchy with type icons (frame, section, group, auto layout, component, instance, mask, text, vector, image, slice, boolean group) | Instantly read structure |
| Selection sync | Clicking a layer selects it on canvas; selecting on canvas highlights and scrolls to the layer; hover on either side highlights the other | Never lose track of objects |
| Expand/collapse | Click chevron; Alt-click expands all children recursively; "Collapse all" action; auto-expand to selection | Navigate deep trees |
| Multi-select | Shift = range, Cmd/Ctrl = toggle; drag to marquee in the panel [P1] | Bulk operations |
| Drag and drop | Reorder, reparent into frames/groups, drop-line indicators, auto-expand on hover, Esc to cancel, constraints respected (cannot drop a parent into its own child) | Fast restructuring |
| Rename | Double-click or Cmd/Ctrl+R; batch rename with patterns (`Card/{n}`, find/replace, prefix/suffix, numbering) [P1] | Clean naming for handoff |
| Visibility and lock | Eye and lock toggles on hover and a column mode; Alt-click to isolate visibility ("solo"); Shift-click to apply to range | Focus on one area |
| Context menu | Group, ungroup, frame selection, create component, auto layout, copy/paste properties, bring to front/back, flip, mask, boolean ops, flatten, copy as CSS/SVG/PNG, copy link, "Select children", "Select layer" | Quick actions |
| Search and filter | Search by name; filters: type, hidden, locked, has-export, uses variable/style, is override, has-prototype-link, has-comment, has-lint-issue, AI-generated, text content match [P1] | Find anything in huge files |
| Badges and indicators | Component/instance markers, overridden dots, mask markers, issue warnings, interactions, "ready for dev" tags | Status at a glance |
| Layer thumbnails | Optional small preview per layer [P2] | Visual scanning |
| Sections and Flow | Sections group frames and show status (Draft/Ready); flow starts appear as chips [P1] | Organize pages |
| Bulk actions bar | When many selected: group, rename, lock, hide, tidy | Cleanup |
| Virtualized list | Windowed rendering of rows for files with tens of thousands of layers | Performance |

**Done when:** All of the above operate on a 5,000-layer test file without dropped frames; drag-reparent updates the document and the canvas simultaneously and is undoable as one step.

### A1.3 Pages [P0]
- Create, rename (inline), duplicate (deep copy with component and variable references intact), reorder (drag), delete (confirmation with count of affected prototype links), and a page-level search.
- Page separators and a "cover" thumbnail [P1], page status [P1], page-level background color, and a per-page viewport memory (zoom and position restored on return).
- Cross-page copy/paste of layers and components, and "Move to page…".

### A1.4 Assets panel in detail [P0/P1]
- **Sub-sections:** Components, Libraries, Icons, Images, Styles (text, color, effect, grid), Variables, Fonts, Recent, Favorites.
- **Views:** list, grid, compact; thumbnails; group by folder path (`Button/Primary/Large`) with collapsible folders.
- **Search:** by name, description, tags, variant property values and AI semantic search ("a card with an avatar and two buttons") [P1].
- **Insert:** click to place at viewport center or into selected frame; drag onto canvas, into a layer, or onto another instance to swap [P1].
- **Preview:** hover preview with variant switcher; component description and usage notes; "used in N places" and open-in-layers jump [P1].
- **Libraries:** add/remove libraries per file; update notifications with diff preview; "review changes" and accept/skip per component; library version pinning [P1].
- **Actions:** rename, move to folder, delete (blocked if used, or detach prompt), "Go to main component", "Find all instances", "Create variant", "Publish changes".
- **Unused-asset cleanup** and duplicate-asset finder [P1].
- **Icons and images:** import SVG/PNG/JPG/WebP by drag from OS; auto-name; optimize; tagging; image asset replacement keeps all references [P1].
- **Fonts:** list used fonts, missing-font warnings, replace-font across document, upload custom fonts, variable font axes preview [P1].

### A1.5 Variables & Styles manager [P1]
- Table editor: collections, modes as columns, variables as rows; color/number/string/boolean types; aliases; scopes; descriptions; bulk edit; import/export JSON and CSV; "find usages".
- Styles editor: text, color, effect, grid styles with folder hierarchy, detach/apply, "style usage" counter, and "replace style with variable" tool.

### A1.6 Find and Replace / Outline [P1]
- Find across text, layer names, colors, fonts, variables and styles, with scope (selection/page/document) and a results list that selects layers. Replace with preview and undo.
- **Outline/Structure view** for accessibility reading order and heading hierarchy.

---

## A2. Right Panel: Full Functionality

### A2.1 Panel structure [P0]
Top-level tabs: **Design** (Properties), **AI**, **Prototype**, **Inspect/Code**, **Export**, **Comments** [the last four P1]. Persistent state across tab switches. Collapsible sections inside each tab with remembered open/closed state. When nothing is selected, the Design tab shows **page properties** (background, grids), **local variables summary**, and **document-level styles**.

### A2.2 Design tab sections (all context-aware)
Each section shows only if relevant to the selected type; any numeric field supports scrubbing (drag on label), arrow nudging (Shift = ×10), expressions, units, and "mixed" state.

1. **Alignment bar [P0]:** align left/center/right/top/middle/bottom; distribute horizontal/vertical; alignment relative to selection bounds or parent frame; "tidy up" [P1].
2. **Position and size [P0]:** X, Y, W, H, rotation, flip H/V, lock aspect ratio, constrain proportions, resize-to-fit, absolute-position toggle inside auto layout, reset transform. Optional absolute vs relative-to-parent coordinates.
3. **Auto layout [P0]:** direction (horizontal/vertical/wrap/grid), gap and wrap-gap, padding (uniform, H/V, per side), alignment 3×3 pad, space-between, child sizing Hug/Fill/Fixed with min/max, clip content, stroke-included, canvas stacking order (first/last on top), text baseline alignment [P1]. Quick "Suggest auto layout" action [P1].
4. **Constraints and responsive [P0]:** left/right/top/bottom/center/scale/left-right, visual constraint widget, plus breakpoint rules and container-query rules [P1].
5. **Layout grid [P0]:** column, row and grid, count, gutter, margin, width/height, alignment, color/opacity, saved as grid styles; multiple grids per frame.
6. **Appearance [P0]:** opacity, blend mode (all 16 standard modes), corner radius (uniform and per corner), corner smoothing, clip content, visibility, mask toggle, "use as mask" [P1].
7. **Typography [P0/P1]:** font family (searchable, with recently used and missing-font indicator), weight/style, size, line height (auto/px/%), letter spacing (px/%), paragraph spacing and indent, text align H/V, case (upper/lower/title), decoration (underline/strike), list style (bullets/numbers), vertical trim [P1], truncate and max-lines, resize mode (auto width/auto height/fixed), OpenType features, variable font axes, language, text direction. Text styles apply/detach/edit. Partial-text formatting when editing inside text.
8. **Fill [P0]:** solid, linear/radial/angular/diamond gradient with an on-canvas editor handle set and stops list, image fill (fill/fit/crop/tile, rotate, filters), video fill [P2], pattern [P2], multiple fills with reorder, per-fill opacity and blend mode, "Add variable/style" binding.
9. **Stroke [P0]:** color(s), weight (uniform or per side), position (inside/center/outside), dash/gap patterns, cap and join, miter limit, arrowheads (start/end) for lines and open paths, **variable-width stroke profiles** [P1], gradient strokes, per-side stroke for frames.
10. **Effects [P0/P1]:** multiple drop shadows, inner shadows, layer blur, background blur, progressive blur [P2], noise/texture [P2], glass effect [P2], each with X/Y/blur/spread/color/blend, effect styles, reorder and toggle visibility per effect.
11. **Selection colors [P1]:** lists every color in the selection (including children) with counts; click to change globally; bind to variable/style; "replace hard-coded colors" with nearest token suggestion.
12. **Components section [P0/P1]:** variant pickers, boolean toggles, text overrides, instance-swap pickers with preview, slot content, nested instance overrides tree, reset overrides, detach, push overrides to main, go to main, restore default, "Used in".
13. **Image section [P0/P1]:** replace, crop mode, filters (exposure, contrast, saturation, temperature, tint, highlights, shadows) [P1], alt text field, "Edit image" tools: remove background (AI) [P2], upscale [P2].
14. **Vector editing section [P0/P1]:** enter edit mode, node list with coordinates, corner radius per node, node type (straight, mirrored, asymmetric, disconnected), boolean ops, flatten, outline stroke, simplify path, join/split.
15. **Export [P0]:** multiple export rows per layer, scale (0.5x–4x or custom size, width/height constraint), format (PNG, JPG, WebP, SVG, PDF), suffix, include "background", "ignore overlapping layers", SVG options (outline text, include ID attributes), live preview and file size estimate, "Export N layers", saved presets [P1].
16. **Metadata and handoff [P1]:** layer description, tags, "ready for dev" status, accessibility role and alt text, HTML tag mapping, annotations list, links to tickets.
17. **Variables binding [P1]:** every property field shows a variable chip; picker supports search, scopes, alias preview, and creating a variable from the current value ("Create variable from this").
18. **Multi-selection logic:** shared sections only, mixed indicators ("Mixed"), partial updates that never overwrite untouched properties, and relative adjustments.

### A2.3 Color picker (shared component) [P0/P1]
Eyedropper (also picks from canvas and screen where the runtime permits), HEX/RGB/HSL/HSB/OKLCH input modes, alpha slider, color libraries (document colors, styles, variables, recent), contrast-ratio readout against background, saved palettes, copy/paste value, gradient stop editor with positions, and "closest token" suggestions.

### A2.4 Prototype tab details [P1]
- Interaction list on the selected layer, with add/remove/duplicate, triggers (click, hover, press, drag, key/gamepad, after delay, mouse enter/leave, variable change), actions (navigate to, open overlay, swap overlay, close overlay, back, scroll to, open link, set variable, conditional, set variable mode, toggle state), animation (instant, dissolve, smart animate, move in/out, push, slide in/out, with easing presets, custom bezier, spring, duration).
- Overlay settings: position, background, close on outside click.
- Scroll behavior: overflow direction, sticky/fixed positioning, clip.
- Flow starting points, device/preset, background, and the preview viewport.
- Node-graph view of flows with orphan/dead-end highlighting.

### A2.5 Inspect/Code tab details [P1]
Generated CSS, React/TSX, Tailwind, iOS (SwiftUI) and Android (Compose) snippets [P2] with language toggle; token-aware output; measurement overlay; copy per property or whole block; "open in compiler preview"; developer status and annotations; compare with previous version.

### A2.6 Comments tab details [P1]
Pins and threaded replies, @mentions, attachments, resolve/reopen, filters (mine/unresolved/page), jump to pin, notifications, "convert comment to task" [P2].

### A2.7 AI tab additions [P1]
- **Context inspector:** shows exactly what will be sent to the model (selection tree summary, token tables, spec excerpt) with the ability to exclude items.
- **Quick actions row** for the selection: "Improve spacing", "Make responsive", "Rename layers", "Add states", "Fix contrast", "Componentize", "Write realistic content".
- **Saved prompts and recipes**, shareable within the library or team.
- **Visual references:** attach screenshots or reference frames from the canvas ("use this frame as the style reference").
- **Cost/usage meter** (if a metered provider is used) and model picker.

---

## A3. Design Tools: Full Functionality

### A3.1 Tool dock and toolbar behavior [P0]
- A compact dock (top or bottom, user-selectable) with tool groups; groups with a small caret open flyouts (Shapes: rectangle, line, arrow, ellipse, polygon, star, image/video placeholder; Pen group: pen, pencil, vector edit; Frame group: frame, section, slice).
- Active tool highlight, tooltips with shortcut and one-line help, tool options bar (contextual, showing tool-specific settings such as polygon sides), `Esc` returns to Move, tool lock with double-click, and spring-loaded temporary tools (hold Space for Hand, hold Cmd/Ctrl for Move from any tool).
- The cursor changes per tool and per handle; a live size/position readout appears while drawing.

### A3.2 Tool-by-tool specification
| Tool | Key | Required functionality | Daily use |
|---|---|---|---|
| **Move** | V | Select, drag, deep select (Cmd/Ctrl-click), marquee, Shift add, Alt-drag duplicate, Alt-hover measurements, arrow nudging, Shift+arrow big nudge, smart-guide snapping, spacing snapping | Everyday editing |
| **Scale** | K | Proportional scale of objects including strokes, text, effects, and children | Quick resizing of icons or illustrations |
| **Frame** | F | Draw frames, pick device presets from the right panel, nested frames, auto-wrap selection (Cmd/Ctrl+Alt+G), resize behavior toggles | Screens and containers |
| **Section** | Shift+S | Organize frames on canvas with a name, color, and status | Page structure |
| **Slice** | S | Define export regions without visible layers | Asset export |
| **Rectangle / Ellipse / Line / Arrow** | R / O / L / Shift+L | Click-drag, Shift for proportion, Alt from center, numeric entry via click then dialog, per-corner radius handles on canvas, ellipse arc/sweep/inner-radius handles | Core shapes |
| **Polygon / Star** | | Sides/points count and inner radius via on-canvas handles and panel | Decorative shapes, badges |
| **Image/Video placeholder** | Shift+Cmd/Ctrl+K | Place image from file or drop; multi-image placement grid; fit/fill modes | Content placement |
| **Pen** | P | Click for corners, drag for curves, close paths, continue paths, add/remove/convert nodes, Alt to break handles, Shift to constrain angle, **vector networks** (nodes with more than two connections) [P1] | Custom icons, shapes |
| **Pencil** | Shift+P | Freehand with smoothing, stylus pressure to variable width [P2], auto-convert to vector paths | Quick sketching |
| **Text** | T | Click for auto-width, drag for fixed box, in-canvas rich editing, formatting shortcuts (bold, italic, underline, alignment), paste-as-plain, spell check, find in text, emoji, special characters, text on path [P2] | Copy and typography |
| **Hand** | H / Space | Pan, momentum scrolling, touchpad support | Navigation |
| **Zoom** | Z | Marquee zoom, Shift+1 fit, Shift+2 selection, Cmd/Ctrl+0 100%, zoom to cursor | Navigation |
| **Comment** | C | Drop pins, thread, mention, filter by status | Feedback |
| **Eyedropper** | I | Sample canvas colors, apply to fill/stroke, sample from images | Color matching |
| **Measure** | Alt-hover [P1] | Distances to neighbors and parents; persistent measurement guides | Handoff accuracy |
| **Rotate** | Corner hover | Rotate around center or custom pivot; Shift to 15° snaps; rotation origin handle | Precise orientation |
| **Prototype link** | Panel/Key | Draw connector between frames and layers directly on canvas, edit via panel | Flows |
| **Annotate** | [P1] | Place annotations with category (Behavior, A11y, Content, Spec) and measurement callouts | Handoff |

### A3.3 Vector and shape operations [P0/P1]
- Boolean operations: union, subtract, intersect, exclude, as live (non-destructive) boolean groups that remain editable; flatten.
- Outline stroke; offset path; simplify path [P1]; join paths; split/knife [P2]; reverse path.
- Mask: use as mask (layer above clips layers below), mask by luminance [P2], mask group.
- Corner smoothing, per-corner radius on any rectangle or vector, and path-aware corner rounding.
- Bend/transform tools: free transform, skew, perspective [P2].
- Auto-trace image to vector [P2].

### A3.4 Selection and arrangement tools [P0/P1]
- Select all, select inverse, select same (fill, stroke, text style, component), select children, select parent (Shift+Enter / Enter), cycle through overlapping layers (Tab, Shift+Tab, Alt-click).
- Group (Cmd/Ctrl+G), ungroup, frame selection, wrap in auto layout (Shift+A), remove auto layout, bring forward/backward/front/back with shortcuts.
- Align/distribute with canvas-level keyboard shortcuts, "tidy up", "distribute spacing" with numeric gap, "match width/height", "swap positions".
- Copy/paste: paste in place, paste over selection (replace), paste to replace [P1], copy/paste properties (Cmd/Ctrl+Alt+C/V), copy as CSS/SVG/PNG/code, duplicate with repeat offset (Cmd/Ctrl+D repeats last transform), **Repeat grid / array tool** (N×M rows/columns with spacing) [P1].
- Lock and hide shortcuts; rename; flip H/V (Shift+H/V).

### A3.5 Canvas helpers [P0/P1]
- **Rulers and guides:** drag from rulers, snap to guides, per-frame guides, lock/clear guides.
- **Pixel grid and snap-to-pixel**; pixel preview mode (rasterized 1x/2x preview).
- **Outline mode** (wireframe view) and **isolation mode** (focus on a group/component, dim the rest) [P1].
- **View toggles:** layout grids, rulers, layer names, multiplayer cursors, comments, UI visibility, canvas background color, high-contrast view.
- **Minimap and navigator** [P1]; bookmarks/saved viewpoints [P1]; "go to layer" via palette.
- **Smart selection:** drag-to-select within auto layout to reorder; Alt to ignore snapping; hold Cmd/Ctrl for no-snap.
- **Alignment on-canvas toolbar:** floating contextual toolbar near the selection offering common actions (auto layout, component, mask, boolean, align) [P1].
- **Context-aware handles:** padding/gap handles visible on auto layout frames, radius handles on corners, node handles on vectors, gradient handles on fills.

### A3.6 Text and typography tools [P0/P1]
- Rich text editing with mixed styles in a single text layer; lists; links with hover preview (for prototype/React export).
- Font fallback stacks and missing-font replacement dialog.
- Text styles with variable-based tokens; "create style from selection".
- Truncation preview and overflow warnings; min/max width on text for responsive layouts.
- Typographic grid snapping and baseline grid overlay [P1].

### A3.7 Component tools [P0/P1]
- Create component (Cmd/Ctrl+Alt+K), create component set, add variant, edit variant properties in a table-like editor, set default variant, quick "Create from selection" with automatic property detection (text, boolean visibility, instance swap) [P1].
- Instance behaviors: detach, swap, reset, override tracking, nested instances, slots.
- Main component isolation view with a "preview all variants" grid and states matrix [P1].

### A3.8 Precision and productivity [P0/P1]
- Numeric input everywhere accepts expressions (`+8`, `*2`, `/3`, `50%`) and units.
- On-canvas dimension labels while resizing; spacing labels during auto-layout edits.
- Multi-edit: edit properties across many selected layers in a single operation (including mixed text).
- **Quick actions search** (`/` or Cmd/Ctrl+/) to run any tool/command by name.
- Customizable tool shortcuts and remembered tool settings.
- Version-safe operations: every tool action commits a single undoable transaction; long drags commit on release.

---

## A4. Acceptance Criteria for This Appendix

- **Left panel:** drag-reorder and reparent persist in the document; layer search filters apply to 5,000 layers within 100 ms (measure and report); asset insert, swap and library update flows work end to end.
- **Right panel:** each section above appears for the right selection types and writes to the document; mixed values are handled for at least position, size, fill, stroke, opacity, radius, and typography; variable binding works for color, number and string properties.
- **Tools:** each tool in A3.2 has an automated or scripted test that creates/edits an object and verifies the document state; spring-loaded tools return to the previous tool; shortcuts do not fire during text entry.
- **Parity audit deliverable:** produce a matrix of every item in this appendix with status (Implemented and verified / Partial / Not started) and file references. Do not mark any row as implemented without a passing test or a recorded manual verification.
- **No dead controls:** any control that is not implemented in the current phase must be hidden or visibly disabled with a tooltip stating it is planned, never silently inert.
