import os
from dotenv import load_dotenv

load_dotenv()


def _require(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise EnvironmentError(f"Missing required environment variable: {key}")
    return value


SUPABASE_URL: str = _require("SUPABASE_URL")
SUPABASE_SERVICE_KEY: str = _require("SUPABASE_SERVICE_KEY")

GEMINI_API_KEY: str = _require("GEMINI_API_KEY")

RESEND_API_KEY: str = _require("RESEND_API_KEY")
EMAIL_FROM: str = _require("EMAIL_FROM")
EMAIL_TO: str = _require("EMAIL_TO")
