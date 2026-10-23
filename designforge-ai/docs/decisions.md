# DesignForge AI — Architectural Decisions & Assumptions (`docs/decisions.md`)

This document records the foundational architectural decisions, conventions, and assumptions made to achieve Figma Design parity, ForgeFlow advanced prototyping, and local `.dforge` / PDF / Image export while strictly preserving the Frozen Zone.

---

## ADR-001: Separation of Frozen Zone and Evolved Editor Core

- **Context**: The existing Model Context Protocol (MCP) servers, AI agent orchestration, and provider abstractions in `src/mcp/` and `src/ai/` must remain bit-for-bit identical with locked SHA-256 hashes.
- **Decision**: All evolved Figma-grade modules reside under `src/editor-core/`, `src/engine/`, `src/compiler/`, and `src/styles/`. Communication with the frozen zone occurs strictly through non-invasive adapters that maintain the original schema signatures (`addNode`, `updateNode`, `removeNode`, `getActivePage`, etc.).
- **Consequence**: The CI test `tests/test_frozen_zone_guard.js` verifies the SHA-256 hashes of all 27 frozen files on every run. Zero edits to frozen files are permitted.

---

## ADR-002: Hierarchy Rules for Sections and Frames

- **Context**: Users expect Figma-identical section and frame containment where sections organize the canvas and frames act as artboards or nested containers.
- **Decision**:
  1. **Section**: Can contain Frames, Groups, Components, Shapes, Text, and content. A Section can **never** contain another Section. Sections can only be direct children of a Page.
  2. **Top-Level Frame**: A frame whose parent is either a Page (independent) or a Section (section child).
  3. **Nested Frame**: A frame whose parent is another Frame.
  4. **Parent Resolution on Create & Drop**: Decided by the pointer coordinate at the moment of creation/drop, resolving down to the deepest eligible container under the pointer. Holding `Cmd`/`Ctrl` suppresses reparenting.
  5. **Movement & Resizing**: Moving a Section moves all child nodes. Resizing a Section does not clip or resize children. Deleting a Section deletes its contents; Ungroup (`Cmd+Shift+G`) moves children up to the Page while preserving world coordinates and z-order.

---

## ADR-003: Layers Panel Drag-and-Drop & Z-Order Semantics

- **Context**: Figma's visual convention places front-most objects at the top of the layers tree list.
- **Decision**:
  1. The Layers panel renders siblings in reverse z-order: index 0 in the list corresponds to the topmost visual node (`lastChild`), and the bottom of the list corresponds to the back-most node (`firstChild`).
  2. Drop zones on each layer row:
     - Top quarter: insert before (sibling above in z-index).
     - Bottom quarter: insert after (sibling below in z-index).
     - Middle half (on containers): drop inside as front-most child.
  3. Dragging a section always resolves to Page level. Illegal drops (e.g. section into frame, node into own descendant) show a forbidden cursor and reject the drop.
  4. Alt/Option-drag duplicates rather than moves. Double-click initiates inline renaming `<input>` (`Enter` commits, `Esc` reverts).

---

## ADR-004: Contextual Right Properties Panel (Figma Carbon Copy)

- **Context**: The Inspector panel must match Figma's contextual section order, field names, label scrubbing, and math expression evaluation.
- **Decision**:
  - **Empty Canvas**: Page Background, Local Variables summary, Local Styles summary, Export.
  - **Frame / Component / Instance**: Header, Alignment, Position (X, Y, Rotation, Constraints), Layout (W, H, Auto Layout, Clip Content, Absolute position toggle), Appearance (Opacity, Corner radius uniform/quad with smoothing, Blend mode), Fill (paints list, color picker popover, token binding), Stroke, Effects, Layout Grid, Export.
  - **Section**: Header (name, Ready for dev), Alignment, Position, Layout (W, H), Appearance, Fill, Export. (No Auto Layout, Constraints, Clip, Stroke, or Effects).
  - **Group**: Alignment, Position, Layout, Appearance, Effects, Export. (No Fill, Stroke, Auto Layout, Constraints).
  - **Text**: Header, Alignment, Position, Layout, Typography (System Fonts, Modern Sans, Monospace, Serif; Weight 300-900; Size; Line Height; Tracking; Alignment; Text color), Appearance, Fill, Stroke, Effects, Export.
  - Numeric fields support scrubbing by dragging the label, `+`/`-`/`*`/`/` math expressions, and variable token binding chips.

---

## ADR-005: Local File Format (`.dforge`) & Offline Export Pipelines

- **Context**: Files must be stored locally without cloud dependencies, and export PDF and images directly to the user's disk.
- **Decision**:
  1. `.dforge` is a standard ZIP container (`application/x-dforge+zip`) containing `manifest.json`, `document.json`, `prototype/prototype.json`, `assets/`, and `thumbnails/`. Saves are atomic (write to temp, verify SHA-256, atomic rename).
  2. **Image Export**: Scoped strictly to the selected Section or Frame(s). Section export clips to section bounds; Frame export respects frame clipping. Formats: PNG, JPG, WEBP, SVG at 0.5x, 1x, 2x, 3x, 4x.
  3. **PDF Export**:
     - Current Artboard: Single-page vector PDF of the selected top-level frame.
     - Current Page: Multi-page vector PDF with one page per top-level frame in canvas reading order. Text remains selectable vector text with font subsetting.
  4. File System Access API (`showSaveFilePicker`, `showOpenFilePicker`) is used with automatic fallback to browser downloads for universal offline support.

---

## ADR-006: ForgeFlow Advanced Prototyping Architecture

- **Context**: Prototyping requires deterministic statecharts, typed variables, pure sandboxed expressions, realistic inputs, and physics-based motion.
- **Decision**:
  1. ForgeFlow compiles high-level interactions and HFSM definitions into a deterministic Intermediate Representation (IR).
  2. Execution runs on a deterministic scheduler with run-to-completion event semantics and a 1,000-microstep livelock prevention guard.
  3. The expression engine is LL(2) pure and sandboxed (no `eval`, strictly typed conditions, no truthiness coercion).
  4. Smart Animate utilizes bipartite graph matching, matrix decomposition, and analytical spring physics ($m \cdot x'' + c \cdot x' + k \cdot x = 0$).
