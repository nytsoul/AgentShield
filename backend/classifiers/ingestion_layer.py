"""
Layer 1: Multilingual Prompt-Injection Classifier
- Mixed-language detection (Indic scripts, CJK, Cyrillic, Arabic)
- Homoglyph normalization
- Multi-vector prompt injection scoring
- Role-based dynamic thresholds
"""

import re
import unicodedata
from typing import Dict, Any, List
from pydantic import BaseModel


class IngestionResult(BaseModel):
    is_blocked: bool
    reason: str = ""
    risk_score: float
    detected_language: str
    normalized_content: str
    injection_vectors: List[str] = []
    role_threshold: float = 0.3


class IngestionLayer:
    INDIC_SCRIPTS = [
        (re.compile(r'[\u0900-\u097F]'), "Devanagari"),
        (re.compile(r'[\u0980-\u09FF]'), "Bengali"),
        (re.compile(r'[\u0A80-\u0AFF]'), "Gujarati"),
        (re.compile(r'[\u0B00-\u0B7F]'), "Odia"),
        (re.compile(r'[\u0A00-\u0A7F]'), "Gurmukhi"),
        (re.compile(r'[\u0B80-\u0BFF]'), "Tamil"),
        (re.compile(r'[\u0C00-\u0C7F]'), "Telugu"),
        (re.compile(r'[\u0C80-\u0CFF]'), "Kannada"),
        (re.compile(r'[\u0D00-\u0D7F]'), "Malayalam"),
        (re.compile(r'[\u4E00-\u9FFF]'), "CJK"),
        (re.compile(r'[\u0600-\u06FF]'), "Arabic"),
        (re.compile(r'[\u0400-\u04FF]'), "Cyrillic"),
    ]

    INJECTION_PATTERNS: List[tuple] = [
        (r"ignore\s+(all\s+)?previous\s+(instructions|prompts|rules)", 0.85, "Instruction override"),
        (r"(system|developer)\s*prompt", 0.7, "System prompt probe"),
        (r"reveal\s+(your|the)\s+(system|initial|original)", 0.75, "System reveal attempt"),
        (r"tell\s+me\s+your\s+(rules|instructions|prompt|system)", 0.7, "Prompt extraction"),
        (r"act\s+as\s+(if\s+you\s+are|a)\s+(root|admin|hacker|unrestricted)", 0.8, "Role hijack"),
        (r"you\s+are\s+now\s+(free|unrestricted|DAN|jailbroken)", 0.9, "Jailbreak attempt"),
        (r"forget\s+(everything|all|your)\s+(above|previous|prior)", 0.85, "Memory wipe"),
        (r"pretend\s+(you|that)\s+(are|have)\s+no\s+(restrictions|rules|limits)", 0.85, "Restriction bypass"),
        (r"do\s+not\s+(follow|obey)\s+(your|the|any)\s+(rules|guidelines|instructions)", 0.8, "Rule override"),
        (r"\[SYSTEM\]|\[INST\]|\<\|im_start\|\>|<\|system\|>", 0.9, "Token injection"),
        (r"base64|eval\s*\(|exec\s*\(|import\s+os", 0.6, "Code injection marker"),
        (r"<script|javascript:|onerror=|onload=", 0.7, "XSS vector"),
        (r"sudo|chmod\s+777|rm\s+-rf|DROP\s+TABLE", 0.75, "Dangerous command"),
        (r"(bypass|disable|turn\s+off)\s+(safety|filter|guard|restriction)", 0.8, "Safety bypass"),
    ]

    HINGLISH_ATTACK_PATTERNS: List[tuple] = [
        (r"(pichle|pehle)\s+(nirdesh|instructions)\s+(bhool|ignore|hatao)", 0.8, "Hindi instruction override"),
        (r"(sab\s+kuch|sabhi)\s+(bhool|mita|delete)\s+(do|karo)", 0.75, "Hindi memory wipe"),
        (r"(apne|tumhare)\s+(rules|niyam)\s+(batao|dikhao|reveal)", 0.7, "Hindi prompt extraction"),
        (r"(admin|root)\s+(ban\s+jao|bano|ho\s+jao)", 0.8, "Hindi role escalation"),
    ]

    HOMOGLYPH_MAP = {
        '\u0410': 'A', '\u0412': 'B', '\u0421': 'C', '\u0415': 'E',
        '\u041D': 'H', '\u041A': 'K', '\u041C': 'M', '\u041E': 'O',
        '\u0420': 'P', '\u0422': 'T', '\u0425': 'X',
        '\u0430': 'a', '\u0435': 'e', '\u043E': 'o', '\u0440': 'p',
        '\u0441': 'c', '\u0443': 'y', '\u0445': 'x',
    }

    ROLE_THRESHOLDS = {
        "anonymous": 0.3,
        "user": 0.4,
        "authenticated": 0.5,
        "trusted": 0.7,
        "admin": 0.9,
    }

    def _normalize_unicode(self, text: str) -> str:
        nfkd = unicodedata.normalize("NFKD", text)
        return "".join(self.HOMOGLYPH_MAP.get(ch, ch) for ch in nfkd)

    def _detect_languages(self, text: str) -> List[str]:
        found = []
        for pattern, name in self.INDIC_SCRIPTS:
            if pattern.search(text):
                found.append(name)
        if re.search(r'[a-zA-Z]', text):
            found.insert(0, "Latin")
        return found if found else ["English"]

    def analyze(self, content: str, user_role: str = "anonymous") -> IngestionResult:
        risk_score = 0.0
        vectors: List[str] = []

        normalized = self._normalize_unicode(content)
        languages = self._detect_languages(content)
        detected_lang = "/".join(languages)

        if len(languages) > 1:
            risk_score += 0.15
            vectors.append(f"Mixed-script input: {detected_lang}")

        for pattern_str, weight, label in self.INJECTION_PATTERNS:
            if re.search(pattern_str, normalized, re.IGNORECASE):
                risk_score += weight
                vectors.append(label)

        for pattern_str, weight, label in self.HINGLISH_ATTACK_PATTERNS:
            if re.search(pattern_str, normalized, re.IGNORECASE):
                risk_score += weight
                vectors.append(label)

        special_ratio = sum(1 for c in content if not c.isalnum() and not c.isspace()) / max(len(content), 1)
        if special_ratio > 0.3:
            risk_score += 0.2
            vectors.append("High special-character ratio")

        threshold = self.ROLE_THRESHOLDS.get(user_role, 0.3)
        risk_score = min(risk_score, 1.0)
        is_blocked = risk_score > threshold

        reason = ""
        if is_blocked:
            reason = f"Blocked by L1 Ingestion: {', '.join(vectors[:3])}"

        return IngestionResult(
            is_blocked=is_blocked,
            reason=reason,
            risk_score=risk_score,
            detected_language=detected_lang,
            normalized_content=normalized,
            injection_vectors=vectors,
            role_threshold=threshold,
        )


def analyze_ingestion(content: str, user_role: str = "anonymous") -> Dict[str, Any]:
    classifier = IngestionLayer()
    return classifier.analyze(content, user_role).model_dump()
