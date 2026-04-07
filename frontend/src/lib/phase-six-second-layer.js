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
  const axis =
    preferred.axis_label === "domain lens"
      ? "領域"
      : preferred.axis_label === "client stage"
        ? "階段"
        : preferred.axis_label === "client type"
          ? "客型"
          : preferred.axis_label;
  const effect =
    preferred.weighting_effect_label === "先留背景校正"
      ? "退背景"
      : preferred.weighting_effect_label === "先保留邊界"
        ? "留邊界"
        : preferred.weighting_effect_label === "可維持擴大重用"
          ? "可放大"
          : preferred.weighting_effect_label;
  return `${axis}${effect}`;
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
  const axis =
    preferred.axis_label === "domain lens"
      ? "領域"
      : preferred.axis_label === "client stage"
        ? "階段"
        : preferred.axis_label === "client type"
          ? "客型"
          : preferred.axis_label;
  const status =
    preferred.calibration_status_label === "仍有不對齊"
      ? "仍不對齊"
      : preferred.calibration_status_label === "需要留意"
        ? "要留意"
        : preferred.calibration_status_label === "目前對齊"
          ? "已對齊"
          : preferred.calibration_status_label;
  return `${axis}${status}`;
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
  const confidence =
    preferred.reuse_confidence_label === "低信心重用"
      ? "重用低信心"
      : preferred.reuse_confidence_label === "有邊界重用"
        ? "重用有邊界"
        : preferred.reuse_confidence_label === "高信心重用"
          ? "重用高信心"
          : preferred.reuse_confidence_label;
  return confidence;
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
