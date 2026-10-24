# get_guide: layout

This is a subtopic for layout/stacks/page placement/sizing/order problems. If you have not already loaded the parent topic, call `get_guide` with `topic: "use"` first. The `use` topic also requires the `mcp` topic to be loaded before any Sketch MCP tool call.

# Stacks and layout — deep dive

Use after calling `get_guide` with `topic: "use"`, section "Layout and Stacks", when you need the full enum surface, are debugging packing/order/sizing, or building responsive composition.

A Stack is a `Group`/`Frame` with a non-null `stackLayout`. Children are laid out along a main axis (row or column) similar to CSS flexbox.

## Enabling and disabling stack layout

```javascript
const sketch = require('sketch');
var group = new sketch.Group.Frame({
  name: 'Card',
  frame: { x: 0, y: 0, width: 320, height: 0 },
  stackLayout: {
    direction: sketch.StackLayout.Direction.Column,
    gap: 12,
    padding: 16,
    alignItems: sketch.StackLayout.AlignItems.Stretch,
  },
  layers: [],
});

group.stackLayout = null;
group.stackLayout = { direction: sketch.StackLayout.Direction.Row, gap: 8 };
```

Assigning a whole `stackLayout = { ... }` object on a layer that doesn't currently have one enables stack layout on that group. Assigning `null` resets to freeform layout. Mutating individual properties on an existing `stackLayout` is safer than reassigning the whole object on layers where the surrounding group has constraints — see Common gotchas below.

## `stackLayout` properties

- `direction` — `Direction.Row` (0) or `Direction.Column` (1). Main axis
- `justifyContent` — `Start`/`Center`/`End`/`Between`/`Around`/`Evenly`. Distribution along main axis; CSS `justify-content` semantics
- `alignItems` — `Start`/`Center`/`End`/`Stretch`/`None`. Cross-axis alignment of items. `None` (5) on an item inherits the stack default
- `gap` — number. Distance between items along main axis; negative values create overlap
- `padding` — number | `{ vertical, horizontal }` | `{ top, right, bottom, left }`. Stored on the host group's padding fields
- `wraps` — boolean. Enable wrapping; cannot coexist with `alignItems: Stretch`
- `alignContent` — same as `justifyContent`. Distribution of wrapped lines along cross axis. Only relevant when `wraps: true`
- `crossAxisGap` — number. Gap between wrapped lines
- `stackingOrder` — `FirstOnTop` or `LastOnTop`. Controls draw and hit-test order for overlapping children without changing their positions or Layer List order
- `bordersAffectLayout` — boolean. Includes child borders and the host container's inward-protruding borders when calculating Stack layout
- `isAutomaticallySpaced` — (read-only) boolean. True when `justifyContent` is one of `Between`/`Around`/`Evenly`

All enums live on `sketch.StackLayout.*`:

```javascript
sketch.StackLayout.Direction
sketch.StackLayout.JustifyContent
sketch.StackLayout.AlignItems
sketch.StackLayout.AlignContent
sketch.StackLayout.StackingOrder
```

`AlignContent` is an alias of `JustifyContent`. `StackingOrder` contains `FirstOnTop` and `LastOnTop`.

## Reading values

```javascript
var s = group.stackLayout;
console.log(JSON.stringify({
  direction: s.direction,
  justifyContent: s.justifyContent,
  alignItems: s.alignItems,
  gap: s.gap,
  padding: s.padding,
  wraps: s.wraps,
  stackingOrder: s.stackingOrder,
  bordersAffectLayout: s.bordersAffectLayout,
}));
```

`padding` returns a number, `{ vertical, horizontal }`, or `{ top, right, bottom, left }` depending on how it was set; check the shape before destructuring.

## Updating an existing stack

Set properties individually rather than reassigning the whole object:

```javascript
var s = group.stackLayout;
s.gap = 16;
s.alignItems = sketch.StackLayout.AlignItems.Stretch;
s.apply();
```

Call `apply()` only when you need the layout to update immediately after a batch of mutations, such as before reading resulting frames or taking a screenshot.

## How stack layout draws child order

Stacks pack children along the main axis in the reverse of `parent.layers` index order. Do not assume index `0` is the first thing you see on the left or top.

- Index `0`: row = Rightmost / last; column = Bottom / last
- Index `n - 1` (highest): row = Leftmost / first; column = Top / first

Paint and hit-test order are separate from packing. The default `StackingOrder.FirstOnTop` puts the first Layer List item, which has the highest `parent.layers` index, on top. `StackingOrder.LastOnTop` puts the lowest index on top. Changing `stackingOrder` does not change packing positions or Layer List order.

Layer List order does not mirror `parent.layers`: its first item is the highest array index. With `FirstOnTop`, the top of the Layer List is also visually in front; `LastOnTop` reverses overlap order without moving anything in the list. The leftmost or topmost item on the canvas is usually the last entry in `parent.layers`, not the first.

### Mapping visual reading order → indices

You want to draw left → right `1`, `2`, `3` in a row (`justifyContent: Start`):

- Left (first): child `1`, index `2` (highest)
- Center: child `2`, index `1`
- Right (last): child `3`, index `0`

If you create three siblings and they end up at indices `0`, `1`, `2` in the same order you named them `1`, `2`, `3`, the canvas will show `3 | 2 | 1`, not `1 | 2 | 3`.

`justifyContent` only spaces items along that reversed sequence; it does not undo the reversal.

### Creating children with the right drawn order

Pass `layers: [...]` in reverse reading order (last array element = placed first), or set `layer.index` after reparenting. This example places `One | Two | Three` from left to right:

```javascript
new sketch.Group.Frame({
  stackLayout: {
    direction: sketch.StackLayout.Direction.Row,
    gap: 8,
    justifyContent: sketch.StackLayout.JustifyContent.Start,
  },
  layers: [
    new sketch.Text({ name: 'Three', text: '3' }),
    new sketch.Text({ name: 'Two', text: '2' }),
    new sketch.Text({ name: 'One', text: '1' }),
  ],
});
```

After any index change or new child in a stack: `stack.stackLayout.apply()`, then `get_screenshot` and confirm drawn order. If wrong, fix `layer.index` and log `{ name, index }` for the next script.

## Reordering safely

Two safe patterns follow. Pattern A sets indices from the desired canvas order, first placed to last placed. Pattern B adds a new child at the canvas start, left or top, by assigning the highest index.

```javascript
var drawnOrder = ['Title', 'Body', 'Footer'];
drawnOrder.forEach(function (name, i) {
  var L = stack.layers.find(function (l) { return l.name === name; });
  if (L) L.index = drawnOrder.length - 1 - i;
});
stack.stackLayout.apply();

var child = new sketch.Text({ name: 'Header', text: 'Header' });
child.parent = stack;
child.index = stack.layers.length - 1;
stack.stackLayout.apply();
```

Never assign `stack.layers = [...]` to reorder children. If the replacement array omits existing children, Sketch can delete them; if it duplicates layer objects, it can crash with no Undo. Use `layer.index = n` instead.

## Reparenting safely

```javascript
var oldParent = child.parent;
var beforeOldCount = oldParent ? oldParent.layers.length : 0;
var beforeNewCount = newParent.layers.length;
child.parent = newParent;
oldParent?.stackLayout?.apply();
newParent.stackLayout?.apply();
console.log(JSON.stringify({
  ok: true,
  oldParent: oldParent ? {
    id: oldParent.id,
    before: beforeOldCount,
    after: oldParent.layers.length,
  } : null,
  newParent: { id: newParent.id, before: beforeNewCount, after: newParent.layers.length },
}));
```

If the total before count does not equal the total after count, stop and tell the user to Undo.

## Moving layers

Use the public APIs for the kind of movement you need:

- Reorder among siblings with `layer.index = n`.
- Reparent with `layer.parent = newParent`.
- Change paint order with `layer.moveToFront()`, `moveForward()`, `moveBackward()`, or `moveToBack()`.
- Position a freeform layer by changing `layer.frame.x` / `layer.frame.y` or assigning a new frame.

## Sizing model (`FlexSizing`)

Stack items (and any layer inside a Frame) have horizontal/vertical sizing:

- `sketch.FlexSizing.Fixed` (0): The item determines its own size
- `sketch.FlexSizing.Fit` (1): The item hugs its contents
- `sketch.FlexSizing.Fill` (2): The item fills available space in the parent
- `sketch.FlexSizing.Relative` (3): Sized proportionally relative to the parent's content box

```javascript
child.horizontalSizing = sketch.FlexSizing.Fill;
child.verticalSizing = 'Fit';
```

Relative sizing uses the child's `percentageSize` fraction on the matching axis, so `0.3` means 30% of the parent's content box on that axis. On a Stack's main axis, a Relative child can shrink when the line overflows.

```javascript
child.horizontalSizing = sketch.FlexSizing.Relative;
child.percentageSize = { width: 0.3, height: 0 };
```

Assigning a `stackLayout` to a parent automatically sets the parent's sizing through `adjustParentGroupSizing`:

- Row stacks set parent `horizontalSizing` to `Fixed` (if `justifyContent` is automatically-spaced) or `Fit`; `verticalSizing` to `Fit`.
- Column stacks mirror this on the other axis.

If your parent collapses to content width when you want it fixed-width (e.g. a 400px centered column), set `parent.horizontalSizing = sketch.FlexSizing.Fixed` and assign an explicit `frame.width` after applying the stack.

## Pinning (`Pin`)

Pinning controls how a layer sticks to its parent frame's edges when the frame resizes:

- `Pin.None` (0): No pinning
- `Pin.Min` (1): Pin to the leading edge (top/left)
- `Pin.Max` (4): Pin to the trailing edge (bottom/right)
- `Pin.All` (5): Pin to both edges

```javascript
footer.verticalPins = sketch.Pin.Max;
footer.horizontalPins = sketch.Pin.All;
```

Pins apply on stack-free Frames as well; they're a separate model from `FlexSizing`. Inside a stack, pins on items are usually overruled by stack rules.

## Per-item stack overrides

A specific child can opt out of the stack:

- `ignoresStackLayout` (boolean): The item is positioned by its own frame, not the stack
- `preservesSpaceInStackLayoutWhenHidden` (boolean): When `hidden`, the slot is preserved instead of collapsed
- `minSize` — `{ width, height }` or `null`. Minimum dimensions for Stack layout
- `maxSize` — `{ width, height }` or `null`. Maximum dimensions for Stack layout
- `percentageSize` — `{ width, height }` or `null`. Relative sizing fractions used with `FlexSizing.Relative`

Both `width` and `height` keys are required when assigning these size objects. Assign `null` or `undefined` to clear them. `ignoresStackLayout` is useful for badge layers or transient overlays that should not nudge Stack siblings.

## Wrapping

```javascript
group.stackLayout = {
  direction: sketch.StackLayout.Direction.Row,
  wraps: true,
  alignContent: sketch.StackLayout.AlignContent.Start,
  gap: 12,
  crossAxisGap: 12,
  alignItems: sketch.StackLayout.AlignItems.Start,
};
```

`alignItems: Stretch` is silently rejected when `wraps: true`, and vice versa — pick one.

## Page-level placement

Top-level frames on a Page are not automatically laid out — the page is freeform. Across separate `run_code` runs you must compute a non-overlapping position yourself:

```javascript
var page = doc.selectedPage;
var existing = page.canvasLevelFrames;
var maxX = existing.reduce(function (m, f) {
  return Math.max(m, f.frame.x + f.frame.width);
}, 0);
var newFrame = new sketch.Group.Frame({
  parent: page,
  name: 'Next',
  frame: { x: maxX + 80, y: 0, width: 1440, height: 900 },
});
console.log(JSON.stringify({
  ok: true,
  placedAt: { x: newFrame.frame.x, y: newFrame.frame.y },
  nextPlacement: { parentId: page.id, x: maxX + 80 + 1440 + 80, y: 0, gap: 80 },
}));
```

Log `nextPlacement` for whoever runs the next script.

## Frame vs Graphic

Frames are fixed-size containers whose children can use sizing and pinning. Graphics are frame-like containers whose children resize proportionally with the container, which is useful for scalable icons and vector compositions. Inspect `isFrame`, `isGraphicFrame`, sizing, pins, and `stackLayout` before changing a container type; do not convert a Graphic to a Frame if proportional child scaling is part of the design intent.

Do not distinguish these containers with `layer.type`: canvas-level Frames and Graphics report `Artboard`, while nested ones report `Group`. Test `isGraphicFrame` first because Graphics also report `isFrame`.

Use `group.clipsContents` to read or change clipping on supported Frames, Graphics, and Symbol Sources.

## Troubleshooting

### `parent.layers = [...]` caused layer loss or Sketch crash

Symptoms:

- Child count after the script is lower than before.
- Sketch shows "Duplicate objects" or crashes; Undo is unavailable.

Recovery:

1. User: Undo immediately or Revert to Saved if Undo is unavailable.
2. Agent: stop. Do not retry the script or "re-add" missing layers.
3. Reorder via `layer.index = n` + `parent.stackLayout?.apply()` instead.
4. Reparent via `child.parent = newParent`.
5. Always log child counts before and after structural edits.

### Layout drift after a script

1. Capture a fresh `get_screenshot` of the affected frame.
2. Compare to the reference (user image, original frame, or live URL).
3. Call `get_layer_tree_summary` on the affected frame/layer to spot structural regressions, unexpected text, wrong child order, or stack hints.
4. If needed, use a targeted `run_code` probe for exact `index`, sizing, pins, or style values.
5. Target one property at a time: one stack gap, one `alignItems`, or one frame.
6. Re-screenshot.

If you can't tell what changed, look for stack `alignItems` flips, parent sizing changes from Fixed to Fit, or accidental `parent.layers = [...]` assignment.

### Top-level Frames overlap on a Page

`new sketch.Group.Frame({ parent: page })` without explicit `frame.x/y` defaults to `(0, 0)`. Measure first, then place with a gutter:

```javascript
var page = doc.selectedPage;
var existing = page.canvasLevelFrames;
var maxX = existing.reduce(function (m, f) {
  return Math.max(m, f.frame.x + f.frame.width);
}, 0);
var newFrame = new sketch.Group.Frame({
  parent: page,
  frame: { x: maxX + 80, y: 0, width: 1440, height: 900 },
});
```

Log `nextPlacement` in the response JSON for the next script.

### Stack appears collapsed / shrunk to content

Adding a `stackLayout` can set `horizontalSizing` to `Fit`. For fixed-width containers:

```javascript
parent.horizontalSizing = sketch.FlexSizing.Fixed;
parent.frame = { ...parent.frame, width: 400 };
parent.stackLayout.apply();
```

### Stack siblings render in wrong visual order

Don't trust mental models; log, screenshot, then adjust:

```javascript
var dump = stack.layers
  .map(function (l) { return { name: l.name, index: l.index }; })
  .sort(function (a, b) { return a.index - b.index; });
console.log(JSON.stringify({ ok: true, order: dump }));
```

Then call `get_screenshot` and reorder via `layer.index = n` if needed. If overlapping children are on the wrong visual layer, inspect `stack.stackLayout.stackingOrder`; changing it will not fix packing order.

## Common gotchas

- `stackLayout` shrinks group width to content when sizing is `Fit`. If you need a fixed-width container (e.g. centered column), set `horizontalSizing = Fixed` and assign `frame.width` after the stack is applied.
- `Group` undefined: in `run_code`, group constructors live on `sketch`. Use `new sketch.Group(...)`, `new sketch.Group.Frame(...)`, `new sketch.Group.Graphic(...)`, `new sketch.ShapePath(...)`. There is no global `Group`.
- Bulk `parent.layers = [...]`: never. See the warning under Reordering safely.
- Negative or out-of-range `layer.index`: clamped to `[0, parent.layers.length - 1]`, so assigning `999` just lands the layer at the end; not an error but also not what you probably meant.

## Quick container-type cheat sheet

- Plain group that hugs content: `new sketch.Group({ ... })` (no `stackLayout`)
- Fixed-size container with pinnable children: `new sketch.Group.Frame({ ... })`
- Proportionally-scaling container: `new sketch.Group.Graphic({ ... })`
- Responsive row/column of children: Any of the above with `stackLayout` set
- Convert in place: `group.convertToFrame()` / `convertToGraphic()` / `convertToGroup()`
