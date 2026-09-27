from app.core.config import settings
from uuid import uuid4
from app.ingestion.files import ExtractedBlock, FileExtractResult


def task_with_source(client):
    from test_mvp_slice import create_task_payload
    payload = create_task_payload("Reprocess source")
    payload["client_name"] = f"Reprocessing test {uuid4().hex}"
    task = client.post("/api/v1/tasks", json=payload).json()
    response = client.post(f"/api/v1/tasks/{task['id']}/uploads", files=[("files", ("source.txt", b"ORIGINAL_TEXT", "text/plain"))])
    return task, response.json()["uploaded"][0]["source_document"]


def improved_result():
    return FileExtractResult("IMPROVED_TEXT", "full", "text_extract", False,
                             blocks=(ExtractedBlock("IMPROVED_TEXT", {"kind": "text"}, "原文"),), coverage="complete")


def test_reprocessing_appends_version_preserves_evidence_and_old_text(client, monkeypatch):
    from app.services import uploads
    task, source = task_with_source(client)
    before = client.get(f"/api/v1/tasks/{task['id']}").json()
    evidence_ids = {item["id"] for item in before["evidence"] if item["source_document_id"] == source["id"]}
    old_path = settings.storage_root_path / source["derived_storage_key"]
    monkeypatch.setattr(uploads, "analyze_upload_content", lambda *args: improved_result())
    response = client.post(f"/api/v1/tasks/{task['id']}/sources/{source['id']}/reprocess")
    assert response.status_code == 200
    refreshed = response.json()
    assert refreshed["extraction_manifest"]["version"] == 2
    assert refreshed["extraction_manifest"]["history"][0]["version"] == 1
    assert old_path.read_text() == "ORIGINAL_TEXT"
    assert refreshed["derived_storage_key"] != source["derived_storage_key"]
    after = client.get(f"/api/v1/tasks/{task['id']}").json()
    old_evidence = [item for item in after["evidence"] if item["id"] in evidence_ids]
    assert len(old_evidence) == len(evidence_ids)
    assert all(item["is_current_extraction"] is False for item in old_evidence)
    assert any("IMPROVED_TEXT" in item["excerpt_or_summary"] for item in after["evidence"] if item["is_current_extraction"])


def test_host_reads_current_version_only(client, monkeypatch):
    from app.agents.host import HostOrchestrator
    from app.core.database import SessionLocal
    from app.services.tasks import get_loaded_task
    from app.services import uploads
    task, source = task_with_source(client)
    monkeypatch.setattr(uploads, "analyze_upload_content", lambda *args: improved_result())
    assert client.post(f"/api/v1/tasks/{task['id']}/sources/{source['id']}/reprocess").status_code == 200
    with SessionLocal() as db:
        payload = HostOrchestrator(db).build_payload(get_loaded_task(db, task["id"]))
        assert all("ORIGINAL_TEXT" not in item.excerpt_or_summary for item in payload.evidence)
        assert any("IMPROVED_TEXT" in item.excerpt_or_summary for item in payload.evidence)


def test_failed_reprocess_does_not_replace_last_good_version(client, monkeypatch):
    from app.services import uploads
    task, source = task_with_source(client)
    monkeypatch.setattr(uploads, "analyze_upload_content", lambda *args: (_ for _ in ()).throw(ValueError("cannot parse")))
    response = client.post(f"/api/v1/tasks/{task['id']}/sources/{source['id']}/reprocess")
    assert response.status_code == 422
    after = client.get(f"/api/v1/tasks/{task['id']}").json()["uploads"][0]
    assert after["extraction_manifest"] == source["extraction_manifest"]
    assert after["derived_storage_key"] == source["derived_storage_key"]


def test_cannot_reprocess_source_from_another_case(client):
    task_a, source_a = task_with_source(client)
    task_b, _ = task_with_source(client)
    assert task_a["matter_workspace"]["id"] != task_b["matter_workspace"]["id"]
    response = client.post(f"/api/v1/tasks/{task_b['id']}/sources/{source_a['id']}/reprocess")
    assert response.status_code == 404


def test_reprocess_missing_original_reports_without_replacing_preview(client):
    task, source = task_with_source(client)
    (settings.storage_root_path / source["storage_key"]).unlink()
    response = client.post(f"/api/v1/tasks/{task['id']}/sources/{source['id']}/reprocess")
    assert response.status_code == 409
    assert "原始" in response.json()["detail"]


def test_reprocess_keeps_references_of_an_existing_report(client, monkeypatch):
    from app.services import uploads
    task, source = task_with_source(client)
    run = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run.status_code == 200
    before = client.get(f"/api/v1/tasks/{task['id']}").json()
    old_deliverables = before["deliverables"]
    assert old_deliverables
    monkeypatch.setattr(uploads, "analyze_upload_content", lambda *args: improved_result())
    assert client.post(f"/api/v1/tasks/{task['id']}/sources/{source['id']}/reprocess").status_code == 200
    after = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert {item["id"] for item in after["evidence"]} >= {item["id"] for item in before["evidence"]}
    assert after["deliverables"] == old_deliverables


def test_reprocessing_respects_capacity_without_losing_original(client, monkeypatch):
    from app.services import uploads
    task, source = task_with_source(client)
    monkeypatch.setattr(settings, "material_max_case_chars", len("ORIGINAL_TEXT"))
    bigger = FileExtractResult("longer revised text", "full", "text_extract", False,
                              blocks=(ExtractedBlock("longer revised text", {"kind": "text"}, "原文"),), coverage="complete")
    monkeypatch.setattr(uploads, "analyze_upload_content", lambda *args: bigger)
    assert client.post(f"/api/v1/tasks/{task['id']}/sources/{source['id']}/reprocess").status_code == 413
    refreshed = client.get(f"/api/v1/tasks/{task['id']}").json()["uploads"][0]
    assert refreshed["extraction_manifest"]["version"] == 1


def test_concurrent_reprocessing_allocates_distinct_versions(client):
    from concurrent.futures import ThreadPoolExecutor
    task, source = task_with_source(client)
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda _: client.post(f"/api/v1/tasks/{task['id']}/sources/{source['id']}/reprocess"), range(2)))
    assert all(response.status_code == 200 for response in responses)
    assert {response.json()["extraction_manifest"]["version"] for response in responses} == {2, 3}
    current = client.get(f"/api/v1/tasks/{task['id']}").json()["uploads"][0]
    assert len(current["extraction_manifest"]["history"]) == 2
    for item in current["extraction_manifest"]["history"]:
        assert (settings.storage_root_path / item["derived_storage_key"]).read_text() == "ORIGINAL_TEXT"


def test_reprocess_checks_original_size_before_reading_all_bytes(client, monkeypatch):
    from app.services import storage_manager
    task, source = task_with_source(client)
    monkeypatch.setattr(settings, "material_max_file_bytes", 4)
    calls = []
    original_read = storage_manager.Path.read_bytes
    monkeypatch.setattr(storage_manager.Path, "read_bytes", lambda path: calls.append(path) or original_read(path))
    response = client.post(f"/api/v1/tasks/{task['id']}/sources/{source['id']}/reprocess")
    assert response.status_code == 413
    assert not calls, "Legacy originals must use a bounded read"


def test_reupload_after_reprocessing_reuses_current_summary(client, monkeypatch):
    from app.services import uploads
    task, source = task_with_source(client)
    monkeypatch.setattr(uploads, "analyze_upload_content", lambda *args: improved_result())
    assert client.post(f"/api/v1/tasks/{task['id']}/sources/{source['id']}/reprocess").status_code == 200
    repeated = client.post(f"/api/v1/tasks/{task['id']}/uploads", files=[("files", ("source.txt", b"ORIGINAL_TEXT", "text/plain"))]).json()["uploaded"][0]
    assert repeated["source_document"]["id"] == source["id"]
    assert repeated["evidence"]["is_current_extraction"] is True
    assert "IMPROVED_TEXT" in repeated["evidence"]["excerpt_or_summary"]


def test_reprocess_from_another_work_slice_keeps_canonical_source_owner(client, monkeypatch):
    from app.core.database import SessionLocal
    from app.services import uploads
    from app.services.tasks import _usable_evidence, get_loaded_task
    from test_mvp_slice import create_task_payload
    task, source = task_with_source(client)
    payload = create_task_payload("Reprocess source")
    payload["client_name"] = task["client"]["name"]
    other = client.post("/api/v1/tasks", json=payload).json()
    assert other["matter_workspace"]["id"] == task["matter_workspace"]["id"]
    monkeypatch.setattr(uploads, "analyze_upload_content", lambda *args: improved_result())
    assert client.post(f"/api/v1/tasks/{other['id']}/sources/{source['id']}/reprocess").status_code == 200
    with SessionLocal() as db:
        assert any("IMPROVED_TEXT" in item.excerpt_or_summary for item in _usable_evidence(get_loaded_task(db, task["id"])))
