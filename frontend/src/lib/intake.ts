import type { InputEntryMode } from "@/lib/types";

export const MAX_INTAKE_MATERIAL_UNITS = 10;

export function countIntakeMaterialUnits({
  fileCount,
  urlCount,
  hasPastedText,
}: {
  fileCount: number;
  urlCount: number;
  hasPastedText: boolean;
}) {
  return fileCount + urlCount + (hasPastedText ? 1 : 0);
}

export function inferInputEntryModeFromMaterialUnits(
  materialUnitCount: number,
): InputEntryMode {
  if (materialUnitCount >= 2) {
    return "multi_material_case";
  }
  if (materialUnitCount === 1) {
    return "single_document_intake";
  }
  return "one_line_inquiry";
}
