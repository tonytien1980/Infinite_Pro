from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.agents.base import AgentInputPayload, AgentResult
from app.agents.registry import AgentRegistry
from app.domain import models, schemas
from app.domain.enums import FlowMode, RunStatus, TaskStatus
from app.model_router.factory import get_model_provider
from app.services.tasks import get_loaded_task


class HostOrchestrator:
    def __init__(self, db: Session):
        self.db = db
        self.registry = AgentRegistry(model_provider=get_model_provider())

    def determine_flow_mode(self, task: models.Task) -> FlowMode:
        if task.mode == FlowMode.MULTI_AGENT.value:
            return FlowMode.MULTI_AGENT
        return FlowMode.SPECIALIST

    def route_specialist(self, task: models.Task) -> str:
        if task.task_type == "research_synthesis":
            return "research_synthesis"
        raise HTTPException(
            status_code=400,
            detail=f"Task type '{task.task_type}' does not have an implemented specialist flow yet.",
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

    def run_research_synthesis(self, task_id: str) -> schemas.ResearchRunResponse:
        task = get_loaded_task(self.db, task_id)
        flow_mode = self.determine_flow_mode(task)
        if flow_mode == FlowMode.MULTI_AGENT:
            raise HTTPException(
                status_code=501,
                detail="The full multi-agent flow is scaffolded but not implemented in this MVP slice yet.",
            )

        agent_id = self.route_specialist(task)
        task.status = TaskStatus.RUNNING.value
        run = models.TaskRun(
            task_id=task.id,
            agent_id=agent_id,
            flow_mode=flow_mode.value,
            status=RunStatus.RUNNING.value,
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        task = get_loaded_task(self.db, task_id)

        try:
            payload = self.build_payload(task)
            agent = self.registry.get_specialist_agent(agent_id)
            result = agent.run(payload)
            deliverable = self.persist_result(task=task, run=run, result=result)
        except Exception as exc:
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
