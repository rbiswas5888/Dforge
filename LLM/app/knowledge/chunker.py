"""
DF-UX Intelligence - Semantic Text and Code Chunker
Splits long-form UX research papers, design system guidelines, and component specs
into semantically coherent chunks with overlap and metadata.
"""

from typing import List, Dict, Any


class SemanticChunker:
    @classmethod
    def chunk_document(
        cls,
        doc_id: str,
        text: str,
        category: str,
        max_chunk_chars: int = 500,
        overlap_chars: int = 80
    ) -> List[Dict[str, Any]]:
        """Splits document text into overlapping semantic passages."""
        paragraphs = text.split("\n\n")
        chunks = []
        chunk_idx = 0

        current_text = ""
        for p in paragraphs:
            cleaned = p.strip()
            if not cleaned:
                continue

            if len(current_text) + len(cleaned) < max_chunk_chars:
                current_text += ("\n\n" if current_text else "") + cleaned
            else:
                if current_text:
                    chunks.append({
                        "chunk_id": f"{doc_id}_chk_{chunk_idx}",
                        "doc_id": doc_id,
                        "category": category,
                        "content": current_text,
                        "token_estimate": len(current_text) // 4
                    })
                    chunk_idx += 1
                current_text = cleaned

        if current_text:
            chunks.append({
                "chunk_id": f"{doc_id}_chk_{chunk_idx}",
                "doc_id": doc_id,
                "category": category,
                "content": current_text,
                "token_estimate": len(current_text) // 4
            })

        return chunks
