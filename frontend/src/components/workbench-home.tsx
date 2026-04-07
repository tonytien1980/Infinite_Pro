"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  buildMatterWorkspaceCard,
  buildTaskListWorkspaceSummary,
} from "@/lib/advisory-workflow";
import {
  checkpointPhaseSixCompletionReview,
  getExtensionManager,
  getFirmOperatingSnapshot,
  getPhaseFiveClosureReview,
  getPhaseSixCapabilityCoverageAudit,
  getPhaseSixCompletionReview,
  getPhaseSixClosureCriteriaReview,
  getPhaseSixMaturityReview,
  getPhaseSixCalibrationAwareWeighting,
  getPhaseSixConfidenceCalibration,
  getPhaseSixContextDistanceAudit,
  getPhaseSixGeneralistGuidancePosture,
  getPhaseSixReuseBoundaryGovernance,
  listMatterWorkspaces,
  signOffPhaseFive,
  listTasks,
} from "@/lib/api";
import {
  countAttentionSignals,
  labelForFirmOperatingPosture,
  summarizeFirmOperatingSignals,
} from "@/lib/firm-operating";
import { buildPhaseFiveClosureView } from "@/lib/phase-five-closure";
import {
  labelForPhaseSixAuditStatus,
  labelForPhaseSixCalibrationStatus,
  labelForPhaseSixCompletionReviewPosture,
  labelForPhaseSixClosurePosture,
  labelForPhaseSixContextDistance,
  labelForPhaseSixGuidancePosture,
  labelForPhaseSixGeneralistPosture,
  labelForPhaseSixMaturityStage,
  labelForPhaseSixGovernancePosture,
  labelForPhaseSixReuseConfidence,
  labelForPhaseSixReuseRecommendation,
  summarizePhaseSixCalibrationAwareWeightingItems,
  summarizePhaseSixCalibrationItems,
  summarizePhaseSixCompletionScorecard,
  summarizePhaseSixCoverageAreas,
  summarizePhaseSixClosureCriteria,
  summarizePhaseSixDistanceItems,
  summarizePhaseSixGuidanceItems,
  summarizePhaseSixGovernanceItems,
  summarizePhaseSixMaturityMilestones,
  summarizePhaseSixWorkGuidance,
  summarizePhaseSixReuseBoundaryItems,
} from "@/lib/phase-six-governance";
import { truncateText } from "@/lib/text-format";
import type {
  ExtensionManagerSnapshot,
  FirmOperatingSnapshot,
  MatterWorkspaceSummary,
  PhaseFiveClosureReview,
  PhaseSixCapabilityCoverageAudit,
  PhaseSixCompletionReview,
  PhaseSixClosureCriteriaReview,
  PhaseSixMaturityReview,
  PhaseSixCalibrationAwareWeighting,
  PhaseSixConfidenceCalibration,
  PhaseSixContextDistanceAudit,
  PhaseSixGeneralistGuidancePosture,
  PhaseSixReuseBoundaryGovernance,
  TaskListItem,
} from "@/lib/types";
import {
  formatDisplayDate,
  labelForAgentName,
  labelForDeliverableClass,
  labelForPackName,
} from "@/lib/ui-labels";
import {
  useMatterWorkspaceRecords,
  useWorkbenchSettings,
} from "@/lib/workbench-store";
import {
  isLocalFallbackMatterRecord,
} from "@/lib/workspace-persistence";

function collectTopItems(
  items: string[],
  formatter: (value: string) => string,
  limit = 4,
) {
  const counts = new Map<string, number>();
  items
    .map((item) => formatter(item))
    .forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1));

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => `${label} · ${count} 次`);
}

function buildGapNote(task: TaskListItem) {
  const notes: string[] = [];

  if (task.evidence_count === 0) {
    notes.push("尚未形成正式證據鏈");
  } else if (task.evidence_count < 2) {
    notes.push("證據仍偏薄");
  }

  if (!task.latest_deliverable_id) {
    notes.push("尚未形成正式交付物");
  }

  if (task.external_research_heavy_candidate) {
    notes.push("需補外部脈絡");
  }

  return notes.join("、") || "目前仍值得再補一輪背景或來源厚度。";
}

function pickFocusLabel(preference: "matters" | "deliverables" | "evidence") {
  if (preference === "deliverables") {
    return "先回到最近交付物";
  }
  if (preference === "evidence") {
    return "先補待補資料";
  }
  return "先回到最近案件";
}

export function WorkbenchHome() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [matters, setMatters] = useState<MatterWorkspaceSummary[]>([]);
  const [extensionManager, setExtensionManager] = useState<ExtensionManagerSnapshot | null>(null);
  const [firmOperating, setFirmOperating] = useState<FirmOperatingSnapshot | null>(null);
  const [phaseFiveClosureReview, setPhaseFiveClosureReview] = useState<PhaseFiveClosureReview | null>(null);
  const [phaseSixAudit, setPhaseSixAudit] = useState<PhaseSixCapabilityCoverageAudit | null>(null);
  const [phaseSixCompletionReview, setPhaseSixCompletionReview] =
    useState<PhaseSixCompletionReview | null>(null);
  const [phaseSixClosureCriteria, setPhaseSixClosureCriteria] =
    useState<PhaseSixClosureCriteriaReview | null>(null);
  const [phaseSixMaturity, setPhaseSixMaturity] = useState<PhaseSixMaturityReview | null>(null);
  const [phaseSixCalibrationWeighting, setPhaseSixCalibrationWeighting] =
    useState<PhaseSixCalibrationAwareWeighting | null>(null);
  const [phaseSixCalibration, setPhaseSixCalibration] = useState<PhaseSixConfidenceCalibration | null>(null);
  const [phaseSixDistance, setPhaseSixDistance] = useState<PhaseSixContextDistanceAudit | null>(null);
  const [phaseSixGovernance, setPhaseSixGovernance] = useState<PhaseSixReuseBoundaryGovernance | null>(null);
  const [phaseSixGuidance, setPhaseSixGuidance] = useState<PhaseSixGeneralistGuidancePosture | null>(null);
  const [matterRecords] = useMatterWorkspaceRecords();
  const [settings] = useWorkbenchSettings();
  const [loading, setLoading] = useState(true);
  const [matterLoading, setMatterLoading] = useState(true);
  const [extensionLoading, setExtensionLoading] = useState(true);
  const [firmOperatingLoading, setFirmOperatingLoading] = useState(true);
  const [phaseFiveClosureLoading, setPhaseFiveClosureLoading] = useState(true);
  const [phaseSixAuditLoading, setPhaseSixAuditLoading] = useState(true);
  const [phaseSixCompletionReviewLoading, setPhaseSixCompletionReviewLoading] = useState(true);
  const [phaseSixClosureCriteriaLoading, setPhaseSixClosureCriteriaLoading] = useState(true);
  const [phaseSixMaturityLoading, setPhaseSixMaturityLoading] = useState(true);
  const [phaseSixCalibrationWeightingLoading, setPhaseSixCalibrationWeightingLoading] = useState(true);
  const [phaseSixCalibrationLoading, setPhaseSixCalibrationLoading] = useState(true);
  const [phaseSixDistanceLoading, setPhaseSixDistanceLoading] = useState(true);
  const [phaseSixGovernanceLoading, setPhaseSixGovernanceLoading] = useState(true);
  const [phaseSixGuidanceLoading, setPhaseSixGuidanceLoading] = useState(true);
  const [phaseFiveSignOffLoading, setPhaseFiveSignOffLoading] = useState(false);
  const [phaseSixCheckpointLoading, setPhaseSixCheckpointLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matterError, setMatterError] = useState<string | null>(null);
  const [extensionError, setExtensionError] = useState<string | null>(null);
  const [firmOperatingError, setFirmOperatingError] = useState<string | null>(null);
  const [phaseFiveClosureError, setPhaseFiveClosureError] = useState<string | null>(null);
  const [phaseSixAuditError, setPhaseSixAuditError] = useState<string | null>(null);
  const [phaseSixCompletionReviewError, setPhaseSixCompletionReviewError] = useState<string | null>(null);
  const [phaseSixClosureCriteriaError, setPhaseSixClosureCriteriaError] = useState<string | null>(null);
  const [phaseSixMaturityError, setPhaseSixMaturityError] = useState<string | null>(null);
  const [phaseSixCalibrationWeightingError, setPhaseSixCalibrationWeightingError] =
    useState<string | null>(null);
  const [phaseSixCalibrationError, setPhaseSixCalibrationError] = useState<string | null>(null);
  const [phaseSixDistanceError, setPhaseSixDistanceError] = useState<string | null>(null);
  const [phaseSixGovernanceError, setPhaseSixGovernanceError] = useState<string | null>(null);
  const [phaseSixGuidanceError, setPhaseSixGuidanceError] = useState<string | null>(null);
  const [phaseFiveClosureFeedback, setPhaseFiveClosureFeedback] = useState<string | null>(null);
  const [phaseSixCompletionFeedback, setPhaseSixCompletionFeedback] = useState<string | null>(null);

  async function refreshTasks() {
    try {
      setLoading(true);
      setError(null);
      setTasks(await listTasks());
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "載入工作總覽失敗。");
    } finally {
      setLoading(false);
    }
  }

  async function refreshMatters() {
    try {
      setMatterLoading(true);
      setMatterError(null);
      setMatters(await listMatterWorkspaces());
    } catch (refreshError) {
      setMatterError(
        refreshError instanceof Error ? refreshError.message : "載入案件工作台失敗。",
      );
    } finally {
      setMatterLoading(false);
    }
  }

  async function refreshExtensionManager() {
    try {
      setExtensionLoading(true);
      setExtensionError(null);
      setExtensionManager(await getExtensionManager());
    } catch (managerError) {
      setExtensionError(
        managerError instanceof Error ? managerError.message : "載入模組包與代理摘要失敗。",
      );
    } finally {
      setExtensionLoading(false);
    }
  }

  async function refreshFirmOperating() {
    try {
      setFirmOperatingLoading(true);
      setFirmOperatingError(null);
      setFirmOperating(await getFirmOperatingSnapshot());
    } catch (operatingError) {
      setFirmOperatingError(
        operatingError instanceof Error ? operatingError.message : "載入 firm operating 摘要失敗。",
      );
    } finally {
      setFirmOperatingLoading(false);
    }
  }

  async function refreshPhaseFiveClosureReview() {
    try {
      setPhaseFiveClosureLoading(true);
      setPhaseFiveClosureError(null);
      setPhaseFiveClosureFeedback(null);
      setPhaseFiveClosureReview(await getPhaseFiveClosureReview());
    } catch (closureError) {
      setPhaseFiveClosureError(
        closureError instanceof Error ? closureError.message : "載入 phase 5 收尾狀態失敗。",
      );
    } finally {
      setPhaseFiveClosureLoading(false);
    }
  }

  async function refreshPhaseSixAudit() {
    try {
      setPhaseSixAuditLoading(true);
      setPhaseSixAuditError(null);
      setPhaseSixAudit(await getPhaseSixCapabilityCoverageAudit());
    } catch (auditError) {
      setPhaseSixAuditError(
        auditError instanceof Error ? auditError.message : "載入 Phase 6 治理摘要失敗。",
      );
    } finally {
      setPhaseSixAuditLoading(false);
    }
  }

  async function refreshPhaseSixCompletionReview() {
    try {
      setPhaseSixCompletionReviewLoading(true);
      setPhaseSixCompletionReviewError(null);
      setPhaseSixCompletionFeedback(null);
      setPhaseSixCompletionReview(await getPhaseSixCompletionReview());
    } catch (reviewError) {
      setPhaseSixCompletionReviewError(
        reviewError instanceof Error ? reviewError.message : "載入 Phase 6 completion review 失敗。",
      );
    } finally {
      setPhaseSixCompletionReviewLoading(false);
    }
  }

  async function refreshPhaseSixClosureCriteria() {
    try {
      setPhaseSixClosureCriteriaLoading(true);
      setPhaseSixClosureCriteriaError(null);
      setPhaseSixClosureCriteria(await getPhaseSixClosureCriteriaReview());
    } catch (closureError) {
      setPhaseSixClosureCriteriaError(
        closureError instanceof Error ? closureError.message : "載入 Phase 6 closure criteria 失敗。",
      );
    } finally {
      setPhaseSixClosureCriteriaLoading(false);
    }
  }

  async function refreshPhaseSixMaturity() {
    try {
      setPhaseSixMaturityLoading(true);
      setPhaseSixMaturityError(null);
      setPhaseSixMaturity(await getPhaseSixMaturityReview());
    } catch (maturityError) {
      setPhaseSixMaturityError(
        maturityError instanceof Error ? maturityError.message : "載入 Phase 6 maturity 摘要失敗。",
      );
    } finally {
      setPhaseSixMaturityLoading(false);
    }
  }

  async function refreshPhaseSixCalibration() {
    try {
      setPhaseSixCalibrationLoading(true);
      setPhaseSixCalibrationError(null);
      setPhaseSixCalibration(await getPhaseSixConfidenceCalibration());
    } catch (calibrationError) {
      setPhaseSixCalibrationError(
        calibrationError instanceof Error
          ? calibrationError.message
          : "載入 confidence calibration 摘要失敗。",
      );
    } finally {
      setPhaseSixCalibrationLoading(false);
    }
  }

  async function refreshPhaseSixCalibrationWeighting() {
    try {
      setPhaseSixCalibrationWeightingLoading(true);
      setPhaseSixCalibrationWeightingError(null);
      setPhaseSixCalibrationWeighting(await getPhaseSixCalibrationAwareWeighting());
    } catch (weightingError) {
      setPhaseSixCalibrationWeightingError(
        weightingError instanceof Error
          ? weightingError.message
          : "載入 calibration-aware Host weighting 摘要失敗。",
      );
    } finally {
      setPhaseSixCalibrationWeightingLoading(false);
    }
  }

  async function refreshPhaseSixGovernance() {
    try {
      setPhaseSixGovernanceLoading(true);
      setPhaseSixGovernanceError(null);
      setPhaseSixGovernance(await getPhaseSixReuseBoundaryGovernance());
    } catch (governanceError) {
      setPhaseSixGovernanceError(
        governanceError instanceof Error
          ? governanceError.message
          : "載入 reuse-boundary 治理摘要失敗。",
      );
    } finally {
      setPhaseSixGovernanceLoading(false);
    }
  }

  async function refreshPhaseSixDistance() {
    try {
      setPhaseSixDistanceLoading(true);
      setPhaseSixDistanceError(null);
      setPhaseSixDistance(await getPhaseSixContextDistanceAudit());
    } catch (distanceError) {
      setPhaseSixDistanceError(
        distanceError instanceof Error
          ? distanceError.message
          : "載入 reuse confidence 摘要失敗。",
      );
    } finally {
      setPhaseSixDistanceLoading(false);
    }
  }

  async function refreshPhaseSixGuidance() {
    try {
      setPhaseSixGuidanceLoading(true);
      setPhaseSixGuidanceError(null);
      setPhaseSixGuidance(await getPhaseSixGeneralistGuidancePosture());
    } catch (guidanceError) {
      setPhaseSixGuidanceError(
        guidanceError instanceof Error
          ? guidanceError.message
          : "載入 generalist guidance posture 失敗。",
      );
    } finally {
      setPhaseSixGuidanceLoading(false);
    }
  }

  useEffect(() => {
    void refreshTasks();
    void refreshMatters();
    void refreshExtensionManager();
    void refreshFirmOperating();
    void refreshPhaseFiveClosureReview();
    void refreshPhaseSixAudit();
    void refreshPhaseSixCompletionReview();
    void refreshPhaseSixClosureCriteria();
    void refreshPhaseSixMaturity();
    void refreshPhaseSixCalibrationWeighting();
    void refreshPhaseSixCalibration();
    void refreshPhaseSixDistance();
    void refreshPhaseSixGovernance();
    void refreshPhaseSixGuidance();
  }, []);
  const phaseFiveClosureView = buildPhaseFiveClosureView(phaseFiveClosureReview);

  async function handlePhaseFiveSignOff() {
    try {
      setPhaseFiveSignOffLoading(true);
      setPhaseFiveClosureError(null);
      const next = await signOffPhaseFive({ operator_label: "" });
      setPhaseFiveClosureReview(next);
      setPhaseFiveClosureFeedback("phase 5 已正式收口，下一階段 handoff 已整理。");
    } catch (signOffError) {
      setPhaseFiveClosureError(
        signOffError instanceof Error ? signOffError.message : "目前無法正式收口 phase 5。",
      );
    } finally {
      setPhaseFiveSignOffLoading(false);
    }
  }

  async function handlePhaseSixCheckpoint() {
    try {
      setPhaseSixCheckpointLoading(true);
      setPhaseSixCompletionReviewError(null);
      const next = await checkpointPhaseSixCompletionReview({ operator_label: "" });
      setPhaseSixCompletionReview(next);
      setPhaseSixCompletionFeedback("已記錄一筆 Phase 6 completion review checkpoint。");
    } catch (checkpointError) {
      setPhaseSixCompletionReviewError(
        checkpointError instanceof Error
          ? checkpointError.message
          : "記錄 Phase 6 completion review checkpoint 失敗。",
      );
    } finally {
      setPhaseSixCheckpointLoading(false);
    }
  }

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    [tasks],
  );
  const sortedMatters = useMemo(
    () =>
      [...matters].sort(
        (a, b) =>
          new Date(b.latest_updated_at).getTime() - new Date(a.latest_updated_at).getTime(),
      ),
    [matters],
  );

  const activeMatters = sortedMatters.filter((matter) => matter.active_task_count > 0);
  const visibleMatters = (activeMatters.length > 0 ? activeMatters : sortedMatters).slice(0, 4);
  const recentDeliverables = sortedTasks
    .filter((task) => Boolean(task.latest_deliverable_id))
    .slice(0, 4);
  const pendingEvidenceTasks = sortedTasks
    .filter(
      (task) =>
        task.evidence_count < 2 ||
        !task.latest_deliverable_id ||
        task.external_research_heavy_candidate,
    )
    .slice(0, 4);
  const recentActivities = sortedTasks.slice(0, 4);
  const frequentAgents = collectTopItems(
    sortedTasks.flatMap((task) => task.selected_agent_names),
    labelForAgentName,
  );
  const frequentPacks = collectTopItems(
    sortedTasks.flatMap((task) => task.selected_pack_names),
    labelForPackName,
  );
  const primaryMatter = visibleMatters[0] ?? null;
  const primaryDeliverable = recentDeliverables[0] ?? null;
  const primaryEvidenceTask = pendingEvidenceTasks[0] ?? null;
  const primaryMatterRecord =
    primaryMatter && isLocalFallbackMatterRecord(matterRecords[primaryMatter.id])
      ? matterRecords[primaryMatter.id]
      : null;
  const focusTitle =
    settings.homepageDisplayPreference === "deliverables"
      ? primaryDeliverable?.latest_deliverable_title || "先建立第一份可回看的交付物"
      : settings.homepageDisplayPreference === "evidence"
        ? primaryEvidenceTask?.title || "目前沒有急需補件的案件"
        : primaryMatterRecord?.title ||
          primaryMatter?.title ||
          "先建立第一個案件";
  const focusCopy =
    settings.homepageDisplayPreference === "deliverables"
      ? truncateText(
          primaryDeliverable?.latest_deliverable_summary ||
            primaryDeliverable?.decision_context_title ||
            "交付物頁會整理這次結論、版本與可直接採用的內容。",
          96,
        )
      : settings.homepageDisplayPreference === "evidence"
        ? primaryEvidenceTask
          ? buildGapNote(primaryEvidenceTask)
          : "建立案件後，待補資料入口會自動回到這裡。"
        : truncateText(
            primaryMatterRecord?.summary ||
              primaryMatter?.workspace_summary ||
              primaryMatter?.current_decision_context_title ||
              "案件頁會接住這次要處理的問題與下一步。",
            96,
          );
  const focusHref =
    settings.homepageDisplayPreference === "deliverables" &&
    primaryDeliverable?.latest_deliverable_id
      ? `/deliverables/${primaryDeliverable.latest_deliverable_id}`
      : settings.homepageDisplayPreference === "evidence" && primaryEvidenceTask
        ? primaryEvidenceTask.matter_workspace
          ? `/matters/${primaryEvidenceTask.matter_workspace.id}/evidence`
          : `/tasks/${primaryEvidenceTask.id}`
        : primaryMatter
          ? `/matters/${primaryMatter.id}`
          : "/new";
  const focusActionLabel =
    settings.homepageDisplayPreference === "deliverables" &&
    primaryDeliverable?.latest_deliverable_id
      ? "回到交付物"
      : settings.homepageDisplayPreference === "evidence" && primaryEvidenceTask
        ? "前往補件"
        : primaryMatter
          ? "前往案件頁"
          : "建立新案件";

  return (
    <main className="page-shell home-page-shell">
      <section className="hero-card overview-hero">
        <div className="hero-layout">
          <div className="hero-main">
            <span className="eyebrow">總覽</span>
            <h1 className="page-title">總覽</h1>
            <p className="page-subtitle">
              先找到現在最值得處理的一件事，再回到對應工作面繼續往前推。
            </p>
            <div className="hero-actions">
              <Link className="button-primary" href={focusHref}>
                {focusActionLabel}
              </Link>
              {focusActionLabel !== "建立新案件" ? (
                <Link className="button-secondary" href="/new">
                  建立新案件
                </Link>
              ) : null}
              <Link className="button-secondary" href="/matters">
                看案件列表
              </Link>
            </div>
          </div>

          <div className="hero-aside">
            <div className="hero-focus-card overview-focus-card">
              <p className="hero-focus-label">{pickFocusLabel(settings.homepageDisplayPreference)}</p>
              <h3 className="hero-focus-title">{focusTitle}</h3>
              <p className="hero-focus-copy">{focusCopy}</p>
            </div>
            <div className="hero-focus-card hero-focus-card-warm">
              <p className="hero-focus-label">這頁先看什麼</p>
              <ul className="hero-focus-list">
                <li>先回到你現在最需要處理的案件、交付物或補件工作。</li>
                <li>若有新客戶需求，再從這裡直接建立新案件。</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="hero-metrics-grid">
          <div className="section-card hero-metric-card">
            <h3>進行中案件</h3>
            <p className="workbench-metric">{activeMatters.length}</p>
            <p className="muted-text">
              {primaryMatter?.title || "目前還沒有進行中的案件。"}
            </p>
          </div>

          <div className="section-card hero-metric-card">
            <h3>最近交付物</h3>
            <p className="workbench-metric">{recentDeliverables.length}</p>
            <p className="muted-text">
              {primaryDeliverable?.latest_deliverable_title || "目前還沒有正式交付成果。"}
            </p>
          </div>

          <div className="section-card hero-metric-card">
            <h3>待補資料</h3>
            <p className="workbench-metric">{pendingEvidenceTasks.length}</p>
            <p className="muted-text">
              {primaryEvidenceTask ? buildGapNote(primaryEvidenceTask) : "目前沒有急需補齊的資料缺口。"}
            </p>
          </div>
        </div>
      </section>

      {loading || matterLoading ? <p className="status-text">正在載入總覽...</p> : null}
      {error ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}
      {matterError ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {matterError}
        </p>
      ) : null}
      {extensionError ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {extensionError}
        </p>
      ) : null}
      {firmOperatingError ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {firmOperatingError}
        </p>
      ) : null}
      {phaseSixAuditError ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {phaseSixAuditError}
        </p>
      ) : null}
      {phaseSixCompletionReviewError ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {phaseSixCompletionReviewError}
        </p>
      ) : null}
      {phaseSixClosureCriteriaError ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {phaseSixClosureCriteriaError}
        </p>
      ) : null}
      {phaseSixMaturityError ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {phaseSixMaturityError}
        </p>
      ) : null}
      {phaseSixCalibrationError ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {phaseSixCalibrationError}
        </p>
      ) : null}
      {phaseSixCalibrationWeightingError ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {phaseSixCalibrationWeightingError}
        </p>
      ) : null}
      {phaseSixDistanceError ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {phaseSixDistanceError}
        </p>
      ) : null}
      {phaseSixGovernanceError ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {phaseSixGovernanceError}
        </p>
      ) : null}
      {phaseFiveClosureError ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {phaseFiveClosureError}
        </p>
      ) : null}

      {!loading && !matterLoading ? (
        <div className="detail-grid">
          <div className="detail-stack">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">繼續工作</h2>
                  <p className="panel-copy">先回到正在推進的案件，通常最能幫你接續剛剛的工作。</p>
                </div>
                <Link className="button-secondary" href="/matters">
                  看全部案件
                </Link>
              </div>

              <div className="history-list">
                {visibleMatters.length > 0 ? (
                  visibleMatters.map((matter) => {
                    const workspaceCard = buildMatterWorkspaceCard(matter);
                    const fallbackRecord = isLocalFallbackMatterRecord(matterRecords[matter.id])
                      ? matterRecords[matter.id]
                      : null;

                    return (
                      <Link className="history-item" href={`/matters/${matter.id}`} key={matter.id}>
                        <div className="meta-row">
                          <span className="pill">{matter.active_task_count > 0 ? "進行中案件" : "回看案件"}</span>
                          <span>更新於 {formatDisplayDate(matter.latest_updated_at)}</span>
                        </div>
                        <h3>{fallbackRecord?.title || workspaceCard.title}</h3>
                        <p className="workspace-object-path">{workspaceCard.objectPath}</p>
                        <p className="content-block">
                          {truncateText(
                            fallbackRecord?.summary ||
                              matter.workspace_summary ||
                              matter.active_work_summary ||
                              workspaceCard.continuity,
                            112,
                          )}
                        </p>
                        <div className="meta-row">
                          <span>交付物 {matter.deliverable_count}</span>
                          <span>來源 {matter.source_material_count}</span>
                          <span>工作紀錄 {matter.total_task_count}</span>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="empty-text">目前還沒有已形成的案件工作台。</p>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">最近交付物</h2>
                  <p className="panel-copy">這裡只放最近最值得回看的交付物，方便你快速回到結果。</p>
                </div>
                <Link className="button-secondary" href="/deliverables">
                  看全部交付物
                </Link>
              </div>

              <div className="history-list">
                {recentDeliverables.length > 0 ? (
                  recentDeliverables.map((task) => {
                    const summary = buildTaskListWorkspaceSummary(task);

                    return (
                      <Link
                        className="history-item"
                        href={
                          task.latest_deliverable_id
                            ? `/deliverables/${task.latest_deliverable_id}`
                            : `/tasks/${task.id}`
                        }
                        key={`${task.id}-${task.latest_deliverable_id ?? "deliverable"}`}
                      >
                        <div className="meta-row">
                          <span className="pill">{labelForDeliverableClass(task.deliverable_class_hint)}</span>
                          <span>{formatDisplayDate(task.updated_at)}</span>
                        </div>
                        <h3>{task.latest_deliverable_title || task.title}</h3>
                        <p className="workspace-object-path">{summary.objectPath}</p>
                        <p className="muted-text">
                          {truncateText(
                            task.latest_deliverable_summary || summary.decisionContext,
                            90,
                          )}
                        </p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="empty-text">目前還沒有最近交付物。</p>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">待補資料 / 證據</h2>
                  <p className="panel-copy">先看哪些案件最缺資料，再決定要不要補件。</p>
                </div>
              </div>

              <div className="detail-list">
                {pendingEvidenceTasks.length > 0 ? (
                  pendingEvidenceTasks.map((task) => {
                    const summary = buildTaskListWorkspaceSummary(task);
                    const href = task.matter_workspace
                      ? `/matters/${task.matter_workspace.id}/evidence`
                      : `/tasks/${task.id}`;

                    return (
                      <Link className="detail-item" href={href} key={`gap-${task.id}`}>
                        <div className="meta-row">
                          <span className="pill">待補資料</span>
                          <span>{task.evidence_count} 則證據</span>
                        </div>
                        <h3>{task.title}</h3>
                        <p className="workspace-object-path">{summary.objectPath}</p>
                        <p className="muted-text">{buildGapNote(task)}</p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="empty-text">目前沒有明顯的待補資料 / 待補證據案件。</p>
                )}
              </div>
            </section>
          </div>

          <div className="detail-stack">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Firm Operating</h2>
                  <p className="panel-copy">低噪音回答這間 firm 目前是否已準備好順利工作。</p>
                </div>
                {firmOperating?.actionLabel ? (
                  <Link className="button-secondary" href={firmOperating.actionHref}>
                    {firmOperating.actionLabel}
                  </Link>
                ) : null}
              </div>

              {firmOperatingLoading ? <p className="status-text">正在整理 firm operating 摘要...</p> : null}
              {!firmOperatingLoading && firmOperating ? (
                <>
                  <div className="summary-grid">
                    <div className="section-card">
                      <p className="muted-text">目前姿態</p>
                      <strong>{labelForFirmOperatingPosture(firmOperating.operatingPosture)}</strong>
                      <p className="muted-text">{firmOperating.operatingSummary}</p>
                    </div>
                    <div className="section-card">
                      <p className="muted-text">目前重點</p>
                      <strong>{firmOperating.priorityNote}</strong>
                      <p className="muted-text">
                        {firmOperating.role === "owner" ? "owner view" : "consultant view"}
                      </p>
                    </div>
                    <div className="section-card">
                      <p className="muted-text">需注意訊號</p>
                      <strong>{countAttentionSignals(firmOperating.signals)}</strong>
                      <p className="muted-text">{summarizeFirmOperatingSignals(firmOperating.signals)}</p>
                    </div>
                  </div>

                  <div className="detail-list" style={{ marginTop: "16px" }}>
                    {firmOperating.signals.map((signal) => (
                      <div className="detail-item" key={signal.signalId}>
                        <div className="meta-row">
                          <span className="pill">
                            {signal.status === "attention" ? "值得先處理" : "目前正常"}
                          </span>
                          <span>{signal.label}</span>
                        </div>
                        <h3>{signal.value}</h3>
                        <p className="muted-text">{signal.detail}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Phase 5 Closure Review</h2>
                  <p className="panel-copy">低噪音回讀 Single-Firm Cloud Foundation 目前收尾到哪。</p>
                </div>
                {firmOperating?.role === "owner" && phaseFiveClosureView.canSignOff ? (
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={() => void handlePhaseFiveSignOff()}
                    disabled={phaseFiveSignOffLoading}
                  >
                    {phaseFiveSignOffLoading ? "收口中..." : "正式收口 Phase 5"}
                  </button>
                ) : null}
              </div>

              {phaseFiveClosureLoading ? <p className="status-text">正在整理 phase 5 收尾狀態...</p> : null}
              {phaseFiveClosureFeedback ? <p className="success-text">{phaseFiveClosureFeedback}</p> : null}
              {!phaseFiveClosureLoading && phaseFiveClosureView.shouldShow ? (
                <>
                  <div className="summary-grid">
                    <div className="section-card">
                      <p className="muted-text">{phaseFiveClosureView.title}</p>
                      <strong>{phaseFiveClosureView.statusLabel}</strong>
                      <p className="muted-text">{phaseFiveClosureView.summary}</p>
                    </div>
                    <div className="section-card">
                      <p className="muted-text">完成度</p>
                      <strong>{phaseFiveClosureView.meta}</strong>
                      <p className="muted-text">{phaseFiveClosureView.snapshot}</p>
                    </div>
                  </div>

                  <div className="detail-list" style={{ marginTop: "16px" }}>
                    {phaseFiveClosureView.assetAudits.map((item) => (
                      <div className="detail-item" key={item.title}>
                        <div className="meta-row">
                          <span className="pill">{item.auditStatusLabel}</span>
                          <span>{item.title}</span>
                        </div>
                        <p className="muted-text">{item.summary}</p>
                      </div>
                    ))}
                  </div>

                  {phaseFiveClosureView.remainingItems.length > 0 ? (
                    <div className="section-card" style={{ marginTop: "16px" }}>
                      <h3>剩餘項目</h3>
                      <ul className="detail-list">
                        {phaseFiveClosureView.remainingItems.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <p className="muted-text" style={{ marginTop: "12px" }}>
                        {phaseFiveClosureView.recommendedNextStep}
                      </p>
                    </div>
                  ) : null}

                  {phaseFiveClosureView.signedOffAt ? (
                    <div className="section-card" style={{ marginTop: "16px" }}>
                      <h3>下一階段 handoff</h3>
                      <p className="muted-text">
                        收口人：{phaseFiveClosureView.signedOffByLabel || "目前 owner"}
                      </p>
                      <p className="muted-text">{phaseFiveClosureView.nextPhaseLabel}</p>
                      <p className="content-block">{phaseFiveClosureView.handoffSummary}</p>
                      {phaseFiveClosureView.handoffItems.length > 0 ? (
                        <ul className="detail-list">
                          {phaseFiveClosureView.handoffItems.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : null}
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Generalist Governance</h2>
                  <p className="panel-copy">低噪音回答 shared intelligence 目前有沒有開始偏科。</p>
                </div>
                {firmOperating?.role === "owner" && phaseSixCompletionReview ? (
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={() => void handlePhaseSixCheckpoint()}
                    disabled={phaseSixCheckpointLoading}
                  >
                    {phaseSixCheckpointLoading ? "記錄中..." : "記錄 completion checkpoint"}
                  </button>
                ) : null}
              </div>

              {phaseSixAuditLoading ? <p className="status-text">正在整理 Phase 6 治理摘要...</p> : null}
              {phaseSixCompletionFeedback ? <p className="success-text">{phaseSixCompletionFeedback}</p> : null}
              {!phaseSixAuditLoading && phaseSixAudit ? (
                <>
                  {phaseSixCompletionReviewLoading ? (
                    <p className="status-text" style={{ marginBottom: "16px" }}>
                      正在整理 Phase 6 completion review...
                    </p>
                  ) : null}

                  {!phaseSixCompletionReviewLoading && phaseSixCompletionReview ? (
                    <div className="section-card" style={{ marginBottom: "16px" }}>
                      <h3>completion review</h3>
                      <p className="muted-text">
                        {labelForPhaseSixCompletionReviewPosture(
                          phaseSixCompletionReview.reviewPosture,
                        )}
                      </p>
                      <strong>總分 {phaseSixCompletionReview.overallScore}</strong>
                      <p className="muted-text" style={{ marginTop: "8px" }}>
                        {summarizePhaseSixCompletionScorecard(
                          phaseSixCompletionReview.scorecardItems,
                        )}
                      </p>
                      <p className="muted-text" style={{ marginTop: "8px" }}>
                        {phaseSixCompletionReview.checkpointSummary}
                      </p>
                      <p className="muted-text" style={{ marginTop: "12px" }}>
                        {phaseSixCompletionReview.recommendedNextStep}
                      </p>
                    </div>
                  ) : null}

                  {phaseSixClosureCriteriaLoading ? (
                    <p className="status-text" style={{ marginBottom: "16px" }}>
                      正在整理 Phase 6 closure criteria...
                    </p>
                  ) : null}

                  {!phaseSixClosureCriteriaLoading && phaseSixClosureCriteria ? (
                    <div className="section-card" style={{ marginBottom: "16px" }}>
                      <h3>closure criteria</h3>
                      <p className="muted-text">
                        {labelForPhaseSixClosurePosture(phaseSixClosureCriteria.closurePosture)}
                      </p>
                      <strong>{phaseSixClosureCriteria.closureSnapshot}</strong>
                      <p className="muted-text" style={{ marginTop: "8px" }}>
                        {phaseSixClosureCriteria.feedbackLoopSummary}
                      </p>
                      <p className="muted-text" style={{ marginTop: "8px" }}>
                        {summarizePhaseSixClosureCriteria(phaseSixClosureCriteria.criteriaItems)}
                      </p>
                      <ul className="detail-list" style={{ marginTop: "12px" }}>
                        {phaseSixClosureCriteria.remainingBlockers.slice(0, 2).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <p className="muted-text" style={{ marginTop: "12px" }}>
                        {phaseSixClosureCriteria.recommendedNextStep}
                      </p>
                    </div>
                  ) : null}

                  {phaseSixMaturityLoading ? (
                    <p className="status-text" style={{ marginBottom: "16px" }}>
                      正在整理 Phase 6 maturity...
                    </p>
                  ) : null}

                  {!phaseSixMaturityLoading && phaseSixMaturity ? (
                    <div className="section-card" style={{ marginBottom: "16px" }}>
                      <h3>Phase 6 maturity</h3>
                      <p className="muted-text">
                        {labelForPhaseSixMaturityStage(phaseSixMaturity.maturityStage)}
                      </p>
                      <strong>{phaseSixMaturity.maturitySnapshot}</strong>
                      <p className="muted-text" style={{ marginTop: "8px" }}>
                        {phaseSixMaturity.summary}
                      </p>
                      <p className="muted-text" style={{ marginTop: "8px" }}>
                        {summarizePhaseSixMaturityMilestones(phaseSixMaturity.milestoneAudits)}
                      </p>
                      <ul className="detail-list" style={{ marginTop: "12px" }}>
                        {phaseSixMaturity.remainingFocusItems.slice(0, 2).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <p className="muted-text" style={{ marginTop: "12px" }}>
                        {phaseSixMaturity.recommendedNextStep}
                      </p>
                    </div>
                  ) : null}

                  <div className="summary-grid">
                    <div className="section-card">
                      <p className="muted-text">目前審核狀態</p>
                      <strong>{labelForPhaseSixAuditStatus(phaseSixAudit.auditStatus)}</strong>
                      <p className="muted-text">{phaseSixAudit.coverageSummary}</p>
                    </div>
                    <div className="section-card">
                      <p className="muted-text">全面型姿態</p>
                      <strong>
                        {labelForPhaseSixGeneralistPosture(phaseSixAudit.generalistPosture)}
                      </strong>
                      <p className="muted-text">{phaseSixAudit.priorityNote}</p>
                    </div>
                    <div className="section-card">
                      <p className="muted-text">目前覆蓋摘要</p>
                      <strong>{phaseSixAudit.coverageAreas.length}</strong>
                      <p className="muted-text">
                        {summarizePhaseSixCoverageAreas(phaseSixAudit.coverageAreas)}
                      </p>
                    </div>
                  </div>

                  <div className="detail-list" style={{ marginTop: "16px" }}>
                    {phaseSixAudit.coverageAreas.slice(0, 3).map((area) => (
                      <div className="detail-item" key={area.areaId}>
                        <div className="meta-row">
                          <span className="pill">{area.coverageStatusLabel}</span>
                          <span>{area.areaLabel}</span>
                        </div>
                        <p className="muted-text">{area.summary}</p>
                      </div>
                    ))}
                  </div>

                  <div className="section-card" style={{ marginTop: "16px" }}>
                    <h3>reuse boundary</h3>
                    <p className="muted-text">
                      {summarizePhaseSixReuseBoundaryItems(phaseSixAudit.reuseBoundaryItems)}
                    </p>
                    <ul className="detail-list" style={{ marginTop: "12px" }}>
                      {phaseSixAudit.reuseBoundaryItems.slice(0, 2).map((item) => (
                        <li key={item.assetCode}>
                          {item.assetLabel}｜{item.boundaryStatusLabel}｜{item.summary}
                        </li>
                      ))}
                    </ul>
                    <p className="muted-text" style={{ marginTop: "12px" }}>
                      {phaseSixAudit.recommendedNextStep}
                    </p>
                  </div>

                  {phaseSixCalibrationLoading ? (
                    <p className="status-text" style={{ marginTop: "16px" }}>
                      正在整理 confidence calibration...
                    </p>
                  ) : null}

                  {!phaseSixCalibrationLoading && phaseSixCalibration ? (
                    <div className="section-card" style={{ marginTop: "16px" }}>
                      <h3>confidence calibration</h3>
                      <p className="muted-text">{phaseSixCalibration.calibrationPostureLabel}</p>
                      <strong>{phaseSixCalibration.summary}</strong>
                      <p className="muted-text" style={{ marginTop: "8px" }}>
                        {summarizePhaseSixCalibrationItems(phaseSixCalibration.calibrationItems)}
                      </p>
                      <ul className="detail-list" style={{ marginTop: "12px" }}>
                        {phaseSixCalibration.calibrationItems.slice(0, 2).map((item) => (
                          <li key={`${item.axisKind}-${item.axisLabel}`}>
                            {item.axisLabel}｜
                            {labelForPhaseSixCalibrationStatus(item.calibrationStatus)}｜
                            {labelForPhaseSixReuseConfidence(item.reuseConfidence)}
                          </li>
                        ))}
                      </ul>
                      <p className="muted-text" style={{ marginTop: "12px" }}>
                        {phaseSixCalibration.recommendedNextStep}
                      </p>
                    </div>
                  ) : null}

                  {phaseSixDistanceLoading ? (
                    <p className="status-text" style={{ marginTop: "16px" }}>
                      正在整理 reuse confidence 摘要...
                    </p>
                  ) : null}

                  {!phaseSixDistanceLoading && phaseSixDistance ? (
                    <div className="section-card" style={{ marginTop: "16px" }}>
                      <h3>reuse confidence</h3>
                      <p className="muted-text">{phaseSixDistance.confidencePostureLabel}</p>
                      <strong>{phaseSixDistance.summary}</strong>
                      <p className="muted-text" style={{ marginTop: "8px" }}>
                        {summarizePhaseSixDistanceItems(phaseSixDistance.distanceItems)}
                      </p>
                      <ul className="detail-list" style={{ marginTop: "12px" }}>
                        {phaseSixDistance.distanceItems.slice(0, 2).map((item) => (
                          <li key={item.assetCode}>
                            {item.assetLabel}｜
                            {labelForPhaseSixContextDistance(item.contextDistance)}｜
                            {labelForPhaseSixReuseConfidence(item.reuseConfidence)}
                          </li>
                        ))}
                      </ul>
                      <p className="muted-text" style={{ marginTop: "12px" }}>
                        {phaseSixDistance.recommendedNextStep}
                      </p>
                    </div>
                  ) : null}

                  {phaseSixGovernanceLoading ? (
                    <p className="status-text" style={{ marginTop: "16px" }}>
                      正在整理 reuse-boundary 治理建議...
                    </p>
                  ) : null}

                  {!phaseSixGovernanceLoading && phaseSixGovernance ? (
                    <div className="section-card" style={{ marginTop: "16px" }}>
                      <h3>reuse-boundary governance</h3>
                      <p className="muted-text">
                        {labelForPhaseSixGovernancePosture(phaseSixGovernance.governancePosture)}
                      </p>
                      <strong>{phaseSixGovernance.summary}</strong>
                      <p className="muted-text" style={{ marginTop: "8px" }}>
                        {summarizePhaseSixGovernanceItems(phaseSixGovernance.governanceItems)}
                      </p>
                      <ul className="detail-list" style={{ marginTop: "12px" }}>
                        {phaseSixGovernance.governanceItems.slice(0, 2).map((item) => (
                          <li key={item.assetCode}>
                            {item.assetLabel}｜{labelForPhaseSixReuseRecommendation(item.reuseRecommendation)}｜
                            {item.guardrailNote}
                          </li>
                        ))}
                      </ul>
                      <p className="muted-text" style={{ marginTop: "12px" }}>
                        {phaseSixGovernance.recommendedNextStep}
                      </p>
                    </div>
                  ) : null}

                  {phaseSixCalibrationWeightingLoading ? (
                    <p className="status-text" style={{ marginTop: "16px" }}>
                      正在整理 calibration-aware Host weighting...
                    </p>
                  ) : null}

                  {!phaseSixCalibrationWeightingLoading && phaseSixCalibrationWeighting ? (
                    <div className="section-card" style={{ marginTop: "16px" }}>
                      <h3>Host weighting</h3>
                      <p className="muted-text">
                        {phaseSixCalibrationWeighting.weightingPostureLabel}
                      </p>
                      <strong>{phaseSixCalibrationWeighting.hostWeightingSummary}</strong>
                      <p className="muted-text" style={{ marginTop: "8px" }}>
                        {summarizePhaseSixCalibrationAwareWeightingItems(
                          phaseSixCalibrationWeighting.weightingItems,
                        )}
                      </p>
                      <p className="muted-text" style={{ marginTop: "8px" }}>
                        {phaseSixCalibrationWeighting.hostWeightingGuardrailNote}
                      </p>
                      <p className="muted-text" style={{ marginTop: "12px" }}>
                        {phaseSixCalibrationWeighting.recommendedNextStep}
                      </p>
                    </div>
                  ) : null}

                  {phaseSixGuidanceLoading ? (
                    <p className="status-text" style={{ marginTop: "16px" }}>
                      正在整理 generalist guidance posture...
                    </p>
                  ) : null}

                  {!phaseSixGuidanceLoading && phaseSixGuidance ? (
                    <div className="section-card" style={{ marginTop: "16px" }}>
                      <h3>guidance posture</h3>
                      <p className="muted-text">
                        {labelForPhaseSixGuidancePosture(phaseSixGuidance.guidancePosture)}
                      </p>
                      <strong>{summarizePhaseSixWorkGuidance(phaseSixGuidance)}</strong>
                      <p className="muted-text" style={{ marginTop: "8px" }}>
                        {phaseSixGuidance.boundaryEmphasis}
                      </p>
                      <p className="muted-text" style={{ marginTop: "8px" }}>
                        {summarizePhaseSixGuidanceItems(phaseSixGuidance.guidanceItems)}
                      </p>
                      <p className="muted-text" style={{ marginTop: "12px" }}>
                        {phaseSixGuidance.recommendedNextStep}
                      </p>
                    </div>
                  ) : null}
                </>
              ) : null}
            </section>

            {settings.showRecentActivity ? (
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">最近活動</h2>
                  <p className="panel-copy">這裡只放最近幾筆更新；要完整回看再去歷史紀錄。</p>
                  </div>
                  <Link className="button-secondary" href="/history">
                    看全部歷史紀錄
                  </Link>
                </div>

                <div className="detail-list">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((task) => {
                      const summary = buildTaskListWorkspaceSummary(task);

                      return (
                        <Link className="detail-item" href={`/tasks/${task.id}`} key={`activity-${task.id}`}>
                          <div className="meta-row">
                            <span className="pill">工作更新</span>
                            <span>{formatDisplayDate(task.updated_at)}</span>
                          </div>
                          <h3>{task.title}</h3>
                          <p className="workspace-object-path">{summary.objectPath}</p>
                          <p className="muted-text">{summary.decisionContext}</p>
                        </Link>
                      );
                    })
                  ) : (
                    <p className="empty-text">目前還沒有最近活動可顯示。</p>
                  )}
                </div>
              </section>
            ) : null}

            {settings.showFrequentExtensions ? (
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">常用代理 / 模組包</h2>
                    <p className="panel-copy">這裡只讓你快速看到常用項目；要調整設定再進管理頁。</p>
                  </div>
                </div>

                <div className="summary-grid">
                  <div className="section-card">
                    <h4>常用代理</h4>
                    {frequentAgents.length > 0 ? (
                      <ul className="list-content">
                        {frequentAgents.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-text">目前還沒有常用代理摘要。</p>
                    )}
                    <div className="button-row" style={{ marginTop: "12px" }}>
                      <Link className="button-secondary" href="/agents">
                        進入代理管理
                      </Link>
                    </div>
                  </div>
                  <div className="section-card">
                    <h4>常用模組包</h4>
                    {frequentPacks.length > 0 ? (
                      <ul className="list-content">
                        {frequentPacks.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-text">目前還沒有常用模組包摘要。</p>
                    )}
                    <div className="button-row" style={{ marginTop: "12px" }}>
                      <Link className="button-secondary" href="/packs">
                        進入模組包管理
                      </Link>
                    </div>
                  </div>
                </div>

                {extensionLoading ? <p className="status-text">正在整理代理與模組包摘要...</p> : null}
                {!extensionLoading && extensionManager ? (
                  <div className="meta-row" style={{ marginTop: "16px" }}>
                    <span>{extensionManager.agent_registry.active_agent_ids.length} 個可用代理</span>
                    <span>{extensionManager.pack_registry.active_pack_ids.length} 個啟用中模組包</span>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
