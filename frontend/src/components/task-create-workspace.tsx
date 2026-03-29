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
    <main className="page-shell page-focus-shell">
      <section className="hero-card">
        <span className="eyebrow">建立新案件</span>
        <h1 className="page-title">建立新案件</h1>
        <p className="page-subtitle">
          這裡現在只有一個統一進件入口。你只要先說清楚想釐清的問題，再視需要補檔案、網址或補充文字；系統會自動判讀這次是 sparse inquiry、單材料起手，還是 multi-source case。
        </p>
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
