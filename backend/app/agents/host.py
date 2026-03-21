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
from app.domain.enums import ExternalDataStrategy, FlowMode, RunStatus, TaskStatus
from app.model_router.factory import get_model_provider
from app.services.external_search import search_external_sources
from app.services.sources import ingest_remote_urls_for_task
from app.services.tasks import (
    EXTERNAL_DATA_STRATEGY_CONSTRAINT_TYPE,
    get_external_data_strategy_for_task,
    get_loaded_task,
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


@dataclass
class ExternalDataUsageReport:
    strategy: ExternalDataStrategy
    search_attempted: bool = False
    search_used: bool = False
    source_documents: list[models.SourceDocument] = field(default_factory=list)
    dependency_note: str = ""
    missing_information: list[str] = field(default_factory=list)


class HostOrchestrator:
    def __init__(self, db: Session):
        self.db = db
        self.registry = AgentRegistry(model_provider=get_model_provider())

    def determine_flow_mode(self, task: models.Task) -> FlowMode:
        if task.mode == FlowMode.MULTI_AGENT.value:
            return FlowMode.MULTI_AGENT
        return FlowMode.SPECIALIST

    def route_specialist(self, task: models.Task) -> str:
        if task.task_type == "contract_review":
            return "contract_review"
        if task.task_type == "research_synthesis":
            return "research_synthesis"
        if task.task_type == "document_restructuring":
            return "document_restructuring"
        raise HTTPException(
            status_code=400,
            detail=f"任務類型「{task.task_type}」目前尚未實作對應的 specialist flow。",
        )

    def build_payload(self, task: models.Task) -> AgentInputPayload:
        latest_context = task.contexts[-1].summary if task.contexts else ""
        return AgentInputPayload(
            task_id=task.id,
            title=task.title,
            description=task.description,
            task_type=task.task_type,
            flow_mode=self.determine_flow_mode(task),
            background_text=latest_context,
            subjects=[schemas.SubjectRead.model_validate(item) for item in task.subjects],
            goals=[schemas.GoalRead.model_validate(item) for item in task.goals],
            constraints=[
                schemas.ConstraintRead.model_validate(item)
                for item in task.constraints
                if item.constraint_type != EXTERNAL_DATA_STRATEGY_CONSTRAINT_TYPE
            ],
            evidence=[schemas.EvidenceRead.model_validate(item) for item in task.evidence],
        )

    def _build_search_query(self, task: models.Task) -> str:
        query_parts = [
            task.description.strip(),
            *(subject.name.strip() for subject in task.subjects if subject.name.strip()),
            *(goal.description.strip() for goal in task.goals if goal.description.strip()),
        ]
        query = " ".join(part for part in query_parts if part).strip()
        return (query or task.title).strip()[:240]

    def _should_search_external_sources(
        self,
        task: models.Task,
        strategy: ExternalDataStrategy,
    ) -> bool:
        if strategy == ExternalDataStrategy.STRICT:
            return False

        if strategy == ExternalDataStrategy.LATEST:
            return True

        if task.task_type == "contract_review":
            return False

        processed_internal_sources = [
            item
            for item in task.uploads
            if item.ingest_status == "processed" and item.source_type != "external_search"
        ]
        required_source_count = 2 if task.mode == FlowMode.MULTI_AGENT.value else 1
        return len(processed_internal_sources) < required_source_count

    def _prepare_external_data_usage(
        self,
        task: models.Task,
    ) -> tuple[models.Task, ExternalDataUsageReport]:
        strategy = get_external_data_strategy_for_task(task)
        report = ExternalDataUsageReport(strategy=strategy)
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

        if not self._should_search_external_sources(task, strategy):
            report.dependency_note = "本輪未啟用 Host 外部搜尋，分析主要依賴你提供的資料。"
            return task, report

        report.search_attempted = True
        search_query = self._build_search_query(task)
        logger.info(
            "Host considering external search for task %s strategy=%s query=%s",
            task.id,
            strategy.value,
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

    @staticmethod
    def _tail(items: list[models.Insight] | list[models.Risk] | list[models.Recommendation] | list[models.ActionItem], count: int):
        if count <= 0:
            return []
        return items[-count:]

    def _normalize_result(self, payload: AgentInputPayload, agent_id: str, result: AgentResult) -> AgentResult:
        content = dict(result.deliverable.content_structure or {})
        missing_information = list(content.get("missing_information") or [])

        for key in REQUIRED_DELIVERABLE_KEYS:
            if key not in content:
                content[key] = [] if key in {"findings", "risks", "recommendations", "action_items", "missing_information"} else ""
                missing_information.append(f"代理沒有提供「{key}」區段，因此 Host 已補上一個明確占位。")

        if not content["problem_definition"]:
            content["problem_definition"] = payload.description or payload.title
            missing_information.append("由於代理輸出遺漏問題定義，Host 已依據任務內容補上推定版本。")
        if not content["background_summary"]:
            content["background_summary"] = payload.background_text or "目前尚無可用的背景摘要。"
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

    def orchestrate_task(self, task_id: str) -> schemas.ResearchRunResponse:
        task = get_loaded_task(self.db, task_id)
        workflow_mode = self.determine_flow_mode(task)
        logger.info(
            "Host orchestrating task %s with task_type=%s flow_mode=%s",
            task.id,
            task.task_type,
            workflow_mode.value,
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
            task, external_data_report = self._prepare_external_data_usage(task)
            payload = self.build_payload(task)
            fixed_core_agents = [
                "strategy_business_analysis",
                "market_research_insight",
                "operations",
                "risk_challenge",
            ]
            logger.info(
                "Starting multi-agent flow for task %s with agents=%s",
                task.id,
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
            converged = self._annotate_external_data_usage(converged, external_data_report)
            deliverable = self.persist_result(task=task, run=run, result=converged)
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
        new_insights = [
            schemas.InsightRead.model_validate(item)
            for item in self._tail(refreshed_task.insights, len(converged.insights))
        ]
        new_risks = [
            schemas.RiskRead.model_validate(item)
            for item in self._tail(refreshed_task.risks, len(converged.risks))
        ]
        new_recommendations = [
            schemas.RecommendationRead.model_validate(item)
            for item in self._tail(refreshed_task.recommendations, len(converged.recommendations))
        ]
        new_action_items = [
            schemas.ActionItemRead.model_validate(item)
            for item in self._tail(refreshed_task.action_items, len(converged.action_items))
        ]

        return schemas.ResearchRunResponse(
            task_id=refreshed_task.id,
            run=schemas.TaskRunRead.model_validate(run),
            deliverable=schemas.DeliverableRead.model_validate(deliverable),
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
                    "problem_definition": payload.description or payload.title,
                    "background_summary": payload.background_text or "目前尚無可用的背景摘要。",
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
        agent_id = self.route_specialist(task)
        logger.info(
            "Starting specialist flow for task %s with specialist=%s",
            task.id,
            agent_id,
        )
        task.status = TaskStatus.RUNNING.value
        run = models.TaskRun(
            task_id=task.id,
            agent_id=agent_id,
            flow_mode=workflow_mode.value,
            status=RunStatus.RUNNING.value,
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        task = get_loaded_task(self.db, task.id)

        try:
            task, external_data_report = self._prepare_external_data_usage(task)
            payload = self.build_payload(task)
            agent = self.registry.get_specialist_agent(agent_id)
            result = self._normalize_result(payload, agent_id, agent.run(payload))
            result = self._annotate_external_data_usage(result, external_data_report)
            deliverable = self.persist_result(task=task, run=run, result=result)
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
        new_insights = [
            schemas.InsightRead.model_validate(item)
            for item in self._tail(refreshed_task.insights, len(result.insights))
        ]
        new_risks = [
            schemas.RiskRead.model_validate(item)
            for item in self._tail(refreshed_task.risks, len(result.risks))
        ]
        new_recommendations = [
            schemas.RecommendationRead.model_validate(item)
            for item in self._tail(refreshed_task.recommendations, len(result.recommendations))
        ]
        new_action_items = [
            schemas.ActionItemRead.model_validate(item)
            for item in self._tail(refreshed_task.action_items, len(result.action_items))
        ]

        return schemas.ResearchRunResponse(
            task_id=refreshed_task.id,
            run=schemas.TaskRunRead.model_validate(run),
            deliverable=schemas.DeliverableRead.model_validate(deliverable),
            insights=new_insights,
            risks=new_risks,
            recommendations=new_recommendations,
            action_items=new_action_items,
        )

    def persist_result(
        self,
        task: models.Task,
        run: models.TaskRun,
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
        for risk in result.risks:
            self.db.add(
                models.Risk(
                    task_id=task.id,
                    title=risk.title,
                    description=risk.description,
                    risk_type=risk.risk_type,
                    impact_level=risk.impact_level,
                    likelihood_level=risk.likelihood_level,
                    evidence_refs=risk.evidence_refs,
                )
            )
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
        for recommendation in result.recommendations:
            self.db.add(
                models.Recommendation(
                    task_id=task.id,
                    summary=recommendation.summary,
                    rationale=recommendation.rationale,
                    based_on_refs=recommendation.based_on_refs,
                    priority=recommendation.priority,
                    owner_suggestion=recommendation.owner_suggestion,
                )
            )
        for action_item in result.action_items:
            self.db.add(
                models.ActionItem(
                    task_id=task.id,
                    description=action_item.description,
                    suggested_owner=action_item.suggested_owner,
                    priority=action_item.priority,
                    due_hint=action_item.due_hint,
                    dependency_refs=action_item.dependency_refs,
                    status=action_item.status,
                )
            )

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

        run.status = RunStatus.COMPLETED.value
        run.summary = result.deliverable.title
        run.completed_at = datetime.now(timezone.utc)
        task.status = TaskStatus.COMPLETED.value
        self.db.add_all([task, run, deliverable])
        self.db.commit()
        self.db.refresh(deliverable)
        self.db.refresh(run)
        return deliverable
