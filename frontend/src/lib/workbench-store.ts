"use client";

import { useEffect, useRef, useState } from "react";

import type {
  AgentCatalogEntry,
  DensityPreference,
  DeliverableSortPreference,
  HomepageDisplayPreference,
  MatterWorkspaceContentSections,
  OperatorIdentitySettings,
  PackCatalogEntry,
  ThemePreference,
  WorkbenchSettings,
} from "@/lib/types";

export type {
  DensityPreference,
  DeliverableSortPreference,
  HomepageDisplayPreference,
  OperatorIdentitySettings,
  ThemePreference,
  WorkbenchSettings,
} from "@/lib/types";

export type MatterLifecycleStatus = "active" | "paused" | "closed" | "archived";
export type DeliverableLifecycleStatus =
  | "draft"
  | "pending_confirmation"
  | "final"
  | "archived";
export type MatterWorkspaceSyncState =
  | "pending_sync"
  | "syncing"
  | "sync_failed"
  | "needs_review";

export interface MatterWorkspaceRecord {
  title: string;
  summary: string;
  status: MatterLifecycleStatus;
  contentSections: MatterWorkspaceContentSections;
  updatedAt: string;
  persistenceSource?: "local-fallback";
  syncState?: MatterWorkspaceSyncState;
  baseRemoteUpdatedAt?: string | null;
  lastSyncAttemptAt?: string | null;
  lastSyncError?: string | null;
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
  operatorIdentity: "infinite-pro.workbench.operator-identity",
  matters: "infinite-pro.workbench.matters",
  agents: "infinite-pro.workbench.agents",
  packs: "infinite-pro.workbench.packs",
  history: "infinite-pro.workbench.history",
} as const;

const PERSISTENT_STATE_SYNC_EVENT = "infinite-pro:persistent-state-sync";

export const DEFAULT_WORKBENCH_SETTINGS: WorkbenchSettings = {
  interfaceLanguage: "zh-Hant",
  themePreference: "light",
  homepageDisplayPreference: "matters",
  historyDefaultPageSize: 20,
  showRecentActivity: true,
  showFrequentExtensions: true,
  newTaskDefaultInputMode: "one_line_inquiry",
  density: "standard",
  deliverableSortPreference: "updated_desc",
};

export const DEFAULT_OPERATOR_IDENTITY_SETTINGS: OperatorIdentitySettings = {
  operatorDisplayName: "",
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
  window.dispatchEvent(
    new CustomEvent(PERSISTENT_STATE_SYNC_EVENT, {
      detail: {
        key,
        value,
      },
    }),
  );
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
    if (!hydrated || !canUseStorage()) {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key || event.newValue == null) {
        return;
      }

      try {
        setState(JSON.parse(event.newValue) as T);
      } catch {
        setState(initialRef.current);
      }
    };

    const handlePersistentStateSync = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string; value?: T }>;
      if (customEvent.detail?.key !== key || customEvent.detail.value === undefined) {
        return;
      }

      setState(customEvent.detail.value);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(PERSISTENT_STATE_SYNC_EVENT, handlePersistentStateSync as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        PERSISTENT_STATE_SYNC_EVENT,
        handlePersistentStateSync as EventListener,
      );
    };
  }, [hydrated, key]);

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

export function useOperatorIdentitySettings() {
  return usePersistentState<OperatorIdentitySettings>(
    STORAGE_KEYS.operatorIdentity,
    DEFAULT_OPERATOR_IDENTITY_SETTINGS,
  );
}

export function useMatterWorkspaceRecords() {
  return usePersistentState<Record<string, MatterWorkspaceRecord>>(STORAGE_KEYS.matters, {});
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
  const normalizeAgent = (agent: Partial<AgentCatalogEntry>): AgentCatalogEntry => ({
    agent_id: agent.agent_id ?? "",
    agent_name: agent.agent_name ?? "",
    agent_type: agent.agent_type ?? "specialist",
    description: agent.description ?? "",
    supported_capabilities: agent.supported_capabilities ?? [],
    relevant_domain_packs: agent.relevant_domain_packs ?? [],
    relevant_industry_packs: agent.relevant_industry_packs ?? [],
    primary_responsibilities: agent.primary_responsibilities ?? [],
    out_of_scope: agent.out_of_scope ?? [],
    defer_rules: agent.defer_rules ?? [],
    preferred_execution_modes: agent.preferred_execution_modes ?? [],
    input_requirements: agent.input_requirements ?? [],
    minimum_evidence_readiness: agent.minimum_evidence_readiness ?? [],
    required_context_fields: agent.required_context_fields ?? [],
    output_contract: agent.output_contract ?? [],
    produced_objects: agent.produced_objects ?? [],
    deliverable_impact: agent.deliverable_impact ?? [],
    writeback_expectations: agent.writeback_expectations ?? [],
    invocation_rules: agent.invocation_rules ?? [],
    escalation_rules: agent.escalation_rules ?? [],
    handoff_targets: agent.handoff_targets ?? [],
    evaluation_focus: agent.evaluation_focus ?? [],
    failure_modes_to_watch: agent.failure_modes_to_watch ?? [],
    trace_requirements: agent.trace_requirements ?? [],
    version: agent.version ?? "1.0.0",
    status: agent.status ?? "active",
  });
  const mergeAgent = (
    base: AgentCatalogEntry,
    override?: Partial<AgentCatalogEntry>,
  ): AgentCatalogEntry => ({
    ...base,
    ...(override ?? {}),
    supported_capabilities: override?.supported_capabilities ?? base.supported_capabilities,
    relevant_domain_packs: override?.relevant_domain_packs ?? base.relevant_domain_packs,
    relevant_industry_packs:
      override?.relevant_industry_packs ?? base.relevant_industry_packs,
    primary_responsibilities:
      override?.primary_responsibilities ?? base.primary_responsibilities,
    out_of_scope: override?.out_of_scope ?? base.out_of_scope,
    defer_rules: override?.defer_rules ?? base.defer_rules,
    preferred_execution_modes:
      override?.preferred_execution_modes ?? base.preferred_execution_modes,
    input_requirements: override?.input_requirements ?? base.input_requirements,
    minimum_evidence_readiness:
      override?.minimum_evidence_readiness ?? base.minimum_evidence_readiness,
    required_context_fields:
      override?.required_context_fields ?? base.required_context_fields,
    output_contract: override?.output_contract ?? base.output_contract,
    produced_objects: override?.produced_objects ?? base.produced_objects,
    deliverable_impact: override?.deliverable_impact ?? base.deliverable_impact,
    writeback_expectations:
      override?.writeback_expectations ?? base.writeback_expectations,
    invocation_rules: override?.invocation_rules ?? base.invocation_rules,
    escalation_rules: override?.escalation_rules ?? base.escalation_rules,
    handoff_targets: override?.handoff_targets ?? base.handoff_targets,
    evaluation_focus: override?.evaluation_focus ?? base.evaluation_focus,
    failure_modes_to_watch:
      override?.failure_modes_to_watch ?? base.failure_modes_to_watch,
    trace_requirements: override?.trace_requirements ?? base.trace_requirements,
  });

  const mergedBase = baseAgents.map((agent) => ({
    ...mergeAgent(normalizeAgent(agent), state.overrides[agent.agent_id]),
    source: "system" as const,
  }));

  const customAgents = state.customAgents.map((agent) => ({
    ...normalizeAgent(agent),
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
