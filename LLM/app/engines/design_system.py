"""
DF-UX Intelligence - Design System Engine
Maintains design token integrity, detects token violations, and maps components
to DesignForge design system registries (Mantine, MUI, AG Grid, React Native Elements).
"""

from typing import Dict, Any, List
from ..models.dfir import DFIRDocument, DFIRNode


class DesignSystemEngine:
    REGISTRY_COMPONENTS = {
        "mantine": [
            {"name": "Button", "variants": ["filled", "light", "outline", "subtle"], "props": ["size", "radius", "color"]},
            {"name": "Card", "variants": ["elevated", "bordered"], "props": ["padding", "radius", "shadow"]},
            {"name": "TextInput", "variants": ["default", "filled"], "props": ["label", "error", "description"]},
            {"name": "Table", "variants": ["striped", "highlightOnHover"], "props": ["horizontalSpacing", "verticalSpacing"]}
        ],
        "ag_grid": [
            {"name": "AgGridReact", "theme": "ag-theme-alpine-dark", "features": ["sorting", "filtering", "pagination", "columnResize"]}
        ],
        "grafana": [
            {"name": "TimeSeriesChart", "variants": ["line", "bars", "points"]},
            {"name": "StatCard", "variants": ["single", "sparkline"]}
        ]
    }

    @classmethod
    def audit_and_recommend(cls, doc: DFIRDocument) -> Dict[str, Any]:
        all_nodes = cls._collect_nodes(doc.root)
        token_usage_count = 0
        violations = []

        # Audit token adherence
        for n in all_nodes:
            if n.style.fills:
                for f in n.style.fills:
                    if f.color:
                        # Check if color is part of document token map
                        is_tokenized = any(f.color.lower() == val.lower() for val in doc.tokens.colors.values())
                        if is_tokenized:
                            token_usage_count += 1
                        else:
                            # Flag untokenized hex
                            violations.append({
                                "node_id": n.id,
                                "node_name": n.name,
                                "untokenized_color": f.color,
                                "recommendation": "Map to token 'brand_primary' or 'bg_surface'"
                            })

        token_consistency_score = round(max(0, 100 - (len(violations) * 2.5)), 1)

        # Component recommendations
        recommended_components = []
        for n in all_nodes:
            nl = n.name.lower()
            if "table" in nl or "grid" in nl:
                recommended_components.append({
                    "node_id": n.id,
                    "library": "ag-grid-react",
                    "component": "AgGridReact",
                    "reason": "Enterprise-grade tabular data grid with sorting, pagination, and virtual scrolling."
                })
            elif "card" in nl:
                recommended_components.append({
                    "node_id": n.id,
                    "library": "@mantine/core",
                    "component": "Card",
                    "reason": "Container card supporting semantic elevation, padding tokens, and border radii."
                })
            elif "nav" in nl:
                recommended_components.append({
                    "node_id": n.id,
                    "library": "@mantine/core",
                    "component": "NavLink",
                    "reason": "Accessible navigation item with hover, active, and focus management."
                })
            elif "btn" in nl or "action" in nl:
                recommended_components.append({
                    "node_id": n.id,
                    "library": "@mantine/core",
                    "component": "Button",
                    "reason": "Accessible interactive button with native keyboard focus and hover states."
                })

        return {
            "token_consistency_score": token_consistency_score,
            "tokens_registered": len(doc.tokens.colors) + len(doc.tokens.spacing),
            "untokenized_violations_count": len(violations),
            "violations_sample": violations[:5],
            "component_recommendations": recommended_components[:6],
            "available_libraries": ["@mantine/core", "ag-grid-react", "@grafana/ui", "@rneui/themed"]
        }

    @classmethod
    def _collect_nodes(cls, root: DFIRNode) -> List[DFIRNode]:
        nodes = [root]
        for c in root.children:
            nodes.extend(cls._collect_nodes(c))
        return nodes
