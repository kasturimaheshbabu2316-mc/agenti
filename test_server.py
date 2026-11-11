"""
Unit and Integration Tests for PMM 3 Production FastAPI Server,
WebSocket Real-Time Multi-Device Sync, and RAG/Agent Endpoints
"""

import time
import pytest
from fastapi.testclient import TestClient
from server import app, default_state, persist_server_state

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_state():
    # Setup clean state
    state = default_state()
    persist_server_state(state)
    client.post("/api/state", json=state)
    yield
    # Teardown: ensure state is clean
    clean = default_state()
    persist_server_state(clean)
    client.post("/api/state", json=clean)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "3.0.0"
    assert "connected_clients" in data

def test_state_endpoints():
    # GET state
    res = client.get("/api/state")
    assert res.status_code == 200
    state = res.json()
    assert "lots" in state
    assert "startPts" in state

    # POST state update
    test_state = default_state()
    test_state["startPts"] = 1500
    post_res = client.post("/api/state", json=test_state)
    assert post_res.status_code == 200
    assert post_res.json()["ok"] is True

    # Confirm updated
    check_res = client.get("/api/state")
    assert check_res.json()["startPts"] == 1500

def test_rag_search():
    payload = {"query": "Noyes Whitney dissolution", "topK": 2}
    res = client.post("/api/rag/search", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["results"]) > 0
    top_doc = data["results"][0]["doc"]
    assert "Noyes-Whitney" in top_doc["topic"]

def test_agent_generate_question():
    payload = {"type": "aptitude", "topic": "BCS Classification", "difficulty": "Hard"}
    res = client.post("/api/agent/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "generated" in data
    assert data["generated"]["difficulty"] == "Hard"
    assert len(data["generated"]["opts"]) == 4

def test_agent_explain():
    payload = {"topic": "Tablet Defects Capping", "question": "Why does capping occur?"}
    res = client.post("/api/agent/explain", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "explanation" in data
    assert "Capping" in data["topic"] or "Tablet" in data["topic"]

def test_bid_placement_and_validation():
    now = int(time.time() * 1000)
    current_state = default_state()
    current_state["lots"] = [
        {"id": 101, "endsAt": now + 60000, "start": 50, "inc": 10, "answerSecs": 45}
    ]
    client.post("/api/state", json=current_state)

    # Valid initial bid
    bid_payload = {"lotId": 101, "name": "Team Delta", "amount": 60}
    res = client.post("/api/bid", json=bid_payload)
    assert res.status_code == 200
    assert res.json()["ok"] is True
    assert res.json()["bid"]["amount"] == 60

    # Self-outbid rejection
    res_self = client.post("/api/bid", json={"lotId": 101, "name": "Team Delta", "amount": 80})
    assert res_self.status_code == 400
    assert "already leading" in res_self.json()["detail"].lower()

    # Under-bid rejection (min next is 60 + 10 = 70)
    res_under = client.post("/api/bid", json={"lotId": 101, "name": "Team Omega", "amount": 65})
    assert res_under.status_code == 400
    assert "at least 70" in res_under.json()["detail"]

    # Valid counter-bid
    res_counter = client.post("/api/bid", json={"lotId": 101, "name": "Team Omega", "amount": 80})
    assert res_counter.status_code == 200
    assert res_counter.json()["ok"] is True

def test_answer_submission():
    now = int(time.time() * 1000)
    current_state = default_state()
    current_state["lots"] = [
        {"id": 102, "endsAt": now - 1000, "start": 50, "inc": 10, "answerSecs": 45}
    ]
    current_state["bids"] = [
        {"lotId": 102, "name": "Team Winner", "amount": 100, "at": now - 5000}
    ]
    client.post("/api/state", json=current_state)

    ans_payload = {"lotId": 102, "name": "Team Winner", "choice": 0}
    res = client.post("/api/answer", json=ans_payload)
    assert res.status_code == 200
    assert res.json()["ok"] is True
    assert res.json()["answer"]["choice"] == 0

    # Duplicate answer rejected
    res_dup = client.post("/api/answer", json=ans_payload)
    assert res_dup.status_code == 400

def test_websocket_handshake_and_sync():
    with client.websocket_connect("/ws") as ws1:
        init = ws1.receive_json()
        assert init["type"] == "INIT"
        assert "state" in init

        # Keepalive ping/pong
        ws1.send_json({"type": "PING"})
        pong = ws1.receive_json()
        assert pong["type"] == "PONG"

        # Multi-client broadcast test
        with client.websocket_connect("/ws") as ws2:
            init2 = ws2.receive_json()
            assert init2["type"] == "INIT"

            sync_payload = {
                "type": "SYNC",
                "clientId": "test_client_1",
                "state": {"epoch": 99999, "lots": [{"id": 1, "topic": "Test Topic"}]}
            }
            ws1.send_json(sync_payload)

            msg1 = ws1.receive_json()
            msg2 = ws2.receive_json()
            assert msg1["type"] == "SYNC"
            assert msg2["type"] == "SYNC"
            assert msg2["clientId"] == "test_client_1"
            assert msg2["state"]["epoch"] == 99999

def test_mcq_showcase_page_served():
    res = client.get("/mcq.html")
    assert res.status_code == 200
    assert "<button class=\"opt\"" in res.text
    assert "MCQ Component Showcase" in res.text
    assert "role=\"radiogroup\"" in res.text

def test_option_card_standalone_page_served():
    res = client.get("/option-card.html")
    assert res.status_code == 200
    assert "<button class=\"opt\"" in res.text
    assert "role=\"radiogroup\"" in res.text
    assert "linear-gradient(135deg, #7ee7f8, #c4b5f5, #ffb38a)" in res.text
    assert "Option Card Selection" in res.text

def test_hub_page_served():
    res = client.get("/hub")
    assert res.status_code == 200
    assert "All-In-One Hub" in res.text
    assert "Team Page" in res.text
    assert "Quiz Master" in res.text
    assert "Dual View" in res.text

    res_all = client.get("/all")
    assert res_all.status_code == 200
    assert "All-In-One Hub" in res_all.text
