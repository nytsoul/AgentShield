from typing import Dict, Any, List
from pydantic import BaseModel

class ObservabilityResult(BaseModel):
    aggregated_risk: float
    threat_summary: str

class ObservabilityLayer:
    """
    Layer 9: Security Dashboard / Observability
    Provides live monitoring data.
    """

    def aggregate_metrics(self, session_results: List[Dict[str, Any]] = None) -> ObservabilityResult:
        # Calculate overall risk across all layers
        if session_results is None:
            session_results = []
        risks = [r.get("risk_score", 0.0) for r in session_results]
        avg_risk = sum(risks) / len(risks) if risks else 0.0
        
        return ObservabilityResult(
            aggregated_risk=avg_risk,
            threat_summary=f"Processed with average risk {avg_risk:.2f}"
        )

# Hemach's Interface finalized
def get_observability_data(results: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    obs = ObservabilityLayer()
    return obs.aggregate_metrics(results).model_dump()
