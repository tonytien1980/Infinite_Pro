export const FIRST_LAYER_AVOID_TERMS = [
  "寫回",
  "治理",
  "工作面",
  "脈絡",
  "continuity",
  "decision brief",
  "canonical",
  "authority",
  "provenance",
  "work slice",
  "progression",
] as const;

const FIRST_LAYER_REPLACEMENTS: ReadonlyArray<readonly [string, string]> = [
  ["決策工作面", "分析工作台"],
  ["先補來源與證據", "先補資料"],
  ["交付物工作面", "結果與報告"],
  ["工作面", "頁面"],
  ["寫回", "同步回案件"],
  ["治理", "系統檢查"],
  ["脈絡", "背景資訊"],
];

export function shouldAvoidInFirstLayer(value: string) {
  const normalized = value.toLowerCase();
  return FIRST_LAYER_AVOID_TERMS.some((term) => normalized.includes(term.toLowerCase()));
}

export function replaceFirstLayerTerm(value: string) {
  for (const [term, replacement] of FIRST_LAYER_REPLACEMENTS) {
    if (value === term) {
      return replacement;
    }
  }

  return value;
}
