from __future__ import annotations

from io import BytesIO
import json

from fastapi.testclient import TestClient
import pytest
from docx import Document

from app.ingestion.remote import RemoteSourceContent
from app.services.external_search import SearchResult


def assert_consultant_output_shell(content: dict) -> None:
    assert content["executive_summary"]
    assert content["core_judgment"]
    assert "recommendations" in content
    assert "risks" in content
    assert "action_items" in content
    assert "missing_information" in content
    assert content["recommendation_cards"]
    assert content["risk_cards"]
    assert content["action_item_cards"]


def create_task_payload(title: str = "Research memo synthesis") -> dict:
    return {
        "title": title,
        "description": "Turn the working notes into a structured internal synthesis.",
        "task_type": "research_synthesis",
        "mode": "specialist",
        "external_data_strategy": "supplemental",
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
        "external_data_strategy": "supplemental",
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
        "external_data_strategy": "supplemental",
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
        "external_data_strategy": "supplemental",
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
    assert body["external_data_strategy"] == "supplemental"
    assert body["contexts"][0]["summary"].startswith("The client wants a quick internal summary")
    assert any(item["evidence_type"] == "background_text" for item in body["evidence"])
    assert body["goals"][0]["description"] == "Highlight the strongest findings and next actions."
    assert body["client"] is not None
    assert body["engagement"] is not None
    assert body["workstream"] is not None
    assert body["decision_context"] is not None
    assert body["decision_context"]["judgment_to_make"]
    assert body["domain_lenses"]
    assert body["input_entry_mode"] == "one_line_inquiry"
    assert body["deliverable_class_hint"] == "exploratory_brief"
    assert body["presence_state_summary"]["decision_context"]["state"] in {
        "explicit",
        "provisional",
    }


def test_task_creation_populates_explicit_ontology_context_spine(client: TestClient) -> None:
    payload = create_task_payload("Ontology spine")
    payload.update(
        {
            "client_name": "Acme Advisory",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Acme 內部診斷案",
            "workstream_name": "營運與銷售優化",
            "domain_lenses": ["營運", "銷售"],
            "decision_title": "Acme decision context",
            "decision_summary": "這次要先判斷是否該優先重整成交流程與交付節奏。",
            "judgment_to_make": "先判斷成交流程與交付節奏是否是目前最值得優先處理的決策點。",
        }
    )

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["client"]["name"] == "Acme Advisory"
    assert body["client"]["client_type"] == "中小企業"
    assert body["client"]["client_stage"] == "制度化階段"
    assert body["engagement"]["name"] == "Acme 內部診斷案"
    assert body["workstream"]["name"] == "營運與銷售優化"
    assert body["decision_context"]["title"] == "Acme decision context"
    assert body["decision_context"]["summary"].startswith("這次要先判斷")
    assert body["decision_context"]["judgment_to_make"].startswith("先判斷成交流程")
    assert body["decision_context"]["domain_lenses"] == ["營運", "銷售"]


def test_task_list_returns_object_aware_workspace_summary(client: TestClient) -> None:
    payload = create_task_payload("Object-aware list")
    payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "個人品牌與服務",
            "client_stage": "創業階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案重組與銷售收斂",
            "decision_title": "Northwind decision context",
            "judgment_to_make": "先判斷目前提案重組是否足以提升成交效率。",
            "domain_lenses": ["銷售", "行銷"],
        }
    )
    task = client.post("/api/v1/tasks", json=payload).json()

    response = client.get("/api/v1/tasks")

    assert response.status_code == 200
    item = next(row for row in response.json() if row["id"] == task["id"])
    assert item["client_name"] == "Northwind Studio"
    assert item["engagement_name"] == "Northwind Growth Sprint"
    assert item["workstream_name"] == "提案重組與銷售收斂"
    assert item["decision_context_title"] == "Northwind decision context"
    assert item["client_stage"] == "創業階段"
    assert item["client_type"] == "個人品牌與服務"
    assert item["domain_lenses"] == ["銷售", "行銷"]
    assert item["input_entry_mode"] == "one_line_inquiry"
    assert item["deliverable_class_hint"] == "exploratory_brief"
    assert item["external_research_heavy_candidate"] is False


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

    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert aggregate["source_materials"]
    assert aggregate["artifacts"]
    assert aggregate["input_entry_mode"] == "single_document_intake"
    assert aggregate["presence_state_summary"]["artifact"]["state"] == "explicit"


def test_single_document_intake_updates_entry_mode_and_deliverable_hint(
    client: TestClient,
) -> None:
    task = client.post("/api/v1/tasks", json=create_contract_review_payload("Single document intake")).json()

    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("agreement.txt", b"Termination and liability clauses need review.", "text/plain"))],
    )

    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()

    assert aggregate["input_entry_mode"] == "single_document_intake"
    assert aggregate["deliverable_class_hint"] == "assessment_review_memo"
    assert aggregate["presence_state_summary"]["artifact"]["state"] == "explicit"
    assert aggregate["presence_state_summary"]["source_material"]["state"] == "explicit"


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


def test_file_upload_creates_usable_docx_evidence(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("DOCX upload")).json()
    document = Document()
    document.add_paragraph("Key operational dependency sits in the approval workflow.")
    buffer = BytesIO()
    document.save(buffer)

    response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "notes.docx",
                    buffer.getvalue(),
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ),
            )
        ],
    )

    assert response.status_code == 200
    uploaded = response.json()["uploaded"][0]
    assert uploaded["source_document"]["ingest_status"] == "processed"
    assert uploaded["evidence"]["evidence_type"] == "uploaded_file_excerpt"
    assert "approval workflow" in uploaded["evidence"]["excerpt_or_summary"]


def test_file_ingestion_failure_creates_explicit_uncertainty_evidence(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Broken upload")).json()

    response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("empty.txt", b"", "text/plain"))],
    )

    assert response.status_code == 200
    uploaded = response.json()["uploaded"][0]
    assert uploaded["source_document"]["ingest_status"] == "failed"
    assert uploaded["source_document"]["ingestion_error"] == "上傳檔案為空白內容。"
    assert uploaded["evidence"]["evidence_type"] == "uploaded_file_ingestion_issue"
    assert "未能完整擷取" in uploaded["evidence"]["excerpt_or_summary"]


def test_task_creation_auto_infers_consulting_scaffold_when_advanced_fields_missing(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/tasks",
        json={
            "title": "Simple intake",
            "description": "Should we expand into a new market this year?",
            "task_type": "research_synthesis",
            "mode": "specialist",
            "subject_name": "Taiwan market expansion",
            "background_text": "",
            "constraints": [],
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["goals"][0]["description"]
    assert body["goals"][0]["success_criteria"]
    assert any(item["constraint_type"] == "system_inferred" for item in body["constraints"])
    assert body["external_data_strategy"] == "supplemental"
    assert body["contexts"][0]["summary"].startswith("工作流程：specialist")


def test_source_ingestion_from_pasted_text_creates_normalized_evidence_and_chunks(
    client: TestClient,
) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Pasted source")).json()

    response = client.post(
        f"/api/v1/tasks/{task['id']}/sources",
        json={
            "pasted_text": (
                "Customer interviews show adoption friction around setup speed and approval flow. "
                "The team believes a simpler onboarding sequence could improve conversion. "
                "Competitors position speed as a premium differentiator. " * 10
            ),
            "pasted_title": "訪談紀錄",
        },
    )

    assert response.status_code == 200
    ingested = response.json()["ingested"][0]
    assert ingested["source_document"]["source_type"] == "manual_input"
    assert ingested["source_document"]["ingest_status"] == "processed"
    assert ingested["evidence"]["evidence_type"] == "source_excerpt"
    assert "關聯度" in ingested["evidence"]["excerpt_or_summary"]

    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert any(item["evidence_type"] == "source_chunk" for item in aggregate["evidence"])


def test_source_ingestion_from_url_extracts_text_and_metadata(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services import sources as source_service

    task = client.post("/api/v1/tasks", json=create_task_payload("URL source")).json()

    monkeypatch.setattr(
        source_service,
        "fetch_remote_source",
        lambda url: RemoteSourceContent(
            source_type="manual_url",
            source_url=url,
            title="市場新聞摘要",
            content_type="text/html",
            normalized_text="Market demand is improving and channel partners expect faster implementation support.",
        ),
    )

    response = client.post(
        f"/api/v1/tasks/{task['id']}/sources",
        json={"urls": ["https://example.com/news"]},
    )

    assert response.status_code == 200
    ingested = response.json()["ingested"][0]
    assert ingested["source_document"]["source_type"] == "manual_url"
    assert ingested["source_document"]["file_name"] == "市場新聞摘要"
    assert ingested["evidence"]["evidence_type"] == "source_excerpt"


def test_google_docs_without_permission_returns_explicit_ingestion_issue(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services import sources as source_service

    task = client.post("/api/v1/tasks", json=create_task_payload("Google docs source")).json()
    monkeypatch.setattr(
        source_service,
        "fetch_remote_source",
        lambda url: (_ for _ in ()).throw(
            RuntimeError("Google Docs 連結目前沒有可讀權限，請確認文件已公開或可供目前環境讀取。")
        ),
    )

    response = client.post(
        f"/api/v1/tasks/{task['id']}/sources",
        json={"urls": ["https://docs.google.com/document/d/demo/edit"]},
    )

    assert response.status_code == 200
    ingested = response.json()["ingested"][0]
    assert ingested["source_document"]["ingest_status"] == "failed"
    assert ingested["evidence"]["evidence_type"] == "source_ingestion_issue"
    assert "Google Docs 連結目前沒有可讀權限" in ingested["evidence"]["excerpt_or_summary"]


def test_google_docs_public_link_creates_processed_source(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services import sources as source_service

    task = client.post("/api/v1/tasks", json=create_task_payload("Google docs public")).json()
    monkeypatch.setattr(
        source_service,
        "fetch_remote_source",
        lambda url: RemoteSourceContent(
            source_type="google_docs",
            source_url=url,
            title="公開 Google Docs",
            content_type="text/plain",
            normalized_text="This public Google Docs note contains a usable strategy summary.",
        ),
    )

    response = client.post(
        f"/api/v1/tasks/{task['id']}/sources",
        json={"urls": ["https://docs.google.com/document/d/demo-public/edit"]},
    )

    assert response.status_code == 200
    ingested = response.json()["ingested"][0]
    assert ingested["source_document"]["source_type"] == "google_docs"
    assert ingested["source_document"]["ingest_status"] == "processed"
    assert ingested["evidence"]["evidence_type"] == "source_excerpt"


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
            ),
        ],
    )

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert run_response.status_code == 200
    run_body = run_response.json()
    assert run_body["run"]["status"] == "completed"
    assert run_body["deliverable"]["deliverable_type"] == "research_synthesis"
    assert run_body["recommendations"]
    assert run_body["action_items"]
    content = run_body["deliverable"]["content_structure"]
    assert_consultant_output_shell(content)
    assert content["key_findings"]
    assert content["implications"]
    assert "research_gaps" in content
    assert "external_data_usage" in content
    assert content["capability_frame"]["capability"] == "synthesize_brief"
    assert content["capability_frame"]["execution_mode"] == "specialist"
    assert content["decision_context_summary"]
    assert content["input_entry_mode"] in {
        "single_document_intake",
        "multi_material_case",
    }
    assert content["deliverable_class"] in {
        "assessment_review_memo",
        "decision_action_deliverable",
    }
    assert content["sparse_input_operating_state"]["presence_state_summary"]["decision_context"]["state"]
    assert content["readiness_governance"]["decision_context_clear"] is True
    assert content["ontology_chain_summary"]["decision_context"]
    assert content["ontology_context"]["decision_context"]["judgment_to_make"]
    assert content["ontology_context"]["source_materials"]

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
    content = run_body["deliverable"]["content_structure"]
    assert_consultant_output_shell(content)
    assert content["deliverable_class"] == "assessment_review_memo"
    assert content["draft_outline"] or content["proposed_outline"]
    assert content["structure_adjustments"] or content["rewrite_guidance"]
    assert content["restructuring_strategy"]
    assert run_body["recommendations"]
    assert run_body["action_items"]

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
    content = run_body["deliverable"]["content_structure"]
    assert_consultant_output_shell(content)
    assert content["findings"]
    assert content["capability_frame"]["capability"] == "review_challenge"
    assert content["deliverable_class"] == "assessment_review_memo"
    assert content["readiness_governance"]["artifact_coverage"]
    assert content["high_risk_clauses"]
    assert content["redline_recommendations"]
    assert "missing_attachments_or_clauses" in content
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
    payload["external_data_strategy"] = "strict"
    payload["goal_description"] = "Return a synthesis only if enough evidence exists."
    task = client.post("/api/v1/tasks", json=payload).json()

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert body["run"]["status"] == "completed"
    assert body["deliverable"]["content_structure"]["background_summary"]
    assert body["risks"]
    assert body["recommendations"]
    assert body["action_items"]


def test_specialist_run_returns_explicit_uncertainty_when_model_router_fails(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    payload = create_task_payload("Router failure")
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()
    monkeypatch.setenv("MODEL_PROVIDER_FAILURE_MODE", "always_fail")

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert body["run"]["status"] == "completed"
    assert "模型路由失敗" in " ".join(body["deliverable"]["content_structure"]["missing_information"])
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
    payload = create_task_payload("Incomplete output")
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    missing_information = " ".join(body["deliverable"]["content_structure"]["missing_information"])
    assert "Host 已補上一個明確占位" in missing_information
    assert body["deliverable"]["content_structure"]["executive_summary"]
    assert body["deliverable"]["content_structure"]["core_judgment"]
    assert body["recommendations"]
    assert body["action_items"]
    assert body["risks"]


def test_multi_agent_happy_path_converges_and_saves_history(client: TestClient) -> None:
    payload = create_multi_agent_payload()
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()
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
            ),
            (
                "files",
                (
                    "financial.txt",
                    b"Gross margin is healthy, but implementation bottlenecks are delaying onboarding and revenue realization.",
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
    content = body["deliverable"]["content_structure"]
    assert_consultant_output_shell(content)
    assert content["capability_frame"]["capability"] == "decide_converge"
    assert content["capability_frame"]["execution_mode"] == "multi_agent"
    assert content["deliverable_class"] == "decision_action_deliverable"
    assert content["readiness_governance"]["evidence_coverage"]
    assert content["participating_agents"][0] == "strategy_business_analysis"
    assert set(content["participating_agents"]) == {
        "strategy_business_analysis",
        "market_research_insight",
        "operations",
        "risk_challenge",
    }
    assert content["findings"]
    assert content["insights"]
    assert content["convergence_summary"]
    assert "divergent_views" in content
    assert content["orchestration_summary"]
    assert body["recommendations"]
    assert body["action_items"]
    assert "external_data_usage" in content

    history = client.get(f"/api/v1/tasks/{task['id']}/history").json()
    assert len(history["runs"]) == 1
    assert history["runs"][0]["agent_id"] == "host_orchestrator"
    assert len(history["deliverables"]) == 1


def test_host_readiness_governance_surfaces_artifact_gap_for_document_restructuring(
    client: TestClient,
) -> None:
    payload = create_document_restructuring_payload("Document restructuring gap")
    payload["background_text"] = ""
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    content = response.json()["deliverable"]["content_structure"]
    assert content["capability_frame"]["capability"] == "restructure_reframe"
    assert content["readiness_governance"]["level"] in {"caution", "insufficient"}
    assert content["readiness_governance"]["supported_deliverable_class"] in {
        "exploratory_brief",
        "assessment_review_memo",
    }
    assert any(
        "artifact" in item or "文件" in item or "草稿" in item
        for item in content["readiness_governance"]["missing_information"]
    )


def test_sparse_external_event_case_caps_deliverable_to_exploratory_brief(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.agents import host as host_module
    from app.services import sources as source_service

    payload = create_task_payload("External event case")
    payload.update(
        {
            "description": "川普提高關稅後，台灣零組件出口商接下來三個月該先注意哪些風險？",
            "background_text": "",
            "subject_name": "",
            "goal_description": "先形成外部情勢判斷與待驗證事項。",
        }
    )
    task = client.post("/api/v1/tasks", json=payload).json()
    assert task["external_research_heavy_candidate"] is True

    monkeypatch.setattr(
        host_module,
        "search_external_sources",
        lambda query: [
            SearchResult(
                title="Tariff update",
                url="https://example.com/tariff-update",
                snippet="Latest tariff change",
            )
        ],
    )
    monkeypatch.setattr(
        source_service,
        "fetch_remote_source",
        lambda url: RemoteSourceContent(
            source_type="manual_url",
            source_url=url,
            title="Tariff update",
            content_type="text/html",
            normalized_text="External coverage explains tariff changes and likely supply chain impacts.",
        ),
    )

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    content = response.json()["deliverable"]["content_structure"]
    assert content["deliverable_class"] == "exploratory_brief"
    assert content["readiness_governance"]["external_research_heavy_case"] is True
    assert "company-specific certainty" in " ".join(content["readiness_governance"]["missing_information"])


def test_host_routes_multi_agent_based_on_context_spine(
    client: TestClient,
) -> None:
    payload = create_multi_agent_payload("Context-aware routing")
    payload.update(
        {
            "description": "請盤點這次制度化階段的營運與法務風險，判斷是否要先處理交付流程與合規風險。",
            "background_text": "目前主要擔心交付流程卡點、責任邊界不清，以及客戶承諾與內部流程不一致。",
            "client_stage": "制度化階段",
            "client_type": "中小企業",
            "domain_lenses": ["營運", "法務"],
            "decision_summary": "這次要先判斷交付流程與合規風險，是否已經成為制度化階段的主要瓶頸。",
            "judgment_to_make": "先判斷是否應優先處理交付流程與法務風險，而不是先擴大客戶開發。",
        }
    )
    task = client.post("/api/v1/tasks", json=payload).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "ops-legal.txt",
                    b"Delivery ownership is unclear, acceptance criteria are inconsistent, and contract obligations are not mapped to the operating workflow.",
                    "text/plain",
                ),
            )
        ],
    )

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    content = response.json()["deliverable"]["content_structure"]
    assert content["capability_frame"]["capability"] == "risk_surfacing"
    assert content["participating_agents"][0] == "operations"
    assert "Risk / Challenge Agent 提前" in " ".join(content["capability_frame"]["routing_rationale"])


def test_operations_agent_participates_in_multi_agent_convergence(client: TestClient) -> None:
    payload = create_multi_agent_payload("Operations core agent")
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()
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


def test_strict_external_data_strategy_never_triggers_search(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.agents import host as host_module

    payload = create_task_payload("Strict mode")
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()

    def fail_if_called(query):  # noqa: ANN001
        raise AssertionError(f"search should not be called for strict mode: {query}")

    monkeypatch.setattr(host_module, "search_external_sources", fail_if_called)

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert body["deliverable"]["content_structure"]["external_data_strategy"] == "strict"
    assert body["deliverable"]["content_structure"]["external_search_used"] is False


def test_supplemental_external_data_strategy_searches_when_evidence_is_thin(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.agents import host as host_module
    from app.services import sources as source_service

    task = client.post("/api/v1/tasks", json=create_task_payload("Supplemental search")).json()
    calls: list[str] = []

    def fake_search(query):  # noqa: ANN001
        calls.append(query)
        return [
            SearchResult(
                title="Latest market signal",
                url="https://example.com/latest-market-signal",
                snippet="Fresh market signal",
            )
        ]

    monkeypatch.setattr(host_module, "search_external_sources", fake_search)
    monkeypatch.setattr(
        source_service,
        "fetch_remote_source",
        lambda url: RemoteSourceContent(
            source_type="manual_url",
            source_url=url,
            title="Latest market signal",
            content_type="text/html",
            normalized_text="External source says adoption is rising and implementation speed matters.",
        ),
    )

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert len(calls) == 1
    assert body["deliverable"]["content_structure"]["external_data_strategy"] == "supplemental"
    assert body["deliverable"]["content_structure"]["external_search_used"] is True
    assert body["deliverable"]["content_structure"]["sources_used"]

    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert any(item["source_type"] == "external_search" for item in aggregate["uploads"])


def test_latest_external_data_strategy_always_triggers_search(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.agents import host as host_module
    from app.services import sources as source_service

    payload = create_task_payload("Latest mode search")
    payload["external_data_strategy"] = "latest"
    task = client.post("/api/v1/tasks", json=payload).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("enough.txt", b"One. Two. Three. Four.", "text/plain"))],
    )
    calls: list[str] = []

    def fake_search(query):  # noqa: ANN001
        calls.append(query)
        return [
            SearchResult(
                title="Fresh news source",
                url="https://example.com/fresh-news",
                snippet="Latest source",
            )
        ]

    monkeypatch.setattr(host_module, "search_external_sources", fake_search)
    monkeypatch.setattr(
        source_service,
        "fetch_remote_source",
        lambda url: RemoteSourceContent(
            source_type="manual_url",
            source_url=url,
            title="Fresh news source",
            content_type="text/html",
            normalized_text="A fresh external source was intentionally added for latest mode.",
        ),
    )

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert len(calls) == 1
    assert body["deliverable"]["content_structure"]["external_data_strategy"] == "latest"
    assert body["deliverable"]["content_structure"]["external_search_used"] is True


def test_multi_agent_with_insufficient_evidence_returns_explicit_uncertainty(
    client: TestClient,
) -> None:
    payload = create_multi_agent_payload("Multi-agent weak evidence")
    payload["background_text"] = ""
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert body["deliverable"]["content_structure"]["background_summary"]
    assert body["risks"]
    assert body["recommendations"]
    assert body["action_items"]


def test_multi_agent_still_uses_model_router(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.model_router.mock import MockModelProvider

    payload = create_multi_agent_payload("Router spy")
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()
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
    assert set(calls) == {
        "strategy_business_analysis",
        "market_research_insight",
        "operations",
        "risk_challenge",
    }
    assert len(calls) == 4


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
    payload = create_multi_agent_payload("Host-centered multi-agent")
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert body["run"]["agent_id"] == "host_orchestrator"
    assert body["run"]["flow_mode"] == "multi_agent"
    assert body["deliverable"]["content_structure"]["generated_by_agent"] == "host_orchestrator"


def test_factory_returns_openai_provider_when_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.core.config import settings
    from app.model_router.factory import get_model_provider
    from app.model_router.openai_provider import OpenAIModelProvider

    monkeypatch.setattr(settings, "model_provider", "openai")
    monkeypatch.setattr(settings, "openai_api_key", "test-key")
    monkeypatch.setattr(settings, "openai_model", "gpt-4o-mini")
    monkeypatch.setattr(settings, "openai_base_url", "https://api.openai.com/v1")
    monkeypatch.setattr(settings, "openai_timeout_seconds", 30)

    provider = get_model_provider()

    assert isinstance(provider, OpenAIModelProvider)


def test_factory_falls_back_to_mock_when_openai_key_is_missing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.core.config import settings
    from app.model_router.factory import get_model_provider
    from app.model_router.mock import MockModelProvider

    monkeypatch.setattr(settings, "model_provider", "openai")
    monkeypatch.setattr(settings, "openai_api_key", None)

    provider = get_model_provider()

    assert isinstance(provider, MockModelProvider)


def test_openai_provider_parses_structured_response(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.model_router import openai_provider
    from app.model_router.base import ResearchSynthesisRequest
    from app.model_router.openai_provider import OpenAIModelProvider

    class FakeResponse:
        def __init__(self, payload: dict):
            self.payload = payload

        def read(self) -> bytes:
            return json.dumps(self.payload).encode("utf-8")

        def __enter__(self):  # noqa: ANN204
            return self

        def __exit__(self, exc_type, exc, tb):  # noqa: ANN001, ANN204
            return False

    def fake_urlopen(http_request, timeout):  # noqa: ANN001
        request_body = json.loads(http_request.data.decode("utf-8"))
        assert request_body["model"] == "gpt-4o-mini"
        assert request_body["response_format"]["json_schema"]["name"] == "research_synthesis_output"
        assert timeout == 15
        return FakeResponse(
            {
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(
                                {
                                    "problem_definition": "Test problem",
                                    "background_summary": "Short summary",
                                    "findings": ["Finding one"],
                                    "risks": ["Risk one"],
                                    "recommendations": ["Recommendation one"],
                                    "action_items": ["Action one"],
                                    "missing_information": ["Missing item"],
                                }
                            )
                        }
                    }
                ]
            }
        )

    monkeypatch.setattr(openai_provider.request, "urlopen", fake_urlopen)
    provider = OpenAIModelProvider(
        api_key="test-key",
        model="gpt-4o-mini",
        base_url="https://api.openai.com/v1",
        timeout_seconds=15,
    )

    result = provider.generate_research_synthesis(
        ResearchSynthesisRequest(
            task_title="Test task",
            task_description="Test description",
            background_text="Background",
            goals=["Goal"],
            constraints=["Constraint"],
            evidence=[{"id": "e1", "title": "Evidence", "content": "Useful evidence"}],
        )
    )

    assert result.findings == ["Finding one"]
    assert result.recommendations == ["Recommendation one"]
