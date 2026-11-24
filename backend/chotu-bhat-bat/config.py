import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_HERE")
PORT = int(os.getenv("PORT", "8083"))
MAIN_SERVICE_URL = os.getenv("MAIN_SERVICE_URL", "http://localhost:8081")
JWT_SECRET = os.getenv("JWT_SECRET", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

def is_gemini_configured() -> bool:
    return bool(GEMINI_API_KEY and GEMINI_API_KEY.strip() and not GEMINI_API_KEY.startswith("YOUR_GEMINI"))
