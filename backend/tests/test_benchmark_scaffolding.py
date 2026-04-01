from __future__ import annotations

from app.benchmarks.runner import (
    DEFAULT_P0_DELIVERABLE_HARDENING_MANIFEST,
    DEFAULT_P0_INGESTION_HARDENING_MANIFEST,
    DEFAULT_P0_INDUSTRY_BATCH1_MANIFEST,
    DEFAULT_P0_INDUSTRY_BATCH2_MANIFEST,
    DEFAULT_P0_LEGAL_FINANCE_CONTRACT_MANIFEST,
    DEFAULT_P0_OPERATIONS_PROCESS_MANIFEST,
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


def test_p0_industry_batch2_manifest_covers_expected_seed_cases() -> None:
    manifest = load_manifest(DEFAULT_P0_INDUSTRY_BATCH2_MANIFEST)

    assert manifest.manifest_id == "p0_industry_batch2_baseline"
    assert len(manifest.cases) == 5
    assert {case.target_industry_pack_ids[0] for case in manifest.cases} == {
        "manufacturing_pack",
        "healthcare_clinic_pack",
        "energy_pack",
        "health_supplements_pack",
        "funeral_services_pack",
    }
    for case in manifest.cases:
        assert case.expected_contract_interface_ids
        assert BenchmarkHintArea.READINESS in case.expected_hint_areas
        assert case.source_mix_summary


def test_p0_industry_batch2_runner_executes_against_current_pack_stack() -> None:
    manifest = load_manifest(DEFAULT_P0_INDUSTRY_BATCH2_MANIFEST)
    results = run_manifest(manifest)

    assert len(results) == 5
    assert all(result.status == BenchmarkStatus.PASS for result in results)
    assert all(not result.missing_target_pack_ids for result in results)
    assert all(result.pack_scores for result in results)
    assert all(result.pack_signal_counts for result in results)
    assert all(result.satisfied_interface_ids for result in results)
    assert all(result.observed_hint_areas for result in results)
    assert all(result.selected_industry_pack_ids == result.target_industry_pack_ids for result in results)


def test_p0_d_legal_finance_manifest_covers_expected_seed_cases() -> None:
    manifest = load_manifest(DEFAULT_P0_LEGAL_FINANCE_CONTRACT_MANIFEST)

    assert manifest.manifest_id == "p0_d_legal_finance_contract_baseline"
    assert len(manifest.cases) == 2
    for case in manifest.cases:
        assert {"legal_risk_pack", "finance_fundraising_pack"} <= set(case.target_domain_pack_ids)
        assert case.expected_contract_interface_ids
        assert BenchmarkHintArea.READINESS in case.expected_hint_areas
        assert case.source_mix_summary


def test_p0_d_legal_finance_runner_executes_against_current_pack_stack() -> None:
    manifest = load_manifest(DEFAULT_P0_LEGAL_FINANCE_CONTRACT_MANIFEST)
    results = run_manifest(manifest)

    assert len(results) == 2
    assert all(result.status == BenchmarkStatus.PASS for result in results)
    assert all(not result.missing_target_pack_ids for result in results)
    assert all(result.pack_scores for result in results)
    assert all(result.pack_signal_counts for result in results)
    assert all(result.satisfied_interface_ids for result in results)
    assert all(result.observed_hint_areas for result in results)
    for result in results:
        assert {"legal_risk_pack", "finance_fundraising_pack"} <= set(result.selected_domain_pack_ids)


def test_p0_e_operations_process_manifest_covers_expected_seed_cases() -> None:
    manifest = load_manifest(DEFAULT_P0_OPERATIONS_PROCESS_MANIFEST)

    assert manifest.manifest_id == "p0_e_operations_process_baseline"
    assert len(manifest.cases) == 2
    for case in manifest.cases:
        assert "operations_pack" in case.target_domain_pack_ids
        assert case.expected_contract_interface_ids
        assert BenchmarkHintArea.READINESS in case.expected_hint_areas
        assert case.source_mix_summary


def test_p0_e_operations_process_runner_executes_against_current_pack_stack() -> None:
    manifest = load_manifest(DEFAULT_P0_OPERATIONS_PROCESS_MANIFEST)
    results = run_manifest(manifest)

    assert len(results) == 2
    assert all(result.status == BenchmarkStatus.PASS for result in results)
    assert all(not result.missing_target_pack_ids for result in results)
    assert all(result.pack_scores for result in results)
    assert all(result.pack_signal_counts for result in results)
    assert all(result.satisfied_interface_ids for result in results)
    assert all(result.observed_hint_areas for result in results)
    for result in results:
        assert "operations_pack" in result.selected_domain_pack_ids


def test_p0_f_deliverable_hardening_manifest_covers_expected_seed_cases() -> None:
    manifest = load_manifest(DEFAULT_P0_DELIVERABLE_HARDENING_MANIFEST)

    assert manifest.manifest_id == "p0_f_deliverable_hardening_baseline"
    assert len(manifest.cases) == 2
    for case in manifest.cases:
        assert case.expected_deliverable_markers
        assert case.expected_contract_interface_ids
        assert BenchmarkHintArea.READINESS in case.expected_hint_areas


def test_p0_f_deliverable_hardening_runner_executes_against_current_stack() -> None:
    manifest = load_manifest(DEFAULT_P0_DELIVERABLE_HARDENING_MANIFEST)
    results = run_manifest(manifest)

    assert len(results) == 2
    assert all(result.status == BenchmarkStatus.PASS for result in results)
    assert all(not result.missing_target_pack_ids for result in results)
    assert all(result.pack_scores for result in results)
    assert all(result.satisfied_interface_ids for result in results)
    assert all(result.observed_deliverable_markers for result in results)


def test_p0_g_ingestion_hardening_manifest_covers_expected_seed_cases() -> None:
    manifest = load_manifest(DEFAULT_P0_INGESTION_HARDENING_MANIFEST)

    assert manifest.manifest_id == "p0_g_ingestion_hardening_baseline"
    assert len(manifest.cases) == 2
    assert all(case.expected_ingestion_markers for case in manifest.cases)
    assert all(BenchmarkHintArea.READINESS in case.expected_hint_areas for case in manifest.cases)


def test_p0_g_ingestion_hardening_runner_executes_against_current_stack() -> None:
    manifest = load_manifest(DEFAULT_P0_INGESTION_HARDENING_MANIFEST)
    results = run_manifest(manifest)

    assert len(results) == 2
    assert all(result.status == BenchmarkStatus.PASS for result in results)
    assert all(not result.missing_target_pack_ids for result in results)
    assert all(result.pack_scores for result in results)
    assert all(result.satisfied_interface_ids for result in results)
    assert all(result.observed_ingestion_markers for result in results)
