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

DOMAIN_LENS_ALIASES = {
    "營運": {"operations", "process", "execution", "workflow"},
    "財務": {"finance", "economics", "cash"},
    "募資": {"fundraising", "capital"},
    "法務": {"legal", "risk", "compliance", "contract"},
    "行銷": {"marketing", "growth", "gtm"},
    "銷售": {"sales", "commercial", "pipeline"},
    "商務開發": {"business", "development", "partnership", "channel"},
    "研究": {"research", "intelligence", "signals"},
    "情報": {"research", "intelligence", "signals"},
}

INDUSTRY_TOKEN_ALIASES = {
    "online_education_pack": {
        "online",
        "education",
        "course",
        "courses",
        "cohort",
        "bootcamp",
        "tutoring",
        "edtech",
        "學員",
        "招生",
        "課程",
        "教學",
        "線上教育",
        "線上課程",
    },
    "ecommerce_pack": {
        "ecommerce",
        "commerce",
        "shopify",
        "marketplace",
        "dtc",
        "sku",
        "蝦皮",
        "momo",
        "電商",
        "商品",
        "購物車",
        "履約",
    },
    "gaming_pack": {
        "gaming",
        "game",
        "games",
        "live",
        "ops",
        "steam",
        "retention",
        "玩家",
        "遊戲",
        "課金",
        "發行",
        "wishlist",
    },
    "funeral_services_pack": {
        "funeral",
        "memorial",
        "殯葬",
        "禮儀",
        "喪葬",
        "生前契約",
        "殯儀",
        "塔位",
    },
    "health_supplements_pack": {
        "supplement",
        "supplements",
        "nutraceutical",
        "vitamin",
        "維他命",
        "益生菌",
        "魚油",
        "保健",
        "保健食品",
        "健康食品",
    },
}


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
            requested_lenses = _normalize_domain_lenses(payload.domain_lenses)
            for requested_lens in requested_lenses:
                for pack in active_domain_packs:
                    if requested_lens in _pack_domain_tokens(pack):
                        selected_domain.append(pack.pack_id)
            if selected_domain:
                notes.append("Selected domain packs from domain lenses.")

        if not selected_industry:
            hint_tokens = _normalize_tokens(payload.industry_hints)
            hint_tokens.update(_normalize_tokens([payload.decision_context_summary or ""]))
            hint_tokens.update(_normalize_tokens([payload.client_type or "", payload.client_stage or ""]))
            for pack in self.registry.list_packs(PackType.INDUSTRY):
                if pack.status != ExtensionStatus.ACTIVE:
                    continue
                matched_hints = bool(hint_tokens.intersection(_pack_industry_tokens(pack)))
                matched_client_type = bool(
                    payload.client_type and payload.client_type in pack.relevant_client_types
                )
                matched_client_stage = bool(
                    payload.client_stage and payload.client_stage in pack.relevant_client_stages
                )
                should_select = matched_hints
                if pack.relevant_client_types and pack.relevant_client_stages:
                    should_select = should_select or (matched_client_type and matched_client_stage)
                elif pack.relevant_client_types:
                    should_select = should_select or matched_client_type
                elif pack.relevant_client_stages:
                    should_select = should_select or (matched_client_stage and matched_hints)
                if should_select:
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


def _normalize_domain_lenses(values: Iterable[str]) -> list[str]:
    ordered_tokens: list[str] = []
    seen: set[str] = set()
    raw_values = list(values)
    for value in raw_values:
        normalized_value = value.lower().replace("/", " ").replace("-", " ")
        for token in normalized_value.split():
            if not token or token in seen:
                continue
            seen.add(token)
            ordered_tokens.append(token)
    for value in raw_values:
        aliases = DOMAIN_LENS_ALIASES.get(value.strip(), set())
        for alias in aliases:
            normalized = alias.lower()
            if normalized in seen:
                continue
            seen.add(normalized)
            ordered_tokens.append(normalized)
    return ordered_tokens


def _pack_domain_tokens(pack) -> set[str]:
    tokens = _normalize_tokens(pack.domain_lenses)
    tokens.update(_normalize_tokens([pack.domain_definition, pack.description]))
    tokens.update(_normalize_tokens(pack.common_problem_patterns))
    tokens.update(_normalize_tokens(pack.key_kpis_or_operating_signals))
    tokens.update(_normalize_tokens(pack.scope_boundaries))
    tokens.update(_normalize_tokens(pack.pack_notes))
    for lens in pack.domain_lenses:
        for alias_key, aliases in DOMAIN_LENS_ALIASES.items():
            if lens.lower() in {item.lower() for item in aliases}:
                tokens.add(alias_key.lower())
                tokens.update(alias.lower() for alias in aliases)
    tokens.update(_normalize_tokens(pack.routing_hints))
    return tokens


def _pack_industry_tokens(pack) -> set[str]:
    tokens = _normalize_tokens(pack.routing_hints)
    tokens.update(_normalize_tokens([pack.pack_id, pack.pack_name]))
    tokens.update(_normalize_tokens([pack.industry_definition]))
    tokens.update(_normalize_tokens(pack.common_business_models))
    tokens.update(_normalize_tokens(pack.common_problem_patterns))
    tokens.update(_normalize_tokens(pack.key_kpis_or_operating_signals))
    tokens.update(_normalize_tokens(pack.key_kpis))
    tokens.update(_normalize_tokens(pack.decision_patterns))
    tokens.update(_normalize_tokens(pack.pack_notes))
    tokens.update(token.lower() for token in INDUSTRY_TOKEN_ALIASES.get(pack.pack_id, set()))
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
        "online_education_pack": ["marketing_growth_agent", "operations_agent", "document_communication_agent"],
        "ecommerce_pack": ["marketing_growth_agent", "sales_business_development_agent", "operations_agent", "finance_agent"],
        "gaming_pack": ["marketing_growth_agent", "research_intelligence_agent", "finance_agent"],
        "funeral_services_pack": ["operations_agent", "legal_risk_agent", "sales_business_development_agent"],
        "health_supplements_pack": ["marketing_growth_agent", "legal_risk_agent", "finance_agent"],
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
