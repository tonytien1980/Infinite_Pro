"use client";

import { useRouter } from "next/navigation";

import { TaskCreateForm } from "@/components/task-create-form";
import type { TaskAggregate } from "@/lib/types";
import { useWorkbenchSettings } from "@/lib/workbench-store";

export function TaskCreateWorkspace() {
  const router = useRouter();
  const [settings] = useWorkbenchSettings();

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
          從一句話問題、單文件進件或多材料案件開始都可以；它們都只是進入同一條案件主鏈的 entry preset，完成後會直接接回案件工作台，而不是停在孤立任務頁。
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
              建立完成後會先回到同一個案件世界，直接看到目前主線、決策問題與下一步建議。
            </p>
          </div>
          <div className="section-card">
            <h4>2. 補件或直接先跑</h4>
            <p className="content-block">
              如果你手上已有檔案、網址或會議摘要，就先補到來源與證據；如果沒有，也可以先產出第一版骨架。
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

      <TaskCreateForm
        defaultInputMode={settings.newTaskDefaultInputMode}
        onCreated={handleCreated}
      />
    </main>
  );
}
