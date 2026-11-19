"""
DF-UX Intelligence API Response Schemas
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from .dfir import DFIRDocument


class StandardResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None
    error: Optional[str] = None


class GenerateUIResponse(BaseModel):
    success: bool = True
    job_id: Optional[str] = None
    dfir: Optional[DFIRDocument] = None
    reasoning: Optional[Dict[str, Any]] = None
    validation: Optional[Dict[str, Any]] = None
    latency_ms: Optional[float] = None


class ModelInfo(BaseModel):
    id: str
    name: str
    version: str
    model_type: str  # visual, reasoning, code, multimodal, image
    provider: str    # ollama, vllm, openai, gemini, local
    deployment: str  # local, private_cloud, public_cloud
    status: str      # connected, unreachable, ready, degraded
    capabilities: List[str]
    context_length: int
    is_default: bool = False


class ModelHealthResponse(BaseModel):
    healthy: bool
    models: List[ModelInfo]
    system_load: Optional[Dict[str, Any]] = None
