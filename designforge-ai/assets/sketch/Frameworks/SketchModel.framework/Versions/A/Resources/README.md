# Detaching System

This folder contains Sketch's symbol detaching infrastructure - the system responsible for
resolving symbol instances into their fully-rendered representation with all overrides applied.

## What is Detaching?

In Sketch, **symbol instances** reference **symbol masters** but don't contain the actual layer
hierarchy. When rendering or inspecting a symbol instance, we need to "detach" it - creating
a complete layer tree with:

- All nested symbols resolved recursively
- All overrides (text, images, colors, nested symbol swaps, etc.) applied
- Layout recalculated (Smart Layout, Flex/Stacks)
- Styles resolved from shared style references

The result is an `MSImmutableDetachedSymbol` - a fully self-contained layer group ready for
rendering.

## Key Concepts

### DetachedSnapshot

The central data structure holding the detached state of an entire document. It maintains:

- `instanceDetachStatesByUniqueID` - Maps symbol instance unique keys to their detach state
- `masterDetachStatesByID` - Maps symbol IDs to their detach state

Each component can be in one of these states:

```
┌─────────────────────────────────────────────────────────────┐
│  InstanceDetachState                                        │
│  ├─ .undetached(MSImmutableSymbolInstance)                  │
│  └─ .detached(symbol, instance, deps, overridesSnapshot)    │
├─────────────────────────────────────────────────────────────┤
│  MasterDetachState                                          │
│  ├─ .undetached(MSImmutableSymbolMaster)                    │
│  ├─ .detached(symbol, master, deps, overridesSnapshot)      │
│  └─ .missing                                                │
└─────────────────────────────────────────────────────────────┘
```

### DetachRequest / DetachResponse

The request-response pattern for triggering detaching:

- **DetachRequest** - Specifies what to detach (pages, single instance, or master)
- **DetachResponse** - Returns the new snapshot and metadata (detached count, snapshot count,
  flex layout changes)

### OverridesSnapshot (opt-in)

Computing `OverridesSnapshot` values is expensive (override population, editability filtering)
and not needed for the rendering path. Snapshot generation is therefore **opt-in** via
`DetachRequest.generateOverridesSnapshots` (default `false`).

When to opt in:
- **Inspector / sidebar** — needs override controls and editability information
- **Override management** — replacing foreign symbols, preserving overrides across updates
- **Migrations** — propagating editable state to nested symbols

When to leave it off:
- **Page rendering** — only the detached layer tree is needed
- **Export / preview generation** — rendering only

When `generateOverridesSnapshots` is `false`, the `overridesSnapshot` associated value in
detach states is `nil`. A subsequent request with `generateOverridesSnapshots: true` populates
snapshots on already-detached symbols via `snapshotForInstance`/`snapshotForMaster` requests
without re-detaching the symbol tree.

The `DetachedContainer` adds a higher-level **scope** concept
(`DetachedContainer.OverridesSnapshotScope`) on top of this flag. The `.selection` scope
detaches the main request first (fast, no snapshots), then generates snapshots for the
selection only on the resulting snapshot.

### Dependency Graph

Symbol detaching has dependencies:

- An **instance** depends on its **master** (and any override symbol masters)
- A **master** depends on its **nested instances**

The `DetachDependencyGraph` models these relationships to ensure correct processing order.
It handles:

- Parallel processing of independent requests
- Circular dependencies (recursive symbols) via special `recursiveInstance` handling

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      DetachedContainer                           │
│  Thread-safe owner of DetachedSnapshot, handles async updates    │
└─────────────────────────────┬────────────────────────────────────┘
                              │ update(with: DetachRequest)
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      DetachedSnapshot                            │
│  Immutable snapshot of all detached components                   │
├──────────────────────────────────────────────────────────────────┤
│  1. migrate(to:) - Updates snapshot for document changes         │
│  2. detach(request:) - Performs the actual detaching             │
└─────────────────────────────┬────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────────┐
│   Migration   │   │ DependencyGraph │   │  Detaching (class)  │
│               │   │                 │   │                     │
│ Handles doc   │   │ Models deps,    │   │ Creates detached    │
│ version       │   │ orders work,    │   │ symbols, applies    │
│ transitions   │   │ parallelizes    │   │ overrides           │
└───────────────┘   └─────────────────┘   └─────────────────────┘
```

### Data Flow

1. **Request arrives** at `DetachedContainer.update(with:)`
2. **Migration** checks if document changed, invalidates affected detached symbols
3. **Dependency graph** is built from the request, modeling what needs detaching
4. **Batched processing** - Independent requests run in parallel via `DispatchQueue.concurrentPerform`
5. **Detached symbols created** - Masters first, then instances (respecting dependencies)
6. **Overrides applied** - Via `OverrideStack` traversing the layer tree
7. **Layout updated** - Smart Layout and Flex layouts recalculated
8. **Response returned** with new snapshot

## File Reference

| File | Purpose |
|------|---------|
| `DetachedContainer.swift` | Thread-safe container owning the snapshot, handles async updates |
| `DetachedSnapshot.swift` | Immutable snapshot struct, public API for accessing detached symbols |
| `DetachedSnapshot+Migration.swift` | Handles document version transitions, invalidates stale symbols |
| `DetachedSnapshot+Detaching.swift` | Core detaching logic, creates detached symbols |
| `DetachedSnapshot+DetachSymbolRequest.swift` | Builds dependency graph, defines `DetachSymbolRequest` enum |
| `DetachRequest.swift` | Request type specifying what to detach |
| `DetachResponse.swift` | Response with new snapshot and metadata |
| `DetachDependencyGraph.swift` | Dependency graph for ordering and parallelizing work |
| `DetachingContext.swift` | Shared context during a detach cycle (tracks flex layout changes) |
| `ComponentDependencies.swift` | `MasterDependencies` and `InstanceDependencies` types |
| `ChangeSet.swift` | Generic diff utility for detecting added/removed/changed objects |
| `DetachedComponentChangeSet.swift` | Document-level change detection, optimized for immutable trees |
| `MSDetachedSymbol+Detaching.swift` | Methods for applying overrides and switching nested symbols |

## Performance Optimizations

### Immutable Tree Diffing

The `DetachedComponentChangeSet` exploits the immutable tree structure:

- If a layer reference hasn't changed, its entire subtree is unchanged
- Only changed subtrees are traversed
- Achieves O(n) complexity where n is changed nodes, not total nodes

### Parallel Processing

Independent detach requests are processed concurrently:

```swift
DispatchQueue.concurrentPerform(iterations: batchArray.count) { index in
  let request = batchArray[index]
  let result = self.perform(request: request, snapshot: snapshot)
  // ...
}
```

### Lazy Detaching

Symbols are detached on-demand, not eagerly. The snapshot starts empty and fills
as pages are viewed or instances are queried.

## Dependencies

Instances track what they depend on for invalidation:

```swift
struct InstanceDependencies {
  let overrideStyleIDs: Set<String>      // Shared styles used in overrides
  let dependentSymbolIDs: Set<String>    // Master + override symbol IDs
}

struct MasterDependencies {
  let nestedInstanceKeys: Set<String>    // Nested symbol instances
}
```

When a master or style changes, affected instances are marked `.undetached` and
will be re-detached on next request.

## Recursive Symbols

Symbols can reference themselves (directly or indirectly). The dependency graph
detects cycles and converts stuck instance requests to `recursiveInstance` type,
which creates a placeholder detached symbol without fully resolving the recursion.

## Thread Safety

- `DetachedContainer` uses a `ReadWriteLock` for snapshot access
- Detaching runs on a serial `DispatchQueue` ("Symbol detach queue")
- Observers are notified on the main thread via `BCRunLoopPerformBlock`

## Related Components

- **OverrideStack** - Manages override values during tree traversal
- **OverrideContext** - Provides document data for style lookups during override application
- **MSDetachedSymbol** - The mutable counterpart used during detaching, then converted to immutable

## Usage Example

```swift
// Get detached symbol for an instance
let detached = container.detachedSymbol(for: instance)

// Force detaching if not already done
let detached = container.detachedInstance(for: uniqueKey, blocking: true)

// Update current page for rendering, generate overrides snapshots for selection only (async)
container.update(with: .pages(.current), overridesSnapshotScope: .selection, blocking: false)

// Update all pages with overrides snapshots for everything (sync)
container.update(with: .pages(.all), overridesSnapshotScope: .all, blocking: true)

// Access overrides snapshot for an instance
let snapshot = container.overridesSnapshot(forInstanceWithUniqueKey: uniqueKey)
let canOverride = snapshot?.canOverride(overridePath, master: detached?.master)
```
