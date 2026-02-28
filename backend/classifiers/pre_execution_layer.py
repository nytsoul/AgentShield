from typing import Dict, Any, List
from pydantic import BaseModel

class ScannerResult(BaseModel):
    is_blocked: bool
    reason: str = ""
    threat_details: List[str] = []

class PreExecutionLayer:
    """
    Layer 2: Tool & Document Scanner
    Inspects tools and RAG documents for hidden malicious instructions.
    """

    MALICIOUS_SNIPPETS = [
        "execute arbitrary code",
        "delete current database",
        "send data to external",
        "hijack session"
    ]

    def scan_tool(self, tool_definition: Dict[str, Any]) -> ScannerResult:
        threats = []
        tool_str = str(tool_definition).lower()
        
        for snippet in self.MALICIOUS_SNIPPETS:
            if snippet in tool_str:
                threats.append(f"Malicious instruction found in tool: {snippet}")
        
        is_blocked = len(threats) > 0
        return ScannerResult(
            is_blocked=is_blocked,
            reason="Malicious tool instructions detected" if is_blocked else "",
            threat_details=threats
        )

    def scan_document(self, doc_content: str) -> ScannerResult:
        threats = []
        # Check for hidden prompt injections in documents ( indirect prompt injection)
        if "human:" in doc_content.lower() or "assistant:" in doc_content.lower():
            threats.append("Suspicious role-based formatting in document")
            
        if "ignore" in doc_content.lower() and "instruction" in doc_content.lower():
            threats.append("Potential indirect prompt injection in document")

        is_blocked = len(threats) > 0
        return ScannerResult(
            is_blocked=is_blocked,
            reason="Malicious content in document" if is_blocked else "",
            threat_details=threats
        )

# Hemach's Interface finalized
def scan_tool(tool_definition: Dict[str, Any]) -> Dict[str, Any]:
    scanner = PreExecutionLayer()
    return scanner.scan_tool(tool_definition).model_dump()

def scan_document(doc_content: str) -> Dict[str, Any]:
    scanner = PreExecutionLayer()
    return scanner.scan_document(doc_content).model_dump()
