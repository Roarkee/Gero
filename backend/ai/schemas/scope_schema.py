from typing import List, Optional
from pydantic import BaseModel, Field


class FeatureEstimate(BaseModel):
    feature_name: str
    estimated_hours: float
    complexity: str
    risk_level: str
    implementation_notes: Optional[str] = None


class PhaseBreakdown(BaseModel):
    planning: float = 0
    backend: float = 0
    frontend: float = 0
    uiux: float = 0
    testing: float = 0
    deployment: float = 0
    buffer: float = 0


class ScopeAnalysis(BaseModel):
    estimated_total_hours: float
    phase_breakdown: PhaseBreakdown
    feature_breakdown: List[FeatureEstimate] = Field(default_factory=list)
    recommended_team: List[str] = Field(default_factory=list)
    technical_risks: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)
    delivery_confidence: float
    assumptions: List[str] = Field(default_factory=list)