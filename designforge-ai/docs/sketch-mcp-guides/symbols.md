# get_guide: symbols

This is a subtopic for symbols/overrides/nested symbols/library symbols/image overrides. If you have not already loaded the parent topic, call `get_guide` with `topic: "use"` first. The `use` topic also requires the `mcp` topic to be loaded before any Sketch MCP tool call.

# Symbol overrides — deep dive

Use after calling `get_guide` with `topic: "use"`, section "Symbols and Overrides", when you need full property coverage, nested-symbol patterns, or are debugging an override that "has no effect".

## Override identity model

Every Override on a SymbolInstance has:

- `id`: Full path of the form `<nested-instance-id>/.../<affected-layer-id>_<property>`. Only the trailing property is separated with `_`; path components are separated with `/`, and the host SymbolInstance ID is not included. Use the ID instead of a layer name and re-fetch it after the Symbol Source structure changes.
- `property`: One of the supported override attributes below.
- `affectedLayer`: The inner Layer the override targets (may live inside a nested symbol).
- `path`: The ancestry-aware override path, used by `overridesForExpandedLayer` to disambiguate duplicate inner IDs.
- `value` / `defaultValue`: Typed by `property` (string, color, image data, Color Variable, …).
- `isDefault`, `editable`, `selected`: Flags; `editable: false` means the master locked this override.
- `symbolOverride`, `colorOverride`, `textOverride`, `imageOverride`: Read-only booleans for classifying an override without inferring from its property name.

Always prefer matching by `id` over `affectedLayer.name`. Names are ambiguous and can change; re-fetch IDs whenever the Symbol Source structure changes.

## The `commonOverrideIDPrefix` pattern (preferred)

`get_symbol_overrides` returns one `commonOverrideIDPrefix` per affected layer group. Build the override `id` by appending `_` + the property name:

```javascript
const sketch = require('sketch');
const doc = sketch.getSelectedDocument();
var instanceId = 'INSTANCE-UUID';
var prefix = '<commonOverrideIDPrefix from get_symbol_overrides>';
var instance = sketch.find('#' + instanceId, doc)[0];
var override = instance.overrides.find(function (o) {
  return o.id === prefix + '_' + 'stringValue';
});
if (override) {
  override.value = '<new label text>';
}
console.log(JSON.stringify({
  ok: !!override,
  overrideId: override && override.id,
  newValue: override && String(override.value).slice(0, 80),
}));
```

If `find` returns `undefined`, either the prefix is stale (the master changed) or the property isn't an override on that layer — re-fetch `get_symbol_overrides`.

## Override property reference

Returned by `get_symbol_overrides`; the value types are what you assign to `override.value`:

- `stringValue` (`string`): Text content of a Text layer
- `textStyle` (shared text style id (`string`)): `get_symbol_overrides` annotates with `<name>`
- `layerStyle` (shared layer style id (`string`)): Same
- `textSize` (point size as `string`): e.g. `"14"`
- `textWeight` (`object` or legacy `string`): Preserve the value shape returned by `get_symbol_overrides` when modifying it
- `textColor` or `textColor:<location>-<length>` (`Swatch` (preferred) or `#hex` string): Use a Color Variable from `document.swatches` or an imported library
- `textDecoration`: `"none" | "underline" | "strikethrough"`
- `textHAlign`: `sketch.Text.Alignment.*`
- `fillColor` (`Swatch` (preferred) or `#hex`): The tint color of a Group or Frame
- `color:fill-N`, `color:border-N`, `color:shadow-N`, `color:innershadow-N` (`Swatch` (preferred) or `#hex`): `N` is the zero-based index of the style part
- `blendMode:fill-N`, `blendMode:border-N` (`number`): Blend mode of the indexed fill or border
- `opacity:fill-N`, `opacity:border-N` (`number`): Opacity of the indexed fill or border
- `symbolID` (symbol master id (`string`)): Swaps the nested symbol for another master
- `image` (`{ path: '/abs/path.png' }` or `{ base64: '...' }`): Replaces an Image layer's content
- `imageResizeBehavior` (`0` | `1` | `2` | `3`): `0` Stretch, `1` Original, `2` Fit, `3` Fill
- `isVisible` (`boolean`): Hides/shows a nested layer
- `preservesSpaceWhenHidden` (`boolean`): Keeps or removes the hidden layer's layout space
- `flowDestination` (`string`): Target Frame ID or `back` for a prototype connection
- `horizontalSizing`, `verticalSizing`: `sketch.FlexSizing.Fixed|Fit|Fill|Relative`

## Color Variables in color overrides

When the property is a color (`textColor`, `color:fill-0`, …):

```javascript
var swatch = doc.swatches.find(function (s) { return s.name === 'Brand/Primary'; });
override.value = swatch;
```

Assign `override.swatchValue = swatch` instead of `override.value = swatch` when you want to make the linked value explicit. A raw hex assignment such as `override.value = '#575fff'` is only a fallback when no Color Variable exists.

`Override.swatchValue` and `Override.defaultSwatchValue` give you back the linked Color Variable as an API `Swatch` (or `undefined` if the override is set to a raw color). Useful for `console.log` audits:

```javascript
console.log(JSON.stringify({
  current: { type: typeof override.value, value: String(override.value).slice(0, 80) },
  swatch: override.swatchValue ? { id: override.swatchValue.id, name: override.swatchValue.name } : null,
}));
```

Library Color Variables: fetch with `library.getImportableSwatchReferencesForDocument(doc).find(...)`, then import and use on the same line:

```javascript
override.swatchValue = ref.import();
```

The `get_design_assets` usage instructions require importing and assigning the result on the same statement; splitting the import can lose the reference.

## Image overrides

Choose one image source per assignment: an absolute file path or base64 data.

```javascript
var path = '/tmp/assets/logo.png';
override.value = { path: path };

override.value = { base64: 'iVBORw0KGgo...' };
```

If the override also exposes `imageResizeBehavior`, set it explicitly — defaults often render incorrectly when the source aspect ratio differs from the layer slot:

```javascript
var resize = instance.overrides.find(function (o) {
  return o.id === prefix + '_' + 'imageResizeBehavior';
});
if (resize) resize.value = 2;
```

Image resize behavior `2` means Fit: the replacement image stays within the slot and preserves its aspect ratio.

## Nested-symbol overrides

`SymbolInstance.expandedLayers` returns an immutable snapshot of the instance's rendered tree. Do not mutate it directly. To find the override(s) for a nested layer, use `overridesForExpandedLayer`, which keeps track of the nested ancestry and disambiguates duplicate inner IDs:

```javascript
const sketch = require('sketch');
const doc = sketch.getSelectedDocument();
var instance = sketch.find('#' + instanceId, doc)[0];

function walkNested(nested, hostInstance) {
  if (nested.hidden) return;

  var avail = hostInstance.overridesForExpandedLayer(nested);
  avail.forEach(function (o) {
    console.log(JSON.stringify({
      layerId: nested.id,
      overrideId: o.id,
      property: o.property,
      value: String(o.value).slice(0, 80),
    }));
  });

  if (nested.layers) {
    nested.layers.forEach(function (child) { walkNested(child, hostInstance); });
  }
}

instance.expandedLayers.forEach(function (n) { walkNested(n, instance); });
```

`nested.isNestedSymbol === true` lets you spot the boundary between the outer symbol and a nested-instance subtree if you need to handle them differently.

## Diagnosing "my override has no effect"

1. Re-fetch `get_symbol_overrides` — the prefix you cached may be stale.
2. Check `override.editable === true`. Designers can lock individual overrides at the master.
3. Confirm the property type in the list above — passing a `string` to an `image` override silently does nothing.
4. For colors: if the Symbol Source is using a Color Variable and you set a raw hex, the value sticks but the variable link is broken (`override.swatchValue` becomes `undefined`). Use a `Swatch` instead.
5. For library imports: confirm the `ref.import()` happens on the same statement as the assignment. Splitting it sometimes drops the reference.
6. Screenshot the instance — sometimes the override is applied but a parent stack/sizing change is masking the result.
7. Resetting: `override.reset()` returns the override to its default. Useful when sanity-checking that you've targeted the right one.

## Creating new instances and masters

```javascript
const sketch = require('sketch');
const doc = sketch.getSelectedDocument();

var frame = sketch.find('#' + frameId, doc)[0];
var master = sketch.SymbolMaster.fromFrame(frame);

var instance = master.createNewInstance();
instance.parent = somePage;
instance.frame = { x: 0, y: 0, width: master.frame.width, height: master.frame.height };

var existingMaster = doc.getSymbolMasterWithID('SYMBOL-ID');
var alsoInstance = existingMaster.createNewInstance();

doc.getSymbols().forEach(function (m) {
  console.log(JSON.stringify({ id: m.id, name: m.name }));
});
```

`instance.master` returns the linked master; `instance.symbolId` is its id. Swap masters with `instance.symbolId = otherId` (the instance must already be in a page).

## Importing library symbols

```javascript
const sketch = require('sketch');
var library = sketch.Library.getLibraries().find(function (l) { return l.id === LIB_ID; });
var ref = library.getImportableSymbolReferencesForDocument(doc).find(function (r) {
  return r.name === 'Button/Primary';
});
var imported = ref.import().createNewInstance();
imported.parent = doc.selectedPage;
```

After insertion, query `get_symbol_overrides` on the new instance ID to discover what's customisable.

## When to detach (rarely)

`instance.detach()` replaces the instance with a regular Group. Only do this when the user explicitly wants to lose live connection to the master. For recursive detach (including nested symbols), pass `{ recursively: true }`:

```javascript
var asGroup = instance.detach({ recursively: true });
```

Don't detach as a workaround for "I couldn't figure out the override" — go back to `get_symbol_overrides` first.

## Resizing instances with smart layout

```javascript
instance.frame = { ...instance.frame, width: 240 };
instance.resizeWithSmartLayout();
```

This is the supported way to trigger reflow when you change an instance's frame; assigning `frame` alone does not always re-run layout.
