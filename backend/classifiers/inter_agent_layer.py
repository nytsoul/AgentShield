from typing import Dict, Any, List
from pydantic import BaseModel

class AgentTrustResult(BaseModel):
    is_trusted: bool
    reason: str = ""

class InterAgentLayer:
    """
    Layer 7: Agent-to-Agent Zero Trust
    Monitors AI agents talking to each other.
    """

    def validate_interaction(self, source_agent: str, target_agent: str, message: str) -> AgentTrustResult:
        # Zero trust principle: block if any agent tries to request "internal" or "override" from another
        suspicious_terms = ["root", "admin", "bypass", "override", "grant access"]
        
        for term in suspicious_terms:
            if term in message.lower():
                return AgentTrustResult(
                    is_trusted=False,
                    reason=f"Suspicious inter-agent request detected: {term}"
                )
                
        return AgentTrustResult(is_trusted=True)

# Hemach's Interface finalized
def validate_agent_call(source: str, target: str, msg: str) -> Dict[str, Any]:
    layer = InterAgentLayer()
    return layer.validate_interaction(source, target, msg).model_dump()
