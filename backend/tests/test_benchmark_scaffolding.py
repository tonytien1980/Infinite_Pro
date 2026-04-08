from __future__ import annotations

import importlib.util
from pathlib import Path

from app.benchmarks.runner import (
    DEFAULT_P0_DELIVERABLE_HARDENING_MANIFEST,
    DEFAULT_P0_DOMAIN_PACK_CONTRACTS_MANIFEST,
    DEFAULT_P0_FULL_REGRESSION_SUITE_MANIFEST,
    DEFAULT_P0_INGESTION_HARDENING_MANIFEST,
    DEFAULT_P0_INDUSTRY_BATCH1_MANIFEST,
    DEFAULT_P0_INDUSTRY_BATCH2_MANIFEST,
    DEFAULT_P0_LEGAL_FINANCE_CONTRACT_MANIFEST,
    DEFAULT_P0_OPERATIONS_PROCESS_MANIFEST,
    load_manifest,
    load_suite,
    run_manifest,
    run_suite,
)
from app.benchmarks.schemas import BenchmarkCategoryId, BenchmarkHintArea, BenchmarkStatus, RegressionGateMode

BENCHMARK_SCRIPT_PATH = (
    Path(__file__).resolve().parents[1] / "scripts" / "run_pack_benchmark_scaffold.py"
)
BENCHMARK_SCRIPT_SPEC = importlib.util.spec_from_file_location(
    "run_pack_benchmark_scaffold_module",
    BENCHMARK_SCRIPT_PATH,
)
assert BENCHMARK_SCRIPT_SPEC is not None and BENCHMARK_SCRIPT_SPEC.loader is not None
benchmark_script = importlib.util.module_from_spec(BENCHMARK_SCRIPT_SPEC)
BENCHMARK_SCRIPT_SPEC.loader.exec_module(benchmark_script)


def test_p0_a_domain_pack_manifest_covers_expected_seed_cases() -> None:
    manifest = load_manifest(DEFAULT_P0_DOMAIN_PACK_CONTRACTS_MANIFEST)

    assert manifest.manifest_id == "p0_a_domain_pack_contracts_baseline"
    assert len(manifest.cases) == 8
    assert {case.target_domain_pack_ids[0] for case in manifest.cases} == {
        "operations_pack",
        "finance_fundraising_pack",
        "legal_risk_pack",
        "marketing_sales_pack",
        "business_development_pack",
        "research_intelligence_pack",
        "organization_people_pack",
        "product_service_pack",
    }
    for case in manifest.cases:
        assert case.expected_contract_interface_ids
        assert BenchmarkHintArea.READINESS in case.expected_hint_areas
        assert case.source_mix_summary


def test_p0_a_domain_pack_runner_executes_against_current_pack_stack() -> None:
    manifest = load_manifest(DEFAULT_P0_DOMAIN_PACK_CONTRACTS_MANIFEST)
    results = run_manifest(manifest, category_id=BenchmarkCategoryId.DOMAIN_PACK_CONTRACTS)

    assert len(results) == 8
    assert all(result.status == BenchmarkStatus.PASS for result in results)
    assert all(not result.missing_target_pack_ids for result in results)
    assert all(result.pack_scores for result in results)
    assert all(result.pack_signal_counts for result in results)
    assert all(result.satisfied_interface_ids for result in results)
    assert all(result.observed_hint_areas for result in results)
    assert all(result.category_id == BenchmarkCategoryId.DOMAIN_PACK_CONTRACTS for result in results)


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


def test_p0_h_full_regression_suite_manifest_covers_expected_categories() -> None:
    suite = load_suite(DEFAULT_P0_FULL_REGRESSION_SUITE_MANIFEST)

    assert suite.suite_id == "p0_full_regression_suite"
    assert [category.category_id for category in suite.categories] == [
        BenchmarkCategoryId.DOMAIN_PACK_CONTRACTS,
        BenchmarkCategoryId.INDUSTRY_BATCH1,
        BenchmarkCategoryId.INDUSTRY_BATCH2,
        BenchmarkCategoryId.LEGAL_FINANCE_CONTRACT,
        BenchmarkCategoryId.OPERATIONS_PROCESS,
        BenchmarkCategoryId.DELIVERABLE_HARDENING,
        BenchmarkCategoryId.INGESTION_HARDENING,
    ]
    gate_modes = {category.category_id: category.gate_mode for category in suite.categories}
    assert gate_modes[BenchmarkCategoryId.DOMAIN_PACK_CONTRACTS] == RegressionGateMode.REQUIRED
    assert gate_modes[BenchmarkCategoryId.DELIVERABLE_HARDENING] == RegressionGateMode.ADVISORY
    assert gate_modes[BenchmarkCategoryId.INGESTION_HARDENING] == RegressionGateMode.REQUIRED


def test_p0_h_full_regression_suite_executes_against_current_stack() -> None:
    suite = load_suite(DEFAULT_P0_FULL_REGRESSION_SUITE_MANIFEST)
    result = run_suite(suite)

    assert result.gate_status == BenchmarkStatus.PASS
    assert result.total_case_count == 27
    assert len(result.category_results) == 7
    assert not result.failing_categories
    category_ids = [category.category_id for category in result.category_results]
    assert category_ids == [
        BenchmarkCategoryId.DOMAIN_PACK_CONTRACTS,
        BenchmarkCategoryId.INDUSTRY_BATCH1,
        BenchmarkCategoryId.INDUSTRY_BATCH2,
        BenchmarkCategoryId.LEGAL_FINANCE_CONTRACT,
        BenchmarkCategoryId.OPERATIONS_PROCESS,
        BenchmarkCategoryId.DELIVERABLE_HARDENING,
        BenchmarkCategoryId.INGESTION_HARDENING,
    ]
    deliverable_gate = next(
        item for item in result.category_results if item.category_id == BenchmarkCategoryId.DELIVERABLE_HARDENING
    )
    assert deliverable_gate.gate_mode == RegressionGateMode.ADVISORY
    assert deliverable_gate.gate_status == BenchmarkStatus.PASS


def test_generalist_stage_type_manifest_covers_representative_seed_cases() -> None:
    manifest = load_manifest("backend/app/benchmarks/manifests/g1_stage_type_coverage.json")

    assert manifest.manifest_id == "g1_stage_type_coverage_baseline"
    assert len(manifest.cases) >= 4
    assert {"創業階段", "制度化階段", "規模化階段"} <= {case.client_stage for case in manifest.cases}
    assert {"中小企業", "大型企業", "個人品牌與服務", "自媒體"} <= {
        case.client_type for case in manifest.cases
    }


def test_generalist_continuity_manifest_covers_expected_lanes() -> None:
    manifest = load_manifest("backend/app/benchmarks/manifests/g1_continuity_coverage.json")

    assert manifest.manifest_id == "g1_continuity_coverage_baseline"
    assert {case.engagement_continuity_mode for case in manifest.cases} == {
        "one_off",
        "follow_up",
        "continuous",
    }


def test_generalist_cross_domain_manifest_covers_expected_bundles() -> None:
    manifest = load_manifest("backend/app/benchmarks/manifests/g1_cross_domain_coverage.json")

    assert manifest.manifest_id == "g1_cross_domain_coverage_baseline"
    assert {case.coverage_bundle_id for case in manifest.cases} == {
        "legal_plus_finance",
        "operations_plus_org_people",
        "marketing_sales_plus_product_service",
        "research_plus_domain_advisory",
    }


def test_generalist_coverage_suite_manifest_covers_expected_categories() -> None:
    suite = load_suite("backend/app/benchmarks/suites/generalist_coverage_proof_v1.json")

    assert suite.suite_id == "generalist_coverage_proof_v1"
    assert [category.category_id for category in suite.categories] == [
        BenchmarkCategoryId.GENERALIST_STAGE_TYPE,
        BenchmarkCategoryId.GENERALIST_CONTINUITY,
        BenchmarkCategoryId.GENERALIST_CROSS_DOMAIN,
    ]
    assert {target.axis for target in suite.coverage_targets} == {
        "client_stage",
        "client_type",
        "continuity",
        "cross_domain",
    }
    assert all(category.gate_mode == RegressionGateMode.ADVISORY for category in suite.categories)


def test_generalist_coverage_suite_returns_coverage_summary() -> None:
    suite = load_suite("backend/app/benchmarks/suites/generalist_coverage_proof_v1.json")
    result = run_suite(suite)

    assert result.gate_status == BenchmarkStatus.PASS
    assert result.total_case_count == 12
    assert len(result.category_results) == 3
    assert result.coverage_summary
    stage_summary = next(item for item in result.coverage_summary if item.axis == "client_stage")
    continuity_summary = next(item for item in result.coverage_summary if item.axis == "continuity")
    cross_domain_summary = next(item for item in result.coverage_summary if item.axis == "cross_domain")

    assert "創業階段" in stage_summary.expected_values
    assert "one_off" in continuity_summary.expected_values
    assert "research_plus_domain_advisory" in cross_domain_summary.expected_values
    assert not stage_summary.missing_values
    assert not continuity_summary.missing_values
    assert not cross_domain_summary.missing_values


def test_benchmark_script_prefers_standard_dot_venv_before_workstation_specific_name(
    tmp_path: Path,
    monkeypatch,
) -> None:
    backend_root = tmp_path / "backend"
    backend_root.mkdir()
    standard_python = tmp_path / ".venv" / "bin" / "python"
    standard_python.parent.mkdir(parents=True)
    standard_python.touch()
    legacy_python = tmp_path / ".venv312" / "bin" / "python"
    legacy_python.parent.mkdir(parents=True)
    legacy_python.touch()

    monkeypatch.setattr(benchmark_script, "BACKEND_ROOT", backend_root)
    monkeypatch.delenv("VIRTUAL_ENV", raising=False)

    fallback_python = benchmark_script._find_fallback_python(
        tmp_path / "system-python",
    )

    assert fallback_python == standard_python
