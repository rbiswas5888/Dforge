# get_guide: troubleshooting

This is a subtopic. If you have not already loaded the parent topic, call `get_guide` with `topic: "mcp"` before applying this troubleshooting guidance.

Use this when MCP bridge calls, `run_code`, or screenshots fail. The first section is the retry discipline; the second section is symptom-specific recovery.

# Analyzing failed `run_code` scripts

When `run_code` fails, stop — no guessy rewrites. Symptom-specific fixes are in this topic; open the section that matches the tool output and follow it.

## Before you retry

1. Tool output is ground truth — read it verbatim. Parser errors in `llm-script.js` usually mean the script never ran; `{ ok: false }` means it ran but failed; empty output usually means no `console.log(JSON.stringify(...))`.
2. Submitted script — re-read what you actually sent, not what you meant.
3. One hypothesis → one change — state what failed and the single edit you'll make; don't combine unrelated fixes or grow a monolith. If the failing script was large or did many things, split it before retrying.
4. Same error twice — bisect (halve the script until the error moves) or stop. If the script builds a whole region or combines many edits, split into smaller flat scripts first — that often fixes parser and logic failures without bisecting.
5. Stop and report when bisecting still fails on a minimal script, the public API can't do it safely, or the document needs Undo: optional `get_screenshot`, then tell the user what you tried, verbatim output, your hypothesis, and the minimal script if you have one.

# Troubleshooting — MCP bridge and tool calls

Use this when a Sketch MCP tool call fails, returns unusable bridge output, or cannot target the requested document/layer. For document-content, layout, styling, symbol, override, export, or library import failures, call the relevant content topic: `use`, `layout`, `styling`, `symbols`, `assets`, or `prototyping`.

On `run_code` failures, call `get_guide` with `topic: "troubleshooting"` before retrying, then use the matching section below.

## MCP connection failures

### Symptoms

- Any MCP tool call fails immediately with a transport-level error.
- All tools return "no document context" / "no open Sketch documents".

### Diagnosis & recovery

1. Confirm the Sketch desktop app is running.
2. Confirm Sketch 2025.2.4 or later is installed from outside the Mac App Store.
3. Start the MCP Server from the Command Bar by searching for `MCP`, or from Settings -> General -> MCP Server.
4. Confirm Sketch has Local Network access in macOS System Settings.
5. Confirm at least one document is open.
6. Confirm the MCP client points at the MCP server URL shown in Sketch settings. Do not hardcode a port or path.
7. Retry the same call once after the user confirms.
8. If the retry still fails after Sketch is open and MCP is enabled, ask the user to restart their agent / MCP client. The local Sketch MCP server changes its session state when Sketch restarts, and existing client connections often need to be re-established.
9. If a fresh client session still fails, ask the user to fully quit and relaunch Sketch, not just close the window, and then retry once more.

If still failing, stop and ask the user. Do not improvise alternative endpoints or transport guesses.

## `No open Sketch documents with such identifier`

### Symptoms

- `get_libraries`, `get_design_assets`, `get_symbol_overrides`, or `get_screenshot` returns this exact error.

### Diagnosis

- The document was closed between calls.
- A different document is now selected, and the agent cached an older `targetDocumentID`.

### Recovery

```javascript
const sketch = require('sketch');
var d = sketch.getSelectedDocument();
console.log(JSON.stringify({ ok: true, docId: String(d.id), path: d.path }));
```

Use the freshly logged ID for follow-up tool calls.

## Empty / unhelpful `run_code` output

### Symptoms

- Tool result is `<no output>` or just `undefined`.
- The script ran, visible in Sketch's plugin history, but the agent sees nothing useful.

### Diagnosis

- The script relied on `return value;` for outcomes. The MCP bridge surfaces stdout from `run_code`, not arbitrary return values.
- The script used `sketch.UI.message(...)` for the outcome, which is visible only in Sketch.
- The script tried to surface image bytes through `run_code`. Images belong in `get_screenshot`.

### Recovery

Always log a single-line JSON summary at the end:

```javascript
console.log(JSON.stringify({ ok: true, details: { action: 'completed' } }));
```

## `SyntaxError: Parser error` (`llm-script.js`)

### Symptoms

- Tool output is only a stack like `SyntaxError: Parser error` referencing `llm-script.js`, often with no `console.log` JSON.
- The script never produces structured output.

### Common causes & fixes

1. Two `function` declarations with the same name in the same script scope. Rename or wrap in IIFEs:

   ```javascript
   (function walkA() { console.log('A'); })();
   (function walkB() { console.log('B'); })();
   ```

2. A minified / one-line script that worked elsewhere. Expand to multiline with normal line breaks and braces around `if/else`:

   ```javascript
   const sketch = require('sketch');
   const doc = sketch.getSelectedDocument();
   if (!doc) {
     console.log(JSON.stringify({ ok: false, error: 'NO_DOCUMENT' }));
   } else {
     console.log(JSON.stringify({ ok: true, docId: doc.id }));
   }
   ```

3. Persistent failure after all of the above: treat it as a host bug. Bisect the script until you have a minimal repro, then stop per this topic.

## `Group is undefined` / constructor errors

### Symptoms

- `Group is not defined`, `ShapePath is not defined`, etc.

### Cause

Constructors live on `sketch`, not as globals.

### Fix

```javascript
var g = new sketch.Group({});
var f = new sketch.Group.Frame({ background: { enabled: false } });
var gr = new sketch.Group.Graphic({});
var sp = new sketch.ShapePath({});
```

## `get_screenshot` returns the wrong layer / empty image

### Symptoms

- The image shows a different layer or is blank.

### Diagnosis

- The `layerID` passed is from a stale snapshot because the layer was removed/replaced.
- No `layerID` was passed and the document's selection moved.

### Fix

Re-probe with `run_code`:

```javascript
const sketch = require('sketch');
const doc = sketch.getSelectedDocument();
var layer = sketch.find('#' + id, doc)[0];
console.log(JSON.stringify({
  ok: !!layer,
  found: layer ? { id: layer.id, name: layer.name, type: layer.type } : null,
}));
```

Then retry `get_screenshot` with the confirmed ID.

## "Cannot save this document" on `document.save(...)`

### Symptoms

- `save()` throws `Cannot save this document`.

### Cause

The document is in a state where Sketch can't save, or the URL path is malformed.

### Fix

Tell the user. Automated saves through MCP are rarely the right tool; this is usually a manual user action. Don't loop trying alternate paths.

## When all else fails

Follow step 5 in this topic: capture `get_screenshot` if helpful, then stop with what you tried, verbatim tool output, your best hypothesis, and a minimal failing script if you have one. Don't keep iterating blindly.
