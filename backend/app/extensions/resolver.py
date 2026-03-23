from __future__ import annotations

from collections.abc import Iterable

from app.domain.enums import CapabilityArchetype
from app.extensions.registry import ExtensionRegistry
from app.extensions.schemas import (
    AgentResolution,
    AgentResolverInput,
    AgentType,
    ExtensionStatus,
    PackResolution,
    PackResolverInput,
    PackType,
)


class PackResolver:
    def __init__(self, registry: ExtensionRegistry):
        self.registry = registry

    def resolve(self, payload: PackResolverInput) -> PackResolution:
        notes: list[str] = []
        conflicts: list[str] = []
        selected_domain: list[str] = []
        selected_industry: list[str] = []
        override_pack_ids: list[str] = []

        explicit_packs = [self.registry.get_pack(pack_id) for pack_id in payload.explicit_pack_ids]
        explicit_packs = [pack for pack in explicit_packs if pack is not None]
        if explicit_packs:
            override_pack_ids = [pack.pack_id for pack in explicit_packs]
            notes.append("Explicit pack overrides were provided.")

        for pack in explicit_packs:
            if pack.pack_type == PackType.DOMAIN:
                selected_domain.append(pack.pack_id)
            else:
                selected_industry.append(pack.pack_id)

        if not selected_domain:
            active_domain_packs = [
                pack
                for pack in self.registry.list_packs(PackType.DOMAIN)
                if pack.status == ExtensionStatus.ACTIVE
            ]
            for requested_lens in [lens.lower() for lens in payload.domain_lenses]:
                for pack in active_domain_packs:
                    if requested_lens in {lens.lower() for lens in pack.domain_lenses}:
                        selected_domain.append(pack.pack_id)
            if selected_domain:
                notes.append("Selected domain packs from domain lenses.")

        if not selected_industry:
            hint_tokens = _normalize_tokens(payload.industry_hints)
            hint_tokens.update(_normalize_tokens([payload.decision_context_summary or ""]))
            for pack in self.registry.list_packs(PackType.INDUSTRY):
                if pack.status != ExtensionStatus.ACTIVE:
                    continue
                if hint_tokens.intersection({hint.lower() for hint in pack.routing_hints}):
                    selected_industry.append(pack.pack_id)
            if selected_industry:
                notes.append("Selected industry packs from industry hints.")

        stack_order = selected_domain + selected_industry
        if selected_domain and selected_industry:
            notes.append("Pack stack order applies domain packs before industry packs.")
        elif not stack_order:
            notes.append("No active packs were resolved from the current payload.")

        if len(set(stack_order)) != len(stack_order):
            conflicts.append("Duplicate pack selection detected in stack order.")

        return PackResolution(
            selected_domain_pack_ids=list(dict.fromkeys(selected_domain)),
            selected_industry_pack_ids=list(dict.fromkeys(selected_industry)),
            override_pack_ids=list(dict.fromkeys(override_pack_ids)),
            conflicts=conflicts,
            stack_order=list(dict.fromkeys(stack_order)),
            resolver_notes=notes,
        )


class AgentResolver:
    def __init__(self, registry: ExtensionRegistry):
        self.registry = registry

    def resolve(self, payload: AgentResolverInput) -> AgentResolution:
        reasoning_agent_ids = list(
            dict.fromkeys(_base_reasoning_agents_for_capability(payload.capability))
        )
        specialist_agent_ids: list[str] = []
        resolver_notes = [
            f"Resolved base reasoning set from capability={payload.capability.value}."
        ]
        override_agent_ids: list[str] = []

        for pack_id in payload.selected_domain_pack_ids:
            reasoning_agent_ids.extend(_reasoning_agents_for_domain_pack(pack_id))
            if payload.allow_specialists:
                specialist_agent_ids.extend(_specialists_for_domain_pack(pack_id, payload.capability))

        for pack_id in payload.selected_industry_pack_ids:
            reasoning_agent_ids.extend(_reasoning_agents_for_industry_pack(pack_id))

        if payload.explicit_agent_ids:
            override_agent_ids = list(dict.fromkeys(payload.explicit_agent_ids))
            resolver_notes.append("Explicit agent overrides were provided.")
            for agent_id in override_agent_ids:
                agent = self.registry.get_agent(agent_id)
                if agent is None or agent.status != ExtensionStatus.ACTIVE:
                    continue
                if agent.agent_type == AgentType.REASONING:
                    reasoning_agent_ids.append(agent_id)
                elif agent.agent_type == AgentType.SPECIALIST and payload.allow_specialists:
                    specialist_agent_ids.append(agent_id)

        reasoning_agent_ids = _filter_active_agents(self.registry, reasoning_agent_ids, AgentType.REASONING)
        specialist_agent_ids = _filter_active_agents(self.registry, specialist_agent_ids, AgentType.SPECIALIST)

        return AgentResolution(
            host_agent_id=self.registry.get_host_agent().agent_id,
            reasoning_agent_ids=reasoning_agent_ids,
            specialist_agent_ids=specialist_agent_ids,
            override_agent_ids=override_agent_ids,
            resolver_notes=resolver_notes,
        )


def _normalize_tokens(values: Iterable[str]) -> set[str]:
    tokens: set[str] = set()
    for value in values:
        for token in value.lower().replace("/", " ").replace("-", " ").split():
            if token:
                tokens.add(token)
    return tokens


def _base_reasoning_agents_for_capability(capability: CapabilityArchetype) -> list[str]:
    mapping = {
        CapabilityArchetype.DIAGNOSE_ASSESS: ["strategy_decision_agent", "operations_agent"],
        CapabilityArchetype.DECIDE_CONVERGE: ["strategy_decision_agent", "operations_agent"],
        CapabilityArchetype.REVIEW_CHALLENGE: ["legal_risk_agent", "strategy_decision_agent"],
        CapabilityArchetype.SYNTHESIZE_BRIEF: ["research_intelligence_agent", "document_communication_agent"],
        CapabilityArchetype.RESTRUCTURE_REFRAME: ["document_communication_agent"],
        CapabilityArchetype.PLAN_ROADMAP: ["strategy_decision_agent", "operations_agent"],
        CapabilityArchetype.SCENARIO_COMPARISON: ["strategy_decision_agent", "research_intelligence_agent"],
        CapabilityArchetype.RISK_SURFACING: ["legal_risk_agent", "strategy_decision_agent"],
    }
    return mapping.get(capability, ["strategy_decision_agent"])


def _reasoning_agents_for_domain_pack(pack_id: str) -> list[str]:
    mapping = {
        "operations_pack": ["operations_agent"],
        "finance_fundraising_pack": ["finance_agent"],
        "legal_risk_pack": ["legal_risk_agent"],
        "marketing_sales_pack": ["marketing_growth_agent", "sales_business_development_agent"],
        "business_development_pack": ["sales_business_development_agent"],
        "research_intelligence_pack": ["research_intelligence_agent"],
    }
    return mapping.get(pack_id, [])


def _specialists_for_domain_pack(pack_id: str, capability: CapabilityArchetype) -> list[str]:
    if capability == CapabilityArchetype.REVIEW_CHALLENGE and pack_id == "legal_risk_pack":
        return ["contract_review_specialist"]
    if capability == CapabilityArchetype.SYNTHESIZE_BRIEF and pack_id == "research_intelligence_pack":
        return ["research_synthesis_specialist"]
    if capability == CapabilityArchetype.RESTRUCTURE_REFRAME:
        return ["document_restructuring_specialist"]
    return []


def _reasoning_agents_for_industry_pack(pack_id: str) -> list[str]:
    mapping = {
        "energy_pack": ["operations_agent", "finance_agent", "legal_risk_agent"],
        "saas_pack": ["marketing_growth_agent", "sales_business_development_agent", "finance_agent"],
        "media_creator_pack": ["marketing_growth_agent", "document_communication_agent"],
        "professional_services_pack": ["operations_agent", "sales_business_development_agent"],
    }
    return mapping.get(pack_id, [])


def _filter_active_agents(
    registry: ExtensionRegistry,
    candidate_ids: list[str],
    expected_type: AgentType,
) -> list[str]:
    active_ids: list[str] = []
    for agent_id in dict.fromkeys(candidate_ids):
        agent = registry.get_agent(agent_id)
        if agent is None:
            continue
        if agent.status != ExtensionStatus.ACTIVE:
            continue
        if agent.agent_type != expected_type:
            continue
        active_ids.append(agent_id)
    return active_ids
