# DesignForge AI — Frozen Zone Specification & Manifest (READ-ONLY)

> **CRITICAL DIRECTIVE**: The files, directories, interfaces, and contracts listed in this document constitute the **FROZEN ZONE**. Under no circumstances should any file listed below be edited, renamed, moved, reformatted, or have its dependencies altered. Any interaction between the evolved editor and this zone MUST occur strictly via non-invasive adapter layers.

---

## 1. Frozen Zone Classification & Scope

The Frozen Zone encompasses three distinct architectural domains:

1. **MCP (Model Context Protocol) Integration**
   - Transports, protocol handlers, connection lifecycles, and serialization (`src/mcp/protocol/`).
   - Native design tools and server implementations (`src/mcp/server/`).
   - Client manager, tool discovery, and client RPC (`src/mcp/client/`).
   - Security permissions, secret redaction, and human-in-the-loop approvals (`src/mcp/security/`).
   - Connectors for Filesystem, Documentation, and Git (`src/mcp/connectors/`).
   - Multi-server autonomous workflow orchestration (`src/mcp/orchestrator/`).
   - MCP UI Hub entrypoints (`src/mcp/ui/`).

2. **AI & Agent Structure**
   - DesignForge AI Service gateway (`src/ai/service.js`).
   - Pluggable provider layer: Local Offline Provider, Google Gemini Provider, OpenAI / Ollama Provider, and Provider Base class (`src/ai/providers/`).
   - Operations Layer schema, action executors, and transaction commits (`src/ai/operations.js`).
   - Pre-flight strict validator enforcing hierarchy invariants and security boundaries (`src/ai/validator.js`).
   - Token-budgeted context manager and privacy/redaction filters (`src/ai/context.js`).
   - Design Intelligence analyzer (WCAG 2.1 AA/AAA contrast, 4px/8px grid linter, layout bounds) (`src/ai/intelligence.js`).
   - Structured PRD Markdown specification parser (`src/ai/markdown_parser.js`).
   - Core types, JSON schemas, error classes, and privacy constants (`src/ai/types.js`).
   - AI Engine adapter bridge (`src/engine/ai.js`).

3. **Agent Behavior Rules & Contracts**
   - Token & component prioritization: When tokens/components are available, the agent must bind to existing definitions.
   - Graceful wireframe fallback: When tokens/components are missing, emit a wireframe with the standard note `"component not available"`.
   - Hybrid offline/online operational continuity: Full functionality without internet connectivity using `local-provider.js`.

---

## 2. Frozen Zone Manifest & Content Hashes (SHA-256)

All 26 files below are **READ-ONLY**. A CI guard test (`tests/test_frozen_zone_guard.js`) verifies these exact hashes on every execution.

| Relative Path | Subsystem | SHA-256 Content Hash | Status |
| :--- | :--- | :--- | :--- |
| `src/mcp/client/client.js` | MCP Client RPC | `a1d1e82401f30e7a630975d4e6517663e4f1f3240db9ac14dde37163e351171b` | **READ-ONLY** |
| `src/mcp/client/manager.js` | MCP Client Manager | `05156b3ab01a0642ff22efa8f21a855677699743118962fb7c2c2afbb26170d8` | **READ-ONLY** |
| `src/mcp/connectors/doc_server.js` | MCP Docs Connector | `909b5f836901c5c23ffc269774b3bb6012404dd54f300a04eca87784edee62cd` | **READ-ONLY** |
| `src/mcp/connectors/filesystem_server.js` | MCP FS Connector | `611fd0bcfd63077efdaea354d5ed9bdc9951f0d01c3d5aee45d616b3972a44b8` | **READ-ONLY** |
| `src/mcp/connectors/git_server.js` | MCP Git Connector | `1f1422fffb7d1b3d12bee99df9a3f70162b376fb6e987eec4d4d2c95b67dd562` | **READ-ONLY** |
| `src/mcp/index.js` | MCP Public Barrel | `2368d89a3157e7f17c645e5f9e37626040e74d3a02623f44848117ceaea6da2d` | **READ-ONLY** |
| `src/mcp/orchestrator/workflows.js` | MCP Orchestrator | `be59577dcbfc4a64029653b03b7e71c388b53fa046a439d0d46e0780d4341be2` | **READ-ONLY** |
| `src/mcp/protocol/connection.js` | MCP Connection | `0df62298ccde88b9fb77386dc60a0120c26c8e3edf9641c53005446e466536dc` | **READ-ONLY** |
| `src/mcp/protocol/transport.js` | MCP Transport | `0557603febfc2f7c185f94b0a1ccc3a11c47f4a9a5b103f2ac45a82cf34e4424` | **READ-ONLY** |
| `src/mcp/protocol/types.js` | MCP Types & Errors | `8bb61659a91e880888bac6a37593b87a61a1f988e2737377992c420b957a529d` | **READ-ONLY** |
| `src/mcp/security/audit.js` | MCP Audit Redaction | `80f99d8fa393c30a460b8ac1cf8c888eb955c714f95177382f40bcef46ab3ecf` | **READ-ONLY** |
| `src/mcp/security/permissions.js` | MCP Permissions | `c45b26706614bd146667c7822b1583abb9515f8513388815853090610f9ca580` | **READ-ONLY** |
| `src/mcp/server/design_server.js` | MCP Design Server | `a335c60cc04e0b4ab71e783ba7698b80e682bff9c2de3766063627c29bc3975a` | **READ-ONLY** |
| `src/mcp/server/server.js` | MCP Server Base | `b675aa7188f68a41f110c508ba106ef093045317d973de42743ecd4c5ae86d9f` | **READ-ONLY** |
| `src/mcp/ui/hub.js` | MCP Hub UI Bridge | `0bde8eb505c9c64064f9292655fbf6c8dda409d947477efea0bf9ac7fe7c70de` | **READ-ONLY** |
| `src/ai/context.js` | AI Context Manager | `53cc5c2ac98d3288b7c33f13b85fdd8371e686d881789983c97ca121bb0448ca` | **READ-ONLY** |
| `src/ai/intelligence.js` | Design Intelligence | `f0bfb581a67c26d8e604c31a06996fc2215ae943fce097a2e5a902480c7da463` | **READ-ONLY** |
| `src/ai/markdown_parser.js` | Markdown PRD Parser | `6f98ef8543544cb37777d96e433822d44aa7e0eb13078c880b38af1f991ab1ee` | **READ-ONLY** |
| `src/ai/operations.js` | AI Operations Engine | `2c7ec218d5c3d25bddfa31c9ccbf5dc4bd93db98538c99e5fc1d7a0bf5bc4965` | **READ-ONLY** |
| `src/ai/providers/gemini-provider.js` | Google Gemini Provider | `e366da12dd601385245a8d5e595cbe363571e1435f80bda17a7039cba7c9ddb1` | **READ-ONLY** |
| `src/ai/providers/local-provider.js` | Local Offline Provider | `dc1be4ab290c0dcbb9b987ebce718daab496220c3834c59de572c8451d118492` | **READ-ONLY** |
| `src/ai/providers/openai-provider.js` | OpenAI/Ollama Provider | `0cd329be75308bf7d6aa304471d42e63d3adb5709e9277133a845303da0222cf` | **READ-ONLY** |
| `src/ai/providers/provider-base.js` | Provider Interface | `27b493be1fb668445eb7890ce5cfef3da37a2075bd0717591621b14c47772190` | **READ-ONLY** |
| `src/ai/service.js` | DesignForge AI Service | `05532775ed3e63bbbaef0d34b1f7864eec9c5f155baf97193554387ae2cce731` | **READ-ONLY** |
| `src/ai/types.js` | AI Schemas & Constants | `059fae7f135dfdef1c9c13018eaf7649d698cbdf473013cfc59e8f7616725824` | **READ-ONLY** |
| `src/ai/validator.js` | AI Operation Validator | `2504222bdbe2f1895024ac1436ca8df4ba0932c0265bc849319d61225fbee5f0` | **READ-ONLY** |
| `src/engine/ai.js` | Engine AI Gateway | `b4bf1e8837b9161948d1194623be7701bb03ebbc6ff421ba7bec507f7cb1e3e8` | **READ-ONLY** |

---

## 3. Strict Boundary Rules & Adapter Architecture

To honor the constraint that the frozen zone cannot be modified:

1. **No Direct Model Dependencies**: The new Figma-grade scene graph and layout engine will live in `src/editor-core/`. When frozen modules (such as `DesignForgeDesignServer` or `DesignForgeAIService`) read or mutate document data, they continue interacting with the canonical document schema or an adapter that mirrors the exact methods of `CommandEngine` (`addNode`, `updateNode`, `removeNode`, `getActivePage`, etc.).
2. **Schema Invariant Preservation**: All new node types (`Section`, `VectorNetwork`, `ComponentSet`, `Instance`, `Slot`) maintain backwards-compatible serialized shapes so that MCP introspection tools (`get_document_summary`, `get_page_nodes`) receive structurally valid JSON matching their existing tool schemas.
3. **No MCP Tool Additions or Alterations**: The 10 MCP tools registered by `DesignForgeDesignServer` (`get_document_summary`, `get_page_nodes`, `create_frame`, `create_component`, `update_node_layout`, `update_node_style`, `bind_token`, `validate_document`, `batch_design_operations`, `list_design_tokens`) remain strictly untouched in signature, schema, and response format.
4. **Zero Refactoring in AI Providers**: No changes to prompts, heuristic synthesis in `local-provider.js`, or API endpoints in `gemini-provider.js` and `openai-provider.js`.
