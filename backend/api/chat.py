from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from api.session_manager import (
    get_or_create_session, update_session_risk,
    add_turn, record_layer_decision, mark_as_honeypot
)
from api.event_emitter import emit_event
from api.llm_client import get_llm_response, get_honeypot_response, LLMConnectionError
from api.db import log_event, log_session_start, log_honeypot_message
from api.stubs import (
    stub_layer1, stub_layer2, stub_layer3,
    stub_layer4, stub_layer5, ClassifierResult
)

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
        l1_result = stub_layer1(request.message, request.role)
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
        l2_result = stub_layer2(request.message, request.session_id)
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
        l3_result = stub_layer3(request.session_id, session.memory_content)
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
        l4_result = stub_layer4(request.message, request.session_id)
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

    # ── HONEYPOT CHECK ──────────────────────────────────────────────
    velocity = l4_result.metadata.get("velocity", 0)
    if velocity > 0.8 and session.cumulative_risk_score > 0.85:
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
            reason="Redirected to honeypot model",
            owasp_tag="LLM01:2025",
            turn_number=session.turn_count + 1,
            x_coord=x_coord, y_coord=y_coord
        )
        await log_event(event)
        await log_honeypot_message(request.session_id, "user", request.message)
        await log_honeypot_message(request.session_id, "assistant", response)

        layer_summaries.append({"layer": 6, "action": "HONEYPOT",
                                "threat_score": l4_result.threat_score})

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
        l5_result = stub_layer5(response, session.cumulative_risk_score)
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
