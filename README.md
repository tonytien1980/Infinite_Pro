# AI Advisory OS

AI Advisory OS is an ontology-centered intelligent workbench for complex knowledge work. This initial repository scaffold delivers the first executable MVP slice: a Host-routed specialist workflow for research synthesis.

## What this MVP slice includes

- Next.js + TypeScript frontend in [`frontend/`](/Users/tonytien/Desktop/Infinite Pro/frontend)
- FastAPI + Python backend in [`backend/`](/Users/tonytien/Desktop/Infinite Pro/backend)
- PostgreSQL persistence via Docker Compose
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
- Upload flow that stores file metadata and creates `Evidence` records from extracted file content
- First specialist agent only: `Research Synthesis Agent`
- Host orchestration skeleton with future space for the full multi-agent flow
- Task history persistence and review UI

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

## Local setup

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Start the stack:

   ```bash
   docker compose up --build
   ```

3. Open the services:

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Health check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

## Supported MVP workflow

1. Create a task from the frontend workbench.
2. Add manual background text.
3. Upload one or more files.
4. Backend ingests uploads, stores metadata, and creates `Evidence`.
5. Run the `Research Synthesis Agent`.
6. Review the generated structured `Deliverable`, recommendations, action items, and history.

## Supported file extraction

The first slice extracts text from:

- `.txt`
- `.md`
- `.csv`
- `.json`
- `.pdf`
- `.docx`

If a file cannot be text-extracted, the upload is still stored and an `Evidence` record is created with metadata-only fallback text.

## Key API endpoints

- `POST /api/v1/tasks`
- `GET /api/v1/tasks`
- `GET /api/v1/tasks/{task_id}`
- `GET /api/v1/tasks/{task_id}/history`
- `POST /api/v1/tasks/{task_id}/uploads`
- `POST /api/v1/tasks/{task_id}/runs/research-synthesis`

## MVP choices recorded

- The model layer is abstracted behind a provider interface, but the default implementation is a deterministic local mock provider so the slice can run without external model credentials.
- The Host orchestration layer is present now, but only the `specialist` flow for `research_synthesis` is implemented. The `multi_agent` path is scaffolded for later work.
- Source ingestion currently supports manual background text plus manual file upload only. Connector abstractions are present for future sources such as Google Drive or local folder ingestion.
- Schema creation uses SQLAlchemy metadata on startup for the first slice. A migration workflow can be introduced once the model stabilizes.

## Notes for next steps

- Add the remaining two specialist agents: contract review and document restructuring.
- Implement the full Host-driven multi-agent flow with 3 to 5 core agents.
- Introduce a real provider implementation behind the model router once API credentials and provider policy are confirmed.
