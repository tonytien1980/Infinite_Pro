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
      router.push(`/matters/${task.matter_workspace.id}`);
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
          從一句話問題、單文件進件或多材料案件開始都可以；完成後會直接接回同一個案件工作台，而不是停在孤立任務頁。
        </p>
      </section>

      <TaskCreateForm
        defaultInputMode={settings.newTaskDefaultInputMode}
        onCreated={handleCreated}
      />
    </main>
  );
}
