from app.vision.base import VisionEngine, VisionReading

# Returns a canned reading so the full app flow works before a Gemini key
# is configured. /diagnose never has a session yet (a fresh photo with no
# prior session_id) -- simulate the fault state there. /verify-step always
# has a real, existing session_id -- simulate the light turning healthy
# there, so the step-verification loop has something to react to. Keyed on
# session presence rather than a call counter, so this can't cross-contaminate
# between concurrent customers/sessions sharing the same cached engine instance.


class MockVisionEngine(VisionEngine):
    def interpret(self, image_base64: str, session_id: str | None = None) -> VisionReading:
        healthy = session_id is not None
        return VisionReading(
            equipment="Arris SB8200",
            confidence=0.92,
            status_lights={
                "power": "solid_green",
                "downstream": "solid_green",
                "online": "solid_green" if healthy else "blinking_amber",
            },
        )
