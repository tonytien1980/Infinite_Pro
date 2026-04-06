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
  PersonalProviderSettingsPayload,
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
    sections: (payload.sections || []).map((section: any) => ({
      sectionId: section.section_id,
      title: section.title,
      summary: section.summary,
      items: Array.isArray(section.items) ? section.items : [],
    })),
  };
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
