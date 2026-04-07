import type {
  CalibrationAwareWeightingSignal,
  ConfidenceCalibrationSignal,
  GeneralistGuidancePosture,
  ReuseConfidenceSignal,
} from "@/lib/types";

export function buildPhaseSixSecondLayerSignalNote(args: {
  generalistGuidancePosture?: GeneralistGuidancePosture | null;
  reuseConfidenceSignal?: ReuseConfidenceSignal | null;
  confidenceCalibrationSignal?: ConfidenceCalibrationSignal | null;
  calibrationAwareWeightingSignal?: CalibrationAwareWeightingSignal | null;
  lifecyclePrioritySummary?: string;
}): string;
