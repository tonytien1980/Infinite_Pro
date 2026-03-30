"use client";

import { useEffect, useMemo, useState } from "react";

import { getExtensionManager, listTasks } from "@/lib/api";
import {
  applyPackFallbackState,
  buildPackPersistenceFeedback,
  clearLocalPackEntry,
  persistPackCatalogEntry,
} from "@/lib/workbench-persistence";
import type { ExtensionManagerSnapshot, PackCatalogEntry, TaskListItem } from "@/lib/types";
import {
  getPackCatalogDisplay,
  labelForExtensionStatus,
  labelForPackType,
} from "@/lib/ui-labels";
import {
  createLocalId,
  mergeManagedPacks,
  usePackManagerState,
} from "@/lib/workbench-store";

type PackTab = "domain" | "industry";
type PackFilterStatus = "all" | "active" | "inactive";

type PackDraft = {
  pack_name: string;
  pack_type: PackTab;
  description: string;
  definition: string;
  common_business_models: string;
  common_problem_patterns: string;
  key_signals: string;
  evidence_expectations: string;
  common_risks: string;
  decision_patterns: string;
  deliverable_presets: string;
  routing_hints: string;
  scope_boundaries: string;
  pack_rationale: string;
  pack_notes: string;
  version: string;
  status: string;
};

type PackQualityCheck = {
  label: string;
  ready: boolean;
};

function buildUsageMap(tasks: TaskListItem[]) {
  const usage = new Map<string, { count: number; lastUsedAt: string }>();

  tasks.forEach((task) => {
    task.selected_pack_ids.forEach((packId) => {
      const entry = usage.get(packId) ?? { count: 0, lastUsedAt: task.updated_at };
      entry.count += 1;
      if (new Date(task.updated_at).getTime() > new Date(entry.lastUsedAt).getTime()) {
        entry.lastUsedAt = task.updated_at;
      }
      usage.set(packId, entry);
    });
  });

  return usage;
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(values?: string[]) {
  return values?.join("\n") ?? "";
}

function getSignalItems(pack: Pick<PackCatalogEntry, "key_kpis_or_operating_signals" | "key_kpis">) {
  return pack.key_kpis_or_operating_signals.length > 0
    ? pack.key_kpis_or_operating_signals
    : pack.key_kpis;
}

function getPackDefinition(pack: Pick<PackCatalogEntry, "pack_type" | "domain_definition" | "industry_definition" | "description">) {
  if (pack.pack_type === "domain") {
    return pack.domain_definition || pack.description;
  }
  return pack.industry_definition || pack.description;
}

function getPackQualityChecks(pack: PackCatalogEntry): PackQualityCheck[] {
  const signalItems = getSignalItems(pack);

  if (pack.pack_type === "domain") {
    return [
      { label: "定義", ready: Boolean(getPackDefinition(pack)) },
      { label: "問題型態", ready: pack.common_problem_patterns.length > 0 },
      { label: "關鍵訊號", ready: signalItems.length > 0 },
      { label: "證據期待", ready: pack.evidence_expectations.length > 0 },
      { label: "決策模式", ready: pack.decision_patterns.length > 0 },
      { label: "交付預設", ready: pack.deliverable_presets.length > 0 },
      { label: "範圍邊界", ready: pack.scope_boundaries.length > 0 },
      { label: "存在理由", ready: pack.pack_rationale.length > 0 },
    ];
  }

  return [
    { label: "定義", ready: Boolean(getPackDefinition(pack)) },
    { label: "商業模式", ready: pack.common_business_models.length > 0 },
    { label: "問題型態", ready: pack.common_problem_patterns.length > 0 },
    { label: "關鍵指標", ready: pack.key_kpis.length > 0 },
    { label: "證據期待", ready: pack.evidence_expectations.length > 0 },
    { label: "決策模式", ready: pack.decision_patterns.length > 0 },
    { label: "交付預設", ready: pack.deliverable_presets.length > 0 },
    { label: "存在理由", ready: pack.pack_rationale.length > 0 },
  ];
}

function hasCoreContract(pack: PackCatalogEntry) {
  return getPackQualityChecks(pack).every((check) => check.ready);
}

function summarizeMissingChecks(checks: PackQualityCheck[]) {
  const missing = checks.filter((check) => !check.ready).map((check) => check.label);
  return missing.length > 0 ? missing.join("、") : null;
}

function buildEmptyPackEntry(packType: PackTab, packId: string): PackCatalogEntry {
  return {
    pack_id: packId,
    pack_type: packType,
    pack_name: "",
    description: "",
    domain_definition: "",
    industry_definition: "",
    common_business_models: [],
    common_problem_patterns: [],
    stage_specific_heuristics: {},
    key_kpis_or_operating_signals: [],
    key_kpis: [],
    domain_lenses: [],
    relevant_client_types: [],
    relevant_client_stages: [],
    default_decision_context_patterns: [],
    evidence_expectations: [],
    risk_libraries: [],
    common_risks: [],
    decision_patterns: [],
    deliverable_presets: [],
    recommendation_patterns: [],
    routing_hints: [],
    pack_notes: [],
    scope_boundaries: [],
    pack_rationale: [],
    version: "1.0.0",
    status: "active",
    override_rules: [],
  };
}

function toPackCatalogEntry(
  pack: PackCatalogEntry & {
    source?: "system" | "local";
    usageCount?: number;
    lastUsedAt?: string | null;
  },
): PackCatalogEntry {
  return {
    pack_id: pack.pack_id,
    pack_type: pack.pack_type,
    pack_name: pack.pack_name,
    description: pack.description,
    domain_definition: pack.domain_definition,
    industry_definition: pack.industry_definition,
    common_business_models: pack.common_business_models,
    common_problem_patterns: pack.common_problem_patterns,
    stage_specific_heuristics: pack.stage_specific_heuristics,
    key_kpis_or_operating_signals: pack.key_kpis_or_operating_signals,
    key_kpis: pack.key_kpis,
    domain_lenses: pack.domain_lenses,
    relevant_client_types: pack.relevant_client_types,
    relevant_client_stages: pack.relevant_client_stages,
    default_decision_context_patterns: pack.default_decision_context_patterns,
    evidence_expectations: pack.evidence_expectations,
    risk_libraries: pack.risk_libraries,
    common_risks: pack.common_risks,
    decision_patterns: pack.decision_patterns,
    deliverable_presets: pack.deliverable_presets,
    recommendation_patterns: pack.recommendation_patterns,
    routing_hints: pack.routing_hints,
    pack_notes: pack.pack_notes,
    scope_boundaries: pack.scope_boundaries,
    pack_rationale: pack.pack_rationale,
    version: pack.version,
    status: pack.status,
    override_rules: pack.override_rules,
  };
}

function buildDraft(pack?: Partial<PackCatalogEntry>): PackDraft {
  const packType = (pack?.pack_type as PackTab) ?? "domain";

  return {
    pack_name: pack?.pack_name ?? "",
    pack_type: packType,
    description: pack?.description ?? "",
    definition:
      packType === "domain"
        ? pack?.domain_definition ?? ""
        : pack?.industry_definition ?? "",
    common_business_models: joinLines(pack?.common_business_models),
    common_problem_patterns: joinLines(pack?.common_problem_patterns),
    key_signals: joinLines(
      pack?.key_kpis_or_operating_signals?.length
        ? pack.key_kpis_or_operating_signals
        : pack?.key_kpis,
    ),
    evidence_expectations: joinLines(pack?.evidence_expectations),
    common_risks: joinLines(pack?.common_risks),
    decision_patterns: joinLines(pack?.decision_patterns),
    deliverable_presets: joinLines(pack?.deliverable_presets),
    routing_hints: joinLines(pack?.routing_hints),
    scope_boundaries: joinLines(pack?.scope_boundaries),
    pack_rationale: joinLines(pack?.pack_rationale),
    pack_notes: joinLines(pack?.pack_notes),
    version: pack?.version ?? "1.0.0",
    status: pack?.status ?? "active",
  };
}

function buildPayloadFromDraft(
  draft: PackDraft,
  packId: string,
  basePack?: PackCatalogEntry,
): PackCatalogEntry {
  const next = {
    ...(basePack ?? buildEmptyPackEntry(draft.pack_type, packId)),
    pack_id: packId,
    pack_type: draft.pack_type,
    pack_name: draft.pack_name.trim(),
    description: draft.description.trim(),
    domain_definition: draft.pack_type === "domain" ? draft.definition.trim() : "",
    industry_definition: draft.pack_type === "industry" ? draft.definition.trim() : "",
    common_business_models:
      draft.pack_type === "industry" ? splitLines(draft.common_business_models) : [],
    common_problem_patterns: splitLines(draft.common_problem_patterns),
    key_kpis_or_operating_signals: splitLines(draft.key_signals),
    key_kpis: splitLines(draft.key_signals),
    evidence_expectations: splitLines(draft.evidence_expectations),
    common_risks: splitLines(draft.common_risks),
    decision_patterns: splitLines(draft.decision_patterns),
    deliverable_presets: splitLines(draft.deliverable_presets),
    routing_hints: splitLines(draft.routing_hints),
    scope_boundaries:
      draft.pack_type === "domain" ? splitLines(draft.scope_boundaries) : [],
    pack_rationale: splitLines(draft.pack_rationale),
    pack_notes: splitLines(draft.pack_notes),
    version: draft.version.trim() || "1.0.0",
    status: draft.status,
  };

  if (draft.pack_type === "domain") {
    next.common_business_models = [];
  } else {
    next.scope_boundaries = [];
  }

  return next;
}

function getNextPackTab(current: PackTab, direction: "next" | "previous") {
  const order: PackTab[] = ["domain", "industry"];
  const currentIndex = order.indexOf(current);
  const offset = direction === "next" ? 1 : -1;
  return order[(currentIndex + offset + order.length) % order.length];
}

function PackListSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="detail-item">
      <h4>{title}</h4>
      {items.length > 0 ? (
        <ul className="list-content">
          {items.map((item) => (
            <li key={`${title}-${item}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted-text">{emptyText}</p>
      )}
    </div>
  );
}

export function PackManagementPanel() {
  const [snapshot, setSnapshot] = useState<ExtensionManagerSnapshot | null>(null);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [activeTab, setActiveTab] = useState<PackTab>("domain");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PackFilterStatus>("all");
  const [editingPackId, setEditingPackId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PackDraft>(buildDraft());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [packState, setPackState] = usePackManagerState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const [snapshotResponse, taskResponse] = await Promise.all([
        getExtensionManager(),
        listTasks(),
      ]);
      setSnapshot(snapshotResponse);
      setTasks(taskResponse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "載入模組包管理頁失敗。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  function handlePackTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    current: PackTab,
  ) {
    let nextTab: PackTab | null = null;

    if (event.key === "ArrowRight") {
      nextTab = getNextPackTab(current, "next");
    } else if (event.key === "ArrowLeft") {
      nextTab = getNextPackTab(current, "previous");
    } else if (event.key === "Home") {
      nextTab = "domain";
    } else if (event.key === "End") {
      nextTab = "industry";
    }

    if (!nextTab) {
      return;
    }

    event.preventDefault();
    setActiveTab(nextTab);
    requestAnimationFrame(() => {
      document.getElementById(`pack-tab-${nextTab}`)?.focus();
    });
  }

  const usageMap = useMemo(() => buildUsageMap(tasks), [tasks]);
  const managedPacks = useMemo(
    () =>
      mergeManagedPacks(snapshot?.pack_registry.packs ?? [], packState).map((pack) => ({
        ...pack,
        usageCount: usageMap.get(pack.pack_id)?.count ?? 0,
        lastUsedAt: usageMap.get(pack.pack_id)?.lastUsedAt ?? null,
      })),
    [packState, snapshot?.pack_registry.packs, usageMap],
  );

  const domainPacks = managedPacks.filter((pack) => pack.pack_type === "domain");
  const industryPacks = managedPacks.filter((pack) => pack.pack_type === "industry");
  const completeCoreContractCount = managedPacks.filter((pack) => hasCoreContract(pack)).length;
  const visiblePacks = (activeTab === "domain" ? domainPacks : industryPacks).filter((pack) => {
    const matchesStatus = statusFilter === "all" || pack.status === statusFilter;
    if (!matchesStatus) {
      return false;
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    const display = getPackCatalogDisplay(pack);
    return [
      pack.pack_name,
      display.primaryName,
      display.secondaryName ?? "",
      display.primaryDescription,
      pack.description,
      getPackDefinition(pack),
      ...pack.common_business_models,
      ...pack.common_problem_patterns,
      ...getSignalItems(pack),
      ...pack.evidence_expectations,
      ...pack.common_risks,
      ...pack.decision_patterns,
      ...pack.deliverable_presets,
      ...pack.routing_hints,
      ...pack.scope_boundaries,
      ...pack.pack_rationale,
      ...pack.pack_notes,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
  const packActionTitle =
    editingPackId ? "現在正處於模組包編輯模式" : "先決定是問題面向，還是產業模組包";
  const packActionSummary = editingPackId
    ? "這一輪會直接編輯 pack contract，而不是只改名稱與版本。儲存前請確認定義、證據期待、決策模式與交付 preset 是否一致。"
    : "先確認你要查看的是哪一類 pack，再檢查它的核心 contract 是否完整，而不是一開始就落進新增表單。";
  const packActionChecklist = [
    `目前共有 ${domainPacks.length} 個問題面向模組包、${industryPacks.length} 個產業模組包。`,
    `其中 ${completeCoreContractCount} 個模組包已補齊核心 contract。`,
    activeTab === "domain"
      ? "現在正在看問題面向模組包；先看它是否把工作邊界、證據期待與交付形狀講清楚。"
      : "現在正在看產業模組包；先看它是否把商業模式、指標、常見決策模式講清楚。",
    editingPackId
      ? `正在編輯「${draft.pack_name || editingPackId}」。`
      : "若只是查看現況，先搜尋與切換 tab，不要直接進入新增。",
  ];

  const definitionLabel = draft.pack_type === "domain" ? "問題面向定義" : "產業定義";
  const signalLabel = draft.pack_type === "domain" ? "關鍵指標／經營訊號" : "關鍵指標";

  function startCreate() {
    setEditingPackId(null);
    setDraft(buildDraft({ pack_type: activeTab } as PackCatalogEntry));
    setSaveMessage(null);
  }

  function startEdit(pack: PackCatalogEntry) {
    setEditingPackId(pack.pack_id);
    setDraft(buildDraft(pack));
    setSaveMessage(null);
  }

  async function handleSave() {
    const packId = editingPackId ?? createLocalId("local-pack");
    const basePackRow = managedPacks.find((pack) => pack.pack_id === packId);
    const basePack = basePackRow ? toPackCatalogEntry(basePackRow) : undefined;
    const payload = buildPayloadFromDraft(draft, packId, basePack);

    if (!payload.pack_name) {
      setSaveMessage("請先填寫模組包名稱。");
      return;
    }

    const isSystemPack =
      snapshot?.pack_registry.packs.some((pack) => pack.pack_id === payload.pack_id) ?? false;
    try {
      const result = await persistPackCatalogEntry(payload, !isSystemPack);

      if (result.source === "remote") {
        setSnapshot(result.snapshot);
        setPackState((current) => clearLocalPackEntry(current, payload.pack_id));
      } else {
        setPackState((current) => applyPackFallbackState(current, payload, isSystemPack));
      }

      setEditingPackId(payload.pack_id);
      setActiveTab(draft.pack_type);
      setSaveMessage(buildPackPersistenceFeedback(result.source, payload.pack_name));
    } catch (saveError) {
      setSaveMessage(saveError instanceof Error ? saveError.message : "保存模組包失敗。");
    }
  }

  async function handleToggle(pack: PackCatalogEntry & { source: "system" | "local" }) {
    const nextStatus = pack.status === "active" ? "inactive" : "active";
    const nextPayload = {
      ...toPackCatalogEntry(pack),
      status: nextStatus,
    };

    try {
      const result = await persistPackCatalogEntry(nextPayload, pack.source === "local");

      if (result.source === "remote") {
        setSnapshot(result.snapshot);
        setPackState((current) => clearLocalPackEntry(current, pack.pack_id));
      } else {
        setPackState((current) =>
          applyPackFallbackState(current, nextPayload, pack.source === "system"),
        );
      }

      setSaveMessage(buildPackPersistenceFeedback(result.source, nextPayload.pack_name));
    } catch (saveError) {
      setSaveMessage(saveError instanceof Error ? saveError.message : "更新模組包狀態失敗。");
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">模組包管理</span>
        <h1 className="page-title">模組包管理</h1>
        <p className="page-subtitle">
          管理問題面向模組包與產業模組包的分類、狀態、版本、最近使用情況，以及它們是否已把證據、決策與交付邏輯定義完整。
        </p>
        <div className="workbench-overview-grid" style={{ marginTop: "20px" }}>
          <div className="section-card">
            <h3>問題面向模組包</h3>
            <p className="workbench-metric">{domainPacks.length}</p>
            <p className="muted-text">承接顧問工作類型、問題邊界與處理方式。</p>
          </div>
          <div className="section-card">
            <h3>產業模組包</h3>
            <p className="workbench-metric">{industryPacks.length}</p>
            <p className="muted-text">承接商業模式、產業限制與常見指標。</p>
          </div>
          <div className="section-card">
            <h3>啟用中</h3>
            <p className="workbench-metric">
              {managedPacks.filter((pack) => pack.status === "active").length}
            </p>
            <p className="muted-text">目前可被 Host 與任務 workflow 選入的模組包。</p>
          </div>
          <div className="section-card">
            <h3>核心定義完整</h3>
            <p className="workbench-metric">{completeCoreContractCount}</p>
            <p className="muted-text">已補齊 evidence、decision、deliverable 與 rationale 的模組包。</p>
          </div>
        </div>
      </section>

      {loading ? (
        <p className="status-text" role="status" aria-live="polite">
          正在載入模組包管理頁...
        </p>
      ) : null}
      {error ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}

      {!loading && !error ? (
        <div className="detail-grid">
          <div className="detail-stack">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">模組包目錄</h2>
                  <p className="panel-copy">
                    維持兩大分類管理，並把 pack contract 的強弱直接攤開，而不是只顯示名稱與版本。
                  </p>
                </div>
                <button className="button-primary" type="button" onClick={startCreate}>
                  新增模組包
                </button>
              </div>

              <div className="summary-grid" style={{ marginBottom: "18px" }}>
                <div className="section-card">
                  <h4>{packActionTitle}</h4>
                  <p className="content-block">{packActionSummary}</p>
                </div>
                <div className="section-card">
                  <h4>這頁現在先看什麼</h4>
                  <ul className="list-content">
                    {packActionChecklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="page-tabs" role="tablist" aria-label="模組包類型">
                <button
                  className={`page-tab${activeTab === "domain" ? " page-tab-active" : ""}`}
                  type="button"
                  role="tab"
                  id="pack-tab-domain"
                  aria-selected={activeTab === "domain"}
                  aria-controls="pack-tabpanel-domain"
                  tabIndex={activeTab === "domain" ? 0 : -1}
                  onKeyDown={(event) => handlePackTabKeyDown(event, "domain")}
                  onClick={() => setActiveTab("domain")}
                >
                  問題面向模組包
                </button>
                <button
                  className={`page-tab${activeTab === "industry" ? " page-tab-active" : ""}`}
                  type="button"
                  role="tab"
                  id="pack-tab-industry"
                  aria-selected={activeTab === "industry"}
                  aria-controls="pack-tabpanel-industry"
                  tabIndex={activeTab === "industry" ? 0 : -1}
                  onKeyDown={(event) => handlePackTabKeyDown(event, "industry")}
                  onClick={() => setActiveTab("industry")}
                >
                  產業模組包
                </button>
              </div>

              <div className="toolbar-grid">
                <div className="field">
                  <label htmlFor="pack-search">搜尋模組包</label>
                  <input
                    id="pack-search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="搜尋定義、問題模式、證據期待或關鍵指標"
                  />
                </div>

                <div className="field">
                  <label htmlFor="pack-status-filter">狀態篩選</label>
                  <select
                    id="pack-status-filter"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as PackFilterStatus)
                    }
                  >
                    <option value="all">全部狀態</option>
                    <option value="active">啟用中</option>
                    <option value="inactive">已停用</option>
                  </select>
                </div>
              </div>

              <div
                className="history-list"
                style={{ marginTop: "18px" }}
                role="tabpanel"
                id={activeTab === "domain" ? "pack-tabpanel-domain" : "pack-tabpanel-industry"}
                aria-labelledby={activeTab === "domain" ? "pack-tab-domain" : "pack-tab-industry"}
              >
                {visiblePacks.length > 0 ? (
                  visiblePacks.map((pack) => {
                    const display = getPackCatalogDisplay(pack);
                    const qualityChecks = getPackQualityChecks(pack);
                    const readyCount = qualityChecks.filter((check) => check.ready).length;
                    const missingChecks = summarizeMissingChecks(qualityChecks);
                    const signalItems = getSignalItems(pack);

                    return (
                      <article className="history-item management-card" key={pack.pack_id}>
                        <div className="meta-row">
                          <span className="pill">{labelForPackType(pack.pack_type)}</span>
                          <span>{labelForExtensionStatus(pack.status)}</span>
                          <span>v{pack.version}</span>
                          <span>{pack.source === "local" ? "自訂模組包" : "系統模組包"}</span>
                        </div>
                        <h3>{display.primaryName}</h3>
                        {display.secondaryName ? (
                          <p className="muted-text">系統代號：{pack.pack_id}</p>
                        ) : null}
                        <p className="content-block">{display.primaryDescription}</p>
                        <p className="muted-text">
                          最近使用：
                          {pack.usageCount > 0 && pack.lastUsedAt
                            ? `${pack.usageCount} 次，最近於 ${new Intl.DateTimeFormat("zh-TW", {
                                dateStyle: "medium",
                              }).format(new Date(pack.lastUsedAt))}`
                            : "目前沒有使用紀錄"}
                        </p>
                        <p className="muted-text">
                          核心定義：{readyCount}/{qualityChecks.length} 已補齊
                          {missingChecks ? `；尚待補強：${missingChecks}` : "；目前已可作為完整 pack contract 使用"}
                        </p>
                        <details className="inline-disclosure">
                          <summary className="inline-disclosure-summary">查看 pack contract</summary>
                          <div className="detail-list" style={{ marginTop: "12px" }}>
                            <div className="detail-item">
                              <h4>{pack.pack_type === "domain" ? "問題面向定義" : "產業定義"}</h4>
                              <p className="content-block">
                                {getPackDefinition(pack) || "目前沒有正式定義。"}
                              </p>
                            </div>
                            {pack.pack_type === "industry" ? (
                              <PackListSection
                                title="常見商業模式"
                                items={pack.common_business_models}
                                emptyText="目前沒有標示商業模式。"
                              />
                            ) : (
                              <PackListSection
                                title="範圍邊界"
                                items={pack.scope_boundaries}
                                emptyText="目前沒有標示邊界。"
                              />
                            )}
                            <PackListSection
                              title="常見問題型態"
                              items={pack.common_problem_patterns}
                              emptyText="目前沒有整理常見問題型態。"
                            />
                            <PackListSection
                              title={pack.pack_type === "domain" ? "關鍵指標／經營訊號" : "關鍵指標"}
                              items={signalItems}
                              emptyText="目前沒有整理關鍵指標或訊號。"
                            />
                            <PackListSection
                              title="證據期待"
                              items={pack.evidence_expectations}
                              emptyText="目前沒有整理證據期待。"
                            />
                            <PackListSection
                              title="常見風險"
                              items={pack.common_risks}
                              emptyText="目前沒有整理常見風險。"
                            />
                            <PackListSection
                              title="決策模式"
                              items={pack.decision_patterns}
                              emptyText="目前沒有整理決策模式。"
                            />
                            <PackListSection
                              title="交付預設"
                              items={pack.deliverable_presets}
                              emptyText="目前沒有整理交付預設。"
                            />
                            <PackListSection
                              title="路由提示"
                              items={pack.routing_hints}
                              emptyText="目前沒有額外路由提示。"
                            />
                            <PackListSection
                              title="存在理由"
                              items={pack.pack_rationale}
                              emptyText="目前沒有整理 pack rationale。"
                            />
                            <PackListSection
                              title="備註"
                              items={pack.pack_notes}
                              emptyText="目前沒有額外備註。"
                            />
                          </div>
                        </details>
                        <div className="button-row" style={{ marginTop: "12px" }}>
                          <button
                            className="button-secondary"
                            type="button"
                            onClick={() => startEdit(pack)}
                          >
                            編輯
                          </button>
                          <button
                            className="button-secondary"
                            type="button"
                            onClick={() => handleToggle(pack)}
                          >
                            {pack.status === "active" ? "停用" : "啟用"}
                          </button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <p className="empty-text">目前沒有符合條件的模組包。</p>
                )}
              </div>
            </section>
          </div>

          <div className="detail-stack">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">{editingPackId ? "編輯模組包" : "新增模組包"}</h2>
                  <p className="panel-copy">
                    這裡編輯的是 pack 的核心 contract。除了名稱、狀態與版本，也要一起維護證據期待、決策模式與交付預設。
                  </p>
                  {editingPackId ? (
                    <p className="muted-text">
                      顯示名稱：
                      {getPackCatalogDisplay(
                        managedPacks.find((pack) => pack.pack_id === editingPackId) ??
                          buildEmptyPackEntry(draft.pack_type, editingPackId),
                      ).primaryName}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="pack-name">模組包名稱</label>
                  <input
                    id="pack-name"
                    value={draft.pack_name}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, pack_name: event.target.value }))
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="pack-type">分類</label>
                  <select
                    id="pack-type"
                    value={draft.pack_type}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        pack_type: event.target.value as PackTab,
                        definition: "",
                        common_business_models:
                          event.target.value === "industry"
                            ? current.common_business_models
                            : "",
                        scope_boundaries:
                          event.target.value === "domain" ? current.scope_boundaries : "",
                      }))
                    }
                  >
                    <option value="domain">問題面向模組包</option>
                    <option value="industry">產業模組包</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="pack-version">版本</label>
                  <input
                    id="pack-version"
                    value={draft.version}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, version: event.target.value }))
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="pack-status">狀態</label>
                  <select
                    id="pack-status"
                    value={draft.status}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, status: event.target.value }))
                    }
                  >
                    <option value="active">啟用中</option>
                    <option value="inactive">停用中</option>
                    <option value="draft">草稿</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="pack-description">模組包說明</label>
                  <textarea
                    id="pack-description"
                    value={draft.description}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="說明這個模組包最適合處理的問題脈絡。"
                  />
                </div>

                <div className="field">
                  <label htmlFor="pack-definition">{definitionLabel}</label>
                  <textarea
                    id="pack-definition"
                    value={draft.definition}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, definition: event.target.value }))
                    }
                    placeholder={
                      draft.pack_type === "domain"
                        ? "說明這個問題面向 pack 主要要處理哪一類顧問工作與邊界。"
                        : "說明這個產業 pack 的核心商業結構、限制與觀察重點。"
                    }
                  />
                </div>

                {draft.pack_type === "industry" ? (
                  <div className="field">
                    <label htmlFor="pack-business-models">常見商業模式</label>
                    <textarea
                      id="pack-business-models"
                      value={draft.common_business_models}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          common_business_models: event.target.value,
                        }))
                      }
                      placeholder={"每行一個模式，例如：\n訂閱制\nDTC 電商"}
                    />
                  </div>
                ) : (
                  <div className="field">
                    <label htmlFor="pack-scope-boundaries">範圍邊界</label>
                    <textarea
                      id="pack-scope-boundaries"
                      value={draft.scope_boundaries}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          scope_boundaries: event.target.value,
                        }))
                      }
                      placeholder={"每行一個邊界，例如：\n不處理稅務申報\n不取代正式法遵意見"}
                    />
                  </div>
                )}

                <div className="field">
                  <label htmlFor="pack-patterns">常見問題型態</label>
                  <textarea
                    id="pack-patterns"
                    value={draft.common_problem_patterns}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        common_problem_patterns: event.target.value,
                      }))
                    }
                    placeholder={"每行一個模式，例如：\n定價混亂\n渠道衝突"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="pack-signals">{signalLabel}</label>
                  <textarea
                    id="pack-signals"
                    value={draft.key_signals}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, key_signals: event.target.value }))
                    }
                    placeholder={"每行一個項目，例如：\nactivation rate\nconversion rate"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="pack-evidence">證據期待</label>
                  <textarea
                    id="pack-evidence"
                    value={draft.evidence_expectations}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        evidence_expectations: event.target.value,
                      }))
                    }
                    placeholder={"每行一個期待，例如：\n近三期 pipeline 數據\n渠道分層成效"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="pack-risks">常見風險</label>
                  <textarea
                    id="pack-risks"
                    value={draft.common_risks}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, common_risks: event.target.value }))
                    }
                    placeholder={"每行一個風險，例如：\n對單一渠道過度依賴\nSKU 擴張拖累現金流"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="pack-decisions">決策模式</label>
                  <textarea
                    id="pack-decisions"
                    value={draft.decision_patterns}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        decision_patterns: event.target.value,
                      }))
                    }
                    placeholder={"每行一個模式，例如：\n是否該重做 pricing / packaging\n是否該縮減渠道"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="pack-deliverables">交付預設</label>
                  <textarea
                    id="pack-deliverables"
                    value={draft.deliverable_presets}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        deliverable_presets: event.target.value,
                      }))
                    }
                    placeholder={"每行一個 preset，例如：\n優先級行動清單\n商業診斷 memo"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="pack-routing">路由提示</label>
                  <textarea
                    id="pack-routing"
                    value={draft.routing_hints}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, routing_hints: event.target.value }))
                    }
                    placeholder={"每行一個提示，例如：\n優先拉入 research_intelligence_agent\n需要 finance 視角"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="pack-rationale">存在理由</label>
                  <textarea
                    id="pack-rationale"
                    value={draft.pack_rationale}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, pack_rationale: event.target.value }))
                    }
                    placeholder={"每行一個理由，例如：\n這類案件的 evidence 與一般營運診斷差異很大"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="pack-notes">備註</label>
                  <textarea
                    id="pack-notes"
                    value={draft.pack_notes}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, pack_notes: event.target.value }))
                    }
                    placeholder={"每行一個備註，例如：\n若資料只到渠道層，先標記 evidence gap"}
                  />
                </div>

                <div className="button-row">
                  <button className="button-primary" type="button" onClick={handleSave}>
                    儲存模組包
                  </button>
                </div>
                {saveMessage ? (
                  <p className="success-text" role="status" aria-live="polite">
                    {saveMessage}
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </main>
  );
}
