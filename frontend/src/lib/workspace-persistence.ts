"use client";

import {
  updateDeliverableMetadata,
  updateMatterWorkspaceMetadata,
} from "@/lib/api";
import type {
  DeliverableMetadataUpdatePayload,
  DeliverableWorkspace,
  MatterWorkspace,
  MatterWorkspaceMetadataUpdatePayload,
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
    const status = (error as Error & { status?: number }).status;
    const fallbackError =
      error instanceof Error ? error : new Error("交付物資訊暫時無法寫入後端。");
    if (typeof status === "number" && status < 500) {
      throw error;
    }
    throw new Error(
      `${fallbackError.message} 交付物版本紀錄與發布事件必須寫入正式資料，因此這次不會改寫本機假資料。`,
    );
  }
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

  return "後端暫時不可用，已先保存到本機工作台。";
}

export function buildDeliverableSaveFeedback(
  source: PersistenceSource,
  workspace?: DeliverableWorkspace,
) {
  if (source === "remote") {
    return `交付物資訊已寫入正式資料。版本：${workspace?.deliverable.version_tag ?? "已更新"}`;
  }

  return "後端暫時不可用，已先保存到本機工作台。";
}
