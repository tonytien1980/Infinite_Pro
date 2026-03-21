export type FlowMode = "multi_agent" | "specialist";
export type TaskStatus = "draft" | "ready" | "running" | "completed" | "failed";
export type RunStatus = "running" | "completed" | "failed";
export type TaskType =
  | "research_synthesis"
  | "contract_review"
  | "document_restructuring"
  | "complex_convergence";

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
  status: TaskStatus;
  created_at: string;
  updated_at: string;
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
