# ai-ops: brief reader, op-language parser and ghost-preview applier

Reads a **prompt plus one or more Markdown design briefs**, builds the design through a **streaming op language**, and shows it as a **ghost preview** you accept (one undo step) or reject. Written to plug into the engine spec (command bus, catalogue of tokens and components, Ollama `qwen3.8:27b`). No runtime dependencies; TypeScript runs directly on Node 22.18+ (type stripping), and `tsc` is only needed for type checks.

```
prompt + brief.md ──► parseBrief / mergeBriefs ──► planWork ──► units
                                                      │
        deterministic units (no model) ◄──────────────┤ clean copy + component items
        model units (Ollama, streamed)  ◄─────────────┘ layout / behaviour / free-text items
                          │ op lines (chunks may split anywhere)
                          ▼
   LineStream → parseLine → validate → GhostSession.apply → EngineAdapter.GhostHandle
                                            │                     (your scene graph, transient)
                          wireframe fallback, token binding,      ▼
                          interactions wired at the end      accept() = 1 undo step / reject()
```

## Quick start
```
npm test                 # 31 tests
npm run typecheck
npm run demo             # example brief + catalogue, in-memory engine, scripted model
node scripts/demo.ts examples/example-brief.md "Generate the Login screen only" --ollama   # real Ollama
```

## How the prompt and the MD file are used
- **The MD brief is the spec of record.** Screens, sections, copy, components, rules, tokens and flows come from it deterministically (no model needed to read it).
- **The prompt steers it.** Screen names mentioned in the prompt select which screens are built ("Login screen only"); `dark`/`light` and device names (`iPhone 15`, `1280x720`) are picked up; the whole prompt is passed to the model as the instruction for every model unit. With no MD (or an MD with no screens) the prompt alone is used.
- **Only what needs judgement goes to the model.** Items that map cleanly onto the catalogue (copy, named components) are composed in code. Layout, behaviour and free-text items go to the model, one section per request, so each request stays small enough for CPU inference.

### Brief format (Markdown)
| Markdown | Meaning |
|---|---|
| `---` front matter `---` | `title:`, `device:` (preset or `390x844`), any other key kept in `meta` |
| `# Title` | design title (becomes the Section name) |
| `## Screen: Login` or `## Login` | a screen (one frame). Reserved H2 names: Tokens, Rules, Constraints, Flows, Prototype, Open questions, Notes, Overview, Goals, Audience, Brand, Context |
| `### Header` | a section inside the screen (a child frame). Items under `## Screen` with no H3 go straight into the screen frame |
| `Role: ...` | screen purpose (first line under the screen) |
| `- Heading: Welcome back` | copy; roles: heading, title, subtitle, body, text, caption, label, link |
| `- Button (primary): Sign in`, `- Input[type=email]: Email`, `- Primary button: Sign in` | component reference; `( )` or `[ ]` hold props (`variant` if no `=`); text after the colon becomes the label/text property |
| `- Layout: ...`, `- On click: ...`, free sentences, nested bullets | go to the model |
| `- [x] item` | already built: skipped |
| table with a `Component` column (+ `Text`, `Variant`, `Props`) | one component item per row |
| `## Rules` bullets | global rules added to every model prompt |
| `## Flows`: `Login -(Sign in)-> Home` | prototype wiring; the label is the control on the previous screen |
| ```` ```ops ```` block | authored ops applied verbatim (screens are `F1`, `F2`, ... in MD order, the section is `S1`) |
| ```` ```tokens ```` / `## Tokens` | tokens the brief expects; any missing from the file are reported |

Components in the brief are matched to the catalogue by name words, a head-noun check and variant values, so "Primary button" finds `#btn.primary`, "Primary card" does not. Anything unmatched becomes a labelled wireframe placeholder (`component not available: <name>`) and is listed in the report.

## Op language (authoritative)
Compared with the sketch in spec section 6.5: `section` is added (sections are the main parent in the layers panel) and `mode` is dropped.
```
section ID 'Name' parent=page
frame   ID 'Name' WxH parent=ID layout=V|H|GRID|NONE gap=N|$space pad=N|N,N|N,N,N,N|$space fill=$color|#RRGGBB radius=N|$radius w=fill|hug|N h=fill|hug|N align=MAIN[,CROSS] x=N y=N
rect|ellipse ID parent=ID w=N h=N fill=.. stroke=.. sw=N radius=..
text    ID 'Characters' parent=ID style=$text fill=$color w=fill|hug
inst    ID comp=#code parent=ID w=.. h=.. <componentProperty>=value
group   ID parent=ID of=ID1,ID2
set     ID.prop value      (x y w h rotation opacity radius fill stroke sw visible clip gap layout align text name)
bind    ID.prop var=name   |   style ID $token   |   layout ID V|H|GRID|NONE gap= pad= align=
constraint ID h=LEFT|RIGHT|LEFT_RIGHT|CENTER|SCALE v=TOP|BOTTOM|TOP_BOTTOM|CENTER|SCALE
move ID x= y= parent= index=   |   del ID   |   var name string|number|boolean|color 'value'   |   note [ID] 'text'
ix ID click|hover|press|drag|key K|after MS [when='expr'] -> nav TARGET [smart|dissolve|instant|moveIn|moveOut|push|slideIn|slideOut] [dir] [MS] [easing]
                                                              ; back ; overlay T [pos] ; swap T ; close ; link 'url' ; setvar name='expr' ; change Prop=Value ...
```
Refs: local ids, `page`, `sel` (first selected node), `n:<id>` (an existing node from the selection digest), `unit/id` (explicit namespaced ref). Strings take `'single'` or `"double"` quotes (`\'` escapes). Lines that are not ops (prose, code fences, `#` comments) are ignored and counted.

Validation: unique ids per unit, parents defined before children, section only on the page, no children under text/shapes/instances, node cap 300, depth cap 12, sizes up to 20,000, enum and range checks. **Unknown tokens and components do not reject a line**: they warn, and the applier substitutes the wireframe fallback.

## Wiring into your editor
Implement `EngineAdapter` and `GhostHandle` (`src/types.ts`); `src/apply/memory-engine.ts` is a complete reference.
- `beginGhost()` opens a transient transaction. `create/set/bind/applyStyle/...` should write to your scene graph through the **command bus** with a `ghost` flag (draw at reduced opacity, exclude from export and multiplayer until accepted).
- `commit()` clears the flag and closes **one undo step**; `discard()` removes every node created.
- Tokens resolve through the catalogue: variable id gives `bind`, style id gives `applyStyle`, literal value gives `set`. Missing tokens fall back to neutral wireframe grey.
- Suggested UI: drop `.md` files (use `loadSources`) and type a prompt, press Generate, show a job chip from `onUnit` (mode and ETA), render ghosts as ops land (`GhostOptions.onOp`), then Accept / Reject. Call `session.markStale()` if the selection changes mid-run, and abort with an `AbortSignal`.
- Your existing MCP and AI plumbing stays untouched: `OllamaProvider` and `FakeProvider` implement the small `AIProvider` interface, so a cloud agent is one more adapter.

## Running qwen3.8:27b on a CPU-only machine
- `OllamaProvider` sends `think: false`, `num_ctx: 8192`, `keep_alive: 30m`, `temperature: 0.2`, and a per-unit `num_predict` cap.
- The system prompt (`SYSTEM_PREFIX`) is constant, with all variable content in the user message, so Ollama can reuse the KV cache across requests.
- Run `provider.calibrate()` once and pass the result as `calibration`; ETAs then come from measured prompt and generation speed.
- Set `OLLAMA_NUM_PARALLEL=1`, `OLLAMA_MAX_LOADED_MODELS=1`, `OLLAMA_FLASH_ATTENTION=1`, `OLLAMA_KV_CACHE_TYPE=q8_0`.
- The plan keeps model requests small (one section each) and uses one repair request at most, containing only the rejected lines.

## Layout
`src/ops` tokenizer, parser, validator · `src/brief` Markdown reader, planner, deterministic composer · `src/catalog` tokens and components, fuzzy match, retrieval · `src/apply` ghost session and reference engine · `src/prompt` system prefix and message builders · `src/provider` Ollama and scripted providers · `src/pipeline` orchestrator, flow wiring · `tests/` 31 tests.

## Known limits
- `when=` and `setvar` expressions are stored as text; plug your expression checker (spec section 5.4) into `validate` for static type checks.
- Deterministic flow wiring covers click transitions found by control label (or the first button); anything else goes to the model as a small `ix` request when a provider exists.
- Component matching is heuristic. Tune synonyms in `src/catalog/catalog.ts` or give components `keywords` in your catalogue source.
- Screenshots and vision input are not used.
- Not yet connected to the real command bus: the `GhostHandle` mapping is yours to write.
