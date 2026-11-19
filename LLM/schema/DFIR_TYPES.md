# DFIR Types Specification
**Standard:** DesignForge Intermediate Representation (DFIR) v1.0  
**Format:** JSON / Pydantic v2  

---

## 1. Document Structure

A DFIR document contains:
- `version`: Strict version identifier (`1.0.0`).
- `metadata`: High-level information about the design (domain, platform, target viewport, timestamp).
- `tokens`: Dictionary of design tokens (`colors`, `typography`, `spacing`, `radii`, `shadows`).
- `root`: The root node representing the top-level container (typically an artboard or frame).
- `uxRationale`: Detailed reasoning behind layout, component choices, heuristics applied, and accessibility considerations.

---

## 2. Node Types

1. **frame:** A rectangular container with support for auto layout stacks (horizontal/vertical) or absolute positioning. Used for screens, sections, cards, and modal dialogs.
2. **group:** A logical grouping of sibling elements without layout constraints.
3. **rectangle:** Geometric rectangular shape used for visual cards, dividers, badges, and backgrounds.
4. **ellipse:** Circular or oval shape used for avatars, status badges, and decorative accents.
5. **text:** Text element containing typography styles (`fontSize`, `fontWeight`, `lineHeight`, `color`).
6. **vector:** Custom SVG vector path data (`pathData`, `fillRule`).
7. **image:** Image asset reference with dimensions and asset URL or placeholder.
8. **component:** Master reusable component template with component ID and variant definitions.
9. **instance:** Instance of a master component referencing `componentId` with property overrides.

---

## 3. Layout Specifications

- **mode:**
  - `none`: Manual absolute positioning.
  - `stack-horizontal`: Flexbox row layout.
  - `stack-vertical`: Flexbox column layout.
  - `grid`: CSS Grid-like rows and columns.
  - `absolute`: Explicit coordinates within a relative parent.
- **alignItems:** Alignment perpendicular to the primary axis (`start`, `center`, `end`, `stretch`).
- **justifyContent:** Alignment along the primary axis (`start`, `center`, `end`, `space-between`, `space-around`).
- **sizingHorizontal / sizingVertical:**
  - `fixed`: Explicit pixel width or height.
  - `hug`: Shrink-wraps around children.
  - `fill`: Expands to fill available parent space (`flex: 1`).
