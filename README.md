# Infinite Pro

Infinite Pro is an ontology-first consulting workbench for a single consultant's full working scope.

Approved delivery scope: one firm with 3-5 consultants, separate case work and safe shared intelligence. The existing foundation below is not a claim that the new acceptance criteria have passed.

Current direction: [REBOOT_DIRECTION.md](REBOOT_DIRECTION.md). Approved implementation sequence: [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). The older `docs/` set is historical architecture and verification context, not the current delivery checklist.

---

## Product Snapshot

Infinite Pro is not:

- a generic chatbot wrapper
- a consultant training platform
- a generic enterprise admin console
- a small prompt utility with a few specialist flows

Infinite Pro is:

- a Host-orchestrated consulting workbench
- a world-first case system built around `CaseWorldState`
- an evidence-linked, deliverable-centric advisory platform
- a single-consultant product with full-scope capability boundary and phased implementation order

Current shipped baseline includes:

- one canonical intake pipeline with one unified `/new` intake surface
- `CaseWorldDraft -> CaseWorldState` as the formal intake-to-world path
- formal matter, evidence, and deliverable workspaces
- Host-led orchestration with agent registry / resolver and pack registry / resolver
- simplified agent / pack creation that uses minimal user input plus backend AI + external-search contract synthesis
- chunk / media provenance
- object-set baseline
- continuity / writeback baseline
- regression suite coverage for the shipped hardening families

Wave 0 through Wave 5 deepen baseline is complete.

`P0-0` through `P0-H` hardening / extension baseline is complete.

`P0 hardening line is formally closed.`

---

## Active Docs

After the global and repository AGENTS instructions, read:

1. [REBOOT_DIRECTION.md](REBOOT_DIRECTION.md): approved scope, acceptance criteria and latest evidence.
2. [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md): execution order, owners, tests and approval boundaries.

Earlier architecture references:

1. [docs/00_product_definition_and_current_state.md](docs/00_product_definition_and_current_state.md)
   Product identity, capability boundary, current product state, fit, non-goals, and next-phase decision.
2. [docs/01_runtime_architecture_and_data_contracts.md](docs/01_runtime_architecture_and_data_contracts.md)
   Runtime shape, object chain, intake, persistence, provenance, writeback, provider boundary, and bridge notes.
3. [docs/02_host_agents_packs_and_extension_system.md](docs/02_host_agents_packs_and_extension_system.md)
   Host orchestration, agent system, pack contracts, extension manager, and management guardrails.
4. [docs/03_workbench_ux_and_page_spec.md](docs/03_workbench_ux_and_page_spec.md)
   Workbench IA, page roles, first-screen rules, disclosure rules, visual posture, and page-to-page flow.

Verification and quality docs:

- [docs/04_qa_matrix.md](docs/04_qa_matrix.md)
  The single living record of shipped build, smoke, and verification evidence.
- [docs/05_benchmark_and_regression.md](docs/05_benchmark_and_regression.md)
  Benchmark manifests, regression suite structure, gate modes, and runner runbook.

Historical governance docs:

- [archive/docs/2026-04-documentation-reset/](archive/docs/2026-04-documentation-reset/)

Research references:

- [research/docs/](research/docs/)

The `docs/` folder retains the earlier baseline. Its old scores and verification entries are not fresh delivery evidence.

Important extension rule:

- creating an agent or pack in the management UI does not automatically bind it into runtime execution
- Host still decides whether an agent or pack is actually used in a task
- standard creation flows should remain minimal-input; deeper contract fields are synthesized and validated in the backend

---

## Repository Structure

```text
.
├── AGENTS.md
├── README.md
├── docker-compose.yml
├── .env.example
├── docs/
│   ├── 00_product_definition_and_current_state.md
│   ├── 01_runtime_architecture_and_data_contracts.md
│   ├── 02_host_agents_packs_and_extension_system.md
│   ├── 03_workbench_ux_and_page_spec.md
│   ├── 04_qa_matrix.md
│   └── 05_benchmark_and_regression.md
├── frontend/
├── backend/
└── storage/
    ├── uploads/
    ├── derived/
    └── releases/
```

---

## Local Startup

### Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Then open:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### Backend standalone path

```bash
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements-dev.txt
DATABASE_URL=sqlite+pysqlite:///./local.db \
UPLOAD_DIR=./storage/uploads \
PYTHONPATH=backend \
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Frontend standalone path

```bash
cd frontend
npm install
npm run dev
```

Build and typecheck:

```bash
cd frontend
npm run build
npm run typecheck
```

If `typecheck` fails because `.next/types` is missing or stale, run:

```bash
cd frontend
rm -f .next/cache/.tsbuildinfo
mkdir -p .next/types
npx next typegen
npm run typecheck
```

## Release Readiness Baseline

The static gate runs **all** `backend/tests`, every `frontend/tests/*.test.mjs`, then frontend build and typecheck. CI uses the same entrypoint with no provider credentials. `npm test` runs the frontend suite; `npm ci --ignore-scripts` installs its checked-in lockfile.

Backend tests create a fresh `infinite-pro-test.*` directory under the system temporary directory. The database and raw/derived/release storage must all belong to that run. Inherited non-test `DATABASE_URL` or storage paths are rejected before the app loads, rather than silently reused or cleared. Tests require `MODEL_PROVIDER=mock`, suppress provider credentials from `.env`, and block outbound non-loopback socket connections.

```bash
python -m pytest backend/tests -q
```

Use a clean shell for that command. To explicitly supply SQLite paths, use the bounded temporary-directory example in `IMPLEMENTATION_PLAN.md`; do not point tests at `local.db`. A PostgreSQL test run additionally requires `IP_TEST_ALLOW_DISPOSABLE_POSTGRES=1`, an unprivileged role and database comment `infinite-pro-disposable-test`. Each run creates and removes only its own random schema. This is for disposable test databases, not a way to authorize tests against product data.

The synthetic seven-case fixture is `backend/tests/fixtures/consulting_cases.json`: each case has base, supplement and counterexample materials, review expectations and recomputable financial checks. Passing the fixture tests verifies its integrity, not model quality or an 85-point product score.

Repo-native static gate:

```bash
PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py --tier static
```

Repo-native runtime gate (standalone local runtime):

```bash
PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py \
  --tier runtime \
  --runtime-profile standalone
```

Repo-native runtime gate (Docker Compose profile):

```bash
PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py \
  --tier runtime \
  --runtime-profile docker-compose
```

Verification tiers:

- `static`
  - backend compile / pytest, frontend node tests, build, typecheck
- `runtime`
  - repo-native HTTP smoke, with explicit `standalone` or `docker-compose` profile
- `browser smoke`
  - operator-assisted consultant-facing flow checks against the normalized smoke manifest
  - required direct-route targets:
    - `/`
    - `/new`
    - `/matters`
    - `/deliverables`
  - optional dynamic-entry target:
    - `/tasks/[taskId]`, entered from `/matters` when a visible task row is available

Authenticated browser smoke baseline:

- use an existing authenticated browser session, or import cookies from a real local Chromium browser
- do not use auth bypass or fake session injection
- record the auth entry method together with the smoke evidence

---

## Environment Notes

Use [`.env.example`](.env.example) as the bootstrap baseline.

Important notes:

- `DATABASE_URL` defaults to the Docker Compose PostgreSQL service
- storage roots are split into raw uploads, derived extracts, and released artifacts
- provider precedence is `DB runtime config -> env baseline`
- `.env` is bootstrap / emergency baseline, not the long-term active config path
- credentials remain backend-side and are managed through `/settings`

For full runtime semantics, read:

- [docs/01_runtime_architecture_and_data_contracts.md](docs/01_runtime_architecture_and_data_contracts.md)

---

## Provider Overview

Current provider ids:

- `openai`
- `anthropic`
- `gemini`
- `xai`
- `minimax`

Current maturity:

- `openai`: verified path
- `anthropic`, `gemini`: native beta paths
- `xai`, `minimax`: compatibility beta paths

Formal rule:

- all model calls still go through the internal provider boundary
- frontend never calls third-party providers directly

---

## Quality and Verification

Current delivery verification belongs in `REBOOT_DIRECTION.md`. Earlier quality references:

- [docs/04_qa_matrix.md](docs/04_qa_matrix.md) for build / typecheck / smoke / shipped evidence
- [docs/05_benchmark_and_regression.md](docs/05_benchmark_and_regression.md) for benchmark manifests, suite structure, and gate modes

Current verification posture includes:

- backend compile / pytest coverage
- frontend build / typecheck coverage
- repo-native release-readiness baseline for static / runtime tiers
- workbench smoke coverage
- benchmark regression suite coverage for shipped hardening families

---

## Documentation Rules

When behavior changes:

- update the owning current specification and implementation checklist
- record real verification and remaining limits in `REBOOT_DIRECTION.md`
- keep code, test fixtures and benchmark contracts aligned in the same change

Do not:

- treat archive or research docs as primary design authority
- keep reviving legacy top-level docs instead of the active tree

---

## Governance Note

Infinite Pro should continue to be planned and implemented as:

> **Full-scope consulting capability, simple case work, single-firm consultant isolation, and evidence-backed shared intelligence.**
