"use client";

import { formatFileSize } from "@/lib/ui-labels";
import type { IntakeMaterialPreviewItem } from "@/lib/intake";

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
  emptyText = "目前還沒有待送出的材料。",
}: {
  items: IntakeMaterialPreviewItem[];
  onRemove?: (item: IntakeMaterialPreviewItem) => void;
  emptyText?: string;
}) {
  if (items.length === 0) {
    return <p className="empty-text">{emptyText}</p>;
  }

  return (
    <div className="intake-item-list">
      {items.map((item) => (
        <div className="intake-item" key={item.id}>
          <div className="intake-item-header">
            <div className="meta-row">
              <span className="pill">{item.kindLabel}</span>
              <span className={itemStatusClass(item.status)}>{item.statusLabel}</span>
            </div>
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
          <h4>{item.title}</h4>
          {normalizeMetadata(item).length > 0 ? (
            <p className="muted-text">{normalizeMetadata(item).join("｜")}</p>
          ) : null}
          {item.preview ? <p className="content-block">{item.preview}</p> : null}
          <p className={itemNoteClass(item.status)}>{item.statusDetail}</p>
        </div>
      ))}
    </div>
  );
}
