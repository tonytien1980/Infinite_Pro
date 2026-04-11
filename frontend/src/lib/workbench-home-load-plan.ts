export const WORKBENCH_HOME_PRIMARY_LOAD_KEYS = [
  "tasks",
  "matters",
  "extensions",
] as const;

export const WORKBENCH_HOME_SECONDARY_LOAD_KEYS = [
  "firmOperating",
  "phaseFiveClosure",
  "phaseSixAudit",
  "phaseSixCloseoutReview",
  "phaseSixCompletionReview",
  "phaseSixClosureCriteria",
  "phaseSixMaturity",
  "phaseSixCalibrationWeighting",
  "phaseSixCalibration",
  "phaseSixDistance",
  "phaseSixGovernance",
  "phaseSixGuidance",
] as const;

export type WorkbenchHomeLoadKey =
  | (typeof WORKBENCH_HOME_PRIMARY_LOAD_KEYS)[number]
  | (typeof WORKBENCH_HOME_SECONDARY_LOAD_KEYS)[number];

export function buildWorkbenchHomeLoadPlan() {
  return {
    primary: [...WORKBENCH_HOME_PRIMARY_LOAD_KEYS],
    secondary: [...WORKBENCH_HOME_SECONDARY_LOAD_KEYS],
  };
}

export async function runWorkbenchHomeLoadLane(
  keys: readonly WorkbenchHomeLoadKey[],
  loaders: Partial<Record<WorkbenchHomeLoadKey, () => Promise<unknown>>>,
) {
  await Promise.allSettled(
    keys.map(async (key) => {
      const loader = loaders[key];
      if (!loader) {
        return;
      }
      await loader();
    }),
  );
}
