from abc import ABC, abstractmethod


class OTPProvider(ABC):
    """Sends and verifies a one-time code for a phone number, to confirm a
    customer's identity before an escalation ticket is created (PRD IT-5).

    Swap the implementation (dev / a real SMS provider) without touching the
    escalation flow -- callers only depend on this interface, same pattern
    as app/vision's VisionEngine.
    """

    @abstractmethod
    def send(self, phone: str) -> None:
        raise NotImplementedError

    @abstractmethod
    def verify(self, phone: str, code: str) -> bool:
        raise NotImplementedError
