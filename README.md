# Infinite Pro

Infinite Pro is an **ontology-first consulting workbench** for a single consultant's full working scope.

The formal planning posture is now:

> **Single-Consultant Full-Scope Edition**

That means:
- the product capability boundary is defined from day one around the **full working reality of one consultant**
- implementation order may be phased
- capability boundaries should **not** be artificially reduced into a smaller product definition
- multi-user, multi-company, multi-tenant, and team-governance concerns are later system layers

The highest-priority product definition lives in [`docs/09_infinite_pro_core_definition.md`](/Users/tonytien/Desktop/Infinite%20Pro/docs/09_infinite_pro_core_definition.md). Governance and implementation documents in [`docs/02_product_scope.md`](/Users/tonytien/Desktop/Infinite%20Pro/docs/02_product_scope.md) through [`docs/12_runtime_persistence_and_release_integrity.md`](/Users/tonytien/Desktop/Infinite%20Pro/docs/12_runtime_persistence_and_release_integrity.md) should be read as the official full-scope planning baseline.

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

Two additional runtime governance files now matter for day-to-day development:
- [`docs/11_intake_storage_architecture.md`](/Users/tonytien/Desktop/Infinite%20Pro/docs/11_intake_storage_architecture.md) for intake modes, source materials, storage, retention, purge, and storage cost boundaries
- [`docs/12_runtime_persistence_and_release_integrity.md`](/Users/tonytien/Desktop/Infinite%20Pro/docs/12_runtime_persistence_and_release_integrity.md) for revision history, rollback, publish / artifact records, fail-closed rules, and degraded-mode re-sync

## Canonical intake and case world compilation

Infinite Pro no longer treats `一句話起手`、`單材料起手`、`多來源案件` as three different ontology worlds.

The formal rule is:

> **There is one canonical intake pipeline, and `/new` is now one unified intake surface.**

For the runtime, formal intake always means:
- a problem statement
- supplemental materials
  - files
  - URLs
  - pasted text
  - structured data
- follow-up supplements

On the visible product surface, `/new` should now expose one unified intake area:
- one main question field
- one shared material area for files, URLs, and pasted text
- system-inferred intake patterns instead of a manual mode chooser
- a single-batch limit of 10 material units, with later supplements still allowed on the same matter
- item-level preview, remove, and warning behavior for every pending material
- clear item-level handling states such as accepted, limited support, pending parse, unsupported, and failed ingest
- each item should answer four questions quickly:
  - why it is in this state
  - what this state affects
  - what the recommended next step is
  - what the safer fallback material strategy is when needed
- the item row should also make the next action explicit when possible:
  - retry
  - replace
  - remove
  - keep as reference
- blocking and non-blocking items should be visibly different, so users can tell whether an item stops the batch or can stay as reference-level material
- the intake surface should also expose a lightweight batch view:
  - how many items are already done
  - how many are still parsing
  - how many failed
  - how many are blocking
  - what the most recent retry / processing results were

Every intake path must first enter the same `case world compilation` stage. Host should then decide:
- how sparse or dense the current materials are
- whether external completion is needed
- whether the evidence base is ready for convergence
- what the next-best action should be

The first formal Host stage is therefore:
- `Case World Compiler`
- output: `case_world_draft`
- promoted runtime state: `CaseWorldState`

At minimum, `case_world_draft` should carry:
- task interpretation
- decision context
- extracted objects
- inferred links
- facts
- assumptions
- evidence gaps
- suggested capabilities
- suggested domain packs
- suggested industry packs
- suggested agents
- suggested research need
- next-best actions

After compilation, the runtime should promote or sync the result into a
matter-level `CaseWorldState`.

Formal interpretation:
- `CaseWorldState` is the current consultant world model for one matter
- `Task` is a work slice inside that world, not the world's main container
- follow-up supplements should update the world first, then decide whether to
  refresh a task slice, create a new one, or only deepen evidence / deliverable
  context

Current bridge architecture:
- `CaseWorldState` is now the matter-level authority for world identity, continuity
  framing, and active work slice summary
- `Task` remains a required legacy access path for some persistence tables, but it
  should no longer be treated as the sole identity owner
- `Client / Engagement / Workstream / DecisionContext / SourceMaterial / Artifact / Evidence`
  are expected to move progressively toward world-native continuity while legacy
  `task_id` references coexist during migration
- identity deepen phase 11 should additionally prefer:
  - canonical world rows and canonical world read paths first
  - task-slice derivative rows only as local overlays / compatibility layers
  - world-preferred write and sync paths over task-local ownership
  - core/context objects (`Client / Engagement / Workstream / DecisionContext`) that are
    clearly owned by the matter/world spine rather than silently drifting back to task-local authority
  - shared material / evidence reuse on the same matter spine instead of
    recreating near-duplicate rows for every new task slice
  - local participation semantics that explicitly show when a task slice is
    reusing a canonical world-owned source / material / artifact / evidence chain
  - legacy `task_id` references as compatibility-only access paths rather than
    proofs of canonical ownership
  - canonical `Client / Engagement` rows whose stored `task_id` can remain a
    compatibility lineage marker instead of rotating with every new slice
  - upload / source responses that remain participation-aware instead of
    collapsing back into task-local looking payloads
  - `slice_decision_context` that behaves like a thin delta contract rather than
    a second full decision authority
  - Host payloads, task aggregates, and workspace read models that consume the
    same canonical world context spine
  - source-chain contracts whose `canonical owner / local participation / compatibility task ref`
    boundaries are explicit enough that the identity line can enter closeout rather than another open-ended bridge wave

## Pack layer in the capability chain

Pack Layer is not a catalog-only surface and not a tag system.

Both `Domain / Functional Packs` and `Industry Packs` must formally influence:
- case world compilation
- evidence expectations
- readiness governance
- specialist / reasoning routing
- external research strategy
- deliverable shaping
- writeback interpretation

The Pack Layer governance shape remains:
- `Pack Spec`
- `Pack Registry`
- `Pack Resolver`
- `Pack Management Surface`

## Continuity and writeback policy

Infinite Pro now distinguishes between different case continuity depths.

Formal fields:
- `engagement_continuity_mode`
  - `one_off`
  - `follow_up`
  - `continuous`
- `writeback_depth`
  - `minimal`
  - `milestone`
  - `full`

Formal behavior:
- `one_off`
  - builds the case world
  - builds the evidence chain
  - produces a deliverable
  - keeps minimum history and traceability
  - supports formal closure and reopen semantics
  - does not force continuous action / outcome tracking
- `follow_up`
  - keeps the `one_off` baseline
  - allows decision checkpoints and milestone writeback
  - supports lightweight checkpoint-style continuation without turning the case into a CRM loop
  - should show the previous checkpoint, the latest update, what changed, and the next suggested follow-up action
  - should make recommendation / risk / action continuity visible without forcing a full action-outcome tracking surface
  - should make evidence supplements feel like purposeful consulting updates, not generic uploads
  - should show the evidence update goal and the gap this supplement is meant to close
- `continuous`
  - keeps the `follow_up` baseline
  - supports decision -> action -> outcome continuity over time
  - is the only mode that should expose richer progression / outcome logging UX
  - should show the latest progression state, the previous progression snapshot, what changed, and the next progression-aware action
  - should make recommendation adoption, action status, and outcome signals visible without turning the workbench into a heavy CRM wall
  - should make evidence supplements feel tied to the current progression goal, not like generic uploads

This means writeback is no longer treated as "all or nothing".
All matters must keep minimum history and deliverable lineage, but only follow-up and continuous cases should deepen the feedback loop.
Primary actions in matter, task, deliverable, and evidence workspaces should now change with this policy: one-off cases should bias toward closure, follow-up cases toward checkpoint updates, and continuous cases toward progression / outcome observation.
For follow-up specifically, the workbench should answer three questions quickly: what the last checkpoint said, what changed this time, and what the consultant should do next.
For continuous specifically, the workbench should answer four questions quickly: where progression stands now, which actions are moving or blocked, whether new outcomes appeared, and what the consultant should do next.

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

Additional first-class objects now belong to the formal boundary:
- `CaseWorldDraft`
- `CaseWorldState`
- `EvidenceGap`
- `ResearchRun / ExternalResearchRun`
- `DecisionRecord`
- `ActionPlan`
- `ActionExecution`
- `OutcomeRecord`

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
- one canonical intake pipeline on `/new`, now exposed as one unified intake surface
- three inferred intake patterns:
  - `只有一句話`
  - `一句話 + 1 份材料`
  - `一句話 + 多份材料`
- item-level preview / remove / warning on the unified material area
- item-level ingestion result messaging for accepted, limited-support, pending-parse, and unsupported materials
- matter-level supplement flow for additional files, URLs, and pasted text
- source material metadata with support level, ingest strategy, retention, purge state, and availability state
- formal support for `.md / .txt / .docx / .xlsx / .csv / text-first PDF / URL / 純文字補充`
- limited support for `.jpg / .jpeg / .png / .webp / 掃描型 PDF` as metadata / reference-level intake only, without default OCR
- storage separation for raw intake files, derived extracts, and released artifacts
- matter正文 remote-first persistence with degraded-mode local fallback and manual re-sync
- deliverable正文 remote-only persistence with revision history, rollback, version events, publish records, and artifact registry
- structured deliverable rendering
- Markdown and DOCX artifact export with backend artifact records
- system-level provider settings UI with single active runtime config, backend credential storage, validation, and `DB -> env` precedence
- provider abstraction with `mock` env baseline plus first-wave provider presets for `openai / anthropic / gemini / xai / minimax`
- latest provider presets aligned to current official model families:
  - OpenAI: `gpt-5.4 / gpt-5.4-mini / gpt-5.4-nano`
  - Anthropic native Claude API: `claude-opus-4-6 / claude-sonnet-4-6 / claude-haiku-4-5`
  - Gemini native API: `gemini-2.5-pro / gemini-2.5-flash / gemini-2.5-flash-lite`
  - xAI compatibility path: `grok-4.20-reasoning / grok-4-1-fast-reasoning / grok-4-1-fast-non-reasoning`
  - MiniMax compatibility path: `MiniMax-M2.7 / MiniMax-M2.7-highspeed / MiniMax-M2.1`
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
└── storage/
    ├── uploads/
    ├── derived/
    └── releases/
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
| `DERIVED_DIR` | Backend derived extract storage path inside the container | `/app/storage/derived` |
| `RELEASE_DIR` | Backend release artifact storage path inside the container | `/app/storage/releases` |
| `MODEL_PROVIDER` | Env baseline provider id used only when DB runtime config is absent | `mock` |
| `MODEL_PROVIDER_API_KEY` | Generic env baseline API key for the active provider | empty |
| `MODEL_PROVIDER_MODEL` | Generic env baseline model id | empty |
| `MODEL_PROVIDER_BASE_URL` | Generic env baseline base URL | empty |
| `MODEL_PROVIDER_TIMEOUT_SECONDS` | Generic env baseline timeout in seconds | empty |
| `OPENAI_API_KEY` | Legacy OpenAI env baseline key for backward compatibility when `MODEL_PROVIDER=openai` | empty |
| `OPENAI_MODEL` | Legacy OpenAI env baseline model for backward compatibility | `gpt-5.4` |
| `OPENAI_BASE_URL` | Legacy OpenAI env baseline base URL for backward compatibility | `https://api.openai.com/v1` |
| `OPENAI_TIMEOUT_SECONDS` | Legacy OpenAI env baseline timeout for backward compatibility | `60` |
| `MODEL_PROVIDER_FAILURE_MODE` | Optional test-only failure switch for the mock provider | empty |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:3000,http://127.0.0.1:3000` |
| `RAW_UPLOAD_RETENTION_DAYS` | Default retention for raw intake files | `30` |
| `ACTIVE_RAW_UPLOAD_RETENTION_DAYS` | Extended raw retention for active matters | `90` |
| `DERIVED_RETENTION_DAYS` | Retention for derived extracts | `180` |
| `RELEASE_RETENTION_DAYS` | Retention for release artifacts | `365` |
| `FAILED_UPLOAD_RETENTION_DAYS` | Retention for failed or unfinished uploads | `7` |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend API base URL | `http://localhost:8000/api/v1` |

Notes:
- The default `DATABASE_URL` is Docker-oriented because the backend container reaches PostgreSQL at host `db`.
- The default `UPLOAD_DIR=/app/storage/uploads`, `DERIVED_DIR=/app/storage/derived`, and `RELEASE_DIR=/app/storage/releases` are also Docker-oriented.
- Provider config precedence is `DB runtime config -> env baseline`.
- `.env` is now bootstrap / emergency baseline, not the primary long-term active config path.
- System provider credentials are backend-only and do not go through the frontend workbench preference fallback path.
- Retention days define purge boundaries and availability states, but they do not yet schedule automatic purge jobs by themselves.

## Model provider switching

- Default env baseline provider: `mock`
- System-level owner settings page can now persist one active provider config at a time.
- First-wave selectable providers in `/settings`: `openai`, `anthropic`, `gemini`, `xai`, `minimax`
- Verified runtime path today: `openai`
- Native beta runtime path today: `anthropic`, `gemini`
- Compatibility beta runtime path today: `xai`, `minimax`

If you want to bootstrap from `.env`, you can still do:

```env
MODEL_PROVIDER=openai
MODEL_PROVIDER_API_KEY=your_real_key_here
MODEL_PROVIDER_MODEL=gpt-5.4-mini
```

OpenAI legacy env keys also still work for backward compatibility:

```env
MODEL_PROVIDER=openai
OPENAI_API_KEY=your_real_key_here
OPENAI_MODEL=gpt-5.4
```

If you want to stay on the deterministic local env baseline router:

```env
MODEL_PROVIDER=mock
```

Formal rules:
- owner-level provider / model / key / base URL / timeout should now be managed from `/settings`
- credentials are stored backend-side and masked in the UI
- saving or validating provider settings is fail-closed
- frontend never calls third-party model providers directly
- `openai` uses the official OpenAI API path
- `anthropic` uses the native Claude Messages API path, with the preset default base URL pointed at the Messages API endpoint
- `gemini` uses the native Gemini API path, with the preset default base URL pointed at the native Gemini API root
- `xai` and `minimax` currently remain on officially documented compatibility paths

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

Notes:
- development and production still both use the standard Next output directory name, `frontend/.next`
- the Docker Compose frontend service now mounts a dedicated `frontend_next` volume for `/app/frontend/.next`, so containerized `next dev` no longer shares the same build output directory as host-side `npm run build`
- if the dev server ever behaves oddly after a crash, recreate the frontend service instead of deleting production build output:

```bash
docker compose restart frontend
```

## Verification status

### Verified in this environment
- backend import and route wiring
- database initialization path
- automated backend pytest suite
- local HTTP through-end acceptance for specialist and multi-agent paths
- Host remains the orchestration center for multi-agent runs
- upload ingestion creates usable `Evidence`
- `/new` three-mode intake flow and matter-level supplement flow
- deliverable publish / artifact record path
- matter degraded-mode fallback and manual re-sync path

### Not fully verified as a production deployment posture
- hardened external deployment
- access control for public internet exposure
- multi-user / multi-tenant system layers
- production-grade object storage serving / signed URLs
- scheduled purge / lifecycle jobs
- OCR-heavy parsing and production-grade scanned-PDF全文 ingestion at scale

## Governance note

From this point forward, planning and implementation should not use:
- a reduced-scope product definition as the product boundary
- narrow specialist lists as the formal product category system
- minimal ontology as the final architectural meaning of Infinite Pro

Instead, planning should follow:

> **Full-scope by capability, phased by implementation order, single-user first, multi-user later.**
