import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import CONFIDENCE_THRESHOLD
from app.db import create_ticket, get_ticket, init_db, list_tickets, update_ticket_status
from app.orchestration.engine import get_session, start_session, verify_step
from app.orchestration.playbooks import EQUIPMENT_CATALOG
from app.schemas import (
    DiagnosisResponse,
    EscalateRequest,
    EscalateResponse,
    ImageRequest,
    StepInfo,
    TicketResponse,
    TicketStatusUpdate,
    VerifyStepResponse,
)
from app.vision import get_vision_engine

app = FastAPI(title="Intelli TechSupport API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/diagnose", response_model=DiagnosisResponse)
def diagnose(payload: ImageRequest) -> DiagnosisResponse:
    engine = get_vision_engine()
    reading = engine.interpret(payload.image_base64)

    recognized = reading.equipment in EQUIPMENT_CATALOG
    if not recognized or reading.confidence < CONFIDENCE_THRESHOLD:
        return DiagnosisResponse(
            session_id="",
            equipment=reading.equipment,
            confidence=reading.confidence,
            status_lights=reading.status_lights,
            next_step=None,
            low_confidence=True,
        )

    session, first_step = start_session(reading)
    next_step = (
        StepInfo(
            instruction=first_step["instruction"],
            step_number=1,
            total_steps=len(session.steps),
            checklist=first_step.get("checklist", []),
            note=first_step.get("note"),
        )
        if first_step
        else None
    )

    return DiagnosisResponse(
        session_id=session.id,
        equipment=reading.equipment,
        confidence=reading.confidence,
        status_lights=reading.status_lights,
        next_step=next_step,
        low_confidence=False,
    )


@app.post("/verify-step", response_model=VerifyStepResponse)
def verify(payload: ImageRequest) -> VerifyStepResponse:
    if not payload.session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    engine = get_vision_engine()
    reading = engine.interpret(payload.image_base64)

    resolved, should_escalate, next_step_data = verify_step(payload.session_id, reading)
    session = get_session(payload.session_id)
    step_number = (session.step_index + 1) if (session and next_step_data) else 0
    next_step = (
        StepInfo(
            instruction=next_step_data["instruction"],
            step_number=step_number,
            total_steps=len(session.steps) if session else 0,
            checklist=next_step_data.get("checklist", []),
            note=next_step_data.get("note"),
        )
        if next_step_data
        else None
    )

    return VerifyStepResponse(
        resolved=resolved,
        escalate=should_escalate,
        next_step=next_step,
        status_lights=reading.status_lights,
    )


@app.post("/escalate", response_model=EscalateResponse)
def escalate(payload: EscalateRequest) -> EscalateResponse:
    session = get_session(payload.session_id)
    ticket_id = f"ITS-{uuid.uuid4().hex[:8].upper()}"

    # Real handoff: persists the diagnosis/history so a care agent can pull it
    # up later (PRD IT-5) instead of the customer repeating the troubleshooting
    # process. session_id won't resolve to a session for a manually-selected
    # (non-photo) diagnosis -- the ticket is still created, just with the
    # equipment/lights/history fields left at their unknown/empty defaults.
    create_ticket(
        ticket_id=ticket_id,
        session_id=payload.session_id,
        equipment=session.equipment if session else "unknown",
        status_lights=session.last_status_lights if session else {},
        history=session.history if session else [],
    )

    return EscalateResponse(ticket_id=ticket_id)


@app.get("/tickets", response_model=list[TicketResponse])
def get_tickets() -> list[TicketResponse]:
    return [TicketResponse(**row) for row in list_tickets()]


@app.get("/tickets/{ticket_id}", response_model=TicketResponse)
def get_ticket_detail(ticket_id: str) -> TicketResponse:
    row = get_ticket(ticket_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return TicketResponse(**row)


@app.patch("/tickets/{ticket_id}", response_model=TicketResponse)
def patch_ticket_status(ticket_id: str, payload: TicketStatusUpdate) -> TicketResponse:
    row = update_ticket_status(ticket_id, payload.status)
    if row is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return TicketResponse(**row)
