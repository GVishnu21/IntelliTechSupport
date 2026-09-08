import base64
import hashlib
import hmac
import time

from app.config import ADMIN_TOKEN_SECRET

_TOKEN_LIFETIME_SECONDS = 12 * 60 * 60  # 12 hours


def _sign(message: str) -> str:
    digest = hmac.new(ADMIN_TOKEN_SECRET.encode(), message.encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).decode().rstrip("=")


def create_admin_token() -> str:
    expires_at = str(int(time.time()) + _TOKEN_LIFETIME_SECONDS)
    return f"{expires_at}.{_sign(expires_at)}"


def is_valid_admin_token(token: str) -> bool:
    try:
        expires_at, signature = token.split(".", 1)
    except ValueError:
        return False

    if not hmac.compare_digest(signature, _sign(expires_at)):
        return False

    return int(expires_at) >= int(time.time())


# Proves a customer completed OTP verification for a specific phone number
# recently (PRD IT-5). Reuses ADMIN_TOKEN_SECRET as a general-purpose
# app-wide signing key -- the two token formats are structurally distinct
# (2 dot-separated parts vs. 3), so there's no risk of one being accepted
# as the other.
_PHONE_TOKEN_LIFETIME_SECONDS = 15 * 60  # long enough to finish escalating


def create_phone_verification_token(phone: str) -> str:
    encoded_phone = base64.urlsafe_b64encode(phone.encode()).decode().rstrip("=")
    expires_at = str(int(time.time()) + _PHONE_TOKEN_LIFETIME_SECONDS)
    payload = f"{encoded_phone}.{expires_at}"
    return f"{payload}.{_sign(payload)}"


def is_valid_phone_verification_token(token: str, phone: str) -> bool:
    try:
        encoded_phone, expires_at, signature = token.split(".", 2)
    except ValueError:
        return False

    payload = f"{encoded_phone}.{expires_at}"
    if not hmac.compare_digest(signature, _sign(payload)):
        return False

    try:
        padded = encoded_phone + "=" * (-len(encoded_phone) % 4)
        token_phone = base64.urlsafe_b64decode(padded).decode()
    except Exception:
        return False

    if token_phone != phone:
        return False

    return int(expires_at) >= int(time.time())


# Mandatory customer identity (phone + OTP, name, city) -- separate from the
# phone-verification token above, which only proves a phone briefly for one
# escalation. This one is a real session: long-lived, bound to a customer
# row, and is what the frontend gates the whole app behind (see
# RequireCustomerAuth.tsx). Same 3-dot-separated-parts shape as the phone
# verification token above, but never cross-validated against it -- each is
# only ever checked against its own expected payload.
_CUSTOMER_TOKEN_LIFETIME_SECONDS = 90 * 24 * 60 * 60  # 90 days


def create_customer_token(customer_id: str) -> str:
    encoded_id = base64.urlsafe_b64encode(customer_id.encode()).decode().rstrip("=")
    expires_at = str(int(time.time()) + _CUSTOMER_TOKEN_LIFETIME_SECONDS)
    payload = f"{encoded_id}.{expires_at}"
    return f"{payload}.{_sign(payload)}"


def get_customer_id_from_token(token: str) -> str | None:
    try:
        encoded_id, expires_at, signature = token.split(".", 2)
    except ValueError:
        return None

    payload = f"{encoded_id}.{expires_at}"
    if not hmac.compare_digest(signature, _sign(payload)):
        return None

    if int(expires_at) < int(time.time()):
        return None

    try:
        padded = encoded_id + "=" * (-len(encoded_id) % 4)
        return base64.urlsafe_b64decode(padded).decode()
    except Exception:
        return None
