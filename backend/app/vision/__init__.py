from app.config import USE_MOCK_VISION
from app.vision.base import VisionEngine, VisionReading

_engine: VisionEngine | None = None


def get_vision_engine() -> VisionEngine:
    global _engine
    if _engine is not None:
        return _engine

    if USE_MOCK_VISION:
        from app.vision.mock_adapter import MockVisionEngine

        _engine = MockVisionEngine()
    else:
        from app.vision.gemini_adapter import GeminiVisionEngine

        _engine = GeminiVisionEngine()

    return _engine


__all__ = ["VisionEngine", "VisionReading", "get_vision_engine"]
