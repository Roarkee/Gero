from typing import List, Optional
from pydantic import BaseModel, Field

class PaymentSchedule(BaseModel):
    deposit: str
    milestone_1: str
    milestone_2: str
    final_payment: str

class PricingAnalysis(BaseModel):
    hourly_rate: float = Field(ge=0)
    estimated_hours: float = Field(ge=0)
    base_cost: float = Field(ge=0)
    complexity_multiplier: float = Field(ge=1.0)
    urgency_multiplier: float = Field(ge=1.0)
    revision_buffer_percentage: float = Field(ge=0)
    profit_margin_percentage: float = Field(ge=0)
    final_price: float = Field(ge=0)
    
    payment_schedule: PaymentSchedule
    
    pricing_strategy: str
    pricing_reasoning: str
    negotiation_floor: float = Field(ge=0)
