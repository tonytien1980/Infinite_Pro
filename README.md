# AI Advisory OS

AI Advisory OS is an ontology-centered intelligent workbench for complex knowledge work. This repository currently implements one verifiable MVP slice: create a task, attach manual background text, upload files, convert them into usable `Evidence`, route through the Host orchestration layer, run one specialist agent (`Research Synthesis Agent`), generate a structured `Deliverable`, and persist task history.

## What this MVP slice includes

- Next.js + TypeScript frontend in [`frontend/`](/Users/tonytien/Desktop/Infinite Pro/frontend)
- FastAPI + Python backend in [`backend/`](/Users/tonytien/Desktop/Infinite Pro/backend)
- PostgreSQL as the primary runtime database via Docker Compose
- Canonical planning docs in [`docs/`](/Users/tonytien/Desktop/Infinite Pro/docs)
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
- First specialist agent only: `Research Synthesis Agent`
- First minimal multi-agent validation slice with 2 fixed mock-first core agents:
  - `Strategy / Business Analysis Agent`
  - `Risk / Challenge Agent`
- Structured output with `deliverable`, `recommendations`, `action_items`, `risks`, and `missing_information`
- Task history persistence and review UI
- Pytest smoke coverage for the current slice

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
| `MODEL_PROVIDER_FAILURE_MODE` | Optional test-only failure switch for the mock provider | empty |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:3000,http://127.0.0.1:3000` |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend API base URL | `http://localhost:8000/api/v1` |

Note: the default `DATABASE_URL` is for Docker Compose because the backend container reaches PostgreSQL at host `db`. If you run the backend directly outside Docker, override it to a reachable host such as `localhost`.

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
- specialist run for `Research Synthesis Agent`
- multi-agent happy path
- multi-agent insufficient evidence degradation
- multi-agent model router usage
- Host-centered multi-agent orchestration
- task history persistence
- model router failure degradation
- incomplete specialist output normalization by Host

### Manual UI smoke flow

1. Create a task from the frontend workbench.
2. Add manual background text.
3. Upload one or more `.txt` or `.md` files.
4. Open the task workspace.
5. Click `Run Research Synthesis`.
6. Confirm the page shows:
   - structured deliverable content
   - recommendations
   - action items
   - risks
   - missing information or uncertainty when evidence is weak
7. Refresh the page and verify the run is still present in task history.

## Supported MVP workflow

1. Create a task.
2. Attach manual background text.
3. Upload one or more files.
4. Backend ingests uploads, stores metadata, extracts supported text, and creates `Evidence`.
5. Host orchestrator preserves the workflow boundary and routes the current slice into the specialist flow.
6. For backend-verified multi-agent tasks, Host orchestrator calls a fixed pair of core agents and converges their outputs.
7. `Research Synthesis Agent` and the current mock-first core agents both run through the model router abstraction.
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

- The model layer is abstracted behind a provider interface. The default runtime provider is a deterministic local mock so this MVP slice can run without external model credentials.
- The Host orchestration layer is not hard-coded to specialist-only behavior. It preserves the workflow boundary between `specialist` and `multi_agent`, and the current `multi_agent` branch is implemented as a fixed 2-agent validation slice.
- The current `multi_agent` slice is intentionally minimal. Host is still the only orchestration center and always calls the same fixed pair of core agents rather than doing intelligent agent selection.
- Source ingestion currently supports manual background text plus manual file upload only. Connector abstractions are present for future sources such as Google Drive or local folder ingestion.
- Structured outputs are normalized by Host so missing sections become explicit uncertainty rather than fake completeness.
- Schema creation currently uses SQLAlchemy metadata on startup. A real migration workflow should be added once the model stabilizes.

## Known limitations of this MVP slice

- Only one specialist agent is implemented: `Research Synthesis Agent`.
- The `multi_agent` path is only a minimal validation slice. It uses 2 fixed core agents and is not yet exposed through the current frontend task form.
- The default provider is a mock synthesizer, not a production LLM integration.
- Upload extraction is intentionally lightweight and does not yet do chunking, citation selection, OCR, or advanced parsing.
- File storage is local filesystem storage for development.
- The current runtime has no advanced auth, multi-tenant support, source sync, or external connector execution.
- Docker Compose is the intended full runtime path; direct backend execution needs an explicit non-Docker `DATABASE_URL`.

## Next phase prerequisites

Before moving to the next implementation phase, the following are still missing relative to the planning docs:

- the remaining specialist agents: contract review and document restructuring
- the actual Host-driven `multi_agent` workflow
- 3 to 5 core analysis agents with differentiated outputs
- richer structured deliverable rendering and citations
- provider switching beyond the current mock router
- migration tooling and stronger operational logging
