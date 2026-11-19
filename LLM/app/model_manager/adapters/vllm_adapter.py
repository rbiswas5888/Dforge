"""
vLLM Private Cloud Model Adapter
OpenAI-compatible inference adapter for private GPU clusters hosting Qwen3-32B, Qwen3-VL, Gemma 4, etc.
"""

import time
import json
import httpx
from typing import Dict, Any, Optional
from .base import ModelAdapter


class VLLMAdapter(ModelAdapter):
    def __init__(self, model_id: str = "Qwen/Qwen2.5-32B-Instruct", config: Optional[Dict[str, Any]] = None):
        super().__init__(model_id=model_id, provider="vllm", config=config)
        self.endpoint = self.endpoint or "http://127.0.0.1:8000/v1"

    async def check_health(self) -> Dict[str, Any]:
        start = time.time()
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.endpoint}/models")
                latency = round((time.time() - start) * 1000, 2)
                if res.status_code == 200:
                    models = [m.get("id", "") for m in res.json().get("data", [])]
                    return {
                        "status": "connected",
                        "model_id": self.model_id,
                        "provider": "vllm",
                        "latency_ms": latency,
                        "available_models": models,
                        "capabilities": ["text", "structured_json", "high_throughput"]
                    }
                return {"status": "degraded", "error": f"HTTP {res.status_code}"}
        except Exception as e:
            return {"status": "unreachable", "error": str(e), "endpoint": self.endpoint}

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(
                f"{self.endpoint}/chat/completions",
                headers=headers,
                json={
                    "model": self.model_id,
                    "messages": messages,
                    "temperature": kwargs.get("temperature", 0.2)
                }
            )
            res.raise_for_status()
            data = res.json()
            return data["choices"][0]["message"]["content"]

    async def generate_structured(self, prompt: str, schema: Dict[str, Any], system_prompt: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        sys = (system_prompt or "") + "\nRespond strictly with a JSON object conforming to the schema. Do not enclose in markdown."
        raw = await self.generate_text(prompt, system_prompt=sys, **kwargs)
        # Clean any accidental markdown backticks
        clean = raw.strip()
        if clean.startswith("```"):
            lines = clean.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            clean = "\n".join(lines).strip()
        return json.loads(clean)
