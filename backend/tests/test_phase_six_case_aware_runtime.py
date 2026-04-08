from __future__ import annotations

from fastapi.testclient import TestClient

from app.services.phase_six_generalist_governance import (
    PhaseSixCaseContext,
    build_phase_six_calibration_aware_weighting,
    build_phase_six_confidence_calibration,
    build_phase_six_context_distance_audit,
    build_phase_six_generalist_guidance_posture,
)


def _build_case_context(**overrides: object) -> PhaseSixCaseContext:
    payload = {
        "client_stage": "制度化階段",
        "client_type": "中小企業",
        "domain_lenses": ["法務"],
        "evidence_count": 4,
        "unresolved_evidence_gap_count": 0,
        "selected_domain_pack_ids": ["legal_risk_pack"],
        "selected_industry_pack_ids": [],
    }
    payload.update(overrides)
    return PhaseSixCaseContext(**payload)


def _create_case_task(
    client: TestClient,
    *,
    title: str,
    client_stage: str | None,
    client_type: str | None,
    domain_lenses: list[str],
    upload_bytes: bytes | None,
) -> dict:
    payload = {
        "title": title,
        "description": "Review the agreement and converge the highest-priority legal risks.",
        "task_type": "contract_review",
        "mode": "specialist",
        "entry_preset": "one_line_inquiry",
        "external_data_strategy": "supplemental",
        "client_name": "Acme Corp",
        "client_stage": client_stage,
        "client_type": client_type,
        "engagement_name": "Agreement review",
        "workstream_name": "Contract risk scan",
        "domain_lenses": domain_lenses,
        "background_text": "Need a first-pass legal review before negotiation.",
        "subject_name": "MSA draft",
        "goal_description": "Identify the main contract risks and next-step recommendations.",
    }
    task = client.post("/api/v1/tasks", json=payload)
    assert task.status_code == 201
    task_payload = task.json()
    if upload_bytes is not None:
        upload = client.post(
            f"/api/v1/tasks/{task_payload['id']}/uploads",
            files=[("files", ("agreement.txt", upload_bytes, "text/plain"))],
        )
        assert upload.status_code == 200
        run = client.post(f"/api/v1/tasks/{task_payload['id']}/run")
        assert run.status_code == 200
    return task_payload


def test_phase_six_case_context_changes_guidance_and_reuse_confidence() -> None:
    rich_context = _build_case_context()
    sparse_context = _build_case_context(
        client_stage=None,
        client_type=None,
        domain_lenses=["綜合"],
        evidence_count=0,
        unresolved_evidence_gap_count=3,
        selected_domain_pack_ids=[],
    )

    rich_guidance = build_phase_six_generalist_guidance_posture(case_context=rich_context)
    sparse_guidance = build_phase_six_generalist_guidance_posture(case_context=sparse_context)
    assert rich_guidance.guidance_posture == "light_guidance"
    assert sparse_guidance.guidance_posture == "guarded_guidance"

    rich_distance = build_phase_six_context_distance_audit(case_context=rich_context)
    sparse_distance = build_phase_six_context_distance_audit(case_context=sparse_context)
    rich_playbook = next(
        item for item in rich_distance.distance_items if item.asset_code == "domain_playbook_contextual"
    )
    sparse_playbook = next(
        item for item in sparse_distance.distance_items if item.asset_code == "domain_playbook_contextual"
    )
    assert rich_playbook.reuse_confidence == "high_confidence"
    assert sparse_playbook.reuse_confidence == "low_confidence"

    rich_calibration = build_phase_six_confidence_calibration(case_context=rich_context)
    sparse_calibration = build_phase_six_confidence_calibration(case_context=sparse_context)
    rich_domain_lens = next(
        item for item in rich_calibration.calibration_items if item.axis_kind == "domain_lens"
    )
    sparse_domain_lens = next(
        item for item in sparse_calibration.calibration_items if item.axis_kind == "domain_lens"
    )
    assert rich_domain_lens.calibration_status == "aligned"
    assert sparse_domain_lens.calibration_status == "mismatch"

    rich_weighting = build_phase_six_calibration_aware_weighting(case_context=rich_context)
    sparse_weighting = build_phase_six_calibration_aware_weighting(case_context=sparse_context)
    rich_weighting_domain = next(
        item for item in rich_weighting.weighting_items if item.axis_kind == "domain_lens"
    )
    sparse_weighting_domain = next(
        item for item in sparse_weighting.weighting_items if item.axis_kind == "domain_lens"
    )
    assert rich_weighting_domain.weighting_effect == "allow_expand"
    assert sparse_weighting_domain.weighting_effect == "background_only"


def test_task_and_matter_phase_six_signals_follow_case_context(client: TestClient) -> None:
    rich_task = _create_case_task(
        client,
        title="Case-aware rich legal task",
        client_stage="制度化階段",
        client_type="中小企業",
        domain_lenses=["法務"],
        upload_bytes=b"Termination, indemnity, and liability clauses need immediate review.",
    )
    sparse_task = _create_case_task(
        client,
        title="Case-aware sparse legal task",
        client_stage=None,
        client_type=None,
        domain_lenses=["綜合"],
        upload_bytes=None,
    )

    rich_aggregate = client.get(f"/api/v1/tasks/{rich_task['id']}").json()
    sparse_aggregate = client.get(f"/api/v1/tasks/{sparse_task['id']}").json()

    assert rich_aggregate["generalist_guidance_posture"]["guidance_posture"] in {
        "balanced_guidance",
        "light_guidance",
    }
    assert sparse_aggregate["generalist_guidance_posture"]["guidance_posture"] == "guarded_guidance"
    assert (
        rich_aggregate["generalist_guidance_posture"]["guidance_posture"]
        != sparse_aggregate["generalist_guidance_posture"]["guidance_posture"]
    )

    rich_matter_id = rich_aggregate["matter_workspace"]["id"]
    rich_matter = client.get(f"/api/v1/matters/{rich_matter_id}").json()
    assert rich_matter["generalist_guidance_posture"]["guidance_posture"] in {
        "guarded_guidance",
        "balanced_guidance",
        "light_guidance",
    }
    assert rich_matter["generalist_guidance_posture"]["summary"]


def test_deliverable_workspace_phase_six_signals_follow_case_context(
    client: TestClient,
) -> None:
    prior_task = _create_case_task(
        client,
        title="Deliverable parity prior legal task",
        client_stage="制度化階段",
        client_type="中小企業",
        domain_lenses=["法務"],
        upload_bytes=b"Termination and liability clauses were the main gaps in the prior review.",
    )
    client.post(
        f"/api/v1/tasks/{prior_task['id']}/recommendations/"
        f"{client.get(f'/api/v1/tasks/{prior_task['id']}').json()['recommendations'][0]['id']}/feedback",
        json={
            "feedback_status": "template_candidate",
            "reason_codes": ["reusable_action_pattern"],
            "note": "這條工作主線值得保留成模式。",
        },
    )

    current_task = _create_case_task(
        client,
        title="Deliverable parity current legal task",
        client_stage="制度化階段",
        client_type="中小企業",
        domain_lenses=["法務"],
        upload_bytes=b"Renewal pricing and liability carve-outs still need review in the current round.",
    )
    current_aggregate = client.get(f"/api/v1/tasks/{current_task['id']}").json()
    deliverable_id = current_aggregate["deliverables"][0]["id"]

    workspace_response = client.get(f"/api/v1/deliverables/{deliverable_id}")
    assert workspace_response.status_code == 200
    workspace = workspace_response.json()

    assert workspace["task"]["generalist_guidance_posture"]["guidance_posture"] in {
        "balanced_guidance",
        "light_guidance",
    }
    assert workspace["task"]["reuse_confidence_signal"]["distance_items"]
    assert workspace["task"]["confidence_calibration_signal"]["calibration_items"]
    assert workspace["task"]["calibration_aware_weighting_signal"]["weighting_items"]
    assert workspace["task"]["organization_memory_guidance"]["status"] == "available"
    assert workspace["task"]["domain_playbook_guidance"]["status"] == "available"
