import {
  ArtifactEvidenceWorkspace,
  ExtensionManagerSnapshot,
  MatterWorkspace,
  MatterWorkspaceSummary,
  ResearchRunResponse,
  SourceIngestBatchResponse,
  SourceIngestPayload,
  TaskAggregate,
  TaskCreatePayload,
  TaskExtensionOverridePayload,
  TaskListItem,
  UploadBatchResponse,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

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

    throw new Error(detail || "請求失敗。");
  }

  return (await response.json()) as T;
}

export async function listTasks(): Promise<TaskListItem[]> {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    cache: "no-store",
  });
  return parseResponse<TaskListItem[]>(response);
}

export async function getTask(taskId: string): Promise<TaskAggregate> {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    cache: "no-store",
  });
  return parseResponse<TaskAggregate>(response);
}

export async function getExtensionManager(): Promise<ExtensionManagerSnapshot> {
  const response = await fetch(`${API_BASE_URL}/extensions/manager`, {
    cache: "no-store",
  });
  return parseResponse<ExtensionManagerSnapshot>(response);
}

export async function listMatterWorkspaces(): Promise<MatterWorkspaceSummary[]> {
  const response = await fetch(`${API_BASE_URL}/matters`, {
    cache: "no-store",
  });
  return parseResponse<MatterWorkspaceSummary[]>(response);
}

export async function getMatterWorkspace(matterId: string): Promise<MatterWorkspace> {
  const response = await fetch(`${API_BASE_URL}/matters/${matterId}`, {
    cache: "no-store",
  });
  return parseResponse<MatterWorkspace>(response);
}

export async function getArtifactEvidenceWorkspace(
  matterId: string,
): Promise<ArtifactEvidenceWorkspace> {
  const response = await fetch(`${API_BASE_URL}/matters/${matterId}/artifact-evidence`, {
    cache: "no-store",
  });
  return parseResponse<ArtifactEvidenceWorkspace>(response);
}

export async function createTask(payload: TaskCreatePayload): Promise<TaskAggregate> {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
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

  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/uploads`, {
    method: "POST",
    body: formData,
  });
  return parseResponse<UploadBatchResponse>(response);
}

export async function ingestTaskSources(
  taskId: string,
  payload: SourceIngestPayload,
): Promise<SourceIngestBatchResponse> {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/sources`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<SourceIngestBatchResponse>(response);
}

export async function runTask(taskId: string): Promise<ResearchRunResponse> {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/run`, {
    method: "POST",
  });
  return parseResponse<ResearchRunResponse>(response);
}

export async function updateTaskExtensions(
  taskId: string,
  payload: TaskExtensionOverridePayload,
): Promise<TaskAggregate> {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/extensions`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<TaskAggregate>(response);
}
