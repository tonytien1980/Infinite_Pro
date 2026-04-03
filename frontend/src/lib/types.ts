export type FlowMode = "multi_agent" | "specialist";
export type TaskStatus = "draft" | "ready" | "running" | "completed" | "failed";
export type RunStatus = "running" | "completed" | "failed";
export type ExternalDataStrategy = "strict" | "supplemental" | "latest";
export type InputEntryMode =
  | "one_line_inquiry"
  | "single_document_intake"
  | "multi_material_case";
export type EngagementContinuityMode =
  | "one_off"
  | "follow_up"
  | "continuous";
export type WritebackDepth = "minimal" | "milestone" | "full";
export type FunctionType =
  | "diagnose_assess"
  | "decide_converge"
  | "review_challenge"
  | "synthesize_brief"
  | "restructure_reframe"
  | "plan_roadmap"
  | "scenario_comparison"
  | "risk_surfacing"
  | "checkpoint_update"
  | "outcome_observation";
export type ActionType =
  | "decision_follow_through"
  | "checkpoint_follow_up"
  | "progression_action"
  | "action_execution_tracking"
  | "close_case"
  | "reopen_case";
export type ApprovalPolicy =
  | "not_required"
  | "consultant_review"
  | "consultant_confirmation";
export type ApprovalStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "rejected";
export type AdoptionFeedbackStatus =
  | "adopted"
  | "needs_revision"
  | "not_adopted"
  | "template_candidate";
export type AuditEventType =
  | "writeback_generated"
  | "approval_recorded"
  | "continuation_action_applied";
export type PresenceState =
  | "explicit"
  | "inferred"
  | "provisional"
  | "missing"
  | "not_applicable";
export type DeliverableClass =
  | "exploratory_brief"
  | "assessment_review_memo"
  | "decision_action_deliverable";
export type ObjectSetType =
  | "evidence_set_v1"
  | "risk_set_v1"
  | "clause_obligation_set_v1"
  | "process_issue_set_v1";
export type ObjectSetScopeType = "task" | "deliverable" | "matter";
export type ObjectSetCreationMode = "host_curated" | "deliverable_support_bundle";
export type ObjectSetLifecycleStatus = "active" | "archived";
export type ObjectSetMembershipSource = "host_curated" | "deliverable_support_bundle";
export type TaskType =
  | "research_synthesis"
  | "contract_review"
  | "document_restructuring"
  | "complex_convergence";
export type HomepageDisplayPreference = "matters" | "deliverables" | "evidence";
export type ThemePreference = "light" | "dark" | "system";
export type DensityPreference = "standard" | "compact";
export type DeliverableSortPreference =
  | "updated_desc"
  | "title_asc"
  | "version_desc";
export type ProviderId = "openai" | "anthropic" | "gemini" | "xai" | "minimax";
export type CurrentProviderId = ProviderId | "mock";
export type ProviderModelLevel = "high_quality" | "balanced" | "low_cost";
export type ProviderValidationStatus =
  | "success"
  | "invalid_api_key"
  | "base_url_unreachable"
  | "model_unavailable"
  | "timeout"
  | "unknown_error"
  | "not_validated";
export type PackContractInterfaceId =
  | "evidence_readiness_v1"
  | "decision_framing_v1"
  | "deliverable_shaping_v1";
export type PackRequiredPropertyId =
  | "definition"
  | "common_business_models"
  | "common_problem_patterns"
  | "evidence_expectations"
  | "stage_specific_heuristics"
  | "key_signals"
  | "common_risks"
  | "default_decision_context_patterns"
  | "decision_patterns"
  | "deliverable_presets"
  | "routing_hints"
  | "pack_rationale";
export type PackRuleBindingId =
  | "readiness_gate_v1"
  | "decision_context_hint_v1"
  | "deliverable_hint_v1";
export type PackContractStatus = "ready" | "missing_required_properties";

export interface WorkbenchSettings {
  interfaceLanguage: "zh-Hant" | "en";
  themePreference: ThemePreference;
  homepageDisplayPreference: HomepageDisplayPreference;
  historyDefaultPageSize: number;
  showRecentActivity: boolean;
  showFrequentExtensions: boolean;
  newTaskDefaultInputMode: InputEntryMode;
  density: DensityPreference;
  deliverableSortPreference: DeliverableSortPreference;
}

export interface ProviderPreset {
  providerId: ProviderId;
  displayName: string;
  defaultBaseUrl: string;
  defaultTimeoutSeconds: number;
  authSchemeType: string;
  adapterKind: string;
  runtimeSupportLevel: "verified" | "beta";
  validationSupportLevel: "verified" | "beta";
  recommendedModels: Record<ProviderModelLevel, string>;
}

export interface ProviderValidationResult {
  providerId: string;
  providerDisplayName: string;
  modelId: string;
  validationStatus: ProviderValidationStatus;
  message: string;
  detail: string;
  validatedAt: string | null;
}

export interface CurrentProviderConfig {
  source: "runtime_config" | "env_baseline";
  providerId: CurrentProviderId;
  providerDisplayName: string;
  modelLevel: ProviderModelLevel;
  actualModelId: string;
  customModelId: string | null;
  baseUrl: string;
  timeoutSeconds: number;
  apiKeyConfigured: boolean;
  apiKeyMasked: string | null;
  lastValidationStatus: ProviderValidationStatus;
  lastValidationMessage: string;
  lastValidatedAt: string | null;
  updatedAt: string | null;
  keyUpdatedAt: string | null;
  presetRuntimeSupportLevel: "verified" | "beta" | "development";
  usingEnvBaseline: boolean;
}

export interface SystemProviderSettingsSnapshot {
  current: CurrentProviderConfig;
  envBaseline: CurrentProviderConfig;
  presets: ProviderPreset[];
}

export interface SystemProviderSettingsPayload {
  providerId: ProviderId;
  modelLevel: ProviderModelLevel;
  modelId: string;
  customModelId: string;
  baseUrl: string;
  timeoutSeconds: number;
  apiKey: string;
  keepExistingKey: boolean;
}

export interface SystemProviderSettingsUpdatePayload extends SystemProviderSettingsPayload {
  validateBeforeSave: boolean;
  forceSaveWithoutValidation: boolean;
}

export interface PresenceStateItem {
  state: PresenceState;
  reason: string;
  display_value: string | null;
}

export interface PresenceStateSummary {
  client: PresenceStateItem;
  engagement: PresenceStateItem;
  workstream: PresenceStateItem;
  decision_context: PresenceStateItem;
  artifact: PresenceStateItem;
  source_material: PresenceStateItem;
  domain_lens: PresenceStateItem;
  client_stage: PresenceStateItem;
  client_type: PresenceStateItem;
}

export interface SelectedPack {
  pack_id: string;
  pack_type: string;
  pack_name: string;
  description: string;
  domain_definition: string;
  industry_definition: string;
  common_business_models: string[];
  common_problem_patterns: string[];
  stage_specific_heuristics: Record<string, string[]>;
  key_kpis_or_operating_signals: string[];
  key_kpis: string[];
  default_decision_context_patterns: string[];
  reason: string;
  selection_score: number;
  selection_signals: string[];
  status: string;
  version: string;
  evidence_expectations: string[];
  common_risks: string[];
  decision_patterns: string[];
  deliverable_presets: string[];
  routing_hints: string[];
  pack_notes: string[];
  scope_boundaries: string[];
  pack_rationale: string[];
  contract_baseline: PackContractBaseline | null;
}

export interface PackResolution {
  selected_domain_packs: SelectedPack[];
  selected_industry_packs: SelectedPack[];
  override_pack_ids: string[];
  conflicts: string[];
  stack_order: string[];
  resolver_notes: string[];
  evidence_expectations: string[];
  key_kpis_or_operating_signals: string[];
  key_kpis: string[];
  common_risks: string[];
  decision_patterns: string[];
  decision_context_patterns: string[];
  deliverable_presets: string[];
  ready_interface_ids: PackContractInterfaceId[];
  ready_rule_binding_ids: PackRuleBindingId[];
  missing_required_property_ids: PackRequiredPropertyId[];
  contract_status: PackContractStatus;
}

export interface PackContractRequirement {
  interface_id: PackContractInterfaceId;
  required_property_ids: PackRequiredPropertyId[];
  missing_required_property_ids: PackRequiredPropertyId[];
  rule_binding_ids: PackRuleBindingId[];
  status: PackContractStatus;
  summary: string;
}

export interface PackContractBaseline {
  pack_api_name: string;
  requirements: PackContractRequirement[];
  ready_interface_ids: PackContractInterfaceId[];
  ready_rule_binding_ids: PackRuleBindingId[];
  missing_required_property_ids: PackRequiredPropertyId[];
  status: PackContractStatus;
}

export interface SelectedAgent {
  agent_id: string;
  agent_name: string;
  agent_type: string;
  description: string;
  supported_capabilities: string[];
  relevant_domain_packs: string[];
  relevant_industry_packs: string[];
  primary_responsibilities: string[];
  out_of_scope: string[];
  defer_rules: string[];
  preferred_execution_modes: string[];
  input_requirements: string[];
  minimum_evidence_readiness: string[];
  required_context_fields: string[];
  output_contract: string[];
  produced_objects: string[];
  deliverable_impact: string[];
  writeback_expectations: string[];
  invocation_rules: string[];
  escalation_rules: string[];
  handoff_targets: string[];
  evaluation_focus: string[];
  failure_modes_to_watch: string[];
  trace_requirements: string[];
  reason: string;
  selection_score: number;
  selection_signals: string[];
  runtime_binding: string | null;
  status: string;
  version: string;
}

export interface AgentSelection {
  host_agent: SelectedAgent | null;
  selected_reasoning_agents: SelectedAgent[];
  selected_specialist_agents: SelectedAgent[];
  selected_agent_ids: string[];
  selected_agent_names: string[];
  override_agent_ids: string[];
  resolver_notes: string[];
  rationale: string[];
  omitted_agent_notes: string[];
  deferred_agent_notes: string[];
  escalation_notes: string[];
}

export interface PackCatalogEntry {
  pack_id: string;
  pack_type: string;
  pack_name: string;
  description: string;
  domain_definition: string;
  industry_definition: string;
  common_business_models: string[];
  common_problem_patterns: string[];
  stage_specific_heuristics: Record<string, string[]>;
  key_kpis_or_operating_signals: string[];
  key_kpis: string[];
  domain_lenses: string[];
  relevant_client_types: string[];
  relevant_client_stages: string[];
  default_decision_context_patterns: string[];
  evidence_expectations: string[];
  risk_libraries: string[];
  common_risks: string[];
  decision_patterns: string[];
  deliverable_presets: string[];
  recommendation_patterns: string[];
  routing_hints: string[];
  pack_notes: string[];
  scope_boundaries: string[];
  pack_rationale: string[];
  version: string;
  status: string;
  override_rules: string[];
  contract_baseline?: PackContractBaseline | null;
}

export interface AgentCatalogEntry {
  agent_id: string;
  agent_name: string;
  agent_type: string;
  description: string;
  supported_capabilities: string[];
  relevant_domain_packs: string[];
  relevant_industry_packs: string[];
  primary_responsibilities: string[];
  out_of_scope: string[];
  defer_rules: string[];
  preferred_execution_modes: string[];
  input_requirements: string[];
  minimum_evidence_readiness: string[];
  required_context_fields: string[];
  output_contract: string[];
  produced_objects: string[];
  deliverable_impact: string[];
  writeback_expectations: string[];
  invocation_rules: string[];
  escalation_rules: string[];
  handoff_targets: string[];
  evaluation_focus: string[];
  failure_modes_to_watch: string[];
  trace_requirements: string[];
  version: string;
  status: string;
}

export interface PackRegistrySnapshot {
  packs: PackCatalogEntry[];
  active_pack_ids: string[];
  draft_pack_ids: string[];
  inactive_pack_ids: string[];
}

export interface AgentRegistrySnapshot {
  agents: AgentCatalogEntry[];
  host_agent_id: string;
  active_agent_ids: string[];
  draft_agent_ids: string[];
  inactive_agent_ids: string[];
}

export interface ExtensionManagerSnapshot {
  pack_registry: PackRegistrySnapshot;
  agent_registry: AgentRegistrySnapshot;
}

export interface HistoryVisibilityState {
  hidden_task_ids: string[];
}

export interface HistoryVisibilityUpdatePayload {
  task_ids: string[];
  visibility_state: "visible" | "hidden";
}

export interface AgentCatalogEntryUpdatePayload extends AgentCatalogEntry {
  is_custom: boolean;
}

export interface PackCatalogEntryUpdatePayload extends PackCatalogEntry {
  is_custom: boolean;
}

export interface ExtensionSynthesisSource {
  title: string;
  url: string;
  snippet: string;
}

export interface AgentContractDraftPayload {
  agent_id: string;
  agent_name: string;
  agent_type: string;
  description: string;
  supported_capabilities: string[];
  relevant_domain_packs: string[];
  relevant_industry_packs: string[];
  role_focus: string;
  input_focus: string;
  output_focus: string;
  when_to_use: string;
  boundary_focus: string;
  version: string;
  status: string;
}

export interface AgentContractDraftResult {
  search_query: string;
  sources: ExtensionSynthesisSource[];
  synthesis_summary: string;
  generation_notes: string[];
  draft: AgentCatalogEntry;
}

export interface PackContractDraftPayload {
  pack_id: string;
  pack_type: string;
  pack_name: string;
  description: string;
  definition: string;
  domain_lenses: string[];
  routing_keywords: string;
  common_business_models: string;
  common_problem_patterns: string;
  key_signals: string;
  evidence_expectations: string;
  common_risks: string;
  version: string;
  status: string;
}

export interface PackContractDraftResult {
  search_query: string;
  sources: ExtensionSynthesisSource[];
  synthesis_summary: string;
  generation_notes: string[];
  draft: PackCatalogEntry;
}

export interface MatterWorkspaceSummary {
  id: string;
  title: string;
  workspace_summary: string;
  status: string;
  object_path: string;
  client_name: string;
  engagement_name: string;
  workstream_name: string;
  client_stage: string | null;
  client_type: string | null;
  domain_lenses: string[];
  current_decision_context_title: string | null;
  current_decision_context_summary: string | null;
  total_task_count: number;
  active_task_count: number;
  deliverable_count: number;
  artifact_count: number;
  source_material_count: number;
  latest_updated_at: string;
  continuity_summary: string;
  active_work_summary: string;
  flagship_lane: FlagshipLane;
  engagement_continuity_mode: EngagementContinuityMode;
  writeback_depth: WritebackDepth;
  selected_pack_names: string[];
  selected_agent_names: string[];
}

export interface FlagshipLane {
  lane_id: string;
  label: string;
  summary: string;
  next_step_summary: string;
  upgrade_note: string;
  current_output_label: string;
  current_output_summary: string;
  upgrade_target_label: string;
  upgrade_requirements: string[];
  upgrade_ready: boolean;
  boundary_note: string;
}

export interface ResearchGuidance {
  status: string;
  label: string;
  summary: string;
  recommended_depth: string;
  suggested_questions: string[];
  evidence_gap_focus: string[];
  source_quality_summary: string;
  freshness_summary: string;
  contradiction_watchouts: string[];
  citation_ready_summary: string;
  evidence_gap_closure_plan: string[];
  stop_condition: string;
  handoff_summary: string;
  latest_run_summary: string;
  execution_owner_label: string;
  supplement_boundary_note: string;
  boundary_note: string;
}

export interface MatterDecisionPoint {
  task_id: string;
  task_title: string;
  task_status: TaskStatus;
  decision_context_id: string | null;
  decision_context_title: string;
  judgment_to_make: string;
  deliverable_class_hint: DeliverableClass;
  updated_at: string;
}

export interface MatterDeliverableSummary {
  deliverable_id: string;
  task_id: string;
  task_title: string;
  title: string;
  summary: string;
  status: string;
  version_tag: string;
  deliverable_type: string;
  version: number;
  generated_at: string;
  decision_context_title: string | null;
}

export interface MatterMaterialSummary {
  object_id: string;
  task_id: string;
  task_title: string;
  object_type: string;
  title: string;
  summary: string;
  file_extension: string | null;
  content_type: string | null;
  file_size: number;
  ingest_status: string | null;
  support_level: string | null;
  ingest_strategy: string | null;
  ingestion_error: string | null;
  retention_policy: string | null;
  purge_at: string | null;
  availability_state: string | null;
  metadata_only: boolean;
  diagnostic_category: string | null;
  extract_availability: string | null;
  current_usable_scope: string | null;
  fallback_mode: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  identity_scope: string;
  task_reference_role: string;
  name: string;
  client_type: string;
  client_stage: string;
  description: string | null;
  created_at: string;
}

export interface Engagement {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  identity_scope: string;
  task_reference_role: string;
  client_id: string | null;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Workstream {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  identity_scope: string;
  task_reference_role: string;
  engagement_id: string | null;
  name: string;
  description: string | null;
  domain_lenses: string[];
  created_at: string;
}

export interface DecisionContext {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  identity_scope: string;
  task_reference_role: string;
  client_id: string | null;
  engagement_id: string | null;
  workstream_id: string | null;
  title: string;
  summary: string;
  judgment_to_make: string;
  domain_lenses: string[];
  client_stage: string | null;
  client_type: string | null;
  goals: string[];
  constraints: string[];
  assumptions: string[];
  source_priority: string;
  external_data_policy: string;
  created_at: string;
}

export interface DecisionContextDelta {
  title: string | null;
  summary: string | null;
  judgment_to_make: string | null;
  domain_lenses: string[];
  client_stage: string | null;
  client_type: string | null;
  goals: string[];
  constraints: string[];
  assumptions: string[];
  source_priority: string | null;
  external_data_policy: string | null;
  changed_fields: string[];
}

export interface TaskContext {
  id: string;
  task_id: string;
  summary: string;
  assumptions: string | null;
  notes: string | null;
  version: number;
  created_at: string;
}

export interface Subject {
  id: string;
  task_id: string;
  subject_type: string;
  name: string;
  description: string | null;
  source_ref: string | null;
}

export interface Goal {
  id: string;
  task_id: string;
  goal_type: string;
  description: string;
  success_criteria: string | null;
  priority: string;
}

export interface Constraint {
  id: string;
  task_id: string;
  constraint_type: string;
  description: string;
  severity: string;
}

export interface SourceDocument {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  research_run_id: string | null;
  continuity_scope: string;
  source_type: string;
  file_name: string;
  canonical_display_name: string;
  file_extension: string | null;
  content_type: string | null;
  storage_key: string | null;
  storage_path: string;
  storage_kind: string;
  storage_provider: string;
  file_size: number;
  content_digest: string | null;
  ingest_status: string;
  ingest_strategy: string;
  support_level: string;
  retention_policy: string;
  purge_at: string | null;
  availability_state: string;
  metadata_only: boolean;
  diagnostic_category: string | null;
  extract_availability: string | null;
  current_usable_scope: string | null;
  fallback_mode: string | null;
  derived_storage_key: string | null;
  extracted_text: string | null;
  ingestion_error: string | null;
  participation: ObjectParticipation | null;
  created_at: string;
  updated_at: string;
}

export interface ObjectParticipation {
  canonical_object_id: string | null;
  canonical_owner_scope: string | null;
  compatibility_task_id: string | null;
  current_task_participation: boolean;
  participation_type: string | null;
  participation_task_count: number;
  mapping_mode: string | null;
}

export type CanonicalizationReviewStatus =
  | "pending_review"
  | "human_confirmed_canonical_row"
  | "keep_separate"
  | "split";

export type CanonicalizationMatchBasis =
  | "content_digest_match"
  | "source_ref_match"
  | "display_name_match";

export interface CanonicalizationSummary {
  pending_review_count: number;
  human_confirmed_count: number;
  kept_separate_count: number;
  split_count: number;
  current_task_pending_count: number;
  summary: string;
}

export interface CanonicalizationCandidate {
  review_key: string;
  object_family: "source_chain";
  review_status: CanonicalizationReviewStatus;
  match_basis: CanonicalizationMatchBasis;
  suggested_action: "merge_candidate" | null;
  confidence_level: string;
  consultant_summary: string;
  canonical_title: string;
  canonical_source_document_id: string | null;
  canonical_source_material_id: string | null;
  canonical_artifact_id: string | null;
  canonical_evidence_id: string | null;
  source_document_ids: string[];
  source_material_ids: string[];
  artifact_ids: string[];
  evidence_ids: string[];
  affected_task_ids: string[];
  affected_task_titles: string[];
  candidate_count: number;
  task_count: number;
  current_task_involved: boolean;
  canonical_owner_scope: string;
  local_participation_boundary: string;
  resolution_note: string;
  resolved_at: string | null;
}

export interface SourceMaterial {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  source_document_id: string | null;
  continuity_scope: string;
  source_type: string;
  title: string;
  canonical_display_name: string;
  source_ref: string;
  file_extension: string | null;
  content_type: string | null;
  file_size: number;
  storage_key: string | null;
  storage_kind: string;
  storage_provider: string;
  content_digest: string | null;
  ingest_status: string;
  ingest_strategy: string;
  support_level: string;
  retention_policy: string;
  purge_at: string | null;
  availability_state: string;
  metadata_only: boolean;
  diagnostic_category: string | null;
  extract_availability: string | null;
  current_usable_scope: string | null;
  fallback_mode: string | null;
  summary: string;
  ingestion_error: string | null;
  participation: ObjectParticipation | null;
  created_at: string;
  updated_at: string;
}

export interface Artifact {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  continuity_scope: string;
  title: string;
  artifact_type: string;
  source_document_id: string | null;
  source_material_id: string | null;
  description: string;
  participation: ObjectParticipation | null;
  created_at: string;
}

export interface ChunkObject {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  source_document_id: string;
  source_material_id: string | null;
  artifact_id: string | null;
  continuity_scope: string;
  chunk_type: string;
  sequence_index: number;
  start_offset: number;
  end_offset: number;
  locator_label: string;
  excerpt_text: string;
  excerpt_digest: string;
  support_level: string;
  availability_state: string;
  created_at: string;
}

export interface MediaReference {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  source_document_id: string;
  source_material_id: string | null;
  artifact_id: string | null;
  continuity_scope: string;
  media_type: string;
  locator_kind: string;
  locator_label: string;
  preview_text: string;
  support_level: string;
  usable_scope: string;
  availability_state: string;
  created_at: string;
}

export interface RetrievalProvenance {
  support_kind: string;
  source_document_id: string | null;
  source_document_title: string | null;
  source_material_id: string | null;
  source_material_title: string | null;
  artifact_id: string | null;
  artifact_title: string | null;
  support_level: string | null;
  availability_state: string | null;
  locator_label: string | null;
  usable_scope: string | null;
  excerpt_text: string | null;
  preview_text: string | null;
  chunk_object: ChunkObject | null;
  media_reference: MediaReference | null;
}

export interface Evidence {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  source_document_id: string | null;
  source_material_id: string | null;
  artifact_id: string | null;
  chunk_object_id: string | null;
  media_reference_id: string | null;
  continuity_scope: string;
  evidence_type: string;
  source_type: string;
  source_ref: string | null;
  title: string;
  excerpt_or_summary: string;
  reliability_level: string;
  retrieval_provenance: RetrievalProvenance | null;
  participation: ObjectParticipation | null;
  created_at: string;
}

export interface Insight {
  id: string;
  task_id: string;
  generated_by: string;
  summary: string;
  evidence_refs: string[];
  confidence_level: string;
  created_at: string;
}

export interface Risk {
  id: string;
  task_id: string;
  title: string;
  description: string;
  risk_type: string;
  impact_level: string;
  likelihood_level: string;
  evidence_refs: string[];
  supporting_evidence_ids: string[];
  created_at: string;
}

export interface Recommendation {
  id: string;
  task_id: string;
  summary: string;
  rationale: string;
  based_on_refs: string[];
  supporting_evidence_ids: string[];
  priority: string;
  owner_suggestion: string | null;
  adoption_feedback: AdoptionFeedback | null;
  created_at: string;
}

export interface ActionItem {
  id: string;
  task_id: string;
  description: string;
  suggested_owner: string | null;
  priority: string;
  due_hint: string | null;
  dependency_refs: string[];
  supporting_evidence_ids: string[];
  status: string;
  created_at: string;
}

export interface DeliverableObjectLink {
  id: string;
  task_id: string;
  deliverable_id: string;
  object_type: string;
  object_id: string | null;
  object_label: string | null;
  relation_type: string;
  created_at: string;
}

export interface Deliverable {
  id: string;
  task_id: string;
  task_run_id: string | null;
  deliverable_type: string;
  title: string;
  summary: string;
  status: string;
  version_tag: string;
  content_structure: Record<string, unknown>;
  version: number;
  linked_objects: DeliverableObjectLink[];
  adoption_feedback: AdoptionFeedback | null;
  generated_at: string;
}

export interface AdoptionFeedback {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  deliverable_id: string | null;
  recommendation_id: string | null;
  feedback_status: AdoptionFeedbackStatus;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface TaskRun {
  id: string;
  task_id: string;
  agent_id: string;
  flow_mode: string;
  status: RunStatus;
  summary: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface CaseWorldFact {
  title: string;
  detail: string;
  source: string;
}

export interface CaseWorldAssumption {
  title: string;
  detail: string;
  source: string;
}

export interface CaseWorldGap {
  gap_key: string;
  title: string;
  description: string;
  priority: string;
  related_pack_ids: string[];
}

export interface CaseWorldDraft {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  compiler_status: string;
  entry_preset: InputEntryMode;
  continuity_mode: EngagementContinuityMode;
  writeback_depth: WritebackDepth;
  canonical_intake_summary: Record<string, unknown>;
  task_interpretation: Record<string, unknown>;
  decision_context: Record<string, unknown>;
  extracted_objects: Array<Record<string, unknown>>;
  inferred_links: Array<Record<string, unknown>>;
  facts: CaseWorldFact[];
  assumptions: CaseWorldAssumption[];
  evidence_gaps: CaseWorldGap[];
  suggested_capabilities: string[];
  suggested_domain_packs: string[];
  suggested_industry_packs: string[];
  suggested_agents: string[];
  suggested_research_need: boolean;
  next_best_actions: string[];
  created_at: string;
  updated_at: string;
}

export interface CaseWorldState {
  id: string;
  matter_workspace_id: string;
  compiler_status: string;
  world_status: string;
  client_id: string | null;
  engagement_id: string | null;
  workstream_id: string | null;
  decision_context_id: string | null;
  entry_preset: InputEntryMode;
  continuity_mode: EngagementContinuityMode;
  writeback_depth: WritebackDepth;
  world_identity: Record<string, unknown>;
  canonical_intake_summary: Record<string, unknown>;
  decision_context: Record<string, unknown>;
  extracted_objects: Array<Record<string, unknown>>;
  inferred_links: Array<Record<string, unknown>>;
  facts: CaseWorldFact[];
  assumptions: CaseWorldAssumption[];
  evidence_gaps: CaseWorldGap[];
  selected_capabilities: string[];
  selected_domain_packs: string[];
  selected_industry_packs: string[];
  selected_agent_ids: string[];
  suggested_research_need: boolean;
  next_best_actions: string[];
  active_task_ids: string[];
  latest_task_id: string | null;
  latest_task_title: string | null;
  supplement_count: number;
  last_supplement_summary: string;
  created_at: string;
  updated_at: string;
}

export interface EvidenceGap {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  gap_key: string;
  title: string;
  gap_type: string;
  description: string;
  priority: string;
  status: string;
  source: string;
  supporting_pack_ids: string[];
  related_source_refs: string[];
  created_at: string;
  updated_at: string;
}

export interface ResearchRun {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  status: RunStatus;
  query: string;
  trigger_reason: string;
  research_scope: string;
  research_depth: string;
  freshness_policy: string;
  confidence_note: string;
  source_trace_summary: string;
  selected_domain_pack_ids: string[];
  selected_industry_pack_ids: string[];
  sub_questions: string[];
  evidence_gap_focus: string[];
  source_quality_summary: string;
  contradiction_summary: string;
  citation_handoff_summary: string;
  result_summary: string;
  source_count: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface DecisionRecord {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  deliverable_id: string | null;
  task_run_id: string | null;
  continuity_mode: EngagementContinuityMode;
  writeback_depth: WritebackDepth;
  function_type: FunctionType;
  approval_policy: ApprovalPolicy;
  approval_status: ApprovalStatus;
  approval_summary: string;
  approved_at: string | null;
  title: string;
  decision_summary: string;
  evidence_basis_ids: string[];
  recommendation_ids: string[];
  risk_ids: string[];
  action_item_ids: string[];
  created_at: string;
}

export interface ActionPlan {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  decision_record_id: string;
  action_type: ActionType;
  approval_policy: ApprovalPolicy;
  approval_status: ApprovalStatus;
  approval_summary: string;
  approved_at: string | null;
  title: string;
  summary: string;
  status: string;
  action_item_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ActionExecution {
  id: string;
  task_id: string;
  action_plan_id: string;
  action_item_id: string | null;
  action_type: ActionType;
  status: string;
  owner_hint: string | null;
  execution_note: string;
  created_at: string;
  updated_at: string;
}

export interface OutcomeRecord {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  decision_record_id: string | null;
  action_execution_id: string | null;
  deliverable_id: string | null;
  function_type: FunctionType;
  status: string;
  signal_type: string;
  summary: string;
  evidence_note: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  deliverable_id: string | null;
  decision_record_id: string | null;
  action_plan_id: string | null;
  action_execution_id: string | null;
  outcome_record_id: string | null;
  event_type: AuditEventType;
  function_type: FunctionType | null;
  action_type: ActionType | null;
  approval_policy: ApprovalPolicy | null;
  approval_status: ApprovalStatus | null;
  actor_label: string;
  summary: string;
  event_payload: Record<string, unknown>;
  created_at: string;
}

export interface ContinuationAction {
  action_id: string;
  label: string;
  description: string;
}

export interface CheckpointSnapshot {
  record_id: string | null;
  task_id: string | null;
  task_title: string;
  deliverable_id: string | null;
  deliverable_title: string | null;
  summary: string;
  created_at: string | null;
}

export interface ContinuationChangeItem {
  kind: "recommendation" | "risk" | "action_item";
  title: string;
  change_type: string;
  summary: string;
}

export interface FollowUpLane {
  latest_update: CheckpointSnapshot | null;
  previous_checkpoint: CheckpointSnapshot | null;
  recent_checkpoints: CheckpointSnapshot[];
  what_changed: string[];
  recommendation_changes: ContinuationChangeItem[];
  risk_changes: ContinuationChangeItem[];
  action_changes: ContinuationChangeItem[];
  next_follow_up_actions: string[];
  evidence_update_goal: string;
}

export interface ProgressionSnapshot {
  record_id: string | null;
  task_id: string | null;
  task_title: string;
  deliverable_id: string | null;
  deliverable_title: string | null;
  summary: string;
  action_state_summary: string;
  outcome_summary: string;
  created_at: string | null;
}

export interface ProgressionStateItem {
  title: string;
  state: string;
  summary: string;
}

export interface ProgressionLane {
  latest_progression: ProgressionSnapshot | null;
  previous_progression: ProgressionSnapshot | null;
  recent_progressions: ProgressionSnapshot[];
  what_changed: string[];
  recommendation_states: ProgressionStateItem[];
  action_states: ProgressionStateItem[];
  outcome_signals: string[];
  next_progression_actions: string[];
  evidence_update_goal: string;
}

export interface ContinuationHealthSignal {
  status: "build_baseline" | "watch" | "at_risk" | "steady";
  label: string;
  summary: string;
}

export interface ContinuationTimelineItem {
  kind: "checkpoint" | "progression";
  title: string;
  summary: string;
  created_at: string | null;
  task_id: string | null;
  task_title: string;
  deliverable_id: string | null;
  deliverable_title: string | null;
}

export interface ContinuationOutcomeTracking {
  label: string;
  summary: string;
  latest_signal_summary: string;
  needs_deliverable_refresh: boolean;
  tracked_signal_count: number;
}

export interface ContinuationReviewRhythm {
  label: string;
  summary: string;
  next_review_prompt: string;
}

export interface ContinuationSurface {
  workflow_layer: "closure" | "checkpoint" | "progression";
  mode: EngagementContinuityMode;
  writeback_depth: WritebackDepth;
  current_state: string;
  title: string;
  summary: string;
  primary_action: ContinuationAction | null;
  secondary_actions: ContinuationAction[];
  closure_ready: boolean;
  can_reopen: boolean;
  checkpoint_enabled: boolean;
  outcome_logging_enabled: boolean;
  health_signal: ContinuationHealthSignal | null;
  timeline_items: ContinuationTimelineItem[];
  next_step_queue: string[];
  outcome_tracking: ContinuationOutcomeTracking | null;
  review_rhythm: ContinuationReviewRhythm | null;
  follow_up_lane: FollowUpLane | null;
  progression_lane: ProgressionLane | null;
}

export interface TaskAggregate {
  id: string;
  title: string;
  description: string;
  task_type: TaskType;
  mode: FlowMode;
  external_data_strategy: ExternalDataStrategy;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  client: Client | null;
  engagement: Engagement | null;
  workstream: Workstream | null;
  decision_context: DecisionContext | null;
  slice_decision_context: DecisionContextDelta | null;
  world_decision_context: DecisionContext | null;
  client_stage: string | null;
  client_type: string | null;
  domain_lenses: string[];
  assumptions: string[];
  entry_preset: InputEntryMode;
  input_entry_mode: InputEntryMode;
  engagement_continuity_mode: EngagementContinuityMode;
  writeback_depth: WritebackDepth;
  deliverable_class_hint: DeliverableClass;
  external_research_heavy_candidate: boolean;
  flagship_lane: FlagshipLane;
  sparse_input_summary: string;
  presence_state_summary: PresenceStateSummary;
  pack_resolution: PackResolution;
  agent_selection: AgentSelection;
  source_materials: SourceMaterial[];
  artifacts: Artifact[];
  contexts: TaskContext[];
  subjects: Subject[];
  goals: Goal[];
  constraints: Constraint[];
  uploads: SourceDocument[];
  evidence: Evidence[];
  insights: Insight[];
  risks: Risk[];
  options: Array<Record<string, unknown>>;
  recommendations: Recommendation[];
  action_items: ActionItem[];
  deliverables: Deliverable[];
  runs: TaskRun[];
  case_world_draft: CaseWorldDraft | null;
  case_world_state: CaseWorldState | null;
  world_work_slice_summary: string;
  evidence_gaps: EvidenceGap[];
  research_guidance: ResearchGuidance;
  research_runs: ResearchRun[];
  decision_records: DecisionRecord[];
  action_plans: ActionPlan[];
  action_executions: ActionExecution[];
  outcome_records: OutcomeRecord[];
  audit_events: AuditEvent[];
  object_sets: ObjectSet[];
  canonicalization_summary: CanonicalizationSummary;
  canonicalization_candidates: CanonicalizationCandidate[];
  matter_workspace: MatterWorkspaceSummary | null;
  continuation_surface: ContinuationSurface | null;
}

export interface TaskListItem {
  id: string;
  title: string;
  description: string;
  task_type: TaskType;
  mode: FlowMode;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  client_name: string | null;
  engagement_name: string | null;
  workstream_name: string | null;
  decision_context_title: string | null;
  client_stage: string | null;
  client_type: string | null;
  domain_lenses: string[];
  entry_preset: InputEntryMode;
  input_entry_mode: InputEntryMode;
  engagement_continuity_mode: EngagementContinuityMode;
  writeback_depth: WritebackDepth;
  deliverable_class_hint: DeliverableClass;
  external_research_heavy_candidate: boolean;
  flagship_lane: FlagshipLane;
  selected_pack_ids: string[];
  selected_pack_names: string[];
  pack_summary: string | null;
  selected_agent_ids: string[];
  selected_agent_names: string[];
  agent_summary: string | null;
  evidence_count: number;
  deliverable_count: number;
  run_count: number;
  latest_deliverable_id: string | null;
  latest_deliverable_title: string | null;
  latest_deliverable_summary: string | null;
  latest_deliverable_status: string | null;
  latest_deliverable_version_tag: string | null;
  matter_workspace: MatterWorkspaceSummary | null;
}

export interface MatterWorkspace {
  summary: MatterWorkspaceSummary;
  client: Client | null;
  engagement: Engagement | null;
  workstream: Workstream | null;
  current_decision_context: DecisionContext | null;
  case_world_state: CaseWorldState | null;
  content_sections: MatterWorkspaceContentSections;
  content_revisions: MatterContentRevision[];
  decision_trajectory: MatterDecisionPoint[];
  related_tasks: TaskListItem[];
  related_deliverables: MatterDeliverableSummary[];
  related_artifacts: MatterMaterialSummary[];
  related_source_materials: MatterMaterialSummary[];
  case_world_drafts: CaseWorldDraft[];
  evidence_gaps: EvidenceGap[];
  research_guidance: ResearchGuidance;
  research_runs: ResearchRun[];
  decision_records: DecisionRecord[];
  action_plans: ActionPlan[];
  action_executions: ActionExecution[];
  outcome_records: OutcomeRecord[];
  audit_events: AuditEvent[];
  canonicalization_summary: CanonicalizationSummary;
  canonicalization_candidates: CanonicalizationCandidate[];
  readiness_hint: string;
  continuity_notes: string[];
  continuation_surface: ContinuationSurface | null;
}

export interface ArtifactEvidenceMaterial {
  object_id: string;
  task_id: string;
  task_title: string;
  object_type: string;
  title: string;
  summary: string;
  role_label: string;
  presence_state: PresenceState;
  continuity_scope: string | null;
  participation_type: string | null;
  participation_task_count: number;
  current_task_participation: boolean;
  canonical_owner_scope: string | null;
  compatibility_task_id: string | null;
  mapping_mode: string | null;
  source_type: string | null;
  ingest_status: string | null;
  support_level: string | null;
  ingest_strategy: string | null;
  ingestion_error: string | null;
  source_ref: string | null;
  file_extension: string | null;
  content_type: string | null;
  file_size: number;
  storage_key: string | null;
  retention_policy: string | null;
  purge_at: string | null;
  availability_state: string | null;
  metadata_only: boolean;
  diagnostic_category: string | null;
  extract_availability: string | null;
  current_usable_scope: string | null;
  fallback_mode: string | null;
  linked_evidence_count: number;
  linked_output_count: number;
  created_at: string;
}

export interface EvidenceSupportTarget {
  target_type: string;
  target_id: string | null;
  task_id: string;
  task_title: string;
  title: string;
  note: string;
}

export interface ArtifactEvidenceChain {
  evidence: Evidence;
  task_title: string;
  source_material_title: string | null;
  artifact_title: string | null;
  strength_label: string;
  sufficiency_note: string;
  linked_recommendations: EvidenceSupportTarget[];
  linked_risks: EvidenceSupportTarget[];
  linked_action_items: EvidenceSupportTarget[];
  linked_deliverables: EvidenceSupportTarget[];
}

export interface ArtifactEvidenceWorkspace {
  matter_summary: MatterWorkspaceSummary;
  client: Client | null;
  engagement: Engagement | null;
  workstream: Workstream | null;
  current_decision_context: DecisionContext | null;
  continuation_surface: ContinuationSurface | null;
  related_tasks: TaskListItem[];
  artifact_cards: ArtifactEvidenceMaterial[];
  source_material_cards: ArtifactEvidenceMaterial[];
  evidence_chains: ArtifactEvidenceChain[];
  evidence_expectations: string[];
  high_impact_gaps: string[];
  evidence_gaps: EvidenceGap[];
  research_guidance: ResearchGuidance;
  research_runs: ResearchRun[];
  canonicalization_summary: CanonicalizationSummary;
  canonicalization_candidates: CanonicalizationCandidate[];
  sufficiency_summary: string;
  deliverable_limitations: string[];
  continuity_notes: string[];
  object_sets: ObjectSet[];
}

export interface DeliverableWorkspace {
  deliverable: Deliverable;
  task: TaskAggregate;
  matter_workspace: MatterWorkspaceSummary | null;
  deliverable_class: DeliverableClass;
  workspace_status: string;
  is_latest_for_task: boolean;
  confidence_summary: string;
  deliverable_guidance: string;
  high_impact_gaps: string[];
  limitation_notes: string[];
  linked_source_materials: SourceMaterial[];
  linked_artifacts: Artifact[];
  linked_evidence: Evidence[];
  linked_recommendations: Recommendation[];
  linked_risks: Risk[];
  linked_action_items: ActionItem[];
  related_deliverables: MatterDeliverableSummary[];
  decision_records: DecisionRecord[];
  action_plans: ActionPlan[];
  action_executions: ActionExecution[];
  outcome_records: OutcomeRecord[];
  audit_events: AuditEvent[];
  research_runs: ResearchRun[];
  continuity_notes: string[];
  continuation_surface: ContinuationSurface | null;
  content_sections: DeliverableContentSections;
  content_revisions: DeliverableContentRevision[];
  version_events: DeliverableVersionEvent[];
  artifact_records: DeliverableArtifactRecord[];
  publish_records: DeliverablePublishRecord[];
  object_sets: ObjectSet[];
}

export interface DeliverableVersionEvent {
  id: string;
  deliverable_id: string;
  task_id: string;
  event_type: string;
  version_tag: string;
  deliverable_status: string | null;
  summary: string;
  event_payload: Record<string, unknown>;
  created_at: string;
}

export interface MatterWorkspaceContentSections {
  core_question: string;
  analysis_focus: string;
  constraints_and_risks: string;
  next_steps: string;
}

export interface DeliverableContentSections {
  executive_summary: string;
  recommendations: string[];
  risks: string[];
  action_items: string[];
  evidence_basis: string[];
}

export interface ObjectSetMember {
  id: string;
  object_set_id: string;
  task_id: string;
  member_object_type: string;
  member_object_id: string;
  member_label: string;
  membership_source: ObjectSetMembershipSource;
  ordering_index: number;
  included_reason: string;
  derivation_hint: string;
  support_evidence_id: string | null;
  member_metadata: Record<string, unknown>;
  support_label: string | null;
  created_at: string;
}

export interface ObjectSet {
  id: string;
  task_id: string;
  matter_workspace_id: string | null;
  deliverable_id: string | null;
  set_type: ObjectSetType;
  scope_type: ObjectSetScopeType;
  scope_id: string;
  display_title: string;
  description: string;
  intent: string;
  creation_mode: ObjectSetCreationMode;
  lifecycle_status: ObjectSetLifecycleStatus;
  continuity_scope: string;
  membership_source_summary: Record<string, unknown>;
  member_count: number;
  members: ObjectSetMember[];
  created_at: string;
  updated_at: string;
}

export interface ContentRevisionDiffItem {
  section_key: string;
  section_label: string;
  change_type: string;
  previous_preview: string;
  current_preview: string;
}

export interface MatterContentRevision {
  id: string;
  matter_workspace_id: string;
  object_type: "matter";
  object_id: string;
  source: string;
  revision_summary: string;
  changed_sections: string[];
  diff_summary: ContentRevisionDiffItem[];
  snapshot: MatterWorkspaceContentSections;
  rollback_target_revision_id: string | null;
  created_at: string;
}

export interface DeliverableContentRevision {
  id: string;
  deliverable_id: string;
  task_id: string;
  object_type: "deliverable";
  object_id: string;
  source: string;
  revision_summary: string;
  changed_sections: string[];
  diff_summary: ContentRevisionDiffItem[];
  snapshot: DeliverableContentSections;
  version_tag: string;
  deliverable_status: string | null;
  source_version_event_id: string | null;
  rollback_target_revision_id: string | null;
  created_at: string;
}

export interface DeliverableArtifactRecord {
  id: string;
  deliverable_id: string;
  task_id: string;
  publish_record_id: string | null;
  source_version_event_id: string | null;
  artifact_kind: string;
  artifact_format: string;
  version_tag: string;
  deliverable_status: string | null;
  file_name: string;
  mime_type: string;
  artifact_key: string;
  storage_provider: string;
  retention_policy: string;
  purge_at: string | null;
  availability_state: string;
  artifact_digest: string | null;
  file_size: number;
  created_at: string;
}

export interface DeliverablePublishRecord {
  id: string;
  deliverable_id: string;
  task_id: string;
  source_version_event_id: string | null;
  version_tag: string;
  deliverable_status: string | null;
  publish_note: string;
  artifact_formats: string[];
  created_at: string;
  artifact_records: DeliverableArtifactRecord[];
}

export interface UploadBatchResponse {
  task_id: string;
  matter_workspace_id: string | null;
  world_updated_first: boolean;
  world_update_summary: string;
  uploaded: Array<{
    source_document: SourceDocument;
    evidence: Evidence;
    source_material?: SourceMaterial | null;
    artifact?: Artifact | null;
  }>;
}

export interface SourceIngestPayload {
  urls: string[];
  pasted_text: string;
  pasted_title?: string;
}

export interface SourceIngestBatchResponse {
  task_id: string;
  matter_workspace_id: string | null;
  world_updated_first: boolean;
  world_update_summary: string;
  ingested: Array<{
    source_document: SourceDocument;
    evidence: Evidence;
    source_material?: SourceMaterial | null;
    artifact?: Artifact | null;
  }>;
}

export interface ResearchRunResponse {
  task_id: string;
  run: TaskRun;
  deliverable: Deliverable;
  insights: Insight[];
  risks: Risk[];
  recommendations: Recommendation[];
  action_items: ActionItem[];
}

export interface InitialIntakeFileDescriptor {
  file_name: string;
  content_type?: string;
  file_size: number;
}

export interface TaskCreatePayload {
  title: string;
  description: string;
  task_type: TaskType;
  mode: FlowMode;
  entry_preset: InputEntryMode;
  external_data_strategy: ExternalDataStrategy;
  engagement_continuity_mode: EngagementContinuityMode;
  writeback_depth: WritebackDepth;
  client_name?: string;
  client_type?: string;
  client_stage?: string;
  client_description?: string;
  engagement_name?: string;
  engagement_description?: string;
  workstream_name?: string;
  workstream_description?: string;
  domain_lenses?: string[];
  decision_title?: string;
  decision_summary?: string;
  judgment_to_make?: string;
  background_text: string;
  assumptions?: string;
  notes?: string;
  subject_name?: string;
  subject_type?: string;
  subject_description?: string;
  goal_description?: string;
  goal_type?: string;
  success_criteria?: string;
  constraints: Array<{
    description: string;
    constraint_type: string;
    severity: string;
  }>;
  initial_source_urls?: string[];
  initial_pasted_text?: string;
  initial_pasted_title?: string;
  initial_file_descriptors?: InitialIntakeFileDescriptor[];
}

export interface TaskExtensionOverridePayload {
  pack_override_ids: string[];
  agent_override_ids: string[];
}

export interface TaskWritebackApprovalPayload {
  target_type: "decision_record" | "action_plan";
  target_id: string;
  note: string;
}

export interface MatterWorkspaceMetadataUpdatePayload {
  title: string;
  summary: string;
  status: "active" | "paused" | "closed" | "archived";
}

export interface MatterWorkspaceUpdatePayload extends MatterWorkspaceMetadataUpdatePayload {
  content_sections: MatterWorkspaceContentSections;
}

export interface MatterCanonicalizationReviewPayload {
  review_key: string;
  resolution: "human_confirmed_canonical_row" | "keep_separate" | "split";
  note?: string;
}

export interface DeliverableMetadataUpdatePayload {
  title: string;
  summary: string;
  status: "draft" | "pending_confirmation" | "final" | "archived";
  version_tag: string;
  event_note?: string;
}

export interface DeliverableWorkspaceUpdatePayload extends DeliverableMetadataUpdatePayload {
  content_sections: DeliverableContentSections;
}

export interface DeliverablePublishPayload {
  title: string;
  summary: string;
  version_tag: string;
  publish_note: string;
  artifact_formats: Array<"markdown" | "docx">;
  content_sections: DeliverableContentSections;
}

export interface AdoptionFeedbackPayload {
  feedback_status: AdoptionFeedbackStatus;
  note: string;
}

export interface MatterContinuationActionPayload {
  action: "close" | "reopen" | "checkpoint" | "record_outcome";
  summary?: string;
  note?: string;
  action_status?: "planned" | "in_progress" | "blocked" | "completed" | "review_required";
}
