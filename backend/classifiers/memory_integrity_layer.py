"""
Layer 3: Memory & Context Integrity Verifier
- SHA-256 hash comparison for context windows
- Drift detection between turns
- Poisoned memory pattern detection
- Forensic diff tracking
"""

import re
import hashlib
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime


class MemoryDiff(BaseModel):
    field: str
    before_hash: str
    after_hash: str
    changed: bool


class MemoryResult(BaseModel):
    is_tampered: bool
    reason: str = ""
    risk_score: float
    diffs: List[MemoryDiff] = []
    poison_patterns_found: List[str] = []
    context_hash: str = ""


class MemoryIntegrityLayer:
    """Layer 3: Memory Integrity Verifier"""

    POISON_PATTERNS = [
        (r"you\s+previously\s+(said|agreed|confirmed|stated)\s+that", 0.7, "False memory claim"),
        (r"remember\s+when\s+you\s+(told|said|agreed)", 0.65, "Fake recall"),
        (r"as\s+we\s+(discussed|agreed)\s+(earlier|before|previously)", 0.6, "False context"),
        (r"you\s+(already|previously)\s+(granted|gave)\s+(me|us)\s+(access|permission|admin)", 0.9, "Privilege escalation via fake history"),
        (r"in\s+our\s+last\s+(conversation|session|chat)\s+you\s+(said|confirmed)", 0.7, "Cross-session memory attack"),
        (r"your\s+(instructions|rules)\s+(say|state|indicate)\s+that\s+you\s+(should|must|can)", 0.75, "Instruction fabrication"),
        (r"override\s+(mode|protocol)\s+(enabled|activated|confirmed)", 0.85, "Fake mode activation"),
        (r"(admin|root|superuser)\s+(mode|access|privilege)\s+(granted|enabled|active)", 0.9, "Privilege injection"),
        (r"context_window\[\d+\]\s*=", 0.8, "Direct context manipulation"),
        (r"__system__|__internal__|__override__", 0.85, "Reserved token injection"),
    ]

    def _hash_content(self, content: str) -> str:
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    def _compute_diffs(self, previous_context: List[str], current_context: List[str]) -> List[MemoryDiff]:
        diffs = []
        max_len = max(len(previous_context), len(current_context))
        for i in range(max_len):
            prev = previous_context[i] if i < len(previous_context) else ""
            curr = current_context[i] if i < len(current_context) else ""
            prev_hash = self._hash_content(prev)
            curr_hash = self._hash_content(curr)
            diffs.append(MemoryDiff(
                field=f"turn_{i}",
                before_hash=prev_hash[:16],
                after_hash=curr_hash[:16],
                changed=prev_hash != curr_hash,
            ))
        return diffs

    def verify(
        self,
        content: str,
        conversation_history: List[Dict[str, str]] = None,
        previous_hashes: List[str] = None,
    ) -> MemoryResult:
        risk_score = 0.0
        poison_found: List[str] = []
        history = conversation_history or []

        # 1. Poison pattern detection on current input
        for pattern, weight, label in self.POISON_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                risk_score += weight
                poison_found.append(label)

        # 2. Hash verification of conversation history
        diffs: List[MemoryDiff] = []
        current_hashes = [self._hash_content(h.get("content", "")) for h in history]

        if previous_hashes:
            for i, (prev_h, curr_h) in enumerate(zip(previous_hashes, current_hashes)):
                changed = prev_h != curr_h
                diffs.append(MemoryDiff(
                    field=f"turn_{i}",
                    before_hash=prev_h[:16],
                    after_hash=curr_h[:16],
                    changed=changed,
                ))
                if changed:
                    risk_score += 0.4
                    poison_found.append(f"History turn {i} was modified")

            if len(current_hashes) < len(previous_hashes):
                risk_score += 0.3
                poison_found.append(f"History truncated: {len(previous_hashes)} -> {len(current_hashes)} turns")

        # 3. Context hash for this turn
        full_context = content + "||" + "||".join(h.get("content", "") for h in history)
        context_hash = self._hash_content(full_context)

        risk_score = min(risk_score, 1.0)
        is_tampered = risk_score > 0.5

        return MemoryResult(
            is_tampered=is_tampered,
            reason=f"Memory integrity violation: {', '.join(poison_found[:3])}" if is_tampered else "",
            risk_score=risk_score,
            diffs=diffs,
            poison_patterns_found=poison_found,
            context_hash=context_hash,
        )


def verify_memory(
    content: str,
    conversation_history: List[Dict[str, str]] = None,
    previous_hashes: List[str] = None,
) -> Dict[str, Any]:
    layer = MemoryIntegrityLayer()
    return layer.verify(content, conversation_history, previous_hashes).model_dump()
