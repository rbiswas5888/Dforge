"""
Ollama Local Model Adapter
Supports local models: llama3.1, qwen2.5, deepseek, mistral, etc.
"""

import time
import json
import httpx
from typing import Dict, Any, Optional
from .base import ModelAdapter


class OllamaAdapter(ModelAdapter):
    def __init__(self, model_id: str = "llama3.1", config: Optional[Dict[str, Any]] = None):
        super().__init__(model_id=model_id, provider="ollama", config=config)
        self.endpoint = self.endpoint or "http://127.0.0.1:11434"

    async def check_health(self) -> Dict[str, Any]:
        start = time.time()
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.endpoint}/api/tags")
                latency = round((time.time() - start) * 1000, 2)
                if res.status_code == 200:
                    models = [m.get("name", "") for m in res.json().get("models", [])]
                    is_available = any(self.model_id in m for m in models)
                    return {
                        "status": "connected" if is_available else "ready",
                        "model_id": self.model_id,
                        "provider": "ollama",
                        "latency_ms": latency,
                        "available_models": models,
                        "capabilities": ["text", "json_format"]
                    }
                return {"status": "degraded", "error": f"HTTP {res.status_code}"}
        except Exception as e:
            return {"status": "unreachable", "error": str(e), "endpoint": self.endpoint}

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            payload = {
                "model": self.model_id,
                "prompt": prompt,
                "system": system_prompt or "",
                "stream": False,
                "options": {
                    "temperature": kwargs.get("temperature", 0.2)
                }
            }
            res = await client.post(f"{self.endpoint}/api/generate", json=payload)
            res.raise_for_status()
            return res.json().get("response", "")

    async def generate_structured(self, prompt: str, schema: Dict[str, Any], system_prompt: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=90.0) as client:
            augmented_system = (system_prompt or "") + "\nYou MUST output valid JSON conforming strictly to the requested schema. Do not output markdown codeblocks or explanation."
            payload = {
                "model": self.model_id,
                "prompt": prompt,
                "system": augmented_system,
                "format": "json",
                "stream": False,
                "options": {
                    "temperature": kwargs.get("temperature", 0.1)
                }
            }
            res = await client.post(f"{self.endpoint}/api/generate", json=payload)
            res.raise_for_status()
            text = res.json().get("response", "{}")
            return json.loads(text)
