# DF-UX Intelligence — Codebase Audit & System Assessment
**Application:** DesignForge AI  
**Module:** DF-UX Intelligence (DesignForge AI Native UX Intelligence Module)  
**Date:** November 2026  
**Auditor:** Principal AI Architect & Senior Full-Stack Systems Engineer  

---

## 1. Executive Summary

DesignForge AI is an advanced desktop-class visual design, prototyping, and design-to-code platform. It combines:
- A deterministic canonical scene graph (`document-v1.schema.json`).
- A 60 FPS infinite 2D canvas with subpixel manipulation, smart guides, marquee selection, transform handles, and auto layout.
- A client-side transactional command engine with undo/redo stacks.
- An extensible design system registry supporting Mantine, MUI, Grafana, AG Grid, and React Native Elements.
- A deterministic React 19 + TypeScript compiler.
- A baseline client-side AI integration supporting OpenAI, Gemini, Ollama, and local heuristic generation.

This audit establishes the baseline technical architecture of DesignForge AI and identifies the integration points for **DF-UX Intelligence**—a specialised, model-independent UX intelligence system capable of:
1. Generating editable, structured designs (DFIR) from natural language prompts.
2. Understanding screenshots and decomposing them into design hierarchies.
3. Performing automated UX evaluations, usability heuristic checks, and WCAG accessibility audits.
4. Managing design systems, tokens, and component recommendations.
5. Providing specialized UX knowledge retrieval (RAG) across 21 core UX/HCI domains.
6. Managing training datasets, benchmarks, and model fine-tuning experiments.

---

## 2. Frontend Framework & Architecture

### 2.1 Core Framework & Technologies
- **UI Framework:** React 19 (`react: ^19.3.1`, `react-dom: ^19.3.1`) paired with native high-performance DOM and Canvas rendering for the infinite canvas.
- **Component Libraries:**
  - `@mantine/core: ^9.8.0`, `@mantine/hooks`, `@mantine/form`, `@mantine/notifications`, `@mantine/modals`, `@mantine/charts`.
  - `lucide-react: ^1.64.0` for desktop-class iconography.
  - `recharts: ^3.10.1` and `ag-grid-react: ^36.3.0` for enterprise dashboards and data views.
  - `@tiptap/react: ^3.33.0` for rich text editing.
- **Styling Architecture:**
  - CSS custom properties (`var(--...)`) with full theme support (`theme-axiom-dark`, `theme-axiom-light`).
  - PostCSS with `postcss-preset-mantine` and `postcss-simple-vars`.
  - Modular CSS sheets: `designforge.css`, `design_system.css`, `axiom_layout.css`, `figma_modals.css`, `workspace.css`, `auth.css`, `mcp.css`.
- **Build System & Dev Server:**
  - **Vite 8** (`vite: ^8.3.5`, `vite.config.js`).
  - Node.js runtime server (`serve.js`) combining Vite middleware, static file delivery, Ollama proxying, and mobile preview APIs.
- **Entry Points:**
  - `index.html` (Main desktop application shell, top bar, canvas container, left/right inspector sidebars, bottom drawer, modals).
  - `src/app.js` (Main application controller orchestrating document, commands, renderer, inspector, workspace store, and AI assistant).
  - `preview.html` (Interactive device preview player).

---

## 3. Canvas & Rendering Engine

- **Implementation:** `src/engine/renderer.js`
- **Coordinate Space:** Infinite two-dimensional coordinate system with subpixel translation (`panX`, `panY`) and scale (`zoom` from 0.05× to 32×).
- **Pixel Density:** Automatic `devicePixelRatio` retina display scaling.
- **Direct Manipulation:**
  - 8-point interactive resize handles (NW, N, NE, E, SE, S, SW, W).
  - Rotation handle with degree snapping.
  - Multi-selection marquee box with spatial collision detection.
  - Magenta smart alignment snapping guides (left, right, center, top, bottom).
  - Double-click inline text editing.
- **Auto Layout Engine:**
  - Flexbox-inspired auto layout supporting `stack-horizontal`, `stack-vertical`, and `grid`.
  - Configurable gaps, four-sided padding, alignment (`start`, `center`, `end`, `stretch`), and justification (`start`, `center`, `end`, `space-between`).
  - Child sizing modes: `fixed`, `hug`, `fill`.
  - Automatic parent bounds propagation and responsive reflow.

---

## 4. State Management, Commands & Project File Structure

### 4.1 Document Model
- **Schema:** Strict conformance to `document-v1.schema.json` with schema version `1.0.0`.
- **Node Types:**
  - `frame` (App shells, cards, navigation containers, responsive artboards).
  - `rectangle` (Cards, background containers, dividers).
  - `ellipse` (Avatars, status dots, circular indicators).
  - `text` (Typography nodes with font family, size, weight, line height, letter spacing, alignment).
  - `vector` (Custom SVG paths, bezier curves).
  - `component` (Reusable master component definitions).
  - `instance` (Component instances with property overrides).
- **Document Structure:**
  ```json
  {
    "schemaVersion": "1.0.0",
    "id": "doc_...",
    "name": "Project Name",
    "pages": [
      {
        "id": "page_...",
        "name": "Page 1",
        "route": "/home",
        "rootIds": ["frame_desktop", "frame_mobile"],
        "nodes": {
          "node_id": { ...nodeProperties }
        }
      }
    ],
    "tokens": [
      { "id": "tokens_colors", "tokens": [...] },
      { "id": "tokens_spacing", "tokens": [...] },
      { "id": "tokens_radius", "tokens": [...] }
    ]
  }
  ```

### 4.2 State Management & Command Engine
- **Implementation:** `src/engine/commands.js` (`CommandEngine`).
- **Undo / Redo:** Full transactional undo/redo history using command pattern (`addNode`, `updateNode`, `deleteNode`, `moveNode`, `applyLayout`, `batchOperations`).
- **Workspace Store:** `src/engine/workspace_store.js` (`WorkspaceStore`) manages local workspaces, projects, versions, organizations, team members, and file tabs.
- **Persistence:** Local-first storage (`src/engine/storage.js`) with debounced auto-save to browser storage and export/import of `.dforge` project archives.

---

## 5. Existing AI Integration & Capabilities

### 5.1 Current Architecture (`src/ai/`)
- **Central Orchestrator:** `src/ai/service.js` (`DesignForgeAIService`).
- **Application Gateway:** `src/engine/ai.js` (`AIEngine`).
- **Providers:**
  - `src/ai/providers/local-provider.js` (Deterministic offline synthetic design generator).
  - `src/ai/providers/ollama-provider.js` (Ollama local inference, defaults to `llama3.1`).
  - `src/ai/providers/openai-provider.js` (GPT-4o, o1, o3-mini).
  - `src/ai/providers/gemini-provider.js` (Gemini 1.5/2.5 Pro & Flash).
- **Dual Reasoning:** `src/ai/dual_reasoning.js` queries two providers simultaneously and consolidates output.
- **Context Management:** `src/ai/context.js` builds context payloads from active page nodes, selection, and design tokens.
- **Validation & Execution:**
  - `src/ai/validator.js` checks schema rules, risk levels, and token validity.
  - `src/ai/operations.js` executes batch operations atomically on `CommandEngine`.
- **Markdown Specification Parser:** `src/ai/markdown_parser.js` translates Markdown specs into native node trees.

### 5.2 Strengths of Existing AI Engine
1. Clear separation between generation and execution (operations are validated before touching the document).
2. Atomic transactional execution with complete undo/redo support.
3. Clean provider abstraction interface (`generateDesignPlan`, `testConnection`).

### 5.3 Limitations & Gaps (Addressed by DF-UX Intelligence)
1. **No Intermediate Representation:** Outputs jump directly from provider text into ad-hoc operation dictionaries without a standardized intermediate representation (DFIR).
2. **Missing UX Specialization:** The current AI has no specialized UX reasoning engine (information architecture, usability heuristics, visual hierarchy analysis).
3. **No Multimodal Vision Engine:** Screenshots cannot be uploaded, analyzed, or reverse-engineered into editable UI structures.
4. **No Comprehensive Knowledge Base / RAG:** Knowledge indexing is limited to scanning local component names; there is no semantic vector database or 21-category UX knowledge base.
5. **No Dataset Management or Training:** No capabilities exist for importing, curating, scoring, or exporting JSONL datasets for LoRA/PEFT fine-tuning.
6. **No Benchmarking or Evaluation Framework:** No quantitative benchmarks exist to measure DFIR validity, layout compliance, or accessibility pass rates.
7. **Monolithic In-Browser Calls:** Complex AI operations run synchronously in the browser UI thread without a dedicated Python FastAPI backend or job queue.

---

## 6. Authentication, APIs & Storage

- **Auth Service:** `src/engine/auth_service.js` provides local and cloud authentication states, roles (`admin`, `editor`, `viewer`), session tokens, and workspace membership.
- **Server API:** Node.js server (`serve.js`) provides:
  - `/api/preview/session` (Create & retrieve interactive mobile previews).
  - `/api/preview/:sessionId/events` (Collect prototype usability events).
  - `/api/ollama/*` (Reverse proxy to local Ollama instance on port 11434).
- **Storage:**
  - Client-side IndexedDB / LocalStorage for workspace documents.
  - `.dforge` JSON package export/import.

---

## 7. Reusable UI Components & Styling

The application has a polished Figma-grade dark interface:
- **Navigation:** Header menu bar (`File`, `Edit`, `View`, `Object`, `Arrange`, `Components`, `MCP`, `Help`), tab selectors (`Layers`, `Assets`, `Pages`).
- **Inspector Panels:** Right-hand property inspector (`Design`, `Prototype`, `Inspect`, `Export`, `AI Assistant`).
- **Modals:** Missing fonts modal, bulk rename modal, MCP registry modal, shortcut sheet, learning center.
- **Bottom Drawer:** Timeline, variables & tokens, comments, issues & linter, console, AI activity.

---

## 8. Missing Functionality & Technical Dependencies for DF-UX

| Required Capability | Current Status in DesignForge AI | Target in DF-UX Intelligence |
|---|---|---|
| **DFIR Standard** | None (ad-hoc operation lists) | Formal JSON Schema + Pydantic v2 Models + Bidirectional Canvas Mapper |
| **Python FastAPI Backend** | None (Node.js serve.js only) | Dedicated FastAPI REST + SSE backend on port 8000 (proxied via `serve.js`) |
| **Model Management Engine** | Hardcoded provider list in JS | Unified Model Manager supporting Ollama, vLLM, HuggingFace, OpenAI, Gemini, with health & latency benchmarks |
| **UX Reasoning Engine** | Generic LLM prompt | Structured heuristic analysis, IA generation, design rationale generator |
| **Vision Analysis Engine** | None | Multimodal screenshot parser, component bounding-box estimator, color palette extractor |
| **UX Knowledge Base (RAG)** | Local text string index | 21 UX categories, semantic chunker, hybrid vector store with metadata filtering |
| **Accessibility Engine** | Basic color contrast check in linter | Comprehensive WCAG 2.2 AA/AAA automated audits, focus order, touch target analysis |
| **Dataset & Fine-tuning** | None | JSONL dataset manager, quality scorer, Hugging Face LoRA/PEFT training config generator |
| **Evaluation Framework** | None | Multi-metric benchmark suite (DFIR validity, token compliance, layout accuracy) |
| **Integrated DF-UX UI** | Basic chat panel in right sidebar | 12-section dedicated DF-UX Intelligence workspace view + Canvas overlay tools |

---

## 9. Conclusion

DesignForge AI's clean document model (`document.js`), robust `CommandEngine`, and extensible `AIEngine` provide the ideal foundation for **DF-UX Intelligence**. By preserving all existing features and building DF-UX Intelligence as a specialized Python FastAPI intelligence service communicating through DFIR, we achieve full model independence, deep UX intelligence, and 100% native editable canvas outputs without breaking any existing functionality.
