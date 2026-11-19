"""
DF-UX Intelligence - Design-to-Code Engine
Compiles validated DFIR documents into production-ready React 19 + TypeScript components.
"""

from typing import Dict, Any, List
from ..models.dfir import DFIRDocument, DFIRNode


class CodeCompilerEngine:
    @classmethod
    def compile_to_react(cls, doc: DFIRDocument) -> Dict[str, Any]:
        """Translates DFIR document into clean React 19 + TypeScript source files."""
        component_name = cls._to_pascal_case(doc.metadata.title or "GeneratedComponent")

        tokens_ts = cls._generate_tokens_ts(doc.tokens.colors)
        component_tsx = cls._generate_component_tsx(component_name, doc.root)

        return {
            "success": True,
            "component_name": component_name,
            "framework": "React 19 + TypeScript",
            "files": {
                f"{component_name}.tsx": component_tsx,
                "tokens.ts": tokens_ts
            },
            "stats": {
                "lines_of_code": len(component_tsx.split("\n")) + len(tokens_ts.split("\n")),
                "tokens_exported": len(doc.tokens.colors)
            }
        }

    @classmethod
    def _generate_tokens_ts(cls, colors: Dict[str, str]) -> str:
        lines = [
            "/**",
            " * DesignForge AI - Exported Design Tokens",
            " */",
            "export const tokens = {",
            "  colors: {"
        ]
        for k, v in colors.items():
            lines.append(f"    {k}: '{v}',")
        lines.extend([
            "  },",
            "  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },",
            "  radii: { sm: 6, md: 10, lg: 16, full: 9999 }",
            "};",
            "export default tokens;"
        ])
        return "\n".join(lines)

    @classmethod
    def _generate_component_tsx(cls, name: str, root: DFIRNode) -> str:
        jsx_body = cls._node_to_jsx(root, indent=4)
        return f"""import React from 'react';
import {{ tokens }} from './tokens';

export interface {name}Props {{
  className?: string;
  style?: React.CSSProperties;
}}

export const {name}: React.FC<{name}Props> = ({{ className, style }}) => {{
  return (
{jsx_body}
  );
}};

export default {name};
"""

    @classmethod
    def _node_to_jsx(cls, node: DFIRNode, indent: int = 4) -> str:
        spaces = " " * indent
        tag = "div"
        if node.type == "text":
            content = node.text.content if node.text else node.name
            style_str = f"fontSize: {node.text.fontSize if node.text else 14}, fontWeight: '{node.text.fontWeight if node.text else 400}', color: '{node.text.color if node.text else '#FFFFFF'}'"
            return f"{spaces}<span style={{{{ {style_str} }}}}>{content}</span>"

        # Container styling
        style_parts = []
        if node.transform.width > 0:
            style_parts.append(f"width: '{int(node.transform.width)}px'")
        if node.style.fills and node.style.fills[0].color:
            style_parts.append(f"backgroundColor: '{node.style.fills[0].color}'")
        if node.style.cornerRadius > 0:
            style_parts.append(f"borderRadius: '{node.style.cornerRadius}px'")

        # Auto layout flex
        if node.layout.mode in ["stack-horizontal", "stack-vertical"]:
            style_parts.append("display: 'flex'")
            flex_dir = "row" if node.layout.mode == "stack-horizontal" else "column"
            style_parts.append(f"flexDirection: '{flex_dir}'")
            if node.layout.gap > 0:
                style_parts.append(f"gap: '{int(node.layout.gap)}px'")
            if node.layout.paddingLeft > 0:
                style_parts.append(f"padding: '{int(node.layout.paddingTop)}px {int(node.layout.paddingRight)}px {int(node.layout.paddingBottom)}px {int(node.layout.paddingLeft)}px'")

        inline_style = ", ".join(style_parts)

        if not node.children:
            return f"{spaces}<{tag} style={{{{ {inline_style} }}}} />"

        children_jsx = "\n".join(cls._node_to_jsx(c, indent + 2) for c in node.children)
        return f"{spaces}<{tag} style={{{{ {inline_style} }}}}>\n{children_jsx}\n{spaces}</{tag}>"

    @classmethod
    def _to_pascal_case(cls, text: str) -> str:
        words = "".join(c if c.isalnum() else " " for c in text).split()
        return "".join(w.capitalize() for w in words) or "DesignForgeComponent"
