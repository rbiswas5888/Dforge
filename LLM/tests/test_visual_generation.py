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


def test_visual_generation_enterprise_banking_command_centre():
    prompt = (
        "# MASTER PROMPT: DESIGNFORGE AI\n"
        "## Enterprise Banking Operations Command Centre — Complex Fintech Dashboard\n"
        "Create a centralised Banking Operations Command Centre that provides a real-time overview of banking operations."
    )
    doc = VisualGenerationEngine.generate(prompt)

    assert doc.version == "1.0.0"
    assert doc.root.transform.width == 1440
    assert doc.root.transform.height == 3200
    assert len(doc.root.children) == 2  # Sidebar + Main Content

    sidebar = doc.root.children[0]
    assert "sidebar" in sidebar.name.lower()
    # 1 logo + 10 nav items = 11 items
    assert len(sidebar.children) == 11

    main_content = doc.root.children[1]
    # TopNav + Sec A to I + Sec 10 = 11 containers
    assert len(main_content.children) == 11

    # Verify sections present
    names = [c.name for c in main_content.children]
    assert any("Top Navigation" in n for n in names)
    assert any("Section A: Page Header" in n for n in names)
    assert any("Section B: Executive KPI" in n for n in names)
    assert any("Section C: Transaction Volume" in n for n in names)
    assert any("Section D: Payment Channels" in n for n in names)
    assert any("Section E: Risk and Fraud" in n for n in names)
    assert any("Section F: Settlement and Reconciliation" in n for n in names)
    assert any("Section G: Operational SLA" in n for n in names)
    assert any("Section H: Operational Exceptions" in n for n in names)
    assert any("Section I: Recent Transaction" in n for n in names)
    assert any("Section 10: AI Operational Intelligence" in n for n in names)

    validated_doc, report = DFIRValidator.validate_and_repair(doc.model_dump())
    assert report["valid"] is True
    assert report["node_count"] > 40


def test_visual_generation_mobile_app():
    prompt = "Design a mobile banking portfolio card on 375px screen"
    doc = VisualGenerationEngine.generate(prompt)

    assert doc.metadata.platform == "mobile"
    assert doc.root.transform.width == 375
    assert doc.root.transform.height == 812
    assert len(doc.root.children) >= 3  # Topbar + Primary Card + Action Buttons
