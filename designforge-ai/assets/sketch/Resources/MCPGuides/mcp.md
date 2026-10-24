# get_guide: mcp

Default guide for Sketch MCP tool use. Load this before using any Sketch MCP tool. If you will inspect, create, style, lay out, export, prototype, or otherwise change Sketch document content, also call `get_guide` with `topic: "use"`.

Valid related topics: `troubleshooting`, `use`, `layout`, `styling`, `symbols`, `assets`, `prototyping`.

# Sketch MCP Guide

The canonical operating guide for Sketch MCP work. Load this before calling a Sketch MCP tool. It covers how to operate the bridge safely; call `get_guide` with `topic: "use"` alongside this topic when creating, inspecting, styling, exporting, prototyping, or otherwise changing Sketch document content.

## When To Use

Use this topic whenever the task involves Sketch MCP tools:

- `get_guide`
- `get_document_info`
- `get_layer_tree_summary`
- `get_libraries`
- `get_design_assets`
- `get_symbol_overrides`
- `get_screenshot`
- `run_code`

If no Sketch MCP tool will be used, do not load this topic.

## References

Call these topics on demand only.

- call `get_guide` with `topic: "troubleshooting"`: diagnose any specific MCP bridge, `run_code`, or screenshot failure before retrying.

For content operations, call `get_guide` with `topic: "use"`.

You do not need to load subtopics before calling MCP unless the task needs them.

## Critical Rules

1. Use only the supported [Sketch JavaScript API](https://developer.sketch.com/reference/api/llms.txt). Do not call Objective-C internals, undocumented selectors, or other native bridges; doing so can corrupt documents or crash Sketch.
2. Appearance-changing work must capture MCP screenshots through Visual Verification & Completion below. Do not substitute zoom-only or assumed success from `run_code`.
3. `run_code` scripts must follow the `run_code` Playbook below: bootstrap, one action per script, JSON reporting, parser-safe `find`, and fresh target resolution.
4. Analyze before retry: when `run_code` fails, call `get_guide` with `topic: "troubleshooting"`. Read the full tool output, classify the failure, state one hypothesis, then send one targeted fix.
5. For any content operation, call `get_guide` with `topic: "use"` alongside this topic before deciding how to inspect, create, style, export, prototype, or mutate Sketch document content.

## Workflow Playbook

Follow this operating sequence for Sketch MCP usage.

### 1) Confirm MCP Context

- Sketch 2025.2.4 or later is running. MCP is not available in the Mac App Store build.
- The MCP Server is running. Start it from the Command Bar by searching for `MCP`, or from Settings -> General -> MCP Server.
- Sketch has Local Network access in macOS System Settings when prompted.
- The target document is open.

If any MCP call fails: call `get_guide` with `topic: "troubleshooting"` and follow MCP connection failures. Do not guess endpoints or work from memory.

#### Document Lifecycle

By default, expect the target document to already be open in Sketch. If the user gives a file path, or gives a document name that can be resolved among open/recent documents, it is acceptable to open that document through the public Sketch JavaScript API before continuing. If no path, resolvable name, selected document, or explicit document ID is available, ask the user to open or identify the document instead of guessing. Only create a new document when the user explicitly asks for one.

#### Version Probe

When you first touch a new Sketch session, log `sketch.version` and cache it for the session.

```javascript
const sketch = require('sketch');
console.log(JSON.stringify({
  ok: true,
  docId: sketch.getSelectedDocument().id,
  sketch: String(sketch.version.sketch),
  api: sketch.version.api,
}));
```

If a script fails with `... is not a function`, treat it as a possible API/version mismatch. Check the public Sketch JavaScript API reference, use a documented fallback, or stop and tell the user their Sketch build may not expose that API.

### 2) Resolve Target Document and Layer

Preferred order:

1. User-selected layer (`document.selectedLayers`) when the user says "this layer/frame".
2. Explicit IDs or Sketch share link identifiers (`https://sketch.com/s/<doc>/f/<frame>`).
3. Name-based resolution with user confirmation.

Use explicit IDs for mutation targets; `sketch.find('#' + id, doc)[0]` is the usual pattern when the ID is dynamic. For content-specific target strategy and richer queries, call `get_guide` with `topic: "use"`.

Never proceed when the target is ambiguous; confirm with the user.

### 3) Gather Structured Context

Use `run_code` to collect enough bridge-visible context to make the next action safe: selected document ID, selected page, target layer IDs, parent IDs, and any tool-call identifiers needed by `get_screenshot`, `get_design_assets`, or `get_symbol_overrides`.

Keep scripts short and log structured JSON with `console.log(JSON.stringify(...))`. For content-specific probes and edits, call `get_guide` with `topic: "use"`.

Prefer `get_document_info` and `get_layer_tree_summary` for basic document/page/frame and shallow layer-tree introspection when those tools are available. Use `run_code` for deeper properties, targeted probes, or edits.

### 4) Execute Incremental Edits

- One script = one action — one property, one container, one small sibling batch, or one probe.
- Keep scripts short and flat; do not nest deeply or combine unrelated changes.
- Re-resolve document/selection each script.
- Do not assume state from previous tool calls.
- Log IDs/counts/results for every call.
- After a failed script, inspect the error text and latest logged context before retrying.
- For document-content operations, call `get_guide` with `topic: "use"` and any relevant content subtopic.

### 5) Validate Visually

Follow Visual Verification & Completion below.

### 6) Finalize and Reveal

When, and only when, the task is complete per Visual Verification & Completion:

- Call `document.centerOnLayer` / `document.zoomToFitCanvas` at most once as the final reveal step.
- Do not center or zoom during intermediate batches or after every script.
- Summarize what changed and what the latest screenshot confirmed, or why screenshot was unavailable.

## Golden Rule

Do not batch large, opaque edits. One `run_code` call = one small, observable change. Small flat scripts produce better quality, fewer parser failures, and easier recovery. When building a large design, use many short scripts with `get_screenshot` between batches — never one script for a whole page, region, or multi-step refactor.

## Visual Verification & Completion

Skip only if the user explicitly asks for a non-pixel workflow, or `get_screenshot` fails after reasonable retry. If skipped, say so in the final reply and list what you verified instead.

### Screenshot Loop

1. Resolve `targetDocumentID` when needed:
  ```javascript
   const sketch = require('sketch');
   console.log(JSON.stringify({ docId: String(sketch.getSelectedDocument().id) }));
  ```
2. After every batch of edits that can change appearance, call `get_screenshot` before claiming completion.
3. Screenshot the layer or frame you changed (`layerID` from discovery `run_code`), or the page/enclosing frame if needed.
4. Confirm the screenshot is non-empty, targets the intended document/layer, and reflects the latest edit.
5. If the task changes Sketch content, continue content-specific critique after calling `get_guide` with `topic: "use"` or another task-specific guide.
6. If the screenshot shows a problem, name it, apply one targeted `run_code` fix, then screenshot again.
7. In the final message, state what the screenshot confirmed, or that capture failed after retry.

`get_screenshot` returns smaller PNGs inline. For a large PNG it returns text containing an absolute temporary file path; inspect that file instead of treating the text result as a failed capture. If `layerID` is omitted, the tool captures the currently selected layer.

### Bridge Checks

- Target document ID is current.
- Target layer ID is current and matches the intended layer.
- Screenshot is non-empty and covers the changed layer/frame or its enclosing context.
- The screenshot was taken after the latest appearance-changing edit.
- If capture fails after retry, record what was verified instead.

### Completion Standard

Done only when required edits are finished, the latest relevant batch was screenshot-validated or the waiver is documented, bridge checks pass, any `use` content checks pass, and the summary states what the screenshot showed.

## `run_code` Playbook

Use this when writing or reviewing any `run_code` script.

### Mandatory Constraints

- Bootstrap: first line `const sketch = require('sketch')`; ECMAScript 2020; one script = one logical action.
- Size and complexity: keep every script small, flat, and single-purpose. Sketch does not enforce a byte limit, but large or heavily nested scripts fail more often and are harder to undo. Do not build a whole page/region, mass-create layers, or combine probe + create + style + reorder in one call. Do not minify to cram more work into one script.
- State: re-resolve document/layers/selection each run. Do not rely on memory between tool calls.
- Public API only: documented [Sketch JavaScript API](https://developer.sketch.com/reference/api/llms.txt) (`require('sketch')`, `require('sketch/dom')`, published enums). Forbidden: Objective-C runtime, private internals, undocumented bridges, `sketchObject`, and direct native model objects.
- Title: required concise purpose (`title`) in fewer than 10 words.
- Format: prefer multiline scripts. One-line payloads often hit `SyntaxError: Parser error` in the generated plugin script.
- Comments: do not include comments inside submitted scripts.
- Targets: prefer explicit IDs over names or selection when mutating; build selectors from variables when values are dynamic.
- Functions: no duplicate `function` names in one script; avoid deep nesting of helpers, IIFEs, or `if/else` trees — prefer the Recommended Script Shape instead.
- Reporting: end with `console.log(JSON.stringify({ ok, ... }))` using serializable fields only. The MCP bridge surfaces stdout from `run_code`, not arbitrary return values. Use `get_screenshot` for images. Do not rely on `sketch.UI.message` or alerts for outcomes the agent must reason about. For asset exports, call `get_guide` with `topic: "assets"`.

### Script size and complexity

Treat these as hard workflow rules even though Sketch accepts long scripts.

#### One change per script

Good single actions:

- Probe only: log `docId`, target layer ID, child counts, or one style value.
- Create or configure one container (frame/group/stack settings).
- Add one to three sibling layers to an existing stack, then `stackLayout.apply()`.
- Change one property on one layer (frame width, fill, text, override, `layer.index`).

#### Never combine in one script

- Whole page, header, hero, or other top-level region builds.
- Creating layers in multiple unrelated containers.
- Probe + mutate + style + reorder in the same run.
- Loops that mass-create UI that should be validated incrementally with screenshots.

#### Keep structure flat

- Bootstrap → resolve target by explicit ID → one mutation → JSON log.
- Avoid helper `function`s unless a tiny IIFE is unavoidable; never duplicate function names.
- Prefer readable multiline scripts over minified one-liners.

#### Large tasks

Split across many `run_code` calls. Log IDs the next script needs; screenshot after each appearance-changing batch.

### Placement Across Scripts

Sketch does not auto-offset new layers across separate `run_code` runs.

- Under the same parent: do not assume a previous script's local variables or selection still exist; log the target parent ID and any placement data the next script needs.
- New root Frame on a Page: Sketch does not auto-offset new layers across separate `run_code` runs. Call `get_guide` with `topic: "use"` for content-placement strategy.

### Recommended Script Shape

```javascript
const sketch = require('sketch');
const doc = sketch.getSelectedDocument();
if (!doc) {
  console.log(JSON.stringify({ ok: false, error: 'NO_DOCUMENT' }));
} else {
  var layerId = '<LAYER-UUID>';
  var target = sketch.find('#' + layerId, doc)[0];
  if (!target) {
    console.log(JSON.stringify({ ok: false, error: 'TARGET_NOT_FOUND', layerId: layerId }));
  } else {
    target.name = '<NEW-NAME>';
    console.log(JSON.stringify({ ok: true, details: { id: target.id } }));
  }
}
```

A one-line/minified variant is acceptable only if it still parses on the host. If Sketch returns `Parser error`, switch to the multiline layout first.

## Common Mistakes

Script and API issues:

- monolithic script (whole page/region, many layers, or multiple unrelated changes in one call)
- heavily nested script (deep helper functions, IIFEs, or control-flow trees instead of flat probe → mutate → log)
- wrong or missing target
- native bridges (`sketchObject`, MS-prefixed classes)
- UI-only reporting
- relying on `return` instead of `console.log`
- using `output: false` in `run_code` instead of `get_screenshot`

Completion hazards:

- skipping visual verification when appearance changed
- non-finite `frame` math (`NaN` / `Infinity`) that corrupts the file
- `centerOnLayer` / `zoomToFitCanvas` before the task is done

For layout, style, symbol, override, export, prototype, and other document-operation mistakes, call the relevant content topic.

## Troubleshooting Quick Reference

The most frequent bridge/tool-call failures and the first thing to try. Detailed diagnosis, less-common symptoms, and step-by-step recovery: call `get_guide` with `topic: "troubleshooting"`.

- MCP calls fail to connect: ask the user to open Sketch, start the MCP Server, allow Local Network access, or reopen the agent tool.
- `run_code` returns no document: re-resolve via `sketch.getSelectedDocument()`; ask the user to open a document.
- Empty/unhelpful `run_code` output: add structured `console.log(JSON.stringify({ ... }))` fields.
- `SyntaxError: Parser error` (`llm-script.js`): use multiline script shape, check malformed string construction, and check duplicate function names.
- `get_screenshot` returns the wrong layer or empty image: re-probe the document and layer IDs, then retry with explicit IDs.

## External References

- [Sketch JavaScript API reference](https://developer.sketch.com/reference/api/llms.txt)
- [Sketch MCP docs](https://www.sketch.com/docs/mcp-server/)
- [Sketch docs hub](https://www.sketch.com/docs/)
