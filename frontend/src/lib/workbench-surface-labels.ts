import { replaceFirstLayerTerm } from "./product-language.ts";

export const SURFACE_LABELS = {
  decisionBrief: "判斷摘要",
  firmOperating: "系統狀態",
  phaseFiveClosure: "階段收尾",
  generalistGovernance: "整體使用狀態",
  personalProviderSettings: "個人模型設定",
  firmSettings: "事務所設定",
  providerAllowlist: "可用模型來源",
  firmProviderDefault: "預設模型來源",
  demoWorkspace: "示範工作台",
  showcaseHighlights: "重點展示",
  readOnlyBoundary: "唯讀範圍",
  formalWorkspace: "正式工作台",
  demoRules: "示範規則",
} as const;

export function compressSurfaceCopy(copy: string): string {
  const normalized = replaceFirstLayerTerm(copy.replace(/\s+/g, " ").trim());
  if (normalized.length <= 48) {
    return normalized;
  }
  return `${normalized.slice(0, 45)}...`;
}
