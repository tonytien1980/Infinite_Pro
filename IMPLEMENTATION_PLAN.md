# Infinite Pro 完整交付 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: 使用 `superpowers:executing-plans` 在主對話依序執行。全域規則禁止未核准的實體子代理；此計畫不授權 subagent-driven-development。
> 日期：2026-09-24。2026-09-25 老田核准直接開工，狀態：**已核准，實作中。**
> 產品依據：`REBOOT_DIRECTION.md` 已由老田確認。本計畫不重新定義八維度或降低 85 分標準。

**Goal:** 讓顧問以案件為中心，讀入完整且可追溯的材料、取得有取捨的專業成果，並安全地重用經驗。

**Architecture:** 保留六層與 Host。材料、證據、判斷、成果與回饋沿既有 owner 改善；不新增第二套案件資料、ACL、工作佇列或治理看板。

**Tech Stack:** 既有 FastAPI、SQLAlchemy、Pydantic、PostgreSQL、Next.js／React 與 provider adapters。新增依賴的用途與界線列於第 2 節，尚未安裝。

## 1. 執行邊界與順序

這是一個完整交付計畫，不是十個新產品。下列 Task 是工程拆解，對應方向書的四包工作；只有全部相應標準通過，才宣告整體交付。每個 Task 按「重現／red test、修改 owner、green test、回歸、文件、review、commit」完成，不以完成一段程式就重新宣告產品可用。

| Task | 交付結果 | 方向書維度 | 相依 |
| --- | --- | --- | --- |
| 1 | 安全的測試入口、七類案件材料與基準 | A~H | 無 |
| 2 | 完整解析、來源位置與本機 OCR | A、C、D、F | 1 |
| 3 | 有預算邊界的全材料閱讀與逐項引用 | A、D、F | 2 |
| 4 | 共享內容與原案權限分離，舊資料不自動放行 | A、F、H | 1；3 的引用介面 |
| 5 | 分階段／客戶／領域的分析與跨領域取捨 | B、C、D | 3、4 |
| 6 | 同案補件、成果版本、回饋與經驗效果對照 | E、H | 4、5 |
| 7 | 案件列表與案件室的簡單工作路徑 | G；A、E、F | 2~6；可先設計，不先宣告完成 |
| 8 | 多人執行、用量提醒、恢復、效能與 CI | F、G | 3~7 |
| 9 | 真實模型與登入後整體驗收 | A~H | 1~8 |
| 10 | 獲准後整合、部署、還原與交付回讀 | F；A~H | 9 通過與發布授權 |

Task 1~4 是第一包「可信材料、引用與共享」；5~6 是第二包；7~8 是第三包；9~10 是第四包。這個順序不要求到 Task 8 才寫 CI：測試入口先建立，新增回歸隨各 Task 接入，Task 8 收尾正式運作驗證。

本計畫的資料結構、函式與測試範例是待實作契約，不表示 repo 已有。施工時可調整內部命名，但不得靜默更改行為、容量、權限或驗收門檻；發現新風險時回報原因及影響，不擅自換方向。

## 2. 已核定的工程選擇

### 材料容量與執行預算

以下是已核定的初始支援契約，不是已量測出的系統能力。實作須做上限、上限加一與失敗恢復測試；未達標就回報未完成，不自動降低上限。

| 項目 | 提議值／行為 |
| --- | --- |
| 單檔／案件材料 | 單檔 20 MiB，單案最多 20 個來源；ZIP 型文件解壓總量最多 100 MiB、單項 20 MiB、最多 2,000 項；不接受加密檔、外部關聯抓取或宏執行 |
| PDF／OCR | 單檔最多 100 頁，其中需 OCR 的頁面最多 20 頁；PNG／JPEG／WebP 最多 20 百萬像素；中英文印刷文字，不承諾手寫或嚴重模糊 |
| 試算表 | 最多 10 張表、20,000 個有內容儲存格；保留表名、座標、合併區域、公式與快取值；不執行外部連結，不假裝快取值必然最新 |
| 文字 | 單來源抽取後最多 100,000 字元，單案件本輪最多 300,000 字元；以多個限制中最先碰到者為準，不只按檔案大小 |
| 模型材料分批 | 每批材料文字最多 24,000 字元；完整 request 仍須按 provider 的 context／輸出預留做 token 檢查，不能用字元數當 token 數 |
| 分析呼叫 | 每個 run 最多 32 次 provider attempts，含閱讀、專業分析、收斂與重試；不得在每個專業模組重讀一次全部原文 |
| 時間 | OCR 每頁最多 15 秒、單檔最多 300 秒；非 OCR 解析單檔最多 30 秒；分析單次 provider timeout 最多 90 秒、run 最多 15 分鐘；短案仍須通過既定 5 分鐘門檻 |
| 超限／不完整 | 寫明已讀、未讀及原因；保留可重試來源，不自動縮小材料後宣告完整。若影響決策，Host 不可產出未揭露缺口的正式結論 |

限制由 `backend/app/core/config.py` 持有、後端執行、前端讀取；不可各寫一份不一致的常數。長案支援上限不是每次都能在 5 分鐘內完成的宣稱。

### 依賴、模型與費用

- DOCX 沿用 python-docx，PDF 文字沿用 pypdf，CSV 用 Python `csv`；XLSX 改用 openpyxl，搭配 defusedxml，不繼續擴充自製 OOXML parser。
- OCR 提議用容器內 Poppler 渲染及 Tesseract `chi_tra+eng`，不默認把圖片交給外部 AI。以 `subprocess.run` 的參數陣列、`shell=False`、`timeout=15`、每頁資源上限與私人暫存目錄執行；移除暫存影像但保留抽取結果、位置與辨識警告。
- 依賴只加到專案 requirements／Dockerfile；不修改這台 Mac 的全域工具。實作時鎖定實際驗證版本與語言資料，不使用浮動 latest。官方依據：[Tesseract](https://tesseract-ocr.github.io/tessdoc/)、[OCR TSV](https://tesseract-ocr.github.io/tessdoc/FAQ.html)、[openpyxl 公式說明](https://openpyxl.readthedocs.io/en/stable/simple_formulae.html)。openpyxl 不等於 Excel 公式計算引擎。
- 沿用現有 provider 選擇與憑證 owner；不因開發模型進步就更換產品模型。需要比較其他模型時，在相同案例與預算下另行取得模型／資料授權。
- **目前付費模型授權為 0。** mock 與本機解析可做工程驗證；真實模型評核前由 Codex 提出指定 provider／model、單價來源、輸入輸出預算與總費用上限，取得確認才執行。未知單價不填零，也不假稱已估完成本。
- 主案例為 7 案 × 3 種材料版本 × 2 次 = 42 次案件執行；共享開／關對照再 42 次，錯誤／撤回經驗的 7 案各 2 次再 14 次，共 98 次案件執行。一次案件可能含多次模型請求，不能把 98 當 API 呼叫量；理論上限 3,136 attempts，應先 dry-run 依材料規模列出較實際的呼叫計畫。
- 上述 98 次僅是品質案例庫，不含五帳號運作測試及初次使用觀察；這些若用真實模型，也須逐項加入同一呼叫 manifest 與費用申請，不能算成免費或在核准數量外追加。
- 若另比較一個模型，再增加 42 次基準案件；不得默認翻倍支出。QA runner 的費用 hard stop 與產品的基本成本提醒分開，後者不擅自替顧問加購額或封鎖政策。

### Report-only 簡化檢查

- `source_materials.py`: reuse 現有 `ChunkObject`／`Evidence`／參與連結；不加另一套文件向量真相。
- `shared_intelligence_risk_gates.py`: shrink 將安全投影集中在既有共享 owner；不要在每個 UI 或 prompt 各寫遮罩。
- `host.py`: reuse 現有 Host／TaskRun；不新增 Redis queue、第二個 orchestrator 或自動 provider fallback。
- `files.py`: native XLSX 使用維護中的文件函式庫；OCR 用成熟 CLI，不自行寫辨識器。
- 不以「全部 source 小於 1,500 行」為施工目標，只拆本輪改動的獨立責任。此為計畫 preflight，尚無程式 diff，未宣稱可刪除的行數；施工前後仍各做真實 diff review。

## 3. 測試、資料與 Git 的共同規則

目前 `backend/tests/conftest.py` 的 fixture 會 `drop_all`，而 `DATABASE_URL` 使用 `setdefault`；所有測試必須先隔離環境，不能直接沿用 `.env` 跑。先在 Task 1 加拒絕非測試資料庫的檢查，再執行涉及 DB 的新測試。

本機 SQLite 測試的執行範本，從 repo 根目錄使用；`RUN_ROOT` 必須保留在該次 shell session，不能下一個命令遺失後落回 `.env`：

```bash
RUN_ROOT=$(mktemp -d /private/tmp/infinite-pro-test.XXXXXX)
env IP_TEST_RUN_ROOT="$RUN_ROOT" DATABASE_URL="sqlite+pysqlite:///$RUN_ROOT/test.db" UPLOAD_DIR="$RUN_ROOT/uploads" DERIVED_DIR="$RUN_ROOT/derived" RELEASE_DIR="$RUN_ROOT/releases" MODEL_PROVIDER=mock PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests -q
```

PostgreSQL 驗證使用獨立 disposable 測試資料庫、限定測試角色及明確的測試授權標記，不對產品 DB 執行 fixture。mock 測試不准偷偷走外部搜尋或模型 API。完整 gate 包含全 backend tests、前端 `node --test tests/*.test.mjs`、build、typecheck；修正 `run_release_readiness.py` 的舊白名單，不能以子集合全綠冒充全套。

Git 起點是 `codex/owner-consultant-cockpit-a@ff4e71c`。不自行合併該分支；實作開始前先保存核定規格／計畫於明確文件 commit，保留既有 `.gitignore`／`AGENTS.md` 修改，不 `git add .`。再建立 `codex/consultant-ready-delivery` 的隔離 worktree，從包含核定文件的明確 commit 開始；不從舊 main 開工漏掉 5 個既有提交。若分支已有同名，先讀取用途，不覆蓋。各 Task 只 stage 該 Task 檔案；發布、merge／push／部署維持獨立核准。

Schema 變更集中既有 `backend/app/core/database.py` 的 incremental schema owner；不另加第二套 migration runner。新增欄位以可空／明確舊版預設加入，SQLAlchemy model、Pydantic schema、前端 types 同步。每次至少驗證新庫、舊版種子庫升級、重複升級、SQLite 與 PostgreSQL；不是只 `create_all` 一次。

## 4. Task 1：安全測試入口與代表案例

**Files:** 修改 `backend/tests/conftest.py`、`backend/scripts/run_release_readiness.py`、`frontend/package.json` 與 `README.md`；新增 `backend/tests/test_test_environment_guard.py`、`backend/tests/fixtures/consulting_cases.json`、`backend/tests/test_consulting_case_manifest.py`、`frontend/package-lock.json`。`.github/workflows/ci.yml` 隨 gate 接入；不改產品權限來方便測試。

- [x] 寫 guard 的正反測試，驗證 inherited PostgreSQL／非隔離 SQLite URL 被拒絕、合法臨時 SQLite 可執行，阻擋發生在 import app 與 drop_all 前。
- [x] 修正 fixture 的 runtime/storage path 與清理範圍，使用 `IP_TEST_RUN_ROOT` 的受限臨時目錄；未設定時 fixture 自行建立新的測試根目錄，不從產品 `.env` 接受 DB。所有清理限定該次測試根目錄；PostgreSQL 另驗證測試角色與明確 allow flag，不能只靠 DB 名稱含 test。
- [x] 將七案材料、正常／補件／反例與預期關鍵事實寫成同一份機器可讀 fixture；財務案附人工可重算數字，法務案附虛構條款而非假冒真實法規。每案需有 stage、client type、domains、must_include、must_not_claim、expected_decision_conditions。
- [x] 重現已知治理斷言失敗，判斷是保留行為的測試過時還是實作漂移；只在與核定規格對照後同步修正，不 skip、不只改為包含任意字串。
- [x] 改全套入口並接 CI 定義，確認所有新增測試會被收集；本機完整 gate 通過，GitHub Actions 尚未推送或執行。

2026-09-25 Task 1 工程工作已驗證：SQLite 全套 349 passed、前端 165 passed、build／typecheck 通過；PostgreSQL 16 以臨時容器驗證 6 項選定測試及兩個拒絕案例，public 保護標記保留、run schema 數量回到 0，容器已移除。完整證據與限制見方向書第 9 節。不是第一包或產品驗收完成；Task 2~10 尚未完成。

實作說明：guard 直接在既有 conftest 的 app import 前執行，未新增 runtime 安全設定或測試平台。除了範例的路徑限制，亦拒絕既存 SQLite 檔案，防止破壞既有資料。前端套件鎖在原工作目錄已使用版本，並以 `npm ci` 重建驗證，沒有夾帶 Next／React 升級。

Guard 的 SQLite 判定核心寫在 `conftest.py`，並由專用測試以子程序驗證 import 是否會拒絕，不能在測試主程序先連到被檢查的 DB：

```python
from pathlib import Path
from tempfile import gettempdir
from sqlalchemy.engine import make_url

def require_isolated_sqlite(database_url: str, runtime_root: Path) -> None:
    url = make_url(database_url)
    if url.drivername != "sqlite+pysqlite" or not url.database:
        raise RuntimeError("Expected an isolated SQLite test database")
    database = Path(url.database).resolve()
    root = runtime_root.resolve()
    allowed_parents = {Path(gettempdir()).resolve(), Path("/private/tmp").resolve()}
    if root.parent not in allowed_parents or not root.name.startswith("infinite-pro-test."):
        raise RuntimeError("Test root must be a dedicated temporary directory")
    if database.parent != root or database.name != "test.db":
        raise RuntimeError("Test database must belong to this test run")
```

驗證：上述全套隔離命令；前端於 `frontend/` 跑 `node --test tests/*.test.mjs`、`npm run build`、`npm run typecheck`。先記錄 red，再修正後取得 green；原 sandbox bind 限制只在核准的測試環境重跑，不改應用程式繞過。

## 5. Task 2：材料抽取與可定位證據

**Files:** 修改 `backend/app/ingestion/files.py`、`preprocess.py`、`backend/app/services/uploads.py`、`sources.py`、`source_materials.py`、`ingestion_contracts.py`、`material_storage.py`、`backend/app/core/config.py`、`database.py`、`backend/app/domain/models.py`、`schemas.py`、`backend/requirements.txt`、`backend/Dockerfile`。新增 `backend/app/ingestion/ocr.py`、`backend/tests/test_material_fidelity.py`；前端同步 `frontend/src/lib/types.ts`、`material-review-ux.ts`。

- [ ] 將 6,322 字尾段、DOCX 表格、XLSX 第 8 列／第 5 張表及混合文字／掃描 PDF 做成 red tests；另測 UTF-8 非法字元、損毀／加密／超限檔、zip bomb、缺少公式快取及 OCR timeout。
- [ ] `FileExtractResult` 保留既有介面，增加有位置的 blocks、coverage 與 warnings；每個來源只有一份抽取狀態，`SourceMaterial` 從 `SourceDocument` 派生，不各維護一套覆蓋率。
- [ ] DOCX 依 body 順序讀 paragraph／table，保留表格行列與合併資訊；XLSX 同時讀 formula 與 cached value，CSV 用正式 parser 保留欄位。PDF 逐頁讀取，不能因部分頁面有文字就將整份混合掃描檔標為完整。
- [ ] OCR 在 container 內執行且受第 2 節限制；回傳頁碼／區域與辨識資訊，低品質標 limited，讓顧問核對關鍵數字。不用一個信心分數保證內容無誤。
- [ ] `SourceDocument.extraction_manifest`（新增 JSON）記錄版本、範圍、blocks 位置與警告；完整文字仍在原 extracted_text／derived storage owner。`ChunkObject.extraction_version` 與 `locator`（新增）對應來源版本，不另存一份同義原文。
- [ ] 切片涵蓋全部支援範圍，取消預設四片靜默截斷；保持 `0 <= overlap < chunk_size`，明確 cap 溢出就回報，不回傳假完整前綴。offset 說明以 block 內文字為準，不冒充原 PDF byte offset。
- [ ] 原始檔／舊成果不刪除；舊來源沒 manifest 時標為未重新驗證。重處理附新的 extraction version，舊引用仍能定位舊 chunks，不覆寫已交付報告依據。

計畫新增的抽取 block 契約：

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class ExtractedBlock:
    text: str
    locator_kind: str
    locator_label: str
    page_number: int | None = None
    sheet_name: str | None = None
    cell_range: str | None = None
    confidence: float | None = None
```

`FileExtractResult.blocks` 使用 `tuple[ExtractedBlock, ...]`；coverage 為 `complete / partial / unavailable`，表示抽取覆蓋，不表示 AI 已理解所有內容。以下可直接作為前兩個 red tests，後續其他格式使用相同真實 parser 路徑：

```python
from io import BytesIO
from docx import Document
from app.ingestion.files import analyze_upload_content
from app.ingestion.preprocess import build_text_chunk_specs, normalize_text

def test_long_text_tail_is_preserved():
    text = ("source material " * 500) + "CRITICAL_TAIL_CLAUSE"
    chunks = build_text_chunk_specs(text)
    assert chunks[-1].end_offset == len(normalize_text(text))
    assert any("CRITICAL_TAIL_CLAUSE" in item.text for item in chunks)

def test_docx_table_is_extracted():
    document = Document()
    document.add_paragraph("Contract")
    document.add_table(rows=1, cols=1).cell(0, 0).text = "PAYMENT_TABLE_123456"
    stream = BytesIO()
    document.save(stream)
    result = analyze_upload_content("contract.docx", stream.getvalue())
    assert "PAYMENT_TABLE_123456" in result.text
```

驗證：`pytest backend/tests/test_material_fidelity.py -q`（按第 3 節隔離執行），再跑完整 backend。正向案例要求 blocks、文字、manifest、DB chunks 與 API 支援狀態一致；只是這兩個 tests 綠，不代表 Task 2 完成。

## 6. Task 3：材料閱讀預算與逐項引用

**Files:** 修改 `backend/app/model_router/base.py`、`structured_tasks.py`、`mock.py`、`openai_provider.py`、`anthropic_provider.py`、`gemini_provider.py`，`backend/app/agents/base.py`、`host.py` 及 `agents/core/`／`agents/specialists/` 的既有分析實作。新增 `backend/app/agents/evidence_reading.py`、`backend/app/services/citation_validation.py`、`backend/tests/test_evidence_reading.py`、`test_citation_validation.py`。模型／schema／前端 types 同步；新增檔案僅是 Host 與證據 owner 的內部 helper，不是新架構層。

- [ ] 寫 provider spy 測試，要求所有支援內 chunks 都在閱讀請求的 manifest 出現，沒有只讀頭尾；每批 request 不超過限制；各專業模組重用同 run 的閱讀結果。
- [ ] Host 在 routing 後、專業分析前，將材料按預算分批送既有 provider boundary。閱讀輸出包含事實、數字、條件、衝突、缺口與原 Evidence IDs；輸出只能引用本批可存取證據。
- [ ] 原文只解析一次、每批只讀一次；同 run 重用結果，不加跨案件快取。分批摘要太大時分層收斂，保留來源 refs 與衝突，不再用字串 slicing 偷丟後段。達 run 限制則明示本次未完成。
- [ ] 在 model boundary 加 `EvidenceReadingRequest/Output` 與 provider 方法，各 adapter 使用現有 HTTP／結構驗證 owner；mock 提供固定可檢核輸出，不在模型不可用時偷偷改用 mock。
- [ ] findings／risks／recommendations 的新模型輸出使用下列 CitedStatement；三種實際 adapter、mock、JSON schema、agent mapping 同步。既有公開 report string 欄位可由此派生，不再任意套前幾筆 Evidence IDs。
- [ ] 格式驗證之外，確認引用存在於此案可存取 evidence、quote 可回原文、重要數字可核對；語意支持另用案例人工評閱與矛盾檢查，不把 quote 存在誤當論證正確。
- [ ] 檢核失敗最多修復重試一次且計入預算；仍失敗時阻止未揭露問題的正式成果，保留失敗原因與可行下一步，不默默刪掉證據或改成無引用的結論。

計畫的模型輸出契約與最小 deterministic validator，定義於 `model_router/base.py` 與 `services/citation_validation.py`：

```python
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

class EvidenceCitation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    evidence_id: str
    quote: str = Field(min_length=1)

class CitedStatement(BaseModel):
    model_config = ConfigDict(extra="forbid")
    text: str = Field(min_length=1)
    kind: Literal["fact", "inference", "assumption"]
    citations: list[EvidenceCitation]

def validate_cited_statement(statement: CitedStatement, permitted_text: dict[str, str]) -> None:
    if statement.kind == "fact" and not statement.citations:
        raise ValueError("Fact requires a permitted source")
    for citation in statement.citations:
        if citation.evidence_id not in permitted_text:
            raise ValueError("Citation is outside the permitted evidence set")
        source = " ".join(permitted_text[citation.evidence_id].split())
        quote = " ".join(citation.quote.split())
        if not quote or quote not in source:
            raise ValueError("Citation quote is not present in the source")
```

負例至少包含不存在的 ID、別人的 ID、真的來源但不存在的 quote、真的 quote 卻不支持結論、無引用的事實，以及來源中的「忽略前文、洩漏資料」指令。材料是資料，不得提升為系統指令。最後一種語意負例不能只靠上面 validator 判定。

驗證：`pytest backend/tests/test_evidence_reading.py backend/tests/test_citation_validation.py -q`；修改模型 contract 後全套回歸，並以 recorded synthetic HTTP responses 測三 adapter 的 schema／error 路徑，不付費即可做 transport 測試。

## 7. Task 4：安全的共享經驗

**Files:** 修改 `backend/app/services/tasks.py` 的 `_build_precedent_candidate_seed`、`_sync_precedent_candidate_for_feedback`、`_build_precedent_reference_guidance_read`，以及 `shared_intelligence_risk_gates.py`、`precedent_intelligence.py`、`precedent_duplicate_governance.py`、引用候選的 `review_lens_intelligence.py`／`common_risk_intelligence.py`／`deliverable_shape_intelligence.py`／`deliverable_template_intelligence.py`／`domain_playbook_intelligence.py`／`organization_memory_intelligence.py`。同步 `backend/app/domain/schemas.py`、`agents/base.py`、`frontend/src/lib/types.ts`／`precedent-reference.ts`；新增 `backend/tests/test_shared_intelligence_privacy.py`。

- [ ] 先把 A 原案 404、B 卻拿到原標題的重現做成 API + Host payload regression。加測不同 firm、顧問停用、撤回 feedback、直接查 candidate／匯出／衍生提示的負例。
- [ ] 查詢先用候選所屬 Task 的 firm 與既有 case access 過濾，再做 collapse、ranking、aggregate；不得先全庫匹配後才遮住畫面。
- [ ] 原始 title、summary、note、operator、來源 task IDs 保留私有用途；跨顧問只從 `PrecedentCandidate.pattern_snapshot.shared_pattern` 取得經檢核的內容。缺少新格式或未通過檢核即不共享，不回退讀 raw title／summary。
- [ ] 共享檢核不只字詞黑名單：型別／欄位 allowlist、原案已知實體與聯絡資訊、可重識別的數字／條款、來源權限及撤回狀態都要檢查；模型不得自行把內容標 safe 當成唯一放行條件。
- [ ] **預設自動共享使用封閉代碼與核准通用文字組合**：依既有回饋 reason codes、主題、階段與 reusable assets catalog 選適用方法、風險、反例。原案自由文字不得進入共享 DTO。新生成、無法以允許內容表示的經驗留在私有候選，必要時由 owner 個別確認；不要求顧問逐案審核，也不聲稱任意自然語言已能可靠匿名化。
- [ ] `PrecedentReferenceItemRead.source_task_id` 改可空；跨顧問原案不可存取時，不回傳來源 ID、原標題或操作者。來源只在有原案權限的管理／案件路徑可見；前端不可憑缺少 link 以外的欄位拼出來源。
- [ ] 所有衍生 reference builders 只能消費 safe projection，不可重新從 pattern_snapshot 的原始 summary／top_risks 繞回去。撤回或狀態改變後，下一個請求就停止引用；歷史成果記錄不被重寫。

共享投影的最小新契約放在既有 risk-gates owner，代碼表取自現有資產契約；沒有穩定代碼的通用方法／條件／反例就在原資產 owner 補上明確定義，不另造一份平行 catalog。只有明確核准的通用內容可加入允許清單，不能把原案標題、自由文字或自訂 pack 名稱當代碼而自動放行：

```python
from pydantic import BaseModel, ConfigDict

class SharedPattern(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schema_version: int
    method_codes: list[str]
    risk_codes: list[str]
    condition_codes: list[str]
    counterexample_codes: list[str]

def validate_pattern_codes(pattern: SharedPattern, allowed: dict[str, set[str]]) -> None:
    if pattern.schema_version != 1:
        raise ValueError("Unsupported shared pattern schema")
    for field in ("method_codes", "risk_codes", "condition_codes", "counterexample_codes"):
        if not set(getattr(pattern, field)).issubset(allowed[field]):
            raise ValueError(f"Unapproved values in {field}")
```

不把只剩模板選擇當 H 達標：Task 6／9 的對照仍須證明經驗帶來改善。若封閉表示法不足以達標，回報具體缺少的方法，再由老田決定是否擴大可分享的內容型態；不可擅自解除邊界換取高分。

驗證：`pytest backend/tests/test_shared_intelligence_privacy.py backend/tests/test_identity_access.py -q`，再全套。舊資料處理採 dry-run 列出數量與原因、核准後經同一 candidate owner 重建 safe projection；不刪原案、不直接改歷史為安全。這不是用永久 workaround 假裝已完成：舊資料重建與負例必須在交付前驗收。

## 8. Task 5：專業分析與 Host 真正收斂

**Files:** 修改 `backend/app/agents/host.py`、`agents/base.py`、`model_router/base.py`／`structured_tasks.py`／三 adapters／`mock.py`，及 `agents/core/operations.py`、`finance_capital.py`、`legal_risk.py`、`marketing_growth.py`、`sales_business_development.py`、`strategy_business_analysis.py`；必要的情境調整放既有 `backend/app/extensions/registry.py`。新增 `backend/tests/test_consulting_reasoning.py`。

- [ ] 寫兩個 CoreAgentResult 分別要求擴編／凍結的 red test，驗證不能只 flatten 或任取第一 finding。再加入原資料相同但 stage／client type 不同的合成案例。
- [ ] 分析 request 明確帶入已存在的 stage／client type／domain context，未提供時列假設或問最少必要問題，不替客戶編造成熟度與財務狀況。
- [ ] 每個領域依已核定案例產出獨特判斷，而非只換角色名稱。營運需責任控制點；財務需計算輸入與公式；商務需合作／定價條件；法務需條款依據與限制；行銷需受眾／通路試驗；銷售需漏斗阻力與跟進；策略需優先序與取捨。
- [ ] 在 Host 加一個真正的 convergence provider task，輸入受檢核的分析片段、同一證據集合與限制；輸出選項、互斥條件、取捨、建議與適用條件，仍由 Host 驗證並保存。專業模組不各自宣布 final。
- [ ] 候選互斥或材料不足時，可以產出有條件建議／待確認結論，不能逼模型假裝已收斂。對事實或條款不可只按多數票。
- [ ] 財務驗算在後端使用 `decimal.Decimal`，只允許明確的加減乘除與已定義計算，不 `eval` 模型公式；法規有時效性時沿既有 external-search owner 查主來源，查不到就保留限制，不由測試 fixture 假充查證。

Convergence 的新增資料形狀（由 base.py 的 Pydantic 模型與 structured_tasks.py 的 JSON schema 同步表達）：

```json
{
  "options": [
    {"id": "hold", "description": "先凍結擴編", "evidence_refs": ["cash-source"], "conditions": ["現金限制尚未解除"]},
    {"id": "expand", "description": "分批擴編", "evidence_refs": ["demand-source"], "conditions": ["取得已確認的新資金"]}
  ],
  "recommended_option_id": "hold",
  "tradeoffs": ["保留現金，但成長速度較慢"],
  "unresolved_conflicts": [],
  "next_actions": ["先核對可動用資金，再決定第一批人力"]
}
```

要求 recommended ID 存在、每個 evidence ID 可存取、有條件的建議保留條件；補件足以改變限制時新版本可改選 expand，舊版本不改寫。

驗證：`pytest backend/tests/test_consulting_reasoning.py -q` + 全套；mock 僅驗整合與 invariant，七領域品質留給 Task 9 真實模型評閱，不提前填 85 分。

## 9. Task 6：同案延續、版本與回饋重用

**Files:** 修改 `backend/app/services/tasks.py`、`content_revisions.py`、`deliverable_records.py`、`case_command_loop.py`、`precedent_intelligence.py`，`backend/app/domain/models.py`／`schemas.py`、`core/database.py`，`backend/app/api/routes/deliverables.py`／`matters.py`；新增 `backend/tests/test_case_continuity_and_feedback.py`。

- [ ] 同案初稿、補件、新稿、採納、修改理由、結果回報的 API red tests；加送出同一 feedback 兩次、對舊版本回饋、舊建議被新材料推翻的負例。
- [ ] 補件先更新既有世界與 participation links，Host 才分析；保存輸入資料版本及新舊結論差異。不能把 follow-up 複製成無關新案，也不能覆寫原來的 decision／outcome。
- [ ] `AdoptionFeedback` 加 `deliverable_revision_id` 對應實際成果內容版本；目前 upsert 表示最新有效回饋，歷次改動經既有 AuditEvent 記錄版本、前後值與理由。更新報告不自動把舊版本的「交出去了」搬過去。
- [ ] 「要再改」回饋需能接續成果修改／重分析，該動作經既有修訂與 Host 路徑，不直接把自由文字寫成 final。新成果預設 pending_confirmation，由顧問確認；生成、確認、匯出與實際交付是不同事件。
- [ ] 共享候選錨定來源 revision；負回饋、來源被改寫或撤回時立即使相應 shared projection 不可用，其他獨立來源的經驗不被一併抹除。
- [ ] 先改善既有情境匹配、適用／不適用條件與來源去重，讓反例確實阻止錯誤參考；不預先加入向量資料庫。只有對照顯示現有檢索無法達到 H 時才提出有證據的語意檢索方案，不能直接宣布已完成學習。

API 回饋請求示例，revision 必須屬於同一有權成果；不存在／不符時 409／404，不默認套用最新版本：

```json
{
  "feedback_status": "needs_revision",
  "deliverable_revision_id": "revision-2",
  "reason_codes": ["insufficient_evidence"],
  "note": "請把新收到的付款條件納入現金風險判斷。"
}
```

驗證：`pytest backend/tests/test_case_continuity_and_feedback.py -q` + 全套；另比對 Word／Markdown 匯出實際內容、版本與引用，不只檢查下載 status 200。

## 10. Task 7：案件列表與案件室

**Files:** 修改 `frontend/src/components/app-shell.tsx`、`matters-page-panel.tsx`、`matter-workspace-panel.tsx`、`task-create-form.tsx`、`deliverable-workspace-panel.tsx`、`adoption-feedback-controls.tsx`，`frontend/src/app/page.tsx`／`new/page.tsx`／`matters/[matterId]/page.tsx`，`frontend/src/lib/api.ts`／`types.ts`／`workbench-home-load-plan.ts`／`workbench-lazy-surface-plan.ts`／`workspace-local-rail.ts`；相應調整 `backend/app/services/tasks.py` 的 canonical intake defaults 與 `domain/schemas.py`。新增 `frontend/tests/case-room-flow.test.mjs`，沿用既有 auth／upload／language tests。

- [ ] 先定義並測案件列表 → 開案 → 輸入一句話／附材料 → 分析 → 來源 → 修改／匯出 → 回饋的主路徑；不再讓顧問先選 workflow／agent／pack。
- [ ] `/` 直接使用案件列表能力，導覽只留案件與設定；`/matters/[matterId]` 是主工作面，`/new` 只作開案入口。既有任務／成果 deep link 保留可用，回到所屬案件；不能把有資料的舊路由直接 404。
- [ ] 最少輸入在後端 canonical intake 推導工作型態；UI 只送使用者提供的材料與意圖，不自行推 Host 決策。純檔案也能開始；資料不足時問一個必要問題，不跳出長表單。
- [ ] 案件室集中材料、最新成果、一次主要行動；引用與歷史按需展開。來源警告、失敗與重試不是 debug-only 內容，須看得到。
- [ ] 保留原本可靠的 native file input、登入／登出與 session boundary；實際點擊檔案選擇、鍵盤操作、手機寬度與長文字均驗證，不只查原始碼。
- [ ] 成果渲染使用文字節點／安全 Markdown，不渲染未清理的模型 HTML。引用只能連到後端確認的來源，資料中帶的 URL 不作為登入導轉。
- [ ] 首屏只讀案件列表所需資料；次要資料在使用者展開時才請求，不是資料已全載入但 CSS 藏起來。設定中的成員／provider 功能仍依既有權限可達，不等於刪除管理能力。

案例室的狀態轉換由 API 事實決定，這是測試所需狀態表，不新增另一套後端狀態機：

```text
無材料 -> 可輸入／上傳
有材料且完整 -> 可開始分析
材料部分可讀 -> 顯示未讀範圍與補救，不假稱完整
分析中 -> 顯示既有 TaskRun 狀態，可離開再回看
失敗 -> 可重試且不重複交付／計費
成果待確認 -> 看依據、修改、確認／匯出
已有成果又補件 -> 顯示本輪變更，舊版可回看
```

驗證：全部前端 tests、build、typecheck，及已登入瀏覽器在桌面／窄螢幕走主路徑、5 分鐘觀察。source-level tests 不能代替瀏覽器行為；不關閉使用者已登入視窗或清掉 session。

## 11. Task 8：可靠運作、用量與效能

**Files:** 修改 `backend/app/agents/host.py`、`api/routes/runs.py`、`model_router/base.py`／`factory.py`／三 adapters、`services/system_provider_settings.py`／`personal_provider_settings.py`／`firm_operating_snapshot.py`、`domain/models.py`／`schemas.py`／`core/database.py`，以及 `frontend/src/components/settings-page-panel.tsx` 與既有 provider panels。新增 `backend/app/services/provider_usage.py`、`backend/tests/test_run_recovery_and_usage.py`、`backend/scripts/verify_backup_restore.py`；更新 `backend/scripts/run_release_readiness.py`、`.github/workflows/ci.yml`、`README.md`、`docker-compose.yml` 及既有 Dockerfile。

- [ ] 寫同 task 雙擊／重試、五帳號同時辦案、provider timeout、程序中斷、舊憑證不可用與備份還原測試。每筆成果必須屬於原 run／案子／顧問。
- [ ] TaskRun 增加 idempotency key 與必要的執行階段／輸入版本 metadata；同一次請求不重跑。起跑先提交 run 狀態，分析後以現有 transaction 保存成果；同案使用 DB 原子狀態更新防重入，不只鎖前端按鈕。
- [ ] 不新增背景 queue。沿既有同步 run request，UI 可保持可操作並透過 task aggregate 查執行狀態；超時／斷線必須先查原 run，不能盲目再付費跑一次。程序中斷的 running run 依已超過 deadline／失去執行者的明確條件標為 interrupted，需人觸發重試，不自動無限 rescue。
- [ ] 新增單一 `ProviderUsageEvent` 記錄每次 attempt 的 request ID、firm／user、task/run（可空）、provider/model、credential scope、狀態、輸入／輸出用量、費用估計及價目版本；不記 API key 或原始提示。事件歸屬經 request-scoped provider instance 傳遞，不以共享可變全域狀態記當前顧問。所有模型呼叫透過既有 factory／adapter，不能只計算成功回覆而漏掉重試；失敗但用量未知時留未知，不能填零當免費。
- [ ] 系統提醒分清「自己的模型／firm 模型」「已知用量／估計費用／未知」；未設定個人模型才按原政策用 firm 預設。個人 key 失敗不默默改花 firm 額度，除非既有明確核准政策允許並可見。
- [ ] 測試 runner 在預算耗盡前停止後續呼叫並保存已完成結果，將該批標未完成；產品僅基本提醒，不新增收費、訂閱、credits 或帳務系統。
- [ ] 正式 build、目標 DB、固定裝置／資料量下量測既定 p95／1 秒回應與五帳號 2 輪；記錄 provider 延遲與前端延遲，不互相掩蓋。CI 跑全部免費回歸，付費評核不放每次 push 自動觸發。
- [ ] 備份／還原 script 預設 dry-run，必須指定隔離 destination，驗證資料庫與 raw／derived／release storage 的一致性；生產還原需要另行批准，不能為測試覆蓋原環境。

用量事件範例為 schema 契約，不是新帳務產品：

```json
{
  "request_id": "attempt-uuid",
  "firm_id": "firm-uuid",
  "user_id": "member-uuid",
  "task_run_id": "run-uuid",
  "provider_id": "configured-provider",
  "model_id": "configured-model",
  "credential_scope": "personal",
  "status": "succeeded",
  "input_tokens": 1200,
  "output_tokens": 500,
  "estimated_cost": null,
  "price_version": null
}
```

驗證：`pytest backend/tests/test_run_recovery_and_usage.py -q` + 全套；在 PostgreSQL 而非只 SQLite 執行 concurrency／upgrade。正式 Docker command 使用 production build／非 reload 啟動；端口依全域環境登記選擇，不自行佔用其他產品服務。

## 12. Task 9：整體驗收，不再憑感覺給分

**Files:** 延伸 `backend/app/benchmarks/runner.py` 及既有 benchmark manifests 的測試入口，新增 `backend/scripts/run_consulting_acceptance.py`、`backend/tests/test_consulting_acceptance_runner.py`，使用 Task 1 的唯一案件 fixture。成果與評核紀錄存一次執行產物目錄，`REBOOT_DIRECTION.md` 只連結該次摘要，不再 append 長篇日誌。

- [ ] runner 支援 dry-run／mock／live 三種明確模式，預設 dry-run；dry-run 列出病例、版本、重跑次數、provider calls 估計與費用缺口，不能碰真實 API。
- [ ] mock 模式驗證流程、權限、格式與必填證據；live 需使用已核准 provider／資料／費用、目標服務、已登入測試帳號。不以 auth override 的 TestClient 宣稱真人登入流程已通過。
- [ ] 依 98 次案件執行範圍做基準與共享對照，保存設定、輸入 digest、結果、來源驗證、耗時、用量與失敗。重複測試不能只挑最好的一次展示；評核不先告知是哪個模型或是否用了共享經驗。
- [ ] 自動檢查不得出現的資料、數字與引文位置；專業品質與是否值得交給客戶由老田／對應顧問確認。只完成欄位數或 keyword match 不算 85 分。
- [ ] 逐項填 A~H 的五項證據與分數，D 取七領域最低分；未測項維持未評。安全／重大事實／核心流程失敗不能被其他分數平均。
- [ ] 修復發現的阻礙，重跑受影響 Task 與整體反例；新想法不自動納入此輪。真的無法達標時報告原因、範圍影響與選擇，不假裝完成。

產物最低結構：

```json
{
  "revision": "tested-git-sha",
  "dirty_diff_digest": "tested-diff-digest",
  "fixture_digest": "fixture-digest",
  "mode": "live",
  "model_config_digest": "non-secret-config-digest",
  "results": [],
  "human_reviews": [],
  "dimensions": {"A": null, "B": null, "C": null, "D": null, "E": null, "F": null, "G": null, "H": null},
  "critical_failures": [],
  "budget_exhausted": false
}
```

這裡的 null 是未評狀態，不是可交付結果；必須填入真實證據後才可通過。fixture／model／程式版本改變時，不沿用無效評分。

## 13. Task 10：資料遷移、發布與回滾

**Files:** 沿 Task 2／4／6／8 的 schema／資料 owner，`backend/scripts/verify_backup_restore.py`、`README.md` 與本計畫。所有實際外部變更需有明確執行授權。

- [ ] 對準實際目標主機／DB／storage，先只讀盤點與備份；不把停著的本機 Docker 等同線上環境。
- [ ] 新增欄位對舊資料預設未知／未驗證；manifest、shared_pattern、feedback revision 分別經來源可追溯程序補齊，不在啟動時假造成功值。遷移 dry-run 顯示會改哪些記錄及數量，再取得資料變更授權。
- [ ] 已有引用依賴的 chunks／報告／回饋歷史保留；只有派生索引或不安全共享投影退出檢索。若源材料已按保留政策不存在，標出不可重驗，不編造來源。
- [ ] 發布前完整 code review、Ponytail diff review、相應安全檢查、全套回歸與已登入 QA。依賴／secret／權限／uploads／model trust boundary 檢查不以一項測試替代。
- [ ] 得到 merge／push／部署批准後，合併、跑合併後驗證、push，回讀 GitHub SHA 與 CI；部署另查實際運行版本與資料庫 schema。分支相同不代表服務已更新。
- [ ] 回滾先停止新 run 與寫入、保存診斷與新資料，再回到已驗證的前版與一致備份；不得自動 drop 新欄位或遺失已交付成果。不允許回到已知會洩漏的共享路徑作為正常服務；必要時保持服務停用直到安全恢復，明確告知老田。
- [ ] 整體驗收通過後交付操作與恢復說明，才開始核定的 4 週真案使用觀察；未完成觀察不宣稱長期效果已證明。

## 14. 完整性核對與本次狀態

| 核定要求 | 實作責任 | 驗收位置 |
| --- | --- | --- |
| 八維度各達 85、不平均弱項 | 1、5、9 | 方向書第 4~6 節、Task 9 |
| 材料完整、OCR、表格、可定位引用 | 2、3 | 原重現 + 上限／超限 + 真實材料評閱 |
| 單一 firm 3~5 顧問、原案隔離、共享經驗 | 4、6、8 | API／模型輸入／五帳號負例與 H 對照 |
| 三階段、四型態、七領域與取捨 | 1、5、9 | 七案三版本，逐領域最低分 |
| 持續案件、成果版本、修改與匯出 | 6、7 | 補件差異、回饋 revision、Word／Markdown 回讀 |
| 簡單介面、5 分鐘、首屏效能 | 7、8、9 | 真實瀏覽器、初階／高階觀察、production timings |
| 自有模型／firm 預設、基本用量提醒、不計費 | 8 | 憑證錯誤、歸屬與重試用量測試 |
| QA 由 agent 承擔、專業判斷由人確認 | 1、9 | 自動證據與人類評閱分離 |
| 本機／GitHub／runtime／文件一致 | 8、10 | CI、合併後驗證、實際版本與還原回讀 |

- [x] 已依 `ff4e71c` 的實際 owner／schema／API 編寫，未把 7 月舊建議當成已實作。
- [x] 已把總規格核定狀態更新到 `REBOOT_DIRECTION.md`。
- [x] 2026-09-25 老田核准本實作計畫並要求直接開始；付費、真實資料與發布授權仍分開。
- [ ] Task 1~10 的程式、schema、測試與相應文件實作及驗收。
- [ ] 真實模型的指定配置、資料授權與費用上限另行核准。
- [ ] 舊資料變更、merge／push／部署另行核准並執行回讀。

2026-09-25 已進入實作；各 Task 的完成狀態以勾選及方向書的最新驗證摘要為準，未勾選不代表已完成。付費模型、真實資料遷移與發布尚未執行或授權。
