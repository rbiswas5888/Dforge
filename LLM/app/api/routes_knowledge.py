"""
Knowledge Base and RAG API Routes
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from ..knowledge.rag_engine import rag_engine

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base & RAG"])


class IngestDocumentRequest(BaseModel):
    id: str
    title: str
    category: str
    content: str
    source: Optional[str] = "Manual Upload"
    licence: Optional[str] = "Internal"
    version: Optional[str] = "1.0"


@router.get("/categories")
async def list_knowledge_categories():
    """List all 21 canonical UX knowledge domains."""
    return rag_engine.list_categories()


@router.get("/documents")
async def list_indexed_documents():
    """List all documents currently indexed in the UX knowledge base."""
    return rag_engine.list_documents()


@router.post("/ingest")
async def ingest_document(req: IngestDocumentRequest):
    """Ingest, semantically chunk, and index a new UX knowledge document."""
    try:
        res = rag_engine.ingest_document(
            doc_id=req.id,
            title=req.title,
            category=req.category,
            content=req.content,
            source=req.source,
            licence=req.licence,
            version=req.version
        )
        return {"success": True, "document": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@router.get("/search")
async def search_knowledge(q: str = Query(..., min_length=2), category: Optional[str] = None):
    """Semantic hybrid search across indexed UX knowledge."""
    results = rag_engine.retrieve_context(q, category=category, top_k=5)
    return {"query": q, "results_count": len(results), "results": results}
