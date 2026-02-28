"""
Layer 8: Adaptive Learning / Self-Updating Rule Engine
- Attack pattern extraction and storage
- Rule generation from confirmed attacks
- Pattern similarity matching for new threats
- Confidence scoring for learned rules
"""

import re
import hashlib
import json
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime
from collections import defaultdict


class LearnedRule(BaseModel):
    rule_id: str
    pattern: str
    source_layer: int
    confidence: float
    hit_count: int
    created_at: str
    last_triggered: Optional[str] = None


class RuleUpdateResult(BaseModel):
    rules_updated: bool
    new_patterns_learned: List[str] = []
    existing_rules_strengthened: List[str] = []
    total_rules: int = 0
    learning_summary: str = ""


class AttackMatch(BaseModel):
    rule_id: str
    pattern: str
    confidence: float
    similarity: float


class AdaptiveLearningLayer:
    """Layer 8: Self-Updating Rule Engine"""

    _rules_store: Dict[str, LearnedRule] = {}
    _pattern_tokens: Dict[str, set] = defaultdict(set)

    TOKEN_EXTRACTORS = [
        r"\b(?:ignore|forget|bypass|override)\s+\w+",
        r"\b(?:system|admin|root)\s+\w+",
        r"\b(?:reveal|show|tell|give)\s+(?:me\s+)?\w+",
        r"\b(?:execute|eval|import|drop)\s*\(",
        r"\b(?:password|secret|token|key)\s*[:=]",
        r"<[^>]+>|<!--.*?-->",
    ]

    SIMILARITY_THRESHOLD = 0.6

    def _extract_tokens(self, content: str) -> set:
        tokens = set()
        content_lower = content.lower()

        for pattern in self.TOKEN_EXTRACTORS:
            for match in re.finditer(pattern, content_lower):
                tokens.add(match.group().strip())

        words = re.findall(r'\b[a-z]{4,}\b', content_lower)
        tokens.update(words[:20])

        return tokens

    def _generate_rule_id(self, content: str, layer: int) -> str:
        h = hashlib.sha256(f"{content}-{layer}".encode()).hexdigest()[:12]
        return f"rule_{layer}_{h}"

    def _compute_similarity(self, tokens1: set, tokens2: set) -> float:
        if not tokens1 or not tokens2:
            return 0.0
        intersection = tokens1 & tokens2
        union = tokens1 | tokens2
        return len(intersection) / len(union) if union else 0.0

    def learn_from_attack(
        self,
        attack_content: str,
        layer_caught: int,
        risk_score: float = 0.5,
        attack_vectors: List[str] = None,
    ) -> RuleUpdateResult:
        tokens = self._extract_tokens(attack_content)
        rule_id = self._generate_rule_id(attack_content, layer_caught)
        now = datetime.utcnow().isoformat()

        new_patterns = []
        strengthened = []

        existing_rule = self._rules_store.get(rule_id)
        if existing_rule:
            existing_rule.hit_count += 1
            existing_rule.confidence = min(existing_rule.confidence + 0.05, 1.0)
            existing_rule.last_triggered = now
            strengthened.append(rule_id)
        else:
            pattern_str = "|".join(sorted(list(tokens)[:5]))
            new_rule = LearnedRule(
                rule_id=rule_id,
                pattern=pattern_str,
                source_layer=layer_caught,
                confidence=min(0.3 + risk_score * 0.3, 0.8),
                hit_count=1,
                created_at=now,
            )
            self._rules_store[rule_id] = new_rule
            self._pattern_tokens[rule_id] = tokens
            new_patterns.append(pattern_str)

        if attack_vectors:
            for vector in attack_vectors[:3]:
                vector_id = self._generate_rule_id(vector, layer_caught)
                if vector_id not in self._rules_store:
                    self._rules_store[vector_id] = LearnedRule(
                        rule_id=vector_id,
                        pattern=vector,
                        source_layer=layer_caught,
                        confidence=0.4,
                        hit_count=1,
                        created_at=now,
                    )
                    new_patterns.append(vector)

        return RuleUpdateResult(
            rules_updated=True,
            new_patterns_learned=new_patterns,
            existing_rules_strengthened=strengthened,
            total_rules=len(self._rules_store),
            learning_summary=f"Processed attack from L{layer_caught}, extracted {len(tokens)} tokens",
        )

    def check_learned_patterns(self, content: str) -> List[AttackMatch]:
        tokens = self._extract_tokens(content)
        matches = []

        for rule_id, rule in self._rules_store.items():
            stored_tokens = self._pattern_tokens.get(rule_id, set())
            similarity = self._compute_similarity(tokens, stored_tokens)

            if similarity >= self.SIMILARITY_THRESHOLD:
                matches.append(AttackMatch(
                    rule_id=rule_id,
                    pattern=rule.pattern,
                    confidence=rule.confidence,
                    similarity=round(similarity, 3),
                ))

        return sorted(matches, key=lambda x: x.similarity, reverse=True)

    def get_all_rules(self) -> List[LearnedRule]:
        return list(self._rules_store.values())

    def clear_rules(self):
        self._rules_store.clear()
        self._pattern_tokens.clear()


_global_layer = AdaptiveLearningLayer()


def learn_from_attack(
    attack_content: str,
    layer_caught: int,
    risk_score: float = 0.5,
    attack_vectors: List[str] = None,
) -> Dict[str, Any]:
    return _global_layer.learn_from_attack(attack_content, layer_caught, risk_score, attack_vectors).model_dump()


def check_learned_patterns(content: str) -> List[Dict[str, Any]]:
    matches = _global_layer.check_learned_patterns(content)
    return [m.model_dump() for m in matches]


def get_all_learned_rules() -> List[Dict[str, Any]]:
    rules = _global_layer.get_all_rules()
    return [r.model_dump() for r in rules]
