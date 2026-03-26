"use client";

import {
  getHistoryVisibilityState,
  getWorkbenchPreferences,
  updateAgentCatalogEntry,
  updateHistoryVisibilityState,
  updatePackCatalogEntry,
  updateWorkbenchPreferences,
} from "@/lib/api";
import type {
  AgentCatalogEntry,
  HistoryVisibilityState,
  PackCatalogEntry,
  WorkbenchSettings,
} from "@/lib/types";
import type {
  AgentManagerState,
  HistoryManagerState,
  PackManagerState,
} from "@/lib/workbench-store";

export type WorkbenchPersistenceSource = "remote" | "local-fallback";

export async function hydrateWorkbenchPreferences() {
  try {
    return {
      source: "remote" as const,
      settings: await getWorkbenchPreferences(),
    };
  } catch (error) {
    return {
      source: "local-fallback" as const,
      error: error instanceof Error ? error : new Error("目前無法載入正式設定。"),
    };
  }
}

export async function persistWorkbenchPreferences(payload: WorkbenchSettings) {
  try {
    return {
      source: "remote" as const,
      settings: await updateWorkbenchPreferences(payload),
    };
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (typeof status === "number" && status < 500) {
      throw error;
    }
    return {
      source: "local-fallback" as const,
      settings: payload,
      error: error instanceof Error ? error : new Error("目前無法寫入正式設定。"),
    };
  }
}

export async function persistAgentCatalogEntry(
  payload: AgentCatalogEntry,
  isCustom: boolean,
) {
  try {
    return {
      source: "remote" as const,
      snapshot: await updateAgentCatalogEntry(payload.agent_id, {
        ...payload,
        is_custom: isCustom,
      }),
    };
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (typeof status === "number" && status < 500) {
      throw error;
    }
    return {
      source: "local-fallback" as const,
      payload,
      error: error instanceof Error ? error : new Error("目前無法寫入正式代理設定。"),
    };
  }
}

export async function persistPackCatalogEntry(
  payload: PackCatalogEntry,
  isCustom: boolean,
) {
  try {
    return {
      source: "remote" as const,
      snapshot: await updatePackCatalogEntry(payload.pack_id, {
        ...payload,
        is_custom: isCustom,
      }),
    };
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (typeof status === "number" && status < 500) {
      throw error;
    }
    return {
      source: "local-fallback" as const,
      payload,
      error: error instanceof Error ? error : new Error("目前無法寫入正式模組包設定。"),
    };
  }
}

export async function hydrateHistoryVisibility() {
  try {
    return {
      source: "remote" as const,
      state: await getHistoryVisibilityState(),
    };
  } catch (error) {
    return {
      source: "local-fallback" as const,
      error: error instanceof Error ? error : new Error("目前無法載入正式歷史可見性設定。"),
    };
  }
}

export async function persistHistoryVisibility(
  taskIds: string[],
  visibilityState: "hidden" | "visible",
) {
  try {
    return {
      source: "remote" as const,
      state: await updateHistoryVisibilityState({
        task_ids: taskIds,
        visibility_state: visibilityState,
      }),
    };
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (typeof status === "number" && status < 500) {
      throw error;
    }
    return {
      source: "local-fallback" as const,
      taskIds,
      visibilityState,
      error:
        error instanceof Error
          ? error
          : new Error("目前無法寫入正式歷史可見性設定。"),
    };
  }
}

export function buildWorkbenchPreferenceFeedback(source: WorkbenchPersistenceSource) {
  if (source === "remote") {
    return "設定已寫入正式工作台偏好，重新整理後仍會保留。";
  }

  return "後端暫時不可用，已先保存到目前瀏覽器。";
}

export function buildHistoryVisibilityFeedback(
  source: WorkbenchPersistenceSource,
  hiddenCount: number,
) {
  if (source === "remote") {
    return `歷史可見性已寫入正式狀態，目前共有 ${hiddenCount} 筆紀錄維持隱藏。`;
  }

  return "後端暫時不可用，已先保存到目前瀏覽器。";
}

export function buildAgentPersistenceFeedback(
  source: WorkbenchPersistenceSource,
  agentName: string,
) {
  if (source === "remote") {
    return `代理「${agentName}」已寫入正式管理狀態。`;
  }

  return `代理「${agentName}」已先保存到目前瀏覽器。`;
}

export function buildPackPersistenceFeedback(
  source: WorkbenchPersistenceSource,
  packName: string,
) {
  if (source === "remote") {
    return `模組包「${packName}」已寫入正式管理狀態。`;
  }

  return `模組包「${packName}」已先保存到目前瀏覽器。`;
}

export function applyAgentFallbackState(
  current: AgentManagerState,
  payload: AgentCatalogEntry,
  isSystemAgent: boolean,
): AgentManagerState {
  if (isSystemAgent) {
    return {
      ...current,
      overrides: {
        ...current.overrides,
        [payload.agent_id]: payload,
      },
    };
  }

  const existingIndex = current.customAgents.findIndex((agent) => agent.agent_id === payload.agent_id);
  const nextCustomAgents = [...current.customAgents];

  if (existingIndex >= 0) {
    nextCustomAgents[existingIndex] = payload;
  } else {
    nextCustomAgents.unshift(payload);
  }

  return {
    ...current,
    customAgents: nextCustomAgents,
  };
}

export function applyPackFallbackState(
  current: PackManagerState,
  payload: PackCatalogEntry,
  isSystemPack: boolean,
): PackManagerState {
  if (isSystemPack) {
    return {
      ...current,
      overrides: {
        ...current.overrides,
        [payload.pack_id]: payload,
      },
    };
  }

  const existingIndex = current.customPacks.findIndex((pack) => pack.pack_id === payload.pack_id);
  const nextCustomPacks = [...current.customPacks];

  if (existingIndex >= 0) {
    nextCustomPacks[existingIndex] = payload;
  } else {
    nextCustomPacks.unshift(payload);
  }

  return {
    ...current,
    customPacks: nextCustomPacks,
  };
}

export function applyHistoryFallbackState(
  current: HistoryManagerState,
  taskIds: string[],
  visibilityState: "hidden" | "visible",
): HistoryManagerState {
  const hiddenTaskIdSet = new Set(current.hiddenTaskIds);
  if (visibilityState === "hidden") {
    taskIds.forEach((taskId) => hiddenTaskIdSet.add(taskId));
  } else {
    taskIds.forEach((taskId) => hiddenTaskIdSet.delete(taskId));
  }

  return {
    ...current,
    hiddenTaskIds: Array.from(hiddenTaskIdSet),
  };
}

export function syncHistoryStateFromRemote(
  current: HistoryManagerState,
  remoteState: HistoryVisibilityState,
): HistoryManagerState {
  return {
    ...current,
    hiddenTaskIds: remoteState.hidden_task_ids,
  };
}

export function clearLocalAgentEntry(
  current: AgentManagerState,
  agentId: string,
): AgentManagerState {
  const nextOverrides = { ...current.overrides };
  delete nextOverrides[agentId];
  return {
    ...current,
    overrides: nextOverrides,
    customAgents: current.customAgents.filter((agent) => agent.agent_id !== agentId),
  };
}

export function clearLocalPackEntry(
  current: PackManagerState,
  packId: string,
): PackManagerState {
  const nextOverrides = { ...current.overrides };
  delete nextOverrides[packId];
  return {
    ...current,
    overrides: nextOverrides,
    customPacks: current.customPacks.filter((pack) => pack.pack_id !== packId),
  };
}
