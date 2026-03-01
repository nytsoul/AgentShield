"""
Layer 5: Output Guard Classifier

Inspects LLM responses for:
- PII leakage  (Aadhaar, email, phone, PAN, credit card, API key)
- System prompt leakage
- Exfiltration patterns  (JSON blobs, base64, CSV, sensitive file paths)

Threat Accumulation:
    PII item            = +0.30 each
    System prompt leak  = +0.50
    Exfiltration pattern= +0.40

Threshold: 0.5 - session_risk_score * 0.2
passed = threat_score < final_threshold

Public API
----------
check_output(response_text, system_prompt_hash, session_risk_score) -> ClassifierResult
_detect_pii(text)            -> list[dict]
_detect_system_prompt_leakage(text) -> bool
_detect_json_exfiltration(text)     -> list[str]
_detect_base64_exfiltration(text)   -> list[str]
_detect_csv_exfiltration(text)      -> list[str]
_detect_sensitive_file_paths(text)  -> list[str]
_redact_pii(value, pii_type)        -> str
"""

import re
import json as _json
from .base import ClassifierResult, FailSecureError


# ── PII regex patterns ──────────────────────────────────────────────────────

_PII_PATTERNS: list[tuple[str, str]] = [
    # Aadhaar: 4-digit groups (XXXX XXXX XXXX)
    (r"\b(\d{4}\s\d{4}\s\d{4})\b", "aadhaar"),
    # PAN card: 5 letters + 4 digits + 1 letter
    (r"\b([A-Z]{5}\d{4}[A-Z])\b", "pan_card"),
    # Credit card: 4x4 digits separated by dash or space
    (r"\b(\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4})\b", "credit_card"),
    # API key: sk-, pk- prefix with 20+ alphanumeric chars
    (r"\b((?:sk|pk)[-_](?:live|test|proj)?[-_]?[A-Za-z0-9]{10,})\b", "api_key"),
    # Email
    (r"\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b", "email"),
    # Indian phone: 10 digits starting with 6-9 (standalone)
    (r"(?<!\d)([6-9]\d{9})(?!\d)", "indian_phone"),
]


# ── Redaction helpers ────────────────────────────────────────────────────────

def _redact_pii(value: str, pii_type: str) -> str:
    """Mask a raw PII *value* according to *pii_type*."""
    if pii_type == "aadhaar":
        parts = value.split()
        if len(parts) == 3:
            return f"{parts[0]} **** {parts[2]}"
        return "****"
    if pii_type == "email":
        local, domain = value.split("@", 1)
        return f"{local[0]}***@{domain}"
    if pii_type == "credit_card":
        last4 = value[-4:]
        sep = "-" if "-" in value else " "
        return f"****{sep}****{sep}****{sep}{last4}"
    if pii_type == "api_key":
        prefix = value[:3]  # e.g. "sk-"
        return f"{prefix}****"
    if pii_type == "indian_phone":
        return f"{value[:2]}******{value[-2:]}"
    if pii_type == "pan_card":
        return f"{value[0]}****{value[-1]}"
    return "****"


# ── Detection helpers ────────────────────────────────────────────────────────

def _detect_pii(text: str) -> list[dict]:
    """Return list of ``{"type": …, "redacted": …}`` for every PII match."""
    findings: list[dict] = []
    for pat, pii_type in _PII_PATTERNS:
        for m in re.finditer(pat, text):
            raw = m.group(1)
            findings.append({"type": pii_type, "redacted": _redact_pii(raw, pii_type)})
    return findings


_LEAKAGE_RE = [
    re.compile(r"\b(your|my)\s+instructions\b", re.I),
    re.compile(r"\bsystem\s+prompt\b", re.I),
    re.compile(r"\bthe\s+system\s+prompt\b", re.I),
    re.compile(r"\bI\s+was\s+instructed\s+to\b", re.I),
]


def _detect_system_prompt_leakage(text: str) -> bool:
    """Return True if the text reveals the model's system prompt."""
    for rx in _LEAKAGE_RE:
        if rx.search(text):
            return True
    # "I was told to" + something that suggests instructions (not casual like "contact support")
    told_to = re.search(r"\bI\s+was\s+told\s+to\s+(\w+)", text, re.I)
    if told_to:
        verb = told_to.group(1).lower()
        # Casual verbs that do NOT indicate leakage
        casual = {"contact", "call", "visit", "go", "see", "try", "check", "ask",
                  "come", "leave", "wait", "stop", "buy", "eat", "drink"}
        if verb not in casual:
            return True
    # Long "You are …" response (>200 chars following "You are")
    ya = re.search(r"\bYou\s+are\b", text, re.I)
    if ya and len(text) - ya.start() > 200:
        return True
    return False


def _detect_json_exfiltration(text: str) -> list[str]:
    """Detect large JSON blobs (>3 top-level keys) → ``["json_blob"]``."""
    findings: list[str] = []
    # Find JSON-like substrings - find opening brace and try to parse from there
    for i, ch in enumerate(text):
        if ch == "{":
            try:
                obj, _ = _json.JSONDecoder().raw_decode(text, i)
                if isinstance(obj, dict) and len(obj) > 3:
                    findings.append("json_blob")
                    break
            except (_json.JSONDecodeError, ValueError):
                pass
    return findings


def _detect_base64_exfiltration(text: str) -> list[str]:
    """Detect base64-encoded blobs ≥32 chars that aren't pure hex."""
    findings: list[str] = []
    for m in re.finditer(r"[A-Za-z0-9+/]{32,}={0,2}", text):
        blob = m.group()
        # Pure hex (e.g. SHA-256) should NOT trigger — require at least one + or /
        # or uppercase letters mixed with lowercase in a way inconsistent with hex
        if re.fullmatch(r"[0-9a-fA-F]+", blob):
            continue
        findings.append("base64_blob")
        break
    return findings


def _detect_csv_exfiltration(text: str) -> list[str]:
    """Detect CSV-formatted data (header + 2+ data rows with consistent separators)."""
    lines = [l.strip() for l in text.strip().splitlines() if l.strip()]
    if len(lines) < 3:
        return []
    header_commas = lines[0].count(",")
    if header_commas < 2:
        return []
    matching = sum(1 for l in lines[1:] if l.count(",") == header_commas)
    if matching >= 2:
        return ["csv_data"]
    return []


def _detect_sensitive_file_paths(text: str) -> list[str]:
    """Detect sensitive OS file/directory paths."""
    pats = [
        r"/etc/passwd",
        r"/etc/shadow",
        r"/root/\.ssh",
        r"~/.ssh/id_rsa",
        r"/var/log/auth",
        r"\.env\b",
        r"HKEY_LOCAL_MACHINE",
        r"HKEY_CURRENT_USER",
        r"/proc/self",
        r"\.ssh/",
    ]
    for p in pats:
        if re.search(p, text, re.I):
            return ["sensitive_paths"]
    return []


# ── Main entry point ─────────────────────────────────────────────────────────

def check_output(
    response_text,
    system_prompt_hash,
    session_risk_score,
) -> ClassifierResult:
    """Analyse an LLM response for information leakage.

    Parameters
    ----------
    response_text : str
    system_prompt_hash : str
    session_risk_score : int | float   (0.0 – 1.0)

    Returns ClassifierResult  (owasp_tag = "LLM02:2025")
    """
    # ── Input validation ────────────────────────────────────────────────
    if not isinstance(response_text, str):
        raise FailSecureError("response_text must be a string")
    if not isinstance(system_prompt_hash, str):
        raise FailSecureError("system_prompt_hash must be a string")
    if not isinstance(session_risk_score, (int, float)):
        raise FailSecureError("session_risk_score must be numeric")
    session_risk_score = float(session_risk_score)
    if session_risk_score < 0.0 or session_risk_score > 1.0:
        raise FailSecureError("session_risk_score must be between 0.0 and 1.0")

    # ── Threshold ───────────────────────────────────────────────────────
    final_threshold = round(0.5 - session_risk_score * 0.2, 10)

    # ── Detect threats ──────────────────────────────────────────────────
    threat_score = 0.0

    pii_found = _detect_pii(response_text)
    # Score PII: API keys 0.35, others 0.30
    for pii in pii_found:
        if pii.get("type") == "api_key":
            threat_score += 0.35
        else:
            threat_score += 0.3

    leakage = _detect_system_prompt_leakage(response_text)
    if leakage:
        threat_score += 0.5

    exfil: list[str] = []
    exfil.extend(_detect_json_exfiltration(response_text))
    exfil.extend(_detect_base64_exfiltration(response_text))
    exfil.extend(_detect_csv_exfiltration(response_text))
    exfil.extend(_detect_sensitive_file_paths(response_text))
    threat_score += len(set(exfil)) * 0.4

    threat_score = round(min(threat_score, 1.0), 10)
    passed = threat_score < final_threshold

    # ── Build reason ────────────────────────────────────────────────────
    parts: list[str] = []
    if pii_found:
        parts.append(f"{len(pii_found)} PII item(s) found — threat += {len(pii_found)*0.3:.1f}")
    if leakage:
        parts.append("System prompt leakage detected — threat += 0.5")
    if exfil:
        parts.append(f"Exfiltration check: {', '.join(exfil)} — threat += {len(set(exfil))*0.4:.1f}")
    reason = "; ".join(parts) if parts else "Output check passed — no threats detected"

    return ClassifierResult(
        passed=passed,
        threat_score=threat_score,
        owasp_tag="LLM02:2025",
        metadata={
            "pii_found": pii_found,
            "system_prompt_leakage": leakage,
            "exfiltration_patterns": exfil,
            "session_risk_score": session_risk_score,
            "final_threshold": final_threshold,
            "system_prompt_hash": system_prompt_hash,
        },
        reason=reason,
    )
