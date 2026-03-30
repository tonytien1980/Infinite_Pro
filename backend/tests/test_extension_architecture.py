from __future__ import annotations

from app.domain.enums import CapabilityArchetype, DeliverableClass, InputEntryMode
from app.extensions.registry import ExtensionRegistry
from app.extensions.resolver import AgentResolver, PackResolver, resolve_runtime_agent_binding
from app.extensions.schemas import AgentResolverInput, AgentType, PackResolverInput, PackType


def test_extension_registry_contains_completed_pack_baseline_and_agents() -> None:
    registry = ExtensionRegistry()

    domain_packs = registry.list_packs(PackType.DOMAIN)
    industry_packs = registry.list_packs(PackType.INDUSTRY)
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
    assert resolution.stack_order[:2] == [
        "operations_pack",
        "finance_fundraising_pack",
    ]
    assert resolution.resolver_notes


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
