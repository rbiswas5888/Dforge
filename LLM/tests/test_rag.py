"""
Knowledge Base and RAG Engine Tests
"""

import pytest
from starlette.testclient import TestClient
from app.main import app
from app.knowledge.rag_engine import rag_engine

client = TestClient(app)


def test_21_canonical_ux_categories_seeded():
    categories = rag_engine.list_categories()
    assert len(categories) == 21
    cat_ids = [c["id"] for c in categories]
    assert "ux_fundamentals" in cat_ids
    assert "gestalt_principles" in cat_ids
    assert "accessibility" in cat_ids
    assert "fintech_ux" in cat_ids
    assert "react_frontend_architecture" in cat_ids


def test_rag_semantic_search():
    results = rag_engine.retrieve_context("color contrast ratio WCAG guidelines")
    assert len(results) > 0
    top = results[0]
    assert "WCAG" in top["content"] or "contrast" in top["content"].lower()
    assert top["relevance_score"] > 0


def test_knowledge_ingestion():
    res = rag_engine.ingest_document(
        doc_id="test_doc_01",
        title="Micro-interactions and Haptic Feedback",
        category="interaction_design",
        content="Haptic feedback in mobile navigation buttons provides tactile confirmation to the user, reducing duplicate clicks by 34%."
    )
    assert res["status"] == "indexed"
    assert res["chunk_count"] >= 1

    # Search for newly ingested document
    search_res = rag_engine.retrieve_context("tactile confirmation haptic feedback")
    assert any("haptic" in r["content"].lower() for r in search_res)


def test_knowledge_api_routes():
    res_cats = client.get("/api/v1/knowledge/categories")
    assert res_cats.status_code == 200
    assert len(res_cats.json()) == 21

    res_docs = client.get("/api/v1/knowledge/documents")
    assert res_docs.status_code == 200
    assert len(res_docs.json()) >= 5

    res_search = client.get("/api/v1/knowledge/search?q=fintech+numbers")
    assert res_search.status_code == 200
    assert res_search.json()["results_count"] > 0
