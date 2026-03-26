"use client";

import {
  updateDeliverableMetadata,
  updateDeliverableWorkspace,
  updateMatterWorkspace,
  updateMatterWorkspaceMetadata,
} from "@/lib/api";
import type {
  DeliverableMetadataUpdatePayload,
  DeliverableWorkspaceUpdatePayload,
  DeliverableWorkspace,
  MatterWorkspace,
  MatterWorkspaceMetadataUpdatePayload,
  MatterWorkspaceUpdatePayload,
} from "@/lib/types";
import type {
  MatterWorkspaceRecord,
  MatterWorkspaceSyncState,
} from "@/lib/workbench-store";
import { nowIsoString } from "@/lib/workbench-store";

export type PersistenceSource = "remote" | "local-fallback";

export async function persistMatterWorkspaceMetadata(
  matterId: string,
  payload: MatterWorkspaceMetadataUpdatePayload,
) {
  try {
    const workspace = await updateMatterWorkspaceMetadata(matterId, payload);
    return {
      source: "remote" as const,
      workspace,
    };
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (typeof status === "number" && status < 500) {
      throw error;
    }
    const fallbackRecord: MatterWorkspaceRecord = {
      title: payload.title,
      summary: payload.summary,
      status: payload.status,
      contentSections: {
        core_question: "",
        analysis_focus: "",
        constraints_and_risks: "",
        next_steps: "",
      },
      updatedAt: nowIsoString(),
      persistenceSource: "local-fallback",
    };

    return {
      source: "local-fallback" as const,
      fallbackRecord,
      error: error instanceof Error ? error : new Error("案件資訊暫時無法寫入後端。"),
    };
  }
}

export async function persistMatterWorkspace(
  matterId: string,
  payload: MatterWorkspaceUpdatePayload,
  options?: { baseRemoteUpdatedAt?: string | null },
) {
  try {
    const workspace = await updateMatterWorkspace(matterId, payload);
    return {
      source: "remote" as const,
      workspace,
    };
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (typeof status === "number" && status < 500) {
      throw error;
    }
    const fallbackRecord: MatterWorkspaceRecord = {
      title: payload.title,
      summary: payload.summary,
      status: payload.status,
      contentSections: payload.content_sections,
      updatedAt: nowIsoString(),
      persistenceSource: "local-fallback",
      syncState: "pending_sync",
      baseRemoteUpdatedAt: options?.baseRemoteUpdatedAt ?? null,
      lastSyncAttemptAt: null,
      lastSyncError: null,
    };

    return {
      source: "local-fallback" as const,
      fallbackRecord,
      error: error instanceof Error ? error : new Error("案件資訊暫時無法寫入後端。"),
    };
  }
}

export async function syncMatterWorkspaceFallback(
  matterId: string,
  record: MatterWorkspaceRecord,
) {
  try {
    const workspace = await updateMatterWorkspace(matterId, {
      title: record.title,
      summary: record.summary,
      status: record.status,
      content_sections: record.contentSections,
    });
    return {
      source: "remote" as const,
      workspace,
    };
  } catch (error) {
    const normalizedError = buildMatterSyncError(error);
    return {
      source: "sync-failed" as const,
      error: normalizedError,
      nextRecord: {
        ...record,
        syncState: "sync_failed" as MatterWorkspaceSyncState,
        lastSyncAttemptAt: nowIsoString(),
        lastSyncError: normalizedError.message,
      },
    };
  }
}

function buildMatterSyncError(error: unknown) {
  const status = (error as Error & { status?: number }).status;
  if (typeof status === "number" && status < 500) {
    return error instanceof Error ? error : new Error("案件暫存重新同步失敗。");
  }

  if (error instanceof Error && error.message && error.message !== "Failed to fetch") {
    return new Error(`${error.message} 本機暫存仍保留，待後端恢復後可再次重試。`);
  }

  return new Error("重新同步失敗，後端仍不可用；本機暫存仍保留，待恢復後可再次重試。");
}

export async function persistDeliverableMetadata(
  deliverableId: string,
  payload: DeliverableMetadataUpdatePayload,
) {
  try {
    const workspace = await updateDeliverableMetadata(deliverableId, payload);
    return {
      source: "remote" as const,
      workspace,
    };
  } catch (error) {
    throw buildRemoteOnlyPersistenceError(
      error,
      "交付物資訊暫時無法寫入後端。",
    );
  }
}

export async function persistDeliverableWorkspace(
  deliverableId: string,
  payload: DeliverableWorkspaceUpdatePayload,
) {
  try {
    const workspace = await updateDeliverableWorkspace(deliverableId, payload);
    return {
      source: "remote" as const,
      workspace,
    };
  } catch (error) {
    throw buildRemoteOnlyPersistenceError(
      error,
      "交付物正文與版本資訊暫時無法寫入後端。",
    );
  }
}

function buildRemoteOnlyPersistenceError(error: unknown, defaultMessage: string) {
  const status = (error as Error & { status?: number }).status;
  const fallbackError =
    error instanceof Error && error.message && error.message !== "Failed to fetch"
      ? error
      : new Error(defaultMessage);
  if (typeof status === "number" && status < 500) {
    return fallbackError;
  }

  return new Error(
    `${fallbackError.message} 這個操作會影響正式版本紀錄、發布或內容正本，因此不會改寫本機假資料。請在後端恢復後重試。`,
  );
}

export function canFallbackLocallyForWorkspace(area: "matter" | "deliverable" | "deliverable-release") {
  return area === "matter";
}

export function isRetriableWorkspaceError(error: unknown) {
  const status = (error as Error & { status?: number }).status;
  return typeof status !== "number" || status >= 500;
}

export function isLocalFallbackMatterRecord(record?: MatterWorkspaceRecord | null) {
  return record?.persistenceSource === "local-fallback";
}

export function buildMatterSyncFeedback(state: MatterWorkspaceSyncState) {
  if (state === "pending_sync") {
    return "本機暫存待同步，後端恢復後可重新同步到正式資料。";
  }
  if (state === "syncing") {
    return "正在把本機暫存重新同步到正式資料。";
  }
  if (state === "needs_review") {
    return "遠端資料在 fallback 期間也有變更，請先人工確認再決定是否覆蓋正式資料。";
  }
  return "重新同步失敗；本機暫存仍保留，待後端恢復後可再次重試。";
}

export function buildMatterSaveFeedback(
  source: PersistenceSource,
  workspace?: MatterWorkspace,
) {
  if (source === "remote") {
    return `案件資訊已寫入正式資料。更新時間：${workspace?.summary.latest_updated_at ?? "剛剛"}`;
  }

  return "後端暫時不可用，案件正文與摘要已先保存到本機工作台，尚未寫回正式資料。";
}

export function buildDeliverableSaveFeedback(
  source: PersistenceSource,
  workspace?: DeliverableWorkspace,
) {
  if (source === "remote") {
    return `交付物資訊已寫入正式資料。版本：${workspace?.deliverable.version_tag ?? "已更新"}`;
  }

  return "交付物版本與正文必須寫入正式資料，因此這次沒有使用本機假保存。";
}
