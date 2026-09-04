from app.vision.base import VisionEngine, VisionReading

# Returns a canned reading so the full app flow works before a Gemini key
# is configured. First call simulates the fault state; later calls simulate
# the light turning healthy, so the step-verification loop has something to
# react to. Good enough to exercise the walking skeleton end-to-end.


class MockVisionEngine(VisionEngine):
    def __init__(self) -> None:
        self._calls = 0

    def interpret(self, image_base64: str) -> VisionReading:
        self._calls += 1
        healthy = self._calls >= 2
        return VisionReading(
            equipment="Arris SB8200",
            confidence=0.92,
            status_lights={
                "power": "solid_green",
                "downstream": "solid_green",
                "online": "solid_green" if healthy else "blinking_amber",
            },
        )
