"use client";

import Link from "next/link";

import { buildTaskListWorkspaceSummary } from "@/lib/advisory-workflow";
import { describeRuntimeMaterialHandling } from "@/lib/intake";
import { truncateText } from "@/lib/text-format";
import type {
  MatterContentRevision,
  MatterMaterialSummary,
  MatterWorkspace,
  MatterWorkspaceContentSections,
  TaskListItem,
} from "@/lib/types";
import {
  formatFileSize,
  formatDisplayDate,
  labelForDeliverableClass,
  labelForFileExtension,
  labelForRetentionPolicy,
  labelForRetentionState,
  labelForStorageAvailability,
  labelForTaskStatus,
} from "@/lib/ui-labels";
import type {
  MatterWorkspaceRecord,
  MatterWorkspaceSyncState,
} from "@/lib/workbench-store";
import { buildMatterSyncFeedback } from "@/lib/workspace-persistence";

type MatterDeferredTab = "decision" | "evidence" | "deliverables" | "history";

const MATTER_TAB_PANEL_IDS: Record<MatterDeferredTab, string> = {
  decision: "matter-tabpanel-decision",
  evidence: "matter-tabpanel-evidence",
  deliverables: "matter-tabpanel-deliverables",
  history: "matter-tabpanel-history",
};

type RemediationContext =
  | {
      lane: "follow_up";
      updateGoal?: string;
      nextAction?: string;
    }
  | {
      lane: "continuous";
      updateGoal?: string;
      nextAction?: string;
    }
  | {
      lane: "one_off";
    }
  | {
      lane: "workspace";
    };

function labelForContentRevisionSource(source: string) {
  if (source === "consultant_manual_edit") {
    return "顧問手動編修";
  }
  if (source === "host_writeback") {
    return "Host 寫回";
  }
  if (source === "rollback") {
    return "回退還原";
  }
  return "系統修訂";
}

function labelForContentDiffChangeType(changeType: string) {
  if (changeType === "added") {
    return "新增";
  }
  if (changeType === "removed") {
    return "移除";
  }
  return "更新";
}

export function MatterNonOverviewTabs({
  activeTab,
  matterId,
  matter,
  draftContentSections,
  onCoreQuestionChange,
  onAnalysisFocusChange,
  onConstraintsAndRisksChange,
  onNextStepsChange,
  onSave,
  saveMessage,
  saveTone,
  fallbackRecord,
  matterSyncState,
  fallbackDiffItems,
  isResyncing,
  onResyncMatterFallback,
  onDiscardLocalFallback,
  coreQuestion,
  analysisFocusItems,
  constraintItems,
  nextStepItems,
  rollingBackRevisionId,
  onRollbackRevision,
  evidenceCount,
  visibleMaterials,
  remediationContext,
  visibleHistoryItems,
}: {
  activeTab: MatterDeferredTab;
  matterId: string;
  matter: MatterWorkspace;
  draftContentSections: MatterWorkspaceContentSections;
  onCoreQuestionChange: (value: string) => void;
  onAnalysisFocusChange: (value: string) => void;
  onConstraintsAndRisksChange: (value: string) => void;
  onNextStepsChange: (value: string) => void;
  onSave: () => void;
  saveMessage: string | null;
  saveTone: "success" | "error" | "warning" | null;
  fallbackRecord: MatterWorkspaceRecord | null;
  matterSyncState: MatterWorkspaceSyncState | null;
  fallbackDiffItems: Array<{ label: string; remote: string; local: string }>;
  isResyncing: boolean;
  onResyncMatterFallback: () => void;
  onDiscardLocalFallback: () => void;
  coreQuestion: string;
  analysisFocusItems: string[];
  constraintItems: string[];
  nextStepItems: string[];
  rollingBackRevisionId: string | null;
  onRollbackRevision: (revision: MatterContentRevision) => void;
  evidenceCount: number;
  visibleMaterials: MatterMaterialSummary[];
  remediationContext: RemediationContext;
  visibleHistoryItems: TaskListItem[];
}) {
  if (activeTab === "decision") {
    return (
      <div
        className="detail-grid"
        role="tabpanel"
        id={MATTER_TAB_PANEL_IDS.decision}
        aria-labelledby="matter-tab-decision"
      >
        <div className="detail-stack">
          <section className="panel section-anchor" id="matter-evidence-overview">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">核心問題</h2>
                <p className="panel-copy">
                  把案件正文穩定寫回正式資料，讓核心問題、分析焦點、限制與下一步不再只停在即時摘要。
                </p>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="matter-core-question">目前核心問題</label>
                <textarea
                  id="matter-core-question"
                  value={draftContentSections.core_question}
                  onChange={(event) => onCoreQuestionChange(event.target.value)}
                  placeholder="這個案件目前真正要回答的核心判斷是什麼？"
                />
              </div>
              <div className="field">
                <label htmlFor="matter-analysis-focus">分析焦點</label>
                <textarea
                  id="matter-analysis-focus"
                  value={draftContentSections.analysis_focus}
                  onChange={(event) => onAnalysisFocusChange(event.target.value)}
                  placeholder="可用換行列出分析焦點、工作流與重要 lens。"
                />
              </div>
              <div className="field">
                <label htmlFor="matter-constraints-risks">限制 / 風險</label>
                <textarea
                  id="matter-constraints-risks"
                  value={draftContentSections.constraints_and_risks}
                  onChange={(event) => onConstraintsAndRisksChange(event.target.value)}
                  placeholder="目前最需要留意的限制、待補與風險。"
                />
              </div>
              <div className="field">
                <label htmlFor="matter-next-steps">下一步建議</label>
                <textarea
                  id="matter-next-steps"
                  value={draftContentSections.next_steps}
                  onChange={(event) => onNextStepsChange(event.target.value)}
                  placeholder="下一步建議、補件方向、應回看的工作面。"
                />
              </div>
            </div>

            <div className="button-row" style={{ marginTop: "16px" }}>
              <button className="button-primary" type="button" onClick={onSave}>
                儲存案件正文
              </button>
            </div>
            {saveMessage ? (
              <p
                className={
                  saveTone === "error"
                    ? "error-text"
                    : saveTone === "success"
                      ? "success-text"
                      : "muted-text"
                }
                role={saveTone === "error" ? "alert" : "status"}
                aria-live={saveTone === "error" ? "assertive" : "polite"}
              >
                {saveMessage}
              </p>
            ) : null}
            {fallbackRecord && matterSyncState ? (
              <div className="section-card" style={{ marginTop: "12px" }}>
                <h4>待同步狀態</h4>
                <p className="content-block">{buildMatterSyncFeedback(matterSyncState)}</p>
                {fallbackDiffItems.length > 0 && matterSyncState === "needs_review" ? (
                  <ul className="list-content" style={{ marginTop: "12px" }}>
                    {fallbackDiffItems.slice(0, 5).map((item) => (
                      <li key={item.label}>
                        {item.label}：遠端「{item.remote}」／本機「{item.local}」
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="button-row" style={{ marginTop: "12px" }}>
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={onResyncMatterFallback}
                    disabled={isResyncing}
                  >
                    {isResyncing
                      ? "同步中..."
                      : matterSyncState === "needs_review"
                        ? "以本機內容重新同步"
                        : "重新同步正式資料"}
                  </button>
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={onDiscardLocalFallback}
                    disabled={isResyncing}
                  >
                    放棄本機暫存
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <div className="detail-stack">
          <section className="panel section-anchor" id="matter-deliverables-overview">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">決策脈絡</h2>
                <p className="panel-copy">用最近幾筆 decision trajectory 回看這個案件是怎麼推進過來的。</p>
              </div>
            </div>

            <div className="detail-list">
              <div className="detail-item">
                <h3>目前核心問題</h3>
                <p className="content-block">{coreQuestion}</p>
              </div>
              <div className="detail-item">
                <h3>分析焦點</h3>
                {analysisFocusItems.length > 0 ? (
                  <ul className="list-content">
                    {analysisFocusItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-text">目前還沒有整理好的分析焦點。</p>
                )}
              </div>
              <div className="detail-item">
                <h3>限制 / 風險</h3>
                {constraintItems.length > 0 ? (
                  <ul className="list-content">
                    {constraintItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-text">目前還沒有明確限制或風險。</p>
                )}
              </div>
              <div className="detail-item">
                <h3>下一步建議</h3>
                {nextStepItems.length > 0 ? (
                  <ul className="list-content">
                    {nextStepItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-text">目前沒有額外的下一步建議。</p>
                )}
              </div>
              {matter.decision_trajectory.length > 0 ? (
                matter.decision_trajectory.map((item) => (
                  <div
                    className="detail-item"
                    key={`${item.task_id}-${item.decision_context_id ?? item.decision_context_title}`}
                  >
                    <div className="meta-row">
                      <span className="pill">{labelForTaskStatus(item.task_status)}</span>
                      <span>{labelForDeliverableClass(item.deliverable_class_hint)}</span>
                      <span>{formatDisplayDate(item.updated_at)}</span>
                    </div>
                    <h3>{item.decision_context_title}</h3>
                    <p className="muted-text">{truncateText(item.judgment_to_make, 108)}</p>
                    <Link className="back-link" href={`/tasks/${item.task_id}`}>
                      進入這筆工作紀錄
                    </Link>
                  </div>
                ))
              ) : (
                <p className="empty-text">目前還沒有可顯示的決策脈絡。</p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">正文修訂</h2>
                <p className="panel-copy">這裡只追案件正文的演進、diff 與回退，不會和工作紀錄或發布歷史混在一起。</p>
              </div>
            </div>

            {fallbackRecord ? (
              <p className="muted-text">本機暫存尚未形成正式 revision；完成重新同步後，才會回到 backend 修訂歷史。</p>
            ) : null}

            {matter.content_revisions.length > 0 ? (
              <div className="detail-list">
                {matter.content_revisions.map((revision) => (
                  <div className="detail-item" key={revision.id}>
                    <div className="meta-row">
                      <span className="pill">{labelForContentRevisionSource(revision.source)}</span>
                      <span>{formatDisplayDate(revision.created_at)}</span>
                    </div>
                    <h3>{revision.revision_summary}</h3>
                    {revision.diff_summary.length > 0 ? (
                      <ul className="list-content">
                        {revision.diff_summary.map((item) => (
                          <li key={`${revision.id}-${item.section_key}`}>
                            {labelForContentDiffChangeType(item.change_type)} {item.section_label}
                            ：{item.previous_preview || "空白"} → {item.current_preview || "空白"}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted-text">這筆修訂目前沒有額外的 diff 摘要。</p>
                    )}
                    <div className="button-row" style={{ marginTop: "12px" }}>
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => void onRollbackRevision(revision)}
                        disabled={
                          Boolean(fallbackRecord) ||
                          rollingBackRevisionId === revision.id ||
                          revision.id === matter.content_revisions[0]?.id
                        }
                      >
                        {rollingBackRevisionId === revision.id ? "回退中..." : "回退到這一版"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">目前尚未建立正式正文修訂紀錄。</p>
            )}
          </section>
        </div>
      </div>
    );
  }

  if (activeTab === "evidence") {
    return (
      <div
        className="detail-grid"
        role="tabpanel"
        id={MATTER_TAB_PANEL_IDS.evidence}
        aria-labelledby="matter-tab-evidence"
      >
        <div className="detail-stack">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">來源與證據</h2>
                <p className="panel-copy">先掌握目前依據厚度、材料狀態與保留期限，再決定要不要進完整的來源與證據工作面。</p>
              </div>
              <Link className="button-secondary" href={`/matters/${matterId}/evidence`}>
                打開完整來源與證據工作面
              </Link>
            </div>

            <div className="summary-grid">
              <div className="section-card">
                <h4>已掛接來源</h4>
                <p className="content-block">{matter.summary.source_material_count} 份來源材料</p>
              </div>
              <div className="section-card">
                <h4>證據摘要</h4>
                <p className="content-block">{evidenceCount} 則正式證據</p>
              </div>
              <div className="section-card">
                <h4>是否待補</h4>
                <p className="content-block">
                  {evidenceCount < 2 || matter.summary.source_material_count === 0
                    ? "是，建議先補齊來源與證據。"
                    : "目前已有最小可用的依據厚度。"}
                </p>
              </div>
              <div className="section-card">
                <h4>補件入口</h4>
                <p className="content-block">完整整理、補件與支撐鏈回看，請進來源與證據工作面。</p>
              </div>
            </div>
          </section>
        </div>

        <div className="detail-stack">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">最近相關材料</h2>
                <p className="panel-copy">保留少量最近材料，讓你不用先回整個列表才能抓到依據主線。</p>
              </div>
            </div>
            <div className="detail-list">
              {visibleMaterials.length > 0 ? (
                visibleMaterials.map((item) => {
                  const handling = describeRuntimeMaterialHandling({
                    supportLevel: item.support_level,
                    ingestStatus: item.ingest_status,
                    ingestStrategy: item.ingest_strategy,
                    metadataOnly: item.metadata_only,
                    ingestionError: item.ingestion_error,
                    diagnosticCategory: item.diagnostic_category,
                    extractAvailability: item.extract_availability,
                    currentUsableScope: item.current_usable_scope,
                    context: remediationContext,
                  });

                  return (
                    <div className="detail-item" key={`${item.object_type}-${item.object_id}`}>
                      <div className="meta-row">
                        <span className="pill">
                          {item.object_type === "artifact" ? "工作物件" : "來源材料"}
                        </span>
                        {item.support_level ? (
                          <span className={`intake-status-pill intake-status-${handling.status}`}>
                            {handling.statusLabel}
                          </span>
                        ) : null}
                        <span>{formatDisplayDate(item.created_at)}</span>
                      </div>
                      <h3>{item.title}</h3>
                      <p className="muted-text">
                        {item.task_title}
                        {item.file_extension ? `｜${labelForFileExtension(item.file_extension)}` : ""}
                        {item.file_size ? `｜${formatFileSize(item.file_size)}` : ""}
                      </p>
                      <p className="content-block">
                        {truncateText(item.summary || "目前沒有額外摘要。", 118)}
                      </p>
                      {item.object_type !== "artifact" ? (
                        <>
                          <p className="muted-text">
                            <strong>問題類型：</strong>
                            {handling.diagnosticLabel}
                          </p>
                          <p className="muted-text">
                            <strong>可能原因：</strong>
                            {handling.likelyCauseDetail}
                          </p>
                          <p
                            className={
                              handling.status === "accepted"
                                ? "success-text"
                                : handling.status === "limited" || handling.status === "pending"
                                  ? "muted-text"
                                  : "error-text"
                            }
                          >
                            {handling.statusDetail}
                          </p>
                          <p className="muted-text">
                            <strong>目前可用範圍：</strong>
                            {handling.usableScopeLabel}｜{handling.usableScopeDetail}
                          </p>
                          <p className="muted-text">
                            <strong>會影響什麼：</strong>
                            {handling.impactDetail}
                          </p>
                          <p className="muted-text">
                            <strong>retry 判斷：</strong>
                            {handling.retryabilityLabel}｜{handling.retryabilityDetail}
                          </p>
                          <p className="muted-text">
                            <strong>建議下一步：</strong>
                            {handling.recommendedNextStep}
                          </p>
                          {handling.fallbackStrategy ? (
                            <p className="muted-text">
                              <strong>較佳替代方式：</strong>
                              {handling.fallbackStrategy}
                            </p>
                          ) : null}
                          <Link
                            className="back-link"
                            href={`/matters/${matterId}/evidence#evidence-supplement`}
                          >
                            回補件入口處理這份材料
                          </Link>
                          <div className="meta-row">
                            {item.availability_state ? (
                              <span>{labelForStorageAvailability(item.availability_state)}</span>
                            ) : null}
                            {item.retention_policy ? (
                              <span>{labelForRetentionPolicy(item.retention_policy)}</span>
                            ) : null}
                            {item.purge_at ? (
                              <span>
                                {labelForRetentionState(item.purge_at)}｜{formatDisplayDate(item.purge_at)}
                              </span>
                            ) : null}
                          </div>
                        </>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <p className="empty-text">目前還沒有可顯示的來源或證據材料。</p>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (activeTab === "deliverables") {
    return (
      <div
        className="detail-grid"
        role="tabpanel"
        id={MATTER_TAB_PANEL_IDS.deliverables}
        aria-labelledby="matter-tab-deliverables"
      >
        <div className="detail-stack">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">交付物</h2>
                <p className="panel-copy">從這裡直接進到交付物 detail workspace，不必再回純列表頁找入口。</p>
              </div>
              <Link className="button-secondary" href="/deliverables">
                查看全部交付物
              </Link>
            </div>
            <div className="detail-list">
              {matter.related_deliverables.length > 0 ? (
                matter.related_deliverables.map((item) => (
                  <div className="detail-item" key={item.deliverable_id}>
                    <div className="meta-row">
                      <span className="pill">{item.status === "final" ? "定稿" : "工作中"}</span>
                      <span>{item.version_tag}</span>
                      <span>{formatDisplayDate(item.generated_at)}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p className="muted-text">{item.task_title}</p>
                    <p className="content-block">{truncateText(item.summary, 118)}</p>
                    <div className="button-row" style={{ marginTop: "12px" }}>
                      <Link className="button-secondary" href={`/deliverables/${item.deliverable_id}`}>
                        打開交付物工作面
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-text">目前還沒有可顯示的交付物。</p>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div
      className="detail-grid"
      role="tabpanel"
      id={MATTER_TAB_PANEL_IDS.history}
      aria-labelledby="matter-tab-history"
    >
      <div className="detail-stack">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">工作紀錄</h2>
              <p className="panel-copy">這裡只保留案件內高度相關的近端活動摘要，完整整理仍回到歷史紀錄頁。</p>
            </div>
            <Link className="button-secondary" href="/history">
              查看全部歷史紀錄
            </Link>
          </div>
          <div className="detail-list">
            {visibleHistoryItems.length > 0 ? (
              visibleHistoryItems.map((task) => {
                const summary = buildTaskListWorkspaceSummary(task);

                return (
                  <article className="detail-item" key={task.id}>
                    <div className="meta-row">
                      <span className="pill">{labelForTaskStatus(task.status)}</span>
                      <span>{formatDisplayDate(task.updated_at)}</span>
                    </div>
                    <h3>{task.title}</h3>
                    <p className="workspace-object-path">{summary.objectPath}</p>
                    <p className="muted-text">{truncateText(summary.decisionContext, 92)}</p>
                    <p className="content-block">{truncateText(task.description, 118)}</p>
                    <div className="button-row" style={{ marginTop: "12px" }}>
                      <Link className="button-secondary" href={`/tasks/${task.id}`}>
                        打開工作紀錄
                      </Link>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="empty-text">目前沒有可顯示的工作紀錄。</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
