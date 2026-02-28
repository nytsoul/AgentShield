from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from dataclasses import dataclass

from api.session_manager import (
    get_or_create_session, update_session_risk,
    add_turn, record_layer_decision, mark_as_honeypot
)
from api.event_emitter import emit_event
from api.llm_client import get_llm_response, get_honeypot_response, LLMConnectionError
from api.db import log_event, log_session_start, log_honeypot_message

# Import real classifiers
from classifiers.ingestion_layer import analyze_ingestion
from classifiers.pre_execution_layer import scan_pre_execution
from classifiers.memory_integrity_layer import verify_memory
from classifiers.conversation_intelligence_layer import analyze_conversation
from classifiers.output_layer import filter_output
from classifiers.adversarial_response_layer import evaluate_honeypot
from classifiers.inter_agent_layer import validate_agent_interaction
from classifiers.adaptive_learning_layer import learn_from_attack, check_learned_patterns
from classifiers.observability_layer import record_security_event


@dataclass
class ClassifierResult:
    """Unified result wrapper for all classifiers."""
    passed: bool
    threat_score: float
    reason: str
    owasp_tag: str
    metadata: dict


router = APIRouter()


class ChatRequest(BaseModel):
    session_id: str
    message: str
    role: str = "guest"


class ChatResponse(BaseModel):
    session_id: str
    response: str
    blocked: bool
    block_reason: Optional[str] = None
    block_layer: Optional[int] = None
    turn_number: int
    layers: list = []  # Summary of all layer decisions for this turn


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Core chat endpoint. Processes a message through the 5-layer security
    pipeline, calls the LLM (or honeypot), and returns the response.
    """
    session = get_or_create_session(request.session_id, request.role)
    await log_session_start(request.session_id, request.role)

    layer_summaries = []

    # ── LAYER 1: Indic Language + Role Policy ───────────────────────
    try:
        l1_raw = analyze_ingestion(request.message, request.role)
        l1_result = ClassifierResult(
            passed=not l1_raw["is_blocked"],
            threat_score=l1_raw["risk_score"],
            reason=l1_raw.get("reason", ""),
            owasp_tag="LLM01:2025",
            metadata={
                "detected_language": l1_raw.get("detected_language", ""),
                "injection_vectors": l1_raw.get("injection_vectors", []),
            }
        )
    except Exception as e:
        l1_result = ClassifierResult(
            passed=False, threat_score=1.0,
            reason=f"Layer 1 error: {str(e)}",
            owasp_tag="LLM01:2025", metadata={}
        )

    l1_action = "PASSED" if l1_result.passed else "BLOCKED"
    record_layer_decision(request.session_id, 1, l1_action,
                          l1_result.reason, l1_result.threat_score)
    event = await emit_event(
        session_id=request.session_id, layer=1,
        action=l1_action, threat_score=l1_result.threat_score,
        reason=l1_result.reason, owasp_tag=l1_result.owasp_tag,
        turn_number=session.turn_count + 1
    )
    await log_event(event)
    layer_summaries.append({"layer": 1, "action": l1_action,
                            "threat_score": l1_result.threat_score})

    if not l1_result.passed:
        return ChatResponse(
            session_id=request.session_id,
            response="Your message was blocked by the security layer.",
            blocked=True, block_reason=l1_result.reason,
            block_layer=1, turn_number=session.turn_count + 1,
            layers=layer_summaries
        )

    # ── LAYER 2: Pre-Execution Scanner ──────────────────────────────
    try:
        l2_raw = scan_pre_execution(request.message, [], [])
        l2_result = ClassifierResult(
            passed=not l2_raw["is_blocked"],
            threat_score=l2_raw["overall_risk"],
            reason=l2_raw.get("reason", ""),
            owasp_tag="LLM05:2025",
            metadata={
                "threat_details": l2_raw.get("threat_details", []),
                "tool_risks": l2_raw.get("tool_risks", []),
            }
        )
    except Exception as e:
        l2_result = ClassifierResult(
            passed=False, threat_score=1.0,
            reason=f"Layer 2 error: {str(e)}",
            owasp_tag="LLM05:2025", metadata={}
        )

    l2_action = "PASSED" if l2_result.passed else "BLOCKED"
    record_layer_decision(request.session_id, 2, l2_action,
                          l2_result.reason, l2_result.threat_score)
    event = await emit_event(
        session_id=request.session_id, layer=2,
        action=l2_action, threat_score=l2_result.threat_score,
        reason=l2_result.reason, owasp_tag=l2_result.owasp_tag,
        turn_number=session.turn_count + 1
    )
    await log_event(event)
    layer_summaries.append({"layer": 2, "action": l2_action,
                            "threat_score": l2_result.threat_score})

    if not l2_result.passed:
        return ChatResponse(
            session_id=request.session_id,
            response="Your message was blocked by the security layer.",
            blocked=True, block_reason=l2_result.reason,
            block_layer=2, turn_number=session.turn_count + 1,
            layers=layer_summaries
        )

    # ── LAYER 3: Memory Integrity ───────────────────────────────────
    try:
        history_for_l3 = [{"content": m.get("content", "")} for m in session.conversation_history]
        l3_raw = verify_memory(request.message, history_for_l3, None)
        l3_result = ClassifierResult(
            passed=not l3_raw["is_tampered"],
            threat_score=l3_raw["risk_score"],
            reason=l3_raw.get("reason", ""),
            owasp_tag="LLM08:2025",
            metadata={
                "poison_patterns_found": l3_raw.get("poison_patterns_found", []),
                "context_hash": l3_raw.get("context_hash", ""),
            }
        )
    except Exception as e:
        l3_result = ClassifierResult(
            passed=False, threat_score=1.0,
            reason=f"Layer 3 error: {str(e)}",
            owasp_tag="LLM08:2025", metadata={}
        )

    l3_action = "PASSED" if l3_result.passed else "QUARANTINED"
    record_layer_decision(request.session_id, 3, l3_action,
                          l3_result.reason, l3_result.threat_score)
    event = await emit_event(
        session_id=request.session_id, layer=3,
        action=l3_action, threat_score=l3_result.threat_score,
        reason=l3_result.reason, owasp_tag=l3_result.owasp_tag,
        turn_number=session.turn_count + 1
    )
    await log_event(event)
    layer_summaries.append({"layer": 3, "action": l3_action,
                            "threat_score": l3_result.threat_score})

    if not l3_result.passed:
        return ChatResponse(
            session_id=request.session_id,
            response="Session memory integrity check failed. Message blocked.",
            blocked=True, block_reason=l3_result.reason,
            block_layer=3, turn_number=session.turn_count + 1,
            layers=layer_summaries
        )

    # ── LAYER 4: Conversation Intelligence ──────────────────────────
    try:
        history_for_l4 = [{"role": m.get("role", "user"), "content": m.get("content", "")} 
                         for m in session.conversation_history]
        l4_raw = analyze_conversation(request.message, history_for_l4)
        
        # Get trajectory for UMAP coordinates
        trajectory = l4_raw.get("trajectory", [])
        last_point = trajectory[-1] if trajectory else {"x": 0.0, "y": 0.0}
        
        l4_result = ClassifierResult(
            passed=l4_raw["risk_score"] <= 0.7,
            threat_score=l4_raw["risk_score"],
            reason=f"Drift: {l4_raw['drift_score']:.2f}, Velocity: {l4_raw['velocity']:.2f}" if l4_raw["escalation_detected"] else "",
            owasp_tag="LLM01:2025",
            metadata={
                "x_coord": last_point.get("x", 0.0),
                "y_coord": last_point.get("y", 0.0),
                "velocity": l4_raw["velocity"],
                "drift_score": l4_raw["drift_score"],
                "escalation_detected": l4_raw["escalation_detected"],
                "detected_topics": l4_raw.get("detected_topics", []),
                "nearest_cluster": l4_raw.get("detected_topics", ["general"])[0],
            }
        )
    except Exception as e:
        l4_result = ClassifierResult(
            passed=False, threat_score=1.0,
            reason=f"Layer 4 error: {str(e)}",
            owasp_tag="LLM01:2025", metadata={}
        )

    l4_action = "PASSED" if l4_result.passed else "BLOCKED"
    x_coord = l4_result.metadata.get("x_coord", 0.0)
    y_coord = l4_result.metadata.get("y_coord", 0.0)
    record_layer_decision(request.session_id, 4, l4_action,
                          l4_result.reason, l4_result.threat_score)
    event = await emit_event(
        session_id=request.session_id, layer=4,
        action=l4_action, threat_score=l4_result.threat_score,
        reason=l4_result.reason, owasp_tag=l4_result.owasp_tag,
        turn_number=session.turn_count + 1,
        x_coord=x_coord, y_coord=y_coord,
        metadata=l4_result.metadata
    )
    await log_event(event)
    layer_summaries.append({"layer": 4, "action": l4_action,
                            "threat_score": l4_result.threat_score})

    if not l4_result.passed:
        return ChatResponse(
            session_id=request.session_id,
            response="Multi-turn attack pattern detected. Message blocked.",
            blocked=True, block_reason=l4_result.reason,
            block_layer=4, turn_number=session.turn_count + 1,
            layers=layer_summaries
        )

    # ── HONEYPOT CHECK (Layer 6) ─────────────────────────────────────
    velocity = l4_result.metadata.get("velocity", 0)
    
    # Count blocked layers as attack count
    attack_count = sum(1 for ls in layer_summaries if ls["action"] in ["BLOCKED", "QUARANTINED"])
    unique_vectors = len(set(l1_result.metadata.get("injection_vectors", [])))
    
    honeypot_raw = evaluate_honeypot(
        high_risk_user=session.cumulative_risk_score > 0.5,
        attack_count=attack_count,
        unique_attack_vectors=max(unique_vectors, 1),
        cumulative_risk=session.cumulative_risk_score,
    )
    
    should_honeypot = honeypot_raw["should_redirect"] or (velocity > 0.8 and session.cumulative_risk_score > 0.85)
    
    if should_honeypot:
        mark_as_honeypot(request.session_id)

        try:
            history = [{"role": m["role"], "content": m["content"]}
                       for m in session.conversation_history]
            history.append({"role": "user", "content": request.message})
            response = get_honeypot_response(
                history,
                l4_result.metadata.get("nearest_cluster", "unknown")
            )
        except LLMConnectionError:
            response = "I can help with that. Let me look into it for you."

        event = await emit_event(
            session_id=request.session_id, layer=6,
            action="HONEYPOT", threat_score=l4_result.threat_score,
            reason=honeypot_raw.get("reason", "Redirected to honeypot model"),
            owasp_tag="LLM01:2025",
            turn_number=session.turn_count + 1,
            x_coord=x_coord, y_coord=y_coord
        )
        await log_event(event)
        await log_honeypot_message(request.session_id, "user", request.message)
        await log_honeypot_message(request.session_id, "assistant", response)
        record_security_event(6, request.session_id, l4_result.threat_score, "HONEYPOT", honeypot_raw.get("reason", ""))

        layer_summaries.append({"layer": 6, "action": "HONEYPOT",
                                "threat_score": l4_result.threat_score})

        # ── LAYER 8: Adaptive Learning for honeypot sessions ──────────
        learn_from_attack(
            attack_content=request.message,
            layer_caught=6,
            risk_score=l4_result.threat_score,
            attack_vectors=l1_result.metadata.get("injection_vectors", []),
        )

        update_session_risk(request.session_id, l4_result.threat_score)
        add_turn(request.session_id, request.message, response,
                 l4_result.threat_score)

        return ChatResponse(
            session_id=request.session_id,
            response=response,
            blocked=False,
            turn_number=session.turn_count,
            layers=layer_summaries
        )

    # ── LAYER 7: Inter-Agent Zero Trust (if applicable) ────────────
    # Check if the message appears to be from another agent or contains agent-like commands
    agent_keywords = ["[AGENT]", "[SYSTEM]", "agent_call:", "inter_agent:"]
    is_agent_message = any(kw in request.message for kw in agent_keywords)
    
    if is_agent_message:
        l7_raw = validate_agent_interaction(
            source_agent=f"user_{request.session_id[:8]}",
            target_agent="main_llm",
            message=request.message,
        )
        l7_action = "PASSED" if l7_raw["is_trusted"] else "BLOCKED"
        l7_risk = l7_raw["risk_score"]
        
        record_layer_decision(request.session_id, 7, l7_action, l7_raw.get("reason", ""), l7_risk)
        event = await emit_event(
            session_id=request.session_id, layer=7,
            action=l7_action, threat_score=l7_risk,
            reason=l7_raw.get("reason", ""), owasp_tag="LLM09:2025",
            turn_number=session.turn_count + 1
        )
        await log_event(event)
        record_security_event(7, request.session_id, l7_risk, l7_action, l7_raw.get("reason", ""))
        layer_summaries.append({"layer": 7, "action": l7_action, "threat_score": l7_risk})
        
        if not l7_raw["is_trusted"]:
            learn_from_attack(request.message, 7, l7_risk, l7_raw.get("violations", []))
            return ChatResponse(
                session_id=request.session_id,
                response="Inter-agent request blocked due to trust violation.",
                blocked=True, block_reason=l7_raw.get("reason", ""),
                block_layer=7, turn_number=session.turn_count + 1,
                layers=layer_summaries
            )

    # ── CALL REAL LLM ──────────────────────────────────────────────
    try:
        history = [{"role": m["role"], "content": m["content"]}
                   for m in session.conversation_history]
        history.append({"role": "user", "content": request.message})
        response = get_llm_response(history)
    except LLMConnectionError as e:
        response = f"I'm currently unable to process your request. Please try again later."

    # ── LAYER 5: Output Guard ───────────────────────────────────────
    try:
        l5_raw = filter_output(response)
        l5_result = ClassifierResult(
            passed=not l5_raw["is_leaked"],
            threat_score=0.8 if l5_raw["is_leaked"] else 0.0,
            reason=f"Leak detected: {l5_raw['leak_type']}" if l5_raw["is_leaked"] else "",
            owasp_tag="LLM06:2025",
            metadata={
                "leak_type": l5_raw.get("leak_type", "none"),
                "redacted_response": l5_raw.get("filtered_content", response),
            }
        )
    except Exception as e:
        l5_result = ClassifierResult(
            passed=False, threat_score=1.0,
            reason=f"Layer 5 error: {str(e)}",
            owasp_tag="LLM06:2025",
            metadata={"redacted_response": "[Output blocked due to safety error]"}
        )

    l5_action = "PASSED" if l5_result.passed else "FLAGGED"
    record_layer_decision(request.session_id, 5, l5_action,
                          l5_result.reason, l5_result.threat_score)
    record_security_event(5, request.session_id, l5_result.threat_score, l5_action, l5_result.reason)
    event = await emit_event(
        session_id=request.session_id, layer=5,
        action=l5_action, threat_score=l5_result.threat_score,
        reason=l5_result.reason, owasp_tag=l5_result.owasp_tag,
        turn_number=session.turn_count + 1
    )
    await log_event(event)
    layer_summaries.append({"layer": 5, "action": l5_action,
                            "threat_score": l5_result.threat_score})

    # If output leaks detected, use redacted version
    if not l5_result.passed:
        response = l5_result.metadata.get("redacted_response", response)

    # ── FINALIZE ────────────────────────────────────────────────────
    update_session_risk(request.session_id, l4_result.threat_score)
    add_turn(request.session_id, request.message, response,
             l4_result.threat_score)

    # Update memory content for future Layer 3 checks
    session.memory_content += f"\nUser: {request.message}\nAssistant: {response}"

    return ChatResponse(
        session_id=request.session_id,
        response=response,
        blocked=False,
        turn_number=session.turn_count,
        layers=layer_summaries
    )
