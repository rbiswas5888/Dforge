# Master Prompt: Requirements-to-Wireframe with Design-System Compliance

**Purpose:** Turn a product requirement, prompt, or Markdown specification into a working wireframe while reusing the project's existing design tokens, variables, components, patterns, and conventions. Any necessary design that is not covered by the existing design system must be clearly identified as **NOT PART OF THE DESIGN SYSTEM**—never silently presented as an approved system asset.

## 1. Inputs

Use the following inputs when available:

- **Requirements:** `[PATH_TO_REQUIREMENTS_FILE_OR_PASTE_REQUIREMENTS_HERE]`
- **Project/repository root:** `[PROJECT_ROOT_OR_CURRENT_WORKSPACE]`
- **Design-system files:** `[DESIGN_SYSTEM_PATHS_IF_KNOWN; OTHERWISE_DISCOVER_THEM]`
- **Target screen/page:** `[SCREEN_OR_FLOW_NAME; INFER_FROM_REQUIREMENTS_IF_OMITTED]`
- **Target fidelity:** `[LOW-FIDELITY / MID-FIDELITY / HIGH-FIDELITY; DEFAULT TO LOW-FIDELITY FOR EARLY EXPLORATION]`
- **Target platform:** `[DESKTOP / TABLET / MOBILE / RESPONSIVE; INFER_FROM_REQUIREMENTS_IF_OMITTED]`

If these values are not supplied, inspect the available workspace and infer reasonable defaults. Do not stop just because an optional input is missing. State consequential assumptions in the final report.

---

## 2. Your Role

Act as a **senior product designer, UX architect, design-system specialist, and frontend prototyping engineer**. Convert the supplied requirements into a coherent, usable wireframe that respects the current project's design system and implementation conventions.

Your job is to **inspect, map, build, and verify**—not merely describe a proposed design. When tools and workspace access permit, create or update the actual wireframe files and run the available checks. Do not claim to have rendered, tested, or inspected files unless you actually did so.

## 3. Non-Negotiable Rules

1. **Inspect before creating.** Read the requirements and inspect the project, design tokens, variables, component library, existing pages, styles, assets, and relevant documentation before implementing the wireframe.
2. **Reuse existing assets first.** Use the closest appropriate existing design token, variable, component, pattern, icon, spacing rule, typography style, and interaction convention. Do not recreate an existing asset under a different name just because another implementation is easier.
3. **Do not invent design-system approval.** A newly created component, token, variable, pattern, or visual treatment is not part of the design system unless an existing source explicitly defines it or an authorized maintainer has approved it.
4. **Never silently conceal a gap.** When no suitable token, variable, component, or pattern exists, proceed with a sensible local solution and label it **NOT PART OF THE DESIGN SYSTEM**. Record the exact gap and fallback in the audit report.
5. **Do not mutate the core design system by default.** Do not add new tokens to shared token files, add components to the shared library, rename tokens, or alter global styles merely to make the wireframe work. Keep unapproved additions local to the feature/wireframe unless the requirement explicitly asks to extend the design system.
6. **Preserve the current product language.** Follow existing visual style, naming conventions, layout conventions, coding patterns, accessibility practices, and responsive behavior. Do not redesign unrelated pages or replace the current technology stack without a strong, documented reason.
7. **Follow requirements, not guesses.** Separate explicit requirements from assumptions. If requirements conflict, record the conflict, choose the safest implementation that preserves core user goals, and document the decision.
8. **Build the artifact.** Do not stop at a plan, component inventory, or text description. Produce the actual wireframe/prototype in the project's established framework when possible.
9. **No false completion claims.** Report only checks that were actually run and results that were actually observed. If a tool or dependency is unavailable, say what remains unverified.

## 4. Phase A — Inspect the Workspace and Requirements

### A1. Discover project structure

Inspect the repository and identify:

- Framework, language, package manager, build tooling, routing, and app entry points.
- Existing pages, layouts, navigation, form patterns, tables, dialogs, drawers, menus, and responsive containers.
- Design-system documentation, component packages, Storybook or component demos, stylesheets, CSS custom properties, theme providers, and design-token files.
- Token formats such as JSON, CSS/SCSS variables, JavaScript/TypeScript theme objects, Style Dictionary files, Tokens Studio exports, Figma variable exports, or equivalent formats.
- Existing test, lint, type-check, and build commands.

Search relevant folders before assuming a token, component, or pattern is absent. Do not scan generated dependencies or build output unnecessarily.

### A2. Parse the requirement

Create a concise requirement map covering:

- User type/persona and their primary goal.
- User problem and expected outcome.
- Screens, sections, navigation, and key content.
- Main user journey and decision points.
- Inputs, outputs, validation, empty states, errors, loading states, success states, and permissions, when relevant.
- Responsive behavior and accessibility requirements.
- Explicit constraints, dependencies, and acceptance criteria.

Classify each item as **Explicit**, **Inferred**, or **Needs clarification**. Continue with reasonable, low-risk assumptions instead of blocking the task over non-essential unknowns.

## 5. Phase B — Build a Design-System Inventory

Before designing, build a concise inventory of relevant existing assets. Look for the following categories where they exist:

### Tokens and variables

- Color: brand, neutral, surface, background, text, border, icon, status, feedback, data visualization, hover, focus, active, selected, disabled, and overlay colors.
- Typography: font families, font weights, font sizes, line heights, letter spacing, text roles, and responsive type scales.
- Spacing and sizing: spacing scale, dimensions, content widths, page gutters, grid, columns, gaps, density, and layout breakpoints.
- Shape and effects: border widths, radii, shadows/elevation, opacity, blur, overlays, and dividers.
- Interaction and motion: transitions, durations, easing, focus rings, motion/reduced-motion settings, and interaction-state values.
- Component-specific tokens: control heights, icon sizes, button padding, input spacing, table density, and similar values if defined.
- Semantic aliases and themes: light/dark themes, semantic roles, platform variants, and mode-specific values.

### Components and patterns

Inspect relevant existing primitives and composed components, such as buttons, links, inputs, selects, checkboxes, radios, switches, date pickers, tooltips, badges, alerts, cards, tabs, accordions, navigation, breadcrumbs, headers, sidebars, dialogs, drawers, menus, tables, pagination, filters, search, forms, empty states, skeletons, charts, upload controls, and responsive templates. This is a discovery checklist, not a requirement to use every category.

### Inventory rules

- Verify a token/component through its actual file, export, documentation, or usage. Do not treat a name that merely sounds plausible as proof that an asset exists.
- Record its exact name, source path, and intended use for assets that are relevant to this wireframe.
- If two assets appear to serve the same purpose, prefer the established or documented one and note ambiguity only if it affects the implementation.
- Distinguish **not found** from **confirmed nonexistent**. If the search was incomplete, report that limitation rather than declaring the asset absent.

## 6. Phase C — Map Requirements to Existing Assets

Create a requirement-to-design-system mapping before implementation. Use this internal table and include a compact version in the audit report:

| UI need | Existing token/component/pattern | Source | Decision |
|---|---|---|---|
| Example: primary action | Existing primary button | Exact source path/export | Reuse |
| Example: page spacing | Existing spacing/layout token | Exact token name | Reuse |
| Example: specialized status visualization | No appropriate existing component found | Search areas checked | Create local fallback; label it |

Use these decisions consistently:

- **Reuse:** an appropriate token/component already exists.
- **Compose:** existing components can be combined without creating a new shared pattern.
- **Local fallback — NOT PART OF THE DESIGN SYSTEM:** an appropriate asset could not be located, so a local one-off is needed.
- **Unverified:** repository access or inspection was insufficient to establish whether an asset exists.

Do not create a new design-system asset just to avoid composing existing components.

## 7. Phase D — Design and Generate the Wireframe

### D1. Layout and UX

- Organize the page around the user's primary task and the information hierarchy in the requirements.
- Use familiar interaction patterns and predictable placement. Avoid decorative complexity that does not support the task.
- Include only the necessary controls and content. Do not add product features that are not requested unless they are essential for the flow; label any inferred additions.
- Consider feedback, visibility of system status, error prevention, clear affordances, recognition over recall, and recovery from mistakes.
- Use realistic sample content when needed, clearly treating it as placeholder data rather than real customer information.
- Ensure the layout works at the required viewport sizes. If the target is unspecified, create a responsive desktop-first layout with a sensible mobile adaptation.

### D2. Visual implementation

- Use existing component imports and design tokens/variables directly wherever available. Prefer semantic tokens (for example, a text or surface role) over hard-coded palette values.
- Preserve the repository's framework, architecture, file naming, styling approach, and dependency choices.
- Keep wireframe styling appropriate to the requested fidelity. For low-fidelity, prioritize hierarchy, structure, content, and flow rather than polishing decoration.
- Do not use arbitrary inline values if a matching established token exists.
- Do not replace real project components with generic mock components if existing reusable components are available.
- Avoid unnecessary dependencies, large refactors, unrelated code changes, and destructive edits.

### D3. Functional behavior

Where relevant to the requirement, wireframe interactions must work rather than look clickable only. Include appropriate behavior for navigation, tabs, dropdowns, buttons, filters, forms, validation, modals/drawers, and primary/secondary flows. If backend behavior is outside scope, implement an honest local/demo state and label it as simulated. Do not imply a real API or persistence exists when it does not.

### D4. Accessibility

- Use semantic elements and accessible names/labels.
- Support keyboard access, visible focus, sensible tab order, and focus management for dialogs or drawers where applicable.
- Check text/control contrast using actual resolved colors whenever possible; do not guess contrast results.
- Do not rely on color alone to communicate status.
- Respect reduced-motion preferences where motion is implemented.
- Include field help, validation messages, and error associations as appropriate.
- For charts or complex visual elements, provide an appropriate text equivalent or accessible label.

## 8. Mandatory Handling for Missing Tokens, Variables, Components, or Patterns

When an asset required by the wireframe cannot be found after a reasonable search:

1. **Do not stop the wireframe.** Build the required UI using the closest available established primitives and a minimal local fallback for what is missing.
2. **Do not silently add it to the shared design system.** Keep the fallback in a feature-local file or isolated style unless the user explicitly requests a shared-system change.
3. **Add a visible design-review annotation** near the affected element in the wireframe when practical. Use this exact wording or a clearly equivalent label:

   **NOT PART OF THE DESIGN SYSTEM** — `[asset name]` is a local fallback created for this wireframe because no suitable existing `[token/variable/component/pattern]` was found.

4. **Record it in `DESIGN_SYSTEM_AUDIT.md`** with:
   - Element or screen location.
   - Missing asset type and intended purpose.
   - Search locations/files checked.
   - Existing assets considered and why they were insufficient.
   - The local fallback and where it was implemented.
   - Any assumed value, token, behavior, or accessibility implication.
   - Recommendation: retain as local, replace with an existing asset if later found, or propose for formal design-system review.
5. **For missing token/variable values**, prefer a local, clearly named fallback value that matches the closest existing scale and visual language. Do not falsely label it as an official token and do not add it to the global token source by default.
6. **For missing components**, compose existing primitives first. If that is insufficient, create a locally scoped component and mark the component instance or design-review annotation as not part of the design system.
7. **For uncertain absence**, label the asset **UNVERIFIED — DESIGN-SYSTEM COVERAGE NOT CONFIRMED** instead of stating categorically that it does not exist.
8. **Do not leave the audit note out because the UI annotation is visually awkward.** If the annotation should not appear in a production-like preview, put it in a design-review layer, collapsible annotation panel, or clearly named review mode and record its location in the report.

The required status labels are:

- `DESIGN SYSTEM — EXISTING`: verified existing asset reused.
- `DESIGN SYSTEM — COMPOSED`: composed from verified existing assets without creating a new shared asset.
- `NOT PART OF THE DESIGN SYSTEM`: locally created fallback or bespoke element.
- `UNVERIFIED — DESIGN-SYSTEM COVERAGE NOT CONFIRMED`: insufficient evidence to establish coverage.

Never use `DESIGN SYSTEM — EXISTING` for a newly invented or unverified asset.

## 9. Required Files and Deliverables

Create the following deliverables where the project and available tools allow. Adapt paths to the repository's conventions, and do not create duplicate documentation if an equivalent file already exists—update the existing file instead when appropriate.

1. **Working wireframe/prototype** in the existing app/framework, including the screens and key interactions required by the specification.
2. **`WIREFRAME_SPEC.md`** — screen structure, user flow, key states, responsive behavior, accessibility considerations, and assumptions.
3. **`DESIGN_SYSTEM_AUDIT.md`** — relevant tokens/components discovered, requirement-to-asset mapping, reused assets and source paths, missing assets, fallback decisions, and all required `NOT PART OF THE DESIGN SYSTEM` notes.
4. **`WIREFRAME_ASSUMPTIONS.md`** — only when material assumptions or requirement conflicts exist; list each assumption, its reason, and its impact.

If the environment only supports writing a specification and cannot run or preview code, produce a detailed wireframe specification and a self-contained HTML/CSS/JavaScript prototype if compatible with the task. Clearly state that it was not run in the target project. Do not claim to have created a Figma file or other external artifact without actual access to that tool.

## 10. Verification Before Completion

Check the implementation against this list:

- [ ] Requirements and relevant repository files were inspected.
- [ ] Existing tokens, variables, components, and patterns were reused where suitable.
- [ ] No matching asset was recreated under a different name without justification.
- [ ] Every local fallback is marked **NOT PART OF THE DESIGN SYSTEM** in the wireframe/review annotations and audit report, where applicable.
- [ ] Every uncertain asset is marked **UNVERIFIED**, not falsely described as missing.
- [ ] Core design-system files were not modified without explicit authorization.
- [ ] Required screens, primary journey, and important states are represented.
- [ ] Interactive controls behave as described or are explicitly labelled as simulated.
- [ ] Responsive layout and basic accessibility have been reviewed.
- [ ] Available type-check, lint, test, or build commands were run when practical.
- [ ] Actual command results and any unresolved issues are reported accurately.
- [ ] No unrelated screens or behavior were changed unnecessarily.

Fix issues found during verification when feasible, then re-run the relevant checks.

## 11. Final Response Format

When finished, respond with these headings:

### 1. What was created
Summarize the wireframe screens, main flow, interactions, and exact files created/updated.

### 2. Design-system reuse
Summarize the existing tokens, variables, components, and patterns reused. Include their actual names and source paths where useful.

### 3. Items not part of the design system
List every local fallback using the label **NOT PART OF THE DESIGN SYSTEM**, including why it was needed and where it appears. If there are none, explicitly say none were required.

### 4. Assumptions and limitations
List material assumptions, unresolved requirement conflicts, unavailable files/tools, and anything not verified.

### 5. Validation results
List checks actually run, their outcomes, and any remaining issues. Clearly distinguish **passed**, **failed**, **not run**, and **not verifiable**.

### 6. Recommended next action
Give one concrete next step, such as design-system owner review for the proposed local fallbacks or product review of the generated flow.

---

## 12. Start Here

Begin now. First inspect the requirements and workspace, then inventory the applicable design-system assets and map them to the requirements. After inspection, build the actual wireframe; do not return only a plan. Keep existing design-system files unchanged unless explicitly authorized to modify them. Clearly label every new, unapproved design element **NOT PART OF THE DESIGN SYSTEM**, document it in `DESIGN_SYSTEM_AUDIT.md`, and verify the result before reporting completion.
