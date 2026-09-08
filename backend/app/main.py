import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import CONFIDENCE_THRESHOLD
from app.db import (
    create_scan,
    create_ticket,
    get_scans_summary,
    get_ticket,
    init_db,
    list_tickets,
    update_scan_feedback,
    update_scan_outcome,
    update_ticket_status,
)
from app.orchestration.engine import get_session, skip_step, start_session, verify_step
from app.orchestration.playbooks import EQUIPMENT_CATALOG
from app.schemas import (
    AnalyticsSummaryResponse,
    DiagnosisResponse,
    EscalateRequest,
    EscalateResponse,
    ImageRequest,
    ScanFeedbackRequest,
    SelectEquipmentRequest,
    SkipStepRequest,
    SkipStepResponse,
    StepInfo,
    TicketResponse,
    TicketStatusUpdate,
    VerifyStepResponse,
)
from app.vision import get_vision_engine
from app.vision.base import VisionReading

VALID_LIGHT_STATES = {"solid_green", "blinking_amber", "blinking_red", "solid_red", "off"}

app = FastAPI(title="Intelli TechSupport API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


def _format_duration(seconds: float) -> str:
    total = int(round(seconds))
    minutes, secs = divmod(total, 60)
    return f"{minutes}m {secs}s"


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/diagnose", response_model=DiagnosisResponse)
def diagnose(payload: ImageRequest) -> DiagnosisResponse:
    engine = get_vision_engine()
    reading = engine.interpret(payload.image_base64)

    recognized = reading.equipment in EQUIPMENT_CATALOG
    if not recognized or reading.confidence < CONFIDENCE_THRESHOLD:
        # Still a real scan for metrics purposes -- a customer pointed their
        # camera at something and we couldn't use it. No session exists to
        # attach it to, so it gets its own id and a null session_id.
        scan_id = str(uuid.uuid4())
        create_scan(scan_id=scan_id, session_id=None, equipment=reading.equipment, outcome="unrecognized")
        return DiagnosisResponse(
            session_id="",
            scan_id=scan_id,
            equipment=reading.equipment,
            confidence=reading.confidence,
            status_lights=reading.status_lights,
            next_step=None,
            low_confidence=True,
        )

    session, first_step = start_session(reading)
    # The scan and the session are the same thing once one exists, so reuse
    # session.id rather than minting a second id for the same real-world event.
    create_scan(
        scan_id=session.id,
        session_id=session.id,
        equipment=reading.equipment,
        outcome="resolved" if not first_step else "in_progress",
    )
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
        scan_id=session.id,
        equipment=reading.equipment,
        confidence=reading.confidence,
        status_lights=reading.status_lights,
        next_step=next_step,
        low_confidence=False,
    )


@app.post("/select-equipment", response_model=DiagnosisResponse)
def select_equipment(payload: SelectEquipmentRequest) -> DiagnosisResponse:
    # Manual-selection fallback (IT-1) for when the camera can't get a
    # confident read. The customer already told us the equipment model, so
    # there's no vision call -- we only need their answer for the one light
    # the playbook actually checks, wrapped in a VisionReading so it flows
    # through the exact same session/orchestration logic as /diagnose.
    if payload.equipment not in EQUIPMENT_CATALOG:
        raise HTTPException(status_code=400, detail="Unknown equipment")
    if payload.fault_light_state not in VALID_LIGHT_STATES:
        raise HTTPException(status_code=400, detail="Unknown light state")

    spec = EQUIPMENT_CATALOG[payload.equipment]
    reading = VisionReading(
        equipment=payload.equipment,
        confidence=1.0,
        status_lights={spec["fault_light"]: payload.fault_light_state},
    )

    session, first_step = start_session(reading)
    create_scan(
        scan_id=session.id,
        session_id=session.id,
        equipment=payload.equipment,
        outcome="resolved" if not first_step else "in_progress",
    )
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
        scan_id=session.id,
        equipment=payload.equipment,
        confidence=1.0,
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

    if session and (resolved or should_escalate):
        update_scan_outcome(
            session_id=payload.session_id,
            outcome="resolved" if resolved else "escalated",
            steps_completed=len(session.history),
            history=session.history,
        )

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


@app.post("/skip-step", response_model=SkipStepResponse)
def skip(payload: SkipStepRequest) -> SkipStepResponse:
    session = get_session(payload.session_id)
    should_escalate, next_step_data = skip_step(payload.session_id)

    if session and should_escalate:
        update_scan_outcome(
            session_id=payload.session_id,
            outcome="escalated",
            steps_completed=len(session.history),
            history=session.history,
        )

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

    return SkipStepResponse(escalate=should_escalate, next_step=next_step)


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
        contact_phone=payload.contact_phone,
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


@app.post("/scans/{scan_id}/feedback")
def submit_scan_feedback(scan_id: str, payload: ScanFeedbackRequest) -> dict:
    row = update_scan_feedback(scan_id, payload.rating, payload.feedback)
    if row is None:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"status": "ok"}


@app.get("/analytics/summary", response_model=AnalyticsSummaryResponse)
def analytics_summary() -> AnalyticsSummaryResponse:
    summary = get_scans_summary()
    avg_seconds = summary["avg_resolution_time_seconds"]
    return AnalyticsSummaryResponse(
        total_scans=summary["total_scans"],
        resolution_rate=summary["resolution_rate"],
        escalation_rate=summary["escalation_rate"],
        avg_resolution_time=_format_duration(avg_seconds) if avg_seconds is not None else "—",
        first_contact_resolution=summary["first_contact_resolution"],
        csat=summary["csat"],
        resolution_trend=summary["resolution_trend"],
        escalation_trend=summary["escalation_trend"],
        top_troubleshooting_steps=summary["top_troubleshooting_steps"],
    )
