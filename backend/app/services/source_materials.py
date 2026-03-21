from __future__ import annotations

from app.domain import models
from app.ingestion.preprocess import build_text_chunks, infer_relevance_label, summarize_evidence_text


def _task_query_parts(task: models.Task) -> list[str]:
    return [
        task.title,
        task.description,
        *(subject.name for subject in task.subjects),
        *(goal.description for goal in task.goals),
    ]


def build_processed_evidence_items(
    *,
    task: models.Task,
    source_document: models.SourceDocument,
    source_ref: str,
    title: str,
    text: str,
    primary_evidence_type: str,
    reliability_level: str = "user_provided",
) -> tuple[models.Evidence, list[models.Evidence]]:
    relevance = infer_relevance_label(text, _task_query_parts(task))
    summary = summarize_evidence_text(text)
    primary = models.Evidence(
        task_id=task.id,
        source_document_id=source_document.id,
        evidence_type=primary_evidence_type,
        source_type=source_document.source_type,
        source_ref=source_ref,
        title=title,
        excerpt_or_summary=(
            f"關聯度：{relevance}\n"
            f"來源摘要：{summary}"
        ),
        reliability_level=reliability_level,
    )

    chunk_items = [
        models.Evidence(
            task_id=task.id,
            source_document_id=source_document.id,
            evidence_type="source_chunk",
            source_type=source_document.source_type,
            source_ref=source_ref,
            title=f"{title} - 片段 {index + 1}",
            excerpt_or_summary=(
                f"關聯度：{relevance}\n"
                f"內容片段：{chunk}"
            ),
            reliability_level=reliability_level,
        )
        for index, chunk in enumerate(build_text_chunks(text))
    ]
    return primary, chunk_items


def build_failed_evidence_item(
    *,
    task_id: str,
    source_document_id: str,
    source_type: str,
    source_ref: str,
    title: str,
    error_message: str,
) -> models.Evidence:
    return models.Evidence(
        task_id=task_id,
        source_document_id=source_document_id,
        evidence_type="source_ingestion_issue",
        source_type=source_type,
        source_ref=source_ref,
        title=title,
        excerpt_or_summary=f"來源擷取失敗：{error_message}",
        reliability_level="user_provided",
    )


def build_unparsed_evidence_item(
    *,
    task_id: str,
    source_document_id: str,
    source_type: str,
    source_ref: str,
    title: str,
) -> models.Evidence:
    return models.Evidence(
        task_id=task_id,
        source_document_id=source_document_id,
        evidence_type="source_unparsed",
        source_type=source_type,
        source_ref=source_ref,
        title=title,
        excerpt_or_summary="來源已附加，但目前尚未抽出可供分析的文字內容。",
        reliability_level="user_provided",
    )
