from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    LargeBinary,
    String,
    Text,
    UniqueConstraint,
)
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
    entry_preset: Mapped[str] = mapped_column(String(50), default="one_line_inquiry")
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
    chunk_objects: Mapped[list["ChunkObject"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="ChunkObject.created_at"
    )
    media_references: Mapped[list["MediaReference"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="MediaReference.created_at"
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
    case_world_drafts: Mapped[list["CaseWorldDraft"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="CaseWorldDraft.updated_at.desc()"
    )
    evidence_gaps: Mapped[list["EvidenceGap"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="EvidenceGap.updated_at.desc()"
    )
    research_runs: Mapped[list["ResearchRun"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="ResearchRun.started_at.desc()"
    )
    decision_records: Mapped[list["DecisionRecord"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="DecisionRecord.created_at.desc()"
    )
    action_plans: Mapped[list["ActionPlan"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="ActionPlan.created_at.desc()"
    )
    action_executions: Mapped[list["ActionExecution"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="ActionExecution.updated_at.desc()"
    )
    outcome_records: Mapped[list["OutcomeRecord"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="OutcomeRecord.created_at.desc()"
    )
    audit_events: Mapped[list["AuditEvent"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="AuditEvent.created_at.desc()"
    )
    adoption_feedback_records: Mapped[list["AdoptionFeedback"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="AdoptionFeedback.updated_at.desc()"
    )
    precedent_candidates: Mapped[list["PrecedentCandidate"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="PrecedentCandidate.updated_at.desc()",
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
    object_sets: Mapped[list["ObjectSet"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="ObjectSet.updated_at.desc()",
    )
    matter_workspace_links: Mapped[list["MatterWorkspaceTaskLink"]] = relationship(
        back_populates="task", cascade="all, delete-orphan"
    )
    object_participation_links: Mapped[list["TaskObjectParticipationLink"]] = relationship(
        back_populates="task", cascade="all, delete-orphan", order_by="TaskObjectParticipationLink.created_at"
    )
    runs: Mapped[list["TaskRun"]] = relationship(back_populates="task", cascade="all, delete-orphan")


class Firm(Base):
    __tablename__ = "firms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    memberships: Mapped[list["FirmMembership"]] = relationship(
        back_populates="firm",
        cascade="all, delete-orphan",
        order_by="FirmMembership.created_at.asc()",
    )
    invites: Mapped[list["FirmInvite"]] = relationship(
        back_populates="firm",
        cascade="all, delete-orphan",
        order_by="FirmInvite.created_at.desc()",
    )
    provider_allowlist_entries: Mapped[list["ProviderAllowlistEntry"]] = relationship(
        back_populates="firm",
        cascade="all, delete-orphan",
        order_by="ProviderAllowlistEntry.updated_at.desc()",
    )
    demo_workspace_policy: Mapped["DemoWorkspacePolicy | None"] = relationship(
        back_populates="firm",
        cascade="all, delete-orphan",
        uselist=False,
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), default="")
    avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    auth_identities: Mapped[list["AuthIdentity"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="AuthIdentity.created_at.asc()",
    )
    memberships: Mapped[list["FirmMembership"]] = relationship(
        back_populates="user",
        foreign_keys="FirmMembership.user_id",
        cascade="all, delete-orphan",
        order_by="FirmMembership.created_at.asc()",
    )
    invited_memberships: Mapped[list["FirmMembership"]] = relationship(
        back_populates="invited_by_user",
        foreign_keys="FirmMembership.invited_by_user_id",
    )
    invited_member_invites: Mapped[list["FirmInvite"]] = relationship(
        back_populates="invited_by_user",
        foreign_keys="FirmInvite.invited_by_user_id",
    )
    sessions: Mapped[list["UserSession"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="UserSession.created_at.desc()",
    )
    personal_provider_credentials: Mapped[list["PersonalProviderCredential"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="PersonalProviderCredential.updated_at.desc()",
    )


class AuthIdentity(Base):
    __tablename__ = "auth_identities"
    __table_args__ = (
        UniqueConstraint("provider", "provider_subject", name="uq_auth_identity_provider_subject"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False, default="google")
    provider_subject: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user: Mapped["User"] = relationship(back_populates="auth_identities")


class FirmMembership(Base):
    __tablename__ = "firm_memberships"
    __table_args__ = (
        UniqueConstraint("firm_id", "user_id", name="uq_firm_membership_user"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    firm_id: Mapped[str] = mapped_column(ForeignKey("firms.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=False, default="consultant")
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="active")
    invited_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    firm: Mapped["Firm"] = relationship(back_populates="memberships")
    user: Mapped["User"] = relationship(
        back_populates="memberships",
        foreign_keys=[user_id],
    )
    invited_by_user: Mapped["User | None"] = relationship(
        back_populates="invited_memberships",
        foreign_keys=[invited_by_user_id],
    )
    sessions: Mapped[list["UserSession"]] = relationship(
        back_populates="membership",
        cascade="all, delete-orphan",
        order_by="UserSession.created_at.desc()",
    )


class FirmInvite(Base):
    __tablename__ = "firm_invites"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    firm_id: Mapped[str] = mapped_column(ForeignKey("firms.id"), nullable=False)
    invited_email: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=False, default="consultant")
    invite_token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="pending")
    invited_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    firm: Mapped["Firm"] = relationship(back_populates="invites")
    invited_by_user: Mapped["User | None"] = relationship(
        back_populates="invited_member_invites",
        foreign_keys=[invited_by_user_id],
    )


class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    membership_id: Mapped[str] = mapped_column(ForeignKey("firm_memberships.id"), nullable=False)
    session_token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="active")
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user: Mapped["User"] = relationship(back_populates="sessions")
    membership: Mapped["FirmMembership"] = relationship(back_populates="sessions")


class PersonalProviderCredential(Base):
    __tablename__ = "personal_provider_credentials"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_personal_provider_credential_user"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    provider_id: Mapped[str] = mapped_column(String(50), nullable=False)
    model_level: Mapped[str] = mapped_column(String(30), default="balanced")
    model_id: Mapped[str] = mapped_column(String(255), nullable=False)
    custom_model_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    base_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=60)
    api_key_ciphertext: Mapped[str | None] = mapped_column(Text, nullable=True)
    api_key_masked: Mapped[str | None] = mapped_column(String(32), nullable=True)
    last_validation_status: Mapped[str] = mapped_column(String(50), default="not_validated")
    last_validation_message: Mapped[str] = mapped_column(Text, default="")
    last_validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    key_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user: Mapped["User"] = relationship(back_populates="personal_provider_credentials")


class ProviderAllowlistEntry(Base):
    __tablename__ = "provider_allowlist_entries"
    __table_args__ = (
        UniqueConstraint("firm_id", "provider_id", "model_level", name="uq_provider_allowlist_entry"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    firm_id: Mapped[str] = mapped_column(ForeignKey("firms.id"), nullable=False)
    provider_id: Mapped[str] = mapped_column(String(50), nullable=False)
    model_level: Mapped[str] = mapped_column(String(30), nullable=False, default="balanced")
    allowed_model_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    allow_custom_model: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(30), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    firm: Mapped["Firm"] = relationship(back_populates="provider_allowlist_entries")


class DemoWorkspacePolicy(Base):
    __tablename__ = "demo_workspace_policies"
    __table_args__ = (
        UniqueConstraint("firm_id", name="uq_demo_workspace_policy_firm"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    firm_id: Mapped[str] = mapped_column(ForeignKey("firms.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="active")
    workspace_slug: Mapped[str] = mapped_column(String(60), default="demo")
    seed_version: Mapped[str] = mapped_column(String(30), default="v1")
    max_active_demo_members: Mapped[int] = mapped_column(Integer, default=5)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    firm: Mapped["Firm"] = relationship(back_populates="demo_workspace_policy")


class WorkbenchPreference(Base):
    __tablename__ = "workbench_preferences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    profile_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    interface_language: Mapped[str] = mapped_column(String(20), default="zh-Hant")
    theme_preference: Mapped[str] = mapped_column(String(20), default="light")
    homepage_display_preference: Mapped[str] = mapped_column(String(50), default="matters")
    history_default_page_size: Mapped[int] = mapped_column(Integer, default=20)
    show_recent_activity: Mapped[bool] = mapped_column(Boolean, default=True)
    show_frequent_extensions: Mapped[bool] = mapped_column(Boolean, default=True)
    new_task_default_input_mode: Mapped[str] = mapped_column(
        String(50),
        default="one_line_inquiry",
    )
    density: Mapped[str] = mapped_column(String(20), default="standard")
    deliverable_sort_preference: Mapped[str] = mapped_column(
        String(50),
        default="updated_desc",
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class SystemProviderConfig(Base):
    __tablename__ = "system_provider_configs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    scope_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    provider_id: Mapped[str] = mapped_column(String(50), nullable=False)
    model_level: Mapped[str] = mapped_column(String(30), default="balanced")
    model_id: Mapped[str] = mapped_column(String(255), nullable=False)
    custom_model_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    base_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=60)
    api_key_secret: Mapped[str | None] = mapped_column(Text, nullable=True)
    api_key_masked: Mapped[str | None] = mapped_column(String(32), nullable=True)
    config_source: Mapped[str] = mapped_column(String(30), default="runtime_config")
    last_validation_status: Mapped[str] = mapped_column(String(50), default="not_validated")
    last_validation_message: Mapped[str] = mapped_column(Text, default="")
    last_validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    key_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    events: Mapped[list["SystemProviderConfigEvent"]] = relationship(
        back_populates="config",
        order_by="SystemProviderConfigEvent.created_at.desc()",
    )


class SystemProviderConfigEvent(Base):
    __tablename__ = "system_provider_config_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    scope_key: Mapped[str] = mapped_column(String(100), nullable=False)
    config_id: Mapped[str | None] = mapped_column(
        ForeignKey("system_provider_configs.id"),
        nullable=True,
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="")
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    config: Mapped["SystemProviderConfig | None"] = relationship(back_populates="events")


class WorkbenchExtensionState(Base):
    __tablename__ = "workbench_extension_states"
    __table_args__ = (
        UniqueConstraint(
            "profile_key",
            "extension_kind",
            "extension_id",
            name="uq_workbench_extension_state",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    profile_key: Mapped[str] = mapped_column(String(100), nullable=False)
    extension_kind: Mapped[str] = mapped_column(String(20), nullable=False)
    extension_id: Mapped[str] = mapped_column(String(255), nullable=False)
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class TaskVisibilityState(Base):
    __tablename__ = "task_visibility_states"
    __table_args__ = (
        UniqueConstraint("profile_key", "task_id", name="uq_task_visibility_state"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    profile_key: Mapped[str] = mapped_column(String(100), nullable=False)
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    visibility_state: Mapped[str] = mapped_column(String(20), default="visible")
    hidden_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    task: Mapped["Task"] = relationship()


class MatterWorkspace(Base):
    __tablename__ = "matter_workspaces"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    matter_key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    content_sections: Mapped[dict] = mapped_column(JSON, default=dict)
    title_override_active: Mapped[bool] = mapped_column(Boolean, default=False)
    client_name: Mapped[str] = mapped_column(String(255), default="")
    engagement_name: Mapped[str] = mapped_column(String(255), default="")
    workstream_name: Mapped[str] = mapped_column(String(255), default="")
    client_type: Mapped[str] = mapped_column(String(100), default="未指定")
    client_stage: Mapped[str] = mapped_column(String(100), default="未指定")
    domain_lenses: Mapped[list[str]] = mapped_column(JSON, default=list)
    current_decision_context_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    current_decision_context_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    engagement_continuity_mode: Mapped[str] = mapped_column(String(30), default="one_off")
    writeback_depth: Mapped[str] = mapped_column(String(30), default="minimal")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    task_links: Mapped[list["MatterWorkspaceTaskLink"]] = relationship(
        back_populates="matter_workspace",
        cascade="all, delete-orphan",
        order_by="MatterWorkspaceTaskLink.created_at",
    )
    content_revisions: Mapped[list["MatterContentRevision"]] = relationship(
        back_populates="matter_workspace",
        cascade="all, delete-orphan",
        order_by="MatterContentRevision.created_at.desc()",
    )
    case_world_state: Mapped["CaseWorldState | None"] = relationship(
        back_populates="matter_workspace",
        cascade="all, delete-orphan",
        uselist=False,
    )
    case_world_drafts: Mapped[list["CaseWorldDraft"]] = relationship(
        back_populates="matter_workspace",
        order_by="CaseWorldDraft.updated_at.desc()",
    )
    evidence_gaps: Mapped[list["EvidenceGap"]] = relationship(
        back_populates="matter_workspace",
        order_by="EvidenceGap.updated_at.desc()",
    )
    research_runs: Mapped[list["ResearchRun"]] = relationship(
        back_populates="matter_workspace",
        order_by="ResearchRun.started_at.desc()",
    )
    decision_records: Mapped[list["DecisionRecord"]] = relationship(
        back_populates="matter_workspace",
        order_by="DecisionRecord.created_at.desc()",
    )
    action_plans: Mapped[list["ActionPlan"]] = relationship(
        back_populates="matter_workspace",
        order_by="ActionPlan.created_at.desc()",
    )
    outcome_records: Mapped[list["OutcomeRecord"]] = relationship(
        back_populates="matter_workspace",
        order_by="OutcomeRecord.created_at.desc()",
    )
    canonicalization_reviews: Mapped[list["MatterCanonicalizationReview"]] = relationship(
        back_populates="matter_workspace",
        cascade="all, delete-orphan",
        order_by="MatterCanonicalizationReview.updated_at.desc()",
    )
    precedent_duplicate_reviews: Mapped[list["MatterPrecedentDuplicateReview"]] = relationship(
        back_populates="matter_workspace",
        cascade="all, delete-orphan",
        order_by="MatterPrecedentDuplicateReview.updated_at.desc()",
    )
    object_sets: Mapped[list["ObjectSet"]] = relationship(
        back_populates="matter_workspace",
        order_by="ObjectSet.updated_at.desc()",
    )
    precedent_candidates: Mapped[list["PrecedentCandidate"]] = relationship(
        back_populates="matter_workspace",
        cascade="all, delete-orphan",
        order_by="PrecedentCandidate.updated_at.desc()",
    )


class MatterContentRevision(Base):
    __tablename__ = "matter_content_revisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    matter_workspace_id: Mapped[str] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=False,
    )
    source: Mapped[str] = mapped_column(String(50), default="manual_edit")
    revision_summary: Mapped[str] = mapped_column(Text, default="")
    changed_sections: Mapped[list[str]] = mapped_column(JSON, default=list)
    diff_summary: Mapped[list[dict]] = mapped_column(JSON, default=list)
    snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    rollback_target_revision_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    matter_workspace: Mapped["MatterWorkspace"] = relationship(back_populates="content_revisions")


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


class MatterCanonicalizationReview(Base):
    __tablename__ = "matter_canonicalization_reviews"
    __table_args__ = (
        UniqueConstraint(
            "matter_workspace_id",
            "review_key",
            name="uq_matter_canonicalization_review",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    matter_workspace_id: Mapped[str] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=False,
    )
    object_family: Mapped[str] = mapped_column(String(50), default="source_chain")
    match_basis: Mapped[str] = mapped_column(String(50), default="display_name_match")
    review_key: Mapped[str] = mapped_column(String(120), nullable=False)
    review_status: Mapped[str] = mapped_column(String(50), default="pending_review")
    confidence_level: Mapped[str] = mapped_column(String(30), default="medium")
    consultant_summary: Mapped[str] = mapped_column(Text, default="")
    resolution_note: Mapped[str] = mapped_column(Text, default="")
    resolved_by: Mapped[str] = mapped_column(String(100), default="consultant_manual")
    canonical_source_document_id: Mapped[str | None] = mapped_column(
        ForeignKey("source_documents.id"),
        nullable=True,
    )
    canonical_source_material_id: Mapped[str | None] = mapped_column(
        ForeignKey("source_materials.id"),
        nullable=True,
    )
    canonical_artifact_id: Mapped[str | None] = mapped_column(
        ForeignKey("artifacts.id"),
        nullable=True,
    )
    canonical_evidence_id: Mapped[str | None] = mapped_column(
        ForeignKey("evidence.id"),
        nullable=True,
    )
    source_document_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    source_material_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    artifact_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    evidence_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    task_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    matter_workspace: Mapped["MatterWorkspace"] = relationship(back_populates="canonicalization_reviews")


class MatterPrecedentDuplicateReview(Base):
    __tablename__ = "matter_precedent_duplicate_reviews"
    __table_args__ = (
        UniqueConstraint(
            "matter_workspace_id",
            "review_key",
            name="uq_matter_precedent_duplicate_review",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    matter_workspace_id: Mapped[str] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=False,
    )
    object_family: Mapped[str] = mapped_column(String(50), default="precedent")
    match_basis: Mapped[str] = mapped_column(String(50), default="pattern_signature_match")
    review_key: Mapped[str] = mapped_column(String(120), nullable=False)
    review_status: Mapped[str] = mapped_column(String(50), default="pending_review")
    confidence_level: Mapped[str] = mapped_column(String(30), default="medium")
    consultant_summary: Mapped[str] = mapped_column(Text, default="")
    resolution_note: Mapped[str] = mapped_column(Text, default="")
    resolved_by: Mapped[str] = mapped_column(String(100), default="consultant_manual")
    canonical_candidate_id: Mapped[str | None] = mapped_column(
        ForeignKey("precedent_candidates.id"),
        nullable=True,
    )
    candidate_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    task_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    matter_workspace: Mapped["MatterWorkspace"] = relationship(back_populates="precedent_duplicate_reviews")


class TaskObjectParticipationLink(Base):
    __tablename__ = "task_object_participation_links"
    __table_args__ = (
        UniqueConstraint(
            "task_id",
            "object_type",
            "object_id",
            name="uq_task_object_participation",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    object_type: Mapped[str] = mapped_column(String(50), nullable=False)
    object_id: Mapped[str] = mapped_column(String(36), nullable=False)
    canonical_object_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    source_document_id: Mapped[str | None] = mapped_column(
        ForeignKey("source_documents.id"),
        nullable=True,
    )
    source_material_id: Mapped[str | None] = mapped_column(
        ForeignKey("source_materials.id"),
        nullable=True,
    )
    artifact_id: Mapped[str | None] = mapped_column(
        ForeignKey("artifacts.id"),
        nullable=True,
    )
    evidence_id: Mapped[str | None] = mapped_column(
        ForeignKey("evidence.id"),
        nullable=True,
    )
    participation_type: Mapped[str] = mapped_column(String(50), default="shared_usage")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="object_participation_links")


class CaseWorldState(Base):
    __tablename__ = "case_world_states"
    __table_args__ = (
        UniqueConstraint("matter_workspace_id", name="uq_case_world_state_matter"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    matter_workspace_id: Mapped[str] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=False,
    )
    compiler_status: Mapped[str] = mapped_column(String(30), default="compiled")
    world_status: Mapped[str] = mapped_column(String(30), default="active")
    client_id: Mapped[str | None] = mapped_column(ForeignKey("clients.id"), nullable=True)
    engagement_id: Mapped[str | None] = mapped_column(ForeignKey("engagements.id"), nullable=True)
    workstream_id: Mapped[str | None] = mapped_column(ForeignKey("workstreams.id"), nullable=True)
    decision_context_id: Mapped[str | None] = mapped_column(ForeignKey("decision_contexts.id"), nullable=True)
    entry_preset: Mapped[str] = mapped_column(String(50), default="one_line_inquiry")
    continuity_mode: Mapped[str] = mapped_column(String(30), default="one_off")
    writeback_depth: Mapped[str] = mapped_column(String(30), default="minimal")
    world_identity_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    canonical_intake_summary: Mapped[dict] = mapped_column(JSON, default=dict)
    decision_context_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    extracted_objects: Mapped[list[dict]] = mapped_column(JSON, default=list)
    inferred_links: Mapped[list[dict]] = mapped_column(JSON, default=list)
    facts: Mapped[list[dict]] = mapped_column(JSON, default=list)
    assumptions_payload: Mapped[list[dict]] = mapped_column(JSON, default=list)
    evidence_gaps_payload: Mapped[list[dict]] = mapped_column(JSON, default=list)
    selected_capabilities: Mapped[list[str]] = mapped_column(JSON, default=list)
    selected_domain_packs: Mapped[list[str]] = mapped_column(JSON, default=list)
    selected_industry_packs: Mapped[list[str]] = mapped_column(JSON, default=list)
    selected_agent_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    suggested_research_need: Mapped[bool] = mapped_column(Boolean, default=False)
    next_best_actions: Mapped[list[str]] = mapped_column(JSON, default=list)
    active_task_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    latest_task_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    latest_task_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    supplement_count: Mapped[int] = mapped_column(Integer, default=0)
    last_supplement_summary: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    matter_workspace: Mapped["MatterWorkspace"] = relationship(back_populates="case_world_state")


class CaseWorldDraft(Base):
    __tablename__ = "case_world_drafts"
    __table_args__ = (
        UniqueConstraint("task_id", name="uq_case_world_draft_task"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    compiler_status: Mapped[str] = mapped_column(String(30), default="compiled")
    entry_preset: Mapped[str] = mapped_column(String(50), default="one_line_inquiry")
    continuity_mode: Mapped[str] = mapped_column(String(30), default="one_off")
    writeback_depth: Mapped[str] = mapped_column(String(30), default="minimal")
    canonical_intake_summary: Mapped[dict] = mapped_column(JSON, default=dict)
    task_interpretation: Mapped[dict] = mapped_column(JSON, default=dict)
    decision_context_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    extracted_objects: Mapped[list[dict]] = mapped_column(JSON, default=list)
    inferred_links: Mapped[list[dict]] = mapped_column(JSON, default=list)
    facts: Mapped[list[dict]] = mapped_column(JSON, default=list)
    assumptions_payload: Mapped[list[dict]] = mapped_column(JSON, default=list)
    evidence_gaps_payload: Mapped[list[dict]] = mapped_column(JSON, default=list)
    suggested_capabilities: Mapped[list[str]] = mapped_column(JSON, default=list)
    suggested_domain_packs: Mapped[list[str]] = mapped_column(JSON, default=list)
    suggested_industry_packs: Mapped[list[str]] = mapped_column(JSON, default=list)
    suggested_agents: Mapped[list[str]] = mapped_column(JSON, default=list)
    suggested_research_need: Mapped[bool] = mapped_column(Boolean, default=False)
    next_best_actions: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    task: Mapped["Task"] = relationship(back_populates="case_world_drafts")
    matter_workspace: Mapped["MatterWorkspace | None"] = relationship(back_populates="case_world_drafts")


class EvidenceGap(Base):
    __tablename__ = "evidence_gaps"
    __table_args__ = (
        UniqueConstraint("task_id", "gap_key", name="uq_evidence_gap_task_key"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    gap_key: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    gap_type: Mapped[str] = mapped_column(String(100), default="evidence_gap")
    description: Mapped[str] = mapped_column(Text, default="")
    priority: Mapped[str] = mapped_column(String(30), default="medium")
    status: Mapped[str] = mapped_column(String(30), default="open")
    source: Mapped[str] = mapped_column(String(50), default="case_world_compiler")
    supporting_pack_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    related_source_refs: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    task: Mapped["Task"] = relationship(back_populates="evidence_gaps")
    matter_workspace: Mapped["MatterWorkspace | None"] = relationship(back_populates="evidence_gaps")


class ResearchRun(Base):
    __tablename__ = "research_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(String(30), default="running")
    query: Mapped[str] = mapped_column(Text, default="")
    trigger_reason: Mapped[str] = mapped_column(Text, default="")
    research_scope: Mapped[str] = mapped_column(String(50), default="host_external_completion")
    research_depth: Mapped[str] = mapped_column(String(50), default="light_completion")
    freshness_policy: Mapped[str] = mapped_column(String(50), default="latest_public_web")
    confidence_note: Mapped[str] = mapped_column(Text, default="")
    source_trace_summary: Mapped[str] = mapped_column(Text, default="")
    selected_domain_pack_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    selected_industry_pack_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    sub_questions: Mapped[list[str]] = mapped_column(JSON, default=list)
    evidence_gap_focus: Mapped[list[str]] = mapped_column(JSON, default=list)
    source_quality_summary: Mapped[str] = mapped_column(Text, default="")
    contradiction_summary: Mapped[str] = mapped_column(Text, default="")
    citation_handoff_summary: Mapped[str] = mapped_column(Text, default="")
    result_summary: Mapped[str] = mapped_column(Text, default="")
    source_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    task: Mapped["Task"] = relationship(back_populates="research_runs")
    matter_workspace: Mapped["MatterWorkspace | None"] = relationship(back_populates="research_runs")
    source_documents: Mapped[list["SourceDocument"]] = relationship(back_populates="research_run")


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    identity_scope: Mapped[str] = mapped_column(String(30), default="slice_overlay")
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
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    identity_scope: Mapped[str] = mapped_column(String(30), default="slice_overlay")
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
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    identity_scope: Mapped[str] = mapped_column(String(30), default="slice_overlay")
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
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    identity_scope: Mapped[str] = mapped_column(String(30), default="slice_overlay")
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
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    research_run_id: Mapped[str | None] = mapped_column(ForeignKey("research_runs.id"), nullable=True)
    continuity_scope: Mapped[str] = mapped_column(String(30), default="slice_participation")
    source_type: Mapped[str] = mapped_column(String(100), default="manual_upload")
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    canonical_display_name: Mapped[str] = mapped_column(String(255), default="")
    file_extension: Mapped[str | None] = mapped_column(String(20), nullable=True)
    content_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    storage_key: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    storage_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    storage_kind: Mapped[str] = mapped_column(String(50), default="raw_intake")
    storage_provider: Mapped[str] = mapped_column(String(50), default="local_fs")
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    content_digest: Mapped[str | None] = mapped_column(String(128), nullable=True)
    ingest_status: Mapped[str] = mapped_column(String(100), default="processed")
    ingest_strategy: Mapped[str] = mapped_column(String(100), default="text_extract")
    support_level: Mapped[str] = mapped_column(String(30), default="full")
    retention_policy: Mapped[str] = mapped_column(String(100), default="raw_default_30d")
    purge_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    availability_state: Mapped[str] = mapped_column(String(30), default="available")
    metadata_only: Mapped[bool] = mapped_column(Boolean, default=False)
    derived_storage_key: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ingestion_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    task: Mapped["Task"] = relationship(back_populates="uploads")
    research_run: Mapped["ResearchRun | None"] = relationship(back_populates="source_documents")
    source_materials: Mapped[list["SourceMaterial"]] = relationship(back_populates="source_document")
    artifacts: Mapped[list["Artifact"]] = relationship(back_populates="source_document")
    chunk_objects: Mapped[list["ChunkObject"]] = relationship(back_populates="source_document")
    media_references: Mapped[list["MediaReference"]] = relationship(back_populates="source_document")
    evidence_items: Mapped[list["Evidence"]] = relationship(back_populates="source_document")


class SourceMaterial(Base):
    __tablename__ = "source_materials"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    source_document_id: Mapped[str | None] = mapped_column(ForeignKey("source_documents.id"), nullable=True)
    continuity_scope: Mapped[str] = mapped_column(String(30), default="slice_participation")
    source_type: Mapped[str] = mapped_column(String(100), default="manual_upload")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    canonical_display_name: Mapped[str] = mapped_column(String(255), default="")
    source_ref: Mapped[str] = mapped_column(String(1024), nullable=False)
    file_extension: Mapped[str | None] = mapped_column(String(20), nullable=True)
    content_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    storage_key: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    storage_kind: Mapped[str] = mapped_column(String(50), default="raw_intake")
    storage_provider: Mapped[str] = mapped_column(String(50), default="local_fs")
    content_digest: Mapped[str | None] = mapped_column(String(128), nullable=True)
    ingest_status: Mapped[str] = mapped_column(String(100), default="processed")
    ingest_strategy: Mapped[str] = mapped_column(String(100), default="text_extract")
    support_level: Mapped[str] = mapped_column(String(30), default="full")
    retention_policy: Mapped[str] = mapped_column(String(100), default="raw_default_30d")
    purge_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    availability_state: Mapped[str] = mapped_column(String(30), default="available")
    metadata_only: Mapped[bool] = mapped_column(Boolean, default=False)
    summary: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    task: Mapped["Task"] = relationship(back_populates="source_materials")
    source_document: Mapped["SourceDocument | None"] = relationship(back_populates="source_materials")
    artifacts: Mapped[list["Artifact"]] = relationship(back_populates="source_material")
    chunk_objects: Mapped[list["ChunkObject"]] = relationship(back_populates="source_material")
    media_references: Mapped[list["MediaReference"]] = relationship(back_populates="source_material")


class Artifact(Base):
    __tablename__ = "artifacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    source_document_id: Mapped[str | None] = mapped_column(ForeignKey("source_documents.id"), nullable=True)
    source_material_id: Mapped[str | None] = mapped_column(ForeignKey("source_materials.id"), nullable=True)
    continuity_scope: Mapped[str] = mapped_column(String(30), default="slice_participation")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    artifact_type: Mapped[str] = mapped_column(String(100), default="source_artifact")
    description: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="artifacts")
    source_document: Mapped["SourceDocument | None"] = relationship(back_populates="artifacts")
    source_material: Mapped["SourceMaterial | None"] = relationship(back_populates="artifacts")
    chunk_objects: Mapped[list["ChunkObject"]] = relationship(back_populates="artifact")
    media_references: Mapped[list["MediaReference"]] = relationship(back_populates="artifact")


class ChunkObject(Base):
    __tablename__ = "chunk_objects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    source_document_id: Mapped[str] = mapped_column(ForeignKey("source_documents.id"), nullable=False)
    source_material_id: Mapped[str | None] = mapped_column(ForeignKey("source_materials.id"), nullable=True)
    artifact_id: Mapped[str | None] = mapped_column(ForeignKey("artifacts.id"), nullable=True)
    continuity_scope: Mapped[str] = mapped_column(String(30), default="slice_participation")
    chunk_type: Mapped[str] = mapped_column(String(50), default="text_excerpt")
    sequence_index: Mapped[int] = mapped_column(Integer, default=0)
    start_offset: Mapped[int] = mapped_column(Integer, default=0)
    end_offset: Mapped[int] = mapped_column(Integer, default=0)
    locator_label: Mapped[str] = mapped_column(String(255), default="")
    excerpt_text: Mapped[str] = mapped_column(Text, default="")
    excerpt_digest: Mapped[str] = mapped_column(String(128), default="")
    support_level: Mapped[str] = mapped_column(String(30), default="full")
    availability_state: Mapped[str] = mapped_column(String(30), default="available")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="chunk_objects")
    source_document: Mapped["SourceDocument"] = relationship(back_populates="chunk_objects")
    source_material: Mapped["SourceMaterial | None"] = relationship(back_populates="chunk_objects")
    artifact: Mapped["Artifact | None"] = relationship(back_populates="chunk_objects")
    evidence_items: Mapped[list["Evidence"]] = relationship(back_populates="chunk_object")


class MediaReference(Base):
    __tablename__ = "media_references"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    source_document_id: Mapped[str] = mapped_column(ForeignKey("source_documents.id"), nullable=False)
    source_material_id: Mapped[str | None] = mapped_column(ForeignKey("source_materials.id"), nullable=True)
    artifact_id: Mapped[str | None] = mapped_column(ForeignKey("artifacts.id"), nullable=True)
    continuity_scope: Mapped[str] = mapped_column(String(30), default="slice_participation")
    media_type: Mapped[str] = mapped_column(String(50), default="reference_attachment")
    locator_kind: Mapped[str] = mapped_column(String(50), default="file_level")
    locator_label: Mapped[str] = mapped_column(String(255), default="")
    preview_text: Mapped[str] = mapped_column(Text, default="")
    support_level: Mapped[str] = mapped_column(String(30), default="limited")
    usable_scope: Mapped[str] = mapped_column(String(50), default="reference_only")
    availability_state: Mapped[str] = mapped_column(String(30), default="reference_only")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="media_references")
    source_document: Mapped["SourceDocument"] = relationship(back_populates="media_references")
    source_material: Mapped["SourceMaterial | None"] = relationship(back_populates="media_references")
    artifact: Mapped["Artifact | None"] = relationship(back_populates="media_references")
    evidence_items: Mapped[list["Evidence"]] = relationship(back_populates="media_reference")


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    source_document_id: Mapped[str | None] = mapped_column(ForeignKey("source_documents.id"), nullable=True)
    source_material_id: Mapped[str | None] = mapped_column(ForeignKey("source_materials.id"), nullable=True)
    artifact_id: Mapped[str | None] = mapped_column(ForeignKey("artifacts.id"), nullable=True)
    chunk_object_id: Mapped[str | None] = mapped_column(ForeignKey("chunk_objects.id"), nullable=True)
    media_reference_id: Mapped[str | None] = mapped_column(ForeignKey("media_references.id"), nullable=True)
    continuity_scope: Mapped[str] = mapped_column(String(30), default="slice_participation")
    evidence_type: Mapped[str] = mapped_column(String(100), default="source_excerpt")
    source_type: Mapped[str] = mapped_column(String(100), default="manual_input")
    source_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    excerpt_or_summary: Mapped[str] = mapped_column(Text, default="")
    reliability_level: Mapped[str] = mapped_column(String(50), default="user_provided")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="evidence")
    source_document: Mapped["SourceDocument | None"] = relationship(back_populates="evidence_items")
    chunk_object: Mapped["ChunkObject | None"] = relationship(back_populates="evidence_items")
    media_reference: Mapped["MediaReference | None"] = relationship(back_populates="evidence_items")
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
    adoption_feedback_records: Mapped[list["AdoptionFeedback"]] = relationship(
        back_populates="recommendation", cascade="all, delete-orphan"
    )
    precedent_candidates: Mapped[list["PrecedentCandidate"]] = relationship(
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
    summary: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    version_tag: Mapped[str | None] = mapped_column(String(50), nullable=True)
    content_sections: Mapped[dict] = mapped_column(JSON, default=dict)
    content_structure: Mapped[dict] = mapped_column(JSON, default=dict)
    version: Mapped[int] = mapped_column(Integer, default=1)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="deliverables")
    task_run: Mapped["TaskRun | None"] = relationship(back_populates="deliverables")
    object_links: Mapped[list["DeliverableObjectLink"]] = relationship(
        back_populates="deliverable", cascade="all, delete-orphan"
    )
    version_events: Mapped[list["DeliverableVersionEvent"]] = relationship(
        back_populates="deliverable",
        cascade="all, delete-orphan",
        order_by="DeliverableVersionEvent.created_at.desc()",
    )
    artifact_records: Mapped[list["DeliverableArtifactRecord"]] = relationship(
        back_populates="deliverable",
        cascade="all, delete-orphan",
        order_by="DeliverableArtifactRecord.created_at.desc()",
    )
    object_sets: Mapped[list["ObjectSet"]] = relationship(
        back_populates="deliverable",
        order_by="ObjectSet.updated_at.desc()",
    )
    publish_records: Mapped[list["DeliverablePublishRecord"]] = relationship(
        back_populates="deliverable",
        cascade="all, delete-orphan",
        order_by="DeliverablePublishRecord.created_at.desc()",
    )
    content_revisions: Mapped[list["DeliverableContentRevision"]] = relationship(
        back_populates="deliverable",
        cascade="all, delete-orphan",
        order_by="DeliverableContentRevision.created_at.desc()",
    )
    adoption_feedback_records: Mapped[list["AdoptionFeedback"]] = relationship(
        back_populates="deliverable", cascade="all, delete-orphan"
    )
    precedent_candidates: Mapped[list["PrecedentCandidate"]] = relationship(
        back_populates="deliverable", cascade="all, delete-orphan"
    )


class AdoptionFeedback(Base):
    __tablename__ = "adoption_feedback"
    __table_args__ = (
        UniqueConstraint("deliverable_id", name="uq_adoption_feedback_deliverable"),
        UniqueConstraint("recommendation_id", name="uq_adoption_feedback_recommendation"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    deliverable_id: Mapped[str | None] = mapped_column(ForeignKey("deliverables.id"), nullable=True)
    recommendation_id: Mapped[str | None] = mapped_column(
        ForeignKey("recommendations.id"),
        nullable=True,
    )
    feedback_status: Mapped[str] = mapped_column(String(50), nullable=False)
    reason_codes: Mapped[list[str]] = mapped_column(JSON, default=list)
    note: Mapped[str] = mapped_column(Text, default="")
    operator_label: Mapped[str] = mapped_column(String(120), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    task: Mapped["Task"] = relationship(back_populates="adoption_feedback_records")
    deliverable: Mapped["Deliverable | None"] = relationship(back_populates="adoption_feedback_records")
    recommendation: Mapped["Recommendation | None"] = relationship(back_populates="adoption_feedback_records")


class PrecedentCandidate(Base):
    __tablename__ = "precedent_candidates"
    __table_args__ = (
        UniqueConstraint("source_deliverable_id", name="uq_precedent_candidate_deliverable"),
        UniqueConstraint("source_recommendation_id", name="uq_precedent_candidate_recommendation"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    source_deliverable_id: Mapped[str | None] = mapped_column(
        ForeignKey("deliverables.id"),
        nullable=True,
    )
    source_recommendation_id: Mapped[str | None] = mapped_column(
        ForeignKey("recommendations.id"),
        nullable=True,
    )
    candidate_type: Mapped[str] = mapped_column(String(50), nullable=False)
    candidate_status: Mapped[str] = mapped_column(String(50), nullable=False, default="candidate")
    source_feedback_status: Mapped[str] = mapped_column(String(50), nullable=False)
    source_feedback_reason_codes: Mapped[list[str]] = mapped_column(JSON, default=list)
    source_feedback_operator_label: Mapped[str] = mapped_column(String(120), default="")
    created_by_label: Mapped[str] = mapped_column(String(120), default="")
    last_status_changed_by_label: Mapped[str] = mapped_column(String(120), default="")
    title: Mapped[str] = mapped_column(String(255), default="")
    summary: Mapped[str] = mapped_column(Text, default="")
    reusable_reason: Mapped[str] = mapped_column(Text, default="")
    lane_id: Mapped[str] = mapped_column(String(50), default="")
    continuity_mode: Mapped[str] = mapped_column(String(30), default="one_off")
    deliverable_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    client_stage: Mapped[str | None] = mapped_column(String(100), nullable=True)
    client_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    domain_lenses: Mapped[list[str]] = mapped_column(JSON, default=list)
    selected_pack_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    keywords: Mapped[list[str]] = mapped_column(JSON, default=list)
    pattern_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    task: Mapped["Task"] = relationship(back_populates="precedent_candidates")
    matter_workspace: Mapped["MatterWorkspace | None"] = relationship(back_populates="precedent_candidates")
    deliverable: Mapped["Deliverable | None"] = relationship(back_populates="precedent_candidates")
    recommendation: Mapped["Recommendation | None"] = relationship(back_populates="precedent_candidates")


class DeliverableVersionEvent(Base):
    __tablename__ = "deliverable_version_events"
    __table_args__ = (
        UniqueConstraint(
            "deliverable_id",
            "event_key",
            name="uq_deliverable_version_event_key",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    deliverable_id: Mapped[str] = mapped_column(ForeignKey("deliverables.id"), nullable=False)
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    event_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    version_tag: Mapped[str] = mapped_column(String(50), default="")
    deliverable_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    summary: Mapped[str] = mapped_column(Text, default="")
    event_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    deliverable: Mapped["Deliverable"] = relationship(back_populates="version_events")
    task: Mapped["Task"] = relationship()


class DeliverableContentRevision(Base):
    __tablename__ = "deliverable_content_revisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    deliverable_id: Mapped[str] = mapped_column(ForeignKey("deliverables.id"), nullable=False)
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="manual_edit")
    revision_summary: Mapped[str] = mapped_column(Text, default="")
    changed_sections: Mapped[list[str]] = mapped_column(JSON, default=list)
    diff_summary: Mapped[list[dict]] = mapped_column(JSON, default=list)
    snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    version_tag: Mapped[str] = mapped_column(String(50), default="")
    deliverable_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    source_version_event_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    rollback_target_revision_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    deliverable: Mapped["Deliverable"] = relationship(back_populates="content_revisions")
    task: Mapped["Task"] = relationship()


class DeliverablePublishRecord(Base):
    __tablename__ = "deliverable_publish_records"
    __table_args__ = (
        UniqueConstraint(
            "source_version_event_id",
            name="uq_deliverable_publish_record_source_event",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    deliverable_id: Mapped[str] = mapped_column(ForeignKey("deliverables.id"), nullable=False)
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    source_version_event_id: Mapped[str | None] = mapped_column(
        ForeignKey("deliverable_version_events.id"),
        nullable=True,
    )
    version_tag: Mapped[str] = mapped_column(String(50), default="")
    deliverable_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    publish_note: Mapped[str] = mapped_column(Text, default="")
    artifact_formats: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    deliverable: Mapped["Deliverable"] = relationship(back_populates="publish_records")
    task: Mapped["Task"] = relationship()
    artifact_records: Mapped[list["DeliverableArtifactRecord"]] = relationship(
        back_populates="publish_record",
        order_by="DeliverableArtifactRecord.created_at.desc()",
    )
    source_version_event: Mapped["DeliverableVersionEvent | None"] = relationship()


class DeliverableArtifactRecord(Base):
    __tablename__ = "deliverable_artifact_records"
    __table_args__ = (
        UniqueConstraint(
            "source_version_event_id",
            name="uq_deliverable_artifact_record_source_event",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    deliverable_id: Mapped[str] = mapped_column(ForeignKey("deliverables.id"), nullable=False)
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    publish_record_id: Mapped[str | None] = mapped_column(
        ForeignKey("deliverable_publish_records.id"),
        nullable=True,
    )
    source_version_event_id: Mapped[str | None] = mapped_column(
        ForeignKey("deliverable_version_events.id"),
        nullable=True,
    )
    artifact_kind: Mapped[str] = mapped_column(String(20), default="export")
    artifact_format: Mapped[str] = mapped_column(String(20), nullable=False)
    version_tag: Mapped[str] = mapped_column(String(50), default="")
    deliverable_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(255), default="application/octet-stream")
    artifact_key: Mapped[str] = mapped_column(String(1024), nullable=False)
    storage_provider: Mapped[str] = mapped_column(String(50), default="local_fs")
    retention_policy: Mapped[str] = mapped_column(String(100), default="release_365d")
    purge_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    availability_state: Mapped[str] = mapped_column(String(30), default="available")
    artifact_digest: Mapped[str | None] = mapped_column(String(128), nullable=True)
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    artifact_blob: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    deliverable: Mapped["Deliverable"] = relationship(back_populates="artifact_records")
    publish_record: Mapped["DeliverablePublishRecord | None"] = relationship(
        back_populates="artifact_records"
    )
    task: Mapped["Task"] = relationship()
    source_version_event: Mapped["DeliverableVersionEvent | None"] = relationship()


class DecisionRecord(Base):
    __tablename__ = "decision_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    deliverable_id: Mapped[str | None] = mapped_column(ForeignKey("deliverables.id"), nullable=True)
    task_run_id: Mapped[str | None] = mapped_column(ForeignKey("task_runs.id"), nullable=True)
    continuity_mode: Mapped[str] = mapped_column(String(30), default="one_off")
    writeback_depth: Mapped[str] = mapped_column(String(30), default="minimal")
    function_type: Mapped[str] = mapped_column(String(50), default="synthesize_brief")
    approval_policy: Mapped[str] = mapped_column(String(50), default="not_required")
    approval_status: Mapped[str] = mapped_column(String(50), default="not_required")
    approval_summary: Mapped[str] = mapped_column(Text, default="")
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    decision_summary: Mapped[str] = mapped_column(Text, default="")
    evidence_basis_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    recommendation_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    risk_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    action_item_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="decision_records")
    matter_workspace: Mapped["MatterWorkspace | None"] = relationship(back_populates="decision_records")
    deliverable: Mapped["Deliverable | None"] = relationship()
    task_run: Mapped["TaskRun | None"] = relationship()
    action_plans: Mapped[list["ActionPlan"]] = relationship(
        back_populates="decision_record",
        cascade="all, delete-orphan",
        order_by="ActionPlan.created_at.desc()",
    )
    outcome_records: Mapped[list["OutcomeRecord"]] = relationship(
        back_populates="decision_record",
        order_by="OutcomeRecord.created_at.desc()",
    )


class ActionPlan(Base):
    __tablename__ = "action_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    decision_record_id: Mapped[str] = mapped_column(ForeignKey("decision_records.id"), nullable=False)
    action_type: Mapped[str] = mapped_column(String(50), default="decision_follow_through")
    approval_policy: Mapped[str] = mapped_column(String(50), default="not_required")
    approval_status: Mapped[str] = mapped_column(String(50), default="not_required")
    approval_summary: Mapped[str] = mapped_column(Text, default="")
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="planned")
    action_item_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    task: Mapped["Task"] = relationship(back_populates="action_plans")
    matter_workspace: Mapped["MatterWorkspace | None"] = relationship(back_populates="action_plans")
    decision_record: Mapped["DecisionRecord"] = relationship(back_populates="action_plans")
    action_executions: Mapped[list["ActionExecution"]] = relationship(
        back_populates="action_plan",
        cascade="all, delete-orphan",
        order_by="ActionExecution.updated_at.desc()",
    )


class ActionExecution(Base):
    __tablename__ = "action_executions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    action_plan_id: Mapped[str] = mapped_column(ForeignKey("action_plans.id"), nullable=False)
    action_item_id: Mapped[str | None] = mapped_column(ForeignKey("action_items.id"), nullable=True)
    action_type: Mapped[str] = mapped_column(String(50), default="action_execution_tracking")
    status: Mapped[str] = mapped_column(String(30), default="planned")
    owner_hint: Mapped[str | None] = mapped_column(String(255), nullable=True)
    execution_note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    task: Mapped["Task"] = relationship(back_populates="action_executions")
    action_plan: Mapped["ActionPlan"] = relationship(back_populates="action_executions")
    outcome_records: Mapped[list["OutcomeRecord"]] = relationship(
        back_populates="action_execution",
        order_by="OutcomeRecord.created_at.desc()",
    )


class OutcomeRecord(Base):
    __tablename__ = "outcome_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    decision_record_id: Mapped[str | None] = mapped_column(
        ForeignKey("decision_records.id"),
        nullable=True,
    )
    action_execution_id: Mapped[str | None] = mapped_column(
        ForeignKey("action_executions.id"),
        nullable=True,
    )
    deliverable_id: Mapped[str | None] = mapped_column(ForeignKey("deliverables.id"), nullable=True)
    function_type: Mapped[str] = mapped_column(String(50), default="outcome_observation")
    status: Mapped[str] = mapped_column(String(30), default="observed")
    signal_type: Mapped[str] = mapped_column(String(50), default="follow_up_run")
    summary: Mapped[str] = mapped_column(Text, default="")
    evidence_note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="outcome_records")
    matter_workspace: Mapped["MatterWorkspace | None"] = relationship(back_populates="outcome_records")
    decision_record: Mapped["DecisionRecord | None"] = relationship(back_populates="outcome_records")
    action_execution: Mapped["ActionExecution | None"] = relationship(back_populates="outcome_records")
    deliverable: Mapped["Deliverable | None"] = relationship()


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    deliverable_id: Mapped[str | None] = mapped_column(ForeignKey("deliverables.id"), nullable=True)
    decision_record_id: Mapped[str | None] = mapped_column(
        ForeignKey("decision_records.id"),
        nullable=True,
    )
    action_plan_id: Mapped[str | None] = mapped_column(
        ForeignKey("action_plans.id"),
        nullable=True,
    )
    action_execution_id: Mapped[str | None] = mapped_column(
        ForeignKey("action_executions.id"),
        nullable=True,
    )
    outcome_record_id: Mapped[str | None] = mapped_column(
        ForeignKey("outcome_records.id"),
        nullable=True,
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    function_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    action_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    approval_policy: Mapped[str | None] = mapped_column(String(50), nullable=True)
    approval_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    actor_label: Mapped[str] = mapped_column(String(100), default="system")
    summary: Mapped[str] = mapped_column(Text, default="")
    event_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    task: Mapped["Task"] = relationship(back_populates="audit_events")


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


class ObjectSet(Base):
    __tablename__ = "object_sets"
    __table_args__ = (
        UniqueConstraint(
            "task_id",
            "scope_type",
            "scope_id",
            "set_type",
            "creation_mode",
            name="uq_object_set_scope",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    matter_workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("matter_workspaces.id"),
        nullable=True,
    )
    deliverable_id: Mapped[str | None] = mapped_column(
        ForeignKey("deliverables.id"),
        nullable=True,
    )
    set_type: Mapped[str] = mapped_column(String(50), nullable=False)
    scope_type: Mapped[str] = mapped_column(String(30), nullable=False)
    scope_id: Mapped[str] = mapped_column(String(36), nullable=False)
    display_title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    intent: Mapped[str] = mapped_column(Text, default="")
    creation_mode: Mapped[str] = mapped_column(String(50), nullable=False)
    lifecycle_status: Mapped[str] = mapped_column(String(30), default="active")
    continuity_scope: Mapped[str] = mapped_column(String(30), default="task_scope")
    membership_source_summary: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
    )

    task: Mapped["Task"] = relationship(back_populates="object_sets")
    matter_workspace: Mapped["MatterWorkspace | None"] = relationship(back_populates="object_sets")
    deliverable: Mapped["Deliverable | None"] = relationship(back_populates="object_sets")
    members: Mapped[list["ObjectSetMember"]] = relationship(
        back_populates="object_set",
        cascade="all, delete-orphan",
        order_by="ObjectSetMember.ordering_index",
    )


class ObjectSetMember(Base):
    __tablename__ = "object_set_members"
    __table_args__ = (
        UniqueConstraint(
            "object_set_id",
            "member_object_type",
            "member_object_id",
            name="uq_object_set_member",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    object_set_id: Mapped[str] = mapped_column(ForeignKey("object_sets.id"), nullable=False)
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    member_object_type: Mapped[str] = mapped_column(String(50), nullable=False)
    member_object_id: Mapped[str] = mapped_column(String(36), nullable=False)
    member_label: Mapped[str] = mapped_column(String(255), default="")
    membership_source: Mapped[str] = mapped_column(String(50), nullable=False)
    ordering_index: Mapped[int] = mapped_column(Integer, default=0)
    included_reason: Mapped[str] = mapped_column(Text, default="")
    derivation_hint: Mapped[str] = mapped_column(Text, default="")
    support_evidence_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    member_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    support_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    object_set: Mapped["ObjectSet"] = relationship(back_populates="members")
    task: Mapped["Task"] = relationship()


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
