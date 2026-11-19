"""
DF-UX Intelligence - DFIR Validator and Auto-Healing Engine
"""

from typing import Dict, Any, Tuple
from ..models.dfir import DFIRDocument, DFIRNode, generate_node_id


class DFIRValidator:
    @classmethod
    def validate_and_repair(cls, raw_data: Dict[str, Any]) -> Tuple[DFIRDocument, Dict[str, Any]]:
        repairs_applied = []

        # 1. Ensure Metadata
        if "metadata" not in raw_data or not isinstance(raw_data["metadata"], dict):
            raw_data["metadata"] = {"title": "Generated UI Screen"}
            repairs_applied.append("Initialized missing metadata")
        elif "title" not in raw_data["metadata"] or not raw_data["metadata"]["title"]:
            raw_data["metadata"]["title"] = "Generated UI Screen"
            repairs_applied.append("Set default title")

        # 2. Ensure Root Node
        if "root" not in raw_data or not isinstance(raw_data["root"], dict):
            raw_data["root"] = {
                "id": generate_node_id("frame"),
                "type": "frame",
                "name": "Artboard",
                "transform": {"x": 0, "y": 0, "width": 1440, "height": 900},
                "children": []
            }
            repairs_applied.append("Created fallback root frame")

        # 3. Recursively Sanitize Tree
        cls._sanitize_node(raw_data["root"], repairs_applied)

        # 4. Validate through Pydantic v2
        doc = DFIRDocument.model_validate(raw_data)
        report = {
            "valid": True,
            "repairs_count": len(repairs_applied),
            "repairs": repairs_applied,
            "node_count": cls._count_nodes(doc.root)
        }
        return doc, report

    @classmethod
    def _sanitize_node(cls, node: Dict[str, Any], repairs: list):
        if not node.get("id"):
            node["id"] = generate_node_id(node.get("type", "node"))
            repairs.append(f"Generated missing ID for {node.get('name', 'node')}")

        if not node.get("name"):
            node["name"] = node.get("type", "Node").capitalize()

        if "transform" not in node or not isinstance(node["transform"], dict):
            node["transform"] = {"x": 0, "y": 0, "width": 100, "height": 100}
        else:
            tf = node["transform"]
            if tf.get("width", 0) < 0:
                tf["width"] = abs(tf["width"])
                repairs.append("Normalized negative width")
            if tf.get("height", 0) < 0:
                tf["height"] = abs(tf["height"])
                repairs.append("Normalized negative height")

        # Sanitize children
        children = node.get("children", [])
        if isinstance(children, list):
            for child in children:
                if isinstance(child, dict):
                    cls._sanitize_node(child, repairs)

    @classmethod
    def _count_nodes(cls, node: DFIRNode) -> int:
        count = 1
        for c in node.children:
            count += cls._count_nodes(c)
        return count
