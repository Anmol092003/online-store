import re
from typing import Any, Dict, List, Tuple

SENSITIVE_INPUT_PATTERNS = [
    r"\bpasswords?\b",
    r"\bpwd\b",
    r"\buser\s*passwords?\b",
    r"\badmin\s*passwords?\b",
    r"\bbcrypt\b",
    r"\bhashes?\b",
    r"\bcredentials?\b",
    r"\bsecret\s*keys?\b",
    r"\btoken\s*secret\b",
    r"\bauth\s*tokens?\b"
]

BCRYPT_HASH_REGEX = re.compile(r"\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}")

def validate_user_prompt(prompt: str) -> Tuple[bool, str]:
    """
    Checks if the user prompt is attempting to extract passwords, hashes, or credentials.
    Returns (is_safe, refusal_message_if_unsafe).
    """
    prompt_lower = prompt.lower()
    for pattern in SENSITIVE_INPUT_PATTERNS:
        if re.search(pattern, prompt_lower):
            return (
                False,
                "🛡️ **Security Guardrail Active**: Chotu AI is strictly prohibited from accessing, "
                "processing, or disclosing user passwords, password hashes, or security credentials. "
                "I am here to assist with store sales insights, inventory status, order tracking, and product analytics."
            )
    return True, ""

def sanitize_data_payload(obj: Any) -> Any:
    """
    Recursively strips any password, token, or secret fields before giving data to the AI model.
    """
    forbidden_keys = {"password", "token", "secret", "authprovider", "key_secret"}
    if isinstance(obj, dict):
        cleaned = {}
        for k, v in obj.items():
            if str(k).lower() in forbidden_keys:
                continue
            cleaned[k] = sanitize_data_payload(v)
        return cleaned
    elif isinstance(obj, list):
        return [sanitize_data_payload(item) for item in obj]
    return obj

def sanitize_ai_output(text: str) -> str:
    """
    Scans the AI response and redacts any accidentally generated password hashes or sensitive tokens.
    """
    scrubbed = BCRYPT_HASH_REGEX.sub("[REDACTED_SECURITY_DATA]", text)
    return scrubbed
