"use client";

import { useRouter } from "next/navigation";

import { TaskCreateForm } from "@/components/task-create-form";
import type { TaskAggregate } from "@/lib/types";

export function TaskCreateWorkspace() {
  const router = useRouter();

  function handleCreated(task: TaskAggregate) {
    router.push(`/tasks/${task.id}`);
  }

  return (
    <main className="page-shell page-focus-shell">
      <section className="hero-card">
        <span className="eyebrow">快速開始</span>
        <h1 className="page-title">建立新案件 / 新任務</h1>
        <p className="page-subtitle">
          這裡是獨立的進件工作頁，不再佔據首頁主體。先用一句話定義這次要判斷的問題，再補上必要背景、來源與約束，讓
          Host 以正式工作流接手。
        </p>
      </section>

      <TaskCreateForm onCreated={handleCreated} />
    </main>
  );
}
