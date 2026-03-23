from __future__ import annotations

from collections.abc import Iterable

from app.domain.enums import CapabilityArchetype
from app.extensions.schemas import (
    AgentRegistrySnapshot,
    AgentSpec,
    AgentType,
    ExtensionManagerSnapshot,
    ExtensionStatus,
    PackRegistrySnapshot,
    PackSpec,
    PackType,
)


def build_pack_catalog() -> list[PackSpec]:
    return [
        PackSpec(
            pack_id="operations_pack",
            pack_type=PackType.DOMAIN,
            pack_name="Operations Pack",
            description="Operational diagnosis, execution sequencing, process constraints, and delivery feasibility.",
            domain_lenses=["operations"],
            default_decision_context_patterns=["operating model diagnosis", "execution readiness", "resource sequencing"],
            evidence_expectations=["process documentation", "delivery dependencies", "resource constraints"],
            risk_libraries=["delivery risk", "dependency risk", "throughput risk"],
            recommendation_patterns=["execution sequence", "operating model adjustment", "constraint mitigation"],
            deliverable_presets=["operational assessment memo", "execution roadmap"],
            routing_hints=["operations", "process", "execution", "workflow"],
        ),
        PackSpec(
            pack_id="finance_fundraising_pack",
            pack_type=PackType.DOMAIN,
            pack_name="Finance / Fundraising Pack",
            description="Financial structure, capital needs, fundraising readiness, and economics-oriented analysis.",
            domain_lenses=["finance", "fundraising"],
            default_decision_context_patterns=["capital planning", "unit economics review", "fundraising readiness"],
            evidence_expectations=["financial model", "revenue assumptions", "cash flow signals"],
            risk_libraries=["cash risk", "capital structure risk", "fundraising risk"],
            recommendation_patterns=["capital allocation", "funding strategy", "financial discipline"],
            deliverable_presets=["finance assessment memo", "fundraising decision brief"],
            routing_hints=["finance", "fundraising", "cash flow", "capital"],
        ),
        PackSpec(
            pack_id="legal_risk_pack",
            pack_type=PackType.DOMAIN,
            pack_name="Legal / Risk Pack",
            description="Legal boundaries, contractual interpretation, compliance concerns, and formal risk surfacing.",
            domain_lenses=["legal", "risk"],
            default_decision_context_patterns=["contract review", "risk challenge", "compliance review"],
            evidence_expectations=["contracts", "terms", "compliance materials"],
            risk_libraries=["contractual risk", "liability risk", "compliance risk"],
            recommendation_patterns=["redline recommendation", "risk mitigation", "clarification request"],
            deliverable_presets=["review memo", "risk brief"],
            routing_hints=["legal", "contract", "risk", "compliance"],
        ),
        PackSpec(
            pack_id="marketing_sales_pack",
            pack_type=PackType.DOMAIN,
            pack_name="Marketing / Sales Pack",
            description="Demand generation, messaging, funnel design, go-to-market execution, and commercial traction framing.",
            domain_lenses=["marketing", "sales"],
            default_decision_context_patterns=["go-to-market decision", "message-market fit", "funnel diagnosis"],
            evidence_expectations=["customer journey materials", "campaign artifacts", "sales collateral"],
            risk_libraries=["channel risk", "conversion risk", "message risk"],
            recommendation_patterns=["positioning refinement", "funnel adjustment", "sales enablement"],
            deliverable_presets=["growth brief", "GTM decision memo"],
            routing_hints=["marketing", "sales", "growth", "GTM"],
        ),
        PackSpec(
            pack_id="business_development_pack",
            pack_type=PackType.DOMAIN,
            pack_name="Business Development Pack",
            description="Partnerships, channel expansion, strategic alliances, and commercial opportunity development.",
            domain_lenses=["business_development", "sales"],
            default_decision_context_patterns=["partnership evaluation", "channel expansion", "deal shaping"],
            evidence_expectations=["partner materials", "deal structures", "market access evidence"],
            risk_libraries=["partner dependency risk", "deal execution risk", "channel conflict risk"],
            recommendation_patterns=["partner strategy", "deal structure recommendation", "channel prioritization"],
            deliverable_presets=["business development brief", "partnership review memo"],
            routing_hints=["partnership", "business development", "channel", "alliance"],
        ),
        PackSpec(
            pack_id="research_intelligence_pack",
            pack_type=PackType.DOMAIN,
            pack_name="Research / Intelligence Pack",
            description="Research-heavy synthesis, external signal interpretation, and evidence-driven situation assessment.",
            domain_lenses=["research", "intelligence"],
            default_decision_context_patterns=["market scan", "situation assessment", "signal synthesis"],
            evidence_expectations=["external sources", "competitive information", "signal clustering"],
            risk_libraries=["signal ambiguity", "recency risk", "information quality risk"],
            recommendation_patterns=["research brief", "situation framing", "further inquiry guidance"],
            deliverable_presets=["exploratory brief", "research memo"],
            routing_hints=["research", "intelligence", "signals", "market"],
        ),
        PackSpec(
            pack_id="energy_pack",
            pack_type=PackType.INDUSTRY,
            pack_name="Energy Pack",
            description="Energy-sector context for generation, distribution, regulation, and capital-intensive operational decisions.",
            domain_lenses=["operations", "finance", "legal"],
            relevant_client_stages=["制度化階段", "規模化階段"],
            evidence_expectations=["regulatory materials", "infrastructure data", "market pricing signals"],
            risk_libraries=["regulatory risk", "supply risk", "capital intensity risk"],
            deliverable_presets=["energy strategy brief", "energy risk memo"],
            routing_hints=["energy", "power", "electricity", "utilities", "renewable"],
        ),
        PackSpec(
            pack_id="saas_pack",
            pack_type=PackType.INDUSTRY,
            pack_name="SaaS Pack",
            description="Recurring-revenue software context for productized offers, acquisition loops, and retention dynamics.",
            domain_lenses=["marketing", "sales", "finance", "operations"],
            relevant_client_stages=["創業階段", "制度化階段", "規模化階段"],
            evidence_expectations=["MRR signals", "churn indicators", "funnel metrics", "product usage patterns"],
            risk_libraries=["retention risk", "acquisition efficiency risk", "pricing risk"],
            deliverable_presets=["SaaS growth memo", "SaaS operating review"],
            routing_hints=["saas", "software", "subscription", "mrr", "arr"],
        ),
        PackSpec(
            pack_id="media_creator_pack",
            pack_type=PackType.INDUSTRY,
            pack_name="Media / Creator Pack",
            description="Audience-driven creator and media context covering content systems, monetization, and platform dependence.",
            domain_lenses=["marketing", "sales", "operations"],
            relevant_client_types=["個人品牌與服務", "自媒體"],
            evidence_expectations=["content performance", "audience signals", "platform dependency evidence"],
            risk_libraries=["platform risk", "audience concentration risk", "creator bandwidth risk"],
            deliverable_presets=["creator strategy brief", "media operating memo"],
            routing_hints=["creator", "media", "youtube", "podcast", "newsletter", "content"],
        ),
        PackSpec(
            pack_id="professional_services_pack",
            pack_type=PackType.INDUSTRY,
            pack_name="Professional Services Pack",
            description="Professional-services context for pipeline quality, delivery utilization, and relationship-driven growth.",
            domain_lenses=["operations", "sales", "finance"],
            relevant_client_types=["中小企業", "大型企業"],
            evidence_expectations=["pipeline materials", "proposal artifacts", "utilization signals", "delivery scope"],
            risk_libraries=["delivery margin risk", "client concentration risk", "scope risk"],
            deliverable_presets=["services operating memo", "advisory growth brief"],
            routing_hints=["consulting", "agency", "services", "firm", "professional services"],
        ),
    ]


def build_agent_catalog() -> list[AgentSpec]:
    return [
        AgentSpec(
            agent_id="host_agent",
            agent_name="Host Agent",
            agent_type=AgentType.HOST,
            description="The only orchestration center. Frames decisions, resolves packs, selects agents, governs readiness, and converges deliverables.",
            supported_capabilities=list(CapabilityArchetype),
            input_requirements=["DecisionContext", "Context spine", "Pack resolver outputs", "Evidence"],
            output_contract=["Capability frame", "Readiness governance", "Deliverable convergence"],
            invocation_rules=["Always present", "Cannot be disabled while the system is active"],
            escalation_rules=["Escalate missing-world-state ambiguity before claiming high-confidence decisions"],
        ),
        AgentSpec(
            agent_id="strategy_decision_agent",
            agent_name="Strategy / Decision Agent",
            agent_type=AgentType.REASONING,
            description="Handles framing, option comparison, prioritization, and decision convergence.",
            supported_capabilities=[
                CapabilityArchetype.DIAGNOSE_ASSESS,
                CapabilityArchetype.DECIDE_CONVERGE,
                CapabilityArchetype.SCENARIO_COMPARISON,
                CapabilityArchetype.RISK_SURFACING,
            ],
            relevant_domain_packs=["operations_pack", "finance_fundraising_pack", "marketing_sales_pack"],
            input_requirements=["DecisionContext", "Evidence", "Goals", "Constraints"],
            output_contract=["Insights", "Options", "Recommendations"],
            invocation_rules=["Prefer for cross-functional decision framing"],
            escalation_rules=["Escalate when no coherent decision context can be framed"],
        ),
        AgentSpec(
            agent_id="operations_agent",
            agent_name="Operations Agent",
            agent_type=AgentType.REASONING,
            description="Evaluates feasibility, process implications, dependencies, and execution sequencing.",
            supported_capabilities=[
                CapabilityArchetype.DIAGNOSE_ASSESS,
                CapabilityArchetype.DECIDE_CONVERGE,
                CapabilityArchetype.PLAN_ROADMAP,
                CapabilityArchetype.RISK_SURFACING,
            ],
            relevant_domain_packs=["operations_pack", "professional_services_pack", "energy_pack"],
            input_requirements=["Evidence", "Constraints", "Artifacts"],
            output_contract=["Operational insights", "Risks", "Action items"],
            invocation_rules=["Prefer when execution design or operating model implications matter"],
            escalation_rules=["Escalate if core process evidence is missing"],
        ),
        AgentSpec(
            agent_id="finance_agent",
            agent_name="Finance Agent",
            agent_type=AgentType.REASONING,
            description="Handles economics, capital, cash flow, and fundraising-oriented reasoning.",
            supported_capabilities=[
                CapabilityArchetype.DIAGNOSE_ASSESS,
                CapabilityArchetype.DECIDE_CONVERGE,
                CapabilityArchetype.PLAN_ROADMAP,
                CapabilityArchetype.SCENARIO_COMPARISON,
            ],
            relevant_domain_packs=["finance_fundraising_pack", "saas_pack", "energy_pack"],
            input_requirements=["Financial artifacts", "Assumptions", "Evidence"],
            output_contract=["Financial insights", "Risks", "Recommendations"],
            invocation_rules=["Prefer when capital, pricing, or economics are decision-critical"],
            escalation_rules=["Escalate if financial assumptions are missing or contradictory"],
        ),
        AgentSpec(
            agent_id="legal_risk_agent",
            agent_name="Legal / Risk Agent",
            agent_type=AgentType.REASONING,
            description="Surfaces legal boundaries, compliance risks, and contract-related implications.",
            supported_capabilities=[
                CapabilityArchetype.REVIEW_CHALLENGE,
                CapabilityArchetype.RISK_SURFACING,
                CapabilityArchetype.DECIDE_CONVERGE,
            ],
            relevant_domain_packs=["legal_risk_pack", "energy_pack"],
            input_requirements=["Artifacts", "Evidence", "Constraints"],
            output_contract=["Risk surfacing", "Recommendations", "Issue summaries"],
            invocation_rules=["Prefer when legal exposure or governance matters"],
            escalation_rules=["Escalate if required legal materials are missing"],
        ),
        AgentSpec(
            agent_id="marketing_growth_agent",
            agent_name="Marketing / Growth Agent",
            agent_type=AgentType.REASONING,
            description="Analyzes positioning, acquisition, demand shaping, and growth narratives.",
            supported_capabilities=[
                CapabilityArchetype.DIAGNOSE_ASSESS,
                CapabilityArchetype.SYNTHESIZE_BRIEF,
                CapabilityArchetype.DECIDE_CONVERGE,
                CapabilityArchetype.PLAN_ROADMAP,
            ],
            relevant_domain_packs=["marketing_sales_pack", "media_creator_pack", "saas_pack"],
            input_requirements=["Audience signals", "Artifacts", "External research"],
            output_contract=["Growth insights", "Recommendations", "Narrative risks"],
            invocation_rules=["Prefer when market-facing messaging or acquisition is core"],
            escalation_rules=["Escalate if audience evidence is too sparse for specific claims"],
        ),
        AgentSpec(
            agent_id="sales_business_development_agent",
            agent_name="Sales / Business Development Agent",
            agent_type=AgentType.REASONING,
            description="Assesses pipeline, commercial motion, partnerships, and opportunity development.",
            supported_capabilities=[
                CapabilityArchetype.DIAGNOSE_ASSESS,
                CapabilityArchetype.DECIDE_CONVERGE,
                CapabilityArchetype.PLAN_ROADMAP,
                CapabilityArchetype.SCENARIO_COMPARISON,
            ],
            relevant_domain_packs=["marketing_sales_pack", "business_development_pack", "professional_services_pack"],
            input_requirements=["Commercial artifacts", "Evidence", "Goals"],
            output_contract=["Commercial options", "Action items", "Risks"],
            invocation_rules=["Prefer when GTM, pipeline, or partnership choices are central"],
            escalation_rules=["Escalate if pipeline reality and goals are badly misaligned"],
        ),
        AgentSpec(
            agent_id="research_intelligence_agent",
            agent_name="Research / Intelligence Agent",
            agent_type=AgentType.REASONING,
            description="Synthesizes external signals, research inputs, and multi-source evidence into decision-useful frames.",
            supported_capabilities=[
                CapabilityArchetype.SYNTHESIZE_BRIEF,
                CapabilityArchetype.DIAGNOSE_ASSESS,
                CapabilityArchetype.SCENARIO_COMPARISON,
                CapabilityArchetype.RISK_SURFACING,
            ],
            relevant_domain_packs=["research_intelligence_pack", "saas_pack", "energy_pack", "media_creator_pack"],
            input_requirements=["Source materials", "Evidence", "DecisionContext"],
            output_contract=["Synthesis briefs", "Evidence summaries", "Uncertainty framing"],
            invocation_rules=["Prefer for external-research-heavy or sparse-input cases"],
            escalation_rules=["Escalate if source quality is too weak to support claims"],
        ),
        AgentSpec(
            agent_id="document_communication_agent",
            agent_name="Document / Communication Agent",
            agent_type=AgentType.REASONING,
            description="Shapes documents, narratives, drafts, and communication-oriented deliverables.",
            supported_capabilities=[
                CapabilityArchetype.RESTRUCTURE_REFRAME,
                CapabilityArchetype.SYNTHESIZE_BRIEF,
                CapabilityArchetype.PLAN_ROADMAP,
            ],
            relevant_domain_packs=["marketing_sales_pack", "professional_services_pack"],
            input_requirements=["Artifacts", "Audience", "Goals"],
            output_contract=["Restructured drafts", "Communication recommendations", "Audience-aware deliverables"],
            invocation_rules=["Prefer when artifact restructuring or narrative shaping is required"],
            escalation_rules=["Escalate if target audience or deliverable purpose is missing"],
        ),
        AgentSpec(
            agent_id="contract_review_specialist",
            agent_name="Contract Review Specialist",
            agent_type=AgentType.SPECIALIST,
            description="Document-centered specialist for contract review, clause risk surfacing, and redline-oriented outputs.",
            supported_capabilities=[CapabilityArchetype.REVIEW_CHALLENGE],
            relevant_domain_packs=["legal_risk_pack"],
            input_requirements=["Contract artifact", "Supporting evidence"],
            output_contract=["High-risk clauses", "Redline recommendations", "Missing items"],
            invocation_rules=["Prefer for single-document legal review tasks"],
            escalation_rules=["Escalate if contract attachments are missing"],
        ),
        AgentSpec(
            agent_id="research_synthesis_specialist",
            agent_name="Research Synthesis Specialist",
            agent_type=AgentType.SPECIALIST,
            description="Evidence-heavy specialist for synthesizing research materials into a decision-useful brief.",
            supported_capabilities=[CapabilityArchetype.SYNTHESIZE_BRIEF],
            relevant_domain_packs=["research_intelligence_pack"],
            input_requirements=["Source materials", "Evidence", "DecisionContext"],
            output_contract=["Findings", "Implications", "Research gaps"],
            invocation_rules=["Prefer for multi-source research synthesis"],
            escalation_rules=["Escalate if evidence coverage is too thin for conclusions"],
        ),
        AgentSpec(
            agent_id="document_restructuring_specialist",
            agent_name="Document Restructuring Specialist",
            agent_type=AgentType.SPECIALIST,
            description="Artifact-centered specialist for restructuring proposals, memos, and drafts for a target audience.",
            supported_capabilities=[CapabilityArchetype.RESTRUCTURE_REFRAME],
            relevant_domain_packs=["marketing_sales_pack", "professional_services_pack"],
            input_requirements=["Artifact", "Audience", "Goal"],
            output_contract=["Restructuring strategy", "Structure adjustments", "Draft outline"],
            invocation_rules=["Prefer for single-document restructuring tasks"],
            escalation_rules=["Escalate if source document purpose is unclear"],
        ),
    ]


class ExtensionRegistry:
    def __init__(self) -> None:
        self._packs = {pack.pack_id: pack for pack in build_pack_catalog()}
        self._agents = {agent.agent_id: agent for agent in build_agent_catalog()}
        host_agents = [
            agent.agent_id
            for agent in self._agents.values()
            if agent.agent_type == AgentType.HOST and agent.status == ExtensionStatus.ACTIVE
        ]
        if len(host_agents) != 1:
            raise ValueError("ExtensionRegistry requires exactly one active Host Agent.")
        self._host_agent_id = host_agents[0]

    def list_packs(self, pack_type: PackType | None = None) -> list[PackSpec]:
        packs = list(self._packs.values())
        if pack_type is not None:
            packs = [pack for pack in packs if pack.pack_type == pack_type]
        return sorted(packs, key=lambda item: (item.pack_type.value, item.pack_id))

    def get_pack(self, pack_id: str) -> PackSpec | None:
        return self._packs.get(pack_id)

    def list_agents(self, agent_type: AgentType | None = None) -> list[AgentSpec]:
        agents = list(self._agents.values())
        if agent_type is not None:
            agents = [agent for agent in agents if agent.agent_type == agent_type]
        return sorted(agents, key=lambda item: (item.agent_type.value, item.agent_id))

    def get_agent(self, agent_id: str) -> AgentSpec | None:
        return self._agents.get(agent_id)

    def get_host_agent(self) -> AgentSpec:
        return self._agents[self._host_agent_id]

    def pack_registry_snapshot(self) -> PackRegistrySnapshot:
        packs = self.list_packs()
        return PackRegistrySnapshot(
            packs=packs,
            active_pack_ids=[pack.pack_id for pack in packs if pack.status == ExtensionStatus.ACTIVE],
            draft_pack_ids=[pack.pack_id for pack in packs if pack.status == ExtensionStatus.DRAFT],
            inactive_pack_ids=[
                pack.pack_id
                for pack in packs
                if pack.status in {ExtensionStatus.INACTIVE, ExtensionStatus.DEPRECATED}
            ],
        )

    def agent_registry_snapshot(self) -> AgentRegistrySnapshot:
        agents = self.list_agents()
        return AgentRegistrySnapshot(
            agents=agents,
            host_agent_id=self._host_agent_id,
            active_agent_ids=[agent.agent_id for agent in agents if agent.status == ExtensionStatus.ACTIVE],
            draft_agent_ids=[agent.agent_id for agent in agents if agent.status == ExtensionStatus.DRAFT],
            inactive_agent_ids=[
                agent.agent_id
                for agent in agents
                if agent.status in {ExtensionStatus.INACTIVE, ExtensionStatus.DEPRECATED}
            ],
        )

    def manager_snapshot(self) -> ExtensionManagerSnapshot:
        return ExtensionManagerSnapshot(
            pack_registry=self.pack_registry_snapshot(),
            agent_registry=self.agent_registry_snapshot(),
        )
