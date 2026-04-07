function resolveWeightingSegment(signal) {
  if (!signal?.weighting_items?.length) {
    return "";
  }
  const preferred =
    signal.weighting_items.find((item) => item.weighting_effect === "background_only") ||
    signal.weighting_items.find((item) => item.weighting_effect === "keep_contextual") ||
    signal.weighting_items[0];
  if (!preferred?.axis_label || !preferred?.weighting_effect_label) {
    return "";
  }
  return `${preferred.axis_label}：${preferred.weighting_effect_label}`;
}

function resolveCalibrationSegment(signal) {
  if (!signal?.calibration_items?.length) {
    return "";
  }
  const preferred =
    signal.calibration_items.find((item) => item.calibration_status === "mismatch") ||
    signal.calibration_items.find((item) => item.calibration_status === "caution") ||
    signal.calibration_items[0];
  if (!preferred?.axis_label || !preferred?.calibration_status_label) {
    return "";
  }
  return `${preferred.axis_label}：${preferred.calibration_status_label}`;
}

function resolveReuseConfidenceSegment(signal) {
  if (!signal?.distance_items?.length) {
    return "";
  }
  const preferred =
    signal.distance_items.find((item) => item.reuse_confidence === "low_confidence") ||
    signal.distance_items.find((item) => item.reuse_confidence === "bounded_confidence") ||
    signal.distance_items[0];
  if (!preferred?.asset_label || !preferred?.reuse_confidence_label) {
    return "";
  }
  return `${preferred.asset_label}：${preferred.reuse_confidence_label}`;
}

function normalizeEmphasisLabel(label) {
  if (!label) {
    return "";
  }
  if (/客戶|組織背景/.test(label)) {
    return "校正客戶背景";
  }
  if (/工作主線/.test(label)) {
    return "校正工作主線";
  }
  if (/交付骨架|模板/.test(label)) {
    return "校正交付骨架";
  }
  return label.replace(/^先/, "").replace(/\s*\/\s*/g, "");
}

export function buildPhaseSixSecondLayerSignalNote(args) {
  const segments = [];

  if (args.generalistGuidancePosture?.guidance_posture_label) {
    segments.push(args.generalistGuidancePosture.guidance_posture_label);
  }

  const normalizedLifecyclePrioritySummary = normalizeLifecyclePrioritySummary(
    args.surfaceKind,
    args.lifecyclePrioritySummary,
  );

  if (normalizedLifecyclePrioritySummary) {
    segments.push(normalizedLifecyclePrioritySummary);
  }

  const actionableSegment =
    normalizedLifecyclePrioritySummary
      ? ""
      : resolveWeightingSegment(args.calibrationAwareWeightingSignal) ||
        resolveCalibrationSegment(args.confidenceCalibrationSignal) ||
        resolveReuseConfidenceSegment(args.reuseConfidenceSignal);

  if (actionableSegment) {
    segments.push(actionableSegment);
  }

  const normalizedEmphasisLabel = normalizeEmphasisLabel(args.emphasisLabel);
  if (normalizedEmphasisLabel) {
    segments.push(normalizedEmphasisLabel);
  }

  if (segments.length === 0) {
    return "";
  }

  return `Phase 6：${segments.join("｜")}`;
}
function normalizeLifecyclePrioritySummary(surfaceKind, summary) {
  if (!summary) {
    return "";
  }

  if (/重新拉回前景|重新讓.*站前面/.test(summary)) {
    if (surfaceKind === "organization_memory") {
      return "背景回前景";
    }
    if (surfaceKind === "deliverable_template") {
      return "骨架回前景";
    }
    return "主線回前景";
  }

  if (/需要改寫|退到背景觀察|留背景校正/.test(summary)) {
    return "需退背景";
  }

  if (/偏舊/.test(summary)) {
    return "來源偏舊";
  }

  if (/恢復/.test(summary)) {
    return "仍在恢復";
  }

  return summary;
}
