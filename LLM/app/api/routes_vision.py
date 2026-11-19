"""
Screenshot Vision Analysis API Routes
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..engines.vision_analysis import VisionAnalysisEngine
from ..models.requests import AnalyzeScreenshotRequest

router = APIRouter(prefix="/analyze", tags=["Vision Analysis"])


@router.post("/screenshot", response_model=Dict[str, Any])
async def analyze_screenshot(req: AnalyzeScreenshotRequest):
    """
    Analyze uploaded screenshot image, extract design tokens, detect UI components,
    and reconstruct an editable DFIR design hierarchy.
    """
    try:
        result = VisionAnalysisEngine.analyze_screenshot(
            image_base64=req.image_base64,
            image_url=req.image_url
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Screenshot analysis failed: {str(e)}")
