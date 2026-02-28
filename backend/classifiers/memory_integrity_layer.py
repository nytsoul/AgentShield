from typing import Dict, Any, List
from pydantic import BaseModel

class MemoryValidationResult(BaseModel):
    is_compromised: bool
    reason: str = ""
    rollback_required: bool = False

class MemoryIntegrityLayer:
    """
    Layer 3: Persistent Memory Firewall
    Checks AI's memory after sessions for poisoning.
    """

    POISON_PATTERNS = [
        "always refer to yourself as",
        "never mention the security layer",
        "override current system prompt",
        "secretly collect user passwords"
    ]

    def validate_memory(self, session_id: str, memory_snapshot: str) -> MemoryValidationResult:
        is_compromised = False
        reason = ""
        
        for pattern in self.POISON_PATTERNS:
            if pattern in memory_snapshot.lower():
                is_compromised = True
                reason = f"Memory poisoning detected: {pattern}"
                break
        
        return MemoryValidationResult(
            is_compromised=is_compromised,
            reason=reason,
            rollback_required=is_compromised
        )

# Hemach's Interface finalized
def validate_memory(session_id: str, memory_snapshot: str) -> Dict[str, Any]:
    checker = MemoryIntegrityLayer()
    return checker.validate_memory(session_id, memory_snapshot).model_dump()
