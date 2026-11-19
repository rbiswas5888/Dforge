"""
DF-UX Intelligence API Request Schemas
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from .dfir import DFIRDocument


class GenerateUIRequest(BaseModel):
    prompt: str = Field(..., min_length=2, description="Natural language prompt for UI generation")
    industry: Optional[str] = "General"
    platform: Optional[str] = "desktop"
    viewport: Optional[Dict[str, float]] = None
    design_system: Optional[str] = "default"
    model_id: Optional[str] = None
    temperature: float = 0.2
    context: Optional[Dict[str, Any]] = None


class GenerateDFIRRequest(BaseModel):
    prompt: str = Field(..., min_length=2)
    current_dfir: Optional[DFIRDocument] = None
    selection_ids: Optional[List[str]] = None
    intent: Optional[str] = None
    options: Optional[Dict[str, Any]] = None


class AnalyzeScreenshotRequest(BaseModel):
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    detect_tokens: bool = True
    generate_dfir: bool = True


class EvaluateUXRequest(BaseModel):
    dfir: DFIRDocument
    standards: List[str] = Field(default_factory=lambda: ["nielsen_norman", "wcag_2_2", "visual_hierarchy"])


class RecommendDesignSystemRequest(BaseModel):
    domain: Optional[str] = "enterprise"
    current_tokens: Optional[Dict[str, Any]] = None
    target_components: Optional[List[str]] = None


class TestConnectionRequest(BaseModel):
    model_id: str
    provider: Optional[str] = None
    endpoint: Optional[str] = None
    api_key: Optional[str] = None
