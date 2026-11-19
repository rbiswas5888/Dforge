"""
DF-UX Intelligence - FastAPI Main Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api.routes_models import router as models_router
from .api.routes_generate import router as generate_router

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="DesignForge AI Native UX Intelligence Module - Model-Independent Design Engine",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under /api/v1
app.include_router(models_router, prefix=settings.api_prefix)
app.include_router(generate_router, prefix=settings.api_prefix)


@app.get("/")
async def root():
    return {
        "module": "DF-UX Intelligence",
        "status": "online",
        "version": settings.app_version,
        "docs": "/docs",
        "api_v1": settings.api_prefix
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "dfux-intelligence-backend"}
