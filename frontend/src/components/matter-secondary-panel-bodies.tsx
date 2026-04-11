"use client";

import Link from "next/link";

import type {
  AuditEvent,
  CaseWorldDraft,
  CaseWorldState,
  CanonicalizationCandidate,
  DecisionRecord,
  EvidenceGap,
  FollowUpLane,
  MatterWorkspace,
  OutcomeRecord,
  ProgressionLane,
} from "@/lib/types";
import {
  labelForApprovalStatus,
  labelForAuditEventType,
  labelForCaseWorldItemTitle,
  formatDisplayDate,
  normalizeCaseWorldDisplayCopy,
} from "@/lib/ui-labels";
import type {
  MatterLifecycleStatus,
  MatterWorkspaceRecord,
  MatterWorkspaceSyncState,
} from "@/lib/workbench-store";
import { buildMatterSyncFeedback } from "@/lib/workspace-persistence";

export function MatterWorldStatePanelBody({
  matterId,
  continuityStrategySummary,
  caseWorldState,
  latestCaseWorldDraft,
  worldAuthoritySummary,
  coreQuestion,
  decisionRecordCount,
  outcomeRecordCount,
  pendingApprovalCount,
  auditEventCount,
  sharedContinuitySummary,
  canonicalizationSurfaceSummary,
  openEvidenceGaps,
  recentDecisionRecords,
  recentOutcomeRecords,
  recentAuditEvents,
  canonicalizationCandidates,
  followUpLane,
  progressionLane,
}: {
  matterId: string;
  continuityStrategySummary: string;
  caseWorldState: CaseWorldState | null;
  latestCaseWorldDraft: CaseWorldDraft | null;
  worldAuthoritySummary: string;
  coreQuestion: string;
  decisionRecordCount: number;
  outcomeRecordCount: number;
  pendingApprovalCount: number;
  auditEventCount: number;
  sharedContinuitySummary: string;
  canonicalizationSurfaceSummary: string;
  openEvidenceGaps: EvidenceGap[];
  recentDecisionRecords: DecisionRecord[];
  recentOutcomeRecords: OutcomeRecord[];
  recentAuditEvents: AuditEvent[];
  canonicalizationCandidates: CanonicalizationCandidate[];
  followUpLane: FollowUpLane | null;
  progressionLane: ProgressionLane | null;
}) {
  const facts = caseWorldState?.facts ?? latestCaseWorldDraft?.facts ?? [];
  const assumptions = caseWorldState?.assumptions ?? latestCaseWorldDraft?.assumptions ?? [];

  return (
    <>
      <div className="summary-grid">
        <div className="section-card">
          <h4>連續性策略</h4>
          <p className="content-block">{continuityStrategySummary || "未設定"}</p>
        </div>
        <div className="section-card">
          <h4>案件世界狀態</h4>
          <p className="content-block">
            {caseWorldState
              ? `已完成案件世界編成｜目前共有 ${caseWorldState.active_task_ids.length} 個工作切片`
              : "目前尚未形成正式案件世界狀態。"}
          </p>
        </div>
        <div className="section-card">
          <h4>案件世界權威</h4>
          <p className="content-block">{normalizeCaseWorldDisplayCopy(worldAuthoritySummary)}</p>
        </div>
        <div className="section-card">
          <h4>案件主問題</h4>
          <p className="content-block">
            {String(
              caseWorldState?.canonical_intake_summary.problem_statement ||
                latestCaseWorldDraft?.canonical_intake_summary.problem_statement ||
                coreQuestion,
            )}
          </p>
        </div>
        <div className="section-card">
          <h4>建議下一步</h4>
          <p className="content-block">
            {caseWorldState?.next_best_actions[0] ||
              latestCaseWorldDraft?.next_best_actions[0] ||
              "目前沒有額外建議。"}
          </p>
        </div>
        <div className="section-card">
          <h4>寫回紀錄</h4>
          <p className="content-block">
            {decisionRecordCount} 筆決策寫回紀錄 / {outcomeRecordCount} 筆結果寫回紀錄
          </p>
        </div>
        <div className="section-card">
          <h4>正式核可 / 稽核</h4>
          <p className="content-block">
            {pendingApprovalCount > 0
              ? `目前有 ${pendingApprovalCount} 筆待正式核可，另有 ${auditEventCount} 筆稽核事件可回看。`
              : `目前沒有待正式核可項目；已留存 ${auditEventCount} 筆稽核事件。`}
          </p>
        </div>
        <div className="section-card">
          <h4>共享材料連續性</h4>
          <p className="content-block">{sharedContinuitySummary}</p>
        </div>
        <div className="section-card">
          <h4>重複材料確認</h4>
          <p className="content-block">{canonicalizationSurfaceSummary}</p>
        </div>
      </div>

      {caseWorldState || latestCaseWorldDraft ? (
        <div className="detail-list" style={{ marginTop: "18px" }}>
          <div className="detail-item">
            <h3>目前已確認的已知事實</h3>
            {facts.length > 0 ? (
              <ul className="list-content">
                {facts.slice(0, 5).map((item) => (
                  <li key={`${item.title}-${item.detail}`}>
                    {labelForCaseWorldItemTitle(item.title)}：{normalizeCaseWorldDisplayCopy(item.detail)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-text">目前沒有額外已知事實。</p>
            )}
          </div>
          <div className="detail-item">
            <h3>仍在沿用的假設</h3>
            {assumptions.length > 0 ? (
              <ul className="list-content">
                {assumptions.slice(0, 5).map((item) => (
                  <li key={`${item.title}-${item.detail}`}>
                    {labelForCaseWorldItemTitle(item.title)}：{normalizeCaseWorldDisplayCopy(item.detail)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-text">目前沒有額外假設。</p>
            )}
          </div>
          <div className="detail-item">
            <h3>目前證據缺口</h3>
            {openEvidenceGaps.length > 0 ? (
              <ul className="list-content">
                {openEvidenceGaps.map((item) => (
                  <li key={item.id}>
                    {item.title}：{item.description}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-text">目前沒有高優先證據缺口。</p>
            )}
          </div>
          {caseWorldState?.last_supplement_summary ? (
            <div className="detail-item">
              <h3>最近案件世界更新</h3>
              <p className="content-block">
                這個案件世界最近一次補件先更新了案件世界狀態：
                {normalizeCaseWorldDisplayCopy(caseWorldState.last_supplement_summary)}
              </p>
            </div>
          ) : null}
          <div className="detail-item">
            <h3>最近決策 / 結果寫回</h3>
            {recentDecisionRecords.length > 0 || recentOutcomeRecords.length > 0 ? (
              <ul className="list-content">
                {recentDecisionRecords.map((item) => (
                  <li key={item.id}>決策：{item.decision_summary}</li>
                ))}
                {recentOutcomeRecords.map((item) => (
                  <li key={item.id}>結果：{item.summary}</li>
                ))}
              </ul>
            ) : (
              <p className="empty-text">目前還沒有可回看的寫回紀錄。</p>
            )}
          </div>
          <div className="detail-item">
            <h3>最近正式核可 / 稽核</h3>
            {recentAuditEvents.length > 0 ? (
              <ul className="list-content">
                {recentAuditEvents.map((item) => (
                  <li key={item.id}>
                    {labelForAuditEventType(item.event_type)}｜{item.summary}
                    {item.approval_status ? `｜${labelForApprovalStatus(item.approval_status)}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-text">目前還沒有額外的寫回 / 核可稽核事件。</p>
            )}
          </div>
          {canonicalizationCandidates.length > 0 ? (
            <div className="detail-item">
              <h3>需確認是否同一份材料</h3>
              <ul className="list-content">
                {canonicalizationCandidates.map((item) => (
                  <li key={item.review_key}>
                    {item.consultant_summary}
                    <div style={{ marginTop: "8px" }}>
                      <Link
                        className="back-link"
                        href={`/matters/${matterId}/artifact-evidence#evidence-duplicate-review`}
                      >
                        到來源 / 證據工作面確認這組材料
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {followUpLane ? (
            <div className="detail-item">
              <h3>建議 / 風險 / 行動延續</h3>
              <div className="summary-grid">
                <div className="section-card">
                  <h4>建議延續</h4>
                  {followUpLane.recommendation_changes.length > 0 ? (
                    <ul className="list-content">
                      {followUpLane.recommendation_changes.slice(0, 3).map((item) => (
                        <li key={`${item.kind}-${item.title}`}>{item.title}：{item.summary}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-text">目前沒有額外的建議延續摘要。</p>
                  )}
                </div>
                <div className="section-card">
                  <h4>風險變化</h4>
                  {followUpLane.risk_changes.length > 0 ? (
                    <ul className="list-content">
                      {followUpLane.risk_changes.slice(0, 3).map((item) => (
                        <li key={`${item.kind}-${item.title}`}>{item.title}：{item.summary}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-text">目前沒有額外的風險變化摘要。</p>
                  )}
                </div>
                <div className="section-card">
                  <h4>行動延續</h4>
                  {followUpLane.action_changes.length > 0 ? (
                    <ul className="list-content">
                      {followUpLane.action_changes.slice(0, 3).map((item) => (
                        <li key={`${item.kind}-${item.title}`}>{item.title}：{item.summary}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-text">目前沒有額外的行動延續摘要。</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
          {progressionLane ? (
            <div className="detail-item">
              <h3>推進延續</h3>
              <div className="summary-grid">
                <div className="section-card">
                  <h4>最近推進</h4>
                  <p className="content-block">
                    {progressionLane.latest_progression?.summary || "目前還沒有新的推進更新。"}
                  </p>
                </div>
                <div className="section-card">
                  <h4>行動 / 結果摘要</h4>
                  <ul className="list-content">
                    {progressionLane.what_changed.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="section-card">
                  <h4>下一步建議</h4>
                  <p className="content-block">
                    {progressionLane.next_progression_actions[0] || "回案件工作面補一筆推進更新。"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="empty-text">目前尚未形成 case world draft。</p>
      )}
    </>
  );
}

export function MatterSettingsPanelBody({
  draftTitle,
  draftStatus,
  draftSummary,
  onDraftTitleChange,
  onDraftStatusChange,
  onDraftSummaryChange,
  onSave,
  saveMessage,
  saveTone,
  fallbackRecord,
  matterSyncState,
  fallbackDiffItems,
  isResyncing,
  onResync,
  onDiscardLocalFallback,
}: {
  draftTitle: string;
  draftStatus: MatterLifecycleStatus;
  draftSummary: string;
  onDraftTitleChange: (value: string) => void;
  onDraftStatusChange: (value: MatterLifecycleStatus) => void;
  onDraftSummaryChange: (value: string) => void;
  onSave: () => void;
  saveMessage: string | null;
  saveTone: "success" | "error" | "warning" | null;
  fallbackRecord: MatterWorkspaceRecord | null;
  matterSyncState: MatterWorkspaceSyncState | null;
  fallbackDiffItems: Array<{ label: string; remote: string; local: string }>;
  isResyncing: boolean;
  onResync: () => void;
  onDiscardLocalFallback: () => void;
}) {
  return (
    <>
      <div className="form-grid">
        <div className="field-grid">
          <div className="field">
            <label htmlFor="matter-title">案件名稱</label>
            <input
              id="matter-title"
              value={draftTitle}
              onChange={(event) => onDraftTitleChange(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="matter-status">狀態</label>
            <select
              id="matter-status"
              value={draftStatus}
              onChange={(event) => onDraftStatusChange(event.target.value as MatterLifecycleStatus)}
            >
              <option value="active">進行中</option>
              <option value="paused">暫停</option>
              <option value="closed">已結案</option>
              <option value="archived">封存</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="matter-summary">簡短摘要</label>
          <textarea
            id="matter-summary"
            value={draftSummary}
            onChange={(event) => onDraftSummaryChange(event.target.value)}
            placeholder="這個案件現在的狀態、處理範圍與下一步。"
          />
        </div>
      </div>

      <div className="button-row" style={{ marginTop: "16px" }}>
        <button className="button-primary" type="button" onClick={onSave}>
          儲存案件資訊
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
          <h4>同步狀態</h4>
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
              onClick={onResync}
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
    </>
  );
}

export function MatterBackgroundPanelBody({
  matter,
  fallbackRecord,
  agentNames,
  packNames,
  evidenceCount,
}: {
  matter: MatterWorkspace;
  fallbackRecord: MatterWorkspaceRecord | null;
  agentNames: string[];
  packNames: string[];
  evidenceCount: number;
}) {
  return (
    <div className="summary-grid">
      <div className="section-card">
        <h4>案件路徑</h4>
        <p className="content-block">{matter.summary.object_path}</p>
      </div>
      <div className="section-card">
        <h4>最近更新</h4>
        <p className="content-block">
          {formatDisplayDate(fallbackRecord?.updatedAt || matter.summary.latest_updated_at)}
        </p>
      </div>
      <div className="section-card">
        <h4>關聯代理</h4>
        <p className="content-block">
          {agentNames.length > 0 ? agentNames.slice(0, 5).join("、") : "目前尚未顯示代理。"}
        </p>
      </div>
      <div className="section-card">
        <h4>關聯模組包</h4>
        <p className="content-block">
          {packNames.length > 0 ? packNames.slice(0, 5).join("、") : "目前尚未顯示模組包。"}
        </p>
      </div>
      <div className="section-card">
        <h4>來源 / 證據</h4>
        <p className="content-block">
          {matter.summary.source_material_count} 份來源，{evidenceCount} 則證據。
        </p>
      </div>
      <div className="section-card">
        <h4>交付物 / 工作紀錄</h4>
        <p className="content-block">
          {matter.summary.deliverable_count} 份交付物，{matter.summary.total_task_count} 筆工作紀錄。
        </p>
      </div>
    </div>
  );
}
