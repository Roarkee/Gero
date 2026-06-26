from typing import List, Optional
from pydantic import BaseModel, Field

class MilestoneSchema(BaseModel):
    title: str
    description: str
    amount: str

class PricingBreakdownSchema(BaseModel):
    base_cost: str
    complexity_adjustment: str
    urgency_adjustment: str
    total_investment: str

class ProposalOutput(BaseModel):
    title: str
    project_summary: str
    scope_of_work: List[str]
    timeline: str
    pricing_breakdown: PricingBreakdownSchema
    payment_terms: str
    milestones: List[MilestoneSchema]
    proposal_text: str
