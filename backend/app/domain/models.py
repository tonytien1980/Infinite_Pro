from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
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

    contexts: Mapped[list["TaskContext"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="TaskContext.version"
    )
    subjects: Mapped[list["Subject"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    goals: Mapped[list["Goal"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    constraints: Mapped[list["Constraint"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    uploads: Mapped[list["SourceDocument"]] = relationship(back_populates="task", cascade="all, delete-orphan")
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
    runs: Mapped[list["TaskRun"]] = relationship(back_populates="task", cascade="all, delete-orphan")


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
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="uploads")
    evidence_items: Mapped[list["Evidence"]] = relationship(back_populates="source_document")


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
