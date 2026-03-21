# AGENTS.md

This file is the repository-level operating guide for Codex and other coding agents working on this project.

The goal is not to restate every strategy document in full. The goal is to make implementation work predictable, scoped, and aligned with the current MVP direction.

---

## 1. Read this first

Before making any structural or product decisions, read these documents in this order:

1. `docs/00_project_vision.md`
2. `docs/01_problem_statement.md`
3. `docs/02_product_scope_v1.md`
4. `docs/03_system_overview.md`
5. `docs/09_infinite_pro_core_definition.md`

If later documents exist, read them after the four files above:
- `docs/04_ontology_core_v1.md`
- `docs/05_agent_architecture_v1.md`
- `docs/06_system_architecture_v1.md`

If implementation ideas conflict with the current documents, prefer the documents over assumptions.
If naming, product positioning, or product drift questions appear, treat `docs/09_infinite_pro_core_definition.md` as a high-priority guide.

Do not invent product scope that has not been confirmed in the docs.

---

## 2. Product summary

Formal product name: `Infinite Pro`

Note:
- `Infinite Pro` is now the official product name.
- Legacy references to `AI Advisory OS` may still remain in older documents or internal code/package names until an explicit rename pass is requested.

This project is an ontology-centered intelligent work platform for complex knowledge work.

At a high level, the system should:
- accept a user task plus background material
- let a Host Agent orchestrate the workflow
- invoke a small set of specialist or perspective-based agents when needed
- use a shared ontology / world model so agents work on the same task reality
- produce structured outputs, not only free-form chat
- preserve task history so work compounds over time
- remain extensible for future modules, packs, and agent capabilities

This is **not** a generic chatbot wrapper.
This is **not** a simple RAG app.
This is **not** a full Palantir-scale ontology platform on day one.

---

## 3. Current stage

Current stage: **MVP / V1**

The MVP is intentionally scoped as:
- an internal core tool for consulting work
- primarily a personal workbench, not a full team collaboration suite
- focused on complex business problem convergence as the main experience
- with a few single-task specialist flows as secondary capabilities

The MVP exists to validate the platform core, not to prove every future expansion at once.

---

## 4. MVP principles

Always preserve these principles:

1. **Ontology before prompt sprawl**
   - Prefer structured task objects and explicit state over giant prompt blobs.

2. **Host Agent is the control center**
   - The Host Agent is not optional.
   - It should interpret the task, choose workflow mode, select agents, and converge outputs.

3. **Complex-task convergence is the main product story**
   - Single-task specialist features are useful, but they are secondary in V1.

4. **Structured outputs over long prose**
   - Prefer output schemas with sections such as:
     - problem definition
     - background summary
     - findings / insights
     - risks
     - recommendations
     - action items
     - missing information

5. **Build the base, not the entire universe**
   - Preserve future extensibility.
   - Do not overbuild platform features too early.

---

## 5. In-scope for V1

Codex should treat the following as in scope for MVP implementation:

### Core platform flow
- task input
- background/context input
- file upload and document reference
- host-agent-led workflow selection
- small multi-agent orchestration flow
- structured result generation
- task history persistence

### Main experience
- complex business problem analysis and convergence

### Secondary specialist flows
Support these three specialist categories first:
- contract review
- research synthesis
- document / proposal restructuring

### Agent count
Keep the initial core agent set to roughly **3 to 5** agents.

### Model layer
Build a model abstraction / router layer that allows future provider switching.
Do not hardwire the whole system to a single LLM vendor interface.

---

## 6. Out of scope for V1

Do **not** expand into these unless explicitly updated in the docs:

- external open agent marketplace
- large enterprise permission systems
- complex multi-tenant governance
- fully autonomous high-risk execution
- complete industry-specific ontology packs
- complete team collaboration suite
- elaborate self-evolving agent ecosystems
- replacing every specialist tool category

Do not quietly add these because they feel “future-proof.”
Future-proofing should happen through architecture boundaries, not feature creep.

---

## 7. System shape to preserve

At a minimum, implementation should preserve these conceptual layers:

1. **User experience layer**
   - input task
   - upload files
   - review outputs
   - browse task history

2. **Host orchestration layer**
   - parse task
   - choose workflow mode
   - select agents
   - manage convergence

3. **Ontology / shared state layer**
   - shared task world model
   - background, goals, evidence, risks, recommendations, actions

4. **Agent capability layer**
   - perspective agents
   - specialist agents
   - future extensibility

5. **Persistence layer**
   - task history
   - output artifacts
   - referenced background material
   - structured state

Do not collapse everything into one giant controller or one giant prompt if avoidable.

---

## 8. Expected ontology direction

The ontology does not need to be “complete.”
It does need to support the MVP core loop.

Implementation should assume the shared task model eventually needs to represent concepts like:
- task
- context
- subject
- goal
- constraint
- evidence
- insight
- risk
- option
- recommendation
- action item
- deliverable

Until the dedicated ontology document is finalized, keep the data model flexible and minimal.
Do not freeze an overly rigid schema too early.

---

## 9. Workflow modes

Support two broad workflow modes:

### A. Complex convergence mode
Primary mode for MVP.
Used for multi-perspective analysis and convergence.

Typical flow:
1. ingest task and context
2. host agent interprets task
3. select relevant agents
4. run agent contributions
5. converge results
6. output structured deliverable
7. save history

### B. Specialist mode
Secondary mode for MVP.
Used for bounded, focused tasks such as contract review or synthesis.

The specialist mode should still reuse:
- task model
- file/context ingestion
- model abstraction
- structured output conventions
- history persistence

---

## 10. Implementation priorities

When choosing between tasks, prefer this order:

1. task ingestion and persistence
2. file/context handling
3. host-agent workflow control
4. basic ontology-aligned task state
5. multi-agent execution loop
6. structured output rendering
7. specialist task flows
8. model router improvements
9. polish and refactoring

Do not start from visual polish if core workflow state is not stable.

---

## 11. Engineering rules

### Build small, testable slices
Prefer incremental delivery over large rewrites.

### Avoid hard-coding product assumptions in UI-only logic
Important workflow rules should live in reusable application logic.

### Prefer explicit state
Use named structures instead of passing opaque strings between components whenever practical.

### Preserve future provider switching
Any model integration should go through an internal abstraction boundary.

### Preserve future module expansion
When adding specialist flows, plug them into the same base architecture where possible.

### Keep prompt assets organized
Do not scatter prompts inline across unrelated files.
Use a clear prompt organization strategy if prompt files are created.

---

## 12. UX rules for MVP

The MVP should feel like a personal workbench.

That means:
- clear task creation
- clear file attachment / context attachment
- visible structured outputs
- visible history
- minimal but understandable workflow steps

Do not design for full enterprise complexity yet.
Do not assume many simultaneous users.
Do not optimize first for admin panels.

---

## 13. Testing expectations

Before considering a task done, verify at least:

- the flow still supports task creation
- background context can still be attached
- the host orchestration path still runs
- structured outputs are still returned
- task history still persists
- no new code bypasses the model abstraction layer

If a feature touches orchestration or ontology-related state, test with both:
- complex convergence mode
- one specialist mode if relevant

---

## 14. Change control rules

When making changes:

- keep diffs scoped
- avoid mixing refactors with new feature behavior unless necessary
- document new assumptions in comments or docs if they affect future work
- do not rename major concepts casually
- do not widen scope without updating docs

If a requested change appears to conflict with the MVP scope, implement the narrowest version that fits the current documents, or flag the conflict clearly.

---

## 15. Naming guidance

Branding is now finalized for product-facing language:
- use `Infinite Pro` as the formal product name in docs, README, user-facing UI copy, and development status updates
- do not do a large package / repo / module rename unless explicitly requested
- legacy internal names such as `AI Advisory OS` may remain temporarily in non-user-facing code paths until a dedicated rename pass is approved

---

## 16. Repo structure guidance

If the repo is being created from scratch, prefer a structure that cleanly separates:
- app / UI
- orchestration
- ontology / domain models
- agent definitions
- model providers / router
- storage / persistence
- prompts
- docs

Exact framework choices may change, but this separation should remain visible.

---

## 17. What success looks like

A good MVP implementation should make it possible for one user to:

1. start a task
2. attach relevant context or files
3. run either a complex convergence flow or a specialist flow
4. receive a structured result
5. review the result later in history
6. feel that the system is a real workbench, not just another chat window

That is enough for the first meaningful version.

---

## 18. If unsure

If implementation uncertainty appears, prefer:
- preserving architecture flexibility
- preserving shared task state
- preserving host-agent control
- preserving structured outputs
- preserving future extensibility

Do not optimize for speculative future modules at the cost of a working MVP.

Build the base correctly first.
