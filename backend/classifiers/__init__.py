# Classifiers package - 9-Layer Security Architecture

from .ingestion_layer import analyze_ingestion, IngestionLayer
from .pre_execution_layer import scan_pre_execution, scan_tool, scan_document, PreExecutionLayer
from .memory_integrity_layer import verify_memory, MemoryIntegrityLayer
from .conversation_intelligence_layer import analyze_conversation, ConversationIntelligenceLayer
from .output_layer import filter_output, OutputLayer
from .adversarial_response_layer import evaluate_honeypot, AdversarialResponseLayer
from .inter_agent_layer import validate_agent_interaction, InterAgentLayer
from .adaptive_learning_layer import learn_from_attack, check_learned_patterns, get_all_learned_rules, AdaptiveLearningLayer
from .observability_layer import record_security_event, get_observability_metrics, get_layer_breakdown, ObservabilityLayer

# Bridge / test-facing classifier modules
from .base import ClassifierResult, FailSecureError
from .indic_classifier import classify_threat
from .rag_scanner import scan_rag_chunk
from .tool_scanner import scan_tool_metadata
from .memory_auditor import audit_memory, compute_memory_hash, verify_memory_hash
from .drift_engine import embed_turn, compute_drift_velocity, reset_session
from .output_guard import check_output
from .adaptive_engine import record_attack_event, process_pending_patterns, get_engine_stats

__all__ = [
    # Layer 1
    "analyze_ingestion",
    "IngestionLayer",
    # Layer 2
    "scan_pre_execution",
    "PreExecutionLayer",
    # Layer 3
    "verify_memory",
    "MemoryIntegrityLayer",
    # Layer 4
    "analyze_conversation",
    "ConversationIntelligenceLayer",
    # Layer 5
    "filter_output",
    "OutputLayer",
    # Layer 6
    "evaluate_honeypot",
    "AdversarialResponseLayer",
    # Layer 7
    "validate_agent_interaction",
    "InterAgentLayer",
    # Layer 8
    "learn_from_attack",
    "check_learned_patterns",
    "get_all_learned_rules",
    "AdaptiveLearningLayer",
    # Layer 9
    "record_security_event",
    "get_observability_metrics",
    "get_layer_breakdown",
    "ObservabilityLayer",
]
