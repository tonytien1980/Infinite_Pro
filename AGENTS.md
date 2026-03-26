# AGENTS.md

This file is the repository-level operating guide for Codex and other coding agents working on Infinite Pro.

The goal is to keep implementation work aligned with the current governance reset:

> **Infinite Pro is now planned as a Single-Consultant Full-Scope Edition.**

That means the product's **capability boundary is full-scope from day one** for a single consultant, even if implementation order is phased.

---

## 1. Read this first

Before making any structural, product, ontology, agent, or UI decisions, read these documents in this order:

1. `docs/00_project_vision.md`
2. `docs/01_problem_statement.md`
3. `docs/02_product_scope.md`
4. `docs/03_system_overview.md`
5. `docs/09_infinite_pro_core_definition.md`
6. `docs/10_frontend_information_architecture_and_ux_principles.md`
7. `docs/04_ontology_core.md`
8. `docs/05_agent_architecture.md`
9. `docs/06_system_architecture.md`
10. `docs/07_implementation_order.md`
11. `docs/08_codex_handoff.md`
12. `docs/11_intake_storage_architecture.md` when touching intake, source materials, storage, retention, purge, or artifact file lifecycle
13. `docs/12_runtime_persistence_and_release_integrity.md` when touching revision, rollback, publish, artifact registry, fallback, degraded mode, or sync recovery

If implementation ideas conflict with the documents, prefer the documents over assumptions.

If naming, product positioning, ontology modeling, or product drift questions appear, treat `docs/09_infinite_pro_core_definition.md` as a high-priority guide.
If homepage, navigation, workspace surface, management surface, history page, or Traditional Chinese UI copy decisions appear, treat `docs/10_frontend_information_architecture_and_ux_principles.md` as the primary governance guide.
If intake modes, source material ingestion, storage boundaries, retention, or purge lifecycle questions appear, treat `docs/11_intake_storage_architecture.md` as the primary governance guide.
If正文 persistence、revision、rollback、publish / artifact record、fail-closed、degraded mode、re-sync 邊界 questions appear, treat `docs/12_runtime_persistence_and_release_integrity.md` as the primary governance guide.

---

## 2. Formal product definition

Formal product name: `Infinite Pro`

Formal planning posture:

> **Single-Consultant Full-Scope Edition**

Meaning:
- the product must be planned to cover the **full working scope of one consultant**
- implementation order may be phased
- capability boundaries must **not** be artificially shrunk into a reduced product concept
- multi-user, multi-company, and multi-tenant system concerns are later layers, not the definition of the product itself

## 3. Product scope principle

Do **not** treat Infinite Pro as:
- a small prototype chatbot
- a prompt-wrapper utility
- a narrow collection of specialist tools
- a generic enterprise admin console

Treat Infinite Pro as:
- an ontology-first consulting workbench
- a Host-orchestrated decision system
- a multi-agent and multi-specialist advisory platform
- a system that must eventually cover the consultant's full working reality

The correct planning model is:

> **Full-scope by capability, phased by implementation order, single-user first, multi-user later.**

---

## 4. Full-scope capability boundary

Codex should assume the product boundary already includes:

### 4.1 Client stages
- `創業階段`
- `制度化階段`
- `規模化階段`

Do not reintroduce:
- earlier numeric stage shorthand

### 4.2 Client types
- 中小企業
- 個人品牌與服務
- 自媒體
- 大型企業

### 4.3 Consulting domains
- 營運
- 財務
- 法務
- 行銷
- 銷售
- 募資
- other extensible consulting domains

### 4.4 Formal architecture layers
The following layers are part of the official architecture from day one:
1. Ontology Layer
2. Context Layer
3. Capability Layer
4. Agent Layer
5. Pack Layer
6. Workbench / UI Layer

### 4.5 Cross-cutting system responsibilities
These are also first-class, not later add-ons:
- provider abstraction
- source ingestion
- evidence creation
- history persistence
- traceability
- deliverable-centric outputs

---

## 5. Architecture shape to preserve

At a minimum, implementation should preserve the following conceptual shape:

### 5.1 Ontology Layer
This is the shared world model, structured reasoning skeleton, and operational layer for objects, properties, links, actions, functions, and decision context.

### 5.2 Context Layer
This carries:
- client stage
- client type
- domain lenses
- decision context
- goals
- constraints
- assumptions
- stakeholders

### 5.3 Capability Layer
This defines the consulting work archetypes the system can perform, such as:
- diagnose
- review
- synthesize
- restructure
- converge
- plan
- challenge

### 5.4 Agent Layer
This includes:
- Host Agent as the only orchestration center
- multiple specialist and reasoning agents
- clear responsibilities, not roleplay personas
- a formal Agent Registry and Agent Resolver
- Host-selected agent context written back into aggregates, workspace payloads, and deliverable metadata
- formal omitted / deferred / escalation notes for relevant but non-activated agents
- execution-path impact, not just catalog visibility

### 5.5 Pack Layer
Pack Layer contains two formal pack families:
- Domain / Functional Packs
- Industry Packs

Packs are structured context modules, not agents.
They may extend:
- ontology-aware context presets
- domain heuristics
- industry heuristics
- expected evidence
- decision templates
- deliverable patterns
- routing hints

### 5.6 Workbench / UI Layer
The UI must evolve toward:
- object-aware views
- workflow-aware views
- deliverable-aware views

Do not collapse everything into one giant controller, one giant prompt, or one generic task page if avoidable.

---

## 6. Ontology-first planning rules

Do not plan the product around only:
- pages
- feature lists
- mode dropdowns

Plan around:
- objects
- properties
- links
- actions
- functions
- workflows
- decision context

Implementation should assume the ontology must formally represent at least:
- Client
- Engagement
- Workstream
- Task
- DecisionContext
- Artifact
- SourceMaterial
- Evidence
- Insight
- Risk
- Option
- Recommendation
- ActionItem
- Deliverable
- Goal
- Constraint
- Assumption
- Stakeholder
- Audience

The exact persistence schema may evolve, but these objects are part of the architecture boundary.

---

## 7. Host Agent rules

Host Agent is mandatory and remains the only orchestration center.

Host Agent must be planned to eventually handle:
- task interpretation
- ontology mapping
- decision-context framing
- workflow selection
- specialist selection
- agent coordination
- agent-aware selection through the formal registry / resolver path
- readiness governance
- evidence sufficiency checks
- convergence and deliverable shaping

For the single-consultant scope, this orchestration layer should now be treated as complete:
- selected agents must be explainable
- omitted / deferred / escalation reasoning must be visible
- selected agents must affect runtime path and deliverable shaping

Future work in this area should normally mean:
- bug fixes
- new packs
- new agent families
- multi-user / marketplace / organizational governance layers

Do not bypass Host Agent by letting UI-only logic or direct model calls decide the core workflow.

---

## 8. Agent rules

Agents are not theatrical personas.

Agents should be designed as:
- capability modules
- reasoning modules
- specialist modules
- domain-aware contributors

Do not lock the system to:
- only 4 core agents
- only 3 specialist flows
- only one narrow task family

Those may be current implementation slices, but they are **not** the formal product boundary anymore.

---

## 9. Pack rules

Packs are part of the formal architecture.

### 9.1 Domain / Functional Packs
Domain / Functional Packs provide context modules for consulting functions or enterprise problem areas, such as:
- `operations_pack`
- `finance_fundraising_pack`
- `legal_risk_pack`
- `marketing_sales_pack`
- `business_development_pack`
- `research_intelligence_pack`
- `organization_people_pack`
- `product_service_pack`

Treat these packs as:
- reusable domain context modules for real enterprise problem families
- not agents
- not capability archetypes
- not thin labels wrapped around existing task types

### 9.2 Industry Packs
Industry Packs provide context modules for industry-specific patterns, such as:
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

### 9.3 What packs are not
Do not treat packs as:
- labels
- marketing categories
- optional flavor text
- agents
- capability archetypes

### 9.4 What packs influence
Treat packs as structured extensions that can influence:
- ontology-aware context presets
- evidence expectations
- decision framing
- evaluation criteria
- deliverable shape
- routing hints

Even if only a subset is implemented first, the architecture must preserve this layer clearly.

## 10. Capability / Pack / Agent boundary rules

Keep these boundaries explicit:
- Capability Archetypes define **what kind of consulting work** is being done.
- Packs define **what contextual modules** should shape that work.
- Agents define **who executes or orchestrates** the work.

Do not collapse these into one taxonomy.

The workbench now exposes a minimal shared `Extension Manager`, and that management surface must remain a UI/governance surface, not a seventh architecture layer.

The single-consultant minimal management surface should at least support:
- pack catalog visibility
- agent catalog visibility
- task-level selected extension visibility
- task-level pack / agent overrides
- version / status visibility

---

## 11. Workbench / UI rules

The UI should feel like a consulting workbench, not:
- a generic CRUD admin panel
- a debug dashboard
- a chat-first interface

The workbench should increasingly reflect:
- the primary objects being worked on
- the current decision context
- the evidence base
- the deliverable being shaped
- the supporting context versus system trace distinction

Within the single-consultant scope, the following workbench surfaces should now be treated as formally established rather than provisional:
- `Decision Workspace`
- `Extension Manager` minimal surface
- `Matter / Engagement Workspace`
- `Artifact / Evidence Workspace`
- `Deliverable Workspace`

That means `Client / Engagement / Workstream / DecisionContext` should be treated as formal workspace subjects, not just task-detail summaries.
It also means `Artifact / SourceMaterial / Evidence` should be treated as formal workspace subjects with visible support chains, sufficiency, and gap governance, not only as supporting context cards.
It also means `Deliverable` should be treated as a formal workspace subject with visible class, linkage, limitations, and continuity, not just as a result section inside task detail.

Do not hard-code product logic into UI-only wording when the same rule belongs in shared application logic.

---

## 12. What is in scope now versus later

### 11.1 In scope for the formal product boundary now
- full single-consultant capability scope
- ontology-first object model
- Host orchestration
- multiple agents
- pack layer
- consulting workbench UI
- matter / engagement workspace as a formal case-working surface
- artifact / evidence workspace as a formal source-and-evidence work surface
- deliverable workspace as a formal deliverable-working surface
- provider abstraction
- source / evidence / history / traceability

### 11.2 Later system layers
These are later layers, not the current product boundary:
- multi-user login
- role / permission systems
- multi-consultant collaboration
- multi-company workspace sync
- multi-tenant governance
- per-user API key management
- large enterprise admin features

Do not confuse "not doing multi-user yet" with shrinking the product into a reduced-scope implementation.

---

## 13. Implementation order rules

Use implementation order to stage delivery, but **not** to shrink product meaning.

Prefer this order:
1. governance alignment and object model
2. ontology and context structures
3. Host orchestration and capability routing
4. workbench surfaces
5. specialist / reasoning agent expansion
6. pack integration
7. multi-user system layers later

Do not frame design decisions as "out of scope" if they are part of the full single-consultant capability boundary.

Instead, frame them as:
- first-wave implementation
- second-wave implementation
- later system-layer implementation

---

## 14. Engineering rules

### 13.1 Build small, but build toward the full architecture
Incremental delivery is good.
Artificially shrinking the architecture boundary is not.

### 13.2 Objects before prompt sprawl
Prefer structured objects and links over giant prompt blobs.

### 13.3 Preserve provider abstraction
All model usage must continue to go through an internal router / provider boundary.

### 13.4 Preserve deliverable-centric outputs
Outputs should remain decision-ready and object-aware, not generic long chat answers.

### 13.5 Preserve traceability
Source -> Evidence -> Insight / Risk / Recommendation -> Deliverable should remain visible in the architecture.

### 13.6 Avoid fake future-proofing
Do not add speculative platform features just because they sound scalable.
Keep the architecture visible and extensible, but implement with discipline.

---

## 15. Testing expectations

Before considering a change done, verify at least:
- the task / workbench flow still functions
- Host orchestration still runs
- structured outputs still return
- deliverables still persist
- history still persists
- no code bypasses the model abstraction layer

If a change touches orchestration, ontology, or context modeling, test both:
- a convergence-style path
- at least one specialist path

If a change affects workbench structure, validate:
- main work surface readability
- responsive layout stability
- supporting context and system trace separation

---

## 16. Change control rules

When making changes:
- keep diffs scoped
- avoid mixing unrelated refactors with new behavior
- document new architectural assumptions when they affect later work
- do not casually rename major concepts
- do not reintroduce reduced-scope framing as the product boundary

If a requested change conflicts with the full-scope single-consultant architecture, implement the narrowest change that still preserves the architecture boundary, or flag the conflict clearly.

---

## 17. What success looks like

A good Infinite Pro implementation should make it possible for one consultant to:

1. work on real client matters
2. frame decisions in context
3. attach and organize evidence
4. run host-led specialist or multi-agent workflows
5. shape decision-ready deliverables
6. revisit history and refine recommendations over time
7. feel that the system is a true consulting workbench, not another chat window

That is the standard to build toward.
