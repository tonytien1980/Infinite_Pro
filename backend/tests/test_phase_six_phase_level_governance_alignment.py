from fastapi.testclient import TestClient
import pytest

from app.services.phase_six_generalist_governance import build_phase_six_phase_level_alignment_snapshot
from app.workbench.schemas import PhaseSixFeedbackLinkedScoringSnapshotRead


def test_phase_six_phase_level_reviews_explain_work_surface_and_scoring_boundary(
    client: TestClient,
) -> None:
    maturity = client.get("/api/v1/workbench/phase-6-maturity-review")
    closure = client.get("/api/v1/workbench/phase-6-closure-criteria")
    completion = client.get("/api/v1/workbench/phase-6-completion-review")

    assert maturity.status_code == 200
    assert closure.status_code == 200
    assert completion.status_code == 200

    maturity_body = maturity.json()
    closure_body = closure.json()
    completion_body = completion.json()

    assert "工作面已正式落地" in maturity_body["summary"]
    assert "工作面已正式落地" in closure_body["summary"]
    assert closure_body["feedback_signal_count"] == 0
    assert closure_body["governed_outcome_count"] == 0
    expected = "下一刀應把 feedback foundation 正式接到交付收尾深度。"
    assert closure_body["recommended_next_step"] == expected
    assert completion_body["recommended_next_step"] == f"{expected} 不要直接跳 sign-off。"


@pytest.mark.parametrize(("snapshot", "expected"), [
    ({}, "下一刀應把 feedback foundation 正式接到交付收尾深度。"),
    ({"adopted_count": 1}, "下一刀應把已形成的採用回饋證據更正式接回治理評分。"),
    ({"adopted_count": 1, "deliverable_feedback_count": 1}, "下一刀應把已形成的交付收尾證據更正式接回治理評分。"),
    ({"adopted_count": 1, "published_adopted_count": 1}, "下一刀應把交付收尾證據再往 outcome / writeback evidence 推進。"),
])
def test_legacy_review_uses_the_available_feedback_depth(snapshot: dict, expected: str) -> None:
    alignment = build_phase_six_phase_level_alignment_snapshot(
        feedback_signal_count=0,
        governed_outcome_count=0,
        feedback_snapshot=PhaseSixFeedbackLinkedScoringSnapshotRead(**snapshot),
    )
    assert alignment.scoring_pending_summary == expected


def test_phase_six_closeout_review_keeps_phase_level_review_boundary_visible(
    client: TestClient,
) -> None:
    response = client.get("/api/v1/workbench/phase-6-closeout-review")

    assert response.status_code == 200
    payload = response.json()

    assert "階段層" in payload["summary"] or "階段層" in payload["recommended_next_step"]
    assert "工作面更直接感受到" in payload["recommended_next_step"]
