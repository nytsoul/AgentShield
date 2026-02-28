"""
Layer 9: Observability / Security Dashboard
- Real-time metrics aggregation
- Per-layer risk breakdown
- Session analytics
- Threat timeline generation
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
from collections import defaultdict
import statistics


class LayerMetrics(BaseModel):
    layer_id: int
    layer_name: str
    total_processed: int
    blocked_count: int
    avg_risk: float
    max_risk: float
    block_rate: float


class ThreatEvent(BaseModel):
    timestamp: str
    layer: int
    risk_score: float
    action: str
    session_id: str


class SessionSummary(BaseModel):
    session_id: str
    total_messages: int
    threats_detected: int
    highest_risk: float
    layers_triggered: List[int]


class ObservabilityResult(BaseModel):
    aggregated_risk: float
    threat_summary: str
    layer_metrics: List[LayerMetrics] = []
    active_sessions: int = 0
    total_threats_24h: int = 0
    threat_timeline: List[ThreatEvent] = []
    top_sessions: List[SessionSummary] = []


class ObservabilityLayer:
    """Layer 9: Security Dashboard / Observability"""

    LAYER_NAMES = {
        1: "Ingestion Guard",
        2: "Pre-Execution Scanner",
        3: "Memory Integrity",
        4: "Conversation Intelligence",
        5: "Output Firewall",
        6: "Honeypot Tarpit",
        7: "Inter-Agent Zero Trust",
        8: "Adaptive Learning",
        9: "Observability",
    }

    def __init__(self):
        self._events: List[Dict[str, Any]] = []
        self._session_data: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

    def record_event(
        self,
        layer: int,
        session_id: str,
        risk_score: float,
        action: str,
        details: str = "",
    ):
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "layer": layer,
            "session_id": session_id,
            "risk_score": risk_score,
            "action": action,
            "details": details,
        }
        self._events.append(event)
        self._session_data[session_id].append(event)

    def aggregate_metrics(
        self,
        session_results: List[Dict[str, Any]] = None,
        time_window_hours: int = 24,
    ) -> ObservabilityResult:
        results = session_results or []
        cutoff = datetime.utcnow() - timedelta(hours=time_window_hours)

        layer_stats: Dict[int, Dict[str, Any]] = defaultdict(lambda: {
            "risks": [],
            "blocked": 0,
            "total": 0,
        })

        for r in results:
            layer = r.get("layer", 0)
            risk = r.get("risk_score", 0.0)
            action = r.get("action", "PASSED")

            layer_stats[layer]["risks"].append(risk)
            layer_stats[layer]["total"] += 1
            if action == "BLOCKED":
                layer_stats[layer]["blocked"] += 1

        for event in self._events:
            try:
                ts = datetime.fromisoformat(event["timestamp"])
                if ts < cutoff:
                    continue
            except (ValueError, KeyError):
                pass

            layer = event.get("layer", 0)
            risk = event.get("risk_score", 0.0)
            action = event.get("action", "PASSED")

            layer_stats[layer]["risks"].append(risk)
            layer_stats[layer]["total"] += 1
            if action == "BLOCKED":
                layer_stats[layer]["blocked"] += 1

        layer_metrics = []
        all_risks = []

        for layer_id in range(1, 10):
            stats = layer_stats.get(layer_id, {"risks": [], "blocked": 0, "total": 0})
            risks = stats["risks"]
            total = stats["total"]
            blocked = stats["blocked"]

            if risks:
                avg_r = statistics.mean(risks)
                max_r = max(risks)
                all_risks.extend(risks)
            else:
                avg_r = 0.0
                max_r = 0.0

            block_rate = blocked / total if total > 0 else 0.0

            layer_metrics.append(LayerMetrics(
                layer_id=layer_id,
                layer_name=self.LAYER_NAMES.get(layer_id, f"Layer {layer_id}"),
                total_processed=total,
                blocked_count=blocked,
                avg_risk=round(avg_r, 3),
                max_risk=round(max_r, 3),
                block_rate=round(block_rate, 3),
            ))

        agg_risk = statistics.mean(all_risks) if all_risks else 0.0
        total_threats = sum(1 for r in all_risks if r > 0.5)

        recent_events = sorted(
            [e for e in self._events if e.get("risk_score", 0) > 0.3],
            key=lambda x: x.get("timestamp", ""),
            reverse=True,
        )[:20]

        threat_timeline = [
            ThreatEvent(
                timestamp=e["timestamp"],
                layer=e["layer"],
                risk_score=e["risk_score"],
                action=e["action"],
                session_id=e["session_id"],
            )
            for e in recent_events
        ]

        session_summaries = []
        for sid, events in self._session_data.items():
            if not events:
                continue
            risks = [e.get("risk_score", 0) for e in events]
            threats = sum(1 for r in risks if r > 0.5)
            layers = list(set(e.get("layer", 0) for e in events if e.get("risk_score", 0) > 0.3))

            session_summaries.append(SessionSummary(
                session_id=sid,
                total_messages=len(events),
                threats_detected=threats,
                highest_risk=max(risks) if risks else 0.0,
                layers_triggered=sorted(layers),
            ))

        session_summaries.sort(key=lambda x: x.highest_risk, reverse=True)

        return ObservabilityResult(
            aggregated_risk=round(agg_risk, 3),
            threat_summary=f"Processed {len(all_risks)} events, {total_threats} threats detected",
            layer_metrics=layer_metrics,
            active_sessions=len(self._session_data),
            total_threats_24h=total_threats,
            threat_timeline=threat_timeline,
            top_sessions=session_summaries[:10],
        )


_global_observability = ObservabilityLayer()


def record_security_event(
    layer: int,
    session_id: str,
    risk_score: float,
    action: str,
    details: str = "",
):
    _global_observability.record_event(layer, session_id, risk_score, action, details)


def get_observability_metrics(
    session_results: List[Dict[str, Any]] = None,
    time_window_hours: int = 24,
) -> Dict[str, Any]:
    return _global_observability.aggregate_metrics(session_results, time_window_hours).model_dump()


def get_layer_breakdown() -> List[Dict[str, Any]]:
    result = _global_observability.aggregate_metrics()
    return [m.model_dump() for m in result.layer_metrics]
