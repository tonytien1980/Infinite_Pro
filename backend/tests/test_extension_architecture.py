from __future__ import annotations

from app.domain.enums import CapabilityArchetype
from app.extensions.registry import ExtensionRegistry
from app.extensions.resolver import AgentResolver, PackResolver
from app.extensions.schemas import AgentResolverInput, AgentType, PackResolverInput, PackType


def test_extension_registry_contains_first_batch_packs_and_agents() -> None:
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
    }
    assert {pack.pack_id for pack in industry_packs} >= {
        "energy_pack",
        "saas_pack",
        "media_creator_pack",
        "professional_services_pack",
    }
    assert host_agent.agent_type == AgentType.HOST


def test_pack_resolver_selects_domain_and_industry_packs() -> None:
    registry = ExtensionRegistry()
    resolver = PackResolver(registry)

    resolution = resolver.resolve(
        PackResolverInput(
            domain_lenses=["operations", "finance"],
            decision_context_summary="Need a SaaS operating model recommendation.",
        )
    )

    assert "operations_pack" in resolution.selected_domain_pack_ids
    assert "finance_fundraising_pack" in resolution.selected_domain_pack_ids
    assert "saas_pack" in resolution.selected_industry_pack_ids
    assert resolution.stack_order[:2] == [
        "operations_pack",
        "finance_fundraising_pack",
    ]


def test_agent_resolver_maps_capability_and_packs() -> None:
    registry = ExtensionRegistry()
    resolver = AgentResolver(registry)

    resolution = resolver.resolve(
        AgentResolverInput(
            capability=CapabilityArchetype.DECIDE_CONVERGE,
            selected_domain_pack_ids=["operations_pack", "finance_fundraising_pack"],
            selected_industry_pack_ids=["saas_pack"],
        )
    )

    assert resolution.host_agent_id == "host_agent"
    assert "strategy_decision_agent" in resolution.reasoning_agent_ids
    assert "operations_agent" in resolution.reasoning_agent_ids
    assert "finance_agent" in resolution.reasoning_agent_ids
    assert "marketing_growth_agent" in resolution.reasoning_agent_ids


def test_extension_manager_snapshot_surfaces_pack_and_agent_catalogs() -> None:
    registry = ExtensionRegistry()

    snapshot = registry.manager_snapshot()

    assert snapshot.pack_registry.active_pack_ids
    assert snapshot.agent_registry.host_agent_id == "host_agent"
    assert "host_agent" in snapshot.agent_registry.active_agent_ids
