import { MatterWorkspacePanel } from "@/components/matter-workspace-panel";

export default async function MatterWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ matterId: string }>;
  searchParams?: Promise<{
    createdTaskId?: string | string[];
    from?: string | string[];
  }>;
}) {
  const { matterId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const createdTaskId = Array.isArray(resolvedSearchParams.createdTaskId)
    ? resolvedSearchParams.createdTaskId[0]
    : resolvedSearchParams.createdTaskId;
  const from = Array.isArray(resolvedSearchParams.from)
    ? resolvedSearchParams.from[0]
    : resolvedSearchParams.from;

  return (
    <MatterWorkspacePanel
      matterId={matterId}
      createdTaskId={createdTaskId ?? null}
      arrivedFromNew={from === "new"}
    />
  );
}
