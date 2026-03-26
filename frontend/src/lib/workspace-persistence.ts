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
import type { MatterWorkspaceRecord } from "@/lib/workbench-store";
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
    };

    return {
      source: "local-fallback" as const,
      fallbackRecord,
      error: error instanceof Error ? error : new Error("案件資訊暫時無法寫入後端。"),
    };
  }
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
  const fallbackError = error instanceof Error ? error : new Error(defaultMessage);
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

export function buildMatterSaveFeedback(
  source: PersistenceSource,
  workspace?: MatterWorkspace,
) {
  if (source === "remote") {
    return `案件資訊已寫入正式資料。更新時間：${workspace?.summary.latest_updated_at ?? "剛剛"}`;
  }

  return "後端暫時不可用，案件正文與摘要已先保存到本機工作台。";
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
