import re
from typing import Dict, Any, List
from pydantic import BaseModel

class IngestionResult(BaseModel):
    is_blocked: bool
    reason: str = ""
    risk_score: float
    detected_language: str
    normalized_content: str

class IngestionLayer:
    """
    Layer 1: Language Guard + Role-Based Risk Control
    Detects attacks in mixed languages (Hinglish, etc.) and applies role-based thresholds.
    """
    
    # Simple Indic/Hinglish detection patterns for demonstration (production should use IndicBERT)
    INDIC_PATTERNS = [
        re.compile(r'\b(ignore|bhuul|pichle|instructions|nirdesh)\b', re.IGNORECASE),
        re.compile(r'[\u0900-\u097F]', re.UNICODE),  # Devanagari script
    ]
    
    ROLE_THRESHOLDS = {
        "anonymous": 0.3,
        "authenticated": 0.5,
        "trusted": 0.7,
        "admin": 0.9
    }

    def __init__(self):
        # In a real scenario, load IndicBERT or similar models here
        pass

    def analyze(self, content: str, user_role: str = "anonymous") -> IngestionResult:
        risk_score = 0.0
        detected_lang = "English"
        
        # 1. Language Detection & Normalization (Simulated)
        if any(p.search(content) for p in self.INDIC_PATTERNS):
            detected_lang = "Hinglish/Indic"
            risk_score += 0.2  # Higher baseline risk for mixed scripts if used in attacks
            
        # 2. Basic Prompt Injection Check (Simulated)
        injection_keywords = ["ignore previous", "system prompt", "reveal", "tell me your"]
        for kw in injection_keywords:
            if kw in content.lower():
                risk_score += 0.6
                
        # 3. Role-Based Threshold Check
        threshold = self.ROLE_THRESHOLDS.get(user_role, 0.3)
        
        # 4. Final Decision
        is_blocked = risk_score > threshold
        reason = "Potential prompt injection detected in Ingestion Layer" if is_blocked else ""
        
        return IngestionResult(
            is_blocked=is_blocked,
            reason=reason,
            risk_score=min(risk_score, 1.0),
            detected_language=detected_lang,
            normalized_content=content # Placeholder for normalized text
        )

# Hemach's Interface finalized: analyze(content, user_role)
def analyze_ingestion(content: str, user_role: str = "anonymous") -> Dict[str, Any]:
    classifier = IngestionLayer()
    result = classifier.analyze(content, user_role)
    return result.model_dump()
