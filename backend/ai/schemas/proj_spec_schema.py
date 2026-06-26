from typing import List, Optional
from pydantic import BaseModel

class FeatureSchema(BaseModel):
    name: str
    description: Optional[str] = None
    ai_complexity: str
    priority: Optional[str] = None
    ai_estimated_hours: Optional[float] = None
    dependencies: List[str] = []
    assumptions: List[str] = []


class ClientInfoSchema(BaseModel):
    name: Optional[str]
    company: Optional[str]
    email: Optional[str]
    country: Optional[str]


class ExtractionMetadata(BaseModel):
    confidence_score: float
    missing_information: List[str]
    assumptions_made: List[str]

class CommercialTerms(BaseModel):
    payment_terms: Optional[str]
    warranty_period_days: Optional[int]
    maintenance_period_days: Optional[int]
    intellectual_property_owner: Optional[str]

class ProjectSpecification(BaseModel):
    project_type: str
    industry: Optional[str] = None
    client: Optional[ClientInfoSchema] = None
    features: List[FeatureSchema] = []
    deliverables: List[str] = []
    technical_requirements: List[str] = []
    integrations: List[str] = []
    platforms: List[str] = []
    timeline_weeks: Optional[int] = None
    budget: Optional[float] = None
    currency: Optional[str] = None
    urgency: str
    complexity_score: Optional[int] = None
    metadata: Optional[ExtractionMetadata] = None
    commercial_terms: Optional[CommercialTerms]

