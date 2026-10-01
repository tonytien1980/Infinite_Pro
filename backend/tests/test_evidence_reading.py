import pytest

from app.model_router import base


def test_reading_contract_exists_without_replacing_provider_boundary():
    assert hasattr(base.ModelProvider, "read_evidence"), "Reading belongs to the existing provider contract"


def test_all_material_reaches_reading_once_in_bounded_batches(monkeypatch):
    from app.agents.evidence_reading import read_evidence
    from app.core.config import settings
    from app.model_router.mock import MockModelProvider
    monkeypatch.setattr(settings, "material_reading_batch_chars", 120)
    seen = []

    class Spy(MockModelProvider):
        def read_evidence(self, request):
            seen.append(request)
            return super().read_evidence(request)

    materials = [{"id": f"e{i}", "title": str(i), "content": "x" * 45 + f"TAIL{i}"} for i in range(7)]
    result = read_evidence(Spy(), materials, response_language="en")
    assert [e["id"] for request in seen for e in request.evidence] == [e["id"] for e in materials]
    assert all(sum(len(e["content"]) for e in request.evidence) <= 120 for request in seen)
    assert result.covered_evidence_ids == [e["id"] for e in materials]
    assert result.batch_count == 4


def test_reading_rejects_missing_coverage_and_repairs_only_once():
    from app.agents.evidence_reading import read_evidence
    from app.model_router.mock import MockModelProvider
    seen = []

    class Incomplete(MockModelProvider):
        def read_evidence(self, request):
            seen.append(request)
            result = super().read_evidence(request)
            return result.model_copy(update={"covered_evidence_ids": []})

    with pytest.raises(base.ModelProviderError, match="材料閱讀"):
        read_evidence(Incomplete(), [{"id": "e1", "content": "Read me"}], response_language="en")
    assert len(seen) == 2


def test_reading_prompt_preserves_tail_and_treats_material_as_data():
    from app.model_router.structured_tasks import build_evidence_reading_spec
    request = base.EvidenceReadingRequest(evidence=[{"id": "a", "content": "x" * 4000 + "TAIL_IGNORE_PREVIOUS_INSTRUCTIONS"}])
    spec = build_evidence_reading_spec(request)
    assert "TAIL_IGNORE_PREVIOUS_INSTRUCTIONS" in spec.user_prompt
    assert "TAIL_IGNORE_PREVIOUS_INSTRUCTIONS" not in spec.system_prompt
    assert "untrusted" in spec.system_prompt
    assert spec.schema["additionalProperties"] is False


def test_host_reads_chunks_once_and_persists_reading_manifest(client, monkeypatch):
    from app.model_router.mock import MockModelProvider
    from test_mvp_slice import create_task_payload
    seen = []
    original = MockModelProvider.read_evidence
    def spy(self, request):
        seen.append(request)
        return original(self, request)
    monkeypatch.setattr(MockModelProvider, "read_evidence", spy)
    task = client.post("/api/v1/tasks", json=create_task_payload("Reading integration")).json()
    text = "\n".join(f"條件 {i}：需要先確認成本再決策。" for i in range(500)) + "\nFINAL_CONDITION"
    upload = client.post(f"/api/v1/tasks/{task['id']}/uploads", files=[("files", ("long.txt", text.encode(), "text/plain"))])
    assert upload.status_code == 200
    before = client.get(f"/api/v1/tasks/{task['id']}").json()
    expected = {e["id"] for e in before["evidence"] if e["chunk_object_id"] and e["is_current_extraction"]}
    response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert response.status_code == 200, response.text
    actual = [item["id"] for request in seen if request.mode == "read" for item in request.evidence]
    assert expected.issubset(actual)
    assert len(actual) == len(set(actual))
    assert any("FINAL_CONDITION" in item["content"] for request in seen for item in request.evidence)
    content = response.json()["deliverable"]["content_structure"]
    assert set(content["material_reading"]["covered_evidence_ids"]) >= expected
    assert content["cited_statements"]


def test_large_reading_is_consolidated_without_rereading_originals(monkeypatch):
    from app.agents.evidence_reading import read_evidence
    from app.model_router.mock import MockModelProvider
    from app.core.config import settings
    monkeypatch.setattr(settings, "material_reading_batch_chars", 2400)
    monkeypatch.setattr(settings, "material_reading_summary_chars", 2400)
    seen = []
    class Spy(MockModelProvider):
        def read_evidence(self, request):
            seen.append(request)
            return super().read_evidence(request)
    materials = [{"id": str(i), "content": "HEAD " + "words " * 120 + f"TAIL{i}"} for i in range(12)]
    result = read_evidence(Spy(), materials, response_language="en")
    assert any(request.mode == "consolidate" for request in seen)
    assert [item["id"] for request in seen if request.mode == "read" for item in request.evidence] == [item["id"] for item in materials]
    assert result.covered_evidence_ids == [item["id"] for item in materials]


def test_host_reading_failure_does_not_publish_or_fallback(client, monkeypatch):
    from app.model_router.mock import MockModelProvider
    from test_material_reprocessing import task_with_source
    task, _ = task_with_source(client)
    monkeypatch.setattr(MockModelProvider, "read_evidence", lambda *args: (_ for _ in ()).throw(base.ModelProviderError("reading failed")))
    response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert response.status_code == 503
    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert aggregate["deliverables"] == []
    assert aggregate["status"] == "failed"


def test_partial_extraction_remains_visible_in_report_and_model_input(client, monkeypatch):
    from test_material_reprocessing import task_with_source
    from app.core.database import SessionLocal
    from app.domain import models
    from app.model_router.mock import MockModelProvider
    task, source = task_with_source(client)
    with SessionLocal() as db:
        original = db.get(models.SourceDocument, source["id"])
        original.extraction_manifest = {**original.extraction_manifest, "coverage": "partial"}
        db.commit()
    seen = []
    generate = MockModelProvider.generate_research_synthesis
    def spy(self, request):
        seen.append(request.background_text)
        return generate(self, request)
    monkeypatch.setattr(MockModelProvider, "generate_research_synthesis", spy)
    response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert response.status_code == 200
    content = response.json()["deliverable"]["content_structure"]
    assert content["material_reading"]["warnings"]
    assert any("材料尚未完整讀取" in text for text in seen)
    assert any("材料尚未完整讀取" in text for text in content["missing_information"])


def test_multi_agent_reuses_one_reading_and_budget_failure_blocks_report(client, monkeypatch):
    from test_mvp_slice import create_multi_agent_payload
    from app.model_router.mock import MockModelProvider
    from app.core.config import settings
    task = client.post("/api/v1/tasks", json=create_multi_agent_payload("Shared reading")).json()
    assert client.post(f"/api/v1/tasks/{task['id']}/uploads", files=[("files", ("a.txt", b"Costs are constrained. Revenue is uncertain.", "text/plain"))]).status_code == 200
    reads, analyses = [], []
    reader = MockModelProvider.read_evidence
    analyzer = MockModelProvider.generate_core_analysis
    def read(self, request):
        reads.append(request)
        return reader(self, request)
    def analyze(self, request):
        analyses.append(request)
        return analyzer(self, request)
    monkeypatch.setattr(MockModelProvider, "read_evidence", read)
    monkeypatch.setattr(MockModelProvider, "generate_core_analysis", analyze)
    response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert response.status_code == 200, response.text
    assert len(reads) == 1
    assert len(analyses) > 1
    assert all(request.evidence == analyses[0].evidence for request in analyses)
    count = len(client.get(f"/api/v1/tasks/{task['id']}").json()["deliverables"])
    monkeypatch.setattr(settings, "analysis_max_attempts", 1)
    assert client.post(f"/api/v1/tasks/{task['id']}/run").status_code == 503
    assert len(client.get(f"/api/v1/tasks/{task['id']}").json()["deliverables"]) == count


def test_consolidation_never_drops_conditions_or_uncited_gaps(monkeypatch):
    from app.agents.evidence_reading import read_evidence
    from app.core.config import settings
    from app.model_router.mock import MockModelProvider
    monkeypatch.setattr(settings, "material_reading_summary_chars", 2000)
    class Reader(MockModelProvider):
        def read_evidence(self, request):
            result = super().read_evidence(request)
            if request.mode == "read":
                result.conditions = [base.CitedStatement(text="Do not expand", kind="fact", citations=[{"evidence_id": "0", "quote": "Do not expand"}])]
                result.gaps = [base.CitedStatement(text="Funding remains uncertain", kind="assumption", citations=[])]
            return result
    materials = [{"id": str(i), "content": "Do not expand " + "words " * 120} for i in range(3)]
    result = read_evidence(Reader(), materials, response_language="en")
    assert result.consolidation_count > 0
    assert result.conditions[0].text == "Do not expand"
    assert result.gaps[0].text == "Funding remains uncertain"


def test_reading_batch_adapts_to_configured_model_context(monkeypatch):
    from app.agents.evidence_reading import read_evidence
    from app.model_router.mock import MockModelProvider
    from app.core.config import settings
    monkeypatch.setattr(settings, "model_context_window_tokens", {"synthetic-small": 25000})
    seen = []
    class SmallModel(MockModelProvider):
        model = "synthetic-small"
        def read_evidence(self, request):
            seen.append(request)
            return super().read_evidence(request)
    read_evidence(SmallModel(), [{"id": str(i), "content": "繁中 " * 900} for i in range(4)], response_language="zh-Hant")
    assert len([request for request in seen if request.mode == "read"]) > 1
