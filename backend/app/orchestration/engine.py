import uuid
from dataclasses import dataclass, field

from app.orchestration.playbooks import EQUIPMENT_CATALOG, HEALTHY_STATE
from app.vision.base import VisionReading

# In-memory session store — fine for a Phase-1 demo, would move to
# Postgres/Valkey for a real multi-instance deployment.
_SESSIONS: dict[str, "Session"] = {}


REBOOT_WAIT_STEP: dict = {
    "instruction": "Your device looks like it's restarting. Wait about a minute, then take another photo to check again.",
    "checklist": ["Waited at least 60 seconds", "Power light is solid, not blinking"],
}


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
    # All of this equipment's known lights (not just fault_light) -- lets
    # _is_healthy also check "wifi" when it's present, instead of only ever
    # looking at the one connectivity light.
    lights: list[str] = field(default_factory=list)
    # True while the customer is on the reboot-wait step rather than a real
    # catalog step. step_index stays 0 the whole time this is set, so
    # verify_step must check this flag first -- otherwise it would treat
    # session.steps[0] as "attempted" (and silently skip it) the moment the
    # customer's follow-up photo comes back, even though they were only ever
    # told to wait, not to do that step.
    awaiting_reboot: bool = False


def _is_healthy(reading: VisionReading, session: Session) -> bool:
    if reading.status_lights.get(session.fault_light) != HEALTHY_STATE:
        return False
    # Wi-Fi can be off while the internet connection itself is fine -- that's
    # a real, separate fault, not "all good". Only enforced when this
    # equipment actually has a wifi light *and* the current reading reports
    # one -- manual selection never reports a wifi light, so it's correctly
    # exempt rather than permanently blocked from resolving.
    if "wifi" in session.lights and "wifi" in reading.status_lights:
        if reading.status_lights["wifi"] != HEALTHY_STATE:
            return False
    return True


def _is_rebooting(reading: VisionReading) -> bool:
    return reading.status_lights.get("power", "").startswith("blinking")


def start_session(reading: VisionReading) -> tuple[Session, dict | None]:
    """Create a session from an initial reading. Returns (session, first_step)."""
    spec = EQUIPMENT_CATALOG[reading.equipment]
    session = Session(
        equipment=reading.equipment,
        fault_light=spec["fault_light"],
        steps=list(spec["steps"]),
        last_status_lights=reading.status_lights,
        lights=list(spec.get("lights", [])),
    )

    if _is_healthy(reading, session):
        session.resolved = True
        _SESSIONS[session.id] = session
        return session, None

    if _is_rebooting(reading):
        session.awaiting_reboot = True
        _SESSIONS[session.id] = session
        return session, REBOOT_WAIT_STEP

    _SESSIONS[session.id] = session
    return session, session.steps[0]


def verify_step(session_id: str, reading: VisionReading) -> tuple[bool, bool, dict | None]:
    """Returns (resolved, escalate, next_step_instruction)."""
    session = _SESSIONS.get(session_id)
    if session is None:
        return False, True, None

    session.last_status_lights = reading.status_lights
    attempted_step = REBOOT_WAIT_STEP if session.awaiting_reboot else session.steps[session.step_index]

    if _is_healthy(reading, session):
        session.resolved = True
        session.history.append({"step": attempted_step["instruction"], "outcome": "completed"})
        return True, False, None

    if session.awaiting_reboot:
        # Whether or not it finished rebooting, the underlying fault is
        # still there -- move into the real step chain at step 0, which
        # hasn't actually been attempted yet (step_index was never touched
        # while waiting).
        session.awaiting_reboot = False
        session.history.append({"step": attempted_step["instruction"], "outcome": "failed"})
        return False, False, session.steps[0]

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

    if session.awaiting_reboot:
        # Same reasoning as verify_step: step_index hasn't moved off 0 yet,
        # so skipping the wait step means "give me the real steps," not
        # "advance past step 0" -- it must not touch step_index.
        session.awaiting_reboot = False
        session.history.append({"step": REBOOT_WAIT_STEP["instruction"], "outcome": "skipped"})
        return False, session.steps[0]

    attempted_step = session.steps[session.step_index]
    session.history.append({"step": attempted_step["instruction"], "outcome": "skipped"})
    session.step_index += 1
    if session.step_index >= len(session.steps):
        return True, None

    return False, session.steps[session.step_index]


def get_session(session_id: str) -> Session | None:
    return _SESSIONS.get(session_id)
