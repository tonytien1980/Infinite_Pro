"use client";

import { useEffect, useState } from "react";

import {
  getDemoWorkspacePolicy,
  getProviderAllowlist,
  getSystemProviderSettings,
  resetSystemProviderSettingsToEnv,
  revalidateSystemProviderSettings,
  updateDemoWorkspacePolicy,
  updateProviderAllowlist,
  updateSystemProviderSettings,
  validateSystemProviderSettings,
} from "@/lib/api";
import {
  labelForDemoWorkspacePolicyStatus,
  summarizeDemoWorkspaceCapacity,
} from "@/lib/demo-workspace";
import {
  buildProviderDraftFromCurrent,
  canReuseProviderKey,
  labelForProviderRuntimeSupport,
  labelForProviderSource,
  labelForProviderValidationStatus,
  resolveEffectiveDraftModelId,
  type ProviderDraft,
} from "@/lib/provider-settings";
import type {
  DemoWorkspacePolicySnapshot,
  DemoWorkspacePolicyUpdatePayload,
  ProviderAllowlistSnapshot,
  ProviderId,
  ProviderModelLevel,
  ProviderValidationResult,
  SystemProviderSettingsSnapshot,
} from "@/lib/types";
import { formatDisplayDate } from "@/lib/ui-labels";
import { SURFACE_LABELS } from "@/lib/workbench-surface-labels";

const MODEL_LEVEL_OPTIONS: Array<{
  value: ProviderModelLevel;
  label: string;
  description: string;
}> = [
  { value: "high_quality", label: "高品質", description: "優先品質與完整度。" },
  { value: "balanced", label: "平衡", description: "兼顧品質、速度與成本。" },
  { value: "low_cost", label: "低成本", description: "優先壓低成本與延遲。" },
];

type AllowlistDraftRow = {
  key: string;
  providerId: ProviderId;
  modelLevel: ProviderModelLevel;
  allowedModelIdsText: string;
  allowCustomModel: boolean;
  status: "active" | "inactive";
};

function normalizeError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

function buildAllowlistRows(snapshot: ProviderAllowlistSnapshot | null): AllowlistDraftRow[] {
  return (snapshot?.entries || []).map((entry) => ({
    key: `${entry.providerId}-${entry.modelLevel}`,
    providerId: entry.providerId,
    modelLevel: entry.modelLevel,
    allowedModelIdsText: entry.allowedModelIds.join(", "),
    allowCustomModel: entry.allowCustomModel,
    status: entry.status,
  }));
}

function buildDemoPolicyDraft(
  snapshot: DemoWorkspacePolicySnapshot | null,
): DemoWorkspacePolicyUpdatePayload {
  return {
    status: snapshot?.status || "active",
    maxActiveDemoMembers: snapshot?.maxActiveDemoMembers ?? 5,
  };
}

export function SettingsFirmProviderPanel() {
  const [providerSnapshot, setProviderSnapshot] = useState<SystemProviderSettingsSnapshot | null>(null);
  const [providerDraft, setProviderDraft] = useState<ProviderDraft>(() => buildProviderDraftFromCurrent(null));
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

  const [allowlistSnapshot, setAllowlistSnapshot] = useState<ProviderAllowlistSnapshot | null>(null);
  const [allowlistRows, setAllowlistRows] = useState<AllowlistDraftRow[]>([]);
  const [allowlistSaving, setAllowlistSaving] = useState(false);
  const [allowlistFeedback, setAllowlistFeedback] = useState<string | null>(null);
  const [allowlistError, setAllowlistError] = useState<string | null>(null);

  const [demoPolicySnapshot, setDemoPolicySnapshot] = useState<DemoWorkspacePolicySnapshot | null>(null);
  const [demoPolicyDraft, setDemoPolicyDraft] = useState<DemoWorkspacePolicyUpdatePayload>(() =>
    buildDemoPolicyDraft(null),
  );
  const [demoPolicySaving, setDemoPolicySaving] = useState(false);
  const [demoPolicyFeedback, setDemoPolicyFeedback] = useState<string | null>(null);
  const [demoPolicyError, setDemoPolicyError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      setProviderLoading(true);
      try {
        const [systemSnapshot, allowlist, demoPolicy] = await Promise.all([
          getSystemProviderSettings(),
          getProviderAllowlist(),
          getDemoWorkspacePolicy(),
        ]);
        if (cancelled) {
          return;
        }
        setProviderSnapshot(systemSnapshot);
        setProviderDraft(buildProviderDraftFromCurrent(systemSnapshot));
        setAllowlistSnapshot(allowlist);
        setAllowlistRows(buildAllowlistRows(allowlist));
        setDemoPolicySnapshot(demoPolicy);
        setDemoPolicyDraft(buildDemoPolicyDraft(demoPolicy));
      } catch (error) {
        if (!cancelled) {
          setProviderError(normalizeError(error, `目前無法載入${SURFACE_LABELS.firmSettings}。`));
        }
      } finally {
        if (!cancelled) {
          setProviderLoading(false);
        }
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentProvider = providerSnapshot?.current ?? null;
  const envBaseline = providerSnapshot?.envBaseline ?? null;
  const effectiveModelId = resolveEffectiveDraftModelId(providerDraft, providerSnapshot?.presets || []);
  const latestValidationStatus =
    providerValidation?.validationStatus || currentProvider?.lastValidationStatus || "not_validated";
  const latestValidationMessage =
    providerValidation?.message || currentProvider?.lastValidationMessage || "目前尚未驗證正式設定。";

  function getProviderPreset(providerId: ProviderId) {
    return providerSnapshot?.presets.find((item) => item.providerId === providerId) ?? null;
  }

  function updateProviderDraft<K extends keyof ProviderDraft>(key: K, value: ProviderDraft[K]) {
    setProviderDraft((current) => ({ ...current, [key]: value }));
    setProviderValidation(null);
    setProviderFeedback(null);
    setProviderError(null);
  }

  function updateDemoPolicyDraft<K extends keyof DemoWorkspacePolicyUpdatePayload>(
    key: K,
    value: DemoWorkspacePolicyUpdatePayload[K],
  ) {
    setDemoPolicyDraft((current) => ({ ...current, [key]: value }));
    setDemoPolicyFeedback(null);
    setDemoPolicyError(null);
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
    setProviderFeedback(`已帶入 ${preset.displayName} 的預設基礎網址、模型與逾時設定。`);
    setProviderError(null);
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
        modelId: providerDraft.modelId.trim() || effectiveModelId,
        customModelId: providerDraft.customModelId.trim(),
        baseUrl: providerDraft.baseUrl.trim(),
        timeoutSeconds: providerDraft.timeoutSeconds,
        apiKey: providerDraft.apiKey,
        keepExistingKey: canReuseProviderKey(currentProvider, providerDraft.providerId) && providerDraft.apiKey.trim() === "",
      });
      setProviderValidation(result);
      setProviderFeedback(result.message);
    } catch (error) {
      setProviderValidation(null);
      setProviderError(normalizeError(error, `${SURFACE_LABELS.firmSettings}驗證失敗。`));
    } finally {
      setProviderTesting(false);
    }
  }

  async function handleProviderSave(forceSaveWithoutValidation = false) {
    setProviderSaving(true);
    setProviderFeedback(null);
    setProviderError(null);
    try {
      const snapshot = await updateSystemProviderSettings({
        providerId: providerDraft.providerId,
        modelLevel: providerDraft.modelLevel,
        modelId: providerDraft.modelId.trim() || effectiveModelId,
        customModelId: providerDraft.customModelId.trim(),
        baseUrl: providerDraft.baseUrl.trim(),
        timeoutSeconds: providerDraft.timeoutSeconds,
        apiKey: providerDraft.apiKey,
        keepExistingKey: canReuseProviderKey(currentProvider, providerDraft.providerId) && providerDraft.apiKey.trim() === "",
        validateBeforeSave: !forceSaveWithoutValidation,
        forceSaveWithoutValidation,
      });
      setProviderSnapshot(snapshot);
      setProviderDraft(buildProviderDraftFromCurrent(snapshot));
      setProviderValidation(null);
      setProviderEditing(false);
      setProviderFeedback(
        forceSaveWithoutValidation
          ? `已強制儲存${SURFACE_LABELS.firmSettings}；請盡快重新驗證。`
          : `${SURFACE_LABELS.firmSettings}已通過驗證並正式套用。`,
      );
    } catch (error) {
      setProviderError(normalizeError(error, `${SURFACE_LABELS.firmSettings}保存失敗。`));
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
      setProviderDraft(buildProviderDraftFromCurrent(snapshot));
      setProviderFeedback(`已重新驗證目前${SURFACE_LABELS.firmSettings}。`);
    } catch (error) {
      setProviderError(normalizeError(error, `重新驗證${SURFACE_LABELS.firmSettings}失敗。`));
    } finally {
      setProviderRevalidating(false);
    }
  }

  async function handleProviderResetToEnv() {
    setProviderResetting(true);
    setProviderFeedback(null);
    setProviderError(null);
    try {
      const snapshot = await resetSystemProviderSettingsToEnv();
      setProviderSnapshot(snapshot);
      setProviderDraft(buildProviderDraftFromCurrent(snapshot));
      setProviderValidation(null);
      setProviderEditing(false);
      setProviderFeedback("已回退到 env baseline。");
    } catch (error) {
      setProviderError(normalizeError(error, "回復 env baseline 失敗。"));
    } finally {
      setProviderResetting(false);
    }
  }

  function updateAllowlistRow(index: number, patch: Partial<AllowlistDraftRow>) {
    setAllowlistRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    );
    setAllowlistFeedback(null);
    setAllowlistError(null);
  }

  function handleAddAllowlistRow() {
    setAllowlistRows((current) => [
      ...current,
      {
        key: `new-${current.length}`,
        providerId: "openai",
        modelLevel: "balanced",
        allowedModelIdsText: "",
        allowCustomModel: false,
        status: "active",
      },
    ]);
  }

  async function handleSaveAllowlist() {
    setAllowlistSaving(true);
    setAllowlistFeedback(null);
    setAllowlistError(null);
    try {
      const payload = {
        entries: allowlistRows.map((row) => ({
          providerId: row.providerId,
          modelLevel: row.modelLevel,
          allowedModelIds: row.allowedModelIdsText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          allowCustomModel: row.allowCustomModel,
          status: row.status,
        })),
      } satisfies ProviderAllowlistSnapshot;
      const snapshot = await updateProviderAllowlist(payload);
      setAllowlistSnapshot(snapshot);
      setAllowlistRows(buildAllowlistRows(snapshot));
      setAllowlistFeedback(`${SURFACE_LABELS.providerAllowlist}已更新。`);
    } catch (error) {
      setAllowlistError(normalizeError(error, `${SURFACE_LABELS.providerAllowlist}保存失敗。`));
    } finally {
      setAllowlistSaving(false);
    }
  }

  async function handleSaveDemoPolicy() {
    setDemoPolicySaving(true);
    setDemoPolicyFeedback(null);
    setDemoPolicyError(null);
    try {
      const snapshot = await updateDemoWorkspacePolicy(demoPolicyDraft);
      setDemoPolicySnapshot(snapshot);
      setDemoPolicyDraft(buildDemoPolicyDraft(snapshot));
      setDemoPolicyFeedback("demo workspace policy 已更新。");
    } catch (error) {
      setDemoPolicyError(normalizeError(error, "demo workspace policy 保存失敗。"));
    } finally {
      setDemoPolicySaving(false);
    }
  }

  return (
    <section className="panel" id="firm-provider-panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{SURFACE_LABELS.firmSettings}</h2>
          <p className="panel-copy">
            這一區只給 owner 管理事務所層的預設模型來源與可用模型來源清單。
          </p>
        </div>
      </div>

      {providerError ? <p className="error-text">{providerError}</p> : null}
      {providerFeedback ? (
        <p className={latestValidationStatus === "success" ? "success-text" : "muted-text"}>{providerFeedback}</p>
      ) : null}

      {providerLoading ? (
        <p className="muted-text">正在載入{SURFACE_LABELS.firmSettings}...</p>
      ) : (
        <>
          <div className="summary-grid" style={{ marginTop: "16px" }}>
            <div className="section-card">
              <p className="muted-text">目前事務所模型來源</p>
              <strong>{currentProvider?.providerDisplayName || "未設定"}</strong>
              <p className="muted-text">來源：{labelForProviderSource(currentProvider)}</p>
            </div>
            <div className="section-card">
              <p className="muted-text">目前模型</p>
              <strong>{currentProvider?.actualModelId || "未設定"}</strong>
              <p className="muted-text">
                最後更新：{currentProvider?.updatedAt ? formatDisplayDate(currentProvider.updatedAt) : "尚未建立"}
              </p>
            </div>
            <div className="section-card">
              <p className="muted-text">最後驗證</p>
              <strong>{labelForProviderValidationStatus(latestValidationStatus)}</strong>
              <p className="muted-text">{latestValidationMessage}</p>
            </div>
            <div className="section-card">
              <p className="muted-text">目前可用模型來源條目</p>
              <strong>{allowlistSnapshot?.entries.length || 0}</strong>
              <p className="muted-text">顧問只能在這些範圍內保存自己的模型設定。</p>
            </div>
            <div className="section-card">
              <p className="muted-text">示範工作台狀態</p>
              <strong>{labelForDemoWorkspacePolicyStatus(demoPolicySnapshot?.status || "active")}</strong>
              <p className="muted-text">{summarizeDemoWorkspaceCapacity(demoPolicySnapshot)}</p>
            </div>
            <div className="section-card">
              <p className="muted-text">示範工作台版本</p>
              <strong>{demoPolicySnapshot?.seedVersion || "v1"}</strong>
              <p className="muted-text">slug：{demoPolicySnapshot?.workspaceSlug || "demo"}</p>
            </div>
          </div>

          <div className="button-row" style={{ marginTop: "16px" }}>
            <button className="button-primary" type="button" onClick={() => setProviderEditing((current) => !current)}>
              {providerEditing ? `收合${SURFACE_LABELS.firmSettings}編輯` : `編輯${SURFACE_LABELS.firmSettings}`}
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

          {providerEditing ? (
            <div className="detail-grid" style={{ marginTop: "18px" }}>
              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h3 className="panel-title">{SURFACE_LABELS.firmProviderDefault}</h3>
                      <p className="panel-copy">先決定這間事務所平常要優先用哪個模型來源與模型。</p>
                    </div>
                  </div>

                  <div className="field-grid">
                    <div className="field">
                      <label htmlFor="firm-provider-id">供應商</label>
                      <select
                        id="firm-provider-id"
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
                      <label htmlFor="firm-provider-model-level">模型層級</label>
                      <select
                        id="firm-provider-model-level"
                        value={providerDraft.modelLevel}
                        onChange={(event) =>
                          updateProviderDraft("modelLevel", event.target.value as ProviderModelLevel)
                        }
                      >
                        {MODEL_LEVEL_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="firm-provider-api-key">API key</label>
                      <input
                        id="firm-provider-api-key"
                        type="password"
                        value={providerDraft.apiKey}
                        onChange={(event) => updateProviderDraft("apiKey", event.target.value)}
                        placeholder={
                          canReuseProviderKey(currentProvider, providerDraft.providerId)
                            ? "留空即可沿用目前 key"
                            : "輸入 firm fallback API key"
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="firm-provider-model-id">模型</label>
                      <input
                        id="firm-provider-model-id"
                        value={effectiveModelId}
                        onChange={(event) => updateProviderDraft("modelId", event.target.value)}
                      />
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
                    <button className="button-secondary" type="button" onClick={() => void handleProviderTest()} disabled={providerTesting}>
                      {providerTesting ? "測試中..." : "測試連線"}
                    </button>
                    <button className="button-primary" type="button" onClick={() => void handleProviderSave(false)} disabled={providerSaving}>
                      {providerSaving ? "儲存中..." : "儲存並套用"}
                    </button>
                  </div>

                  {showAdvancedProviderFields ? (
                    <div className="field-grid" style={{ marginTop: "16px" }}>
                      <div className="field">
                        <label htmlFor="firm-provider-base-url">基礎網址</label>
                        <input
                          id="firm-provider-base-url"
                          value={providerDraft.baseUrl}
                          onChange={(event) => updateProviderDraft("baseUrl", event.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="firm-provider-timeout">逾時（秒）</label>
                        <input
                          id="firm-provider-timeout"
                          type="number"
                          min={5}
                          max={300}
                          value={providerDraft.timeoutSeconds}
                          onChange={(event) => updateProviderDraft("timeoutSeconds", Number(event.target.value) || 60)}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="firm-provider-custom-model-id">自訂模型代號</label>
                        <input
                          id="firm-provider-custom-model-id"
                          value={providerDraft.customModelId}
                          onChange={(event) => updateProviderDraft("customModelId", event.target.value)}
                          placeholder="留空時使用推薦模型"
                        />
                      </div>
                      <div className="setting-note-card">
                        <h3>目前預設組</h3>
                        <p className="content-block">{getProviderPreset(providerDraft.providerId)?.displayName || "未指定"}</p>
                        <p className="muted-text">
                          {labelForProviderRuntimeSupport(getProviderPreset(providerDraft.providerId))}
                        </p>
                        <p className="muted-text">
                          env baseline：{envBaseline?.providerDisplayName || "未指定"}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {providerValidation?.detail ? (
                    <div style={{ marginTop: "12px" }}>
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
                    </div>
                  ) : null}
                </section>
              </div>

              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h3 className="panel-title">{SURFACE_LABELS.providerAllowlist}</h3>
                      <p className="panel-copy">定義 consultant 可以選哪些 provider / model。</p>
                    </div>
                  </div>

                  {allowlistError ? <p className="error-text">{allowlistError}</p> : null}
                  {allowlistFeedback ? <p className="success-text">{allowlistFeedback}</p> : null}

                  <div className="detail-stack">
                    {allowlistRows.map((row, index) => (
                      <div className="section-card" key={row.key}>
                        <div className="field-grid">
                          <div className="field">
                            <label>供應商</label>
                            <select
                              value={row.providerId}
                              onChange={(event) => updateAllowlistRow(index, { providerId: event.target.value as ProviderId })}
                            >
                              {(providerSnapshot?.presets || []).map((preset) => (
                                <option key={preset.providerId} value={preset.providerId}>
                                  {preset.displayName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label>模型層級</label>
                            <select
                              value={row.modelLevel}
                              onChange={(event) => updateAllowlistRow(index, { modelLevel: event.target.value as ProviderModelLevel })}
                            >
                              {MODEL_LEVEL_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label>允許模型（逗號分隔）</label>
                            <input
                              value={row.allowedModelIdsText}
                              onChange={(event) => updateAllowlistRow(index, { allowedModelIdsText: event.target.value })}
                              placeholder="例如：gpt-5.4-mini, gpt-5.4"
                            />
                          </div>
                          <div className="field">
                            <label>狀態</label>
                            <select
                              value={row.status}
                              onChange={(event) => updateAllowlistRow(index, { status: event.target.value as "active" | "inactive" })}
                            >
                              <option value="active">啟用</option>
                              <option value="inactive">停用</option>
                            </select>
                          </div>
                        </div>
                        <label className="toggle-row" htmlFor={`allow-custom-${row.key}`}>
                          <div>
                            <strong>允許自訂模型</strong>
                            <p className="muted-text">若關閉，consultant 只能落在明確列出的 model id。</p>
                          </div>
                          <input
                            id={`allow-custom-${row.key}`}
                            type="checkbox"
                            checked={row.allowCustomModel}
                            onChange={(event) => updateAllowlistRow(index, { allowCustomModel: event.target.checked })}
                          />
                        </label>
                        <div className="button-row" style={{ marginTop: "12px" }}>
                          <button className="button-secondary" type="button" onClick={() => setAllowlistRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}>
                            移除規則
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="button-row" style={{ marginTop: "16px" }}>
                    <button className="button-secondary" type="button" onClick={handleAddAllowlistRow}>
                      新增允許規則
                    </button>
                    <button className="button-primary" type="button" onClick={() => void handleSaveAllowlist()} disabled={allowlistSaving}>
                      {allowlistSaving ? "儲存中..." : "儲存 allowlist"}
                    </button>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h3 className="panel-title">demo workspace policy</h3>
                      <p className="panel-copy">控制 demo workspace 是否開放，以及可啟用 demo 帳號數量。</p>
                    </div>
                  </div>

                  {demoPolicyError ? <p className="error-text">{demoPolicyError}</p> : null}
                  {demoPolicyFeedback ? <p className="success-text">{demoPolicyFeedback}</p> : null}

                  <div className="field-grid">
                    <div className="field">
                      <label htmlFor="demo-workspace-status">狀態</label>
                      <select
                        id="demo-workspace-status"
                        value={demoPolicyDraft.status}
                        onChange={(event) =>
                          updateDemoPolicyDraft(
                            "status",
                            event.target.value === "inactive" ? "inactive" : "active",
                          )
                        }
                      >
                        <option value="active">啟用</option>
                        <option value="inactive">停用</option>
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="demo-workspace-max-members">可啟用 demo 帳號數量</label>
                      <input
                        id="demo-workspace-max-members"
                        type="number"
                        min={0}
                        max={1000}
                        value={demoPolicyDraft.maxActiveDemoMembers}
                        onChange={(event) =>
                          updateDemoPolicyDraft(
                            "maxActiveDemoMembers",
                            Math.max(0, Number(event.target.value) || 0),
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="setting-note-card" style={{ marginTop: "16px" }}>
                    <h3>目前展示資料</h3>
                    <p className="content-block">
                      workspace slug：{demoPolicySnapshot?.workspaceSlug || "demo"}
                    </p>
                    <p className="muted-text">seed version：{demoPolicySnapshot?.seedVersion || "v1"}</p>
                    <p className="muted-text">{summarizeDemoWorkspaceCapacity(demoPolicySnapshot)}</p>
                  </div>

                  <div className="button-row" style={{ marginTop: "16px" }}>
                    <button
                      className="button-primary"
                      type="button"
                      onClick={() => void handleSaveDemoPolicy()}
                      disabled={demoPolicySaving}
                    >
                      {demoPolicySaving ? "儲存中..." : "儲存 demo policy"}
                    </button>
                  </div>
                </section>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
