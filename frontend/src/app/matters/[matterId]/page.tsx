import { MatterWorkspacePanel } from "@/components/matter-workspace-panel";

export default async function MatterWorkspacePage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;

  return <MatterWorkspacePanel matterId={matterId} />;
}
