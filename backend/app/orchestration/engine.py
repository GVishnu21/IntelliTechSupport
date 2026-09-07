import uuid
from dataclasses import dataclass, field

from app.orchestration.playbooks import EQUIPMENT_CATALOG, HEALTHY_STATE
from app.vision.base import VisionReading

# In-memory session store — fine for a Phase-1 demo, would move to
# Postgres/Valkey for a real multi-instance deployment.
_SESSIONS: dict[str, "Session"] = {}


@dataclass
class Session:
    equipment: str
    fault_light: str
    steps: list[dict]
    step_index: int = 0
    resolved: bool = False
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    # Latest LED reading and the outcome of each attempted step -- captured so
    # an escalated session has real data to persist as a ticket, instead of
    # the ticket only ever knowing the equipment name.
    last_status_lights: dict[str, str] = field(default_factory=dict)
    history: list[dict] = field(default_factory=list)


def _is_healthy(reading: VisionReading, fault_light: str) -> bool:
    return reading.status_lights.get(fault_light) == HEALTHY_STATE


def start_session(reading: VisionReading) -> tuple[Session, dict | None]:
    """Create a session from an initial reading. Returns (session, first_step)."""
    spec = EQUIPMENT_CATALOG[reading.equipment]
    session = Session(
        equipment=reading.equipment,
        fault_light=spec["fault_light"],
        steps=list(spec["steps"]),
        last_status_lights=reading.status_lights,
    )

    if _is_healthy(reading, session.fault_light):
        session.resolved = True
        _SESSIONS[session.id] = session
        return session, None

    _SESSIONS[session.id] = session
    return session, session.steps[0]


def verify_step(session_id: str, reading: VisionReading) -> tuple[bool, bool, dict | None]:
    """Returns (resolved, escalate, next_step_instruction)."""
    session = _SESSIONS.get(session_id)
    if session is None:
        return False, True, None

    session.last_status_lights = reading.status_lights
    attempted_step = session.steps[session.step_index]

    if _is_healthy(reading, session.fault_light):
        session.resolved = True
        session.history.append({"step": attempted_step["instruction"], "outcome": "completed"})
        return True, False, None

    session.history.append({"step": attempted_step["instruction"], "outcome": "failed"})
    session.step_index += 1
    if session.step_index >= len(session.steps):
        return False, True, None

    return False, False, session.steps[session.step_index]


def skip_step(session_id: str) -> tuple[bool, dict | None]:
    """Advance past the current step without photo verification. Returns
    (escalate, next_step). A skipped step never confirms resolution, so
    running out of steps always escalates rather than resolving."""
    session = _SESSIONS.get(session_id)
    if session is None:
        return True, None

    attempted_step = session.steps[session.step_index]
    session.history.append({"step": attempted_step["instruction"], "outcome": "skipped"})
    session.step_index += 1
    if session.step_index >= len(session.steps):
        return True, None

    return False, session.steps[session.step_index]


def get_session(session_id: str) -> Session | None:
    return _SESSIONS.get(session_id)
