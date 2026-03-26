"use client";

import { useEffect, useRef, useState } from "react";

import type {
  AgentCatalogEntry,
  DensityPreference,
  DeliverableSortPreference,
  HomepageDisplayPreference,
  PackCatalogEntry,
  WorkbenchSettings,
} from "@/lib/types";

export type {
  DensityPreference,
  DeliverableSortPreference,
  HomepageDisplayPreference,
  WorkbenchSettings,
} from "@/lib/types";

export type MatterLifecycleStatus = "active" | "paused" | "archived";
export type DeliverableLifecycleStatus =
  | "draft"
  | "pending_confirmation"
  | "final"
  | "archived";

export interface MatterWorkspaceRecord {
  title: string;
  summary: string;
  status: MatterLifecycleStatus;
  updatedAt: string;
  persistenceSource?: "local-fallback";
}

export interface DeliverableVersionRecord {
  id: string;
  versionTag: string;
  timestamp: string;
  note: string;
}

export interface DeliverableWorkspaceRecord {
  title: string;
  summary: string;
  status: DeliverableLifecycleStatus;
  versionTag: string;
  updatedAt: string;
  versions: DeliverableVersionRecord[];
  persistenceSource?: "local-fallback";
}

export interface AgentManagerState {
  customAgents: AgentCatalogEntry[];
  overrides: Record<string, Partial<AgentCatalogEntry>>;
}

export interface PackManagerState {
  customPacks: PackCatalogEntry[];
  overrides: Record<string, Partial<PackCatalogEntry>>;
}

export interface HistoryManagerState {
  hiddenTaskIds: string[];
}

const STORAGE_KEYS = {
  settings: "infinite-pro.workbench.settings",
  matters: "infinite-pro.workbench.matters",
  deliverables: "infinite-pro.workbench.deliverables",
  agents: "infinite-pro.workbench.agents",
  packs: "infinite-pro.workbench.packs",
  history: "infinite-pro.workbench.history",
} as const;

export const DEFAULT_WORKBENCH_SETTINGS: WorkbenchSettings = {
  interfaceLanguage: "zh-Hant",
  homepageDisplayPreference: "matters",
  historyDefaultPageSize: 20,
  showRecentActivity: true,
  showFrequentExtensions: true,
  newTaskDefaultInputMode: "one_line_inquiry",
  density: "standard",
  deliverableSortPreference: "updated_desc",
};

const DEFAULT_AGENT_MANAGER_STATE: AgentManagerState = {
  customAgents: [],
  overrides: {},
};

const DEFAULT_PACK_MANAGER_STATE: PackManagerState = {
  customPacks: [],
  overrides: {},
};

const DEFAULT_HISTORY_MANAGER_STATE: HistoryManagerState = {
  hiddenTaskIds: [],
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStorage<T>(key: string, fallback: T) {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return fallback;
    }

    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function usePersistentState<T>(key: string, initialValue: T) {
  const initialRef = useRef(initialValue);
  const [state, setState] = useState<T>(initialRef.current);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readStorage(key, initialRef.current));
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    writeStorage(key, state);
  }, [hydrated, key, state]);

  return [state, setState, hydrated] as const;
}

export function useWorkbenchSettings() {
  return usePersistentState<WorkbenchSettings>(
    STORAGE_KEYS.settings,
    DEFAULT_WORKBENCH_SETTINGS,
  );
}

export function useMatterWorkspaceRecords() {
  return usePersistentState<Record<string, MatterWorkspaceRecord>>(STORAGE_KEYS.matters, {});
}

export function useDeliverableWorkspaceRecords() {
  return usePersistentState<Record<string, DeliverableWorkspaceRecord>>(
    STORAGE_KEYS.deliverables,
    {},
  );
}

export function useAgentManagerState() {
  return usePersistentState<AgentManagerState>(
    STORAGE_KEYS.agents,
    DEFAULT_AGENT_MANAGER_STATE,
  );
}

export function usePackManagerState() {
  return usePersistentState<PackManagerState>(STORAGE_KEYS.packs, DEFAULT_PACK_MANAGER_STATE);
}

export function useHistoryManagerState() {
  return usePersistentState<HistoryManagerState>(
    STORAGE_KEYS.history,
    DEFAULT_HISTORY_MANAGER_STATE,
  );
}

export function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

export function nowIsoString() {
  return new Date().toISOString();
}

export function mergeManagedAgents(
  baseAgents: AgentCatalogEntry[],
  state: AgentManagerState,
): Array<AgentCatalogEntry & { source: "system" | "local" }> {
  const mergedBase = baseAgents.map((agent) => ({
    ...agent,
    ...state.overrides[agent.agent_id],
    source: "system" as const,
  }));

  const customAgents = state.customAgents.map((agent) => ({
    ...agent,
    source: "local" as const,
  }));

  return [...mergedBase, ...customAgents];
}

export function mergeManagedPacks(
  basePacks: PackCatalogEntry[],
  state: PackManagerState,
): Array<PackCatalogEntry & { source: "system" | "local" }> {
  const mergedBase = basePacks.map((pack) => ({
    ...pack,
    ...state.overrides[pack.pack_id],
    source: "system" as const,
  }));

  const customPacks = state.customPacks.map((pack) => ({
    ...pack,
    source: "local" as const,
  }));

  return [...mergedBase, ...customPacks];
}
