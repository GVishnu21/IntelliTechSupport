from datetime import datetime
from typing import Optional

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


class EscalateRequest(BaseModel):
    session_id: str


class EscalateResponse(BaseModel):
    ticket_id: str


class TicketResponse(BaseModel):
    id: str
    session_id: Optional[str]
    equipment: str
    status: str
    status_lights: dict[str, str]
    history: list[dict]
    created_at: datetime
