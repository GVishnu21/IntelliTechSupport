from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


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


class SelectEquipmentRequest(BaseModel):
    equipment: str
    fault_light_state: str


class SkipStepRequest(BaseModel):
    session_id: str


class SkipStepResponse(BaseModel):
    escalate: bool
    next_step: Optional[StepInfo]


class EscalateRequest(BaseModel):
    session_id: str
    contact_phone: Optional[str] = None


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
    created_at: datetime


class TicketStatusUpdate(BaseModel):
    status: Literal["open", "in_progress", "resolved", "escalated"]


class ScanFeedbackRequest(BaseModel):
    rating: int
    feedback: Optional[str] = None


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
