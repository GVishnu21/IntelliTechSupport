from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class ImageRequest(BaseModel):
    image_base64: str
    session_id: Optional[str] = None


class StepInfo(BaseModel):
    instruction: str
    step_number: int
    total_steps: int
    checklist: list[str] = []
    note: Optional[str] = None


class DiagnosisResponse(BaseModel):
    session_id: str
    scan_id: str
    equipment: str
    confidence: float
    status_lights: dict[str, str]
    next_step: Optional[StepInfo]
    low_confidence: bool


class VerifyStepResponse(BaseModel):
    resolved: bool
    escalate: bool
    next_step: Optional[StepInfo]
    status_lights: dict[str, str]


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminLoginResponse(BaseModel):
    token: str


class SelectEquipmentRequest(BaseModel):
    equipment: str
    fault_light_state: str


class SkipStepRequest(BaseModel):
    session_id: str


class SkipStepResponse(BaseModel):
    escalate: bool
    next_step: Optional[StepInfo]


class SendOtpRequest(BaseModel):
    contact_phone: str


class VerifyOtpRequest(BaseModel):
    contact_phone: str
    code: str


class VerifyOtpResponse(BaseModel):
    verified_token: str


# Mandatory customer identity (name, phone, city) -- distinct from the
# escalation-only OTP schemas above. City is captured up front specifically
# so outage lookups can use it instead of a generic "your area" string.
class CustomerSendOtpRequest(BaseModel):
    phone: str


class CustomerSignupRequest(BaseModel):
    name: str
    phone: str
    city: str
    code: str


class CustomerAuthResponse(BaseModel):
    token: str
    name: str
    phone: str
    city: str


class EscalateRequest(BaseModel):
    session_id: str
    contact_phone: Optional[str] = None
    # Present only if the customer completed OTP verification for
    # contact_phone (see /escalate/verify-otp). Never required -- escalation
    # must always succeed even if verification wasn't completed or failed.
    phone_verified_token: Optional[str] = None


class EscalateResponse(BaseModel):
    ticket_id: str


class TicketResponse(BaseModel):
    id: str
    session_id: Optional[str]
    equipment: str
    status: str
    status_lights: dict[str, str]
    history: list[dict]
    contact_phone: Optional[str]
    contact_phone_verified: bool
    created_at: datetime


class TicketStatusUpdate(BaseModel):
    status: Literal["open", "in_progress", "resolved", "escalated"]


class ScanFeedbackRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    feedback: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: str
    session_id: Optional[str]
    equipment: str
    outcome: str
    rating: int
    feedback: Optional[str]
    created_at: datetime


class FeedbackSummaryResponse(BaseModel):
    total: int
    average_rating: Optional[float]
    five_star_percent: float
    low_rating_count: int


class TrendPointResponse(BaseModel):
    date: str
    value: float


class LabeledCountResponse(BaseModel):
    label: str
    count: int


class AnalyticsSummaryResponse(BaseModel):
    total_scans: int
    resolution_rate: float
    escalation_rate: float
    avg_resolution_time: str
    first_contact_resolution: float
    csat: Optional[float]
    resolution_trend: list[TrendPointResponse]
    escalation_trend: list[TrendPointResponse]
    top_troubleshooting_steps: list[LabeledCountResponse]
