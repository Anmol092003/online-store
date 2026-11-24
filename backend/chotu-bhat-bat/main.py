from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from jose import jwt, JWTError

from config import PORT, JWT_SECRET, JWT_ALGORITHM, is_gemini_configured
from guardrails import validate_user_prompt
from bot_service import ask_chotu
from store_client import get_store_insights

app = FastAPI(
    title="Chotu AI Assistant",
    description="Admin-only operations, sales insights, and inventory management chatbot with Gemini AI and security guardrails",
    version="1.0.0"
)

# Enable CORS for React frontend & API gateway
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

def verify_admin_access(authorization: Optional[str] = Header(None)) -> dict:
    """
    Ensures that ONLY authenticated ADMIN users can access Chotu.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in as Admin."
        )

    token = authorization.replace("Bearer ", "").strip()
    try:
        # Decode Spring Boot generated JWT
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"verify_aud": False, "verify_iss": False}
        )
        role = payload.get("role")
        # In BazaarOne, role is "ADMIN"
        if role != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access restricted: Chotu AI is accessible exclusively to BazaarOne Administrators."
            )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired security token: {str(e)}"
        )

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "chotu-bhat-bat",
        "gemini_configured": is_gemini_configured()
    }

@app.get("/api/insights")
async def get_insights(_user: dict = Depends(verify_admin_access)):
    """
    Returns sanitized sales and inventory insights. Admin-only.
    """
    return await get_store_insights()

@app.post("/api/chat")
async def chat_with_chotu(req: ChatRequest, _user: dict = Depends(verify_admin_access)):
    """
    Admin-only chat endpoint with guardrails and Gemini response generation.
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # 1. Guardrail Check (Input Safety)
    is_safe, refusal_msg = validate_user_prompt(req.message)
    if not is_safe:
        return {
            "reply": refusal_msg,
            "guardrail_triggered": True
        }

    # 2. Process conversation & query live insights with Gemini
    history_dicts = [{"role": m.role, "content": m.content} for m in req.history]
    reply = await ask_chotu(req.message, history_dicts)

    return {
        "reply": reply,
        "guardrail_triggered": False
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
