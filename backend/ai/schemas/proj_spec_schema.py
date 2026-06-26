from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class ComplexityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class UrgencyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class PriorityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"



class FeatureSchema(BaseModel):
    name: str
    description: Optional[str] = None
    ai_complexity: ComplexityLevel
    priority: Optional[PriorityLevel] = None
    ai_estimated_hours: Optional[float] = Field(default=None, ge=0)
    dependencies: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)



class ClientInfoSchema(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    country: Optional[str] = None


class ExtractionMetadata(BaseModel):
    confidence_score: float = Field(ge=0.0, le=1.0)
    missing_information: List[str] = Field(default_factory=list)
    assumptions_made: List[str] = Field(default_factory=list)


class CommercialTerms(BaseModel):
    payment_terms: Optional[str] = None
    warranty_period_days: Optional[int] = Field(default=None, ge=0)
    maintenance_period_days: Optional[int] = Field(default=None, ge=0)
    intellectual_property_owner: Optional[str] = None



class ProjectSpecification(BaseModel):
    project_type: str
    industry: Optional[str] = None
    client: Optional[ClientInfoSchema] = None
    features: List[FeatureSchema] = Field(default_factory=list)
    deliverables: List[str] = Field(default_factory=list)
    technical_requirements: List[str] = Field(default_factory=list)
    integrations: List[str] = Field(default_factory=list)
    platforms: List[str] = Field(default_factory=list)
    timeline_weeks: Optional[int] = Field(default=None, ge=1)
    budget: Optional[float] = Field(default=None, ge=0)
    currency: Optional[str] = None
    urgency: UrgencyLevel
    complexity_score: Optional[int] = Field(default=None, ge=1, le=100)
    metadata: Optional[ExtractionMetadata] = None
    commercial_terms: Optional[CommercialTerms] = None
