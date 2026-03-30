"use client";

import { formatFileSize } from "@/lib/ui-labels";
import {
  defaultProgressInfoForPreviewItem,
  previewItemCanKeepAsReference,
  type IntakeItemProgressInfo,
  type IntakeMaterialPreviewItem,
} from "@/lib/intake";

function itemStatusClass(status: IntakeMaterialPreviewItem["status"]) {
  if (status === "accepted") {
    return "intake-status-pill intake-status-accepted";
  }
  if (status === "limited") {
    return "intake-status-pill intake-status-limited";
  }
  if (status === "unsupported" || status === "issue") {
    return "intake-status-pill intake-status-unsupported";
  }
  return "intake-status-pill intake-status-pending";
}

function itemNoteClass(status: IntakeMaterialPreviewItem["status"]) {
  if (status === "unsupported" || status === "issue") {
    return "error-text";
  }
  if (status === "limited" || status === "pending") {
    return "muted-text";
  }
  return "success-text";
}

function progressClass(phase: IntakeItemProgressInfo["phase"]) {
  if (phase === "done") {
    return "intake-progress-pill intake-progress-done";
  }
  if (phase === "uploading" || phase === "parsing") {
    return "intake-progress-pill intake-progress-active";
  }
  if (phase === "blocked" || phase === "failed") {
    return "intake-progress-pill intake-progress-blocked";
  }
  return "intake-progress-pill intake-progress-ready";
}

function replaceLabelForItem(item: IntakeMaterialPreviewItem) {
  if (item.kind === "file") {
    return "替換";
  }
  if (item.kind === "url") {
    return "回網址欄修正";
  }
  return "回文字欄改寫";
}

function normalizeMetadata(item: IntakeMaterialPreviewItem) {
  return item.metadata.map((entry) => {
    if (/^\d+(\.\d+)?\s*KB$/i.test(entry)) {
      const sizeInKb = Number(entry.replace(/[^0-9.]/g, ""));
      if (Number.isFinite(sizeInKb) && sizeInKb > 1024) {
        return formatFileSize(sizeInKb * 1024);
      }
    }
    return entry;
  });
}

export function IntakeMaterialPreviewList({
  items,
  onRemove,
  onRetry,
  onReplace,
  onKeepAsReference,
  progressByItemId,
  keepAsReferenceByItemId,
  emptyText = "目前還沒有待送出的材料。",
}: {
  items: IntakeMaterialPreviewItem[];
  onRemove?: (item: IntakeMaterialPreviewItem) => void;
  onRetry?: (item: IntakeMaterialPreviewItem) => void;
  onReplace?: (item: IntakeMaterialPreviewItem) => void;
  onKeepAsReference?: (item: IntakeMaterialPreviewItem) => void;
  progressByItemId?: Record<string, IntakeItemProgressInfo>;
  keepAsReferenceByItemId?: Record<string, boolean>;
  emptyText?: string;
}) {
  if (items.length === 0) {
    return <p className="empty-text">{emptyText}</p>;
  }

  return (
    <div className="intake-item-list">
      {items.map((item) => (
        <div className="intake-item" key={item.id}>
          {(() => {
            const markedReference = Boolean(keepAsReferenceByItemId?.[item.id]);
            const progress =
              progressByItemId?.[item.id] ??
              defaultProgressInfoForPreviewItem(item, {
                keepAsReference: markedReference,
              });
            return (
              <>
          <div className="intake-item-header">
            <div className="meta-row">
              <span className="pill">{item.kindLabel}</span>
              <span className={itemStatusClass(item.status)}>{item.statusLabel}</span>
              <span className={progressClass(progress.phase)}>{progress.label}</span>
            </div>
          </div>
          <h4>{item.title}</h4>
          {normalizeMetadata(item).length > 0 ? (
            <p className="muted-text">{normalizeMetadata(item).join("｜")}</p>
          ) : null}
          {item.preview ? <p className="content-block">{item.preview}</p> : null}
          <p className="muted-text">
            <strong>是否擋住送出：</strong>
            {progress.blocksSubmit ? "會，這份材料需要先處理。" : "不會，這份材料可依目前規則一起送出。"}
          </p>
          <p className="muted-text">
            <strong>目前進度：</strong>
            {progress.detail}
          </p>
          {(progress.attemptCount ?? 0) > 0 || progress.latestAttemptLabel ? (
            <p className="muted-text">
              <strong>最近一次處理：</strong>
              {progress.latestAttemptLabel || `第 ${progress.attemptCount} 次結果已更新。`}
              {progress.latestAttemptDetail ? `｜${progress.latestAttemptDetail}` : ""}
            </p>
          ) : null}
          <div className="detail-list" style={{ marginTop: "12px" }}>
            <div className="detail-item" style={{ padding: "12px 14px" }}>
              <p className={itemNoteClass(item.status)} style={{ marginBottom: "8px" }}>
                <strong>這代表什麼：</strong>
                {item.statusDetail}
              </p>
              <p className="muted-text" style={{ marginBottom: "8px" }}>
                <strong>會影響什麼：</strong>
                {item.impactDetail}
              </p>
              <p className="muted-text" style={{ marginBottom: 0 }}>
                <strong>建議下一步：</strong>
                {item.recommendedNextStep}
              </p>
              {item.fallbackStrategy ? (
                <p className="muted-text" style={{ marginTop: "8px", marginBottom: 0 }}>
                  <strong>較佳替代方式：</strong>
                  {item.fallbackStrategy}
                </p>
              ) : null}
            </div>
          </div>
          <div className="button-row" style={{ justifyContent: "flex-start", marginTop: "12px" }}>
            {onRetry && progress.phase === "failed" && progress.retryable ? (
              <button
                className="button-secondary"
                type="button"
                onClick={() => onRetry(item)}
              >
                重試
              </button>
            ) : null}
            {onReplace ? (
              <button
                className="button-secondary"
                type="button"
                onClick={() => onReplace(item)}
              >
                {replaceLabelForItem(item)}
              </button>
            ) : null}
            {onKeepAsReference && previewItemCanKeepAsReference(item) ? (
              <button
                className="button-secondary"
                type="button"
                onClick={() => onKeepAsReference(item)}
              >
                {markedReference ? "已標記 reference" : "保留為 reference"}
              </button>
            ) : null}
            {onRemove ? (
              <button
                className="button-secondary intake-item-remove"
                type="button"
                onClick={() => onRemove(item)}
              >
                移除
              </button>
            ) : null}
          </div>
              </>
            );
          })()}
        </div>
      ))}
    </div>
  );
}
