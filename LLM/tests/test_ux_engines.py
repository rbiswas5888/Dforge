"""
UX Intelligence Engines Verification Tests
"""

import os
import json
import pytest
from starlette.testclient import TestClient
from app.main import app
from app.models.dfir import DFIRDocument
from app.engines.ux_reasoning import UXReasoningEngine
from app.engines.accessibility import AccessibilityEngine
from app.engines.design_system import DesignSystemEngine
from app.engines.prototyping import PrototypingEngine
from app.engines.code_compiler import CodeCompilerEngine

client = TestClient(app)


@pytest.fixture
def sample_dfir():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    example_path = os.path.join(base_dir, "schema", "DFIR_EXAMPLES", "dashboard_example.json")
    with open(example_path, "r") as f:
        data = json.load(f)
    return DFIRDocument.model_validate(data)


def test_ux_reasoning_evaluation(sample_dfir):
    res = UXReasoningEngine.evaluate(sample_dfir)
    assert res["overall_ux_score"] >= 80.0
    assert len(res["heuristics"]) == 10
    assert res["information_architecture"]["has_persistent_navigation"] is True


def test_accessibility_audit_wcag_compliance(sample_dfir):
    res = AccessibilityEngine.audit(sample_dfir)
    assert res["compliance_score"] >= 80.0
    assert res["target_standard"] == "WCAG 2.2 AA"
    assert len(res["automated_checks"]) > 0
    assert len(res["human_testing_required"]) == 3


def test_design_system_auditing_and_recommendations(sample_dfir):
    res = DesignSystemEngine.audit_and_recommend(sample_dfir)
    assert res["tokens_registered"] > 5
    assert len(res["component_recommendations"]) > 0
    assert "@mantine/core" in res["available_libraries"]


def test_prototyping_generation(sample_dfir):
    res = PrototypingEngine.generate_interactions(sample_dfir)
    assert res["success"] is True
    assert res["total_connections"] > 0
    assert res["device_preset"] == "desktop_1440"


def test_code_compiler_react_generation(sample_dfir):
    res = CodeCompilerEngine.compile_to_react(sample_dfir)
    assert res["success"] is True
    assert res["framework"] == "React 19 + TypeScript"
    assert "EnterpriseBankingDashboard.tsx" in res["files"]
    assert "tokens.ts" in res["files"]

    tsx_content = res["files"]["EnterpriseBankingDashboard.tsx"]
    assert "export const EnterpriseBankingDashboard" in tsx_content
    assert "style={{" in tsx_content


def test_evaluate_ux_api_route(sample_dfir):
    payload = {"dfir": sample_dfir.model_dump()}
    res = client.post("/api/v1/evaluate/ux", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "overall_ux_score" in data
    assert "accessibility" in data


def test_compile_code_api_route(sample_dfir):
    res = client.post("/api/v1/code/compile", json=sample_dfir.model_dump())
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "files" in data
