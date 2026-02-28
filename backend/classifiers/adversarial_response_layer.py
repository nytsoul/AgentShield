"""
Layer 6: Adversarial Response / Honeypot Tarpit
- Attack persistence detection
- Multi-vector attack correlation
- Honeypot redirection decision
- Decoy response generation hints
"""

from typing import Dict, Any, List
from pydantic import BaseModel


class AttackProfile(BaseModel):
    attack_count: int
    unique_vectors: int
    persistence_score: float
    sophistication: str


class HoneypotResult(BaseModel):
    should_redirect: bool
    target_llm: str = "primary"
    reason: str = ""
    attack_profile: AttackProfile = None
    tarpit_delay_ms: int = 0
    decoy_persona: str = ""


class AdversarialResponseLayer:
    """Layer 6: Honeypot Tarpit"""

    SOPHISTICATION_LEVELS = {
        (0, 2): ("novice", 0),
        (2, 5): ("intermediate", 500),
        (5, 10): ("advanced", 1000),
        (10, 100): ("persistent_threat", 2000),
    }

    DECOY_PERSONAS = [
        "naive_assistant",
        "overly_helpful_bot",
        "confused_model",
        "security_researcher_trap",
    ]

    def _calculate_sophistication(self, attack_count: int, unique_vectors: int) -> tuple:
        persistence = min(attack_count / 10.0, 1.0)
        vector_diversity = min(unique_vectors / 5.0, 1.0)
        score = (persistence + vector_diversity) / 2.0

        for (low, high), (level, delay) in self.SOPHISTICATION_LEVELS.items():
            if low <= attack_count < high:
                return level, delay, score

        return "persistent_threat", 2000, score

    def evaluate(
        self,
        high_risk_user: bool,
        attack_count: int,
        unique_attack_vectors: int = 1,
        cumulative_risk: float = 0.0,
    ) -> HoneypotResult:
        level, delay, persistence = self._calculate_sophistication(attack_count, unique_attack_vectors)

        should_redirect = False
        reason = ""
        decoy_persona = ""

        if high_risk_user and attack_count >= 2:
            should_redirect = True
            reason = f"Persistent attacker: {attack_count} attempts with {unique_attack_vectors} vectors"
            decoy_persona = self.DECOY_PERSONAS[attack_count % len(self.DECOY_PERSONAS)]

        if cumulative_risk > 2.0:
            should_redirect = True
            reason = f"Cumulative risk threshold exceeded: {cumulative_risk:.2f}"
            decoy_persona = "security_researcher_trap"

        if attack_count >= 5 and not should_redirect:
            should_redirect = True
            reason = f"Attack persistence threshold: {attack_count} attempts"
            decoy_persona = "naive_assistant"

        target = "decoy-phi3" if should_redirect else "primary"

        return HoneypotResult(
            should_redirect=should_redirect,
            target_llm=target,
            reason=reason,
            attack_profile=AttackProfile(
                attack_count=attack_count,
                unique_vectors=unique_attack_vectors,
                persistence_score=round(persistence, 3),
                sophistication=level,
            ),
            tarpit_delay_ms=delay if should_redirect else 0,
            decoy_persona=decoy_persona,
        )


def evaluate_honeypot(
    high_risk_user: bool,
    attack_count: int,
    unique_attack_vectors: int = 1,
    cumulative_risk: float = 0.0,
) -> Dict[str, Any]:
    layer = AdversarialResponseLayer()
    return layer.evaluate(high_risk_user, attack_count, unique_attack_vectors, cumulative_risk).model_dump()
