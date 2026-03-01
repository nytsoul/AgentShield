"""
Layer 8: Adaptive Rule Engine

Records attack events, accumulates counts, and promotes patterns
to ``attack_seeds.json`` when they reach 3+ occurrences.

Public API
----------
record_attack_event(attack_text, attack_type, layer, session_id) -> None
process_pending_patterns() -> dict   {"promoted": int, "pending": int}
get_engine_stats()         -> dict
reset_pending_patterns()   -> None
reset_stats()              -> None
PENDING_PATTERNS : dict          (module-level, keyed by SHA-256)
ATTACK_SEEDS_FILE : pathlib.Path
"""

import json
import hashlib
import numpy as np
from pathlib import Path
from datetime import datetime, timezone

from .base import FailSecureError

# ── Module-level state ──────────────────────────────────────────────────────
PENDING_PATTERNS: dict = {}

# File that receives promoted attack seeds
ATTACK_SEEDS_FILE: Path = Path(__file__).resolve().parent / "attack_seeds.json"

# Stats tracking
_LAST_PROCESSED: str | None = None


# ── Embedding helper (same deterministic scheme as drift_engine) ────────────

def _hash_text_to_384(text: str) -> list[float]:
    """Return a 384-dim float list from text (deterministic hash)."""
    vec = [0.0] * 384
    encoded = (text or "").encode("utf-8")
    for i in range(12):
        h = hashlib.sha256(encoded + i.to_bytes(2, "big")).digest()
        for j in range(32):
            idx = i * 32 + j
            if idx < 384:
                vec[idx] = (h[j] / 255.0) * 2.0 - 1.0
    norm = sum(v * v for v in vec) ** 0.5
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec


# ── Input validation ────────────────────────────────────────────────────────

def _validate_inputs(attack_text, attack_type, layer, session_id):
    if not isinstance(attack_text, str):
        raise FailSecureError("attack_text must be a string")
    if not attack_text.strip():
        raise FailSecureError("attack_text must not be empty or whitespace-only")
    if not isinstance(attack_type, str) or not attack_type.strip():
        raise FailSecureError("attack_type must be a non-empty string")
    if not isinstance(layer, int) or isinstance(layer, bool):
        raise FailSecureError("layer must be an integer")
    if layer < 1 or layer > 9:
        raise FailSecureError("layer must be between 1 and 9")
    if not isinstance(session_id, str) or not session_id.strip():
        raise FailSecureError("session_id must be a non-empty string")


# ── Public API ──────────────────────────────────────────────────────────────

def record_attack_event(
    attack_text: str,
    attack_type: str,
    layer: int,
    session_id: str,
) -> None:
    """Record one occurrence of an attack."""
    _validate_inputs(attack_text, attack_type, layer, session_id)

    pattern_hash = hashlib.sha256(attack_text.encode()).hexdigest()

    if pattern_hash not in PENDING_PATTERNS:
        PENDING_PATTERNS[pattern_hash] = {
            "count": 0,
            "attack_type": attack_type,
            "examples": [],
            "first_seen": datetime.now(timezone.utc).isoformat(),
            "last_seen": datetime.now(timezone.utc).isoformat(),
            "session_ids": [],
            "layers_caught": [],
            "promoted": False,
        }

    entry = PENDING_PATTERNS[pattern_hash]
    entry["count"] += 1
    entry["last_seen"] = datetime.now(timezone.utc).isoformat()

    # De-duplicate identical examples
    if attack_text not in entry["examples"]:
        entry["examples"].append(attack_text)

    # Track unique sessions
    if session_id not in entry["session_ids"]:
        entry["session_ids"].append(session_id)

    # Track unique layers
    if layer not in entry["layers_caught"]:
        entry["layers_caught"].append(layer)


def process_pending_patterns() -> dict:
    """Promote patterns with count >= 3 to attack_seeds.json.

    Returns ``{"promoted": int, "pending": int}``.
    """
    global _LAST_PROCESSED
    _LAST_PROCESSED = datetime.now(timezone.utc).isoformat()

    # Load existing file (or start fresh)
    existing: dict = {"attacks": []}
    if ATTACK_SEEDS_FILE.exists():
        try:
            with open(ATTACK_SEEDS_FILE, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except (json.JSONDecodeError, IOError):
            existing = {"attacks": []}

    existing_texts: set[str] = {a["text"] for a in existing["attacks"]}

    promoted = 0
    pending = 0

    for _hash, entry in PENDING_PATTERNS.items():
        if entry["promoted"]:
            # Already promoted previously — skip
            continue
        if entry["count"] >= 3:
            # Promote
            text = entry["examples"][0]
            if text not in existing_texts:
                existing["attacks"].append({
                    "text": text,
                    "embedding": _hash_text_to_384(text),
                    "attack_type": entry["attack_type"],
                })
                existing_texts.add(text)
            entry["promoted"] = True
            promoted += 1
        else:
            pending += 1

    # Write back
    ATTACK_SEEDS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(ATTACK_SEEDS_FILE, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    return {"promoted": promoted, "pending": pending}


def get_engine_stats() -> dict:
    """Return engine statistics."""
    promoted_count = 0
    if ATTACK_SEEDS_FILE.exists():
        try:
            with open(ATTACK_SEEDS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            promoted_count = len(data.get("attacks", []))
        except (json.JSONDecodeError, IOError):
            pass

    pending_count = sum(1 for e in PENDING_PATTERNS.values() if not e["promoted"])

    # Build details sorted by count descending
    details = []
    for _hash, entry in PENDING_PATTERNS.items():
        if not entry["promoted"]:
            details.append({
                "hash": _hash,
                "count": entry["count"],
                "attack_type": entry["attack_type"],
                "first_seen": entry["first_seen"],
                "last_seen": entry["last_seen"],
            })
    details.sort(key=lambda d: d["count"], reverse=True)

    return {
        "pending_patterns": pending_count,
        "promoted_patterns": promoted_count,
        "last_processed": _LAST_PROCESSED,
        "pending_details": details,
    }


def reset_pending_patterns() -> None:
    """Clear all pending patterns."""
    PENDING_PATTERNS.clear()


def reset_stats() -> None:
    """Clear stats tracking."""
    global _LAST_PROCESSED
    _LAST_PROCESSED = None
