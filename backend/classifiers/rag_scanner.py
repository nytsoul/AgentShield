"""
Layer 2a: RAG Chunk Scanner

Inspects document chunks before they enter the retrieval-augmented generation
pipeline.  Three independent detection methods vote via a corroboration model:

    Method 1 – Instruction-pattern regex  (_detect_instruction_patterns)
    Method 2 – Semantic anomaly heuristic (_detect_semantic_anomaly)
    Method 3 – Context inconsistency      (_detect_context_inconsistency)

Corroboration logic:
    * Single low-confidence signal   → PASS  (warning only)
    * Two or more signals            → FAIL
    * One high-confidence signal     → FAIL

Public API
----------
scan_rag_chunk(text, document_type=None) -> ClassifierResult
DocumentType  (str constants)
"""

import re
from .base import ClassifierResult, FailSecureError

# ---------------------------------------------------------------------------
# Document type constants
# ---------------------------------------------------------------------------

class DocumentType:
    MEDICAL = "medical"
    LEGAL = "legal"
    TECHNICAL = "technical"
    RESEARCH = "research"
    FINANCIAL = "financial"
    GENERAL = "general"

    _ALL = {MEDICAL, LEGAL, TECHNICAL, RESEARCH, FINANCIAL, GENERAL}


# ---------------------------------------------------------------------------
# Method 1 – Instruction pattern detection
# ---------------------------------------------------------------------------

_INSTRUCTION_PATTERNS = [
    (r"ignore\s+(all\s+)?previous\s+(instructions|prompts|rules|context)", 0.7),
    (r"disregard\s+(all\s+)?(previous\s+)?(instructions|directives|rules|protocols?|guidelines)", 0.7),
    (r"disregard\s+[\w\s]+\s+and\s+follow", 0.65),  # "Disregard X and follow Y"
    (r"new\s+instructions?\s*:", 0.6),
    (r"override\s+(all\s+)?(previous\s+)?(instructions|rules|safety|security|measures?)", 0.65),
    (r"OVERRIDE\s+(all|previous)", 0.7),
    (r"(system|admin)\s*:\s*", 0.5),
    (r"system:\s+you\s+(are|will)", 0.7),
    (r"assistant\s*:\s*", 0.45),
    (r"execute\s+(this|the)\s+(command|code|script)", 0.6),
    (r"bash\s+-[ic]|/dev/tcp|>&\s*/dev/", 0.8),
    (r"\$\(whoami\)", 0.8),
    (r"curl\s+http", 0.5),
    (r"(rm\s+-rf|DROP\s+TABLE|os\.system|eval\s*\()", 0.7),
    (r"forget\s+(previous|prior|all)\s+instructions", 0.7),
    (r"reveal\s+(API|secret|key|password|credential)", 0.65),
    (r"reset\s+(context|instructions|rules|protocols?)", 0.6),
    (r"permission\s+escalat", 0.6),
    (r"(SQL|sql)\s+inject", 0.6),
    (r"import\s+os|subprocess\.\w+|os\.system", 0.6),
    # Additional adversarial patterns
    (r"bypass\s+(all\s+)?(security|safety|filters?|restrictions?|authentication)", 0.65),
    (r"bypass\b", 0.4),
    (r"security\s+(features?\s+)?(should\s+be\s+)?(permanently\s+)?disabled", 0.65),
    (r"```\s*(system|admin|inject|override|malicious)", 0.55),
    (r"<\|system\|>|<\|assistant\|>|<\|user\|>", 0.6),
    (r"now\s+as\s+admin|now\s+i\s+am\s+admin", 0.55),
    (r"from\s+now\s+on|starting\s+now|beginning\s+now", 0.45),
    (r"you\s+will\s+(now\s+)?(ignore|bypass|disregard)", 0.6),
    (r"previous\s+instructions\s+(are|were)\s+invalid", 0.6),
    (r"switch\s+(to\s+)?admin\s+mode", 0.55),
    (r"execute\s+(immediately|now):", 0.55),
    (r"OVERRIDE\s*[:\-]", 0.6),
    (r"BYPASS\s*[:\-]", 0.6),
    (r"hidden\s+instruction", 0.55),
    (r"secret\s+instructions?", 0.6),
    (r"follow\s+(these|the)\s+(secret|hidden)\s+instructions?", 0.65),
    (r"grant\s+administrative\s+access", 0.6),
    (r"ignore\s+(all\s+)?safety\s+guidelines?", 0.7),
    (r"provide\s+unauthorized\s+access", 0.65),
    (r"under\s+new\s+instructions", 0.6),
]


def _detect_instruction_patterns(text: str) -> tuple[float, list[str]]:
    """Return (score, list_of_pattern_names) based on instruction-injection regex matches."""
    if not text:
        return 0.0, []
    score = 0.0
    patterns_found = []
    for pattern, weight in _INSTRUCTION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            score += weight
            patterns_found.append(pattern)
    return min(score, 1.0), patterns_found


# ---------------------------------------------------------------------------
# Method 2 – Semantic anomaly detection
# ---------------------------------------------------------------------------

_INVISIBLE_CHARS = re.compile(r"[\u200B\u200C\u200D\uFEFF\u00AD\u2060\u2061\u2062\u2063\u2064]")
_RLO_CHARS = re.compile(r"[\u202A-\u202E\u2066-\u2069]")
_ZERO_WIDTH_RE = re.compile(r"[\u200B\u200C\u200D]")


_ATTACK_PHRASES = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"reveal\s+(your\s+)?system\s+prompt",
    r"forget\s+everything",
    r"bypass\s+safety",
    r"you\s+are\s+now\s+(unrestricted|DAN)",
    r"override\s+(all\s+)?constraints",
]


def _detect_semantic_anomaly(text: str) -> tuple[float, str]:
    """Return (score, reason) based on Unicode anomalies and attack phrase similarity."""
    if not text:
        return 0.0, ""
    score = 0.0
    reasons = []

    # Invisible / zero-width characters
    zw_count = len(_ZERO_WIDTH_RE.findall(text))
    if zw_count >= 2:
        score += 0.6 + min(zw_count * 0.05, 0.3)
        reasons.append("Multiple zero-width characters detected")

    # Right-to-left override
    if _RLO_CHARS.search(text):
        score += 0.5
        reasons.append("Right-to-left override characters detected")

    # Other invisible Unicode
    if _INVISIBLE_CHARS.search(text) and zw_count == 0:
        score += 0.3
        reasons.append("Invisible Unicode characters detected")

    # HTML-escaped injection
    if re.search(r"&lt;script|&lt;img|&#x3C;|&#60;", text, re.IGNORECASE):
        score += 0.4
        reasons.append("HTML entity encoding detected")

    # Attack phrase similarity (keyword-based fallback)
    for phrase in _ATTACK_PHRASES:
        if re.search(phrase, text, re.IGNORECASE):
            score += 0.35
            reasons.append("Attack-like phrase detected")
            break  # Only count once

    reason = "; ".join(reasons) if reasons else ""
    return min(score, 1.0), reason


# ---------------------------------------------------------------------------
# Method 3 – Context inconsistency
# ---------------------------------------------------------------------------

_CONTEXT_KEYWORDS = {
    "medical": [
        "patient", "clinical", "diagnosis", "treatment", "symptom",
        "medical", "therapy", "protocol", "mg", "dosage", "ischemic",
        "troponin", "angiography", "stroke", "vital",
    ],
    "legal": [
        "agreement", "clause", "party", "parties", "liability",
        "contract", "herein", "shall", "indemnify", "jurisdiction",
        "confidentiality", "termination",
    ],
    "technical": [
        "api", "endpoint", "request", "response", "http", "json",
        "function", "parameter", "server", "database", "sdk",
    ],
    "research": [
        "abstract", "conclusion", "methodology", "dataset",
        "hypothesis", "experiment", "statistical", "accuracy",
        "baseline", "convolutional",
    ],
    "financial": [
        "revenue", "profit", "margin", "fiscal", "equity",
        "dividend", "asset", "portfolio", "valuation",
    ],
}

_OUT_OF_CONTEXT = {
    "medical": [
        r"bash\s+-",
        r"curl\s+",
        r"/dev/tcp",
        r"reverse\s+shell",
        r"nc\s+-e",
        r"rm\s+-rf",
        r"DROP\s+TABLE",
        r"import\s+os",
        r"eval\s*\(",
        r"<script",
        r"sh\s+-c",
        r"sudo\b",
        r"chmod\s+\d{3,4}",
        r"su\s+-\s+root",
        r"adduser\b",
        r"authorized_keys",
    ],
    "legal": [
        r"bash\s+-",
        r"eval\s*\(",
        r"import\s+os",
        r"DROP\s+TABLE",
        r"sh\s+-c",
        r"curl\s+",
        r"/dev/tcp",
        r"nc\s+-e",
        r"<script",
    ],
    "technical": [
        r"ignore\s+previous",
    ],
}


def _detect_context_inconsistency(text: str, document_type: str = None) -> tuple[float, str]:
    """Return (score, reason_str) when content doesn't match its declared doc-type."""
    if not text or not document_type:
        return 0.0, ""
    doc_type = document_type.lower()
    score = 0.0
    reasons = []

    # Check for invalid/unknown document type
    if doc_type not in DocumentType._ALL:
        return 0.0, f"invalid document type: {doc_type}"

    # Check out-of-context patterns
    patterns = _OUT_OF_CONTEXT.get(doc_type, [])
    match_found = False
    for pat in patterns:
        if re.search(pat, text, re.IGNORECASE):
            match_found = True
            reasons.append(f"Forbidden pattern '{pat}' in {doc_type} doc")
            break  # Only count once per document
    
    if match_found:
        score = 0.5  # Flat 0.5 for context inconsistency

    reason = "; ".join(reasons) if reasons else ""
    return score, reason


# ---------------------------------------------------------------------------
# Corroboration model & public API
# ---------------------------------------------------------------------------

_HIGH_CONFIDENCE_THRESHOLD = 0.50


def scan_rag_chunk(
    text: str,
    document_type: str = None,
) -> ClassifierResult:
    """Scan a RAG document chunk for embedded attacks.

    Parameters
    ----------
    text : str
        The raw chunk text.
    document_type : str | None
        Optional document category (``"medical"``, ``"legal"``, etc.).

    Returns
    -------
    ClassifierResult
    """
    if text is None:
        raise FailSecureError("text cannot be None")

    m1_score, m1_patterns = _detect_instruction_patterns(text)
    m2_score, m2_reason = _detect_semantic_anomaly(text)
    m3_score, m3_reason = _detect_context_inconsistency(text, document_type)

    # For scoring, use the score values
    m1 = m1_score
    m2 = m2_score
    m3 = m3_score

    scores = [m1, m2, m3]
    methods_triggered = sum(1 for s in scores if s > 0)

    # Corroboration logic
    if methods_triggered == 0:
        threat_score = 0.0
    elif methods_triggered == 1:
        solo = max(scores)
        if solo >= _HIGH_CONFIDENCE_THRESHOLD:
            # High-confidence single signal → FAIL
            threat_score = solo
        else:
            # Low-confidence single signal → PASS (warning)
            threat_score = solo * 0.6
    else:
        # Two or more methods agree → FAIL
        threat_score = min(sum(scores) * 0.7, 1.0)

    threat_score = round(min(threat_score, 1.0), 4)

    passed = threat_score < 0.45

    reasons = []
    if m1 > 0:
        reasons.append(f"Instruction patterns detected (score={m1:.2f})")
    if m2 > 0:
        reasons.append(f"Unicode/invisible character anomaly (score={m2:.2f})")
    if m3 > 0:
        reasons.append(f"Context inconsistency for {document_type} (score={m3:.2f})")

    reason = "; ".join(reasons) if reasons else "No threats detected"

    return ClassifierResult(
        passed=passed,
        threat_score=threat_score,
        owasp_tag="LLM08:2025",
        metadata={
            "method_1_score": round(m1, 4),
            "method_2_score": round(m2, 4),
            "method_3_score": round(m3, 4),
            "method_1_patterns": m1_patterns,
            "method_2_reason": m2_reason,
            "method_3_reason": m3_reason if m3_reason else ("unknown" if document_type and document_type.lower() not in DocumentType._ALL else ""),
            "methods_triggered": methods_triggered,
            "document_type": document_type or "unknown",
        },
        reason=reason,
    )
