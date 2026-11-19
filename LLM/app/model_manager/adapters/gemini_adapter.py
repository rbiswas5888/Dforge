"""
Google Gemini Cloud Model Adapter
Supports Gemini 2.5 Flash, Gemini 1.5 Pro, etc.
"""

import time
import json
import httpx
from typing import Dict, Any, Optional
from .base import ModelAdapter


class GeminiAdapter(ModelAdapter):
    def __init__(self, model_id: str = "gemini-2.5-flash", config: Optional[Dict[str, Any]] = None):
        super().__init__(model_id=model_id, provider="gemini", config=config)
        self.endpoint = "https://generativelanguage.googleapis.com/v1beta"

    async def check_health(self) -> Dict[str, Any]:
        if not self.api_key:
            return {"status": "unconfigured", "error": "No API key provided", "provider": "gemini"}
        start = time.time()
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(f"{self.endpoint}/models?key={self.api_key}")
                latency = round((time.time() - start) * 1000, 2)
                if res.status_code == 200:
                    return {
                        "status": "connected",
                        "model_id": self.model_id,
                        "provider": "gemini",
                        "latency_ms": latency,
                        "capabilities": ["text", "vision", "structured_json"]
                    }
                return {"status": "unreachable", "error": f"HTTP {res.status_code}"}
        except Exception as e:
            return {"status": "unreachable", "error": str(e)}

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> str:
        if not self.api_key:
            raise ValueError("Gemini API key is missing")

        url = f"{self.endpoint}/models/{self.model_id}:generateContent?key={self.api_key}"
        contents = []
        if system_prompt:
            contents.append({"role": "user", "parts": [{"text": f"SYSTEM INSTRUCTION: {system_prompt}"}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(url, json={"contents": contents})
            res.raise_for_status()
            data = res.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    async def generate_structured(self, prompt: str, schema: Dict[str, Any], system_prompt: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        sys = (system_prompt or "") + "\nStrictly output valid JSON without markdown tags."
        raw = await self.generate_text(prompt, system_prompt=sys, **kwargs)
        clean = raw.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        return json.loads(clean.strip())
