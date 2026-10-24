# get_guide: use

General guide for Sketch document operations through MCP. Before using this guide, call `get_guide` with `topic: "mcp"` or otherwise ensure the `mcp` parent guidance is loaded. That parent owns MCP prerequisites, safe `run_code` composition, screenshots, failure handling, and completion rules.

Use related subtopics for deep dives: `layout`, `styling`, `symbols`, `assets`, and `prototyping`.

# Sketch MCP Use

Use this for the "how do I do this in Sketch?" part of MCP work: inspect layers, create and update document content, use Stacks, apply styles, handle symbols and overrides, export assets, and wire prototypes.

Always call `get_guide` with `topic: "mcp"` before calling MCP tools. The `mcp` topic owns prerequisites, safe `run_code` composition, validation, failure handling, and troubleshooting.

## References

Call these topics on demand only.

- call `get_guide` with `topic: "layout"`: stack order, sizing, and responsive composition.
- call `get_guide` with `topic: "symbols"`: overrides, including image overrides and nested-symbol instances.
- call `get_guide` with `topic: "styling"`: Color Variables, shared styles, corners, borders, blurs, masks, and tints.
- call `get_guide` with `topic: "assets"`: file export via `sketch.export`, SVG import, and direct Image layers.
- call `get_guide` with `topic: "prototyping"`: flow connections, HotSpot layers, and prototype entry points.

## Product and API terminology

Use current Sketch product terms in user-facing conversation and map them to the public JavaScript API when writing code:

- Frame and Graphic are `Group.Frame` and `Group.Graphic`. `Artboard` is a legacy API term retained for compatibility; use `page.canvasLevelFrames` to enumerate canvas-level frame containers, including Symbol Sources.
- Color Variable is `Swatch` in the API and appears in `document.swatches`.
- Component and Symbol Source are `SymbolMaster`; Component instance is `SymbolInstance`.
- Stack is `stackLayout`. Smart Layout is a separate legacy symbol-layout feature.
- Frame Template and Graphic Template are `frameTemplates` and `graphicTemplates`.

`layer.type` reports `Artboard` for a canvas-level Frame or Graphic and `Group` for a nested Frame, nested Graphic, or plain Group. Symbol Sources report `SymbolMaster`. Use `isGraphicFrame` and then `isFrame` to distinguish container traits because a Graphic reports both as true.

## Core Approach

1. Resolve the target document/layer with the guide's target-resolution rules.
2. Gather current structure before mutating. Log IDs, parents, child counts, layout, style, and symbol details that make the next edit safe.
3. Reuse document or library assets first: templates, symbols, shared styles, Color Variables, and existing stack patterns.
4. Prefer Stacks for structured layout over manual pixel pushing.
5. Apply content edits through the guide's incremental edit and screenshot loop. Keep each `run_code` script small, flat, and single-purpose — see `get_guide` with `topic: "mcp"` section Script size and complexity.
6. Keep symbol masters on the document's symbol page when creating symbols; keep instances on working pages.

## Discover Reuse Opportunities

Before creating or changing significant visual structures:

1. Call `get_libraries`. Each library reports `hasSymbols`, `hasSwatches`, `hasLayerStyles`, and `hasTextStyles` hints.
2. Call `get_design_assets` for the needed `symbol`, `swatch`, `textStyle`, `layerStyle`, `frameTemplate`, or `graphicTemplate` kind. Use the case-insensitive `nameContains` filter for large result sets and `sourceLibraryID` when the user named a library.
3. Look for document or library templates / starter frames that are a close fit before creating a blank frame.
4. Prefer library symbol instances and shared assets over duplicate ad hoc layers.

Without `sourceLibraryID`, `get_design_assets` searches available libraries first and the local document last. Results are grouped by source and include usage snippets; remove any comments from a suggested snippet before submitting it to `run_code`.

When you introduce repetition (two or more visually similar or intentionally synced structures), factor toward symbol masters + instances rather than copying raw layers. Either use a library symbol or plan to create a document symbol once the pattern stabilizes. The canonical way to turn an existing frame into a master is `sketch.SymbolMaster.fromFrame(frame)`. The instance comes from `master.createNewInstance()`.

## Inspect Sketch Content

Start with dedicated read-only tools before writing custom probes:

1. Call `get_document_info` for the document ID, pages, page layer counts, and top-level Frames/Graphics with positions and dimensions.
2. Call `get_layer_tree_summary` on the relevant page, Frame, or layer for hierarchy, IDs, names, dimensions, text snippets, symbol-instance override counts, and stack hints.
3. Use targeted `run_code` probes only for details those tools do not expose, such as exact style values, pins/sizing, masks, symbol master IDs, override-capable layers, or custom geometry checks.

`get_layer_tree_summary` lists children topmost-first, uses its own compact type names (`Symbol`, `Instance`, `Hotspot`, and others), and does not recurse into a Graphic's children. A Graphic shown without children is not necessarily empty. Its `depth` defaults to 3 and is clamped to 1...10; `… N children` means the subtree was truncated. Re-query the node or use a targeted `run_code` probe when its contents matter.

For large trees:

1. Shallow map first with `get_document_info` and `get_layer_tree_summary` at a limited depth.
2. Deep-dive only the critical child subtrees by calling `get_layer_tree_summary` with their IDs or a larger depth.
3. Use `run_code` only after required nodes are identified and you need properties unavailable in the summaries.

## Create and Place Layers

Follow the guide's Placement Across Scripts rule for page roots and siblings.

The Sketch JavaScript API applies layer-appropriate defaults when you create new layers. Trust those defaults for new MCP-generated content unless the user or task asks for something different. Do not overwrite existing document or user-chosen values to match automation habits.

1. Borders: New borders on Frames default to `Inside`; Text defaults to `Outside`. You do not need to set `position` unless you want `Center` or another value. Closed shape paths also default to `Inside` when borders are added via the API.
2. Frame backgrounds: Canvas-level Frames and Graphics get a default background fill when inserted on a Page; empty nested Frames get one at creation. This matches normal Sketch behavior — treat it as intentional for new screens. For transparent structural containers (layout wrappers, stack parents, clipping shells), pass `background: { enabled: false }` at creation instead of clearing fills after insert.
3. Typography extras: On new text you style, avoid setting `kerning`, `lineHeight`, `paragraphSpacing`, etc. unless the spec requires them — these properties interact and can reset each other. Leave inherited typography alone on existing layers.

For the full styling surface, call `get_guide` with `topic: "styling"`.

## Layout and Stacks

Stacks are the default for structured layout. Whenever siblings form rows, columns, toolbars, lists, cards, or anything that must resize responsively, model them as Stacks (`stackLayout` on `Group` / `Group.Frame`) rather than manual pixel pushing.

Quick reference:

- `direction`: `sketch.StackLayout.Direction.Column|Row`
- `justifyContent`: `Start|Center|End|Between|Around|Evenly`
- `alignItems`: `Start|Center|End|Stretch|None`
- `gap`: number
- `padding`: number | `{ vertical, horizontal }` | `{ top, right, bottom, left }`
- Wrapping: `wraps`, `alignContent`, `crossAxisGap`
- Layering: `stackingOrder` (`FirstOnTop` or `LastOnTop`)
- Border sizing: `bordersAffectLayout`
- Child constraints: `minSize`, `maxSize`, `percentageSize`

Layer list order differs from how a Stack is drawn:

- Main-axis packing is reversed: highest index is placed at the start (row: left; column: top), and index `0` is placed at the end.
- To draw `1 | 2 | 3` left-to-right, put `1` at index `2`, `2` at `1`, and `3` at `0`.
- `stackingOrder` changes which overlapping Stack child is drawn and hit-tested on top; it does not change packing positions or Layer List order. With the default `FirstOnTop`, higher indices are on top; with `LastOnTop`, lower indices are on top.
- After adding, reparenting, or changing child `index` in a Stack, call `stack.stackLayout.apply()`.
- Screenshot-verify after reorder and log `{ name, index }` if wrong.

Details: call `get_guide` with `topic: "layout"`.

## Styling

- Prefer Color Variables/shared styles over hardcoded colors (`document.swatches`, `document.sharedLayerStyles`, `document.sharedTextStyles`).
- Prefer library-backed components/styles where available.
- Treat Frames, Stacks, and Graphics as the primary container model.

Deep dive: call `get_guide` with `topic: "styling"`.

## Symbols and Overrides

When symbol instances are involved:

1. Call `get_symbol_overrides` first.
2. Apply overrides using the `commonOverrideIDPrefix` returned by the tool, not by matching `affectedLayer.name`:
  ```javascript
   var id = commonOverrideIDPrefix + '_' + 'stringValue';
   instance.overrides.find(function (o) { return o.id === id; }).value = 'Hi';
  ```
3. For nested-symbol overrides, use `instance.overridesForExpandedLayer(nestedLayer)` to map an `expandedLayers` node to its overrides safely.
4. Keep nested symbols live when design-system propagation matters. Do not flatten, rasterize, export/reimport, or replace nested symbols with images unless the user accepts losing updates from the source symbol.
5. Validate post-change behavior with a screenshot.

When creating symbol masters in the document:

1. Collect masters on one dedicated page — use it or create the document Symbols page:
   ```javascript
   var symbolsPage = sketch.Page.getSymbolsPage(document);
   if (!symbolsPage) {
     symbolsPage = sketch.Page.createSymbolsPage();
     symbolsPage.parent = document;
   }
   ```
2. Keep instances on working pages.
3. Avoid leaving new masters scattered on arbitrary pages after iteration.

Deep dive: call `get_guide` with `topic: "symbols"`.

## Export and Assets

Use `sketch.export` with absolute `output` plus explicit `filename`, and log full paths in JSON. Use `get_screenshot` for images in MCP responses; do not return export buffers from `run_code`.

Do not export from symbol instance `expandedLayers`. If overrides matter, screenshot the instance; otherwise export a stable document layer or source asset.

Deep dive: call `get_guide` with `topic: "assets"`.

## Prototyping

Use the public API for flow connections, HotSpot layers, and prototype entry points. Validate links and screenshot the affected frame after changes.

Deep dive: call `get_guide` with `topic: "prototyping"`.

## Content Verification

Use after the guide's screenshot loop for any Sketch content change.

- Spacing: gaps intentional, rhythm consistent.
- Alignment: shared lanes, centers, baselines.
- Typography: readable, unclipped, balanced.
- Color: Color Variables and shared styles are consistent.
- Clipping/overflow: masks, symbols, text.
- Backgrounds: canvas Frames have fills when intended; structural nested Frames stay transparent when that's the design.
- Shape integrity: vectors, masks, images after resize.
- Stack order: matches intent; screenshot after reorder.
- Scaling: text, vectors, nested symbols.
- Symbol state: overrides and nested updates.
- Structure: target IDs still valid, edits stayed in scope, parent/child context is current, and repeated content uses symbols/library assets when warranted.

## Common Content Mistakes

- Skipping `get_libraries` / `get_design_assets` before creating reusable UI.
- Building rows, lists, and toolbars with manual coordinates instead of Stacks.
- Reordering with `parent.layers = [...]`; use `layer.index` + `stackLayout.apply()`.
- Editing symbol overrides by layer name instead of `commonOverrideIDPrefix`.
- Flattening nested symbols when propagation matters.
- Hardcoding colors when document Color Variables or shared styles exist.
- Creating new root Frames at `(0, 0)` without measuring existing page roots.
- Leaving repeated, intentionally synced structures as raw duplicate layers.

## Troubleshooting

### Wrong layer / wrong target was edited

Symptoms:

- Edits appeared on a sibling or unrelated layer.
- Selection-based scripts hit a different layer than the user expected.

Recovery:

1. Stop further edits immediately.
2. Tell the user to Undo in Sketch.
3. Re-resolve the target with an explicit ID (share link or `sketch.find('#' + id, doc)[0]`), not by name or selection.
4. Confirm with the user before retrying.

Name-based resolution is fine for discovery but never for mutation without ID confirmation.

# Included Reference: Find Predicates

This reference is included in `use` because target discovery and content inspection are part of the general Sketch document workflow.

# `sketch.find` predicates — deep dive

Use after calling `get_guide` with `topic: "mcp"`, section "Resolve Target Document and Layer", when a single `#id` lookup isn't enough, or when a parser error mentions the find call.

`sketch.find(predicate, root)` returns an array of layers under `root` (defaults to the current document) that match `predicate`.

## Predicate grammar

A predicate is a comma-separated list of clauses; all clauses must match for a layer to be returned (the comma is "AND", not "OR"). Each clause is one of:

- `#<uuid>`: The single layer whose `id` equals `<uuid>`
- `<TypeName>`: All layers whose type is `<TypeName>` (see Types)
- `*`: All layers (`TRUEPREDICATE`)
- `[<attribute><op><value>]`: All layers where `<attribute>` matches `<value>` per `<op>`
- `:locked`, `:hidden`, `:selected`: Boolean shorthand (negated as `:not-locked`, etc.)

Examples:

```javascript
sketch.find('#' + id, doc);
sketch.find('Text', doc);
sketch.find('[name="Avatar"]', doc);
sketch.find('Frame, [selected=true]', doc);
sketch.find('Group, [name~*="card"], [frame.x>=24]', doc);
sketch.find(':hidden', doc);
```

## Operators

- `=`: Exact equal
- `!=`: Not equal
- `~=`: Case-insensitive wildcard match (`*` and `?`)
- `*=`: Substring (case-sensitive)
- `~*=`: Substring (case-insensitive)
- `^=`: Starts with
- `$=`: Ends with
- `>=`, `<=`, `>`, `<`: Numeric comparisons

`~=` uses `LIKE` semantics, so wildcards are `*` and `?` — not regex. To match "name contains 'foo' (case insensitive)" use `[name~*="foo"]`, not `[name~="*foo*"]` (the latter works but is needlessly heavy).

Values can be:

- single-quoted: `[name='My Frame']`
- double-quoted: `[name="My Frame"]`
- unquoted (parsed as boolean or number): `[selected=true]`, `[frame.x>0]`

## Attributes

- `id` — string. Same as `#uuid` shorthand
- `name` — string. The layer's `name`
- `frame` — rect. Rarely useful as a whole; prefer the sub-keys below
- `frame.x`, `frame.y`, `frame.width`, `frame.height` — number. In the layer's parent coordinate space
- `locked` — boolean. `:locked` shorthand also available
- `hidden` — boolean. True when `isVisible == false`. `:hidden` shorthand available
- `selected` — boolean. `:selected` shorthand available
- `type` — type token. See Types
- `style.fills.color` — hex string. Matches if any enabled fill has a color fuzzily equal to the value. Only `=` and `!=` are supported. Example: `[style.fills.color='#ff0000']`

Unknown attributes throw `unknown attribute <name>`. Operators outside the list throw `unknown operator <op>`.

## Types

Recognized type tokens (`<TypeName>` clause and `[type=...]`):

- `Group` — non-canvas Group wrappers other than Symbol Sources, including nested Frames and Graphics
- `Frame` — all frame-trait groups, including Graphics and Symbol Sources
- `Graphic` — all graphic-trait groups, including graphic Symbol Sources
- `Artboard` — legacy: matches every canvas-level frame, including Symbol Sources; kept for backwards compatibility. Prefer `page.canvasLevelFrames` for those layers.
- `SymbolMaster`, `SymbolInstance`
- `Image`, `Shape`, `ShapePath`, `Slice`, `Text`, `HotSpot`, `Page`

Notes:

- `Artboard` is not a current product type. The legacy predicate returns every canvas-level frame for compatibility.
- `Group` is broad because nested Frames and Graphics are backed by group objects. Inspect `isGraphicFrame` before `isFrame` when you need to distinguish traits; Graphics also report `isFrame`.
- Combining `Frame, [name~*="hero"]` is the common way to target one specific top-level frame on a page.

## Worked queries

```javascript
const sketch = require('sketch');
const doc = sketch.getSelectedDocument();

var frames = sketch.find('Frame', doc.selectedPage);

var instances = sketch.find('SymbolInstance, [selected=true]', doc);

var titles = sketch.find('Text, [name~*="title"], :not-hidden', doc);

var id = '<LAYER-UUID>';
var target = sketch.find('#' + id, doc)[0];

var rightFrames = sketch.find('Frame, [frame.x>300]', doc.selectedPage);

var reds = sketch.find('[style.fills.color="#ff0000"]', doc);
```

## Search scope

The second argument is the root:

- a `Document` (default) — searches every page
- a `Page` — that page only
- any `Group`/`Frame`/`Graphic` — its descendants
- with `{ inclusive: true }` as third option, the root is included in the candidates

```javascript
sketch.find('Frame', doc.selectedPage);
sketch.find('[name="Header"]', someFrame, { inclusive: true });
```

## What's not supported

- Logical OR: there's no `|` clause. Comma is AND. Run two `find` calls and concatenate if you need a union.
- Regex: only `LIKE`-style wildcards (`*`, `?`) via `~=`.
- Sub-selectors / descendant combinators (`Frame > Text` is not supported).
- Style properties beyond `style.fills.color`: borders, shadows, blurs are not queryable via predicates — `find` candidates first by type/name, then filter in JS.
