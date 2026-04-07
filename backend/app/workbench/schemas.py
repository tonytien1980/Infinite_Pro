from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.domain import schemas as domain_schemas

ProviderModelLevel = Literal["high_quality", "balanced", "low_cost"]
ProviderValidationStatus = Literal[
    "success",
    "invalid_api_key",
    "base_url_unreachable",
    "model_unavailable",
    "timeout",
    "unknown_error",
    "not_validated",
]


class WorkbenchPreferenceResponse(BaseModel):
    interface_language: Literal["zh-Hant", "en"] = "zh-Hant"
    theme_preference: Literal["light", "dark", "system"] = "light"
    homepage_display_preference: Literal["matters", "deliverables", "evidence"] = "matters"
    history_default_page_size: int = 20
    show_recent_activity: bool = True
    show_frequent_extensions: bool = True
    new_task_default_input_mode: Literal[
        "one_line_inquiry",
        "single_document_intake",
        "multi_material_case",
    ] = "one_line_inquiry"
    density: Literal["standard", "compact"] = "standard"
    deliverable_sort_preference: Literal[
        "updated_desc",
        "title_asc",
        "version_desc",
    ] = "updated_desc"


class WorkbenchPreferenceUpdateRequest(WorkbenchPreferenceResponse):
    pass


class ProviderPresetModelsResponse(BaseModel):
    high_quality: str
    balanced: str
    low_cost: str


class ProviderPresetResponse(BaseModel):
    provider_id: Literal["openai", "anthropic", "gemini", "xai", "minimax"]
    display_name: str
    default_base_url: str
    default_timeout_seconds: int
    auth_scheme_type: str
    adapter_kind: str
    runtime_support_level: Literal["verified", "beta"]
    validation_support_level: Literal["verified", "beta"]
    recommended_models: ProviderPresetModelsResponse


class ProviderValidationResponse(BaseModel):
    provider_id: str
    provider_display_name: str
    model_id: str
    validation_status: ProviderValidationStatus = "not_validated"
    message: str = ""
    detail: str = ""
    validated_at: str | None = None


class CurrentProviderConfigResponse(BaseModel):
    source: Literal["runtime_config", "env_baseline", "personal_config"]
    provider_id: str
    provider_display_name: str
    model_level: ProviderModelLevel
    actual_model_id: str
    custom_model_id: str | None = None
    base_url: str
    timeout_seconds: int
    api_key_configured: bool = False
    api_key_masked: str | None = None
    last_validation_status: ProviderValidationStatus = "not_validated"
    last_validation_message: str = ""
    last_validated_at: str | None = None
    updated_at: str | None = None
    key_updated_at: str | None = None
    preset_runtime_support_level: Literal["verified", "beta", "development"] = "beta"
    using_env_baseline: bool = False


class SystemProviderSettingsResponse(BaseModel):
    current: CurrentProviderConfigResponse
    env_baseline: CurrentProviderConfigResponse
    presets: list[ProviderPresetResponse] = Field(default_factory=list)


class SystemProviderSettingsValidateRequest(BaseModel):
    provider_id: Literal["openai", "anthropic", "gemini", "xai", "minimax"]
    model_level: ProviderModelLevel = "balanced"
    model_id: str = ""
    custom_model_id: str = ""
    base_url: str = ""
    timeout_seconds: int = 60
    api_key: str = ""
    keep_existing_key: bool = False


class SystemProviderSettingsUpdateRequest(SystemProviderSettingsValidateRequest):
    validate_before_save: bool = True
    force_save_without_validation: bool = False


class ProviderAllowlistEntryResponse(BaseModel):
    provider_id: Literal["openai", "anthropic", "gemini", "xai", "minimax"]
    model_level: ProviderModelLevel
    allowed_model_ids: list[str] = Field(default_factory=list)
    allow_custom_model: bool = False
    status: Literal["active", "inactive"] = "active"


class ProviderAllowlistResponse(BaseModel):
    entries: list[ProviderAllowlistEntryResponse] = Field(default_factory=list)


class ProviderAllowlistUpdateRequest(BaseModel):
    entries: list[ProviderAllowlistEntryResponse] = Field(default_factory=list)


class PersonalProviderSettingsValidateRequest(SystemProviderSettingsValidateRequest):
    pass


class PersonalProviderSettingsUpdateRequest(PersonalProviderSettingsValidateRequest):
    validate_before_save: bool = True
    force_save_without_validation: bool = False


class PersonalProviderSettingsResponse(BaseModel):
    current: CurrentProviderConfigResponse
    presets: list[ProviderPresetResponse] = Field(default_factory=list)


class DemoWorkspacePolicyRead(BaseModel):
    status: Literal["active", "inactive"] = "active"
    workspace_slug: str = "demo"
    seed_version: str = "v1"
    max_active_demo_members: int = 5


class DemoWorkspacePolicyUpdateRequest(BaseModel):
    status: Literal["active", "inactive"] = "active"
    max_active_demo_members: int = Field(default=5, ge=0, le=1000)


class FirmOperatingSignalRead(BaseModel):
    signal_id: str
    label: str
    value: str
    status: Literal["ok", "attention"] = "ok"
    detail: str = ""


class FirmOperatingSnapshotRead(BaseModel):
    role: Literal["owner", "consultant"]
    operating_posture: Literal["steady", "attention_needed"] = "steady"
    operating_summary: str
    priority_note: str
    action_label: str
    action_href: str
    signals: list[FirmOperatingSignalRead] = Field(default_factory=list)


class AgentCatalogEntryUpdateRequest(BaseModel):
    agent_id: str = Field(min_length=1, max_length=255)
    agent_name: str = Field(min_length=1, max_length=255)
    agent_type: Literal["host", "reasoning", "specialist"]
    description: str = ""
    supported_capabilities: list[str] = Field(default_factory=list)
    relevant_domain_packs: list[str] = Field(default_factory=list)
    relevant_industry_packs: list[str] = Field(default_factory=list)
    primary_responsibilities: list[str] = Field(default_factory=list)
    out_of_scope: list[str] = Field(default_factory=list)
    defer_rules: list[str] = Field(default_factory=list)
    preferred_execution_modes: list[str] = Field(default_factory=list)
    input_requirements: list[str] = Field(default_factory=list)
    minimum_evidence_readiness: list[str] = Field(default_factory=list)
    required_context_fields: list[str] = Field(default_factory=list)
    output_contract: list[str] = Field(default_factory=list)
    produced_objects: list[str] = Field(default_factory=list)
    deliverable_impact: list[str] = Field(default_factory=list)
    writeback_expectations: list[str] = Field(default_factory=list)
    invocation_rules: list[str] = Field(default_factory=list)
    escalation_rules: list[str] = Field(default_factory=list)
    handoff_targets: list[str] = Field(default_factory=list)
    evaluation_focus: list[str] = Field(default_factory=list)
    failure_modes_to_watch: list[str] = Field(default_factory=list)
    trace_requirements: list[str] = Field(default_factory=list)
    version: str = Field(min_length=1, max_length=50, default="1.0.0")
    status: Literal["draft", "active", "inactive", "deprecated"] = "active"
    is_custom: bool = False


class PackCatalogEntryUpdateRequest(BaseModel):
    pack_id: str = Field(min_length=1, max_length=255)
    pack_type: Literal["domain", "industry"]
    pack_name: str = Field(min_length=1, max_length=255)
    description: str = ""
    domain_definition: str = ""
    industry_definition: str = ""
    common_business_models: list[str] = Field(default_factory=list)
    common_problem_patterns: list[str] = Field(default_factory=list)
    stage_specific_heuristics: dict[str, list[str]] = Field(default_factory=dict)
    key_kpis_or_operating_signals: list[str] = Field(default_factory=list)
    key_kpis: list[str] = Field(default_factory=list)
    domain_lenses: list[str] = Field(default_factory=list)
    relevant_client_types: list[str] = Field(default_factory=list)
    relevant_client_stages: list[str] = Field(default_factory=list)
    default_decision_context_patterns: list[str] = Field(default_factory=list)
    evidence_expectations: list[str] = Field(default_factory=list)
    risk_libraries: list[str] = Field(default_factory=list)
    common_risks: list[str] = Field(default_factory=list)
    decision_patterns: list[str] = Field(default_factory=list)
    deliverable_presets: list[str] = Field(default_factory=list)
    recommendation_patterns: list[str] = Field(default_factory=list)
    routing_hints: list[str] = Field(default_factory=list)
    pack_notes: list[str] = Field(default_factory=list)
    scope_boundaries: list[str] = Field(default_factory=list)
    pack_rationale: list[str] = Field(default_factory=list)
    version: str = Field(min_length=1, max_length=50, default="1.0.0")
    status: Literal["draft", "active", "inactive", "deprecated"] = "active"
    override_rules: list[str] = Field(default_factory=list)
    is_custom: bool = False


class ExtensionSynthesisSourceResponse(BaseModel):
    title: str
    url: str
    snippet: str = ""


class AgentContractDraftRequest(BaseModel):
    agent_id: str = Field(min_length=1, max_length=255)
    agent_name: str = Field(min_length=1, max_length=255)
    agent_type: Literal["host", "reasoning", "specialist"]
    description: str = ""
    supported_capabilities: list[str] = Field(default_factory=list)
    relevant_domain_packs: list[str] = Field(default_factory=list)
    relevant_industry_packs: list[str] = Field(default_factory=list)
    role_focus: str = ""
    input_focus: str = ""
    output_focus: str = ""
    when_to_use: str = ""
    boundary_focus: str = ""
    version: str = Field(min_length=1, max_length=50, default="1.0.0")
    status: Literal["draft", "active", "inactive", "deprecated"] = "active"


class AgentContractDraftResponse(BaseModel):
    search_query: str
    sources: list[ExtensionSynthesisSourceResponse] = Field(default_factory=list)
    synthesis_summary: str = ""
    generation_notes: list[str] = Field(default_factory=list)
    draft: AgentCatalogEntryUpdateRequest


class PackContractDraftRequest(BaseModel):
    pack_id: str = Field(min_length=1, max_length=255)
    pack_type: Literal["domain", "industry"]
    pack_name: str = Field(min_length=1, max_length=255)
    description: str = ""
    definition: str = ""
    domain_lenses: list[str] = Field(default_factory=list)
    routing_keywords: str = ""
    common_business_models: str = ""
    common_problem_patterns: str = ""
    key_signals: str = ""
    evidence_expectations: str = ""
    common_risks: str = ""
    version: str = Field(min_length=1, max_length=50, default="1.0.0")
    status: Literal["draft", "active", "inactive", "deprecated"] = "active"


class PackContractDraftResponse(BaseModel):
    search_query: str
    sources: list[ExtensionSynthesisSourceResponse] = Field(default_factory=list)
    synthesis_summary: str = ""
    generation_notes: list[str] = Field(default_factory=list)
    draft: PackCatalogEntryUpdateRequest


class HistoryVisibilityStateResponse(BaseModel):
    hidden_task_ids: list[str] = Field(default_factory=list)


class HistoryVisibilityUpdateRequest(BaseModel):
    task_ids: list[str] = Field(default_factory=list)
    visibility_state: Literal["visible", "hidden"] = "hidden"


class PrecedentGovernanceApplyRequest(BaseModel):
    operator_label: str | None = None


class PrecedentReviewItemResponse(BaseModel):
    id: str
    candidate_type: Literal["deliverable_pattern", "recommendation_pattern"]
    candidate_status: Literal["candidate", "promoted", "dismissed"]
    review_priority: Literal["high", "medium", "low"] = "medium"
    review_priority_reason: str = ""
    primary_reason_label: str = ""
    source_feedback_reason_labels: list[str] = Field(default_factory=list)
    source_feedback_operator_label: str = ""
    created_by_label: str = ""
    last_status_changed_by_label: str = ""
    optimization_signal: domain_schemas.PrecedentOptimizationSignalRead = Field(
        default_factory=domain_schemas.PrecedentOptimizationSignalRead
    )
    shared_intelligence_signal: domain_schemas.SharedIntelligenceSignalRead = Field(
        default_factory=domain_schemas.SharedIntelligenceSignalRead
    )
    governance_recommendation: domain_schemas.PrecedentGovernanceRecommendationRead = Field(
        default_factory=domain_schemas.PrecedentGovernanceRecommendationRead
    )
    title: str
    summary: str = ""
    reusable_reason: str = ""
    lane_id: str = ""
    continuity_mode: str = "one_off"
    deliverable_type: str | None = None
    client_stage: str | None = None
    client_type: str | None = None
    matter_workspace_id: str | None = None
    matter_title: str | None = None
    task_id: str
    task_title: str = ""
    deliverable_id: str | None = None
    deliverable_title: str | None = None
    recommendation_id: str | None = None
    recommendation_summary: str | None = None
    created_at: str
    updated_at: str


class PrecedentReviewSummaryResponse(BaseModel):
    total_items: int = 0
    candidate_count: int = 0
    promoted_count: int = 0
    dismissed_count: int = 0
    high_priority_count: int = 0
    medium_priority_count: int = 0
    low_priority_count: int = 0


class PrecedentDuplicateReviewRequest(BaseModel):
    review_key: str
    resolution: Literal["human_confirmed_canonical_row", "keep_separate", "split"]
    note: str = ""


class PrecedentDuplicateSummaryResponse(BaseModel):
    pending_review_count: int = 0
    human_confirmed_count: int = 0
    kept_separate_count: int = 0
    split_count: int = 0
    summary: str = ""


class PrecedentDuplicateCandidateResponse(BaseModel):
    review_key: str
    review_status: Literal["pending_review", "human_confirmed_canonical_row", "keep_separate", "split"] = "pending_review"
    suggested_action: Literal["merge_candidate"] | None = None
    confidence_level: str = "medium"
    consultant_summary: str = ""
    canonical_candidate_id: str | None = None
    canonical_title: str = ""
    matter_workspace_id: str
    matter_title: str = ""
    candidate_type: Literal["deliverable_pattern", "recommendation_pattern"]
    candidate_ids: list[str] = Field(default_factory=list)
    candidate_titles: list[str] = Field(default_factory=list)
    task_ids: list[str] = Field(default_factory=list)
    task_titles: list[str] = Field(default_factory=list)
    candidate_count: int = 0
    resolution_note: str = ""
    resolved_at: str | None = None


class SharedIntelligenceAssetAuditItemResponse(BaseModel):
    asset_code: Literal["review_lens", "common_risk", "deliverable_shape"]
    asset_label: str = ""
    audit_status: Literal["audited", "needs_followup"] = "audited"
    audit_status_label: str = ""
    summary: str = ""
    next_step: str = ""


class PhaseFiveAssetAuditItemResponse(BaseModel):
    asset_code: Literal[
        "auth_membership",
        "provider_settings",
        "demo_isolation",
        "owner_controls",
        "demo_polish",
        "firm_operating",
    ]
    asset_label: str = ""
    audit_status: Literal["audited", "needs_followup"] = "audited"
    audit_status_label: str = ""
    summary: str = ""
    next_step: str = ""


class PhaseFiveClosureReviewResponse(BaseModel):
    phase_id: Literal["phase_5"] = "phase_5"
    phase_label: str = ""
    closure_status: Literal["completion_pass", "ready_to_close", "signed_off"] = "completion_pass"
    closure_status_label: str = ""
    summary: str = ""
    foundation_snapshot: str = ""
    completed_count: int = 0
    remaining_count: int = 0
    completed_items: list[str] = Field(default_factory=list)
    asset_audits: list[PhaseFiveAssetAuditItemResponse] = Field(default_factory=list)
    remaining_items: list[str] = Field(default_factory=list)
    recommended_next_step: str = ""
    signed_off_at: str | None = None
    signed_off_by_label: str = ""
    next_phase_label: str = ""
    handoff_summary: str = ""
    handoff_items: list[str] = Field(default_factory=list)


class PhaseSixCoverageAreaRead(BaseModel):
    area_id: str
    area_label: str = ""
    coverage_status: Literal["steady", "thin", "overweighted"] = "steady"
    coverage_status_label: str = ""
    summary: str = ""


class PhaseSixReuseBoundaryItemRead(BaseModel):
    asset_code: str
    asset_label: str = ""
    boundary_status: Literal["generalizable", "contextual", "narrow_use"] = "contextual"
    boundary_status_label: str = ""
    summary: str = ""


class PhaseSixMaturityMilestoneRead(BaseModel):
    milestone_code: str
    milestone_label: str = ""
    milestone_status: Literal["landed", "stabilizing"] = "landed"
    milestone_status_label: str = ""
    summary: str = ""


class PhaseSixMaturityReviewResponse(BaseModel):
    phase_id: Literal["phase_6"] = "phase_6"
    phase_label: str = ""
    maturity_stage: Literal[
        "foundation_lane",
        "refinement_lane",
        "closure_preparation",
    ] = "refinement_lane"
    maturity_stage_label: str = ""
    summary: str = ""
    maturity_snapshot: str = ""
    completed_count: int = 0
    remaining_count: int = 0
    milestone_audits: list[PhaseSixMaturityMilestoneRead] = Field(default_factory=list)
    remaining_focus_items: list[str] = Field(default_factory=list)
    recommended_next_step: str = ""


class PhaseSixClosureCriterionRead(BaseModel):
    criterion_code: str
    criterion_label: str = ""
    criterion_status: Literal["landed", "watching", "needs_followup"] = "needs_followup"
    criterion_status_label: str = ""
    summary: str = ""
    next_step: str = ""


class PhaseSixClosureCriteriaReviewResponse(BaseModel):
    phase_id: Literal["phase_6"] = "phase_6"
    phase_label: str = ""
    closure_posture: Literal[
        "not_ready",
        "building_closure_basis",
        "ready_for_completion_review",
    ] = "building_closure_basis"
    closure_posture_label: str = ""
    summary: str = ""
    closure_snapshot: str = ""
    feedback_loop_summary: str = ""
    feedback_signal_count: int = 0
    governed_outcome_count: int = 0
    criteria_items: list[PhaseSixClosureCriterionRead] = Field(default_factory=list)
    remaining_blockers: list[str] = Field(default_factory=list)
    recommended_next_step: str = ""


class PhaseSixCompletionScorecardItemRead(BaseModel):
    dimension_code: str
    dimension_label: str = ""
    score: int = 0
    status_label: str = ""
    summary: str = ""


class PhaseSixCompletionReviewResponse(BaseModel):
    phase_id: Literal["phase_6"] = "phase_6"
    phase_label: str = ""
    review_posture: Literal["baseline_only", "checkpoint_recorded", "review_ready"] = "baseline_only"
    review_posture_label: str = ""
    summary: str = ""
    overall_score: int = 0
    scorecard_items: list[PhaseSixCompletionScorecardItemRead] = Field(default_factory=list)
    closure_posture: str = ""
    closure_posture_label: str = ""
    checkpoint_summary: str = ""
    last_checkpoint_at: str | None = None
    last_checkpoint_by_label: str = ""
    recommended_next_step: str = ""


class PhaseSixCompletionReviewCheckpointRequest(BaseModel):
    operator_label: str | None = None


class PhaseSixCapabilityCoverageAuditResponse(BaseModel):
    phase_id: Literal["phase_6"] = "phase_6"
    phase_label: str = ""
    audit_status: Literal["balanced", "watch_drift"] = "watch_drift"
    audit_status_label: str = ""
    coverage_summary: str = ""
    generalist_posture: Literal["broad", "watching_bias"] = "watching_bias"
    generalist_posture_label: str = ""
    priority_note: str = ""
    coverage_areas: list[PhaseSixCoverageAreaRead] = Field(default_factory=list)
    reuse_boundary_items: list[PhaseSixReuseBoundaryItemRead] = Field(default_factory=list)
    recommended_next_step: str = ""


class PhaseSixReuseBoundaryGovernanceItemRead(BaseModel):
    asset_code: str
    asset_label: str = ""
    boundary_status: Literal["generalizable", "contextual", "narrow_use"] = "contextual"
    boundary_status_label: str = ""
    reuse_recommendation: Literal[
        "can_expand",
        "keep_contextual",
        "restrict_narrow_use",
    ] = "keep_contextual"
    reuse_recommendation_label: str = ""
    summary: str = ""
    guardrail_note: str = ""


class PhaseSixReuseBoundaryGovernanceResponse(BaseModel):
    phase_id: Literal["phase_6"] = "phase_6"
    phase_label: str = ""
    governance_posture: Literal["stable", "guardrails_needed"] = "guardrails_needed"
    governance_posture_label: str = ""
    summary: str = ""
    host_weighting_summary: str = ""
    host_weighting_guardrail_note: str = ""
    generalizable_count: int = 0
    contextual_count: int = 0
    narrow_use_count: int = 0
    governance_items: list[PhaseSixReuseBoundaryGovernanceItemRead] = Field(default_factory=list)
    recommended_next_step: str = ""


class PhaseSixGeneralistGuidancePostureResponse(BaseModel):
    phase_id: Literal["phase_6"] = "phase_6"
    phase_label: str = ""
    guidance_posture: Literal[
        "light_guidance",
        "balanced_guidance",
        "guarded_guidance",
    ] = "balanced_guidance"
    guidance_posture_label: str = ""
    summary: str = ""
    work_guidance_summary: str = ""
    boundary_emphasis: str = ""
    guidance_items: list[str] = Field(default_factory=list)
    recommended_next_step: str = ""


class PhaseSixContextDistanceItemRead(BaseModel):
    asset_code: str
    asset_label: str = ""
    context_distance: Literal["close", "moderate", "far"] = "moderate"
    context_distance_label: str = ""
    reuse_confidence: Literal[
        "high_confidence",
        "bounded_confidence",
        "low_confidence",
    ] = "bounded_confidence"
    reuse_confidence_label: str = ""
    summary: str = ""
    guardrail_note: str = ""


class PhaseSixContextDistanceAuditResponse(BaseModel):
    phase_id: Literal["phase_6"] = "phase_6"
    phase_label: str = ""
    confidence_posture: Literal["mostly_close", "mixed_distance"] = "mixed_distance"
    confidence_posture_label: str = ""
    summary: str = ""
    distance_items: list[PhaseSixContextDistanceItemRead] = Field(default_factory=list)
    recommended_next_step: str = ""


class PhaseSixConfidenceCalibrationItemRead(BaseModel):
    axis_kind: Literal["client_stage", "client_type", "domain_lens"] = "client_stage"
    axis_label: str = ""
    calibration_status: Literal["aligned", "caution", "mismatch"] = "caution"
    calibration_status_label: str = ""
    reuse_confidence: Literal[
        "high_confidence",
        "bounded_confidence",
        "low_confidence",
    ] = "bounded_confidence"
    reuse_confidence_label: str = ""
    summary: str = ""
    guardrail_note: str = ""


class PhaseSixConfidenceCalibrationResponse(BaseModel):
    phase_id: Literal["phase_6"] = "phase_6"
    phase_label: str = ""
    calibration_posture: Literal["stable_alignment", "watch_mismatch"] = "watch_mismatch"
    calibration_posture_label: str = ""
    summary: str = ""
    calibration_items: list[PhaseSixConfidenceCalibrationItemRead] = Field(default_factory=list)
    recommended_next_step: str = ""


class PhaseSixCalibrationAwareWeightingItemRead(BaseModel):
    axis_kind: Literal["client_stage", "client_type", "domain_lens"] = "client_stage"
    axis_label: str = ""
    calibration_status: Literal["aligned", "caution", "mismatch"] = "caution"
    calibration_status_label: str = ""
    weighting_effect: Literal["allow_expand", "keep_contextual", "background_only"] = (
        "keep_contextual"
    )
    weighting_effect_label: str = ""
    summary: str = ""


class PhaseSixCalibrationAwareWeightingResponse(BaseModel):
    phase_id: Literal["phase_6"] = "phase_6"
    phase_label: str = ""
    weighting_posture: Literal["calibrated_ordering", "watch_mismatch"] = "watch_mismatch"
    weighting_posture_label: str = ""
    summary: str = ""
    host_weighting_summary: str = ""
    host_weighting_guardrail_note: str = ""
    weighting_items: list[PhaseSixCalibrationAwareWeightingItemRead] = Field(default_factory=list)
    recommended_next_step: str = ""


class SharedIntelligenceClosureReviewResponse(BaseModel):
    phase_id: Literal["phase_4"] = "phase_4"
    phase_label: str = ""
    closure_status: Literal["completion_pass", "ready_to_close", "signed_off"] = "completion_pass"
    closure_status_label: str = ""
    summary: str = ""
    candidate_snapshot: str = ""
    completed_count: int = 0
    remaining_count: int = 0
    completed_items: list[str] = Field(default_factory=list)
    asset_audits: list[SharedIntelligenceAssetAuditItemResponse] = Field(default_factory=list)
    remaining_items: list[str] = Field(default_factory=list)
    recommended_next_step: str = ""
    signed_off_at: str | None = None
    signed_off_by_label: str = ""
    next_phase_label: str = ""
    handoff_summary: str = ""
    handoff_items: list[str] = Field(default_factory=list)


class SharedIntelligenceSignOffRequest(BaseModel):
    operator_label: str | None = None


class PhaseFiveSignOffRequest(BaseModel):
    operator_label: str | None = None


class PrecedentReviewResponse(BaseModel):
    summary: PrecedentReviewSummaryResponse = Field(
        default_factory=PrecedentReviewSummaryResponse
    )
    items: list[PrecedentReviewItemResponse] = Field(default_factory=list)
    closure_review: SharedIntelligenceClosureReviewResponse = Field(
        default_factory=SharedIntelligenceClosureReviewResponse
    )
    duplicate_summary: PrecedentDuplicateSummaryResponse = Field(
        default_factory=PrecedentDuplicateSummaryResponse
    )
    duplicate_candidates: list[PrecedentDuplicateCandidateResponse] = Field(default_factory=list)
