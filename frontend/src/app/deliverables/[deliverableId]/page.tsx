import { DeliverableWorkspacePanel } from "@/components/deliverable-workspace-panel";

export default async function DeliverableWorkspacePage({
  params,
}: {
  params: Promise<{ deliverableId: string }>;
}) {
  const { deliverableId } = await params;
  return <DeliverableWorkspacePanel deliverableId={deliverableId} />;
}
