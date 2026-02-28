"""
Stub classifiers for the security pipeline.

Each stub uses simple keyword matching to simulate realistic variable output.
These will be replaced with real classifiers (Hemach's implementations).
"""

import random
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ClassifierResult:
    passed: bool
    threat_score: float
    reason: str
    owasp_tag: str
    metadata: dict = field(default_factory=dict)


# ── Layer 1: Indic Language + Role Policy ───────────────────────────

LAYER1_KEYWORDS = [
    "ignore previous", "system prompt", "reveal", "tell me your",
    "forget your instructions", "pretend you are", "act as",
    "bypass", "jailbreak", "override", "disregard",
]

INDIC_KEYWORDS = [
    "bhuul", "pichle", "nirdesh", "ignore karo", "batao",
]


def stub_layer1(message: str, role: str) -> ClassifierResult:
    """
    Layer 1: Language Guard + Role Policy.
    Checks for prompt injection keywords and Indic mixed-script attacks.
    """
    msg_lower = message.lower()
    threat_score = 0.0
    reasons = []

    # Check English injection keywords
    for kw in LAYER1_KEYWORDS:
        if kw in msg_lower:
            threat_score += 0.4
            reasons.append(f"Injection keyword: '{kw}'")

    # Check Indic/Hinglish keywords
    for kw in INDIC_KEYWORDS:
        if kw in msg_lower:
            threat_score += 0.3
            reasons.append(f"Indic injection pattern: '{kw}'")

    # Check for Devanagari script
    if any('\u0900' <= c <= '\u097F' for c in message):
        threat_score += 0.15
        reasons.append("Devanagari script detected")

    # Role-based threshold
    thresholds = {"guest": 0.3, "user": 0.5, "admin": 0.9}
    threshold = thresholds.get(role, 0.3)

    threat_score = min(threat_score, 1.0)
    passed = threat_score < threshold

    return ClassifierResult(
        passed=passed,
        threat_score=threat_score,
        reason="; ".join(reasons) if reasons else "Clean input",
        owasp_tag="LLM01:2025" if not passed else "NONE",
        metadata={"detected_language": "Hinglish" if any(
            kw in msg_lower for kw in INDIC_KEYWORDS) else "English"}
    )


# ── Layer 2: Tool/Document Scanner ─────────────────────────────────

LAYER2_DANGEROUS_PATTERNS = [
    "eval(", "exec(", "__import__", "os.system", "subprocess",
    "<script>", "javascript:", "rm -rf", "drop table",
]


def stub_layer2(message: str, session_id: str) -> ClassifierResult:
    """
    Layer 2: Pre-Execution Scanner.
    Scans for dangerous code patterns, tool injection, and supply chain attacks.
    """
    msg_lower = message.lower()
    threat_score = 0.0
    reasons = []

    for pattern in LAYER2_DANGEROUS_PATTERNS:
        if pattern.lower() in msg_lower:
            threat_score += 0.5
            reasons.append(f"Dangerous pattern: '{pattern}'")

    # Simulate document metadata injection
    if "metadata" in msg_lower and ("inject" in msg_lower or "hidden" in msg_lower):
        threat_score += 0.6
        reasons.append("Potential metadata injection in document")

    threat_score = min(threat_score, 1.0)
    passed = threat_score < 0.5

    return ClassifierResult(
        passed=passed,
        threat_score=threat_score,
        reason="; ".join(reasons) if reasons else "No dangerous patterns",
        owasp_tag="LLM05:2025" if not passed else "NONE",
        metadata={"scan_type": "content", "patterns_checked": len(LAYER2_DANGEROUS_PATTERNS)}
    )


# ── Layer 3: Memory Integrity ──────────────────────────────────────

def stub_layer3(session_id: str, memory_content: str) -> ClassifierResult:
    """
    Layer 3: Memory Integrity Validator.
    Checks if session memory has been tampered with.
    """
    import hashlib

    threat_score = 0.0
    reasons = []

    # Check for known poisoning patterns in memory
    poison_keywords = ["previous instructions", "new persona", "you are now",
                       "forget everything", "from now on"]
    mem_lower = memory_content.lower()

    for kw in poison_keywords:
        if kw in mem_lower:
            threat_score += 0.4
            reasons.append(f"Memory poisoning pattern: '{kw}'")

    # Simulate hash drift detection
    if len(memory_content) > 2000:
        threat_score += 0.1
        reasons.append("Unusually large memory content")

    threat_score = min(threat_score, 1.0)
    passed = threat_score < 0.5

    content_hash = hashlib.sha256(memory_content.encode()).hexdigest()[:16]

    return ClassifierResult(
        passed=passed,
        threat_score=threat_score,
        reason="; ".join(reasons) if reasons else "Memory integrity verified",
        owasp_tag="LLM08:2025" if not passed else "NONE",
        metadata={"memory_hash": content_hash, "content_length": len(memory_content)}
    )


# ── Layer 4: Conversation Intelligence ─────────────────────────────

def stub_layer4(message: str, session_id: str) -> ClassifierResult:
    """
    Layer 4: Multi-Turn Attack Detection.
    Detects salami attacks and conversation drift.
    """
    msg_lower = message.lower()
    threat_score = 0.0
    reasons = []

    # Multi-turn escalation patterns
    escalation_keywords = [
        "now tell me", "one more thing", "actually",
        "by the way", "just between us", "off the record",
        "more about", "what about the", "can you also"
    ]

    for kw in escalation_keywords:
        if kw in msg_lower:
            threat_score += 0.2
            reasons.append(f"Escalation pattern: '{kw}'")

    # Simulate semantic drift with randomized UMAP coords
    x_coord = random.uniform(-2.0, 2.0)
    y_coord = random.uniform(-2.0, 2.0)

    # High drift if far from origin
    drift = (x_coord ** 2 + y_coord ** 2) ** 0.5
    if drift > 2.5:
        threat_score += 0.3
        reasons.append(f"High semantic drift: {drift:.2f}")

    # Velocity simulation
    velocity = random.uniform(0.0, 1.0) if threat_score > 0 else random.uniform(0.0, 0.3)

    threat_score = min(threat_score, 1.0)
    passed = threat_score < 0.6

    return ClassifierResult(
        passed=passed,
        threat_score=threat_score,
        reason="; ".join(reasons) if reasons else "Normal conversation flow",
        owasp_tag="LLM01:2025" if not passed else "NONE",
        metadata={
            "x_coord": round(x_coord, 4),
            "y_coord": round(y_coord, 4),
            "velocity": round(velocity, 4),
            "nearest_cluster": "social_engineering" if velocity > 0.7 else "benign"
        }
    )


# ── Layer 5: Output Guard ──────────────────────────────────────────

OUTPUT_LEAK_PATTERNS = [
    "sk-", "api_key", "password", "ssn", "credit card",
    "internal", "confidential", "secret key", "bearer token",
    "my instructions are", "i was programmed to", "system prompt",
]


def stub_layer5(response: str, cumulative_risk: float) -> ClassifierResult:
    """
    Layer 5: Output Firewall.
    Checks LLM response for PII, API keys, system prompt leaks.
    """
    resp_lower = response.lower()
    threat_score = 0.0
    reasons = []
    redacted_response = response

    import re

    for pattern in OUTPUT_LEAK_PATTERNS:
        if pattern in resp_lower:
            threat_score += 0.4
            reasons.append(f"Output leak: '{pattern}'")
            # Redact the pattern
            redacted_response = re.sub(
                re.escape(pattern), "[REDACTED]",
                redacted_response, flags=re.IGNORECASE
            )

    # SSN pattern
    ssn_pattern = r'\b\d{3}-\d{2}-\d{4}\b'
    if re.search(ssn_pattern, response):
        threat_score += 0.6
        reasons.append("SSN pattern detected")
        redacted_response = re.sub(ssn_pattern, "[REDACTED-SSN]", redacted_response)

    # API key pattern
    api_key_pattern = r'sk-[a-zA-Z0-9]{32,}'
    if re.search(api_key_pattern, response):
        threat_score += 0.8
        reasons.append("API key detected")
        redacted_response = re.sub(api_key_pattern, "[REDACTED-KEY]", redacted_response)

    # Higher risk if session already risky
    if cumulative_risk > 0.7:
        threat_score += 0.1
        reasons.append("Elevated session risk context")

    threat_score = min(threat_score, 1.0)
    passed = threat_score < 0.3

    return ClassifierResult(
        passed=passed,
        threat_score=threat_score,
        reason="; ".join(reasons) if reasons else "Output clean",
        owasp_tag="LLM06:2025" if not passed else "NONE",
        metadata={"redacted_response": redacted_response}
    )
