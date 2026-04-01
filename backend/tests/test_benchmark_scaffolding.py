from __future__ import annotations

from app.benchmarks.runner import (
    DEFAULT_P0_INDUSTRY_BATCH1_MANIFEST,
    load_manifest,
    run_manifest,
)
from app.benchmarks.schemas import BenchmarkHintArea, BenchmarkStatus


def test_p0_industry_batch1_manifest_covers_expected_seed_cases() -> None:
    manifest = load_manifest(DEFAULT_P0_INDUSTRY_BATCH1_MANIFEST)

    assert manifest.manifest_id == "p0_industry_batch1_baseline"
    assert len(manifest.cases) == 6
    assert {case.target_industry_pack_ids[0] for case in manifest.cases} == {
        "saas_pack",
        "ecommerce_pack",
        "media_creator_pack",
        "professional_services_pack",
        "online_education_pack",
        "gaming_pack",
    }
    for case in manifest.cases:
        assert case.expected_contract_interface_ids
        assert BenchmarkHintArea.READINESS in case.expected_hint_areas
        assert case.source_mix_summary


def test_p0_industry_batch1_runner_executes_against_current_pack_stack() -> None:
    manifest = load_manifest(DEFAULT_P0_INDUSTRY_BATCH1_MANIFEST)
    results = run_manifest(manifest)

    assert len(results) == 6
    assert all(result.status == BenchmarkStatus.PASS for result in results)
    assert all(not result.missing_target_pack_ids for result in results)
    assert all(result.pack_scores for result in results)
    assert all(result.pack_signal_counts for result in results)
    assert all(result.satisfied_interface_ids for result in results)
    assert all(result.observed_hint_areas for result in results)
    assert all(result.selected_industry_pack_ids == result.target_industry_pack_ids for result in results)
