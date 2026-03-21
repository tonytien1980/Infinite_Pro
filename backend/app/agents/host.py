from __future__ import annotations

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
from app.domain.enums import FlowMode, RunStatus, TaskStatus
from app.model_router.factory import get_model_provider
from app.services.tasks import get_loaded_task

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
            constraints=[schemas.ConstraintRead.model_validate(item) for item in task.constraints],
            evidence=[schemas.EvidenceRead.model_validate(item) for item in task.evidence],
        )

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
            payload = self.build_payload(task)
            agent = self.registry.get_specialist_agent(agent_id)
            result = self._normalize_result(payload, agent_id, agent.run(payload))
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
