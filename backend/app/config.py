import os

from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
USE_MOCK_VISION = GEMINI_API_KEY == ""
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.6"))
DATABASE_URL = os.getenv("DATABASE_URL", "")
