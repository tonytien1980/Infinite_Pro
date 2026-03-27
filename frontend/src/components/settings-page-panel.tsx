"use client";

import { useEffect, useState } from "react";

import {
  getSystemProviderSettings,
  resetSystemProviderSettingsToEnv,
  revalidateSystemProviderSettings,
  updateSystemProviderSettings,
  validateSystemProviderSettings,
} from "@/lib/api";
import { formatDisplayDate } from "@/lib/ui-labels";
import { buildWorkbenchPreferenceFeedback, persistWorkbenchPreferences } from "@/lib/workbench-persistence";
import type {
  CurrentProviderConfig,
  ProviderId,
  ProviderModelLevel,
  ProviderValidationResult,
  SystemProviderSettingsSnapshot,
} from "@/lib/types";
import {
  DEFAULT_WORKBENCH_SETTINGS,
  type WorkbenchSettings,
  useWorkbenchSettings,
} from "@/lib/workbench-store";

const HISTORY_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];
const MODEL_LEVEL_OPTIONS: Array<{
  value: ProviderModelLevel;
  label: string;
  description: string;
}> = [
  { value: "high_quality", label: "高品質", description: "優先品質與完整度。" },
  { value: "balanced", label: "平衡", description: "兼顧品質、速度與成本。" },
  { value: "low_cost", label: "低成本", description: "優先壓低成本與延遲。" },
];

type ProviderDraft = {
  providerId: ProviderId;
  modelLevel: ProviderModelLevel;
  modelId: string;
  customModelId: string;
  baseUrl: string;
  timeoutSeconds: number;
  apiKey: string;
};

function normalizeError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

function labelForProviderValidationStatus(status: ProviderValidationResult["validationStatus"]) {
  switch (status) {
    case "success":
      return "驗證成功";
    case "invalid_api_key":
      return "API key 無效";
    case "base_url_unreachable":
      return "Base URL 無法連線";
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

function labelForProviderSource(config: CurrentProviderConfig | null) {
  if (!config) {
    return "載入中";
  }
  return config.source === "runtime_config" ? "正式 runtime config" : "env baseline";
}

function labelForProviderRuntimeSupport(
  preset: SystemProviderSettingsSnapshot["presets"][number] | null,
) {
  if (!preset) {
    return "未指定";
  }
  if (preset.runtimeSupportLevel === "verified") {
    return "正式可用";
  }
  if (preset.adapterKind === "anthropic_native" || preset.adapterKind === "gemini_native") {
    return "beta 原生路徑";
  }
  return "beta 相容路徑";
}

function buildProviderDraft(
  snapshot: SystemProviderSettingsSnapshot | null,
): ProviderDraft {
  const fallbackPreset = snapshot?.presets[0];
  const current = snapshot?.current;
  const currentPreset = snapshot?.presets.find((item) => item.providerId === current?.providerId);

  const preset = currentPreset || fallbackPreset;
  const providerId = (currentPreset?.providerId || fallbackPreset?.providerId || "openai") as ProviderId;
  const modelLevel = currentPreset
    ? current?.modelLevel || "balanced"
    : "balanced";

  return {
    providerId,
    modelLevel,
    modelId:
      currentPreset && current
        ? current.actualModelId
        : preset?.recommendedModels[modelLevel] || "",
    customModelId:
      currentPreset && current?.customModelId
        ? current.customModelId
        : "",
    baseUrl:
      currentPreset && current
        ? current.baseUrl
        : preset?.defaultBaseUrl || "",
    timeoutSeconds:
      currentPreset && current
        ? current.timeoutSeconds
        : preset?.defaultTimeoutSeconds || 60,
    apiKey: "",
  };
}

export function SettingsPagePanel() {
  const [settings, setSettings] = useWorkbenchSettings();
  const [draft, setDraft] = useState<WorkbenchSettings>(settings);
  const [success, setSuccess] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState<"remote" | "local-fallback" | null>(null);

  const [providerSnapshot, setProviderSnapshot] = useState<SystemProviderSettingsSnapshot | null>(null);
  const [providerDraft, setProviderDraft] = useState<ProviderDraft>(() => buildProviderDraft(null));
  const [providerValidation, setProviderValidation] = useState<ProviderValidationResult | null>(null);
  const [providerFeedback, setProviderFeedback] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [providerLoading, setProviderLoading] = useState(true);
  const [providerSaving, setProviderSaving] = useState(false);
  const [providerTesting, setProviderTesting] = useState(false);
  const [providerRevalidating, setProviderRevalidating] = useState(false);
  const [providerResetting, setProviderResetting] = useState(false);
  const [providerEditing, setProviderEditing] = useState(false);
  const [showAdvancedProviderFields, setShowAdvancedProviderFields] = useState(false);
  const [showValidationDetail, setShowValidationDetail] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateProviderSettings() {
      setProviderLoading(true);
      try {
        const snapshot = await getSystemProviderSettings();
        if (cancelled) {
          return;
        }
        setProviderSnapshot(snapshot);
        setProviderDraft(buildProviderDraft(snapshot));
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setProviderError(normalizeError(loadError, "目前無法載入正式模型與服務設定。"));
      } finally {
        if (!cancelled) {
          setProviderLoading(false);
        }
      }
    }

    void hydrateProviderSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateDraft<K extends keyof WorkbenchSettings>(
    key: K,
    value: WorkbenchSettings[K],
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
    setSuccess(null);
  }

  function updateProviderDraft<K extends keyof ProviderDraft>(
    key: K,
    value: ProviderDraft[K],
  ) {
    setProviderDraft((current) => ({
      ...current,
      [key]: value,
    }));
    setProviderFeedback(null);
    setProviderError(null);
    if (key !== "apiKey") {
      setProviderValidation(null);
    }
  }

  function resetProviderDraftToCurrent() {
    setProviderDraft(buildProviderDraft(providerSnapshot));
    setProviderValidation(null);
    setProviderFeedback("已還原成目前生效設定。");
    setProviderError(null);
  }

  function getProviderPreset(providerId: ProviderId) {
    return providerSnapshot?.presets.find((item) => item.providerId === providerId) ?? null;
  }

  function getEffectiveDraftModelId() {
    const customModelId = providerDraft.customModelId.trim();
    if (customModelId) {
      return customModelId;
    }

    if (providerDraft.modelId.trim()) {
      return providerDraft.modelId.trim();
    }

    return getProviderPreset(providerDraft.providerId)?.recommendedModels[providerDraft.modelLevel] || "";
  }

  function canReuseExistingKey() {
    return Boolean(
      providerSnapshot?.current.apiKeyConfigured &&
        providerSnapshot.current.providerId === providerDraft.providerId,
    );
  }

  function handleProviderChange(nextProviderId: ProviderId) {
    const preset = getProviderPreset(nextProviderId);
    if (!preset) {
      updateProviderDraft("providerId", nextProviderId);
      return;
    }

    setProviderDraft({
      providerId: nextProviderId,
      modelLevel: "balanced",
      modelId: preset.recommendedModels.balanced,
      customModelId: "",
      baseUrl: preset.defaultBaseUrl,
      timeoutSeconds: preset.defaultTimeoutSeconds,
      apiKey: "",
    });
    setProviderValidation(null);
    setProviderFeedback(`已帶入 ${preset.displayName} 的預設 Base URL、模型與 timeout。`);
    setProviderError(null);
  }

  function handleProviderModelLevelChange(nextLevel: ProviderModelLevel) {
    const preset = getProviderPreset(providerDraft.providerId);
    setProviderDraft((current) => ({
      ...current,
      modelLevel: nextLevel,
      modelId:
        current.customModelId.trim() || !preset
          ? current.modelId
          : preset.recommendedModels[nextLevel],
    }));
    setProviderValidation(null);
    setProviderFeedback(null);
  }

  async function handleSave() {
    try {
      const result = await persistWorkbenchPreferences(draft);
      setSettings(result.settings);
      setSaveMode(result.source);
      setSuccess(buildWorkbenchPreferenceFeedback(result.source));
    } catch (saveError) {
      setSaveMode(null);
      setSuccess(saveError instanceof Error ? saveError.message : "保存設定失敗。");
    }
  }

  async function handleReset() {
    setDraft(DEFAULT_WORKBENCH_SETTINGS);
    try {
      const result = await persistWorkbenchPreferences(DEFAULT_WORKBENCH_SETTINGS);
      setSettings(result.settings);
      setSaveMode(result.source);
      setSuccess(
        result.source === "remote" ? "已恢復預設設定，並同步寫入正式工作台偏好。" : "已恢復預設設定，並先保存到目前瀏覽器。",
      );
    } catch (saveError) {
      setSaveMode(null);
      setSuccess(saveError instanceof Error ? saveError.message : "恢復預設設定失敗。");
    }
  }

  async function handleProviderTest() {
    setProviderTesting(true);
    setProviderFeedback(null);
    setProviderError(null);
    setShowValidationDetail(false);
    try {
      const result = await validateSystemProviderSettings({
        providerId: providerDraft.providerId,
        modelLevel: providerDraft.modelLevel,
        modelId: providerDraft.modelId.trim() || getEffectiveDraftModelId(),
        customModelId: providerDraft.customModelId.trim(),
        baseUrl: providerDraft.baseUrl.trim(),
        timeoutSeconds: providerDraft.timeoutSeconds,
        apiKey: providerDraft.apiKey,
        keepExistingKey: providerDraft.apiKey.trim() === "" && canReuseExistingKey(),
      });
      setProviderValidation(result);
      setProviderFeedback(result.message);
    } catch (testError) {
      setProviderValidation(null);
      setProviderError(normalizeError(testError, "模型與服務設定驗證失敗。"));
    } finally {
      setProviderTesting(false);
    }
  }

  async function handleProviderSave(forceSaveWithoutValidation = false) {
    if (
      forceSaveWithoutValidation &&
      typeof window !== "undefined" &&
      !window.confirm("這次會在未先通過驗證的情況下直接套用正式設定。你確定要繼續嗎？")
    ) {
      return;
    }

    setProviderSaving(true);
    setProviderFeedback(null);
    setProviderError(null);
    try {
      const snapshot = await updateSystemProviderSettings({
        providerId: providerDraft.providerId,
        modelLevel: providerDraft.modelLevel,
        modelId: providerDraft.modelId.trim() || getEffectiveDraftModelId(),
        customModelId: providerDraft.customModelId.trim(),
        baseUrl: providerDraft.baseUrl.trim(),
        timeoutSeconds: providerDraft.timeoutSeconds,
        apiKey: providerDraft.apiKey,
        keepExistingKey: providerDraft.apiKey.trim() === "" && canReuseExistingKey(),
        validateBeforeSave: !forceSaveWithoutValidation,
        forceSaveWithoutValidation: forceSaveWithoutValidation,
      });
      setProviderSnapshot(snapshot);
      setProviderDraft(buildProviderDraft(snapshot));
      setProviderValidation(null);
      setProviderEditing(false);
      setProviderFeedback(
        forceSaveWithoutValidation
          ? "已強制儲存正式 runtime config。請盡快重新驗證目前設定。"
          : "模型與服務設定已通過驗證並正式套用。",
      );
    } catch (saveError) {
      setProviderError(normalizeError(saveError, "正式 provider 設定保存失敗。"));
    } finally {
      setProviderSaving(false);
    }
  }

  async function handleProviderRevalidate() {
    setProviderRevalidating(true);
    setProviderFeedback(null);
    setProviderError(null);
    try {
      const snapshot = await revalidateSystemProviderSettings();
      setProviderSnapshot(snapshot);
      setProviderDraft(buildProviderDraft(snapshot));
      setProviderFeedback("已重新驗證目前正式 runtime config。");
    } catch (revalidateError) {
      setProviderError(normalizeError(revalidateError, "重新驗證目前設定失敗。"));
    } finally {
      setProviderRevalidating(false);
    }
  }

  async function handleProviderResetToEnv() {
    if (
      typeof window !== "undefined" &&
      !window.confirm("這會移除目前正式 runtime config，並回退到 env baseline。要繼續嗎？")
    ) {
      return;
    }

    setProviderResetting(true);
    setProviderFeedback(null);
    setProviderError(null);
    try {
      const snapshot = await resetSystemProviderSettingsToEnv();
      setProviderSnapshot(snapshot);
      setProviderDraft(buildProviderDraft(snapshot));
      setProviderValidation(null);
      setProviderEditing(false);
      setProviderFeedback("已回退到 env baseline。若要重新建立正式設定，請再次編輯並套用。");
    } catch (resetError) {
      setProviderError(normalizeError(resetError, "回復 env baseline 失敗。"));
    } finally {
      setProviderResetting(false);
    }
  }

  const currentProvider = providerSnapshot?.current ?? null;
  const envBaseline = providerSnapshot?.envBaseline ?? null;
  const effectiveModelId = getEffectiveDraftModelId();
  const latestValidationStatus =
    providerValidation?.validationStatus || currentProvider?.lastValidationStatus || "not_validated";
  const latestValidationMessage =
    providerValidation?.message || currentProvider?.lastValidationMessage || "目前尚未驗證正式設定。";

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">系統設定</span>
        <h1 className="page-title">系統設定</h1>
        <p className="page-subtitle">
          管理目前單人版工作台的顯示偏好、建立新案件預設，以及正式生效的模型與服務設定。
        </p>
      </section>

      <section className="panel" style={{ marginBottom: "24px" }}>
        <div className="panel-header">
          <div>
            <h2 className="panel-title">模型與服務設定</h2>
            <p className="panel-copy">
              這裡只管理單人版 owner 的系統級 active provider config。credential 只存 backend，不會進 local fallback。
            </p>
          </div>
        </div>

        {providerError ? <p className="error-text">{providerError}</p> : null}
        {providerFeedback ? (
          <p className={latestValidationStatus === "success" ? "success-text" : "muted-text"}>
            {providerFeedback}
          </p>
        ) : null}

        {providerLoading ? (
          <p className="muted-text">正在載入目前生效設定...</p>
        ) : (
          <>
            <div className="summary-grid" style={{ marginTop: "16px" }}>
              <div className="section-card">
                <p className="muted-text">目前供應商</p>
                <strong>{currentProvider?.providerDisplayName || "未設定"}</strong>
                <p className="muted-text">來源：{labelForProviderSource(currentProvider)}</p>
              </div>
              <div className="section-card">
                <p className="muted-text">目前模型</p>
                <strong>{currentProvider?.actualModelId || "未設定"}</strong>
                <p className="muted-text">
                  模型層級：
                  {MODEL_LEVEL_OPTIONS.find((item) => item.value === currentProvider?.modelLevel)?.label || "未指定"}
                </p>
              </div>
              <div className="section-card">
                <p className="muted-text">API key 狀態</p>
                <strong>
                  {currentProvider?.apiKeyConfigured
                    ? `已設定${currentProvider.apiKeyMasked ? `（${currentProvider.apiKeyMasked}）` : ""}`
                    : "未設定"}
                </strong>
                <p className="muted-text">
                  最近更新：{currentProvider?.updatedAt ? formatDisplayDate(currentProvider.updatedAt) : "尚未建立正式設定"}
                </p>
              </div>
              <div className="section-card">
                <p className="muted-text">最後驗證結果</p>
                <strong>{labelForProviderValidationStatus(latestValidationStatus)}</strong>
                <p className="muted-text">{latestValidationMessage}</p>
              </div>
            </div>

            <div className="button-row" style={{ marginTop: "16px" }}>
              <button
                className="button-primary"
                type="button"
                onClick={() => setProviderEditing((current) => !current)}
              >
                {providerEditing ? "收合編輯" : "編輯設定"}
              </button>
              <button
                className="button-secondary"
                type="button"
                onClick={() => void handleProviderRevalidate()}
                disabled={providerRevalidating || currentProvider?.source !== "runtime_config"}
              >
                {providerRevalidating ? "驗證中..." : "重新驗證"}
              </button>
              <button
                className="button-secondary"
                type="button"
                onClick={() => void handleProviderResetToEnv()}
                disabled={providerResetting || currentProvider?.source !== "runtime_config"}
              >
                {providerResetting ? "回復中..." : "回復 env 預設值"}
              </button>
            </div>

            {currentProvider?.source === "env_baseline" ? (
              <p className="muted-text" style={{ marginTop: "12px" }}>
                目前仍使用 env baseline。
                {envBaseline?.providerDisplayName
                  ? ` 基線供應商是 ${envBaseline.providerDisplayName}。`
                  : ""}
                若你要建立正式系統級設定，請先進入編輯表單並完成驗證後再套用。
              </p>
            ) : null}

            {providerEditing ? (
              <div className="detail-grid" style={{ marginTop: "18px" }}>
                <div className="detail-stack">
                  <section className="panel">
                    <div className="panel-header">
                      <div>
                        <h3 className="panel-title">編輯設定</h3>
                        <p className="panel-copy">
                          先選供應商，再選模型層級；通常只要填 API key，Base URL 與 timeout 會自動帶入預設。
                        </p>
                      </div>
                    </div>

                    <div className="field-grid">
                      <div className="field">
                        <label htmlFor="provider-id">供應商</label>
                        <select
                          id="provider-id"
                          value={providerDraft.providerId}
                          onChange={(event) => handleProviderChange(event.target.value as ProviderId)}
                        >
                          {providerSnapshot?.presets.map((preset) => (
                            <option key={preset.providerId} value={preset.providerId}>
                              {preset.displayName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label htmlFor="provider-model-level">模型層級</label>
                        <select
                          id="provider-model-level"
                          value={providerDraft.modelLevel}
                          onChange={(event) =>
                            handleProviderModelLevelChange(event.target.value as ProviderModelLevel)
                          }
                        >
                          {MODEL_LEVEL_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <small>
                          {
                            MODEL_LEVEL_OPTIONS.find((item) => item.value === providerDraft.modelLevel)
                              ?.description
                          }
                        </small>
                      </div>

                      <div className="field">
                        <label htmlFor="provider-api-key">API key</label>
                        <input
                          id="provider-api-key"
                          type="password"
                          value={providerDraft.apiKey}
                          onChange={(event) => updateProviderDraft("apiKey", event.target.value)}
                          placeholder={canReuseExistingKey() ? "留空即可沿用目前 key" : "輸入系統級 API key"}
                          autoComplete="off"
                        />
                        <small>
                          {canReuseExistingKey()
                            ? `目前已設定 ${currentProvider?.apiKeyMasked || "已遮罩 key"}，留空代表沿用。`
                            : "前端不會回顯完整 key，也不會把 credential 存到 localStorage。"}
                        </small>
                      </div>

                      <div className="field">
                        <label htmlFor="provider-model-id">實際模型</label>
                        <input
                          id="provider-model-id"
                          value={effectiveModelId}
                          readOnly
                          aria-readonly="true"
                        />
                        <small>目前會實際送往 provider 驗證與 runtime path 的 model id。</small>
                      </div>
                    </div>

                    <div className="button-row" style={{ marginTop: "16px" }}>
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => setShowAdvancedProviderFields((current) => !current)}
                      >
                        {showAdvancedProviderFields ? "收合進階設定" : "展開進階設定"}
                      </button>
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={resetProviderDraftToCurrent}
                      >
                        還原目前設定
                      </button>
                    </div>

                    {showAdvancedProviderFields ? (
                      <div className="field-grid" style={{ marginTop: "16px" }}>
                        <div className="field">
                          <label htmlFor="provider-base-url">Base URL</label>
                          <input
                            id="provider-base-url"
                            value={providerDraft.baseUrl}
                            onChange={(event) => updateProviderDraft("baseUrl", event.target.value)}
                          />
                        </div>

                        <div className="field">
                          <label htmlFor="provider-timeout">Timeout（秒）</label>
                          <input
                            id="provider-timeout"
                            type="number"
                            min={5}
                            max={300}
                            value={providerDraft.timeoutSeconds}
                            onChange={(event) =>
                              updateProviderDraft(
                                "timeoutSeconds",
                                Number(event.target.value) || 60,
                              )
                            }
                          />
                        </div>

                        <div className="field">
                          <label htmlFor="provider-custom-model-id">自訂 model id</label>
                          <input
                            id="provider-custom-model-id"
                            value={providerDraft.customModelId}
                            onChange={(event) =>
                              updateProviderDraft("customModelId", event.target.value)
                            }
                            placeholder="留空時使用推薦模型"
                          />
                          <small>只有在你需要覆寫推薦模型時再填；否則系統會依模型層級帶入預設值。</small>
                        </div>

                        <div className="setting-note-card">
                          <h3>目前 preset</h3>
                          <p className="content-block">
                            {getProviderPreset(providerDraft.providerId)?.displayName || "目前沒有可用 preset"}
                          </p>
                          <p className="muted-text">
                            預設 Base URL：
                            {getProviderPreset(providerDraft.providerId)?.defaultBaseUrl || "未提供"}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </section>
                </div>

                <div className="detail-stack">
                  <section className="panel">
                    <div className="panel-header">
                      <div>
                        <h3 className="panel-title">驗證與套用</h3>
                        <p className="panel-copy">
                          建議先測試連線，再正式儲存並套用。credential 更新是 fail-closed，不會退回 local fallback。
                        </p>
                      </div>
                    </div>

                    <div className="summary-grid">
                      <div className="section-card">
                        <p className="muted-text">將要套用的 provider</p>
                        <strong>{getProviderPreset(providerDraft.providerId)?.displayName || providerDraft.providerId}</strong>
                        <p className="muted-text">
                          runtime 支援層級：
                          {labelForProviderRuntimeSupport(getProviderPreset(providerDraft.providerId))}
                        </p>
                      </div>
                      <div className="section-card">
                        <p className="muted-text">將要套用的 model</p>
                        <strong>{effectiveModelId || "未指定"}</strong>
                        <p className="muted-text">timeout：{providerDraft.timeoutSeconds} 秒</p>
                      </div>
                    </div>

                    <div className="button-row" style={{ marginTop: "16px" }}>
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => void handleProviderTest()}
                        disabled={providerTesting}
                      >
                        {providerTesting ? "測試中..." : "測試連線"}
                      </button>
                      <button
                        className="button-primary"
                        type="button"
                        onClick={() => void handleProviderSave(false)}
                        disabled={providerSaving}
                      >
                        {providerSaving ? "儲存中..." : "儲存並套用"}
                      </button>
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => void handleProviderSave(true)}
                        disabled={providerSaving}
                      >
                        強制儲存
                      </button>
                    </div>

                    <p className={latestValidationStatus === "success" ? "success-text" : "muted-text"} style={{ marginTop: "12px" }}>
                      {labelForProviderValidationStatus(latestValidationStatus)}｜{latestValidationMessage}
                    </p>

                    {providerValidation?.detail ? (
                      <>
                        <button
                          className="button-secondary"
                          type="button"
                          onClick={() => setShowValidationDetail((current) => !current)}
                        >
                          {showValidationDetail ? "收合詳細錯誤" : "查看詳細錯誤"}
                        </button>
                        {showValidationDetail ? (
                          <div className="setting-note-card" style={{ marginTop: "12px" }}>
                            <h3>詳細訊息</h3>
                            <p className="content-block">{providerValidation.detail}</p>
                          </div>
                        ) : null}
                      </>
                    ) : null}

                    <div className="setting-note-card" style={{ marginTop: "16px" }}>
                      <h3>安全與套用規則</h3>
                      <p className="content-block">
                        完整 API key 只會送到 backend 儲存與驗證，不會回傳到前端，也不會進 localStorage。
                      </p>
                      <p className="muted-text">
                        若你先強制儲存，系統會把這筆設定標成未驗證；後續 router 仍只會讀 backend 的 active runtime config 或 env baseline。
                      </p>
                    </div>
                  </section>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      <div className="detail-grid">
        <div className="detail-stack">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">介面偏好</h2>
                <p className="panel-copy">這些設定會直接影響首頁、導覽與列表頁的預設顯示方式。</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="settings-language">介面語言</label>
                <select
                  id="settings-language"
                  value={draft.interfaceLanguage}
                  onChange={(event) =>
                    updateDraft(
                      "interfaceLanguage",
                      event.target.value as WorkbenchSettings["interfaceLanguage"],
                    )
                  }
                >
                  <option value="zh-Hant">繁體中文</option>
                  <option value="en">English（測試中）</option>
                </select>
                <small>目前正式頁面仍以繁體中文為主，英文選項先保存你的語言偏好。</small>
              </div>

              <div className="field">
                <label htmlFor="settings-homepage-focus">首頁預設顯示偏好</label>
                <select
                  id="settings-homepage-focus"
                  value={draft.homepageDisplayPreference}
                  onChange={(event) =>
                    updateDraft(
                      "homepageDisplayPreference",
                      event.target.value as WorkbenchSettings["homepageDisplayPreference"],
                    )
                  }
                >
                  <option value="matters">優先顯示案件</option>
                  <option value="deliverables">優先顯示交付物</option>
                  <option value="evidence">優先顯示待補資料</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="settings-density">顯示密度</label>
                <select
                  id="settings-density"
                  value={draft.density}
                  onChange={(event) =>
                    updateDraft("density", event.target.value as WorkbenchSettings["density"])
                  }
                >
                  <option value="standard">標準</option>
                  <option value="compact">緊湊</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="settings-history-size">歷史紀錄預設顯示筆數</label>
                <select
                  id="settings-history-size"
                  value={draft.historyDefaultPageSize}
                  onChange={(event) =>
                    updateDraft("historyDefaultPageSize", Number(event.target.value))
                  }
                >
                  {HISTORY_PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option} 筆
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">首頁與列表預設</h2>
                <p className="panel-copy">讓首頁與交付物列表更接近你平常的工作節奏。</p>
              </div>
            </div>

            <div className="form-grid">
              <label className="toggle-row" htmlFor="settings-recent-activity">
                <div>
                  <strong>顯示最近活動</strong>
                  <p className="muted-text">首頁保留最近工作更新入口。</p>
                </div>
                <input
                  id="settings-recent-activity"
                  type="checkbox"
                  checked={draft.showRecentActivity}
                  onChange={(event) => updateDraft("showRecentActivity", event.target.checked)}
                />
              </label>

              <label className="toggle-row" htmlFor="settings-frequent-extensions">
                <div>
                  <strong>顯示常用代理 / 模組包</strong>
                  <p className="muted-text">首頁保留高頻代理與模組包入口。</p>
                </div>
                <input
                  id="settings-frequent-extensions"
                  type="checkbox"
                  checked={draft.showFrequentExtensions}
                  onChange={(event) =>
                    updateDraft("showFrequentExtensions", event.target.checked)
                  }
                />
              </label>

              <div className="field">
                <label htmlFor="settings-deliverable-sort">交付物列表排序方式</label>
                <select
                  id="settings-deliverable-sort"
                  value={draft.deliverableSortPreference}
                  onChange={(event) =>
                    updateDraft(
                      "deliverableSortPreference",
                      event.target.value as WorkbenchSettings["deliverableSortPreference"],
                    )
                  }
                >
                  <option value="updated_desc">最近更新優先</option>
                  <option value="version_desc">版本較新優先</option>
                  <option value="title_asc">標題排序</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        <div className="detail-stack">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">建立新案件預設</h2>
                <p className="panel-copy">這些設定會套用在新的進件工作頁，幫你更快進入常用輸入模式。</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="settings-input-mode">新案件頁預設輸入模式</label>
                <select
                  id="settings-input-mode"
                  value={draft.newTaskDefaultInputMode}
                  onChange={(event) =>
                    updateDraft(
                      "newTaskDefaultInputMode",
                      event.target.value as WorkbenchSettings["newTaskDefaultInputMode"],
                    )
                  }
                >
                  <option value="one_line_inquiry">一句話問題</option>
                  <option value="single_document_intake">單文件進件</option>
                  <option value="multi_material_case">多材料案件</option>
                </select>
                <small>會影響新案件頁預設展開與輔助提示，不變更現有後端契約。</small>
              </div>

              <div className="setting-note-card">
                <h3>保存方式</h3>
                <p className="content-block">
                  這一輪已優先把高價值偏好寫入正式 persistence；若後端暫時不可用，才會退回目前瀏覽器作為單人版 fallback。
                </p>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">套用設定</h2>
                <p className="panel-copy">先保存目前偏好，再回到首頁、歷史紀錄或交付物頁檢查是否符合你的工作習慣。</p>
              </div>
            </div>

            <div className="button-row">
              <button className="button-primary" type="button" onClick={handleSave}>
                儲存並套用
              </button>
              <button className="button-secondary" type="button" onClick={handleReset}>
                回復預設
              </button>
            </div>
            {success ? <p className="success-text">{success}</p> : null}
            {saveMode === "local-fallback" ? (
              <p className="muted-text">目前顯示的是 local fallback 狀態，後續可再嘗試同步正式資料。</p>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
