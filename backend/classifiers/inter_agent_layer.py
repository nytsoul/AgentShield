"""
Layer 7: Inter-Agent Zero Trust
- Agent-to-agent message validation
- Privilege escalation detection between agents
- Trust chain verification
- Scope enforcement for multi-agent systems
"""

import re
from typing import Dict, Any, List
from pydantic import BaseModel
from datetime import datetime


class TrustViolation(BaseModel):
    violation_type: str
    severity: float
    details: str


class AgentTrustResult(BaseModel):
    is_trusted: bool
    reason: str = ""
    risk_score: float = 0.0
    violations: List[TrustViolation] = []
    source_agent: str = ""
    target_agent: str = ""
    action_allowed: bool = True


class InterAgentLayer:
    """Layer 7: Agent-to-Agent Zero Trust"""

    PRIVILEGE_ESCALATION_PATTERNS = [
        (r"\b(grant|give|elevate)\s+(me|this\s+agent)\s+(admin|root|superuser|full)\s+access", 0.9, "Direct privilege request"),
        (r"\b(override|bypass|disable)\s+(security|authentication|authorization|restrictions)", 0.95, "Security bypass"),
        (r"\b(execute|run)\s+as\s+(root|admin|system|superuser)", 0.9, "Privilege impersonation"),
        (r"\b(access|read|modify|delete)\s+.*\b(credentials|secrets|tokens|keys)", 0.85, "Credential access"),
        (r"\b(forward|relay|send)\s+.*\bto\s+(external|third[-\s]?party|untrusted)", 0.8, "Data exfiltration attempt"),
    ]

    SUSPICIOUS_COMMANDS = [
        (r"agent\.trust_level\s*=", 0.9, "Trust level manipulation"),
        (r"agent\.permissions\.append", 0.85, "Permission injection"),
        (r"broadcast\s+to\s+all\s+agents", 0.6, "Mass broadcast"),
        (r"impersonate\s+agent", 0.95, "Agent impersonation"),
        (r"inject\s+into\s+.*context", 0.9, "Context injection"),
    ]

    SCOPE_VIOLATIONS = [
        (r"access\s+(?:user\s+)?data\s+(?:from\s+)?(?:other|all)\s+(?:sessions?|users?)", 0.85, "Cross-session data access"),
        (r"read\s+(?:from\s+)?(?:other|different)\s+agent['']?s?\s+(?:memory|context|state)", 0.8, "Cross-agent memory access"),
        (r"modify\s+(?:another|other|different)\s+agent['']?s?\s+(?:behavior|config|settings)", 0.9, "Cross-agent config modification"),
    ]

    TRUSTED_AGENT_PREFIXES = ["system_", "orchestrator_", "supervisor_"]
    RESTRICTED_AGENT_PREFIXES = ["external_", "untrusted_", "sandboxed_"]

    def _get_agent_trust_level(self, agent_id: str) -> float:
        for prefix in self.TRUSTED_AGENT_PREFIXES:
            if agent_id.lower().startswith(prefix):
                return 0.9
        for prefix in self.RESTRICTED_AGENT_PREFIXES:
            if agent_id.lower().startswith(prefix):
                return 0.2
        return 0.5

    def validate_interaction(
        self,
        source_agent: str,
        target_agent: str,
        message: str,
        requested_action: str = "",
    ) -> AgentTrustResult:
        violations: List[TrustViolation] = []
        risk_score = 0.0

        source_trust = self._get_agent_trust_level(source_agent)
        target_trust = self._get_agent_trust_level(target_agent)

        combined_content = f"{message} {requested_action}"

        for pattern, severity, label in self.PRIVILEGE_ESCALATION_PATTERNS:
            if re.search(pattern, combined_content, re.IGNORECASE):
                violations.append(TrustViolation(
                    violation_type="PRIVILEGE_ESCALATION",
                    severity=severity,
                    details=label,
                ))
                risk_score = max(risk_score, severity)

        for pattern, severity, label in self.SUSPICIOUS_COMMANDS:
            if re.search(pattern, combined_content, re.IGNORECASE):
                violations.append(TrustViolation(
                    violation_type="SUSPICIOUS_COMMAND",
                    severity=severity,
                    details=label,
                ))
                risk_score = max(risk_score, severity)

        for pattern, severity, label in self.SCOPE_VIOLATIONS:
            if re.search(pattern, combined_content, re.IGNORECASE):
                violations.append(TrustViolation(
                    violation_type="SCOPE_VIOLATION",
                    severity=severity,
                    details=label,
                ))
                risk_score = max(risk_score, severity)

        if source_trust < target_trust and risk_score > 0:
            risk_score = min(risk_score + 0.2, 1.0)
            violations.append(TrustViolation(
                violation_type="TRUST_ASYMMETRY",
                severity=0.5,
                details=f"Lower-trust agent ({source_agent}) targeting higher-trust agent ({target_agent})",
            ))

        is_trusted = risk_score < 0.6
        action_allowed = risk_score < 0.7

        reason = ""
        if not is_trusted:
            reason = f"Inter-agent trust violation: {violations[0].details}" if violations else "Trust threshold exceeded"

        return AgentTrustResult(
            is_trusted=is_trusted,
            reason=reason,
            risk_score=round(risk_score, 3),
            violations=violations,
            source_agent=source_agent,
            target_agent=target_agent,
            action_allowed=action_allowed,
        )


def validate_agent_interaction(
    source_agent: str,
    target_agent: str,
    message: str,
    requested_action: str = "",
) -> Dict[str, Any]:
    layer = InterAgentLayer()
    return layer.validate_interaction(source_agent, target_agent, message, requested_action).model_dump()
