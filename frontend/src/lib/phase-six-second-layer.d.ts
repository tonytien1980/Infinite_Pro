import type {
  CalibrationAwareWeightingSignal,
  ConfidenceCalibrationSignal,
  GeneralistGuidancePosture,
  ReuseConfidenceSignal,
} from "@/lib/types";

export function buildPhaseSixSecondLayerSignalNote(args: {
  surfaceKind?: "organization_memory" | "domain_playbook" | "deliverable_template";
  generalistGuidancePosture?: GeneralistGuidancePosture | null;
  reuseConfidenceSignal?: ReuseConfidenceSignal | null;
  confidenceCalibrationSignal?: ConfidenceCalibrationSignal | null;
  calibrationAwareWeightingSignal?: CalibrationAwareWeightingSignal | null;
  lifecyclePrioritySummary?: string;
  emphasisLabel?: string;
}): string;
