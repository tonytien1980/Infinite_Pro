"use client";

import Link from "next/link";

import { describeRuntimeMaterialHandling } from "@/lib/intake";
import type {
  ArtifactEvidenceChain,
  ArtifactEvidenceMaterial,
  CanonicalizationCandidate,
  CanonicalizationSummary,
  ContinuationSurface,
  FollowUpLane,
  ProgressionLane,
  RetrievalProvenance,
  TaskListItem,
} from "@/lib/types";
import {
  labelForCanonicalizationMatchBasis,
  labelForCanonicalizationReviewStatus,
  formatFileSize,
  formatDisplayDate,
  labelForEvidenceStrength,
  labelForEvidenceType,
  labelForFileExtension,
  labelForPresenceState,
  labelForRetentionPolicy,
  labelForRetentionState,
  labelForRetrievalSupportKind,
  labelForSourceIngestStrategy,
  labelForSourceType,
  labelForStorageAvailability,
  labelForTaskStatus,
} from "@/lib/ui-labels";

type EvidenceRemediationContext =
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

function buildEvidenceIssueDiagnostic({
  evidenceType,
  workflowLayer,
  updateGoal,
}: {
  evidenceType: string;
  workflowLayer: string | null | undefined;
  updateGoal?: string | null;
}) {
  const isIngestIssue =
    evidenceType === "source_ingestion_issue" || evidenceType === "uploaded_file_ingestion_issue";
  const isUnparsed =
    evidenceType === "source_unparsed" || evidenceType === "uploaded_file_unparsed";

  if (!isIngestIssue && !isUnparsed) {
    return null;
  }

  const laneImpact =
    workflowLayer === "checkpoint"
      ? updateGoal
        ? `這會直接影響這輪後續更新想補的缺口：${updateGoal}`
        : "這會直接影響這輪後續更新能不能站穩。"
      : workflowLayer === "progression"
        ? updateGoal
          ? `這會直接影響這輪 continuous 想驗證的 action / outcome：${updateGoal}`
          : "這會直接影響這輪 continuous 判斷能不能續推。"
        : "先把它當成限制提示，而不是正式內容證據。";

  if (isIngestIssue) {
    return {
      diagnosticLabel: "來源匯入異常",
      usableScopeLabel: "目前不可當正式內容證據",
      usableScopeDetail: "只能視為問題提示，不能直接當成可正式引用的證據。",
      guidance: `若你還需要它，建議補文字版、可讀 URL 或人工摘要，再回主線續推。${laneImpact}`,
    };
  }

  return {
    diagnosticLabel: "來源仍待解析",
    usableScopeLabel: "目前不可先當正文引用",
    usableScopeDetail:
      "現在不能先假設已成功抽出正文；若後續仍只停在 pending / metadata-only，仍需補替代材料。",
    guidance: `若後續仍只停在 pending / metadata-only，建議補文字版、可讀 URL 或摘要。${laneImpact}`,
  };
}

function RetrievalProvenanceBlock({
  provenance,
}: {
  provenance: RetrievalProvenance | null;
}) {
  if (!provenance) {
    return null;
  }

  return (
    <div style={{ marginTop: "12px" }}>
      <h3>{labelForRetrievalSupportKind(provenance.support_kind)}</h3>
      <div className="meta-row">
        {provenance.source_document_title ? <span>{provenance.source_document_title}</span> : null}
        {provenance.locator_label ? <span>{provenance.locator_label}</span> : null}
        {provenance.support_level ? <span>支援層級：{provenance.support_level}</span> : null}
        {provenance.usable_scope ? <span>可用範圍：{provenance.usable_scope}</span> : null}
      </div>
      {provenance.excerpt_text ? (
        <p className="content-block">{provenance.excerpt_text}</p>
      ) : provenance.preview_text ? (
        <p className="muted-text">{provenance.preview_text}</p>
      ) : null}
    </div>
  );
}

export function EvidenceDuplicateReviewPanelBody({
  canonicalizationSummary,
  canonicalizationCandidates,
  canonicalizationMessage,
  canonicalizationError,
  resolvingCanonicalizationKey,
  onResolveCanonicalization,
}: {
  canonicalizationSummary: CanonicalizationSummary | null;
  canonicalizationCandidates: CanonicalizationCandidate[];
  canonicalizationMessage: string | null;
  canonicalizationError: string | null;
  resolvingCanonicalizationKey: string | null;
  onResolveCanonicalization: (
    reviewKey: string,
    resolution: "human_confirmed_canonical_row" | "keep_separate" | "split",
    successMessage: string,
  ) => Promise<void> | void;
}) {
  return (
    <>
      <div className="summary-grid">
        <div className="section-card">
          <h4>目前狀態</h4>
          <p className="content-block">
            {canonicalizationSummary?.summary || "目前沒有待處理的重複材料候選。"}
          </p>
        </div>
        <div className="section-card">
          <h4>待人工確認</h4>
          <p className="content-block">{canonicalizationSummary?.pending_review_count ?? 0} 組</p>
        </div>
        <div className="section-card">
          <h4>已掛回同一條材料鏈</h4>
          <p className="content-block">
            {canonicalizationSummary?.human_confirmed_count ?? 0} 組
          </p>
        </div>
        <div className="section-card">
          <h4>已保留分開 / 拆回分開</h4>
          <p className="content-block">
            {(canonicalizationSummary?.kept_separate_count ?? 0) +
              (canonicalizationSummary?.split_count ?? 0)}{" "}
            組
          </p>
        </div>
      </div>

      {canonicalizationMessage ? (
        <p className="success-text" style={{ marginTop: "16px" }}>
          {canonicalizationMessage}
        </p>
      ) : null}
      {canonicalizationError ? (
        <p className="error-text" style={{ marginTop: "16px" }}>
          {canonicalizationError}
        </p>
      ) : null}

      <div className="detail-list" style={{ marginTop: "18px" }}>
        {canonicalizationCandidates.length > 0 ? (
          canonicalizationCandidates.map((item) => {
            const isResolving = resolvingCanonicalizationKey === item.review_key;
            const canConfirmMerge = item.review_status !== "human_confirmed_canonical_row";
            const canKeepSeparate = item.review_status === "pending_review";
            const canSplit = item.review_status === "human_confirmed_canonical_row";

            return (
              <div className="detail-item" key={item.review_key}>
                <div className="meta-row">
                  <span className="pill">
                    {labelForCanonicalizationReviewStatus(item.review_status)}
                  </span>
                  <span>{labelForCanonicalizationMatchBasis(item.match_basis)}</span>
                  <span>{item.confidence_level === "high" ? "高信心候選" : "中信心候選"}</span>
                  <span>影響 {item.task_count} 個 work slices</span>
                </div>
                <h3>{item.canonical_title || "未標示來源材料"}</h3>
                <p className="content-block">{item.consultant_summary}</p>
                <div className="meta-row">
                  <span>{item.candidate_count} 份近似材料</span>
                  <span>canonical owner：案件世界</span>
                  <span>task 只保留工作切片參與</span>
                </div>
                {item.affected_task_titles.length > 0 ? (
                  <p className="muted-text">
                    <strong>涉及工作：</strong>
                    {item.affected_task_titles.join("、")}
                  </p>
                ) : null}
                {item.resolution_note ? (
                  <p className="muted-text">
                    <strong>最近判斷：</strong>
                    {item.resolution_note}
                  </p>
                ) : null}
                <div className="button-row" style={{ marginTop: "12px" }}>
                  {canConfirmMerge ? (
                    <button
                      className="button-secondary"
                      type="button"
                      disabled={isResolving}
                      onClick={() =>
                        void onResolveCanonicalization(
                          item.review_key,
                          "human_confirmed_canonical_row",
                          "這組近似材料已確認掛回同一條正式材料鏈。",
                        )
                      }
                    >
                      {isResolving ? "處理中..." : "確認掛回同一份材料"}
                    </button>
                  ) : null}
                  {canKeepSeparate ? (
                    <button
                      className="button-secondary"
                      type="button"
                      disabled={isResolving}
                      onClick={() =>
                        void onResolveCanonicalization(
                          item.review_key,
                          "keep_separate",
                          "這組近似材料已先保留分開。",
                        )
                      }
                    >
                      {isResolving ? "處理中..." : "先保留分開"}
                    </button>
                  ) : null}
                  {canSplit ? (
                    <button
                      className="button-secondary"
                      type="button"
                      disabled={isResolving}
                      onClick={() =>
                        void onResolveCanonicalization(
                          item.review_key,
                          "split",
                          "這組材料已拆回分開，不再共用同一條正式材料鏈。",
                        )
                      }
                    >
                      {isResolving ? "處理中..." : "改回分開"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <p className="empty-text">目前沒有待處理的重複材料候選。</p>
        )}
      </div>
    </>
  );
}

export function EvidenceMaterialsPanelBody({
  sourceMaterialCards,
  remediationContext,
}: {
  sourceMaterialCards: ArtifactEvidenceMaterial[];
  remediationContext: EvidenceRemediationContext;
}) {
  return (
    <>
      <p className="panel-copy" style={{ marginBottom: "16px" }}>
        若卡片上仍顯示某筆 task 連結，那是相容層入口，方便你回到相關工作紀錄；不代表這份材料只屬於那筆 task。
      </p>
      <div className="detail-list">
        {sourceMaterialCards.length > 0 ? (
          sourceMaterialCards.map((item) => {
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
              <div className="detail-item" key={item.object_id}>
                <div className="meta-row">
                  <span className="pill">{item.role_label}</span>
                  <span>{labelForPresenceState(item.presence_state)}</span>
                  <span className={`intake-status-pill intake-status-${handling.status}`}>
                    {handling.statusLabel}
                  </span>
                  <span>{formatDisplayDate(item.created_at)}</span>
                </div>
                <h3>{item.title}</h3>
                <p className="muted-text">
                  {labelForSourceType(item.source_type || "manual_input")}
                  {item.file_extension ? `｜${labelForFileExtension(item.file_extension)}` : ""}
                  {item.file_size ? `｜${formatFileSize(item.file_size)}` : ""}
                  {item.source_ref ? `｜${item.source_ref}` : ""}
                </p>
                <p className="content-block">{item.summary || "目前沒有可顯示的來源摘要。"}</p>
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
                <Link className="back-link" href="#evidence-supplement">
                  回補件入口處理這份材料
                </Link>
                <div className="meta-row">
                  <span>{item.linked_evidence_count} 則已連結證據</span>
                  <span>{item.linked_output_count} 項已連結輸出</span>
                  {item.participation_task_count > 1 ? (
                    <span>共享於 {item.participation_task_count} 個 work slices</span>
                  ) : null}
                  {item.mapping_mode === "explicit_mapping" &&
                  item.canonical_owner_scope === "world_canonical" ? (
                    <span>案件世界正式鏈</span>
                  ) : null}
                  {item.mapping_mode === "compatibility_task_ref" ? <span>相容層 task ref</span> : null}
                  <span>{labelForSourceIngestStrategy(item.ingest_strategy)}</span>
                  <span>{labelForStorageAvailability(item.availability_state)}</span>
                </div>
                <div className="meta-row">
                  <span>{labelForRetentionPolicy(item.retention_policy)}</span>
                  <span>{labelForRetentionState(item.purge_at)}</span>
                  {item.purge_at ? <span>預計清理：{formatDisplayDate(item.purge_at)}</span> : null}
                </div>
                <Link className="back-link" href={`/tasks/${item.task_id}`}>
                  打開來源工作紀錄：{item.task_title}
                </Link>
              </div>
            );
          })
        ) : (
          <p className="empty-text">目前還沒有可顯示的來源材料。</p>
        )}
      </div>
    </>
  );
}

export function EvidenceArtifactsPanelBody({
  artifactCards,
}: {
  artifactCards: ArtifactEvidenceMaterial[];
}) {
  return (
    <div className="detail-list">
      {artifactCards.length > 0 ? (
        artifactCards.map((item) => (
          <div className="detail-item" key={item.object_id}>
            <div className="meta-row">
              <span className="pill">{item.role_label}</span>
              <span>{labelForPresenceState(item.presence_state)}</span>
              <span>{formatDisplayDate(item.created_at)}</span>
            </div>
            <h3>{item.title}</h3>
            <p className="content-block">{item.summary || "目前沒有額外工作物件摘要。"}</p>
            <div className="meta-row">
              <span>{item.linked_evidence_count} 則已連結證據</span>
              <span>{item.linked_output_count} 項已連結輸出</span>
              {item.participation_task_count > 1 ? (
                <span>共享於 {item.participation_task_count} 個 work slices</span>
              ) : null}
              {item.mapping_mode === "explicit_mapping" &&
              item.canonical_owner_scope === "world_canonical" ? (
                <span>案件世界正式鏈</span>
              ) : null}
              {item.mapping_mode === "compatibility_task_ref" ? <span>相容層 task ref</span> : null}
            </div>
            <Link className="back-link" href={`/tasks/${item.task_id}`}>
              打開來源工作紀錄：{item.task_title}
            </Link>
          </div>
        ))
      ) : (
        <p className="empty-text">目前還沒有可顯示的工作物件。</p>
      )}
    </div>
  );
}

export function EvidenceChainsPanelBody({
  evidenceChains,
  continuationSurface,
  updateGoal,
}: {
  evidenceChains: ArtifactEvidenceChain[];
  continuationSurface: ContinuationSurface | null;
  updateGoal?: string;
}) {
  return (
    <div className="detail-list">
      {evidenceChains.length > 0 ? (
        evidenceChains.map((item) => {
          const evidenceIssueDiagnostic = buildEvidenceIssueDiagnostic({
            evidenceType: item.evidence.evidence_type,
            workflowLayer: continuationSurface?.workflow_layer,
            updateGoal,
          });

          return (
            <div className="detail-item" key={item.evidence.id}>
              <div className="meta-row">
                <span className="pill">{labelForEvidenceType(item.evidence.evidence_type)}</span>
                <span>{labelForEvidenceStrength(item.strength_label)}</span>
                <span>{item.evidence.reliability_level}</span>
                <span>{formatDisplayDate(item.evidence.created_at)}</span>
              </div>
              <h3>{item.evidence.title}</h3>
              <p className="muted-text">
                {item.source_material_title ? `來源材料：${item.source_material_title}` : "尚未連到來源材料"}
                {"｜"}
                {item.artifact_title ? `工作物件：${item.artifact_title}` : "尚未連到工作物件"}
              </p>
              <p className="content-block">{item.evidence.excerpt_or_summary}</p>
              <RetrievalProvenanceBlock provenance={item.evidence.retrieval_provenance} />
              <p className="muted-text">{item.sufficiency_note}</p>
              {evidenceIssueDiagnostic ? (
                <>
                  <p className="muted-text">
                    <strong>問題類型：</strong>
                    {evidenceIssueDiagnostic.diagnosticLabel}
                  </p>
                  <p className="muted-text">
                    <strong>目前可用範圍：</strong>
                    {evidenceIssueDiagnostic.usableScopeLabel}｜
                    {evidenceIssueDiagnostic.usableScopeDetail}
                  </p>
                  <p className="muted-text">
                    <strong>補救導引：</strong>
                    {evidenceIssueDiagnostic.guidance}
                  </p>
                </>
              ) : null}

              {item.linked_recommendations.length > 0 ? (
                <div style={{ marginTop: "12px" }}>
                  <h3>支撐的建議</h3>
                  <ul className="list-content">
                    {item.linked_recommendations.map((target) => (
                      <li key={`${item.evidence.id}-recommendation-${target.target_id}`}>
                        {target.title}
                        {target.note ? `｜${target.note}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {item.linked_risks.length > 0 ? (
                <div style={{ marginTop: "12px" }}>
                  <h3>支撐的風險</h3>
                  <ul className="list-content">
                    {item.linked_risks.map((target) => (
                      <li key={`${item.evidence.id}-risk-${target.target_id}`}>
                        {target.title}
                        {target.note ? `｜${target.note}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {item.linked_action_items.length > 0 ? (
                <div style={{ marginTop: "12px" }}>
                  <h3>支撐的行動項目</h3>
                  <ul className="list-content">
                    {item.linked_action_items.map((target) => (
                      <li key={`${item.evidence.id}-action-${target.target_id}`}>
                        {target.title}
                        {target.note ? `｜${target.note}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {item.linked_deliverables.length > 0 ? (
                <div style={{ marginTop: "12px" }}>
                  <h3>用於交付物</h3>
                  <ul className="list-content">
                    {item.linked_deliverables.map((target) => (
                      <li key={`${item.evidence.id}-deliverable-${target.target_id}`}>
                        {target.target_id ? (
                          <Link className="back-link" href={`/deliverables/${target.target_id}`}>
                            {target.title}
                          </Link>
                        ) : (
                          target.title
                        )}
                        {target.note ? `｜${target.note}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <Link className="back-link" href={`/tasks/${item.evidence.task_id}`}>
                打開來源工作紀錄：{item.task_title}
              </Link>
            </div>
          );
        })
      ) : (
        <p className="empty-text">目前還沒有可顯示的證據支撐鏈。</p>
      )}
    </div>
  );
}

export function EvidenceRelatedTasksPanelBody({
  relatedTasks,
}: {
  relatedTasks: TaskListItem[];
}) {
  return (
    <div className="history-list">
      {relatedTasks.length > 0 ? (
        relatedTasks.map((task) => (
          <Link href={`/tasks/${task.id}`} key={task.id} className="history-item">
            <div className="meta-row">
              <span className="pill">{labelForTaskStatus(task.status)}</span>
              <span>{task.evidence_count} 則證據</span>
              <span>{task.deliverable_count} 份交付物</span>
            </div>
            <h3>{task.title}</h3>
            <p className="muted-text">
              {task.decision_context_title || task.description || "目前沒有可顯示的決策問題。"}
            </p>
          </Link>
        ))
      ) : (
        <p className="empty-text">目前沒有可顯示的相關工作紀錄。</p>
      )}
    </div>
  );
}
