import {
  ArtifactEvidenceWorkspace,
  AdoptionFeedbackPayload,
  AgentContractDraftPayload,
  AgentContractDraftResult,
  AgentCatalogEntryUpdatePayload,
  DeliverableArtifactRecord,
  DeliverablePublishPayload,
  DeliverableWorkspace,
  DeliverableMetadataUpdatePayload,
  DeliverableWorkspaceUpdatePayload,
  ExtensionManagerSnapshot,
  HistoryVisibilityState,
  HistoryVisibilityUpdatePayload,
  MatterWorkspace,
  MatterContinuationActionPayload,
  MatterCanonicalizationReviewPayload,
  PrecedentDuplicateReviewPayload,
  PrecedentGovernanceApplyPayload,
  PrecedentReviewResponse,
  SharedIntelligenceSignOffPayload,
  MatterWorkspaceMetadataUpdatePayload,
  MatterWorkspaceSummary,
  PackContractDraftPayload,
  PackContractDraftResult,
  PrecedentCandidateStatusUpdatePayload,
  ProviderValidationResult,
  MatterWorkspaceUpdatePayload,
  PackCatalogEntryUpdatePayload,
  ResearchRunResponse,
  SourceIngestBatchResponse,
  SourceIngestPayload,
  SystemProviderSettingsPayload,
  SystemProviderSettingsSnapshot,
  SystemProviderSettingsUpdatePayload,
  TaskAggregate,
  TaskCreatePayload,
  TaskExtensionOverridePayload,
  TaskWritebackApprovalPayload,
  TaskListItem,
  UploadBatchResponse,
  WorkbenchSettings,
  SessionState,
  MemberInviteRead,
  MemberListSnapshot,
  MemberRead,
  DemoWorkspaceSnapshot,
  DemoWorkspacePolicySnapshot,
  DemoWorkspacePolicyUpdatePayload,
  FirmOperatingSnapshot,
  PersonalProviderSettingsPayload,
  PhaseFiveClosureReview,
  PhaseSixCapabilityCoverageAudit,
  PhaseSixCloseoutReview,
  PhaseSixCompletionReview,
  PhaseSixClosureCriteriaReview,
  PhaseSixMaturityReview,
  PhaseSixCalibrationAwareWeighting,
  PhaseSixConfidenceCalibration,
  PhaseSixContextDistanceAudit,
  PhaseSixGeneralistGuidancePosture,
  PhaseSixReuseBoundaryGovernance,
  PersonalProviderSettingsSnapshot,
  PersonalProviderSettingsUpdatePayload,
  ProviderAllowlistSnapshot,
} from "@/lib/types";

function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  if (typeof window !== "undefined") {
    const resolvedHost =
      window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname;
    return `${window.location.protocol}//${resolvedHost}:8000/api/v1`;
  }

  return "http://127.0.0.1:8000/api/v1";
}

function apiFetch(input: string, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    credentials: init.credentials ?? "include",
  });
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const rawText = await response.text();
    let detail = rawText;

    try {
      const parsed = JSON.parse(rawText);
      detail = parsed.detail ?? rawText;
    } catch {
      detail = rawText;
    }

    const error = new Error(detail || "請求失敗。") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return (await response.json()) as T;
}

export async function getCurrentSession(): Promise<SessionState> {
  const response = await apiFetch(`${getApiBaseUrl()}/auth/me`, {
    cache: "no-store",
  });
  const payload = await parseResponse<{
    user: {
      id: string;
      email: string;
      full_name: string;
      avatar_url: string | null;
    };
    firm: {
      id: string;
      name: string;
      slug: string;
    };
    membership: {
      id: string;
      role: "owner" | "consultant" | "demo";
      status: "active" | "disabled";
    };
    permissions: string[];
  }>(response);
  return {
    user: {
      id: payload.user.id,
      email: payload.user.email,
      fullName: payload.user.full_name,
      avatarUrl: payload.user.avatar_url,
    },
    firm: payload.firm,
    membership: payload.membership,
    permissions: payload.permissions,
  };
}

export async function startGoogleLogin(): Promise<{ authorizationUrl: string }> {
  const response = await apiFetch(`${getApiBaseUrl()}/auth/google/start`, {
    cache: "no-store",
  });
  const payload = await parseResponse<{ state: string; authorization_url: string }>(response);
  return { authorizationUrl: payload.authorization_url };
}

export async function logoutCurrentSession(): Promise<void> {
  const response = await apiFetch(`${getApiBaseUrl()}/auth/logout`, {
    method: "POST",
  });
  await parseResponse<{ status: string }>(response);
}

export async function listMembers(): Promise<MemberListSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/members`, {
    cache: "no-store",
  });
  const payload = await parseResponse<{
    members: Array<{
      id: string;
      email: string;
      full_name: string;
      role: "owner" | "consultant" | "demo";
      status: "active" | "disabled";
    }>;
    pending_invites: Array<{
      id: string;
      email: string;
      role: "consultant" | "demo";
      status: "pending" | "accepted" | "revoked";
    }>;
    summary?: {
      active_demo_member_count?: number;
      pending_demo_invite_count?: number;
    };
  }>(response);
  return {
    members: payload.members.map((member) => ({
      id: member.id,
      email: member.email,
      fullName: member.full_name,
      role: member.role,
      status: member.status,
    })),
    pendingInvites: payload.pending_invites,
    summary: {
      activeDemoMemberCount: payload.summary?.active_demo_member_count ?? 0,
      pendingDemoInviteCount: payload.summary?.pending_demo_invite_count ?? 0,
    },
  };
}

export async function getDemoWorkspaceSnapshot(): Promise<DemoWorkspaceSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/demo/workspace`, {
    cache: "no-store",
  });
  const payload = await parseResponse<any>(response);
  return {
    workspaceMode: payload.workspace_mode,
    title: payload.title,
    subtitle: payload.subtitle,
    entryMessage: payload.entry_message,
    heroSummary: payload.hero_summary || "",
    showcaseHighlights: Array.isArray(payload.showcase_highlights) ? payload.showcase_highlights : [],
    readOnlyRules: Array.isArray(payload.read_only_rules) ? payload.read_only_rules : [],
    formalWorkspaceExplainer: payload.formal_workspace_explainer || "",
    sections: (payload.sections || []).map((section: any) => ({
      sectionId: section.section_id,
      title: section.title,
      summary: section.summary,
      items: Array.isArray(section.items) ? section.items : [],
    })),
  };
}

export async function getDemoWorkspacePolicy(): Promise<DemoWorkspacePolicySnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/demo-workspace-policy`, {
    cache: "no-store",
  });
  return parseDemoWorkspacePolicyPayload(await parseResponse<any>(response));
}

export async function updateDemoWorkspacePolicy(
  payload: DemoWorkspacePolicyUpdatePayload,
): Promise<DemoWorkspacePolicySnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/demo-workspace-policy`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: payload.status,
      max_active_demo_members: payload.maxActiveDemoMembers,
    }),
  });
  return parseDemoWorkspacePolicyPayload(await parseResponse<any>(response));
}

export async function getFirmOperatingSnapshot(): Promise<FirmOperatingSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/firm-operating-snapshot`, {
    cache: "no-store",
  });
  return parseFirmOperatingSnapshotPayload(await parseResponse<any>(response));
}

export async function getPhaseFiveClosureReview(): Promise<PhaseFiveClosureReview> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/phase-5-closure-review`, {
    cache: "no-store",
  });
  return parsePhaseFiveClosureReviewPayload(await parseResponse<any>(response));
}

export async function getPhaseSixCapabilityCoverageAudit(): Promise<PhaseSixCapabilityCoverageAudit> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/workbench/phase-6-capability-coverage-audit`,
    {
      cache: "no-store",
    },
  );
  return parsePhaseSixCapabilityCoverageAuditPayload(await parseResponse<any>(response));
}

export async function getPhaseSixMaturityReview(): Promise<PhaseSixMaturityReview> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/phase-6-maturity-review`, {
    cache: "no-store",
  });
  return parsePhaseSixMaturityReviewPayload(await parseResponse<any>(response));
}

export async function getPhaseSixClosureCriteriaReview(): Promise<PhaseSixClosureCriteriaReview> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/phase-6-closure-criteria`, {
    cache: "no-store",
  });
  return parsePhaseSixClosureCriteriaReviewPayload(await parseResponse<any>(response));
}

export async function getPhaseSixCompletionReview(): Promise<PhaseSixCompletionReview> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/phase-6-completion-review`, {
    cache: "no-store",
  });
  return parsePhaseSixCompletionReviewPayload(await parseResponse<any>(response));
}

export async function getPhaseSixCloseoutReview(): Promise<PhaseSixCloseoutReview> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/phase-6-closeout-review`, {
    cache: "no-store",
  });
  return parsePhaseSixCloseoutReviewPayload(await parseResponse<any>(response));
}

export async function checkpointPhaseSixCompletionReview(
  payload: SharedIntelligenceSignOffPayload,
): Promise<PhaseSixCompletionReview> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/workbench/phase-6-completion-review/checkpoint`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  return parsePhaseSixCompletionReviewPayload(await parseResponse<any>(response));
}

export async function signOffPhaseSix(
  payload: SharedIntelligenceSignOffPayload,
): Promise<PhaseSixCompletionReview> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/phase-6-sign-off`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parsePhaseSixCompletionReviewPayload(await parseResponse<any>(response));
}

export async function getPhaseSixReuseBoundaryGovernance(): Promise<PhaseSixReuseBoundaryGovernance> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/workbench/phase-6-reuse-boundary-governance`,
    {
      cache: "no-store",
    },
  );
  return parsePhaseSixReuseBoundaryGovernancePayload(await parseResponse<any>(response));
}

export async function getPhaseSixGeneralistGuidancePosture(): Promise<PhaseSixGeneralistGuidancePosture> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/workbench/phase-6-generalist-guidance-posture`,
    {
      cache: "no-store",
    },
  );
  return parsePhaseSixGeneralistGuidancePosturePayload(await parseResponse<any>(response));
}

export async function getPhaseSixContextDistanceAudit(): Promise<PhaseSixContextDistanceAudit> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/workbench/phase-6-context-distance-audit`,
    {
      cache: "no-store",
    },
  );
  return parsePhaseSixContextDistanceAuditPayload(await parseResponse<any>(response));
}

export async function getPhaseSixConfidenceCalibration(): Promise<PhaseSixConfidenceCalibration> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/workbench/phase-6-confidence-calibration`,
    {
      cache: "no-store",
    },
  );
  return parsePhaseSixConfidenceCalibrationPayload(await parseResponse<any>(response));
}

export async function getPhaseSixCalibrationAwareWeighting(): Promise<PhaseSixCalibrationAwareWeighting> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/workbench/phase-6-calibration-aware-weighting`,
    {
      cache: "no-store",
    },
  );
  return parsePhaseSixCalibrationAwareWeightingPayload(await parseResponse<any>(response));
}

export async function signOffPhaseFive(
  payload: SharedIntelligenceSignOffPayload,
): Promise<PhaseFiveClosureReview> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/phase-5-sign-off`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parsePhaseFiveClosureReviewPayload(await parseResponse<any>(response));
}

export async function createMemberInvite(payload: {
  email: string;
  role: "consultant" | "demo";
}): Promise<MemberInviteRead> {
  const response = await apiFetch(`${getApiBaseUrl()}/members/invites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<MemberInviteRead>(response);
}

export async function revokeMemberInvite(inviteId: string): Promise<MemberInviteRead> {
  const response = await apiFetch(`${getApiBaseUrl()}/members/invites/${inviteId}/revoke`, {
    method: "POST",
  });
  return parseResponse<MemberInviteRead>(response);
}

export async function updateMemberRole(
  membershipId: string,
  payload: {
    role: "owner" | "consultant" | "demo";
    status: "active" | "disabled";
  },
): Promise<MemberRead> {
  const response = await apiFetch(`${getApiBaseUrl()}/members/${membershipId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const member = await parseResponse<{
    id: string;
    email: string;
    full_name: string;
    role: "owner" | "consultant" | "demo";
    status: "active" | "disabled";
  }>(response);
  return {
    id: member.id,
    email: member.email,
    fullName: member.full_name,
    role: member.role,
    status: member.status,
  };
}

export async function listTasks(): Promise<TaskListItem[]> {
  const response = await apiFetch(`${getApiBaseUrl()}/tasks`, {
    cache: "no-store",
  });
  return parseResponse<TaskListItem[]>(response);
}

export async function getPrecedentReviewState(): Promise<PrecedentReviewResponse> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/precedent-candidates`, {
    cache: "no-store",
  });
  return parseResponse<PrecedentReviewResponse>(response);
}

export async function updatePrecedentDuplicateReview(
  matterWorkspaceId: string,
  payload: PrecedentDuplicateReviewPayload,
): Promise<PrecedentReviewResponse> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/workbench/matters/${matterWorkspaceId}/precedent-duplicate-review`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  return parseResponse<PrecedentReviewResponse>(response);
}

export async function applyPrecedentGovernanceRecommendation(
  candidateId: string,
  payload: PrecedentGovernanceApplyPayload,
): Promise<PrecedentReviewResponse> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/workbench/precedent-candidates/${candidateId}/apply-governance-recommendation`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  return parseResponse<PrecedentReviewResponse>(response);
}

export async function signOffSharedIntelligencePhase(
  payload: SharedIntelligenceSignOffPayload,
): Promise<PrecedentReviewResponse> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/workbench/shared-intelligence/phase-4-sign-off`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  return parseResponse<PrecedentReviewResponse>(response);
}

export async function getTask(taskId: string): Promise<TaskAggregate> {
  const response = await apiFetch(`${getApiBaseUrl()}/tasks/${taskId}`, {
    cache: "no-store",
  });
  return parseResponse<TaskAggregate>(response);
}

export async function approveTaskWriteback(
  taskId: string,
  payload: TaskWritebackApprovalPayload,
): Promise<TaskAggregate> {
  const response = await apiFetch(`${getApiBaseUrl()}/tasks/${taskId}/writeback-approval`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<TaskAggregate>(response);
}

export async function applyRecommendationFeedback(
  taskId: string,
  recommendationId: string,
  payload: AdoptionFeedbackPayload,
): Promise<TaskAggregate> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/tasks/${taskId}/recommendations/${recommendationId}/feedback`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  return parseResponse<TaskAggregate>(response);
}

export async function updateRecommendationPrecedentCandidateStatus(
  taskId: string,
  recommendationId: string,
  payload: PrecedentCandidateStatusUpdatePayload,
): Promise<TaskAggregate> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/tasks/${taskId}/recommendations/${recommendationId}/precedent-candidate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  return parseResponse<TaskAggregate>(response);
}

export async function getExtensionManager(): Promise<ExtensionManagerSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/extensions/manager`, {
    cache: "no-store",
  });
  return parseResponse<ExtensionManagerSnapshot>(response);
}

export async function updateAgentCatalogEntry(
  agentId: string,
  payload: AgentCatalogEntryUpdatePayload,
): Promise<ExtensionManagerSnapshot> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await apiFetch(`${apiBaseUrl}/extensions/agents/${agentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<ExtensionManagerSnapshot>(response);
}

export async function updatePackCatalogEntry(
  packId: string,
  payload: PackCatalogEntryUpdatePayload,
): Promise<ExtensionManagerSnapshot> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await apiFetch(`${apiBaseUrl}/extensions/packs/${packId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<ExtensionManagerSnapshot>(response);
}

export async function updateDeliverablePrecedentCandidateStatus(
  deliverableId: string,
  payload: PrecedentCandidateStatusUpdatePayload,
): Promise<DeliverableWorkspace> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/deliverables/${deliverableId}/precedent-candidate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  return parseResponse<DeliverableWorkspace>(response);
}

export async function draftAgentContract(
  payload: AgentContractDraftPayload,
): Promise<AgentContractDraftResult> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await apiFetch(`${apiBaseUrl}/extensions/agents/contract-draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<AgentContractDraftResult>(response);
}

export async function draftPackContract(
  payload: PackContractDraftPayload,
): Promise<PackContractDraftResult> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await apiFetch(`${apiBaseUrl}/extensions/packs/contract-draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<PackContractDraftResult>(response);
}

export async function getWorkbenchPreferences(): Promise<WorkbenchSettings> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/preferences`, {
    cache: "no-store",
  });
  return getWorkbenchPreferencesFromPayload(await parseWorkbenchPreferencesPayload(response));
}

export async function updateWorkbenchPreferences(
  payload: WorkbenchSettings,
): Promise<WorkbenchSettings> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/preferences`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      interface_language: payload.interfaceLanguage,
      theme_preference: payload.themePreference,
      homepage_display_preference: payload.homepageDisplayPreference,
      history_default_page_size: payload.historyDefaultPageSize,
      show_recent_activity: payload.showRecentActivity,
      show_frequent_extensions: payload.showFrequentExtensions,
      new_task_default_input_mode: payload.newTaskDefaultInputMode,
      density: payload.density,
      deliverable_sort_preference: payload.deliverableSortPreference,
    }),
  });
  return getWorkbenchPreferencesFromPayload(await parseWorkbenchPreferencesPayload(response));
}

export async function getSystemProviderSettings(): Promise<SystemProviderSettingsSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/provider-settings`, {
    cache: "no-store",
  });
  return parseSystemProviderSettingsPayload(await parseResponse<any>(response));
}

export async function validateSystemProviderSettings(
  payload: SystemProviderSettingsPayload,
): Promise<ProviderValidationResult> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/provider-settings/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider_id: payload.providerId,
      model_level: payload.modelLevel,
      model_id: payload.modelId,
      custom_model_id: payload.customModelId,
      base_url: payload.baseUrl,
      timeout_seconds: payload.timeoutSeconds,
      api_key: payload.apiKey,
      keep_existing_key: payload.keepExistingKey,
    }),
  });
  return parseProviderValidationPayload(await parseResponse<any>(response));
}

export async function updateSystemProviderSettings(
  payload: SystemProviderSettingsUpdatePayload,
): Promise<SystemProviderSettingsSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/provider-settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider_id: payload.providerId,
      model_level: payload.modelLevel,
      model_id: payload.modelId,
      custom_model_id: payload.customModelId,
      base_url: payload.baseUrl,
      timeout_seconds: payload.timeoutSeconds,
      api_key: payload.apiKey,
      keep_existing_key: payload.keepExistingKey,
      validate_before_save: payload.validateBeforeSave,
      force_save_without_validation: payload.forceSaveWithoutValidation,
    }),
  });
  return parseSystemProviderSettingsPayload(await parseResponse<any>(response));
}

export async function revalidateSystemProviderSettings(): Promise<SystemProviderSettingsSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/provider-settings/revalidate`, {
    method: "POST",
  });
  return parseSystemProviderSettingsPayload(await parseResponse<any>(response));
}

export async function resetSystemProviderSettingsToEnv(): Promise<SystemProviderSettingsSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/provider-settings/reset-to-env`, {
    method: "POST",
  });
  return parseSystemProviderSettingsPayload(await parseResponse<any>(response));
}

export async function getPersonalProviderSettings(): Promise<PersonalProviderSettingsSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/personal-provider-settings`, {
    cache: "no-store",
  });
  return parsePersonalProviderSettingsPayload(await parseResponse<any>(response));
}

export async function validatePersonalProviderSettings(
  payload: PersonalProviderSettingsPayload,
): Promise<ProviderValidationResult> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/personal-provider-settings/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider_id: payload.providerId,
      model_level: payload.modelLevel,
      model_id: payload.modelId,
      custom_model_id: payload.customModelId,
      base_url: payload.baseUrl,
      timeout_seconds: payload.timeoutSeconds,
      api_key: payload.apiKey,
      keep_existing_key: payload.keepExistingKey,
    }),
  });
  return parseProviderValidationPayload(await parseResponse<any>(response));
}

export async function updatePersonalProviderSettings(
  payload: PersonalProviderSettingsUpdatePayload,
): Promise<PersonalProviderSettingsSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/personal-provider-settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider_id: payload.providerId,
      model_level: payload.modelLevel,
      model_id: payload.modelId,
      custom_model_id: payload.customModelId,
      base_url: payload.baseUrl,
      timeout_seconds: payload.timeoutSeconds,
      api_key: payload.apiKey,
      keep_existing_key: payload.keepExistingKey,
      validate_before_save: payload.validateBeforeSave,
      force_save_without_validation: payload.forceSaveWithoutValidation,
    }),
  });
  return parsePersonalProviderSettingsPayload(await parseResponse<any>(response));
}

export async function revalidatePersonalProviderSettings(): Promise<PersonalProviderSettingsSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/personal-provider-settings/revalidate`, {
    method: "POST",
  });
  return parsePersonalProviderSettingsPayload(await parseResponse<any>(response));
}

export async function getProviderAllowlist(): Promise<ProviderAllowlistSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/provider-allowlist`, {
    cache: "no-store",
  });
  return parseProviderAllowlistPayload(await parseResponse<any>(response));
}

export async function updateProviderAllowlist(payload: ProviderAllowlistSnapshot): Promise<ProviderAllowlistSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/provider-allowlist`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      entries: payload.entries.map((entry) => ({
        provider_id: entry.providerId,
        model_level: entry.modelLevel,
        allowed_model_ids: entry.allowedModelIds,
        allow_custom_model: entry.allowCustomModel,
        status: entry.status,
      })),
    }),
  });
  return parseProviderAllowlistPayload(await parseResponse<any>(response));
}

async function parseWorkbenchPreferencesPayload(response: Response) {
  return parseResponse<{
    interface_language: WorkbenchSettings["interfaceLanguage"];
    theme_preference: WorkbenchSettings["themePreference"];
    homepage_display_preference: WorkbenchSettings["homepageDisplayPreference"];
    history_default_page_size: number;
    show_recent_activity: boolean;
    show_frequent_extensions: boolean;
    new_task_default_input_mode: WorkbenchSettings["newTaskDefaultInputMode"];
    density: WorkbenchSettings["density"];
    deliverable_sort_preference: WorkbenchSettings["deliverableSortPreference"];
  }>(response);
}

function getWorkbenchPreferencesFromPayload(payload: {
  interface_language: WorkbenchSettings["interfaceLanguage"];
  theme_preference: WorkbenchSettings["themePreference"];
  homepage_display_preference: WorkbenchSettings["homepageDisplayPreference"];
  history_default_page_size: number;
  show_recent_activity: boolean;
  show_frequent_extensions: boolean;
  new_task_default_input_mode: WorkbenchSettings["newTaskDefaultInputMode"];
  density: WorkbenchSettings["density"];
  deliverable_sort_preference: WorkbenchSettings["deliverableSortPreference"];
}): WorkbenchSettings {
  return {
    interfaceLanguage: payload.interface_language,
    themePreference: payload.theme_preference,
    homepageDisplayPreference: payload.homepage_display_preference,
    historyDefaultPageSize: payload.history_default_page_size,
    showRecentActivity: payload.show_recent_activity,
    showFrequentExtensions: payload.show_frequent_extensions,
    newTaskDefaultInputMode: payload.new_task_default_input_mode,
    density: payload.density,
    deliverableSortPreference: payload.deliverable_sort_preference,
  };
}

function parseProviderValidationPayload(payload: any): ProviderValidationResult {
  return {
    providerId: payload.provider_id,
    providerDisplayName: payload.provider_display_name,
    modelId: payload.model_id,
    validationStatus: payload.validation_status,
    message: payload.message,
    detail: payload.detail,
    validatedAt: payload.validated_at,
  };
}

function parseCurrentProviderConfigPayload(payload: any) {
  return {
    source: payload.source,
    providerId: payload.provider_id,
    providerDisplayName: payload.provider_display_name,
    modelLevel: payload.model_level,
    actualModelId: payload.actual_model_id,
    customModelId: payload.custom_model_id,
    baseUrl: payload.base_url,
    timeoutSeconds: payload.timeout_seconds,
    apiKeyConfigured: payload.api_key_configured,
    apiKeyMasked: payload.api_key_masked,
    lastValidationStatus: payload.last_validation_status,
    lastValidationMessage: payload.last_validation_message,
    lastValidatedAt: payload.last_validated_at,
    updatedAt: payload.updated_at,
    keyUpdatedAt: payload.key_updated_at,
    presetRuntimeSupportLevel: payload.preset_runtime_support_level,
    usingEnvBaseline: payload.using_env_baseline,
  };
}

function parseSystemProviderSettingsPayload(payload: any): SystemProviderSettingsSnapshot {
  return {
    current: parseCurrentProviderConfigPayload(payload.current),
    envBaseline: parseCurrentProviderConfigPayload(payload.env_baseline),
    presets: (payload.presets || []).map((preset: any) => ({
      providerId: preset.provider_id,
      displayName: preset.display_name,
      defaultBaseUrl: preset.default_base_url,
      defaultTimeoutSeconds: preset.default_timeout_seconds,
      authSchemeType: preset.auth_scheme_type,
      adapterKind: preset.adapter_kind,
      runtimeSupportLevel: preset.runtime_support_level,
      validationSupportLevel: preset.validation_support_level,
      recommendedModels: {
        high_quality: preset.recommended_models.high_quality,
        balanced: preset.recommended_models.balanced,
        low_cost: preset.recommended_models.low_cost,
      },
      })),
  };
}

function parsePersonalProviderSettingsPayload(payload: any): PersonalProviderSettingsSnapshot {
  return {
    current: parseCurrentProviderConfigPayload(payload.current),
    presets: (payload.presets || []).map((preset: any) => ({
      providerId: preset.provider_id,
      displayName: preset.display_name,
      defaultBaseUrl: preset.default_base_url,
      defaultTimeoutSeconds: preset.default_timeout_seconds,
      authSchemeType: preset.auth_scheme_type,
      adapterKind: preset.adapter_kind,
      runtimeSupportLevel: preset.runtime_support_level,
      validationSupportLevel: preset.validation_support_level,
      recommendedModels: {
        high_quality: preset.recommended_models.high_quality,
        balanced: preset.recommended_models.balanced,
        low_cost: preset.recommended_models.low_cost,
      },
    })),
  };
}

function parseProviderAllowlistPayload(payload: any): ProviderAllowlistSnapshot {
  return {
    entries: (payload.entries || []).map((entry: any) => ({
      providerId: entry.provider_id,
      modelLevel: entry.model_level,
      allowedModelIds: Array.isArray(entry.allowed_model_ids) ? entry.allowed_model_ids : [],
      allowCustomModel: Boolean(entry.allow_custom_model),
      status: entry.status === "inactive" ? "inactive" : "active",
    })),
  };
}

function parseDemoWorkspacePolicyPayload(payload: any): DemoWorkspacePolicySnapshot {
  return {
    status: payload.status === "inactive" ? "inactive" : "active",
    workspaceSlug: payload.workspace_slug || "demo",
    seedVersion: payload.seed_version || "v1",
    maxActiveDemoMembers: Number(payload.max_active_demo_members ?? 0),
  };
}

function parseFirmOperatingSnapshotPayload(payload: any): FirmOperatingSnapshot {
  return {
    role: payload.role === "consultant" ? "consultant" : "owner",
    operatingPosture:
      payload.operating_posture === "attention_needed" ? "attention_needed" : "steady",
    operatingSummary: payload.operating_summary || "",
    priorityNote: payload.priority_note || "",
    actionLabel: payload.action_label || "",
    actionHref: payload.action_href || "/",
    signals: Array.isArray(payload.signals)
      ? payload.signals.map((signal: any) => ({
          signalId: signal.signal_id,
          label: signal.label,
          value: signal.value,
          status: signal.status === "attention" ? "attention" : "ok",
          detail: signal.detail || "",
        }))
      : [],
  };
}

function parsePhaseFiveClosureReviewPayload(payload: any): PhaseFiveClosureReview {
  return {
    phase_id: "phase_5",
    phase_label: payload.phase_label || "",
    closure_status:
      payload.closure_status === "signed_off"
        ? "signed_off"
        : payload.closure_status === "ready_to_close"
          ? "ready_to_close"
          : "completion_pass",
    closure_status_label: payload.closure_status_label || "",
    summary: payload.summary || "",
    foundation_snapshot: payload.foundation_snapshot || "",
    completed_count: Number(payload.completed_count ?? 0),
    remaining_count: Number(payload.remaining_count ?? 0),
    completed_items: Array.isArray(payload.completed_items) ? payload.completed_items : [],
    asset_audits: Array.isArray(payload.asset_audits)
      ? payload.asset_audits.map((item: any) => ({
          asset_code: item.asset_code,
          asset_label: item.asset_label || "",
          audit_status: item.audit_status === "needs_followup" ? "needs_followup" : "audited",
          audit_status_label: item.audit_status_label || "",
          summary: item.summary || "",
          next_step: item.next_step || "",
        }))
      : [],
    remaining_items: Array.isArray(payload.remaining_items) ? payload.remaining_items : [],
    recommended_next_step: payload.recommended_next_step || "",
    signed_off_at: payload.signed_off_at || null,
    signed_off_by_label: payload.signed_off_by_label || "",
    next_phase_label: payload.next_phase_label || "",
    handoff_summary: payload.handoff_summary || "",
    handoff_items: Array.isArray(payload.handoff_items) ? payload.handoff_items : [],
  };
}

function parsePhaseSixCapabilityCoverageAuditPayload(payload: any): PhaseSixCapabilityCoverageAudit {
  return {
    phaseId: "phase_6",
    phaseLabel: payload.phase_label || "",
    auditStatus: payload.audit_status === "balanced" ? "balanced" : "watch_drift",
    auditStatusLabel: payload.audit_status_label || "",
    coverageSummary: payload.coverage_summary || "",
    generalistPosture:
      payload.generalist_posture === "broad" ? "broad" : "watching_bias",
    generalistPostureLabel: payload.generalist_posture_label || "",
    priorityNote: payload.priority_note || "",
    coverageAreas: Array.isArray(payload.coverage_areas)
      ? payload.coverage_areas.map((item: any) => ({
          areaId: item.area_id,
          areaLabel: item.area_label || "",
          coverageStatus:
            item.coverage_status === "thin"
              ? "thin"
              : item.coverage_status === "overweighted"
                ? "overweighted"
                : "steady",
          coverageStatusLabel: item.coverage_status_label || "",
          summary: item.summary || "",
        }))
      : [],
    reuseBoundaryItems: Array.isArray(payload.reuse_boundary_items)
      ? payload.reuse_boundary_items.map((item: any) => ({
          assetCode: item.asset_code,
          assetLabel: item.asset_label || "",
          boundaryStatus:
            item.boundary_status === "generalizable"
              ? "generalizable"
              : item.boundary_status === "narrow_use"
                ? "narrow_use"
                : "contextual",
          boundaryStatusLabel: item.boundary_status_label || "",
          summary: item.summary || "",
        }))
      : [],
    recommendedNextStep: payload.recommended_next_step || "",
  };
}

function parsePhaseSixMaturityReviewPayload(payload: any): PhaseSixMaturityReview {
  return {
    phaseId: "phase_6",
    phaseLabel: payload.phase_label || "",
    maturityStage:
      payload.maturity_stage === "foundation_lane"
        ? "foundation_lane"
        : payload.maturity_stage === "closure_preparation"
          ? "closure_preparation"
          : "refinement_lane",
    maturityStageLabel: payload.maturity_stage_label || "",
    summary: payload.summary || "",
    maturitySnapshot: payload.maturity_snapshot || "",
    completedCount: Number(payload.completed_count ?? 0),
    remainingCount: Number(payload.remaining_count ?? 0),
    milestoneAudits: Array.isArray(payload.milestone_audits)
      ? payload.milestone_audits.map((item: any) => ({
          milestoneCode: item.milestone_code,
          milestoneLabel: item.milestone_label || "",
          milestoneStatus: item.milestone_status === "stabilizing" ? "stabilizing" : "landed",
          milestoneStatusLabel: item.milestone_status_label || "",
          summary: item.summary || "",
        }))
      : [],
    remainingFocusItems: Array.isArray(payload.remaining_focus_items)
      ? payload.remaining_focus_items.filter((item: unknown) => typeof item === "string")
      : [],
    recommendedNextStep: payload.recommended_next_step || "",
  };
}

function parsePhaseSixClosureCriteriaReviewPayload(payload: any): PhaseSixClosureCriteriaReview {
  return {
    phaseId: "phase_6",
    phaseLabel: payload.phase_label || "",
    closurePosture:
      payload.closure_posture === "not_ready"
        ? "not_ready"
        : payload.closure_posture === "ready_for_completion_review"
          ? "ready_for_completion_review"
          : "building_closure_basis",
    closurePostureLabel: payload.closure_posture_label || "",
    summary: payload.summary || "",
    closureSnapshot: payload.closure_snapshot || "",
    feedbackLoopSummary: payload.feedback_loop_summary || "",
    feedbackSignalCount: Number(payload.feedback_signal_count ?? 0),
    governedOutcomeCount: Number(payload.governed_outcome_count ?? 0),
    criteriaItems: Array.isArray(payload.criteria_items)
      ? payload.criteria_items.map((item: any) => ({
          criterionCode: item.criterion_code,
          criterionLabel: item.criterion_label || "",
          criterionStatus:
            item.criterion_status === "landed"
              ? "landed"
              : item.criterion_status === "watching"
                ? "watching"
                : "needs_followup",
          criterionStatusLabel: item.criterion_status_label || "",
          summary: item.summary || "",
          nextStep: item.next_step || "",
        }))
      : [],
    remainingBlockers: Array.isArray(payload.remaining_blockers)
      ? payload.remaining_blockers.filter((item: unknown) => typeof item === "string")
      : [],
    recommendedNextStep: payload.recommended_next_step || "",
  };
}

function parsePhaseSixCompletionReviewPayload(payload: any): PhaseSixCompletionReview {
  return {
    phaseId: "phase_6",
    phaseLabel: payload.phase_label || "",
    reviewPosture:
      payload.review_posture === "review_ready"
        ? "review_ready"
        : payload.review_posture === "checkpoint_recorded"
          ? "checkpoint_recorded"
          : "baseline_only",
    reviewPostureLabel: payload.review_posture_label || "",
    summary: payload.summary || "",
    overallScore: Number(payload.overall_score ?? 0),
    scorecardItems: Array.isArray(payload.scorecard_items)
      ? payload.scorecard_items.map((item: any) => ({
          dimensionCode: item.dimension_code,
          dimensionLabel: item.dimension_label || "",
          score: Number(item.score ?? 0),
          statusLabel: item.status_label || "",
          summary: item.summary || "",
        }))
      : [],
    feedbackLinkedSummary: payload.feedback_linked_summary || "",
    feedbackLinkedScoringSnapshot: {
      adoptedCount: Number(payload.feedback_linked_scoring_snapshot?.adopted_count ?? 0),
      needsRevisionCount: Number(
        payload.feedback_linked_scoring_snapshot?.needs_revision_count ?? 0,
      ),
      notAdoptedCount: Number(
        payload.feedback_linked_scoring_snapshot?.not_adopted_count ?? 0,
      ),
      templateCandidateCount: Number(
        payload.feedback_linked_scoring_snapshot?.template_candidate_count ?? 0,
      ),
      governedCandidateCount: Number(
        payload.feedback_linked_scoring_snapshot?.governed_candidate_count ?? 0,
      ),
      promotedCandidateCount: Number(
        payload.feedback_linked_scoring_snapshot?.promoted_candidate_count ?? 0,
      ),
      dismissedCandidateCount: Number(
        payload.feedback_linked_scoring_snapshot?.dismissed_candidate_count ?? 0,
      ),
      overrideSignalCount: Number(
        payload.feedback_linked_scoring_snapshot?.override_signal_count ?? 0,
      ),
      topAssetCodes: Array.isArray(payload.feedback_linked_scoring_snapshot?.top_asset_codes)
        ? payload.feedback_linked_scoring_snapshot.top_asset_codes
        : [],
      topAssetLabels: Array.isArray(payload.feedback_linked_scoring_snapshot?.top_asset_labels)
        ? payload.feedback_linked_scoring_snapshot.top_asset_labels
        : [],
      deliverableFeedbackCount: Number(
        payload.feedback_linked_scoring_snapshot?.deliverable_feedback_count ?? 0,
      ),
      deliverableAdoptedCount: Number(
        payload.feedback_linked_scoring_snapshot?.deliverable_adopted_count ?? 0,
      ),
      publishedDeliverableCount: Number(
        payload.feedback_linked_scoring_snapshot?.published_deliverable_count ?? 0,
      ),
      publishedAdoptedCount: Number(
        payload.feedback_linked_scoring_snapshot?.published_adopted_count ?? 0,
      ),
      deliverableCandidateCount: Number(
        payload.feedback_linked_scoring_snapshot?.deliverable_candidate_count ?? 0,
      ),
      governedDeliverableCandidateCount: Number(
        payload.feedback_linked_scoring_snapshot?.governed_deliverable_candidate_count ?? 0,
      ),
      closeoutDepthSummary:
        payload.feedback_linked_scoring_snapshot?.closeout_depth_summary || "",
      outcomeRecordCount: Number(
        payload.feedback_linked_scoring_snapshot?.outcome_record_count ?? 0,
      ),
      deliverableOutcomeRecordCount: Number(
        payload.feedback_linked_scoring_snapshot?.deliverable_outcome_record_count ?? 0,
      ),
      followUpOutcomeCount: Number(
        payload.feedback_linked_scoring_snapshot?.follow_up_outcome_count ?? 0,
      ),
      writebackGeneratedEventCount: Number(
        payload.feedback_linked_scoring_snapshot?.writeback_generated_event_count ?? 0,
      ),
      reviewRequiredExecutionCount: Number(
        payload.feedback_linked_scoring_snapshot?.review_required_execution_count ?? 0,
      ),
      plannedExecutionCount: Number(
        payload.feedback_linked_scoring_snapshot?.planned_execution_count ?? 0,
      ),
      writebackExpectedTaskCount: Number(
        payload.feedback_linked_scoring_snapshot?.writeback_expected_task_count ?? 0,
      ),
      oneOffTaskCount: Number(
        payload.feedback_linked_scoring_snapshot?.one_off_task_count ?? 0,
      ),
      followUpTaskCount: Number(
        payload.feedback_linked_scoring_snapshot?.follow_up_task_count ?? 0,
      ),
      continuousTaskCount: Number(
        payload.feedback_linked_scoring_snapshot?.continuous_task_count ?? 0,
      ),
      writebackDepthSummary:
        payload.feedback_linked_scoring_snapshot?.writeback_depth_summary || "",
      continuityInterpretation:
        payload.feedback_linked_scoring_snapshot?.continuity_interpretation || "one_off_minimal",
      continuityInterpretationLabel:
        payload.feedback_linked_scoring_snapshot?.continuity_interpretation_label || "",
      effectivenessPosture:
        payload.feedback_linked_scoring_snapshot?.effectiveness_posture || "evidence_thin",
      effectivenessPostureLabel:
        payload.feedback_linked_scoring_snapshot?.effectiveness_posture_label || "",
      effectivenessPostureSummary:
        payload.feedback_linked_scoring_snapshot?.effectiveness_posture_summary || "",
      effectivenessCaveatSummary:
        payload.feedback_linked_scoring_snapshot?.effectiveness_caveat_summary || "",
      primarySupportSignal:
        payload.feedback_linked_scoring_snapshot?.primary_support_signal || "explicit_feedback",
      primarySupportSignalLabel:
        payload.feedback_linked_scoring_snapshot?.primary_support_signal_label || "",
      secondarySupportSignal:
        payload.feedback_linked_scoring_snapshot?.secondary_support_signal || "none",
      secondarySupportSignalLabel:
        payload.feedback_linked_scoring_snapshot?.secondary_support_signal_label || "",
      currentCaveatSignal:
        payload.feedback_linked_scoring_snapshot?.current_caveat_signal || "none",
      currentCaveatSignalLabel:
        payload.feedback_linked_scoring_snapshot?.current_caveat_signal_label || "",
      effectivenessCompositionSummary:
        payload.feedback_linked_scoring_snapshot?.effectiveness_composition_summary || "",
      distortionGuardSignal:
        payload.feedback_linked_scoring_snapshot?.distortion_guard_signal || "none",
      distortionGuardSignalLabel:
        payload.feedback_linked_scoring_snapshot?.distortion_guard_signal_label || "",
      distortionGuardSummary:
        payload.feedback_linked_scoring_snapshot?.distortion_guard_summary || "",
      attributionBoundary:
        payload.feedback_linked_scoring_snapshot?.attribution_boundary || "not_claimable",
      attributionBoundaryLabel:
        payload.feedback_linked_scoring_snapshot?.attribution_boundary_label || "",
      attributionBoundarySummary:
        payload.feedback_linked_scoring_snapshot?.attribution_boundary_summary || "",
      summary: payload.feedback_linked_scoring_snapshot?.summary || "",
    },
    closurePosture: payload.closure_posture || "",
    closurePostureLabel: payload.closure_posture_label || "",
    checkpointSummary: payload.checkpoint_summary || "",
    lastCheckpointAt: payload.last_checkpoint_at || null,
    lastCheckpointByLabel: payload.last_checkpoint_by_label || "",
    canSignOff: Boolean(payload.can_sign_off),
    signOffStatus: payload.sign_off_status === "signed_off" ? "signed_off" : "open",
    signOffStatusLabel: payload.sign_off_status_label || "",
    signedOffAt: payload.signed_off_at || null,
    signedOffByLabel: payload.signed_off_by_label || "",
    nextPhaseLabel: payload.next_phase_label || "",
    handoffSummary: payload.handoff_summary || "",
    handoffItems: Array.isArray(payload.handoff_items) ? payload.handoff_items : [],
    recommendedNextStep: payload.recommended_next_step || "",
  };
}

function parsePhaseSixCloseoutReviewPayload(payload: any): PhaseSixCloseoutReview {
  return {
    phaseId: "phase_6",
    phaseLabel: payload.phase_label || "",
    closureStatus:
      payload.closure_status === "signed_off"
        ? "signed_off"
        : payload.closure_status === "ready_to_close"
          ? "ready_to_close"
          : "completion_pass",
    closureStatusLabel: payload.closure_status_label || "",
    summary: payload.summary || "",
    foundationSnapshot: payload.foundation_snapshot || "",
    completedCount: Number(payload.completed_count ?? 0),
    remainingCount: Number(payload.remaining_count ?? 0),
    completedItems: Array.isArray(payload.completed_items) ? payload.completed_items : [],
    assetAudits: Array.isArray(payload.asset_audits)
      ? payload.asset_audits.map((item: any) => ({
          assetCode: item.asset_code,
          assetLabel: item.asset_label || "",
          auditStatus: item.audit_status === "needs_followup" ? "needs_followup" : "audited",
          auditStatusLabel: item.audit_status_label || "",
          summary: item.summary || "",
          nextStep: item.next_step || "",
        }))
      : [],
    remainingItems: Array.isArray(payload.remaining_items) ? payload.remaining_items : [],
    recommendedNextStep: payload.recommended_next_step || "",
    signedOffAt: payload.signed_off_at || null,
    signedOffByLabel: payload.signed_off_by_label || "",
    nextPhaseLabel: payload.next_phase_label || "",
    handoffSummary: payload.handoff_summary || "",
    handoffItems: Array.isArray(payload.handoff_items) ? payload.handoff_items : [],
  };
}

function parsePhaseSixReuseBoundaryGovernancePayload(
  payload: any,
): PhaseSixReuseBoundaryGovernance {
  return {
    phaseId: "phase_6",
    phaseLabel: payload.phase_label || "",
    governancePosture:
      payload.governance_posture === "stable" ? "stable" : "guardrails_needed",
    governancePostureLabel: payload.governance_posture_label || "",
    summary: payload.summary || "",
    hostWeightingSummary: payload.host_weighting_summary || "",
    hostWeightingGuardrailNote: payload.host_weighting_guardrail_note || "",
    generalizableCount: Number(payload.generalizable_count ?? 0),
    contextualCount: Number(payload.contextual_count ?? 0),
    narrowUseCount: Number(payload.narrow_use_count ?? 0),
    governanceItems: Array.isArray(payload.governance_items)
      ? payload.governance_items.map((item: any) => ({
          assetCode: item.asset_code,
          assetLabel: item.asset_label || "",
          boundaryStatus:
            item.boundary_status === "generalizable"
              ? "generalizable"
              : item.boundary_status === "narrow_use"
                ? "narrow_use"
                : "contextual",
          boundaryStatusLabel: item.boundary_status_label || "",
          reuseRecommendation:
            item.reuse_recommendation === "can_expand"
              ? "can_expand"
              : item.reuse_recommendation === "restrict_narrow_use"
                ? "restrict_narrow_use"
                : "keep_contextual",
          reuseRecommendationLabel: item.reuse_recommendation_label || "",
          summary: item.summary || "",
          guardrailNote: item.guardrail_note || "",
        }))
      : [],
    recommendedNextStep: payload.recommended_next_step || "",
  };
}

function parsePhaseSixGeneralistGuidancePosturePayload(
  payload: any,
): PhaseSixGeneralistGuidancePosture {
  return {
    phaseId: "phase_6",
    phaseLabel: payload.phase_label || "",
    guidancePosture:
      payload.guidance_posture === "light_guidance"
        ? "light_guidance"
        : payload.guidance_posture === "guarded_guidance"
          ? "guarded_guidance"
          : "balanced_guidance",
    guidancePostureLabel: payload.guidance_posture_label || "",
    summary: payload.summary || "",
    workGuidanceSummary: payload.work_guidance_summary || "",
    boundaryEmphasis: payload.boundary_emphasis || "",
    guidanceItems: Array.isArray(payload.guidance_items)
      ? payload.guidance_items.filter((item: unknown) => typeof item === "string")
      : [],
    recommendedNextStep: payload.recommended_next_step || "",
  };
}

function parsePhaseSixContextDistanceAuditPayload(
  payload: any,
): PhaseSixContextDistanceAudit {
  return {
    phaseId: "phase_6",
    phaseLabel: payload.phase_label || "",
    confidencePosture:
      payload.confidence_posture === "mostly_close" ? "mostly_close" : "mixed_distance",
    confidencePostureLabel: payload.confidence_posture_label || "",
    summary: payload.summary || "",
    distanceItems: Array.isArray(payload.distance_items)
      ? payload.distance_items.map((item: any) => ({
          assetCode: item.asset_code,
          assetLabel: item.asset_label || "",
          contextDistance:
            item.context_distance === "close"
              ? "close"
              : item.context_distance === "far"
                ? "far"
                : "moderate",
          contextDistanceLabel: item.context_distance_label || "",
          reuseConfidence:
            item.reuse_confidence === "high_confidence"
              ? "high_confidence"
              : item.reuse_confidence === "low_confidence"
                ? "low_confidence"
                : "bounded_confidence",
          reuseConfidenceLabel: item.reuse_confidence_label || "",
          summary: item.summary || "",
          guardrailNote: item.guardrail_note || "",
        }))
      : [],
    recommendedNextStep: payload.recommended_next_step || "",
  };
}

function parsePhaseSixConfidenceCalibrationPayload(
  payload: any,
): PhaseSixConfidenceCalibration {
  return {
    phaseId: "phase_6",
    phaseLabel: payload.phase_label || "",
    calibrationPosture:
      payload.calibration_posture === "stable_alignment"
        ? "stable_alignment"
        : "watch_mismatch",
    calibrationPostureLabel: payload.calibration_posture_label || "",
    summary: payload.summary || "",
    calibrationItems: Array.isArray(payload.calibration_items)
      ? payload.calibration_items.map((item: any) => ({
          axisKind:
            item.axis_kind === "client_type"
              ? "client_type"
              : item.axis_kind === "domain_lens"
                ? "domain_lens"
                : "client_stage",
          axisLabel: item.axis_label || "",
          calibrationStatus:
            item.calibration_status === "aligned"
              ? "aligned"
              : item.calibration_status === "mismatch"
                ? "mismatch"
                : "caution",
          calibrationStatusLabel: item.calibration_status_label || "",
          reuseConfidence:
            item.reuse_confidence === "high_confidence"
              ? "high_confidence"
              : item.reuse_confidence === "low_confidence"
                ? "low_confidence"
                : "bounded_confidence",
          reuseConfidenceLabel: item.reuse_confidence_label || "",
          summary: item.summary || "",
          guardrailNote: item.guardrail_note || "",
        }))
      : [],
    recommendedNextStep: payload.recommended_next_step || "",
  };
}

function parsePhaseSixCalibrationAwareWeightingPayload(
  payload: any,
): PhaseSixCalibrationAwareWeighting {
  return {
    phaseId: "phase_6",
    phaseLabel: payload.phase_label || "",
    weightingPosture:
      payload.weighting_posture === "calibrated_ordering"
        ? "calibrated_ordering"
        : "watch_mismatch",
    weightingPostureLabel: payload.weighting_posture_label || "",
    summary: payload.summary || "",
    hostWeightingSummary: payload.host_weighting_summary || "",
    hostWeightingGuardrailNote: payload.host_weighting_guardrail_note || "",
    weightingItems: Array.isArray(payload.weighting_items)
      ? payload.weighting_items.map((item: any) => ({
          axisKind:
            item.axis_kind === "client_type"
              ? "client_type"
              : item.axis_kind === "domain_lens"
                ? "domain_lens"
                : "client_stage",
          axisLabel: item.axis_label || "",
          calibrationStatus:
            item.calibration_status === "aligned"
              ? "aligned"
              : item.calibration_status === "mismatch"
                ? "mismatch"
                : "caution",
          calibrationStatusLabel: item.calibration_status_label || "",
          weightingEffect:
            item.weighting_effect === "allow_expand"
              ? "allow_expand"
              : item.weighting_effect === "background_only"
                ? "background_only"
                : "keep_contextual",
          weightingEffectLabel: item.weighting_effect_label || "",
          summary: item.summary || "",
        }))
      : [],
    recommendedNextStep: payload.recommended_next_step || "",
  };
}

export async function getHistoryVisibilityState(): Promise<HistoryVisibilityState> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/history-visibility`, {
    cache: "no-store",
  });
  return parseResponse<HistoryVisibilityState>(response);
}

export async function updateHistoryVisibilityState(
  payload: HistoryVisibilityUpdatePayload,
): Promise<HistoryVisibilityState> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/history-visibility`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<HistoryVisibilityState>(response);
}

export async function listMatterWorkspaces(): Promise<MatterWorkspaceSummary[]> {
  const response = await apiFetch(`${getApiBaseUrl()}/matters`, {
    cache: "no-store",
  });
  return parseResponse<MatterWorkspaceSummary[]>(response);
}

export async function getMatterWorkspace(matterId: string): Promise<MatterWorkspace> {
  const response = await apiFetch(`${getApiBaseUrl()}/matters/${matterId}`, {
    cache: "no-store",
  });
  return parseResponse<MatterWorkspace>(response);
}

export async function updateMatterWorkspaceMetadata(
  matterId: string,
  payload: MatterWorkspaceMetadataUpdatePayload,
): Promise<MatterWorkspace> {
  const response = await apiFetch(`${getApiBaseUrl()}/matters/${matterId}/metadata`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<MatterWorkspace>(response);
}

export async function updateMatterWorkspace(
  matterId: string,
  payload: MatterWorkspaceUpdatePayload,
): Promise<MatterWorkspace> {
  const response = await apiFetch(`${getApiBaseUrl()}/matters/${matterId}/workspace`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<MatterWorkspace>(response);
}

export async function rollbackMatterContentRevision(
  matterId: string,
  revisionId: string,
): Promise<MatterWorkspace> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/matters/${matterId}/revisions/${revisionId}/rollback`,
    {
      method: "POST",
    },
  );
  return parseResponse<MatterWorkspace>(response);
}

export async function getArtifactEvidenceWorkspace(
  matterId: string,
): Promise<ArtifactEvidenceWorkspace> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await apiFetch(`${apiBaseUrl}/matters/${matterId}/artifact-evidence`, {
    cache: "no-store",
  });
  return parseResponse<ArtifactEvidenceWorkspace>(response);
}

export async function resolveMatterCanonicalizationReview(
  matterId: string,
  payload: MatterCanonicalizationReviewPayload,
): Promise<ArtifactEvidenceWorkspace> {
  const response = await apiFetch(`${getApiBaseUrl()}/matters/${matterId}/canonicalization-reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      review_key: payload.review_key,
      resolution: payload.resolution,
      note: payload.note ?? "",
    }),
  });
  return parseResponse<ArtifactEvidenceWorkspace>(response);
}

export async function getDeliverableWorkspace(
  deliverableId: string,
): Promise<DeliverableWorkspace> {
  const response = await apiFetch(`${getApiBaseUrl()}/deliverables/${deliverableId}`, {
    cache: "no-store",
  });
  return parseResponse<DeliverableWorkspace>(response);
}

export async function updateDeliverableMetadata(
  deliverableId: string,
  payload: DeliverableMetadataUpdatePayload,
): Promise<DeliverableWorkspace> {
  const response = await apiFetch(`${getApiBaseUrl()}/deliverables/${deliverableId}/metadata`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<DeliverableWorkspace>(response);
}

export async function updateDeliverableWorkspace(
  deliverableId: string,
  payload: DeliverableWorkspaceUpdatePayload,
): Promise<DeliverableWorkspace> {
  const response = await apiFetch(`${getApiBaseUrl()}/deliverables/${deliverableId}/workspace`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<DeliverableWorkspace>(response);
}

export async function publishDeliverableRelease(
  deliverableId: string,
  payload: DeliverablePublishPayload,
): Promise<DeliverableWorkspace> {
  const response = await apiFetch(`${getApiBaseUrl()}/deliverables/${deliverableId}/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<DeliverableWorkspace>(response);
}

export async function applyDeliverableFeedback(
  deliverableId: string,
  payload: AdoptionFeedbackPayload,
): Promise<DeliverableWorkspace> {
  const response = await apiFetch(`${getApiBaseUrl()}/deliverables/${deliverableId}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<DeliverableWorkspace>(response);
}

export async function rollbackDeliverableContentRevision(
  deliverableId: string,
  revisionId: string,
): Promise<DeliverableWorkspace> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/deliverables/${deliverableId}/revisions/${revisionId}/rollback`,
    {
      method: "POST",
    },
  );
  return parseResponse<DeliverableWorkspace>(response);
}

async function parseBlobResponse(
  response: Response,
  fallbackFileName: string,
  fallbackArtifactFormat: string,
) {
  if (!response.ok) {
    const rawText = await response.text();
    const error = new Error(rawText || "下載交付物 artifact 失敗。") as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const fileNameMatch = disposition.match(/filename=\"?([^"]+)\"?/);
  const blob = await response.blob();
  return {
    fileName: fileNameMatch?.[1] ?? fallbackFileName,
    blob,
    versionTag: response.headers.get("X-Infinite-Pro-Version") ?? "",
    artifactFormat:
      response.headers.get("X-Infinite-Pro-Artifact-Format") ?? fallbackArtifactFormat,
  };
}

export async function exportDeliverableArtifact(
  deliverableId: string,
  format: "markdown" | "docx",
) {
  const exportPath =
    format === "docx"
      ? `${getApiBaseUrl()}/deliverables/${deliverableId}/export/docx`
      : `${getApiBaseUrl()}/deliverables/${deliverableId}/export`;
  const response = await apiFetch(exportPath, {
    cache: "no-store",
  });
  const fallbackExtension = format === "docx" ? "docx" : "md";
  return parseBlobResponse(
    response,
    `deliverable-${deliverableId}.${fallbackExtension}`,
    format,
  );
}

export async function exportDeliverableMarkdown(deliverableId: string) {
  return exportDeliverableArtifact(deliverableId, "markdown");
}

export async function exportDeliverableDocx(deliverableId: string) {
  return exportDeliverableArtifact(deliverableId, "docx");
}

export async function downloadDeliverableArtifact(
  deliverableId: string,
  artifact: Pick<DeliverableArtifactRecord, "id" | "file_name" | "artifact_format">,
) {
  const response = await apiFetch(
    `${getApiBaseUrl()}/deliverables/${deliverableId}/artifacts/${artifact.id}`,
    {
      cache: "no-store",
    },
  );
  return parseBlobResponse(response, artifact.file_name, artifact.artifact_format);
}

export async function createTask(payload: TaskCreatePayload): Promise<TaskAggregate> {
  const response = await apiFetch(`${getApiBaseUrl()}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<TaskAggregate>(response);
}

export async function uploadTaskFiles(
  taskId: string,
  files: File[],
): Promise<UploadBatchResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await apiFetch(`${getApiBaseUrl()}/tasks/${taskId}/uploads`, {
    method: "POST",
    body: formData,
  });
  return parseResponse<UploadBatchResponse>(response);
}

export async function uploadMatterFiles(
  matterId: string,
  files: File[],
): Promise<UploadBatchResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await apiFetch(`${getApiBaseUrl()}/matters/${matterId}/uploads`, {
    method: "POST",
    body: formData,
  });
  return parseResponse<UploadBatchResponse>(response);
}

export async function ingestTaskSources(
  taskId: string,
  payload: SourceIngestPayload,
): Promise<SourceIngestBatchResponse> {
  const response = await apiFetch(`${getApiBaseUrl()}/tasks/${taskId}/sources`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<SourceIngestBatchResponse>(response);
}

export async function ingestMatterSources(
  matterId: string,
  payload: SourceIngestPayload,
): Promise<SourceIngestBatchResponse> {
  const response = await apiFetch(`${getApiBaseUrl()}/matters/${matterId}/sources`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<SourceIngestBatchResponse>(response);
}

export async function runTask(taskId: string): Promise<ResearchRunResponse> {
  const response = await apiFetch(`${getApiBaseUrl()}/tasks/${taskId}/run`, {
    method: "POST",
  });
  return parseResponse<ResearchRunResponse>(response);
}

export async function applyMatterContinuationAction(
  matterId: string,
  payload: MatterContinuationActionPayload,
): Promise<MatterWorkspace> {
  const response = await apiFetch(`${getApiBaseUrl()}/matters/${matterId}/continuation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<MatterWorkspace>(response);
}

export async function updateTaskExtensions(
  taskId: string,
  payload: TaskExtensionOverridePayload,
): Promise<TaskAggregate> {
  const response = await apiFetch(`${getApiBaseUrl()}/tasks/${taskId}/extensions`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<TaskAggregate>(response);
}
