from __future__ import annotations

from fastapi.testclient import TestClient
import pytest

from app.agents.host import HostOrchestrator
from app.core.database import SessionLocal
from app.services.tasks import get_loaded_task


A_TITLE = "Zephyr Holdings 市場進入研究"
A_CLIENT = "Zephyr Holdings"
A_NOTE = "Zephyr 這份整理的段落結構值得沿用"
A_OPERATOR = "Consultant Alpha"


def _consultant_a_shares_adopted_pattern(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> str:
    from test_mvp_slice import create_task_payload, login_as_named_consultant_with_owner_invite

    consultant_a = login_as_named_consultant_with_owner_invite(
        anonymous_client,
        monkeypatch,
        email="consultant-a@example.com",
        full_name=A_OPERATOR,
    )
    payload = create_task_payload(A_TITLE)
    payload["client_name"] = A_CLIENT
    created = consultant_a.post("/api/v1/tasks", json=payload)
    assert created.status_code == 201
    task_a_id = created.json()["id"]
    upload = consultant_a.post(
        f"/api/v1/tasks/{task_a_id}/uploads",
        files=[("files", ("notes.txt", b"Proposal summary should separate findings from next actions.", "text/plain"))],
    )
    assert upload.status_code in {200, 201}
    run = consultant_a.post(f"/api/v1/tasks/{task_a_id}/run")
    assert run.status_code == 200
    feedback = consultant_a.post(
        f"/api/v1/deliverables/{run.json()['deliverable']['id']}/feedback",
        json={"feedback_status": "adopted", "note": A_NOTE},
    )
    assert feedback.status_code == 200
    assert feedback.json()["deliverable"]["precedent_candidate"] is not None
    assert consultant_a.post("/api/v1/auth/logout").status_code == 200
    return task_a_id


def _consultant_b_task(anonymous_client: TestClient, monkeypatch: pytest.MonkeyPatch) -> tuple[TestClient, str]:
    from test_mvp_slice import create_task_payload, login_as_named_consultant_with_owner_invite

    consultant_b = login_as_named_consultant_with_owner_invite(
        anonymous_client,
        monkeypatch,
        email="consultant-b@example.com",
        full_name="Consultant Beta",
    )
    created = consultant_b.post("/api/v1/tasks", json=create_task_payload("Beta 提案研究整理"))
    assert created.status_code == 201
    task_b_id = created.json()["id"]
    upload = consultant_b.post(
        f"/api/v1/tasks/{task_b_id}/uploads",
        files=[("files", ("beta.txt", b"Proposal research should rank findings before next actions.", "text/plain"))],
    )
    assert upload.status_code in {200, 201}
    return consultant_b, task_b_id


def test_host_payload_shares_pattern_without_other_consultants_identifying_content(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from test_mvp_slice import current_member_for_email

    task_a_id = _consultant_a_shares_adopted_pattern(anonymous_client, monkeypatch)
    consultant_b, task_b_id = _consultant_b_task(anonymous_client, monkeypatch)

    assert consultant_b.get(f"/api/v1/tasks/{task_a_id}").status_code == 404

    with SessionLocal() as db:
        member_b = current_member_for_email(db, "consultant-b@example.com")
        payload = HostOrchestrator(db, current_member=member_b).build_payload(get_loaded_task(db, task_b_id))

    guidance = payload.precedent_reference_guidance
    assert guidance.status == "available"
    assert guidance.matched_items
    for item in guidance.matched_items:
        assert item.source_task_id is None

    model_input = payload.model_dump_json()
    for marker in (A_TITLE, A_CLIENT, A_NOTE, A_OPERATOR, task_a_id):
        assert marker not in model_input, marker


def test_task_read_does_not_expose_other_consultants_identifying_content(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task_a_id = _consultant_a_shares_adopted_pattern(anonymous_client, monkeypatch)
    consultant_b, task_b_id = _consultant_b_task(anonymous_client, monkeypatch)

    body = consultant_b.get(f"/api/v1/tasks/{task_b_id}").text
    for marker in (A_TITLE, A_CLIENT, A_NOTE, A_OPERATOR, task_a_id):
        assert marker not in body, marker


def _guidance_for(email: str, task_id: str):
    from test_mvp_slice import current_member_for_email

    with SessionLocal() as db:
        member = current_member_for_email(db, email)
        payload = HostOrchestrator(db, current_member=member).build_payload(get_loaded_task(db, task_id))
    return payload.precedent_reference_guidance


def _edit_candidates_of_task(task_id: str, edit) -> None:
    from sqlalchemy import select

    from app.domain import models

    with SessionLocal() as db:
        for candidate in db.scalars(
            select(models.PrecedentCandidate).where(models.PrecedentCandidate.task_id == task_id)
        ).all():
            edit(db, candidate)
        db.commit()


def test_candidate_from_another_firm_is_never_matched(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.domain import models

    task_a_id = _consultant_a_shares_adopted_pattern(anonymous_client, monkeypatch)
    with SessionLocal() as db:
        db.get(models.Task, task_a_id).firm_id = "00000000-0000-0000-0000-00000000f1f2"
        db.commit()
    _, task_b_id = _consultant_b_task(anonymous_client, monkeypatch)

    assert _guidance_for("consultant-b@example.com", task_b_id).status == "no_match"


def test_candidate_without_shared_pattern_is_not_shared_across_consultants(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task_a_id = _consultant_a_shares_adopted_pattern(anonymous_client, monkeypatch)

    def drop_shared_pattern(_db, candidate) -> None:
        snapshot = dict(candidate.pattern_snapshot)
        snapshot.pop("shared_pattern")
        candidate.pattern_snapshot = snapshot

    _edit_candidates_of_task(task_a_id, drop_shared_pattern)
    _, task_b_id = _consultant_b_task(anonymous_client, monkeypatch)

    assert _guidance_for("consultant-b@example.com", task_b_id).status == "no_match"


def test_shared_pattern_with_free_text_fails_validation(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task_a_id = _consultant_a_shares_adopted_pattern(anonymous_client, monkeypatch)

    def inject_client_name(_db, candidate) -> None:
        snapshot = dict(candidate.pattern_snapshot)
        snapshot["shared_pattern"] = {**snapshot["shared_pattern"], "client_type": A_CLIENT}
        candidate.pattern_snapshot = snapshot

    _edit_candidates_of_task(task_a_id, inject_client_name)
    _, task_b_id = _consultant_b_task(anonymous_client, monkeypatch)

    assert _guidance_for("consultant-b@example.com", task_b_id).status == "no_match"


def test_withdrawn_feedback_stops_cross_consultant_reference(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from test_mvp_slice import login_google_user

    task_a_id = _consultant_a_shares_adopted_pattern(anonymous_client, monkeypatch)
    login_google_user(anonymous_client, monkeypatch, email="consultant-a@example.com", full_name=A_OPERATOR)
    consultant_a = anonymous_client
    deliverable_id = consultant_a.get(f"/api/v1/tasks/{task_a_id}").json()["deliverables"][0]["id"]
    withdrawn = consultant_a.post(
        f"/api/v1/deliverables/{deliverable_id}/feedback",
        json={"feedback_status": "not_adopted", "note": ""},
    )
    assert withdrawn.status_code == 200
    assert consultant_a.post("/api/v1/auth/logout").status_code == 200
    _, task_b_id = _consultant_b_task(anonymous_client, monkeypatch)

    assert _guidance_for("consultant-b@example.com", task_b_id).status == "no_match"


def test_consultant_still_sees_own_case_detail_in_reference(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from test_mvp_slice import create_task_payload, login_google_user

    task_a_id = _consultant_a_shares_adopted_pattern(anonymous_client, monkeypatch)
    login_google_user(anonymous_client, monkeypatch, email="consultant-a@example.com", full_name=A_OPERATOR)
    consultant_a = anonymous_client
    created = consultant_a.post("/api/v1/tasks", json=create_task_payload("Alpha 第二份研究"))
    assert created.status_code == 201
    second_task_id = created.json()["id"]
    consultant_a.post(
        f"/api/v1/tasks/{second_task_id}/uploads",
        files=[("files", ("notes.txt", b"Proposal summary should separate findings from next actions.", "text/plain"))],
    )

    guidance = _guidance_for("consultant-a@example.com", second_task_id)
    assert guidance.status == "available"
    own = [item for item in guidance.matched_items if item.source_task_id == task_a_id]
    assert own and own[0].visibility == "own_case"
    assert A_TITLE in own[0].title
