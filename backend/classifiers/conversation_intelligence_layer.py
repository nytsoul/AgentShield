from typing import Dict, Any, List
from pydantic import BaseModel

class ConversationDriftResult(BaseModel):
    is_attack_detected: bool
    risk_level: str
    drift_score: float

class ConversationIntelligenceLayer:
    """
    Layer 4: Multi-Turn Attack Detection + Drift Tracking
    Watches the whole conversation for gradual attacks.
    """

    def analyze_history(self, history: List[Dict[str, str]]) -> ConversationDriftResult:
        drift_score = 0.0
        
        # Simple drift logic: count "probing" keywords throughout turns
        probing_keywords = ["system", "prompt", "hidden", "internal", "config", "debug"]
        probing_count = 0
        
        for turn in history:
            content = turn.get("content", "").lower()
            for kw in probing_keywords:
                if kw in content:
                    probing_count += 1
        
        # Increase drift score based on frequency
        drift_score = min(probing_count * 0.15, 1.0)
        
        is_attack = drift_score > 0.6
        risk_level = "high" if is_attack else ("medium" if drift_score > 0.3 else "low")
        
        return ConversationDriftResult(
            is_attack_detected=is_attack,
            risk_level=risk_level,
            drift_score=drift_score
        )

# Hemach's Interface finalized
def analyze_conversation(history: List[Dict[str, str]]) -> Dict[str, Any]:
    analyser = ConversationIntelligenceLayer()
    return analyser.analyze_history(history).model_dump()
