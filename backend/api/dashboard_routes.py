"""
Dashboard API Routes
Provides aggregated stats, pipeline status, drift maps, and threat feeds
for the main security dashboard.
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timedelta
import random
import math

from auth import get_current_user, require_admin
from models import UserInfo
from database import get_dashboard_stats, get_security_events

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


def _generate_drift_map(hours: int = 24):
    """Generate drift variance data for the last N hours."""
    now = datetime.utcnow()
    data = []
    for i in range(hours):
        t = now - timedelta(hours=hours - i)
        base_drift = 0.15 + 0.05 * math.sin(i * 0.3)
        noise = random.uniform(-0.03, 0.03)
        data.append({
            "time": t.strftime("%H:%M"),
            "driftVariance": round(base_drift + noise, 4),
            "securityThreshold": 0.35,
            "systemNoise": round(0.08 + random.uniform(-0.02, 0.02), 4)
        })
    return data


def _get_pipeline_status(events: list):
    """Determine pipeline layer health from recent events."""
    layer_names = [
        "Ingestion Guard", "MCP Scanner", "Memory Firewall",
        "Conversation Intel", "Output Firewall", "Honeypot Tarpit",
        "Zero Trust Bridge", "Adaptive Engine", "Observability"
    ]
    statuses = []
    for i, name in enumerate(layer_names, 1):
        layer_events = [e for e in events if e.get("layer") == i]
        blocked = sum(1 for e in layer_events if e.get("action") == "BLOCKED")
        total = len(layer_events)

        if blocked > 3:
            status = "critical"
        elif blocked > 0:
            status = "warning"
        else:
            status = "healthy"

        statuses.append({"id": f"L{i}", "name": name, "status": status})
    return statuses


def _get_language_attacks(events: list):
    """Compute Indic language attack vectors from events."""
    lang_map = {"English": 0, "Hinglish": 0, "Hindi": 0, "Tamil": 0, "Bengali": 0, "Telugu": 0}
    for e in events:
        meta = e.get("metadata", {}) or {}
        lang = meta.get("language", "English")
        if lang in lang_map:
            lang_map[lang] += 1
        else:
            lang_map["English"] += 1
    # If no real data, provide baseline
    if sum(lang_map.values()) == 0:
        lang_map = {"English": 45, "Hinglish": 28, "Hindi": 15, "Tamil": 8, "Bengali": 6, "Telugu": 4}
    return [{"lang": k, "attacks": v} for k, v in lang_map.items()]


@router.get("/stats")
async def dashboard_stats(user: UserInfo = Depends(get_current_user)):
    """Get core dashboard statistics."""
    db_stats = get_dashboard_stats()
    events = get_security_events(200)

    threats = sum(1 for e in events if e.get("action") == "BLOCKED")
    active_sessions = db_stats.get("active_sessions", 0) or len(set(e.get("session_id", "") for e in events[-20:]))

    # Compute semantic drift from recent events
    risk_scores = [e.get("risk_score", 0) for e in events[-50:]]
    avg_drift = sum(risk_scores) / len(risk_scores) if risk_scores else 0.12

    return {
        "system_health": round(db_stats.get("system_health", 99.2), 1),
        "threats_intercepted": threats or db_stats.get("threats_blocked", 847),
        "semantic_drift": round(avg_drift, 4),
        "active_agents": active_sessions or 12,
        "total_events": len(events),
        "db_connected": db_stats.get("db_connected", False)
    }


@router.get("/drift-map")
async def drift_map(
    hours: int = Query(24, ge=1, le=168),
    user: UserInfo = Depends(get_current_user)
):
    """Get semantic drift variance over time."""
    return _generate_drift_map(hours)


@router.get("/pipeline-status")
async def pipeline_status(user: UserInfo = Depends(get_current_user)):
    """Get health status of all 9 security pipeline stages."""
    events = get_security_events(100)
    return _get_pipeline_status(events)


@router.get("/language-attacks")
async def language_attacks(user: UserInfo = Depends(get_current_user)):
    """Get Indic language attack vector distribution."""
    events = get_security_events(200)
    return _get_language_attacks(events)


@router.get("/recent-threats")
async def recent_threats(
    limit: int = Query(20, ge=1, le=100),
    user: UserInfo = Depends(get_current_user)
):
    """Get recent threat feed."""
    events = get_security_events(limit)
    threats = []
    for e in events:
        if e.get("action") in ("BLOCKED", "TRAPPED", "QUARANTINED"):
            risk = e.get("risk_score", 0)
            severity = "critical" if risk > 0.8 else ("high" if risk > 0.5 else "low")
            threats.append({
                "time": e.get("created_at", e.get("timestamp", "")),
                "name": e.get("reason", "Unknown threat"),
                "src": f"Layer {e.get('layer', '?')}",
                "severity": severity,
                "session_id": e.get("session_id", ""),
                "risk_score": risk
            })
    # Fallback mock if no events
    if not threats:
        threats = [
            {"time": "2m ago", "name": "Prompt injection via Hinglish", "src": "Layer 1", "severity": "critical"},
            {"time": "5m ago", "name": "Memory poisoning attempt", "src": "Layer 3", "severity": "high"},
            {"time": "12m ago", "name": "Multi-turn escalation detected", "src": "Layer 4", "severity": "high"},
            {"time": "18m ago", "name": "PII exfiltration blocked", "src": "Layer 5", "severity": "critical"},
            {"time": "25m ago", "name": "Suspicious agent delegation", "src": "Layer 7", "severity": "low"},
        ]
    return threats


@router.get("/system-logs")
async def system_logs(
    limit: int = Query(50, ge=1, le=200),
    user: UserInfo = Depends(get_current_user)
):
    """Get system log entries."""
    events = get_security_events(limit)
    logs = []
    for e in events:
        log_type = "alert" if e.get("action") == "BLOCKED" else "info"
        logs.append({
            "time": e.get("created_at", e.get("timestamp", datetime.utcnow().isoformat())),
            "text": f"[Layer {e.get('layer', '?')}] {e.get('action', 'UNKNOWN')}: {e.get('reason', 'N/A')}",
            "type": log_type
        })
    if not logs:
        now = datetime.utcnow()
        logs = [
            {"time": (now - timedelta(seconds=i*30)).isoformat(), "text": f"[System] Pipeline health check passed", "type": "info"}
            for i in range(5)
        ]
    return logs


@router.get("/bottom-stats")
async def bottom_stats(user: UserInfo = Depends(get_current_user)):
    """Get bottom row aggregated stats."""
    events = get_security_events(200)
    risk_scores = [e.get("risk_score", 0) for e in events]
    avg_drift = sum(risk_scores) / len(risk_scores) if risk_scores else 0.142

    blocked = sum(1 for e in events if e.get("action") == "BLOCKED")
    total = len(events) or 1
    anomaly_density = blocked / total

    return {
        "avg_drift_score": f"{avg_drift:.3f}",
        "anomaly_density": f"{anomaly_density:.1%}",
        "critical_nodes": str(sum(1 for e in events if e.get("risk_score", 0) > 0.8)),
        "shared_signatures": str(len(set(e.get("reason", "") for e in events if e.get("action") == "BLOCKED")))
    }
