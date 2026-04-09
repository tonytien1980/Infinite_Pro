from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.database import SessionLocal
from app.domain import models
from app.services.phase_six_generalist_governance import (
    build_phase_six_feedback_linked_scoring_snapshot,
)
from app.services.workbench import PHASE_6_GENERALIST_GOVERNANCE_ID


def _create_feedback_task(client: TestClient, *, title: str) -> dict:
    response = client.post(
        "/api/v1/tasks",
        json={
            "title": title,
            "description": "Review the working draft and record consultant feedback.",
            "task_type": "contract_review",
            "mode": "specialist",
            "entry_preset": "one_line_inquiry",
            "external_data_strategy": "supplemental",
            "client_name": "Acme Corp",
            "client_stage": "制度化階段",
            "client_type": "中小企業",
            "engagement_name": "Contract review",
            "workstream_name": "Feedback scoring",
            "domain_lenses": ["法務"],
            "background_text": "Need a first-pass legal review before negotiation.",
            "subject_name": "MSA draft",
            "goal_description": "Capture the reusable signals from explicit consultant feedback.",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_phase_six_feedback_linked_snapshot_summarizes_explicit_feedback() -> None:
    snapshot = build_phase_six_feedback_linked_scoring_snapshot(
        adopted_count=2,
        needs_revision_count=1,
        not_adopted_count=1,
        template_candidate_count=3,
        governed_candidate_count=4,
        promoted_candidate_count=2,
        dismissed_candidate_count=1,
        override_signal_count=2,
        top_asset_codes=["domain_playbook", "review_lens"],
    )

    assert snapshot.adopted_count == 2
    assert snapshot.override_signal_count == 2
    assert snapshot.top_asset_codes == ["domain_playbook", "review_lens"]
    assert snapshot.top_asset_labels == ["工作主線", "審閱視角"]
    assert "已採用 2" in snapshot.summary


def test_phase_six_feedback_snapshot_reads_deliverable_linked_closeout_depth() -> None:
    snapshot = build_phase_six_feedback_linked_scoring_snapshot(
        adopted_count=2,
        needs_revision_count=1,
        not_adopted_count=1,
        template_candidate_count=2,
        governed_candidate_count=3,
        promoted_candidate_count=2,
        dismissed_candidate_count=1,
        override_signal_count=2,
        top_asset_codes=["domain_playbook", "review_lens"],
        deliverable_feedback_count=3,
        deliverable_adopted_count=2,
        published_deliverable_count=1,
        published_adopted_count=1,
        deliverable_candidate_count=2,
        governed_deliverable_candidate_count=1,
    )

    assert snapshot.deliverable_feedback_count == 3
    assert snapshot.published_adopted_count == 1
    assert snapshot.governed_deliverable_candidate_count == 1
    assert snapshot.closeout_depth_summary


def test_phase_six_feedback_snapshot_reads_outcome_and_writeback_evidence() -> None:
    snapshot = build_phase_six_feedback_linked_scoring_snapshot(
        adopted_count=2,
        needs_revision_count=1,
        not_adopted_count=1,
        template_candidate_count=2,
        governed_candidate_count=3,
        promoted_candidate_count=2,
        dismissed_candidate_count=1,
        override_signal_count=2,
        top_asset_codes=["domain_playbook", "review_lens"],
        deliverable_feedback_count=3,
        deliverable_adopted_count=2,
        published_deliverable_count=1,
        published_adopted_count=1,
        deliverable_candidate_count=2,
        governed_deliverable_candidate_count=1,
        outcome_record_count=2,
        deliverable_outcome_record_count=1,
        follow_up_outcome_count=1,
        writeback_generated_event_count=4,
        review_required_execution_count=1,
        planned_execution_count=2,
        writeback_expected_task_count=1,
    )

    assert snapshot.outcome_record_count == 2
    assert snapshot.writeback_generated_event_count == 4
    assert snapshot.review_required_execution_count == 1
    assert snapshot.writeback_expected_task_count == 1
    assert snapshot.writeback_depth_summary


def test_phase_six_feedback_snapshot_reads_effectiveness_posture() -> None:
    snapshot = build_phase_six_feedback_linked_scoring_snapshot(
        adopted_count=2,
        needs_revision_count=1,
        not_adopted_count=0,
        template_candidate_count=1,
        governed_candidate_count=2,
        promoted_candidate_count=1,
        dismissed_candidate_count=0,
        override_signal_count=1,
        top_asset_codes=["domain_playbook", "review_lens"],
        deliverable_feedback_count=2,
        deliverable_adopted_count=1,
        published_deliverable_count=1,
        published_adopted_count=1,
        deliverable_candidate_count=1,
        governed_deliverable_candidate_count=1,
        outcome_record_count=1,
        writeback_generated_event_count=2,
        review_required_execution_count=1,
        planned_execution_count=1,
        writeback_expected_task_count=1,
    )

    assert snapshot.effectiveness_posture == "writeback_supported"
    assert snapshot.effectiveness_posture_label == "已到 writeback 支撐"
    assert "工作主線" in snapshot.effectiveness_posture_summary
    assert snapshot.effectiveness_caveat_summary


def test_phase_six_feedback_snapshot_reads_effectiveness_composition() -> None:
    snapshot = build_phase_six_feedback_linked_scoring_snapshot(
        adopted_count=2,
        needs_revision_count=1,
        not_adopted_count=0,
        template_candidate_count=1,
        governed_candidate_count=2,
        promoted_candidate_count=1,
        dismissed_candidate_count=0,
        override_signal_count=1,
        top_asset_codes=["domain_playbook", "review_lens"],
        deliverable_feedback_count=2,
        deliverable_adopted_count=1,
        published_deliverable_count=1,
        published_adopted_count=1,
        deliverable_candidate_count=1,
        governed_deliverable_candidate_count=1,
        outcome_record_count=1,
        writeback_generated_event_count=2,
        review_required_execution_count=1,
        planned_execution_count=1,
        writeback_expected_task_count=1,
    )

    assert snapshot.primary_support_signal == "writeback_evidence"
    assert snapshot.primary_support_signal_label == "主要靠 writeback evidence"
    assert snapshot.secondary_support_signal == "deliverable_closeout"
    assert snapshot.current_caveat_signal == "narrow_asset_concentration"
    assert snapshot.effectiveness_composition_summary


def test_phase_six_feedback_snapshot_reads_attribution_boundary() -> None:
    snapshot = build_phase_six_feedback_linked_scoring_snapshot(
        adopted_count=2,
        needs_revision_count=1,
        not_adopted_count=0,
        template_candidate_count=1,
        governed_candidate_count=2,
        promoted_candidate_count=1,
        dismissed_candidate_count=0,
        override_signal_count=1,
        top_asset_codes=["domain_playbook", "review_lens"],
        deliverable_feedback_count=2,
        deliverable_adopted_count=1,
        published_deliverable_count=1,
        published_adopted_count=1,
        deliverable_candidate_count=1,
        governed_deliverable_candidate_count=1,
        outcome_record_count=1,
        writeback_generated_event_count=2,
        review_required_execution_count=1,
        planned_execution_count=1,
        writeback_expected_task_count=1,
    )

    assert snapshot.attribution_boundary == "cautious_attribution_candidate"
    assert snapshot.attribution_boundary_label == "可保守視為 attribution 候選"
    assert "目前已到 closeout + writeback depth" in snapshot.attribution_boundary_summary


def test_phase_six_completion_review_persists_feedback_linked_snapshot(
    client: TestClient,
) -> None:
    task = _create_feedback_task(client, title="Phase 6 feedback scoring readiness")
    matter_workspace_id = task["matter_workspace"]["id"]

    with SessionLocal() as db:
        task_row = db.get(models.Task, task["id"])
        assert task_row is not None
        db.add_all(
            [
                models.AdoptionFeedback(
                    task_id=task_row.id,
                    matter_workspace_id=matter_workspace_id,
                    feedback_status="adopted",
                    reason_codes=["reusable_reasoning"],
                    note="這條判斷方式可直接採用。",
                    operator_label="王顧問",
                ),
                models.AdoptionFeedback(
                    task_id=task_row.id,
                    matter_workspace_id=matter_workspace_id,
                    feedback_status="template_candidate",
                    reason_codes=["reusable_structure"],
                    note="這份結構值得保留成範本。",
                    operator_label="王顧問",
                ),
                models.AdoptionFeedback(
                    task_id=task_row.id,
                    matter_workspace_id=matter_workspace_id,
                    feedback_status="needs_revision",
                    reason_codes=["needs_tighter_logic"],
                    note="這份內容還要再收斂。",
                    operator_label="王顧問",
                ),
                models.AdoptionFeedback(
                    task_id=task_row.id,
                    matter_workspace_id=matter_workspace_id,
                    feedback_status="not_adopted",
                    reason_codes=["too_generic"],
                    note="這條建議先不採用。",
                    operator_label="王顧問",
                ),
                models.PrecedentCandidate(
                    task_id=task_row.id,
                    matter_workspace_id=matter_workspace_id,
                    candidate_type="recommendation_pattern",
                    candidate_status="promoted",
                    source_feedback_status="adopted",
                    source_feedback_reason_codes=["reusable_reasoning"],
                    source_feedback_operator_label="王顧問",
                    created_by_label="王顧問",
                    last_status_changed_by_label="王顧問",
                    title="feedback-scoring-promoted",
                    summary="promoted precedent",
                    reusable_reason="feedback-linked signal",
                    lane_id="generalist_governance",
                    continuity_mode="one_off",
                ),
                models.PrecedentCandidate(
                    task_id=task_row.id,
                    matter_workspace_id=matter_workspace_id,
                    candidate_type="deliverable_pattern",
                    candidate_status="dismissed",
                    source_feedback_status="not_adopted",
                    source_feedback_reason_codes=["reusable_structure"],
                    source_feedback_operator_label="王顧問",
                    created_by_label="王顧問",
                    last_status_changed_by_label="王顧問",
                    title="feedback-scoring-dismissed",
                    summary="dismissed precedent",
                    reusable_reason="feedback-linked override",
                    lane_id="generalist_governance",
                    continuity_mode="one_off",
                ),
            ]
        )
        db.commit()

    review = client.get("/api/v1/workbench/phase-6-completion-review")
    assert review.status_code == 200
    review_payload = review.json()
    assert review_payload["feedback_linked_summary"]
    snapshot = review_payload["feedback_linked_scoring_snapshot"]
    assert snapshot["adopted_count"] == 1
    assert snapshot["template_candidate_count"] == 1
    assert snapshot["needs_revision_count"] == 1
    assert snapshot["not_adopted_count"] == 1
    assert snapshot["promoted_candidate_count"] == 1
    assert snapshot["dismissed_candidate_count"] == 1
    assert snapshot["override_signal_count"] == 3
    assert "工作主線" in snapshot["top_asset_labels"]
    assert snapshot["effectiveness_posture"] == "adoption_supported"
    assert snapshot["effectiveness_posture_label"] == "已有 adoption 支撐"
    assert snapshot["effectiveness_posture_summary"]
    assert snapshot["effectiveness_caveat_summary"]
    assert snapshot["primary_support_signal"] == "explicit_feedback"
    assert snapshot["primary_support_signal_label"] == "主要靠 explicit feedback"
    assert snapshot["current_caveat_signal"] in {
        "minimal_writeback_expected",
        "narrow_asset_concentration",
    }
    assert snapshot["effectiveness_composition_summary"]
    assert snapshot["attribution_boundary"] == "not_claimable"
    assert snapshot["attribution_boundary_label"] == "目前不可 claim attribution"
    assert snapshot["attribution_boundary_summary"]
    assert "已有 adoption 支撐" in review_payload["feedback_linked_summary"]
    assert "主要靠 explicit feedback" in review_payload["feedback_linked_summary"]
    assert "目前不可 claim attribution" in review_payload["feedback_linked_summary"]

    checkpoint = client.post(
        "/api/v1/workbench/phase-6-completion-review/checkpoint",
        json={"operator_label": "王顧問"},
    )
    assert checkpoint.status_code == 200
    checkpoint_payload = checkpoint.json()
    assert checkpoint_payload["feedback_linked_summary"] == review_payload["feedback_linked_summary"]
    assert (
        checkpoint_payload["feedback_linked_scoring_snapshot"]["override_signal_count"]
        == review_payload["feedback_linked_scoring_snapshot"]["override_signal_count"]
    )
    assert (
        checkpoint_payload["feedback_linked_scoring_snapshot"]["effectiveness_posture"]
        == review_payload["feedback_linked_scoring_snapshot"]["effectiveness_posture"]
    )
    assert (
        checkpoint_payload["feedback_linked_scoring_snapshot"]["effectiveness_composition_summary"]
        == review_payload["feedback_linked_scoring_snapshot"]["effectiveness_composition_summary"]
    )
    assert (
        checkpoint_payload["feedback_linked_scoring_snapshot"]["attribution_boundary"]
        == review_payload["feedback_linked_scoring_snapshot"]["attribution_boundary"]
    )

    with SessionLocal() as db:
        row = db.scalar(
            select(models.WorkbenchExtensionState).where(
                models.WorkbenchExtensionState.extension_id
                == PHASE_6_GENERALIST_GOVERNANCE_ID
            )
        )
        assert row is not None
        assert row.payload["feedback_linked_summary"] == review_payload["feedback_linked_summary"]
        assert row.payload["feedback_linked_scoring_snapshot"]["adopted_count"] == 1


def test_phase_six_completion_review_reads_deliverable_closeout_depth(
    client: TestClient,
) -> None:
    task = _create_feedback_task(client, title="Phase 6 closeout depth")
    upload = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                ("agreement.txt", b"Termination and liability clauses need review.", "text/plain"),
            )
        ],
    )
    assert upload.status_code == 200

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run_response.status_code == 200
    deliverable_id = run_response.json()["deliverable"]["id"]

    workspace = client.get(f"/api/v1/deliverables/{deliverable_id}").json()
    publish_response = client.post(
        f"/api/v1/deliverables/{deliverable_id}/publish",
        json={
            "title": workspace["deliverable"]["title"],
            "summary": workspace["deliverable"]["summary"],
            "version_tag": workspace["deliverable"]["version_tag"] or "v1",
            "publish_note": "closeout depth verification",
            "artifact_formats": ["markdown"],
            "content_sections": workspace["content_sections"],
        },
    )
    assert publish_response.status_code == 200

    feedback_response = client.post(
        f"/api/v1/deliverables/{deliverable_id}/feedback",
        json={"feedback_status": "adopted", "note": "這份交付可直接採用。"},
    )
    assert feedback_response.status_code == 200

    promote_response = client.post(
        f"/api/v1/deliverables/{deliverable_id}/precedent-candidate",
        json={"candidate_status": "promoted"},
    )
    assert promote_response.status_code == 200

    review = client.get("/api/v1/workbench/phase-6-completion-review")
    assert review.status_code == 200
    body = review.json()
    feedback_loop = next(
        item for item in body["scorecard_items"] if item["dimension_code"] == "feedback_loop"
    )

    assert body["feedback_linked_scoring_snapshot"]["published_adopted_count"] == 1
    assert body["feedback_linked_scoring_snapshot"]["governed_deliverable_candidate_count"] == 1
    assert "交付回饋" in feedback_loop["summary"]

    checkpoint = client.post(
        "/api/v1/workbench/phase-6-completion-review/checkpoint",
        json={"operator_label": "王顧問"},
    )
    assert checkpoint.status_code == 200
    assert "交付回饋" in checkpoint.json()["checkpoint_summary"]


def test_phase_six_completion_review_reads_outcome_writeback_evidence_for_full_writeback_task(
    client: TestClient,
) -> None:
    payload = {
        "title": "Phase 6 writeback depth",
        "description": "Track whether writeback evidence deepens phase six scoring.",
        "task_type": "contract_review",
        "mode": "specialist",
        "entry_preset": "one_line_inquiry",
        "external_data_strategy": "strict",
        "client_name": "Acme Corp",
        "client_stage": "制度化階段",
        "client_type": "中小企業",
        "engagement_name": "Continuous writeback",
        "workstream_name": "Outcome tracking",
        "domain_lenses": ["法務"],
        "background_text": "Need a reusable review flow with follow-up evidence.",
        "subject_name": "MSA draft",
        "goal_description": "Carry the review through follow-up writeback.",
        "engagement_continuity_mode": "continuous",
        "writeback_depth": "full",
    }
    task = client.post("/api/v1/tasks", json=payload).json()

    upload = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("agreement.txt", b"Termination and indemnity clauses need review.", "text/plain"))],
    )
    assert upload.status_code == 200

    first_run = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert first_run.status_code == 200

    follow_up = client.post(
        f"/api/v1/tasks/{task['id']}/sources",
        json={
            "urls": [],
            "pasted_text": "Follow-up note: negotiation moved forward and a new revision is required.",
            "pasted_title": "Follow-up outcome note",
        },
    )
    assert follow_up.status_code == 200

    second_run = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert second_run.status_code == 200

    review = client.get("/api/v1/workbench/phase-6-completion-review")
    assert review.status_code == 200
    body = review.json()
    feedback_loop = next(
        item for item in body["scorecard_items"] if item["dimension_code"] == "feedback_loop"
    )

    assert body["feedback_linked_scoring_snapshot"]["outcome_record_count"] >= 1
    assert body["feedback_linked_scoring_snapshot"]["writeback_generated_event_count"] >= 1
    assert "writeback" in feedback_loop["summary"] or "outcome" in feedback_loop["summary"]

    checkpoint = client.post(
        "/api/v1/workbench/phase-6-completion-review/checkpoint",
        json={"operator_label": "王顧問"},
    )
    assert checkpoint.status_code == 200
    assert "writeback" in checkpoint.json()["checkpoint_summary"] or "outcome" in checkpoint.json()["checkpoint_summary"]


def test_phase_six_completion_review_does_not_penalize_one_off_without_writeback_records(
    client: TestClient,
) -> None:
    task = _create_feedback_task(client, title="One-off no writeback penalty")
    upload = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("agreement.txt", b"Termination and liability clauses need review.", "text/plain"))],
    )
    assert upload.status_code == 200

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run_response.status_code == 200
    deliverable_id = run_response.json()["deliverable"]["id"]

    workspace = client.get(f"/api/v1/deliverables/{deliverable_id}").json()
    publish_response = client.post(
        f"/api/v1/deliverables/{deliverable_id}/publish",
        json={
            "title": workspace["deliverable"]["title"],
            "summary": workspace["deliverable"]["summary"],
            "version_tag": workspace["deliverable"]["version_tag"] or "v1",
            "publish_note": "No writeback penalty check",
            "artifact_formats": ["markdown"],
            "content_sections": workspace["content_sections"],
        },
    )
    assert publish_response.status_code == 200

    feedback_response = client.post(
        f"/api/v1/deliverables/{deliverable_id}/feedback",
        json={"feedback_status": "adopted", "note": "這份交付可直接採用。"},
    )
    assert feedback_response.status_code == 200

    review = client.get("/api/v1/workbench/phase-6-completion-review")
    assert review.status_code == 200
    body = review.json()

    assert body["feedback_linked_scoring_snapshot"]["writeback_expected_task_count"] == 0
    assert "不算負訊號" in body["feedback_linked_scoring_snapshot"]["writeback_depth_summary"]
