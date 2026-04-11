"use client";

import { useRouter } from "next/navigation";

import { TaskCreateForm } from "@/components/task-create-form";
import type { TaskAggregate } from "@/lib/types";

export function TaskCreateWorkspace() {
  const router = useRouter();

  function handleCreated(task: TaskAggregate) {
    if (task.matter_workspace?.id) {
      const searchParams = new URLSearchParams({
        createdTaskId: task.id,
        from: "new",
      });
      router.push(`/matters/${task.matter_workspace.id}?${searchParams.toString()}`);
      return;
    }

    router.push(`/tasks/${task.id}`);
  }

  return (
    <main className="page-shell page-focus-shell task-create-shell">
      <section className="hero-card intake-hero">
        <div className="hero-layout">
          <div className="hero-main">
            <span className="eyebrow">建立新案件</span>
            <h1 className="page-title">建立新案件</h1>
            <p className="page-subtitle">
              這裡只保留一個統一進件入口。你先說清楚想釐清的問題，再視需要補檔案、網址或補充文字；系統會自動判讀這次是少資訊起手、單材料起手，還是多來源案件。
            </p>
          </div>

          <div className="hero-aside">
            <div className="hero-focus-card">
              <p className="hero-focus-label">這頁先做什麼</p>
              <h3 className="hero-focus-title">先把這次要判斷的核心問題說清楚</h3>
              <p className="hero-focus-copy">
                不需要先決定流程、能力或技術欄位。先把問題講清楚，材料不足也沒關係，建立後仍可回案件頁繼續補。
              </p>
            </div>
            <div className="hero-focus-card hero-focus-card-warm">
              <p className="hero-focus-label">建立後會怎麼走</p>
              <ul className="hero-focus-list">
                <li>先回到同一個案件世界，看主線、狀態和下一步。</li>
                <li>需要補資料時，再從案件頁或來源頁分批補進來。</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="hero-metrics-grid">
          <div className="section-card hero-metric-card">
            <h3>單一入口</h3>
            <p className="workbench-metric">1</p>
            <p className="muted-text">不拆成不同模式，全部都走同一條正式進件主線。</p>
          </div>
          <div className="section-card hero-metric-card">
            <h3>單次材料上限</h3>
            <p className="workbench-metric">10</p>
            <p className="muted-text">可一次帶進多份材料，後續也能繼續補件。</p>
          </div>
          <div className="section-card hero-metric-card">
            <h3>建立後主頁</h3>
            <p className="workbench-metric">案件頁</p>
            <p className="muted-text">建立完成後不會卡在進件頁，而是直接回主工作面繼續推進。</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">建立後會怎麼產出結果</h2>
            <p className="panel-copy">
              建立案件只是在正式工作鏈上掛好骨架。接下來的主流程會固定回到案件工作台，讓你知道現在該補資料、跑分析，還是直接打開交付物。
            </p>
          </div>
        </div>

        <div className="summary-grid">
          <div className="section-card">
            <h4>1. 確認案件主線</h4>
            <p className="content-block">
              建立完成後會先回到同一個案件世界，直接看到目前主線、決策問題、世界狀態與下一步建議。
            </p>
          </div>
          <div className="section-card">
            <h4>2. 材料可一次帶進，也可後續分批補</h4>
            <p className="content-block">
              同一個材料區可接收檔案、URL 與補充文字；單次最多 10 份，但同一案件後續仍可分批補件。
            </p>
          </div>
          <div className="section-card">
            <h4>3. 形成正式交付物</h4>
            <p className="content-block">
              案件工作台會提供清楚的「執行分析」入口；完成後會直接打開正式交付物工作面。
            </p>
          </div>
        </div>
      </section>

      <TaskCreateForm onCreated={handleCreated} />
    </main>
  );
}
