from __future__ import annotations

import json

from pydantic import Field

from app.core.config import settings
from app.model_router.base import AnalysisBudgetError, EvidenceReadingOutput, EvidenceReadingRequest, ModelProvider, ModelProviderError
from app.model_router.structured_tasks import build_evidence_reading_spec
from app.services.citation_validation import validate_cited_statement


READING_FIELDS = ("facts", "numbers", "conditions", "conflicts", "gaps")


class MaterialReading(EvidenceReadingOutput):
    batch_count: int = 0
    consolidation_count: int = 0
    warnings: list[str] = Field(default_factory=list)


def _reading_fits(provider: ModelProvider, request: EvidenceReadingRequest) -> bool:
    model = getattr(provider, "model", None)
    if model is None:
        return True
    capacity = settings.model_context_window_tokens.get(model)
    if not capacity:
        raise AnalysisBudgetError("模型 context 容量未知；請先設定已確認的模型容量，未送出請求。")
    spec = build_evidence_reading_spec(request)
    envelope = {"system": spec.system_prompt, "schema": spec.schema, "user": spec.user_prompt}
    estimate = len(json.dumps(envelope, ensure_ascii=False).encode("utf-8")) + 2048
    return estimate + settings.analysis_output_tokens <= capacity


def _validated_read(provider, request: EvidenceReadingRequest, permitted: dict[str, str]):
    if not _reading_fits(provider, request):
        raise AnalysisBudgetError("材料閱讀請求超過模型 context 容量；本輪未完成，未送出此批。")
    for attempt in range(2):
        try:
            output = provider.read_evidence(request)
            expected = {item["id"] for item in request.evidence}
            if len(output.covered_evidence_ids) != len(expected) or set(output.covered_evidence_ids) != expected:
                raise ValueError("Reading coverage does not match this batch")
            cited = set()
            for name in READING_FIELDS:
                for statement in getattr(output, name):
                    validate_cited_statement(statement, permitted)
                    cited.update(statement.evidence_refs)
            if not expected.issubset(cited):
                raise ValueError("Every read evidence item needs an attributed observation or gap")
            return output
        except ValueError as exc:
            if attempt:
                raise ModelProviderError("材料閱讀檢核失敗；本輪未完成，請重試或檢查來源。") from exc
            request.repair_reason = str(exc)


def _compact_facts(provider, result: MaterialReading, permitted: dict[str, str], response_language: str) -> None:
    def size():
        return sum(len(item.model_dump_json()) for name in READING_FIELDS for item in getattr(result, name))

    while size() > settings.material_reading_summary_chars:
        before = size()
        groups: list[list] = []
        length = 0
        for statement in result.facts:
            item_length = len(statement.model_dump_json())
            if item_length > settings.material_reading_batch_chars:
                raise ModelProviderError("閱讀摘要超過單批容量；本輪未完成，請縮小材料後再試。")
            if not groups or length + item_length > settings.material_reading_batch_chars:
                groups.append([])
                length = 0
            groups[-1].append(statement)
            length += item_length
        compacted = []
        for group in groups:
            unattributed = [statement for statement in group if not statement.citations]
            compacted.extend(unattributed)
            ids = list(dict.fromkeys(ref for statement in group for ref in statement.evidence_refs))
            if not ids:
                continue
            inputs = [{
                "id": ref,
                "content": "\n".join(dict.fromkeys(c.quote for statement in group for c in statement.citations if c.evidence_id == ref)),
                "statements": [statement.model_dump(mode="json") for statement in group if ref in statement.evidence_refs],
            } for ref in ids]
            output = _validated_read(
                provider, EvidenceReadingRequest(evidence=inputs, mode="consolidate", response_language=response_language),
                {key: permitted[key] for key in ids},
            )
            compacted.extend(output.facts)
            # The original numbers, conditions, conflicts and gaps are never handed over
            # to lossy summarization. New observations are also retained, not discarded.
            for name in READING_FIELDS[1:]:
                getattr(result, name).extend(getattr(output, name))
            result.consolidation_count += 1
        result.facts = compacted
        if size() >= before:
            raise ModelProviderError("閱讀摘要無法在預算內保留全部依據與衝突；本輪未完成，請縮小本輪問題。")


def read_evidence(provider: ModelProvider, evidence: list[dict], *, response_language: str) -> MaterialReading:
    batches: list[list[dict]] = []
    size = 0
    for item in evidence:
        length = len(item["content"])
        if length > settings.material_reading_batch_chars:
            raise ModelProviderError("材料片段超過單批閱讀上限；請重新讀取原檔後再分析。")
        if not _reading_fits(provider, EvidenceReadingRequest(evidence=[item], response_language=response_language)):
            raise AnalysisBudgetError("單一材料片段超過模型 context 容量；請確認模型設定，未送出請求。")
        if not batches or size + length > settings.material_reading_batch_chars or not _reading_fits(
            provider, EvidenceReadingRequest(evidence=[*batches[-1], item], response_language=response_language)
        ):
            batches.append([])
            size = 0
        batches[-1].append(item)
        size += length
    result = MaterialReading(covered_evidence_ids=[], **{name: [] for name in READING_FIELDS})
    for batch in batches:
        permitted = {item["id"]: item["content"] for item in batch}
        request = EvidenceReadingRequest(evidence=batch, response_language=response_language)
        try:
            output = _validated_read(provider, request, permitted)
        except ModelProviderError as exc:
            raise type(exc)(
                f"材料閱讀未完成：已讀 {len(result.covered_evidence_ids)}／{len(evidence)} 個片段；"
                f"失敗批次：{'、'.join(str(item.get('title', item['id'])) for item in batch)}。{exc}"
            ) from exc
        result.covered_evidence_ids.extend(permitted)
        for name in READING_FIELDS:
            getattr(result, name).extend(getattr(output, name))
        result.batch_count += 1
    try:
        _compact_facts(provider, result, {item["id"]: item["content"] for item in evidence}, response_language)
    except ModelProviderError as exc:
        raise type(exc)(f"材料已讀 {len(result.covered_evidence_ids)}／{len(evidence)} 個片段，但整理尚未完成。{exc}") from exc
    return result
