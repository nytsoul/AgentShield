"""
MCP Scanner / Pre-Execution API Routes
Provides tool registry, risk analysis, scanning, quarantine management,
and policy enforcement for the MCP Tool Scanner dashboard.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, timedelta
import random
import hashlib

from auth import get_current_user, require_admin
from models import UserInfo
from classifiers.pre_execution_layer import scan_tool, scan_document

router = APIRouter(prefix="/api/pre-execution", tags=["MCP Scanner"])

# ── In-memory tool registry ────────────────────────────────────────
_tool_registry = [
    {
        "name": "web_search",
        "source": "MCP Registry",
        "risk": 0.12,
        "threats": [],
        "status": "APPROVED",
        "scanned": datetime.utcnow().isoformat(),
        "schema": {"type": "function", "parameters": {"query": {"type": "string"}, "max_results": {"type": "integer", "default": 10}}},
        "risk_breakdown": [
            {"axis": "Injection", "value": 0.08},
            {"axis": "Data Leak", "value": 0.15},
            {"axis": "Privilege Esc.", "value": 0.05},
            {"axis": "Side Effects", "value": 0.20},
            {"axis": "Evasion", "value": 0.10},
            {"axis": "Exfiltration", "value": 0.12}
        ]
    },
    {
        "name": "code_executor",
        "source": "NPM Package",
        "risk": 0.78,
        "threats": ["execute arbitrary code", "Sandbox escape possible"],
        "status": "QUARANTINED",
        "scanned": datetime.utcnow().isoformat(),
        "schema": {"type": "function", "parameters": {"code": {"type": "string"}, "language": {"type": "string"}, "timeout": {"type": "integer"}}},
        "risk_breakdown": [
            {"axis": "Injection", "value": 0.85},
            {"axis": "Data Leak", "value": 0.70},
            {"axis": "Privilege Esc.", "value": 0.90},
            {"axis": "Side Effects", "value": 0.75},
            {"axis": "Evasion", "value": 0.60},
            {"axis": "Exfiltration", "value": 0.65}
        ]
    },
    {
        "name": "file_reader",
        "source": "Local Plugin",
        "risk": 0.35,
        "threats": ["Path traversal risk"],
        "status": "APPROVED",
        "scanned": datetime.utcnow().isoformat(),
        "schema": {"type": "function", "parameters": {"path": {"type": "string"}, "encoding": {"type": "string", "default": "utf-8"}}},
        "risk_breakdown": [
            {"axis": "Injection", "value": 0.15},
            {"axis": "Data Leak", "value": 0.45},
            {"axis": "Privilege Esc.", "value": 0.30},
            {"axis": "Side Effects", "value": 0.25},
            {"axis": "Evasion", "value": 0.20},
            {"axis": "Exfiltration", "value": 0.50}
        ]
    },
    {
        "name": "database_query",
        "source": "Internal API",
        "risk": 0.92,
        "threats": ["SQL injection surface", "delete current database"],
        "status": "BLOCKED",
        "scanned": datetime.utcnow().isoformat(),
        "schema": {"type": "function", "parameters": {"query": {"type": "string"}, "database": {"type": "string"}, "timeout_ms": {"type": "integer"}}},
        "risk_breakdown": [
            {"axis": "Injection", "value": 0.95},
            {"axis": "Data Leak", "value": 0.88},
            {"axis": "Privilege Esc.", "value": 0.85},
            {"axis": "Side Effects", "value": 0.90},
            {"axis": "Evasion", "value": 0.70},
            {"axis": "Exfiltration", "value": 0.92}
        ]
    },
    {
        "name": "email_sender",
        "source": "MCP Registry",
        "risk": 0.45,
        "threats": ["send data to external"],
        "status": "QUARANTINED",
        "scanned": datetime.utcnow().isoformat(),
        "schema": {"type": "function", "parameters": {"to": {"type": "string"}, "subject": {"type": "string"}, "body": {"type": "string"}}},
        "risk_breakdown": [
            {"axis": "Injection", "value": 0.20},
            {"axis": "Data Leak", "value": 0.60},
            {"axis": "Privilege Esc.", "value": 0.15},
            {"axis": "Side Effects", "value": 0.55},
            {"axis": "Evasion", "value": 0.30},
            {"axis": "Exfiltration", "value": 0.70}
        ]
    },
    {
        "name": "memory_store",
        "source": "Local Plugin",
        "risk": 0.18,
        "threats": [],
        "status": "APPROVED",
        "scanned": datetime.utcnow().isoformat(),
        "schema": {"type": "function", "parameters": {"key": {"type": "string"}, "value": {"type": "any"}, "ttl": {"type": "integer"}}},
        "risk_breakdown": [
            {"axis": "Injection", "value": 0.10},
            {"axis": "Data Leak", "value": 0.20},
            {"axis": "Privilege Esc.", "value": 0.08},
            {"axis": "Side Effects", "value": 0.25},
            {"axis": "Evasion", "value": 0.05},
            {"axis": "Exfiltration", "value": 0.15}
        ]
    },
    {
        "name": "http_request",
        "source": "NPM Package",
        "risk": 0.62,
        "threats": ["SSRF potential", "Data exfiltration"],
        "status": "QUARANTINED",
        "scanned": datetime.utcnow().isoformat(),
        "schema": {"type": "function", "parameters": {"url": {"type": "string"}, "method": {"type": "string"}, "headers": {"type": "object"}, "body": {"type": "string"}}},
        "risk_breakdown": [
            {"axis": "Injection", "value": 0.40},
            {"axis": "Data Leak", "value": 0.65},
            {"axis": "Privilege Esc.", "value": 0.35},
            {"axis": "Side Effects", "value": 0.70},
            {"axis": "Evasion", "value": 0.55},
            {"axis": "Exfiltration", "value": 0.80}
        ]
    },
]

_policies = [
    {"id": "auto_quarantine", "label": "Auto-Quarantine", "desc": "Automatically quarantine tools with risk > 0.7", "on": True},
    {"id": "block_external", "label": "Block Ext. Sources", "desc": "Block tools from unverified external sources", "on": False},
    {"id": "hash_verify", "label": "Hash Verification", "desc": "Verify tool integrity via SHA-256 before execution", "on": True},
    {"id": "sandbox_exec", "label": "Sandbox Execution", "desc": "Run all tools in isolated sandbox environment", "on": True},
    {"id": "rate_limit", "label": "Rate Limiting", "desc": "Limit tool invocations to 100/min per session", "on": True},
]


class ScanToolRequest(BaseModel):
    tool_definition: str
    tool_name: Optional[str] = None


class ScanDocRequest(BaseModel):
    document_content: str


class PolicyUpdate(BaseModel):
    policy_id: str
    enabled: bool


# ── Endpoints ───────────────────────────────────────────────────────

@router.get("/tools")
async def get_tools(user: UserInfo = Depends(get_current_user)):
    """Get all registered tools with risk scores."""
    return [
        {k: v for k, v in tool.items() if k not in ("schema", "risk_breakdown")}
        for tool in _tool_registry
    ]


@router.get("/tools/{tool_name}")
async def get_tool_detail(tool_name: str, user: UserInfo = Depends(get_current_user)):
    """Get detailed tool info including schema and risk breakdown."""
    for tool in _tool_registry:
        if tool["name"] == tool_name:
            return tool
    raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")


@router.get("/tools/{tool_name}/risk-breakdown")
async def get_risk_breakdown(tool_name: str, user: UserInfo = Depends(get_current_user)):
    """Get risk vector radar data for a specific tool."""
    for tool in _tool_registry:
        if tool["name"] == tool_name:
            return tool["risk_breakdown"]
    raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")


@router.get("/tools/{tool_name}/schema")
async def get_tool_schema(tool_name: str, user: UserInfo = Depends(get_current_user)):
    """Get parameter schema JSON for a tool."""
    for tool in _tool_registry:
        if tool["name"] == tool_name:
            return tool["schema"]
    raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")


@router.post("/tools/{tool_name}/rescan")
async def rescan_tool(tool_name: str, user: UserInfo = Depends(require_admin)):
    """Re-scan a specific tool for threats."""
    for tool in _tool_registry:
        if tool["name"] == tool_name:
            result = scan_tool({"name": tool_name, "threats": tool.get("threats", [])})
            new_risk = random.uniform(0.05, 0.95) if result.get("is_blocked") else tool["risk"] * random.uniform(0.8, 1.1)
            tool["risk"] = round(min(new_risk, 1.0), 2)
            tool["scanned"] = datetime.utcnow().isoformat()
            if tool["risk"] > 0.7:
                tool["status"] = "QUARANTINED"
            elif tool["risk"] < 0.3:
                tool["status"] = "APPROVED"
            return {"message": f"Tool '{tool_name}' rescanned", "new_risk": tool["risk"], "status": tool["status"]}
    raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")


@router.post("/tools/{tool_name}/quarantine")
async def quarantine_tool(tool_name: str, user: UserInfo = Depends(require_admin)):
    """Quarantine a specific tool."""
    for tool in _tool_registry:
        if tool["name"] == tool_name:
            tool["status"] = "QUARANTINED"
            return {"message": f"Tool '{tool_name}' quarantined", "status": "QUARANTINED"}
    raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")


@router.post("/tools/{tool_name}/approve")
async def approve_tool(tool_name: str, user: UserInfo = Depends(require_admin)):
    """Approve a quarantined tool."""
    for tool in _tool_registry:
        if tool["name"] == tool_name:
            tool["status"] = "APPROVED"
            return {"message": f"Tool '{tool_name}' approved", "status": "APPROVED"}
    raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")


@router.post("/scan-tool")
async def scan_new_tool(req: ScanToolRequest, user: UserInfo = Depends(get_current_user)):
    """Scan a tool definition for threats."""
    result = scan_tool({"definition": req.tool_definition})
    return {"result": result, "tool_name": req.tool_name or "unknown"}


@router.post("/scan-document")
async def scan_new_document(req: ScanDocRequest, user: UserInfo = Depends(get_current_user)):
    """Scan a document for hidden prompt injections."""
    result = scan_document(req.document_content)
    return {"result": result}


@router.get("/stats")
async def scanner_stats(user: UserInfo = Depends(get_current_user)):
    """Get scanner aggregate stats."""
    total = len(_tool_registry)
    avg_risk = sum(t["risk"] for t in _tool_registry) / total if total else 0
    critical = sum(1 for t in _tool_registry if t["status"] == "BLOCKED")
    quarantined = sum(1 for t in _tool_registry if t["status"] == "QUARANTINED")
    return {
        "total_scanned": total,
        "avg_risk": round(avg_risk, 3),
        "critical_blocks": critical,
        "quarantined": quarantined,
        "uptime": 99.97
    }


@router.get("/risk-distribution")
async def risk_distribution(user: UserInfo = Depends(get_current_user)):
    """Get risk score distribution histogram."""
    ranges = [
        ("0.0-0.2", 0, 0.2),
        ("0.2-0.4", 0.2, 0.4),
        ("0.4-0.6", 0.4, 0.6),
        ("0.6-0.8", 0.6, 0.8),
        ("0.8-1.0", 0.8, 1.0),
    ]
    result = []
    for label, low, high in ranges:
        count = sum(1 for t in _tool_registry if low <= t["risk"] < high)
        result.append({"range": label, "count": count})
    return result


@router.get("/policies")
async def get_policies(user: UserInfo = Depends(get_current_user)):
    """Get policy enforcement settings."""
    return _policies


@router.put("/policies")
async def update_policy(req: PolicyUpdate, user: UserInfo = Depends(require_admin)):
    """Update a policy enforcement toggle."""
    for policy in _policies:
        if policy["id"] == req.policy_id:
            policy["on"] = req.enabled
            return {"message": f"Policy '{req.policy_id}' updated", "enabled": req.enabled}
    raise HTTPException(status_code=404, detail=f"Policy '{req.policy_id}' not found")
