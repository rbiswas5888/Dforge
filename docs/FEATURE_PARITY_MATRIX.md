# DesignForge AI — Feature & Parity Matrix

## Status Legend
- ✅ **Implemented** — Working in current build
- 🚧 **In Progress** — Partially implemented
- 📋 **Planned (Phase N)** — Roadmapped
- ❌ **Not Planned** — Out of scope for now

---

## 1. Design Core (Figma-Inspired)

| Feature | Status | Phase | Notes |
|---------|--------|-------|-------|
| Infinite canvas pan/zoom | ✅ | 1 | Canvas 2D viewport transform |
| Frame / Artboard creation | ✅ | 1 | Root-level frames |
| Rectangle, ellipse shapes | ✅ | 1 | With fill, stroke, corner radius |
| Text objects | ✅ | 1 | Font, size, weight, color |
| Image placement | ✅ | 1 | Base64 embedded |
| Selection tool | ✅ | 1 | Click + marquee |
| Move and resize | ✅ | 1 | Handles + direct manipulation |
| Rotation | ✅ | 1 | Transform handle |
| Undo / Redo | ✅ | 1 | Bounded history with named transactions |
| Layers panel | ✅ | 1 | Tree view with visibility/lock |
| Properties inspector | ✅ | 1 | Contextual property panels |
| Keyboard shortcuts | ✅ | 1 | Centralized keymap registry |
| Save / Load project | ✅ | 1 | IndexedDB persistence |
| Group / Ungroup | ✅ | 1 | |
| Copy / Paste / Duplicate | ✅ | 1 | |
| Bring forward / Send back | ✅ | 1 | Z-order management |
| Lock / Hide layers | ✅ | 1 | |
| Multi-select | ✅ | 1 | Shift-click + marquee |
| Align and distribute | ✅ | 1 | Smart alignment tools |
| Color picker | ✅ | 1 | Hex + HSL inputs |
| Fill types (solid, gradient) | 🚧 | 1-2 | Solid done; gradient Phase 2 |
| Stroke properties | ✅ | 1 | Color, width, position |
| Drop shadow / Inner shadow | ✅ | 1 | CSS-equivalent |
| Blur effects | 📋 | 2 | |
| Corner radius | ✅ | 1 | Uniform; per-corner Phase 2 |
| Opacity and blend modes | ✅ | 1 | Opacity full; blend modes Phase 2 |
| Auto Layout (flex-like) | 🚧 | 1-2 | Basic stack; full Phase 2 |
| Layout constraints | 📋 | 2 | |
| Grid layout | 📋 | 2 | |
| Responsive breakpoints | 📋 | 2 | |
| Components & variants | 📋 | 2 | |
| Design tokens / variables | 📋 | 2 | |
| Typography styles | 📋 | 2 | |
| Color styles | 📋 | 2 | |
| Asset library | 📋 | 2 | |
| SVG import/edit | 📋 | 2 | |
| Boolean operations | 📋 | 3 | |
| Pen/vector tool | 📋 | 3 | |
| Masks and clipping | 📋 | 3 | |
| Find and replace | 📋 | 3 | |

---

## 2. AI-Native Features (Original)

| Feature | Status | Phase | Notes |
|---------|--------|-------|-------|
| AI command panel | ✅ | 1 | Collapsible prompt interface |
| LLM model gateway | ✅ | 1 | Gemini/OpenAI adapter |
| Context-aware prompt | ✅ | 1 | Sends selected node context |
| Typed DesignPlan schema | ✅ | 1 | JSON schema validated |
| Prompt → structured actions | ✅ | 1 | createFrame, createText, updateProps |
| Preview before apply | ✅ | 1 | Diff view + accept/reject |
| AI undo support | ✅ | 1 | Named undo transaction |
| Design context retrieval | 🚧 | 1-2 | Selected node; full project Phase 2 |
| Component-aware generation | 📋 | 4 | Reuse existing components |
| Token-aware generation | 📋 | 4 | Bind to existing tokens |
| Design analysis / explain | 📋 | 4 | "Why is this overflowing?" |
| Wireframe → polished design | 📋 | 4 | |
| AI accessibility audit | 📋 | 4 | |
| AI design-system consistency check | 📋 | 4 | |
| AI-generated variant exploration | 📋 | 4 | |
| Prompt history | ✅ | 1 | Per-session |
| Local inference mode | 📋 | 6 | Ollama adapter |
| Inference mode indicator | ✅ | 1 | Shows local vs remote in UI |
| AI action scope protection | ✅ | 1 | Allowlisted action schema |

---

## 3. Framer-Inspired Website/Prototype Features

| Feature | Status | Phase | Notes |
|---------|--------|-------|-------|
| Multi-page document | ✅ | 1 | Pages panel |
| Click interaction definition | 📋 | 5 | |
| Hover state | 📋 | 5 | |
| Page navigation transitions | 📋 | 5 | |
| Overlay / modal interactions | 📋 | 5 | |
| Prototype preview mode | 📋 | 5 | |
| Animation timeline | 📋 | 5 | |
| Spring/easing controls | 📋 | 5 | |
| Component state machine | 📋 | 5 | |
| Scroll-triggered interactions | 📋 | 5 | |
| Responsive website preview | 📋 | 5 | |
| CMS collections | 📋 | 6 | |
| Form behavior | 📋 | 5 | |
| SEO metadata editor | 📋 | 5 | |
| Page routing | 📋 | 5 | |
| Sticky/fixed elements | 📋 | 5 | |
| Preview server | 📋 | 5 | |
| Publishing adapter | 📋 | 6 | |

---

## 4. React Compiler Features

| Feature | Status | Phase | Notes |
|---------|--------|-------|-------|
| Compiler IR | ✅ | 1 | Document → IR pipeline |
| JSX/TSX generation | ✅ | 1 | Frames, shapes, text |
| CSS generation | ✅ | 1 | Inline → CSS file |
| Token compilation | 📋 | 3 | CSS custom properties |
| Reusable component generation | 📋 | 3 | |
| Asset export | 📋 | 3 | |
| package.json generation | ✅ | 1 | Vite + React template |
| README generation | ✅ | 1 | |
| Iframe sandbox preview | ✅ | 1 | Blob URL + sandboxed iframe |
| Build validation | 📋 | 3 | esbuild / Vite check |
| TypeScript output | ✅ | 1 | TSX files |
| Tailwind CSS profile | 📋 | 3 | |
| Next.js App Router profile | 📋 | 3 | |
| Export diagnostics report | ✅ | 1 | Warnings, unsupported features |
| Interaction compilation | 📋 | 5 | React state + handlers |
| Responsive media queries | 📋 | 3 | From breakpoint data |
| Accessibility annotations | 📋 | 3 | aria-label, roles |

---

## 5. Project Management Features

| Feature | Status | Phase | Notes |
|---------|--------|-------|-------|
| New project | ✅ | 1 | |
| Open project | ✅ | 1 | From IndexedDB list |
| Save | ✅ | 1 | Explicit + autosave |
| Save as / Duplicate | 📋 | 2 | |
| Export .dforge package | 📋 | 2 | ZIP blob |
| Import .dforge package | 📋 | 2 | |
| Version history | 📋 | 6 | |
| Autosave recovery | 📋 | 2 | Journal + snapshot |
| Recent projects | ✅ | 1 | IndexedDB project list |
| Project thumbnails | 📋 | 2 | |

---

## 6. Collaboration (Future)

| Feature | Status | Phase | Notes |
|---------|--------|-------|-------|
| Real-time presence | 📋 | 6 | WebSocket |
| Shared libraries | 📋 | 6 | |
| Comments / annotations | 📋 | 6 | |
| Version control | 📋 | 6 | |
| Access control | 📋 | 6 | |
| Conflict resolution | 📋 | 6 | |

---

## 7. Keyboard Shortcut Coverage

| Shortcut | Action | macOS | Win/Linux | Status |
|----------|--------|-------|-----------|--------|
| Undo | Undo last operation | ⌘Z | Ctrl+Z | ✅ |
| Redo | Redo operation | ⌘⇧Z | Ctrl+Shift+Z | ✅ |
| Copy | Copy selected | ⌘C | Ctrl+C | ✅ |
| Cut | Cut selected | ⌘X | Ctrl+X | ✅ |
| Paste | Paste | ⌘V | Ctrl+V | ✅ |
| Duplicate | Duplicate in place | ⌘D | Ctrl+D | ✅ |
| Select All | Select all nodes | ⌘A | Ctrl+A | ✅ |
| Delete | Delete selected | ⌫/Del | Del | ✅ |
| Group | Group selection | ⌘G | Ctrl+G | ✅ |
| Ungroup | Ungroup | ⌘⇧G | Ctrl+Shift+G | ✅ |
| Frame | Create frame | F | F | ✅ |
| Rectangle | Rectangle tool | R | R | ✅ |
| Ellipse | Ellipse tool | O | O | ✅ |
| Text | Text tool | T | T | ✅ |
| Move | Selection tool | V/Esc | V/Esc | ✅ |
| Zoom in | Zoom in | ⌘+ | Ctrl++ | ✅ |
| Zoom out | Zoom out | ⌘- | Ctrl+- | ✅ |
| Fit canvas | Zoom to fit | ⌘⇧0 | Ctrl+Shift+0 | ✅ |
| Zoom 100% | Actual size | ⌘0 | Ctrl+0 | ✅ |
| Hand tool | Pan mode (hold) | Space | Space | ✅ |
| Save | Save project | ⌘S | Ctrl+S | ✅ |
| Toggle AI | Open AI panel | ⌘⇧K | Ctrl+Shift+K | ✅ |
| Bold | Bold text | ⌘B | Ctrl+B | ✅ |
| Italic | Italic text | ⌘I | Ctrl+I | ✅ |
| Bring forward | Move up in z-order | ⌘] | Ctrl+] | ✅ |
| Send backward | Move down in z-order | ⌘[ | Ctrl+[ | ✅ |
| Bring to front | Move to top | ⌘⌥] | Ctrl+Alt+] | ✅ |
| Send to back | Move to bottom | ⌘⌥[ | Ctrl+Alt+[ | ✅ |
| Toggle layers | Show/hide layers | ⌘⌥1 | Ctrl+Alt+1 | ✅ |
| Toggle inspector | Show/hide inspector | ⌘⌥2 | Ctrl+Alt+2 | ✅ |
| Shortcut help | Show shortcut panel | ? | ? | ✅ |
| Export React | Compile to React | ⌘⇧E | Ctrl+Shift+E | ✅ |
