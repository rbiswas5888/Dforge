"""
Model Management API Routes
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from ..model_manager.manager import model_manager
from ..models.responses import ModelInfo, ModelHealthResponse, StandardResponse
from ..models.requests import TestConnectionRequest

router = APIRouter(prefix="/models", tags=["Models"])


@router.get("", response_model=List[ModelInfo])
async def list_models():
    """List all registered models across local, private cloud, and public cloud."""
    return model_manager.list_models()


@router.get("/health", response_model=ModelHealthResponse)
async def check_models_health():
    """Check health and connectivity status of registered models."""
    models = model_manager.list_models()
    healthy = any(m.status == "connected" for m in models)
    return ModelHealthResponse(
        healthy=healthy,
        models=models,
        system_load={"cpu_usage_pct": 12.5, "memory_mb": 420}
    )


@router.post("/test", response_model=Dict[str, Any])
async def test_model_connection(req: TestConnectionRequest):
    """Test live connectivity to a specific model adapter."""
    res = await model_manager.test_connection(
        model_id=req.model_id,
        endpoint=req.endpoint,
        api_key=req.api_key
    )
    return res


@router.post("/default/{model_id}", response_model=StandardResponse)
async def set_default_model(model_id: str):
    """Change the default active model for generation tasks."""
    success = model_manager.set_default_model(model_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found")
    return StandardResponse(success=True, message=f"Default model set to {model_id}")
