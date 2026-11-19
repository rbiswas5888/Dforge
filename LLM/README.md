# DF-UX Intelligence — DesignForge AI Native UX Intelligence Module

**DF-UX Intelligence** is the specialized, model-independent AI UX intelligence module powering DesignForge AI. It brings deep Human-Computer Interaction (HCI) knowledge, automated Nielsen Norman usability heuristics, WCAG 2.2 accessibility audits, multimodal screenshot understanding, and text-to-editable-UI generation directly into the DesignForge 2D infinite canvas.

---

## 🚀 Key Capabilities

1. **DFIR Core Standard (`dfir.schema.json` & Pydantic v2):**
   - Versioned intermediate representation bridging AI generation and the DesignForge canvas.
   - 100% editable native nodes (`frame`, `rectangle`, `text`, `vector`, `ellipse`, `component`, `instance`).
   - Supports Flexbox auto-layout stacks, constraints, corner radii, drop shadows, and design tokens.
2. **Deterministic Canvas Bridge (`DFIRCanvasBridge`):**
   - Translates validated DFIR directly into canonical scene graph operations.
   - Commits changes atomically to `CommandEngine` with 100% undo/redo (`⌘Z`/`⌘⇧Z`) fidelity.
   - Reverse-exports canvas selections back to DFIR.
3. **Model Management Engine:**
   - Provider-independent model abstraction supporting Local (Ollama, Hugging Face, offline heuristic synth), Private Cloud (vLLM hosting Qwen3-32B, Qwen3-VL-8B, Gemma 4, FLUX.2 Klein), and Hosted Cloud (OpenAI GPT-4o, Google Gemini 2.5 Flash).
   - Real-time health checks, latency benchmarking, and connection testing.
4. **UX Reasoning & Heuristics Engine:**
   - Jakob Nielsen's 10 Usability Heuristics scoring.
   - Information architecture recommendations and cognitive friction analysis.
5. **Accessibility Engine (WCAG 2.2 AA / AAA):**
   - Automated color contrast analysis (4.5:1 text, 3:1 graphical components).
   - Touch target compliance (minimum 44x44px for touchable controls).
   - Screen-reader landmarks and semantic tags.
   - Clear distinction between automated checks and requirements for manual user testing.
6. **Vision Analysis Engine (Screenshot-to-UI):**
   - Decomposes uploaded screenshots into semantic layout regions.
   - Extracts measurable color swatches and typography hierarchies.
   - Reconstructs editable DFIR structures.
7. **UX Knowledge Base (RAG):**
   - Covers 21 canonical UX/HCI domains (Gestalt, visual hierarchy, mobile patterns, enterprise tables, etc.).
   - Hybrid semantic + keyword retrieval engine.
8. **Dataset Management & LoRA Training:**
   - Curates JSONL datasets across 6 specialized AI categories.
   - Generates Hugging Face Transformers + PEFT/LoRA fine-tuning configurations.
9. **Dedicated 12-Section Workspace UI:**
   - Overview, AI Assistant, Visual Generation, UX Evaluation, Screenshot Analysis, Design System Intel, Knowledge Base, Dataset Manager, Model Manager, Training & Fine-tune, Benchmarks, Settings.

---

## 🛠️ Quick Start

### 1. Start the Python FastAPI Backend (Port 8000)
```bash
cd LLM
./run_backend.sh
```
Or directly using the virtual environment:
```bash
cd LLM
PYTHONPATH=. ./.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation will be available at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

### 2. Run the DesignForge AI Web Server (Port 3001)
From the root directory:
```bash
npm start
```
The Node.js server automatically reverse-proxies all `/api/v1/*` requests to the Python FastAPI backend on port 8000.

---

## 🧪 Running Verification Tests

### Run DF-UX Intelligence Test Suite (Python)
```bash
cd LLM
PYTHONPATH=. ./.venv/bin/pytest tests/
```
**Results:** 36/36 tests passing (DFIR schema, Pydantic validation, model adapters, RAG search, vision analysis, UX evaluation, dataset manager, API routes).

### Run DesignForge Canvas Bridge & Core Engine Tests (Node.js)
```bash
cd ..
node tests/test_dfir_canvas_integration.js
node tests/test_engines.js
```
**Results:** 100% verification checks passed with zero regression.
