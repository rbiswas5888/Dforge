# DF-UX Intelligence — System Architecture Specification
**Application:** DesignForge AI  
**Module:** DF-UX Intelligence  
**Version:** 1.0.0-alpha  
**Date:** November 2026  

---

## 1. Architectural Vision & Core Principles

**DF-UX Intelligence** is the proprietary AI intelligence layer of DesignForge AI. It is an AI system deeply specialized in Human-Computer Interaction (HCI), user experience patterns, visual hierarchy, design systems, accessibility, and interactive design.

### Core Architectural Axioms
1. **Model Independence:** The system does not lock into any single model provider (Ollama, vLLM, OpenAI, Gemini, Anthropic, Hugging Face). All models communicate through a unified model adapter abstraction.
2. **Intermediate Representation (DFIR):** All AI outputs compile to a strictly validated, versioned DesignForge Intermediate Representation (`DFIR`). No unvalidated raw JSON or hallucinated structures reach the canvas.
3. **Editable Native Output:** Output is never a flattened screenshot or static mockup; it produces 100% editable native DesignForge document nodes (`Frame`, `Text`, `Rectangle`, `Vector`, `Instance`) with auto-layout and design tokens.
4. **Preservation of Existing Features:** Does not alter existing canvas rendering, document schemas, or shortcuts; extends `AIEngine` and `CommandEngine` cleanly.
5. **Local-First & Hybrid Privacy:** Respects user privacy boundaries. Local models (via Ollama or local synth engines) run with zero network egress. Cloud models require explicit configuration.

---

## 2. High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            DESIGNFORGE AI FRONTEND                           │
│  ┌───────────────────────┐  ┌──────────────────────────────────────────────┐ │
│  │ Infinite 2D Canvas    │  │ DF-UX Intelligence Workspace & Panels        │ │
│  │ (renderer.js)         │  │ 1. Overview         7. Knowledge Base        │ │
│  │ - 60 FPS Canvas       │  │ 2. AI Assistant     8. Dataset Manager       │ │
│  │ - Direct Manipulation │  │ 3. Visual Gen       9. Model Manager         │ │
│  │ - Auto Layout         │  │ 4. UX Evaluation   10. Training & Fine-tune  │ │
│  │ - Smart Snapping      │  │ 5. Screenshot Vis  11. Benchmarks            │ │
│  │ - Transform Handles   │  │ 6. Design System   12. Settings              │ │
│  └───────────▲───────────┘  └──────────────────────▲───────────────────────┘ │
│              │                                     │                         │
│  ┌───────────┴─────────────────────────────────────┴───────────────────────┐ │
│  │ Command Engine (commands.js) & Canonical Document Model (document.js)    │ │
│  └───────────────────────────────────▲─────────────────────────────────────┘ │
│                                      │                                       │
│  ┌───────────────────────────────────┴─────────────────────────────────────┐ │
│  │ DFIR Canvas Bridge (dfir_canvas_bridge.js)                              │ │
│  │ - Bidirectional Mapping: DFIR ⇄ Canonical Document Nodes               │ │
│  │ - Schema Validator & Diff Previewer                                    │ │
│  └───────────────────────────────────▲─────────────────────────────────────┘ │
└──────────────────────────────────────┼───────────────────────────────────────┘
                                       │ HTTP / REST / SSE / WebSocket
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                   DF-UX INTELLIGENCE BACKEND (Python FastAPI)                 │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ REST API Endpoints & SSE Job Stream (/api/v1/*)                        │  │
│  │ - /generate/ui       - /analyze/screenshot  - /models                  │  │
│  │ - /generate/dfir     - /evaluate/ux         - /knowledge/*             │  │
│  │ - /design-system/*   - /prototype/generate  - /datasets/*              │  │
│  └───────────────────────────────────▲────────────────────────────────────┘  │
│                                      │                                       │
│  ┌───────────────────────────────────┴────────────────────────────────────┐  │
│  │ AI Orchestration Layer                                                 │  │
│  │ ┌─────────────────────────┐  ┌──────────────────────────────────────┐  │  │
│  │ │ Intent Classifier       │  │ Task Planner & Prompt Builder        │  │  │
│  │ ├─────────────────────────┤  ├──────────────────────────────────────┤  │  │
│  │ │ Model Router            │  │ DFIR Output Validator (Pydantic v2)  │  │  │
│  │ └─────────────────────────┘  └──────────────────────────────────────┘  │  │
│  └───────────────────────────────────▲────────────────────────────────────┘  │
│                                      │                                       │
│  ┌───────────────────────────────────┴────────────────────────────────────┐  │
│  │ 7 Core Intelligence Engines                                            │  │
│  │ 1. UX Reasoning Engine          5. Accessibility Engine (WCAG 2.2)     │  │
│  │ 2. Visual Generation Engine     6. Prototyping Intelligence Engine     │  │
│  │ 3. Vision Analysis Engine       7. Design-to-Code Engine (React/TS)    │  │
│  │ 4. Design System Engine                                                │  │
│  └───────────────────────────────────▲────────────────────────────────────┘  │
│                                      │                                       │
│  ┌───────────────────────────────────┴────────────────────────────────────┐  │
│  │ Model Management Engine (Adapters & Health)                            │  │
│  │ - Ollama Adapter (Local: Qwen3, Llama 3.1, Gemma)                      │  │
│  │ - vLLM Adapter (Private Cloud: Qwen3-32B, Qwen3-VL-8B)                 │  │
│  │ - Cloud Provider Gateway (OpenAI GPT-4o, Google Gemini 2.5)            │  │
│  │ - FLUX Asset Adapter (Visual assets)                                   │  │
│  └───────────────────────────────────▲────────────────────────────────────┘  │
│                                      │                                       │
│  ┌───────────────────────────────────┴────────────────────────────────────┐  │
│  │ Knowledge Base & RAG Engine                                            │  │
│  │ - 21 UX/HCI Categories (Gestalt, Heuristics, Typography, Tokens...)    │  │
│  │ - Semantic Chunker + Hybrid Vector Engine (Qdrant / In-Memory Index)   │  │
│  │ - Dataset Manager & Benchmarking Suite                                 │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Backend Architecture (Python FastAPI)

### 3.1 Technology Stack
- **Framework:** FastAPI (`>=0.115.0`) with ASGI server `uvicorn`.
- **Validation:** Pydantic v2 (`>=2.8.0`) for strict typing, schema generation, and input/output contracts.
- **Async Execution:** Asynchronous job runner with background task workers for generation, indexing, and training.
- **Real-Time Communication:** Server-Sent Events (SSE) and HTTP streaming for progressive generation status and token streaming.
- **Testing:** `pytest` test suite covering schema compliance, engine outputs, and API routes.

### 3.2 Key Directories (`LLM/`)
```
LLM/
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI application entry & router mounting
│   ├── config.py                   # Environment settings & secrets
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes_generate.py      # UI and DFIR generation endpoints
│   │   ├── routes_vision.py        # Screenshot analysis & visual decomposition
│   │   ├── routes_ux.py            # UX evaluation, accessibility & design system
│   │   ├── routes_models.py        # Model manager, health & capabilities
│   │   ├── routes_knowledge.py     # RAG ingestion, collections & search
│   │   └── routes_datasets.py      # Training datasets, benchmarks & export
│   ├── models/
│   │   ├── __init__.py
│   │   ├── dfir.py                 # Pydantic v2 DFIR schema models
│   │   ├── requests.py             # API request schemas
│   │   └── responses.py            # API response schemas
│   ├── orchestration/
│   │   ├── __init__.py
│   │   ├── router.py               # Model router (Local vs Cloud routing)
│   │   ├── intent.py               # Intent classifier (Text-to-UI, Audit, etc.)
│   │   ├── planner.py              # Multi-step task planner
│   │   ├── context.py              # Context manager for document state
│   │   └── validator.py            # Strict DFIR validator & fixer
│   ├── engines/
│   │   ├── __init__.py
│   │   ├── ux_reasoning.py         # Heuristics, IA, design rationale
│   │   ├── visual_generation.py    # DFIR visual tree synthesis
│   │   ├── vision_analysis.py      # Screenshot parsing & component recovery
│   │   ├── design_system.py        # Token engine & component recommendation
│   │   ├── accessibility.py        # WCAG 2.2 AA/AAA automated checks
│   │   ├── prototyping.py          # Micro-interactions, flows & triggers
│   │   └── code_compiler.py        # DFIR to React/TypeScript compiler
│   ├── model_manager/
│   │   ├── __init__.py
│   │   ├── manager.py              # Model registry, health checks & active models
│   │   └── adapters/
│   │       ├── base.py             # ModelAdapter abstract base class
│   │       ├── local_ollama.py     # Ollama adapter
│   │       ├── vllm_adapter.py     # vLLM adapter
│   │       ├── openai_adapter.py   # OpenAI / OpenAI-compatible adapter
│   │       ├── gemini_adapter.py   # Gemini adapter
│   │       └── mock_adapter.py     # Offline deterministic testing adapter
│   └── knowledge/
│       ├── __init__.py
│       ├── rag_engine.py           # Hybrid retrieval engine
│       ├── chunker.py              # Semantic text & code chunker
│       ├── store.py                # Vector store abstraction (Qdrant / In-Memory)
│       └── categories.py           # 21 UX domain categories & initial corpora
├── schema/
│   ├── dfir.schema.json            # Canonical DFIR JSON Schema (Draft 2020-12)
│   ├── DFIR_TYPES.md               # Technical specification of DFIR nodes
│   └── DFIR_VALIDATION.md          # Validation rules and constraints
├── tests/
│   ├── test_dfir_schema.py         # Tests for DFIR validation
│   ├── test_engines.py             # Tests for 7 intelligence engines
│   ├── test_api_routes.py          # Tests for FastAPI endpoints
│   └── test_rag.py                 # Tests for knowledge retrieval
└── requirements.txt                # Python dependencies
```

---

## 4. DFIR — DesignForge Intermediate Representation

DFIR is the formal bridge between AI generation and the DesignForge canvas. It provides a lossless, deterministic representation of design intent:

### 4.1 Root DFIR Structure
```json
{
  "$schema": "https://designforge.ai/schemas/dfir-v1.json",
  "version": "1.0.0",
  "metadata": {
    "title": "Enterprise Banking Dashboard",
    "description": "Generated by DF-UX Intelligence",
    "industry": "Fintech",
    "platform": "desktop",
    "viewport": { "width": 1440, "height": 900 }
  },
  "tokens": {
    "colors": { "brand_primary": "#2563EB", "surface": "#1E293B" },
    "typography": { "fontFamily": "Inter", "baseSize": 14 },
    "spacing": { "xs": 4, "sm": 8, "md": 16, "lg": 24, "xl": 32 },
    "radii": { "sm": 4, "md": 8, "lg": 16, "full": 9999 }
  },
  "root": {
    "id": "frame_root",
    "type": "frame",
    "name": "Dashboard Shell",
    "layout": { "mode": "stack-horizontal", "gap": 0, "alignItems": "stretch" },
    "style": { "fills": [{ "type": "solid", "color": "#0F172A" }] },
    "children": [ ... ]
  },
  "uxRationale": {
    "userGoals": ["Monitor daily transactions", "Review portfolio balance"],
    "informationArchitecture": "Two-column master-detail layout with fixed sidebar navigation",
    "heuristicsApplied": [
      "Visibility of system status via real-time balance metrics",
      "Consistency and standards using standard fintech card conventions"
    ],
    "accessibilityNotes": "High-contrast text tokens (#F8FAFC on #1E293B, 9.4:1 ratio)"
  }
}
```

### 4.2 Bidirectional Canvas Translation
The client-side `DfirCanvasBridge` in `src/ai/dfir_bridge.js` translates:
1. `DFIR Node Tree` → `Canonical Scene Graph Nodes` (`src/engine/document.js`).
2. Dispatches `batchOperations` to `CommandEngine` for 100% undo/redo fidelity.
3. Maps reverse: Selection / Page → `DFIR Document` for refinement prompts.

---

## 5. Model Management Engine & Model Strategy

### 5.1 Candidate Model Evaluation
1. **Qwen3-VL-8B-Instruct:** Visual understanding & screenshot decomposition.
2. **Gemma 4 12B:** Multimodal reasoning, UX heuristics & critique.
3. **Qwen3-32B:** Deep structured reasoning, complex layout planning & React code compilation.
4. **FLUX.2 Klein 4B:** Visual asset generation (icons, illustrations, placeholders).
5. **Fallbacks:** Ollama `llama3.1`, OpenAI `gpt-4o`/`o3-mini`, Google `gemini-2.5-pro`, and deterministic local synthesis engine.

### 5.2 Model Manager Features
- Registry of available models across Local (Ollama, Hugging Face) and Cloud (vLLM, OpenAI, Gemini).
- Real-time connection testing (`/api/v1/models/health`).
- Latency and context-window benchmarking.
- Active default model per task category (e.g., Vision → Qwen3-VL; Layout → Qwen3-32B; Fast Edit → Llama 3.1).

---

## 6. Knowledge Engine — RAG & 21 UX Domains

The Knowledge Engine retrieves domain-specific UX heuristics, design tokens, and accessibility standards:
- **Domains Covered:** UX fundamentals, UI design, HCI, Cognitive psychology, Gestalt principles, Typography, Colour theory, Visual hierarchy, Information architecture, Design systems, Design tokens, Accessibility (WCAG 2.2), UX research, Usability heuristics (Nielsen Norman), Responsive design, Interaction design, Prototyping, Enterprise UX, Fintech UX, E-commerce UX, React/frontend architecture.
- **Retrieval Pipeline:**
  - Query analysis & domain classification.
  - Semantic similarity search against indexed UX rules.
  - Injection into task planner context before DFIR synthesis.

---

## 7. Integrated UI & Navigation

DF-UX Intelligence is integrated directly into DesignForge AI with a dedicated 12-section workspace view:
1. **Overview Dashboard:** Active models, health, recent generation jobs, success rate, knowledge base status.
2. **AI Design Assistant:** Multi-mode prompt editor, industry selector, viewport presets, generation history.
3. **Visual Generation Studio:** Visual screen generation, auto-layout tuning, component hierarchy inspection.
4. **UX Evaluation & Heuristics:** Automated Nielsen Norman heuristic scoring and visual hierarchy analysis.
5. **Screenshot Analysis:** Drag-and-drop screenshot upload, bounding-box detection, component extraction.
6. **Design System Intelligence:** Token extraction, semantic color audits, component variant generator.
7. **Knowledge Base Manager:** UX documentation upload, semantic search, collection indexing.
8. **Dataset Manager:** JSONL training example curation, quality scoring, train/validation split.
9. **Model Manager:** Local & cloud model discovery, health checks, connection tests.
10. **Training & Fine-Tuning:** LoRA/PEFT hyperparameter config generation and training run logs.
11. **Evaluation & Benchmarks:** DFIR schema validity, layout compliance, and WCAG pass rate dashboards.
12. **Settings:** Privacy modes (`local_only`, `allow_hosted`, `redact_text`), endpoint URLs, API secrets.

---

## 8. Security, Privacy & Enterprise Controls

- **Zero-Silent Egress:** By default, design data is processed locally. If a cloud model is invoked, the user receives an explicit prompt and must confirm.
- **Client-Side Redaction:** Sensitive text (PII, credentials) can be redacted before transmission.
- **Secret Hygiene:** All API keys and endpoints are stored server-side or in encrypted local storage; never transmitted to third parties or embedded in client bundles.
- **Sandboxed Compilation:** Exported React code runs inside a sandboxed iframe with strict Content Security Policy.
