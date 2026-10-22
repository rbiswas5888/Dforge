# DesignForge AI — Native AI Engine Specification

**Document Type:** Technical & Architectural Specification  
**Status:** Implemented & Verified  
**Engine:** Native AI Engine (`src/ai/`)  
**Target:** DesignForge AI Platform  

---

## 1. Executive Overview

The **DesignForge AI Engine** is a provider-independent, design-intelligent subsystem built directly into the DesignForge AI platform. Rather than acting as a chat wrapper, image generator, or raw code emitter, the AI engine directly queries, inspects, reasons over, and mutates the **shared canonical design document**.

All design changes flow through a typed, validated **Operations Layer** that commits atomically to the **Command Engine**, providing 100% undo/redo fidelity, zero canvas flattening, and deterministic design-to-code synchrony.

---

## 2. Architectural Subsystems

```mermaid
flowchart TB
    User[User / Designer] --> UI[AI Command Center / Drawer]
    UI --> Service[DesignForgeAIService]
    
    subgraph Context & Privacy
        Service --> ContextMgr[ContextManager]
        ContextMgr --> PrivacyFilter[Privacy & Redaction Filter]
    end

    subgraph Provider Adapters
        Service --> LocalProv[Built-in Local Provider]
        Service --> OpenAIProv[OpenAI / Ollama / LM Studio]
        Service --> GeminiProv[Google Gemini API]
    end

    subgraph Safety & Execution
        LocalProv & OpenAIProv & GeminiProv --> Validator[OperationValidator]
        Validator -->|Checks OK| Executor[OperationExecutor]
        Validator -->|Fails| Reject[Actionable Error Report]
        Executor --> CommandEngine[CommandEngine / Undo Stack]
        CommandEngine --> Doc[Canonical Scene Graph]
    end

    subgraph Diagnostics
        Service --> Intelligence[DesignIntelligenceAnalyzer]
        Intelligence --> Audit[WCAG Contrast · Spacing Tokens · Overflow]
    end
```

### Module Breakdown

| Path | Purpose |
|------|---------|
| [`src/ai/types.js`](file:///Users/rbiswas/Documents/Design%20Project/designforge-ai/src/ai/types.js) | Standard operations, JSON Schema tool definitions, error classes, and privacy constants |
| [`src/ai/validator.js`](file:///Users/rbiswas/Documents/Design%20Project/designforge-ai/src/ai/validator.js) | Strict pre-flight validation preventing cyclic hierarchies, corrupt geometries, and ghost references |
| [`src/ai/context.js`](file:///Users/rbiswas/Documents/Design%20Project/designforge-ai/src/ai/context.js) | Compact, token-budgeted snapshot builder with sensitive text redaction |
| [`src/ai/operations.js`](file:///Users/rbiswas/Documents/Design%20Project/designforge-ai/src/ai/operations.js) | Atomic execution engine translating typed operations into reversible transactions |
| [`src/ai/intelligence.js`](file:///Users/rbiswas/Documents/Design%20Project/designforge-ai/src/ai/intelligence.js) | Deterministic design linter (WCAG 2.1 AA/AAA, 4px/8px token grid, layout overflow) |
| [`src/ai/providers/local-provider.js`](file:///Users/rbiswas/Documents/Design%20Project/designforge-ai/src/ai/providers/local-provider.js) | Built-in offline design synthesizer operating entirely in memory |
| [`src/ai/providers/openai-provider.js`](file:///Users/rbiswas/Documents/Design%20Project/designforge-ai/src/ai/providers/openai-provider.js) | OpenAI (GPT-4o), Ollama (`localhost:11434/v1`), and custom endpoint adapter |
| [`src/ai/providers/gemini-provider.js`](file:///Users/rbiswas/Documents/Design%20Project/designforge-ai/src/ai/providers/gemini-provider.js) | Google Gemini 1.5/2.0 API adapter with function declarations |
| [`src/ai/service.js`](file:///Users/rbiswas/Documents/Design%20Project/designforge-ai/src/ai/service.js) | Central service orchestrating providers, cancellation, validation, and history |

---

## 3. Supported Typed Operations

All AI actions are expressed as typed operations defined in `DESIGN_TOOLS_SCHEMA`:

1. **`CreateNode`**: Creates frame, rectangle, text, ellipse, or section with transform, layout, styling, and semantic tags.
2. **`UpdateNode`**: Deep-merges property patches onto target node (`nodeId`).
3. **`DeleteNode`**: Safely removes node and its descendants from the document hierarchy.
4. **`MoveNode`**: Offsets coordinates $(x, y)$ of specified nodes.
5. **`ApplyLayout`**: Configures Auto-Layout flex direction, gap, 4-edge padding, alignment, and justification.
6. **`UpdateTokens`**: Updates global design token collections.
7. **`CreatePrototypeConnection`**: Sets interactive trigger (`click`/`hover`), action, and target page/modal.
8. **`BatchOperations` / `createTree`**: Atomically injects or updates multi-node component subtrees.

---

## 4. Pre-Flight Validation Rules

Before committing any operations to document state, the `OperationValidator` strictly enforces:
- **Node ID Existence**: Target `nodeId` must exist on the active page.
- **Parent ID Existence**: Parent reference must resolve to an existing container.
- **Cycle Prevention**: A container cannot be assigned as a child of itself or its descendants.
- **Positive Geometric Dimensions**: Width and height must be finite numbers $> 0$.
- **Coordinate Sanity**: Coordinates $x, y$, gap, and padding must be finite numbers.
- **Color Format Enforcement**: Color strings must match standard hex (`#fff`, `#1e293b`), `rgb()`, or `rgba()`.
- **Destructive Threshold Safeguard**: If a batch deletes $>30\%$ of total document nodes or a top-level artboard, it is flagged as destructive requiring explicit user confirmation.

---

## 5. Design Intelligence & Diagnostics

The `DesignIntelligenceAnalyzer` combines deterministic rules with design-system heuristics:

1. **WCAG 2.1 Contrast Checker**
   - Computes relative luminance:
     $$L = 0.2126R + 0.7152G + 0.0722B$$
   - Calculates contrast ratio against container background fill:
     $$\text{Ratio} = \frac{L_{\text{brightest}} + 0.05}{L_{\text{darkest}} + 0.05}$$
   - Flags elements failing AA ($< 4.5:1$ for body, $< 3.0:1$ for large text) and provides a one-click auto-fix.
2. **Spacing Token Harmony**
   - Flags Auto-Layout gaps that deviate from standard 4px/8px design tokens (e.g. 7px, 13px, 23px) and suggests nearest token snap.
3. **Layout Overflow Detector**
   - Identifies children whose world bounds extend past their parent container bounds.
4. **Component Duplication Detector**
   - Analyzes container structural signatures and recommends refactoring repeated patterns into reusable components.

---

## 6. Verification Results: Acceptance Criteria

All 10 acceptance criteria were validated via [`tests/test_ai_engine.js`](file:///Users/rbiswas/Documents/Design%20Project/designforge-ai/tests/test_ai_engine.js):

| # | Acceptance Criterion | Test Result |
|---|----------------------|-------------|
| 1 | Natural-language design request submission | ✅ Passed |
| 2 | Generation of genuine editable design nodes | ✅ Passed (19 nodes synthesized) |
| 3 | Modification of existing selected elements | ✅ Passed (`stack-vertical`, 24px gap) |
| 4 | Reuse of existing tokens and components | ✅ Passed (19 tokens inspected) |
| 5 | Single-transaction preview and undo | ✅ Passed (Exact previous state restored) |
| 6 | Pre-flight validation error rejection | ✅ Passed (Negative dimensions & ghost parents rejected) |
| 7 | In-flight request cancellation | ✅ Passed (Clean `CancellationError` via AbortController) |
| 8 | Configured model without hardcoded fake responses | ✅ Passed (Clean adapter interfaces) |
| 9 | Provider failure and privacy error recovery | ✅ Passed (Blocked remote transfer in Local-Only mode) |
| 10 | Persistence of AI-generated design via Storage Engine | ✅ Passed (100% layer fidelity round-trip) |
