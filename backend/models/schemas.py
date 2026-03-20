from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
import uuid

PersonaType = Literal["food_delivery", "quick_commerce", "package_delivery", "rideshare_uber", "rideshare_ola"]

class WorkerOnboardRequest(BaseModel):
    name: str
    phone: str
    city: str
    city_tier: int = Field(ge=1, le=3)
    persona: PersonaType
    platform: str
    avg_weekly_income: float = Field(gt=0)
    experience_years: float = Field(ge=0)
    active_hours_per_day: float = Field(gt=0, le=24)
    historical_claim_rate: float = Field(ge=0, le=1, default=0.0)

class PolicyCreateRequest(BaseModel):
    worker_id: str
    persona: PersonaType
    weeks: int = Field(ge=1, le=52, default=4)

class ClaimRequest(BaseModel):
    policy_id: str
    worker_id: str
    persona: PersonaType
    disruption_type: Literal["environmental", "social"]
    disruption_subtype: str
    weather_severity: float = Field(ge=0, le=1)
    social_disruption: float = Field(ge=0, le=1)
    claimed_loss_ratio: float = Field(ge=0, le=1)
    hours_reported_lost: int = Field(ge=0, le=24)
    location_match_score: float = Field(ge=0, le=1, default=0.9)
    description: str = ""

class EnvironmentRequest(BaseModel):
    city: str
    persona: PersonaType
    day_of_week: int = Field(ge=0, le=6, default=0)
    time_bucket: int = Field(ge=0, le=3, default=1)
    aqi: float = Field(ge=0, default=80)
    rain_mm: float = Field(ge=0, default=0)
    temp_celsius: float = Field(default=30)
    weather_severity: float = Field(ge=0, le=1, default=0.2)
    social_disruption: float = Field(ge=0, le=1, default=0.0)
