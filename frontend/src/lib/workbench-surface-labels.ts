export const SURFACE_LABELS = {
  decisionBrief: "決策摘要",
  firmOperating: "營運狀態",
  phaseFiveClosure: "第五階段收尾",
  generalistGovernance: "全面型顧問治理",
  personalProviderSettings: "個人模型設定",
  firmSettings: "事務所設定",
  providerAllowlist: "可用模型來源清單",
  firmProviderDefault: "預設模型來源",
  demoWorkspace: "示範工作台",
  showcaseHighlights: "重點展示",
  readOnlyBoundary: "唯讀邊界",
  formalWorkspace: "正式工作台",
  demoRules: "示範工作台規則",
} as const;

export function compressSurfaceCopy(copy: string): string {
  const normalized = copy.replace(/\s+/g, " ").trim();
  if (normalized.length <= 48) {
    return normalized;
  }
  return `${normalized.slice(0, 45)}...`;
}
