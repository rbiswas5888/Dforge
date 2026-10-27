# DesignForge AI — External Design Import Engine
## Detailed Implementation Specification

**Document type:** Engineering Specification / Technical Design  
**Product:** DesignForge AI  
**Subsystem:** External Design Interoperability Engine  
**Default import strategy:** Structure-Preserving Import  
**Native destination format:** `.dforge`  
**Prototype interaction import:** Enabled  
**Asset import:** Enabled  
**Design token and component import:** Enabled  
**Primary objective:** Convert external design projects into editable DesignForge projects while preserving the original structure, visual appearance, reusable assets, design-system information and supported prototype interactions.

---

# 1. Executive Summary

DesignForge AI must provide a robust external design import system that enables designers to continue working on existing projects created in other design applications without manually recreating their screens.

The system must support source-specific import adapters for:

- Figma — `.fig` and authorized alternative import mechanisms.
- Sketch — `.sketch`.
- Adobe XD — `.xd` and supported interchange exports.
- Adobe Illustrator — `.ai`, `.ait`, SVG, EPS and PDF-based workflows.
- Axure RP — `.rp` and supported published or interchange exports.
- Adobe Photoshop — `.psd`, `.psb`.
- Penpot — supported native and interchange formats.
- Additional design applications through extensible adapters.

The importer must reconstruct the source document using DesignForge's native document model rather than simply placing a screenshot onto the canvas.

The system must attempt to preserve:

1. Pages, artboards, frames, sections and layer hierarchy.
2. Layer names, positions, dimensions, transforms and constraints.
3. Text, typography, fills, strokes, gradients and supported effects.
4. Components, variants, instances, symbols and reusable styles.
5. Design tokens, variables, themes and design-system relationships.
6. Raster images, vector assets, fonts and linked resources.
7. Prototype connections, navigation, triggers, transitions, overlays and supported state.
8. Desktop, tablet and mobile layouts where represented by the source.
9. Source-specific metadata needed for traceability and future re-imports.

The import engine must distinguish between features that were successfully reconstructed, features that were converted with limitations, and features that could not be imported.

**Core rule:** Never silently discard design content or claim full editability when a source format does not expose enough information to reconstruct it.

# 2. Product Requirements

## 2.1 Primary goals

- Provide a unified import workflow for multiple design applications.
- Preserve source hierarchy and editable structure.
- Import supported components, variables, tokens and assets.
- Reconstruct supported prototype interactions.
- Retain original source files and source metadata.
- Save converted projects as editable `.dforge` files.
- Provide an import preview and fidelity report before finalizing.
- Allow users to resolve missing fonts, images and unsupported features.
- Support batch import and large projects.
- Provide a modular architecture for adding future source formats.

## 2.2 Non-goals

The initial implementation does not guarantee:

- Perfect conversion of every proprietary file format.
- Reconstruction of undocumented internal source formats.
- Recovery of runtime-generated interfaces from static screenshots.
- Exact reproduction of every source application's rendering engine.
- Conversion of arbitrary prototype logic into equivalent executable behaviour.
- Access to private cloud files without user authorization.
- Execution of scripts or plugins embedded in imported projects.

When a format is unavailable for reliable native parsing, the application must use an authorized export, supported API, interchange format or documented fallback.

# 3. Import Modes

The engine must support three import modes.

## 3.1 Structure-Preserving Import — Default

This is the default mode for DesignForge AI.

Requirements:

- Preserve source hierarchy and naming wherever possible.
- Convert supported elements into editable native objects.
- Preserve components, variants, tokens and relationships.
- Import images, vectors and fonts where permitted.
- Reconstruct supported prototype connections and interactions.
- Retain unsupported source objects as embedded or linked references where practical.
- Preserve source identifiers and mapping metadata.
- Report all transformations and limitations.

This mode must prioritize preserving the organization and semantics of the original project, not merely its visual appearance.

## 3.2 Maximum Editable Conversion

This mode prioritizes native DesignForge objects.

Requirements:

- Convert supported vector paths, shapes, text and components into editable objects.
- Map source-specific effects to the closest compatible native properties.
- Replace unsupported source-specific components with documented native equivalents where appropriate.
- Preserve a reference to the original object for traceability.
- Warn when the conversion changes appearance or behaviour.

## 3.3 Visual Reference Import

This mode prioritizes visual fidelity over editability.

Requirements:

- Preserve source pages or artboards as visual references.
- Use raster or vector snapshots where necessary.
- Allow users to create editable overlays and rebuild individual elements.
- Preserve the source file and any extracted assets.
- Clearly label flattened or embedded content.

The selected mode must be visible in the import configuration and recorded in the import report.

# 4. Supported Source Applications and Feasibility

The import engine must maintain a capability registry for every source format.

The registry must distinguish between direct parsing, official API access, authorized export, interchange conversion and visual-reference fallback.

## 4.1 Figma

**Input:** `.fig`, authorized Figma API or supported export/interchange formats.

### Import requirements

- Pages and frames.
- Nested layers and groups.
- Rectangles, ellipses, lines and vector paths.
- Text and typography.
- Fills, strokes, gradients, opacity and supported effects.
- Components, component instances and variants.
- Auto Layout and supported layout constraints.
- Variables, color styles and text styles where exposed.
- Images and supported embedded assets.
- Prototype nodes, connections, triggers and supported actions.
- Screen dimensions and responsive layout metadata where available.

### Technical feasibility

The `.fig` extension must not be treated as a guarantee of a publicly documented, stable, directly parseable format. Validate the actual format, access permissions and implementation constraints before building a native parser.

Use official, authorized APIs or supported exports when they provide sufficient data. Where an API does not expose the required information, use a supported export workflow or report the limitation.

### Acceptance criteria

- Frames and nested layers preserve hierarchy.
- Components remain reusable when supported mappings are available.
- Variables and styles map into DesignForge's token model.
- Supported prototype links are reconstructed.
- Unsupported source properties are included in the fidelity report.

## 4.2 Sketch

**Input:** `.sketch` and supported interchange formats.

### Import requirements

- Pages, artboards and groups.
- Layer names, order, geometry and transforms.
- Text layers and font properties.
- Shapes, vector paths and image fills.
- Symbols, symbol instances and supported overrides.
- Shared styles and color variables where exposed.
- Exportable assets and supported prototype metadata.

### Technical feasibility

Use a source-format adapter based on the documented or verifiable file structure. Validate version compatibility and any archive or resource representation encountered.

### Acceptance criteria

- Artboards map to DesignForge frames.
- Groups and layers preserve their hierarchy.
- Symbols map to components where semantics can be preserved.
- Missing fonts and external assets are reported.
- Unsupported effects remain represented as references or documented conversions where possible.

## 4.3 Adobe XD

**Input:** `.xd` and supported interchange exports.

### Import requirements

- Artboards and layers.
- Shapes, text, images and vector paths.
- Component and repeat-grid information where accessible.
- Colors, character styles and supported reusable styles.
- Supported prototype connections and interaction metadata.
- Assets and source identifiers.

### Technical feasibility

The native `.xd` format must undergo a feasibility assessment before direct parser implementation. Do not assume the format has a stable, publicly supported parsing interface.

If direct parsing is not feasible, support authorized interchange workflows, including SVG, PDF, images or other verified exports. These fallback formats may not retain original components, constraints or prototype interactions.

### Acceptance criteria

- Import route identifies the actual source and conversion path.
- Unsupported native project information is reported.
- Interchange imports are not incorrectly labelled as full native imports.
- Prototype import is marked unavailable when the exported source lacks interaction data.

## 4.4 Adobe Illustrator

**Input:** `.ai`, `.ait`, `.svg`, `.eps` and `.pdf` where supported.

### Import requirements

- Artboards and supported document structure.
- Vector paths, groups and transforms.
- Text objects and supported typography.
- Fills, strokes, gradients and transparency.
- Clipping paths and supported masks.
- Embedded and linked images.
- Supported symbols and reusable graphic elements.

### Technical feasibility

Prefer a native or documented source parser when available. Many Illustrator files may expose PDF-compatible content, but this must be detected and validated rather than assumed for every file.

Use SVG or PDF interchange when it provides a more reliable conversion path. EPS and other formats may require specialized converters.

### Acceptance criteria

- Vector paths remain editable wherever possible.
- Text is retained as text when supported.
- Unsupported Illustrator-specific effects are disclosed.
- Rasterization is limited to elements that cannot be reliably reconstructed.
- Original source artwork remains unchanged.

## 4.5 Axure RP

**Input:** `.rp` and verified published or interchange exports.

### Import requirements

- Pages and screen hierarchy.
- Widgets and their supported properties.
- Text, shapes, images and widget groups.
- Dynamic panels and supported state information.
- Variables, conditions and interaction definitions where accessible.
- Links, navigation and supported prototype actions.
- Source-specific metadata for unsupported widgets.

### Technical feasibility

Axure's native project format must be evaluated against its actual accessibility and supported interfaces. Do not assume that all `.rp` versions can be parsed with a single undocumented archive parser.

Published HTML or other exports may provide visual and interaction references but must not be treated as equivalent to the complete editable source model.

### Interaction conversion

Map supported Axure interactions into DesignForge prototype triggers, actions, conditions and state transitions.

If a source interaction cannot be represented natively, preserve its source description and flag it as requiring manual reconstruction. Do not silently replace conditional behaviour with a simple navigation link.

### Acceptance criteria

- Pages and supported widgets are reconstructed.
- Supported variables and state mappings are documented.
- Conditional interactions are either converted accurately or reported.
- Unsupported dynamic panels remain traceable in the imported project.

## 4.6 Adobe Photoshop

**Input:** `.psd` and `.psb`.

### Import requirements

- Layer hierarchy and groups.
- Raster layers and supported masks.
- Text layers and available typography metadata.
- Layer visibility and ordering.
- Opacity, blend modes and supported effects.
- Embedded images and supported linked assets.
- Document dimensions, resolution and color profiles.

### Technical feasibility

Use a compatible layered-document parser or conversion library. Large PSB documents may require streaming, tiled processing or resource-limited import.

Photoshop-specific effects that cannot be reconstructed as native DesignForge properties may be retained as rasterized layer previews or embedded source assets.

### Acceptance criteria

- Supported layers remain individually editable.
- Layer names and ordering are preserved.
- Unsupported masks and effects are disclosed.
- Flattening occurs only when required and is explicitly reported.
- Original source data remains available for reference.

## 4.7 Penpot

**Input:** Verified native formats, authorized APIs and supported interchange formats.

### Import requirements

- Pages, frames and objects.
- Vector paths and shapes.
- Text, fills, strokes and effects.
- Components and supported variants.
- Reusable styles and design tokens.
- Images and supported assets.
- Prototype connections and supported interactions.

### Technical feasibility

Investigate Penpot's documented file interchange and API capabilities. Prefer supported interfaces and documented formats over private implementation details.

### Acceptance criteria

- Supported design properties map into the native document model.
- Components and variables retain their relationships when possible.
- Prototype conversion is based on available source information.
- Any conversion losses are recorded.

# 5. Source Capability Registry

Every adapter must declare its capabilities rather than relying on assumptions based on the file extension.

Define a capability record containing:

- Source application and format.
- Supported source versions.
- Import method: native parser, official API, interchange, conversion or visual reference.
- Pages and hierarchy support.
- Editable shapes and vectors.
- Text and typography support.
- Components and variants.
- Design tokens and variables.
- Images, fonts and linked assets.
- Prototype interactions.
- Constraints and responsive properties.
- Known limitations.
- Required libraries, permissions and licensing.
- Security restrictions.
- Automated test coverage.

The import engine must consult this registry before accepting a file. If an adapter cannot support a requested feature, the UI must disclose that limitation before import completion.

# 6. System Architecture

Implement the engine as a modular pipeline.

### Stage 1 — File intake

- Accept files through the file picker, drag-and-drop and supported batch-import workflows.
- Detect file signatures and inspect metadata.
- Identify source application and format version where possible.
- Validate file size, structure and integrity.
- Reject or quarantine unsafe files.

### Stage 2 — Capability selection

- Match the file to a registered adapter.
- Identify the best available import path.
- Check source-version compatibility.
- Determine which requested capabilities are available.
- Present any material limitations.

### Stage 3 — Source parsing

- Parse source-specific structures.
- Extract document metadata and resource references.
- Build a source object graph.
- Resolve linked and embedded assets.
- Preserve original identifiers.
- Never execute imported scripts.

### Stage 4 — Normalization

Convert the parsed document into a common intermediate representation.

Normalize:

- Page and frame hierarchy.
- Geometry and coordinate systems.
- Layer types.
- Text and typography.
- Fills, strokes and effects.
- Components and variants.
- Tokens and variables.
- Constraints and responsive properties.
- Assets and references.
- Prototype nodes, triggers and actions.

Retain source-specific properties in an extension metadata structure where necessary.

### Stage 5 — DesignForge document generation

Convert normalized objects into native DesignForge objects.

- Rebuild editable layers.
- Construct native components and instances.
- Register design tokens.
- Import assets into the asset registry.
- Reconstruct supported prototype graphs.
- Preserve source-to-native identifiers.
- Retain unsupported content as traceable references.

### Stage 6 — Validation

Compare the parsed source model with the generated native model.

Validate:

- Object counts and hierarchy.
- Frame dimensions and geometry.
- Text and asset references.
- Component and token mappings.
- Prototype graph integrity.
- Missing resources.
- Unsupported effects.
- Duplicate identifiers.
- Rendering discrepancies.

### Stage 7 — Preview and commit

Display an import preview and fidelity report.

Allow users to resolve supported warnings before finalization. On confirmation, save the converted document as a native `.dforge` project.

The original source file must remain unchanged.

# 7. Canonical Intermediate Representation

Use a source-neutral document model between source parsing and native object creation.

The model must contain:

- Document metadata.
- Pages and frames.
- Nodes and parent-child relationships.
- Geometry and transforms.
- Text and typography.
- Fills, strokes and effects.
- Component definitions and instances.
- Variables, tokens and styles.
- Asset references.
- Prototype graph.
- Responsive properties.
- Source identifiers.
- Unsupported-feature metadata.

Every normalized node must have a stable import identifier and a reference to its original source identifier when available.

Use explicit coordinate-system conversions, unit handling and transform normalization. Do not rely on source-specific geometry assumptions being identical across applications.

The intermediate representation must support schema versioning and migration so that adding new adapters does not require rewriting every existing importer.

# 8. Component, Token and Design-System Mapping

## 8.1 Components

Map source components into DesignForge component definitions when the source exposes the required relationships.

Preserve:

- Component identity.
- Instance relationships.
- Variants and supported properties.
- Overrides.
- Nested component instances.
- Reusable styling.

When a source component cannot be reconstructed completely, import the available visual and structural information and record the missing semantics.

## 8.2 Design tokens

Map source styles and variables into the DesignForge token model.

Support:

- Color tokens.
- Typography tokens.
- Spacing and sizing tokens.
- Radius and border tokens.
- Shadow and elevation tokens.
- Opacity and other supported properties.
- Themes and modes.
- Variable aliases and references.

Preserve source names, values, modes and relationships when available. Avoid duplicating identical tokens unnecessarily.

Where a source token references another token that cannot be mapped, retain the original reference in metadata and provide a resolution warning.

## 8.3 Responsive properties

Map supported constraints and layout rules into DesignForge's responsive layout model.

Preserve fixed sizing, relative sizing, alignment, spacing, constraints and auto-layout behaviour where equivalent semantics exist.

If the source uses layout behaviour that cannot be reproduced exactly, preserve the original measurements and record the conversion difference.

Do not invent tablet or mobile layouts if the source does not contain them. Any AI-generated responsive reconstruction must be an explicitly separate, user-approved operation.

# 9. Prototype Interaction Import

Prototype interaction import is enabled by default.

The importer must reconstruct the source prototype graph using a normalized interaction model.

## 9.1 Supported concepts

Where exposed by the source, import:

- Screen and frame connections.
- Navigation actions.
- Click, tap and supported pointer triggers.
- Hover and focus triggers.
- Keyboard triggers where supported.
- Overlays and modal presentation.
- Transitions and animation settings.
- Variables and supported state changes.
- Conditional actions.
- Back navigation.
- Scroll and fixed-position behaviour where supported.

## 9.2 Interaction mapping

Represent each supported interaction with:

- Source interaction identifier.
- Source trigger.
- Source node and destination node.
- Action type.
- Conditions and variables.
- Transition type and duration.
- Overlay configuration.
- Conversion status.
- Warnings and unsupported properties.

Maintain stable node mappings so that prototype links continue to point to the correct imported screens.

## 9.3 Cross-device continuity

If the source includes desktop, tablet and mobile variants of the same screen, preserve their relationships when they can be established reliably.

When users switch devices in the DesignForge prototype player, the application should resolve the corresponding imported screen rather than resetting to the beginning of the flow.

Do not infer that two frames represent the same screen solely because they look similar. Use source metadata, explicit links, component relationships or a user-confirmed mapping.

## 9.4 Unsupported interactions

When an interaction cannot be reconstructed:

- Preserve the available source description.
- Mark the connection as partially imported or unsupported.
- Identify the source and destination where known.
- Offer manual reconstruction in the prototype editor.
- Avoid substituting a materially different action without disclosure.

# 10. Asset Import and Resource Management

Import supported resources into a shared asset registry.

Support:

- Raster images.
- SVG and supported vector files.
- Fonts where licensing permits.
- Icons.
- Embedded and linked resources.
- Source-specific asset metadata.
- Layered resources where supported.

For each asset, track:

- Original filename.
- Source identifier.
- Media type.
- Dimensions and color profile where applicable.
- Embedded or linked status.
- Import status.
- Native asset identifier.
- Conversion details.
- Integrity hash where appropriate.

Resolve duplicate assets through content-based deduplication without changing their logical identities.

If an asset is missing, preserve its reference and show a missing-resource warning. Allow relinking, replacement or explicitly approved fallback conversion.

Never silently replace a missing image with an unrelated image.

# 11. Import Fidelity Report

Generate a report for every import session.

## 11.1 Report sections

**A. Import summary**
- Source application and file.
- Detected format and version.
- Import method.
- Selected import mode.
- Completion status.
- Processing duration and relevant resource usage.

**B. Structure**
- Pages and frames detected.
- Layers and groups processed.
- Components and instances mapped.
- Objects converted, skipped or embedded.

**C. Design system**
- Tokens and variables imported.
- Styles preserved.
- Component relationships mapped.
- Missing references and unresolved dependencies.

**D. Assets**
- Images and vectors imported.
- Fonts resolved or missing.
- Assets converted or embedded.
- Missing and unsupported resources.

**E. Prototype**
- Connections detected.
- Interactions reconstructed.
- Conditions and variables mapped.
- Unsupported transitions and actions.

**F. Visual fidelity**
- Geometry differences.
- Typography substitutions.
- Unsupported effects.
- Rasterized elements.
- Rendering discrepancies.

**G. Actions required**
- Missing fonts.
- Relink assets.
- Resolve token references.
- Rebuild unsupported interactions.
- Review conversion warnings.

## 11.2 Fidelity classifications

Use these classifications for individual features and overall import results:

- **Preserved:** Source semantics or supported visual properties were retained.
- **Converted:** A compatible native equivalent was generated.
- **Partially preserved:** Some properties or behaviours were retained, but limitations remain.
- **Embedded:** Source content was retained as an embedded or linked asset rather than a fully editable native object.
- **Rasterized:** Content was converted into pixels.
- **Unsupported:** The feature could not be imported through the available method.
- **Missing:** A required resource could not be found or accessed.

Do not calculate a misleading overall fidelity percentage from arbitrary weights. If a numeric score is introduced, document its methodology and show category-level results alongside it.

## 11.3 Preview comparison

Provide a source-versus-imported preview where the source can be rendered reliably.

Allow users to inspect:

- Side-by-side views.
- Overlay comparison.
- Geometry differences.
- Text wrapping changes.
- Missing assets.
- Unsupported effects.
- Prototype connection mappings.

Rendering differences must be reported as observations, not automatically interpreted as defects when the source rendering engine differs from DesignForge.

# 12. User Experience and Interaction Design

Add a unified Import Center accessible through File → Import.

### Step 1 — Select source

Users select a file or drop files into the import area.

### Step 2 — Detect format

Show the detected source application, file type, version when available, and available import method.

If detection is uncertain, request a source selection instead of guessing.

### Step 3 — Configure import

Default settings:

- Import mode: Structure-Preserving.
- Import prototype interactions: Enabled.
- Import assets: Enabled.
- Import tokens and components: Enabled.
- Preserve source metadata: Enabled.
- Preserve original file: Enabled.

Allow users to change supported settings before starting.

### Step 4 — Analyze and import

Display progress for:

- File validation.
- Parsing.
- Asset extraction.
- Structure reconstruction.
- Component and token mapping.
- Prototype conversion.
- Validation.

Show actionable errors when a stage fails. Do not display false completion percentages or mark failed work as complete.

### Step 5 — Review report

Display the fidelity report and allow users to inspect limitations.

Offer supported repair actions before committing the project.

### Step 6 — Finalize

Create the native `.dforge` project, preserve the original source file and record the import metadata.

The imported project must open in the normal DesignForge editor, where the user can edit layers, components, tokens and prototype flows according to their actual conversion status.

# 13. Error Handling and Recovery

Handle at least the following cases:

- Unsupported file extension.
- Extension and actual file content mismatch.
- Corrupted or truncated files.
- Unsupported source version.
- Missing fonts or linked assets.
- Invalid layer references.
- Circular or malformed hierarchy.
- Unsupported effects and object types.
- Missing prototype destinations.
- Duplicate source identifiers.
- Incompatible token references.
- Insufficient memory or processing time.
- Failed conversion library.
- Interrupted import.
- Failed native project save.

Every error must identify the affected file or object where possible, explain the problem in plain language and provide a safe next step.

Use transactional import behaviour. Do not leave the user's existing project partially overwritten when an import fails.

# 14. Security and Licensing

Treat all imported files as untrusted input.

Implement:

- File signature and content validation.
- Safe archive extraction.
- Path traversal protection.
- Decompression and resource limits.
- SVG and active-content sanitization.
- No automatic execution of imported scripts or plugins.
- Safe handling of external resource references.
- Font and asset licensing checks where applicable.
- Authorized access to cloud design files.
- Appropriate cleanup of temporary import resources.

Use only supported or legally permitted parsing and conversion mechanisms. Document external library licenses, format restrictions and any required application permissions.

# 15. Testing Strategy

## 15.1 Unit tests

Test:

- Format identification.
- Source-version detection.
- Parser behaviour.
- Coordinate conversion.
- Geometry normalization.
- Layer hierarchy.
- Text and typography mapping.
- Component and variant mapping.
- Token conversion.
- Asset extraction and integrity.
- Prototype graph reconstruction.
- Source identifier mapping.
- Native serialization and deserialization.
- Fidelity classification.

## 15.2 Integration tests

Test the complete workflow:

1. Select a supported source file.
2. Validate and parse it.
3. Normalize the source model.
4. Convert supported elements.
5. Import assets, tokens and components.
6. Reconstruct supported interactions.
7. Generate the fidelity report.
8. Save as `.dforge`.
9. Reopen the saved project.
10. Verify that imported content remains consistent.

## 15.3 Golden-file tests

Maintain a legally obtained, versioned corpus of representative test files for each supported adapter.

Each fixture must include expected results for:

- Pages and frames.
- Layer hierarchy.
- Geometry.
- Text and styling.
- Components and tokens.
- Asset counts and integrity.
- Prototype graph.
- Unsupported features.
- Expected fidelity warnings.

Use deterministic structural comparisons and visual regression tests where practical.

Do not rely solely on screenshot comparisons; a visually similar result may still have lost important editability or interaction semantics.

## 15.4 Format compatibility tests

Test supported and unsupported cases separately for:

- Each source application.
- Each supported file version.
- Small, medium and large projects.
- Embedded and linked assets.
- Missing fonts.
- Complex vectors and effects.
- Nested components.
- Prototype variables and conditional interactions.
- Malformed or adversarial files.

## 15.5 Performance tests

Measure:

- Import duration.
- Peak memory consumption.
- Asset extraction throughput.
- Native project save time.
- Cancellation responsiveness.
- UI responsiveness during background processing.

Establish performance budgets based on representative fixtures and target hardware. Do not promise universal import times independent of file complexity and system resources.

## 15.6 Security tests

Include:

- Malformed archive tests.
- Path traversal attempts.
- Oversized decompression inputs.
- SVG script and external-reference payloads.
- Invalid metadata.
- Excessively nested documents.
- Resource exhaustion scenarios.
- Unexpected parser termination.
- Recovery after interrupted import.

## 15.7 Acceptance criteria

An adapter is considered production-ready only when:

1. Its supported file versions and import method are documented.
2. Representative source files pass structural tests.
3. Supported assets and design-system information are mapped correctly.
4. Supported prototype connections resolve to the correct native screens.
5. Unsupported properties are disclosed in the fidelity report.
6. Corrupt or malicious inputs fail safely.
7. Converted projects save and reopen as `.dforge`.
8. Import errors do not damage existing projects.
9. Performance and memory limits are measured.
10. Licensing and distribution requirements are reviewed.

# 16. Implementation Roadmap

## Phase 1 — Foundation

- Define the canonical intermediate representation.
- Implement the source capability registry.
- Build the shared asset registry.
- Implement transactional import and `.dforge` persistence.
- Build the fidelity reporting model.
- Establish automated testing infrastructure.

**Deliverable:** A functional import pipeline with a test adapter and complete reporting.

## Phase 2 — Open and verifiable formats

- SVG.
- PDF.
- Raster assets.
- Sketch, subject to verified parser compatibility.
- Penpot through supported formats or APIs.
- Illustrator through verified vector and PDF-compatible workflows.

**Deliverable:** Reliable import of common design assets and supported document structures.

## Phase 3 — Cloud and proprietary design workflows

- Figma through authorized APIs and supported interchange workflows.
- Native `.fig` feasibility validation and implementation if technically and legally viable.
- Adobe XD feasibility validation and supported conversion workflows.
- Axure RP feasibility validation and supported import paths.

**Deliverable:** Source-specific adapters with explicit capability reporting and prototype conversion where available.

## Phase 4 — Advanced document reconstruction

- Photoshop PSD/PSB layered imports.
- Complex component and variable mapping.
- Advanced prototype condition mapping.
- Improved typography and effects conversion.
- Large-project performance improvements.

**Deliverable:** More complete reconstruction of complex design systems and prototypes.

## Phase 5 — Production hardening

- Security testing.
- Version compatibility coverage.
- Performance optimization.
- Recovery testing.
- Import diagnostics and repair tools.
- Documentation and adapter developer guidelines.

**Deliverable:** A stable, extensible interoperability engine.

Prioritize adapters based on verified technical feasibility, licensing, user demand and expected conversion quality rather than treating every file extension as equally achievable.

# 17. Definition of Done

The external design import engine is complete when users can import supported third-party projects into DesignForge AI, preserve the source hierarchy and available design-system information, reconstruct supported prototype interactions, inspect conversion limitations, and save the result as an editable `.dforge` project.

The system must remain extensible so that future source formats can be added through adapters without changing the native project format or rewriting the shared import pipeline.

The final product must prioritize **source preservation, editability, reliable conversion, transparent fidelity reporting and safe failure recovery** over superficial claims of universal file compatibility.





# DesignForge AI — Precision Design Engine Logic & Feature-Parity Specification

**Document type:** Product + engineering implementation specification  
**Status:** Proposed source-of-truth specification  
**Scope:** Design canvas, geometry, constraints, layout, vectors, text, design tokens, components, responsive design, prototyping, import/export, AI-assisted editing, and validation.
**Revision:** v2 — includes direct point editing, double-click routing, corner handles, path topology, multi-point selection, and gesture-safety requirements.

## 1. Product objective

Build an AI-native visual design engine that behaves predictably at professional design-tool quality. Every object must maintain exact geometry, parent-child relationships, layout rules, reusable-component identity, variable bindings, and prototype semantics across editing, resizing, saving, reopening, importing, and exporting.

The engine should target feature parity at the **observable product behavior and workflow level** with the design capabilities documented for Figma and Adobe XD. It must use its own implementation and data model; it must not claim access to either product's proprietary source code or promise perfect import of undocumented file structures.

### Core quality promise

1. A user's explicit numeric value always takes precedence over guessed or AI-generated geometry.
2. Every transform is deterministic, reversible, and recorded as an edit operation.
3. Resizing follows explicit constraints or layout rules—not arbitrary coordinate guesses.
4. Component instances remain connected to their source except for intentional overrides or detachment.
5. Variables resolve consistently across design, prototype, theme, and export contexts.
6. Device changes preserve the current prototype route and meaningful interaction state where a valid mapping exists.
7. Unsupported or lossy import features are reported, never silently discarded.
8. The same document produces the same geometry and layout for the same inputs.

## 2. System architecture

Use one canonical document model and several coordinated engines. Do not create separate geometry implementations for the canvas, properties panel, prototype player, and code exporter.

### 2.1 Engine modules

- **Document Store:** canonical node graph, IDs, parent-child order, assets, pages, metadata, and transactions.
- **Geometry Engine:** local bounds, transforms, anchor points, rotation, scaling, path geometry, hit testing, and bounding boxes.
- **Constraint Engine:** pins, margins, min/max size, aspect ratio, fixed/flexible dimensions, and responsive resize rules.
- **Layout Engine:** Auto Layout / flex-like stacks, padding, gap, alignment, wrapping, hug-content, fill-container, fixed dimensions, and absolute positioning.
- **Vector Engine:** paths, vector networks, Bézier handles, strokes, joins, caps, boolean operations, masks, and path editing.
- **Typography Engine:** font shaping, text measurement, line wrapping, baseline metrics, paragraph layout, text overflow, and variable-font axes.
- **Style & Effects Engine:** fills, gradients, borders, opacity, shadows, blur, blend modes, corner radii, and reusable styles.
- **Token / Variable Engine:** typed variables, collections, modes, aliases, scopes, validation, and theme switching.
- **Component Engine:** main components, instances, variants, properties, nested components, overrides, state definitions, libraries, and dependency updates.
- **Prototype Engine:** links, triggers, actions, overlays, transitions, conditional logic, variables, scrolling, fixed layers, and runtime state.
- **Renderer:** scene-graph rendering for editor canvas, thumbnails, previews, and prototype player.
- **Import / Export Adapters:** format-specific mappings, asset extraction, capability checks, and fidelity reports.
- **AI Command Engine:** converts natural-language requests into validated edit transactions using the same APIs as manual editing.
- **History & Collaboration Engine:** undo/redo, checkpoints, operation history, stable IDs, and conflict-safe updates.
- **Validation Engine:** geometry checks, token checks, component integrity, accessibility checks, prototype checks, and import/export diagnostics.

### 2.2 Single source of truth

All editing surfaces must read and write through the canonical document APIs. Never let the properties inspector maintain a second copy of X/Y/width/height, or let prototype preview invent a separate layout result.

Expected flow:

`User / AI action → command validation → transaction → canonical document → dependency invalidation → layout and geometry solve → render → diagnostics/history`

Commands must be atomic. If one command fails validation, either reject it with a useful error or apply a clearly labeled partial transaction only when the user explicitly allows partial completion.

## 3. Canonical node and document model

Every element receives a stable, globally unique ID. Names are editable labels and must never act as identifiers.

### 3.1 Common node schema

Each node should support, where applicable:

- `id`, `type`, `name`, `parentId`, `childIds`, `orderIndex`
- `localTransform`: translation, rotation, scale, skew when supported
- `layoutBounds`: x, y, width, height in parent-local logical pixels
- `visualBounds`: computed visible extent, including stroke and effects
- `transformOrigin` / pivot
- `opacity`, `blendMode`, `visible`, `locked`, `exportSettings`
- `fills[]`, `strokes[]`, `effects[]`, `cornerRadius`
- `constraints`, `layoutItem`, `layoutContainer`
- `styleRefs`, `variableBindings`, `componentRef`, `overrideMap`
- `prototypeBindings`, `accessibilityMetadata`, `pluginMetadata`
- `createdAt`, `updatedAt`, `revision`, optional provenance metadata

Use typed node variants for frame, group, rectangle, ellipse, polygon, line, path/vector network, text, image, video, component, component instance, boolean group, slice/export region, and prototype-only nodes. Do not force every object into a rectangle-only model.

### 3.2 Coordinate rules

- Document geometry uses logical pixels (CSS-pixel-like units), independent of display density and canvas zoom.
- Store geometry at high precision using a consistent numeric representation; use double precision internally for calculations. Serialization must preserve sufficient precision and must not round values during ordinary edits.
- Keep separate values for logical geometry and rendered device pixels. Convert to device pixels only at rasterization time.
- Maintain clear coordinate spaces: node-local, parent-local, document/world, viewport, and device-pixel space.
- Use affine transform matrices and explicit transform composition. Transform order must be documented and consistent.
- Never mutate a child’s local position merely because its parent moves. Parent transforms should propagate through world transforms.
- Keep layout bounds separate from visual bounds. Strokes, shadows, and blur may extend beyond layout bounds without changing layout unless the user explicitly chooses visual-bounds-based sizing.
- Zoom and pan must not change document geometry or saved numeric values.

### 3.3 Transform math

For a simple unrotated child inside a parent:

`worldX = parentWorldX + localX`

`worldY = parentWorldY + localY`

For rotated or scaled hierarchies, compute the world transform by composing parent and local matrices in a fixed, documented order:

`worldMatrix(node) = worldMatrix(parent) × localMatrix(node)`

To convert a world-space point back to local space, apply the inverse world matrix. Handle non-invertible transforms explicitly rather than producing NaN or corrupt geometry.

## 4. Pin-point accuracy and anchor logic

“Pin point” must be a first-class engine concept with distinct meanings. Do not conflate a resize handle, a constraint anchor, a rotation pivot, a vector node, and a snapping target.

### 4.1 Anchor types

1. **Selection handles:** corners, edge midpoints, rotation handle, and optional center handle for transforming a selection.
2. **Constraint anchors:** left, horizontal center, right, top, vertical center, and bottom relationships to the parent or a defined sibling reference.
3. **Transform pivot:** the origin about which rotation and scaling occur; defaults to the center but can be edited.
4. **Vector anchors:** path nodes with incoming/outgoing Bézier handles, segment type, and join behavior.
5. **Layout anchors:** alignment and baseline references used by stacks, grids, and text layout.
6. **Snap candidates:** edges, centers, baselines, grids, guides, intersections, and other eligible geometric features.
7. **Prototype hit regions:** interactive bounds used for pointer/touch hit testing; may differ from visible bounds when intentionally configured.

### 4.2 Selection and transform behavior

- Display selection handles in viewport space so they remain a usable size at any zoom.
- Calculate drag input in viewport space, convert it to world space, then to the selected node’s local coordinate space.
- On drag start, capture the initial transform and selected anchor. On each pointer update, derive the new transform from the initial snapshot and total drag delta. Avoid repeated incremental rounding.
- Support move, resize, rotate, scale, and pivot editing as distinct operations.
- Preserve aspect ratio only when the user invokes the aspect-lock modifier, the node has an aspect-ratio constraint, or the tool explicitly specifies it.
- Multi-selection transforms must use a shared selection bounding box while preserving internal relationships unless the selected operation explicitly rescales descendants.
- For rotated nodes, provide both local-axis resize and world-axis bounding-box operations, with an obvious UI mode.
- Snap previews must show the target and delta before committing. A snap must not cause an unexplained jump when the target changes mid-drag.

### 4.3 Snapping algorithm

Generate snap candidates from eligible object edges, centerlines, baselines, guides, grid lines, intersections, and layout gaps. Exclude hidden, locked, or non-snappable nodes according to user settings.

Recommended pipeline:

1. Convert candidate geometry into world space.
2. Filter candidates by visibility, layer scope, and active tool.
3. Calculate perpendicular distance from the moving feature to each candidate.
4. Compare distance in screen pixels against a zoom-aware threshold.
5. Score candidates by distance, semantic priority, and alignment type.
6. Choose a stable winning candidate; apply hysteresis so tiny pointer movements do not oscillate between candidates.
7. Render guides and measured distances.
8. Commit only the resulting design transform; retain a record of the snap decision for debugging.

Snapping affects the result of a user operation, not the underlying coordinate precision. Provide independent settings for pixel grid, layout grid, guides, object snapping, baseline snapping, and snapping sensitivity.

### 4.4 Pinning and constraints

Support combinations of left/right/center and top/bottom/center pinning, fixed or flexible width/height, min/max bounds, aspect ratio, and optional sibling-relative constraints.

For an unrotated child with a left and right pin in a parent of width `P`, with left margin `L` and right margin `R`:

`childWidth = max(minWidth, min(maxWidth, P - L - R))`

For a right-pinned child with fixed width `W`:

`childX = P - R - W`

For a horizontally centered child:

`childX = (P - W) / 2 + centerOffset`

Equivalent rules apply vertically. When constraints conflict with min/max dimensions, solve according to a documented priority order and surface a warning if a constraint cannot be satisfied.

## 5. Layout engine: exact rules, not visual guesses

Support both explicit/manual positioning and responsive, rule-based layout. Users must be able to mix them intentionally within the same frame.

### 5.1 Layout container capabilities

- Horizontal and vertical stacks
- Padding per edge
- Item gap and optional independent row/column gaps
- Main-axis and cross-axis alignment
- Start, center, end, space-between, and supported distribution modes
- Fixed, hug-content, and fill-container sizing
- Min/max size constraints
- Wrapping and line spacing
- Absolute-positioned children inside a layout container
- Nested layout containers
- Baseline alignment where supported
- Grid rows/columns, tracks, gaps, and alignment
- Independent clipping and overflow behavior
- Reordering, smart selection, and distribution helpers

### 5.2 Sizing modes

Each layout dimension should explicitly declare one of:

- `FIXED`: honor the explicit dimension.
- `HUG`: size to the intrinsic/layout content extent plus applicable padding.
- `FILL`: consume available parent space after fixed and gap allocations.
- `MINMAX`: fill within declared minimum and maximum bounds.
- `ASPECT`: derive one dimension from the other using a ratio, subject to min/max bounds.

Prevent cyclic hug/fill dependencies. Detect cycles, choose a documented fallback only if safe, and show a layout diagnostic rather than repeatedly solving the cycle.

### 5.3 Layout solve order

1. Resolve token- and font-dependent intrinsic metrics.
2. Resolve fixed and min/max dimensions.
3. Measure hug-content children bottom-up.
4. Determine parent inner bounds after padding.
5. Allocate main-axis space, including gaps and fill children.
6. Solve cross-axis sizes and alignment.
7. Apply wrapping and remeasure affected rows/columns until stable or until a bounded iteration count is reached.
8. Apply constraints to absolute-positioned children.
9. Compute final local/world and visual bounds.
10. Compare geometry signatures; invalidate downstream render and export only when values changed beyond the engine’s numeric tolerance.

The exact solve order must be tested and versioned. Layout must not depend on render frame rate or object traversal accidents.

### 5.4 Resize behavior

When a frame or artboard changes size:

- Re-solve all descendants according to their layout and constraint rules.
- Keep fixed dimensions fixed, move edge-pinned elements with their edges, stretch dual-edge-pinned elements, and preserve center-pinned relationships.
- For auto layout, recompute available space, wrap decisions, and fill dimensions.
- For responsive-resize heuristics, show inferred rules in the UI and allow users to convert those into explicit rules.
- Do not silently rescale text, corner radii, icons, or strokes unless an explicit scaling mode is selected.
- Provide a before/after preview when the result materially changes the hierarchy or may overflow.

## 6. Vector and shape engine

Implement editable geometry, not only flattened SVG snapshots.

### 6.1 Shape primitives

Rectangle, rounded rectangle, ellipse, line, arrow, polygon, star, freeform path, pen path, and vector network. Support independent corner radii where relevant and consistent handle behavior.

### 6.2 Vector network and Bézier logic

Each vector anchor stores point coordinates, incoming/outgoing handles, handle mode (independent, mirrored, aligned, automatic), segment type, and join metadata. Moving a point must update connected segments deterministically. Handle modes must preserve their contract when dragging one handle.

Support:

- Open and closed paths
- Multiple contours and holes where supported
- Straight, quadratic/cubic Bézier segments as chosen by the path model
- Path splitting, joining, closing, reversing, simplifying, and node deletion
- Pen, pencil/freehand, and point-edit tools
- Stroke cap, join, miter limit, dash pattern, alignment where supported
- Vector fills, gradients, and per-path styling
- Boolean union, subtract, intersect, and exclude
- Masks and clipping paths
- Expand/outline stroke and flatten as explicit destructive operations

Boolean operations should preserve editability where practical. If a result must be flattened, clearly label the operation and offer undo.

### 6.3 Geometry robustness

- Use explicit tolerances for coincident points, path closure, boolean intersections, and hit testing.
- Keep geometry tolerances separate from display snapping thresholds.
- Avoid accumulating drift from repeated scale/rotate operations; compute from canonical geometry and current transform.
- Test self-intersections, very small shapes, near-zero segments, negative coordinates, high zoom, and nested rotations.

## 7. Typography engine

Text is a layout object with font metrics, not an image painted onto the canvas.

Support font family, fallback chain, weight, style, variable-font axes, size, line height, letter spacing, paragraph spacing, alignment, vertical alignment, decoration, capitalization where applicable, bullets/lists, text insets, fixed-width and auto-width modes, and text overflow.

Requirements:

- Use consistent text shaping and font measurement in canvas, prototype, and export wherever possible.
- Maintain baseline, ascent, descent, line box, glyph bounds, and visual bounds separately.
- Recompute hug-content and wrapping when font, weight, size, content, width, letter spacing, or variable-font axes change.
- Preserve editable text on import whenever source data supports it.
- Detect missing fonts and show substitutions before an export or fidelity-critical render.
- Never silently replace unavailable fonts without recording the fallback.
- Test mixed scripts, emoji, ligatures, multiline text, right-to-left text, long unbroken strings, and variable fonts.

## 8. Styles, effects, images, and assets

### 8.1 Styling

Support multiple fills and strokes per object, solid colors, linear/radial/angular gradients where applicable, opacity, blend modes, shadows, inner shadows where supported, layer blur, background blur, corner smoothing when supported, and reusable style references.

Style references should be IDs, not copied values. Provide explicit “detach style” and “update style” operations.

### 8.2 Images and media

Support image placement, crop, fit/fill, focal point, masking, opacity, and replacement while preserving relevant instance geometry. Maintain source asset identity and content hash. For video/media nodes, preserve timing, source, poster/thumbnail, and prototype playback configuration where supported.

### 8.3 Asset pipeline

- Asset registry with stable IDs, original source, normalized metadata, dimensions, color profile, and usage list.
- Deduplication by content hash where safe.
- Missing-asset detection at open, import, and export.
- Export options per node: format, scale, suffix, quality, transparent background, and naming template.
- Support common raster and vector interchange formats where implemented; include PNG, JPEG, WebP, SVG, PDF, and appropriate source assets. Do not imply that every format preserves editable structure equally.

## 9. Component engine

Components must be relational objects, not duplicated groups that happen to look alike.

### 9.1 Core component concepts

- Main component / component definition
- Component instance
- Nested component instances
- Component set / variants
- Exposed component properties
- Text, boolean, instance-swap, and supported value properties
- State definitions and state-specific interactions
- Library publishing, versioning, and update notifications
- Component usage map and dependency graph

### 9.2 Instance override model

Store an instance as a reference to its source component plus a minimal override map. Do not copy the entire source tree into every instance as an unrelated duplicate.

Example override categories:

- Text/content override
- Image/asset override
- Variable or style override
- Appearance override
- Dimension/position override, where allowed
- Variant/property override
- Permitted structural override, if the component model supports it

Use an explicit precedence order:

1. Instance-specific valid override
2. Active component variant/state value
3. Main component value
4. Bound variable/style value
5. Document default

The engine must define precedence carefully so variable bindings and component overrides do not conflict unpredictably. The UI should explain which source supplies the effective value.

### 9.3 Main component updates

When a main component changes:

1. Identify all dependent instances through the dependency graph.
2. Recompute inherited properties and child structure.
3. Reapply valid instance overrides.
4. Re-solve layout and constraints.
5. Flag overrides that now point to removed or incompatible nodes.
6. Update render and prototype caches.
7. Create a single undoable transaction and a change summary.

### 9.4 Variants and properties

Allow a component set to declare properties such as `size=small|medium|large`, `state=default|hover|pressed|disabled`, or `type=primary|secondary|destructive`. Variants should resolve to a consistent property schema. Invalid combinations must be marked unavailable rather than silently choosing an unrelated variant.

Provide create component, create component set, add variant, expose property, swap instance, reset overrides, detach instance, go to main component, and publish/update library workflows.

## 10. Variables and design tokens

Build a typed variable system that connects design, components, themes, prototypes, and code export.

### 10.1 Supported token types

- Color
- Number (spacing, sizing, radius, opacity, stroke width, typography metrics)
- String (text content or supported string values)
- Boolean
- Composite or structured tokens only when the document model explicitly supports them

### 10.2 Collections and modes

A collection groups related variables. Modes can represent light/dark, compact/comfortable density, brand, platform, or breakpoint-specific values. A variable may alias another variable, including an alias in another collection if the dependency graph allows it.

Each variable should have:

`id, name, type, collectionId, modeValues, aliasTargets, scope, description, codeSyntax, validationRules, revision`

### 10.3 Resolution logic

When resolving a binding:

1. Determine the active mode from the current document/frame/component/prototype context.
2. Resolve the selected variable in that mode.
3. Follow aliases while tracking visited IDs.
4. Detect circular aliases and report a validation error.
5. Type-check the final value against the target property.
6. Apply the resolved value without replacing the variable binding itself.
7. Invalidate layout/render/code output only for affected dependents.

### 10.4 Token assistant

AI can generate tokens, but must do so through a guided workflow. Ask the user to choose the token categories and context, such as typography, color, spacing, radii, shadows, borders, opacity, breakpoints, and motion. Offer preset options or infer suggestions from a selected design, but show a preview before committing.

Token workflow:

1. Choose scope: selected objects, page, file, or design system.
2. Choose category and intended use.
3. Choose platform/device/mode coverage.
4. Propose names, types, values, aliases, scales, and naming convention.
5. Show detected duplicates, contrast issues, inconsistent scales, and ambiguous mappings.
6. Preview affected instances.
7. Apply as one transaction.
8. Offer to generate tablet/mobile modes from desktop tokens without replacing desktop values.

Use semantic tokens (for example, `color.text.primary`) as a separate layer from raw palette values (for example, `color.blue.600`) so themes can change without rewriting component geometry.

## 11. Design canvas and editing interactions

The editor must offer predictable, keyboard-accessible design operations.

### 11.1 Canvas navigation

Pan, zoom to cursor, zoom to selection, zoom to fit, page navigation, rulers, guides, grids, canvas background, outline mode, pixel preview, and layer visibility controls. Navigating the canvas must not mark the document dirty.

### 11.2 Selection and layers

Support click selection, shift-add/remove, marquee selection, deep selection, parent/child navigation, layer search, rename, duplicate, group/ungroup, lock/unlock, hide/show, reorder, bring forward/backward, and component navigation. Display selection context and current hierarchy.

### 11.3 Precision property editing

X, Y, width, height, rotation, opacity, corner radius, spacing, padding, and typography values must be editable numerically. Support unit-aware input, keyboard increments, modifier-based coarse/fine increments, reset-to-default, and accessible validation messages. Numeric edits must not drift due to snapping or rounding.

### 11.4 Alignment and distribution

Align left/center/right, top/middle/bottom; distribute spacing or centers; match width/height; tidy/reorder selected items; and align to selection, parent, frame, or key object. The reference mode must be explicit, especially for multi-selection.

### 11.5 Non-destructive editing

Prefer editable parameters and references over destructive pixel changes. Destructive actions such as flatten, outline stroke, rasterize, or detach must be explicit, undoable, and labeled.

### 11.6 Direct point, corner, and path editing — required behavior

DesignForge must provide a first-class direct-editing workflow for shape corners, vector anchors, Bézier control handles, and path segments. This must work with mouse, trackpad, keyboard, and supported touch/stylus input.

**Primary interaction contract**

1. A single click selects an object and displays its standard selection bounds and transform handles.
2. Double-clicking an editable shape/path, or selecting it and pressing `Enter` / `Return`, enters that object's **Vector Edit Mode**. The object remains selected, its path segments become visible, and every existing anchor/corner point is displayed as an editable target.
3. Showing every anchor is not the same as selecting every anchor. All points must be visible and editable on entry. Provide a user preference named `vectorEditEntrySelectionPolicy` with `underPointer`, `none`, and `all` options. The safe default is `underPointer` (select the nearby point if the double-click lands close to one); the requested **Select all points on entry** option selects every editable anchor in the active path(s) immediately. In every mode, provide a clearly named **Select All Points** command and contextually scoped keyboard shortcut (`Cmd/Ctrl+A`) that selects points in the active path(s), not all canvas objects. This delivers both fast all-point editing and a safe default that avoids accidental whole-shape deformation.
4. In Vector Edit Mode, clicking an anchor selects it; `Shift`-click toggles additional anchors into or out of the selection. Dragging a marquee selects all anchors inside it. A selected point has a distinct visual style from visible-but-unselected points.
5. Dragging a selected anchor moves it; dragging a Bézier handle changes its curve; dragging a segment or empty canvas must not silently move the whole parent object. The cursor and hover highlight must preview the actual target before pointer-down.
6. Press `Escape` to leave Vector Edit Mode and return to object selection without losing the path changes. `Enter` / `Return` and double-click must be supported consistently on editable path-based shapes.
7. All point changes are live-previewed, recorded as one undoable transaction per gesture, and restored correctly by Undo/Redo.

Use a documented double-click timing window and movement tolerance. If the pointer moved past the drag threshold during the first click, treat the gesture as a drag rather than a double-click. Never create a point as an accidental side effect of double-clicking.

### 11.7 Editing state machine and double-click routing

The editor must track an explicit interaction state instead of inferring it independently in different tools. Minimum states:

- `OBJECT_SELECT`: select, move, resize, rotate, change pivot, or operate on whole layers.
- `VECTOR_EDIT`: reveal and manipulate anchor points, segments, and direction handles.
- `TEXT_EDIT`: place the caret, select text, and edit text content without entering vector mode.
- `IMAGE_CROP`: move/scale the image content or crop viewport while preserving the image node and source asset.
- `PARAMETRIC_SHAPE_EDIT`: expose native handles for supported properties such as polygon side count, star ratio, star radius, line endpoints, arrowheads, and supported corner radii.
- `GROUP_DEEP_SELECT`: target a nested child without moving its parent group.
- `COMPONENT_INSTANCE_EDIT`: edit permitted instance properties/overrides without accidentally mutating the main component.
- `PEN_DRAW`: create or continue a path; distinct from editing an existing path.

Double-click routing must depend on the selected node type, hit-tested target, active tool, and current editing state:

| Target | Double-click behavior | Must not do |
|---|---|---|
| Rectangle, polygon, star, editable vector path | Enter vector edit or native shape-edit mode; reveal points/handles | Select all points as active by default, or flatten the shape without notice |
| Text object | Enter text editing and place caret near the click | Enter vector edit mode |
| Image | Enter crop/content reposition mode if supported | Replace or rasterize the source image |
| Group/frame child | Deep-select or enter the child layer according to hierarchy policy | Move the parent accidentally |
| Component instance | Enter permitted instance/deep-edit mode; preserve source/instance distinction | Change the main component when the user is editing an instance |
| Locked or non-editable node | Explain why it cannot be edited or offer unlock/request permission | Mutate it silently |

The first double-click on a shape should expose a visible outline, all anchor markers, available corner controls, and appropriate handles. Selection after entry follows `vectorEditEntrySelectionPolicy`: `all` selects all points, `underPointer` selects the nearby anchor if one is under the pointer, and `none` reveals points without selecting them. A subsequent click on an individual anchor selects that anchor. The policy must be discoverable in preferences and never change silently between files or sessions.

### 11.8 Anchor selection and multi-point operations

- Support single-point selection, additive/removal selection using `Shift`, rectangular marquee selection, freeform/lasso selection where available, and Select All Points / Select None.
- For multi-point selection, show a selection count and preserve each point's initial coordinate so a drag applies the same world-space delta before converting each point back to the correct local coordinate space.
- Provide a point inspector for X/Y coordinates, anchor type, handle mode, curve-handle values, and corner radius where applicable. When multiple points are selected, allow shared properties to be edited in bulk and show mixed values where values differ.
- Arrow keys nudge selected points by a configurable increment; a modifier can multiply that increment. Numeric X/Y edits must be deterministic and must support relative expressions such as `+4` or `-2` if the expression parser supports them.
- Copy/paste of selected points, duplicate points where valid, reverse path direction, and select connected points/segments should be implemented only with well-defined topology semantics. If clipboard point transfer is unsupported, the command must be unavailable rather than misleading.
- Clicking empty canvas in Vector Edit Mode clears point selection but must not exit edit mode unless the user chooses an explicit exit gesture.
- Clicking another path while editing should switch paths only after a clear hit-test; use a modifier or hierarchy selection to disambiguate overlapping paths.

### 11.9 Bézier handles and anchor types

Each point must have an explicit type and handle mode, with visible and programmatically inspectable values:

- **Corner point:** connected segments may change direction sharply; handles are absent or independently controlled.
- **Smooth point:** incoming/outgoing handles maintain a continuous tangent; moving one handle updates the other according to the chosen mode.
- **Symmetric point:** handles remain collinear and equal in length when edited.
- **Aligned point:** handles remain collinear but may have different lengths.
- **Independent handles:** each side can be changed without forcing the opposite handle to mirror.
- **Automatic/smart point (where supported):** handles are derived from neighboring geometry and can be converted to manual control.

Allow users to convert point types using a toolbar/context menu and direct manipulation: drag out from a corner point to create handles; click or invoke “Convert to Corner” to remove smooth handles; use a modifier or explicit command to adjust one handle independently. The final behavior must never be modifier-only: expose equivalent commands in the inspector or context menu for discoverability and accessibility.

Render tangent/direction lines and handles for selected curve points. Handle endpoints must have a practical minimum hit target at all zoom levels; their hit targets are screen-space UI geometry while their actual positions remain document-space geometry. Apply configurable snapping to points, handles, grid, axes, and existing geometry, with a visible way to temporarily bypass snapping.

### 11.10 Adding, deleting, splitting, and joining points

- Hovering a path segment may show a non-committing insertion preview. Clicking that segment with the Pen/Add Point tool inserts a point at the closest valid curve parameter, splits the segment without a visible shape jump, and selects the newly created point.
- Pen behavior may automatically switch to Add Point when hovering a segment and Delete Point when hovering an anchor, but provide a preference to disable this auto-switching so users can draw over existing paths safely.
- Deleting selected anchor points must delete the points, not the entire layer. Reconnect or split neighboring segments using a documented path rule. Protect the minimum valid topology for open/closed paths and confirm or block an operation that would invalidate the contour.
- Support close/open path, join compatible endpoints, split at selected points, reverse direction, simplify path with preview, and remove redundant points. Simplify must be non-destructive until committed and must show a shape-deviation estimate.
- For multi-contour shapes and holes, keep contour identity and fill-rule behavior stable when adding/deleting points. Update path bounds, hit-testing geometry, fill/stroke render data, and downstream export atomically.

### 11.11 Native shape handles and editable corners

Preserve parametric shape behavior wherever possible rather than converting every shape to a generic path immediately.

- **Rectangles/rounded rectangles:** support a global corner radius plus per-corner radii when supported by the shape model. Hovering a corner reveals its radius handle; dragging edits visually, while the inspector supports exact numeric values. A modifier may constrain an edit to one corner, but per-corner editing must also be available through the inspector.
- **Corner selection:** allow selecting one or multiple corner controls. Editing a shared radius applies the value to all selected supported corners; unselected corners remain unchanged. Support resetting selected corners to the global radius.
- **Corner smoothing:** expose smoothing separately from radius; do not represent smoothing as a radius value.
- **Polygon/star:** support native point count, radius, star ratio, and rounding properties while the shape remains parametric. The inspector and canvas handles must stay synchronized.
- **Line/arrow:** expose endpoints, line direction, stroke properties, arrowhead type, and endpoint snapping without treating the line as a closed filled shape.
- **Unavailable controls:** hide or disable radius/smoothing controls for unsupported geometry (for example, a purely open path or an incompatible boolean result) and explain the limitation rather than displaying a control that does nothing.

If a topology-changing operation cannot preserve a shape's parametric definition, convert it to an editable path only at the moment the operation requires it. Preserve style, transform, ID lineage, and undo history; display a concise conversion notice and offer a reversible path back only when the original parametric representation can be reconstructed safely.

### 11.12 Hit testing, layering, and gesture safety

Use a shared hit-test service for canvas selection, direct editing, snapping, and prototype interaction authoring. Hit-test in screen space for usability, then resolve the target using canonical geometry in local/world coordinates.

- Prioritize visible editor handles over the underlying shape; selected point handles over path strokes; active-tool targets over inactive decoration; and topmost eligible object over lower objects unless a modifier cycles through the stack.
- Keep hit areas usable at low zoom without changing the document geometry. Scale only the affordance/hit target, not the point itself.
- Distinguish fill hit-testing, stroke hit-testing, point/handle hit-testing, selection bounds, visual effects, and transparent regions.
- If objects overlap, provide predictable cycling or a layer chooser; do not select a different node because of minor cursor movement.
- Pointer capture must continue an active drag even if the cursor leaves the handle. Cancel safely on Escape; on lost pointer capture, commit or revert according to a documented rule and never leave partial geometry corrupted.
- Support stylus pressure only where a tool uses it (for example, brush or variable-width stroke); pressure must not affect standard selection or anchor movement.

### 11.13 Object-specific direct manipulation beyond vectors

To make the editor feel consistent, apply type-aware editing to other common objects:

- Text: double-click to edit characters; drag text-box handles to resize according to the text sizing mode; keep text selection separate from object selection.
- Images: double-click to crop or reposition image content within the mask; preserve the source asset and use a reversible crop transform.
- Gradients: show color stops and direction/center handles directly on the canvas; support stop selection, addition, deletion, and exact numeric values.
- Shadows/blur: where practical, expose on-canvas direction, distance, and radius handles with numeric inspector values.
- Frames and layout containers: show padding/gap/alignment controls only when the container is selected or the layout-edit affordance is explicitly activated; do not confuse layout guides with vector points.
- Prototype connections: show interaction wires only in the prototype-authoring mode, with hit targets separate from design geometry.

### 11.14 Accessibility, feedback, and undo contract

- Provide equivalent menu/inspector commands for all critical point operations; no operation may require a mouse gesture alone.
- Selection state must use shape, fill, and/or line style—not color alone—and must be readable at high zoom and high-contrast settings.
- Announce point counts, mixed values, lock states, and failed operations to assistive technology where supported.
- Each continuous drag is one transaction; each numerical field commit is one transaction; multi-point commands such as delete, convert, or align are one transaction.
- Preview proposed path geometry during a drag, but commit only validated geometry. Cancel restores the exact pre-gesture state.
- When editing a component instance, record whether an operation creates an override, modifies the master, or requires detachment. Require an explicit action for any edit that would otherwise cross the instance/master boundary.

## 12. Responsive design and device continuity

DesignForge must support desktop, tablet, and mobile artboards while preserving semantic identity between equivalent screens.

### 12.1 Responsive frame model

A responsive screen may have multiple device-specific frame instances linked by a shared screen ID and optional breakpoint rules. These are not separate unrelated pages.

### 12.2 Breakpoint logic

- Breakpoint rules define ranges and layout mode changes.
- Components may select a variant at a breakpoint.
- Visibility, order, spacing, typography scale, and navigation pattern may change across breakpoints.
- Keep content and interaction identity linked unless a designer explicitly creates a different flow.
- Provide a breakpoint preview and an overflow report.

### 12.3 Prototype device switching

When a prototype user changes from desktop to tablet/mobile:

1. Read the current semantic screen ID, interaction state, and route context.
2. Find a matching responsive frame for the selected viewport.
3. Map the current component states and supported variable values.
4. Preserve compatible entered values and route state.
5. If no exact frame exists, apply responsive rules to the current frame as a fallback.
6. If a state cannot be mapped, show a defined fallback instead of resetting to the prototype start.
7. Preserve browser/back-stack or prototype navigation history when appropriate.

Example: if the user is on the OTP verification screen on desktop and switches to mobile, the prototype should show that screen's mobile counterpart—not the home page. The same principle applies to menus, dialogs, selected tabs, and form state when their semantic mappings exist.

## 13. Prototype engine

Prototyping should be a runtime over the same document, components, variables, and layout engine—not a set of disconnected screenshots.

### 13.1 Interaction model

Represent an interaction as:

`sourceNodeId + trigger + conditions[] + actions[] + destination/state + transition + runtimeOptions`

Supported triggers should include, as applicable:

- Tap/click
- Hover/hover-in/hover-out
- Press/down/release
- Drag
- Keyboard key / gamepad
- Focus / blur
- Voice trigger if supported
- Timer / after delay
- Scroll-position or viewport events where supported

### 13.2 Actions

Navigate to screen, back, open/close overlay, scroll to node, change component state/variant, set variable, increment/decrement variable, conditional branch, play media, open URL, submit prototype form, and reset prototype state. Every action must validate its targets and runtime requirements.

### 13.3 Transitions

Support instant, dissolve, move, slide, push, overlay, and smart/auto animation where the object mapping is valid. Animation settings must define duration, easing or spring parameters, direction, and interruption behavior. When matching nodes for smart animation, use stable identity first, component identity second, and a carefully constrained fallback. Do not rely only on layer names.

### 13.4 Runtime state

Keep separate state for:

- Current semantic screen and frame
- Navigation history
- Active overlays
- Component variant/state values
- Prototype variables
- Form input values
- Scroll positions
- Media playback state
- Current viewport and breakpoint

On screen transition, specify which state persists, resets, or maps. This decision must be explicit in the prototype model.

### 13.5 Prototype validation

Check for unreachable screens, missing destinations, conflicting triggers, invalid variable references, unclosed overlays, missing states, unsupported transitions, and screen-switch mapping failures. Provide a graph view and a test-run report.

## 14. AI-assisted design editing

AI must use engine commands, not bypass the document model by painting a flattened preview.

### 14.1 Command pipeline

`Natural-language request → intent parsing → target resolution → constraint collection → edit plan → simulation → diff/preview → user approval if needed → transactional execution → validation → summary`

### 14.2 Target resolution

Resolve references such as “this button,” “all cards,” or “the mobile frame” using selection context, node names, hierarchy, node type, component identity, and semantic metadata. If multiple targets are plausible, show the candidates instead of silently editing the wrong layer.

### 14.3 Geometry safety rules

- Explicit coordinates and dimensions are authoritative.
- AI-generated layouts must respect locks, component boundaries, tokens, and existing constraints unless the request explicitly overrides them.
- Prefer modifying constraints/layout rules over manually rewriting many child coordinates.
- Do not detach components or replace variables without permission.
- When the request is ambiguous, provide a preview with the assumptions stated.
- Record all edits as reversible commands and produce a concise changed-elements summary.

### 14.4 Design generation

When generating a screen, AI should construct editable frames, text, shapes, component instances, and variable bindings. It should not generate a single raster image unless the user specifically requests an image asset. Generated elements must have sensible names, clean hierarchy, accessible text, consistent spacing, and configurable design tokens.

## 15. Import and export architecture

Use source-specific adapters over a normalized internal document model. Every adapter must declare which source capabilities it can preserve, approximate, or cannot support.

### 15.1 Import pipeline

1. Identify file format and version.
2. Validate the file and scan archive/asset contents safely.
3. Parse supported source structures into an intermediate representation.
4. Extract assets, fonts references, variables/styles, components, frames, text, vectors, constraints, and interactions where available.
5. Map source concepts to DesignForge nodes and relationships.
6. Resolve dependencies and missing assets.
7. Reconstruct layout and prototype links.
8. Run geometry, hierarchy, and interaction validation.
9. Produce an import fidelity report.
10. Show the report and preview before finalizing the import.

### 15.2 Fidelity labels

For each feature, report:

- **Preserved:** meaning and editability preserved.
- **Mapped:** converted to a DesignForge equivalent, potentially with small semantic differences.
- **Approximated:** visual or behavioral result is similar but not identical.
- **Flattened:** converted to a non-editable or less-editable representation.
- **Unsupported:** could not be imported.
- **Warning:** data was recovered with uncertainty or missing dependencies.

Report counts and affected object IDs so users can find issues.

### 15.3 Source-format honesty

- Figma `.fig` and Adobe XD `.xd` handling must be based on verified format access and supported parsing or officially supported transfer paths. Do not claim full fidelity merely because a file can be selected or opened.
- Preserve interactions, variables, assets, components, and tokens only when their source data is actually available and mapped.
- Use a dedicated adapter for Sketch, Adobe XD, Figma, Penpot, Illustrator, Photoshop, Axure, SVG, PDF, and common raster assets rather than one generic parser.
- For formats whose native editable structure cannot reliably be parsed, offer supported alternatives such as SVG/PDF/artboard export, exchange packages, or source-specific documented paths; clearly describe what these alternatives lose.
- Export must include a report of unsupported constructs and any flattening performed.

#### Current import coverage

- Standard `.sketch` ZIP archives are parsed from their document and page JSON entries. Unsupported archive variants or compression methods are reported rather than silently treated as valid designs.
- Figma REST/API interchange JSON (`.figma.json`), SVG, and static React JSX/TSX source have import adapters. React source is parsed as static markup and supported inline styles; uploaded code is never executed.
- React/design-token analysis accepts JSON, CSS, JS, JSX, TS, and TSX source and extracts statically declared token values.
- Native Figma-family binaries (`.fig`, `.jam`, `.deck`, `.buzz`, `.site`, `.make`) and Adobe XD `.xd` files are recognized by the upload flow but are not decoded. Users must provide a supported interchange export; file selection does not imply native-format support.

### 15.4 Export targets

Provide native `.dforge` project save/open, packaged project archive, SVG, PNG, JPEG/WebP, PDF, and code-oriented export where supported. Preserve source assets and internal references in `.dforge`. For React and other code outputs, map design tokens and reusable components to structured source rather than emitting a single opaque screenshot.

## 16. Rendering and performance

Use a retained scene graph and incremental invalidation. Avoid re-rendering the entire document after every property edit.

Recommended principles:

- Cache computed geometry, text layout, rasterized previews, and expensive effects by stable dependency signatures.
- Invalidate only affected descendants and dependents.
- Virtualize offscreen layer rows and heavy canvas objects where safe.
- Keep editor overlays—selection handles, guides, measurement labels—separate from document content.
- Use the same layout results for canvas, prototype preview, and export whenever possible.
- Use deterministic font, color, and geometry handling; document platform-specific rendering differences.
- Include cancellation and progress feedback for large import, boolean, export, and AI operations.

Initial engineering targets to validate on reference hardware:

- 60 FPS during common pan/zoom and selection operations on representative files.
- No visible lag for standard property edits on a typical product screen.
- Geometry and layout resolution should remain deterministic regardless of frame rate.
- Large-file benchmarks should track node count, nested depth, text complexity, image count, effect count, memory consumption, and time-to-first-interaction.

These are proposed targets, not claims of existing performance.

## 17. Undo, redo, persistence, and collaboration

Every committed user action becomes a transaction containing semantic operations, affected IDs, before/after values, dependency changes, and validation output.

- Undo must revert the action without losing unrelated concurrent edits.
- Redo must replay the same semantic operation, with conflict handling if its preconditions no longer hold.
- Auto-save should persist transactions safely and recover after application failure.
- Document loading must validate schema versions and migrate older schemas explicitly.
- IDs must remain stable across save/load, rename, reorder, and compatible import/export operations.
- Collaboration requires deterministic operations and conflict policies for geometry, component updates, and token edits.
- Never treat zoom, selection, hover, or other ephemeral editor state as design changes unless the user explicitly saves such preferences.

## 18. Accessibility and usability

- Keyboard-accessible selection, menus, dialogs, numeric fields, layer navigation, and prototype testing.
- Visible focus states for editor controls.
- Accessible names for controls and clear error messages.
- Color contrast checks for relevant text/background pairs.
- Optional reduced-motion behavior in prototype preview.
- Touch target and text-size checks for selected device profiles.
- Announce selection changes and validation errors to assistive technology where platform support allows.

## 19. Validation and test strategy

Testing must combine unit tests, property-based geometry tests, layout fixtures, golden renders, import/export round trips, interaction simulation, and real-user acceptance testing.

### 19.1 Geometry tests

- Move, resize, rotate, and transform nested elements at multiple zoom levels.
- Repeatedly save/open documents and confirm numeric geometry does not drift.
- Test nested rotations and scaling, negative coordinates, zero-size edge cases, and invertible/non-invertible transforms.
- Verify local-to-world-to-local round trips within a defined numeric tolerance.
- Validate selection handles remain usable and target the correct anchor.
- Double-click a rectangle, polygon, star, and custom path: all applicable anchor/corner points appear; test `underPointer`, `none`, and `all` entry-selection policies, including persistence of the user's preference.
- Verify `Enter` / `Return` enters vector edit mode and `Escape` exits to object selection without discarding committed edits.
- Verify Select All Points / `Cmd/Ctrl+A` is scoped to editable points in the active path(s), not the whole page; verify Shift-click, marquee, lasso (if enabled), and Select None.
- Drag and numerically edit a single anchor and multiple anchors at different zoom levels; verify the intended local/world deltas and absence of accumulated drift.
- Convert corner ↔ smooth ↔ aligned ↔ independent points; verify tangent and opposite-handle behavior against each handle mode.
- Insert a point on a straight and curved segment and confirm the path has no visible jump; delete endpoint/interior points from open and closed paths and validate contour topology.
- Verify double-clicking text enters text edit, double-clicking an image enters crop/content mode, and group/component double-click behavior respects the hierarchy and instance/master boundary.
- Check edge/corner-radius drag handles, bulk-editing selected corners, polygon/star native handles, and disabled controls for unsupported path types.
- Verify pointer capture, Escape cancellation, undo/redo, overlap hit testing, touch/stylus targets, and numeric inspector values through the direct-editing flow.

### 19.2 Layout tests

- Fixed/hug/fill sizing combinations.
- Parent resizing with every supported pin combination.
- Nested stacks, wrap, min/max constraints, and mixed absolute-positioned children.
- Long text, missing fonts, RTL content, and variable-font changes.
- Conflicting constraints and cyclic layout dependencies must produce deterministic diagnostics.

### 19.3 Component/token tests

- Main component update with and without instance overrides.
- Reset overrides, variant swap, nested component update, and detached instance behavior.
- Variable alias chains, mode switching, invalid types, circular aliases, and missing variables.
- Theme changes must update bound appearance without changing unrelated geometry.

### 19.4 Prototype tests

- Every trigger/action combination supported by the engine.
- State persistence across navigation, overlays, back navigation, and viewport changes.
- Desktop-to-mobile screen continuity, including OTP/form state where mappings exist.
- Smart-animation matching, interrupted transitions, and missing destinations.
- Keyboard access and reduced-motion settings.

### 19.5 Golden visual tests

Maintain reference files with known fonts, assets, variable modes, and viewport dimensions. Compare renders at exact viewport and device scale. Distinguish geometry failures from expected rasterization differences due to antialiasing, font rasterization, and platform APIs. A pixel-difference score alone must not be treated as proof of geometric correctness.

### 19.6 Proposed acceptance thresholds

- Numeric property round-trip: no meaningful drift; target absolute difference ≤ 0.01 logical px for supported geometry values.
- Geometry transform tests: pass within the documented numeric tolerance for the chosen math path.
- Same-version save/open: identical node IDs, hierarchy, references, token bindings, and prototype graph.
- Import: every unsupported or approximated construct appears in the fidelity report.
- Component propagation: valid overrides preserved and invalid overrides explicitly diagnosed.
- Responsive test: mapped semantic screen remains active after viewport switch; the prototype must not reset to the start frame without an explicit rule.
- Determinism: same document, fonts, assets, variables, viewport, and engine version produce the same computed layout result.

These thresholds must be confirmed against practical benchmark files and adjusted only through documented engineering decisions.

## 20. Implementation phases

### Phase 1 — Geometry foundation

Canonical document model, coordinate spaces, transforms, selection, snapping, numeric properties, shapes, text basics, undo/redo, save/open, and geometry tests.

**Exit criteria:** reliable local/world transforms, no save/open geometry drift, deterministic selection and snapping.

### Phase 2 — Layout and responsive rules

Pins, constraints, Auto Layout-style stacks, fixed/hug/fill sizing, grid, wrap, resizing, layout diagnostics, and device frames.

**Exit criteria:** tested layout solver with nested containers and predictable resizing.

### Phase 3 — Vectors, typography, and effects

Bezier/vector editing, boolean operations, fills/strokes, images, advanced text metrics, effects, and asset export.

**Exit criteria:** editable vector paths, point/corner selection and manipulation, stable typography/layout across save/load and target environments, and passing direct-edit interaction tests.

### Phase 4 — Variables and component system

Typed variables, collections/modes, styles, component masters/instances, overrides, variants, libraries, and token validation.

**Exit criteria:** component changes propagate correctly without destroying valid overrides; tokens resolve and report errors.

### Phase 5 — Prototype runtime

Interaction graph, triggers/actions, states, overlays, transitions, variables/conditions, scroll behavior, responsive continuity, and prototype testing tools.

**Exit criteria:** testable end-to-end flows and reliable screen/state mapping across device changes.

### Phase 6 — Import/export and fidelity reporting

`.dforge` package, source-specific adapters, asset extraction, native/vector/code exports, diagnostics, and round-trip tests.

**Exit criteria:** no silent loss; each supported adapter has a published capability matrix and fixture suite.

### Phase 7 — AI command integration

Natural-language editing, component/token generation, responsive conversion, screen creation, simulation, diff previews, and transactional execution.

**Exit criteria:** AI changes remain editable, respect constraints, can be previewed and undone, and pass the same validation as manual operations.

### Phase 8 — Production hardening

Performance profiling, accessibility, collaboration, migrations, crash recovery, security review, plugin APIs, telemetry controls, and beta feedback.

## 21. Non-negotiable engineering rules

1. One canonical document model; no competing geometry truth sources.
2. Stable IDs for all nodes, components, variables, assets, and prototype targets.
3. Geometry calculations must be independent of viewport zoom and display density.
4. Snapping and display rounding must never corrupt canonical values.
5. Layout behavior must be explicit, deterministic, and inspectable.
6. AI must operate through the same validated transaction APIs as manual editing.
7. Component references and variable bindings must remain relational and traceable.
8. Prototypes must run on real component/layout/token state, not just static screenshots.
9. Device switching should preserve semantic screen and compatible interaction state.
10. Import/export must produce honest, object-level fidelity reports.
11. Destructive conversions must be explicit and undoable.
12. Performance optimizations must not change computed geometry semantics.
13. Every major feature must have automated tests before being declared complete.

## 22. Definition of done

The DesignForge AI design engine is ready for production only when a designer can create and edit a multi-screen product design, define reusable components and variable modes, resize it across devices, run an interactive prototype, save and reopen it without structural or geometric drift, inspect/export its design properties, and receive transparent import/export diagnostics—all while the renderer, layout engine, component system, and prototype runtime agree on the same underlying document state.

## 23. Reference sources

This specification is an original engineering synthesis. The following official materials document relevant feature behavior and terminology; they are references for user-facing capability expectations, not a claim to use proprietary implementations.

- Figma — Design capabilities, Auto Layout, Smart Select, vector networks, components and libraries: https://www.figma.com/designers/
- Figma — Edit vector layers (enter vector-edit mode, see and manipulate path points): https://help.figma.com/hc/en-us/articles/360039957634-Edit-vector-layers
- Figma — Shape tools (shape-specific controls and edit-object behavior): https://help.figma.com/hc/en-us/articles/360040450133-Shape-tools
- Figma — Adjust corner radius and smoothing (global/per-corner behavior and vector-editing constraints): https://help.figma.com/hc/en-us/articles/360050986854-Adjust-corner-radius-and-smoothing
- Figma — Variables and design-system modes: https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma
- Figma — Design inspection and developer handoff: https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode-in-Figma
- Adobe — XD drawing, polygon/star handles, and double-click path editing: https://helpx.adobe.com/uk/xd/desktop/design/text-and-fonts/drawing-text-tools.html
- Adobe — XD components, overrides, states, and responsive resizing: https://helpx.adobe.com/xd/desktop/help/work-with-components-xd.html
- Adobe — XD responsive resize and manual constraints: https://helpx.adobe.com/xd/desktop/design/layout/using-responsive-resize.html
- Adobe — Current XD maintenance-mode notice: https://helpx.adobe.com/xd/desktop/introduction/faq.html

**Implementation note:** Adobe currently describes XD as being in maintenance mode, with ongoing development and new features not being shipped. DesignForge should treat XD capabilities as useful compatibility and workflow references, not as a guarantee of future feature evolution.



# DesignForge AI — Unified Design System Master Implementation Prompt

## Role and objective

You are the lead product engineer, design-systems architect, AI workflow engineer, and test engineer responsible for implementing the Design System capability in the **existing DesignForge AI application**.

Implement a production-oriented, integrated Design System system that unifies design tokens, variables, components, styles, assets, imported React libraries, responsive token generation, prototyping, and React code generation. Extend the current application rather than replacing it with a new app or creating disconnected mock screens.

**Quality objective:** minimize defects through explicit architecture, validation, persistence, error handling, automated tests, and regression verification. No prompt can guarantee literal zero errors; therefore, do not claim the implementation is error-free unless the relevant tests and checks have actually passed. Report any incomplete or unsupported behavior honestly.

## 1. Mandatory working rules

1. Inspect the existing repository and architecture before changing code. Identify the framework, app entry points, routing, state management, design document model, Assets panel, component model, persistence layer, AI integration, prototyping runtime, export/React compiler, styling system, and tests.
2. Preserve the existing UI style, layout conventions, navigation, keyboard behavior, and working features. Do not redesign unrelated areas or replace the application architecture without evidence that it is necessary.
3. Produce a short implementation plan based on the real codebase, then proceed with implementation. Do not stop after providing a plan, wireframes, mock data, or recommendations.
4. Reuse existing patterns and dependencies whenever practical. Avoid duplicate registries, duplicate state stores, parallel abstractions, hard-coded fake metrics, and unnecessary new dependencies.
5. Connect every visible control to a real behavior. Do not leave inert buttons, placeholder screens, or mocked success states in the finished workflow.
6. Treat all imported source code, packages, archives, and assets as untrusted input. Do not execute untrusted install scripts or arbitrary code in the trusted application process.
7. Use stable IDs for entity references. Names and labels are mutable and must not be used as the sole identity of records.
8. Preserve existing user content. Migrations must be safe, documented, and recoverable. Do not destructively rewrite project files or user-authored code.
9. For ambiguous optional choices, use conservative defaults and expose the assumption. Do not ask the user to decide implementation details that can be safely inferred from the repository.
10. After implementation, run the available unit, integration, type, lint, build, and end-to-end checks. Add missing tests for critical behavior. Fix failures caused by the implementation before declaring completion.

## 2. Product outcome

Add a first-class **Design System** page. It is the source of truth for governed reusable design decisions and component definitions.

The page must have clear, prominent navigation for at least:

- Overview
- Tokens
- Variables
- Components
- Styles
- Assets
- Libraries
- Imports & Sync
- Documentation
- Version History

Tokens and Components must be especially easy to find. Use tabs, sub-navigation, or the existing application’s standard pattern. Keep the established DesignForge AI visual language; do not imitate another product’s UI at the expense of the current application design.

### The two primary ways to establish a design system

**A. Import an existing React-based design system:** import a supported source, inspect its structure, identify supported tokens and components, map the source to the internal model, show compatibility and loss reports, and let the user review before creating or merging a library.

**B. Create a design system from scratch:** guide the user through foundation tokens, variables, themes, component construction, variants, modes, validation, and publication.

AI token generation and AI variable extraction are additional guided workflows within these two approaches, not separate competing sources of truth.

Both approaches must produce the same normalized internal registry representation so that imported and native items can be used consistently throughout DesignForge AI.

## 3. One shared registry, not separate silos

Implement or extend a shared **Design System Registry** backed by the application’s durable persistence mechanism. Tokens, Variables, Components, Styles, Assets, the design editor, prototyping, and React export must reference the same underlying entities where they represent the same object.

Use a typed internal model with stable IDs and version metadata. Adapt names and storage to the existing codebase, but provide equivalent concepts for:

- DesignSystem
- Library
- Token
- Variable
- Collection
- Mode or theme
- Style
- Component definition
- Component variant
- Component property
- Component instance and overrides
- Asset
- Dependency/reference edge
- Import job and source mapping
- Publication/release
- Version/change set
- Validation issue

Each relevant record should contain a stable ID, type, name, value or definition, description where supported, collection/library, source/provenance, created/updated timestamps, validation state, and version metadata. Apply access/ownership metadata if the existing app supports multiple users or teams.

### Registry rules

- Tokens, variables, styles, components, and assets must not be independently copied into different stores just to display them on different pages.
- The Tokens view, Variables view, Components view, and Assets view are views over shared records and explicit relationships.
- A record may participate in multiple views through type and metadata, but there must still be one authoritative value/definition.
- Use typed references, validate reference compatibility, and detect missing references and cycles.
- Keep import-source mappings so a user can understand where an imported item originated.
- Do not silently infer a full design token from every arbitrary visual property. Explicitly saved tokens are registered automatically; inferred promotions from repeated/raw values are suggestions unless the user has enabled and approved an established, safe rule.

## 4. Design System page and overview

Build a working page with the application’s existing layout conventions. Include:

- System/library selector
- Section navigation
- Search and filters
- New design system
- Import design system
- AI Generate Tokens
- Publish/update library
- Synchronization status
- Current version

The Overview should show live, computed data: number of tokens, variables, components, variants, styles, assets, unused items, unresolved references, duplicates, hardcoded styling candidates, import warnings, draft changes, and recent activity. Metrics must link to useful filtered views and must not be hardcoded sample data.

Provide actionable validation messages such as duplicate token candidates, unbound raw values, missing variables, deprecated references, unsupported imported constructs, and pending publication changes.

## 5. Tokens workspace

Provide searchable token collections with grouping, sorting, filtering, bulk selection, inline editing, creation, duplication, renaming, deprecation, deletion, descriptions, usage count, references, and change history. Deleting a referenced token must warn and prevent dangling references unless a controlled replacement is selected.

### Supported token types and categories

Implement typed token models and appropriate editors for supported types, including:

- Color and gradient
- Typography/font family, font size, font weight, line height, letter spacing, text decoration and related typography properties
- Spacing
- Dimensions and sizing
- Border width, border style, and radius
- Shadow/elevation
- Opacity and effects
- Breakpoints and layout/grid values
- Z-index/layering
- Motion duration, easing, and motion-related values
- Icon sizing and relevant icon presentation values
- Image-related presentation values such as aspect ratio and radius, where appropriate
- Data-visualization palettes and related styles
- Custom typed categories when the schema supports them

Do not force irrelevant categories into every project. A design system may contain only the types it needs.

### Primitive and semantic tokens

Support primitives and semantic aliases. For example, a primitive `color.palette.blue.600` may be referenced by semantic `color.action.primary`. A semantic token must reference a compatible token/value and should not needlessly duplicate a primitive value.

Support configurable naming conventions, collections, nested groups, aliases, descriptions, and usage/dependency views. Example names include `color.text.primary`, `spacing.200`, `radius.medium`, `typography.heading.large`, and `motion.duration.normal`.

### Themes and modes

Support Light, Dark, High Contrast, brand themes, and user-defined modes where applicable. The user must be able to add, rename, configure, compare, and preview modes. Mode changes should update properties bound to the relevant semantic tokens. Do not duplicate complete collections if a mode override is sufficient.

## 6. Variables workspace

Provide typed variable management for supported colors, numbers, strings, booleans, dimensions, and other types supported by the document model. Include collections, modes, aliases, descriptions, scopes, usage count, and reference navigation.

Variables can bind to compatible design properties such as fill, stroke, text color, width, height, padding, gap, radius, opacity, and related supported values.

Keep the conceptual distinction clear:

- **Token:** a named and governed design decision intended for reuse and often export.
- **Variable:** a typed mutable value/reference bound to properties in the design engine.

Where a token and variable are two views or representations of the same underlying value, store an explicit mapping/reference and prevent independent values from drifting. Do not create a duplicate token and variable automatically unless both concepts are genuinely required by the internal schema.

## 7. Components workspace

Provide a component library with categories, folders, search, previews, status, variants, properties, dependencies, usage locations, version history, and publication state.

Support common component types where applicable: buttons, inputs, text fields, checkboxes, radios, switches, selects, navigation, sidebars, cards, tables, lists, dialogs, modals, drawers, tooltips, notifications, tabs, accordions, pagination, breadcrumbs, badges, avatars, icons, forms, charts, responsive containers, layout primitives, and custom components. These are examples, not mandatory built-in hard-coded components.

### Component creation workflow

A designer must be able to select layers or create a component from scratch; name and categorize it; configure layout and responsive behavior; bind properties to tokens/variables; define properties, variants, states, nested components/slots, and content areas; preview it; and publish it to a library.

Support appropriate property types, including boolean, text, variant, instance swap, visibility, and supported slot/content properties. Support variants such as size, style, state, theme, density, and user-defined property/value combinations.

Represent component states where relevant, including default, hover, focus, pressed, disabled, and loading. Do not require a separate component for every state when a variant/state property can model it correctly.

### Component instances, updates, and overrides

- Preserve a reference from each instance to its source component definition.
- Track supported local overrides explicitly.
- Allow users to reset an override.
- Propagate published definition updates to linked instances using a predictable update workflow.
- Do not silently destroy user overrides when an update conflicts with them.
- Show available updates and provide a diff/conflict review where necessary.

## 8. Automatic synchronization with Assets and Tokens

This is a mandatory integration requirement. Assets must act as a unified inventory/view over reusable items and imported media, not as an independent duplicate database.

### Required mapping behavior

- When a token is created or edited, update the Tokens view and its Assets representation immediately after the authoritative save succeeds.
- When a variable is created or edited, update Variables and the Assets view, and update explicit token mappings where configured.
- When a component is created or published, register it in Components and make it discoverable in Assets.
- When a variant changes, update component metadata and previews.
- When a style is created, update Styles and the Assets view.
- When a token or variable is bound to a component property, update dependency and usage records.
- When a published token is renamed, update stable-ID references and show output/export impact; avoid relying on token names as foreign keys.
- When a token is deprecated or deleted, identify dependents and require a replacement, safe migration, or explicit handling before breaking references.
- When a React component is imported, register its supported definition and source metadata in the registry and Assets view.
- When a design system is published, create a version/release record and update library-consumer status.

Assets must provide useful filters such as All, Components, Tokens, Variables, Styles, Icons, Images, Imported, Published, Draft, and Unused. Display provenance, source, usage, and synchronization status where applicable. Navigating to an asset should reveal its source definition and dependents; navigating from a source object should show its asset entry and usage locations.

### Automatic detection versus automatic promotion

Register an item automatically when it is explicitly created as a token, variable, component, style, or reusable asset. Detect likely opportunities such as repeated hardcoded colors or spacing and surface a suggestion. Do not silently replace arbitrary hardcoded values or generate dozens of tokens without user approval.

Use reliable change events or transactional synchronization so partial updates cannot leave Assets, Tokens, and the registry inconsistent. Browser-local state alone is not the authoritative source of truth.

## 9. AI Generate Tokens: mandatory guided form

Add a distinct **AI Generate Tokens** action. It must open a dedicated configuration modal/wizard before token generation starts. The AI must not immediately generate a token system from an underspecified request.

### Generation modes

- Create a new design system
- Extend an existing design system
- Generate tokens from a selected design/screen
- Generate tokens from supplied brand guidelines
- Generate selected token categories
- Adapt existing tokens for tablet and/or mobile
- Generate a new theme/mode
- Audit or improve existing tokens

Preselect sensible fields according to the entry point, but allow the user to review them before generation.

### Configuration form: system context

Provide fields for:

- Design system name and description
- Source: blank, existing library, selected design, imported system, brand guidelines
- Brand name, optional
- Industry/use case: SaaS, fintech, e-commerce, enterprise, healthcare, education, other, custom
- Design direction: minimal, corporate, expressive, editorial, playful, luxury, technical, custom
- Supplied/reference brand colors
- Supported brand-guideline files and images
- Existing collection/library when extending a system
- Custom instructions

Do not require optional details that are not needed for the selected generation mode.

### Token-category selector

Allow users to select one, several, recommended, or all applicable categories. Every category should have concise help text, a preview when useful, and expandable options.

**Color:** primary/secondary/accent, neutral scale, background/surface/text/border, interactive states, success/warning/error/info, focus/selection, overlays, gradients, chart palettes, Light/Dark modes, and configurable contrast targets. Support palette generation from a brand color or supported reference image where useful.

**Typography:** typeface/font-family choices, primary/secondary/optional display and monospace families, font source, available weights, variable font axes where supported, font-size scale, line height, letter spacing, transformation, decoration, paragraph spacing, headings, body, captions, and responsive typography. Use actual available/supported fonts and respect licensing. Do not invent that a font is installed or bundled.

**Spacing:** base unit, scale style (linear, geometric, modular, custom), min/max, compact/comfortable/spacious density, component spacing, section spacing, page spacing, and responsive adaptation.

**Sizing/dimensions:** width/height scales, min/max dimensions, fixed/fluid sizes, container/content widths, icon/avatar sizes, input/button/control heights, touch targets, aspect ratios.

**Layout/grid:** breakpoints, container widths, columns, gutters, margins, page padding, sidebar/navigation widths, grid behavior, safe-area values where relevant, and responsive layout rules.

**Borders/radius:** border width/style/color, radius scale, component aliases, pill styles, and outlines.

**Shadows/elevation:** shadow levels, surface/card/modal/dropdown elevation, focus rings, inset shadows, blur, and opacity.

**Motion:** duration scales, easing curves, transitions, entrance/exit, hover, expand/collapse, intensity, and reduced-motion behavior.

**Opacity/effects:** disabled/overlay/transparency levels, backdrop/surface blur, blend modes where supported, and effect presets.

**Z-index/layering:** content, sticky elements, dropdowns, popovers, drawers, modals, notifications, and tooltips.

**Icons/imagery:** icon sizes/stroke/alignment, image ratios, avatar treatment, thumbnail sizing, and image radius. Keep actual image files and vector paths in Assets; do not model them as plain numeric tokens.

**Data visualization:** categorical, sequential, and diverging palettes, chart grid/axis/label colors, series stroke widths, markers, and chart typography.

**Accessibility:** text/surface contrast targets, focus indicators, minimum interactive target dimensions, reduced-motion options, high contrast, and semantic color roles. Validate where possible and report limitations.

**Platform/app-specific/custom:** platform-specific values, density modes, semantic roles, native controls, and custom categories where supported.

Categories and fields must remain extensible. Do not force every category on every project.

### Token architecture and naming options

Let the user select primitive tokens, semantic tokens, component aliases, responsive overrides, theme modes, and platform-specific mappings. Recommended default: primitives plus semantic tokens; component aliases only when useful.

Support dot notation, slash notation, existing library convention, and custom naming/prefix rules. Detect name/type conflicts and offer a clear resolution. Prefer reusing compatible existing tokens instead of creating duplicates.

### Generation scope controls

Allow the user to choose:

- All selected categories or a subset
- Only missing tokens
- New collection versus extending a collection
- Draft-only changes versus publication after review
- Selected screen/component/project scope where applicable
- Selected devices, themes, and target exports

Published tokens must never be silently overwritten. Replacing a published value requires an explicit review and approval.

### Preview and approval

Before applying output, show a reviewable proposal with token name, type, value/mapping, category, collection, description, mode/device scope, references, action (create/reuse/edit/skip), reason, and validation status.

Provide previews for color palettes, typography specimens, spacing scales, theme variations, responsive comparisons, dependency links, naming conflicts, duplicate candidates, accessibility warnings, and unsupported conversion behavior where relevant.

Allow per-category regeneration without regenerating the entire system. Let users edit, rename, change values, reuse an existing reference, skip, save as draft, approve selected entries, or approve all valid entries. Only approved proposals may be committed.

### AI generation implementation rules

Pass the model structured context: selected mode/categories, user input, existing token graph, naming convention, collections, themes, device profiles, selected design scope, available assets/fonts, and target exports. Require typed structured proposals; validate them with application code rather than trusting natural-language output alone. Flag uncertainty and avoid inventing unsupported details.

## 10. Responsive token generation: desktop to tablet/mobile

Allow users to select an existing desktop/source collection and request:

- Generate tablet adaptations
- Generate mobile adaptations
- Generate tablet and mobile adaptations

The generator must ask which categories should be adapted and which responsive profiles/breakpoints apply. It must preserve the desktop source collection by default and create only necessary overrides/collections for the requested targets.

### Responsive model

Distinguish:

- Shared values that remain consistent across devices
- Responsive values that change with viewport/layout
- Platform-specific values that differ by platform requirements
- Theme values that change with modes such as Light/Dark

Do not create a separate duplicated token for every device if a shared value is correct. Use a base value with targeted overrides or an equivalent normalized internal mapping.

### Responsive adaptation guidance

- Typography: preserve families and weights by default; adapt heading sizes, wrapping-related properties, and line height only when supported by source design and requirements. Keep body text legible.
- Spacing: adapt page/section spacing where justified; do not shrink every spacing token indiscriminately.
- Layout/grid: adapt container widths, columns, gutters, margins, and page padding based on configured ranges and design context.
- Sizing: adapt dimensions that need to change; preserve minimum interactive targets.
- Color, border, shadow: reuse existing tokens unless a real design requirement justifies a variation.
- Motion: reuse existing motion tokens unless platform or accessibility needs justify changes.
- Shared values: keep brand palette and other cross-device values shared unless the source system indicates otherwise.

Example only (not hard-coded default): a page-padding token may map to 32px for desktop, 24px for tablet, and 16px for mobile. The actual suggestion must be inferred from the user’s configuration and source design, then reviewed by the user.

### Responsive preview and export

Display desktop, tablet, and mobile proposals side by side. Show additions, overrides, shared references, and changes. Detect invalid breakpoint ranges, overlap/gaps, incompatible types, unresolved references, and circular dependencies.

For CSS export, translate responsive mappings to appropriate CSS custom properties, media queries, or fluid functions according to the project’s configured viewport ranges. For JS/TS and native platform targets, use an appropriate target adapter. Do not imply that all target formats support responsive tokens natively. Report conversion or fidelity limitations.

Example output may resemble:

```css
:root {
  --spacing-page-padding: 32px;
  --typography-heading-xl: 40px;
}

@media (max-width: 1024px) {
  :root {
    --spacing-page-padding: 24px;
    --typography-heading-xl: 34px;
  }
}

@media (max-width: 767px) {
  :root {
    --spacing-page-padding: 16px;
    --typography-heading-xl: 28px;
  }
}
```

These values and breakpoints are illustrative only. Use configured responsive profiles. Export generated, validated output from registry data, not from hard-coded examples.

## 11. AI Generate Variables from a component — separate, opt-in workflow

This feature is distinct from AI Generate Tokens. The component-variable workflow starts from a selected component, component set/variant, or explicitly selected layers and proposes variables from its properties.

**Never automatically run AI variable generation merely because the user creates or edits a component.** This workflow starts only when the user explicitly selects “Generate Variables with AI” or issues an equivalent explicit command.

Entry points may include the component context menu, component inspector, Design System → Variables, Design System → Components, selected-component toolbar, or AI assistant.

Example prompts:

- “Generate variables from this component.”
- “Extract reusable variables for color, typography, spacing, and radius.”
- “Generate variable mappings for all variants.”
- “Identify existing variables I can reuse.”

### Analysis and proposal

Inspect supported component properties: fills, backgrounds, strokes, text color, typography, width/height, padding/gap/alignment, radius, border width, shadows, opacity, icon sizing, states, responsive values, theme values, and existing token/variable bindings.

Distinguish reusable properties from one-off values. Read existing tokens, variables, naming conventions, and aliases first. Reuse appropriate variables instead of creating duplicates. Do not create a variable for every property indiscriminately.

Show a review table with source property, proposed variable name, type, value, action (create/reuse/skip), existing reference, scope/collection, and reason. Let the user edit names and values, change collection, select another reference, and approve or reject each proposal.

Only after user approval:

1. Validate types and references.
2. Commit approved variables to the registry.
3. Bind selected component properties to approved variables.
4. Preserve the component’s existing appearance unless a difference was explicitly approved.
5. Update Variables, Assets, usage/dependency records, and previews.
6. Record a reversible change set and version-history entry.

Do not change unrelated components, silently overwrite existing variables, or break current bindings. Provide undo and a clear result summary.

## 12. Create a design system from scratch

Provide a resumable guided wizard:

1. Name and describe the system.
2. Choose blank system or optional starter (minimal, enterprise, e-commerce, fintech, Material-inspired, or custom).
3. Configure foundational color, typography, spacing, sizing, layout, and other needed tokens.
4. Create collections and variables.
5. Establish primitive/semantic references and aliases.
6. Configure Light/Dark/other modes as required.
7. Select or create foundation components.
8. Configure component properties, variants, states, slots, and responsive behavior.
9. Bind components to compatible tokens/variables.
10. Preview and validate.
11. Save as draft or publish.

Starters are editable suggestions, not mandatory locked visual systems. Let users skip categories or resume later. Before publishing, validate duplicate names, invalid values, type mismatches, missing references, circular aliases, missing dependencies, and export compatibility. Block invalid graph states by default; allow only narrowly defined, explicitly acknowledged non-blocking warnings.

## 13. Import a React design system

Provide an Import Design System wizard with supported input methods based on capabilities available in the repository and runtime. Potential sources include a ZIP archive, supported local-directory integration, authorized Git integration, npm package/archive, Storybook project/build, DTCG-compatible JSON, other supported token JSON, CSS/SCSS, theme configuration, and SVG/icon assets.

Do not promise every package or source format is fully importable. Declare an explicit compatibility matrix and produce an import report.

### Import stages

1. Select source and destination (new library or merge).
2. Inspect file list and project metadata.
3. Identify framework/build conventions and declared dependencies without executing untrusted scripts.
4. Parse supported source constructs.
5. Detect tokens, variables, themes, typography, styles, exports, components, props, TypeScript types, CSS Modules, CSS/SCSS, CSS custom properties, Tailwind configuration, supported styled-components/Emotion definitions, supported theme providers, icons, and Storybook stories where feasible.
6. Show parsed inventory, confidence, unsupported constructs, duplicate/conflicting names, dependency needs, and expected fidelity.
7. Map discovered records into the normalized internal schema.
8. Let users review/resolve conflicts.
9. Commit import transactionally to a new library or merge destination.
10. Show final report and make supported imports available in Assets, Components, Tokens, and Variables.

### Import safety and fidelity

- Treat source files and packages as untrusted.
- Do not run package install scripts or imported code inside the trusted process.
- Apply file-size, archive-depth, path traversal, dependency, and resource limits.
- Use static analysis and a sandboxed preview environment when rendering is necessary and available.
- Preserve source files/metadata when permitted.
- Keep stable source mappings to trace each imported item.
- Mark partially understood components as source-only/unsupported with specific reasons; do not falsely label them fully native.
- If a conversion loses semantics, report the loss explicitly. Never silently replace a behaviorally rich component with a merely similar static drawing.
- Failed imports must not corrupt an existing library. Support retry and cleanup of incomplete jobs.

## 14. Design editor, prototype, and React compiler integrations

### Design editor

Make tokens and components available for selection and binding in the editor. Support appropriate property-binding controls for fill, stroke, typography, dimensions, padding, gap, radius, opacity, effects, and other compatible fields. Preserve direct styling where allowed but make unbound reusable candidates discoverable.

Token/variable changes should refresh dependent previews predictably. Avoid unnecessary full-document recomputation; update affected nodes and dependencies.

### Prototype engine

Allow designers to insert library components into screens, configure properties/variants, bind prototype variables, define states/interactions, and test across responsive viewport sizes. Use the same component definitions as the design editor. A viewport switch must preserve the current prototype flow/screen identity where the prototype model supports responsive variants; it must not navigate to an unrelated screen simply because the viewport changed.

### React compiler/export

Export from published, validated registry data. Generated output should reuse tokens through a theme/token layer, preserve supported component props/variants, support configured TypeScript and styling conventions, honor responsive mappings, and avoid needless duplicated raw values.

Provide appropriate adapters for supported targets, such as DTCG-compatible JSON, supported token JSON, CSS custom properties, SCSS, JS/TS token modules, React components, theme configurations, and documentation. For each target, clearly report unsupported features or conversions that may lose information.

When a token or component changes, calculate impacted generated files and offer an incremental diff. Do not overwrite user-maintained code without review. Use extension points, adapters, or merge/conflict handling to preserve customization.

## 15. Token interoperability and export

Support DTCG-compatible token representation where the existing implementation can correctly implement it, in addition to common supported JSON token structures and CSS custom properties. Validate import/export schemas. Do not emit example data instead of actual registry data.

Example of an illustrative color token:

```json
{
  "color": {
    "brand": {
      "primary": {
        "$type": "color",
        "$value": "#2457D6",
        "$description": "Primary brand color"
      }
    }
  }
}
```

Exact serialization must follow the selected export schema and the schema’s current supported rules. Preserve provenance and mappings internally even if a target format cannot represent every internal feature.

## 16. AI governance, safety, and user control

- AI generation is initiated by the user except for non-mutating suggestions already supported by the product.
- AI never silently publishes, replaces published values, or modifies unrelated designs.
- Generated proposals are validated by deterministic application code.
- Separate a suggested proposal from a committed registry record.
- Include a visible diff before consequential changes.
- Preserve the ability to cancel before commit and undo after application.
- Keep model prompts and imported content from being treated as trusted system instructions.
- Do not send private project data to an external service unless the configured provider and user consent authorize it; follow the existing privacy architecture.
- Report missing AI availability and offer a clear retry or manual workflow rather than simulating success.

## 17. Versioning, publishing, and rollback

Support draft, published, deprecated, and archived states where appropriate. Record version/release number, author or actor, timestamp, change summary, token/component diffs, dependency impacts, and source mappings.

Provide compare versions, publish release, show update availability, rollback/restore where safe, deprecate entities, and update consumers with a reviewable migration plan. Publishing must validate references and dependencies. Do not break existing projects silently.

## 18. Reliability, performance, and observability

- Use the current application’s persistence and migration conventions.
- Persist changes across reloads and recover safely from interrupted operations.
- Use transactional writes for multi-record commits or implement equivalent rollback/repair behavior.
- Detect concurrent edit conflicts where relevant.
- Use incremental dependency recalculation and invalidate caches correctly.
- Virtualize large lists where needed; debounce search and expensive operations.
- Apply import size/resource limits.
- Show meaningful loading, success, warning, empty, and error states.
- Log actionable diagnostics without exposing secrets or sensitive imported source values unnecessarily.
- Make errors recoverable and never show success unless persistence actually succeeded.

## 19. Required implementation and delivery sequence

Follow an incremental sequence appropriate to the inspected codebase. At minimum, ensure the delivery covers:

1. Architecture inspection and a concise implementation plan.
2. Data model/registry and safe migration.
3. Design System navigation/page and working Tokens, Variables, Components, Assets views.
4. Shared dependency/usage model and synchronization.
5. Token editing and theming/modes.
6. AI Generate Tokens configuration wizard, proposal review, validation, and commit.
7. Responsive adaptation workflow.
8. Explicit, opt-in AI Generate Variables from Component workflow.
9. Create-from-scratch wizard.
10. React design-system import wizard and compatibility/reporting.
11. Design editor, prototype, and React compiler integrations.
12. Versioning, publication, auditability, and rollback.
13. Automated tests, regression verification, and documentation.

If implementation scope is too large for one pass, ship coherent vertical slices with persisted behavior and tests rather than claiming that unfinished features are complete. Explicitly mark what is implemented, partial, or unsupported.

## 20. Acceptance criteria and test plan

The task is not complete until the implementation demonstrates the applicable criteria below through tests or reproducible manual verification.

### Registry and synchronization

1. A dedicated Design System page is accessible and consistent with the existing application UI.
2. Tokens and Components are prominent and separately navigable.
3. Tokens, Variables, Components, Styles, and Assets use a shared authoritative registry/reference model.
4. Explicitly created tokens, variables, components, styles, and reusable assets appear in their appropriate views after a successful save.
5. Updating a token updates compatible dependent component previews and usage data.
6. Renaming an entity preserves references through stable IDs.
7. Deleting/deprecating referenced items detects dependencies and prevents accidental broken references.
8. Usage navigation works from registry items to consumers and back.
9. Changes persist after reload.

### Token generation

10. AI Generate Tokens opens the required configuration modal before generation.
11. Users can select individual categories and device targets.
12. Typography includes typeface configuration and available-font validation.
13. Existing tokens are checked before duplicates are proposed.
14. The proposal is structured, typed, editable, and validated.
15. Users can approve/reject individual proposals and regenerate selected categories.
16. Published values are not silently overwritten.
17. Only approved changes are committed.
18. Invalid or uncertain results produce actionable warnings and do not corrupt the registry.

### Responsive generation

19. An existing desktop system can generate tablet, mobile, or both adaptations.
20. The original desktop system remains unchanged unless a change is explicitly approved.
21. Shared values are reused; only justified responsive overrides are introduced.
22. Configured viewport ranges are respected.
23. Responsive preview, dependencies, and export output match the reviewed proposal.
24. Invalid ranges and references are detected.

### Component-variable generation

25. AI variable extraction does not run merely because a component is created or edited.
26. It runs only after an explicit user request.
27. It inspects existing bindings and reuses appropriate variables.
28. The user can review, edit, skip, or approve individual suggestions.
29. Approved bindings preserve the component’s appearance unless an intentional visual change is accepted.
30. The change is undoable and appears in history.

### System creation and import

31. The from-scratch wizard can save a draft and resume it.
32. Imported React systems use the same internal registry schema as native systems.
33. Unsupported constructs and fidelity gaps are reported accurately.
34. An invalid or interrupted import does not corrupt existing libraries.
35. Untrusted imported code is not executed in the trusted application process.
36. Imported items preserve source mappings and are discoverable in supported views.

### Integration and governance

37. The Design editor can bind supported properties to variables/tokens.
38. The prototype runtime consumes the same component definitions and preserves the responsive flow/screen identity where applicable.
39. React export uses real registry data and reports unsupported conversions.
40. Published changes have version history and a reviewable impact/update flow.
41. AI changes are reviewable, reversible, and never silently published.
42. Visible controls have real behavior and working loading/error states.
43. Relevant unit, integration, type, lint, build, and end-to-end tests pass, or any pre-existing failures and unimplemented items are clearly identified.
44. Existing functionality remains intact, confirmed by regression checks.

## 21. Final completion report

At the end, provide a concise, factual report containing:

- What was implemented
- The relevant files/modules changed
- Data migrations or configuration changes
- Working end-to-end workflows
- Tests/checks actually run and their outcomes
- Known limitations, unsupported import formats, or partial features
- Any follow-up work that is truly necessary

Do not report a feature as complete merely because its UI exists. Do not claim zero errors unless verified; report actual test evidence. Do not hide failing tests or unsupported behavior.

## Final implementation directive

Build DesignForge AI’s Design System as one connected, persistent, versioned, and testable subsystem. Give designers two primary routes—import an existing React-based design system or create one from scratch—plus guided AI token generation and explicitly requested component-variable extraction. Automatically synchronize saved reusable entities across Tokens, Variables, Components, Styles, Assets, the Design editor, Prototyping, and supported React exports through the shared registry.

Preserve the existing application’s UI and working behavior. Deliver functioning workflows, not just a visual prototype. Validate changes, preserve user control, keep responsive adaptations traceable, handle import limitations honestly, and prove the implementation with tests.
