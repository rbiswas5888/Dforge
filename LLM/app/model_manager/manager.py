"""
Unified Model Manager for DF-UX Intelligence
Orchestrates model registries, adapters, health checks, connection testing, and routing.
"""

from typing import Dict, List, Optional, Any
from .adapters.base import ModelAdapter
from .adapters.mock_adapter import MockAdapter
from .adapters.local_ollama import OllamaAdapter
from .adapters.vllm_adapter import VLLMAdapter
from .adapters.openai_adapter import OpenAIAdapter
from .adapters.gemini_adapter import GeminiAdapter
from ..models.responses import ModelInfo


class ModelManager:
    def __init__(self):
        self.adapters: Dict[str, ModelAdapter] = {}
        self.metadata: Dict[str, ModelInfo] = {}
        self.default_model_id: str = "mock-synth-v1"
        self._initialize_registry()

    def _initialize_registry(self):
        # 1. Deterministic Local Synth (Always Available Offline Fallback)
        self.register_model(
            ModelInfo(
                id="mock-synth-v1",
                name="DF-UX Local Synth Engine",
                version="1.0.0",
                model_type="reasoning",
                provider="local",
                deployment="local",
                status="connected",
                capabilities=["text", "structured_dfir", "heuristics"],
                context_length=8192,
                is_default=True
            ),
            MockAdapter(model_id="mock-synth-v1")
        )

        # 2. Local Ollama - Llama 3.1
        self.register_model(
            ModelInfo(
                id="llama3.1",
                name="Llama 3.1 (Ollama Local)",
                version="8B-Instruct",
                model_type="reasoning",
                provider="ollama",
                deployment="local",
                status="ready",
                capabilities=["text", "structured_dfir", "fast_edit"],
                context_length=128000,
                is_default=False
            ),
            OllamaAdapter(model_id="llama3.1")
        )

        # 3. Candidate 1: Qwen3-VL-8B-Instruct (Visual understanding)
        self.register_model(
            ModelInfo(
                id="qwen3-vl-8b",
                name="Qwen3-VL-8B-Instruct",
                version="8B",
                model_type="visual",
                provider="vllm",
                deployment="private_cloud",
                status="ready",
                capabilities=["vision", "screenshot_analysis", "bounding_box"],
                context_length=32768,
                is_default=False
            ),
            VLLMAdapter(model_id="Qwen/Qwen3-VL-8B-Instruct")
        )

        # 4. Candidate 2: Gemma 4 12B (Multimodal & Reasoning evaluation)
        self.register_model(
            ModelInfo(
                id="gemma-4-12b",
                name="Gemma 4 12B",
                version="12B",
                model_type="multimodal",
                provider="vllm",
                deployment="private_cloud",
                status="ready",
                capabilities=["multimodal", "ux_heuristics", "evaluation"],
                context_length=32768,
                is_default=False
            ),
            VLLMAdapter(model_id="google/gemma-4-12b-it")
        )

        # 5. Candidate 3: Qwen3-32B (Structured reasoning & Code generation)
        self.register_model(
            ModelInfo(
                id="qwen3-32b",
                name="Qwen3-32B-Instruct",
                version="32B",
                model_type="code",
                provider="vllm",
                deployment="private_cloud",
                status="ready",
                capabilities=["complex_layout", "dfir_synthesis", "react_codegen"],
                context_length=65536,
                is_default=False
            ),
            VLLMAdapter(model_id="Qwen/Qwen3-32B-Instruct")
        )

        # 6. Candidate 4: FLUX.2 Klein 4B (Visual asset generation)
        self.register_model(
            ModelInfo(
                id="flux-2-klein-4b",
                name="FLUX.2 Klein 4B",
                version="4B",
                model_type="image",
                provider="vllm",
                deployment="private_cloud",
                status="ready",
                capabilities=["asset_generation", "illustrations", "icons"],
                context_length=4096,
                is_default=False
            ),
            VLLMAdapter(model_id="black-forest-labs/FLUX.2-klein-4b")
        )

        # 7. Cloud Gateway: OpenAI GPT-4o
        self.register_model(
            ModelInfo(
                id="gpt-4o",
                name="OpenAI GPT-4o",
                version="2024-11",
                model_type="multimodal",
                provider="openai",
                deployment="public_cloud",
                status="ready",
                capabilities=["vision", "reasoning", "dfir_synthesis", "wcag_audit"],
                context_length=128000,
                is_default=False
            ),
            OpenAIAdapter(model_id="gpt-4o")
        )

        # 8. Cloud Gateway: Google Gemini 2.5 Flash
        self.register_model(
            ModelInfo(
                id="gemini-2.5-flash",
                name="Google Gemini 2.5 Flash",
                version="2.5",
                model_type="multimodal",
                provider="gemini",
                deployment="public_cloud",
                status="ready",
                capabilities=["vision", "fast_reasoning", "dfir_synthesis"],
                context_length=1000000,
                is_default=False
            ),
            GeminiAdapter(model_id="gemini-2.5-flash")
        )

    def register_model(self, info: ModelInfo, adapter: ModelAdapter):
        self.metadata[info.id] = info
        self.adapters[info.id] = adapter

    def get_model_info(self, model_id: str) -> Optional[ModelInfo]:
        return self.metadata.get(model_id)

    def list_models(self) -> List[ModelInfo]:
        return list(self.metadata.values())

    def get_adapter(self, model_id: Optional[str] = None) -> ModelAdapter:
        target_id = model_id or self.default_model_id
        if target_id not in self.adapters:
            # Fallback to default
            return self.adapters[self.default_model_id]
        return self.adapters[target_id]

    def set_default_model(self, model_id: str) -> bool:
        if model_id in self.metadata:
            for k in self.metadata:
                self.metadata[k].is_default = (k == model_id)
            self.default_model_id = model_id
            return True
        return False

    async def test_connection(self, model_id: str, endpoint: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
        if model_id not in self.adapters:
            return {"status": "error", "error": f"Model '{model_id}' is not registered"}

        adapter = self.adapters[model_id]
        if endpoint:
            adapter.endpoint = endpoint
        if api_key:
            adapter.api_key = api_key

        health = await adapter.check_health()
        if health.get("status") == "connected":
            self.metadata[model_id].status = "connected"
        elif health.get("status") == "unreachable":
            self.metadata[model_id].status = "unreachable"
        return health


# Global Singleton Instance
model_manager = ModelManager()
