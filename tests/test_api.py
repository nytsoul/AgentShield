from fastapi.testclient import TestClient
import pytest

from backend.app import app

client = TestClient(app)


def test_dashboard_stats_without_auth():
    # should return at least the expected keys
    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    data = resp.json()
    for key in ["system_health", "threats_intercepted", "semantic_drift", "active_agents"]:
        assert key in data


def test_dashboard_pipeline():
    resp = client.get("/api/dashboard/pipeline-status")
    assert resp.status_code == 200
    data = resp.json()
    assert "stages" in data and isinstance(data["stages"], list)


def test_pre_execution_tools_and_actions():
    # tools list
    resp = client.get("/api/pre-execution/tools")
    assert resp.status_code == 200
    tools = resp.json()
    assert isinstance(tools, list)
    if tools:
        name = tools[0]["name"]
        resp2 = client.get(f"/api/pre-execution/tools/{name}/risk-breakdown")
        assert resp2.status_code == 200
        assert isinstance(resp2.json(), list)
        # test POST actions
        resp3 = client.post(f"/api/pre-execution/tools/{name}/rescan")
        assert resp3.status_code == 200
        resp4 = client.post(f"/api/pre-execution/tools/{name}/quarantine")
        assert resp4.status_code == 200


def test_memory_integrity_file_forensics():
    resp = client.get("/api/memory-integrity/files")
    assert resp.status_code == 200
    files = resp.json()
    if files:
        fname = files[0]["name"]
        resp2 = client.get(f"/api/memory-integrity/files/{fname}/forensics")
        assert resp2.status_code == 200
        assert "golden" in resp2.json()


def test_conversation_intel_sessions():
    resp = client.get("/api/conversation-intel/sessions")
    assert resp.status_code == 200
    sessions = resp.json()
    if sessions:
        sid = sessions[0]["id"]
        resp2 = client.get(f"/api/conversation-intel/sessions/{sid}/transcript")
        assert resp2.status_code == 200
        resp3 = client.get(f"/api/conversation-intel/sessions/{sid}/drift")
        assert resp3.status_code == 200
        resp4 = client.get(f"/api/conversation-intel/sessions/{sid}/escalation")
        assert resp4.status_code == 200


def test_admin_endpoints():
    resp = client.get("/api/admin/stats")
    assert resp.status_code == 200
    resp2 = client.get("/api/admin/recent-events?limit=5")
    assert resp2.status_code == 200
    resp3 = client.get("/api/admin/active-sessions")
    assert resp3.status_code == 200


def test_google_auth():
    # posting an empty token should still succeed
    resp = client.post("/auth/google", json={"id_token": "dummy"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data and "email" in data
