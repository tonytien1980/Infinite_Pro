# AGENTS.md

This file is the repository-level operating guide for Codex and other coding agents working on Infinite Pro.

The current product and repo baseline must be understood through the flat docs set introduced in the 2026-04 documentation reset.

---

## 1. Product Identity

Infinite Pro remains:

> **Single-Consultant Full-Scope Edition**

Formal planning posture:

- full-scope by capability
- phased by implementation order
- single-user first
- multi-user later

Infinite Pro is not:

- a consultant training platform
- a generic chatbot wrapper
- a generic enterprise admin console
- a narrow collection of specialist tools

Infinite Pro is:

- an ontology-first consulting workbench
- a Host-orchestrated decision system
- a deliverable-centric advisory work platform
- a system that must cover the full working scope of one consultant

---

## 2. Active Reading Order

Before making product, architecture, ontology, runtime, agent, pack, or UI decisions, read these docs in order:

1. `docs/00_product_definition_and_current_state.md`
2. `docs/01_runtime_architecture_and_data_contracts.md`
3. `docs/02_host_agents_packs_and_extension_system.md`
4. `docs/03_workbench_ux_and_page_spec.md`
5. `docs/04_qa_matrix.md` when you need shipped verification evidence
6. `docs/05_benchmark_and_regression.md` when you need benchmark / regression gate context

Everything else lives outside `docs/` under `archive/` or `research/` and is not active source of truth.

---

## 3. Non-Negotiable Architecture Rules

Infinite Pro still has exactly six formal layers:

1. Ontology Layer
2. Context Layer
3. Capability Layer
4. Agent Layer
5. Pack Layer
6. Workbench / UI Layer

Cross-cutting responsibilities remain first-class:

- canonical intake
- source ingestion
- evidence / provenance
- persistence / history
- traceability
- provider abstraction
- deliverable-centric outputs

Do not:

- add a seventh architecture layer
- shrink the product boundary into a smaller product definition
- collapse capability / pack / agent into one taxonomy
- bypass Host with UI-only workflow logic
- bypass the internal provider boundary

---

## 4. Core Runtime Rules

Always preserve the current world-first runtime shape:

`canonical intake pipeline -> CaseWorldDraft -> CaseWorldState -> Task(work slice) -> Artifact / SourceMaterial -> Evidence -> Deliverable -> continuity / writeback records`

Key rules:

- `Task` is a work slice inside a matter/world, not the sole business container
- follow-up supplements update the existing world first, then drive task / evidence / deliverable changes
- `CaseWorldState` is the authority center even if legacy `task_id` references still coexist
- bridge / compatibility notes must be labeled honestly; do not claim fully world-native closeout where it has not happened

---

## 5. Host, Agent, and Pack Rules

Host remains the only orchestration center.

Host must continue to own:

- task / decision framing
- case world compilation
- workflow selection
- readiness governance
- research trigger governance
- agent routing
- convergence
- deliverable shaping
- continuity / writeback control

Agents are capability modules, not theatrical personas.

Packs are structured context modules, not agents and not capability archetypes.

Current runtime governance must preserve:

- Agent Registry / Resolver
- Pack Registry / Resolver
- task-level selected pack / agent visibility
- omitted / deferred / escalation notes
- pack contracts affecting readiness / framing / deliverable shaping without replacing Host judgment
- standard agent / pack creation staying minimal-input at the UI layer
- backend-only contract synthesis, validation, normalization, and registry-safe write paths

Formal extension-creation rule:

- standard users should provide only the minimum information needed to describe a new agent or pack
- frontend must not drift back into manual capability binding, pack binding, KPI entry, or full contract authoring
- creating an agent or pack does not mean Host must later invoke it
- actual invocation remains Host-owned and task-context dependent

---

## 6. Workbench Rules

Infinite Pro should feel like a consulting workbench, not a chat shell, admin console, or debug dashboard.

Global UX rules:

- one page, one primary action
- first screen answers: where am I, what matters most, what should I do next
- progressive disclosure over summary duplication
- consultant-first, debug-on-demand
- Traditional Chinese is the default visible language unless explicitly changed

Current formal workbench surfaces include:

- overview
- new matter intake
- matter workspace
- evidence workspace
- task / decision workspace
- deliverable workspace
- agents management
- packs management
- history
- settings

Visual and interaction posture must remain aligned with `docs/03_workbench_ux_and_page_spec.md`.

---

## 7. Current Phase Rule

Wave 0 to Wave 5 deepen baseline is complete.

`P0-0` through `P0-H` hardening / extension baseline is complete.

Therefore:

- `P0 hardening line is formally closed`
- do not open `P0-I`
- do not reopen a hidden Wave 6
- new work should start from a new decision phase, not further baseline extension by default

The current recommended next-phase directions live in:

- `docs/00_product_definition_and_current_state.md`

---

## 8. Documentation Update Rules

When changing behavior:

- update the relevant active doc that owns the changed topic
- update `docs/04_qa_matrix.md` only when real verification evidence exists
- update `docs/05_benchmark_and_regression.md` only when benchmark / suite behavior truly changes

Do not:

- revive archive docs as active governance docs
- recreate removed legacy doc paths unless you are intentionally restoring a compatibility stub / redirect
- write product truth into research docs

---

## 9. Testing Expectations

Before considering a runtime change done, verify at least the affected layer and work surface.

Minimum expectations:

- task / workbench flow still functions
- Host orchestration still runs through the formal boundary
- structured outputs still return
- deliverables still persist
- history still persists
- no change bypasses the provider abstraction layer

If a change affects shipped behavior, add real evidence to `docs/04_qa_matrix.md`.

If a change affects benchmark / regression behavior, update `docs/05_benchmark_and_regression.md` and the underlying suite / manifests together.

---

## 10. Legacy Docs

Legacy top-level docs were removed from `docs/` during the 2026-04 reset.

Historical governance docs live under:

- `archive/docs/2026-04-documentation-reset/`

Research references live under:

- `research/docs/`

Use them only for historical context, not as primary design authority.
If an old deep link must keep working, restore it only as an explicit compatibility stub / redirect, not as a second active source of truth.
