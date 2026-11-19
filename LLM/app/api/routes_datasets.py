"""
Training Datasets and LoRA Fine-Tuning API Routes
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from ..knowledge.datasets.manager import dataset_manager
from ..knowledge.datasets.training_config import TrainingConfigGenerator

router = APIRouter(prefix="/datasets", tags=["Training Datasets"])


class ExampleRequest(BaseModel):
    task_category: str
    input: str
    expected_output: str
    context: Optional[str] = "General"
    industry: Optional[str] = "Technology"
    device: Optional[str] = "desktop"
    quality_score: Optional[float] = 0.9


class RecipeRequest(BaseModel):
    base_model: Optional[str] = "Qwen/Qwen2.5-32B-Instruct"
    dataset_name: Optional[str] = "dfux-instruction-v1"
    r: Optional[int] = 16
    epochs: Optional[int] = 3


@router.get("/categories")
async def list_dataset_categories():
    """List 6 training dataset categories."""
    return dataset_manager.list_categories()


@router.get("")
async def list_dataset_examples(category: Optional[str] = None, split: Optional[str] = None):
    """List curated dataset examples with filter by category or split."""
    return dataset_manager.list_examples(category=category, split=split)


@router.post("/example")
async def add_dataset_example(req: ExampleRequest):
    """Add a new training example to the dataset."""
    res = dataset_manager.add_example(req.model_dump())
    return {"success": True, "example": res}


@router.post("/training-recipe")
async def generate_training_recipe(req: RecipeRequest):
    """Generate Hugging Face LoRA/PEFT fine-tuning script and hyperparameters."""
    return TrainingConfigGenerator.generate_lora_recipe(
        base_model=req.base_model,
        dataset_name=req.dataset_name,
        r=req.r,
        epochs=req.epochs
    )


@router.get("/export")
async def export_dataset_jsonl(category: Optional[str] = None):
    """Export dataset in JSONL format."""
    jsonl_data = dataset_manager.export_jsonl(category=category)
    return {"format": "jsonl", "data": jsonl_data}
