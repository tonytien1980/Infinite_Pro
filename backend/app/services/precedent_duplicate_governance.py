from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import re
from typing import Iterable

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.domain import models, schemas
from app.domain.enums import (
    AdoptionFeedbackStatus,
    CanonicalizationMatchBasis,
    CanonicalizationObjectFamily,
    CanonicalizationReviewStatus,
    PrecedentCandidateStatus,
)

WHITESPACE_RE = re.compile(r"\s+")
NON_WORD_RE = re.compile(r"[^\w\u4e00-\u9fff]+", re.UNICODE)


@dataclass
class _DuplicateGroup:
    matter_workspace_id: str
    matter_title: str
    review_key: str
    candidate_rows: list[models.PrecedentCandidate]


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_precedent_text(value: str | None) -> str:
    if not value:
        return ""
    normalized = value.strip().lower()
    normalized = NON_WORD_RE.sub(" ", normalized)
    normalized = WHITESPACE_RE.sub(" ", normalized)
    return normalized.strip()


def _candidate_shape_text(candidate: models.PrecedentCandidate) -> str:
    snapshot = candidate.pattern_snapshot or {}
    preferred = snapshot.get("summary") if isinstance(snapshot, dict) else None
    return _normalize_precedent_text(str(preferred or candidate.summary or candidate.title or ""))


def _build_review_key(
    *,
    matter_workspace_id: str,
    candidate_type: str,
    lane_id: str,
    deliverable_type: str | None,
    shape_text: str,
) -> str:
    signature = "|".join(
        [
            matter_workspace_id,
            candidate_type,
            lane_id or "",
            deliverable_type or "",
            shape_text,
        ]
    )
    digest = hashlib.sha1(signature.encode("utf-8")).hexdigest()[:24]
    return f"{CanonicalizationObjectFamily.PRECEDENT.value}:{digest}"


def _load_review_map(
    db: Session,
    matter_workspace_ids: Iterable[str] | None = None,
) -> dict[tuple[str, str], models.MatterPrecedentDuplicateReview]:
    statement = select(models.MatterPrecedentDuplicateReview)
    if matter_workspace_ids:
        statement = statement.where(
            models.MatterPrecedentDuplicateReview.matter_workspace_id.in_(list(matter_workspace_ids))
        )
    rows = db.scalars(statement).all()
    return {(row.matter_workspace_id, row.review_key): row for row in rows}


def _preferred_candidate_row(rows: list[models.PrecedentCandidate]) -> models.PrecedentCandidate:
    def sort_key(row: models.PrecedentCandidate) -> tuple[int, int, int, float, float]:
        promoted_rank = 0 if row.candidate_status == PrecedentCandidateStatus.PROMOTED.value else 1
        feedback_rank = (
            0
            if row.source_feedback_status == AdoptionFeedbackStatus.TEMPLATE_CANDIDATE.value
            else 1
            if row.source_feedback_status == AdoptionFeedbackStatus.ADOPTED.value
            else 2
        )
        candidate_rank = 0 if row.candidate_status == PrecedentCandidateStatus.CANDIDATE.value else 1
        return (
            promoted_rank,
            feedback_rank,
            candidate_rank,
            -row.updated_at.timestamp(),
            -row.created_at.timestamp(),
        )

    return sorted(rows, key=sort_key)[0]


def _group_duplicate_candidates(
    rows: Iterable[models.PrecedentCandidate],
) -> list[_DuplicateGroup]:
    grouped: dict[tuple[str, str, str, str, str], list[models.PrecedentCandidate]] = defaultdict(list)
    for row in rows:
        if not row.matter_workspace_id:
            continue
        shape_text = _candidate_shape_text(row)
        if not shape_text:
            continue
        signature = (
            row.matter_workspace_id,
            row.candidate_type,
            row.lane_id or "",
            row.deliverable_type or "",
            shape_text,
        )
        grouped[signature].append(row)

    groups: list[_DuplicateGroup] = []
    for (matter_workspace_id, candidate_type, lane_id, deliverable_type, shape_text), candidate_rows in grouped.items():
        if len(candidate_rows) < 2:
            continue
        preferred = _preferred_candidate_row(candidate_rows)
        groups.append(
            _DuplicateGroup(
                matter_workspace_id=matter_workspace_id,
                matter_title=preferred.matter_workspace.title if preferred.matter_workspace else "未掛案件",
                review_key=_build_review_key(
                    matter_workspace_id=matter_workspace_id,
                    candidate_type=candidate_type,
                    lane_id=lane_id,
                    deliverable_type=deliverable_type or None,
                    shape_text=shape_text,
                ),
                candidate_rows=sorted(candidate_rows, key=lambda item: item.updated_at, reverse=True),
            )
        )
    groups.sort(key=lambda item: (item.matter_title.lower(), item.review_key))
    return groups


def build_precedent_duplicate_contract(
    db: Session,
    *,
    candidate_rows: Iterable[models.PrecedentCandidate] | None = None,
) -> tuple[schemas.PrecedentDuplicateSummaryRead, list[schemas.PrecedentDuplicateCandidateRead]]:
    rows = list(candidate_rows) if candidate_rows is not None else db.scalars(
        select(models.PrecedentCandidate)
        .options(
            selectinload(models.PrecedentCandidate.matter_workspace),
            selectinload(models.PrecedentCandidate.task),
        )
        .order_by(models.PrecedentCandidate.updated_at.desc())
    ).all()
    groups = _group_duplicate_candidates(rows)
    review_map = _load_review_map(db, [item.matter_workspace_id for item in groups])
    candidates: list[schemas.PrecedentDuplicateCandidateRead] = []

    for group in groups:
        review = review_map.get((group.matter_workspace_id, group.review_key))
        review_status = (
            CanonicalizationReviewStatus(review.review_status)
            if review is not None
            else CanonicalizationReviewStatus.PENDING_REVIEW
        )
        preferred = _preferred_candidate_row(group.candidate_rows)
        canonical_candidate_id = (
            review.canonical_candidate_id
            if review is not None and review.canonical_candidate_id
            else preferred.id
        )
        canonical_title = next(
            (item.title or "未命名模式" for item in group.candidate_rows if item.id == canonical_candidate_id),
            preferred.title or "未命名模式",
        )
        task_titles = []
        seen_task_titles: set[str] = set()
        for row in group.candidate_rows:
            title = row.task.title if row.task else "未命名工作"
            if title not in seen_task_titles:
                task_titles.append(title)
                seen_task_titles.add(title)
        candidates.append(
            schemas.PrecedentDuplicateCandidateRead(
                review_key=group.review_key,
                object_family=CanonicalizationObjectFamily.PRECEDENT,
                review_status=review_status,
                match_basis=CanonicalizationMatchBasis.PATTERN_SIGNATURE_MATCH,
                suggested_action=(
                    "merge_candidate"
                    if review_status == CanonicalizationReviewStatus.PENDING_REVIEW
                    else None
                ),
                confidence_level=review.confidence_level if review is not None else "high",
                consultant_summary=(
                    review.consultant_summary
                    if review is not None and review.consultant_summary
                    else f"這案目前有 {len(group.candidate_rows)} 個很像的模式候選，建議先確認是否其實是同一種模式。"
                ),
                canonical_candidate_id=canonical_candidate_id,
                canonical_title=canonical_title,
                matter_workspace_id=group.matter_workspace_id,
                matter_title=group.matter_title,
                candidate_type=group.candidate_rows[0].candidate_type,  # type: ignore[arg-type]
                candidate_ids=[item.id for item in group.candidate_rows],
                candidate_titles=[item.title or "未命名模式" for item in group.candidate_rows],
                task_ids=list(dict.fromkeys(item.task_id for item in group.candidate_rows)),
                task_titles=task_titles,
                candidate_count=len(group.candidate_rows),
                resolution_note=review.resolution_note if review is not None else "",
                resolved_at=review.resolved_at if review is not None else None,
            )
        )

    candidates.sort(
        key=lambda item: (
            0 if item.review_status == CanonicalizationReviewStatus.PENDING_REVIEW else 1,
            item.matter_title.lower(),
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
    if pending_review_count > 0:
        summary = (
            f"目前有 {pending_review_count} 組同案重複候選待確認；"
            "這只會整理同一案件世界裡的 precedent 參考，不會刪除 raw candidates。"
        )
    elif human_confirmed_count or kept_separate_count or split_count:
        summary = (
            f"目前已整理 {human_confirmed_count} 組確認同一模式、"
            f"{kept_separate_count} 組保留分開、{split_count} 組拆成不同模式。"
        )
    else:
        summary = "目前沒有待處理的同案重複 precedent 候選。"

    return (
        schemas.PrecedentDuplicateSummaryRead(
            pending_review_count=pending_review_count,
            human_confirmed_count=human_confirmed_count,
            kept_separate_count=kept_separate_count,
            split_count=split_count,
            summary=summary,
        ),
        candidates,
    )


def collapse_precedent_candidates_for_reference(
    db: Session,
    candidate_rows: Iterable[models.PrecedentCandidate],
) -> list[models.PrecedentCandidate]:
    rows = list(candidate_rows)
    groups = _group_duplicate_candidates(rows)
    if not groups:
        return rows

    review_map = _load_review_map(db, [item.matter_workspace_id for item in groups])
    keep_ids: set[str] = set()
    grouped_candidate_ids: set[str] = set()

    for group in groups:
        review = review_map.get((group.matter_workspace_id, group.review_key))
        grouped_candidate_ids.update(item.id for item in group.candidate_rows)
        if review is not None and review.review_status in {
            CanonicalizationReviewStatus.KEEP_SEPARATE.value,
            CanonicalizationReviewStatus.SPLIT.value,
        }:
            keep_ids.update(item.id for item in group.candidate_rows)
            continue

        if (
            review is not None
            and review.review_status == CanonicalizationReviewStatus.HUMAN_CONFIRMED_CANONICAL_ROW.value
            and review.canonical_candidate_id
            and any(item.id == review.canonical_candidate_id for item in group.candidate_rows)
        ):
            keep_ids.add(review.canonical_candidate_id)
            continue

        keep_ids.add(_preferred_candidate_row(group.candidate_rows).id)

    collapsed = [
        row
        for row in rows
        if row.id in keep_ids or row.id not in grouped_candidate_ids
    ]
    return collapsed


def apply_matter_precedent_duplicate_review(
    db: Session,
    *,
    matter_workspace_id: str,
    payload: schemas.MatterPrecedentDuplicateReviewRequest,
) -> None:
    matter_workspace = db.get(models.MatterWorkspace, matter_workspace_id)
    if matter_workspace is None:
        raise HTTPException(status_code=404, detail="找不到指定案件工作面。")

    _, candidates = build_precedent_duplicate_contract(db)
    candidate = next(
        (
            item
            for item in candidates
            if item.matter_workspace_id == matter_workspace_id and item.review_key == payload.review_key
        ),
        None,
    )
    if candidate is None:
        raise HTTPException(status_code=404, detail="找不到指定的重複 precedent 候選。")

    review = db.scalars(
        select(models.MatterPrecedentDuplicateReview)
        .where(models.MatterPrecedentDuplicateReview.matter_workspace_id == matter_workspace_id)
        .where(models.MatterPrecedentDuplicateReview.review_key == payload.review_key)
    ).one_or_none()
    if review is None:
        review = models.MatterPrecedentDuplicateReview(
            matter_workspace_id=matter_workspace_id,
            review_key=payload.review_key,
        )

    review.object_family = CanonicalizationObjectFamily.PRECEDENT.value
    review.match_basis = CanonicalizationMatchBasis.PATTERN_SIGNATURE_MATCH.value
    review.review_status = payload.resolution
    review.confidence_level = candidate.confidence_level
    review.consultant_summary = candidate.consultant_summary
    review.resolution_note = payload.note
    review.canonical_candidate_id = candidate.canonical_candidate_id
    review.candidate_ids = list(candidate.candidate_ids)
    review.task_ids = list(candidate.task_ids)
    review.resolved_by = "consultant_manual"
    review.resolved_at = _utc_now()
    db.add(review)
    db.commit()
