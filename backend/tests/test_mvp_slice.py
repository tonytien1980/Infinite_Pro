from __future__ import annotations

from io import BytesIO
import json

from fastapi.testclient import TestClient
import pytest
from docx import Document

from app.core.database import SessionLocal
from app.domain import models
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


def test_task_creation_builds_case_world_draft_and_continuity_policy(client: TestClient) -> None:
    payload = create_task_payload("Case world draft")
    payload["engagement_continuity_mode"] = "follow_up"
    payload["writeback_depth"] = "milestone"

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["entry_preset"] == "one_line_inquiry"
    assert body["engagement_continuity_mode"] == "follow_up"
    assert body["writeback_depth"] == "milestone"
    assert body["case_world_draft"] is not None
    assert body["case_world_draft"]["canonical_intake_summary"]["problem_statement"]
    assert body["case_world_draft"]["task_interpretation"]["capability"]
    assert body["case_world_draft"]["facts"]
    assert body["case_world_draft"]["next_best_actions"]
    assert body["case_world_state"] is not None
    assert body["case_world_state"]["active_task_ids"] == [body["id"]]
    assert "work slice" in body["world_work_slice_summary"]
    assert body["matter_workspace"]["engagement_continuity_mode"] == "follow_up"
    assert body["matter_workspace"]["writeback_depth"] == "milestone"


@pytest.mark.parametrize(
    ("initial_payload", "expected_mode", "expected_count"),
    [
        ({}, "one_line_inquiry", 0),
        (
            {
                "initial_source_urls": ["https://example.com/report"],
            },
            "single_document_intake",
            1,
        ),
        (
            {
                "initial_source_urls": ["https://example.com/report"],
                "initial_file_descriptors": [
                    {
                        "file_name": "notes.txt",
                        "content_type": "text/plain",
                        "file_size": 120,
                    }
                ],
            },
            "multi_material_case",
            2,
        ),
    ],
)
def test_task_creation_compiles_world_first_from_initial_material_state(
    client: TestClient,
    initial_payload: dict,
    expected_mode: str,
    expected_count: int,
) -> None:
    payload = create_task_payload("World-first intake")
    payload.update(initial_payload)

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["case_world_state"] is not None
    assert body["case_world_state"]["canonical_intake_summary"]["resolved_input_state"] == expected_mode
    assert body["case_world_state"]["canonical_intake_summary"]["planned_material_count"] == expected_count
    assert body["case_world_state"]["latest_task_id"] == body["id"]
    assert body["case_world_state"]["latest_task_title"] == body["title"]


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


def test_case_world_state_points_to_world_authority_spine(client: TestClient) -> None:
    payload = create_task_payload("World authority spine")
    payload.update(
        {
            "client_name": "Evergreen Consulting",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Evergreen 營運盤點",
            "workstream_name": "營運效率優化",
            "decision_title": "Evergreen decision context",
            "judgment_to_make": "先判斷目前的營運效率瓶頸是否已足以支持流程重整。",
            "domain_lenses": ["營運"],
        }
    )

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["client"]["identity_scope"] == "world_authority"
    assert body["engagement"]["identity_scope"] == "world_authority"
    assert body["workstream"]["identity_scope"] == "world_authority"
    assert body["slice_decision_context"] is None
    assert body["decision_context"]["identity_scope"] == "world_authority"
    assert body["world_decision_context"]["identity_scope"] == "world_authority"
    assert body["case_world_state"]["client_id"]
    assert body["case_world_state"]["engagement_id"]
    assert body["case_world_state"]["workstream_id"]
    assert body["case_world_state"]["decision_context_id"]

    workspace_response = client.get(f"/api/v1/matters/{body['matter_workspace']['id']}")
    assert workspace_response.status_code == 200
    workspace = workspace_response.json()
    assert workspace["client"]["identity_scope"] == "world_authority"
    assert workspace["engagement"]["identity_scope"] == "world_authority"
    assert workspace["workstream"]["identity_scope"] == "world_authority"
    assert workspace["current_decision_context"]["identity_scope"] == "world_authority"
    assert workspace["client"]["id"] == body["case_world_state"]["client_id"]
    assert workspace["engagement"]["id"] == body["case_world_state"]["engagement_id"]
    assert workspace["workstream"]["id"] == body["case_world_state"]["workstream_id"]
    assert workspace["current_decision_context"]["id"] == body["case_world_state"]["decision_context_id"]


def test_world_decision_context_prefers_canonical_world_payload_over_slice_fallback(
    client: TestClient,
) -> None:
    payload = create_task_payload("World payload decision context")
    payload["assumptions"] = "原始世界假設仍成立"

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    task_id = body["id"]
    matter_id = body["matter_workspace"]["id"]

    with SessionLocal() as db:
        task = db.get(models.Task, task_id)
        assert task is not None
        for goal in list(task.goals):
            db.delete(goal)
        for constraint in list(task.constraints):
            db.delete(constraint)
        if task.contexts:
            task.contexts[-1].assumptions = ""
            db.add(task.contexts[-1])
        db.commit()

    workspace = client.get(f"/api/v1/matters/{matter_id}").json()
    assert workspace["current_decision_context"]["identity_scope"] == "world_authority"
    assert workspace["current_decision_context"]["goals"] == [
        "Highlight the strongest findings and next actions."
    ]
    assert "Keep the output internal-only for now." in workspace["current_decision_context"]["constraints"]
    assert "原始世界假設仍成立" in "\n".join(workspace["current_decision_context"]["assumptions"])

    refreshed_task = client.get(f"/api/v1/tasks/{task_id}").json()
    assert refreshed_task["decision_context"]["identity_scope"] == "world_authority"
    assert refreshed_task["slice_decision_context"] is None
    assert refreshed_task["decision_context"]["goals"] == [
        "Highlight the strongest findings and next actions."
    ]


def test_slice_decision_context_only_surfaces_meaningful_overlay(client: TestClient) -> None:
    payload = create_task_payload("Meaningful overlay")
    response = client.post("/api/v1/tasks", json=payload)
    assert response.status_code == 201
    task_id = response.json()["id"]

    with SessionLocal() as db:
        task = db.get(models.Task, task_id)
        assert task is not None
        overlay = next(
            item for item in task.decision_contexts if item.identity_scope == "slice_overlay"
        )
        overlay.summary = "這是只屬於目前 work slice 的暫時判斷。"
        overlay.goal_summary = "先只在這個 slice 內檢查一輪。"
        db.add(overlay)
        db.commit()

    refreshed_task = client.get(f"/api/v1/tasks/{task_id}").json()
    assert refreshed_task["decision_context"]["identity_scope"] == "world_authority"
    assert refreshed_task["decision_context"]["summary"] != "這是只屬於目前 work slice 的暫時判斷。"
    assert refreshed_task["slice_decision_context"]["identity_scope"] == "slice_overlay"
    assert refreshed_task["slice_decision_context"]["summary"] == "這是只屬於目前 work slice 的暫時判斷。"
    assert refreshed_task["slice_decision_context"]["goals"] == ["先只在這個 slice 內檢查一輪。"]


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
            "judgment_to_make": "先判斷目前 SaaS 提案重組是否足以提升成交效率。",
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
    assert "marketing_sales_pack" in item["selected_pack_ids"]
    assert item["selected_pack_names"]
    assert item["pack_summary"]


def test_task_aggregate_includes_matter_workspace_summary(client: TestClient) -> None:
    payload = create_task_payload("Matter summary aggregate")
    payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "個人品牌與服務",
            "client_stage": "創業階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案重組與銷售收斂",
            "decision_title": "Northwind decision context",
            "judgment_to_make": "先判斷目前提案骨架是否足以支撐後續成交轉換。",
            "domain_lenses": ["銷售", "行銷"],
        }
    )

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["matter_workspace"] is not None
    assert body["matter_workspace"]["object_path"] == (
        "Northwind Studio / Northwind Growth Sprint / 提案重組與銷售收斂"
    )
    assert body["matter_workspace"]["total_task_count"] == 1
    assert body["matter_workspace"]["active_task_count"] == 1


def test_matter_workspace_routes_return_cross_task_continuity(client: TestClient) -> None:
    shared_payload = create_task_payload("Northwind growth sprint")
    shared_payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "個人品牌與服務",
            "client_stage": "創業階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案重組與銷售收斂",
            "decision_title": "Northwind primary decision",
            "judgment_to_make": "先判斷提案重組是否足以提升成交效率。",
            "domain_lenses": ["銷售", "行銷"],
        }
    )
    follow_up_payload = create_task_payload("Northwind follow-up")
    follow_up_payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "個人品牌與服務",
            "client_stage": "創業階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案重組與銷售收斂",
            "decision_title": "Northwind follow-up decision",
            "judgment_to_make": "先判斷新的提案摘要是否應該優先強化報價與成交主張。",
            "domain_lenses": ["銷售", "行銷"],
        }
    )

    first_task = client.post("/api/v1/tasks", json=shared_payload).json()
    second_task = client.post("/api/v1/tasks", json=follow_up_payload).json()
    run_response = client.post(f"/api/v1/tasks/{first_task['id']}/run")

    assert run_response.status_code == 200

    matters_response = client.get("/api/v1/matters")
    assert matters_response.status_code == 200
    matter = next(
        item
        for item in matters_response.json()
        if item["object_path"] == "Northwind Studio / Northwind Growth Sprint / 提案重組與銷售收斂"
    )
    assert matter["total_task_count"] == 2
    assert matter["deliverable_count"] >= 1

    workspace_response = client.get(f"/api/v1/matters/{matter['id']}")
    assert workspace_response.status_code == 200
    workspace = workspace_response.json()
    assert workspace["summary"]["total_task_count"] == 2
    assert len(workspace["related_tasks"]) == 2
    assert workspace["decision_trajectory"]
    assert workspace["related_deliverables"]
    assert workspace["readiness_hint"]
    assert workspace["continuity_notes"]
    assert {item["id"] for item in workspace["related_tasks"]} == {
        first_task["id"],
        second_task["id"],
    }


def test_shared_materials_and_evidence_follow_world_spine_across_task_slices(
    client: TestClient,
) -> None:
    shared_payload = create_task_payload("Northwind shared materials")
    shared_payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "個人品牌與服務",
            "client_stage": "創業階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案重組與銷售收斂",
            "decision_title": "Northwind primary decision",
            "judgment_to_make": "先判斷提案重組是否足以提升成交效率。",
            "domain_lenses": ["銷售", "行銷"],
        }
    )
    follow_up_payload = create_task_payload("Northwind shared materials follow-up")
    follow_up_payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "個人品牌與服務",
            "client_stage": "創業階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案重組與銷售收斂",
            "decision_title": "Northwind secondary decision",
            "judgment_to_make": "先判斷新的提案摘要是否應該優先強化報價與成交主張。",
            "domain_lenses": ["銷售", "行銷"],
        }
    )

    first_task = client.post("/api/v1/tasks", json=shared_payload).json()
    upload_response = client.post(
        f"/api/v1/tasks/{first_task['id']}/uploads",
        files=[("files", ("northwind-notes.txt", b"Northwind proposal notes with stronger commercial evidence.", "text/plain"))],
    )
    assert upload_response.status_code == 200

    refreshed_first = client.get(f"/api/v1/tasks/{first_task['id']}").json()
    shared_material = next(
        item for item in refreshed_first["source_materials"] if item["continuity_scope"] == "world_shared"
    )
    shared_evidence = next(
        item for item in refreshed_first["evidence"] if item["continuity_scope"] == "world_shared"
    )
    assert shared_material["continuity_scope"] == "world_shared"
    assert shared_evidence["continuity_scope"] == "world_shared"

    second_task = client.post("/api/v1/tasks", json=follow_up_payload).json()
    refreshed_second = client.get(f"/api/v1/tasks/{second_task['id']}").json()

    assert any(
        item["id"] == shared_material["id"]
        and item["matter_workspace_id"] == first_task["matter_workspace"]["id"]
        and item["continuity_scope"] == "world_shared"
        for item in refreshed_second["source_materials"]
    )
    assert any(
        item["id"] == shared_evidence["id"]
        and item["matter_workspace_id"] == first_task["matter_workspace"]["id"]
        and item["continuity_scope"] == "world_shared"
        for item in refreshed_second["evidence"]
    )

    second_upload_response = client.post(
        f"/api/v1/tasks/{second_task['id']}/uploads",
        files=[("files", ("northwind-notes.txt", b"Northwind proposal notes with stronger commercial evidence.", "text/plain"))],
    )
    assert second_upload_response.status_code == 200
    reused_item = second_upload_response.json()["uploaded"][0]
    assert reused_item["source_material"]["id"] == shared_material["id"]
    assert reused_item["evidence"]["id"] == shared_evidence["id"]
    assert reused_item["source_material"]["continuity_scope"] == "world_shared"

    refreshed_second_after_upload = client.get(f"/api/v1/tasks/{second_task['id']}").json()
    reused_material = next(
        item for item in refreshed_second_after_upload["source_materials"] if item["id"] == shared_material["id"]
    )
    reused_evidence = next(
        item for item in refreshed_second_after_upload["evidence"] if item["id"] == shared_evidence["id"]
    )
    assert reused_material["participation"]["current_task_participation"] is True
    assert reused_material["participation"]["participation_task_count"] == 2
    assert reused_material["participation"]["participation_type"] == "shared_reuse"
    assert reused_evidence["participation"]["current_task_participation"] is True
    assert reused_evidence["participation"]["participation_task_count"] == 2

    workspace = client.get(f"/api/v1/matters/{first_task['matter_workspace']['id']}").json()
    assert workspace["summary"]["source_material_count"] == 1
    assert workspace["summary"]["artifact_count"] >= 1


def test_core_context_keeps_world_authority_and_slice_overlay_rows(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Overlay scope rows")).json()

    with SessionLocal() as db:
        task_row = db.get(models.Task, task["id"])
        assert task_row is not None
        assert {item.identity_scope for item in task_row.clients} == {
            "slice_overlay",
            "world_authority",
        }
        assert {item.identity_scope for item in task_row.engagements} == {
            "slice_overlay",
            "world_authority",
        }
        assert {item.identity_scope for item in task_row.workstreams} == {
            "slice_overlay",
            "world_authority",
        }
        assert {item.identity_scope for item in task_row.decision_contexts} == {
            "slice_overlay",
            "world_authority",
        }


def test_world_shared_materials_create_participation_links(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Participation link rows")).json()
    upload_response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("participation.txt", b"Evidence that should become world-shared.", "text/plain"))],
    )
    assert upload_response.status_code == 200

    with SessionLocal() as db:
        task_row = db.get(models.Task, task["id"])
        assert task_row is not None
        link_types = {item.object_type for item in task_row.object_participation_links}
        assert {
            "source_material",
            "artifact",
            "evidence",
        }.issubset(link_types)


def test_artifact_evidence_workspace_route_returns_formal_source_and_support_chains(
    client: TestClient,
) -> None:
    payload = create_contract_review_payload("Artifact evidence workspace")
    payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Risk Review",
            "workstream_name": "合約與風險審閱",
            "decision_title": "Northwind legal review decision",
            "judgment_to_make": "先判斷這份合作文件是否已具備可接受的責任與終止條款邊界。",
            "domain_lenses": ["法務", "營運"],
        }
    )

    task = client.post("/api/v1/tasks", json=payload).json()
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

    matter = client.get("/api/v1/matters").json()[0]
    workspace_response = client.get(
        f"/api/v1/matters/{matter['id']}/artifact-evidence"
    )

    assert workspace_response.status_code == 200
    workspace = workspace_response.json()
    assert workspace["matter_summary"]["id"] == matter["id"]
    assert workspace["current_decision_context"]["identity_scope"] == "world_authority"
    assert workspace["source_material_cards"]
    assert workspace["artifact_cards"]
    assert workspace["evidence_chains"]
    assert workspace["sufficiency_summary"]
    assert workspace["high_impact_gaps"] is not None
    assert workspace["continuity_notes"] is not None
    assert any(
        item["linked_recommendations"] or item["linked_risks"] or item["linked_action_items"]
        for item in workspace["evidence_chains"]
    )


def test_deliverable_workspace_route_returns_formal_deliverable_context(
    client: TestClient,
) -> None:
    payload = create_task_payload("Deliverable workspace")
    payload.update(
        {
            "description": "請先判斷電商品牌的通路、回購與毛利結構是否需要調整，並形成正式交付物。",
            "client_name": "Northwind Commerce",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Commerce Sprint",
            "workstream_name": "通路與毛利決策",
            "decision_title": "Northwind commerce decision",
            "judgment_to_make": "先判斷目前電商品牌是否應優先調整通路組合與 SKU 結構。",
            "domain_lenses": ["營運", "財務", "行銷"],
        }
    )

    task = client.post("/api/v1/tasks", json=payload).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "commerce-notes.txt",
                    b"Repeat purchase is falling while marketplace commissions are rising. Best-selling SKUs have lower contribution margin than expected.",
                    "text/plain",
                ),
            )
        ],
    )

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run_response.status_code == 200
    deliverable_id = run_response.json()["deliverable"]["id"]

    workspace_response = client.get(f"/api/v1/deliverables/{deliverable_id}")

    assert workspace_response.status_code == 200
    workspace = workspace_response.json()
    assert workspace["deliverable"]["id"] == deliverable_id
    assert workspace["task"]["id"] == task["id"]
    assert workspace["task"]["client"]["identity_scope"] == "world_authority"
    assert workspace["task"]["world_decision_context"]["identity_scope"] == "world_authority"
    assert workspace["deliverable_class"] in {
        "assessment_review_memo",
        "decision_action_deliverable",
    }
    assert workspace["workspace_status"] == "current"
    assert workspace["linked_evidence"]
    assert workspace["linked_recommendations"]
    assert workspace["linked_risks"] is not None
    assert workspace["linked_action_items"] is not None
    assert workspace["confidence_summary"]
    assert workspace["limitation_notes"] is not None
    assert workspace["continuity_notes"] is not None


def test_matter_workspace_metadata_update_persists_and_survives_workspace_sync(
    client: TestClient,
) -> None:
    shared_payload = create_task_payload("Matter metadata sync")
    shared_payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案重組與銷售收斂",
            "decision_title": "Northwind matter metadata",
            "judgment_to_make": "先判斷提案重組是否要先收斂核心成交主張。",
            "domain_lenses": ["銷售", "行銷"],
        }
    )

    first_task = client.post("/api/v1/tasks", json=shared_payload).json()
    matter = client.get("/api/v1/matters").json()[0]

    update_response = client.put(
        f"/api/v1/matters/{matter['id']}/metadata",
        json={
            "title": "北風提案收斂案",
            "summary": "先聚焦提案主張、來源厚度與下一份交付物改版。",
            "status": "paused",
        },
    )

    assert update_response.status_code == 200
    updated_workspace = update_response.json()
    assert updated_workspace["summary"]["title"] == "北風提案收斂案"
    assert updated_workspace["summary"]["workspace_summary"] == "先聚焦提案主張、來源厚度與下一份交付物改版。"
    assert updated_workspace["summary"]["status"] == "paused"

    follow_up_payload = create_task_payload("Matter metadata follow-up")
    follow_up_payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案重組與銷售收斂",
            "decision_title": "Northwind matter metadata follow-up",
            "judgment_to_make": "再確認提案摘要是否要補強價格與成交風險。",
            "domain_lenses": ["銷售", "行銷"],
        }
    )
    client.post("/api/v1/tasks", json=follow_up_payload).json()

    matter_after = next(
        item for item in client.get("/api/v1/matters").json() if item["id"] == matter["id"]
    )
    assert matter_after["title"] == "北風提案收斂案"
    assert matter_after["workspace_summary"] == "先聚焦提案主張、來源厚度與下一份交付物改版。"
    assert matter_after["status"] == "paused"
    assert first_task["matter_workspace"]["id"] == matter["id"]


def test_deliverable_metadata_update_persists_to_workspace_and_task_list(
    client: TestClient,
) -> None:
    payload = create_task_payload("Deliverable metadata update")
    payload.update(
        {
            "description": "請先判斷是否該優先調整通路組合與 SKU 結構，並形成正式交付物。",
            "client_name": "Northwind Commerce",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Commerce Sprint",
            "workstream_name": "通路與毛利決策",
            "decision_title": "Northwind deliverable metadata",
            "judgment_to_make": "先判斷目前是否該優先調整通路組合與 SKU 結構。",
            "domain_lenses": ["營運", "財務", "行銷"],
        }
    )

    task = client.post("/api/v1/tasks", json=payload).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "commerce-notes.txt",
                    b"Repeat purchase is falling while marketplace commissions are rising.",
                    "text/plain",
                ),
            )
        ],
    )
    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")
    deliverable_id = run_response.json()["deliverable"]["id"]

    update_response = client.put(
        f"/api/v1/deliverables/{deliverable_id}/metadata",
        json={
            "title": "正式通路調整備忘錄",
            "summary": "先收斂通路結構，再處理 SKU 與回購節奏。",
            "status": "pending_confirmation",
            "version_tag": "v1.1",
        },
    )

    assert update_response.status_code == 200
    updated_workspace = update_response.json()
    assert updated_workspace["deliverable"]["title"] == "正式通路調整備忘錄"
    assert updated_workspace["deliverable"]["summary"] == "先收斂通路結構，再處理 SKU 與回購節奏。"
    assert updated_workspace["deliverable"]["status"] == "pending_confirmation"
    assert updated_workspace["deliverable"]["version_tag"] == "v1.1"

    reloaded_workspace = client.get(f"/api/v1/deliverables/{deliverable_id}").json()
    assert reloaded_workspace["deliverable"]["title"] == "正式通路調整備忘錄"
    assert reloaded_workspace["deliverable"]["summary"] == "先收斂通路結構，再處理 SKU 與回購節奏。"
    assert reloaded_workspace["deliverable"]["status"] == "pending_confirmation"
    assert reloaded_workspace["deliverable"]["version_tag"] == "v1.1"

    task_list_item = next(
        item for item in client.get("/api/v1/tasks").json() if item["id"] == task["id"]
    )
    assert task_list_item["latest_deliverable_title"] == "正式通路調整備忘錄"
    assert task_list_item["latest_deliverable_summary"] == "先收斂通路結構，再處理 SKU 與回購節奏。"
    assert task_list_item["latest_deliverable_status"] == "pending_confirmation"
    assert task_list_item["latest_deliverable_version_tag"] == "v1.1"


def test_task_aggregate_includes_pack_resolution_from_context_spine(client: TestClient) -> None:
    payload = create_task_payload("Pack-aware aggregate")
    payload.update(
        {
            "description": "請判斷這個電商品牌是否該優先調整通路配置、SKU 組合與回購策略。",
            "client_name": "Orbit Labs",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Orbit Growth Review",
            "workstream_name": "營運與財務收斂",
            "domain_lenses": ["營運", "財務"],
            "judgment_to_make": "先判斷電商品牌的通路配置、SKU 組合與回購策略是否需要優先調整。",
        }
    )

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["pack_resolution"]["selected_domain_packs"]
    assert any(
        item["pack_id"] == "operations_pack"
        for item in body["pack_resolution"]["selected_domain_packs"]
    )
    assert any(
        item["pack_id"] == "finance_fundraising_pack"
        for item in body["pack_resolution"]["selected_domain_packs"]
    )
    operations_pack = next(
        item
        for item in body["pack_resolution"]["selected_domain_packs"]
        if item["pack_id"] == "operations_pack"
    )
    assert operations_pack["domain_definition"]
    assert operations_pack["common_problem_patterns"]
    assert operations_pack["key_kpis_or_operating_signals"]
    assert operations_pack["scope_boundaries"]
    assert operations_pack["pack_rationale"]
    assert any(
        item["pack_id"] == "ecommerce_pack"
        for item in body["pack_resolution"]["selected_industry_packs"]
    )
    ecommerce_pack = next(
        item
        for item in body["pack_resolution"]["selected_industry_packs"]
        if item["pack_id"] == "ecommerce_pack"
    )
    assert ecommerce_pack["industry_definition"]
    assert ecommerce_pack["key_kpis"]
    assert ecommerce_pack["decision_patterns"]
    assert body["pack_resolution"]["resolver_notes"]
    assert body["pack_resolution"]["evidence_expectations"]
    assert "operations_pack" in body["case_world_state"]["selected_domain_packs"]
    assert "ecommerce_pack" in body["case_world_state"]["selected_industry_packs"]
    assert body["agent_selection"]["host_agent"]["agent_id"] == "host_agent"
    assert body["agent_selection"]["selected_agent_ids"]
    assert body["agent_selection"]["selected_agent_names"]
    assert "deferred_agent_notes" in body["agent_selection"]
    assert "escalation_notes" in body["agent_selection"]


def test_task_aggregate_supports_second_wave_industry_and_new_domain_packs(client: TestClient) -> None:
    payload = create_multi_agent_payload("Second-wave pack aggregate")
    payload.update(
        {
            "description": "請判斷這家 SaaS 公司是否該先重整產品方案、定價與組織人力配置，再擴大 enterprise pipeline。",
            "client_name": "Northstar Cloud",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northstar Growth and Org Review",
            "workstream_name": "產品 / 組織收斂",
            "domain_lenses": ["產品服務", "組織人力", "銷售"],
            "judgment_to_make": "先判斷這家 SaaS 公司是否應優先重整 offer architecture、pricing 與團隊設計，再擴大 enterprise pipeline。",
        }
    )

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert any(
        item["pack_id"] == "organization_people_pack"
        for item in body["pack_resolution"]["selected_domain_packs"]
    )
    assert any(
        item["pack_id"] == "product_service_pack"
        for item in body["pack_resolution"]["selected_domain_packs"]
    )
    assert any(
        item["pack_id"] == "saas_pack"
        for item in body["pack_resolution"]["selected_industry_packs"]
    )
    assert {
        item["pack_id"] for item in body["pack_resolution"]["selected_industry_packs"]
    } == {"saas_pack"}
    assert body["pack_resolution"]["deliverable_presets"]
    assert body["pack_resolution"]["evidence_expectations"]
    assert "strategy_decision_agent" in body["agent_selection"]["selected_agent_ids"]
    assert body["agent_selection"]["rationale"]
    assert any("Domain / Functional Packs" in item for item in body["agent_selection"]["rationale"])
    assert any("Industry Packs" in item for item in body["agent_selection"]["rationale"])
    assert body["agent_selection"]["deferred_agent_notes"]


def test_extension_manager_endpoint_returns_catalogs(client: TestClient) -> None:
    response = client.get("/api/v1/extensions/manager")

    assert response.status_code == 200
    body = response.json()
    assert body["pack_registry"]["packs"]
    assert body["agent_registry"]["agents"]
    assert body["agent_registry"]["host_agent_id"] == "host_agent"


def test_task_extension_overrides_write_back_to_aggregate(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Override task")).json()

    response = client.put(
        f"/api/v1/tasks/{task['id']}/extensions",
        json={
            "pack_override_ids": ["legal_risk_pack", "online_education_pack"],
            "agent_override_ids": ["legal_risk_agent", "research_intelligence_agent"],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["pack_resolution"]["override_pack_ids"] == [
        "legal_risk_pack",
        "online_education_pack",
    ]
    assert any(
        item["pack_id"] == "legal_risk_pack"
        for item in body["pack_resolution"]["selected_domain_packs"]
    )
    assert any(
        item["pack_id"] == "online_education_pack"
        for item in body["pack_resolution"]["selected_industry_packs"]
    )
    assert body["agent_selection"]["override_agent_ids"] == [
        "legal_risk_agent",
        "research_intelligence_agent",
    ]
    assert "legal_risk_agent" in body["agent_selection"]["selected_agent_ids"]
    assert "research_intelligence_agent" in body["agent_selection"]["selected_agent_ids"]
    assert "deferred_agent_notes" in body["agent_selection"]
    assert "escalation_notes" in body["agent_selection"]


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
    assert uploaded["source_material"]["source_document_id"] == uploaded["source_document"]["id"]
    assert uploaded["artifact"]["source_document_id"] == uploaded["source_document"]["id"]
    assert uploaded["artifact"]["source_material_id"] == uploaded["source_material"]["id"]

    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert aggregate["source_materials"]
    assert aggregate["artifacts"]
    assert aggregate["input_entry_mode"] == "single_document_intake"
    assert aggregate["presence_state_summary"]["artifact"]["state"] == "explicit"
    assert aggregate["source_materials"][0]["source_document_id"] == uploaded["source_document"]["id"]
    assert aggregate["artifacts"][0]["source_document_id"] == uploaded["source_document"]["id"]


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
    payload = create_task_payload("Specialist run")
    payload.update(
        {
            "description": "Turn the ecommerce working notes into a structured internal synthesis for channel, SKU, and retention decisions.",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "domain_lenses": ["營運", "財務"],
            "judgment_to_make": "先判斷電商品牌的通路、SKU 與回購策略是否需要調整。",
        }
    )
    task = client.post("/api/v1/tasks", json=payload).json()
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
    assert "operations_pack" in content["capability_frame"]["selected_domain_pack_ids"]
    assert "ecommerce_pack" in content["capability_frame"]["selected_industry_pack_ids"]
    assert "host_agent" == content["capability_frame"]["host_agent"]
    assert "research_synthesis_specialist" in content["capability_frame"]["selected_specialist_agents"]
    assert content["capability_frame"]["selected_agent_details"]
    assert content["agent_selection"]["selected_agent_ids"]
    assert "deferred_agent_notes" in content["capability_frame"]
    assert "escalation_notes" in content["capability_frame"]
    assert "agent_selection_implications" in content["readiness_governance"]
    assert content["selected_packs"]["selected_domain_packs"]
    assert content["selected_packs"]["selected_industry_packs"]
    assert content["selected_packs"]["selected_domain_packs"][0]["domain_definition"]
    assert content["selected_packs"]["selected_domain_packs"][0]["common_problem_patterns"]
    assert content["selected_packs"]["selected_industry_packs"][0]["key_kpis"]
    assert content["selected_packs"]["selected_industry_packs"][0]["decision_patterns"]
    assert content["readiness_governance"]["pack_evidence_expectations"]
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
    assert run_body["recommendations"][0]["supporting_evidence_ids"]
    assert run_body["deliverable"]["linked_objects"]
    assert any(
        item["object_type"] == "decision_context"
        for item in run_body["deliverable"]["linked_objects"]
    )
    assert any(
        item["object_type"] == "evidence"
        for item in run_body["deliverable"]["linked_objects"]
    )

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
    assert run_body["recommendations"][0]["supporting_evidence_ids"]
    assert any(
        item["object_type"] == "recommendation"
        for item in run_body["deliverable"]["linked_objects"]
    )

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

    assert response.status_code == 503
    assert "Mock 模型供應器的失敗模式目前已啟用" in response.json()["detail"]

    refreshed = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert refreshed["status"] == "failed"
    assert refreshed["runs"][0]["status"] == "failed"
    assert refreshed["deliverables"] == []

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
    assert content["capability_frame"]["selected_agents"]
    assert content["capability_frame"]["selected_agent_details"]
    assert content["capability_frame"]["runtime_agents"]
    assert content["capability_frame"]["selected_supporting_agents"] == content["participating_agents"][1:]
    assert "deferred_agent_notes" in content["agent_selection"]
    assert "escalation_notes" in content["agent_selection"]
    assert content["deliverable_class"] == "decision_action_deliverable"
    assert content["readiness_governance"]["evidence_coverage"]
    assert "strategy_business_analysis" in content["participating_agents"]
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
    assert body["recommendations"][0]["supporting_evidence_ids"]
    assert any(item["object_type"] == "workstream" for item in body["deliverable"]["linked_objects"])
    assert any(item["object_type"] == "evidence" for item in body["deliverable"]["linked_objects"])

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
    assert content["agent_selection"]["deferred_agent_notes"]
    assert content["agent_selection"]["escalation_notes"]


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


def test_external_search_persists_research_run_and_source_provenance(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.agents import host as host_module
    from app.services import sources as source_service

    payload = create_task_payload("Research provenance")
    payload["external_data_strategy"] = "supplemental"
    task = client.post("/api/v1/tasks", json=payload).json()

    monkeypatch.setattr(
        host_module,
        "search_external_sources",
        lambda query: [
            SearchResult(
                title="Public source",
                url="https://example.com/public-source",
                snippet="Public source",
            )
        ],
    )
    monkeypatch.setattr(
        source_service,
        "fetch_remote_source",
        lambda url: RemoteSourceContent(
            source_type="manual_url",
            source_url=url,
            title="Public source",
            content_type="text/html",
            normalized_text="External public source says implementation quality is the main bottleneck.",
        ),
    )

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert run_response.status_code == 200
    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert aggregate["research_runs"]
    assert aggregate["research_runs"][0]["source_count"] >= 1
    assert aggregate["research_runs"][0]["query"]
    assert any(item["research_run_id"] == aggregate["research_runs"][0]["id"] for item in aggregate["uploads"])


def test_continuous_writeback_creates_decision_and_outcome_records(
    client: TestClient,
) -> None:
    payload = create_task_payload("Continuous writeback")
    payload["external_data_strategy"] = "strict"
    payload["engagement_continuity_mode"] = "continuous"
    payload["writeback_depth"] = "full"
    task = client.post("/api/v1/tasks", json=payload).json()

    upload_response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("notes.txt", b"Margin is down while retention is stable and support load is rising.", "text/plain"))],
    )
    assert upload_response.status_code == 200

    first_run = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert first_run.status_code == 200
    first_aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert len(first_aggregate["decision_records"]) == 1
    assert len(first_aggregate["action_plans"]) == 1
    assert first_aggregate["action_executions"]
    assert first_aggregate["outcome_records"] == []

    follow_up_ingest = client.post(
        f"/api/v1/tasks/{task['id']}/sources",
        json={
            "urls": [],
            "pasted_text": "Follow-up note: support tickets are still rising after the first pricing test.",
            "pasted_title": "Follow-up outcome note",
        },
    )
    assert follow_up_ingest.status_code == 200

    second_run = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert second_run.status_code == 200
    second_aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert len(second_aggregate["decision_records"]) >= 2
    assert len(second_aggregate["outcome_records"]) >= 1


def test_matter_follow_up_sources_update_world_first(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Matter follow-up world")).json()
    matter_id = task["matter_workspace"]["id"]

    response = client.post(
        f"/api/v1/matters/{matter_id}/sources",
        json={
            "urls": ["https://example.com/follow-up"],
            "pasted_text": "Follow-up note about channel performance and margin pressure.",
            "pasted_title": "Follow-up note",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["world_updated_first"] is True
    assert body["matter_workspace_id"] == matter_id
    assert body["world_update_summary"]

    refreshed_task = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert refreshed_task["case_world_state"]["supplement_count"] >= 1
    assert refreshed_task["case_world_state"]["last_supplement_summary"]


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
    monkeypatch.setattr(settings, "openai_model", "gpt-5.4")
    monkeypatch.setattr(settings, "openai_base_url", "https://api.openai.com/v1")
    monkeypatch.setattr(settings, "openai_timeout_seconds", 30)

    provider = get_model_provider()

    assert isinstance(provider, OpenAIModelProvider)


def test_factory_raises_when_openai_key_is_missing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.core.config import settings
    from app.model_router.factory import get_model_provider
    from app.model_router.base import ModelProviderError

    monkeypatch.setattr(settings, "model_provider", "openai")
    monkeypatch.setattr(settings, "openai_api_key", None)

    with pytest.raises(ModelProviderError):
        get_model_provider()


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
        assert request_body["model"] == "gpt-5.4-mini"
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
        model="gpt-5.4-mini",
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


def test_openai_provider_retries_once_after_timeout(
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

    attempts: list[int] = []

    def fake_urlopen(http_request, timeout):  # noqa: ANN001
        attempts.append(timeout)
        if len(attempts) == 1:
            raise TimeoutError("The read operation timed out")
        return FakeResponse(
            {
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(
                                {
                                    "problem_definition": "Retry test",
                                    "background_summary": "Retried successfully",
                                    "findings": ["Recovered finding"],
                                    "risks": ["Recovered risk"],
                                    "recommendations": ["Recovered recommendation"],
                                    "action_items": ["Recovered action"],
                                    "missing_information": [],
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
        model="gpt-5.4",
        base_url="https://api.openai.com/v1",
        timeout_seconds=60,
    )

    result = provider.generate_research_synthesis(
        ResearchSynthesisRequest(
            task_title="Retry timeout task",
            task_description="Retry timeout description",
            background_text="Background",
            goals=["Goal"],
            constraints=["Constraint"],
            evidence=[{"id": "e1", "title": "Evidence", "content": "Useful evidence"}],
        )
    )

    assert attempts == [60, 120]
    assert result.findings == ["Recovered finding"]


def test_specialist_run_fails_closed_when_model_provider_errors(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    payload = create_task_payload("Provider failure should fail closed")
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()
    monkeypatch.setenv("MODEL_PROVIDER_FAILURE_MODE", "always_fail")

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 503
    assert "Mock 模型供應器的失敗模式目前已啟用" in response.json()["detail"]

    refreshed = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert refreshed["status"] == "failed"
    assert refreshed["runs"][0]["status"] == "failed"
    assert refreshed["deliverables"] == []
