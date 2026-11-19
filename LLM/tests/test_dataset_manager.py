"""
Dataset Manager and LoRA Fine-Tuning Tests
"""

import json
import pytest
from starlette.testclient import TestClient
from app.main import app
from app.knowledge.datasets.manager import dataset_manager
from app.knowledge.datasets.training_config import TrainingConfigGenerator

client = TestClient(app)


def test_dataset_categories_seeded():
    categories = dataset_manager.list_categories()
    assert len(categories) == 6
    cat_ids = [c["id"] for c in categories]
    assert "text_to_ui" in cat_ids
    assert "ux_evaluation" in cat_ids
    assert "design_to_code" in cat_ids


def test_add_and_update_dataset_example():
    ex = dataset_manager.add_example({
        "task_category": "design_to_code",
        "input": "Compile DFIR button with primary theme into React TSX",
        "expected_output": "<Button className='bg-blue-600 text-white'>Action</Button>",
        "quality_score": 0.94
    })
    assert ex["id"] is not None
    assert ex["task_category"] == "design_to_code"

    # Update quality score
    updated = dataset_manager.update_quality_score(ex["id"], 0.99, approved=True)
    assert updated["quality_score"] == 0.99
    assert updated["reviewer_approval"] is True


def test_export_jsonl():
    jsonl_str = dataset_manager.export_jsonl(category="text_to_ui")
    assert len(jsonl_str) > 0
    first_line = json.loads(jsonl_str.split("\n")[0])
    assert "task_category" in first_line
    assert first_line["task_category"] == "text_to_ui"


def test_lora_recipe_generation():
    recipe = TrainingConfigGenerator.generate_lora_recipe(
        base_model="Qwen/Qwen2.5-32B-Instruct",
        dataset_name="dfux-instruction-v1",
        r=16,
        epochs=3
    )
    assert recipe["peft_type"] == "LORA"
    assert recipe["hyperparameters"]["r"] == 16
    assert "SFTTrainer" in recipe["training_script"]
    assert "BitsAndBytesConfig" in recipe["training_script"]


def test_dataset_api_routes():
    res_cats = client.get("/api/v1/datasets/categories")
    assert res_cats.status_code == 200
    assert len(res_cats.json()) == 6

    res_list = client.get("/api/v1/datasets")
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 2

    res_recipe = client.post("/api/v1/datasets/training-recipe", json={"r": 32, "epochs": 5})
    assert res_recipe.status_code == 200
    data = res_recipe.json()
    assert data["hyperparameters"]["r"] == 32
