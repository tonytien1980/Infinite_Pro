from __future__ import annotations

from collections.abc import Iterable

from app.domain.enums import CapabilityArchetype, DeliverableClass, InputEntryMode
from app.extensions.registry import ExtensionRegistry
from app.extensions.schemas import (
    AgentSpec,
    AgentResolution,
    AgentResolverInput,
    AgentType,
    ExtensionStatus,
    PackSpec,
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
    "綜合": {"research", "intelligence", "signals"},
    "組織人力": {"organization", "people", "org", "team", "talent", "hiring", "hr"},
    "產品服務": {"product", "service", "offer", "sku", "pricing", "package", "bundle"},
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
    "energy_pack": {
        "energy",
        "utility",
        "renewable",
        "solar",
        "storage",
        "power",
        "能源",
        "電力",
        "儲能",
        "光電",
        "PPA",
        "EPC",
    },
    "saas_pack": {
        "saas",
        "software",
        "subscription",
        "mrr",
        "arr",
        "plg",
        "churn",
        "retention",
        "onboarding",
    },
    "media_creator_pack": {
        "creator",
        "media",
        "audience",
        "newsletter",
        "podcast",
        "youtube",
        "業配",
        "自媒體",
        "內容創作者",
        "membership",
    },
    "professional_services_pack": {
        "consulting",
        "agency",
        "retainer",
        "advisory",
        "專業服務",
        "代操",
        "代管",
    },
    "manufacturing_pack": {
        "manufacturing",
        "factory",
        "oem",
        "odm",
        "production",
        "supply",
        "工廠",
        "製造",
        "供應鏈",
        "良率",
        "產能",
        "BOM",
    },
    "healthcare_clinic_pack": {
        "clinic",
        "healthcare",
        "medical",
        "appointment",
        "patient",
        "provider",
        "診所",
        "醫療",
        "門診",
        "病患",
        "療程",
        "醫師",
    },
}

RUNTIME_AGENT_BINDINGS = {
    "host_agent": "host_orchestrator",
    "strategy_decision_agent": "strategy_business_analysis",
    "operations_agent": "operations",
    "finance_agent": "finance_capital",
    "legal_risk_agent": "legal_risk",
    "marketing_growth_agent": "marketing_growth",
    "sales_business_development_agent": "sales_business_development",
    "research_intelligence_agent": "research_intelligence",
    "document_communication_agent": "document_communication",
    "contract_review_specialist": "contract_review",
    "research_synthesis_specialist": "research_synthesis",
    "document_restructuring_specialist": "document_restructuring",
}

EXPLICIT_SELECTION_BONUS = 100


def _scored_sort(ids: list[str], score_map: dict[str, int]) -> list[str]:
    return sorted(
        ids,
        key=lambda item: (-score_map.get(item, 0), item),
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
            hint_text = " ".join(
                item.lower()
                for item in [*payload.industry_hints, payload.decision_context_summary or ""]
                if item
            )
            for pack in self.registry.list_packs(PackType.INDUSTRY):
                if pack.status != ExtensionStatus.ACTIVE:
                    continue
                matched_hints = bool(hint_tokens.intersection(_pack_industry_tokens(pack))) or (
                    _matches_industry_hint_text(pack, hint_text)
                )
                if not matched_hints:
                    continue
                if (
                    pack.relevant_client_types
                    and payload.client_type
                    and payload.client_type not in pack.relevant_client_types
                ):
                    continue
                if (
                    pack.relevant_client_stages
                    and payload.client_stage
                    and payload.client_stage not in pack.relevant_client_stages
                ):
                    continue
                selected_industry.append(pack.pack_id)
            if selected_industry:
                notes.append("Selected industry packs from industry hints.")

        selected_domain = list(dict.fromkeys(selected_domain))
        selected_industry = list(dict.fromkeys(selected_industry))
        pack_scores: dict[str, int] = {}
        pack_signals: dict[str, list[str]] = {}
        for pack_id in [*selected_domain, *selected_industry]:
            pack = self.registry.get_pack(pack_id)
            if pack is None:
                continue
            score, signals = score_pack_relevance(pack, payload)
            pack_scores[pack_id] = score
            pack_signals[pack_id] = signals

        selected_domain = _scored_sort(selected_domain, pack_scores)
        selected_industry = _scored_sort(selected_industry, pack_scores)
        stack_order = selected_domain + selected_industry
        if selected_domain and selected_industry:
            notes.append("Pack stack order applies domain packs before industry packs.")
        elif not stack_order:
            notes.append("No active packs were resolved from the current payload.")
        if stack_order:
            notes.append(
                f"Top pack by relevance score: {stack_order[0]} ({pack_scores.get(stack_order[0], 0)})."
            )

        if len(set(stack_order)) != len(stack_order):
            conflicts.append("Duplicate pack selection detected in stack order.")

        return PackResolution(
            selected_domain_pack_ids=selected_domain,
            selected_industry_pack_ids=selected_industry,
            override_pack_ids=list(dict.fromkeys(override_pack_ids)),
            conflicts=conflicts,
            stack_order=list(dict.fromkeys(stack_order)),
            resolver_notes=notes,
            pack_scores=pack_scores,
            pack_signals=pack_signals,
        )


class AgentResolver:
    def __init__(self, registry: ExtensionRegistry):
        self.registry = registry

    def resolve(self, payload: AgentResolverInput) -> AgentResolution:
        reasoning_agent_ids = _unique_preserve_order(
            _base_reasoning_agents_for_capability(payload.capability)
        )
        specialist_agent_ids: list[str] = []
        omitted_agent_notes: list[str] = []
        deferred_agent_notes: list[str] = []
        escalation_notes: list[str] = []
        resolver_notes = [
            f"Resolved base reasoning set from capability={payload.capability.value}."
        ]
        override_agent_ids: list[str] = []
        explicit_reasoning_agent_ids: list[str] = []
        explicit_specialist_agent_ids: list[str] = []

        for pack_id in payload.selected_domain_pack_ids:
            reasoning_agent_ids.extend(_reasoning_agents_for_domain_pack(pack_id))
            if payload.allow_specialists:
                specialist_agent_ids.extend(_specialists_for_domain_pack(pack_id, payload.capability))

        for pack_id in payload.selected_industry_pack_ids:
            reasoning_agent_ids.extend(_reasoning_agents_for_industry_pack(pack_id))

        if payload.external_research_heavy_case:
            reasoning_agent_ids.append("research_intelligence_agent")
            resolver_notes.append(
                "External-research-heavy sparse case detected, so Research / Intelligence Agent was elevated."
            )
            deferred_agent_notes.append(
                "由於這輪屬於 external-research-heavy sparse case，較偏 company-specific execution 的 agents 會先延後，避免假裝已具備內部確定性。"
            )
            escalation_notes.append(
                "若要升級到更完整的 company-specific agent 組合，請先補上客戶內部資料、營運現況或可引用的 artifact / source materials。"
            )

        if payload.explicit_agent_ids:
            override_agent_ids = list(dict.fromkeys(payload.explicit_agent_ids))
            resolver_notes.append("Explicit agent overrides were provided.")
            for agent_id in override_agent_ids:
                agent = self.registry.get_agent(agent_id)
                if agent is None:
                    omitted_agent_notes.append(
                        f"顯性 override 指向的 agent「{agent_id}」不存在，因此本輪不會啟用。"
                    )
                    continue
                if agent.status != ExtensionStatus.ACTIVE:
                    omitted_agent_notes.append(
                        f"顯性 override 指向的 agent「{agent.agent_name}」目前狀態為 {agent.status.value}，因此本輪不會啟用。"
                    )
                    continue
                if agent.agent_type == AgentType.REASONING:
                    reasoning_agent_ids.append(agent_id)
                    explicit_reasoning_agent_ids.append(agent_id)
                elif agent.agent_type == AgentType.SPECIALIST and payload.allow_specialists:
                    specialist_agent_ids.append(agent_id)
                    explicit_specialist_agent_ids.append(agent_id)
                elif agent.agent_type == AgentType.SPECIALIST:
                    deferred_agent_notes.append(
                        f"{agent.agent_name} 已被明確指定，但本輪 execution path 不適合 specialist-first handling，因此先暫緩。"
                    )

        if not payload.allow_specialists and specialist_agent_ids:
            deferred_agent_notes.append(
                "雖然這輪存在相關 specialist agents，但目前 execution path 不適合 specialist-first handling，因此先延後啟用。"
            )
            specialist_agent_ids = []

        if payload.artifact_count <= 0:
            if "contract_review_specialist" in specialist_agent_ids:
                specialist_agent_ids = [
                    agent_id for agent_id in specialist_agent_ids if agent_id != "contract_review_specialist"
                ]
                deferred_agent_notes.append(
                    "Contract Review Specialist 與本輪問題相關，但目前沒有可審閱的 contract artifact，因此先延後啟用。"
                )
                escalation_notes.append(
                    "若要正式啟用 Contract Review Specialist，請先補上合約、條款草稿或可審閱的法律文件 artifact。"
                )
            if "document_restructuring_specialist" in specialist_agent_ids:
                specialist_agent_ids = [
                    agent_id
                    for agent_id in specialist_agent_ids
                    if agent_id != "document_restructuring_specialist"
                ]
                deferred_agent_notes.append(
                    "Document Restructuring Specialist 與本輪問題相關，但目前沒有原始草稿或文件 artifact，因此先延後啟用。"
                )
                escalation_notes.append(
                    "若要正式啟用 Document Restructuring Specialist，請先補上原始草稿、提案或可重構的文件 artifact。"
                )

        if payload.evidence_count <= 0 and payload.capability in {
            CapabilityArchetype.DECIDE_CONVERGE,
            CapabilityArchetype.SCENARIO_COMPARISON,
            CapabilityArchetype.PLAN_ROADMAP,
            CapabilityArchetype.RISK_SURFACING,
        }:
            resolver_notes.append(
                "Evidence is still thin, so the selection remains intentionally narrow and decision-facing specialists are not expanded yet."
            )

        reasoning_agent_ids = _unique_preserve_order(reasoning_agent_ids)
        specialist_agent_ids = _unique_preserve_order(specialist_agent_ids)
        conservative_selection = payload.external_research_heavy_case or (
            payload.input_entry_mode == InputEntryMode.ONE_LINE_INQUIRY
        ) or payload.deliverable_class == DeliverableClass.EXPLORATORY_BRIEF
        if conservative_selection:
            protected_ids = set(explicit_reasoning_agent_ids)
            allowed_ids = set(_conservative_reasoning_agents_for_capability(payload.capability))
            filtered_reasoning_ids: list[str] = []
            for agent_id in reasoning_agent_ids:
                if agent_id in protected_ids or agent_id in allowed_ids:
                    filtered_reasoning_ids.append(agent_id)
                    continue
                agent = self.registry.get_agent(agent_id)
                if agent is not None:
                    deferred_agent_notes.append(
                        f"{agent.agent_name} 與本輪議題相關，但目前輸入仍偏 sparse / exploratory，因此先不納入主執行組合。"
                    )
            reasoning_agent_ids = filtered_reasoning_ids
            resolver_notes.append(
                "Sparse-input / exploratory context keeps the reasoning set intentionally conservative."
            )

        if (
            not payload.decision_context_clear
            and payload.capability
            in {
                CapabilityArchetype.DECIDE_CONVERGE,
                CapabilityArchetype.SCENARIO_COMPARISON,
                CapabilityArchetype.PLAN_ROADMAP,
            }
        ):
            protected_ids = set(explicit_reasoning_agent_ids)
            filtered_reasoning_ids = []
            for agent_id in reasoning_agent_ids:
                if agent_id in protected_ids or agent_id not in _company_specific_reasoning_agents():
                    filtered_reasoning_ids.append(agent_id)
                    continue
                agent = self.registry.get_agent(agent_id)
                if agent is not None:
                    deferred_agent_notes.append(
                        f"{agent.agent_name} 理論上與本輪決策收斂相關，但目前 DecisionContext 仍不夠清楚，因此先延後。"
                    )
            reasoning_agent_ids = filtered_reasoning_ids
            escalation_notes.append(
                "若要啟用更完整的 company-specific decision agents，請先補強 DecisionContext、成功標準與可行方案邊界。"
            )

        if (
            payload.evidence_count < 2
            and payload.deliverable_class != DeliverableClass.DECISION_ACTION_DELIVERABLE
            and payload.capability
            in {
                CapabilityArchetype.DECIDE_CONVERGE,
                CapabilityArchetype.SCENARIO_COMPARISON,
                CapabilityArchetype.PLAN_ROADMAP,
            }
        ):
            protected_ids = set(explicit_reasoning_agent_ids)
            filtered_reasoning_ids = []
            for agent_id in reasoning_agent_ids:
                if agent_id in protected_ids or agent_id in {
                    "strategy_decision_agent",
                    "research_intelligence_agent",
                    "legal_risk_agent",
                }:
                    filtered_reasoning_ids.append(agent_id)
                    continue
                agent = self.registry.get_agent(agent_id)
                if agent is not None:
                    deferred_agent_notes.append(
                        f"{agent.agent_name} 本來可支援更完整的 decision/action judgment，但目前 evidence sufficiency 仍不足，因此先延後。"
                    )
            reasoning_agent_ids = filtered_reasoning_ids
            escalation_notes.append(
                "若要啟用更完整的 planning / convergence agent 組合，請先補齊關鍵 evidence、artifact 或 source materials。"
            )

        reasoning_agent_ids = _filter_active_agents(self.registry, reasoning_agent_ids, AgentType.REASONING)
        specialist_agent_ids = _filter_active_agents(self.registry, specialist_agent_ids, AgentType.SPECIALIST)
        agent_scores: dict[str, int] = {}
        agent_signals: dict[str, list[str]] = {}
        for agent_id in [*reasoning_agent_ids, *specialist_agent_ids]:
            agent = self.registry.get_agent(agent_id)
            if agent is None:
                continue
            score, signals = score_agent_relevance(agent, payload)
            agent_scores[agent_id] = score
            agent_signals[agent_id] = signals

        reasoning_agent_ids = _scored_sort(reasoning_agent_ids, agent_scores)
        specialist_agent_ids = _scored_sort(specialist_agent_ids, agent_scores)
        if agent_scores:
            top_reasoning = reasoning_agent_ids[0] if reasoning_agent_ids else None
            top_specialist = specialist_agent_ids[0] if specialist_agent_ids else None
            if top_reasoning is not None:
                resolver_notes.append(
                    f"Top reasoning agent by relevance score: {top_reasoning} ({agent_scores.get(top_reasoning, 0)})."
                )
            if top_specialist is not None:
                resolver_notes.append(
                    f"Top specialist agent by relevance score: {top_specialist} ({agent_scores.get(top_specialist, 0)})."
                )

        return AgentResolution(
            host_agent_id=self.registry.get_host_agent().agent_id,
            reasoning_agent_ids=reasoning_agent_ids,
            specialist_agent_ids=specialist_agent_ids,
            override_agent_ids=override_agent_ids,
            resolver_notes=resolver_notes,
            agent_scores=agent_scores,
            agent_signals=agent_signals,
            omitted_agent_notes=_unique_preserve_order(omitted_agent_notes),
            deferred_agent_notes=_unique_preserve_order(deferred_agent_notes),
            escalation_notes=_unique_preserve_order(escalation_notes),
        )


def resolve_runtime_agent_binding(agent_id: str) -> str | None:
    return RUNTIME_AGENT_BINDINGS.get(agent_id)


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
    tokens.update(_normalize_tokens([pack.pack_id, pack.pack_name]))
    for lens in pack.domain_lenses:
        for alias_key, aliases in DOMAIN_LENS_ALIASES.items():
            if lens.lower() in {item.lower() for item in aliases}:
                tokens.add(alias_key.lower())
                tokens.update(alias.lower() for alias in aliases)
    tokens.update(_normalize_tokens(pack.routing_hints))
    return tokens


def _pack_industry_tokens(pack) -> set[str]:
    tokens = _normalize_tokens(pack.routing_hints)
    tokens.update(_normalize_tokens([pack.pack_id]))
    tokens.update(token.lower() for token in INDUSTRY_TOKEN_ALIASES.get(pack.pack_id, set()))
    return tokens


def _contains_cjk(value: str) -> bool:
    return any("\u4e00" <= char <= "\u9fff" for char in value)


def _matches_industry_hint_text(pack, hint_text: str) -> bool:
    candidates = {
        item.strip().lower()
        for item in [
            *pack.routing_hints,
            *INDUSTRY_TOKEN_ALIASES.get(pack.pack_id, set()),
        ]
        if item and item.strip()
    }
    return any(
        candidate in hint_text
        for candidate in candidates
        if _contains_cjk(candidate) and len(candidate) >= 2
    )


def score_pack_relevance(
    pack: PackSpec,
    payload: PackResolverInput,
) -> tuple[int, list[str]]:
    score = 0
    signals: list[str] = []

    if pack.pack_id in payload.explicit_pack_ids:
        score += EXPLICIT_SELECTION_BONUS
        signals.append("由使用者或上游流程明確指定覆寫。")

    decision_tokens = _normalize_tokens([payload.decision_context_summary or ""])
    if pack.pack_type == PackType.DOMAIN:
        requested_lenses = _normalize_domain_lenses(payload.domain_lenses)
        matched_lenses = [lens for lens in requested_lenses if lens in _pack_domain_tokens(pack)]
        if matched_lenses:
            score += 35 + min(len(matched_lenses), 3) * 8
            signals.append(f"對齊 DomainLens：{', '.join(matched_lenses[:3])}。")
        routing_matches = sorted(decision_tokens.intersection(_normalize_tokens(pack.routing_hints)))
        if routing_matches:
            score += 12 + min(len(routing_matches), 2) * 4
            signals.append(f"DecisionContext 也命中了 pack routing hints：{', '.join(routing_matches[:2])}。")
    else:
        hint_tokens = _normalize_tokens(payload.industry_hints)
        hint_text = " ".join(
            item.lower()
            for item in [*payload.industry_hints, payload.decision_context_summary or ""]
            if item
        )
        matched_hint_tokens = sorted(hint_tokens.intersection(_pack_industry_tokens(pack)))
        matched_hint_text = _matches_industry_hint_text(pack, hint_text)
        if matched_hint_tokens or matched_hint_text:
            score += 35 + min(len(matched_hint_tokens), 3) * 7 + (8 if matched_hint_text else 0)
            if matched_hint_tokens:
                signals.append(f"對齊產業線索：{', '.join(matched_hint_tokens[:3])}。")
            else:
                signals.append("對齊產業線索文字脈絡。")
        if payload.client_type and payload.client_type in pack.relevant_client_types:
            score += 12
            signals.append(f"對齊客戶型態：{payload.client_type}。")
        if payload.client_stage and payload.client_stage in pack.relevant_client_stages:
            score += 12
            signals.append(f"對齊客戶階段：{payload.client_stage}。")
        routing_matches = sorted(decision_tokens.intersection(_normalize_tokens(pack.routing_hints)))
        if routing_matches:
            score += 10 + min(len(routing_matches), 2) * 3
            signals.append(f"DecisionContext 命中產業 routing hints：{', '.join(routing_matches[:2])}。")

    if score == 0:
        signals.append("由 Host 依目前 context spine 與最小相關性推定。")
    return score, signals


def score_agent_relevance(
    agent: AgentSpec,
    payload: AgentResolverInput,
) -> tuple[int, list[str]]:
    score = 0
    signals: list[str] = []

    if agent.agent_id in payload.explicit_agent_ids:
        score += EXPLICIT_SELECTION_BONUS
        signals.append("由使用者或上游流程明確指定覆寫。")

    if payload.capability in agent.supported_capabilities:
        score += 35
        signals.append(f"對齊 Capability Archetype：{payload.capability.value}。")

    matched_domain_packs = [
        pack_id for pack_id in agent.relevant_domain_packs if pack_id in payload.selected_domain_pack_ids
    ]
    if matched_domain_packs:
        score += 16 + min(len(matched_domain_packs), 3) * 6
        signals.append(f"對齊 {len(matched_domain_packs)} 個 Domain Packs。")

    matched_industry_packs = [
        pack_id for pack_id in agent.relevant_industry_packs if pack_id in payload.selected_industry_pack_ids
    ]
    if matched_industry_packs:
        score += 12 + min(len(matched_industry_packs), 2) * 5
        signals.append(f"對齊 {len(matched_industry_packs)} 個 Industry Packs。")

    if payload.external_research_heavy_case and agent.agent_id == "research_intelligence_agent":
        score += 20
        signals.append("本輪屬於 external-research-heavy case，因此調研能力被正式拉高。")

    if (
        payload.input_entry_mode == InputEntryMode.ONE_LINE_INQUIRY
        and agent.agent_id in {"strategy_decision_agent", "research_intelligence_agent"}
    ):
        score += 8
        signals.append("一句話 sparse input 需要較強的 framing / research 補完。")

    if (
        payload.deliverable_class == DeliverableClass.EXPLORATORY_BRIEF
        and agent.agent_id in {"research_intelligence_agent", "document_communication_agent"}
    ):
        score += 6
        signals.append("目前 deliverable 仍偏 exploratory，較需要 research / narrative 收斂。")

    if (
        payload.allow_specialists
        and payload.artifact_count > 0
        and agent.agent_id in {
            "contract_review_specialist",
            "document_restructuring_specialist",
            "research_synthesis_specialist",
        }
    ):
        score += 6
        signals.append("目前已有可引用 artifact / source material，specialist 可更直接承接輸入。")

    if not payload.decision_context_clear and agent.agent_id in {
        "strategy_decision_agent",
        "research_intelligence_agent",
    }:
        score += 4
        signals.append("DecisionContext 仍偏模糊，因此保留較強的 framing / investigation 能力。")

    if score == 0:
        signals.append("由 Host 依目前 readiness 與 routing fallback 推定。")
    return score, signals


def _base_reasoning_agents_for_capability(capability: CapabilityArchetype) -> list[str]:
    mapping = {
        CapabilityArchetype.DIAGNOSE_ASSESS: ["strategy_decision_agent", "operations_agent"],
        CapabilityArchetype.DECIDE_CONVERGE: [
            "strategy_decision_agent",
            "research_intelligence_agent",
            "operations_agent",
        ],
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
        "organization_people_pack": ["operations_agent", "strategy_decision_agent"],
        "product_service_pack": [
            "strategy_decision_agent",
            "marketing_growth_agent",
            "operations_agent",
        ],
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
        "energy_pack": ["operations_agent", "finance_agent", "legal_risk_agent"],
        "saas_pack": ["marketing_growth_agent", "sales_business_development_agent", "finance_agent"],
        "media_creator_pack": ["marketing_growth_agent", "research_intelligence_agent", "document_communication_agent"],
        "professional_services_pack": ["operations_agent", "sales_business_development_agent", "finance_agent"],
        "manufacturing_pack": ["operations_agent", "finance_agent", "research_intelligence_agent"],
        "healthcare_clinic_pack": ["operations_agent", "legal_risk_agent", "marketing_growth_agent"],
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


def _unique_preserve_order(values: list[str]) -> list[str]:
    ordered: list[str] = []
    seen: set[str] = set()
    for value in values:
        normalized = value.strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        ordered.append(normalized)
    return ordered


def _conservative_reasoning_agents_for_capability(
    capability: CapabilityArchetype,
) -> list[str]:
    mapping = {
        CapabilityArchetype.DIAGNOSE_ASSESS: [
            "strategy_decision_agent",
            "research_intelligence_agent",
            "operations_agent",
        ],
        CapabilityArchetype.DECIDE_CONVERGE: [
            "strategy_decision_agent",
            "research_intelligence_agent",
        ],
        CapabilityArchetype.REVIEW_CHALLENGE: [
            "legal_risk_agent",
            "strategy_decision_agent",
            "research_intelligence_agent",
        ],
        CapabilityArchetype.SYNTHESIZE_BRIEF: [
            "research_intelligence_agent",
            "document_communication_agent",
            "strategy_decision_agent",
        ],
        CapabilityArchetype.RESTRUCTURE_REFRAME: [
            "document_communication_agent",
            "strategy_decision_agent",
        ],
        CapabilityArchetype.PLAN_ROADMAP: [
            "strategy_decision_agent",
            "research_intelligence_agent",
        ],
        CapabilityArchetype.SCENARIO_COMPARISON: [
            "strategy_decision_agent",
            "research_intelligence_agent",
        ],
        CapabilityArchetype.RISK_SURFACING: [
            "legal_risk_agent",
            "research_intelligence_agent",
            "strategy_decision_agent",
        ],
    }
    return mapping.get(capability, ["strategy_decision_agent"])


def _company_specific_reasoning_agents() -> set[str]:
    return {
        "operations_agent",
        "finance_agent",
        "marketing_growth_agent",
        "sales_business_development_agent",
    }
