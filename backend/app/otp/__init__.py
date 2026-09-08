from app.otp.base import OTPProvider

_provider: OTPProvider | None = None


def get_otp_provider() -> OTPProvider:
    global _provider
    if _provider is not None:
        return _provider

    # Only a dev provider exists today -- this factory is the one place a
    # real SMS provider gets wired in later (mirrors app/vision's
    # mock/Gemini split), without any other file needing to change.
    from app.otp.dev_adapter import DevOTPProvider

    _provider = DevOTPProvider()
    return _provider


__all__ = ["OTPProvider", "get_otp_provider"]
