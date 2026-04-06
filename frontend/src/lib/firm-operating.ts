import type { FirmOperatingSignal } from "@/lib/types";

export function labelForFirmOperatingPosture(
  posture: "steady" | "attention_needed",
) {
  return posture === "steady" ? "目前運作穩定" : "有幾個地方值得先處理";
}

export function summarizeFirmOperatingSignals(signals: FirmOperatingSignal[]) {
  if (signals.length === 0) {
    return "目前還沒有可讀取的 firm operating signal。";
  }
  return signals
    .slice(0, 3)
    .map((signal) => `${signal.label}：${signal.value}`)
    .join("｜");
}

export function countAttentionSignals(signals: FirmOperatingSignal[]) {
  return signals.filter((signal) => signal.status === "attention").length;
}
