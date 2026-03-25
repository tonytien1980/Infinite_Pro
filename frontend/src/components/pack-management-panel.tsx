"use client";

import { useEffect, useMemo, useState } from "react";

import { getExtensionManager, listTasks } from "@/lib/api";
import type { ExtensionManagerSnapshot, TaskListItem } from "@/lib/types";
import {
  labelForExtensionStatus,
  labelForPackType,
} from "@/lib/ui-labels";

type PackTab = "domain" | "industry";

function summarizePackUsage(tasks: TaskListItem[]) {
  const usage = new Map<string, { name: string; count: number }>();

  tasks.forEach((task) => {
    task.selected_pack_ids.forEach((packId, index) => {
      const name = task.selected_pack_names[index] ?? packId;
      const entry = usage.get(packId) ?? { name, count: 0 };
      entry.count += 1;
      usage.set(packId, entry);
    });
  });

  return Array.from(usage.entries())
    .map(([packId, value]) => ({ packId, ...value }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export function PackManagementPanel() {
  const [snapshot, setSnapshot] = useState<ExtensionManagerSnapshot | null>(null);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [activeTab, setActiveTab] = useState<PackTab>("domain");
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

  const packs = snapshot?.pack_registry.packs ?? [];
  const domainPacks = packs.filter((pack) => pack.pack_type === "domain");
  const industryPacks = packs.filter((pack) => pack.pack_type === "industry");
  const visiblePacks = activeTab === "domain" ? domainPacks : industryPacks;
  const usage = useMemo(() => summarizePackUsage(tasks), [tasks]);

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">模組包管理</span>
        <h1 className="page-title">模組包要被正式管理，而不是混在工作面角落裡。</h1>
        <p className="page-subtitle">
          這裡集中回看問題面向模組包與產業模組包，確認它們的狀態、版本、用途與目前在案件中的使用情況。
        </p>
        <div className="workbench-overview-grid" style={{ marginTop: "20px" }}>
          <div className="section-card">
            <h3>問題面向模組包</h3>
            <p className="workbench-metric">{domainPacks.length}</p>
            <p className="muted-text">承接顧問職能面向與企業問題類型。</p>
          </div>
          <div className="section-card">
            <h3>產業模組包</h3>
            <p className="workbench-metric">{industryPacks.length}</p>
            <p className="muted-text">承接產業脈絡、商業模式與決策差異。</p>
          </div>
          <div className="section-card">
            <h3>正式基本盤</h3>
            <p className="workbench-metric">{packs.length}</p>
            <p className="muted-text">單人版目前可用的正式模組包總數。</p>
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
                  <p className="panel-copy">正式分成問題面向模組包與產業模組包，避免兩種 pack family 混在同一個列表裡。</p>
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

              <div className="detail-list" style={{ marginTop: "18px" }}>
                {visiblePacks.map((pack) => (
                  <div className="detail-item" key={pack.pack_id}>
                    <div className="meta-row">
                      <span className="pill">{labelForPackType(pack.pack_type)}</span>
                      <span>{labelForExtensionStatus(pack.status)}</span>
                      <span>v{pack.version}</span>
                    </div>
                    <h3>{pack.pack_name}</h3>
                    <p className="content-block">{pack.description}</p>
                    {pack.pack_type === "domain" ? (
                      <>
                        <p className="muted-text">
                          常見問題型態：
                          {pack.common_problem_patterns.length > 0
                            ? pack.common_problem_patterns.slice(0, 4).join("、")
                            : "目前未標示"}
                        </p>
                        <p className="muted-text">
                          關鍵訊號：
                          {pack.key_kpis_or_operating_signals.length > 0
                            ? pack.key_kpis_or_operating_signals.slice(0, 4).join("、")
                            : "目前未標示"}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="muted-text">
                          常見商業模式：
                          {pack.common_business_models.length > 0
                            ? pack.common_business_models.slice(0, 4).join("、")
                            : "目前未標示"}
                        </p>
                        <p className="muted-text">
                          關鍵 KPI：
                          {pack.key_kpis.length > 0 ? pack.key_kpis.slice(0, 4).join("、") : "目前未標示"}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="detail-stack">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">最近常用模組包</h2>
                  <p className="panel-copy">依目前任務選用情況回看最近最常參與工作流的模組包。</p>
                </div>
              </div>
              <div className="detail-list">
                {usage.length > 0 ? (
                  usage.map((item) => (
                    <div className="detail-item" key={item.packId}>
                      <div className="meta-row">
                        <span className="pill">近期使用</span>
                        <span>{item.count} 次</span>
                      </div>
                      <h3>{item.name}</h3>
                      <p className="muted-text">{item.packId}</p>
                    </div>
                  ))
                ) : (
                  <p className="empty-text">目前還沒有足夠的模組包使用紀錄。</p>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">管理面邊界</h2>
                  <p className="panel-copy">這一頁先站穩單人版正式管理面，不提前做模組包市集或多人治理控制頁。</p>
                </div>
              </div>
              <div className="detail-item">
                <ul className="list-content">
                  <li>問題面向模組包與產業模組包必須分欄治理，不能混成單一 taxonomy。</li>
                  <li>任務層覆寫仍保留在單一工作紀錄的擴充管理面。</li>
                  <li>多人審核、發布與組織級權限屬於後續系統層。</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </main>
  );
}
