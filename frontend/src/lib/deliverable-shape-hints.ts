import type { DeliverableShapeGuidance } from "@/lib/types";

function labelForShapePriority(priority: string) {
  if (priority === "high") {
    return "建議先用";
  }
  if (priority === "medium") {
    return "可一起參考";
  }
  return "留作背景校正";
}

export function buildDeliverableShapeHintView(
  guidance: DeliverableShapeGuidance | null | undefined,
): {
  shouldShow: boolean;
  sectionTitle: string;
  summary: string;
  primaryShapeLabel: string;
  cards: Array<{ title: string; summary: string; meta: string }>;
  listTitle: string;
  listItems: string[];
  boundaryNote: string;
} {
  if (!guidance || guidance.status === "none") {
    return {
      shouldShow: false,
      sectionTitle: "",
      summary: "",
      primaryShapeLabel: "",
      cards: [],
      listTitle: "",
      listItems: [],
      boundaryNote: "",
    };
  }

  return {
    shouldShow: true,
    sectionTitle: guidance.label || "這份交付物通常怎麼收比較穩",
    summary: guidance.summary || "Host 已先整理這輪建議交付骨架。",
    primaryShapeLabel: guidance.primary_shape_label,
    cards: guidance.hints.map((hint) => ({
      title: hint.title,
      summary: [hint.why_fit, hint.summary].filter(Boolean).join("｜"),
      meta: [labelForShapePriority(hint.priority), hint.source_label || hint.source_kind]
        .filter(Boolean)
        .join("｜"),
    })),
    listTitle: "建議交付骨架",
    listItems: guidance.section_hints,
    boundaryNote: guidance.boundary_note,
  };
}
