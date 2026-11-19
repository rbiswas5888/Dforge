"""
DF-UX Intelligence - Training Dataset Manager
Manages curated JSONL datasets across 6 training categories, quality scoring,
train/val/test splits, reviewer approvals, and exports.
"""

import json
import uuid
from typing import Dict, Any, List, Optional

DATASET_CATEGORIES = [
    {"id": "ux_instruction", "name": "UX Instruction Dataset", "description": "Instruction-following pairs for UX architecture, heuristic critique, and layout rationale."},
    {"id": "text_to_ui", "name": "Text-to-UI Generation Dataset", "description": "Natural language prompts paired with valid canonical DFIR documents."},
    {"id": "screenshot_understanding", "name": "Screenshot Understanding Dataset", "description": "UI screenshots paired with visual decomposition, bounding boxes, and color tokens."},
    {"id": "ux_evaluation", "name": "UX Evaluation Dataset", "description": "Interface screenshots/DFIR paired with expert Nielsen Norman heuristic reviews."},
    {"id": "design_system", "name": "Design System Dataset", "description": "Component token definitions and component mapping recipes."},
    {"id": "design_to_code", "name": "Design-to-Code Dataset", "description": "DFIR trees paired with production-ready React 19 and TypeScript source components."}
]


class DatasetManager:
    def __init__(self):
        self.examples: Dict[str, Dict[str, Any]] = {}
        self._seed_sample_datasets()

    def _seed_sample_datasets(self):
        seed_samples = [
            {
                "id": "ex_fintech_01",
                "task_category": "text_to_ui",
                "input": "Create an enterprise banking dashboard with overview and transactions table",
                "expected_output": '{"$schema": "https://designforge.ai/schemas/dfir-v1.json", "version": "1.0.0", "metadata": {"title": "Banking Dashboard"}}',
                "context": "Fintech / B2B SaaS",
                "industry": "Financial Services",
                "device": "desktop",
                "design_constraints": "WCAG AA contrast, 8pt grid, dark theme",
                "source_and_licence": "DesignForge Curated Team / Apache-2.0",
                "quality_score": 0.98,
                "reviewer_approval": True,
                "dataset_version": "1.0",
                "split": "train"
            },
            {
                "id": "ex_ux_eval_01",
                "task_category": "ux_evaluation",
                "input": "Evaluate mobile shopping cart with 32px buttons on touch viewport",
                "expected_output": "Violation of WCAG 2.5.5 touch target size. Minimum touch target should be 44x44px to prevent miss-clicks.",
                "context": "Mobile E-commerce",
                "industry": "Retail",
                "device": "mobile",
                "design_constraints": "Mobile touch ergonomics",
                "source_and_licence": "DesignForge Internal Review / MIT",
                "quality_score": 0.95,
                "reviewer_approval": True,
                "dataset_version": "1.0",
                "split": "validation"
            }
        ]
        for s in seed_samples:
            self.examples[s["id"]] = s

    def list_categories(self) -> List[Dict[str, Any]]:
        return DATASET_CATEGORIES

    def list_examples(self, category: Optional[str] = None, split: Optional[str] = None) -> List[Dict[str, Any]]:
        res = list(self.examples.values())
        if category:
            res = [e for e in res if e["task_category"] == category]
        if split:
            res = [e for e in res if e.get("split") == split]
        return res

    def add_example(self, example_data: Dict[str, Any]) -> Dict[str, Any]:
        ex_id = example_data.get("id") or f"ex_{uuid.uuid4().hex[:8]}"
        record = {
            "id": ex_id,
            "task_category": example_data.get("task_category", "ux_instruction"),
            "input": example_data.get("input", ""),
            "expected_output": example_data.get("expected_output", ""),
            "context": example_data.get("context", "General"),
            "industry": example_data.get("industry", "Technology"),
            "device": example_data.get("device", "desktop"),
            "design_constraints": example_data.get("design_constraints", "Standard"),
            "source_and_licence": example_data.get("source_and_licence", "Internal / CC-BY-4.0"),
            "quality_score": float(example_data.get("quality_score", 0.9)),
            "reviewer_approval": bool(example_data.get("reviewer_approval", False)),
            "dataset_version": example_data.get("dataset_version", "1.0"),
            "split": example_data.get("split", "train")
        }
        self.examples[ex_id] = record
        return record

    def update_quality_score(self, ex_id: str, score: float, approved: bool = True) -> Optional[Dict[str, Any]]:
        if ex_id in self.examples:
            self.examples[ex_id]["quality_score"] = min(1.0, max(0.0, score))
            self.examples[ex_id]["reviewer_approval"] = approved
            return self.examples[ex_id]
        return None

    def export_jsonl(self, category: Optional[str] = None, split: Optional[str] = None) -> str:
        items = self.list_examples(category=category, split=split)
        lines = [json.dumps(it) for it in items]
        return "\n".join(lines)


# Global singleton instance
dataset_manager = DatasetManager()
