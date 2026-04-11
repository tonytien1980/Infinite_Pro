"use client";

import { useEffect, useState } from "react";

import {
  getPersonalProviderSettings,
  getProviderAllowlist,
  revalidatePersonalProviderSettings,
  updatePersonalProviderSettings,
  validatePersonalProviderSettings,
} from "@/lib/api";
import {
  buildProviderDraftFromCurrent,
  canReuseProviderKey,
  labelForProviderRuntimeSupport,
  labelForProviderSource,
  labelForProviderValidationStatus,
  normalizeProviderValidationMessage,
  resolveEffectiveDraftModelId,
  summarizeAllowlistEntry,
  type ProviderDraft,
} from "@/lib/provider-settings";
import type {
  MembershipRole,
  PersonalProviderSettingsSnapshot,
  ProviderAllowlistSnapshot,
  ProviderId,
  ProviderModelLevel,
  ProviderValidationResult,
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

function normalizeError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

export function SettingsPersonalProviderPanel({
  membershipRole,
}: {
  membershipRole: MembershipRole;
}) {
  const [snapshot, setSnapshot] = useState<PersonalProviderSettingsSnapshot | null>(null);
  const [draft, setDraft] = useState<ProviderDraft>(() => buildProviderDraftFromCurrent(null));
  const [allowlist, setAllowlist] = useState<ProviderAllowlistSnapshot | null>(null);
  const [validation, setValidation] = useState<ProviderValidationResult | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [revalidating, setRevalidating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [showValidationDetail, setShowValidationDetail] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      setLoading(true);
      try {
        const [personal, allowlistSnapshot] = await Promise.all([
          getPersonalProviderSettings(),
          getProviderAllowlist(),
        ]);
        if (cancelled) {
          return;
        }
        setSnapshot(personal);
        setDraft(buildProviderDraftFromCurrent(personal));
        setAllowlist(allowlistSnapshot);
      } catch (loadError) {
        if (!cancelled) {
          setError(normalizeError(loadError, "目前無法載入個人模型設定。"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const current = snapshot?.current ?? null;
  const latestValidationStatus =
    validation?.validationStatus || current?.lastValidationStatus || "not_validated";
  const latestValidationMessage = normalizeProviderValidationMessage(
    validation?.message || current?.lastValidationMessage || "目前尚未驗證個人模型設定。",
  );
  const effectiveModelId = resolveEffectiveDraftModelId(draft, snapshot?.presets || []);

  function getProviderPreset(providerId: ProviderId) {
    return snapshot?.presets.find((item) => item.providerId === providerId) ?? null;
  }

  function updateDraft<K extends keyof ProviderDraft>(key: K, value: ProviderDraft[K]) {
    setDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
    setValidation(null);
    setFeedback(null);
    setError(null);
  }

  async function handleTest() {
    setTesting(true);
    setFeedback(null);
    setError(null);
    setShowValidationDetail(false);
    try {
      const result = await validatePersonalProviderSettings({
        providerId: draft.providerId,
        modelLevel: draft.modelLevel,
        modelId: draft.modelId.trim() || effectiveModelId,
        customModelId: draft.customModelId.trim(),
        baseUrl: draft.baseUrl.trim(),
        timeoutSeconds: draft.timeoutSeconds,
        apiKey: draft.apiKey,
        keepExistingKey: canReuseProviderKey(current, draft.providerId) && draft.apiKey.trim() === "",
      });
      setValidation(result);
      setFeedback(result.message);
    } catch (testError) {
      setValidation(null);
      setError(normalizeError(testError, "個人模型設定驗證失敗。"));
    } finally {
      setTesting(false);
    }
  }

  async function handleSave(forceSaveWithoutValidation = false) {
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      const nextSnapshot = await updatePersonalProviderSettings({
        providerId: draft.providerId,
        modelLevel: draft.modelLevel,
        modelId: draft.modelId.trim() || effectiveModelId,
        customModelId: draft.customModelId.trim(),
        baseUrl: draft.baseUrl.trim(),
        timeoutSeconds: draft.timeoutSeconds,
        apiKey: draft.apiKey,
        keepExistingKey: canReuseProviderKey(current, draft.providerId) && draft.apiKey.trim() === "",
        validateBeforeSave: !forceSaveWithoutValidation,
        forceSaveWithoutValidation,
      });
      setSnapshot(nextSnapshot);
      setDraft(buildProviderDraftFromCurrent(nextSnapshot));
      setValidation(null);
      setEditing(false);
      setFeedback(
        forceSaveWithoutValidation
          ? "個人模型設定已保存，但目前仍標記為未驗證。"
          : "個人模型設定已通過驗證並保存。",
      );
    } catch (saveError) {
      setError(normalizeError(saveError, "個人模型設定保存失敗。"));
    } finally {
      setSaving(false);
    }
  }

  async function handleRevalidate() {
    setRevalidating(true);
    setFeedback(null);
    setError(null);
    try {
      const nextSnapshot = await revalidatePersonalProviderSettings();
      setSnapshot(nextSnapshot);
      setDraft(buildProviderDraftFromCurrent(nextSnapshot));
      setFeedback("已重新驗證個人模型設定。");
    } catch (revalidateError) {
      setError(normalizeError(revalidateError, "重新驗證個人模型設定失敗。"));
    } finally {
      setRevalidating(false);
    }
  }

  return (
    <section className="panel" id="personal-provider-panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{SURFACE_LABELS.personalProviderSettings}</h2>
          <p className="panel-copy">
            {membershipRole === "owner"
              ? "負責人也可以用自己的個人模型金鑰工作；若未設定，才回退到事務所預設模型來源。"
              : "顧問需要先完成自己的個人模型設定，才能正式執行分析。"}
          </p>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {feedback ? <p className={latestValidationStatus === "success" ? "success-text" : "muted-text"}>{feedback}</p> : null}

      {loading ? (
        <p className="muted-text">正在載入個人模型設定...</p>
      ) : (
        <>
          <div className="summary-grid" style={{ marginTop: "16px" }}>
            <div className="section-card">
              <p className="muted-text">目前來源</p>
              <strong>{labelForProviderSource(current)}</strong>
              <p className="muted-text">{current?.providerDisplayName || "尚未建立個人設定"}</p>
            </div>
            <div className="section-card">
              <p className="muted-text">目前模型</p>
              <strong>{current?.actualModelId || "未設定"}</strong>
              <p className="muted-text">
                最近更新：{current?.updatedAt ? formatDisplayDate(current.updatedAt) : "尚未建立"}
              </p>
            </div>
            <div className="section-card">
              <p className="muted-text">個人 API 金鑰</p>
              <strong>
                {current?.apiKeyConfigured
                  ? `已設定${current.apiKeyMasked ? `（${current.apiKeyMasked}）` : ""}`
                  : "未設定"}
              </strong>
              <p className="muted-text">
                顧問沒有個人模型金鑰時，系統會直接停止這次分析，不會偷偷改走其他來源。
              </p>
            </div>
            <div className="section-card">
              <p className="muted-text">最後驗證</p>
              <strong>{labelForProviderValidationStatus(latestValidationStatus)}</strong>
              <p className="muted-text">{latestValidationMessage}</p>
            </div>
          </div>

          <div className="button-row" style={{ marginTop: "16px" }}>
            <button className="button-primary" type="button" onClick={() => setEditing((currentValue) => !currentValue)}>
              {editing ? "收合個人設定編輯" : "編輯個人模型設定"}
            </button>
            <button
              className="button-secondary"
              type="button"
              onClick={() => void handleRevalidate()}
              disabled={revalidating || !current?.apiKeyConfigured}
            >
              {revalidating ? "驗證中..." : "重新驗證"}
            </button>
          </div>

          {editing ? (
            <div className="detail-grid" style={{ marginTop: "18px" }}>
              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h3 className="panel-title">編輯個人模型設定</h3>
                      <p className="panel-copy">這裡只存你自己的模型來源、模型與金鑰，不會改到事務所預設值。</p>
                    </div>
                  </div>

                  <div className="field-grid">
                    <div className="field">
                      <label htmlFor="personal-provider-id">供應商</label>
                      <select
                        id="personal-provider-id"
                        value={draft.providerId}
                        onChange={(event) => updateDraft("providerId", event.target.value as ProviderId)}
                      >
                        {(snapshot?.presets || []).map((preset) => (
                          <option key={preset.providerId} value={preset.providerId}>
                            {preset.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="personal-provider-model-level">模型層級</label>
                      <select
                        id="personal-provider-model-level"
                        value={draft.modelLevel}
                        onChange={(event) => updateDraft("modelLevel", event.target.value as ProviderModelLevel)}
                      >
                        {MODEL_LEVEL_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="personal-provider-api-key">API 金鑰</label>
                      <input
                        id="personal-provider-api-key"
                        type="password"
                        value={draft.apiKey}
                        onChange={(event) => updateDraft("apiKey", event.target.value)}
                        placeholder={
                          canReuseProviderKey(current, draft.providerId)
                            ? "留空即可沿用目前金鑰"
                            : "輸入你自己的 API 金鑰"
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="personal-provider-model-id">模型</label>
                      <input
                        id="personal-provider-model-id"
                        value={effectiveModelId}
                        onChange={(event) => updateDraft("modelId", event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="button-row" style={{ marginTop: "16px" }}>
                    <button className="button-secondary" type="button" onClick={() => setShowAdvancedFields((currentValue) => !currentValue)}>
                      {showAdvancedFields ? "收合進階設定" : "展開進階設定"}
                    </button>
                    <button className="button-secondary" type="button" onClick={() => void handleTest()} disabled={testing}>
                      {testing ? "測試中..." : "測試連線"}
                    </button>
                    <button className="button-primary" type="button" onClick={() => void handleSave(false)} disabled={saving}>
                      {saving ? "儲存中..." : "儲存個人設定"}
                    </button>
                  </div>

                  {showAdvancedFields ? (
                    <div className="field-grid" style={{ marginTop: "16px" }}>
                      <div className="field">
                        <label htmlFor="personal-provider-base-url">基礎網址</label>
                        <input
                          id="personal-provider-base-url"
                          value={draft.baseUrl}
                          onChange={(event) => updateDraft("baseUrl", event.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="personal-provider-timeout">逾時（秒）</label>
                        <input
                          id="personal-provider-timeout"
                          type="number"
                          min={5}
                          max={300}
                          value={draft.timeoutSeconds}
                          onChange={(event) => updateDraft("timeoutSeconds", Number(event.target.value) || 60)}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="personal-provider-custom-model-id">自訂模型代號</label>
                        <input
                          id="personal-provider-custom-model-id"
                          value={draft.customModelId}
                          onChange={(event) => updateDraft("customModelId", event.target.value)}
                          placeholder="留空時使用推薦模型"
                        />
                      </div>
                      <div className="setting-note-card">
                        <h3>這次會實際使用的 provider</h3>
                        <p className="content-block">{getProviderPreset(draft.providerId)?.displayName || draft.providerId}</p>
                        <p className="muted-text">{labelForProviderRuntimeSupport(getProviderPreset(draft.providerId))}</p>
                      </div>
                    </div>
                  ) : null}

                  {validation?.detail ? (
                    <div style={{ marginTop: "12px" }}>
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => setShowValidationDetail((currentValue) => !currentValue)}
                      >
                        {showValidationDetail ? "收合詳細錯誤" : "查看詳細錯誤"}
                      </button>
                      {showValidationDetail ? (
                        <div className="setting-note-card" style={{ marginTop: "12px" }}>
                          <h3>詳細訊息</h3>
                          <p className="content-block">{validation.detail}</p>
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
                      <h3 className="panel-title">目前 allowlist 範圍</h3>
                      <p className="panel-copy">顧問只能落在負責人已允許的模型來源 / 模型範圍內。</p>
                    </div>
                  </div>
                  {allowlist?.entries.length ? (
                    <div className="detail-stack">
                      {allowlist.entries.map((entry) => (
                        <div className="section-card" key={`${entry.providerId}-${entry.modelLevel}`}>
                          <strong>
                            {entry.providerId}｜{MODEL_LEVEL_OPTIONS.find((item) => item.value === entry.modelLevel)?.label || entry.modelLevel}
                          </strong>
                          <p className="muted-text">{summarizeAllowlistEntry(entry)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="setting-note-card">
                      <h3>目前還沒有 allowlist 規則</h3>
                      <p className="content-block">
                        若你現在是顧問，這代表你暫時不能保存可執行的個人模型設定；請先請負責人補上可用清單。
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
