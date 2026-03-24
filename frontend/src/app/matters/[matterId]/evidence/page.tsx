import { ArtifactEvidenceWorkspacePanel } from "@/components/artifact-evidence-workspace-panel";

export default async function ArtifactEvidenceWorkspacePage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;

  return <ArtifactEvidenceWorkspacePanel matterId={matterId} />;
}
