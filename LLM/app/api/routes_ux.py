"""
UX Intelligence, Evaluation, Accessibility, Prototyping & Code API Routes
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..models.requests import EvaluateUXRequest, RecommendDesignSystemRequest
from ..models.dfir import DFIRDocument
from ..engines.ux_reasoning import UXReasoningEngine
from ..engines.accessibility import AccessibilityEngine
from ..engines.design_system import DesignSystemEngine
from ..engines.prototyping import PrototypingEngine
from ..engines.code_compiler import CodeCompilerEngine

router = APIRouter(prefix="", tags=["UX Intelligence"])


@router.post("/evaluate/ux", response_model=Dict[str, Any])
async def evaluate_ux(req: EvaluateUXRequest):
    """Run comprehensive UX reasoning, usability heuristics, and accessibility audits."""
    try:
        ux_eval = UXReasoningEngine.evaluate(req.dfir)
        a11y_eval = AccessibilityEngine.audit(req.dfir)
        return {
            "success": True,
            "overall_ux_score": ux_eval["overall_ux_score"],
            "grade": ux_eval["grade"],
            "heuristics": ux_eval["heuristics"],
            "accessibility": a11y_eval,
            "information_architecture": ux_eval["information_architecture"],
            "findings": ux_eval["findings"],
            "recommendations": ux_eval["recommendations"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"UX evaluation failed: {str(e)}")


@router.post("/design-system/recommend", response_model=Dict[str, Any])
async def recommend_design_system(doc: DFIRDocument):
    """Audit token consistency and recommend components from DesignForge component registries."""
    try:
        return DesignSystemEngine.audit_and_recommend(doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Design system recommendation failed: {str(e)}")


@router.post("/prototype/generate", response_model=Dict[str, Any])
async def generate_prototype(doc: DFIRDocument):
    """Generate interactive prototype flows, transitions, and click connections."""
    try:
        return PrototypingEngine.generate_interactions(doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prototyping generation failed: {str(e)}")


@router.post("/code/compile", response_model=Dict[str, Any])
async def compile_code(doc: DFIRDocument):
    """Compile validated DFIR into modular React 19 and TypeScript (.tsx) components."""
    try:
        return CodeCompilerEngine.compile_to_react(doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code compilation failed: {str(e)}")
