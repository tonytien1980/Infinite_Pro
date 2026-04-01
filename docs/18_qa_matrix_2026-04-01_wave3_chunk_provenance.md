# 18_qa_matrix_2026-04-01_wave3_chunk_provenance.md

## 範圍

本文件記錄 Wave 3 `ChunkObject / MediaReference / retrieval provenance` 的驗證證據。

正式範圍：
- text-first / parseable material 的 chunk provenance
- limited-support / reference-level material 的 media reference provenance
- `source -> chunk/media -> evidence -> deliverable` 可回看回鏈
- consultant-first disclosure，不污染首屏主線

不涵蓋：
- Wave 4 interface / required properties / pack contract
- Wave 5 `ObjectSet` views
- graph explorer / object explorer 類大型瀏覽器

---

## Build / typecheck / compile

### Backend

執行：

```bash
python3 -m compileall backend/app
```

結果：
- 通過

### Frontend

執行：

```bash
cd frontend && npm run typecheck
cd frontend && npm run build
```

結果：
- `typecheck` 通過
- `build` 通過

---

## Backend pytest

執行：

```bash
.venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q
```

結果：
- `90 passed`

Wave 3 相關新增 / 強化驗證包括：
- text upload 會產生 `ChunkObject`
- `source_chunk` evidence 會回帶 `retrieval_provenance`
- limited-support image upload 會回帶 `MediaReference`
- deliverable workspace 至少有一條 chunk-backed linked evidence chain

---

## Live smoke

使用：
- terminal Playwright CLI workflow

Smoke data：
- matter id: `c7d3a8b3-003c-4641-896b-faf92ded8997`
- task id: `c65ec846-dc08-4725-bf6b-80f3dcb613bd`
- deliverable id: `cde87f6c-fd5a-4e91-8a7c-847d8dd460de`

### `/matters/[matterId]/evidence`

驗到：
- 首屏仍以 sufficiency / gaps / supplement 為主，沒有 provenance wall
- 展開 `證據支撐鏈` 後，可看到：
  - `引用來源片段`
  - chunk locator，例如 `片段 1｜字元 1-169`
  - `支援層級：full`
  - 真正的 chunk excerpt
- 同頁也可看到 limited-support image 的：
  - `引用媒體參照`
  - `支援層級：limited`
  - `可用範圍：reference_only`

### `/tasks/[taskId]`

驗到：
- 首屏主線仍是工作導引與執行 / 回看交付物，不是 provenance
- 展開 `證據與補充資料` 後，可看到 chunk-backed evidence 的 provenance disclosure
- consultant-first wording 維持為「引用來源片段 / 引用媒體參照」

### `/deliverables/[deliverableId]`

驗到：
- 首屏仍是交付物摘要、版本、可信度與下一步，不是 citation wall
- `依據來源與 ontology 回鏈` 區塊可回看到 chunk-backed evidence
- 展開 `完整回鏈與支撐明細` 後，可看到：
  - `wave3-notes.txt - 片段 1`
  - `引用來源片段`
  - chunk excerpt
  - limited-support image 仍維持 reference-level 顯示

---

## 結論

Wave 3 已達成最小但真實的 shipped behavior：
- 有正式 `ChunkObject` contract
- 有正式 `MediaReference` contract
- evidence 已可回鏈到 source-level 之下更精準的 support point
- deliverable 已可回看至少一條 `source -> chunk -> evidence -> deliverable` 鏈
- limited-support / unsupported materials 仍誠實停留在 reference-level
- 首屏主線未被 provenance 噪音污染
