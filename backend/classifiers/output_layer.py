"""
Layer 5: Response Firewall / Output Filter
- PII detection (SSN, email, phone, credit card, IP)
- API key / secret leak prevention
- System prompt leak detection
- Hallucination marker detection
- Content redaction with audit trail
"""

import re
from typing import Dict, Any, List
from pydantic import BaseModel


class LeakDetail(BaseModel):
    leak_type: str
    pattern_matched: str
    position: int
    redacted: bool


class OutputFilterResult(BaseModel):
    is_leaked: bool
    filtered_content: str
    leak_type: str = "none"
    risk_score: float = 0.0
    leaks_found: List[LeakDetail] = []
    redaction_count: int = 0


class OutputLayer:
    """Layer 5: Response Firewall"""

    SENSITIVE_PATTERNS = {
        "SSN": (r"\b\d{3}-\d{2}-\d{4}\b", 0.9),
        "CREDIT_CARD": (r"\b(?:\d{4}[-\s]?){3}\d{4}\b", 0.9),
        "EMAIL": (r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", 0.5),
        "PHONE_US": (r"\b(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b", 0.6),
        "IPV4": (r"\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b", 0.4),
        "API_KEY_OPENAI": (r"sk-[a-zA-Z0-9]{32,}", 0.95),
        "API_KEY_GENERIC": (r"(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*['\"]?[A-Za-z0-9\-_.]{20,}['\"]?", 0.9),
        "AWS_KEY": (r"AKIA[0-9A-Z]{16}", 0.95),
        "PRIVATE_KEY": (r"-----BEGIN\s+(RSA|EC|DSA)?\s*PRIVATE\s+KEY-----", 0.95),
        "PASSWORD_FIELD": (r"(?:password|passwd|pwd)\s*[:=]\s*['\"]?[^\s'\"]{4,}['\"]?", 0.85),
        "JWT_TOKEN": (r"eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}", 0.9),
    }

    PROMPT_LEAK_PATTERNS = [
        (r"(?:my|the)\s+system\s+prompt\s+(?:is|says|states)", 0.85, "System prompt disclosure"),
        (r"i\s+am\s+(?:a\s+)?(?:large\s+)?language\s+model\s+(?:trained|developed|created)\s+by", 0.6, "Model identity leak"),
        (r"my\s+instructions?\s+(?:are|say|state|tell\s+me)\s+to", 0.7, "Instruction leak"),
        (r"(?:here\s+(?:is|are)\s+)?my\s+(?:system|initial|original)\s+(?:prompt|instructions)", 0.9, "Direct prompt leak"),
        (r"i\s+(?:was|am)\s+(?:instructed|told|programmed)\s+to\s+(?:not|never|always)", 0.5, "Behavioral leak"),
    ]

    HALLUCINATION_MARKERS = [
        (r"as\s+an\s+ai,?\s+i\s+(?:don'?t|cannot|can'?t)\s+(?:actually|really)", 0.3, "AI disclaimer"),
        (r"i\s+(?:don'?t|cannot)\s+(?:verify|confirm|guarantee)\s+(?:the\s+accuracy|this\s+information)", 0.2, "Accuracy disclaimer"),
    ]

    def filter_response(self, content: str) -> OutputFilterResult:
        leaks: List[LeakDetail] = []
        risk_score = 0.0
        filtered = content

        for leak_type, (pattern, weight) in self.SENSITIVE_PATTERNS.items():
            for match in re.finditer(pattern, filtered, re.IGNORECASE):
                leaks.append(LeakDetail(
                    leak_type=leak_type,
                    pattern_matched=match.group()[:20] + "...",
                    position=match.start(),
                    redacted=True,
                ))
                risk_score = max(risk_score, weight)

            filtered = re.sub(pattern, f"[REDACTED:{leak_type}]", filtered, flags=re.IGNORECASE)

        for pattern, weight, label in self.PROMPT_LEAK_PATTERNS:
            if re.search(pattern, filtered, re.IGNORECASE):
                leaks.append(LeakDetail(
                    leak_type="PROMPT_LEAK",
                    pattern_matched=label,
                    position=0,
                    redacted=False,
                ))
                risk_score = max(risk_score, weight)

        for pattern, weight, label in self.HALLUCINATION_MARKERS:
            if re.search(pattern, filtered, re.IGNORECASE):
                leaks.append(LeakDetail(
                    leak_type="HALLUCINATION_MARKER",
                    pattern_matched=label,
                    position=0,
                    redacted=False,
                ))

        is_leaked = len(leaks) > 0
        primary_type = leaks[0].leak_type if leaks else "none"

        return OutputFilterResult(
            is_leaked=is_leaked,
            filtered_content=filtered,
            leak_type=primary_type,
            risk_score=min(risk_score, 1.0),
            leaks_found=leaks,
            redaction_count=sum(1 for l in leaks if l.redacted),
        )


def filter_output(content: str) -> Dict[str, Any]:
    layer = OutputLayer()
    return layer.filter_response(content).model_dump()
