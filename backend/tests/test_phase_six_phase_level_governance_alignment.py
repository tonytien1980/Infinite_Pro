from fastapi.testclient import TestClient


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
    assert "治理評分" in closure_body["recommended_next_step"]
    assert "治理評分" in completion_body["recommended_next_step"]


def test_phase_six_closeout_review_keeps_phase_level_review_boundary_visible(
    client: TestClient,
) -> None:
    response = client.get("/api/v1/workbench/phase-6-closeout-review")

    assert response.status_code == 200
    payload = response.json()

    assert "階段層" in payload["summary"] or "階段層" in payload["recommended_next_step"]
    assert "工作面更直接感受到" in payload["recommended_next_step"]
