from fastapi import APIRouter, Depends
from models import LayerTestRequest, UserInfo
from auth import get_current_user, require_admin
from database import log_security_event, get_security_events, get_dashboard_stats

from classifiers.ingestion_layer import analyze_ingestion
from classifiers.pre_execution_layer import scan_tool, scan_document
from classifiers.memory_integrity_layer import verify_memory
from classifiers.conversation_intelligence_layer import analyze_conversation
from classifiers.output_layer import filter_output
from classifiers.adversarial_response_layer import evaluate_honeypot
from classifiers.inter_agent_layer import validate_agent_interaction
from classifiers.adaptive_learning_layer import learn_from_attack
from classifiers.observability_layer import get_observability_metrics

router = APIRouter(prefix="/api/v1/layers", tags=["Security Layers"])


# ── Layer 1: Ingestion ──────────────────────────────────────────────
@router.post("/ingestion")
async def run_ingestion(req: LayerTestRequest, user: UserInfo = Depends(get_current_user)):
    result = analyze_ingestion(req.content, "authenticated")
    log_security_event(
        user_id=user.user_id, session_id=req.session_id, layer=1,
        action="BLOCKED" if result["is_blocked"] else "PASSED",
        risk_score=result["risk_score"], reason=result.get("reason", ""),
        content_preview=req.content[:100]
    )
    return {"layer": 1, "name": "Ingestion", "result": result}


# ── Layer 2: Pre-Execution ──────────────────────────────────────────
@router.post("/pre-execution")
async def run_pre_execution(req: LayerTestRequest, user: UserInfo = Depends(get_current_user)):
    tool_results = [scan_tool(t) for t in req.tools] if req.tools else []
    doc_results = [scan_document(d) for d in req.documents] if req.documents else []
    
    any_blocked = any(r.get("is_blocked") for r in tool_results + doc_results)
    max_risk = max([r.get("risk_score", 0) for r in tool_results + doc_results], default=0)
    
    log_security_event(
        user_id=user.user_id, session_id=req.session_id, layer=2,
        action="BLOCKED" if any_blocked else "PASSED",
        risk_score=max_risk, reason="Tool/Doc scan",
        content_preview=str(req.tools + req.documents)[:100]
    )
    return {"layer": 2, "name": "Pre-Execution", "tool_results": tool_results, "doc_results": doc_results}


# ── Layer 3: Memory Integrity ───────────────────────────────────────
@router.post("/memory")
async def run_memory(req: LayerTestRequest, user: UserInfo = Depends(get_current_user)):
    result = verify_memory(req.content)
    log_security_event(
        user_id=user.user_id, session_id=req.session_id, layer=3,
        action="BLOCKED" if result.get("is_corrupted") else "PASSED",
        risk_score=result.get("risk_score", 0), reason=result.get("reason", ""),
        content_preview=req.content[:100]
    )
    return {"layer": 3, "name": "Memory Integrity", "result": result}


# ── Layer 4: Conversation Intelligence ──────────────────────────────
@router.post("/conversation")
async def run_conversation(req: LayerTestRequest, user: UserInfo = Depends(get_current_user)):
    history = req.history + [{"role": "user", "content": req.content}]
    result = analyze_conversation(history)
    log_security_event(
        user_id=user.user_id, session_id=req.session_id, layer=4,
        action="BLOCKED" if result.get("is_attack_detected") else "PASSED",
        risk_score=result.get("drift_score", 0), reason=result.get("risk_level", ""),
        content_preview=req.content[:100]
    )
    return {"layer": 4, "name": "Conversation Intelligence", "result": result}


# ── Layer 5: Output Firewall ────────────────────────────────────────
@router.post("/output")
async def run_output(req: LayerTestRequest, user: UserInfo = Depends(get_current_user)):
    result = filter_output(req.content)
    log_security_event(
        user_id=user.user_id, session_id=req.session_id, layer=5,
        action="BLOCKED" if result.get("is_leaked") else "PASSED",
        risk_score=1.0 if result.get("is_leaked") else 0.0,
        reason=result.get("leak_type", "none"),
        content_preview=req.content[:100]
    )
    return {"layer": 5, "name": "Output Firewall", "result": result}


# ── Layer 6: Adversarial Response ───────────────────────────────────
@router.post("/adversarial")
async def run_adversarial(req: LayerTestRequest, user: UserInfo = Depends(get_current_user)):
    result = evaluate_honeypot(req.content, attack_confirmed=True, severity=3)
    log_security_event(
        user_id=user.user_id, session_id=req.session_id, layer=6,
        action="TRAPPED", risk_score=0.95, reason="Honeypot triggered",
        content_preview=req.content[:100]
    )
    return {"layer": 6, "name": "Adversarial Response", "result": result}


# ── Layer 7: Inter-Agent Security ───────────────────────────────────
@router.post("/inter-agent")
async def run_inter_agent(req: LayerTestRequest, user: UserInfo = Depends(get_current_user)):
    result = validate_agent_interaction(source_agent="agent-a", target_agent="agent-b", message=req.content)
    log_security_event(
        user_id=user.user_id, session_id=req.session_id, layer=7,
        action="BLOCKED" if result.get("is_blocked") else "PASSED",
        risk_score=result.get("risk_score", 0), reason=result.get("reason", ""),
        content_preview=req.content[:100]
    )
    return {"layer": 7, "name": "Inter-Agent", "result": result}


# ── Layer 8: Adaptive Learning ──────────────────────────────────────
@router.post("/adaptive")
async def run_adaptive(req: LayerTestRequest, user: UserInfo = Depends(get_current_user)):
    result = learn_from_attack(req.content, layer_caught=8, risk_score=0.5)
    log_security_event(
        user_id=user.user_id, session_id=req.session_id, layer=8,
        action="OPTIMIZED", risk_score=0.0, reason="Rules updated",
        content_preview=req.content[:100]
    )
    return {"layer": 8, "name": "Adaptive Learning", "result": result}


# ── Layer 9: Observability (Admin Only) ─────────────────────────────
@router.get("/observability")
async def run_observability(user: UserInfo = Depends(require_admin)):
    obs_data = get_observability_metrics()
    db_stats = get_dashboard_stats()
    return {"layer": 9, "name": "Observability", "telemetry": obs_data, "db_stats": db_stats}


# ── Admin: Event Log ────────────────────────────────────────────────
@router.get("/events")
async def get_events(limit: int = 50, user: UserInfo = Depends(require_admin)):
    events = get_security_events(limit)
    return {"events": events, "count": len(events)}
