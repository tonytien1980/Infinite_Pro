from __future__ import annotations

from app.domain.enums import CapabilityArchetype, DeliverableClass, InputEntryMode
from app.extensions.registry import ExtensionRegistry
from app.extensions.resolver import (
    INDUSTRY_CONTEXT_SELECTION_THRESHOLD,
    AgentResolver,
    PackResolver,
    resolve_runtime_agent_binding,
)
from app.extensions.schemas import AgentResolverInput, AgentType, PackResolverInput, PackType


def test_extension_registry_contains_completed_pack_baseline_and_agents() -> None:
    registry = ExtensionRegistry()

    domain_packs = registry.list_packs(PackType.DOMAIN)
    industry_packs = registry.list_packs(PackType.INDUSTRY)
    agents = registry.list_agents()
    host_agent = registry.get_host_agent()

    assert {pack.pack_id for pack in domain_packs} >= {
        "operations_pack",
        "finance_fundraising_pack",
        "legal_risk_pack",
        "marketing_sales_pack",
        "business_development_pack",
        "research_intelligence_pack",
        "organization_people_pack",
        "product_service_pack",
    }
    assert {pack.pack_id for pack in industry_packs} >= {
        "online_education_pack",
        "ecommerce_pack",
        "gaming_pack",
        "funeral_services_pack",
        "health_supplements_pack",
        "energy_pack",
        "saas_pack",
        "media_creator_pack",
        "professional_services_pack",
        "manufacturing_pack",
        "healthcare_clinic_pack",
    }
    assert host_agent.agent_type == AgentType.HOST
    operations_pack = next(pack for pack in domain_packs if pack.pack_id == "operations_pack")
    assert operations_pack.domain_definition
    assert operations_pack.common_problem_patterns
    assert operations_pack.key_kpis_or_operating_signals
    assert operations_pack.scope_boundaries
    assert operations_pack.pack_rationale
    ecommerce_pack = next(pack for pack in industry_packs if pack.pack_id == "ecommerce_pack")
    assert ecommerce_pack.industry_definition
    assert ecommerce_pack.key_kpis
    assert ecommerce_pack.common_business_models
    organization_pack = next(pack for pack in domain_packs if pack.pack_id == "organization_people_pack")
    assert organization_pack.pack_rationale
    product_pack = next(pack for pack in domain_packs if pack.pack_id == "product_service_pack")
    assert product_pack.scope_boundaries
    saas_pack = next(pack for pack in industry_packs if pack.pack_id == "saas_pack")
    assert saas_pack.pack_rationale
    clinic_pack = next(pack for pack in industry_packs if pack.pack_id == "healthcare_clinic_pack")
    assert clinic_pack.evidence_expectations
    saas_pack = next(pack for pack in industry_packs if pack.pack_id == "saas_pack")
    assert saas_pack.common_business_models
    assert saas_pack.contract_baseline is not None
    assert saas_pack.contract_baseline.status.value == "ready"
    assert "common_business_models" not in {
        item.value for item in saas_pack.contract_baseline.missing_required_property_ids
    }

    for pack in [*domain_packs, *industry_packs]:
        assert pack.common_problem_patterns
        assert pack.evidence_expectations
        assert pack.decision_patterns
        assert pack.deliverable_presets
        assert pack.pack_rationale
        assert pack.key_kpis_or_operating_signals, f"{pack.pack_id} should expose KPI / signal guidance"
        assert pack.key_kpis, f"{pack.pack_id} should expose KPI guidance"

    assert len(agents) == 12
    research_agent = next(agent for agent in agents if agent.agent_id == "research_intelligence_agent")
    assert research_agent.agent_name == "Research / Investigation Agent"

    for agent in agents:
        assert agent.primary_responsibilities, f"{agent.agent_id} should expose formal responsibilities"
        assert agent.out_of_scope, f"{agent.agent_id} should expose out-of-scope boundaries"
        assert agent.defer_rules, f"{agent.agent_id} should expose defer rules"
        assert agent.preferred_execution_modes, f"{agent.agent_id} should expose preferred execution modes"
        assert agent.input_requirements, f"{agent.agent_id} should expose input requirements"
        assert agent.minimum_evidence_readiness, f"{agent.agent_id} should expose evidence readiness"
        assert agent.required_context_fields, f"{agent.agent_id} should expose required context fields"
        assert agent.output_contract, f"{agent.agent_id} should expose output contract"
        assert agent.produced_objects, f"{agent.agent_id} should expose produced objects"
        assert agent.deliverable_impact, f"{agent.agent_id} should expose deliverable impact"
        assert agent.writeback_expectations, f"{agent.agent_id} should expose writeback expectations"
        assert agent.handoff_targets, f"{agent.agent_id} should expose handoff targets"
        assert agent.evaluation_focus, f"{agent.agent_id} should expose evaluation focus"
        assert agent.failure_modes_to_watch, f"{agent.agent_id} should expose failure modes"
        assert agent.trace_requirements, f"{agent.agent_id} should expose trace requirements"


def test_pack_resolver_selects_domain_and_industry_packs() -> None:
    registry = ExtensionRegistry()
    resolver = PackResolver(registry)

    resolution = resolver.resolve(
        PackResolverInput(
            domain_lenses=["operations", "finance"],
            decision_context_summary="Need an ecommerce operating model recommendation for SKU margin and channel mix.",
        )
    )

    assert "operations_pack" in resolution.selected_domain_pack_ids
    assert "finance_fundraising_pack" in resolution.selected_domain_pack_ids
    assert "ecommerce_pack" in resolution.selected_industry_pack_ids
    assert set(resolution.stack_order[:2]) == {
        "operations_pack",
        "finance_fundraising_pack",
    }
    assert resolution.resolver_notes
    assert resolution.pack_scores["operations_pack"] > 0
    assert resolution.pack_signals["operations_pack"]
    assert resolution.pack_scores["ecommerce_pack"] > 0
    assert resolution.pack_signals["ecommerce_pack"]


def test_pack_resolver_selects_second_wave_domain_and_industry_packs() -> None:
    registry = ExtensionRegistry()
    resolver = PackResolver(registry)

    resolution = resolver.resolve(
        PackResolverInput(
            domain_lenses=["組織人力", "產品服務"],
            client_type="中小企業",
            client_stage="制度化階段",
            decision_context_summary="Need a SaaS offer architecture and organization redesign recommendation for onboarding, pricing, and churn.",
        )
    )

    assert "organization_people_pack" in resolution.selected_domain_pack_ids
    assert "product_service_pack" in resolution.selected_domain_pack_ids
    assert resolution.selected_industry_pack_ids == ["saas_pack"]
    assert resolution.resolver_notes


def test_pack_resolver_keeps_gaming_case_from_pulling_in_soft_saas_false_positive() -> None:
    registry = ExtensionRegistry()
    resolver = PackResolver(registry)

    resolution = resolver.resolve(
        PackResolverInput(
            domain_lenses=["行銷", "營運", "研究"],
            client_type="中小企業",
            client_stage="規模化階段",
            industry_hints=["gaming", "live ops", "payer", "wishlist"],
            decision_context_summary=(
                "Need a gaming portfolio review on retention, payer conversion, live-ops cadence, "
                "and whether to delay bigger user acquisition until economics stabilize."
            ),
        )
    )

    assert resolution.selected_industry_pack_ids == ["gaming_pack"]
    assert resolution.pack_scores["gaming_pack"] >= INDUSTRY_CONTEXT_SELECTION_THRESHOLD
    assert resolution.pack_signals["gaming_pack"]


def test_agent_resolver_maps_capability_and_packs() -> None:
    registry = ExtensionRegistry()
    resolver = AgentResolver(registry)

    resolution = resolver.resolve(
        AgentResolverInput(
            capability=CapabilityArchetype.DECIDE_CONVERGE,
            selected_domain_pack_ids=["operations_pack", "finance_fundraising_pack"],
            selected_industry_pack_ids=["ecommerce_pack"],
            input_entry_mode=InputEntryMode.MULTI_MATERIAL_CASE,
            deliverable_class=DeliverableClass.DECISION_ACTION_DELIVERABLE,
            decision_context_clear=True,
            evidence_count=3,
            artifact_count=2,
        )
    )

    assert resolution.host_agent_id == "host_agent"
    assert "strategy_decision_agent" in resolution.reasoning_agent_ids
    assert "operations_agent" in resolution.reasoning_agent_ids
    assert "finance_agent" in resolution.reasoning_agent_ids
    assert "marketing_growth_agent" in resolution.reasoning_agent_ids
    assert resolution.agent_scores["strategy_decision_agent"] > 0
    assert resolution.agent_signals["strategy_decision_agent"]
    assert resolution.agent_scores["finance_agent"] > 0
    assert resolution.agent_signals["finance_agent"]


def test_research_heavy_agent_resolution_elevates_research_score() -> None:
    registry = ExtensionRegistry()
    resolver = AgentResolver(registry)

    resolution = resolver.resolve(
        AgentResolverInput(
            capability=CapabilityArchetype.SYNTHESIZE_BRIEF,
            selected_domain_pack_ids=["research_intelligence_pack"],
            selected_industry_pack_ids=["ecommerce_pack"],
            input_entry_mode=InputEntryMode.ONE_LINE_INQUIRY,
            deliverable_class=DeliverableClass.EXPLORATORY_BRIEF,
            decision_context_clear=False,
            evidence_count=0,
            artifact_count=1,
            external_research_heavy_case=True,
            allow_specialists=True,
        )
    )

    assert resolution.reasoning_agent_ids[0] == "research_intelligence_agent"
    assert resolution.agent_scores["research_intelligence_agent"] >= resolution.agent_scores.get(
        "document_communication_agent", 0
    )
    assert resolution.agent_signals["research_intelligence_agent"]


def test_agent_resolver_honors_sparse_readiness_when_specialists_are_not_ready() -> None:
    registry = ExtensionRegistry()
    resolver = AgentResolver(registry)

    resolution = resolver.resolve(
        AgentResolverInput(
            capability=CapabilityArchetype.REVIEW_CHALLENGE,
            selected_domain_pack_ids=["legal_risk_pack"],
            artifact_count=0,
            evidence_count=0,
            allow_specialists=True,
        )
    )

    assert "contract_review_specialist" not in resolution.specialist_agent_ids
    assert resolution.deferred_agent_notes
    assert resolution.escalation_notes


def test_extension_manager_snapshot_surfaces_pack_and_agent_catalogs() -> None:
    registry = ExtensionRegistry()

    snapshot = registry.manager_snapshot()

    assert snapshot.pack_registry.active_pack_ids
    assert snapshot.agent_registry.host_agent_id == "host_agent"
    assert "host_agent" in snapshot.agent_registry.active_agent_ids


def test_runtime_agent_bindings_promote_distinct_research_finance_and_document_paths() -> None:
    assert resolve_runtime_agent_binding("finance_agent") == "finance_capital"
    assert resolve_runtime_agent_binding("legal_risk_agent") == "legal_risk"
    assert resolve_runtime_agent_binding("marketing_growth_agent") == "marketing_growth"
    assert (
        resolve_runtime_agent_binding("sales_business_development_agent")
        == "sales_business_development"
    )
    assert resolve_runtime_agent_binding("research_intelligence_agent") == "research_intelligence"
    assert resolve_runtime_agent_binding("document_communication_agent") == "document_communication"
