"""
UI & DFIR Generation API Routes
"""

import time
from fastapi import APIRouter, HTTPException
from ..model_manager.manager import model_manager
from ..models.requests import GenerateUIRequest, GenerateDFIRRequest
from ..models.responses import GenerateUIResponse
from ..models.dfir import DFIRDocument

router = APIRouter(prefix="/generate", tags=["Generation"])


@router.post("/dfir", response_model=GenerateUIResponse)
async def generate_dfir(req: GenerateDFIRRequest):
    """Generate or update structured DFIR design document from a natural language prompt."""
    start_time = time.time()
    adapter = model_manager.get_adapter()

    try:
        raw_dfir = await adapter.generate_structured(
            prompt=req.prompt,
            schema={},
            system_prompt="You are DF-UX Intelligence, an expert UX/UI system generating canonical DFIR documents."
        )

        # Validate with Pydantic v2
        validated_doc = DFIRDocument.model_validate(raw_dfir)
        latency = round((time.time() - start_time) * 1000, 2)

        return GenerateUIResponse(
            success=True,
            dfir=validated_doc,
            reasoning={
                "intent": req.intent or "create_interface",
                "model_used": adapter.model_id,
                "provider": adapter.provider,
                "tokens_resolved": len(validated_doc.tokens.colors)
            },
            validation={"passed": True, "schema_version": validated_doc.version},
            latency_ms=latency
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.post("/ui", response_model=GenerateUIResponse)
async def generate_ui(req: GenerateUIRequest):
    """High-level natural language prompt to UI generation endpoint."""
    dfir_req = GenerateDFIRRequest(
        prompt=req.prompt,
        intent="text_to_ui",
        options={
            "industry": req.industry,
            "platform": req.platform,
            "design_system": req.design_system,
            "temperature": req.temperature
        }
    )
    return await generate_dfir(dfir_req)
