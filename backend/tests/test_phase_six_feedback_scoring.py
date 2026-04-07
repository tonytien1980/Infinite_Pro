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
