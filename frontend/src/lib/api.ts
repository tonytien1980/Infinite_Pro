import {
  ArtifactEvidenceWorkspace,
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
  MatterWorkspaceMetadataUpdatePayload,
  MatterWorkspaceSummary,
  MatterWorkspaceUpdatePayload,
  PackCatalogEntryUpdatePayload,
  ResearchRunResponse,
  SourceIngestBatchResponse,
  SourceIngestPayload,
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
    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
  }

  return "http://localhost:8000/api/v1";
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

async function parseWorkbenchPreferencesPayload(response: Response) {
  return parseResponse<{
    interface_language: WorkbenchSettings["interfaceLanguage"];
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
    homepageDisplayPreference: payload.homepage_display_preference,
    historyDefaultPageSize: payload.history_default_page_size,
    showRecentActivity: payload.show_recent_activity,
    showFrequentExtensions: payload.show_frequent_extensions,
    newTaskDefaultInputMode: payload.new_task_default_input_mode,
    density: payload.density,
    deliverableSortPreference: payload.deliverable_sort_preference,
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

export async function runTask(taskId: string): Promise<ResearchRunResponse> {
  const response = await fetch(`${getApiBaseUrl()}/tasks/${taskId}/run`, {
    method: "POST",
  });
  return parseResponse<ResearchRunResponse>(response);
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
