# get_guide: assets

This is a subtopic for exports/screenshots/assets/SVG import/image layers. If you have not already loaded the parent topic, call `get_guide` with `topic: "use"` first. The `use` topic also requires the `mcp` topic to be loaded before any Sketch MCP tool call.

# Export and assets — deep dive

Use after calling `get_guide` with `topic: "use"`, section "Export and Assets", when you need full `sketch.export` options, are writing assets to disk, importing SVG, or assigning images to layers. For image bytes in MCP responses, use `get_screenshot` — do not return export buffers from `run_code`.

When creating new UI, use placeholder rectangles or image slots until the layout is stable. Import, generate, export, or assign real image assets only after the surrounding containers, spacing, and stack order have passed screenshot validation.

## `sketch.export` signature

```javascript
sketch.export(objectOrArray, options)
```

`objectOrArray` is a layer, an array of layers, a page, or an array of pages. `options` is a dictionary. In MCP workflows, always set `output` to an absolute directory path so files land on disk — project assets dir, or a temp folder (e.g. `/tmp/sketch-exports`) when you only need a short-lived handoff. Do not use `output: false` or omit `output` to return buffers from `run_code`.

### Options

- `output` — absolute path string (required in MCP). Default: `~/Documents/Sketch Exports`. Directory where files are written (project path or temp). Use an absolute path because relative paths use Sketch's process working directory rather than the agent shell's current directory. Omit or set `false` only in non-MCP plugin scripts — not in `run_code`.
- `filename` — optional string. Sketch strips any supplied extension and applies the selected export format's extension. When omitted, the name comes from the layer plus any export-format prefix or suffix.
- `formats` — array or comma-separated string. Default: `['png']`. Raster: `'png'`, `'jpg'`, `'gif'`, `'webp'`, `'heic'`, `'tif'`, `'tiff'`. Vector: `'svg'`, `'pdf'`. Model dump: `'json'`. Multiple formats produce multiple files when `output` is set.
- `scales` — array of numbers (as strings). Default: `['1.0']`. `['1.0', '2.0', '3.0']` for `@1x/@2x/@3x`
- `exportFormats` — array of export-format objects with `fileFormat`, `size`, and optional `prefix` or `suffix`. For image exports, a non-empty array defines the export requests instead of `formats` and `scales`; pass `layer.exportFormats` to preserve a layer's export presets. Sizes use values such as `'2x'`, `'320w'`, or `'180h'`.
- `use-id-for-name` — boolean. Default: `false`. Use layer `objectID` instead of `name` in filenames. When `true`, this takes precedence over `filename`.
- `overwriting` — boolean. Default: `false`. Allow replacing an existing output. Set it to `true` for deliberate reruns. Do not rely on `false` to protect binary raster files: the current native existence check reads the target as UTF-8, so it does not recognize those files as existing.
- `trimmed` — boolean. Default: `false`. Trim transparent space from raster exports
- `compact` — boolean. Default: `false`. SVG: produce more compact output
- `include-namespaces` — boolean. Default: `false`. SVG: include extra attributes
- `save-for-web` — boolean. Default: `false`. PNG: strip color profile and metadata
- `compression` — number `[0..1]`. Default: `1.0`. JPG: 0 = max compression, 1 = max quality
- `progressive` — boolean. Default: `false`. JPG: progressive encoding
- `group-contents-only` — boolean. Default: `false`. Group: export only the bounding rectangle of children

### Safe export pattern (file on disk)

```javascript
const sketch = require('sketch');
const doc = sketch.getSelectedDocument();
var layerId = '<LAYER-UUID>';
var output = '/absolute/path/to/project/public/assets';
var variants = [
  { filename: 'icon-apple.png', scale: '1.0' },
  { filename: 'icon-apple@2x.png', scale: '2.0' },
  { filename: 'icon-apple@3x.png', scale: '3.0' },
];

var layer = doc && sketch.find('#' + layerId, doc)[0];
if (!layer) {
  console.log(JSON.stringify({ ok: false, error: 'NOT_FOUND', layerId: layerId }));
} else {
  variants.forEach(function (variant) {
    sketch.export(layer, {
      output: output,
      filename: variant.filename,
      formats: ['png'],
      scales: [variant.scale],
      overwriting: true,
    });
  });
  console.log(JSON.stringify({
    ok: true,
    output: output,
    files: variants.map(function (variant) { return variant.filename; }),
  }));
}
```

An explicit `filename` is reused for every scale in one export call, so export one scale per filename when you need deterministic `@2x` and `@3x` names. Alternatively, omit `filename` and let Sketch derive names and scale suffixes from the layer and export formats.

Verify with the shell (`ls`) after the `run_code` call so path, permission, and naming mistakes are caught. Log the output directory and filenames in JSON so the agent or shell can read them next.

For one-off exports, create the temp dir in the shell first if needed (`mkdir -p /tmp/sketch-exports`), then point `output` there.

### JSON export (model inspection)

```javascript
sketch.export(layer, {
  output: '/absolute/path/to/dump',
  formats: ['json'],
  overwriting: true,
});
console.log(JSON.stringify({ ok: true, file: layer.name + '.json' }));
```

JSON exports use the layer name, or its object ID when `use-id-for-name: true`; the `filename` option is not used for JSON. Multiple formats can be mixed when `output` is set. When `output` is omitted or false, exactly one format is allowed.

WebP exports cannot exceed 16383 pixels on either axis after scaling. Use a smaller scale or another raster format for larger output.

## Images in MCP responses

Use `get_screenshot` (`targetDocumentID` + `layerID`) for visual verification and any image the agent must inspect. Smaller PNGs are returned inline; a large PNG is saved to a temporary file and returned as an absolute path.

For handoff assets (icons, logos, bitmaps for code), export to disk with `sketch.export` and log the absolute path in JSON; read the files from the shell or copy into the project. A temp directory is fine when you are not committing assets yet.

## Image overrides on instances

SymbolInstance image overrides belong to the `symbols` topic. Call `get_guide` with `topic: "symbols"`, fetch a fresh `commonOverrideIDPrefix` with `get_symbol_overrides`, and use its guarded image-override recipe.

## Assigning images to Image layers directly

For an Image layer that isn't a symbol instance, choose one source per assignment: an absolute file path or base64 data.

```javascript
imageLayer.image = { path: '/absolute/path/image.png' };
imageLayer.image = { base64: 'iVBOR...' };
```

The Image layer's frame doesn't change automatically — set `imageLayer.frame` to match the desired aspect.

## Importing SVG as a new layer

```javascript
const sketch = require('sketch');
const doc = sketch.getSelectedDocument();
var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">'
        + '<circle cx="12" cy="12" r="10" fill="#575fff"/>'
        + '</svg>';
var layer = sketch.createLayerFromData(svg, 'svg');
layer.parent = doc.selectedPage;
layer.frame = { x: 0, y: 0, width: 24, height: 24 };
console.log(JSON.stringify({ ok: true, id: layer.id, type: layer.type }));
```

`createLayerFromData` accepts `svg`, `pdf`, `eps`, and `bitmap`. SVG produces a `Group`; bitmap produces an `Image`; PDF and EPS use their native importers. For an existing file-backed Image layer, assign `image = { path }`.

## Troubleshooting exports

### Export produced no file or empty file

1. Make `output` absolute.
2. Pass `filename` when you need a deterministic base name; its extension is optional because the export format supplies it.
3. For an existing SVG or JSON file, set `overwriting: true`. Binary raster outputs currently overwrite an existing path even when this option is `false`.
4. Create missing parent directories with shell `mkdir -p` before the export call.
5. Do not export from a symbol instance's `expandedLayers`. Screenshot the instance when rendered overrides matter, or export a stable document layer.

After every export, verify with the shell:

```bash
ls -la "/abs/out/dir"
```

## Common pitfalls

- `fs is not a core package` — Sketch's JS runtime doesn't expose Node's `fs`. Don't try to write files from within `run_code`; use `sketch.export` or have the agent shell out separately.
- `scales` as numbers vs strings — Both forms are accepted, but `['2.0']` is the documented shape; integers also work (`[2]`).
- `output: false` / buffer return in `run_code` — Not for MCP. Use `get_screenshot` for images; use `sketch.export` with an absolute `output` + `filename` for assets on disk.

## Quick recipes

```javascript
const sketch = require('sketch');
const doc = sketch.getSelectedDocument();
var sel = doc && doc.selectedLayers.layers[0];
if (!sel) {
  console.log(JSON.stringify({ ok: false, error: 'NO_SELECTION' }));
} else {
  var filename = sel.name + '@2x.png';
  sketch.export(sel, {
    output: '/Users/me/Desktop/exports',
    filename: filename,
    formats: ['png'],
    scales: ['2.0'],
    overwriting: true,
  });
  console.log(JSON.stringify({ ok: true, file: filename }));
}
```

```javascript
const sketch = require('sketch');
const doc = sketch.getSelectedDocument();
var frames = doc.selectedPage.canvasLevelFrames;
frames.forEach(function (f) {
  sketch.export(f, {
    output: '/abs/out',
    filename: f.name + '.png',
    formats: ['png'],
    overwriting: true,
  });
});
console.log(JSON.stringify({ ok: true, count: frames.length }));
```
