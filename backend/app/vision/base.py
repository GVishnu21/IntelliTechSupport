from abc import ABC, abstractmethod

from pydantic import BaseModel


class VisionReading(BaseModel):
    equipment: str
    confidence: float
    status_lights: dict[str, str]


class VisionEngine(ABC):
    """Reads equipment identity and status-light state from a camera frame.

    Swap the implementation (mock / Gemini / a future on-device model) without
    touching orchestration logic — callers only depend on this interface.
    """

    @abstractmethod
    def interpret(self, image_base64: str) -> VisionReading:
        raise NotImplementedError
