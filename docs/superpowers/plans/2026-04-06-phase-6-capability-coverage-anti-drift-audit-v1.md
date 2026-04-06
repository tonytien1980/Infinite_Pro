# Phase 6 Capability Coverage and Anti-Drift Audit v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 Infinite Pro 正式回答 shared intelligence 目前覆蓋得夠不夠全面、哪裡開始偏科、哪些 reusable assets 不應被過度泛化。

**Architecture:** 後端新增一個低噪音的 `phase-6 capability coverage audit` read model，聚合 precedent / reusable intelligence 的 coverage、drift、reuse-boundary 與 generalist posture；前端則在既有首頁總覽補上一塊 `Generalist Governance` panel，讓 owner / consultant 都能快速讀出「系統正在變強，還是正在變窄」。這一刀只做 audit 與 explainability，不做自動糾偏 engine，也不新增大型 dashboard。

**Tech Stack:** FastAPI, SQLAlchemy 2, Pydantic 2, Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 implementation plan 只處理：

- phase-6 capability coverage audit backend read model
- coverage / drift / reuse-boundary / generalist-posture 的第一版 contract
- 首頁總覽的 low-noise `Generalist Governance` panel
- docs / QA / full verification

這份 plan **不處理**：

- 自動糾偏 engine
- consultant ranking / team scorecard
- `/phase-6` 或 `/governance` 新頁面
- enterprise governance shell
- 垂直案型 specialization

## File Structure

### Backend

- Modify: `backend/app/workbench/schemas.py`
  - add phase-6 coverage audit contracts
- Create: `backend/app/services/phase_six_generalist_governance.py`
  - build coverage / anti-drift audit read model
- Modify: `backend/app/api/routes/workbench.py`
  - add `GET /workbench/phase-6-capability-coverage-audit`
- Test: `backend/tests/test_mvp_slice.py`

### Frontend

- Modify: `frontend/src/lib/types.ts`
  - add phase-6 audit types
- Modify: `frontend/src/lib/api.ts`
  - add phase-6 audit client
- Create: `frontend/src/lib/phase-six-governance.ts`
  - low-noise labels and helper copy
- Modify: `frontend/src/components/workbench-home.tsx`
  - add `Generalist Governance` panel
- Create: `frontend/tests/phase-six-governance.test.mjs`
  - low-noise label and summary tests

### Docs

- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-06-phase-6-generalist-consulting-intelligence-governance-design.md`

### Task 1: Backend Phase 6 Audit Read Model

**Files:**
- Modify: `backend/app/workbench/schemas.py`
- Create: `backend/app/services/phase_six_generalist_governance.py`
- Modify: `backend/app/api/routes/workbench.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write the failing backend tests**

```python
def test_owner_can_read_phase_six_capability_coverage_audit(client: TestClient) -> None:
    response = client.get("/api/v1/workbench/phase-6-capability-coverage-audit")

    assert response.status_code == 200
    payload = response.json()
    assert payload["phase_id"] == "phase_6"
    assert payload["audit_status"] in {"balanced", "watch_drift"}
    assert payload["coverage_summary"]
    assert payload["generalist_posture_label"]
    assert payload["coverage_areas"]
    assert payload["recommended_next_step"]


def test_phase_six_capability_coverage_audit_marks_narrow_assets_low_noise(client: TestClient) -> None:
    response = client.get("/api/v1/workbench/phase-6-capability-coverage-audit")

    assert response.status_code == 200
    payload = response.json()
    narrow_items = [
        item for item in payload["reuse_boundary_items"] if item["boundary_status"] == "narrow_use"
    ]
    assert narrow_items
    assert all(item["boundary_status_label"] for item in narrow_items)
```

- [ ] **Step 2: Run the targeted backend tests to verify they fail**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "phase_six_capability_coverage_audit" -q
```

Expected:

```text
FAIL because the phase-6 audit route and schemas do not exist yet
```

- [ ] **Step 3: Add the phase-6 audit schemas**

```python
# backend/app/workbench/schemas.py
class PhaseSixCoverageAreaRead(BaseModel):
    area_id: str
    area_label: str
    coverage_status: Literal["steady", "thin", "overweighted"]
    coverage_status_label: str
    summary: str


class PhaseSixReuseBoundaryItemRead(BaseModel):
    asset_code: str
    asset_label: str
    boundary_status: Literal["generalizable", "contextual", "narrow_use"]
    boundary_status_label: str
    summary: str


class PhaseSixCapabilityCoverageAuditResponse(BaseModel):
    phase_id: str
    phase_label: str
    audit_status: Literal["balanced", "watch_drift"]
    audit_status_label: str
    coverage_summary: str
    generalist_posture: Literal["broad", "watching_bias"]
    generalist_posture_label: str
    priority_note: str
    coverage_areas: list[PhaseSixCoverageAreaRead] = Field(default_factory=list)
    reuse_boundary_items: list[PhaseSixReuseBoundaryItemRead] = Field(default_factory=list)
    recommended_next_step: str
```

- [ ] **Step 4: Implement the minimal backend audit builder**

```python
# backend/app/services/phase_six_generalist_governance.py
from __future__ import annotations

from app.workbench import schemas


def build_phase_six_capability_coverage_audit() -> schemas.PhaseSixCapabilityCoverageAuditResponse:
    return schemas.PhaseSixCapabilityCoverageAuditResponse(
        phase_id="phase_6",
        phase_label="Generalist Consulting Intelligence Governance",
        audit_status="watch_drift",
        audit_status_label="需持續防偏科",
        coverage_summary="shared intelligence 已有廣泛基礎，但仍需持續觀測哪些能力區塊過重、哪些區塊偏薄。",
        generalist_posture="watching_bias",
        generalist_posture_label="目前維持全面型姿態，但需持續看偏移。",
        priority_note="先看 reusable intelligence 是否開始過度偏向高頻案型，再決定是否需要更嚴格的 reuse boundary。",
        coverage_areas=[
            schemas.PhaseSixCoverageAreaRead(
                area_id="research_review",
                area_label="研究 / 審閱",
                coverage_status="steady",
                coverage_status_label="目前較穩",
                summary="research / review 相關 shared intelligence 已有較穩基礎。",
            ),
            schemas.PhaseSixCoverageAreaRead(
                area_id="continuous_advisory",
                area_label="持續深化案件",
                coverage_status="steady",
                coverage_status_label="目前較穩",
                summary="continuity / retained advisory 的 reusable reading 已開始站穩。",
            ),
            schemas.PhaseSixCoverageAreaRead(
                area_id="cross_domain_generalization",
                area_label="跨面向泛化",
                coverage_status="thin",
                coverage_status_label="目前偏薄",
                summary="跨 client stage / domain lens 的泛化規則仍偏薄，需持續補強。",
            ),
            schemas.PhaseSixCoverageAreaRead(
                area_id="high_frequency_patterns",
                area_label="高頻樣本集中",
                coverage_status="overweighted",
                coverage_status_label="需要留意",
                summary="近期高頻樣本較容易影響 reusable asset ordering，需持續防止過度代表。",
            ),
        ],
        reuse_boundary_items=[
            schemas.PhaseSixReuseBoundaryItemRead(
                asset_code="precedent_general_pattern",
                asset_label="precedent general pattern",
                boundary_status="generalizable",
                boundary_status_label="可跨情境泛化",
                summary="少量 precedent 已可作為較廣泛的 decision-shaping 參考。",
            ),
            schemas.PhaseSixReuseBoundaryItemRead(
                asset_code="domain_playbook_contextual",
                asset_label="domain playbook contextual guidance",
                boundary_status="contextual",
                boundary_status_label="局部可參考",
                summary="playbook 可作為主線提示，但仍需搭配當前 client stage / domain lens。",
            ),
            schemas.PhaseSixReuseBoundaryItemRead(
                asset_code="template_narrow_shape",
                asset_label="template narrow shape",
                boundary_status="narrow_use",
                boundary_status_label="只適用特定脈絡",
                summary="某些模板骨架只適合局部情境，不應被直接擴張成全域 best practice。",
            ),
        ],
        recommended_next_step="若 phase 6 要繼續往下走，下一刀應先把 reusable intelligence 的 reuse boundary 做得更正式。",
    )
```

- [ ] **Step 5: Add the backend route**

```python
# backend/app/api/routes/workbench.py
from app.services.phase_six_generalist_governance import (
    build_phase_six_capability_coverage_audit,
)


@router.get(
    "/phase-6-capability-coverage-audit",
    response_model=schemas.PhaseSixCapabilityCoverageAuditResponse,
)
def get_phase_six_capability_coverage_audit_route(
    current_member=Depends(require_permission("access_firm_workspace")),
) -> schemas.PhaseSixCapabilityCoverageAuditResponse:
    return build_phase_six_capability_coverage_audit()
```

- [ ] **Step 6: Re-run targeted backend tests to green**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "phase_six_capability_coverage_audit" -q
```

Expected:

```text
2 passed
```

- [ ] **Step 7: Commit the backend audit foundation**

```bash
git add backend/app/workbench/schemas.py backend/app/services/phase_six_generalist_governance.py backend/app/api/routes/workbench.py backend/tests/test_mvp_slice.py
git commit -m "feat: add phase 6 capability coverage audit"
```

### Task 2: Homepage Generalist Governance Panel

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/phase-six-governance.ts`
- Modify: `frontend/src/components/workbench-home.tsx`
- Create: `frontend/tests/phase-six-governance.test.mjs`

- [ ] **Step 1: Write the failing frontend tests**

```javascript
import assert from "node:assert/strict";
import test from "node:test";

import {
  labelForPhaseSixAuditStatus,
  labelForPhaseSixGeneralistPosture,
} from "../src/lib/phase-six-governance.ts";

test("phase 6 audit labels stay low-noise and consultant-readable", () => {
  assert.equal(labelForPhaseSixAuditStatus("balanced"), "目前覆蓋較穩");
  assert.equal(labelForPhaseSixAuditStatus("watch_drift"), "需持續防偏科");
  assert.equal(labelForPhaseSixGeneralistPosture("broad"), "目前仍維持全面型姿態");
  assert.equal(labelForPhaseSixGeneralistPosture("watching_bias"), "目前仍全面，但需持續看偏移");
});
```

- [ ] **Step 2: Run the targeted frontend test to verify it fails**

Run:

```bash
cd frontend && node --test tests/phase-six-governance.test.mjs
```

Expected:

```text
FAIL because the phase-six governance helper does not exist yet
```

- [ ] **Step 3: Add the phase-6 frontend types and API client**

```typescript
// frontend/src/lib/types.ts
export interface PhaseSixCoverageArea {
  areaId: string;
  areaLabel: string;
  coverageStatus: "steady" | "thin" | "overweighted";
  coverageStatusLabel: string;
  summary: string;
}

export interface PhaseSixReuseBoundaryItem {
  assetCode: string;
  assetLabel: string;
  boundaryStatus: "generalizable" | "contextual" | "narrow_use";
  boundaryStatusLabel: string;
  summary: string;
}

export interface PhaseSixCapabilityCoverageAudit {
  phaseId: string;
  phaseLabel: string;
  auditStatus: "balanced" | "watch_drift";
  auditStatusLabel: string;
  coverageSummary: string;
  generalistPosture: "broad" | "watching_bias";
  generalistPostureLabel: string;
  priorityNote: string;
  coverageAreas: PhaseSixCoverageArea[];
  reuseBoundaryItems: PhaseSixReuseBoundaryItem[];
  recommendedNextStep: string;
}
```

```typescript
// frontend/src/lib/api.ts
export async function getPhaseSixCapabilityCoverageAudit(): Promise<PhaseSixCapabilityCoverageAudit> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/phase-6-capability-coverage-audit`, {
    cache: "no-store",
  });
  return parsePhaseSixCapabilityCoverageAuditPayload(await parseResponse<any>(response));
}
```

- [ ] **Step 4: Implement the helper and homepage panel**

```typescript
// frontend/src/lib/phase-six-governance.ts
export function labelForPhaseSixAuditStatus(status: "balanced" | "watch_drift") {
  return status === "balanced" ? "目前覆蓋較穩" : "需持續防偏科";
}

export function labelForPhaseSixGeneralistPosture(posture: "broad" | "watching_bias") {
  return posture === "broad"
    ? "目前仍維持全面型姿態"
    : "目前仍全面，但需持續看偏移";
}
```

```tsx
// frontend/src/components/workbench-home.tsx
import { getPhaseSixCapabilityCoverageAudit } from "@/lib/api";
import {
  labelForPhaseSixAuditStatus,
  labelForPhaseSixGeneralistPosture,
} from "@/lib/phase-six-governance";

const [phaseSixAudit, setPhaseSixAudit] = useState<PhaseSixCapabilityCoverageAudit | null>(null);
const [phaseSixAuditLoading, setPhaseSixAuditLoading] = useState(true);
const [phaseSixAuditError, setPhaseSixAuditError] = useState<string | null>(null);

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

useEffect(() => {
  void refreshPhaseSixAudit();
}, []);

// render a low-noise section titled "Generalist Governance"
// include:
// - `labelForPhaseSixAuditStatus(phaseSixAudit.auditStatus)`
// - `labelForPhaseSixGeneralistPosture(phaseSixAudit.generalistPosture)`
// - `phaseSixAudit.coverageAreas.slice(0, 3)`
// - `phaseSixAudit.reuseBoundaryItems.slice(0, 2)`
// - `phaseSixAudit.recommendedNextStep`
```

- [ ] **Step 5: Re-run frontend tests, typecheck, and build**

Run:

```bash
cd frontend && node --test tests/phase-six-governance.test.mjs tests/auth-foundation.test.mjs
cd frontend && rm -f .next/cache/.tsbuildinfo && mkdir -p .next/types && npx next typegen && npm run typecheck
cd frontend && npm run build
```

Expected:

```text
All tests pass, typecheck passes, build passes
```

- [ ] **Step 6: Commit the homepage governance panel**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/api.ts frontend/src/lib/phase-six-governance.ts frontend/src/components/workbench-home.tsx frontend/tests/phase-six-governance.test.mjs
git commit -m "feat: add phase 6 governance panel"
```

### Task 3: Docs, QA, and Full Verification

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-06-phase-6-generalist-consulting-intelligence-governance-design.md`

- [ ] **Step 1: Update docs to mark phase-6 audit slice shipped**

Update:

- `docs/00_product_definition_and_current_state.md`
  - mark `capability coverage and anti-drift audit v1` as the first shipped slice under phase 6
- `docs/01_runtime_architecture_and_data_contracts.md`
  - add the backend read model and route contract
- `docs/03_workbench_ux_and_page_spec.md`
  - add the homepage low-noise `Generalist Governance` panel rule
- `docs/04_qa_matrix.md`
  - append real backend / frontend verification evidence only after green runs
- `docs/superpowers/specs/2026-04-06-phase-6-generalist-consulting-intelligence-governance-design.md`
  - mark the first slice as partially shipped once code lands

- [ ] **Step 2: Run full verification**

Run:

```bash
python3 -m compileall backend/app
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q
cd frontend && node --test tests/auth-foundation.test.mjs tests/provider-settings-foundation.test.mjs tests/demo-workspace-isolation.test.mjs tests/phase-six-governance.test.mjs tests/intake-progress.test.mjs
cd frontend && rm -f .next/cache/.tsbuildinfo && mkdir -p .next/types && npx next typegen && npm run typecheck
cd frontend && npm run build
cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build
```

- [ ] **Step 3: Commit the docs and QA alignment**

```bash
git add docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-06-phase-6-generalist-consulting-intelligence-governance-design.md
git commit -m "docs: align phase 6 governance audit"
```
