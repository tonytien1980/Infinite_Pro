from __future__ import annotations

from dataclasses import dataclass

from app.services.storage_manager import (
    AVAILABILITY_AVAILABLE,
    AVAILABILITY_METADATA_ONLY,
    AVAILABILITY_REFERENCE_ONLY,
)

TABLE_EXTRACT_STRATEGIES = {"table_snapshot", "worksheet_snapshot"}
REFERENCE_ONLY_STRATEGIES = {
    "reference_image",
    "image_reference",
    "pdf_metadata_only",
    "scanned_pdf_reference",
}
PENDING_INGEST_STATUSES = {"pending", "processing", "queued"}

INGESTION_MARKER_REFERENCE_ONLY_BOUNDARY_READY = "reference_only_boundary_ready"
INGESTION_MARKER_LIMITED_EXTRACT_BOUNDARY_READY = "limited_extract_boundary_ready"
INGESTION_MARKER_FALLBACK_SEMANTICS_READY = "fallback_semantics_ready"


@dataclass(frozen=True)
class IngestionContractSummary:
    diagnostic_category: str
    extract_availability: str
    current_usable_scope: str
    fallback_mode: str


def build_ingestion_contract_summary(
    *,
    ingest_status: str | None,
    support_level: str | None,
    ingest_strategy: str | None,
    metadata_only: bool,
    ingestion_error: str | None = None,
) -> IngestionContractSummary:
    normalized_status = (ingest_status or "").strip().lower()
    normalized_support = (support_level or "").strip().lower()
    normalized_strategy = (ingest_strategy or "").strip().lower()
    normalized_error = (ingestion_error or "").strip()

    if normalized_status == "failed":
        diagnostic_category = "empty_or_invalid" if "空白" in normalized_error else "parse_failed"
        return IngestionContractSummary(
            diagnostic_category=diagnostic_category,
            extract_availability="not_available",
            current_usable_scope="unusable",
            fallback_mode="replace_with_text_first",
        )

    if normalized_support == "unsupported" or normalized_status == "unsupported":
        return IngestionContractSummary(
            diagnostic_category="unsupported_format",
            extract_availability="not_available",
            current_usable_scope="unusable",
            fallback_mode="replace_with_supported_material",
        )

    if normalized_status in PENDING_INGEST_STATUSES:
        return IngestionContractSummary(
            diagnostic_category="parse_pending",
            extract_availability="pending",
            current_usable_scope="pending",
            fallback_mode="wait_or_supplement_text",
        )

    if normalized_strategy in TABLE_EXTRACT_STRATEGIES:
        return IngestionContractSummary(
            diagnostic_category="accepted_limited_table_extract",
            extract_availability="partial_extract_ready",
            current_usable_scope="limited_extract",
            fallback_mode="supplement_text_for_precision",
        )

    if (
        metadata_only
        or normalized_status == "metadata_only"
        or normalized_strategy in REFERENCE_ONLY_STRATEGIES
    ):
        diagnostic_category = "reference_only_generic"
        if normalized_strategy in {"pdf_metadata_only", "scanned_pdf_reference"}:
            diagnostic_category = "reference_only_scan"
        elif normalized_strategy in {"reference_image", "image_reference"}:
            diagnostic_category = "reference_only_image"
        return IngestionContractSummary(
            diagnostic_category=diagnostic_category,
            extract_availability="reference_only",
            current_usable_scope="reference_only",
            fallback_mode="supplement_text_or_replace",
        )

    return IngestionContractSummary(
        diagnostic_category="accepted_full_text",
        extract_availability="full_text_ready",
        current_usable_scope="chunk_ready",
        fallback_mode="none",
    )


def resolve_source_availability_state(
    *,
    support_level: str | None,
    metadata_only: bool,
    extracted_text: str | None = None,
) -> str:
    normalized_support = (support_level or "").strip().lower()
    if metadata_only:
        if normalized_support == "unsupported":
            return AVAILABILITY_METADATA_ONLY
        return AVAILABILITY_REFERENCE_ONLY
    if extracted_text:
        return AVAILABILITY_AVAILABLE
    return AVAILABILITY_AVAILABLE


def supported_ingestion_hardening_markers() -> list[str]:
    return [
        INGESTION_MARKER_REFERENCE_ONLY_BOUNDARY_READY,
        INGESTION_MARKER_LIMITED_EXTRACT_BOUNDARY_READY,
        INGESTION_MARKER_FALLBACK_SEMANTICS_READY,
    ]
