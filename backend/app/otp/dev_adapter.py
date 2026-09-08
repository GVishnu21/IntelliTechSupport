from app.otp.base import OTPProvider

DEV_OTP_CODE = "123456"


class DevOTPProvider(OTPProvider):
    """Free, zero-infrastructure stand-in for a real SMS provider -- accepts
    one fixed code for any phone number instead of actually sending an SMS.
    Good enough to demonstrate the verified-identity flow without an SMS
    bill. Swap for a real provider (Twilio, MSG91, etc.) behind the same
    OTPProvider interface when this needs to go beyond a demo.
    """

    def send(self, phone: str) -> None:
        print(f"[otp] (dev mode, no real SMS sent) code for {phone} is {DEV_OTP_CODE}")

    def verify(self, phone: str, code: str) -> bool:
        return code == DEV_OTP_CODE
