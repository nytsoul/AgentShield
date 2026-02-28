"""
Layer 4: Conversation Intelligence & Semantic Drift
- Token-frequency based semantic drift detection
- Topic tracking via keyword clustering
- Escalation pattern recognition
- Session velocity computation (risk acceleration)
- UMAP-like 2D projection via PCA hash mapping
"""

import re
import math
import hashlib
from typing import Dict, Any, List
from pydantic import BaseModel
from collections import Counter


class DriftPoint(BaseModel):
    x: float
    y: float
    turn: int
    topic: str
    risk: float


class ConversationResult(BaseModel):
    drift_score: float
    velocity: float
    topic_shifts: int
    escalation_detected: bool
    risk_score: float
    trajectory: List[DriftPoint] = []
    detected_topics: List[str] = []
    escalation_markers: List[str] = []


class ConversationIntelligenceLayer:
    """Layer 4: Conversation Intelligence"""

    TOPIC_KEYWORDS = {
        "security": ["hack", "exploit", "vulnerability", "bypass", "attack", "inject", "payload", "shell"],
        "system": ["root", "admin", "sudo", "chmod", "config", "system", "kernel", "process"],
        "data": ["database", "table", "query", "select", "delete", "drop", "data", "export"],
        "network": ["http", "request", "url", "api", "endpoint", "server", "port", "socket"],
        "code": ["function", "class", "import", "execute", "eval", "compile", "script", "code"],
        "credentials": ["password", "token", "key", "secret", "login", "auth", "credential", "session"],
        "social": ["pretend", "act", "roleplay", "imagine", "story", "scenario", "character"],
        "general": ["help", "explain", "what", "how", "why", "tell", "show", "describe"],
    }

    ESCALATION_PATTERNS = [
        (r"now\s+(give|show|tell|reveal)\s+me", 0.6, "Escalation demand"),
        (r"(ok|good|great|fine)\s*[,.]?\s*now\s+(ignore|forget|bypass)", 0.8, "Post-trust escalation"),
        (r"since\s+you\s+(can|already|just)", 0.5, "Capability probe"),
        (r"(one\s+more|also|additionally)\s+(can\s+you|please)\s+(delete|drop|remove|access)", 0.7, "Incremental escalation"),
        (r"(i\s+need|give\s+me)\s+(full|complete|unrestricted|admin)\s+access", 0.8, "Direct access demand"),
        (r"you\s+(said|confirmed|agreed)\s+you\s+(can|would|will)", 0.6, "Commitment exploitation"),
    ]

    PROBING_KEYWORDS = [
        ("what model are you", 0.3, "Model probing"),
        ("what are your rules", 0.4, "Rule probing"),
        ("can you access", 0.3, "Capability probing"),
        ("do you have access to", 0.3, "Access probing"),
        ("are you allowed to", 0.3, "Permission probing"),
        ("what happens if i", 0.2, "Boundary testing"),
    ]

    def _detect_topics(self, text: str) -> List[str]:
        text_lower = text.lower()
        scores = {}
        for topic, keywords in self.TOPIC_KEYWORDS.items():
            count = sum(1 for kw in keywords if kw in text_lower)
            if count > 0:
                scores[topic] = count
        sorted_topics = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return [t[0] for t in sorted_topics[:3]] if sorted_topics else ["general"]

    def _compute_drift(self, history: List[Dict[str, str]]) -> tuple:
        """Compute topic drift across conversation turns."""
        if len(history) < 2:
            return 0.0, 0, []

        turn_topics = []
        for msg in history:
            content = msg.get("content", "")
            topics = self._detect_topics(content)
            turn_topics.append(set(topics))

        shifts = 0
        for i in range(1, len(turn_topics)):
            overlap = turn_topics[i] & turn_topics[i - 1]
            if not overlap:
                shifts += 1

        drift_score = min(shifts / max(len(history) - 1, 1), 1.0)
        return drift_score, shifts, turn_topics

    def _compute_velocity(self, history: List[Dict[str, str]]) -> float:
        """Risk acceleration: how fast is the conversation getting riskier."""
        if len(history) < 3:
            return 0.0

        risks = []
        for msg in history:
            content = msg.get("content", "").lower()
            risk = 0.0
            for pattern, weight, _ in self.ESCALATION_PATTERNS:
                if re.search(pattern, content, re.IGNORECASE):
                    risk += weight
            for kw, weight, _ in self.PROBING_KEYWORDS:
                if kw in content:
                    risk += weight
            risks.append(min(risk, 1.0))

        if len(risks) >= 2:
            recent_avg = sum(risks[-3:]) / min(len(risks), 3)
            early_avg = sum(risks[:3]) / min(len(risks), 3)
            velocity = max(recent_avg - early_avg, 0.0)
        else:
            velocity = 0.0

        return min(velocity, 1.0)

    def _generate_trajectory(self, history: List[Dict[str, str]]) -> List[DriftPoint]:
        """Generate deterministic 2D trajectory points from conversation."""
        points = []
        for i, msg in enumerate(history):
            content = msg.get("content", "")
            topics = self._detect_topics(content)
            h = hashlib.md5(content.encode()).hexdigest()
            x = (int(h[:8], 16) % 10000) / 100.0 - 50.0
            y = (int(h[8:16], 16) % 10000) / 100.0 - 50.0

            risk = 0.0
            for pattern, weight, _ in self.ESCALATION_PATTERNS:
                if re.search(pattern, content, re.IGNORECASE):
                    risk += weight

            points.append(DriftPoint(
                x=round(x, 2),
                y=round(y, 2),
                turn=i,
                topic=topics[0] if topics else "general",
                risk=min(risk, 1.0),
            ))
        return points

    def analyze(self, content: str, history: List[Dict[str, str]] = None) -> ConversationResult:
        history = history or []
        full_history = history + [{"role": "user", "content": content}]

        drift_score, shifts, _ = self._compute_drift(full_history)
        velocity = self._compute_velocity(full_history)
        trajectory = self._generate_trajectory(full_history)
        current_topics = self._detect_topics(content)

        # Escalation detection
        escalation_markers = []
        escalation_risk = 0.0
        for pattern, weight, label in self.ESCALATION_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                escalation_risk += weight
                escalation_markers.append(label)

        for kw, weight, label in self.PROBING_KEYWORDS:
            if kw in content.lower():
                escalation_risk += weight
                escalation_markers.append(label)

        escalation_detected = escalation_risk > 0.5

        # Combined risk
        risk_score = min(
            drift_score * 0.3 + velocity * 0.3 + escalation_risk * 0.4,
            1.0
        )

        return ConversationResult(
            drift_score=round(drift_score, 3),
            velocity=round(velocity, 3),
            topic_shifts=shifts,
            escalation_detected=escalation_detected,
            risk_score=round(risk_score, 3),
            trajectory=trajectory,
            detected_topics=current_topics,
            escalation_markers=escalation_markers,
        )


def analyze_conversation(content: str, history: List[Dict[str, str]] = None) -> Dict[str, Any]:
    layer = ConversationIntelligenceLayer()
    return layer.analyze(content, history).model_dump()
