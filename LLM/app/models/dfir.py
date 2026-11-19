"""
DesignForge Intermediate Representation (DFIR) - Pydantic v2 Data Models
Strict, model-independent validation and serialization for UI design trees.
"""

from __future__ import annotations
from typing import List, Dict, Optional, Any, Union, Literal
from pydantic import BaseModel, Field, ConfigDict, model_validator
import uuid


def generate_node_id(prefix: str = "node") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


class DFIRViewport(BaseModel):
    model_config = ConfigDict(extra="allow")
    width: float = Field(default=1440.0, ge=1.0)
    height: float = Field(default=900.0, ge=1.0)


class DFIRMetadata(BaseModel):
    model_config = ConfigDict(extra="allow")
    title: str = Field(..., description="Document or screen title")
    description: Optional[str] = None
    domain: Optional[str] = "General"
    industry: Optional[str] = "Technology"
    platform: Literal["desktop", "tablet", "mobile", "responsive", "universal"] = "desktop"
    viewport: DFIRViewport = Field(default_factory=DFIRViewport)
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    author: Optional[str] = "DF-UX Intelligence"
    tags: List[str] = Field(default_factory=list)


class DFIRTokens(BaseModel):
    model_config = ConfigDict(extra="allow")
    colors: Dict[str, str] = Field(default_factory=dict)
    typography: Dict[str, Any] = Field(default_factory=dict)
    spacing: Dict[str, float] = Field(default_factory=dict)
    radii: Dict[str, float] = Field(default_factory=dict)
    shadows: Dict[str, str] = Field(default_factory=dict)


class DFIRTransform(BaseModel):
    model_config = ConfigDict(extra="allow")
    x: float = 0.0
    y: float = 0.0
    width: float = Field(default=100.0, ge=0.0)
    height: float = Field(default=100.0, ge=0.0)
    rotation: float = 0.0
    scaleX: float = 1.0
    scaleY: float = 1.0


class DFIRLayout(BaseModel):
    model_config = ConfigDict(extra="allow")
    mode: Literal["none", "stack-horizontal", "stack-vertical", "grid", "absolute"] = "none"
    wrap: Literal["no_wrap", "wrap"] = "no_wrap"
    gap: float = 0.0
    paddingTop: float = 0.0
    paddingRight: float = 0.0
    paddingBottom: float = 0.0
    paddingLeft: float = 0.0
    alignItems: Literal["start", "center", "end", "stretch"] = "start"
    justifyContent: Literal["start", "center", "end", "space-between", "space-around"] = "start"
    sizingHorizontal: Literal["fixed", "hug", "fill"] = "fixed"
    sizingVertical: Literal["fixed", "hug", "fill"] = "fixed"
    gridColumns: Optional[int] = None
    gridRows: Optional[int] = None


class DFIROpacityStop(BaseModel):
    offset: float
    color: str


class DFIRFill(BaseModel):
    model_config = ConfigDict(extra="allow")
    type: Literal["solid", "gradient-linear", "gradient-radial", "image"] = "solid"
    color: Optional[str] = "#334155"
    opacity: float = Field(default=1.0, ge=0.0, le=1.0)
    stops: Optional[List[DFIROpacityStop]] = None
    assetUrl: Optional[str] = None


class DFIRStroke(BaseModel):
    model_config = ConfigDict(extra="allow")
    color: str = "#1E293B"
    width: float = Field(default=1.0, ge=0.0)
    align: Literal["inside", "center", "outside"] = "inside"
    style: Literal["solid", "dashed", "dotted"] = "solid"


class DFIRShadow(BaseModel):
    model_config = ConfigDict(extra="allow")
    x: float = 0.0
    y: float = 4.0
    blur: float = 8.0
    spread: float = 0.0
    color: str = "rgba(0,0,0,0.25)"
    inner: bool = False


class DFIRStyle(BaseModel):
    model_config = ConfigDict(extra="allow")
    fills: List[DFIRFill] = Field(default_factory=list)
    strokes: List[DFIRStroke] = Field(default_factory=list)
    cornerRadius: float = 0.0
    cornerRadii: Optional[List[float]] = None
    shadows: List[DFIRShadow] = Field(default_factory=list)


class DFIRText(BaseModel):
    model_config = ConfigDict(extra="allow")
    content: str = ""
    fontFamily: str = "Inter"
    fontSize: float = 14.0
    fontWeight: str = "400"
    lineHeight: Optional[Union[float, str]] = None
    letterSpacing: float = 0.0
    textAlign: Literal["left", "center", "right", "justify"] = "left"
    color: Optional[str] = "#F8FAFC"


class DFIRVector(BaseModel):
    model_config = ConfigDict(extra="allow")
    pathData: str = ""
    fillRule: Literal["nonzero", "evenodd"] = "nonzero"


class DFIRAccessibility(BaseModel):
    model_config = ConfigDict(extra="allow")
    role: Optional[str] = None
    ariaLabel: Optional[str] = None
    semanticTag: Optional[str] = None
    tabIndex: Optional[int] = None


class DFIRTransition(BaseModel):
    type: Literal["instant", "dissolve", "slide", "smartAnimate"] = "instant"
    duration: float = 300.0
    easing: str = "ease-out"


class DFIRInteraction(BaseModel):
    model_config = ConfigDict(extra="allow")
    trigger: Literal["onClick", "onHover", "onPress", "onDrag", "afterDelay"] = "onClick"
    action: Literal["navigate", "openOverlay", "closeOverlay", "toggleState"] = "navigate"
    targetId: Optional[str] = None
    transition: Optional[DFIRTransition] = None


NodeType = Literal[
    "frame",
    "group",
    "rectangle",
    "ellipse",
    "text",
    "vector",
    "image",
    "component",
    "instance"
]


class DFIRNode(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str = Field(default_factory=lambda: generate_node_id("node"))
    type: NodeType = "frame"
    name: str = "Untitled Node"
    visible: bool = True
    locked: bool = False
    opacity: float = Field(default=1.0, ge=0.0, le=1.0)
    componentId: Optional[str] = None
    variantProperties: Optional[Dict[str, str]] = None
    tokenBindings: Dict[str, str] = Field(default_factory=dict)
    transform: DFIRTransform = Field(default_factory=DFIRTransform)
    layout: DFIRLayout = Field(default_factory=DFIRLayout)
    style: DFIRStyle = Field(default_factory=DFIRStyle)
    text: Optional[DFIRText] = None
    vector: Optional[DFIRVector] = None
    accessibility: Optional[DFIRAccessibility] = None
    interactions: List[DFIRInteraction] = Field(default_factory=list)
    children: List[DFIRNode] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_type_specific_requirements(self) -> DFIRNode:
        if self.type == "text" and not self.text:
            self.text = DFIRText(content=self.name)
        return self


class DFIRUXRationale(BaseModel):
    model_config = ConfigDict(extra="allow")
    userGoals: List[str] = Field(default_factory=list)
    informationArchitecture: Optional[str] = None
    heuristicsApplied: List[str] = Field(default_factory=list)
    accessibilityNotes: Optional[str] = None
    designSystemRationale: Optional[str] = None


class DFIRDocument(BaseModel):
    model_config = ConfigDict(extra="allow")
    schema_url: Optional[str] = Field(default="https://designforge.ai/schemas/dfir-v1.json", alias="$schema")
    version: str = "1.0.0"
    metadata: DFIRMetadata
    tokens: DFIRTokens = Field(default_factory=DFIRTokens)
    root: DFIRNode
    uxRationale: Optional[DFIRUXRationale] = None
