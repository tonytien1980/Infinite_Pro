"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

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
} from "@/lib/ui-labels";

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
                <h2 className="panel-title">來源 / 證據工作面摘要</h2>
                <p className="panel-copy">
                  這裡已是正式的來源與證據工作面，不再只是補充脈絡。你可以在這裡回看來源、證據
                  支撐鏈、以及目前限制更高等級交付物的高影響缺口。
                </p>
              </div>
            </div>
            <div className="summary-grid">
              <div className="section-card">
                <h4>充分性摘要</h4>
                <p className="content-block">{workspace.sufficiency_summary}</p>
              </div>
              <div className="section-card">
                <h4>證據期待</h4>
                <CompactList
                  items={workspaceView.evidenceExpectations}
                  emptyText="目前沒有額外的證據期待。"
                />
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
            {workspace.continuity_notes.length > 0 ? (
              <div className="detail-item" style={{ marginTop: "16px" }}>
                <h3>連續性提示</h3>
                <CompactList
                  items={workspace.continuity_notes}
                  emptyText="目前沒有額外的連續性提示。"
                />
              </div>
            ) : null}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">補件與新增來源</h2>
                <p className="panel-copy">
                  這裡承接同一個案件的正式補件主鏈。你可以補檔案、網址或補充文字，系統會把它們掛回同一個案件世界，而不是拆成新的孤立流程。
                </p>
              </div>
            </div>

            <form className="detail-stack" onSubmit={handleSupplementSubmit}>
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

              {supplementMessage ? <p className="success-text">{supplementMessage}</p> : null}
              {supplementError ? <p className="error-text">{supplementError}</p> : null}
            </form>
          </section>

          <div className="detail-grid">
            <div className="detail-stack">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">來源材料</h2>
                    <p className="panel-copy">
                      這些是目前案件世界內可直接回看的來源材料。你可以看到哪些是主要來源、哪些仍待補強，以及它們已連出多少證據與決策輸出。
                    </p>
                  </div>
                </div>
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
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">工作物件</h2>
                    <p className="panel-copy">
                      這些是目前案件世界中的可回看工作物件。它們不是原始附件清單，而是已正式進入來源 / 證據工作面的工作物件。
                    </p>
                  </div>
                </div>
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
              </section>
            </div>

            <div className="detail-stack">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">證據支撐鏈</h2>
                    <p className="panel-copy">
                      這裡正式顯示證據對建議 / 風險 / 行動的支撐鏈，不再只是資料結構裡的引用欄位。
                    </p>
                  </div>
                </div>
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
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">這個工作面中的相關工作紀錄</h2>
                    <p className="panel-copy">
                      這些工作紀錄共同構成目前的來源 / 證據世界，讓同一個案件下的證據累積不再散落在單一工作細節頁。
                    </p>
                  </div>
                </div>
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
              </section>
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
