# Infinite Pro 工具交接

> 依全域憲法 Cross-Tool Coordination：同一時間只有一個工具在本 repo 施工。開工前先讀本檔；若另一工具標為 active，先問老闆。
> 產品範圍與驗收以 `REBOOT_DIRECTION.md` 為準，施工內容以 `IMPLEMENTATION_PLAN.md` 為準；本檔只記錄交接狀態，不是第二份規格。

## 目前 active 工具

**Claude Code**（2026-10-31 起，老闆指示接手）

Codex 在本 repo 最後一次活動是 2026-10-02，之後沒有進行中的 Codex session。Codex 若要再進來，先問老闆並更新本檔。

## 2026-10-31 · Claude Code · 接手紀錄

### 接手前狀態（由 Codex 完成）

- 2026-09-24 老闆核定總交付範圍（八維度 A~H 各 ≥85、七類案件）與 `IMPLEMENTATION_PLAN.md`；2026-09-25 核准開工。
- Task 1~3 在 `codex/consultant-ready-delivery` 本機完成：測試隔離與七類合成案例、完整材料抽取／來源位置／OCR／容量上限、有預算的全材料閱讀與逐句引用。驗證細節見 `REBOOT_DIRECTION.md` 第 9 節與計畫各 Task。
- Task 4~10 尚未開始；A~H 尚未評分；付費模型授權為 0。

### 本次已做

- 讀過 Codex 的 15 條 Infinite Pro 主對話（2026-03-19 ~ 2026-09-24）與程式、文件、Git 狀態，整理體檢回饋給老闆。
- 把原本只在主 checkout 未提交的 `AGENTS.md` 重啟宣告與 `.gitignore`（`.gstack/`）提交為 `docs: record reboot notice in AGENTS.md and ignore gstack state`，同時放進 `codex/owner-consultant-cockpit-a` 與 `codex/consultant-ready-delivery`，讓施工分支也讀到重啟規則。
- 建立本檔。

### 已驗證 / 未驗證

- 已驗證（2026-10-30，本機、mock provider、`codex/consultant-ready-delivery` 的 `8796c40`，使用 worktree 自己的 `.venv312`）：`run_release_readiness.py --tier static` 通過；backend 475 passed，frontend node tests、build、typecheck 通過。
- 未驗證：真實模型產出、登入後瀏覽器流程、PostgreSQL 全套、多人負載、正式效能、GitHub Actions 實跑。
- 注意：主 checkout 的 `.venv312` 缺少 Task 2 新增依賴（如 `defusedxml`），用它跑會在 import 階段失敗；跑施工分支測試請用 worktree 內的 `.venv312`。

### 分支與同步狀態（2026-10-31 交接時）

| 分支 | 位置 | 相對 GitHub |
| --- | --- | --- |
| `codex/consultant-ready-delivery` | `.worktrees/consultant-ready-delivery`（施工主線） | 2026-10-31 已推送；之後的提交是否已推送，以 `git status -sb` 為準 |
| `codex/owner-consultant-cockpit-a` | 主 checkout | 2026-10-31 已推送，與 origin 相同 |
| `main` | — | 與 origin/main 相同（2026-05-03 `59c2783`），未含 9 月後任何工作 |

推送、merge、部署仍需老闆逐次核准。

### 已知限制與待決事項

- Codex 2026-09-25 ~ 10-02 的施工對話原始檔已不存在；那段過程只能從 Git 提交與方向書第 9 節重建。
- 曾有 API key、OAuth 密鑰與帳密以明文出現在 Codex 對話紀錄（未進 Git 歷史）。建議老闆自行輪換；agent 不代為處理。
- `~/.codex/memory_layers/projects/infinite-pro/` 停在 2026-04-15，已過時；是否更新需老闆授權。
- 已知未修缺陷：Host 未收斂相反建議（Task 5）、首屏載入次要資料（Task 7~8）。共享經驗洩漏已於 2026-10-31 修正（Task 4 第一批）。

### 2026-10-31 · Task 4 第一批

- 兩條分支已推上 GitHub（老闆核准）。
- 修正跨顧問共享經驗洩漏，詳見 `IMPLEMENTATION_PLAN.md` Task 4 進度與方向書第 9 節。完整 static gate 通過（backend 482、frontend 171）。
- Task 4 剩餘：方法／風險／反例代碼目錄（需老闆決定可共享內容型態）、顧問停用與匯出負例、owner 治理清單 firm 過濾、舊資料 dry-run 重建（需核准）。

### 下一步

1. 完成 Task 4 剩餘項目；代碼目錄的內容型態先請老闆決定。
2. 舊候選的 dry-run 重建清單交老闆核准後才執行。
3. 提早安排真實模型預算核定與真人 5 分鐘短案驗收。
