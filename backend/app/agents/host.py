from __future__ import annotations

from dataclasses import dataclass, field
import logging
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.agents.base import (
    ActionItemDraft,
    AgentInputPayload,
    AgentResult,
    CoreAgentResult,
    DeliverableDraft,
    RecommendationDraft,
    RiskDraft,
)
from app.agents.registry import AgentRegistry
from app.domain import models, schemas
from app.domain.enums import (
    CapabilityArchetype,
    DeliverableClass,
    ExternalDataStrategy,
    FlowMode,
    InputEntryMode,
    PresenceState,
    RunStatus,
    TaskStatus,
)
from app.extensions.registry import ExtensionRegistry
from app.extensions.resolver import AgentResolver, resolve_runtime_agent_binding
from app.extensions.schemas import AgentResolverInput
from app.model_router.factory import get_model_provider
from app.services.external_search import search_external_sources
from app.services.sources import ingest_remote_urls_for_task
from app.services.tasks import (
    DEFAULT_DOMAIN_LENS,
    EXTERNAL_DATA_STRATEGY_CONSTRAINT_TYPE,
    get_external_data_strategy_for_task,
    get_loaded_task,
    serialize_task,
)

REQUIRED_DELIVERABLE_KEYS = (
    "problem_definition",
    "background_summary",
    "findings",
    "risks",
    "recommendations",
    "action_items",
    "missing_information",
)
logger = logging.getLogger(__name__)

CAPABILITY_LABELS = {
    CapabilityArchetype.DIAGNOSE_ASSESS: "診斷 / 評估",
    CapabilityArchetype.DECIDE_CONVERGE: "決策 / 收斂",
    CapabilityArchetype.REVIEW_CHALLENGE: "審閱 / Challenge",
    CapabilityArchetype.SYNTHESIZE_BRIEF: "綜整 / Brief",
    CapabilityArchetype.RESTRUCTURE_REFRAME: "重構 / Reframe",
    CapabilityArchetype.PLAN_ROADMAP: "規劃 / Roadmap",
    CapabilityArchetype.SCENARIO_COMPARISON: "方案比較",
    CapabilityArchetype.RISK_SURFACING: "風險盤點",
}
DEFAULT_CORE_AGENT_ORDER = [
    "strategy_business_analysis",
    "market_research_insight",
    "operations",
    "risk_challenge",
]
SPECIALIST_TASK_TYPES = {
    "contract_review",
    "research_synthesis",
    "document_restructuring",
}
AGENT_OVERRIDE_CONSTRAINT_TYPE = "agent_override"


@dataclass
class ExternalDataUsageReport:
    strategy: ExternalDataStrategy
    search_attempted: bool = False
    search_used: bool = False
    external_research_heavy_case: bool = False
    source_documents: list[models.SourceDocument] = field(default_factory=list)
    dependency_note: str = ""
    missing_information: list[str] = field(default_factory=list)


@dataclass
class CapabilityFrame:
    capability: CapabilityArchetype
    preferred_execution_mode: FlowMode
    specialist_agent_id: str | None = None
    selected_core_agents: list[str] = field(default_factory=list)
    selected_supporting_agents: list[str] = field(default_factory=list)
    host_agent_id: str = "host_agent"
    selected_agent_ids: list[str] = field(default_factory=list)
    selected_reasoning_agent_ids: list[str] = field(default_factory=list)
    selected_specialist_agent_ids: list[str] = field(default_factory=list)
    selected_agent_details: list[schemas.SelectedAgentRead] = field(default_factory=list)
    agent_resolver_notes: list[str] = field(default_factory=list)
    agent_selection_rationale: list[str] = field(default_factory=list)
    omitted_agent_notes: list[str] = field(default_factory=list)
    deferred_agent_notes: list[str] = field(default_factory=list)
    escalation_notes: list[str] = field(default_factory=list)
    selected_domain_pack_ids: list[str] = field(default_factory=list)
    selected_industry_pack_ids: list[str] = field(default_factory=list)
    selected_pack_names: list[str] = field(default_factory=list)
    pack_resolver_notes: list[str] = field(default_factory=list)
    pack_deliverable_presets: list[str] = field(default_factory=list)
    routing_rationale: list[str] = field(default_factory=list)
    priority_sources: list[str] = field(default_factory=list)
    framing_summary: str = ""


@dataclass
class ReadinessGovernance:
    level: str
    decision_context_clear: bool
    domain_context_clear: bool
    artifact_coverage: str
    evidence_coverage: str
    supported_deliverable_class: DeliverableClass
    deliverable_guidance: str = ""
    external_research_heavy_case: bool = False
    pack_evidence_expectations: list[str] = field(default_factory=list)
    pack_high_impact_gaps: list[str] = field(default_factory=list)
    pack_deliverable_presets: list[str] = field(default_factory=list)
    missing_information: list[str] = field(default_factory=list)
    conclusion_impact: list[str] = field(default_factory=list)
    agent_selection_implications: list[str] = field(default_factory=list)


class HostOrchestrator:
    def __init__(self, db: Session):
        self.db = db
        self.registry = AgentRegistry(model_provider=get_model_provider())
        self.extension_registry = ExtensionRegistry()
        self.agent_resolver = AgentResolver(self.extension_registry)

    @staticmethod
    def _compatibility_flow_mode(task: models.Task) -> FlowMode:
        if task.mode == FlowMode.MULTI_AGENT.value:
            return FlowMode.MULTI_AGENT
        return FlowMode.SPECIALIST

    def determine_flow_mode(
        self,
        task: models.Task,
        capability_frame: CapabilityFrame,
    ) -> FlowMode:
        if task.mode == FlowMode.MULTI_AGENT.value:
            capability_frame.routing_rationale.append("沿用既有 execution mode 指定：multi_agent。")
            return FlowMode.MULTI_AGENT
        if task.mode == FlowMode.SPECIALIST.value and task.task_type in SPECIALIST_TASK_TYPES:
            capability_frame.routing_rationale.append("沿用既有 specialist flow 指定，以維持相容性。")
            return FlowMode.SPECIALIST

        capability_frame.routing_rationale.append(
            f"根據 DecisionContext 與 context spine，Host 推定較適合走 {capability_frame.preferred_execution_mode.value}。"
        )
        return capability_frame.preferred_execution_mode

    def route_specialist(
        self,
        task: models.Task,
        payload: AgentInputPayload,
        capability_frame: CapabilityFrame,
    ) -> str:
        if capability_frame.specialist_agent_id:
            return capability_frame.specialist_agent_id
        if task.task_type == "contract_review" or "法務" in payload.domain_lenses:
            return "contract_review"
        if task.task_type == "document_restructuring" or capability_frame.capability == CapabilityArchetype.RESTRUCTURE_REFRAME:
            return "document_restructuring"
        if task.task_type == "research_synthesis" or capability_frame.capability in {
            CapabilityArchetype.SYNTHESIZE_BRIEF,
            CapabilityArchetype.DIAGNOSE_ASSESS,
            CapabilityArchetype.PLAN_ROADMAP,
            CapabilityArchetype.RISK_SURFACING,
        }:
            return "research_synthesis"
        raise HTTPException(
            status_code=400,
            detail=f"任務類型「{task.task_type}」目前尚未實作對應的 specialist flow。",
        )

    def build_payload(
        self,
        task: models.Task,
        workflow_mode: FlowMode | None = None,
    ) -> AgentInputPayload:
        aggregate = serialize_task(task)
        latest_context = task.contexts[-1].summary if task.contexts else ""
        return AgentInputPayload(
            task_id=task.id,
            title=task.title,
            description=task.description,
            task_type=task.task_type,
            flow_mode=workflow_mode or self._compatibility_flow_mode(task),
            background_text=aggregate.decision_context.summary if aggregate.decision_context else latest_context,
            client=aggregate.client,
            engagement=aggregate.engagement,
            workstream=aggregate.workstream,
            decision_context=aggregate.decision_context,
            domain_lenses=aggregate.domain_lenses,
            assumptions=aggregate.assumptions,
            input_entry_mode=aggregate.input_entry_mode,
            deliverable_class_hint=aggregate.deliverable_class_hint,
            external_research_heavy_candidate=aggregate.external_research_heavy_candidate,
            sparse_input_summary=aggregate.sparse_input_summary,
            presence_state_summary=aggregate.presence_state_summary,
            pack_resolution=aggregate.pack_resolution,
            agent_selection=aggregate.agent_selection,
            source_materials=aggregate.source_materials,
            artifacts=aggregate.artifacts,
            subjects=aggregate.subjects,
            goals=aggregate.goals,
            constraints=[
                item
                for item in aggregate.constraints
                if item.constraint_type != EXTERNAL_DATA_STRATEGY_CONSTRAINT_TYPE
            ],
            evidence=aggregate.evidence,
        )

    def _build_search_query(self, payload: AgentInputPayload) -> str:
        query_parts = [
            payload.decision_context.judgment_to_make.strip()
            if payload.decision_context and payload.decision_context.judgment_to_make.strip()
            else "",
            payload.decision_context.title.strip()
            if payload.decision_context and payload.decision_context.title.strip()
            else "",
            payload.description.strip(),
            *(item.strip() for item in payload.domain_lenses if item.strip() and item != DEFAULT_DOMAIN_LENS),
            self._effective_client_type(payload),
            self._effective_client_stage(payload),
            *(subject.name.strip() for subject in payload.subjects if subject.name.strip()),
            *(goal.description.strip() for goal in payload.goals if goal.description.strip()),
            *(artifact.title.strip() for artifact in payload.artifacts if artifact.title.strip()),
        ]
        query = " ".join(part for part in query_parts if part).strip()
        return (query or payload.title).strip()[:240]

    def _should_search_external_sources(
        self,
        payload: AgentInputPayload,
        strategy: ExternalDataStrategy,
        capability_frame: CapabilityFrame,
        readiness: ReadinessGovernance,
    ) -> bool:
        if strategy == ExternalDataStrategy.STRICT:
            return False

        if readiness.external_research_heavy_case:
            return True

        if strategy == ExternalDataStrategy.LATEST:
            return True

        if capability_frame.capability == CapabilityArchetype.REVIEW_CHALLENGE and self._meaningful_artifacts(payload):
            return False

        processed_internal_sources = [
            item
            for item in payload.source_materials
            if item.ingest_status == "processed" and item.source_type != "external_search"
        ]
        usable_evidence = self._usable_evidence(payload)

        if readiness.level == "insufficient":
            return True
        if capability_frame.capability in {
            CapabilityArchetype.DECIDE_CONVERGE,
            CapabilityArchetype.SCENARIO_COMPARISON,
        }:
            return len(usable_evidence) < 2 or len(processed_internal_sources) < 1
        if capability_frame.capability in {
            CapabilityArchetype.SYNTHESIZE_BRIEF,
            CapabilityArchetype.DIAGNOSE_ASSESS,
            CapabilityArchetype.PLAN_ROADMAP,
            CapabilityArchetype.RISK_SURFACING,
        }:
            return len(processed_internal_sources) < 1 or len(usable_evidence) < 1
        return False

    def _prepare_external_data_usage(
        self,
        task: models.Task,
        payload: AgentInputPayload,
        capability_frame: CapabilityFrame,
        readiness: ReadinessGovernance,
    ) -> tuple[models.Task, ExternalDataUsageReport]:
        strategy = get_external_data_strategy_for_task(task)
        report = ExternalDataUsageReport(
            strategy=strategy,
            external_research_heavy_case=readiness.external_research_heavy_case,
        )
        existing_external_sources = [
            item
            for item in task.uploads
            if item.source_type == "external_search" and item.ingest_status == "processed"
        ]

        if strategy == ExternalDataStrategy.STRICT:
            report.dependency_note = "本輪依照嚴格模式，只使用你提供的資料，不啟用 Host 外部搜尋。"
            return task, report

        if existing_external_sources and strategy != ExternalDataStrategy.LATEST:
            report.search_used = True
            report.source_documents = existing_external_sources
            report.dependency_note = (
                "本輪沿用既有的外部搜尋來源，背景摘要、關鍵發現與建議可能部分依賴外部資料。"
            )
            return task, report

        if not self._should_search_external_sources(payload, strategy, capability_frame, readiness):
            report.dependency_note = "本輪未啟用 Host 外部搜尋，分析主要依賴你提供的資料。"
            return task, report

        report.search_attempted = True
        search_query = self._build_search_query(payload)
        logger.info(
            "Host considering external search for task %s strategy=%s capability=%s query=%s",
            task.id,
            strategy.value,
            capability_frame.capability.value,
            search_query,
        )

        try:
            results = search_external_sources(search_query)
            if results:
                ingest_remote_urls_for_task(
                    db=self.db,
                    task_id=task.id,
                    urls=[item.url for item in results],
                    origin="external_search",
                )
            else:
                report.missing_information.append("Host 已嘗試補充外部搜尋，但目前沒有找到可用的公開來源。")
        except Exception as exc:  # noqa: BLE001
            logger.warning("External search degraded for task %s: %s", task.id, exc)
            report.missing_information.append(f"外部搜尋目前不可用或擷取失敗：{exc}")

        refreshed_task = get_loaded_task(self.db, task.id)
        refreshed_external_sources = [
            item
            for item in refreshed_task.uploads
            if item.source_type == "external_search" and item.ingest_status == "processed"
        ]
        report.search_used = len(refreshed_external_sources) > 0
        report.source_documents = refreshed_external_sources

        if refreshed_external_sources:
            report.dependency_note = (
                "本輪已補充外部搜尋來源，背景摘要、關鍵發現與建議可能部分依賴最新外部資料。"
            )
        elif report.search_attempted:
            report.dependency_note = "本輪已嘗試補充外部搜尋，但未能取得可用來源；分析仍以既有資料為主。"
        else:
            report.dependency_note = "本輪未啟用 Host 外部搜尋，分析主要依賴你提供的資料。"

        return refreshed_task, report

    def _preserve_sparse_case_intent(
        self,
        readiness: ReadinessGovernance,
        external_data_report: ExternalDataUsageReport,
    ) -> ReadinessGovernance:
        if not external_data_report.external_research_heavy_case:
            return readiness

        missing_information = list(readiness.missing_information)
        caution = "這輪最初屬於 external-research-heavy sparse case，後續補充的外部資料不應被誤讀成 company-specific certainty。"
        if caution not in missing_information:
            missing_information.append(caution)

        conclusion_impact = list(readiness.conclusion_impact)
        guardrail = self._deliverable_guidance_for_class(
            DeliverableClass.EXPLORATORY_BRIEF,
            True,
        )
        if guardrail not in conclusion_impact:
            conclusion_impact.append(guardrail)

        return ReadinessGovernance(
            level=readiness.level,
            decision_context_clear=readiness.decision_context_clear,
            domain_context_clear=readiness.domain_context_clear,
            artifact_coverage=readiness.artifact_coverage,
            evidence_coverage=readiness.evidence_coverage,
            supported_deliverable_class=DeliverableClass.EXPLORATORY_BRIEF,
            deliverable_guidance=guardrail,
            external_research_heavy_case=True,
            pack_evidence_expectations=readiness.pack_evidence_expectations,
            pack_high_impact_gaps=readiness.pack_high_impact_gaps,
            pack_deliverable_presets=readiness.pack_deliverable_presets,
            missing_information=missing_information,
            conclusion_impact=conclusion_impact,
            agent_selection_implications=[
                *readiness.agent_selection_implications,
                "即使本輪後續補進外部資料，agent orchestration 仍應維持 exploratory-first，不可假裝已進入 company-specific execution。",
            ],
        )

    @staticmethod
    def _tail(items: list[models.Insight] | list[models.Risk] | list[models.Recommendation] | list[models.ActionItem], count: int):
        if count <= 0:
            return []
        return items[-count:]

    @staticmethod
    def _coerce_text(value: object) -> str:
        if isinstance(value, str):
            return value.strip()
        return ""

    @staticmethod
    def _string_list(value: object) -> list[str]:
        if not isinstance(value, list):
            return []

        items: list[str] = []
        for item in value:
            text = str(item).strip()
            if text:
                items.append(text)
        return items

    @staticmethod
    def _contains_any(text: str, keywords: tuple[str, ...]) -> bool:
        return any(keyword in text for keyword in keywords)

    @staticmethod
    def _effective_client_stage(payload: AgentInputPayload) -> str:
        if payload.decision_context and payload.decision_context.client_stage:
            return payload.decision_context.client_stage
        if payload.client and payload.client.client_stage:
            return payload.client.client_stage
        return "未指定"

    @staticmethod
    def _effective_client_type(payload: AgentInputPayload) -> str:
        if payload.decision_context and payload.decision_context.client_type:
            return payload.decision_context.client_type
        if payload.client and payload.client.client_type:
            return payload.client.client_type
        return "未指定"

    @staticmethod
    def _usable_evidence(payload: AgentInputPayload) -> list[schemas.EvidenceRead]:
        return [
            evidence
            for evidence in payload.evidence
            if evidence.excerpt_or_summary.strip()
            and not evidence.evidence_type.endswith("unparsed")
            and not evidence.evidence_type.endswith("ingestion_issue")
        ]

    @staticmethod
    def _meaningful_source_materials(
        payload: AgentInputPayload,
    ) -> list[schemas.SourceMaterialRead]:
        return [
            item
            for item in payload.source_materials
            if item.ingest_status == "processed" and (item.summary.strip() or item.title.strip())
        ]

    @staticmethod
    def _meaningful_artifacts(payload: AgentInputPayload) -> list[schemas.ArtifactRead]:
        return [
            artifact
            for artifact in payload.artifacts
            if artifact.title.strip() or artifact.description.strip()
        ]

    @staticmethod
    def _salient_constraints(payload: AgentInputPayload) -> list[schemas.ConstraintRead]:
        return [
            constraint
            for constraint in payload.constraints
            if constraint.constraint_type != "system_inferred"
        ]

    @staticmethod
    def _unique_preserve_order(values: list[str]) -> list[str]:
        seen: set[str] = set()
        ordered: list[str] = []
        for item in values:
            normalized = item.strip()
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            ordered.append(normalized)
        return ordered

    @staticmethod
    def _selected_domain_packs(payload: AgentInputPayload) -> list[schemas.SelectedPackRead]:
        return payload.pack_resolution.selected_domain_packs if payload.pack_resolution else []

    @staticmethod
    def _selected_industry_packs(payload: AgentInputPayload) -> list[schemas.SelectedPackRead]:
        return payload.pack_resolution.selected_industry_packs if payload.pack_resolution else []

    def _selected_packs(self, payload: AgentInputPayload) -> list[schemas.SelectedPackRead]:
        return [
            *self._selected_domain_packs(payload),
            *self._selected_industry_packs(payload),
        ]

    def _pack_names(self, payload: AgentInputPayload) -> list[str]:
        return self._unique_preserve_order([item.pack_name for item in self._selected_packs(payload)])

    def _pack_ids(self, payload: AgentInputPayload) -> list[str]:
        return self._unique_preserve_order([item.pack_id for item in self._selected_packs(payload)])

    def _pack_evidence_expectations(self, payload: AgentInputPayload) -> list[str]:
        return self._unique_preserve_order(
            [item for pack in self._selected_packs(payload) for item in pack.evidence_expectations]
        )

    def _pack_deliverable_presets(self, payload: AgentInputPayload) -> list[str]:
        return self._unique_preserve_order(
            [item for pack in self._selected_packs(payload) for item in pack.deliverable_presets]
        )

    def _pack_key_kpis(self, payload: AgentInputPayload) -> list[str]:
        return self._unique_preserve_order(
            [
                item
                for pack in self._selected_packs(payload)
                for item in (
                    pack.key_kpis_or_operating_signals
                    if pack.key_kpis_or_operating_signals
                    else pack.key_kpis
                )
            ]
        )

    def _pack_common_risks(self, payload: AgentInputPayload) -> list[str]:
        return self._unique_preserve_order(
            [item for pack in self._selected_packs(payload) for item in pack.common_risks]
        )

    def _pack_problem_patterns(self, payload: AgentInputPayload) -> list[str]:
        return self._unique_preserve_order(
            [item for pack in self._selected_domain_packs(payload) for item in pack.common_problem_patterns]
        )

    def _pack_stage_heuristics(self, payload: AgentInputPayload) -> list[str]:
        client_stage = self._effective_client_stage(payload)
        if not client_stage or client_stage == "未指定":
            return []
        heuristics: list[str] = []
        for pack in self._selected_packs(payload):
            heuristics.extend(pack.stage_specific_heuristics.get(client_stage, []))
        return self._unique_preserve_order(heuristics)

    @staticmethod
    def _extract_explicit_agent_overrides(payload: AgentInputPayload) -> list[str]:
        explicit_agent_ids: list[str] = []
        for constraint in payload.constraints:
            if constraint.constraint_type != AGENT_OVERRIDE_CONSTRAINT_TYPE:
                continue
            explicit_agent_ids.extend(
                item.strip()
                for item in constraint.description.replace("，", ",").replace("\n", ",").split(",")
                if item.strip()
            )
        return explicit_agent_ids

    @staticmethod
    def _allow_specialists_for_agent_selection(
        payload: AgentInputPayload,
        capability: CapabilityArchetype,
        preferred_execution_mode: FlowMode,
        external_research_heavy_case: bool,
    ) -> bool:
        if external_research_heavy_case or payload.input_entry_mode == InputEntryMode.ONE_LINE_INQUIRY:
            return False
        if preferred_execution_mode != FlowMode.SPECIALIST:
            return False
        return capability in {
            CapabilityArchetype.REVIEW_CHALLENGE,
            CapabilityArchetype.SYNTHESIZE_BRIEF,
            CapabilityArchetype.RESTRUCTURE_REFRAME,
        }

    @staticmethod
    def _build_selected_agent_reason(
        *,
        agent,
        capability: CapabilityArchetype,
        explicit_agent_ids: list[str],
        selected_domain_packs: list[schemas.SelectedPackRead],
        selected_industry_packs: list[schemas.SelectedPackRead],
    ) -> str:
        reasons: list[str] = []
        domain_pack_names = {pack.pack_id: pack.pack_name for pack in selected_domain_packs}
        industry_pack_names = {pack.pack_id: pack.pack_name for pack in selected_industry_packs}

        if agent.agent_id == "host_agent":
            reasons.append("Host 是唯一 orchestration center，因此本輪固定存在。")
        if agent.agent_id in explicit_agent_ids:
            reasons.append("由使用者或上游流程明確指定覆寫。")
        if capability in agent.supported_capabilities:
            reasons.append(f"對齊 Capability Archetype：{capability.value}。")

        matched_domain_packs = [
            domain_pack_names[pack_id]
            for pack_id in agent.relevant_domain_packs
            if pack_id in domain_pack_names
        ]
        if matched_domain_packs:
            reasons.append(
                "對齊 Domain Packs：" + "、".join(matched_domain_packs) + "。"
            )

        matched_industry_packs = [
            industry_pack_names[pack_id]
            for pack_id in agent.relevant_industry_packs
            if pack_id in industry_pack_names
        ]
        if matched_industry_packs:
            reasons.append(
                "對齊 Industry Packs：" + "、".join(matched_industry_packs) + "。"
            )

        if not reasons:
            reasons.append("由 Agent Resolver 依目前 DecisionContext、packs 與 readiness 推定。")
        return " ".join(reasons)

    def _serialize_selected_agent(
        self,
        *,
        agent_id: str,
        capability: CapabilityArchetype,
        explicit_agent_ids: list[str],
        selected_domain_packs: list[schemas.SelectedPackRead],
        selected_industry_packs: list[schemas.SelectedPackRead],
    ) -> schemas.SelectedAgentRead | None:
        agent = self.extension_registry.get_agent(agent_id)
        if agent is None:
            return None

        return schemas.SelectedAgentRead(
            agent_id=agent.agent_id,
            agent_name=agent.agent_name,
            agent_type=agent.agent_type.value,
            description=agent.description,
            supported_capabilities=[item.value for item in agent.supported_capabilities],
            relevant_domain_packs=agent.relevant_domain_packs,
            relevant_industry_packs=agent.relevant_industry_packs,
            reason=self._build_selected_agent_reason(
                agent=agent,
                capability=capability,
                explicit_agent_ids=explicit_agent_ids,
                selected_domain_packs=selected_domain_packs,
                selected_industry_packs=selected_industry_packs,
            ),
            runtime_binding=resolve_runtime_agent_binding(agent.agent_id),
            status=agent.status.value,
            version=agent.version,
        )

    def _resolve_runtime_reasoning_agents(
        self,
        reasoning_agent_ids: list[str],
    ) -> list[str]:
        runtime_agent_ids = [
            resolve_runtime_agent_binding(agent_id) for agent_id in reasoning_agent_ids
        ]
        runtime_agent_ids = [
            agent_id for agent_id in runtime_agent_ids if agent_id in DEFAULT_CORE_AGENT_ORDER
        ]
        return self._unique_preserve_order(runtime_agent_ids)

    @staticmethod
    def _default_specialist_agent_for_capability(
        capability: CapabilityArchetype,
        payload: AgentInputPayload,
    ) -> str | None:
        if capability == CapabilityArchetype.REVIEW_CHALLENGE and (
            "法務" in payload.domain_lenses or payload.task_type == "contract_review"
        ):
            return "contract_review_specialist"
        if capability == CapabilityArchetype.RESTRUCTURE_REFRAME:
            return "document_restructuring_specialist"
        if capability in {
            CapabilityArchetype.SYNTHESIZE_BRIEF,
            CapabilityArchetype.DIAGNOSE_ASSESS,
            CapabilityArchetype.PLAN_ROADMAP,
            CapabilityArchetype.RISK_SURFACING,
        }:
            return "research_synthesis_specialist"
        return None

    def _resolve_agent_selection(
        self,
        payload: AgentInputPayload,
        capability: CapabilityArchetype,
        preferred_execution_mode: FlowMode,
    ) -> tuple[
        list[str],
        list[str],
        list[str],
        list[str],
        list[schemas.SelectedAgentRead],
        list[str],
        list[str],
        list[str],
        list[str],
        str,
    ]:
        selected_domain_packs = self._selected_domain_packs(payload)
        selected_industry_packs = self._selected_industry_packs(payload)
        explicit_agent_ids = self._extract_explicit_agent_overrides(payload)
        external_research_heavy_case = self._is_external_research_heavy_sparse_case(payload)
        decision_context_clear = bool(
            payload.decision_context
            and self._coerce_text(payload.decision_context.summary)
            and self._coerce_text(payload.decision_context.judgment_to_make)
        )
        resolution = self.agent_resolver.resolve(
            AgentResolverInput(
                capability=capability,
                selected_domain_pack_ids=[item.pack_id for item in selected_domain_packs],
                selected_industry_pack_ids=[item.pack_id for item in selected_industry_packs],
                decision_context_summary=(
                    payload.decision_context.summary if payload.decision_context else payload.description or payload.title
                ),
                explicit_agent_ids=explicit_agent_ids,
                evidence_count=len(self._usable_evidence(payload)),
                artifact_count=len(self._meaningful_artifacts(payload)),
                input_entry_mode=payload.input_entry_mode,
                deliverable_class=payload.deliverable_class_hint,
                decision_context_clear=decision_context_clear,
                external_research_heavy_case=external_research_heavy_case,
                allow_specialists=self._allow_specialists_for_agent_selection(
                    payload,
                    capability,
                    preferred_execution_mode,
                    external_research_heavy_case,
                ),
            )
        )
        if preferred_execution_mode == FlowMode.SPECIALIST and not resolution.specialist_agent_ids:
            fallback_specialist = self._default_specialist_agent_for_capability(capability, payload)
            if fallback_specialist:
                resolution.specialist_agent_ids.append(fallback_specialist)
                resolution.resolver_notes.append(
                    f"Host applied a specialist fallback for capability={capability.value} to preserve the current specialist execution path."
                )

        selected_agent_details = [
            item
            for item in [
                self._serialize_selected_agent(
                    agent_id=agent_id,
                    capability=capability,
                    explicit_agent_ids=explicit_agent_ids,
                    selected_domain_packs=selected_domain_packs,
                    selected_industry_packs=selected_industry_packs,
                )
                for agent_id in [*resolution.reasoning_agent_ids, *resolution.specialist_agent_ids]
            ]
            if item is not None
        ]
        selected_runtime_agents = self._resolve_runtime_reasoning_agents(resolution.reasoning_agent_ids)
        legacy_runtime_order, _ = self._select_core_agents(payload, capability)
        selected_runtime_agents = sorted(
            selected_runtime_agents,
            key=lambda item: (
                legacy_runtime_order.index(item)
                if item in legacy_runtime_order
                else len(legacy_runtime_order)
            ),
        )
        resolver_notes = list(resolution.resolver_notes)
        if preferred_execution_mode == FlowMode.MULTI_AGENT and not selected_runtime_agents:
            selected_runtime_agents = DEFAULT_CORE_AGENT_ORDER.copy()
            resolver_notes.append(
                "目前沒有解析到更合適的 reasoning runtime set，因此 Host 先回退到預設的 multi-agent convergence runtime 組合。"
            )

        selected_supporting_agents = (
            selected_runtime_agents[1:] if len(selected_runtime_agents) > 1 else []
        )

        host_agent_id = resolution.host_agent_id
        return (
            resolution.reasoning_agent_ids,
            resolution.specialist_agent_ids,
            selected_runtime_agents,
            selected_supporting_agents,
            selected_agent_details,
            resolver_notes,
            resolution.omitted_agent_notes,
            resolution.deferred_agent_notes,
            resolution.escalation_notes,
            host_agent_id,
        )

    def _decision_signal_text(self, payload: AgentInputPayload) -> str:
        parts = [
            payload.title,
            payload.description,
            payload.background_text,
            payload.decision_context.title if payload.decision_context else "",
            payload.decision_context.summary if payload.decision_context else "",
            payload.decision_context.judgment_to_make if payload.decision_context else "",
            *payload.domain_lenses,
            *(goal.description for goal in payload.goals),
            *(constraint.description for constraint in payload.constraints),
            *payload.assumptions,
            self._effective_client_type(payload),
            self._effective_client_stage(payload),
        ]
        return " ".join(part.strip() for part in parts if part and part.strip()).lower()

    def _select_core_agents(
        self,
        payload: AgentInputPayload,
        capability: CapabilityArchetype,
    ) -> tuple[list[str], list[str]]:
        scores = {
            "strategy_business_analysis": 40,
            "market_research_insight": 30,
            "operations": 20,
            "risk_challenge": 10,
        }
        routing_notes: list[str] = []
        domain_lenses = {item for item in payload.domain_lenses if item and item != DEFAULT_DOMAIN_LENS}
        client_stage = self._effective_client_stage(payload)
        client_type = self._effective_client_type(payload)
        salient_constraints = self._salient_constraints(payload)
        selected_pack_ids = set(self._pack_ids(payload))

        if capability in {
            CapabilityArchetype.DECIDE_CONVERGE,
            CapabilityArchetype.SCENARIO_COMPARISON,
            CapabilityArchetype.PLAN_ROADMAP,
            CapabilityArchetype.DIAGNOSE_ASSESS,
        }:
            scores["strategy_business_analysis"] += 12
            routing_notes.append("這輪需要先做決策 framing，因此保留 Strategy / Business Analysis 為主要收斂視角。")

        if capability in {
            CapabilityArchetype.SYNTHESIZE_BRIEF,
            CapabilityArchetype.SCENARIO_COMPARISON,
        } or domain_lenses.intersection({"行銷", "銷售", "募資"}):
            scores["market_research_insight"] += 18
            routing_notes.append("這輪包含研究 / 市場訊號需求，因此提高 Market / Research Insight 的優先順序。")

        if capability in {
            CapabilityArchetype.DIAGNOSE_ASSESS,
            CapabilityArchetype.RESTRUCTURE_REFRAME,
            CapabilityArchetype.PLAN_ROADMAP,
        } or domain_lenses.intersection({"營運", "銷售"}) or client_stage in {"制度化階段", "規模化階段"}:
            scores["operations"] += 22
            routing_notes.append("這輪判斷明顯受執行流程與落地條件影響，因此把 Operations Agent 提前。")

        if capability in {
            CapabilityArchetype.REVIEW_CHALLENGE,
            CapabilityArchetype.RISK_SURFACING,
        } or domain_lenses.intersection({"法務", "財務"}) or (
            salient_constraints and capability in {
                CapabilityArchetype.REVIEW_CHALLENGE,
                CapabilityArchetype.SCENARIO_COMPARISON,
                CapabilityArchetype.RISK_SURFACING,
            }
        ) or payload.assumptions:
            scores["risk_challenge"] += 24
            routing_notes.append("這輪需要優先檢查限制、假設與風險，因此把 Risk / Challenge Agent 提前。")

        if client_type == "大型企業":
            scores["operations"] += 4
            scores["risk_challenge"] += 4
        elif client_type == "自媒體":
            scores["market_research_insight"] += 4
        elif client_type == "個人品牌與服務":
            scores["market_research_insight"] += 3
            scores["strategy_business_analysis"] += 2

        if "operations_pack" in selected_pack_ids:
            scores["operations"] += 18
            routing_notes.append("因選到 Operations Pack，Host 會提高 Operations Agent 的優先順序。")
        if "finance_fundraising_pack" in selected_pack_ids:
            scores["strategy_business_analysis"] += 8
            scores["risk_challenge"] += 8
            routing_notes.append("因選到 Finance / Fundraising Pack，Host 會提高策略與風險視角的收斂優先序。")
        if "legal_risk_pack" in selected_pack_ids:
            scores["risk_challenge"] += 16
            routing_notes.append("因選到 Legal / Risk Pack，Host 會提高 Risk / Challenge Agent 的優先順序。")
        if "marketing_sales_pack" in selected_pack_ids:
            scores["market_research_insight"] += 16
            routing_notes.append("因選到 Marketing / Sales Pack，Host 會提高 Market / Research Insight 的優先順序。")
        if "business_development_pack" in selected_pack_ids:
            scores["market_research_insight"] += 10
            scores["strategy_business_analysis"] += 6
            routing_notes.append("因選到 Business Development Pack，Host 會優先檢查商務拓展與策略收斂。")
        if "research_intelligence_pack" in selected_pack_ids:
            scores["market_research_insight"] += 18
            routing_notes.append("因選到 Research / Intelligence Pack，Host 會提高研究與外部訊號整理的優先順序。")
        if "online_education_pack" in selected_pack_ids:
            scores["market_research_insight"] += 10
            scores["operations"] += 8
            routing_notes.append("因選到 Online Education Pack，Host 會優先檢查招生漏斗、完成率與教學交付能力。")
        if "ecommerce_pack" in selected_pack_ids:
            scores["market_research_insight"] += 10
            scores["operations"] += 8
            scores["strategy_business_analysis"] += 5
            routing_notes.append("因選到 Ecommerce Pack，Host 會優先檢查通路效率、SKU 毛利、回購與履約能力。")
        if "gaming_pack" in selected_pack_ids:
            scores["market_research_insight"] += 11
            scores["strategy_business_analysis"] += 8
            scores["risk_challenge"] += 4
            routing_notes.append("因選到 Gaming Pack，Host 會優先檢查留存、變現、live ops 節奏與平台風險。")
        if "funeral_services_pack" in selected_pack_ids:
            scores["operations"] += 10
            scores["risk_challenge"] += 10
            scores["strategy_business_analysis"] += 4
            routing_notes.append("因選到 Funeral Services Pack，Host 會優先檢查服務信任、法遵、轉介結構與人力容量。")
        if "health_supplements_pack" in selected_pack_ids:
            scores["market_research_insight"] += 8
            scores["risk_challenge"] += 10
            scores["strategy_business_analysis"] += 5
            routing_notes.append("因選到 Health Supplements Pack，Host 會優先檢查回購、claim 合規、通路效率與 SKU 結構。")

        ordered = sorted(
            DEFAULT_CORE_AGENT_ORDER,
            key=lambda item: (-scores[item], DEFAULT_CORE_AGENT_ORDER.index(item)),
        )
        return ordered, routing_notes

    def _build_capability_frame(
        self,
        task: models.Task,
        payload: AgentInputPayload,
    ) -> CapabilityFrame:
        signal_text = self._decision_signal_text(payload)
        capability = CapabilityArchetype.SYNTHESIZE_BRIEF
        routing_rationale: list[str] = []

        if task.task_type == "contract_review":
            capability = CapabilityArchetype.REVIEW_CHALLENGE
            routing_rationale.append("沿用既有 contract_review task type，但 Host 會把它 framing 為 Review / Challenge capability。")
        elif task.task_type == "document_restructuring":
            capability = CapabilityArchetype.RESTRUCTURE_REFRAME
            routing_rationale.append("沿用既有 document_restructuring task type，但 Host 會把它 framing 為 Restructure / Reframe capability。")
        elif task.task_type == "research_synthesis":
            capability = CapabilityArchetype.SYNTHESIZE_BRIEF
            routing_rationale.append("沿用既有 research_synthesis task type，但 Host 會把它 framing 為 Synthesize / Brief capability。")
        elif task.task_type == "complex_convergence":
            if self._contains_any(signal_text, ("比較", "方案", "option", "trade-off", "scenario")):
                capability = CapabilityArchetype.SCENARIO_COMPARISON
            elif self._contains_any(signal_text, ("路線圖", "roadmap", "規劃", "milestone", "計畫")):
                capability = CapabilityArchetype.PLAN_ROADMAP
            elif self._contains_any(signal_text, ("風險盤點", "risk surfacing", "法務風險", "合規風險", "risk register")):
                capability = CapabilityArchetype.RISK_SURFACING
            else:
                capability = CapabilityArchetype.DECIDE_CONVERGE
            routing_rationale.append("既有 complex_convergence 會先重新映射到 capability archetype，再決定後續 orchestration。")
        elif self._contains_any(signal_text, ("合約", "契約", "條款", "redline", "issue spotting", "liability", "termination")):
            capability = CapabilityArchetype.REVIEW_CHALLENGE
        elif self._contains_any(signal_text, ("重構", "改寫", "重組", "outline", "structure", "rewrite")):
            capability = CapabilityArchetype.RESTRUCTURE_REFRAME
        elif self._contains_any(signal_text, ("比較", "方案", "scenario", "trade-off", "option")):
            capability = CapabilityArchetype.SCENARIO_COMPARISON
        elif self._contains_any(signal_text, ("路線圖", "roadmap", "milestone", "執行計畫", "實施")):
            capability = CapabilityArchetype.PLAN_ROADMAP
        elif self._contains_any(signal_text, ("診斷", "盤點", "assess", "framing", "現況")):
            capability = CapabilityArchetype.DIAGNOSE_ASSESS
        elif self._contains_any(signal_text, ("風險", "risk", "隱憂", "exposure")):
            capability = CapabilityArchetype.RISK_SURFACING
        elif len([item for item in payload.domain_lenses if item and item != DEFAULT_DOMAIN_LENS]) > 1:
            capability = CapabilityArchetype.DECIDE_CONVERGE

        if capability == CapabilityArchetype.REVIEW_CHALLENGE and (
            task.task_type == "contract_review"
            or "法務" in payload.domain_lenses
            or "legal_risk_pack" in self._pack_ids(payload)
        ):
            specialist_agent_id = "contract_review"
        elif capability == CapabilityArchetype.RESTRUCTURE_REFRAME:
            specialist_agent_id = "document_restructuring"
        else:
            specialist_agent_id = "research_synthesis"

        preferred_execution_mode = FlowMode.SPECIALIST
        if capability in {
            CapabilityArchetype.DECIDE_CONVERGE,
            CapabilityArchetype.SCENARIO_COMPARISON,
        }:
            preferred_execution_mode = FlowMode.MULTI_AGENT
        elif capability in {
            CapabilityArchetype.PLAN_ROADMAP,
            CapabilityArchetype.DIAGNOSE_ASSESS,
            CapabilityArchetype.RISK_SURFACING,
        } and len([item for item in payload.domain_lenses if item and item != DEFAULT_DOMAIN_LENS]) > 1:
            preferred_execution_mode = FlowMode.MULTI_AGENT

        selected_domain_packs = self._selected_domain_packs(payload)
        selected_industry_packs = self._selected_industry_packs(payload)
        selected_pack_names = self._pack_names(payload)
        if selected_domain_packs:
            routing_rationale.append(
                "本輪已選用 Domain / Functional Packs："
                + "、".join(item.pack_name for item in selected_domain_packs)
                + "。"
            )
        if selected_industry_packs:
            routing_rationale.append(
                "本輪已選用 Industry Packs："
                + "、".join(item.pack_name for item in selected_industry_packs)
                + "。"
            )
        if payload.pack_resolution.resolver_notes:
            routing_rationale.extend(payload.pack_resolution.resolver_notes)
        pack_stage_heuristics = self._pack_stage_heuristics(payload)
        if pack_stage_heuristics:
            routing_rationale.append(
                f"依目前客戶階段，selected packs 提醒本輪應優先檢查：{ '、'.join(pack_stage_heuristics[:3]) }。"
            )
        pack_decision_patterns = self._unique_preserve_order(
            [item for pack in self._selected_packs(payload) for item in pack.decision_patterns]
        )
        if pack_decision_patterns:
            routing_rationale.append(
                "selected packs 目前最相關的產業判斷模式包括："
                + "、".join(pack_decision_patterns[:3])
                + "。"
            )
        pack_problem_patterns = self._pack_problem_patterns(payload)
        if pack_problem_patterns:
            routing_rationale.append(
                "selected domain packs 目前最像的企業問題型態包括："
                + "、".join(pack_problem_patterns[:2])
                + "。"
            )
        _, legacy_core_routing_notes = self._select_core_agents(payload, capability)
        routing_rationale.extend(legacy_core_routing_notes)
        (
            selected_reasoning_agent_ids,
            selected_specialist_agent_ids,
            selected_runtime_agents,
            selected_supporting_agents,
            selected_agent_details,
            agent_resolver_notes,
            omitted_agent_notes,
            deferred_agent_notes,
            escalation_notes,
            host_agent_id,
        ) = self._resolve_agent_selection(
            payload,
            capability,
            preferred_execution_mode,
        )
        if agent_resolver_notes:
            routing_rationale.extend(agent_resolver_notes)
        if selected_agent_details:
            routing_rationale.append(
                "這輪由 Host 正式透過 Agent Resolver 選出："
                + "、".join(item.agent_name for item in selected_agent_details[:4])
                + "。"
            )
        if omitted_agent_notes:
            routing_rationale.extend(omitted_agent_notes)
        if deferred_agent_notes:
            routing_rationale.extend(deferred_agent_notes)
        if escalation_notes:
            routing_rationale.extend(escalation_notes)
        prioritized_artifacts = self._meaningful_artifacts(payload)[:3]
        priority_sources = [item.title for item in prioritized_artifacts] + [
            item.title
            for item in self._meaningful_source_materials(payload)[:3]
            if item.title not in {artifact.title for artifact in prioritized_artifacts}
        ]
        decision_text = (
            payload.decision_context.judgment_to_make
            if payload.decision_context and payload.decision_context.judgment_to_make
            else payload.description or payload.title
        )
        framing_summary = (
            f"Host 先把這輪工作 framing 成「{CAPABILITY_LABELS[capability]}」，"
            f"並圍繞「{decision_text}」決定要採用的 execution path。"
        )
        if selected_pack_names:
            framing_summary += f" 這輪同時套用 { '、'.join(selected_pack_names) } 作為 context modules。"
        if pack_problem_patterns:
            framing_summary += f" Domain packs 目前提醒最值得先看的問題型態包括：{ '、'.join(pack_problem_patterns[:2]) }。"
        if preferred_execution_mode == FlowMode.MULTI_AGENT and selected_runtime_agents:
            framing_summary += (
                f" Host 會以 {selected_runtime_agents[0]} 作為主要收斂 runtime agent。"
            )
            if selected_supporting_agents:
                framing_summary += (
                    f" supporting runtime agents 為 { '、'.join(selected_supporting_agents) }。"
                )
        elif selected_specialist_agent_ids:
            framing_summary += (
                f" Host 會以 {selected_specialist_agent_ids[0]} 對應的 specialist path 作為主要執行路徑。"
            )

        return CapabilityFrame(
            capability=capability,
            preferred_execution_mode=preferred_execution_mode,
            specialist_agent_id=(
                resolve_runtime_agent_binding(selected_specialist_agent_ids[0])
                if selected_specialist_agent_ids
                else specialist_agent_id
            ),
            selected_core_agents=selected_runtime_agents,
            selected_supporting_agents=selected_supporting_agents,
            host_agent_id=host_agent_id,
            selected_agent_ids=[item.agent_id for item in selected_agent_details],
            selected_reasoning_agent_ids=selected_reasoning_agent_ids,
            selected_specialist_agent_ids=selected_specialist_agent_ids,
            selected_agent_details=selected_agent_details,
            agent_resolver_notes=agent_resolver_notes,
            agent_selection_rationale=[
                f"Host 先根據 capability={capability.value} 建立最小 agent selection。",
                *(
                    [
                        f"本輪 deliverable class hint 為 {payload.deliverable_class_hint.value}，因此 agent selection 會對齊相應的工作深度。"
                    ]
                ),
                *(
                    [
                        "selected domain packs 為："
                        + "、".join(item.pack_name for item in selected_domain_packs)
                        + "。"
                    ]
                    if selected_domain_packs
                    else []
                ),
                *(
                    [
                        "selected industry packs 為："
                        + "、".join(item.pack_name for item in selected_industry_packs)
                        + "。"
                    ]
                    if selected_industry_packs
                    else []
                ),
                *agent_resolver_notes,
            ],
            omitted_agent_notes=omitted_agent_notes,
            deferred_agent_notes=deferred_agent_notes,
            escalation_notes=escalation_notes,
            selected_domain_pack_ids=[item.pack_id for item in selected_domain_packs],
            selected_industry_pack_ids=[item.pack_id for item in selected_industry_packs],
            selected_pack_names=selected_pack_names,
            pack_resolver_notes=payload.pack_resolution.resolver_notes,
            pack_deliverable_presets=payload.pack_resolution.deliverable_presets,
            routing_rationale=routing_rationale,
            priority_sources=self._unique_preserve_order(priority_sources),
            framing_summary=framing_summary,
        )

    def _is_external_research_heavy_sparse_case(self, payload: AgentInputPayload) -> bool:
        if payload.external_research_heavy_candidate:
            return True

        decision_context_text = " ".join(
            filter(
                None,
                [
                    payload.description,
                    payload.decision_context.summary if payload.decision_context else "",
                    payload.decision_context.judgment_to_make if payload.decision_context else "",
                ],
            )
        ).lower()
        external_event_keywords = (
            "地緣政治",
            "關稅",
            "制裁",
            "市場衝擊",
            "市場崩跌",
            "政策",
            "監管",
            "法規",
            "戰爭",
            "利率",
            "匯率",
            "產業策略",
            "macro",
            "geopolit",
            "regulation",
            "market shock",
            "tariff",
            "sanction",
        )
        has_external_event_signal = any(keyword.lower() in decision_context_text for keyword in external_event_keywords)
        has_internal_materials = bool(
            self._meaningful_artifacts(payload)
            or [
                item
                for item in self._meaningful_source_materials(payload)
                if item.source_type != "external_search"
            ]
        )
        return (
            payload.input_entry_mode == InputEntryMode.ONE_LINE_INQUIRY
            and has_external_event_signal
            and not has_internal_materials
        )

    @staticmethod
    def _deliverable_guidance_for_class(
        deliverable_class: DeliverableClass,
        external_research_heavy_case: bool,
    ) -> str:
        if external_research_heavy_case:
            return (
                "目前應先產出 exploratory brief / situation assessment，先釐清外部態勢、可能影響機制與待驗證的公司內部問題，"
                "不宜假裝已具備 company-specific certainty。"
            )
        if deliverable_class == DeliverableClass.EXPLORATORY_BRIEF:
            return "目前只適合 exploratory level conclusion，應先整理 provisional framing、主要風險、缺漏資訊與下一步補證方向。"
        if deliverable_class == DeliverableClass.ASSESSMENT_REVIEW_MEMO:
            return "目前可支撐 document-centered review / assessment，適合形成 review memo、assessment memo 或重組建議。"
        return "目前資料鏈已接近 decision / action level，可產出較完整的 decision memo、action package 或 converged deliverable。"

    def _resolve_supported_deliverable_class(
        self,
        payload: AgentInputPayload,
        capability_frame: CapabilityFrame,
        decision_context_clear: bool,
        artifacts: list[schemas.ArtifactRead],
        source_materials: list[schemas.SourceMaterialRead],
        usable_evidence: list[schemas.EvidenceRead],
        critical_gaps: int,
        external_research_heavy_case: bool,
    ) -> DeliverableClass:
        if external_research_heavy_case:
            return DeliverableClass.EXPLORATORY_BRIEF

        if payload.input_entry_mode == InputEntryMode.ONE_LINE_INQUIRY:
            return DeliverableClass.EXPLORATORY_BRIEF

        if payload.input_entry_mode == InputEntryMode.SINGLE_DOCUMENT_INTAKE:
            if capability_frame.capability in {
                CapabilityArchetype.REVIEW_CHALLENGE,
                CapabilityArchetype.RESTRUCTURE_REFRAME,
                CapabilityArchetype.SYNTHESIZE_BRIEF,
                CapabilityArchetype.DIAGNOSE_ASSESS,
            }:
                return DeliverableClass.ASSESSMENT_REVIEW_MEMO
            if decision_context_clear and len(usable_evidence) >= 2 and critical_gaps == 0:
                return DeliverableClass.DECISION_ACTION_DELIVERABLE
            return DeliverableClass.ASSESSMENT_REVIEW_MEMO

        if capability_frame.capability in {
            CapabilityArchetype.DECIDE_CONVERGE,
            CapabilityArchetype.SCENARIO_COMPARISON,
            CapabilityArchetype.PLAN_ROADMAP,
        } and decision_context_clear and len(usable_evidence) >= 2:
            return DeliverableClass.DECISION_ACTION_DELIVERABLE

        if (
            decision_context_clear
            and critical_gaps == 0
            and (
                len(usable_evidence) >= 2
                or len(artifacts) + len(source_materials) >= 2
            )
        ):
            return DeliverableClass.DECISION_ACTION_DELIVERABLE

        if artifacts or source_materials or usable_evidence:
            return DeliverableClass.ASSESSMENT_REVIEW_MEMO

        return DeliverableClass.EXPLORATORY_BRIEF

    def _build_pack_high_impact_gaps(
        self,
        payload: AgentInputPayload,
        usable_evidence: list[schemas.EvidenceRead],
        artifacts: list[schemas.ArtifactRead],
        source_materials: list[schemas.SourceMaterialRead],
    ) -> list[str]:
        gaps: list[str] = []
        selected_packs = self._selected_packs(payload)

        if not selected_packs:
            return gaps

        if not artifacts:
            for pack in self._selected_domain_packs(payload):
                if pack.evidence_expectations:
                    gaps.append(
                        f"{pack.pack_name} 期待 {pack.evidence_expectations[0]} 等材料，但目前尚未形成可引用 artifact。"
                    )

        if not source_materials:
            for pack in self._selected_industry_packs(payload):
                if pack.evidence_expectations:
                    gaps.append(
                        f"{pack.pack_name} 期待 {pack.evidence_expectations[0]} 等產業脈絡材料，但目前 source material 仍偏薄。"
                    )

        if len(usable_evidence) < max(1, min(2, len(selected_packs))):
            pack_names = "、".join(item.pack_name for item in selected_packs[:3])
            gaps.append(f"目前 evidence 仍不足以支撐 {pack_names} 的 pack-aware 判斷。")
            for pack in self._selected_packs(payload):
                key_signals = (
                    pack.key_kpis_or_operating_signals
                    if pack.key_kpis_or_operating_signals
                    else pack.key_kpis
                )
                if key_signals:
                    gaps.append(
                        f"{pack.pack_name} 目前仍缺少與 { '、'.join(key_signals[:3]) } 相關的關鍵指標或佐證資料。"
                    )

        return self._unique_preserve_order(gaps)

    def _evaluate_readiness_governance(
        self,
        payload: AgentInputPayload,
        capability_frame: CapabilityFrame,
        workflow_mode: FlowMode,
    ) -> ReadinessGovernance:
        decision_context_state = payload.presence_state_summary.decision_context.state
        domain_lens_state = payload.presence_state_summary.domain_lens.state
        decision_context_clear = bool(
            payload.decision_context
            and self._coerce_text(payload.decision_context.judgment_to_make)
            and self._coerce_text(payload.decision_context.summary)
            and decision_context_state
            in {PresenceState.EXPLICIT, PresenceState.INFERRED, PresenceState.PROVISIONAL}
        )
        domain_context_clear = bool(
            payload.domain_lenses
            and any(item and item != DEFAULT_DOMAIN_LENS for item in payload.domain_lenses)
            and domain_lens_state in {PresenceState.EXPLICIT, PresenceState.INFERRED}
        )
        artifacts = self._meaningful_artifacts(payload)
        source_materials = self._meaningful_source_materials(payload)
        usable_evidence = self._usable_evidence(payload)
        missing_information: list[str] = []
        conclusion_impact: list[str] = []
        critical_gaps = 0
        external_research_heavy_case = self._is_external_research_heavy_sparse_case(payload)
        pack_evidence_expectations = self._pack_evidence_expectations(payload)
        pack_key_kpis = self._pack_key_kpis(payload)
        pack_common_risks = self._pack_common_risks(payload)
        pack_problem_patterns = self._pack_problem_patterns(payload)
        pack_high_impact_gaps = self._build_pack_high_impact_gaps(
            payload,
            usable_evidence,
            artifacts,
            source_materials,
        )

        if not decision_context_clear:
            missing_information.append(
                "DecisionContext 仍偏 provisional / missing，系統目前只能先形成較泛化的第一輪判斷。"
            )
            critical_gaps += 1

        if not domain_context_clear:
            missing_information.append("目前 DomainLens 仍偏 provisional，這會降低結論的聚焦度。")

        if payload.input_entry_mode == InputEntryMode.ONE_LINE_INQUIRY:
            conclusion_impact.append("目前進件屬於一句話問題，Host 會先建立 provisional working world。")
        elif payload.input_entry_mode == InputEntryMode.SINGLE_DOCUMENT_INTAKE:
            conclusion_impact.append("目前進件屬於單文件 intake，較適合圍繞該 artifact 形成 document-centered judgment。")
        else:
            conclusion_impact.append("目前進件屬於多材料案件，可逐步收斂成較完整的決策工作鏈。")

        if capability_frame.capability == CapabilityArchetype.REVIEW_CHALLENGE and not artifacts:
            missing_information.append("目前尚未提供可審閱的文件或條款 artifact，因此審閱結論只能停留在一般風險提醒。")
            critical_gaps += 1
        elif capability_frame.capability == CapabilityArchetype.RESTRUCTURE_REFRAME and not artifacts:
            missing_information.append("目前尚未提供原始草稿或文件 artifact，因此無法形成真正的重組建議。")
            critical_gaps += 1
        elif capability_frame.capability in {
            CapabilityArchetype.SYNTHESIZE_BRIEF,
            CapabilityArchetype.DIAGNOSE_ASSESS,
        } and not source_materials and len(usable_evidence) < 1:
            missing_information.append("目前尚未提供足以支撐綜整或診斷的來源材料，因此輸出容易偏向高層摘要。")
            critical_gaps += 1
        elif capability_frame.capability in {
            CapabilityArchetype.DECIDE_CONVERGE,
            CapabilityArchetype.SCENARIO_COMPARISON,
        } and len(usable_evidence) < 2:
            missing_information.append("目前支撐決策收斂的證據仍偏薄，方案比較與取捨判斷的可信度會受限。")
            critical_gaps += 1
        elif capability_frame.capability == CapabilityArchetype.PLAN_ROADMAP and not payload.goals:
            missing_information.append("目前尚未明確列出交付目標，因此 roadmap 只能先形成方向性骨架。")
        elif capability_frame.capability == CapabilityArchetype.RISK_SURFACING and not (
            payload.constraints or payload.assumptions or usable_evidence
        ):
            missing_information.append("目前缺少限制、假設或可引用證據，因此風險盤點容易停留在一般提醒。")

        if external_research_heavy_case:
            missing_information.append(
                "這輪問題高度依賴外部事件資料，但目前缺少公司內部材料，因此不宜直接做 company-specific certainty。"
            )
            conclusion_impact.append(
                "Host 會把這輪視為 external-research-heavy sparse case，優先形成外部態勢判斷與待驗證的公司內部問題。"
            )

        if pack_evidence_expectations:
            conclusion_impact.append(
                "本輪 selected packs 期待優先納入："
                + "、".join(pack_evidence_expectations[:4])
                + "。"
            )
        if pack_key_kpis:
            conclusion_impact.append(
                "本輪 pack-aware 判斷也會特別參考："
                + "、".join(pack_key_kpis[:4])
                + " 等產業指標。"
            )
        if pack_common_risks:
            conclusion_impact.append(
                "selected packs 也提醒這輪要優先防範："
                + "、".join(pack_common_risks[:4])
                + "。"
            )
        if pack_problem_patterns:
            conclusion_impact.append(
                "selected domain packs 目前最相關的企業問題型態包括："
                + "、".join(pack_problem_patterns[:3])
                + "。"
            )
        if payload.pack_resolution.deliverable_presets:
            conclusion_impact.append(
                "selected packs 也提示較合理的交付傾向："
                + "、".join(payload.pack_resolution.deliverable_presets[:3])
                + "。"
            )
        if pack_high_impact_gaps:
            missing_information.extend(pack_high_impact_gaps)
            critical_gaps += 1

        if payload.constraints:
            conclusion_impact.append(f"目前有 {len(payload.constraints)} 項限制條件正在壓縮可行方案。")
        if payload.assumptions:
            conclusion_impact.append(f"目前有 {len(payload.assumptions)} 項既定假設正在影響這輪判斷邊界。")
        if workflow_mode == FlowMode.MULTI_AGENT and len(usable_evidence) < 2:
            conclusion_impact.append("多代理仍可先形成收斂骨架，但若不補證，分歧與取捨會偏保守。")
        if not domain_context_clear:
            conclusion_impact.append("由於 DomainLens 尚未明確，這輪輸出會偏向通用顧問語言。")

        artifact_coverage = (
            f"已納入 {len(artifacts)} 份 artifact 與 {len(source_materials)} 份 source material。"
            if artifacts or source_materials
            else "目前尚未形成可用的 artifact / source material 鏈。"
        )
        evidence_coverage = (
            f"已整理出 {len(usable_evidence)} 則可用 evidence。"
            if usable_evidence
            else "目前尚未形成可引用 evidence，結論主要依賴問題描述與背景文字。"
        )

        if critical_gaps >= 2 or (not decision_context_clear and not usable_evidence):
            level = "insufficient"
        elif critical_gaps >= 1 or missing_information:
            level = "caution"
        else:
            level = "ready"

        supported_deliverable_class = self._resolve_supported_deliverable_class(
            payload,
            capability_frame,
            decision_context_clear,
            artifacts,
            source_materials,
            usable_evidence,
            critical_gaps,
            external_research_heavy_case,
        )
        deliverable_guidance = self._deliverable_guidance_for_class(
            supported_deliverable_class,
            external_research_heavy_case,
        )
        conclusion_impact.append(deliverable_guidance)
        agent_selection_implications: list[str] = []
        if supported_deliverable_class == DeliverableClass.EXPLORATORY_BRIEF:
            agent_selection_implications.append(
                "由於目前只適合 exploratory-level deliverable，Host 會維持較保守的 agent 組合，避免假裝已進入完整 company-specific execution。"
            )
        elif supported_deliverable_class == DeliverableClass.ASSESSMENT_REVIEW_MEMO:
            agent_selection_implications.append(
                "由於目前較適合 assessment / review memo，Host 會優先保留 review、synthesis 或 restructuring 相關 agent，而不是過早擴成完整決策收斂組合。"
            )
        else:
            agent_selection_implications.append(
                "目前資料鏈已接近 decision / action level，因此 Host 可啟用較完整的 reasoning 組合來支撐 recommendation、risk 與 action shaping。"
            )
        if capability_frame.selected_specialist_agent_ids:
            agent_selection_implications.append(
                "本輪 specialist path 會直接影響 deliverable 的主體結構與語氣，而不是僅作為附帶參考。"
            )
        elif capability_frame.selected_core_agents:
            agent_selection_implications.append(
                "本輪 multi-agent / reasoning runtime set 會直接影響 convergence 的視角與 evidence emphasis。"
            )
        if capability_frame.deferred_agent_notes:
            agent_selection_implications.append(
                "部分相關 agents 已被標記為 deferred；這會讓目前輸出較保守，並把後續升級條件明確寫進工作面。"
            )
        if capability_frame.escalation_notes:
            agent_selection_implications.append(
                "本輪也保留了 escalation notes，說明補哪些資料後可升級到更完整的 agent orchestration。"
            )

        return ReadinessGovernance(
            level=level,
            decision_context_clear=decision_context_clear,
            domain_context_clear=domain_context_clear,
            artifact_coverage=artifact_coverage,
            evidence_coverage=evidence_coverage,
            supported_deliverable_class=supported_deliverable_class,
            deliverable_guidance=deliverable_guidance,
            external_research_heavy_case=external_research_heavy_case,
            pack_evidence_expectations=pack_evidence_expectations,
            pack_high_impact_gaps=pack_high_impact_gaps,
            pack_deliverable_presets=payload.pack_resolution.deliverable_presets,
            missing_information=missing_information,
            conclusion_impact=conclusion_impact,
            agent_selection_implications=self._unique_preserve_order(agent_selection_implications),
        )

    def _prepare_host_context(
        self,
        task: models.Task,
        workflow_mode: FlowMode | None = None,
    ) -> tuple[AgentInputPayload, CapabilityFrame, ReadinessGovernance, FlowMode]:
        initial_payload = self.build_payload(task, workflow_mode or self._compatibility_flow_mode(task))
        capability_frame = self._build_capability_frame(task, initial_payload)
        resolved_workflow_mode = workflow_mode or self.determine_flow_mode(task, capability_frame)
        payload = self.build_payload(task, resolved_workflow_mode)
        readiness = self._evaluate_readiness_governance(payload, capability_frame, resolved_workflow_mode)
        return payload, capability_frame, readiness, resolved_workflow_mode

    def _build_core_judgment(
        self,
        payload: AgentInputPayload,
        content: dict[str, object],
    ) -> str:
        findings = self._string_list(content.get("findings")) or self._string_list(content.get("insights"))
        recommendations = self._string_list(content.get("recommendations"))
        risks = self._string_list(content.get("risks"))

        if findings:
            return f"依據目前證據，優先判斷應聚焦在：{findings[0]}"
        if recommendations:
            return f"依據目前任務脈絡，最可執行的方向是：{recommendations[0]}"
        if risks:
            return f"目前最需要優先管理的風險是：{risks[0]}"
        if payload.decision_context and payload.decision_context.judgment_to_make:
            return f"這輪先圍繞「{payload.decision_context.judgment_to_make}」形成可採用的第一輪判斷。"

        return (
            "目前證據仍不足以形成高信心判斷，建議先把這份結果視為帶有缺漏註記的工作草稿。"
        )

    def _build_executive_summary(
        self,
        payload: AgentInputPayload,
        content: dict[str, object],
    ) -> str:
        problem_definition = self._coerce_text(content.get("problem_definition")) or payload.description or payload.title
        core_judgment = self._coerce_text(content.get("core_judgment")) or self._build_core_judgment(payload, content)
        recommendations = self._string_list(content.get("recommendations"))
        risks = self._string_list(content.get("risks"))
        missing_information = self._string_list(content.get("missing_information"))

        summary_parts = [
            f"就「{problem_definition}」這個問題，先結論：{core_judgment}",
        ]
        if recommendations:
            summary_parts.append(f"建議優先執行「{recommendations[0]}」")
        if risks:
            summary_parts.append(f"主要風險是「{risks[0]}」")
        if missing_information:
            summary_parts.append(f"目前仍需補上「{missing_information[0]}」")

        return "；".join(summary_parts) + "。"

    @staticmethod
    def _infer_recommendation_expected_effect(recommendation: RecommendationDraft) -> str:
        combined_text = f"{recommendation.summary} {recommendation.rationale}".strip()

        if any(keyword in combined_text for keyword in ("補", "資料", "證據", "來源")):
            return "可補齊關鍵證據，降低下一輪判斷的不確定性。"
        if any(keyword in combined_text for keyword in ("對齊", "確認", "釐清")):
            return "可降低團隊理解落差，讓後續執行與決策更一致。"
        if any(keyword in combined_text for keyword in ("重組", "改寫", "結構")):
            return "可提升交付物的可讀性與採納率，減少後續重工。"
        if any(keyword in combined_text for keyword in ("優先", "排序", "決策")):
            return "可加快決策收斂，讓資源優先投入最值得處理的方向。"

        return "可讓下一輪判斷與執行更具可操作性。"

    @staticmethod
    def _infer_action_timing(action_item: ActionItemDraft) -> str:
        if action_item.due_hint:
            return action_item.due_hint
        if action_item.priority == "high":
            return "建議立即啟動，並在下一個工作迭代前完成。"
        if action_item.priority == "medium":
            return "建議排入本輪工作，於主要建議確認後執行。"
        return "可在下一輪規劃或補證後再處理。"

    def _build_recommendation_cards(
        self,
        recommendations: list[RecommendationDraft],
    ) -> list[dict[str, object]]:
        return [
            {
                "content": item.summary,
                "priority": item.priority,
                "rationale": item.rationale,
                "expected_effect": self._infer_recommendation_expected_effect(item),
            }
            for item in recommendations
        ]

    @staticmethod
    def _build_risk_cards(risks: list[RiskDraft]) -> list[dict[str, object]]:
        return [
            {
                "content": item.title or item.description,
                "severity": item.impact_level,
                "likelihood": item.likelihood_level,
                "impact_explanation": item.description,
            }
            for item in risks
        ]

    def _build_action_item_cards(
        self,
        action_items: list[ActionItemDraft],
    ) -> list[dict[str, object]]:
        return [
            {
                "content": item.description,
                "owner_role": item.suggested_owner or "任務負責人",
                "priority": item.priority,
                "sequence": self._infer_action_timing(item),
                "dependencies": item.dependency_refs,
            }
            for item in action_items
        ]

    @staticmethod
    def _build_ontology_context(payload: AgentInputPayload) -> dict[str, object]:
        return {
            "client": payload.client.model_dump(mode="json") if payload.client else None,
            "engagement": payload.engagement.model_dump(mode="json") if payload.engagement else None,
            "workstream": payload.workstream.model_dump(mode="json") if payload.workstream else None,
            "decision_context": payload.decision_context.model_dump(mode="json")
            if payload.decision_context
            else None,
            "domain_lenses": payload.domain_lenses,
            "assumptions": payload.assumptions,
            "input_entry_mode": payload.input_entry_mode.value,
            "deliverable_class_hint": payload.deliverable_class_hint.value,
            "external_research_heavy_candidate": payload.external_research_heavy_candidate,
            "sparse_input_summary": payload.sparse_input_summary,
            "presence_state_summary": payload.presence_state_summary.model_dump(mode="json"),
            "pack_resolution": payload.pack_resolution.model_dump(mode="json"),
            "source_materials": [item.model_dump(mode="json") for item in payload.source_materials],
            "artifacts": [item.model_dump(mode="json") for item in payload.artifacts],
        }

    def _annotate_host_governance(
        self,
        result: AgentResult,
        payload: AgentInputPayload,
        capability_frame: CapabilityFrame,
        readiness: ReadinessGovernance,
        workflow_mode: FlowMode,
        runtime_agents: list[str],
    ) -> AgentResult:
        content = dict(result.deliverable.content_structure or {})
        missing_information = self._string_list(content.get("missing_information"))
        deferred_agent_notes = list(capability_frame.deferred_agent_notes)
        escalation_notes = list(capability_frame.escalation_notes)
        for item in readiness.missing_information:
            if item not in missing_information:
                missing_information.append(item)
        if readiness.external_research_heavy_case:
            sparse_deferred_note = (
                "由於這輪屬於 external-research-heavy sparse case，較偏 company-specific execution 的 agents 會先延後，避免假裝已具備內部確定性。"
            )
            if sparse_deferred_note not in deferred_agent_notes:
                deferred_agent_notes.append(sparse_deferred_note)
            sparse_escalation_note = (
                "若要升級到更完整的 company-specific agent orchestration，請先補上客戶內部資料、營運現況或可引用的 artifact / source materials。"
            )
            if sparse_escalation_note not in escalation_notes:
                escalation_notes.append(sparse_escalation_note)

        content["decision_context_summary"] = (
            self._coerce_text(content.get("decision_context_summary"))
            or (payload.decision_context.summary if payload.decision_context else "")
        )
        content["capability_frame"] = {
            "capability": capability_frame.capability.value,
            "label": CAPABILITY_LABELS[capability_frame.capability],
            "framing_summary": capability_frame.framing_summary,
            "execution_mode": workflow_mode.value,
            "judgment_to_make": (
                payload.decision_context.judgment_to_make
                if payload.decision_context
                else payload.description or payload.title
            ),
            "routing_rationale": capability_frame.routing_rationale,
            "host_agent": capability_frame.host_agent_id,
            "selected_agents": capability_frame.selected_agent_ids,
            "selected_reasoning_agents": capability_frame.selected_reasoning_agent_ids,
            "selected_specialist_agents": capability_frame.selected_specialist_agent_ids,
            "selected_supporting_agents": capability_frame.selected_supporting_agents,
            "selected_agent_details": [
                item.model_dump(mode="json") for item in capability_frame.selected_agent_details
            ],
            "specialist_agent": (
                capability_frame.selected_specialist_agent_ids[0]
                if capability_frame.selected_specialist_agent_ids
                else capability_frame.specialist_agent_id
            ),
            "runtime_agents": runtime_agents,
            "agent_resolver_notes": capability_frame.agent_resolver_notes,
            "agent_selection_rationale": capability_frame.agent_selection_rationale,
            "omitted_agent_notes": capability_frame.omitted_agent_notes,
            "deferred_agent_notes": deferred_agent_notes,
            "escalation_notes": escalation_notes,
            "priority_sources": capability_frame.priority_sources,
            "domain_lenses": payload.domain_lenses,
            "client_stage": self._effective_client_stage(payload),
            "client_type": self._effective_client_type(payload),
            "selected_domain_pack_ids": capability_frame.selected_domain_pack_ids,
            "selected_industry_pack_ids": capability_frame.selected_industry_pack_ids,
            "selected_pack_names": capability_frame.selected_pack_names,
            "pack_resolver_notes": capability_frame.pack_resolver_notes,
            "pack_deliverable_presets": capability_frame.pack_deliverable_presets,
        }
        content["readiness_governance"] = {
            "level": readiness.level,
            "decision_context_clear": readiness.decision_context_clear,
            "domain_context_clear": readiness.domain_context_clear,
            "artifact_coverage": readiness.artifact_coverage,
            "evidence_coverage": readiness.evidence_coverage,
            "supported_deliverable_class": readiness.supported_deliverable_class.value,
            "deliverable_guidance": readiness.deliverable_guidance,
            "external_research_heavy_case": readiness.external_research_heavy_case,
            "pack_evidence_expectations": readiness.pack_evidence_expectations,
            "pack_high_impact_gaps": readiness.pack_high_impact_gaps,
            "pack_deliverable_presets": readiness.pack_deliverable_presets,
            "missing_information": readiness.missing_information,
            "conclusion_impact": readiness.conclusion_impact,
            "agent_selection_implications": readiness.agent_selection_implications,
        }
        content["selected_packs"] = payload.pack_resolution.model_dump(mode="json")
        content["agent_selection"] = {
            "host_agent": capability_frame.host_agent_id,
            "selected_agent_ids": capability_frame.selected_agent_ids,
            "selected_reasoning_agent_ids": capability_frame.selected_reasoning_agent_ids,
            "selected_specialist_agent_ids": capability_frame.selected_specialist_agent_ids,
            "selected_supporting_agents": capability_frame.selected_supporting_agents,
            "override_agent_ids": payload.agent_selection.override_agent_ids,
            "selected_agent_details": [
                item.model_dump(mode="json") for item in capability_frame.selected_agent_details
            ],
            "resolver_notes": capability_frame.agent_resolver_notes,
            "rationale": capability_frame.agent_selection_rationale,
            "omitted_agent_notes": capability_frame.omitted_agent_notes,
            "deferred_agent_notes": deferred_agent_notes,
            "escalation_notes": escalation_notes,
            "runtime_agents": runtime_agents,
        }
        content["input_entry_mode"] = payload.input_entry_mode.value
        content["deliverable_class"] = readiness.supported_deliverable_class.value
        content["sparse_input_operating_state"] = {
            "input_entry_mode": payload.input_entry_mode.value,
            "deliverable_class": readiness.supported_deliverable_class.value,
            "external_research_heavy_case": readiness.external_research_heavy_case,
            "summary": readiness.deliverable_guidance,
            "presence_state_summary": payload.presence_state_summary.model_dump(mode="json"),
        }
        content["ontology_chain_summary"] = {
            "client": payload.client.name if payload.client else None,
            "engagement": payload.engagement.name if payload.engagement else None,
            "workstream": payload.workstream.name if payload.workstream else None,
            "task": payload.title,
            "decision_context": payload.decision_context.title if payload.decision_context else None,
            "artifact_count": len(payload.artifacts),
            "source_material_count": len(payload.source_materials),
            "evidence_count": len(self._usable_evidence(payload)),
            "recommendation_count": len(result.recommendations),
            "risk_count": len(result.risks),
            "action_item_count": len(result.action_items),
            "selected_pack_count": len(self._selected_packs(payload)),
            "selected_pack_names": self._pack_names(payload),
        }
        content["missing_information"] = missing_information
        result.deliverable.content_structure = content
        return result

    def _shape_mode_specific_output(
        self,
        payload: AgentInputPayload,
        content: dict[str, object],
    ) -> dict[str, object]:
        workflow_key = "multi_agent" if payload.flow_mode == FlowMode.MULTI_AGENT else payload.task_type
        findings = self._string_list(content.get("findings"))
        insights = self._string_list(content.get("insights"))
        risks = self._string_list(content.get("risks"))
        recommendations = self._string_list(content.get("recommendations"))
        action_items = self._string_list(content.get("action_items"))
        missing_information = self._string_list(content.get("missing_information"))

        if workflow_key == "contract_review":
            high_risk_clauses = (
                self._string_list(content.get("high_risk_clauses"))
                or self._string_list(content.get("clauses_reviewed"))
                or risks[:3]
            )
            contract_gaps = [
                item
                for item in missing_information
                if any(keyword in item for keyword in ("附件", "條款", "草稿", "版本", "合約"))
            ]
            content["high_risk_clauses"] = high_risk_clauses
            content["redline_recommendations"] = (
                self._string_list(content.get("redline_recommendations")) or recommendations
            )
            content["missing_attachments_or_clauses"] = contract_gaps or missing_information
            return content

        if workflow_key == "document_restructuring":
            content["restructuring_strategy"] = (
                self._string_list(content.get("restructuring_strategy")) or recommendations
            )
            content["structure_adjustments"] = (
                self._string_list(content.get("structure_adjustments"))
                or self._string_list(content.get("rewrite_guidance"))
                or findings
            )
            content["draft_outline"] = (
                self._string_list(content.get("draft_outline"))
                or self._string_list(content.get("proposed_outline"))
            )
            return content

        if workflow_key == "multi_agent":
            participating_agents = self._string_list(content.get("participating_agents"))
            divergent_views = self._string_list(content.get("divergent_views"))
            if not divergent_views:
                divergent_views = [
                    item for item in missing_information if ":" in item or "：" in item
                ]
            orchestration_summary = self._string_list(content.get("orchestration_summary"))
            if not orchestration_summary:
                orchestration_summary = [
                    "由 Host 作為唯一 orchestration center 負責啟動、協調與收斂本輪分析。",
                    (
                        f"本輪共協調 {len(participating_agents)} 個核心代理。"
                        if participating_agents
                        else "本輪未回傳可用的參與代理清單。"
                    ),
                ]
                if self._coerce_text(content.get("analysis_dependency_note")):
                    orchestration_summary.append(
                        "外部資料若被使用，也必須先經過 ingestion 與 evidence pipeline，再進入分析。"
                    )

            content["convergence_summary"] = (
                self._string_list(content.get("convergence_summary")) or insights or findings
            )
            content["options"] = content.get("options") if isinstance(content.get("options"), list) else []
            content["divergent_views"] = divergent_views
            content["orchestration_summary"] = orchestration_summary
            content["participating_agents"] = participating_agents
            return content

        implications = self._string_list(content.get("implications"))
        if not implications:
            if recommendations:
                implications.append(f"管理意涵：{recommendations[0]}")
            if risks:
                implications.append(f"決策提醒：{risks[0]}")

        content["key_findings"] = self._string_list(content.get("key_findings")) or findings
        content["implications"] = implications
        content["research_gaps"] = self._string_list(content.get("research_gaps")) or missing_information
        return content

    def _apply_consultant_output_shell(
        self,
        payload: AgentInputPayload,
        result: AgentResult,
    ) -> AgentResult:
        content = dict(result.deliverable.content_structure or {})

        content["findings"] = self._string_list(content.get("findings"))
        content["risks"] = self._string_list(content.get("risks"))
        content["recommendations"] = self._string_list(content.get("recommendations"))
        content["action_items"] = self._string_list(content.get("action_items"))
        content["missing_information"] = self._string_list(content.get("missing_information"))
        if "insights" in content:
            content["insights"] = self._string_list(content.get("insights"))

        content["core_judgment"] = self._coerce_text(content.get("core_judgment")) or self._build_core_judgment(payload, content)
        content["executive_summary"] = self._coerce_text(content.get("executive_summary")) or self._build_executive_summary(payload, content)
        content["recommendation_cards"] = self._build_recommendation_cards(result.recommendations)
        content["risk_cards"] = self._build_risk_cards(result.risks)
        content["action_item_cards"] = self._build_action_item_cards(result.action_items)
        content["ontology_context"] = self._build_ontology_context(payload)
        content = self._shape_mode_specific_output(payload, content)
        result.deliverable.content_structure = content
        return result

    def _normalize_result(self, payload: AgentInputPayload, agent_id: str, result: AgentResult) -> AgentResult:
        content = dict(result.deliverable.content_structure or {})
        missing_information = list(content.get("missing_information") or [])

        for key in REQUIRED_DELIVERABLE_KEYS:
            if key not in content:
                content[key] = [] if key in {"findings", "risks", "recommendations", "action_items", "missing_information"} else ""
                missing_information.append(f"代理沒有提供「{key}」區段，因此 Host 已補上一個明確占位。")

        if not content["problem_definition"]:
            content["problem_definition"] = (
                payload.decision_context.judgment_to_make
                if payload.decision_context and payload.decision_context.judgment_to_make
                else payload.description or payload.title
            )
            missing_information.append("由於代理輸出遺漏問題定義，Host 已依據任務內容補上推定版本。")
        if not content["background_summary"]:
            content["background_summary"] = (
                payload.decision_context.summary
                if payload.decision_context and payload.decision_context.summary
                else payload.background_text or "目前尚無可用的背景摘要。"
            )
            missing_information.append("由於代理輸出遺漏背景摘要，Host 已依據目前任務脈絡補上推定版本。")

        if not result.recommendations:
            result.recommendations = [
                RecommendationDraft(
                    summary="先補強證據，再重新執行工作流。",
                    rationale="由於 specialist 輸出沒有提供建議物件，Host 已補上一條降級建議。",
                    based_on_refs=[],
                    priority="high",
                    owner_suggestion="任務負責人",
                )
            ]
            missing_information.append("目前沒有產出 recommendation 物件，因此 Host 已補上一條降級建議。")

        if not result.action_items:
            result.action_items = [
                ActionItemDraft(
                    description="在下一輪執行前，請補上可用來源資料或修正任務簡述。",
                    suggested_owner="任務負責人",
                    priority="high",
                )
            ]
            missing_information.append("目前沒有產出 action item，因此 Host 已補上一條降級行動項。")

        if not result.risks and missing_information:
            result.risks = [
                RiskDraft(
                    title="specialist 輸出不完整",
                    description="Host 偵測到 specialist 輸出缺少必要區段，因此已轉成明確的不確定性提醒。",
                    risk_type="output_integrity",
                    impact_level="medium",
                    likelihood_level="high",
                    evidence_refs=[],
                )
            ]

        content["recommendations"] = content.get("recommendations") or [item.summary for item in result.recommendations]
        content["action_items"] = content.get("action_items") or [item.description for item in result.action_items]
        content["risks"] = content.get("risks") or [item.description for item in result.risks]
        content["missing_information"] = missing_information
        content["workflow_mode"] = payload.flow_mode.value
        content["generated_by_agent"] = agent_id
        result.deliverable.content_structure = content
        return result

    def _annotate_external_data_usage(
        self,
        result: AgentResult,
        report: ExternalDataUsageReport,
    ) -> AgentResult:
        content = dict(result.deliverable.content_structure or {})
        missing_information = list(content.get("missing_information") or [])
        for item in report.missing_information:
            if item not in missing_information:
                missing_information.append(item)

        sources = [
            {
                "title": item.file_name,
                "url": item.storage_path,
                "source_type": item.source_type,
            }
            for item in report.source_documents
        ]
        content["external_data_usage"] = {
            "strategy": report.strategy.value,
            "search_used": report.search_used,
            "sources": sources,
            "analysis_dependency_note": report.dependency_note,
        }
        content["external_data_strategy"] = report.strategy.value
        content["external_search_used"] = report.search_used
        content["sources_used"] = [f"{item.file_name} | {item.storage_path}" for item in report.source_documents]
        content["analysis_dependency_note"] = report.dependency_note
        content["missing_information"] = missing_information
        result.deliverable.content_structure = content
        return result

    @staticmethod
    def _normalize_reference(value: str | None) -> str:
        return "".join((value or "").lower().split())

    def _matches_evidence_ref(self, evidence: schemas.EvidenceRead, ref: str) -> bool:
        normalized_ref = self._normalize_reference(ref)
        if not normalized_ref:
            return False

        candidates = [
            evidence.id,
            evidence.title,
            evidence.source_ref or "",
            evidence.source_document_id or "",
        ]
        normalized_candidates = [
            self._normalize_reference(candidate) for candidate in candidates if candidate
        ]
        return any(
            candidate == normalized_ref
            or candidate in normalized_ref
            or normalized_ref in candidate
            for candidate in normalized_candidates
        )

    def _resolve_evidence_ids(
        self,
        payload: AgentInputPayload,
        refs: list[str],
    ) -> list[str]:
        resolved: list[str] = []
        for ref in refs:
            for evidence in payload.evidence:
                if not self._matches_evidence_ref(evidence, ref):
                    continue
                if evidence.id not in resolved:
                    resolved.append(evidence.id)
        return resolved

    def _add_deliverable_object_link(
        self,
        *,
        task_id: str,
        deliverable_id: str,
        object_type: str,
        object_id: str | None,
        object_label: str | None,
        relation_type: str,
    ) -> None:
        self.db.add(
            models.DeliverableObjectLink(
                task_id=task_id,
                deliverable_id=deliverable_id,
                object_type=object_type,
                object_id=object_id,
                object_label=object_label,
                relation_type=relation_type,
            )
        )

    def orchestrate_task(self, task_id: str) -> schemas.ResearchRunResponse:
        task = get_loaded_task(self.db, task_id)
        payload, capability_frame, _, workflow_mode = self._prepare_host_context(task)
        logger.info(
            "Host orchestrating task %s with task_type=%s capability=%s flow_mode=%s decision=%s",
            task.id,
            task.task_type,
            capability_frame.capability.value,
            workflow_mode.value,
            payload.decision_context.judgment_to_make if payload.decision_context else task.description,
        )
        if workflow_mode == FlowMode.MULTI_AGENT:
            return self._run_multi_agent_flow(task, workflow_mode)

        return self._run_specialist_flow(task, workflow_mode)

    def run_research_synthesis(self, task_id: str) -> schemas.ResearchRunResponse:
        return self.orchestrate_task(task_id)

    def _run_multi_agent_flow(
        self,
        task: models.Task,
        workflow_mode: FlowMode,
    ) -> schemas.ResearchRunResponse:
        task.status = TaskStatus.RUNNING.value
        run = models.TaskRun(
            task_id=task.id,
            agent_id="host_orchestrator",
            flow_mode=workflow_mode.value,
            status=RunStatus.RUNNING.value,
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        task = get_loaded_task(self.db, task.id)

        try:
            payload, capability_frame, readiness, workflow_mode = self._prepare_host_context(task, workflow_mode)
            task, external_data_report = self._prepare_external_data_usage(
                task,
                payload,
                capability_frame,
                readiness,
            )
            payload, capability_frame, readiness, workflow_mode = self._prepare_host_context(task, workflow_mode)
            readiness = self._preserve_sparse_case_intent(readiness, external_data_report)
            fixed_core_agents = capability_frame.selected_core_agents or DEFAULT_CORE_AGENT_ORDER
            logger.info(
                "Starting multi-agent flow for task %s with capability=%s agents=%s",
                task.id,
                capability_frame.capability.value,
                ",".join(fixed_core_agents),
            )
            fragments: list[tuple[str, CoreAgentResult]] = []
            missing_information: list[str] = []

            for agent_id in fixed_core_agents:
                agent = self.registry.get_core_agent(agent_id)
                try:
                    fragments.append((agent_id, agent.run(payload)))
                except Exception as exc:
                    logger.warning(
                        "Core agent %s degraded for task %s: %s",
                        agent_id,
                        task.id,
                        exc,
                    )
                    missing_information.append(f"{agent_id}：模型路由失敗或核心代理執行異常：{exc}")

            converged = self._normalize_result(
                payload,
                run.agent_id,
                self._build_multi_agent_result(payload, fixed_core_agents, fragments, missing_information),
            )
            converged = self._annotate_host_governance(
                converged,
                payload,
                capability_frame,
                readiness,
                workflow_mode,
                fixed_core_agents,
            )
            converged = self._annotate_external_data_usage(converged, external_data_report)
            converged = self._apply_consultant_output_shell(payload, converged)
            deliverable = self.persist_result(task=task, run=run, payload=payload, result=converged)
        except Exception as exc:
            logger.exception("Multi-agent flow failed for task %s", task.id)
            run.status = RunStatus.FAILED.value
            run.error_message = str(exc)
            run.completed_at = datetime.now(timezone.utc)
            task.status = TaskStatus.FAILED.value
            self.db.add_all([task, run])
            self.db.commit()
            raise

        refreshed_task = get_loaded_task(self.db, task.id)
        aggregate = serialize_task(refreshed_task)
        new_insight_ids = {item.id for item in self._tail(refreshed_task.insights, len(converged.insights))}
        new_risk_ids = {item.id for item in self._tail(refreshed_task.risks, len(converged.risks))}
        new_recommendation_ids = {
            item.id for item in self._tail(refreshed_task.recommendations, len(converged.recommendations))
        }
        new_action_item_ids = {
            item.id for item in self._tail(refreshed_task.action_items, len(converged.action_items))
        }
        new_insights = [item for item in aggregate.insights if item.id in new_insight_ids]
        new_risks = [item for item in aggregate.risks if item.id in new_risk_ids]
        new_recommendations = [
            item for item in aggregate.recommendations if item.id in new_recommendation_ids
        ]
        new_action_items = [item for item in aggregate.action_items if item.id in new_action_item_ids]
        serialized_deliverable = next(
            item for item in aggregate.deliverables if item.id == deliverable.id
        )

        return schemas.ResearchRunResponse(
            task_id=refreshed_task.id,
            run=schemas.TaskRunRead.model_validate(run),
            deliverable=serialized_deliverable,
            insights=new_insights,
            risks=new_risks,
            recommendations=new_recommendations,
            action_items=new_action_items,
        )

    def _build_multi_agent_result(
        self,
        payload: AgentInputPayload,
        fixed_core_agents: list[str],
        fragments: list[tuple[str, CoreAgentResult]],
        missing_information: list[str],
    ) -> AgentResult:
        insights = [item for _, fragment in fragments for item in fragment.insights]
        risks = [item for _, fragment in fragments for item in fragment.risks]
        recommendations = [item for _, fragment in fragments for item in fragment.recommendations]
        action_items = [item for _, fragment in fragments for item in fragment.action_items]

        for agent_id, fragment in fragments:
            for note in fragment.missing_information:
                missing_information.append(f"{agent_id}: {note}")

        findings = [item.summary for item in insights]
        if not findings:
            findings = [
                "目前尚未形成高信心的多代理發現，這份輸出應視為收斂骨架而非定案。",
            ]
            missing_information.append(
                "固定核心代理組合目前無法從現有證據中產出更強的發現。"
            )

        if not risks:
            risks = [
                RiskDraft(
                    title="多代理證據缺口",
                    description="雖然多代理流程已執行，但證據覆蓋仍不足以支撐更完整的辯證與收斂。",
                    risk_type="evidence_gap",
                    impact_level="medium",
                    likelihood_level="high",
                    evidence_refs=[],
                )
            ]

        if not recommendations:
            recommendations = [
                RecommendationDraft(
                    summary="在把這份收斂結果視為可供決策的輸出前，請先補強證據基礎。",
                    rationale="由於固定核心代理沒有產出建議，Host 已補上一條降級建議。",
                    based_on_refs=[],
                    priority="high",
                    owner_suggestion="任務負責人",
                )
            ]

        if not action_items:
            action_items = [
                ActionItemDraft(
                    description="請補上更多可用證據後，再重新執行多代理流程。",
                    suggested_owner="任務負責人",
                    priority="high",
                )
            ]

        return AgentResult(
            insights=insights,
            risks=risks,
            recommendations=recommendations,
            action_items=action_items,
            deliverable=DeliverableDraft(
                deliverable_type="multi_agent_convergence",
                title=f"{payload.title} - 多代理收斂",
                content_structure={
                    "problem_definition": (
                        payload.decision_context.judgment_to_make
                        if payload.decision_context and payload.decision_context.judgment_to_make
                        else payload.description or payload.title
                    ),
                    "background_summary": (
                        payload.decision_context.summary
                        if payload.decision_context and payload.decision_context.summary
                        else payload.background_text or "目前尚無可用的背景摘要。"
                    ),
                    "findings": findings,
                    "insights": findings,
                    "risks": [item.description for item in risks],
                    "recommendations": [item.summary for item in recommendations],
                    "action_items": [item.description for item in action_items],
                    "missing_information": missing_information,
                    "participating_agents": fixed_core_agents,
                },
            ),
        )

    def _run_specialist_flow(
        self,
        task: models.Task,
        workflow_mode: FlowMode,
    ) -> schemas.ResearchRunResponse:
        task.status = TaskStatus.RUNNING.value
        run = models.TaskRun(
            task_id=task.id,
            agent_id="pending_specialist",
            flow_mode=workflow_mode.value,
            status=RunStatus.RUNNING.value,
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        task = get_loaded_task(self.db, task.id)

        try:
            payload, capability_frame, readiness, workflow_mode = self._prepare_host_context(task, workflow_mode)
            agent_id = self.route_specialist(task, payload, capability_frame)
            run.agent_id = agent_id
            self.db.add(run)
            self.db.commit()
            self.db.refresh(run)
            logger.info(
                "Starting specialist flow for task %s with capability=%s specialist=%s",
                task.id,
                capability_frame.capability.value,
                agent_id,
            )
            task, external_data_report = self._prepare_external_data_usage(
                task,
                payload,
                capability_frame,
                readiness,
            )
            payload, capability_frame, readiness, workflow_mode = self._prepare_host_context(task, workflow_mode)
            readiness = self._preserve_sparse_case_intent(readiness, external_data_report)
            agent = self.registry.get_specialist_agent(agent_id)
            result = self._normalize_result(payload, agent_id, agent.run(payload))
            result = self._annotate_host_governance(
                result,
                payload,
                capability_frame,
                readiness,
                workflow_mode,
                [agent_id],
            )
            result = self._annotate_external_data_usage(result, external_data_report)
            result = self._apply_consultant_output_shell(payload, result)
            deliverable = self.persist_result(task=task, run=run, payload=payload, result=result)
        except Exception as exc:
            logger.exception("Specialist flow failed for task %s", task.id)
            run.status = RunStatus.FAILED.value
            run.error_message = str(exc)
            run.completed_at = datetime.now(timezone.utc)
            task.status = TaskStatus.FAILED.value
            self.db.add_all([task, run])
            self.db.commit()
            raise

        refreshed_task = get_loaded_task(self.db, task.id)
        aggregate = serialize_task(refreshed_task)
        new_insight_ids = {item.id for item in self._tail(refreshed_task.insights, len(result.insights))}
        new_risk_ids = {item.id for item in self._tail(refreshed_task.risks, len(result.risks))}
        new_recommendation_ids = {
            item.id for item in self._tail(refreshed_task.recommendations, len(result.recommendations))
        }
        new_action_item_ids = {
            item.id for item in self._tail(refreshed_task.action_items, len(result.action_items))
        }
        new_insights = [item for item in aggregate.insights if item.id in new_insight_ids]
        new_risks = [item for item in aggregate.risks if item.id in new_risk_ids]
        new_recommendations = [
            item for item in aggregate.recommendations if item.id in new_recommendation_ids
        ]
        new_action_items = [item for item in aggregate.action_items if item.id in new_action_item_ids]
        serialized_deliverable = next(
            item for item in aggregate.deliverables if item.id == deliverable.id
        )

        return schemas.ResearchRunResponse(
            task_id=refreshed_task.id,
            run=schemas.TaskRunRead.model_validate(run),
            deliverable=serialized_deliverable,
            insights=new_insights,
            risks=new_risks,
            recommendations=new_recommendations,
            action_items=new_action_items,
        )

    def persist_result(
        self,
        task: models.Task,
        run: models.TaskRun,
        payload: AgentInputPayload,
        result: AgentResult,
    ) -> models.Deliverable:
        logger.info(
            "Persisting result for task %s from agent=%s deliverable_type=%s",
            task.id,
            run.agent_id,
            result.deliverable.deliverable_type,
        )
        for insight in result.insights:
            self.db.add(
                models.Insight(
                    task_id=task.id,
                    generated_by=run.agent_id,
                    summary=insight.summary,
                    evidence_refs=insight.evidence_refs,
                    confidence_level=insight.confidence_level,
                )
            )
        persisted_risks: list[models.Risk] = []
        for risk in result.risks:
            risk_row = models.Risk(
                    task_id=task.id,
                    title=risk.title,
                    description=risk.description,
                    risk_type=risk.risk_type,
                    impact_level=risk.impact_level,
                    likelihood_level=risk.likelihood_level,
                    evidence_refs=risk.evidence_refs,
                )
            self.db.add(risk_row)
            persisted_risks.append(risk_row)
        for option in result.options:
            self.db.add(
                models.Option(
                    task_id=task.id,
                    title=option.title,
                    description=option.description,
                    pros=option.pros,
                    cons=option.cons,
                    related_risk_refs=option.related_risk_refs,
                )
            )
        persisted_recommendations: list[models.Recommendation] = []
        for recommendation in result.recommendations:
            recommendation_row = models.Recommendation(
                    task_id=task.id,
                    summary=recommendation.summary,
                    rationale=recommendation.rationale,
                    based_on_refs=recommendation.based_on_refs,
                    priority=recommendation.priority,
                    owner_suggestion=recommendation.owner_suggestion,
                )
            self.db.add(recommendation_row)
            persisted_recommendations.append(recommendation_row)
        persisted_action_items: list[models.ActionItem] = []
        for action_item in result.action_items:
            action_item_row = models.ActionItem(
                    task_id=task.id,
                    description=action_item.description,
                    suggested_owner=action_item.suggested_owner,
                    priority=action_item.priority,
                    due_hint=action_item.due_hint,
                    dependency_refs=action_item.dependency_refs,
                    status=action_item.status,
                )
            self.db.add(action_item_row)
            persisted_action_items.append(action_item_row)
        self.db.flush()

        linked_recommendation_evidence_ids: list[str] = []
        linked_risk_evidence_ids: list[str] = []
        linked_action_item_evidence_ids: list[str] = []

        for recommendation_row, recommendation in zip(
            persisted_recommendations,
            result.recommendations,
            strict=False,
        ):
            evidence_ids = self._resolve_evidence_ids(payload, recommendation.based_on_refs)
            for evidence_id in evidence_ids:
                self.db.add(
                    models.RecommendationEvidenceLink(
                        task_id=task.id,
                        recommendation_id=recommendation_row.id,
                        evidence_id=evidence_id,
                        relation_type="supports",
                    )
                )
                if evidence_id not in linked_recommendation_evidence_ids:
                    linked_recommendation_evidence_ids.append(evidence_id)

        for risk_row, risk in zip(persisted_risks, result.risks, strict=False):
            evidence_ids = self._resolve_evidence_ids(payload, risk.evidence_refs)
            for evidence_id in evidence_ids:
                self.db.add(
                    models.RiskEvidenceLink(
                        task_id=task.id,
                        risk_id=risk_row.id,
                        evidence_id=evidence_id,
                        relation_type="supports",
                    )
                )
                if evidence_id not in linked_risk_evidence_ids:
                    linked_risk_evidence_ids.append(evidence_id)

        for action_item_row, action_item in zip(
            persisted_action_items,
            result.action_items,
            strict=False,
        ):
            evidence_ids = self._resolve_evidence_ids(payload, action_item.dependency_refs)
            for evidence_id in evidence_ids:
                self.db.add(
                    models.ActionItemEvidenceLink(
                        task_id=task.id,
                        action_item_id=action_item_row.id,
                        evidence_id=evidence_id,
                        relation_type="depends_on_evidence",
                    )
                )
                if evidence_id not in linked_action_item_evidence_ids:
                    linked_action_item_evidence_ids.append(evidence_id)

        current_versions = [item.version for item in task.deliverables]
        next_version = max(current_versions, default=0) + 1
        deliverable = models.Deliverable(
            task_id=task.id,
            task_run_id=run.id,
            deliverable_type=result.deliverable.deliverable_type,
            title=result.deliverable.title,
            content_structure=result.deliverable.content_structure,
            version=next_version,
        )
        self.db.add(deliverable)
        self.db.flush()

        if payload.client:
            self._add_deliverable_object_link(
                task_id=task.id,
                deliverable_id=deliverable.id,
                object_type="client",
                object_id=payload.client.id,
                object_label=payload.client.name,
                relation_type="scoped_to",
            )
        if payload.engagement:
            self._add_deliverable_object_link(
                task_id=task.id,
                deliverable_id=deliverable.id,
                object_type="engagement",
                object_id=payload.engagement.id,
                object_label=payload.engagement.name,
                relation_type="scoped_to",
            )
        if payload.workstream:
            self._add_deliverable_object_link(
                task_id=task.id,
                deliverable_id=deliverable.id,
                object_type="workstream",
                object_id=payload.workstream.id,
                object_label=payload.workstream.name,
                relation_type="scoped_to",
            )
        if payload.decision_context:
            self._add_deliverable_object_link(
                task_id=task.id,
                deliverable_id=deliverable.id,
                object_type="decision_context",
                object_id=payload.decision_context.id,
                object_label=payload.decision_context.judgment_to_make or payload.decision_context.title,
                relation_type="addresses",
            )

        for source_material in payload.source_materials:
            self._add_deliverable_object_link(
                task_id=task.id,
                deliverable_id=deliverable.id,
                object_type="source_material",
                object_id=source_material.id,
                object_label=source_material.title,
                relation_type="draws_from",
            )
        for artifact in payload.artifacts:
            self._add_deliverable_object_link(
                task_id=task.id,
                deliverable_id=deliverable.id,
                object_type="artifact",
                object_id=artifact.id,
                object_label=artifact.title,
                relation_type="draws_from",
            )

        evidence_lookup = {item.id: item for item in payload.evidence}
        linked_evidence_ids = [
            *linked_recommendation_evidence_ids,
            *[item for item in linked_risk_evidence_ids if item not in linked_recommendation_evidence_ids],
            *[
                item
                for item in linked_action_item_evidence_ids
                if item not in linked_recommendation_evidence_ids and item not in linked_risk_evidence_ids
            ],
        ]
        for evidence_id in linked_evidence_ids:
            evidence = evidence_lookup.get(evidence_id)
            self._add_deliverable_object_link(
                task_id=task.id,
                deliverable_id=deliverable.id,
                object_type="evidence",
                object_id=evidence_id,
                object_label=evidence.title if evidence else None,
                relation_type="based_on",
            )

        for recommendation_row in persisted_recommendations:
            self._add_deliverable_object_link(
                task_id=task.id,
                deliverable_id=deliverable.id,
                object_type="recommendation",
                object_id=recommendation_row.id,
                object_label=recommendation_row.summary[:255],
                relation_type="contains",
            )
        for risk_row in persisted_risks:
            self._add_deliverable_object_link(
                task_id=task.id,
                deliverable_id=deliverable.id,
                object_type="risk",
                object_id=risk_row.id,
                object_label=risk_row.title[:255],
                relation_type="contains",
            )
        for action_item_row in persisted_action_items:
            self._add_deliverable_object_link(
                task_id=task.id,
                deliverable_id=deliverable.id,
                object_type="action_item",
                object_id=action_item_row.id,
                object_label=action_item_row.description[:255],
                relation_type="contains",
            )

        content = dict(deliverable.content_structure or {})
        content["traceability_foundation"] = {
            "decision_context_linked": payload.decision_context is not None,
            "source_material_count": len(payload.source_materials),
            "artifact_count": len(payload.artifacts),
            "linked_evidence_count": len(linked_evidence_ids),
            "linked_recommendation_count": len(persisted_recommendations),
            "linked_risk_count": len(persisted_risks),
            "linked_action_item_count": len(persisted_action_items),
            "selected_pack_ids": self._pack_ids(payload),
        }
        deliverable.content_structure = content

        run.status = RunStatus.COMPLETED.value
        run.summary = (
            self._coerce_text(result.deliverable.content_structure.get("executive_summary"))
            or result.deliverable.title
        )[:240]
        run.completed_at = datetime.now(timezone.utc)
        task.status = TaskStatus.COMPLETED.value
        self.db.add_all([task, run, deliverable])
        self.db.commit()
        self.db.refresh(deliverable)
        self.db.refresh(run)
        return deliverable
