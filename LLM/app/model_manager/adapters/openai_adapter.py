"""
OpenAI & Compatible Cloud Model Adapter
Supports GPT-4o, o3-mini, o1, etc.
"""

import time
import json
import httpx
from typing import Dict, Any, Optional
from .base import ModelAdapter


class OpenAIAdapter(ModelAdapter):
    def __init__(self, model_id: str = "gpt-4o", config: Optional[Dict[str, Any]] = None):
        super().__init__(model_id=model_id, provider="openai", config=config)
        self.endpoint = self.endpoint or "https://api.openai.com/v1"

    async def check_health(self) -> Dict[str, Any]:
        if not self.api_key:
            return {"status": "unconfigured", "error": "No API key provided", "provider": "openai"}
        start = time.time()
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(
                    f"{self.endpoint}/models",
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
                latency = round((time.time() - start) * 1000, 2)
                if res.status_code == 200:
                    return {
                        "status": "connected",
                        "model_id": self.model_id,
                        "provider": "openai",
                        "latency_ms": latency,
                        "capabilities": ["text", "vision", "structured_json"]
                    }
                return {"status": "unreachable", "error": f"HTTP {res.status_code}"}
        except Exception as e:
            return {"status": "unreachable", "error": str(e)}

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> str:
        if not self.api_key:
            raise ValueError("OpenAI API key is missing")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(
                f"{self.endpoint}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model_id,
                    "messages": messages,
                    "temperature": kwargs.get("temperature", 0.2)
                }
            )
            res.raise_for_status()
            return res.json()["choices"][0]["message"]["content"]

    async def generate_structured(self, prompt: str, schema: Dict[str, Any], system_prompt: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        sys = (system_prompt or "") + "\nOutput strictly valid JSON matching the schema."
        raw = await self.generate_text(prompt, system_prompt=sys, **kwargs)
        clean = raw.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        return json.loads(clean.strip())
