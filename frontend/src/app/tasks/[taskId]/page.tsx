import { TaskDetailPanel } from "@/components/task-detail-panel";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;

  return <TaskDetailPanel taskId={taskId} />;
}
