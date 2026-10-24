# get_guide: styling

This is a subtopic for Color Variables/shared styles/fills/borders/corners/blurs/masks/typography. If you have not already loaded the parent topic, call `get_guide` with `topic: "use"` first. The `use` topic also requires the `mcp` topic to be loaded before any Sketch MCP tool call.

# Styling — deep dive

Use after calling `get_guide` with `topic: "use"`, section "Styling", when you need full coverage of Color Variables, shared styles, corners, per-side borders, blurs, glass, Fade, container tints, and masks.

Rule of thumb: prefer Color Variables and shared styles over hardcoded per-layer values. The public JavaScript API calls a Color Variable a `Swatch`. A layer that points at a Swatch updates everywhere when the Color Variable changes; a layer with a hex literal does not.

For reusable components, prefer library symbols/components before recreating styled layer groups by hand. Call `get_design_assets` for symbols and `get_guide` with `topic: "symbols"` when inserting or overriding symbol instances.

MCP-created layers: the Sketch JavaScript API already applies sensible border positions and Frame backgrounds at creation. The notes below cover what still needs explicit control. Do not restyle existing layers unless the user or task requires it.

## Deferred updates

Sketch 2026.2 and later defer propagation for Color Variables, Shared Styles, and concentric corners. After a batch of those changes, call `document.processPendingChanges()` before reading dependent style or geometry values in the same script. Do not call it after every individual property assignment.

## Document tokens

### Color Variables (`document.swatches`)

```javascript
const sketch = require('sketch');
const doc = sketch.getSelectedDocument();

doc.swatches.forEach(function (s) {
  console.log(JSON.stringify({ id: s.id, name: s.name, hex: String(s.color).slice(0, 9) }));
});

doc.swatches.push({ name: 'Brand/Primary', color: '#575fff' });

var swatch = doc.swatches.find(function (s) { return s.name === 'Brand/Primary'; });
swatch.color = '#3b48ff';
swatch.name = 'Brand/Primary 2';
doc.processPendingChanges();
```

`Swatch.color` is a hex-like string when read. Library Color Variables are immutable — update them in the source library and call `syncWithLibrary()`.

### Using Color Variables in styles

Color-bearing properties accept a `Swatch` directly, which keeps the link alive:

```javascript
layer.style.fills[0].swatch = swatch;
layer.style.borders[0].swatch = swatch;
layer.style.shadows[0].swatch = swatch;
layer.style.tint = { swatch: swatch };

textLayer.style.textSwatch = swatch;
```

Where the API only accepts a color string, pass `swatch.referencingColor`:

```javascript
layer.style.fills[0].color = swatch.referencingColor;
```

Plain hex (`'#575fff'`) works but breaks the Color Variable link — only fall back to it when no variable exists.

### Shared layer/text styles

```javascript
doc.sharedLayerStyles.forEach(function (s) {
  console.log(JSON.stringify({ id: s.id, name: s.name }));
});

var newStyle = { fills: [{ color: '#1a1a1a', enabled: true, fillType: sketch.Style.FillType.Color }] };
doc.sharedLayerStyles.push({ name: 'Surface/Card', style: newStyle });

var style = doc.sharedLayerStyles.find(function (s) { return s.name === 'Surface/Card'; });
layer.sharedStyle = style;

textLayer.style.fontSize = 14;
doc.sharedTextStyles.push({ name: 'Type/Body', style: textLayer.style });
```

Library-backed styles are imported via `library.getImportableLayerStyleReferencesForDocument(doc)` / `...TextStyleReferences...`, then `ref.import()` and assigned on the same statement.

## Fills

The color fill followed by a swatch assignment is one pattern. Replacing the fills with a gradient, clearing all fills, and disabling a Frame background are alternatives; choose only the operation the task needs. `group.background.enabled` is supported only when `group.isFrame` is `true` and silently has no effect on a plain Group.

```javascript
layer.style.fills = [{
  fillType: sketch.Style.FillType.Color,
  color: '#1a1a1a',
  enabled: true,
}];

layer.style.fills[0].swatch = swatch;

layer.style.fills = [{
  fillType: sketch.Style.FillType.Gradient,
  gradient: {
    gradientType: sketch.Style.GradientType.Linear,
    colorInterpolation: sketch.Style.GradientColorInterpolation.Oklab,
    from: { x: 0.5, y: 0 },
    to: { x: 0.5, y: 1 },
    stops: [
      { position: 0, color: '#ffffff' },
      { position: 1, color: '#000000' },
    ],
  },
  enabled: true,
}];

layer.style.fills = [];
group.background.enabled = false;
```

`FillType` values: `Color` | `Gradient` | `Pattern`.

Gradient `colorInterpolation` accepts `RGB`, `Oklab`, or `Oklch` from `sketch.Style.GradientColorInterpolation`; it defaults to `RGB`.

## Borders

Public `BorderPosition` values are `Inside`, `Center`, and `Outside`. `Both` exists as a Sketch-internal option and must not be used.

```javascript
layer.style.borders = [{
  color: '#454545',
  thickness: 1,
  position: sketch.Style.BorderPosition.Inside,
  enabled: true,
  fillType: sketch.Style.FillType.Color,
}];
```

### Per-side borders

The partial object, full object, and `null` assignments below are alternative forms. A partial object resets unspecified sides to the border's general `thickness`; `null` resets every side to that thickness and disables individual-side mode.

```javascript
var border = layer.style.borders[0];

border.thickness = 2;

border.sides = { top: 1, bottom: 2 };
border.sides = { top: 1, right: 1, bottom: 1, left: 1 };

border.sides = null;

console.log(JSON.stringify({ hasIndividualSides: border.hasIndividualSides }));
```

`border.sides = null` resets to single-thickness; `hasIndividualSides` reports the current mode.

## Corners

Corners live on `layer.style.corners`. Available styles:

- `Auto` (-1): Inherit from parent Frame's concentric corner system
- `Rounded` (0): Standard rounded corners
- `Smooth` (1): iOS-style smooth corners
- `Angled` (2): Beveled corner
- `InsideSquare` (3): Square inner cut
- `InsideArc` (4): Arc inner cut

```javascript
const sketch = require('sketch');
const doc = sketch.getSelectedDocument();
var layerId = '<LAYER-UUID>';
var layer = sketch.find('#' + layerId, doc)[0];
if (!layer) {
  console.log(JSON.stringify({ ok: false, error: 'NOT_FOUND', layerId: layerId }));
} else {
  var corners = layer.style.corners;
  corners.style = sketch.Style.CornerStyle.Smooth;
  corners.radii = [12, 12, 12, 12];
  corners.smoothing = 0.6;
  console.log(JSON.stringify({
    ok: true,
    radii: corners.radii,
    firstRadius: corners.radiusAt(0),
    smoothing: corners.smoothing,
  }));
}
```

The radii array is top-left, top-right, bottom-right, bottom-left. `radiusAt(0)` reads a corner; reassign `radii` to change one because there is no per-index setter. Assigning `radii` selects explicit-corners mode and disables `concentric`.

Use concentric mode instead when a descendant should derive its corners from an ancestor Frame and its inset. Sketch normally uses the nearest ancestor Frame whose own corners are not concentric; that Frame defines the result even when its radius is zero. To inherit through an intermediate Frame, enable concentric corners on that Frame too. Do not also assign `radii`, `style`, or `smoothing`: the deferred concentric update replaces those values with the ancestor-derived result.

```javascript
const sketch = require('sketch');
const doc = sketch.getSelectedDocument();
var childId = '<DESCENDANT-LAYER-UUID>';
var child = sketch.find('#' + childId, doc)[0];
if (!child) {
  console.log(JSON.stringify({ ok: false, error: 'NOT_FOUND', layerId: childId }));
} else {
  child.style.corners.concentric = true;
  doc.processPendingChanges();
  console.log(JSON.stringify({
    ok: true,
    concentric: child.style.corners.concentric,
    radii: child.style.corners.radii,
    smoothing: child.style.corners.smoothing,
  }));
}
```

A non-concentric zero-radius Frame still defines the result, so its descendant resolves to `[0]`. If every ancestor Frame is concentric, Sketch falls back to the nearest one; an orphaned concentric chain also resolves to `[0]`. Do not use `ancestor.style.corners` as a read-only existence check: on a mutable style, the getter materializes a default Corners object when none exists.

## Blurs

`layer.style.blurs` is an array of blur objects. `sketch.Style.BlurType` exposes five values: `Gaussian`, `Motion`, `Zoom`, `Background`, and `Glass`.

### Gaussian (the default)

```javascript
layer.style.blurs = [{
  enabled: true,
  blurType: sketch.Style.BlurType.Gaussian,
  radius: 8,
}];
```

### Motion

```javascript
layer.style.blurs = [{
  enabled: true,
  blurType: sketch.Style.BlurType.Motion,
  radius: 12,
  motionAngle: 45,
}];
```

`motionAngle` is interpreted in degrees.

### Zoom

```javascript
layer.style.blurs = [{
  enabled: true,
  blurType: sketch.Style.BlurType.Zoom,
  radius: 20,
  center: { x: 0.5, y: 0.5 },
}];
```

Zoom `center` uses unit-space coordinates, where `{ x: 0.5, y: 0.5 }` is the center of the layer bounds.

### Background

```javascript
layer.style.blurs = [{
  enabled: true,
  blurType: sketch.Style.BlurType.Background,
  radius: 16,
  saturation: 1.3,
}];
```

The shared `saturation` setter clamps values to `[0,2]`; the Background and Glass examples both use this property.

### Glass

```javascript
layer.style.blurs = [{
  enabled: true,
  blurType: sketch.Style.BlurType.Glass,
  radius: 24,
  brightness: 1.0,
  distortion: 0.4,
  depth: 0.5,
  chromaticAberration: 0.1,
  saturation: 1.0,
  hasSpecularHighlights: true,
}];
```

Glass clamps `brightness` to `[0,2]`, and `distortion`, `depth`, and `chromaticAberration` to `[0,1]`. Values outside these ranges are silently snapped to the nearest bound.

### Progressive blur

Any blur can be made progressive by attaching a gradient that drives alpha-by-progression:

```javascript
layer.style.blurs = [{
  enabled: true,
  blurType: sketch.Style.BlurType.Gaussian,
  radius: 20,
  progressive: true,
  gradient: {
    gradientType: sketch.Style.GradientType.Linear,
    from: { x: 0.5, y: 0 },
    to:   { x: 0.5, y: 1 },
    stops: [
      { position: 0, color: '#000000ff' },
      { position: 1, color: '#00000000' },
    ],
  },
}];
```

The blur strength follows the gradient's alpha along its direction.

## Fade

Sketch's Fade effect is `style.progressiveAlpha`. Assign a gradient whose stop alpha controls layer opacity, or assign `null` to remove the Fade:

```javascript
layer.style.progressiveAlpha = {
  gradientType: sketch.Style.GradientType.Linear,
  from: { x: 0.5, y: 0 },
  to: { x: 0.5, y: 1 },
  stops: [
    { position: 0, color: '#000000ff' },
    { position: 1, color: '#00000000' },
  ],
};

layer.style.progressiveAlpha = null;
```

## Container tint

A tint colors all contents of a container Group uniformly, including Frames and Graphics. The assignments below are alternatives: use a swatch when possible, use a color as a fallback, or assign `null` to clear the tint.

```javascript
frame.style.tint = { swatch: swatch };
frame.style.tint = { color: '#80000080' };
frame.style.tint = null;
```

## Shadows

```javascript
layer.style.shadows = [{
  enabled: true,
  color: '#00000040',
  x: 0,
  y: 4,
  blur: 12,
  spread: 0,
}];

layer.style.innerShadows = [{
  enabled: true,
  color: '#00000040',
  x: 0,
  y: 2,
  blur: 4,
  spread: 0,
}];
```

Use `shadows[i].swatch = swatch` to keep the color linked to a token.

## Masks

The mask system is layer-relational, not a style property:

```javascript
shape.masksSiblings = true;

overlay.breaksMaskChain = true;

console.log(JSON.stringify({
  isMasked: !!layer.closestMaskingLayer,
  masksSiblings: layer.masksSiblings,
  breaksMaskChain: layer.breaksMaskChain,
}));

var current = layer;
while (current && current.closestMaskingLayer) {
  console.log(JSON.stringify({ name: current.name, maskedBy: current.closestMaskingLayer.name }));
  current = current.closestMaskingLayer;
}
```

Masks work best inside a Group/Frame where the mask layer is the first sibling and subsequent siblings are masked by it.

## Style copy / shared style hygiene

To reuse styles across layers without creating a shared style:

```javascript
var sourceFills = sourceLayer.style.fills;
targetLayer.style.fills = sourceFills.map(function (fill) {
  var copy = fill.toJSON();
  var swatch = fill.swatch;
  if (swatch) copy.swatch = swatch;
  return copy;
});
```

Wrapped style parts expose their properties through prototype accessors, so object spread does not copy their style data. `toJSON()` produces plain importable values, while replacing its serialized Swatch with the wrapped source Swatch preserves a fill-level Color Variable link when both layers are in the same document. It does not preserve Color Variable links on gradient stops; for gradient fills, prefer a shared style or relink each copied stop to the corresponding wrapped source stop's Swatch. For a cross-document copy, resolve or import the corresponding Swatch in the target document instead.

When you find yourself doing this for two or more layers, convert to a shared style instead — it scales better and keeps tokens linked.

## Typography (text style)

```javascript
textLayer.style.fontFamily = 'Inter';
textLayer.style.fontSize = 14;
textLayer.style.fontWeight = 5;
textLayer.style.alignment = sketch.Text.Alignment.left;
textLayer.style.textColor = '#1a1a1a';
textLayer.style.textTransform = 'none';
textLayer.style.textUnderline = 'single';
textLayer.style.textStrikethrough = 'single';
```

`fontWeight` accepts `0...12`. `textTransform` accepts `none`, `uppercase`, or `lowercase`. When setting typography on new MCP-created text, avoid `kerning`, `lineHeight`, `paragraphSpacing` unless the spec requires them. Leave existing text layers as-is.

## Quick snippet for transparent structural Frames (MCP-created only)

Use when you need a layout wrapper, not a new screen. Canvas-level Frames on a Page get a default background automatically; opt out at creation:

```javascript
const sketch = require('sketch');
var f = new sketch.Group.Frame({
  parent: page,
  name: 'Container',
  frame: { x: 0, y: 0, width: 400, height: 600 },
  background: { enabled: false },
});
```
