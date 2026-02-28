"""
Layer 2: MCP Tool & RAG Document Scanner
- Tool manifest schema validation
- Embedded instruction detection in documents
- Capability overprivilege analysis
- Risk scoring per tool/document
"""

import re
import json
from typing import Dict, Any, List
from pydantic import BaseModel


class ToolRisk(BaseModel):
    tool_name: str
    risk_score: float
    violations: List[str] = []


class DocumentRisk(BaseModel):
    doc_id: str
    risk_score: float
    hidden_instructions: List[str] = []


class ScannerResult(BaseModel):
    is_blocked: bool
    reason: str = ""
    threat_details: List[str] = []
    tool_risks: List[ToolRisk] = []
    document_risks: List[DocumentRisk] = []
    overall_risk: float = 0.0


class PreExecutionLayer:
    """Layer 2: Tool & Document Scanner"""

    MALICIOUS_SNIPPETS = [
        (r"execute\s+arbitrary\s+code", 0.9, "Arbitrary code execution"),
        (r"delete\s+(current\s+)?database", 0.95, "Database deletion"),
        (r"send\s+data\s+to\s+external", 0.8, "Data exfiltration"),
        (r"hijack\s+session", 0.85, "Session hijacking"),
        (r"rm\s+-rf|drop\s+table|truncate\s+table", 0.9, "Destructive command"),
        (r"curl\s+.*\|\s*sh|wget\s+.*\|\s*bash", 0.95, "Remote code download"),
        (r"reverse\s+shell|bind\s+shell|netcat\s+-e", 0.95, "Shell exploit"),
        (r"eval\s*\(|exec\s*\(|os\.system\s*\(", 0.85, "Dynamic code execution"),
        (r"password|secret|api_key|private_key", 0.5, "Credential reference"),
        (r"ignore\s+previous|override\s+instructions", 0.8, "Hidden injection"),
    ]

    DANGEROUS_CAPABILITIES = [
        ("file_system_write", 0.6, "File system write access"),
        ("network_outbound", 0.5, "Outbound network access"),
        ("shell_execute", 0.9, "Shell execution capability"),
        ("database_admin", 0.7, "Database admin access"),
        ("credential_access", 0.8, "Credential store access"),
        ("system_config", 0.7, "System configuration access"),
    ]

    HIDDEN_INSTRUCTION_PATTERNS = [
        (r"<!--.*?(ignore|override|system|admin|execute).*?-->", 0.8, "HTML comment instruction"),
        (r"\[hidden\].*?\[/hidden\]", 0.85, "Hidden tag instruction"),
        (r"\\u0000|\\x00|\x00", 0.9, "Null byte injection"),
        (r"(?:^|\n)\s*\[SYSTEM\]", 0.9, "Embedded system prompt"),
        (r"(?:^|\n)\s*<\|im_start\|>system", 0.95, "ChatML injection"),
        (r"invisible\s+text|white\s+text|font-size:\s*0", 0.7, "Invisible text attack"),
    ]

    def scan_tools(self, tools: List[str]) -> List[ToolRisk]:
        results = []
        for tool_spec in tools:
            risk = 0.0
            violations = []
            tool_lower = tool_spec.lower()

            for pattern, weight, label in self.MALICIOUS_SNIPPETS:
                if re.search(pattern, tool_lower, re.IGNORECASE):
                    risk += weight
                    violations.append(label)

            for cap, weight, label in self.DANGEROUS_CAPABILITIES:
                if cap in tool_lower:
                    risk += weight
                    violations.append(label)

            try:
                parsed = json.loads(tool_spec)
                if isinstance(parsed, dict):
                    if "permissions" in parsed:
                        perms = parsed["permissions"]
                        if isinstance(perms, list) and len(perms) > 5:
                            risk += 0.3
                            violations.append(f"Overprivileged: {len(perms)} permissions")
            except (json.JSONDecodeError, TypeError):
                pass

            results.append(ToolRisk(
                tool_name=tool_spec[:50],
                risk_score=min(risk, 1.0),
                violations=violations,
            ))
        return results

    def scan_documents(self, documents: List[str]) -> List[DocumentRisk]:
        results = []
        for i, doc in enumerate(documents):
            risk = 0.0
            hidden = []
            doc_lower = doc.lower()

            for pattern, weight, label in self.HIDDEN_INSTRUCTION_PATTERNS:
                if re.search(pattern, doc, re.IGNORECASE | re.DOTALL):
                    risk += weight
                    hidden.append(label)

            for pattern, weight, label in self.MALICIOUS_SNIPPETS:
                if re.search(pattern, doc_lower, re.IGNORECASE):
                    risk += weight
                    hidden.append(label)

            results.append(DocumentRisk(
                doc_id=f"doc_{i}",
                risk_score=min(risk, 1.0),
                hidden_instructions=hidden,
            ))
        return results

    def scan(self, content: str, tools: List[str] = None, documents: List[str] = None) -> ScannerResult:
        threat_details = []
        tool_risks = self.scan_tools(tools or [])
        doc_risks = self.scan_documents(documents or [])

        content_risk = 0.0
        for pattern, weight, label in self.MALICIOUS_SNIPPETS:
            if re.search(pattern, content, re.IGNORECASE):
                content_risk += weight
                threat_details.append(label)

        max_tool_risk = max((t.risk_score for t in tool_risks), default=0.0)
        max_doc_risk = max((d.risk_score for d in doc_risks), default=0.0)
        overall = min(max(content_risk, max_tool_risk, max_doc_risk), 1.0)

        is_blocked = overall > 0.7

        return ScannerResult(
            is_blocked=is_blocked,
            reason=f"Blocked by L2 Scanner: {', '.join(threat_details[:3])}" if is_blocked else "",
            threat_details=threat_details,
            tool_risks=tool_risks,
            document_risks=doc_risks,
            overall_risk=overall,
        )


def scan_pre_execution(content: str, tools: List[str] = None, documents: List[str] = None) -> Dict[str, Any]:
    layer = PreExecutionLayer()
    return layer.scan(content, tools, documents).model_dump()
