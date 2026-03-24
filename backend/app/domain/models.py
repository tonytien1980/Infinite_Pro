from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    task_type: Mapped[str] = mapped_column(String(100), default="research_synthesis")
    mode: Mapped[str] = mapped_column(String(50), default="specialist")
    status: Mapped[str] = mapped_column(String(50), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    clients: Mapped[list["Client"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="Client.created_at"
    )
    engagements: Mapped[list["Engagement"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="Engagement.created_at"
    )
    workstreams: Mapped[list["Workstream"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="Workstream.created_at"
    )
    decision_contexts: Mapped[list["DecisionContext"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="DecisionContext.created_at"
    )
    contexts: Mapped[list["TaskContext"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="TaskContext.version"
    )
    subjects: Mapped[list["Subject"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    goals: Mapped[list["Goal"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    constraints: Mapped[list["Constraint"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    uploads: Mapped[list["SourceDocument"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    source_materials: Mapped[list["SourceMaterial"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="SourceMaterial.created_at"
    )
    artifacts: Mapped[list["Artifact"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="Artifact.created_at"
    )
    evidence: Mapped[list["Evidence"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    insights: Mapped[list["Insight"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    risks: Mapped[list["Risk"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    options: Mapped[list["Option"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    recommendations: Mapped[list["Recommendation"]] = relationship(
        back_populates="task", cascade="all, delete-orphan"
    )
    action_items: Mapped[list["ActionItem"]] = relationship(
        back_populates="task", cascade="all, delete-orphan"
    )
    deliverables: Mapped[list["Deliverable"]] = relationship(
        back_populates="task", cascade="all, delete-orphan"
    )
    recommendation_evidence_links: Mapped[list["RecommendationEvidenceLink"]] = relationship(
        back_populates="task", cascade="all, delete-orphan"
    )
    risk_evidence_links: Mapped[list["RiskEvidenceLink"]] = relationship(
        back_populates="task", cascade="all, delete-orphan"
    )
    action_item_evidence_links: Mapped[list["ActionItemEvidenceLink"]] = relationship(
        back_populates="task", cascade="all, delete-orphan"
    )
    deliverable_object_links: Mapped[list["DeliverableObjectLink"]] = relationship(
        back_populates="task", cascade="all, delete-orphan"
    )
    matter_workspace_links: Mapped[list["MatterWorkspaceTaskLink"]] = relationship(
        back_populates="task", cascade="all, delete-orphan"
    )
    runs: Mapped[list["TaskRun"]] = relationship(back_populates="task", cascade="all, delete-orphan")


class MatterWorkspace(Base):
    __tablename__ = "matter_workspaces"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    matter_key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    client_name: Mapped[str] = mapped_column(String(255), default="")
    engagement_name: Mapped[str] = mapped_column(String(255), default="")
    workstream_name: Mapped[str] = mapped_column(String(255), default="")
    client_type: Mapped[str] = mapped_column(String(100), default="未指定")
    client_stage: Mapped[str] = mapped_column(String(100), default="未指定")
    domain_lenses: Mapped[list[str]] = mapped_column(JSON, default=list)
    current_decision_context_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    current_decision_context_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    task_links: Mapped[list["MatterWorkspaceTaskLink"]] = relationship(
        back_populates="matter_workspace",
        cascade="all, delete-orphan",
        order_by="MatterWorkspaceTaskLink.created_at",
    )


class MatterWorkspaceTaskLink(Base):
    __tablename__ = "matter_workspace_task_links"
    __table_args__ = (
        UniqueConstraint("matter_workspace_id", "task_id", name="uq_matter_workspace_task_link"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    matter_workspace_id: Mapped[str] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=False,
    )
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    matter_workspace: Mapped["MatterWorkspace"] = relationship(back_populates="task_links")
    task: Mapped["Task"] = relationship(back_populates="matter_workspace_links")


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    client_type: Mapped[str] = mapped_column(String(100), default="未指定")
    client_stage: Mapped[str] = mapped_column(String(100), default="未指定")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="clients")
    engagements: Mapped[list["Engagement"]] = relationship(back_populates="client")
    decision_contexts: Mapped[list["DecisionContext"]] = relationship(back_populates="client")


class Engagement(Base):
    __tablename__ = "engagements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    client_id: Mapped[str | None] = mapped_column(ForeignKey("clients.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="engagements")
    client: Mapped["Client | None"] = relationship(back_populates="engagements")
    workstreams: Mapped[list["Workstream"]] = relationship(back_populates="engagement")
    decision_contexts: Mapped[list["DecisionContext"]] = relationship(back_populates="engagement")


class Workstream(Base):
    __tablename__ = "workstreams"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    engagement_id: Mapped[str | None] = mapped_column(ForeignKey("engagements.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    domain_lenses: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="workstreams")
    engagement: Mapped["Engagement | None"] = relationship(back_populates="workstreams")
    decision_contexts: Mapped[list["DecisionContext"]] = relationship(back_populates="workstream")


class DecisionContext(Base):
    __tablename__ = "decision_contexts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    client_id: Mapped[str | None] = mapped_column(ForeignKey("clients.id"), nullable=True)
    engagement_id: Mapped[str | None] = mapped_column(ForeignKey("engagements.id"), nullable=True)
    workstream_id: Mapped[str | None] = mapped_column(ForeignKey("workstreams.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="")
    judgment_to_make: Mapped[str] = mapped_column(Text, default="")
    domain_lenses: Mapped[list[str]] = mapped_column(JSON, default=list)
    client_stage: Mapped[str] = mapped_column(String(100), default="未指定")
    client_type: Mapped[str] = mapped_column(String(100), default="未指定")
    goal_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    constraint_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    assumption_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_priority: Mapped[str | None] = mapped_column(Text, nullable=True)
    external_data_policy: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="decision_contexts")
    client: Mapped["Client | None"] = relationship(back_populates="decision_contexts")
    engagement: Mapped["Engagement | None"] = relationship(back_populates="decision_contexts")
    workstream: Mapped["Workstream | None"] = relationship(back_populates="decision_contexts")


class TaskContext(Base):
    __tablename__ = "task_contexts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="")
    assumptions: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="contexts")


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    subject_type: Mapped[str] = mapped_column(String(100), default="topic")
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)

    task: Mapped["Task"] = relationship(back_populates="subjects")


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    goal_type: Mapped[str] = mapped_column(String(100), default="research_synthesis")
    description: Mapped[str] = mapped_column(Text, nullable=False)
    success_criteria: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(String(50), default="medium")

    task: Mapped["Task"] = relationship(back_populates="goals")


class Constraint(Base):
    __tablename__ = "constraints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    constraint_type: Mapped[str] = mapped_column(String(100), default="general")
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(50), default="medium")

    task: Mapped["Task"] = relationship(back_populates="constraints")


class SourceDocument(Base):
    __tablename__ = "source_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    source_type: Mapped[str] = mapped_column(String(100), default="manual_upload")
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    storage_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    ingest_status: Mapped[str] = mapped_column(String(100), default="processed")
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ingestion_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="uploads")
    source_materials: Mapped[list["SourceMaterial"]] = relationship(back_populates="source_document")
    artifacts: Mapped[list["Artifact"]] = relationship(back_populates="source_document")
    evidence_items: Mapped[list["Evidence"]] = relationship(back_populates="source_document")


class SourceMaterial(Base):
    __tablename__ = "source_materials"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    source_document_id: Mapped[str | None] = mapped_column(ForeignKey("source_documents.id"), nullable=True)
    source_type: Mapped[str] = mapped_column(String(100), default="manual_upload")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    source_ref: Mapped[str] = mapped_column(String(1024), nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ingest_status: Mapped[str] = mapped_column(String(100), default="processed")
    summary: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="source_materials")
    source_document: Mapped["SourceDocument | None"] = relationship(back_populates="source_materials")
    artifacts: Mapped[list["Artifact"]] = relationship(back_populates="source_material")


class Artifact(Base):
    __tablename__ = "artifacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    source_document_id: Mapped[str | None] = mapped_column(ForeignKey("source_documents.id"), nullable=True)
    source_material_id: Mapped[str | None] = mapped_column(ForeignKey("source_materials.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    artifact_type: Mapped[str] = mapped_column(String(100), default="source_artifact")
    description: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="artifacts")
    source_document: Mapped["SourceDocument | None"] = relationship(back_populates="artifacts")
    source_material: Mapped["SourceMaterial | None"] = relationship(back_populates="artifacts")


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    source_document_id: Mapped[str | None] = mapped_column(ForeignKey("source_documents.id"), nullable=True)
    evidence_type: Mapped[str] = mapped_column(String(100), default="source_excerpt")
    source_type: Mapped[str] = mapped_column(String(100), default="manual_input")
    source_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    excerpt_or_summary: Mapped[str] = mapped_column(Text, default="")
    reliability_level: Mapped[str] = mapped_column(String(50), default="user_provided")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="evidence")
    source_document: Mapped["SourceDocument | None"] = relationship(back_populates="evidence_items")
    recommendation_links: Mapped[list["RecommendationEvidenceLink"]] = relationship(
        back_populates="evidence", cascade="all, delete-orphan"
    )
    risk_links: Mapped[list["RiskEvidenceLink"]] = relationship(
        back_populates="evidence", cascade="all, delete-orphan"
    )
    action_item_links: Mapped[list["ActionItemEvidenceLink"]] = relationship(
        back_populates="evidence", cascade="all, delete-orphan"
    )


class Insight(Base):
    __tablename__ = "insights"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    generated_by: Mapped[str] = mapped_column(String(100), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_refs: Mapped[list[str]] = mapped_column(JSON, default=list)
    confidence_level: Mapped[str] = mapped_column(String(50), default="medium")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="insights")


class Risk(Base):
    __tablename__ = "risks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    risk_type: Mapped[str] = mapped_column(String(100), default="general")
    impact_level: Mapped[str] = mapped_column(String(50), default="medium")
    likelihood_level: Mapped[str] = mapped_column(String(50), default="medium")
    evidence_refs: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="risks")
    supporting_evidence_links: Mapped[list["RiskEvidenceLink"]] = relationship(
        back_populates="risk", cascade="all, delete-orphan"
    )


class Option(Base):
    __tablename__ = "options"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    pros: Mapped[list[str]] = mapped_column(JSON, default=list)
    cons: Mapped[list[str]] = mapped_column(JSON, default=list)
    related_risk_refs: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="options")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    based_on_refs: Mapped[list[str]] = mapped_column(JSON, default=list)
    priority: Mapped[str] = mapped_column(String(50), default="medium")
    owner_suggestion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="recommendations")
    supporting_evidence_links: Mapped[list["RecommendationEvidenceLink"]] = relationship(
        back_populates="recommendation", cascade="all, delete-orphan"
    )


class ActionItem(Base):
    __tablename__ = "action_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_owner: Mapped[str | None] = mapped_column(String(255), nullable=True)
    priority: Mapped[str] = mapped_column(String(50), default="medium")
    due_hint: Mapped[str | None] = mapped_column(String(255), nullable=True)
    dependency_refs: Mapped[list[str]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(50), default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="action_items")
    supporting_evidence_links: Mapped[list["ActionItemEvidenceLink"]] = relationship(
        back_populates="action_item", cascade="all, delete-orphan"
    )


class Deliverable(Base):
    __tablename__ = "deliverables"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    task_run_id: Mapped[str | None] = mapped_column(ForeignKey("task_runs.id"), nullable=True)
    deliverable_type: Mapped[str] = mapped_column(String(100), default="research_synthesis")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_structure: Mapped[dict] = mapped_column(JSON, default=dict)
    version: Mapped[int] = mapped_column(Integer, default=1)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="deliverables")
    task_run: Mapped["TaskRun | None"] = relationship(back_populates="deliverables")
    object_links: Mapped[list["DeliverableObjectLink"]] = relationship(
        back_populates="deliverable", cascade="all, delete-orphan"
    )


class RecommendationEvidenceLink(Base):
    __tablename__ = "recommendation_evidence_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    recommendation_id: Mapped[str] = mapped_column(ForeignKey("recommendations.id"), nullable=False)
    evidence_id: Mapped[str] = mapped_column(ForeignKey("evidence.id"), nullable=False)
    relation_type: Mapped[str] = mapped_column(String(50), default="supports")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="recommendation_evidence_links")
    recommendation: Mapped["Recommendation"] = relationship(back_populates="supporting_evidence_links")
    evidence: Mapped["Evidence"] = relationship(back_populates="recommendation_links")


class RiskEvidenceLink(Base):
    __tablename__ = "risk_evidence_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    risk_id: Mapped[str] = mapped_column(ForeignKey("risks.id"), nullable=False)
    evidence_id: Mapped[str] = mapped_column(ForeignKey("evidence.id"), nullable=False)
    relation_type: Mapped[str] = mapped_column(String(50), default="supports")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="risk_evidence_links")
    risk: Mapped["Risk"] = relationship(back_populates="supporting_evidence_links")
    evidence: Mapped["Evidence"] = relationship(back_populates="risk_links")


class ActionItemEvidenceLink(Base):
    __tablename__ = "action_item_evidence_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    action_item_id: Mapped[str] = mapped_column(ForeignKey("action_items.id"), nullable=False)
    evidence_id: Mapped[str] = mapped_column(ForeignKey("evidence.id"), nullable=False)
    relation_type: Mapped[str] = mapped_column(String(50), default="depends_on_evidence")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="action_item_evidence_links")
    action_item: Mapped["ActionItem"] = relationship(back_populates="supporting_evidence_links")
    evidence: Mapped["Evidence"] = relationship(back_populates="action_item_links")


class DeliverableObjectLink(Base):
    __tablename__ = "deliverable_object_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    deliverable_id: Mapped[str] = mapped_column(ForeignKey("deliverables.id"), nullable=False)
    object_type: Mapped[str] = mapped_column(String(100), nullable=False)
    object_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    object_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    relation_type: Mapped[str] = mapped_column(String(50), default="references")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="deliverable_object_links")
    deliverable: Mapped["Deliverable"] = relationship(back_populates="object_links")


class TaskRun(Base):
    __tablename__ = "task_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    agent_id: Mapped[str] = mapped_column(String(100), nullable=False)
    flow_mode: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="running")
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    task: Mapped["Task"] = relationship(back_populates="runs")
    deliverables: Mapped[list["Deliverable"]] = relationship(back_populates="task_run")
