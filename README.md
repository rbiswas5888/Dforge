# DesignForge AI — Professional AI-Native Design Platform & React Compiler

DesignForge AI is an advanced desktop-class visual design, prototyping, and design-to-code platform combining the object-level vector precision of Figma, the interactive website building and responsive animation of Framer, and an intelligent proprietary AI design engine that translates design intent directly into validated, editable document operations and production-grade React components.
https://github.com/rbiswas5888/Dforge/wiki


MVP1 - https://designforgeai.netlify.app/


---

## ⚡ Key Highlights

1. **Deterministic Canonical Scene Graph**
   - Strictly conforms to `document-v1.schema.json`.
   - Complete scene graph supporting Frames, Sections, Rectangles, Ellipses, Text, Vector paths, and Component instances.
   - Preserves stable UUIDs, parent-child relationships, typography, fill/stroke/shadow styling, and responsive layout configurations.

2. **60 FPS Infinite Canvas 2D Engine**
   - Infinite two-dimensional coordinate space with subpixel precision and `devicePixelRatio` scaling.
   - Smooth viewport pan and zoom (0.05× to 32×).
   - Real-time direct manipulation: selection bounding box with 8 interactive resize handles and rotation handle.
   - Smart alignment snapping guides (magenta snap lines for center, left, right, top, bottom edges).
   - Multi-selection marquee box.
   - Double-click inline text editing.

3. **Auto Layout & Responsive Flexbox Engine**
   - Horizontal and Vertical stacks with configurable gaps, padding (top, right, bottom, left), alignments (start, center, end), and justifications (start, center, space-between).
   - Real-time world bounds calculation and parent offset propagation.

4. **Cross-Platform Keyboard Shortcuts**
   - Full parity with standard industry workflows across macOS (`⌘`, `⌥`), Windows, and Linux (`Ctrl`, `Alt`).
   - `⌘Z` (Undo), `⌘⇧Z` (Redo), `⌘D` (Duplicate), `Del`/`Backspace` (Delete), `⌘A` (Select All), `⌘S` (Save Native `.dforge`), `⌘⇧E` (Export React), `⌘⇧K` (AI Assistant), `F` (Frame), `R` (Rectangle), `O` (Ellipse), `T` (Text), `V` (Select), `Space` (Hand Pan), `?` (Shortcut cheat sheet).

5. **Proprietary AI Design Engine**
   - Understands document context: selected objects, active tokens, page hierarchy.
   - Generates typed, structured `DesignPlan` operations (`createTree`, `updateNode`, `applyLayout`, `applyTheme`).
   - Supports natural language prompts:
     - *"Create a SaaS pricing table with 3 tiers"*
     - *"Create modern hero landing section with CTA"*
     - *"Create authentication login card with SSO"*
     - *"Apply dark theme tokens"*
     - *"Make layout vertical stack with 16px gap"*
     - *"Generate mobile responsive screen (375px)"*
   - Visual change diff preview before applying.
   - Zero-dependency local deterministic generator works 100% offline with zero cloud latency, plus optional cloud provider gateway.

6. **Deterministic Design-to-React Compiler**
   - Emits clean, production-ready React 18/19 + TypeScript (`.tsx`) components.
   - Generates `package.json`, `tsconfig.json`, `README.md`, `src/tokens/tokens.ts`, `src/App.tsx`, and component files.
   - Zero runtime dependency on DesignForge AI in exported projects.
   - **Embedded Live React Preview**: Renders compiled components in a sandboxed iframe inside the application!

7. **Framer-Inspired Prototype Simulator**
   - Interactive player with device bezels: Desktop (1440px), Tablet (768px), and Mobile (375px).
   - Real-time click/hover interactive feedback.

8. **Local-First Storage & Ownership**
   - Debounced autosave to local browser storage so work is never lost.
   - Native `.dforge` project file export and upload/import with 100% fidelity.

   [page@825f5485994a3beef4bbc5ce6a6de5ed.webm](https://github.com/user-attachments/assets/15d1a505-baaa-4a0b-a634-5e976ebf1996)


 <img width="1440" height="900" alt="24_editor_canvas_tools_verified" src="https://github.com/user-attachments/assets/8ef0001b-4720-4fd3-a9d4-da07feaf30ec" />
<img width="1440" height="900" alt="20_editor_canvas_loaded" src="https://github.com/user-attachments/assets/e5151da2-91df-40b1-a7a6-a3358748ceb3" />
<img width="1440" height="900" alt="19_project_settings_members_table" src="https://github.com/user-attachments/assets/b04d4e7e-2e2f-44bd-bab9-82c3ace4c799" />
<img width="1440" height="900" alt="16_workspace_projects_listing" src="https://github.com/user-attachments/assets/022f000c-89a3-4a41-9ff3-488b6a8563f1" />
<img width="390" height="844" alt="12_mobile_forgot_password_modal" src="https://github.com/user-attachments/assets/7bae8593-91a1-4749-b15f-5ffeb97e2617" />
<img width="390" height="844" alt="11_mobile_standard_login" src="https://github.com/user-attachments/assets/668b5949-6546-4dcc-af56-25dca450bad8" />
<img width="1440" height="900" alt="08_desktop_sign_out_complete" src="https://github.com/user-attachments/assets/e863d0c2-ff49-4733-b357-593af31669ca" />
<img width="1440" height="900" alt="06_desktop_credentials_filled" src="https://github.com/user-attachments/assets/34a1c546-614a-4a47-a6bd-3e9457d1b898" />
<img width="1440" height="900" alt="04_desktop_login_incorrect_password" src="https://github.com/user-attachments/assets/b1eadcd2-60b3-4d89-84f4-947b5d1e0d57" />
<img width="1440" height="900" alt="01_desktop_login_initial" src="https://github.com/user-attachments/assets/870fa9f7-6f40-4bcc-aba4-552752dfe651" />

---

## 🚀 Running DesignForge AI

Simply open `designforge-ai/index.html` in any modern web browser, or launch a local static HTTP server:

```bash
# Using Python
cd designforge-ai
python3 -m http.server 3000

# Open in browser:
# http://localhost:3000
```
