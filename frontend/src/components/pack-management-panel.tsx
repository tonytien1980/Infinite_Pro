"use client";

import { useEffect, useMemo, useState } from "react";

import { draftPackContract, getExtensionManager, listTasks } from "@/lib/api";
import {
  buildGuidedPackDraft,
  type GuidedPackDraft,
} from "@/lib/extension-guided-builders";
import {
  applyPackFallbackState,
  buildPackPersistenceFeedback,
  clearLocalPackEntry,
  persistPackCatalogEntry,
} from "@/lib/workbench-persistence";
import type {
  ExtensionManagerSnapshot,
  PackCatalogEntry,
  PackContractDraftResult,
  TaskListItem,
} from "@/lib/types";
import {
  getPackCatalogDisplay,
  labelForPackContractInterface,
  labelForPackContractStatus,
  labelForPackRequiredProperty,
  labelForPackRuleBinding,
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

function getStageHeuristicItems(pack: Pick<PackCatalogEntry, "stage_specific_heuristics">) {
  return Object.entries(pack.stage_specific_heuristics).flatMap(([stage, items]) =>
    items.map((item) => `${stage}｜${item}`),
  );
}

function getPackQualityChecks(pack: PackCatalogEntry): PackQualityCheck[] {
  const signalItems = getSignalItems(pack);
  const stageHeuristicItems = getStageHeuristicItems(pack);

  if (pack.pack_type === "domain") {
    return [
      { label: "定義", ready: Boolean(getPackDefinition(pack)) },
      { label: "問題型態", ready: pack.common_problem_patterns.length > 0 },
      {
        label: "階段啟發",
        ready: stageHeuristicItems.length > 0,
      },
      { label: "關鍵訊號", ready: signalItems.length > 0 },
      { label: "證據期待", ready: pack.evidence_expectations.length > 0 },
      { label: "常見風險", ready: pack.common_risks.length > 0 },
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

function getPackContractRequirementSummary(pack: PackCatalogEntry) {
  if (!pack.contract_baseline) {
    return null;
  }
  const readyCount = pack.contract_baseline.requirements.filter(
    (requirement) => requirement.status === "ready",
  ).length;
  return {
    total: pack.contract_baseline.requirements.length,
    ready: readyCount,
    missing: pack.contract_baseline.missing_required_property_ids,
  };
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
  const [guidedDraft, setGuidedDraft] = useState<GuidedPackDraft>(buildGuidedPackDraft());
  const [guidedResult, setGuidedResult] = useState<PackContractDraftResult | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [packState, setPackState] = usePackManagerState();
  const [loading, setLoading] = useState(true);
  const [guidedSaving, setGuidedSaving] = useState(false);
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
    ? "這一輪會用最少必要資訊重新生成 pack contract，而不是要求你逐欄微調技術規格。"
    : "先確認你要查看的是哪一類 pack，再檢查它的核心 contract 是否完整，而不是一開始就落進新增表單。";
  const packActionChecklist = [
    `目前共有 ${domainPacks.length} 個問題面向模組包、${industryPacks.length} 個產業模組包。`,
    `其中 ${completeCoreContractCount} 個模組包已補齊核心 contract。`,
    activeTab === "domain"
      ? "現在正在看問題面向模組包；先看它是否把工作邊界、證據期待與交付形狀講清楚。"
      : "現在正在看產業模組包；先看它是否把商業模式、指標、常見決策模式講清楚。",
    editingPackId
      ? `正在編輯「${guidedDraft.pack_name || editingPackId}」。`
      : "若只是查看現況，先搜尋與切換 tab，不要直接進入新增。",
  ];

  function startCreate() {
    setEditingPackId(null);
    setGuidedDraft(buildGuidedPackDraft({ pack_type: activeTab } as PackCatalogEntry));
    setGuidedResult(null);
    setSaveMessage(null);
  }

  function startEdit(pack: PackCatalogEntry) {
    setEditingPackId(pack.pack_id);
    setGuidedDraft(buildGuidedPackDraft(pack));
    setGuidedResult(null);
    setSaveMessage(null);
  }

  async function savePackPayload(payload: PackCatalogEntry) {
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
      setActiveTab(payload.pack_type as PackTab);
      setGuidedDraft(buildGuidedPackDraft(payload));
      setSaveMessage(buildPackPersistenceFeedback(result.source, payload.pack_name));
    } catch (saveError) {
      setSaveMessage(saveError instanceof Error ? saveError.message : "保存模組包失敗。");
    }
  }

  async function handleGuidedSave() {
    const packId = editingPackId ?? createLocalId("local-pack");
    setGuidedSaving(true);
    setSaveMessage(null);
    try {
      const result = await draftPackContract({
        pack_id: packId,
        pack_type: guidedDraft.pack_type,
        pack_name: guidedDraft.pack_name.trim(),
        description: guidedDraft.description.trim(),
        definition: guidedDraft.definition.trim(),
        domain_lenses: guidedDraft.domain_lenses,
        routing_keywords: guidedDraft.additional_notes,
        common_business_models: "",
        common_problem_patterns: "",
        key_signals: "",
        evidence_expectations: "",
        common_risks: "",
        version: guidedDraft.version.trim() || "1.0.0",
        status: guidedDraft.status,
      });
      setGuidedResult(result);
      await savePackPayload(result.draft);
      setSaveMessage(
        `已用目前系統模型與 ${result.sources.length} 筆外部來源補完「${result.draft.pack_name}」的正式 pack contract，並寫入管理狀態。`,
      );
    } catch (saveError) {
      setSaveMessage(
        saveError instanceof Error ? saveError.message : "目前無法用 AI 補完正式模組包規格。",
      );
    } finally {
      setGuidedSaving(false);
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
                    const contractSummary = getPackContractRequirementSummary(pack);
                    const signalItems = getSignalItems(pack);
                    const stageHeuristicItems = getStageHeuristicItems(pack);

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
                        {pack.contract_baseline ? (
                          <p className="muted-text">
                            正式合約：{labelForPackContractStatus(pack.contract_baseline.status)}
                            {contractSummary
                              ? `（${contractSummary.ready}/${contractSummary.total} 個 interface 已就緒）`
                              : null}
                            {contractSummary && contractSummary.missing.length > 0
                              ? `；仍缺：${contractSummary.missing
                                  .map((item) => labelForPackRequiredProperty(item))
                                  .join("、")}`
                              : ""}
                          </p>
                        ) : null}
                        <details className="inline-disclosure">
                          <summary className="inline-disclosure-summary">查看 pack contract</summary>
                          <div className="detail-list" style={{ marginTop: "12px" }}>
                            {pack.contract_baseline ? (
                              <div className="detail-item">
                                <h4>正式合約基線</h4>
                                <p className="content-block">
                                  API 名稱：{pack.contract_baseline.pack_api_name}
                                  {"\n"}
                                  狀態：{labelForPackContractStatus(pack.contract_baseline.status)}
                                </p>
                                {pack.contract_baseline.requirements.length > 0 ? (
                                  <div style={{ marginTop: "10px" }}>
                                    {pack.contract_baseline.requirements.map((requirement) => (
                                      <div className="detail-item" key={requirement.interface_id}>
                                        <h4>{labelForPackContractInterface(requirement.interface_id)}</h4>
                                        <p className="muted-text">{requirement.summary}</p>
                                        <p className="muted-text">
                                          Rule binding：
                                          {requirement.rule_binding_ids.length > 0
                                            ? requirement.rule_binding_ids
                                                .map((item) => labelForPackRuleBinding(item))
                                                .join("、")
                                            : "目前沒有"}
                                        </p>
                                        <p className="muted-text">
                                          必要欄位：
                                          {requirement.required_property_ids
                                            .map((item) => labelForPackRequiredProperty(item))
                                            .join("、")}
                                        </p>
                                        {requirement.missing_required_property_ids.length > 0 ? (
                                          <p className="muted-text">
                                            尚缺：
                                            {requirement.missing_required_property_ids
                                              .map((item) => labelForPackRequiredProperty(item))
                                              .join("、")}
                                          </p>
                                        ) : (
                                          <p className="muted-text">這組 interface 已可正式被 runtime 依賴。</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
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
                            {pack.pack_type === "domain" ? (
                              <PackListSection
                                title="階段啟發"
                                items={stageHeuristicItems}
                                emptyText="目前沒有整理階段啟發。"
                              />
                            ) : null}
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
                              title="判斷情境"
                              items={pack.default_decision_context_patterns}
                              emptyText="目前沒有整理判斷情境。"
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
                    這裡只收最少必要資訊。你不用先列商業模式、問題型態、指標與證據欄位，系統會用目前啟用的 AI 模型搭配外部搜尋補成正式 pack contract。
                  </p>
                  {editingPackId ? (
                    <p className="muted-text">
                      顯示名稱：
                      {getPackCatalogDisplay(
                        managedPacks.find((pack) => pack.pack_id === editingPackId) ??
                          buildEmptyPackEntry(guidedDraft.pack_type, editingPackId),
                      ).primaryName}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="summary-grid" style={{ marginBottom: "18px" }}>
                <div className="section-card">
                  <h4>現在只需要你提供</h4>
                  <p className="content-block">
                    它屬於問題面向還是產業、它叫什麼、它大致在講什麼，以及可選的補充說明或關鍵詞。
                  </p>
                </div>
                <div className="section-card">
                  <h4>系統會自己推導</h4>
                  <ul className="list-content">
                    <li>問題型態、關鍵指標、證據期待、風險與決策模式</li>
                    <li>deliverable presets、routing hints、scope boundaries 與 pack rationale</li>
                    <li>只要你先把範圍講清楚，其餘 contract 都由 AI + 外部搜尋補完</li>
                  </ul>
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="pack-guided-name">模組包名稱</label>
                  <input
                    id="pack-guided-name"
                    value={guidedDraft.pack_name}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({ ...current, pack_name: event.target.value }))
                    }
                    placeholder="例如：門市零售模組包、商務提案模組包"
                  />
                </div>

                <div className="field">
                  <label htmlFor="pack-guided-type">分類</label>
                  <select
                    id="pack-guided-type"
                    value={guidedDraft.pack_type}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({
                        ...current,
                        pack_type: event.target.value as PackTab,
                      }))
                    }
                  >
                    <option value="domain">問題面向模組包</option>
                    <option value="industry">產業模組包</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="pack-guided-description">一句話說明</label>
                  <textarea
                    id="pack-guided-description"
                    value={guidedDraft.description}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="用一句話說明這個模組包適合處理哪一類案件。"
                  />
                </div>

                <div className="field">
                  <label htmlFor="pack-guided-definition">
                    {guidedDraft.pack_type === "domain" ? "這個問題面向主要在處理什麼" : "這個產業最核心的脈絡是什麼"}
                  </label>
                  <textarea
                    id="pack-guided-definition"
                    value={guidedDraft.definition}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({ ...current, definition: event.target.value }))
                    }
                    placeholder={
                      guidedDraft.pack_type === "domain"
                        ? "例如：用來判斷門市營運、通路效率與現場交付問題。"
                        : "例如：這個產業的商業模式、限制條件與常見指標是什麼。"
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="pack-guided-notes">可選：若你知道特殊場景、限制或關鍵詞，再補充</label>
                  <textarea
                    id="pack-guided-notes"
                    value={guidedDraft.additional_notes}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({
                        ...current,
                        additional_notes: event.target.value,
                      }))
                    }
                    placeholder={"例如：\n這個 pack 比較偏連鎖門市，不要寫成電商 pack\n如果資料薄，請把限制寫保守一點"}
                  />
                </div>

                <div className="button-row">
                  <button
                    className="button-primary"
                    type="button"
                    disabled={guidedSaving}
                    onClick={handleGuidedSave}
                  >
                    {guidedSaving ? "正在用 AI 補完模組包..." : "建立模組包，並讓系統自動補完正式 contract"}
                  </button>
                </div>
                {saveMessage ? (
                  <p className="success-text" role="status" aria-live="polite">
                    {saveMessage}
                  </p>
                ) : null}
              </div>

              {guidedResult ? (
                <section className="summary-grid" style={{ marginTop: "18px" }}>
                  <div className="section-card">
                    <h4>AI 補完摘要</h4>
                    <p className="content-block">{guidedResult.synthesis_summary}</p>
                    <p className="muted-text">搜尋查詢：{guidedResult.search_query}</p>
                  </div>
                  <div className="section-card">
                    <h4>外部來源與生成備註</h4>
                    <ul className="list-content">
                      {guidedResult.sources.map((source) => (
                        <li key={source.url}>
                          <a href={source.url} target="_blank" rel="noreferrer">
                            {source.title}
                          </a>
                        </li>
                      ))}
                      {guidedResult.generation_notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </section>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}
    </main>
  );
}
