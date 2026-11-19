"""
DF-UX Intelligence Backend Configuration
"""

import os
from pydantic import BaseModel, Field


class Settings(BaseModel):
    app_name: str = "DF-UX Intelligence"
    app_version: str = "1.0.0"
    api_prefix: str = "/api/v1"
    host: str = os.getenv("DFUX_HOST", "127.0.0.1")
    port: int = int(os.getenv("DFUX_PORT", "8000"))
    debug: bool = os.getenv("DFUX_DEBUG", "True").lower() in ("true", "1")

    # Storage Paths
    base_dir: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    schema_dir: str = os.path.join(base_dir, "schema")
    datasets_dir: str = os.path.join(base_dir, "knowledge", "datasets")


settings = Settings()
