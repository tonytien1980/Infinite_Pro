from __future__ import annotations

import json
from pathlib import Path

from app.benchmarks.schemas import (
    BenchmarkCase,
    BenchmarkHintArea,
    BenchmarkManifest,
    BenchmarkObservation,
    BenchmarkResultRecord,
    BenchmarkStatus,
)
from app.extensions.registry import ExtensionRegistry
from app.extensions.resolver import PackResolver
from app.extensions.schemas import (
    PackContractInterfaceId,
    PackResolverInput,
    PackSpec,
)

DEFAULT_P0_INDUSTRY_BATCH1_MANIFEST = (
    Path(__file__).resolve().parent / "manifests" / "p0_industry_batch1.json"
)
DEFAULT_P0_INDUSTRY_BATCH2_MANIFEST = (
    Path(__file__).resolve().parent / "manifests" / "p0_industry_batch2.json"
)
DEFAULT_P0_LEGAL_FINANCE_CONTRACT_MANIFEST = (
    Path(__file__).resolve().parent / "manifests" / "p0_legal_finance_contract.json"
)
DEFAULT_P0_OPERATIONS_PROCESS_MANIFEST = (
    Path(__file__).resolve().parent / "manifests" / "p0_operations_process.json"
)


def load_manifest(path: Path | str = DEFAULT_P0_INDUSTRY_BATCH1_MANIFEST) -> BenchmarkManifest:
    manifest_path = Path(path)
    payload = json.loads(manifest_path.read_text(encoding="utf-8"))
    return BenchmarkManifest.model_validate(payload)


def run_manifest(
    manifest: BenchmarkManifest,
    *,
    registry: ExtensionRegistry | None = None,
    resolver: PackResolver | None = None,
) -> list[BenchmarkResultRecord]:
    registry = registry or ExtensionRegistry()
    resolver = resolver or PackResolver(registry)
    return [run_benchmark_case(case, registry=registry, resolver=resolver) for case in manifest.cases]


def run_benchmark_case(
    case: BenchmarkCase,
    *,
    registry: ExtensionRegistry | None = None,
    resolver: PackResolver | None = None,
) -> BenchmarkResultRecord:
    registry = registry or ExtensionRegistry()
    resolver = resolver or PackResolver(registry)

    resolution = resolver.resolve(
        PackResolverInput(
            domain_lenses=case.domain_lenses,
            client_type=case.client_type,
            client_stage=case.client_stage,
            decision_context_summary=case.decision_context_summary,
            explicit_pack_ids=[],
            industry_hints=case.industry_hints,
        )
    )
    selected_ids = [*resolution.selected_domain_pack_ids, *resolution.selected_industry_pack_ids]
    target_ids = [*case.target_domain_pack_ids, *case.target_industry_pack_ids]
    observations: list[BenchmarkObservation] = []

    missing_target_pack_ids = [pack_id for pack_id in target_ids if pack_id not in selected_ids]
    if missing_target_pack_ids:
        observations.append(
            BenchmarkObservation(
                dimension="target_pack_selection",
                status=BenchmarkStatus.FAIL,
                detail="未選到目標 pack：" + "、".join(missing_target_pack_ids),
                regression_marker="target_pack_missing",
            )
        )
    else:
        observations.append(
            BenchmarkObservation(
                dimension="target_pack_selection",
                status=BenchmarkStatus.PASS,
                detail="已選到所有目標 packs。",
            )
        )

    satisfied_interface_ids: list[PackContractInterfaceId] = []
    observed_hint_areas: list[BenchmarkHintArea] = []
    for pack_id in target_ids:
        pack = registry.get_pack(pack_id)
        if pack is None:
            observations.append(
                BenchmarkObservation(
                    dimension=f"{pack_id}.registry",
                    status=BenchmarkStatus.FAIL,
                    detail="Registry 找不到目標 pack。",
                    regression_marker="missing_pack_spec",
                )
            )
            continue

        for interface_id in case.expected_contract_interface_ids:
            if _pack_supports_interface(pack, interface_id):
                satisfied_interface_ids.append(interface_id)
            else:
                observations.append(
                    BenchmarkObservation(
                        dimension=f"{pack_id}.{interface_id.value}",
                        status=BenchmarkStatus.WARN,
                        detail="目標 pack 尚未滿足預期 contract interface。",
                        regression_marker="missing_contract_interface",
                    )
                )

        for area in case.expected_hint_areas:
            if _pack_has_hint_area(pack, area):
                observed_hint_areas.append(area)
            else:
                observations.append(
                    BenchmarkObservation(
                        dimension=f"{pack_id}.{area.value}",
                        status=BenchmarkStatus.WARN,
                        detail="目標 pack 尚未提供對應 hint area。",
                        regression_marker="missing_hint_area",
                    )
                )

    if not [item for item in observations if item.status == BenchmarkStatus.FAIL]:
        observations.append(
            BenchmarkObservation(
                dimension="signal_summary",
                status=BenchmarkStatus.PASS,
                detail=(
                    "已產生 pack score / signal baseline，可供後續 hardening 前後對照。"
                ),
            )
        )

    overall_status = BenchmarkStatus.PASS
    if any(item.status == BenchmarkStatus.FAIL for item in observations):
        overall_status = BenchmarkStatus.FAIL
    elif any(item.status == BenchmarkStatus.WARN for item in observations):
        overall_status = BenchmarkStatus.WARN

    return BenchmarkResultRecord(
        case_id=case.case_id,
        target_domain_pack_ids=case.target_domain_pack_ids,
        target_industry_pack_ids=case.target_industry_pack_ids,
        selected_domain_pack_ids=resolution.selected_domain_pack_ids,
        selected_industry_pack_ids=resolution.selected_industry_pack_ids,
        observed_hint_areas=_unique_hint_areas(observed_hint_areas),
        satisfied_interface_ids=_unique_interfaces(satisfied_interface_ids),
        missing_target_pack_ids=missing_target_pack_ids,
        pack_scores=resolution.pack_scores,
        pack_signal_counts={key: len(value) for key, value in resolution.pack_signals.items()},
        status=overall_status,
        observations=observations,
        notes=case.notes,
    )


def _pack_supports_interface(pack: PackSpec, interface_id: PackContractInterfaceId) -> bool:
    if not pack.contract_baseline:
        return False
    return interface_id in pack.contract_baseline.ready_interface_ids


def _pack_has_hint_area(pack: PackSpec, area: BenchmarkHintArea) -> bool:
    if area == BenchmarkHintArea.EVIDENCE_EXPECTATIONS:
        return len(pack.evidence_expectations) > 0
    if area == BenchmarkHintArea.DECISION_PATTERNS:
        return len(pack.decision_patterns) > 0
    if area == BenchmarkHintArea.DELIVERABLE_PRESETS:
        return len(pack.deliverable_presets) > 0
    if area == BenchmarkHintArea.ROUTING_HINTS:
        return len(pack.routing_hints) > 0
    if area == BenchmarkHintArea.READINESS:
        return bool(pack.contract_baseline and pack.contract_baseline.status.value == "ready")
    return False


def _unique_hint_areas(values: list[BenchmarkHintArea]) -> list[BenchmarkHintArea]:
    ordered: list[BenchmarkHintArea] = []
    seen: set[BenchmarkHintArea] = set()
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        ordered.append(value)
    return ordered


def _unique_interfaces(values: list[PackContractInterfaceId]) -> list[PackContractInterfaceId]:
    ordered: list[PackContractInterfaceId] = []
    seen: set[PackContractInterfaceId] = set()
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        ordered.append(value)
    return ordered
