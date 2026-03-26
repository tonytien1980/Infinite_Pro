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
          從這裡建立新的顧問工作流，完成後會直接接回案件工作台，而不是停在單一任務頁。
        </p>
      </section>

      <TaskCreateForm
        defaultInputMode={settings.newTaskDefaultInputMode}
        onCreated={handleCreated}
      />
    </main>
  );
}
