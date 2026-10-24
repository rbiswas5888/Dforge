# get_guide: prototyping

This is a subtopic for flows/HotSpots/start points/prototype graph probing. If you have not already loaded the parent topic, call `get_guide` with `topic: "use"` first. The `use` topic also requires the `mcp` topic to be loaded before any Sketch MCP tool call.

# Prototyping — deep dive

Use after calling `get_guide` with `topic: "use"` when the task touches Sketch's prototyping flows (linking layers to target frames, defining flow start points, or creating dedicated hotspot layers).

Prototyping in Sketch is built on three pieces:

- `flow`: A property on any `Layer`. Connects this layer to a target frame on click/tap, with an optional animation
- `flowStartPoint`: A property on a `Group`/`Frame`. Marks the frame as the prototype entry point
- `HotSpot`: A standalone layer (`sketch.HotSpot`). Invisible click region on top of a frame; useful when a non-clickable element needs to drive navigation

The public JavaScript API in this Sketch build covers these basic links, slide animations, Start Points, and scroll-position preservation. Sketch also supports overlays, custom visibility interactions, scrolling areas, fixed elements, Smart Animate, and Dissolve in the product UI, but those controls are not exposed by the current public JavaScript API. Do not use private or native bridges to automate them; leave those settings for a manual Sketch step.

## Linking layers to a target frame

Set `layer.flow` to a plain object:

```javascript
const sketch = require('sketch');
const doc = sketch.getSelectedDocument();
var button = sketch.find('#' + buttonId, doc)[0];
var nextFrame = sketch.find('#' + nextFrameId, doc)[0];

button.flow = {
  target: nextFrame,
  animationType: sketch.Flow.AnimationType.slideFromRight,
  maintainScrollPosition: false,
};
```

You can also set the target by id:

```javascript
button.flow = { targetId: nextFrameId };
```

### Animation types

`sketch.Flow.AnimationType.*`:

- `none`: Instant cut
- `slideFromRight`: New frame slides in from the right
- `slideFromLeft`: …from the left
- `slideFromBottom`: …from the bottom
- `slideFromTop`: …from the top

### Back navigation

To make a flow act as "go back" instead of targeting a specific frame:

```javascript
button.flow = { target: sketch.Flow.BackTarget };
```

`BackTarget` is the preferred public constant. The equivalent lower-level target ID is:

```javascript
button.flow = { targetId: 'back' };
```

Check whether an existing flow is a back action:

```javascript
console.log(JSON.stringify({ isBack: button.flow.isBackAction() }));
```

### Validity

`flow.isValidConnection()` returns `false` if the target frame no longer exists (e.g. it was deleted between scripts). Always probe before relying on a cached flow:

```javascript
if (button.flow && !button.flow.isValidConnection()) {
  console.log(JSON.stringify({ ok: false, error: 'INVALID_FLOW', layerId: button.id }));
}
```

### Removing a flow

```javascript
button.flow = null;
```

### Reading a flow

```javascript
console.log(JSON.stringify({
  targetId: String(button.flow.targetId),
  animationType: button.flow.animationType,
  maintainScrollPosition: button.flow.maintainScrollPosition,
}));
```

## Marking the prototype entry point

```javascript
homeFrame.flowStartPoint = true;
otherFrame.flowStartPoint = false;
```

A document can have multiple Start Points, which create separate prototypes. Set or clear each Frame explicitly and verify all of them with:

```javascript
doc.selectedPage.canvasLevelFrames.forEach(function (f) {
  if (f.flowStartPoint) console.log(JSON.stringify({ startFrameId: f.id, name: f.name }));
});
```

## HotSpot layers

A `HotSpot` is a visually invisible layer that carries a `flow` and overlays a target region. Use it when:

- a non-layer area (whitespace, image edge) needs to drive navigation, or
- the underlying layer already has a different purpose and you don't want to attach `flow` to it directly.

### Create from scratch

```javascript
const sketch = require('sketch');
var hotspot = new sketch.HotSpot({
  parent: page,
  name: 'Hotspot/PrimaryCTA',
  frame: { x: 120, y: 480, width: 200, height: 48 },
  flow: { target: nextFrame, animationType: sketch.Flow.AnimationType.slideFromRight },
});
```

### Promote an existing layer

`HotSpot.fromLayer(layer)` produces a hotspot mirroring `layer`'s frame and flow. The source layer must already have a `flow` with a valid `targetId`:

```javascript
button.flow = { target: nextFrame, animationType: sketch.Flow.AnimationType.slideFromBottom };
var hot = sketch.HotSpot.fromLayer(button);
hot.parent = button.parent;
```

## Common pitfalls

- `target` must resolve to a canvas Frame. Setting flow to a child layer or a non-frame group throws `Cannot create a flow from a <class>` (or silently no-ops on some builds). Use a top-level Frame as the target.
- Stale `targetId` after page deletion. `flow.isValidConnection()` will be `false`. Either repair the flow or clear it (`layer.flow = null`).
- HotSpot without prior flow. `HotSpot.fromLayer(layer)` throws "Can only create a HotSpot from a layer with an existing flow" — set `layer.flow` first.
- Visual verification. `get_screenshot` won't show flow arrows. To verify connections, either log the flow graph (id → target) or use Sketch's preview manually. Capture screenshots of the frames involved so the user can sanity-check.

## Probing the prototype graph

```javascript
const sketch = require('sketch');
const doc = sketch.getSelectedDocument();
var nodes = [];
doc.pages.forEach(function (p) {
  p.canvasLevelFrames.forEach(function (frame) {
    var edges = [];
    function walk(l) {
      if (l.flow) edges.push({
        from: l.id,
        fromName: l.name,
        toId: String(l.flow.targetId),
        animation: l.flow.animationType,
      });
      if (l.layers) l.layers.forEach(walk);
    }
    walk(frame);
    nodes.push({
      pageId: p.id,
      frameId: frame.id,
      frameName: frame.name,
      isStart: !!frame.flowStartPoint,
      edges: edges,
    });
  });
});
console.log(JSON.stringify({ ok: true, nodes: nodes }));
```

Use this once before mutating flows to know the current graph; rerun after to verify the deltas.
