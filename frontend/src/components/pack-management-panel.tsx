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
  version: string;
  status: string;
  common_problem_patterns: string;
  key_kpis: string;
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

function buildDraft(pack?: PackCatalogEntry): PackDraft {
  return {
    pack_name: pack?.pack_name ?? "",
    pack_type: (pack?.pack_type as PackTab) ?? "domain",
    description: pack?.description ?? "",
    version: pack?.version ?? "1.0.0",
    status: pack?.status ?? "active",
    common_problem_patterns: pack?.common_problem_patterns.join("\n") ?? "",
    key_kpis: pack?.key_kpis.join("\n") ?? "",
  };
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
      ...pack.common_problem_patterns,
      ...pack.key_kpis,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
  const packActionTitle =
    editingPackId ? "現在正處於模組包編輯模式" : "先決定是問題面向，還是產業模組包";
  const packActionSummary = editingPackId
    ? "當你已進入編輯模式，這頁的 primary action 就是把分類、狀態與描述整理乾淨後正式儲存。"
    : "這頁不該一開始就落入表單。先確認你要管的是哪一種 pack family，再看現有目錄是否已能滿足需求。";
  const packActionChecklist = [
    `目前共有 ${domainPacks.length} 個問題面向模組包、${industryPacks.length} 個產業模組包。`,
    activeTab === "domain"
      ? "現在正在看問題面向模組包；適合先用它們處理顧問工作類型與企業問題脈絡。"
      : "現在正在看產業模組包；適合先用它們處理產業脈絡、商業模式與共通限制。",
    editingPackId
      ? `正在編輯「${draft.pack_name || editingPackId}」。`
      : "若只是查看現況，先搜尋與切換 tab，不要直接進入新增。",
  ];

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
    const payload: PackCatalogEntry = {
      pack_id: editingPackId ?? createLocalId("local-pack"),
      pack_type: draft.pack_type,
      pack_name: draft.pack_name.trim(),
      description: draft.description.trim(),
      domain_definition: "",
      industry_definition: "",
      common_business_models: [],
      common_problem_patterns: splitLines(draft.common_problem_patterns),
      key_kpis_or_operating_signals: splitLines(draft.key_kpis),
      key_kpis: splitLines(draft.key_kpis),
      deliverable_presets: [],
      version: draft.version.trim() || "1.0.0",
      status: draft.status,
    };

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
      ...pack,
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
        <p className="page-subtitle">管理問題面向模組包與產業模組包的分類、狀態、版本與最近使用情況。</p>
        <div className="workbench-overview-grid" style={{ marginTop: "20px" }}>
          <div className="section-card">
            <h3>問題面向模組包</h3>
            <p className="workbench-metric">{domainPacks.length}</p>
            <p className="muted-text">承接問題面向與顧問工作類型。</p>
          </div>
          <div className="section-card">
            <h3>產業模組包</h3>
            <p className="workbench-metric">{industryPacks.length}</p>
            <p className="muted-text">承接產業脈絡與商業模式差異。</p>
          </div>
          <div className="section-card">
            <h3>啟用中</h3>
            <p className="workbench-metric">
              {managedPacks.filter((pack) => pack.status === "active").length}
            </p>
            <p className="muted-text">目前可被選入工作流的模組包。</p>
          </div>
        </div>
      </section>

      {loading ? <p className="status-text">正在載入模組包管理頁...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !error ? (
        <div className="detail-grid">
          <div className="detail-stack">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">模組包目錄</h2>
                  <p className="panel-copy">維持兩大分類管理，不把不同 pack family 再混回同一個列表。</p>
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
                  onClick={() => setActiveTab("domain")}
                >
                  問題面向模組包
                </button>
                <button
                  className={`page-tab${activeTab === "industry" ? " page-tab-active" : ""}`}
                  type="button"
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
                    placeholder="搜尋名稱、問題模式或 KPI"
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

              <div className="history-list" style={{ marginTop: "18px" }}>
                {visiblePacks.length > 0 ? (
                  visiblePacks.map((pack) => (
                    (() => {
                      const display = getPackCatalogDisplay(pack);
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
                            <p className="muted-text">
                              {display.secondaryName}｜{pack.pack_id}
                            </p>
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
                            關鍵模式：
                            {pack.common_problem_patterns.length > 0
                              ? pack.common_problem_patterns.slice(0, 2).join("、")
                              : "目前未標示"}
                          </p>
                          <details className="inline-disclosure">
                            <summary className="inline-disclosure-summary">查看細節與 KPI</summary>
                            <div className="expandable-copy">
                              <p className="content-block">
                                {pack.description || "目前沒有額外說明。"}
                              </p>
                              <p className="muted-text">
                                KPI：
                                {pack.key_kpis.length > 0
                                  ? pack.key_kpis.slice(0, 4).join("、")
                                  : "目前未標示"}
                              </p>
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
                    })()
                  ))
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
                  <p className="panel-copy">分類、版本與常改欄位會優先寫入正式 persistence；只有後端暫時不可用時才退回本機 fallback。</p>
                  {editingPackId ? (
                    <p className="muted-text">
                      顯示名稱：
                      {getPackCatalogDisplay(
                        managedPacks.find((pack) => pack.pack_id === editingPackId) ?? {
                          pack_id: editingPackId ?? "",
                          pack_name: draft.pack_name,
                          description: draft.description,
                        },
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
                  <label htmlFor="pack-patterns">常見問題模式</label>
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
                  <label htmlFor="pack-kpis">關鍵 KPI</label>
                  <textarea
                    id="pack-kpis"
                    value={draft.key_kpis}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, key_kpis: event.target.value }))
                    }
                    placeholder={"每行一個 KPI，例如：\nactivation rate\nconversion rate"}
                  />
                </div>

                <div className="button-row">
                  <button className="button-primary" type="button" onClick={handleSave}>
                    儲存模組包
                  </button>
                </div>
                {saveMessage ? <p className="success-text">{saveMessage}</p> : null}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </main>
  );
}
