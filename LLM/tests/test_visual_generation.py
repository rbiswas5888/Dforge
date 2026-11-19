"""
Visual Generation Engine & Orchestration Tests
"""

import pytest
from app.orchestration.intent import IntentClassifier
from app.orchestration.planner import TaskPlanner
from app.engines.visual_generation import VisualGenerationEngine
from app.orchestration.validator import DFIRValidator


def test_intent_classifier():
    res = IntentClassifier.classify("Create an enterprise banking dashboard with transactions and portfolio balance")
    assert res["domain"] == "fintech"
    assert res["platform"] == "desktop"
    assert res["intent"] == "create_screen"
    assert "dashboard" in res["components"] or "transactions" in res["components"]

    res_mob = IntentClassifier.classify("Design a modern mobile shopping cart screen for iOS")
    assert res_mob["platform"] == "mobile"
    assert res_mob["domain"] == "ecommerce"


def test_task_planner():
    plan = TaskPlanner.create_plan("Build an analytics dashboard with KPI cards and sidebar")
    assert plan["viewport"]["width"] == 1440
    assert plan["viewport"]["height"] == 900
    assert "recommended_tokens" in plan
    assert len(plan["heuristics"]) >= 3


def test_visual_generation_desktop_dashboard():
    prompt = "Create an enterprise cloud SaaS dashboard with overview, metrics, and transactions table"
    doc = VisualGenerationEngine.generate(prompt)

    assert doc.version == "1.0.0"
    assert doc.metadata.title is not None
    assert doc.root.type == "frame"
    assert doc.root.transform.width == 1440
    assert len(doc.root.children) >= 2  # Sidebar + Main Content

    # Verify Sidebar
    sidebar = doc.root.children[0]
    assert "sidebar" in sidebar.name.lower() or "nav" in sidebar.name.lower()
    assert len(sidebar.children) >= 2

    # Verify Main Content with KPI & Table
    main_content = doc.root.children[1]
    assert len(main_content.children) >= 3

    # Auto-healing / validation check
    validated_doc, report = DFIRValidator.validate_and_repair(doc.model_dump())
    assert report["valid"] is True
    assert report["node_count"] > 10


def test_visual_generation_mobile_app():
    prompt = "Design a mobile banking portfolio card on 375px screen"
    doc = VisualGenerationEngine.generate(prompt)

    assert doc.metadata.platform == "mobile"
    assert doc.root.transform.width == 375
    assert doc.root.transform.height == 812
    assert len(doc.root.children) >= 3  # Topbar + Primary Card + Action Buttons
