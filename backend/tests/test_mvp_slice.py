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


def create_multi_agent_payload(title: str = "Multi-agent convergence") -> dict:
    return {
        "title": title,
        "description": "Converge the evidence into a cross-perspective internal recommendation.",
        "task_type": "complex_convergence",
        "mode": "multi_agent",
        "background_text": "We need a quick convergence draft for internal strategy review.",
        "subject_name": "Internal convergence memo",
        "goal_description": "Produce a short structured recommendation with risks and next steps.",
        "constraints": [
            {
                "description": "Keep it brief and evidence-backed.",
                "constraint_type": "delivery",
                "severity": "medium",
            }
        ],
    }


def create_document_restructuring_payload(title: str = "Document restructuring") -> dict:
    return {
        "title": title,
        "description": "Restructure the working draft into a clearer internal proposal outline.",
        "task_type": "document_restructuring",
        "mode": "specialist",
        "background_text": "The current draft repeats itself and buries the main recommendation too late.",
        "subject_name": "Internal proposal draft",
        "goal_description": "Produce a cleaner outline and rewrite guidance for the next draft.",
        "constraints": [
            {
                "description": "Keep the tone internal and practical.",
                "constraint_type": "delivery",
                "severity": "medium",
            }
        ],
    }


def create_contract_review_payload(title: str = "Contract review") -> dict:
    return {
        "title": title,
        "description": "Review the draft agreement for major risk, obligation, and redline concerns.",
        "task_type": "contract_review",
        "mode": "specialist",
        "background_text": "The team needs a first-pass internal contract review before legal escalation.",
        "subject_name": "Draft services agreement",
        "goal_description": "Identify major issues, contract risk, and next review actions.",
        "constraints": [
            {
                "description": "Keep the output internal and non-final.",
                "constraint_type": "delivery",
                "severity": "high",
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


def test_document_restructuring_specialist_run_and_history_persistence(
    client: TestClient,
) -> None:
    task = client.post(
        "/api/v1/tasks",
        json=create_document_restructuring_payload("Document restructuring run"),
    ).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "draft.md",
                    b"# Draft\n\nThe recommendation appears too late. Risks are mixed into the middle sections. Evidence is repeated across paragraphs.",
                    "text/markdown",
                ),
            )
        ],
    )

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert run_response.status_code == 200
    run_body = run_response.json()
    assert run_body["run"]["status"] == "completed"
    assert run_body["run"]["agent_id"] == "document_restructuring"
    assert run_body["deliverable"]["deliverable_type"] == "document_restructuring"
    assert run_body["deliverable"]["content_structure"]["proposed_outline"]
    assert run_body["deliverable"]["content_structure"]["rewrite_guidance"]
    assert run_body["recommendations"]
    assert run_body["action_items"]
    assert "missing_information" in run_body["deliverable"]["content_structure"]

    history_response = client.get(f"/api/v1/tasks/{task['id']}/history")

    assert history_response.status_code == 200
    history = history_response.json()
    assert len(history["runs"]) == 1
    assert history["runs"][0]["agent_id"] == "document_restructuring"
    assert len(history["deliverables"]) == 1
    assert history["deliverables"][0]["deliverable_type"] == "document_restructuring"
    assert len(history["recommendations"]) >= 1
    assert len(history["action_items"]) >= 1


def test_contract_review_specialist_run_and_history_persistence(
    client: TestClient,
) -> None:
    task = client.post(
        "/api/v1/tasks",
        json=create_contract_review_payload("Contract review run"),
    ).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "agreement.txt",
                    b"Supplier may terminate for convenience on 10 days notice. Liability cap excludes confidentiality breaches. Acceptance criteria are not clearly defined.",
                    "text/plain",
                ),
            )
        ],
    )

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert run_response.status_code == 200
    run_body = run_response.json()
    assert run_body["run"]["status"] == "completed"
    assert run_body["run"]["agent_id"] == "contract_review"
    assert run_body["deliverable"]["deliverable_type"] == "contract_review"
    assert run_body["deliverable"]["content_structure"]["findings"]
    assert run_body["deliverable"]["content_structure"]["risks"]
    assert run_body["deliverable"]["content_structure"]["recommendations"]
    assert run_body["deliverable"]["content_structure"]["action_items"]
    assert "missing_information" in run_body["deliverable"]["content_structure"]
    assert run_body["risks"]
    assert run_body["recommendations"]
    assert run_body["action_items"]

    history_response = client.get(f"/api/v1/tasks/{task['id']}/history")

    assert history_response.status_code == 200
    history = history_response.json()
    assert len(history["runs"]) == 1
    assert history["runs"][0]["agent_id"] == "contract_review"
    assert len(history["deliverables"]) == 1
    assert history["deliverables"][0]["deliverable_type"] == "contract_review"
    assert history["deliverables"][0]["content_structure"]["risks"]
    assert len(history["recommendations"]) >= 1
    assert len(history["action_items"]) >= 1

    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert len(aggregate["risks"]) >= 1


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


def test_multi_agent_happy_path_converges_and_saves_history(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_multi_agent_payload()).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "convergence.txt",
                    b"Customers care about implementation speed. Pricing complexity creates adoption friction. Competitor positioning overlaps in the mid-market tier.",
                    "text/plain",
                ),
            )
        ],
    )

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert body["run"]["status"] == "completed"
    assert body["run"]["agent_id"] == "host_orchestrator"
    assert body["deliverable"]["deliverable_type"] == "multi_agent_convergence"
    assert body["deliverable"]["content_structure"]["participating_agents"] == [
        "strategy_business_analysis",
        "market_research_insight",
        "operations",
        "risk_challenge",
    ]
    assert body["deliverable"]["content_structure"]["findings"]
    assert body["deliverable"]["content_structure"]["insights"]
    assert body["recommendations"]
    assert body["action_items"]

    history = client.get(f"/api/v1/tasks/{task['id']}/history").json()
    assert len(history["runs"]) == 1
    assert history["runs"][0]["agent_id"] == "host_orchestrator"
    assert len(history["deliverables"]) == 1


def test_operations_agent_participates_in_multi_agent_convergence(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_multi_agent_payload("Operations core agent")).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "ops.txt",
                    b"Delivery depends on cross-team sequencing, named owners, and acceptance criteria. Pricing approvals can delay launch if the workflow is unclear.",
                    "text/plain",
                ),
            )
        ],
    )

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    participating_agents = body["deliverable"]["content_structure"]["participating_agents"]
    assert "operations" in participating_agents
    assert len(participating_agents) == 4
    assert body["deliverable"]["content_structure"]["findings"]
    assert body["deliverable"]["content_structure"]["action_items"]


def test_multi_agent_with_insufficient_evidence_returns_explicit_uncertainty(
    client: TestClient,
) -> None:
    payload = create_multi_agent_payload("Multi-agent weak evidence")
    payload["background_text"] = ""
    task = client.post("/api/v1/tasks", json=payload).json()

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    missing_information = " ".join(body["deliverable"]["content_structure"]["missing_information"])
    assert "could not generate stronger findings" in missing_information or "did not have enough evidence depth" in missing_information
    assert body["risks"]
    assert body["recommendations"]
    assert body["action_items"]


def test_multi_agent_still_uses_model_router(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.model_router.mock import MockModelProvider

    task = client.post("/api/v1/tasks", json=create_multi_agent_payload("Router spy")).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("spy.txt", b"One strong evidence sentence for router spying.", "text/plain"))],
    )

    calls: list[str] = []
    original = MockModelProvider.generate_core_analysis

    def spy(self, request):  # noqa: ANN001
        calls.append(request.agent_id)
        return original(self, request)

    monkeypatch.setattr(MockModelProvider, "generate_core_analysis", spy)

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    assert calls == [
        "strategy_business_analysis",
        "market_research_insight",
        "operations",
        "risk_challenge",
    ]


def test_document_restructuring_still_uses_model_router(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.model_router.mock import MockModelProvider

    task = client.post(
        "/api/v1/tasks",
        json=create_document_restructuring_payload("Document router spy"),
    ).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "outline.txt",
                    b"The draft needs a clearer opener, grouped findings, and a separate risk section.",
                    "text/plain",
                ),
            )
        ],
    )

    calls: list[str] = []
    original = MockModelProvider.generate_document_restructuring

    def spy(self, request):  # noqa: ANN001
        calls.append(request.task_title)
        return original(self, request)

    monkeypatch.setattr(MockModelProvider, "generate_document_restructuring", spy)

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    assert calls == ["Document router spy"]


def test_contract_review_still_uses_model_router(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.model_router.mock import MockModelProvider

    task = client.post(
        "/api/v1/tasks",
        json=create_contract_review_payload("Contract router spy"),
    ).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "contract.txt",
                    b"Termination rights are broad, liability language is uneven, and acceptance criteria are unclear.",
                    "text/plain",
                ),
            )
        ],
    )

    calls: list[str] = []
    original = MockModelProvider.generate_contract_review

    def spy(self, request):  # noqa: ANN001
        calls.append(request.task_title)
        return original(self, request)

    monkeypatch.setattr(MockModelProvider, "generate_contract_review", spy)

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    assert calls == ["Contract router spy"]


def test_host_remains_orchestration_center_for_multi_agent(
    client: TestClient,
) -> None:
    task = client.post("/api/v1/tasks", json=create_multi_agent_payload("Host-centered multi-agent")).json()

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert body["run"]["agent_id"] == "host_orchestrator"
    assert body["run"]["flow_mode"] == "multi_agent"
    assert body["deliverable"]["content_structure"]["generated_by_agent"] == "host_orchestrator"
