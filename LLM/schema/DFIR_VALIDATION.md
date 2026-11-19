# DFIR Validation Rules & Error Handling
**Standard:** DesignForge Intermediate Representation (DFIR) v1.0  

---

## 1. Validation Criteria

Before any DFIR document is committed to the DesignForge canvas or compiled to React, it must pass three validation phases:

1. **Schema Validation:**
   - Complies strictly with `dfir.schema.json` (Draft 2020-12).
   - Mandatory fields present: `version`, `metadata.title`, `root.id`, `root.type`, `root.name`.
   - Node types restricted to supported enumeration.
2. **Structural Integrity:**
   - All node IDs within the tree must be globally unique.
   - No circular parent-child references.
   - Sizing and transform coordinates must be non-negative real numbers.
   - Valid color formats (Hex `#RRGGBB`, `#RRGGBBAA`, `rgb(...)`, `rgba(...)`).
3. **UX & Token Compliance:**
   - Any design token referenced in fills/strokes must exist in the document tokens dictionary or fallback gracefully.
   - Auto-layout nodes with `hug` sizing must contain at least one child or define fallback min-dimensions.
   - Text elements must provide non-empty text content or default placeholder.

---

## 2. Validation Errors & Auto-Fixes

The validation pipeline includes an auto-healing phase (`DFIRValidator.repair()`):
- **Missing IDs:** Automatically generated using `gen_id(type)`.
- **Missing Dimensions:** Inferred from parent or assigned default based on node type.
- **Invalid Colors:** Replaced with safe fallback theme token (`#334155`).
- **Orphan Nodes:** Anchored to root frame.
