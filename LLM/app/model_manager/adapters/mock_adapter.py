"""
Deterministic Mock / Heuristic Model Adapter
Provides predictable, zero-latency synthetic outputs for testing and offline fallback.
"""

import json
from typing import Dict, Any, Optional
from .base import ModelAdapter


class MockAdapter(ModelAdapter):
    def __init__(self, model_id: str = "mock-synth-v1", config: Optional[Dict[str, Any]] = None):
        super().__init__(model_id=model_id, provider="local_mock", config=config)

    async def check_health(self) -> Dict[str, Any]:
        return {
            "status": "connected",
            "model_id": self.model_id,
            "provider": self.provider,
            "latency_ms": 1.2,
            "capabilities": ["text", "structured_dfir", "heuristics"]
        }

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> str:
        return f"[Mock Reasoning Response for: {prompt[:40]}...] Successfully evaluated design intent."

    async def generate_structured(self, prompt: str, schema: Dict[str, Any], system_prompt: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        # Synthesize a minimal valid DFIR structure
        return {
            "$schema": "https://designforge.ai/schemas/dfir-v1.json",
            "version": "1.0.0",
            "metadata": {
                "title": f"Generated: {prompt[:30]}",
                "description": "Deterministic mock synthesis",
                "domain": "Enterprise",
                "platform": "desktop",
                "viewport": {"width": 1440, "height": 900}
            },
            "tokens": {
                "colors": {
                    "brand_primary": "#2563EB",
                    "surface": "#1E293B",
                    "text_primary": "#F8FAFC"
                }
            },
            "root": {
                "id": "frame_synth_root",
                "type": "frame",
                "name": "Synthesized Artboard",
                "transform": {"x": 0, "y": 0, "width": 1440, "height": 900},
                "layout": {"mode": "stack-vertical", "gap": 16, "paddingTop": 24, "paddingLeft": 24},
                "style": {"fills": [{"type": "solid", "color": "#0F172A"}]},
                "children": [
                    {
                        "id": "text_synth_title",
                        "type": "text",
                        "name": "Screen Title",
                        "transform": {"x": 0, "y": 0, "width": 600, "height": 32},
                        "text": {"content": "Synthesized Dashboard View", "fontSize": 22, "fontWeight": "700", "color": "#F8FAFC"}
                    }
                ]
            },
            "uxRationale": {
                "userGoals": ["Rapid visual prototyping"],
                "informationArchitecture": "Single stack layout",
                "heuristicsApplied": ["Visibility of system status"]
            }
        }
