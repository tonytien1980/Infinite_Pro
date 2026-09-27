"use client";

import { useEffect, useState } from "react";
import { getMaterialCapacity, getMaterialSupport, type MaterialCapacity, type MaterialSupportContract } from "@/lib/api";

export function MaterialSupportNotice({ taskId, revision = 0 }: { taskId?: string; revision?: number }) {
  const [opened, setOpened] = useState(false);
  const [support, setSupport] = useState<MaterialSupportContract | null>(null);
  const [capacityResult, setCapacity] = useState<{ taskId: string; value: MaterialCapacity } | null>(null);
  const capacity = capacityResult && capacityResult.taskId === taskId ? capacityResult.value : null;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) return;
    let active = true;
    setError(null);
    setCapacity(null);
    void getMaterialSupport().then(async (value) => {
      if (!active) return;
      setSupport(value);
      if (taskId) {
        const current = await getMaterialCapacity(taskId);
        if (active) setCapacity({ taskId, value: current });
      }
    }).catch(() => {
      if (active) setError("暫時無法讀取容量資訊；送出時仍會由系統檢查，請稍後重新展開。 ");
    });
    return () => { active = false; };
  }, [opened, taskId, revision]);

  return (
    <details onToggle={(event) => setOpened(event.currentTarget.open)}>
      <summary>支援格式與容量</summary>
      {error ? <p className="error-text" role="status">{error}</p> : null}
      {!support && !error ? <p className="muted-text">正在讀取支援範圍...</p> : null}
      {support ? <div className="muted-text">
        <p>支援文字、PDF、Word、Excel、CSV{support.ocr_enabled ? "，以及清晰的中英文掃描檔與圖片" : "；本環境尚未啟用掃描文字辨識"}。</p>
        <p>單檔最多 {support.max_file_bytes / 1024 / 1024} MiB、{support.max_source_chars.toLocaleString()} 字元；同案最多 {support.max_case_sources} 份來源、{support.max_case_chars.toLocaleString()} 字元。</p>
        <p>PDF 最多 {support.max_pdf_pages} 頁，其中掃描辨識最多 {support.max_ocr_pages} 頁；圖片最多 {(support.max_image_pixels / 1_000_000).toLocaleString()} 百萬像素。Excel 最多 {support.max_sheets} 張表、{support.max_cells.toLocaleString()} 個有內容儲存格。</p>
        <p>Office 文件解壓後最多 {support.max_zip_bytes / 1024 / 1024} MiB、{support.max_zip_entries.toLocaleString()} 個項目。一般解析最長 {support.parse_timeout_seconds} 秒{support.ocr_enabled ? `；掃描辨識每頁最長 ${support.ocr_page_timeout_seconds} 秒、每檔最長 ${support.ocr_file_timeout_seconds / 60} 分鐘` : ""}。</p>
        {capacity ? <p>本案目前 {capacity.source_count} 份來源，計入容量 {capacity.extracted_chars.toLocaleString()} 字元。{capacity.unverified_source_count > 0 ? "舊材料尚未驗證時，會先按單份上限保守計入；重新讀取後更新。" : ""}</p> : null}
        <p>超限不會偷偷截斷；未讀部分會明確提示。OCR 文字、公式快取與重要數字仍需核對。</p>
      </div> : null}
    </details>
  );
}
