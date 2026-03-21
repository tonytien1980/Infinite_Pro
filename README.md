# Infinite Pro

Infinite Pro is an ontology-centered intelligent workbench for complex knowledge work. Its product goal is “最少輸入，透過 ontology 驅動的結構化思考流程，產出顧問級分析、建議與行動方案.” This repository currently implements a verifiable early V1 slice: create a task, attach manual background text, ingest source material, convert it into usable `Evidence`, route through the Host orchestration layer, run either a minimal specialist flow or a minimal multi-agent convergence flow, generate a structured `Deliverable`, and persist task history.

The formal product definition now lives in [`docs/09_infinite_pro_core_definition.md`](/Users/tonytien/Desktop/Infinite Pro/docs/09_infinite_pro_core_definition.md). Treat that document as the highest-priority naming and product-direction reference for future work. Legacy references to `AI Advisory OS` may still remain in older docs or internal code paths until a dedicated rename pass is requested.

## What this MVP slice includes

- Next.js + TypeScript frontend in [`frontend/`](/Users/tonytien/Desktop/Infinite Pro/frontend)
- FastAPI + Python backend in [`backend/`](/Users/tonytien/Desktop/Infinite Pro/backend)
- PostgreSQL as the primary runtime database via Docker Compose
- Canonical planning docs in [`docs/`](/Users/tonytien/Desktop/Infinite Pro/docs)
- Formal product definition in [`docs/09_infinite_pro_core_definition.md`](/Users/tonytien/Desktop/Infinite Pro/docs/09_infinite_pro_core_definition.md)
- Minimal ontology/domain model covering:
  - `Task`
  - `TaskContext`
  - `Subject`
  - `Goal`
  - `Constraint`
  - `Evidence`
  - `Insight`
  - `Risk`
  - `Option`
  - `Recommendation`
  - `ActionItem`
  - `Deliverable`
- Upload ingestion that extracts text from supported files and creates usable `Evidence`
- Host orchestration skeleton with explicit `specialist` / `multi_agent` workflow boundary
- Supported workflow modes:
  - `specialist`
  - `multi_agent`
- Currently implemented specialist agents:
  - `Contract Review Agent`
  - `Research Synthesis Agent`
  - `Document Restructuring Agent`
- Current minimal multi-agent validation slice with 4 fixed mock-first core agents:
  - `Strategy / Business Analysis Agent`
  - `Market / Research Insight Agent`
  - `Operations Agent`
  - `Risk / Challenge Agent`
- Structured output with `deliverable`, `recommendations`, `action_items`, `risks`, and `missing_information`
- Task history persistence and review UI
- The current frontend UI defaults to Traditional Chinese and uses `Infinite Pro` as the product name in user-facing metadata/copy
- Pytest smoke coverage for the current slice
- Model router support for:
  - `mock`
  - `openai` when configured with a backend API key

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

Copy [`.env.example`](/Users/tonytien/Desktop/Infinite Pro/.env.example) to `.env` before running the stack.

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

Note: the default `DATABASE_URL` is for Docker Compose because the backend container reaches PostgreSQL at host `db`. If you run the backend directly outside Docker, override it to a reachable host such as `localhost`.
Note: the default `UPLOAD_DIR=/app/storage/uploads` is also Docker-oriented. For direct local backend runs outside Docker, override it to a writable workspace path such as `./storage/uploads`.
Note: if `MODEL_PROVIDER=openai` but `OPENAI_API_KEY` is empty, the backend logs a warning and falls back to the mock provider automatically.

## Model provider switching

- Default provider: `mock`
- Optional real provider: `openai`
- To switch to OpenAI, set these in your backend `.env`:

  ```env
  MODEL_PROVIDER=openai
  OPENAI_API_KEY=your_real_key_here
  OPENAI_MODEL=gpt-4o-mini
  ```

- If you want to stay on the deterministic local router:

  ```env
  MODEL_PROVIDER=mock
  ```

- If `MODEL_PROVIDER=openai` is selected but the API key is missing, the app does not crash at startup. It degrades to the mock provider and logs a warning.

## Exact local startup steps

### Docker Compose path

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Start the full stack:

   ```bash
   docker compose up --build
   ```

3. Open the services:

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Health check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### Local backend test path

If you want to run backend smoke tests without Docker:

```bash
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements-dev.txt
.venv/bin/pytest backend/tests -q
```

### Local backend standalone path

If you want to run the backend directly without Docker Compose:

```bash
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements-dev.txt
DATABASE_URL=sqlite+pysqlite:///./local.db \
UPLOAD_DIR=./storage/uploads \
PYTHONPATH=backend \
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Local frontend path

If `node` is available and you want to run the frontend directly:

```bash
cd frontend
npm install
npm run dev
```

If you want build or typecheck verification:

```bash
cd frontend
npm run build
npm run typecheck
```

## Exact smoke test steps

### Automated backend smoke tests

Run:

```bash
.venv/bin/pytest backend/tests -q
```

The current smoke suite covers:

- health endpoint
- task creation
- background text attachment
- file upload -> evidence creation for `.txt`
- file upload -> evidence creation for `.md`
- file ingestion failure fallback
- specialist run for `Contract Review Agent`
- specialist run for `Research Synthesis Agent`
- specialist run for `Document Restructuring Agent`
- multi-agent happy path
- operations agent participation in multi-agent convergence
- multi-agent insufficient evidence degradation
- multi-agent model router usage
- contract review model router usage
- document restructuring model router usage
- Host-centered multi-agent orchestration
- task history persistence
- model router failure degradation
- incomplete specialist output normalization by Host

### Local HTTP acceptance smoke

The following backend through-end flow has been exercised over real HTTP against a temporary local FastAPI server using sqlite and local upload storage:

- `research_synthesis`
- `contract_review`
- `document_restructuring`
- `multi_agent`

For each of those flows, the acceptance run verified:

- create task
- attach background text
- upload file
- run flow through Host
- fetch structured result
- fetch task history

### Manual UI smoke flow

1. Create a task from the frontend workbench.
2. Choose one of the supported flows:
   - `Research Synthesis`
   - `Contract Review`
   - `Document Restructuring`
   - `Multi-Agent Convergence`
3. Add manual background text.
4. Upload one or more `.txt` or `.md` files.
5. Open the task workspace.
6. Click the run button for the selected flow.
7. Confirm the page shows:
   - structured deliverable content
   - recommendations
   - action items
   - missing information or uncertainty when evidence is weak
   - task history
8. Refresh the page and verify the run is still present in task history.

Note: this UI smoke path is the intended acceptance path, but it was not runtime-verified in this environment because `node` is unavailable here.

## Verification status

### Verified in this environment

- backend import and route wiring with local sqlite override
- database initialization path with local sqlite override
- automated backend pytest smoke suite
- local HTTP through-end acceptance for:
  - `research_synthesis`
  - `contract_review`
  - `document_restructuring`
  - `multi_agent`
- Host remains the orchestration center for multi-agent runs
- upload ingestion creates usable `Evidence`

### Not verified in this environment

- Docker Compose runtime
- PostgreSQL startup and real backend connection under Docker Compose
- frontend `next dev` runtime
- frontend `next build`
- frontend typecheck
- browser-level end-to-end UI click-through

## Supported MVP workflow

1. Create a task.
2. Attach manual background text.
3. Upload one or more files.
4. Backend ingests uploads, stores metadata, extracts supported text, and creates `Evidence`.
5. Host orchestrator preserves the workflow boundary and routes the current slice into either `specialist` or `multi_agent`.
6. For backend-verified multi-agent tasks, Host orchestrator calls a fixed set of 4 core agents and converges their outputs.
7. `Contract Review Agent`, `Research Synthesis Agent`, `Document Restructuring Agent`, and the current mock-first core agents all run through the model router abstraction.
8. The system stores structured `Deliverable`, `Recommendation`, `ActionItem`, `Risk`, and history records.

## Supported file extraction

The first slice extracts text from:

- `.txt`
- `.md`
- `.csv`
- `.json`
- `.pdf`
- `.docx`

If a file cannot be text-extracted, the upload is still stored and the ingestion layer creates explicit uncertainty evidence rather than silently pretending the file was analyzed successfully.

## Key API endpoints

- `GET /api/v1/health`
- `POST /api/v1/tasks`
- `GET /api/v1/tasks`
- `GET /api/v1/tasks/{task_id}`
- `GET /api/v1/tasks/{task_id}/history`
- `POST /api/v1/tasks/{task_id}/uploads`
- `POST /api/v1/tasks/{task_id}/run`
- `POST /api/v1/tasks/{task_id}/runs/research-synthesis`

## Architecture choices recorded

- The model layer is abstracted behind a provider interface. The default runtime provider is a deterministic local mock so this MVP slice can run without external model credentials, and a minimal OpenAI provider can be enabled through backend environment variables.
- The Host orchestration layer is not hard-coded to specialist-only behavior. It preserves the workflow boundary between `specialist` and `multi_agent`, and the current `multi_agent` branch is implemented as a fixed 4-agent validation slice.
- The current `multi_agent` slice is intentionally minimal. Host is still the only orchestration center and always calls the same fixed core agents rather than doing intelligent agent selection.
- Source ingestion currently supports manual background text plus manual file upload only. Connector abstractions are present for future sources such as Google Drive or local folder ingestion.
- Structured outputs are normalized by Host so missing sections become explicit uncertainty rather than fake completeness.
- Schema creation currently uses SQLAlchemy metadata on startup. A real migration workflow should be added once the model stabilizes.

## Known limitations of this MVP slice

- Three specialist agents are implemented: `Contract Review Agent`, `Research Synthesis Agent`, and `Document Restructuring Agent`.
- The `multi_agent` path is only a minimal validation slice. It uses 4 fixed core agents rather than adaptive selection.
- The default provider is still a mock synthesizer. Real-provider support is currently limited to a minimal OpenAI adapter.
- Upload extraction is intentionally lightweight and does not yet do chunking, citation selection, OCR, or advanced parsing.
- File storage is local filesystem storage for development.
- The current runtime has no advanced auth, multi-tenant support, source sync, or external connector execution.
- Docker Compose is the intended full runtime path; direct backend execution needs an explicit non-Docker `DATABASE_URL`.
- Docker Compose runtime has not been re-verified in this environment because `docker` is unavailable here.
- Frontend runtime and build have not been re-verified in this environment because `node` is unavailable here.

## Next phase prerequisites

Before moving to the next implementation phase, the following are still missing relative to the planning docs:

- a more adaptive Host-driven `multi_agent` workflow beyond the current fixed agent set
- verified frontend runtime and browser-level end-to-end acceptance
- richer structured deliverable rendering and citations
- richer provider switching beyond the current mock + OpenAI router
- migration tooling and stronger operational logging
