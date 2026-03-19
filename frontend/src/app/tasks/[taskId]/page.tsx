import { TaskDetailPanel } from "@/components/task-detail-panel";

export default function TaskPage({
  params,
}: {
  params: { taskId: string };
}) {
  return <TaskDetailPanel taskId={params.taskId} />;
}
