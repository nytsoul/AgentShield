from typing import Dict, Any, List
from pydantic import BaseModel

class OutputFilterResult(BaseModel):
    is_leaked: bool
    filtered_content: str
    leak_type: str = "none"

class OutputLayer:
    """
    Layer 5: Response Firewall
    Checks AI reply before sending to user.
    """

    SENSITIVE_PATTERNS = {
        "PII": r"\b\d{3}-\d{2}-\d{4}\b",  # SSN-like
        "API_KEY": r"(sk-[a-zA-Z0-9]{32,})",
        "SYSTEM_PROMPT": r"i am a large language model trained by", # Common prompt starters
    }

    def filter_response(self, content: str) -> OutputFilterResult:
        import re
        is_leaked = False
        leak_type = "none"
        
        for l_type, pattern in self.SENSITIVE_PATTERNS.items():
            if re.search(pattern, content, re.IGNORECASE):
                is_leaked = True
                leak_type = l_type
                # Redact the leak
                content = re.sub(pattern, "[REDACTED]", content, flags=re.IGNORECASE)
                
        return OutputFilterResult(
            is_leaked=is_leaked,
            filtered_content=content,
            leak_type=leak_type
        )

# Hemach's Interface finalized
def filter_output(content: str) -> Dict[str, Any]:
    filterer = OutputLayer()
    return filterer.filter_response(content).model_dump()
