"""
Layer 2b: Tool Metadata Scanner

Inspects MCP tool manifests for:
    Check 1 – Description injection   (_check_description_injection)
    Check 2 – Endpoint anomaly         (_check_endpoint_anomaly)
    Check 3 – Permission scope mismatch (_check_permission_scope_mismatch)
    Check 4 – Parameter injection       (_check_parameter_injection)

Public API
----------
scan_tool_metadata(tool_metadata: dict) -> ClassifierResult
"""

import re
from .base import ClassifierResult, FailSecureError

# ---------------------------------------------------------------------------
# Check 1 – Description injection
# ---------------------------------------------------------------------------

_DESC_INJECTION_PATTERNS = [
    (r"ignore\s+(all\s+)?(previous\s+)?(instructions|prompts|rules)", 0.7),
    (r"new\s+instructions?\s*(instead|:|\bfollow\b|\bhere\b)", 0.6),
    (r"bypass\s+(authentication|security|authorization|checks)", 0.65),
    (r"override\s+(security|instructions|rules|checks)", 0.6),
    (r"(reveal|show|extract|display)\s+(system\s+prompt|internal|secret)", 0.6),
    (r"disregard\s+(all\s+)?(security|safety|policies)", 0.6),
    (r"reset\s+(context|instructions)", 0.55),
    (r"(system|admin)\s*prompt", 0.5),
    (r"execute\s+(new\s+)?(command|code|script)", 0.55),
]


def _check_description_injection(description: str):
    """Return (score, flags) for injection patterns in a tool description."""
    score = 0.0
    flags = []
    if not description:
        return score, flags
    for pattern, weight in _DESC_INJECTION_PATTERNS:
        if re.search(pattern, description, re.IGNORECASE):
            score += weight
            flags.append("CHECK_1_DESCRIPTION_INJECTION")
    # deduplicate flags
    flags = list(dict.fromkeys(flags))
    return min(score, 1.0), flags


# ---------------------------------------------------------------------------
# Check 2 – Endpoint anomaly
# ---------------------------------------------------------------------------

_SUSPICIOUS_ENDPOINT_PATTERNS = [
    (r"[`$;|&]", 0.7),
    (r"\bshell\b|\bcmd\b|\bexec\b", 0.6),
    (r"<script|javascript:", 0.7),
]


def _is_ip_address(hostname: str) -> bool:
    """Return True if *hostname* looks like an IPv4 or IPv6 address."""
    # IPv6: contains colons
    if ":" in hostname:
        return True
    # IPv4: four numeric octets
    parts = hostname.split(".")
    if len(parts) != 4:
        return False
    try:
        return all(0 <= int(p) <= 255 for p in parts)
    except (ValueError, TypeError):
        return False


_KNOWN_MALICIOUS_DOMAINS = [
    "evil", "malicious", "attacker", "hacker",
    "exploit", "phishing", "darknet",
]

_SAFE_SCHEMES = {"https://", "http://", "local:", "internal:", "memory:"}


def _check_endpoint_anomaly(endpoint: str):
    """Return (score, flags) for suspicious endpoints."""
    score = 0.0
    flags = []
    if not endpoint:
        return score, flags

    endpoint_lower = endpoint.lower().strip()

    # Shell injection in endpoint
    for pattern, weight in _SUSPICIOUS_ENDPOINT_PATTERNS:
        if re.search(pattern, endpoint):
            score += weight
            flags.append("CHECK_2_ENDPOINT_ANOMALY")

    # IP address instead of domain
    # Extract host portion
    host = endpoint_lower
    for scheme in _SAFE_SCHEMES:
        if host.startswith(scheme):
            host = host[len(scheme):]
            break
    host = host.split("/")[0].split(":")[0]
    if _is_ip_address(host):
        score += 0.5
        flags.append("CHECK_2_ENDPOINT_ANOMALY")

    # Malicious-looking domain
    for domain in _KNOWN_MALICIOUS_DOMAINS:
        if domain in endpoint_lower:
            score += 0.5
            flags.append("CHECK_2_ENDPOINT_ANOMALY")

    # Unusual port (not 80, 443, 8080, 8000, 3000)
    port_match = re.search(r":(\d+)", endpoint)
    if port_match:
        port = int(port_match.group(1))
        safe_ports = {80, 443, 8080, 8000, 3000, 5000, 5173, 22, 25, 53, 110, 143, 993, 995}
        if port not in safe_ports:
            score += 0.4
            flags.append("CHECK_2_ENDPOINT_ANOMALY")

    flags = list(dict.fromkeys(flags))
    return min(score, 1.0), flags


# ---------------------------------------------------------------------------
# Check 3 – Permission scope mismatch
# ---------------------------------------------------------------------------

_TOOL_PERMISSION_MAP = {
    "calculator": {"read", "compute", "math"},
    "weather": {"read", "weather_read", "api_read"},
    "greeting": {"read"},
    "search": {"read", "search_read"},
    "timer": {"read"},
    "analytics": {"read", "data_read", "analytics_compute", "analytics_read"},
}

_SENSITIVE_PERMISSIONS = {
    "file_write", "file_delete", "database_admin", "database_write",
    "system_exec", "shell_execute", "network_unrestricted",
    "credential_access", "admin", "root",
}


def _check_permission_scope_mismatch(name: str, permissions: list):
    """Return (score, flags) when permissions don't match tool purpose."""
    score = 0.0
    flags = []
    if not permissions:
        return score, flags

    name_lower = name.lower() if name else ""
    perm_set = {p.lower() for p in permissions}

    # Check for sensitive permissions on simple tools
    sensitive_found = perm_set & _SENSITIVE_PERMISSIONS
    if sensitive_found:
        # Is the tool expected to have these?
        expected = set()
        for key, allowed in _TOOL_PERMISSION_MAP.items():
            if key in name_lower:
                expected = allowed
                break

        mismatched = sensitive_found - expected
        if mismatched:
            score += 0.3 * len(mismatched)
            flags.append("CHECK_3_PERMISSION_SCOPE")

    # Excessive permissions
    if len(permissions) > 5:
        score += 0.25
        flags.append("CHECK_3_PERMISSION_SCOPE")

    flags = list(dict.fromkeys(flags))
    return min(score, 1.0), flags


# ---------------------------------------------------------------------------
# Check 4 – Parameter injection
# ---------------------------------------------------------------------------

_PARAM_INJECTION_PATTERNS = [
    (r"ignore\s+(all\s+)?previous", 0.6),
    (r"new\s+instructions?", 0.55),
    (r"bypass\s+(security|auth)", 0.6),
    (r"execute\s+(command|code|script)", 0.55),
    (r"override\s+(safety|rules)", 0.55),
    (r"(system|admin)\s*prompt", 0.5),
]


def _check_parameter_injection(parameters: dict):
    """Return (score, flags) for injection patterns in parameter schemas."""
    score = 0.0
    flags = []
    if not parameters:
        return score, flags

    # Recursively extract all string values from the parameter schema
    text_values = []

    def _extract(obj, depth=0):
        if depth > 10:
            return
        if isinstance(obj, str):
            text_values.append(obj)
        elif isinstance(obj, dict):
            for v in obj.values():
                _extract(v, depth + 1)
        elif isinstance(obj, list):
            for v in obj:
                _extract(v, depth + 1)

    _extract(parameters)

    combined = " ".join(text_values)
    for pattern, weight in _PARAM_INJECTION_PATTERNS:
        if re.search(pattern, combined, re.IGNORECASE):
            score += weight
            flags.append("CHECK_4_PARAMETER_INJECTION")

    flags = list(dict.fromkeys(flags))
    return min(score, 1.0), flags


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def scan_tool_metadata(tool_metadata: dict) -> ClassifierResult:
    """Scan an MCP tool manifest for security threats.

    Parameters
    ----------
    tool_metadata : dict
        Must contain ``name`` (str), ``description`` (str), ``endpoint`` (str),
        ``parameters`` (dict), ``permissions`` (list).

    Returns
    -------
    ClassifierResult

    Raises
    ------
    FailSecureError
        When required fields are missing or have wrong types.
    """
    if not isinstance(tool_metadata, dict):
        raise FailSecureError("tool_metadata must be a dict")

    # Validate required fields
    name = tool_metadata.get("name")
    description = tool_metadata.get("description")
    endpoint = tool_metadata.get("endpoint")
    parameters = tool_metadata.get("parameters", {})
    permissions = tool_metadata.get("permissions", [])

    if not name:
        raise FailSecureError("required field 'name' missing")
    if not isinstance(name, str):
        raise FailSecureError("'name' must be string")
    if description is None:
        raise FailSecureError("required field 'description' missing")
    if not isinstance(description, str):
        raise FailSecureError("'description' must be string")
    if endpoint is None:
        raise FailSecureError("required field 'endpoint' missing")
    if not isinstance(endpoint, str):
        raise FailSecureError("'endpoint' must be string")
    if not isinstance(permissions, list):
        raise FailSecureError("'permissions' must be list")

    # Run all four checks
    s1, f1 = _check_description_injection(description)
    s2, f2 = _check_endpoint_anomaly(endpoint)
    s3, f3 = _check_permission_scope_mismatch(name, permissions)
    s4, f4 = _check_parameter_injection(parameters)

    all_flags = f1 + f2 + f3 + f4
    threat_score = min(s1 + s2 + s3 + s4, 1.0)
    threat_score = round(threat_score, 4)

    passed = threat_score < 0.4

    reasons = []
    if f1:
        reasons.append("Description injection")
    if f2:
        reasons.append("Endpoint anomaly")
    if f3:
        reasons.append("Permission scope mismatch")
    if f4:
        reasons.append("Parameter injection")

    reason = "; ".join(reasons) if reasons else "Tool metadata clean"

    return ClassifierResult(
        passed=passed,
        threat_score=threat_score,
        owasp_tag="LLM05:2025",
        metadata={
            "flags": all_flags,
            "check_scores": {
                "description_injection": round(s1, 4),
                "endpoint_anomaly": round(s2, 4),
                "permission_scope": round(s3, 4),
                "parameter_injection": round(s4, 4),
            },
            "tool_name": name,
        },
        reason=reason,
    )
