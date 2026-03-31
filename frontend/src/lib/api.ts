import {
  ArtifactEvidenceWorkspace,
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
  MatterWorkspaceMetadataUpdatePayload,
  MatterWorkspaceSummary,
  PackContractDraftPayload,
  PackContractDraftResult,
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
  TaskListItem,
  UploadBatchResponse,
  WorkbenchSettings,
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

export async function listTasks(): Promise<TaskListItem[]> {
  const response = await fetch(`${getApiBaseUrl()}/tasks`, {
    cache: "no-store",
  });
  return parseResponse<TaskListItem[]>(response);
}

export async function getTask(taskId: string): Promise<TaskAggregate> {
  const response = await fetch(`${getApiBaseUrl()}/tasks/${taskId}`, {
    cache: "no-store",
  });
  return parseResponse<TaskAggregate>(response);
}

export async function getExtensionManager(): Promise<ExtensionManagerSnapshot> {
  const response = await fetch(`${getApiBaseUrl()}/extensions/manager`, {
    cache: "no-store",
  });
  return parseResponse<ExtensionManagerSnapshot>(response);
}

export async function updateAgentCatalogEntry(
  agentId: string,
  payload: AgentCatalogEntryUpdatePayload,
): Promise<ExtensionManagerSnapshot> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/extensions/agents/${agentId}`, {
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
  const response = await fetch(`${apiBaseUrl}/extensions/packs/${packId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<ExtensionManagerSnapshot>(response);
}

export async function draftAgentContract(
  payload: AgentContractDraftPayload,
): Promise<AgentContractDraftResult> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/extensions/agents/contract-draft`, {
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
  const response = await fetch(`${apiBaseUrl}/extensions/packs/contract-draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<PackContractDraftResult>(response);
}

export async function getWorkbenchPreferences(): Promise<WorkbenchSettings> {
  const response = await fetch(`${getApiBaseUrl()}/workbench/preferences`, {
    cache: "no-store",
  });
  return getWorkbenchPreferencesFromPayload(await parseWorkbenchPreferencesPayload(response));
}

export async function updateWorkbenchPreferences(
  payload: WorkbenchSettings,
): Promise<WorkbenchSettings> {
  const response = await fetch(`${getApiBaseUrl()}/workbench/preferences`, {
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
  const response = await fetch(`${getApiBaseUrl()}/workbench/provider-settings`, {
    cache: "no-store",
  });
  return parseSystemProviderSettingsPayload(await parseResponse<any>(response));
}

export async function validateSystemProviderSettings(
  payload: SystemProviderSettingsPayload,
): Promise<ProviderValidationResult> {
  const response = await fetch(`${getApiBaseUrl()}/workbench/provider-settings/validate`, {
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
  const response = await fetch(`${getApiBaseUrl()}/workbench/provider-settings`, {
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
  const response = await fetch(`${getApiBaseUrl()}/workbench/provider-settings/revalidate`, {
    method: "POST",
  });
  return parseSystemProviderSettingsPayload(await parseResponse<any>(response));
}

export async function resetSystemProviderSettingsToEnv(): Promise<SystemProviderSettingsSnapshot> {
  const response = await fetch(`${getApiBaseUrl()}/workbench/provider-settings/reset-to-env`, {
    method: "POST",
  });
  return parseSystemProviderSettingsPayload(await parseResponse<any>(response));
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

export async function getHistoryVisibilityState(): Promise<HistoryVisibilityState> {
  const response = await fetch(`${getApiBaseUrl()}/workbench/history-visibility`, {
    cache: "no-store",
  });
  return parseResponse<HistoryVisibilityState>(response);
}

export async function updateHistoryVisibilityState(
  payload: HistoryVisibilityUpdatePayload,
): Promise<HistoryVisibilityState> {
  const response = await fetch(`${getApiBaseUrl()}/workbench/history-visibility`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<HistoryVisibilityState>(response);
}

export async function listMatterWorkspaces(): Promise<MatterWorkspaceSummary[]> {
  const response = await fetch(`${getApiBaseUrl()}/matters`, {
    cache: "no-store",
  });
  return parseResponse<MatterWorkspaceSummary[]>(response);
}

export async function getMatterWorkspace(matterId: string): Promise<MatterWorkspace> {
  const response = await fetch(`${getApiBaseUrl()}/matters/${matterId}`, {
    cache: "no-store",
  });
  return parseResponse<MatterWorkspace>(response);
}

export async function updateMatterWorkspaceMetadata(
  matterId: string,
  payload: MatterWorkspaceMetadataUpdatePayload,
): Promise<MatterWorkspace> {
  const response = await fetch(`${getApiBaseUrl()}/matters/${matterId}/metadata`, {
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
  const response = await fetch(`${getApiBaseUrl()}/matters/${matterId}/workspace`, {
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
  const response = await fetch(
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
  const response = await fetch(`${apiBaseUrl}/matters/${matterId}/artifact-evidence`, {
    cache: "no-store",
  });
  return parseResponse<ArtifactEvidenceWorkspace>(response);
}

export async function getDeliverableWorkspace(
  deliverableId: string,
): Promise<DeliverableWorkspace> {
  const response = await fetch(`${getApiBaseUrl()}/deliverables/${deliverableId}`, {
    cache: "no-store",
  });
  return parseResponse<DeliverableWorkspace>(response);
}

export async function updateDeliverableMetadata(
  deliverableId: string,
  payload: DeliverableMetadataUpdatePayload,
): Promise<DeliverableWorkspace> {
  const response = await fetch(`${getApiBaseUrl()}/deliverables/${deliverableId}/metadata`, {
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
  const response = await fetch(`${getApiBaseUrl()}/deliverables/${deliverableId}/workspace`, {
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
  const response = await fetch(`${getApiBaseUrl()}/deliverables/${deliverableId}/publish`, {
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
  const response = await fetch(
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
  const response = await fetch(exportPath, {
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
  const response = await fetch(
    `${getApiBaseUrl()}/deliverables/${deliverableId}/artifacts/${artifact.id}`,
    {
      cache: "no-store",
    },
  );
  return parseBlobResponse(response, artifact.file_name, artifact.artifact_format);
}

export async function createTask(payload: TaskCreatePayload): Promise<TaskAggregate> {
  const response = await fetch(`${getApiBaseUrl()}/tasks`, {
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

  const response = await fetch(`${getApiBaseUrl()}/tasks/${taskId}/uploads`, {
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

  const response = await fetch(`${getApiBaseUrl()}/matters/${matterId}/uploads`, {
    method: "POST",
    body: formData,
  });
  return parseResponse<UploadBatchResponse>(response);
}

export async function ingestTaskSources(
  taskId: string,
  payload: SourceIngestPayload,
): Promise<SourceIngestBatchResponse> {
  const response = await fetch(`${getApiBaseUrl()}/tasks/${taskId}/sources`, {
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
  const response = await fetch(`${getApiBaseUrl()}/matters/${matterId}/sources`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<SourceIngestBatchResponse>(response);
}

export async function runTask(taskId: string): Promise<ResearchRunResponse> {
  const response = await fetch(`${getApiBaseUrl()}/tasks/${taskId}/run`, {
    method: "POST",
  });
  return parseResponse<ResearchRunResponse>(response);
}

export async function applyMatterContinuationAction(
  matterId: string,
  payload: MatterContinuationActionPayload,
): Promise<MatterWorkspace> {
  const response = await fetch(`${getApiBaseUrl()}/matters/${matterId}/continuation`, {
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
  const response = await fetch(`${getApiBaseUrl()}/tasks/${taskId}/extensions`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<TaskAggregate>(response);
}
