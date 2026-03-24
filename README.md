# Infinite Pro

Infinite Pro is an **ontology-first consulting workbench** for a single consultant's full working scope.

The formal planning posture is now:

> **Single-Consultant Full-Scope Edition**

That means:
- the product capability boundary is defined from day one around the **full working reality of one consultant**
- implementation order may be phased
- capability boundaries should **not** be artificially reduced into a smaller product definition
- multi-user, multi-company, multi-tenant, and team-governance concerns are later system layers

The highest-priority product definition lives in [`docs/09_infinite_pro_core_definition.md`](/Users/tonytien/Desktop/Infinite%20Pro/docs/09_infinite_pro_core_definition.md). Governance and implementation documents in [`docs/02_product_scope.md`](/Users/tonytien/Desktop/Infinite%20Pro/docs/02_product_scope.md) through [`docs/08_codex_handoff.md`](/Users/tonytien/Desktop/Infinite%20Pro/docs/08_codex_handoff.md) should be read as the official full-scope planning baseline.

## Product positioning

Infinite Pro is not:
- a generic chatbot wrapper
- a prompt-packaging tool
- a narrow set of isolated specialist utilities
- a generic enterprise admin dashboard

Infinite Pro is:
- a consulting workbench for real advisory work
- a Host-orchestrated, ontology-first decision system
- a platform that must eventually cover a single consultant's full work scope
- a system designed around objects, evidence, decisions, deliverables, and history

In this system, ontology should be understood as:
- the shared world model
- the operational layer for core consulting objects and relationships
- the semantic foundation shared by Host, agents, packs, work surfaces, and deliverable generation

## Full-scope capability boundary

The formal product boundary already includes:

### Client stages
- `創業階段`
- `制度化階段`
- `規模化階段`

### Client types
- 中小企業
- 個人品牌與服務
- 自媒體
- 大型企業

### Consulting domains
- 營運
- 財務
- 法務
- 行銷
- 銷售
- 募資
- other extensible consulting domains

### Core system principles
- ontology-first
- Host Agent as the only orchestration center
- multiple specialist and reasoning agents
- modular pack system
- consulting workbench UI
- provider abstraction
- source / evidence / history / traceability
- deliverable-centric outputs

## Formal architecture layers

The official architecture should be understood through these six formal layers:

1. **Ontology Layer**
2. **Context Layer**
3. **Capability Layer**
4. **Agent Layer**
5. **Pack Layer**
6. **Workbench / UI Layer**

Cross-cutting runtime responsibilities remain first-class:
- source ingestion
- evidence creation
- provider routing
- persistence
- history
- traceability

## Extension architecture

Infinite Pro formally distinguishes four extension-facing concepts:

- `Capability Archetypes`
  - describe **what kind of consulting work** the system is doing
  - examples: `Diagnose / Assess`, `Review / Challenge`, `Synthesize / Brief`, `Plan / Roadmap`
- `Domain / Functional Packs`
  - extend the system with **functional or consulting-domain context modules**
  - current single-consultant baseline:
    - `operations_pack`
    - `finance_fundraising_pack`
    - `legal_risk_pack`
    - `marketing_sales_pack`
    - `business_development_pack`
    - `research_intelligence_pack`
    - `organization_people_pack`
    - `product_service_pack`
- `Industry Packs`
  - extend the system with **industry-specific context modules**
  - current single-consultant baseline:
    - `online_education_pack`
    - `ecommerce_pack`
    - `gaming_pack`
    - `funeral_services_pack`
    - `health_supplements_pack`
    - `energy_pack`
    - `saas_pack`
    - `media_creator_pack`
    - `professional_services_pack`
    - `manufacturing_pack`
    - `healthcare_clinic_pack`
- `Agents`
  - define **who executes or orchestrates** the work
  - includes `Host Agent`, `Reasoning Agents`, and `Specialist Agents`
  - are governed through a formal `Agent Registry` and selected through an `Agent Resolver`

These concepts must not be collapsed into each other:
- a capability archetype is not a pack
- a pack is not an agent
- a domain / functional pack is not an industry pack

Domain / Functional Packs should be treated as:
- reusable consulting work modules for real enterprise problem families
- structured context modules that change evidence expectations, risk framing, routing hints, and deliverable presets
- not reasoning agents and not capability archetypes

The `Pack Layer` is therefore the formal home of both:
- `Domain / Functional Packs`
- `Industry Packs`

The management experience for packs and agents now shares a minimal `Extension Manager` surface inside the workbench, but that shared manager is a UI/governance surface, not a seventh architecture layer.

Current minimal formal integration now exists for both extension families:
- `Pack Resolver -> Host`
- `Agent Registry / Resolver -> Host`

That means selected packs and selected agents are no longer only conceptual governance definitions; they now enter task aggregates, workspace payloads, Host framing, readiness governance, and deliverable metadata.

Within the single-consultant scope, Agent Orchestration is now treated as a completed runtime layer:
- Host selection formally responds to capability archetype, selected packs, decision context, readiness/evidence sufficiency, sparse-input mode, and deliverable class
- selected agents influence execution path and deliverable shaping, not just metadata
- omitted / deferred / escalation notes are part of the formal writeback surface

Single-user minimal management now also exists for:
- extension catalog visibility
- task-level selected pack / agent visibility
- task-level pack / agent overrides
- spec / version / status visibility

Within the single-consultant scope, the `Matter / Engagement Workspace` should now be treated as a completed formal work surface:
- `Client / Engagement / Workstream / DecisionContext` have canonical workspace identities
- the workbench can move from home -> matter workspace -> task / deliverable detail
- cross-task and cross-deliverable continuity now belongs to the formal workbench, not to ad hoc task-detail summaries

Within the single-consultant scope, the `Artifact / Evidence Workspace` should now also be treated as a completed formal work surface:
- `Artifact / SourceMaterial / Evidence` have canonical workspace identities and a dedicated workspace route
- consultants can move from matter workspace or task detail into a formal source/evidence work surface
- evidence support chains, sufficiency, and high-impact gaps are visible as workbench responsibilities rather than hidden trace metadata

Within the single-consultant scope, the `Deliverable Workspace` should now also be treated as a completed formal work surface:
- `Deliverable` has a canonical workspace identity and a dedicated workspace route
- consultants can move from matter workspace, task detail, and artifact/evidence workspace into a formal deliverable work surface
- deliverable class, evidence basis, ontology linkage, limitations, and applicability are visible as first-class workbench responsibilities rather than being buried in task-result blobs

## Core ontology objects

The system should be planned around objects such as:
- `Client`
- `Engagement`
- `Workstream`
- `Task`
- `DecisionContext`
- `Artifact`
- `SourceMaterial`
- `Evidence`
- `Insight`
- `Risk`
- `Option`
- `Recommendation`
- `ActionItem`
- `Deliverable`
- `Goal`
- `Constraint`
- `Assumption`
- `Stakeholder`
- `Audience`

These objects define the product boundary even if some of them are still being implemented in waves.

## Current implementation status

The repository currently contains a working early implementation slice within the full-scope architecture. Today it already includes:

- Next.js + TypeScript frontend in [`frontend/`](/Users/tonytien/Desktop/Infinite%20Pro/frontend)
- FastAPI + Python backend in [`backend/`](/Users/tonytien/Desktop/Infinite%20Pro/backend)
- PostgreSQL as the primary runtime database via Docker Compose
- canonical planning docs in [`docs/`](/Users/tonytien/Desktop/Infinite%20Pro/docs)
- a running task/evidence/history flow
- Host-led workflow orchestration
- specialist and multi-agent execution paths
- a formal `Matter / Engagement Workspace` for single-consultant case continuity
- a formal `Artifact / Evidence Workspace` for source, evidence, support-chain, and gap governance
- a formal `Deliverable Workspace` for deliverable identity, linkage, limitations, and continuity
- structured deliverable rendering
- provider abstraction with `mock` and `openai`
- Traditional Chinese as the default UI language

The implementation is **not yet complete relative to the full-scope product boundary**. That gap should be understood as an implementation-order gap inside a full-scope architecture, not as a smaller product definition.

## Repository structure

```text
.
├── AGENTS.md
├── README.md
├── docker-compose.yml
├── .env.example
├── docs/
├── frontend/
├── backend/
└── storage/uploads/
```

## Environment variables

Copy [`.env.example`](/Users/tonytien/Desktop/Infinite%20Pro/.env.example) to `.env` before running the stack.

| Variable | Purpose | Default in `.env.example` |
| --- | --- | --- |
| `POSTGRES_DB` | PostgreSQL database name | `ai_advisory_os` |
| `POSTGRES_USER` | PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` |
| `POSTGRES_PORT` | Host port for PostgreSQL | `5432` |
| `BACKEND_PORT` | Host port for FastAPI | `8000` |
| `FRONTEND_PORT` | Host port for Next.js | `3000` |
| `DATABASE_URL` | Backend SQLAlchemy connection string | `postgresql+psycopg://postgres:postgres@db:5432/ai_advisory_os` |
| `UPLOAD_DIR` | Backend upload storage path inside the container | `/app/storage/uploads` |
| `MODEL_PROVIDER` | Active model router provider | `mock` |
| `OPENAI_API_KEY` | Backend-only API key for the OpenAI provider | empty |
| `OPENAI_MODEL` | OpenAI model name used when `MODEL_PROVIDER=openai` | `gpt-4o-mini` |
| `OPENAI_BASE_URL` | OpenAI API base URL | `https://api.openai.com/v1` |
| `OPENAI_TIMEOUT_SECONDS` | Timeout for OpenAI API calls in seconds | `60` |
| `MODEL_PROVIDER_FAILURE_MODE` | Optional test-only failure switch for the mock provider | empty |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:3000,http://127.0.0.1:3000` |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend API base URL | `http://localhost:8000/api/v1` |

Notes:
- The default `DATABASE_URL` is Docker-oriented because the backend container reaches PostgreSQL at host `db`.
- The default `UPLOAD_DIR=/app/storage/uploads` is also Docker-oriented.
- If `MODEL_PROVIDER=openai` but `OPENAI_API_KEY` is empty, the backend logs a warning and falls back to the mock provider automatically.

## Model provider switching

- Default provider: `mock`
- Optional real provider: `openai`

To switch to OpenAI:

```env
MODEL_PROVIDER=openai
OPENAI_API_KEY=your_real_key_here
OPENAI_MODEL=gpt-4o-mini
```

If you want to stay on the deterministic local router:

```env
MODEL_PROVIDER=mock
```

## Local startup

### Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Then open:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### Backend test path

```bash
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements-dev.txt
.venv/bin/pytest backend/tests -q
```

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

## Verification status

### Verified in this environment
- backend import and route wiring
- database initialization path
- automated backend pytest suite
- local HTTP through-end acceptance for specialist and multi-agent paths
- Host remains the orchestration center for multi-agent runs
- upload ingestion creates usable `Evidence`

### Not fully verified as a production deployment posture
- hardened external deployment
- access control for public internet exposure
- multi-user / multi-tenant system layers

## Governance note

From this point forward, planning and implementation should not use:
- a reduced-scope product definition as the product boundary
- narrow specialist lists as the formal product category system
- minimal ontology as the final architectural meaning of Infinite Pro

Instead, planning should follow:

> **Full-scope by capability, phased by implementation order, single-user first, multi-user later.**
