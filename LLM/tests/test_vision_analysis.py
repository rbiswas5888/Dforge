"""
Vision Analysis Engine Tests
"""

import pytest
from starlette.testclient import TestClient
from app.main import app
from app.engines.vision_analysis import VisionAnalysisEngine

client = TestClient(app)


def test_vision_analysis_engine_decomposition():
    res = VisionAnalysisEngine.analyze_screenshot(
        image_base64="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        prompt_hint="SaaS dashboard with analytics table"
    )

    assert res["success"] is True
    assert res["detected_topology"] == "desktop_dashboard"
    assert res["confidence_overall"] > 0.8
    assert "bg_main" in res["colors_extracted"]
    assert len(res["detected_regions"]) >= 3
    assert res["reconstructed_dfir"].version == "1.0.0"
    assert res["reconstructed_dfir"].root.type == "frame"


def test_analyze_screenshot_endpoint():
    payload = {
        "image_base64": "fake_base64_data",
        "detect_tokens": True,
        "generate_dfir": True
    }
    res = client.post("/api/v1/analyze/screenshot", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "colors_extracted" in data
    assert "reconstructed_dfir" in data
    assert "disclaimer" in data
