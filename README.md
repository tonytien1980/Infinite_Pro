# Infinite Pro

Infinite Pro is an ontology-first consulting workbench for a single consultant's full working scope.

Formal product posture:

> **Single-Consultant Full-Scope Edition**

This repo has been documentation-reset around the current shipped product baseline. The `docs/` folder now contains only the current should-read documents.

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

Read these first:

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

The `docs/` folder is intentionally flat: it now contains only the current should-read files.

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
npx next typegen
npm run typecheck
```

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

Use the quality docs rather than scattered notes:

- [docs/04_qa_matrix.md](docs/04_qa_matrix.md) for build / typecheck / smoke / shipped evidence
- [docs/05_benchmark_and_regression.md](docs/05_benchmark_and_regression.md) for benchmark manifests, suite structure, and gate modes

Current verification posture includes:

- backend compile / pytest coverage
- frontend build / typecheck coverage
- workbench smoke coverage
- benchmark regression suite coverage for shipped hardening families

---

## Documentation Rules

When behavior changes:

- update the owning doc under `docs/`
- update `docs/04_qa_matrix.md` only when real verification evidence exists
- update `docs/05_benchmark_and_regression.md` only when benchmark behavior truly changes

Do not:

- treat archive or research docs as primary design authority
- keep reviving legacy top-level docs instead of the active tree

---

## Governance Note

Infinite Pro should continue to be planned and implemented as:

> **full-scope by capability, phased by implementation order, single-user first, multi-user later**
