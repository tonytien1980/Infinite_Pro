from __future__ import annotations

from fastapi.testclient import TestClient
import pytest


def create_task_payload(title: str = "Research memo synthesis") -> dict:
    return {
        "title": title,
        "description": "Turn the working notes into a structured internal synthesis.",
        "task_type": "research_synthesis",
        "mode": "specialist",
        "background_text": "The client wants a quick internal summary before proposal drafting.",
        "subject_name": "Proposal research pack",
        "goal_description": "Highlight the strongest findings and next actions.",
        "constraints": [
            {
                "description": "Keep the output internal-only for now.",
                "constraint_type": "delivery",
                "severity": "medium",
            }
        ],
    }


def test_health_endpoint(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_task_creation_attaches_background_text_as_context_and_evidence(client: TestClient) -> None:
    response = client.post("/api/v1/tasks", json=create_task_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Research memo synthesis"
    assert body["contexts"][0]["summary"].startswith("The client wants a quick internal summary")
    assert any(item["evidence_type"] == "background_text" for item in body["evidence"])
    assert body["goals"][0]["description"] == "Highlight the strongest findings and next actions."


def test_file_upload_creates_usable_txt_evidence(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("TXT upload")).json()

    response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("notes.txt", b"Alpha insight.\nBeta insight.\nGamma insight.", "text/plain"))],
    )

    assert response.status_code == 200
    uploaded = response.json()["uploaded"][0]
    assert uploaded["source_document"]["ingest_status"] == "processed"
    assert uploaded["evidence"]["evidence_type"] == "uploaded_file_excerpt"
    assert "Alpha insight" in uploaded["evidence"]["excerpt_or_summary"]


def test_file_upload_creates_usable_md_evidence(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("MD upload")).json()

    response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("notes.md", b"# Header\n\nImportant market note in markdown.", "text/markdown"))],
    )

    assert response.status_code == 200
    uploaded = response.json()["uploaded"][0]
    assert uploaded["source_document"]["ingest_status"] == "processed"
    assert uploaded["evidence"]["evidence_type"] == "uploaded_file_excerpt"
    assert "Important market note" in uploaded["evidence"]["excerpt_or_summary"]


def test_file_ingestion_failure_creates_explicit_uncertainty_evidence(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Broken upload")).json()

    response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("empty.txt", b"", "text/plain"))],
    )

    assert response.status_code == 200
    uploaded = response.json()["uploaded"][0]
    assert uploaded["source_document"]["ingest_status"] == "failed"
    assert uploaded["source_document"]["ingestion_error"] == "The uploaded file was empty."
    assert uploaded["evidence"]["evidence_type"] == "uploaded_file_ingestion_issue"
    assert "could not be fully ingested" in uploaded["evidence"]["excerpt_or_summary"]


def test_research_synthesis_specialist_run_and_history_persistence(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Specialist run")).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "research.txt",
                    b"The competitor set overlaps heavily and pricing differs by service tier. Customers value implementation speed.",
                    "text/plain",
                ),
            )
        ],
    )

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert run_response.status_code == 200
    run_body = run_response.json()
    assert run_body["run"]["status"] == "completed"
    assert run_body["deliverable"]["deliverable_type"] == "research_synthesis"
    assert run_body["recommendations"]
    assert run_body["action_items"]
    assert "missing_information" in run_body["deliverable"]["content_structure"]
    assert "risks" in run_body["deliverable"]["content_structure"]

    history_response = client.get(f"/api/v1/tasks/{task['id']}/history")

    assert history_response.status_code == 200
    history = history_response.json()
    assert len(history["runs"]) == 1
    assert len(history["deliverables"]) == 1
    assert len(history["recommendations"]) >= 1
    assert len(history["action_items"]) >= 1
    assert len(history["evidence"]) >= 2


def test_specialist_run_returns_explicit_uncertainty_when_no_usable_evidence(
    client: TestClient,
) -> None:
    payload = create_task_payload("No usable evidence")
    payload["background_text"] = ""
    payload["goal_description"] = "Return a synthesis only if enough evidence exists."
    task = client.post("/api/v1/tasks", json=payload).json()

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert body["run"]["status"] == "completed"
    assert "No usable evidence was available" in " ".join(
        body["deliverable"]["content_structure"]["missing_information"]
    )
    assert body["risks"]
    assert body["recommendations"]
    assert body["action_items"]


def test_specialist_run_returns_explicit_uncertainty_when_model_router_fails(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Router failure")).json()
    monkeypatch.setenv("MODEL_PROVIDER_FAILURE_MODE", "always_fail")

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert body["run"]["status"] == "completed"
    assert "Model router failure" in " ".join(body["deliverable"]["content_structure"]["missing_information"])
    assert body["recommendations"]
    assert body["action_items"]

    monkeypatch.delenv("MODEL_PROVIDER_FAILURE_MODE", raising=False)


def test_host_normalizes_incomplete_specialist_output(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.agents.base import AgentResult, DeliverableDraft, SpecialistAgent
    from app.agents.registry import AgentRegistry

    class IncompleteAgent(SpecialistAgent):
        descriptor = AgentRegistry(None).get_descriptor("research_synthesis")  # type: ignore[arg-type]

        def run(self, payload):  # noqa: ANN001
            return AgentResult(
                deliverable=DeliverableDraft(
                    deliverable_type="research_synthesis",
                    title=f"{payload.title} - Incomplete",
                    content_structure={},
                )
            )

    monkeypatch.setattr(AgentRegistry, "get_specialist_agent", lambda self, agent_id: IncompleteAgent())
    task = client.post("/api/v1/tasks", json=create_task_payload("Incomplete output")).json()

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    missing_information = " ".join(body["deliverable"]["content_structure"]["missing_information"])
    assert "Host added an explicit placeholder" in missing_information
    assert body["recommendations"]
    assert body["action_items"]
    assert body["risks"]
