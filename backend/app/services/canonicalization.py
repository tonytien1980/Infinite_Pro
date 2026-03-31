from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import re

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.domain import models, schemas
from app.domain.enums import (
    CanonicalizationMatchBasis,
    CanonicalizationObjectFamily,
    CanonicalizationReviewStatus,
)
from app.services.source_materials import (
    OBJECT_TYPE_ARTIFACT,
    OBJECT_TYPE_EVIDENCE,
    OBJECT_TYPE_SOURCE_DOCUMENT,
    OBJECT_TYPE_SOURCE_MATERIAL,
    WORLD_SHARED_CONTINUITY_SCOPE,
    ensure_source_chain_participation_links,
)

DISPLAY_NAME_COPY_SUFFIX_RE = re.compile(r"\s*(?:\(\d+\)|[-_ ]copy)$", re.IGNORECASE)
WHITESPACE_RE = re.compile(r"\s+")


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class _SourceChainRow:
    source_document: models.SourceDocument
    source_material: models.SourceMaterial | None
    artifact: models.Artifact | None
    evidence: models.Evidence | None
    affected_task_ids: set[str]
    affected_task_titles: list[str]


def _normalize_display_name(value: str | None) -> str:
    if not value:
        return ""
    normalized = value.strip().lower()
    normalized = normalized.rsplit(".", 1)[0]
    normalized = DISPLAY_NAME_COPY_SUFFIX_RE.sub("", normalized)
    normalized = WHITESPACE_RE.sub(" ", normalized)
    return normalized.strip()


def _normalize_source_ref(value: str | None) -> str:
    if not value:
        return ""
    normalized = value.strip().lower()
    normalized = normalized.removesuffix("/")
    normalized = WHITESPACE_RE.sub(" ", normalized)
    return normalized.strip()


def ensure_matter_source_chain_participation_links(db: Session, matter_workspace_id: str) -> None:
    tasks = db.scalars(
        select(models.Task)
        .join(models.MatterWorkspaceTaskLink, models.MatterWorkspaceTaskLink.task_id == models.Task.id)
        .where(models.MatterWorkspaceTaskLink.matter_workspace_id == matter_workspace_id)
        .options(
            selectinload(models.Task.uploads),
            selectinload(models.Task.source_materials),
            selectinload(models.Task.artifacts),
            selectinload(models.Task.evidence),
        )
    ).all()
    changed = False
    for task in tasks:
        for source_document in task.uploads:
            if source_document.continuity_scope != WORLD_SHARED_CONTINUITY_SCOPE:
                continue
            ensure_source_chain_participation_links(
                db,
                task_id=task.id,
                matter_workspace_id=matter_workspace_id,
                source_document_id=source_document.id,
                source_material_id=None,
                artifact_id=None,
                evidence_id=None,
                participation_type="direct_ingest",
            )
            changed = True
        for source_material in task.source_materials:
            if source_material.continuity_scope != WORLD_SHARED_CONTINUITY_SCOPE:
                continue
            ensure_source_chain_participation_links(
                db,
                task_id=task.id,
                matter_workspace_id=matter_workspace_id,
                source_document_id=source_material.source_document_id,
                source_material_id=source_material.id,
                artifact_id=None,
                evidence_id=None,
                participation_type="direct_ingest",
            )
            changed = True
        for artifact in task.artifacts:
            if artifact.continuity_scope != WORLD_SHARED_CONTINUITY_SCOPE:
                continue
            ensure_source_chain_participation_links(
                db,
                task_id=task.id,
                matter_workspace_id=matter_workspace_id,
                source_document_id=artifact.source_document_id,
                source_material_id=artifact.source_material_id,
                artifact_id=artifact.id,
                evidence_id=None,
                participation_type="direct_ingest",
            )
            changed = True
        for evidence in task.evidence:
            if evidence.continuity_scope != WORLD_SHARED_CONTINUITY_SCOPE:
                continue
            ensure_source_chain_participation_links(
                db,
                task_id=task.id,
                matter_workspace_id=matter_workspace_id,
                source_document_id=evidence.source_document_id,
                source_material_id=evidence.source_material_id,
                artifact_id=evidence.artifact_id,
                evidence_id=evidence.id,
                participation_type="direct_ingest",
            )
            changed = True
    if changed:
        db.flush()


def _build_review_key(
    *,
    matter_workspace_id: str,
    match_basis: CanonicalizationMatchBasis,
    source_document_ids: list[str],
) -> str:
    digest = hashlib.sha1(
        f"{matter_workspace_id}:{match_basis.value}:{'|'.join(sorted(source_document_ids))}".encode("utf-8")
    ).hexdigest()[:24]
    return f"{CanonicalizationObjectFamily.SOURCE_CHAIN.value}:{digest}"


def _load_source_chain_rows(db: Session, matter_workspace_id: str) -> list[_SourceChainRow]:
    source_documents = db.scalars(
        select(models.SourceDocument)
        .where(models.SourceDocument.matter_workspace_id == matter_workspace_id)
        .where(models.SourceDocument.continuity_scope == WORLD_SHARED_CONTINUITY_SCOPE)
        .order_by(models.SourceDocument.created_at)
    ).all()
    source_materials = db.scalars(
        select(models.SourceMaterial)
        .where(models.SourceMaterial.matter_workspace_id == matter_workspace_id)
        .where(models.SourceMaterial.continuity_scope == WORLD_SHARED_CONTINUITY_SCOPE)
        .order_by(models.SourceMaterial.created_at)
    ).all()
    artifacts = db.scalars(
        select(models.Artifact)
        .where(models.Artifact.matter_workspace_id == matter_workspace_id)
        .where(models.Artifact.continuity_scope == WORLD_SHARED_CONTINUITY_SCOPE)
        .order_by(models.Artifact.created_at)
    ).all()
    evidence_items = db.scalars(
        select(models.Evidence)
        .where(models.Evidence.matter_workspace_id == matter_workspace_id)
        .where(models.Evidence.continuity_scope == WORLD_SHARED_CONTINUITY_SCOPE)
        .where(models.Evidence.evidence_type != "source_chunk")
        .order_by(models.Evidence.created_at)
    ).all()

    source_material_by_document: dict[str, models.SourceMaterial] = {}
    for row in source_materials:
        if row.source_document_id and row.source_document_id not in source_material_by_document:
            source_material_by_document[row.source_document_id] = row

    artifact_by_document: dict[str, models.Artifact] = {}
    for row in artifacts:
        if row.source_document_id and row.source_document_id not in artifact_by_document:
            artifact_by_document[row.source_document_id] = row

    evidence_by_document: dict[str, models.Evidence] = {}
    for row in evidence_items:
        if row.source_document_id and row.source_document_id not in evidence_by_document:
            evidence_by_document[row.source_document_id] = row

    task_ids_by_object: dict[tuple[str, str], set[str]] = defaultdict(set)
    participation_rows = db.scalars(
        select(models.TaskObjectParticipationLink).where(
            models.TaskObjectParticipationLink.matter_workspace_id == matter_workspace_id
        )
    ).all()
    for row in participation_rows:
        task_ids_by_object[(row.object_type, row.object_id)].add(row.task_id)

    matter_task_rows = db.execute(
        select(models.Task.id, models.Task.title)
        .join(models.MatterWorkspaceTaskLink, models.MatterWorkspaceTaskLink.task_id == models.Task.id)
        .where(models.MatterWorkspaceTaskLink.matter_workspace_id == matter_workspace_id)
    ).all()
    task_titles = {task_id: title for task_id, title in matter_task_rows}

    rows: list[_SourceChainRow] = []
    for source_document in source_documents:
        source_material = source_material_by_document.get(source_document.id)
        artifact = artifact_by_document.get(source_document.id)
        evidence = evidence_by_document.get(source_document.id)
        affected_task_ids = {source_document.task_id}
        affected_task_ids.update(task_ids_by_object.get((OBJECT_TYPE_SOURCE_DOCUMENT, source_document.id), set()))
        if source_material is not None:
            affected_task_ids.add(source_material.task_id)
            affected_task_ids.update(
                task_ids_by_object.get((OBJECT_TYPE_SOURCE_MATERIAL, source_material.id), set())
            )
        if artifact is not None:
            affected_task_ids.add(artifact.task_id)
            affected_task_ids.update(task_ids_by_object.get((OBJECT_TYPE_ARTIFACT, artifact.id), set()))
        if evidence is not None:
            affected_task_ids.add(evidence.task_id)
            affected_task_ids.update(task_ids_by_object.get((OBJECT_TYPE_EVIDENCE, evidence.id), set()))
        rows.append(
            _SourceChainRow(
                source_document=source_document,
                source_material=source_material,
                artifact=artifact,
                evidence=evidence,
                affected_task_ids=affected_task_ids,
                affected_task_titles=[
                    task_titles[task_id]
                    for task_id in sorted(affected_task_ids)
                    if task_id in task_titles
                ],
            )
        )
    return rows


def _group_candidate_rows(rows: list[_SourceChainRow]) -> list[tuple[CanonicalizationMatchBasis, str, str, list[_SourceChainRow]]]:
    claimed_document_ids: set[str] = set()
    groups: list[tuple[CanonicalizationMatchBasis, str, str, list[_SourceChainRow]]] = []

    def add_groups(
        match_basis: CanonicalizationMatchBasis,
        confidence_level: str,
        key_builder,
    ) -> None:
        grouped: dict[str, list[_SourceChainRow]] = defaultdict(list)
        for row in rows:
            if row.source_document.id in claimed_document_ids:
                continue
            key = key_builder(row)
            if not key:
                continue
            grouped[key].append(row)
        for key, group in grouped.items():
            if len(group) < 2:
                continue
            groups.append((match_basis, confidence_level, key, sorted(group, key=lambda item: item.source_document.created_at)))
            claimed_document_ids.update(item.source_document.id for item in group)

    add_groups(
        CanonicalizationMatchBasis.CONTENT_DIGEST_MATCH,
        "high",
        lambda row: row.source_document.content_digest or "",
    )
    add_groups(
        CanonicalizationMatchBasis.SOURCE_REF_MATCH,
        "high",
        lambda row: _normalize_source_ref(row.source_material.source_ref if row.source_material else None),
    )
    add_groups(
        CanonicalizationMatchBasis.DISPLAY_NAME_MATCH,
        "medium",
        lambda row: (
            ""
            if not _normalize_display_name(
                (row.source_material.canonical_display_name if row.source_material else None)
                or row.source_document.canonical_display_name
                or row.source_document.file_name
            )
            else (
                f"{row.source_document.source_type}:{row.source_document.file_extension or ''}:"
                f"{_normalize_display_name((row.source_material.canonical_display_name if row.source_material else None) or row.source_document.canonical_display_name or row.source_document.file_name)}"
            )
        ),
    )
    return groups


def _build_consultant_summary(
    *,
    match_basis: CanonicalizationMatchBasis,
    candidate_count: int,
    canonical_title: str,
    task_count: int,
) -> str:
    if match_basis == CanonicalizationMatchBasis.CONTENT_DIGEST_MATCH:
        return (
            f"同一案件世界內有 {candidate_count} 份材料的內容指紋一致；"
            f"建議確認它們是否其實都是「{canonical_title}」這條正式材料鏈，"
            f"目前影響 {task_count} 個 work slices。"
        )
    if match_basis == CanonicalizationMatchBasis.SOURCE_REF_MATCH:
        return (
            f"同一案件世界內有 {candidate_count} 份材料指向相同來源；"
            f"請確認它們是否應掛回同一條正式材料鏈，目前影響 {task_count} 個 work slices。"
        )
    return (
        f"同一案件世界內有 {candidate_count} 份材料名稱高度相近；"
        f"請確認它們是否其實都是「{canonical_title}」這條正式材料鏈，目前影響 {task_count} 個 work slices。"
    )


def _load_review_map(db: Session, matter_workspace_id: str) -> dict[str, models.MatterCanonicalizationReview]:
    reviews = db.scalars(
        select(models.MatterCanonicalizationReview).where(
            models.MatterCanonicalizationReview.matter_workspace_id == matter_workspace_id
        )
    ).all()
    return {item.review_key: item for item in reviews}


def build_matter_canonicalization_contract(
    db: Session,
    *,
    matter_workspace_id: str,
    current_task_id: str | None = None,
) -> tuple[schemas.CanonicalizationSummaryRead, list[schemas.CanonicalizationCandidateRead]]:
    ensure_matter_source_chain_participation_links(db, matter_workspace_id)
    rows = _load_source_chain_rows(db, matter_workspace_id)
    reviews_by_key = _load_review_map(db, matter_workspace_id)
    candidates: list[schemas.CanonicalizationCandidateRead] = []

    for match_basis, confidence_level, _, group in _group_candidate_rows(rows):
        source_document_ids = [item.source_document.id for item in group]
        review_key = _build_review_key(
            matter_workspace_id=matter_workspace_id,
            match_basis=match_basis,
            source_document_ids=source_document_ids,
        )
        review = reviews_by_key.get(review_key)
        default_canonical = group[0]
        canonical_source_document_id = (
            review.canonical_source_document_id if review and review.canonical_source_document_id else default_canonical.source_document.id
        )
        canonical_source_material_id = (
            review.canonical_source_material_id if review and review.canonical_source_material_id else default_canonical.source_material.id if default_canonical.source_material is not None else None
        )
        canonical_artifact_id = (
            review.canonical_artifact_id if review and review.canonical_artifact_id else default_canonical.artifact.id if default_canonical.artifact is not None else None
        )
        canonical_evidence_id = (
            review.canonical_evidence_id if review and review.canonical_evidence_id else default_canonical.evidence.id if default_canonical.evidence is not None else None
        )
        canonical_title = (
            default_canonical.source_material.title
            if default_canonical.source_material is not None
            else default_canonical.source_document.canonical_display_name or default_canonical.source_document.file_name
        )
        affected_task_ids = sorted({task_id for item in group for task_id in item.affected_task_ids})
        affected_task_titles = []
        for item in group:
            for task_title in item.affected_task_titles:
                if task_title not in affected_task_titles:
                    affected_task_titles.append(task_title)
        review_status = (
            CanonicalizationReviewStatus(review.review_status)
            if review is not None
            else CanonicalizationReviewStatus.PENDING_REVIEW
        )
        candidates.append(
            schemas.CanonicalizationCandidateRead(
                review_key=review_key,
                object_family=CanonicalizationObjectFamily.SOURCE_CHAIN,
                review_status=review_status,
                match_basis=match_basis,
                suggested_action=(
                    "merge_candidate"
                    if review_status == CanonicalizationReviewStatus.PENDING_REVIEW
                    else None
                ),
                confidence_level=review.confidence_level if review is not None else confidence_level,
                consultant_summary=(
                    review.consultant_summary
                    if review is not None and review.consultant_summary
                    else _build_consultant_summary(
                        match_basis=match_basis,
                        candidate_count=len(group),
                        canonical_title=canonical_title,
                        task_count=len(affected_task_ids),
                    )
                ),
                canonical_title=canonical_title,
                canonical_source_document_id=canonical_source_document_id,
                canonical_source_material_id=canonical_source_material_id,
                canonical_artifact_id=canonical_artifact_id,
                canonical_evidence_id=canonical_evidence_id,
                source_document_ids=source_document_ids,
                source_material_ids=[item.source_material.id for item in group if item.source_material is not None],
                artifact_ids=[item.artifact.id for item in group if item.artifact is not None],
                evidence_ids=[item.evidence.id for item in group if item.evidence is not None],
                affected_task_ids=affected_task_ids,
                affected_task_titles=affected_task_titles,
                candidate_count=len(group),
                task_count=len(affected_task_ids),
                current_task_involved=current_task_id in affected_task_ids if current_task_id else False,
                canonical_owner_scope="matter_canonical",
                local_participation_boundary="task_slice_participation",
                resolution_note=review.resolution_note if review is not None else "",
                resolved_at=review.resolved_at if review is not None else None,
            )
        )

    candidates.sort(
        key=lambda item: (
            0 if item.review_status == CanonicalizationReviewStatus.PENDING_REVIEW else 1,
            0 if item.confidence_level == "high" else 1,
            item.canonical_title.lower(),
        )
    )

    pending_review_count = sum(
        1 for item in candidates if item.review_status == CanonicalizationReviewStatus.PENDING_REVIEW
    )
    human_confirmed_count = sum(
        1
        for item in candidates
        if item.review_status == CanonicalizationReviewStatus.HUMAN_CONFIRMED_CANONICAL_ROW
    )
    kept_separate_count = sum(
        1 for item in candidates if item.review_status == CanonicalizationReviewStatus.KEEP_SEPARATE
    )
    split_count = sum(
        1 for item in candidates if item.review_status == CanonicalizationReviewStatus.SPLIT
    )
    current_task_pending_count = (
        sum(1 for item in candidates if item.current_task_involved and item.review_status == CanonicalizationReviewStatus.PENDING_REVIEW)
        if current_task_id
        else 0
    )
    if pending_review_count > 0:
        summary_text = (
            f"目前有 {pending_review_count} 組需確認是否同一份材料的候選；"
            f"處理只會落在同一案件世界內，不會跨案件世界合併。"
        )
    elif human_confirmed_count or kept_separate_count or split_count:
        summary_text = (
            f"這個案件世界目前已累積 {human_confirmed_count} 組已確認掛回同一條正式材料鏈、"
            f"{kept_separate_count} 組保留分開、{split_count} 組已拆分。"
        )
    else:
        summary_text = "目前沒有待處理的重複材料候選。"

    return (
        schemas.CanonicalizationSummaryRead(
            pending_review_count=pending_review_count,
            human_confirmed_count=human_confirmed_count,
            kept_separate_count=kept_separate_count,
            split_count=split_count,
            current_task_pending_count=current_task_pending_count,
            summary=summary_text,
        ),
        candidates,
    )


def _sync_link_to_self(db: Session, link: models.TaskObjectParticipationLink) -> None:
    if link.object_type == OBJECT_TYPE_SOURCE_DOCUMENT:
        link.canonical_object_id = link.object_id
        link.source_document_id = link.object_id
        link.source_material_id = None
        link.artifact_id = None
        link.evidence_id = None
    elif link.object_type == OBJECT_TYPE_SOURCE_MATERIAL:
        source_material = db.get(models.SourceMaterial, link.object_id)
        if source_material is None:
            return
        link.canonical_object_id = source_material.id
        link.source_document_id = source_material.source_document_id
        link.source_material_id = source_material.id
        link.artifact_id = None
        link.evidence_id = None
    elif link.object_type == OBJECT_TYPE_ARTIFACT:
        artifact = db.get(models.Artifact, link.object_id)
        if artifact is None:
            return
        link.canonical_object_id = artifact.id
        link.source_document_id = artifact.source_document_id
        link.source_material_id = artifact.source_material_id
        link.artifact_id = artifact.id
        link.evidence_id = None
    elif link.object_type == OBJECT_TYPE_EVIDENCE:
        evidence = db.get(models.Evidence, link.object_id)
        if evidence is None:
            return
        link.canonical_object_id = evidence.id
        link.source_document_id = evidence.source_document_id
        link.source_material_id = evidence.source_material_id
        link.artifact_id = evidence.artifact_id
        link.evidence_id = evidence.id
    db.add(link)


def _apply_candidate_resolution_to_links(
    db: Session,
    *,
    matter_workspace_id: str,
    candidate: schemas.CanonicalizationCandidateRead,
    resolution: str,
) -> None:
    rows = db.scalars(
        select(models.TaskObjectParticipationLink).where(
            models.TaskObjectParticipationLink.matter_workspace_id == matter_workspace_id
        )
    ).all()
    canonical_ids = {
        OBJECT_TYPE_SOURCE_DOCUMENT: candidate.canonical_source_document_id,
        OBJECT_TYPE_SOURCE_MATERIAL: candidate.canonical_source_material_id,
        OBJECT_TYPE_ARTIFACT: candidate.canonical_artifact_id,
        OBJECT_TYPE_EVIDENCE: candidate.canonical_evidence_id,
    }
    object_ids_by_type = {
        OBJECT_TYPE_SOURCE_DOCUMENT: set(candidate.source_document_ids),
        OBJECT_TYPE_SOURCE_MATERIAL: set(candidate.source_material_ids),
        OBJECT_TYPE_ARTIFACT: set(candidate.artifact_ids),
        OBJECT_TYPE_EVIDENCE: set(candidate.evidence_ids),
    }
    for row in rows:
        if row.object_type not in object_ids_by_type:
            continue
        if row.object_id not in object_ids_by_type[row.object_type]:
            continue
        if resolution == CanonicalizationReviewStatus.HUMAN_CONFIRMED_CANONICAL_ROW.value:
            canonical_object_id = canonical_ids.get(row.object_type)
            if canonical_object_id:
                row.canonical_object_id = canonical_object_id
            if candidate.canonical_source_document_id:
                row.source_document_id = candidate.canonical_source_document_id
            if row.object_type in {OBJECT_TYPE_SOURCE_MATERIAL, OBJECT_TYPE_ARTIFACT, OBJECT_TYPE_EVIDENCE}:
                row.source_material_id = candidate.canonical_source_material_id
            if row.object_type in {OBJECT_TYPE_ARTIFACT, OBJECT_TYPE_EVIDENCE}:
                row.artifact_id = candidate.canonical_artifact_id
            if row.object_type == OBJECT_TYPE_EVIDENCE:
                row.evidence_id = candidate.canonical_evidence_id
            db.add(row)
            continue
        _sync_link_to_self(db, row)
    db.flush()


def apply_matter_canonicalization_review(
    db: Session,
    *,
    matter_workspace_id: str,
    payload: schemas.MatterCanonicalizationReviewRequest,
) -> None:
    matter_workspace = db.get(models.MatterWorkspace, matter_workspace_id)
    if matter_workspace is None:
        raise HTTPException(status_code=404, detail="找不到指定案件工作面。")

    _, candidates = build_matter_canonicalization_contract(db, matter_workspace_id=matter_workspace_id)
    candidate = next((item for item in candidates if item.review_key == payload.review_key), None)
    if candidate is None:
        raise HTTPException(status_code=404, detail="找不到指定的重複材料確認項目。")

    review = db.scalars(
        select(models.MatterCanonicalizationReview)
        .where(models.MatterCanonicalizationReview.matter_workspace_id == matter_workspace_id)
        .where(models.MatterCanonicalizationReview.review_key == payload.review_key)
    ).one_or_none()
    if review is None:
        review = models.MatterCanonicalizationReview(
            matter_workspace_id=matter_workspace_id,
            review_key=payload.review_key,
        )

    _apply_candidate_resolution_to_links(
        db,
        matter_workspace_id=matter_workspace_id,
        candidate=candidate,
        resolution=payload.resolution,
    )
    review.object_family = candidate.object_family.value
    review.match_basis = candidate.match_basis.value
    review.review_status = payload.resolution
    review.confidence_level = candidate.confidence_level
    review.consultant_summary = candidate.consultant_summary
    review.resolution_note = payload.note
    review.canonical_source_document_id = candidate.canonical_source_document_id
    review.canonical_source_material_id = candidate.canonical_source_material_id
    review.canonical_artifact_id = candidate.canonical_artifact_id
    review.canonical_evidence_id = candidate.canonical_evidence_id
    review.source_document_ids = list(candidate.source_document_ids)
    review.source_material_ids = list(candidate.source_material_ids)
    review.artifact_ids = list(candidate.artifact_ids)
    review.evidence_ids = list(candidate.evidence_ids)
    review.task_ids = list(candidate.affected_task_ids)
    review.resolved_by = "consultant_manual"
    review.resolved_at = _utc_now()
    db.add(review)
    db.commit()
