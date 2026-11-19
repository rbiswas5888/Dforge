"""
Base Model Adapter Interface
Model-independent abstraction for local, private cloud, and remote inference engines.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, AsyncGenerator


class ModelAdapter(ABC):
    def __init__(self, model_id: str, provider: str, config: Optional[Dict[str, Any]] = None):
        self.model_id = model_id
        self.provider = provider
        self.config = config or {}
        self.endpoint = self.config.get("endpoint", "")
        self.api_key = self.config.get("api_key", "")

    @abstractmethod
    async def check_health(self) -> Dict[str, Any]:
        """Verify model connectivity and readiness."""
        pass

    @abstractmethod
    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> str:
        """Standard text generation."""
        pass

    @abstractmethod
    async def generate_structured(self, prompt: str, schema: Dict[str, Any], system_prompt: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Generate validated structured JSON output conforming to a schema."""
        pass

    async def stream_text(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> AsyncGenerator[str, None]:
        """Optional streaming text generation."""
        yield await self.generate_text(prompt, system_prompt=system_prompt, **kwargs)
