import os
import secrets

from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
USE_MOCK_VISION = GEMINI_API_KEY == ""
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.6"))
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Single shared admin identity -- there's no per-user account system (see
# app/auth.py), so one configured email+password pair is the whole admin
# "identity" story by design, not a stand-in for a users table.
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
# Falls back to a per-process random secret if unset, so a missing env var
# fails toward "every existing token is invalid on restart" rather than
# toward a guessable, hardcoded signing key.
ADMIN_TOKEN_SECRET = os.getenv("ADMIN_TOKEN_SECRET") or secrets.token_hex(32)
