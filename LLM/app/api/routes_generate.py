"""
UI & DFIR Generation API Routes
"""

import time
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from ..model_manager.manager import model_manager
from ..models.requests import GenerateUIRequest, GenerateDFIRRequest
from ..models.responses import GenerateUIResponse
from ..models.dfir import DFIRDocument
from ..engines.visual_generation import VisualGenerationEngine
from ..orchestration.validator import DFIRValidator
from ..orchestration.benchmark import ModelBenchmarkFramework

router = APIRouter(prefix="", tags=["Generation & Benchmarks"])


@router.get("/benchmarks", response_model=Dict[str, Any])
async def get_benchmarks():
    """Run and return multi-metric evaluation benchmark results across acceptance criteria."""
    return ModelBenchmarkFramework.run_benchmark_suite()


@router.post("/generate/dfir", response_model=GenerateUIResponse)
async def generate_dfir(req: GenerateDFIRRequest):
    """Generate or update structured DFIR design document from a natural language prompt."""
    start_time = time.time()
    adapter = model_manager.get_adapter()

    try:
        # 1. Synthesize rich domain-specific DFIR tree
        generated_doc = VisualGenerationEngine.generate(req.prompt, req.options)

        # 2. Validate and auto-heal with DFIRValidator
        validated_doc, validation_report = DFIRValidator.validate_and_repair(generated_doc.model_dump())
        latency = round((time.time() - start_time) * 1000, 2)

        return GenerateUIResponse(
            success=True,
            dfir=validated_doc,
            reasoning={
                "intent": req.intent or "create_interface",
                "model_used": adapter.model_id,
                "provider": adapter.provider,
                "node_count": validation_report["node_count"],
                "tokens_resolved": len(validated_doc.tokens.colors)
            },
            validation=validation_report,
            latency_ms=latency
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.post("/generate/ui", response_model=GenerateUIResponse)
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
