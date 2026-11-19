"""
Model Manager and Adapters Verification Tests
"""

import asyncio
import pytest
from app.model_manager.manager import model_manager
from app.model_manager.adapters.mock_adapter import MockAdapter


@pytest.mark.anyio
async def test_model_manager_registers_all_candidates():
    models = model_manager.list_models()
    model_ids = [m.id for m in models]

    # Verify candidate models specified in Section 5
    assert "mock-synth-v1" in model_ids
    assert "llama3.1" in model_ids
    assert "qwen3-vl-8b" in model_ids
    assert "gemma-4-12b" in model_ids
    assert "qwen3-32b" in model_ids
    assert "flux-2-klein-4b" in model_ids
    assert "gpt-4o" in model_ids
    assert "gemini-2.5-flash" in model_ids


@pytest.mark.anyio
async def test_mock_adapter_health_and_generation():
    adapter = MockAdapter()
    health = await adapter.check_health()
    assert health["status"] == "connected"
    assert health["latency_ms"] > 0

    text = await adapter.generate_text("Design an analytics table")
    assert "Mock Reasoning Response" in text

    structured = await adapter.generate_structured("Create modern card", schema={})
    assert structured["version"] == "1.0.0"
    assert "root" in structured
    assert structured["root"]["type"] == "frame"


@pytest.mark.anyio
async def test_set_default_model():
    success = model_manager.set_default_model("qwen3-32b")
    assert success is True
    assert model_manager.default_model_id == "qwen3-32b"

    # Reset back to mock for safe offline testing
    model_manager.set_default_model("mock-synth-v1")
    assert model_manager.default_model_id == "mock-synth-v1"
