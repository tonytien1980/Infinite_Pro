import pytest

from app.core.config import settings


def new_task(client):
    from test_mvp_slice import create_task_payload
    return client.post("/api/v1/tasks", json=create_task_payload("Material capacity")).json()


def upload(client, task, contents):
    return client.post(f"/api/v1/tasks/{task['id']}/uploads", files=[
        ("files", (f"notes-{index}.txt", value.encode(), "text/plain"))
        for index, value in enumerate(contents)
    ])


def test_case_source_limit_and_duplicate_reuse(client, monkeypatch):
    monkeypatch.setattr(settings, "material_max_case_sources", 2)
    task = new_task(client)
    assert upload(client, task, ["first", "second"]).status_code == 200
    assert upload(client, task, ["third"]).status_code == 413
    assert upload(client, task, ["first"]).status_code == 200
    assert len(client.get(f"/api/v1/tasks/{task['id']}").json()["uploads"]) == 2


def test_case_character_limit_includes_previous_requests(client, monkeypatch):
    monkeypatch.setattr(settings, "material_max_case_chars", 12)
    task = new_task(client)
    assert upload(client, task, ["abcdef"]).status_code == 200
    assert upload(client, task, ["ghijkl"]).status_code == 200
    assert upload(client, task, ["z"]).status_code == 413
    assert len(list(settings.upload_path.rglob("*.txt"))) == 2


def test_case_limit_applies_across_file_and_pasted_text(client, monkeypatch):
    monkeypatch.setattr(settings, "material_max_case_sources", 1)
    task = new_task(client)
    assert upload(client, task, ["first"]).status_code == 200
    response = client.post(f"/api/v1/tasks/{task['id']}/sources", json={"pasted_text": "second", "urls": []})
    assert response.status_code == 413


def test_whole_upload_batch_checks_capacity_before_writing_files(client, monkeypatch):
    monkeypatch.setattr(settings, "material_max_case_chars", 10)
    task = new_task(client)
    assert upload(client, task, ["first-six", "second-six"]).status_code == 413
    assert not list(settings.upload_path.rglob("*.txt"))
    assert not client.get(f"/api/v1/tasks/{task['id']}").json()["uploads"]


def test_support_contract_returns_backend_owned_limits(client):
    response = client.get("/api/v1/tasks/support/materials")
    assert response.status_code == 200
    assert response.json()["max_case_sources"] == settings.material_max_case_sources
    assert response.json()["max_case_chars"] == settings.material_max_case_chars
    assert response.json()["max_file_bytes"] == settings.material_max_file_bytes


def test_case_capacity_readback_uses_latest_extraction(client):
    task = new_task(client)
    upload(client, task, ["123456"])
    response = client.get(f"/api/v1/tasks/{task['id']}/material-capacity")
    assert response.status_code == 200
    assert response.json()["source_count"] == 1
    assert response.json()["extracted_chars"] == 6


def test_concurrent_uploads_cannot_exceed_case_limit(client, monkeypatch):
    from concurrent.futures import ThreadPoolExecutor
    monkeypatch.setattr(settings, "material_max_case_sources", 1)
    task = new_task(client)
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda value: upload(client, task, [value]).status_code, ["first", "second"]))
    assert sorted(results) == [200, 413]
    assert client.get(f"/api/v1/tasks/{task['id']}/material-capacity").json()["source_count"] == 1


def test_default_twenty_sources_boundary(client):
    task = new_task(client)
    for start in (0, 10):
        assert upload(client, task, [f"source-{value}" for value in range(start, start + 10)]).status_code == 200
    assert upload(client, task, ["source-21"]).status_code == 413


def test_default_case_character_boundary(client):
    task = new_task(client)
    assert upload(client, task, [value * 100_000 for value in ("a", "b", "c")]).status_code == 200
    assert upload(client, task, ["d"]).status_code == 413
    assert client.get(f"/api/v1/tasks/{task['id']}/material-capacity").json()["extracted_chars"] == 300_000


def test_remote_source_cannot_bypass_case_limit_as_failed_record(client, monkeypatch):
    from app.ingestion.remote import RemoteSourceContent
    from app.services import sources
    monkeypatch.setattr(settings, "material_max_case_sources", 1)
    monkeypatch.setattr(sources, "fetch_remote_source", lambda url: RemoteSourceContent("manual_url", url, "Remote", "text/plain", "remote text"))
    task = new_task(client)
    assert upload(client, task, ["first"]).status_code == 200
    response = client.post(f"/api/v1/tasks/{task['id']}/sources", json={"pasted_text": "", "urls": ["https://example.invalid/second"]})
    assert response.status_code == 413
    assert len(client.get(f"/api/v1/tasks/{task['id']}").json()["uploads"]) == 1


def test_combined_paste_and_url_capacity_failure_is_atomic(client, monkeypatch):
    from app.ingestion.remote import RemoteSourceContent
    from app.services import sources
    monkeypatch.setattr(settings, "material_max_case_chars", 8)
    monkeypatch.setattr(sources, "fetch_remote_source", lambda url: RemoteSourceContent("manual_url", url, "Remote", "text/plain", "67890"))
    task = new_task(client)
    response = client.post(f"/api/v1/tasks/{task['id']}/sources", json={"pasted_text": "12345", "urls": ["https://example.invalid/second"]})
    assert response.status_code == 413
    assert not client.get(f"/api/v1/tasks/{task['id']}").json()["uploads"]


@pytest.mark.parametrize("method,path", [
    ("get", "/api/v1/tasks/support/materials"),
    ("get", "/api/v1/tasks/unknown/material-capacity"),
    ("post", "/api/v1/tasks/unknown/sources/unknown/reprocess"),
])
def test_material_operations_require_authentication(anonymous_client, method, path):
    assert getattr(anonymous_client, method)(path).status_code == 401
