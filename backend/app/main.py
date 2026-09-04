import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import CONFIDENCE_THRESHOLD
from app.orchestration.engine import get_session, start_session, verify_step
from app.orchestration.playbooks import EQUIPMENT_CATALOG
from app.schemas import (
    DiagnosisResponse,
    EscalateRequest,
    EscalateResponse,
    ImageRequest,
    StepInfo,
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
    next_step = StepInfo(instruction=first_step, step_number=1) if first_step else None

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

    resolved, should_escalate, next_instruction = verify_step(payload.session_id, reading)
    session = get_session(payload.session_id)
    step_number = (session.step_index + 1) if (session and next_instruction) else 0
    next_step = StepInfo(instruction=next_instruction, step_number=step_number) if next_instruction else None

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

    # Stub handoff: a real deployment forwards this structured payload to the
    # care-agent desktop (PRD IT-5). Logging it is enough to demonstrate the
    # shape of that payload for Phase 1.
    print(
        "[escalate]",
        {
            "ticket_id": ticket_id,
            "equipment": session.equipment if session else "unknown",
            "attempted_steps": session.step_index + 1 if session else 0,
        },
    )

    return EscalateResponse(ticket_id=ticket_id)
