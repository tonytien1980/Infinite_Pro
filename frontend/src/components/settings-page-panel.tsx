"use client";

import { useEffect, useState } from "react";

import { getCurrentSession } from "@/lib/api";
import { getSettingsProviderVisibility } from "@/lib/provider-settings";
import { normalizeOperatorDisplayName } from "@/lib/operator-identity";
import { buildWorkbenchPreferenceFeedback, persistWorkbenchPreferences } from "@/lib/workbench-persistence";
import { labelForMembershipRole } from "@/lib/ui-labels";
import {
  DEFAULT_OPERATOR_IDENTITY_SETTINGS,
  DEFAULT_WORKBENCH_SETTINGS,
  type WorkbenchSettings,
  useOperatorIdentitySettings,
  useWorkbenchSettings,
} from "@/lib/workbench-store";
import { SURFACE_LABELS } from "@/lib/workbench-surface-labels";
import type { MembershipRole, SessionState, ThemePreference } from "@/lib/types";
import { SettingsFirmProviderPanel } from "@/components/settings-firm-provider-panel";
import { SettingsPersonalProviderPanel } from "@/components/settings-personal-provider-panel";

const HISTORY_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];
const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  description: string;
}> = [
  { value: "light", label: "淺色", description: "以高可讀性與穩定結構作為預設工作台外觀。" },
  { value: "dark", label: "深色", description: "保留專業工作台感，但用較低眩光的深色結構承接長時間使用。" },
  { value: "system", label: "跟隨系統", description: "依作業系統主題自動切換淺色 / 深色模式。" },
];

export function SettingsPagePanel() {
  const [settings, setSettings] = useWorkbenchSettings();
  const [operatorIdentity, setOperatorIdentity] = useOperatorIdentitySettings();
  const [draft, setDraft] = useState<WorkbenchSettings>(settings);
  const [operatorDraft, setOperatorDraft] = useState(operatorIdentity.operatorDisplayName);
  const [success, setSuccess] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState<"remote" | "local-fallback" | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    setOperatorDraft(operatorIdentity.operatorDisplayName);
  }, [operatorIdentity.operatorDisplayName]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const currentSession = await getCurrentSession();
        if (!cancelled) {
          setSession(currentSession);
        }
      } finally {
        if (!cancelled) {
          setSessionResolved(true);
        }
      }
    })();

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

  async function handleSave() {
    const normalizedOperatorDisplayName = normalizeOperatorDisplayName(operatorDraft);
    try {
      const result = await persistWorkbenchPreferences(draft);
      setSettings(result.settings);
      setOperatorIdentity({ operatorDisplayName: normalizedOperatorDisplayName });
      setSaveMode(result.source);
      setSuccess(`${buildWorkbenchPreferenceFeedback(result.source)} 本機顧問署名也已保存。`);
    } catch (saveError) {
      setSaveMode(null);
      setSuccess(saveError instanceof Error ? saveError.message : "保存設定失敗。");
    }
  }

  async function handleReset() {
    setDraft(DEFAULT_WORKBENCH_SETTINGS);
    setOperatorDraft(DEFAULT_OPERATOR_IDENTITY_SETTINGS.operatorDisplayName);
    try {
      const result = await persistWorkbenchPreferences(DEFAULT_WORKBENCH_SETTINGS);
      setSettings(result.settings);
      setOperatorIdentity(DEFAULT_OPERATOR_IDENTITY_SETTINGS);
      setSaveMode(result.source);
      setSuccess(
        result.source === "remote"
          ? "已恢復預設設定，並同步寫入正式工作台偏好；本機顧問署名也已清空。"
          : "已恢復預設設定，並先保存到目前瀏覽器；本機顧問署名也已清空。",
      );
    } catch (saveError) {
      setSaveMode(null);
      setSuccess(saveError instanceof Error ? saveError.message : "恢復預設設定失敗。");
    }
  }

  const role: MembershipRole | null = session?.membership.role || null;
  const providerVisibility = role ? getSettingsProviderVisibility(role) : { showFirmSettings: false, showPersonalSettings: false };
  const settingsActionTitle = "現在先決定";
  const settingsActionSummary =
    role === "owner"
      ? `要調整全體可用的模型與示範工作台規則，就看${SURFACE_LABELS.firmSettings}；要讓你自己能開始分析，就看${SURFACE_LABELS.personalProviderSettings}。`
      : `先完成自己的${SURFACE_LABELS.personalProviderSettings}，之後再依需要調整工作台偏好；${SURFACE_LABELS.firmSettings}這一區你可以查看，但不需要在這裡操作。`;
  const settingsActionChecklist = [
    providerVisibility.showFirmSettings
      ? `要調整事務所這邊平常用哪個模型來源，先看${SURFACE_LABELS.firmSettings}。`
      : `你這一頁最先要完成的是自己的${SURFACE_LABELS.personalProviderSettings}。`,
    "要改首頁、列表與顯示習慣，再看工作台偏好。",
    "不確定時，就先從會直接影響你這次工作的那一區開始。",
  ];

  return (
    <main className="page-shell settings-page-shell">
      <section className="hero-card settings-hero">
        <div className="hero-layout">
          <div className="hero-main">
            <span className="eyebrow">系統設定</span>
            <h1 className="page-title">系統設定</h1>
            <p className="page-subtitle">
              這裡分成事務所設定、個人模型設定與工作台偏好；先決定你現在要調哪一類。
            </p>
            <div className="hero-actions">
              {providerVisibility.showFirmSettings ? (
                <a className="button-primary" href="#firm-provider-panel">
                  看{SURFACE_LABELS.firmSettings}
                </a>
              ) : (
                <a className="button-primary" href="#personal-provider-panel">
                  看個人模型設定
                </a>
              )}
              <a className="button-secondary" href="#preference-panel">
                看工作台偏好
              </a>
            </div>
          </div>

          <div className="hero-aside">
            <div className="hero-focus-card">
              <p className="hero-focus-label">{settingsActionTitle}</p>
              <h3 className="hero-focus-title">先決定你要調哪一類設定</h3>
              <p className="hero-focus-copy">{settingsActionSummary}</p>
            </div>
            <div className="hero-focus-card hero-focus-card-warm">
              <p className="hero-focus-label">這頁先看什麼</p>
              <ul className="hero-focus-list">
                {settingsActionChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="panel" style={{ marginBottom: "24px" }} id="settings-guide-panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">先確認這頁會處理什麼</h2>
            <p className="panel-copy">這裡只處理模型與工作台設定，不直接改案件內容、資料或分析結果。</p>
          </div>
        </div>
        <div className="summary-grid">
          <div className="section-card">
            <h4>這裡不會替你處理什麼</h4>
            <ul className="list-content">
              <li>不會在這一頁直接送出分析或補件。</li>
              <li>若只是要繼續案件工作，先回案件頁、資料與證據或結果與報告。</li>
              <li>示範工作台規則只影響示範帳號，不會改動正式案件內容。</li>
            </ul>
          </div>
          <div className="section-card">
            <h4>目前角色</h4>
              <p className="content-block">
                {sessionResolved
                  ? role === "owner"
                  ? `你目前是${labelForMembershipRole(role)}，因此同時看得到${SURFACE_LABELS.firmSettings}與${SURFACE_LABELS.personalProviderSettings}。`
                  : role === "consultant"
                    ? `你目前是${labelForMembershipRole(role)}，因此只能修改自己的${SURFACE_LABELS.personalProviderSettings}。`
                    : "目前還在確認登入身份。"
                : "正在確認目前身份..."}
              </p>
          </div>
        </div>
      </section>

      {providerVisibility.showFirmSettings ? <SettingsFirmProviderPanel /> : null}
      {providerVisibility.showPersonalSettings ? (
        <SettingsPersonalProviderPanel membershipRole={role || "consultant"} />
      ) : null}

      <div className="detail-grid">
        <div className="detail-stack">
          <section className="panel" id="preference-panel">
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
                  <option value="en">英文（測試中）</option>
                </select>
                <small>目前正式頁面仍以繁體中文為主，英文選項先保存你的語言偏好。</small>
              </div>

              <div className="field">
                <label htmlFor="settings-theme">主題模式</label>
                <select
                  id="settings-theme"
                  value={draft.themePreference}
                  onChange={(event) =>
                    updateDraft("themePreference", event.target.value as WorkbenchSettings["themePreference"])
                  }
                >
                  {THEME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small>
                  {THEME_OPTIONS.find((option) => option.value === draft.themePreference)?.description}
                </small>
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

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">本機顧問署名</h2>
                <p className="panel-copy">這個署名只保存在目前瀏覽器；之後在採納回饋與先例治理時，系統會寫回是由誰做了這次判斷。</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="settings-operator-display-name">顧問署名</label>
                <input
                  id="settings-operator-display-name"
                  value={operatorDraft}
                  onChange={(event) => setOperatorDraft(event.target.value)}
                  placeholder="例如：王顧問"
                  maxLength={120}
                />
                <small>先用輕量署名支援共享判斷的歸屬記錄，不等於正式帳號或權限系統。</small>
              </div>

              <div className="setting-note-card">
                <h3>這一輪的邊界</h3>
                <p className="content-block">
                  本機顧問署名仍只處理歸屬記錄；正式身份、{SURFACE_LABELS.firmSettings}、{SURFACE_LABELS.personalProviderSettings}已分流到第五階段建立的雲端帳號層。
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="detail-stack">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">統一進件入口</h2>
                <p className="panel-copy">`/new` 現在只保留一個可見進件入口，系統會依主問題與材料組成自動判讀少資訊起手、單材料起手或多來源案件。</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="setting-note-card">
                <h3>系統判讀規則</h3>
                <p className="content-block">
                  只有主問題時會以少資訊起手；加入 1 份材料時會變成單材料起手；加入 2 到 10 份混合材料時會變成多來源案件。
                </p>
              </div>

              <div className="setting-note-card">
                <h3>材料區邊界</h3>
                <p className="content-block">
                  新案件頁與後續補件都把檔案、URL、補充文字視為來源材料。單次最多 10 份，但同一案件可分批補件。
                </p>
              </div>

              <div className="setting-note-card">
                <h3>保存方式</h3>
                <p className="content-block">
                  工作台偏好與雲端身份 / 模型來源設定現在已分成不同層；一邊是個人工作習慣，一邊是可執行分析的正式運行設定。
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
            {success ? (
              <p className="success-text" role="status" aria-live="polite">
                {success}
              </p>
            ) : null}
            {saveMode === "local-fallback" ? (
              <p className="muted-text" role="status" aria-live="polite">
                目前顯示的是 local fallback 狀態，後續可再嘗試同步正式資料。
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
