"""
DF-UX Intelligence - Specialized UX Knowledge Retrieval Engine (RAG)
Coordinates document ingestion, chunking, indexing, and context assembly for AI generation.
"""

from typing import Dict, Any, List, Optional
from .categories import UX_CATEGORIES, SEED_DOCUMENTS
from .chunker import SemanticChunker
from .store import knowledge_store


class RAGEngine:
    def __init__(self):
        self._seed_initial_knowledge()

    def _seed_initial_knowledge(self):
        """Indexes initial seed documents across canonical UX domains."""
        for doc in SEED_DOCUMENTS:
            self.ingest_document(
                doc_id=doc["id"],
                title=doc["title"],
                category=doc["category"],
                content=doc["content"],
                source=doc["source"],
                licence=doc["licence"],
                version=doc["version"]
            )

    def ingest_document(
        self,
        doc_id: str,
        title: str,
        category: str,
        content: str,
        source: str = "Manual Upload",
        licence: str = "Internal",
        version: str = "1.0"
    ) -> Dict[str, Any]:
        """Ingests, chunks, and indexes a source document."""
        chunks = SemanticChunker.chunk_document(doc_id, content, category)
        doc_record = {
            "id": doc_id,
            "title": title,
            "category": category,
            "source": source,
            "licence": licence,
            "version": version,
            "chunk_count": len(chunks),
            "status": "indexed"
        }
        knowledge_store.add_document(doc_record, chunks)
        return doc_record

    def retrieve_context(self, prompt: str, category: Optional[str] = None, top_k: int = 3) -> List[Dict[str, Any]]:
        """Retrieves most relevant UX principles and guidelines for a given prompt."""
        return knowledge_store.search(prompt, category=category, top_k=top_k)

    def list_categories(self) -> List[Dict[str, Any]]:
        return UX_CATEGORIES

    def list_documents(self) -> List[Dict[str, Any]]:
        return knowledge_store.list_documents()


# Global Singleton Instance
rag_engine = RAGEngine()
