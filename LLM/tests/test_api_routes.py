"""
FastAPI Routes Integration Tests
"""

import pytest
from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_and_health_endpoints():
    res_root = client.get("/")
    assert res_root.status_code == 200
    assert res_root.json()["module"] == "DF-UX Intelligence"

    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"


def test_list_models_endpoint():
    res = client.get("/api/v1/models")
    assert res.status_code == 200
    models = res.json()
    assert len(models) >= 8
    names = [m["name"] for m in models]
    assert any("DF-UX Local Synth" in n for n in names)


def test_models_health_endpoint():
    res = client.get("/api/v1/models/health")
    assert res.status_code == 200
    data = res.json()
    assert "healthy" in data
    assert "models" in data


def test_generate_dfir_endpoint():
    payload = {
        "prompt": "Create an enterprise banking dashboard with account overview and transactions",
        "intent": "text_to_ui"
    }
    res = client.post("/api/v1/generate/dfir", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "dfir" in data
    assert data["dfir"]["version"] == "1.0.0"
    assert data["dfir"]["root"]["type"] == "frame"
    assert data["reasoning"]["tokens_resolved"] >= 0


def test_generate_ui_endpoint():
    payload = {
        "prompt": "Create an ecommerce product card",
        "industry": "Retail",
        "platform": "mobile"
    }
    res = client.post("/api/v1/generate/ui", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "dfir" in data


def test_benchmarks_endpoint():
    res = client.get("/api/v1/benchmarks")
    assert res.status_code == 200
    data = res.json()
    assert "summary_metrics" in data
    assert data["summary_metrics"]["dfir_validity_pct"] >= 95.0
    assert data["acceptance_criteria_status"]["overall_status"] == "EXCEEDS_ACCEPTANCE_TARGETS"
