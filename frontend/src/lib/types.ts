export type FlowMode = "multi_agent" | "specialist";
export type TaskStatus = "draft" | "ready" | "running" | "completed" | "failed";
export type RunStatus = "running" | "completed" | "failed";
export type ExternalDataStrategy = "strict" | "supplemental" | "latest";
export type InputEntryMode =
  | "one_line_inquiry"
  | "single_document_intake"
  | "multi_material_case";
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
export type TaskType =
  | "research_synthesis"
  | "contract_review"
  | "document_restructuring"
  | "complex_convergence";

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

export interface Client {
  id: string;
  task_id: string;
  name: string;
  client_type: string;
  client_stage: string;
  description: string | null;
  created_at: string;
}

export interface Engagement {
  id: string;
  task_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Workstream {
  id: string;
  task_id: string;
  engagement_id: string | null;
  name: string;
  description: string | null;
  domain_lenses: string[];
  created_at: string;
}

export interface DecisionContext {
  id: string;
  task_id: string;
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
  source_type: string;
  file_name: string;
  content_type: string | null;
  storage_path: string;
  file_size: number;
  ingest_status: string;
  extracted_text: string | null;
  created_at: string;
}

export interface SourceMaterial {
  id: string;
  task_id: string;
  source_type: string;
  title: string;
  source_ref: string;
  content_type: string | null;
  ingest_status: string;
  summary: string;
  created_at: string;
}

export interface Artifact {
  id: string;
  task_id: string;
  title: string;
  artifact_type: string;
  source_document_id: string | null;
  source_material_id: string | null;
  description: string;
  created_at: string;
}

export interface Evidence {
  id: string;
  task_id: string;
  source_document_id: string | null;
  evidence_type: string;
  source_type: string;
  source_ref: string | null;
  title: string;
  excerpt_or_summary: string;
  reliability_level: string;
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
  created_at: string;
}

export interface Recommendation {
  id: string;
  task_id: string;
  summary: string;
  rationale: string;
  based_on_refs: string[];
  priority: string;
  owner_suggestion: string | null;
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
  status: string;
  created_at: string;
}

export interface Deliverable {
  id: string;
  task_id: string;
  task_run_id: string | null;
  deliverable_type: string;
  title: string;
  content_structure: Record<string, unknown>;
  version: number;
  generated_at: string;
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
  client_stage: string | null;
  client_type: string | null;
  domain_lenses: string[];
  assumptions: string[];
  input_entry_mode: InputEntryMode;
  deliverable_class_hint: DeliverableClass;
  external_research_heavy_candidate: boolean;
  sparse_input_summary: string;
  presence_state_summary: PresenceStateSummary;
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
  evidence_count: number;
  deliverable_count: number;
  run_count: number;
  latest_deliverable_title: string | null;
}

export interface UploadBatchResponse {
  task_id: string;
  uploaded: Array<{
    source_document: SourceDocument;
    evidence: Evidence;
  }>;
}

export interface SourceIngestPayload {
  urls: string[];
  pasted_text: string;
  pasted_title?: string;
}

export interface SourceIngestBatchResponse {
  task_id: string;
  ingested: Array<{
    source_document: SourceDocument;
    evidence: Evidence;
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

export interface TaskCreatePayload {
  title: string;
  description: string;
  task_type: TaskType;
  mode: FlowMode;
  external_data_strategy: ExternalDataStrategy;
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
}
