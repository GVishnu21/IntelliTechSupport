"""Unit tests for phone-verification tokens (app/auth.py).

Pure and dependency-free -- no HTTP layer, no DB, no real OTP provider.
"""

from app.auth import (
    create_customer_token,
    create_phone_verification_token,
    get_customer_id_from_token,
    is_valid_phone_verification_token,
)


def test_a_freshly_created_token_is_valid_for_its_own_phone():
    token = create_phone_verification_token("+1-555-0100")

    assert is_valid_phone_verification_token(token, "+1-555-0100") is True


def test_a_token_is_rejected_for_a_different_phone_number():
    token = create_phone_verification_token("+1-555-0100")

    assert is_valid_phone_verification_token(token, "+1-555-9999") is False


def test_garbage_token_is_rejected():
    assert is_valid_phone_verification_token("not-a-real-token", "+1-555-0100") is False


def test_tampered_signature_is_rejected():
    token = create_phone_verification_token("+1-555-0100")
    encoded_phone, expires_at, _signature = token.split(".", 2)
    tampered = f"{encoded_phone}.{expires_at}.tampered-signature"

    assert is_valid_phone_verification_token(tampered, "+1-555-0100") is False


def test_phone_numbers_containing_a_dot_do_not_break_parsing():
    # The token format is dot-delimited -- the phone is base64-encoded
    # specifically so a raw "." in the phone number can't collide with the
    # delimiter.
    token = create_phone_verification_token("+1.555.010.0")

    assert is_valid_phone_verification_token(token, "+1.555.010.0") is True


def test_a_customer_token_round_trips_the_customer_id():
    token = create_customer_token("cust-123")

    assert get_customer_id_from_token(token) == "cust-123"


def test_a_garbage_customer_token_returns_none():
    assert get_customer_id_from_token("not-a-real-token") is None


def test_a_tampered_customer_token_returns_none():
    token = create_customer_token("cust-123")
    encoded_id, expires_at, _signature = token.split(".", 2)
    tampered = f"{encoded_id}.{expires_at}.tampered-signature"

    assert get_customer_id_from_token(tampered) is None
