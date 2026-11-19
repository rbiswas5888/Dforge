"""
DF-UX Intelligence - Hybrid Vector and Keyword Store
Supports fast semantic retrieval, category filtering, document indexing, and status tracking.
"""

import math
import re
from typing import List, Dict, Any, Optional


class KnowledgeVectorStore:
    def __init__(self):
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.chunks: List[Dict[str, Any]] = []

    def add_document(self, doc: Dict[str, Any], chunks: List[Dict[str, Any]]):
        self.documents[doc["id"]] = doc
        # Remove any previous chunks for this document
        self.chunks = [c for c in self.chunks if c["doc_id"] != doc["id"]]
        self.chunks.extend(chunks)

    def delete_document(self, doc_id: str) -> bool:
        if doc_id in self.documents:
            del self.documents[doc_id]
            self.chunks = [c for c in self.chunks if c["doc_id"] != doc_id]
            return True
        return False

    def list_documents(self) -> List[Dict[str, Any]]:
        return list(self.documents.values())

    def search(self, query: str, category: Optional[str] = None, top_k: int = 4) -> List[Dict[str, Any]]:
        """Hybrid keyword + term frequency scoring against chunked knowledge."""
        query_terms = [t.lower() for t in re.findall(r"\w+", query) if len(t) > 2]
        scored_results = []

        for chunk in self.chunks:
            if category and chunk["category"] != category:
                continue

            content_lower = chunk["content"].lower()
            score = 0.0

            # Match keywords
            for term in query_terms:
                if term in content_lower:
                    # Term frequency weight
                    tf = content_lower.count(term)
                    score += 1.0 + math.log(1 + tf)

            if score > 0:
                doc = self.documents.get(chunk["doc_id"], {})
                scored_results.append({
                    "chunk_id": chunk["chunk_id"],
                    "doc_id": chunk["doc_id"],
                    "doc_title": doc.get("title", "Untitled Document"),
                    "category": chunk["category"],
                    "content": chunk["content"],
                    "relevance_score": round(score, 3)
                })

        # Sort descending by relevance score
        scored_results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scored_results[:top_k]


# Global singleton instance
knowledge_store = KnowledgeVectorStore()
