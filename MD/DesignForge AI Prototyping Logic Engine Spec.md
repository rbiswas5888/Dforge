# DesignForge AI: Prototyping Logic Engine

Technical Specification, v0.1 (draft)

## 1. Purpose and goals

DesignForge AI needs a prototyping layer that behaves like a small application runtime rather than a set of linked screens. Designers should be able to build near-real-life products (login flows, carts, dashboards, forms, chat) with state, data and logic. An AI agent built into the application should be able to create and modify the same prototypes through the same controlled interface.

**Goals**

- G1: Prototypes with real state, conditions, data and motion, authored visually.
- G2: Parity with the working concepts of Figma, Sketch and Adobe XD (components, variants, variables, styles, auto layout, overlays, smart animate), then go deeper on logic.
- G3: A deterministic runtime that can be replayed, debugged and tested.
- G4: A local-first AI agent that works through a typed command API, with optional cloud agents (Claude, Google, OpenAI, others).
- G5: Works fully offline. Nothing leaves the machine unless the user enables a cloud agent.

**Non-goals**

- Not a production backend and not a replacement for app frameworks.
- No change to the existing MCP and AI structure; the agent layer plugs into it.

## 2. Parity map with Figma, Sketch and XD

| Feature area | Reference concept | DesignForge equivalent |
| --- | --- | --- |
| Artboards and frames | Figma Frame, Sketch/XD Artboard | Frame with device presets and custom W/H |
| Pages and sections | Figma Page and Section | Page, then Section as main parent, then Frame |
| Auto layout | Figma Auto layout, Sketch/XD Stacks | Auto layout node (direction, gap, padding, alignment, wrap) |
| Constraints and resize | All three | Constraints plus breakpoints |
| Components and variants | Figma Components/Variants, Sketch Symbols, XD Components with states | Component sets driven by properties |
| Overrides and slots | Sketch overrides, Figma instance swap | Instance overrides and named slots |
| Styles | All three | Style tokens for color, text, effect, grid |
| Variables and modes | Figma Variables | Typed variables with modes and scopes |
| Repeat Grid | XD Repeat Grid | Repeat/List node bound to data |
| Links, overlays, scroll, fixed | All three | Interactions with overlay and scroll behaviors |
| Smart Animate / Auto-Animate | Figma, XD | Matching-layer animation plus springs |
| Conditions and expressions | Figma prototype variables | Logic graph plus expression language |
| Voice, keyboard, gamepad | XD voice, Figma key/gamepad | Input triggers |
| Libraries | Figma/Sketch libraries | Publish and subscribe libraries |
| Handoff | Dev Mode, Inspect | Inspect panel and code export |

## 3. Architecture

```
UI (canvas, panels, node graph, debugger)
        |
Command API (typed, validated, undoable)  <---  AI agent (local or cloud, via MCP Hub)
        |
Document model (.dforge: pages, nodes, tokens, components, variables, logic, data)
        |
Runtime (reactive store, state machines, event bus, scheduler, animation solver)
        |
Renderer / Player / Exporters (web preview, PDF, images, code)
```

**Packages**

- core-model: node types, schema, migrations, validation.
- command-api: every edit the UI or agent can make, as a named, typed command.
- runtime: the prototype engine. It has no dependency on the editor, so it can run in Play mode, in the canvas preview and in exported standalone prototypes.
- renderer: draws the document and the runtime output.
- editor-ui: panels, canvas tools, logic canvas, debugger.
- agent: context builder, planner, adapters, guardrails.
- io: import, export, interop.

## 4. Document model (.dforge)

**Hierarchy:** Document, Pages, Sections, Frames, Layers. Frames are either independent or children of a Section, depending on where they are created. Layers can be nested to any depth.

**Node types:** frame, group, rectangle, ellipse, polygon, star, line, path (boolean ops), text, image, video, vector network, component, component set, instance, repeat, slot, mask, auto-layout container, scroll container, overlay container.

**Common node properties:** id (stable, unique), name, type, parent, children order, geometry (x, y, w, h, rotation), constraints, auto layout, fills, strokes, effects, blend, opacity, corner radius (per corner, smoothing), visibility, lock, bound variables (map from property to variable id or expression), interactions, accessibility (role, label, order), plugin data.

**Container format:** a .dforge file is a zip with document.json, assets/, fonts manifest, thumbnails, history snapshots and an optional embedded data seed. Schema version is stored in the manifest and migrations run on open.

**Identity and references:** all cross-references (tokens, components, variables, frames) use ids, never names, so renaming is always safe.

## 5. Design system layer

**5.1 Tokens and styles**

- Three tiers: primitive (blue-500), semantic (color.action.primary), component (button.bg).
- Style types: color (solid, gradient, image), text, effect (shadow, blur), grid, layout.
- Color model follows Photoshop and Figma parameters: RGB, HSB, HSL, hex, opacity, plus color picker with eyedropper and saved swatches.
- Style Dictionary pipeline and Figma-variables exporter are first-class exports.

**5.2 Variables and modes**

- Collections group variables. Each collection has modes (for example Light/Dark, English/Hindi, Compact/Regular).
- Types: color, number, string, boolean, enum.
- Scoping controls where a variable can be bound (fills only, spacing only, text only, and so on).
- Aliases let one variable point to another, which is how semantic tokens reference primitives.
- Per-frame mode override lets a single frame preview in a different mode.

**5.3 Components**

- Main component, component set, instances.
- Property types: variant, boolean, text, instance-swap, number.
- Slots: named areas an instance can fill with any content.
- Overrides: text, fills, visibility, nested instance swaps, nested property values. Overrides survive when the main component changes, as long as the target layer still exists.
- Detach, reset overrides, go to main component, push overrides to main.
- Nested components to any depth with property exposure.
- Interactions inside components (hover, press, focus) are defined once and inherited by every instance.

**5.4 Layout**

- Auto layout: direction, spacing, padding, alignment, wrap, fill/hug/fixed sizing, absolute-positioned children, min/max sizes.
- Constraints: left, right, top, bottom, center, scale.
- Layout grids: columns, rows, grid. Breakpoints can switch a frame between layout variants.
- Frame presets come from the Device Frame Specifications document (Apple, Samsung, laptops and desktops 2000 to 2026), plus custom frames with W/H input, aspect lock, saved presets and orientation swap.

## 6. Prototype logic engine

**6.1 Flows**

- A flow starts at a starting frame and has a name. A document can hold many flows.
- Flows can be shown as a connected map on the canvas, with arrows for navigation and badges for logic.
- Reusable logic blocks (like functions) can be called from many interactions.

**6.2 Variables at runtime**

- Types: boolean, number, string, color, enum, datetime, list, object.
- Scopes: global, flow, frame, component, instance, session, persisted (survives replays when enabled).
- Computed variables use expressions and form a dependency graph. Cycles are detected at authoring time and refused.
- Any property can be bound: text content, fill, stroke, opacity, visibility, size, position, component property, list source, animation parameters.

**6.3 Triggers**

| Group | Triggers |
| --- | --- |
| Pointer | tap, double tap, long press, press down/up, hover enter/leave, drag start/move/end, swipe (four directions), pinch, rotate |
| Keyboard and input | key down/up with modifiers, Enter, Esc, focus, blur, text change, voice phrase, gamepad button |
| Lifecycle | on load, on exit, on visible, after delay, repeating interval |
| Reactive | variable changed, expression becomes true, state entered, state exited |
| Environment | orientation change, theme change, network online/offline, shake, low battery (simulated) |
| Data | request success, failure, timeout |

**6.4 Conditions**

- If / else if / else, switch, and compound logic (AND, OR, NOT).
- Guards can sit on any interaction or on any state transition.
- Conditions are expressions that must evaluate to boolean, checked when the interaction is saved.

**6.5 Actions**

| Group | Actions |
| --- | --- |
| Navigation | navigate to frame, back, open overlay, close overlay, swap overlay, scroll to node, open URL |
| State | set variable, toggle, increment, append to list, remove from list, reset |
| Component | set variant, set property, send event to state machine |
| Flow control | if/else, switch, repeat, wait, run in parallel, stop |
| Data | fetch from mock endpoint, query collection, insert/update/delete record, validate form |
| Feedback | play animation, play sound or video, haptic (simulated), toast |
| System | copy to clipboard, log, assert (for tests) |

Actions in a sequence run in order. Parallel groups run together and join at the end. Any action can carry its own transition and delay.

**6.6 Expression language**

Expressions are pure (no side effects), typed and sandboxed. They are used in bindings, conditions and computed variables.

- Operators: arithmetic, comparison, logical, string concatenation, ternary.
- Math: min, max, round, floor, ceil, clamp, abs.
- Text: concat, contains, startsWith, length, upper, lower, trim, format.
- List: len, filter, map, sum, avg, sort, find, any, all, slice.
- Date: now, format, diff, addDays.
- Logic: if, coalesce, isEmpty.
- Validation: isEmail, isPhone, matches, required, minLen, maxLen.
- Color: mix, lighten, darken, contrast.

Examples:

```
cartTotal = sum(map(cart.items, i => i.price * i.qty))
canCheckout = len(cart.items) > 0 and user.loggedIn
emailError = if(isEmail(form.email), '', 'Enter a valid email')
```

The expression editor offers autocomplete for variables and functions, inline type errors and a live preview value while the prototype is running.

**6.7 Component state machines**

Every interactive component can be modelled as a state machine, which is the main tool for reusable logic.

- States, events, transitions, guards, entry and exit actions.
- Hierarchical (nested) states and parallel regions, for example a text field that tracks focus and validity at the same time.
- Each state maps to a variant or a set of property values.
- Transitions carry animation settings (duration, easing or spring).

Example (Input component):

```
component: Input
regions:
  interaction: [idle, focus]
  validity: [neutral, error, success]
events:
  focus: idle -> focus
  blur:  focus -> idle, then evaluate validity
  change: stays, re-evaluates validity when touched
guards:
  error: touched and not valid(value)
  success: touched and valid(value)
bindings:
  border color: error -> color.border.error, focus -> color.border.focus
  helper text: error -> errorMessage
```

**6.8 Data layer**

- Sources: static JSON or CSV, local collections (in memory with optional persistence), mock endpoints, file import.
- Mock endpoints: method, path, latency range, failure rate, response template that can reference variables.
- List and repeat nodes bind to a source with an item template, item variable and index.
- Built-in filter, sort, search and pagination, with empty, loading and error states for every binding.
- Records can reference each other by id (orders have items, items have products).
- Seed data can be generated by the agent from a short description.

**6.9 Forms and validation**

- Field groups with rules: required, min/max, length, regex, match another field, custom expression.
- Validation timing: on blur, on change, on submit.
- Error messages are bindings, so they can be localized and styled by tokens.
- Submit is a state machine: idle, validating, submitting, success, error.

**6.10 Navigation, overlays and scrolling**

- Frame stack with history and back behavior. Persistent regions (tab bar, side nav) stay mounted between frames.
- Overlays: position (center, anchored to node, edge), backdrop, dismiss on outside tap, stacking order.
- Transitions: instant, dissolve, move in/out, push, slide, smart animate.
- Scroll containers (vertical, horizontal, both), sticky and fixed layers, carousels with snap, pull to refresh.

**6.11 Environment simulation**

- Device frame, orientation, safe areas, status bar, notch and dynamic island.
- On-screen keyboard that pushes layout when a text field is focused.
- Dark mode, text scale, reduced motion, language and region.
- Network conditions (online, offline, slow) that affect mock endpoints.

## 7. Runtime

**7.1 Execution model**

1. An event arrives (input, timer, state change, data response).
2. The dispatcher finds interactions and transitions that listen to it, in tree order from the deepest target up.
3. Guards are evaluated against a snapshot of the store.
4. Matching action sequences are queued.
5. Actions run inside one transaction. State changes are applied together at the end of the step.
6. The reactive graph recomputes only the bindings and computed variables that depend on changed values.
7. A render diff is produced and the renderer updates only what changed.

**7.2 Determinism**

- A virtual clock drives timers and animations, so runs can be paused, stepped or replayed at any speed.
- Random values use a seeded generator. Mock latency and failures use the same seed.
- The runtime is event-sourced: every run is a list of events plus the initial state. Replaying the list reproduces the run exactly.

**7.3 Time travel**

- Snapshots are taken at intervals, and the event log fills in between them.
- The debugger can scrub back to any point, inspect state, change a variable and continue from there.

**7.4 Performance targets**

- 60 fps during animation on documents up to 5,000 nodes on the reference machine.
- Event to render under 8 ms for typical interactions.
- Cold start of Play mode under 1 second for a normal document.
- Heavy work (list filtering over large data, expression evaluation) is incremental and runs off the main thread.

**7.5 Sandbox**

- Expressions and any scripts run in a restricted worker with no file, DOM or network access.
- The only outside access is the mock data layer and, when the user enables it, explicit allow-listed URLs.

## 8. Motion and physics

- Easing: linear, ease in/out, custom bezier with presets.
- Springs: stiffness, damping, mass, with presets (gentle, bouncy, snappy). Springs are solved analytically, so they stay smooth at any frame rate.
- Smart animate: layers are matched by name and type across frames; unmatched layers fade or move in. Matching can be overridden manually.
- Timeline editor: tracks per property, keyframes, stagger, delay, loops, ping-pong.
- Gesture-driven motion: drag to dismiss, swipe between pages, scroll-linked animation (parallax, collapsing headers), velocity carried into the spring on release.
- Reduced motion mode replaces movement with fades.

## 9. Editor UI

- Top bar: Design, Prototype and Code modes; MCP Hub, Learn, Linter, Share, Play, Export.
- Left: Layers (drag and drop, Sections as parents), Assets, Pages.
- Right panel (Figma-style, updates with the selection): Design, Prototype, Inspect, Export, AI tabs.
- Prototype tab: interactions list for the selected layer with trigger, conditions, actions and transition; flow starting points; device and frame settings.
- Logic canvas: node graph view of the same interactions for complex flows. It is a second view of one model, so edits in either view stay in sync.
- Variables panel: collections, modes, scopes, usage list (where each variable is bound).
- Data panel: collections, endpoints, seed generator, record browser.
- State machine editor: diagram view per component.
- Debugger dock: event log, live variable inspector, why-did-this-fire explanations, time-travel scrubber, breakpoints on events and variable changes.
- Play mode: runs in a device frame or full window, with a floating control strip (restart, step, network, theme, orientation).

## 10. AI agent

**10.1 Principles**

- The agent never edits files or pixels directly. It calls the same command API as the UI.
- Every command is validated against the schema before it is applied.
- Everything the agent does in one request is one undo group.
- The agent uses tokens and components from the design file. If a needed token or component does not exist, it creates a wireframe element with a visible note: component not available.
- Local first. Cloud agents are opt-in and share the same interface.

**10.2 Architecture**

- Agent adapter interface: send(context, tools) and receive(plan or commands). Adapters: Ollama (local), Claude, Google, OpenAI, and a registry for adding others.
- The agent is exposed through the existing MCP Hub, so external tools can use it in the same way.
- Context builder, planner, executor, validator and reporter are separate modules, so adapters stay thin.

**10.3 Context builder**

The context is built fresh for every request and stays within a token budget set per adapter.

- Always: the selection in full detail, the active frame outline, available tokens (names and values), component catalog (name, properties, variants), variables with current values, flows summary.
- On demand: other frames, event log, mock data samples. The agent can fetch these with read-only query commands.
- Large documents are summarized hierarchically: full detail near the selection, outline elsewhere.
- File content (text layers, imported data, comments) is always passed as data, never as instructions.

**10.4 Command API (agent and UI)**

| Namespace | Examples |
| --- | --- |
| query (read only) | getSelection, getTree, getCatalog, getVariables, getFlows, getEventLog, getDiagnostics |
| node | create, update, delete, move, group, duplicate |
| layout | setAutoLayout, setConstraints, setFrame (preset or custom size) |
| style and token | applyStyle, createToken, bindToken, createVariable, bindVariable |
| component | create, addVariant, setProperty, instantiate, swap, detach |
| interaction | create, update, delete, reorder |
| logic | createBlock, addNode, connect, setExpression |
| statemachine | create, addState, addTransition, setGuard |
| data | createCollection, seed, createEndpoint |
| form | create, addRule |
| play | run, step, assert, getLog |
| export | exportFrame, exportPdf, exportCode, exportTokens |

Every command returns created ids, warnings and diagnostics (for example: variable not found, type mismatch, unreachable frame), so the agent can correct itself.

**10.5 Plan, validate, apply**

1. Understand the request and ask at most one clarifying question if it is truly ambiguous.
2. Produce a short plan (screens, components, variables, flows).
3. For each step, produce commands. The validator checks schema and references.
4. Apply commands. Read diagnostics. Fix errors, up to a retry limit.
5. Run a smoke test with play.run and assert key outcomes.
6. Report what was created, what was assumed and what could not be done.

A preview mode shows the plan and a visual diff before anything is applied. A setting allows auto-apply for small edits.

**10.6 Local model targets**

- Reference machine: MacBook Pro, Intel Core i9, 32 GB RAM, integrated graphics. Inference is CPU only.
- Recommended class: quantized 7B to 8B instruct models through Ollama, with a context target of 4k to 8k tokens.
- Output is constrained to the command JSON schema, which removes most malformed output.
- Two-stage prompting: a planner call produces a compact outline, then an executor call turns one step at a time into commands. Each call stays small.
- Hard limits: maximum commands per step, maximum steps per request, timeout with partial results kept.
- Heavy tasks (a full multi-screen app generated in one request) can be offered to a cloud agent when the user has enabled one. Otherwise the local agent builds it in stages.

**10.7 Agent workflows**

- Generate: a prompt becomes screens, components, variables, mock data and wired flows.
- Wire logic: describe behavior in words and the agent sets variables, conditions, actions and state machines.
- Explain and debug: reads the event log and state, and says why an interaction did not fire or a value is wrong.
- Test: generates scenarios (happy path, invalid input, empty data, offline, slow network) and runs them with assertions.
- Data: creates realistic seed data and mock endpoints.
- Design system: checks for missing tokens, detached instances and inconsistent spacing, and proposes fixes.
- Accessibility: checks contrast, tap target size, focus order and labels, and applies fixes.
- Convert: turns prototype logic into frontend code from the logic graph, using the component and token structure.

**10.8 Safety and guardrails**

- Permission scopes: read-only, edit current selection, edit document. Default is edit current selection.
- Destructive commands (delete, detach, overwrite) require confirmation in preview mode.
- No network access for the local agent. Cloud adapters send only the context the builder produced, and the user can inspect it first.
- Instructions found inside file content are ignored. They are shown to the user as a warning if they look like injection.
- All agent actions are logged locally with the prompt, plan and commands, for audit and undo.

**10.9 Evaluation**

- A fixed suite of prompts with expected outcomes, run against every adapter.
- Metrics: schema validity rate, task success measured by play assertions, retries needed, tokens used, time to result.
- Regression gate: a change to prompts or the context builder must not lower these scores.

## 11. Practical scenarios

| Scenario | What it exercises |
| --- | --- |
| Login and OTP | Form validation, submit state machine, timers (resend countdown), conditional navigation, mock auth endpoint with failure case |
| E-commerce cart | Lists bound to data, computed totals, quantity steppers as components, empty state, persisted cart, checkout guard |
| Onboarding carousel | Scroll snap, page indicator bound to variable, skip and next logic, first-run flag |
| Dashboard with filters | Tabs, dropdown components with variants, filter and sort expressions, chart components bound to data, loading and error states |
| Chat screen | Appending to a list, auto-scroll, typing indicator with timer, keyboard simulation, mock replies |
| Settings | Toggles bound to global variables, theme mode switch, language mode switch, persisted values |
| Multi-step form | Step variable, per-step validation, back and next guards, summary screen from collected values |
| Search with suggestions | Debounce timer, filter expression, highlighted matches, empty result state, recent searches list |
| Responsive web app | Breakpoint variants, auto layout, sticky header, overlay menu on small screens |

**Worked example: login (abridged)**

```
variables:
  email: string = ''
  password: string = ''
  loginError: string = ''
  isLoading: boolean = false
components:
  Input (state machine as in 6.7), Button (variants: default, hover, pressed, disabled, loading)
bindings:
  Button.disabled = not (isEmail(email) and minLen(password, 8))
  Button.state = if(isLoading, 'loading', 'default')
  ErrorText.visible = loginError != ''
interaction on Button tap:
  set isLoading = true
  fetch POST /auth/login with {email, password}
  on success: set isLoading = false, navigate to Home (push)
  on failure: set isLoading = false, set loginError = response.message
  on timeout: set isLoading = false, set loginError = 'Network is slow, try again'
tests:
  valid credentials reach Home; wrong password shows error; offline shows timeout message
```

The agent can produce this entire structure from the prompt: Build a login screen with email and password validation, loading state and error handling.

## 12. Import, export and interoperability

- Native: .dforge (full fidelity, including logic and data).
- Images: selected section or frame as PNG, JPG, SVG at 1x to 4x.
- PDF: current artboard or page, with optional multi-page export of a flow.
- Tokens: Style Dictionary output, Figma-variables JSON export.
- Code: HTML/CSS, React, Vue, Flutter and SwiftUI targets generated from layout, tokens and logic graph. State machines and bindings map to idiomatic state code.
- Standalone prototype: a single folder or file that runs in any browser with the runtime bundled.
- Import: Figma, Sketch and XD files for layers, styles, components and basic prototype links. Logic from other tools is mapped where equivalent concepts exist, and unmapped items are reported in an import log.

## 13. Cross-cutting requirements

- **Accessibility:** roles, labels, focus order and keyboard operation are part of the model. Play mode supports keyboard and screen-reader preview.
- **Localization:** text bound to string variables per mode, right-to-left layout support, number and date formats.
- **Collaboration and versioning:** the command log makes sync and merge straightforward (operation-based). Named versions, branches for agent work and a restore point before every large agent run.
- **Security and privacy:** local-only by default, no telemetry without opt-in, cloud agent context visible to the user before sending.
- **Testing:** unit tests for runtime and expressions, snapshot tests for rendering, replay tests built from recorded runs, schema migration tests.
- **Linter:** flags unreachable frames, unused variables, dead interactions, missing states, contrast failures and detached instances.

## 14. Roadmap

| Milestone | Scope |
| --- | --- |
| M0 Foundations | Document model, command API, undo system, runtime skeleton |
| M1 Logic core | Variables, bindings, expression language, conditions, core actions |
| M2 Components | Variants, properties, slots, overrides, state machines |
| M3 Data and forms | Collections, mock endpoints, lists, forms and validation |
| M4 Agent v1 | Local adapter, context builder, command schema, wireframe fallback, preview and undo |
| M5 Debug and test | Event log, inspector, time travel, assertions, test runner, agent-generated tests |
| M6 Motion | Springs, smart animate, timeline, gestures, scroll-linked animation |
| M7 Interop | Code export, standalone export, Figma/Sketch/XD import, cloud adapters |
| M8 Hardening | Performance, accessibility, collaboration, evaluation gates |

## 15. Risks and open questions

- **Logic usability:** powerful logic can overwhelm designers. Mitigation: progressive disclosure (simple interaction panel first, node graph and expressions when needed) and agent assistance.
- **Local model quality:** small models may struggle with large multi-screen requests. Mitigation: staged generation, schema-constrained output, strong validation and optional cloud fallback.
- **Parity scope:** matching three tools at once can sprawl. Mitigation: treat the parity map in section 2 as the checklist and ship by milestone.
- **Performance on large files:** needs incremental computation and worker offloading from the start, not as a later fix.
- **Open questions:** Which code targets matter most first? Should persisted prototype data sync across devices? Is real-time collaboration in scope for the first release? Should custom scripting (beyond expressions) be allowed, and if so in which language?
