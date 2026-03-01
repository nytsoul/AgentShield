"""
Firewall API Routes - Standalone Endpoints (No Auth Required)

Provides public demo-friendly endpoints for the 9-layer adaptive firewall.
Each endpoint uses the real classifier modules with mock-data-backed responses.

Endpoints:
    POST /firewall/analyze-input       → Layer 1: Ingestion
    POST /firewall/scan-tool           → Layer 2b: Tool Scanner
    POST /firewall/scan-rag            → Layer 2a: RAG Scanner
    POST /firewall/check-memory        → Layer 3: Memory Integrity
    POST /firewall/analyze-conversation → Layer 4: Conversation Intelligence
    POST /firewall/filter-output       → Layer 5: Output Guard
    POST /firewall/validate-agent      → Layer 7: Inter-Agent Zero Trust
    POST /firewall/adaptive-status     → Layer 8: Adaptive Engine Stats
    GET  /firewall/observability       → Layer 9: Observability Dashboard
    GET  /firewall/stats               → Aggregate statistics
    GET  /firewall/attack-log          → Recent attack log
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# ── Classifier imports ──────────────────────────────────────────────
from classifiers.ingestion_layer import IngestionLayer
from classifiers.tool_scanner import scan_tool_metadata
from classifiers.rag_scanner import scan_rag_chunk
from classifiers.memory_integrity_layer import MemoryIntegrityLayer
from classifiers.conversation_intelligence_layer import ConversationIntelligenceLayer
from classifiers.output_guard import check_output, _detect_pii, _detect_system_prompt_leakage
from classifiers.inter_agent_layer import InterAgentLayer
from classifiers.adaptive_engine import (
    record_attack_event,
    process_pending_patterns,
    get_engine_stats,
)

# ── Mock data loader ───────────────────────────────────────────────
MOCK_DIR = Path(__file__).resolve().parent.parent / "mock_data"


def _load_mock(filename: str) -> dict:
    """Load a JSON mock data file."""
    filepath = MOCK_DIR / filename
    if not filepath.exists():
        return {}
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


# ── Request / Response models ──────────────────────────────────────

class AnalyzeInputRequest(BaseModel):
    content: str = Field(..., description="Text input to analyze for prompt injection")
    role: str = Field("anonymous", description="User role: anonymous, user, authenticated, trusted, admin")


class ScanToolRequest(BaseModel):
    name: str = Field(..., description="Tool name")
    description: str = Field("", description="Tool description")
    endpoint: str = Field("", description="Tool API endpoint URL")
    permissions: List[str] = Field(default_factory=list, description="Requested permissions")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Tool parameters")


class ScanRagRequest(BaseModel):
    text: str = Field(..., description="Document chunk text to scan")
    document_type: Optional[str] = Field(None, description="Document type: medical, legal, technical, research, financial, general")


class CheckMemoryRequest(BaseModel):
    content: str = Field(..., description="Current user input to check for memory poisoning")
    conversation_history: List[Dict[str, str]] = Field(default_factory=list, description="Previous conversation turns")
    previous_hashes: List[str] = Field(default_factory=list, description="SHA-256 hashes of previous turns")


class AnalyzeConversationRequest(BaseModel):
    content: str = Field(..., description="Current message to analyze")
    history: List[Dict[str, str]] = Field(default_factory=list, description="Conversation history")


class FilterOutputRequest(BaseModel):
    content: str = Field(..., description="LLM output text to filter")
    session_risk_score: float = Field(0.0, ge=0.0, le=1.0, description="Current session risk score")


class ValidateAgentRequest(BaseModel):
    source_agent: str = Field(..., description="Source agent ID")
    target_agent: str = Field(..., description="Target agent ID")
    message: str = Field(..., description="Inter-agent message content")
    requested_action: str = Field("", description="Action being requested")


class FirewallResponse(BaseModel):
    status: str = Field(..., description="safe, suspicious, or blocked")
    risk_score: float = Field(..., ge=0.0, le=1.0)
    reason: str = Field(...)
    details: Dict[str, Any] = Field(default_factory=dict)


# ── Router ─────────────────────────────────────────────────────────
router = APIRouter(prefix="/firewall", tags=["Firewall (Public Demo)"])


# ── Layer 1: Ingestion ─────────────────────────────────────────────
@router.post("/analyze-input", response_model=FirewallResponse)
async def analyze_input(req: AnalyzeInputRequest) -> FirewallResponse:
    """
    Layer 1: Multilingual Prompt Injection Scanner.
    Analyzes text for prompt injection, homoglyph attacks, multi-language bypasses.
    """
    layer = IngestionLayer()
    result = layer.analyze(req.content, req.role)

    if result.is_blocked:
        status = "blocked"
    elif result.risk_score > 0.3:
        status = "suspicious"
    else:
        status = "safe"

    return FirewallResponse(
        status=status,
        risk_score=round(result.risk_score, 4),
        reason=result.reason or "Input passed ingestion layer checks",
        details={
            "detected_language": result.detected_language,
            "injection_vectors": result.injection_vectors,
            "role_threshold": result.role_threshold,
            "normalized_content": result.normalized_content[:200],
        },
    )


# ── Layer 2b: Tool Scanner ────────────────────────────────────────
@router.post("/scan-tool", response_model=FirewallResponse)
async def scan_tool(req: ScanToolRequest) -> FirewallResponse:
    """
    Layer 2b: MCP Tool Metadata Scanner.
    Checks tool descriptions, endpoints, permissions, and parameters for attacks.
    """
    tool_metadata = {
        "name": req.name,
        "description": req.description,
        "endpoint": req.endpoint,
        "permissions": req.permissions,
        "parameters": req.parameters,
    }

    result = scan_tool_metadata(tool_metadata)

    if not result.passed:
        status = "blocked"
    elif result.threat_score > 0.3:
        status = "suspicious"
    else:
        status = "safe"

    return FirewallResponse(
        status=status,
        risk_score=round(result.threat_score, 4),
        reason=result.reason,
        details={
            "owasp_tag": result.owasp_tag,
            "flags": result.metadata.get("flags", []),
            "check_scores": result.metadata.get("check_scores", {}),
        },
    )


# ── Layer 2a: RAG Scanner ─────────────────────────────────────────
@router.post("/scan-rag", response_model=FirewallResponse)
async def scan_rag(req: ScanRagRequest) -> FirewallResponse:
    """
    Layer 2a: RAG Chunk Scanner.
    Detects instruction injection, semantic anomalies, and context inconsistencies in document chunks.
    """
    result = scan_rag_chunk(req.text, req.document_type)

    if not result.passed:
        status = "blocked"
    elif result.threat_score > 0.3:
        status = "suspicious"
    else:
        status = "safe"

    return FirewallResponse(
        status=status,
        risk_score=round(result.threat_score, 4),
        reason=result.reason,
        details={
            "owasp_tag": result.owasp_tag,
            "methods_triggered": result.metadata.get("methods_triggered", 0),
            "method_scores": {
                "instruction_patterns": result.metadata.get("method_1_score", 0),
                "semantic_anomaly": result.metadata.get("method_2_score", 0),
                "context_inconsistency": result.metadata.get("method_3_score", 0),
            },
            "document_type": result.metadata.get("document_type", "unknown"),
        },
    )


# ── Layer 3: Memory Integrity ─────────────────────────────────────
@router.post("/check-memory", response_model=FirewallResponse)
async def check_memory(req: CheckMemoryRequest) -> FirewallResponse:
    """
    Layer 3: Memory & Context Integrity Verifier.
    Detects memory poisoning, hash tampering, and false recall attacks.
    """
    layer = MemoryIntegrityLayer()
    result = layer.verify(req.content, req.conversation_history, req.previous_hashes or None)

    if result.is_tampered:
        status = "blocked"
    elif result.risk_score > 0.3:
        status = "suspicious"
    else:
        status = "safe"

    return FirewallResponse(
        status=status,
        risk_score=round(result.risk_score, 4),
        reason=result.reason or "Memory integrity verified — no tampering detected",
        details={
            "poison_patterns_found": result.poison_patterns_found,
            "context_hash": result.context_hash[:16],
            "diffs": [d.model_dump() for d in result.diffs[:5]],
        },
    )


# ── Layer 4: Conversation Intelligence ────────────────────────────
@router.post("/analyze-conversation", response_model=FirewallResponse)
async def analyze_conversation_endpoint(req: AnalyzeConversationRequest) -> FirewallResponse:
    """
    Layer 4: Conversation Intelligence & Semantic Drift.
    Tracks topic drift, escalation patterns, and session velocity.
    """
    layer = ConversationIntelligenceLayer()
    result = layer.analyze(req.content, req.history)

    if result.risk_score > 0.7:
        status = "blocked"
    elif result.risk_score > 0.3:
        status = "suspicious"
    else:
        status = "safe"

    return FirewallResponse(
        status=status,
        risk_score=round(result.risk_score, 4),
        reason=f"Drift: {result.drift_score:.2f}, Velocity: {result.velocity:.2f}, Escalation: {result.escalation_detected}",
        details={
            "drift_score": result.drift_score,
            "velocity": result.velocity,
            "topic_shifts": result.topic_shifts,
            "escalation_detected": result.escalation_detected,
            "detected_topics": result.detected_topics,
            "escalation_markers": result.escalation_markers,
            "trajectory": [p.model_dump() for p in result.trajectory[-10:]],
        },
    )


# ── Layer 5: Output Guard ─────────────────────────────────────────
@router.post("/filter-output", response_model=FirewallResponse)
async def filter_output_endpoint(req: FilterOutputRequest) -> FirewallResponse:
    """
    Layer 5: Output Firewall.
    Scans LLM responses for PII leakage, system prompt exposure, and data exfiltration.
    """
    result = check_output(
        response_text=req.content,
        system_prompt_hash="demo-system-prompt-hash",
        session_risk_score=req.session_risk_score,
    )

    if not result.passed:
        status = "blocked"
    elif result.threat_score > 0.2:
        status = "suspicious"
    else:
        status = "safe"

    pii_found = result.metadata.get("pii_found", [])
    leakage = result.metadata.get("system_prompt_leakage", False)
    exfil = result.metadata.get("exfiltration_patterns", [])

    return FirewallResponse(
        status=status,
        risk_score=round(result.threat_score, 4),
        reason=result.reason,
        details={
            "owasp_tag": result.owasp_tag,
            "pii_found": pii_found,
            "system_prompt_leakage": leakage,
            "exfiltration_patterns": exfil,
            "threshold": result.metadata.get("final_threshold", 0.5),
        },
    )


# ── Layer 7: Inter-Agent Zero Trust ───────────────────────────────
@router.post("/validate-agent", response_model=FirewallResponse)
async def validate_agent(req: ValidateAgentRequest) -> FirewallResponse:
    """
    Layer 7: Inter-Agent Zero Trust Validator.
    Enforces scope, privilege escalation detection, and trust chain verification.
    """
    layer = InterAgentLayer()
    result = layer.validate_interaction(
        source_agent=req.source_agent,
        target_agent=req.target_agent,
        message=req.message,
        requested_action=req.requested_action,
    )

    if not result.is_trusted:
        status = "blocked"
    elif result.risk_score > 0.3:
        status = "suspicious"
    else:
        status = "safe"

    return FirewallResponse(
        status=status,
        risk_score=round(result.risk_score, 4),
        reason=result.reason or "Agent interaction validated — trust chain intact",
        details={
            "source_agent": result.source_agent,
            "target_agent": result.target_agent,
            "action_allowed": result.action_allowed,
            "violations": [v.model_dump() for v in result.violations],
        },
    )


# ── Layer 8: Adaptive Engine Status ───────────────────────────────
@router.post("/adaptive-status")
async def adaptive_status():
    """
    Layer 8: Adaptive Rule Engine.
    Returns current engine stats, pending patterns, and promotion history.
    """
    stats = get_engine_stats()
    mock_data = _load_mock("attack_log_mock_data.json")
    blocked = mock_data.get("blocked_patterns", {})

    return {
        "status": "active",
        "layer": 8,
        "name": "Adaptive Rule Engine",
        "engine_stats": stats,
        "promoted_rules": blocked.get("promoted_from_adaptive", []),
        "static_rules": blocked.get("static_rules", []),
    }


# ── Layer 9: Observability Dashboard ──────────────────────────────
@router.get("/observability")
async def observability_dashboard():
    """
    Layer 9: Observability & Telemetry Dashboard.
    Returns real-time metrics, layer performance, threat timeline, and alerts.
    """
    mock_data = _load_mock("observability_mock_data.json")
    metrics = mock_data.get("observability_metrics", {})

    return {
        "status": "operational",
        "layer": 9,
        "name": "Observability Dashboard",
        "dashboard": metrics.get("realtime_dashboard", {}),
        "layer_performance": metrics.get("layer_performance", {}),
        "threat_timeline_24h": metrics.get("threat_timeline_24h", []),
        "geographic_distribution": metrics.get("geographic_distribution", {}),
        "recent_alerts": metrics.get("recent_alerts", []),
    }


# ── Aggregate Stats ───────────────────────────────────────────────
@router.get("/stats")
async def firewall_stats():
    """
    Aggregate firewall statistics from mock data.
    """
    attack_data = _load_mock("attack_log_mock_data.json")
    obs_data = _load_mock("observability_mock_data.json")

    stats = attack_data.get("aggregate_stats", {})
    obs_metrics = obs_data.get("observability_metrics", {})
    dashboard = obs_metrics.get("realtime_dashboard", {})

    return {
        "firewall_status": "active",
        "version": "2.0.0",
        "layers_active": 9,
        "total_scans_24h": stats.get("total_scans_24h", 0),
        "threats_detected_24h": stats.get("threats_detected_24h", 0),
        "threats_blocked_24h": stats.get("threats_blocked_24h", 0),
        "false_positive_rate": stats.get("false_positive_rate", 0),
        "avg_response_time_ms": dashboard.get("avg_latency_ms", 0),
        "uptime_percentage": dashboard.get("uptime_percentage", 0),
        "top_attack_types": stats.get("top_attack_types", {}),
        "layer_hit_distribution": stats.get("layer_hit_distribution", {}),
    }


# ── Attack Log ─────────────────────────────────────────────────────
@router.get("/attack-log")
async def attack_log(limit: int = 20):
    """
    Recent attack log entries from mock data.
    """
    mock_data = _load_mock("attack_log_mock_data.json")
    log = mock_data.get("attack_log", [])

    return {
        "total": len(log),
        "entries": log[:limit],
    }


# ── Mock Data Samples ─────────────────────────────────────────────
@router.get("/mock-samples/{layer_name}")
async def get_mock_samples(layer_name: str):
    """
    Return mock data samples for a specific layer.
    Valid layer names: ingestion, tool, rag, memory, conversation, drift, output, agent_scope, attack_log, observability
    """
    file_map = {
        "ingestion": "ingestion_mock_data.json",
        "tool": "tool_mock_data.json",
        "rag": "rag_mock_data.json",
        "memory": "memory_mock_data.json",
        "conversation": "conversation_mock_data.json",
        "drift": "drift_mock_data.json",
        "output": "output_mock_data.json",
        "agent_scope": "agent_scope_mock_data.json",
        "attack_log": "attack_log_mock_data.json",
        "observability": "observability_mock_data.json",
    }

    if layer_name not in file_map:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown layer: {layer_name}. Valid: {', '.join(file_map.keys())}",
        )

    data = _load_mock(file_map[layer_name])
    return {"layer": layer_name, "data": data}
