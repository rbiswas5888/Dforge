# DesignForge AI — Current Architecture Baseline (`docs/architecture-current.md`)

**Date:** October 2026  
**Status:** Baseline Established & Audited  
**Repository:** `designforge-ai/`

---

## 1. System Overview & Technology Stack

DesignForge AI is an in-browser, AI-native vector and UI design tool with an integrated deterministic React compiler and Model Context Protocol (MCP) tool ecosystem.

### Runtime & Packaging
- **Runtime Environment:** Modern evergreen web browsers (Chromium, WebKit, Gecko) with ES2024 module support and Node.js v20+ for local development and test automation.
- **Local Server:** [`serve.js`](file:///Users/rbiswas/Documents/Design%20Project/designforge-ai/serve.js) — Lightweight zero-dependency HTTP server with strict MIME-type resolution for ES modules, CSS, JSON, and Web fonts.
- **Dependency Philosophy:** Zero external runtime UI framework dependencies. The core editor runs on standard Web APIs (DOM, Canvas2D, Web Storage, Web Workers, CSS Custom Properties).
- **Module Architecture:** 100% native ECMAScript Modules (`"type": "module"` in `package.json`), allowing direct execution without a mandatory transpilation/bundling step.

---

## 2. Subsystem Architecture Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Application Chrome                              │
│         Top Bar · Left Panel (Pages/Layers) · Right Panel (Design/Proto/Code)│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│     Canvas & Render Loop      │             │        Command Engine         │
│  src/engine/renderer.js       │◄────────────┤  src/engine/commands.js       │
│  - 2D Canvas Context          │   Notifies  │  - Transactions & Invariants  │
│  - Pan / Zoom Matrix          │   Redraw    │  - Atomic Undo/Redo Stacks    │
│  - Prototype Connection Wires │             │  - Geometry & Hierarchy Ops   │
└───────────────────────────────┘             └───────────────┬───────────────┘
                ▲                                             │
                │ Reads Geometry                              │ Mutates
                │                                             ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│         Layout Engine         │             │    Canonical Document Model   │
│  src/engine/layout.js         │             │  src/engine/document.js       │
│  - Recursive Auto Layout      │             │  - Pages & Flat Node Map      │
│  - Hug / Fill / Fixed Sizing  │             │  - Components & Variants      │
│  - Coordinate Transforms      │             │  - Variables & Design Tokens  │
└───────────────────────────────┘             └───────────────┬───────────────┘
                                                              │
                ┌─────────────────────────────────────────────┼─────────────────────────────────────────────┐
                ▼                                             ▼                                             ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐             ┌───────────────────────────────┐
│      Prototype Engine         │             │    React Project Compiler     │             │     Local Storage Engine      │
│  src/engine/prototype.js      │             │  src/compiler/jsx.js          │             │  src/engine/storage.js        │
│  - Interactive State Machine  │             │  - TSX Component Emission     │             │  - .dforge Project Packaging  │
│  - Overlays & Smart Animate   │             │  - CSS Custom Properties      │             │  - LocalStorage Autosave      │
│  - Standalone Player HTML     │             │  - Runtime Interaction Hooks  │             │  - Lossless Serialization     │
└───────────────────────────────┘             └───────────────────────────────┘             └───────────────────────────────┘
                                                              │
                                      ════════════════════════╪════════════════════════
                                      FROZEN ZONE BOUNDARY    │ (Read/Write via Adapter)
                                      ════════════════════════╪════════════════════════
                                                              ▼
                                              ┌───────────────────────────────┐
                                              │      MCP Ecosystem & AI       │
                                              │  src/mcp/ & src/ai/           │
                                              │  - 10 Design Tools & Hub      │
                                              │  - Local / Gemini / OpenAI    │
                                              │  - Strict Pre-flight Checks   │
                                              └───────────────────────────────┘
```

---

## 3. Detailed Component Breakdown

### 3.1 Rendering Engine (`src/engine/renderer.js`)
- **Technology:** HTML5 `CanvasRenderingContext2D`.
- **Coordinate Transformation:** Maintains a 2D affine transformation matrix for canvas pan and zoom:
  $$\begin{pmatrix} x_{\text{screen}} \\ y_{\text{screen}} \end{pmatrix} = \begin{pmatrix} \text{zoom} & 0 \\ 0 & \text{zoom} \end{pmatrix} \begin{pmatrix} x_{\text{canvas}} \\ y_{\text{canvas}} \end{pmatrix} + \begin{pmatrix} \text{panX} \\ \text{panY} \end{pmatrix}$$
- **Render Pipeline:**
  1. Background workspace clearing and layout grid rendering.
  2. Root frames, sections, and nested child rendering in z-order.
  3. Interactive handles (bounding boxes, 8 resize handles, rotation anchors).
  4. Prototype overlay: Connection anchor circles (`+`), real-time dashed connector wire during interactive drag, and flow starting point badges (`▶ Flow 1`).
  5. Measurement guides, smart snapping lines, and distance tooltips.

### 3.2 Canonical Document Model (`src/engine/document.js`)
- **Structure:** Hierarchical document represented as a normalized flat dictionary per page:
  - `doc.pages`: Array of `Page` objects.
  - `page.nodes`: Dictionary indexed by string GUIDs (`Map<NodeId, Node>`).
  - `page.rootIds`: Ordered array of top-level frame and section IDs defining canvas z-order.
  - `node.childIds`: Ordered array of direct children IDs.
  - `node.parentId`: Pointer to the immediate parent container.
- **Node Classification:**
  - Containers: `frame`, `section`, `group`, `component`, `component_set`, `instance`.
  - Leaf Primitives: `rectangle`, `ellipse`, `line`, `arrow`, `polygon`, `star`, `text`, `vector`.
- **Tokens & Variables:**
  - `doc.tokens`: Primitive and semantic design tokens (spacing, color, radii, elevation).
  - `doc.variables`: Strongly-typed variables (Color, Number, String, Boolean) with light/dark theme modes.
  - `node.variableBindings`: Property-path mapping (`"style.fills[0].color" -> varId`).

### 3.3 Command Engine & Undo/Redo (`src/engine/commands.js`)
- **Pattern:** Command pattern with transactional mutation records.
- **State History:** `this.history` (undo stack) and `this.redoStack` (redo stack).
- **Core Operations:**
  - `addNode(node, parentId)` / `removeNode(nodeId)`.
  - `updateNode(nodeId, patch)` with deep property assignment supporting bracket indexing.
  - `commitMove(moves)` / `commitResize(id, prev, next)` for atomic drag gestures.
  - `createComponent`, `addComponentVariant`, `createInstance`, `setInstanceVariant`, `combineAsVariants`.
  - `bindVariable`, `unbindVariable`, `updateVariable`.
  - Alignment math (left, center, right, top, middle, bottom) and `tidyUp(nodeIds)`.

### 3.4 Layout Engine (`src/engine/layout.js`)
- **Paradigm:** Deterministic recursive calculation of bounding boxes and flow positions for Auto Layout frames (`stack-horizontal` and `stack-vertical`).
- **Sizing Semantics:** Fixed width/height, Hug Contents (shrinking to children bounds + padding), Fill Container (stretching to available parent space).
- **Coordinate Conversion:** Computes absolute canvas/world bounding boxes (`computeWorldBounds`) from parent-relative transforms.

### 3.5 Prototyping Engine & Runtime (`src/engine/prototype.js`)
- **Event Model:** 8 triggers (`click`, `tap`, `hover`, `press`, `delay`, `mouse_enter`, `mouse_leave`, `keyboard`).
- **Actions:** 10 action types (`navigate`, `back`, `change_variant`, `open_overlay`, `close_overlay`, `swap_overlay`, `set_variable`, `conditional`, `scroll_to`, `url`).
- **Smart Animate:** Layer-matching algorithm based on stable ID and layer name matching, computing CSS keyframe transitions across frames.
- **Presentation Player:** Standalone, self-contained HTML presentation player generator with device bezels (Desktop MacBook, iPad Mini, iPhone 15 Pro, Fluid Responsive) and diagnostic overlays.

### 3.6 Deterministic React Compiler (`src/compiler/jsx.js` & `src/engine/compiler.js`)
- **Target:** Production-ready Vite + React 18 + TypeScript / JavaScript projects.
- **Mapping:** Auto Layout frames map directly to CSS Flexbox; design tokens map to CSS custom properties; prototype interactions map to React event handlers and state hooks (`useInteraction`, `navigate`, `openModal`).

---

## 4. Frozen Zone Map & Integration Points

The frozen zone modules (`src/mcp/` and `src/ai/`) are isolated behind clean architectural contracts:

1. **MCP Design Server (`src/mcp/server/design_server.js`)**:
   - Queries document summary and page nodes via `CommandEngine` methods.
   - Executes batch operations by calling `engine.executeTransaction(...)`.
   - **Contract Requirement:** The new Figma-class document model must provide a compatibility facade (`EditorCoreAdapter`) that implements the exact expected interface so `design_server.js` functions without modification.
2. **AI Operations Executor (`src/ai/operations.js`)**:
   - Emits validated actions (`create_node`, `update_layout`, `update_style`, `create_component`) to the active `CommandEngine`.
   - **Contract Requirement:** The evolved command bus must accept these identical operation types and payload signatures.
3. **AI Context Manager (`src/ai/context.js`)**:
   - Reads the scene graph structure, token sets, and active selection.
   - **Contract Requirement:** The new scene graph must provide a JSON snapshot format compliant with the schema expected by `context.js`.
