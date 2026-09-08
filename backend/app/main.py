import secrets
import uuid

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.auth import (
    create_admin_token,
    create_customer_token,
    create_phone_verification_token,
    is_valid_admin_token,
    is_valid_phone_verification_token,
)
from app.config import ADMIN_EMAIL, ADMIN_PASSWORD, CONFIDENCE_THRESHOLD
from app.db import (
    create_scan,
    create_ticket,
    get_feedback,
    get_feedback_summary,
    get_recent_feedback,
    get_scans_summary,
    get_ticket,
    init_db,
    list_tickets,
    update_scan_feedback,
    update_scan_outcome,
    update_ticket_status,
    upsert_customer,
)
from app.orchestration.engine import get_session, skip_step, start_session, verify_step
from app.orchestration.playbooks import EQUIPMENT_CATALOG
from app.otp import get_otp_provider
from app.schemas import (
    AdminLoginRequest,
    AdminLoginResponse,
    AnalyticsSummaryResponse,
    CustomerAuthResponse,
    CustomerSendOtpRequest,
    CustomerSignupRequest,
    DiagnosisResponse,
    EscalateRequest,
    EscalateResponse,
    FeedbackResponse,
    FeedbackSummaryResponse,
    ImageRequest,
    ScanFeedbackRequest,
    SelectEquipmentRequest,
    SendOtpRequest,
    SkipStepRequest,
    SkipStepResponse,
    StepInfo,
    TicketResponse,
    TicketStatusUpdate,
    VerifyOtpRequest,
    VerifyOtpResponse,
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


def require_admin(authorization: str | None = Header(default=None)) -> None:
    token = (authorization or "").removeprefix("Bearer ").strip()
    if not token or not is_valid_admin_token(token):
        raise HTTPException(status_code=401, detail="Not authenticated")


@app.post("/admin/login", response_model=AdminLoginResponse)
def admin_login(payload: AdminLoginRequest) -> AdminLoginResponse:
    email_matches = ADMIN_EMAIL != "" and payload.email.strip().lower() == ADMIN_EMAIL.strip().lower()
    password_matches = ADMIN_PASSWORD != "" and secrets.compare_digest(payload.password, ADMIN_PASSWORD)
    if not (email_matches and password_matches):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return AdminLoginResponse(token=create_admin_token())


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


# Mandatory customer identity (PRD IT-5 / phone-only, no email) -- gates the
# whole customer app on the frontend (see RequireCustomerAuth.tsx). Reuses
# the same OTPProvider as /escalate/*, but issues a long-lived customer
# session token rather than a short-lived phone-verification token, since
# this is a real account, not a one-off escalation proof.
@app.post("/customer/send-otp")
def customer_send_otp(payload: CustomerSendOtpRequest) -> dict:
    get_otp_provider().send(payload.phone)
    return {"status": "sent"}


@app.post("/customer/signup", response_model=CustomerAuthResponse)
def customer_signup(payload: CustomerSignupRequest) -> CustomerAuthResponse:
    if not get_otp_provider().verify(payload.phone, payload.code):
        raise HTTPException(status_code=401, detail="Incorrect code")

    customer_id = str(uuid.uuid4())
    customer = upsert_customer(customer_id, payload.phone, payload.name.strip(), payload.city.strip())
    return CustomerAuthResponse(
        token=create_customer_token(customer["id"]),
        name=customer["name"],
        phone=customer["phone"],
        city=customer["city"],
    )


@app.post("/diagnose", response_model=DiagnosisResponse)
def diagnose(payload: ImageRequest) -> DiagnosisResponse:
    engine = get_vision_engine()
    reading = engine.interpret(payload.image_base64, payload.session_id)

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
    reading = engine.interpret(payload.image_base64, payload.session_id)

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


@app.post("/escalate/send-otp")
def send_otp(payload: SendOtpRequest) -> dict:
    # No customer login exists, so a one-time code to the callback number is
    # the only real identity signal available (PRD IT-5). Dev provider only
    # today (see app/otp/dev_adapter.py) -- a real SMS provider slots in
    # behind the same OTPProvider interface without this endpoint changing.
    get_otp_provider().send(payload.contact_phone)
    return {"status": "sent"}


@app.post("/escalate/verify-otp", response_model=VerifyOtpResponse)
def verify_otp(payload: VerifyOtpRequest) -> VerifyOtpResponse:
    if not get_otp_provider().verify(payload.contact_phone, payload.code):
        raise HTTPException(status_code=401, detail="Incorrect code")
    return VerifyOtpResponse(verified_token=create_phone_verification_token(payload.contact_phone))


@app.post("/escalate", response_model=EscalateResponse)
def escalate(payload: EscalateRequest) -> EscalateResponse:
    session = get_session(payload.session_id)
    ticket_id = f"ITS-{uuid.uuid4().hex[:8].upper()}"

    # Verification is optional, never a gate -- a customer in a real outage
    # must always have a clean path to a human, even if they skip it or the
    # code never arrives. When present, it's real: only true if the token
    # actually matches this contact_phone and hasn't expired.
    contact_phone_verified = bool(
        payload.contact_phone
        and payload.phone_verified_token
        and is_valid_phone_verification_token(payload.phone_verified_token, payload.contact_phone)
    )

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
        contact_phone_verified=contact_phone_verified,
    )

    return EscalateResponse(ticket_id=ticket_id)


@app.get("/tickets", response_model=list[TicketResponse])
def get_tickets(_: None = Depends(require_admin)) -> list[TicketResponse]:
    return [TicketResponse(**row) for row in list_tickets()]


@app.get("/tickets/{ticket_id}", response_model=TicketResponse)
def get_ticket_detail(ticket_id: str, _: None = Depends(require_admin)) -> TicketResponse:
    row = get_ticket(ticket_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return TicketResponse(**row)


@app.patch("/tickets/{ticket_id}", response_model=TicketResponse)
def patch_ticket_status(
    ticket_id: str, payload: TicketStatusUpdate, _: None = Depends(require_admin)
) -> TicketResponse:
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


@app.get("/feedback/recent", response_model=list[FeedbackResponse])
def feedback_recent(limit: int = 20, _: None = Depends(require_admin)) -> list[FeedbackResponse]:
    return [FeedbackResponse(**row) for row in get_recent_feedback(limit)]


@app.get("/feedback/summary", response_model=FeedbackSummaryResponse)
def feedback_summary(_: None = Depends(require_admin)) -> FeedbackSummaryResponse:
    return FeedbackSummaryResponse(**get_feedback_summary())


@app.get("/feedback/{feedback_id}", response_model=FeedbackResponse)
def feedback_detail(feedback_id: str, _: None = Depends(require_admin)) -> FeedbackResponse:
    row = get_feedback(feedback_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return FeedbackResponse(**row)


@app.get("/analytics/summary", response_model=AnalyticsSummaryResponse)
def analytics_summary(_: None = Depends(require_admin)) -> AnalyticsSummaryResponse:
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
