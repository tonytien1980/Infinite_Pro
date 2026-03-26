"use client";

import { useEffect, useState } from "react";

import { buildWorkbenchPreferenceFeedback, persistWorkbenchPreferences } from "@/lib/workbench-persistence";
import {
  DEFAULT_WORKBENCH_SETTINGS,
  type WorkbenchSettings,
  useWorkbenchSettings,
} from "@/lib/workbench-store";

const HISTORY_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export function SettingsPagePanel() {
  const [settings, setSettings] = useWorkbenchSettings();
  const [draft, setDraft] = useState<WorkbenchSettings>(settings);
  const [success, setSuccess] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState<"remote" | "local-fallback" | null>(null);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

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

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">系統設定</span>
        <h1 className="page-title">系統設定</h1>
        <p className="page-subtitle">
          管理目前單人版工作台的顯示偏好、建立新案件預設與歷史列表行為。
        </p>
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
