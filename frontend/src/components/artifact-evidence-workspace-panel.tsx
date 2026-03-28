"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from "react";

import {
  buildArtifactEvidenceWorkspaceView,
  buildMatterWorkspaceCard,
} from "@/lib/advisory-workflow";
import {
  getArtifactEvidenceWorkspace,
  ingestMatterSources,
  uploadMatterFiles,
} from "@/lib/api";
import type { ArtifactEvidenceWorkspace } from "@/lib/types";
import {
  formatFileSize,
  formatDisplayDate,
  labelForEngagementContinuityMode,
  labelForEvidenceStrength,
  labelForEvidenceType,
  labelForFileExtension,
  labelForPresenceState,
  labelForRetentionPolicy,
  labelForRetentionState,
  labelForSourceIngestStrategy,
  labelForSourceSupportLevel,
  labelForSourceType,
  labelForStorageAvailability,
  labelForTaskStatus,
  labelForWritebackDepth,
} from "@/lib/ui-labels";
import { WorkspaceSectionGuide } from "@/components/workspace-section-guide";

function CompactList({
  items,
  emptyText,
}: {
  items: string[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="empty-text">{emptyText}</p>;
  }

  return (
    <ul className="list-content">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function DisclosurePanel({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <details className="panel disclosure-panel section-anchor" id={id}>
      <summary className="disclosure-summary">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="panel-copy">{description}</p>
        </div>
        <span className="pill">展開</span>
      </summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}

export function ArtifactEvidenceWorkspacePanel({ matterId }: { matterId: string }) {
  const [workspace, setWorkspace] = useState<ArtifactEvidenceWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [urlsText, setUrlsText] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [supplementMessage, setSupplementMessage] = useState<string | null>(null);
  const [supplementError, setSupplementError] = useState<string | null>(null);

  async function loadWorkspace() {
    try {
      setLoading(true);
      setError(null);
      setWorkspace(await getArtifactEvidenceWorkspace(matterId));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "載入來源 / 證據工作面失敗。",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspace();
  }, [matterId]);

  const matterCard = workspace ? buildMatterWorkspaceCard(workspace.matter_summary) : null;
  const workspaceView = workspace ? buildArtifactEvidenceWorkspaceView(workspace) : null;
  const focusTask = workspace?.related_tasks[0] ?? null;
  const evidenceActionTitle =
    workspace && workspace.high_impact_gaps.length > 0
      ? "先補件，再回到主線判斷"
      : "先檢查支撐鏈，再決定往哪裡推進";
  const evidenceActionSummary =
    workspace && workspace.high_impact_gaps.length > 0
      ? "這裡最重要的不是把資料看完，而是先補齊高影響缺口，避免案件工作台或交付物在證據不足下失真。"
      : "這個工作面負責釐清來源、工作物件與證據支撐鏈。先確認支撐鏈完整度，再回案件或工作紀錄會更有效率。";
  const evidenceActionChecklist = [
    "先看充分性摘要與高影響缺口，確認這個案件現在缺的是什麼。",
    focusTask
      ? `如果要回到主線推進，焦點工作紀錄是「${focusTask.title}」。`
      : "如果要回到主線推進，先回案件工作台確認目前最重要的工作紀錄。",
    workspace && workspace.source_material_cards.length === 0
      ? "目前還沒有正式來源材料，建議先補檔案、網址或補充文字。"
      : "目前已有來源材料，接著可回看證據支撐鏈是否真的支撐得住判斷。",
  ];
  const sharedContinuitySummary =
    workspace && (workspace.source_material_cards.length > 0 || workspace.evidence_chains.length > 0)
      ? "補進來的材料與證據會優先掛回同一個案件世界，後續 task slices 可直接回看，不必再各自重傳。"
      : "目前還沒有可跨 task slices 連續使用的正式材料 / 證據。";
  const evidenceSectionGuideItems = workspace
    ? [
        {
          href: "#evidence-sufficiency",
          eyebrow: "先看缺什麼",
          title: "充分性摘要與高影響缺口",
          copy: "先判斷目前案件缺的是什麼，再決定要補件、回工作紀錄，還是去看交付物。",
          meta: workspace.sufficiency_summary,
          tone: workspace.high_impact_gaps.length > 0 ? ("warm" as const) : ("accent" as const),
        },
        {
          href: "#evidence-supplement",
          eyebrow: "真的要補時",
          title: "補件與新增來源",
          copy: "需要補檔案、網址或補充文字時，直接走這條正式補件主鏈，不要另開新的孤立工作。",
          meta: workspace.source_material_cards.length === 0 ? "目前尚無正式來源材料。" : "補件後會直接掛回同一個案件世界。",
          tone: "accent" as const,
        },
        {
          href: "#evidence-materials",
          eyebrow: "回看原始材料",
          title: "來源材料與工作物件",
          copy: "要核對材料角色、保留狀態與已連結輸出時，再展開這層詳細列表。",
          meta: `${workspace.source_material_cards.length} 份來源材料 / ${workspace.artifact_cards.length} 份工作物件`,
          tone: "default" as const,
        },
        {
          href: "#evidence-chains",
          eyebrow: "檢查支撐鏈",
          title: "證據支撐鏈",
          copy: "當你要確認某個建議、風險或交付物到底由哪些證據支撐，就往這裡下鑽。",
          meta: `${workspace.evidence_chains.length} 則證據支撐鏈`,
          tone: "default" as const,
        },
        {
          href: "#evidence-related-tasks",
          eyebrow: "回主線前",
          title: "相關工作紀錄",
          copy: "這些工作紀錄共同構成目前案件的證據世界，需要回主線推進時再回來對照。",
          meta: `${workspace.related_tasks.length} 筆相關工作紀錄`,
          tone: "default" as const,
        },
      ]
    : [];

  async function handleSupplementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSupplementMessage(null);
    setSupplementError(null);

    const urls = urlsText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (files.length === 0 && urls.length === 0 && !pastedText.trim()) {
      setSupplementError("請至少補上一份檔案、一個網址或一段補充文字。");
      setSubmitting(false);
      return;
    }

    try {
      const notes: string[] = [];
      if (files.length > 0) {
        const uploadResult = await uploadMatterFiles(matterId, files);
        notes.push(`已掛接 ${uploadResult.uploaded.length} 份檔案材料`);
      }
      if (urls.length > 0 || pastedText.trim()) {
        const ingestResult = await ingestMatterSources(matterId, {
          urls,
          pasted_text: pastedText,
          pasted_title: pastedText.trim() ? "案件補充說明" : undefined,
        });
        notes.push(`已新增 ${ingestResult.ingested.length} 則網址 / 文字材料`);
      }
      setFiles([]);
      setUrlsText("");
      setPastedText("");
      setSupplementMessage(`${notes.join("；")}。案件來源世界已更新。`);
      await loadWorkspace();
    } catch (submitError) {
      setSupplementError(
        submitError instanceof Error ? submitError.message : "補件失敗，請稍後重試。",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
  }

  return (
    <main className="page-shell">
      <div className="back-link-group">
        <Link className="back-link" href="/">
          ← 返回工作台
        </Link>
        <Link className="back-link" href={`/matters/${matterId}`}>
          ← 返回案件工作面
        </Link>
      </div>

      {loading ? <p className="status-text">正在載入來源 / 證據工作面...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {workspace && matterCard && workspaceView ? (
        <>
          <section className="hero-card">
            <span className="eyebrow">來源與證據工作面</span>
            <h1 className="page-title">{matterCard.title}</h1>
            <p className="page-subtitle">{matterCard.objectPath}</p>
            <div className="meta-row" style={{ marginTop: "16px" }}>
              <span>{workspace.source_material_cards.length} 份來源材料</span>
              <span>{workspace.artifact_cards.length} 份工作物件</span>
              <span>{workspace.evidence_chains.length} 則證據支撐鏈</span>
              <span>
                {labelForEngagementContinuityMode(workspace.matter_summary.engagement_continuity_mode)} /{" "}
                {labelForWritebackDepth(workspace.matter_summary.writeback_depth)}
              </span>
            </div>
            <div className="matter-hero-strip">
              <div>
                <span className="pill">決策問題</span>
                <p className="workspace-object-path" style={{ marginTop: "10px" }}>
                  {workspace.current_decision_context?.judgment_to_make ||
                    workspace.current_decision_context?.title ||
                    "目前尚未形成清楚的決策問題。"}
                </p>
                <p className="muted-text">{workspaceView.summary}</p>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">{evidenceActionTitle}</h2>
                <p className="panel-copy">{evidenceActionSummary}</p>
              </div>
            </div>
            <div className="summary-grid">
              <div className="section-card">
                <h4>來源材料</h4>
                <p className="content-block">{workspace.source_material_cards.length} 份</p>
              </div>
              <div className="section-card">
                <h4>證據支撐鏈</h4>
                <p className="content-block">{workspace.evidence_chains.length} 則</p>
              </div>
              <div className="section-card">
                <h4>高影響缺口</h4>
                <p className="content-block">{workspace.high_impact_gaps.length} 個</p>
              </div>
              <div className="section-card">
                <h4>跨 slice 共享鏈</h4>
                <p className="content-block">{sharedContinuitySummary}</p>
              </div>
            </div>
            <ul className="list-content" style={{ marginTop: "16px" }}>
              {evidenceActionChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="button-row" style={{ marginTop: "16px" }}>
              <Link className="button-primary" href="#evidence-supplement">
                先補件
              </Link>
              {focusTask ? (
                <Link className="button-secondary" href={`/tasks/${focusTask.id}`}>
                  打開焦點工作紀錄
                </Link>
              ) : null}
              {focusTask?.latest_deliverable_id ? (
                <Link
                  className="button-secondary"
                  href={`/deliverables/${focusTask.latest_deliverable_id}`}
                >
                  打開最新交付物
                </Link>
              ) : null}
              <Link className="button-secondary" href={`/matters/${matterId}`}>
                返回案件工作面
              </Link>
            </div>
          </section>

          <WorkspaceSectionGuide
            title="這個證據工作面怎麼讀最快"
            description="先看充分性與缺口，再決定是否補件。全量來源清單、證據支撐鏈與相關工作紀錄都放在後面，需要時再展開。"
            items={evidenceSectionGuideItems}
          />

          <section className="panel section-anchor" id="evidence-sufficiency">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">補件判斷</h2>
                <p className="panel-copy">
                  日常使用先只看目前夠不夠、缺什麼、會影響什麼；證據期待、限制與連續性都改成需要時再展開。
                </p>
              </div>
            </div>
            <div className="summary-grid">
              <div className="section-card">
                <h4>充分性摘要</h4>
                <p className="content-block">{workspace.sufficiency_summary}</p>
              </div>
              <div className="section-card">
                <h4>高影響缺口</h4>
                <CompactList
                  items={workspaceView.highImpactGaps}
                  emptyText="目前沒有額外的高影響缺口。"
                />
              </div>
              <div className="section-card">
                <h4>交付限制</h4>
                <CompactList
                  items={workspaceView.deliverableLimitations}
                  emptyText="目前沒有額外的交付限制提示。"
                />
              </div>
            </div>
            <DisclosurePanel
              title="詳細補件判斷"
              description="當你要深入確認證據期待、限制脈絡或連續性提示時，再展開這層。"
            >
              <div className="summary-grid">
                <div className="section-card">
                  <h4>證據期待</h4>
                  <CompactList
                    items={workspaceView.evidenceExpectations}
                    emptyText="目前沒有額外的證據期待。"
                  />
                </div>
                <div className="section-card">
                  <h4>連續性提示</h4>
                  <CompactList
                    items={workspace.continuity_notes}
                    emptyText="目前沒有額外的連續性提示。"
                  />
                </div>
              </div>
            </DisclosurePanel>
          </section>

          <DisclosurePanel
            title="Research provenance 與 evidence gap records"
            description="只有在你要 debug 這輪外部補完是怎麼進入 evidence chain、或確認哪些 gaps 已被正式記錄時，再展開這層。"
          >
            <div className="summary-grid">
              <div className="section-card">
                <h4>Research runs</h4>
                <CompactList
                  items={workspace.research_runs.map((item) => `${item.query}｜${item.result_summary || item.status}`)}
                  emptyText="目前沒有 research provenance。"
                />
              </div>
              <div className="section-card">
                <h4>Evidence gap records</h4>
                <CompactList
                  items={workspace.evidence_gaps.map((item) => `${item.title}：${item.description}`)}
                  emptyText="目前沒有已記錄的 evidence gaps。"
                />
              </div>
            </div>
          </DisclosurePanel>

          <section className="panel section-anchor" id="evidence-supplement">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">補件與新增來源</h2>
                <p className="panel-copy">
                  這裡承接同一個案件的正式補件主鏈。你可以補檔案、網址或補充文字，系統會把它們掛回同一個案件世界，而不是拆成新的孤立流程。
                </p>
              </div>
            </div>

            <form className="detail-stack" onSubmit={handleSupplementSubmit}>
              <div className="field">
                <label htmlFor="matter-files">上傳檔案</label>
                <input
                  id="matter-files"
                  type="file"
                  multiple
                  accept=".md,.txt,.docx,.xlsx,.csv,.pdf,.jpg,.jpeg,.png,.webp,text/plain,text/markdown,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                />
                <small>支援一次掛多份材料；若同一內容重複上傳，storage 會先走 digest 邊界。</small>
              </div>

              <div className="field">
                <label htmlFor="matter-urls">網址</label>
                <textarea
                  id="matter-urls"
                  value={urlsText}
                  onChange={(event) => setUrlsText(event.target.value)}
                  placeholder={"每行一個網址，例如：\nhttps://example.com/report\nhttps://docs.google.com/document/d/..."}
                />
              </div>

              <div className="field">
                <label htmlFor="matter-text">補充文字</label>
                <textarea
                  id="matter-text"
                  value={pastedText}
                  onChange={(event) => setPastedText(event.target.value)}
                  placeholder="可直接貼上會議摘要、客戶補充說明、原始筆記或任何需要掛回案件的文字材料。"
                />
              </div>

              <div className="button-row">
                <button className="button-primary" type="submit" disabled={submitting}>
                  {submitting ? "補件中..." : "掛接到目前案件"}
                </button>
              </div>

              <DisclosurePanel
                title="進件規則與保留邊界"
                description="只有在你要確認支援格式、有限支援範圍與原始檔保留規則時，再展開。"
              >
                <div className="summary-grid">
                  <div className="section-card">
                    <h4>正式支援</h4>
                    <p className="content-block">
                      MD、TXT、DOCX、XLSX、CSV、text-based PDF、URL、補充文字
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>有限支援</h4>
                    <p className="content-block">
                      JPG / JPEG、PNG、WEBP、掃描型 PDF 目前只建立 metadata / reference，不預設 OCR。
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>原始檔保留</h4>
                    <p className="content-block">
                      原始進件檔預設短期保存；正式 artifact 保留較久，但 publish / audit record 不會跟著 raw file 一起消失。
                    </p>
                  </div>
                </div>
              </DisclosurePanel>

              {supplementMessage ? <p className="success-text">{supplementMessage}</p> : null}
              {supplementError ? <p className="error-text">{supplementError}</p> : null}
            </form>
          </section>

          <div className="detail-grid">
            <div className="detail-stack">
              <DisclosurePanel
                id="evidence-materials"
                title="來源材料"
                description="這裡列出目前案件世界內可直接回看的來源材料。平常先看上方摘要，需要核對材料角色、保留狀態與支撐數量時再展開。"
              >
                <div className="detail-list">
                  {workspace.source_material_cards.length > 0 ? (
                    workspace.source_material_cards.map((item) => (
                      <div className="detail-item" key={item.object_id}>
                        <div className="meta-row">
                          <span className="pill">{item.role_label}</span>
                          <span>{labelForPresenceState(item.presence_state)}</span>
                          <span>{item.ingest_status || "未標示匯入狀態"}</span>
                          <span>{labelForSourceSupportLevel(item.support_level)}</span>
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
                        <div className="meta-row">
                          <span>{item.linked_evidence_count} 則已連結證據</span>
                          <span>{item.linked_output_count} 項已連結輸出</span>
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
                    ))
                  ) : (
                    <p className="empty-text">目前還沒有可顯示的來源材料。</p>
                  )}
                </div>
              </DisclosurePanel>

              <DisclosurePanel
                title="工作物件"
                description="這些是已正式進入來源 / 證據工作面的工作物件，不是原始附件清單。需要核對 artifact 角色時再展開。"
              >
                <div className="detail-list">
                  {workspace.artifact_cards.length > 0 ? (
                    workspace.artifact_cards.map((item) => (
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
              </DisclosurePanel>
            </div>

            <div className="detail-stack">
              <DisclosurePanel
                id="evidence-chains"
                title="證據支撐鏈"
                description="這裡正式顯示證據對建議 / 風險 / 行動的支撐鏈。平常先看上方摘要，需要逐條核對支撐關係時再展開。"
              >
                <div className="detail-list">
                  {workspace.evidence_chains.length > 0 ? (
                    workspace.evidence_chains.map((item) => (
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
                        <p className="muted-text">{item.sufficiency_note}</p>

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
                    ))
                  ) : (
                    <p className="empty-text">目前還沒有可顯示的證據支撐鏈。</p>
                  )}
                </div>
              </DisclosurePanel>

              <DisclosurePanel
                id="evidence-related-tasks"
                title="這個工作面中的相關工作紀錄"
                description="這些工作紀錄共同構成目前的來源 / 證據世界。需要回主線推進或對照哪筆工作產出了哪些證據時，再展開。"
              >
                <div className="history-list">
                  {workspace.related_tasks.length > 0 ? (
                    workspace.related_tasks.map((task) => (
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
              </DisclosurePanel>
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
