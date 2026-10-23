# DesignForge AI — System Architecture

## 1. Overview

DesignForge AI is structured as a set of well-separated engines connected by stable data contracts. The canonical design document is the single source of truth consumed by all subsystems.

## 2. Module Boundaries

### 2.1 Document Domain
- **Input:** Commands from UI and AI engine
- **Output:** Read-only document snapshots, events
- **Owns:** NodeId, PageId, AssetId, TokenId namespaces
- **Must NOT depend on:** React components, native APIs, specific AI vendor, compiler output structure

### 2.2 Command Engine
- **Input:** Typed commands from UI and AI executor
- **Output:** Applied transactions, undo/redo stack entries, normalized events
- **Enforces:** Invariants, validation, undo grouping

### 2.3 Renderer
- **Input:** Read-only document snapshot + layout results
- **Output:** Canvas drawing, hit-test results
- **Strategy:** Canvas 2D API with viewport culling

### 2.4 Layout Engine
- **Input:** Document nodes with layout config
- **Output:** Layout results (bounds, positions, overflow)
- **Shared with:** React compiler CSS generation

### 2.5 AI Engine
- **Input:** User prompt + document context
- **Output:** Typed DesignPlan (validated JSON schema)
- **Executes via:** Command engine only (never direct mutation)

### 2.6 React Compiler
- **Input:** Immutable document snapshot
- **Output:** JSX/TSX, CSS Modules, tokens, assets, package.json
- **Pipeline:** Snapshot → IR → Semantic Mapping → Emitters → Validation

### 2.7 Project Store
- **Input:** Document snapshots + commands
- **Output:** Portable .dforge project package
- **Strategy:** IndexedDB for browser POC, native FS for desktop

## 3. Data Flow

### Manual Edit
```
User action → UI event → Command(type, args) → Validator
→ Document mutation → Event → Renderer refresh + Inspector update
→ Journal entry → Autosave schedule
```

### AI Edit
```
User prompt → Context builder (selected nodes + tokens + components)
→ Model gateway → JSON schema validation → Scope/policy check
→ Preview diff → User approval → Command executor → Document mutation
→ History transaction → Autosave
```

### Export
```
Document snapshot → Compiler IR → Component tree resolution
→ JSX/TSX emitter → CSS emitter → Token emitter → Asset resolver
→ package.json + README → Build validation → Iframe sandbox preview
```

## 4. Technology Stack (POC Phase)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Shell | Single HTML file | POC portability; Tauri in production |
| Canvas | Canvas 2D API | Good performance, no deps |
| Document state | Vanilla JS Map/Object | Controlled, typed, serializable |
| AI gateway | Fetch to Gemini/OpenAI | Provider-independent adapter |
| Persistence | IndexedDB + JSON.stringify | Local-first, no server needed |
| React compiler | JS string templates | Deterministic, auditable |
| Preview | sandboxed iframe + blob URL | Safe, instant feedback |

## 5. Performance Targets

| Metric | Target |
|--------|--------|
| Pan/zoom frame time | < 16ms (60fps) |
| Selection hit test | < 5ms |
| Layout recalculation (local edit) | < 50ms |
| Save 100-node document | < 200ms |
| React export (20-component design) | < 3s |
| AI round-trip (context build + inference) | < 5s |
