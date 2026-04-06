import type {
  CurrentProviderConfig,
  MembershipRole,
  PersonalProviderSettingsSnapshot,
  ProviderAllowlistEntry,
  ProviderId,
  ProviderModelLevel,
  ProviderPreset,
  ProviderValidationResult,
  SystemProviderSettingsSnapshot,
} from "@/lib/types";

export type ProviderDraft = {
  providerId: ProviderId;
  modelLevel: ProviderModelLevel;
  modelId: string;
  customModelId: string;
  baseUrl: string;
  timeoutSeconds: number;
  apiKey: string;
};

export function getSettingsProviderVisibility(role: MembershipRole) {
  return {
    showFirmSettings: role === "owner",
    showPersonalSettings: role === "owner" || role === "consultant",
  };
}

export function labelForProviderValidationStatus(status: ProviderValidationResult["validationStatus"]) {
  switch (status) {
    case "success":
      return "驗證成功";
    case "invalid_api_key":
      return "API key 無效";
    case "base_url_unreachable":
      return "基礎網址無法連線";
    case "model_unavailable":
      return "模型不可用";
    case "timeout":
      return "請求逾時";
    case "unknown_error":
      return "未知錯誤";
    default:
      return "未驗證";
  }
}

export function labelForProviderSource(config: CurrentProviderConfig | null) {
  if (!config) {
    return "載入中";
  }
  if (config.source === "personal_config") {
    return "個人模型設定";
  }
  return config.source === "runtime_config" ? "正式執行設定" : "環境基線";
}

export function labelForProviderRuntimeSupport(preset: ProviderPreset | null) {
  if (!preset) {
    return "未指定";
  }
  if (preset.runtimeSupportLevel === "verified") {
    return "正式可用";
  }
  if (preset.adapterKind === "anthropic_native" || preset.adapterKind === "gemini_native") {
    return "測試中原生路徑";
  }
  return "測試中相容路徑";
}

export function buildProviderDraftFromCurrent(
  snapshot: Pick<SystemProviderSettingsSnapshot, "presets" | "current"> | Pick<PersonalProviderSettingsSnapshot, "presets" | "current"> | null,
) {
  const fallbackPreset = snapshot?.presets[0];
  const current = snapshot?.current;
  const currentPreset = snapshot?.presets.find((item) => item.providerId === current?.providerId);
  const preset = currentPreset || fallbackPreset;
  const providerId = (currentPreset?.providerId || fallbackPreset?.providerId || "openai") as ProviderId;
  const modelLevel = current?.modelLevel || "balanced";

  return {
    providerId,
    modelLevel,
    modelId: current?.actualModelId || preset?.recommendedModels[modelLevel] || "",
    customModelId: current?.customModelId || "",
    baseUrl: current?.baseUrl || preset?.defaultBaseUrl || "",
    timeoutSeconds: current?.timeoutSeconds || preset?.defaultTimeoutSeconds || 60,
    apiKey: "",
  } satisfies ProviderDraft;
}

export function resolveEffectiveDraftModelId(
  draft: ProviderDraft,
  presets: ProviderPreset[],
) {
  const customModelId = draft.customModelId.trim();
  if (customModelId) {
    return customModelId;
  }
  if (draft.modelId.trim()) {
    return draft.modelId.trim();
  }
  return presets.find((item) => item.providerId === draft.providerId)?.recommendedModels[draft.modelLevel] || "";
}

export function canReuseProviderKey(
  current: CurrentProviderConfig | null,
  providerId: ProviderId,
) {
  return Boolean(current?.apiKeyConfigured && current.providerId === providerId);
}

export function summarizeAllowlistEntry(entry: ProviderAllowlistEntry) {
  if (entry.allowedModelIds.length > 0) {
    return `${entry.allowedModelIds.join("、")}${entry.allowCustomModel ? "，也可自訂模型" : ""}`;
  }
  if (entry.allowCustomModel) {
    return "目前允許自訂模型。";
  }
  return "目前沒有額外模型限制。";
}
