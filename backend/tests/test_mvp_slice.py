from __future__ import annotations

from io import BytesIO
import json

from fastapi.testclient import TestClient
import pytest
from docx import Document
from pypdf import PdfWriter
from sqlalchemy import select

from app.agents.host import HostOrchestrator
from app.core.database import SessionLocal
from app.domain import models
from app.ingestion import remote as remote_ingestion
from app.ingestion.remote import RemoteSourceContent
from app.model_router.base import PackContractSynthesisRequest
from app.model_router.structured_tasks import build_pack_contract_synthesis_spec
from app.services import extension_contract_synthesis
from app.services.external_search import SearchResult
from app.services.tasks import get_loaded_task
from app.workbench import schemas as workbench_schemas


def assert_consultant_output_shell(content: dict) -> None:
    assert content["executive_summary"]
    assert content["core_judgment"]
    assert "recommendations" in content
    assert "risks" in content
    assert "action_items" in content
    assert "missing_information" in content
    assert content["recommendation_cards"]
    assert content["risk_cards"]
    assert content["action_item_cards"]


def create_task_payload(title: str = "Research memo synthesis") -> dict:
    return {
        "title": title,
        "description": "Turn the working notes into a structured internal synthesis.",
        "task_type": "research_synthesis",
        "mode": "specialist",
        "external_data_strategy": "supplemental",
        "background_text": "The client wants a quick internal summary before proposal drafting.",
        "subject_name": "Proposal research pack",
        "goal_description": "Highlight the strongest findings and next actions.",
        "constraints": [
            {
                "description": "Keep the output internal-only for now.",
                "constraint_type": "delivery",
                "severity": "medium",
            }
        ],
    }


def create_multi_agent_payload(title: str = "Multi-agent convergence") -> dict:
    return {
        "title": title,
        "description": "Converge the evidence into a cross-perspective internal recommendation.",
        "task_type": "complex_convergence",
        "mode": "multi_agent",
        "external_data_strategy": "supplemental",
        "background_text": "We need a quick convergence draft for internal strategy review.",
        "subject_name": "Internal convergence memo",
        "goal_description": "Produce a short structured recommendation with risks and next steps.",
        "constraints": [
            {
                "description": "Keep it brief and evidence-backed.",
                "constraint_type": "delivery",
                "severity": "medium",
            }
        ],
    }


def create_document_restructuring_payload(title: str = "Document restructuring") -> dict:
    return {
        "title": title,
        "description": "Restructure the working draft into a clearer internal proposal outline.",
        "task_type": "document_restructuring",
        "mode": "specialist",
        "external_data_strategy": "supplemental",
        "background_text": "The current draft repeats itself and buries the main recommendation too late.",
        "subject_name": "Internal proposal draft",
        "goal_description": "Produce a cleaner outline and rewrite guidance for the next draft.",
        "constraints": [
            {
                "description": "Keep the tone internal and practical.",
                "constraint_type": "delivery",
                "severity": "medium",
            }
        ],
    }


def create_contract_review_payload(title: str = "Contract review") -> dict:
    return {
        "title": title,
        "description": "Review the draft agreement for major risk, obligation, and redline concerns.",
        "task_type": "contract_review",
        "mode": "specialist",
        "external_data_strategy": "supplemental",
        "background_text": "The team needs a first-pass internal contract review before legal escalation.",
        "subject_name": "Draft services agreement",
        "goal_description": "Identify major issues, contract risk, and next review actions.",
        "constraints": [
            {
                "description": "Keep the output internal and non-final.",
                "constraint_type": "delivery",
                "severity": "high",
            }
        ],
    }


def create_operations_process_payload(title: str = "Operations process review") -> dict:
    return {
        "title": title,
        "description": "Review the workflow for bottlenecks, owner gaps, dependency blocks, and control gaps before scaling delivery.",
        "task_type": "complex_convergence",
        "mode": "multi_agent",
        "external_data_strategy": "supplemental",
        "background_text": "The team suspects the approval workflow, handoff, and owner mapping are slowing delivery.",
        "subject_name": "Delivery workflow review",
        "goal_description": "Identify the process issues and remediation steps that should be prioritized first.",
        "constraints": [
            {
                "description": "Keep the output internal and remediation-oriented.",
                "constraint_type": "delivery",
                "severity": "medium",
            }
        ],
    }


def test_health_endpoint(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_workbench_preferences_round_trip_theme_preference(client: TestClient) -> None:
    initial = client.get("/api/v1/workbench/preferences")

    assert initial.status_code == 200
    assert initial.json()["theme_preference"] == "light"

    update = client.put(
        "/api/v1/workbench/preferences",
        json={
            "interface_language": "zh-Hant",
            "theme_preference": "dark",
            "homepage_display_preference": "matters",
            "history_default_page_size": 20,
            "show_recent_activity": True,
            "show_quick_actions": True,
            "show_system_trace": False,
            "density": "standard",
            "deliverable_sort_preference": "updated_desc",
        },
    )

    assert update.status_code == 200
    assert update.json()["theme_preference"] == "dark"

    refreshed = client.get("/api/v1/workbench/preferences")

    assert refreshed.status_code == 200
    assert refreshed.json()["theme_preference"] == "dark"


def test_pack_management_round_trip_core_contract_fields(client: TestClient) -> None:
    update = client.put(
        "/api/v1/extensions/packs/operations_pack",
        json={
            "pack_id": "operations_pack",
            "pack_type": "domain",
            "pack_name": "Operations Pack",
            "description": "Refresh the operating pack contract for management surface coverage.",
            "domain_definition": "For operations-heavy consulting work where execution rhythm, capacity, and process visibility need a structured operating lens.",
            "industry_definition": "",
            "common_business_models": [],
            "common_problem_patterns": [
                "handoff friction between sales and delivery",
                "throughput is constrained by unclear prioritization",
            ],
            "stage_specific_heuristics": {
                "創業階段": ["founder throughput is the first bottleneck to verify"],
            },
            "key_kpis_or_operating_signals": [
                "cycle time",
                "on-time completion rate",
            ],
            "key_kpis": [
                "cycle time",
                "on-time completion rate",
            ],
            "domain_lenses": ["operations", "execution"],
            "relevant_client_types": ["中小企業"],
            "relevant_client_stages": ["制度化階段"],
            "default_decision_context_patterns": [
                "should this workflow be redesigned before scaling",
            ],
            "evidence_expectations": [
                "recent backlog and throughput snapshots",
                "handoff ownership map",
            ],
            "risk_libraries": ["execution slippage"],
            "common_risks": ["capacity looks fine on paper but breaks during peak demand"],
            "decision_patterns": ["whether to redesign workflow ownership before adding headcount"],
            "deliverable_presets": ["operating diagnosis memo", "execution reset action plan"],
            "recommendation_patterns": ["stabilize intake before expanding capacity"],
            "routing_hints": ["prioritize operations_agent when execution visibility is thin"],
            "pack_notes": ["treat missing throughput data as a first-order evidence gap"],
            "scope_boundaries": ["does not replace detailed ERP implementation design"],
            "pack_rationale": ["operations work needs a dedicated pack because evidence and remedies differ from generic strategy work"],
            "version": "1.2.0",
            "status": "active",
            "override_rules": ["task-level overrides can force operations_pack even without explicit domain lens"],
            "is_custom": False,
        },
    )

    assert update.status_code == 200
    operations_pack = next(
        item
        for item in update.json()["pack_registry"]["packs"]
        if item["pack_id"] == "operations_pack"
    )
    assert operations_pack["domain_definition"].startswith("For operations-heavy consulting work")
    assert operations_pack["stage_specific_heuristics"]["創業階段"] == [
        "founder throughput is the first bottleneck to verify"
    ]
    assert operations_pack["evidence_expectations"] == [
        "recent backlog and throughput snapshots",
        "handoff ownership map",
    ]
    assert operations_pack["decision_patterns"] == [
        "whether to redesign workflow ownership before adding headcount"
    ]
    assert operations_pack["deliverable_presets"] == [
        "operating diagnosis memo",
        "execution reset action plan",
    ]
    assert operations_pack["routing_hints"] == [
        "prioritize operations_agent when execution visibility is thin"
    ]
    assert operations_pack["scope_boundaries"] == [
        "does not replace detailed ERP implementation design"
    ]
    assert operations_pack["pack_rationale"] == [
        "operations work needs a dedicated pack because evidence and remedies differ from generic strategy work"
    ]
    assert operations_pack["override_rules"] == [
        "task-level overrides can force operations_pack even without explicit domain lens"
    ]
    assert operations_pack["contract_baseline"]["pack_api_name"] == "operations_pack"
    assert operations_pack["contract_baseline"]["status"] == "ready"
    assert operations_pack["contract_baseline"]["ready_interface_ids"] == [
        "evidence_readiness_v1",
        "decision_framing_v1",
        "deliverable_shaping_v1",
    ]
    assert operations_pack["contract_baseline"]["ready_rule_binding_ids"] == [
        "readiness_gate_v1",
        "decision_context_hint_v1",
        "deliverable_hint_v1",
    ]


def test_active_pack_requires_wave4_contract_baseline(client: TestClient) -> None:
    response = client.put(
        "/api/v1/extensions/packs/operations_pack",
        json={
            "pack_id": "operations_pack",
            "pack_type": "domain",
            "pack_name": "Operations Pack",
            "description": "Too thin to qualify as an active contract-bound pack.",
            "domain_definition": "Only a thin definition is provided.",
            "industry_definition": "",
            "common_business_models": [],
            "common_problem_patterns": [],
            "stage_specific_heuristics": {},
            "key_kpis_or_operating_signals": [],
            "key_kpis": [],
            "domain_lenses": ["operations"],
            "relevant_client_types": ["中小企業"],
            "relevant_client_stages": ["制度化階段"],
            "default_decision_context_patterns": [],
            "evidence_expectations": [],
            "risk_libraries": [],
            "common_risks": [],
            "decision_patterns": [],
            "deliverable_presets": [],
            "recommendation_patterns": [],
            "routing_hints": [],
            "pack_notes": [],
            "scope_boundaries": [],
            "pack_rationale": [],
            "version": "1.3.0",
            "status": "active",
            "override_rules": [],
            "is_custom": False,
        },
    )

    assert response.status_code == 400
    assert "正式 contract baseline" in response.json()["detail"]
    assert "evidence_readiness_v1" in response.json()["detail"]
    assert "deliverable_shaping_v1" in response.json()["detail"]


def test_active_domain_pack_requires_p0a_hardening_properties(client: TestClient) -> None:
    response = client.put(
        "/api/v1/extensions/packs/operations_pack",
        json={
            "pack_id": "operations_pack",
            "pack_type": "domain",
            "pack_name": "Operations Pack",
            "description": "Enough to satisfy Wave 4, but missing new domain hardening fields.",
            "domain_definition": "Operations-heavy work where throughput and delivery discipline matter.",
            "industry_definition": "",
            "common_business_models": [],
            "common_problem_patterns": [
                "handoff friction blocks delivery",
            ],
            "stage_specific_heuristics": {},
            "key_kpis_or_operating_signals": [],
            "key_kpis": [],
            "domain_lenses": ["operations"],
            "relevant_client_types": ["中小企業"],
            "relevant_client_stages": ["制度化階段"],
            "default_decision_context_patterns": [
                "operating model diagnosis",
            ],
            "evidence_expectations": [
                "recent throughput snapshots",
            ],
            "risk_libraries": ["execution risk"],
            "common_risks": [],
            "decision_patterns": [
                "whether to redesign workflow ownership before adding headcount",
            ],
            "deliverable_presets": [
                "operations assessment memo",
            ],
            "recommendation_patterns": [
                "stabilize intake before scaling",
            ],
            "routing_hints": ["operations", "workflow"],
            "pack_notes": [],
            "scope_boundaries": [
                "does not replace detailed ERP implementation design",
            ],
            "pack_rationale": [
                "operations work needs a dedicated context module",
            ],
            "version": "1.4.0",
            "status": "active",
            "override_rules": [],
            "is_custom": False,
        },
    )

    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "stage_specific_heuristics" in detail
    assert "key_signals" in detail
    assert "common_risks" in detail


def test_agent_management_round_trip_core_contract_fields(client: TestClient) -> None:
    update = client.put(
        "/api/v1/extensions/agents/research_intelligence_agent",
        json={
            "agent_id": "research_intelligence_agent",
            "agent_name": "Research / Investigation Agent",
            "agent_type": "reasoning",
            "description": "Owns investigation planning, source quality, evidence-gap closure, and citation-ready handoff.",
            "supported_capabilities": [
                "synthesize_brief",
                "diagnose_assess",
                "scenario_comparison",
                "risk_surfacing",
            ],
            "relevant_domain_packs": ["research_intelligence_pack"],
            "relevant_industry_packs": ["ecommerce_pack", "saas_pack"],
            "primary_responsibilities": [
                "break research into sub-questions",
                "grade source quality and freshness",
            ],
            "out_of_scope": [
                "does not replace Host as final decision owner",
                "does not replace downstream synthesis",
            ],
            "defer_rules": [
                "defer finality when source quality is weak",
            ],
            "preferred_execution_modes": ["multi_agent", "specialist"],
            "input_requirements": ["DecisionContext", "SourceMaterial", "Evidence"],
            "minimum_evidence_readiness": [
                "at least one researchable question or evidence gap",
            ],
            "required_context_fields": ["DecisionContext", "selected packs"],
            "output_contract": [
                "investigation findings",
                "source-quality notes",
                "citation-ready handoff",
            ],
            "produced_objects": ["Insight", "EvidenceGap", "ResearchRun"],
            "deliverable_impact": [
                "shapes evidence basis and uncertainty boundary",
            ],
            "writeback_expectations": [
                "write provenance and evidence-gap notes into the chain",
            ],
            "invocation_rules": [
                "prefer for external-research-heavy or evidence-gap-heavy cases",
            ],
            "escalation_rules": [
                "escalate when source quality is too weak to support claims",
            ],
            "handoff_targets": ["Host Agent", "Research Synthesis Specialist"],
            "evaluation_focus": [
                "sub-question quality",
                "source-quality handling",
            ],
            "failure_modes_to_watch": [
                "treating search results as validated facts",
            ],
            "trace_requirements": [
                "must preserve research depth, gaps, and citation handoff",
            ],
            "version": "1.1.0",
            "status": "active",
            "is_custom": False,
        },
    )

    assert update.status_code == 200
    research_agent = next(
        item
        for item in update.json()["agent_registry"]["agents"]
        if item["agent_id"] == "research_intelligence_agent"
    )
    assert research_agent["agent_name"] == "Research / Investigation Agent"
    assert research_agent["primary_responsibilities"] == [
        "break research into sub-questions",
        "grade source quality and freshness",
    ]
    assert research_agent["preferred_execution_modes"] == ["multi_agent", "specialist"]
    assert research_agent["output_contract"] == [
        "investigation findings",
        "source-quality notes",
        "citation-ready handoff",
    ]
    assert research_agent["handoff_targets"] == ["Host Agent", "Research Synthesis Specialist"]
    assert research_agent["trace_requirements"] == [
        "must preserve research depth, gaps, and citation handoff",
    ]


def test_agent_contract_draft_generation_uses_search_and_returns_full_contract(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fake_search(query: str, *, max_results: int = 3, timeout_seconds: int = 20):
        assert "Research Investigation Agent" in query
        return [
            SearchResult(
                title="Market research methods",
                url="https://example.com/research",
                snippet="Research plans should preserve source quality and evidence gaps.",
            ),
            SearchResult(
                title="Consulting investigation workflow",
                url="https://example.com/workflow",
                snippet="A good investigation workflow separates sub-questions and citation handoff.",
            ),
        ]

    monkeypatch.setattr(
        "app.services.extension_contract_synthesis.search_external_sources",
        fake_search,
    )

    response = client.post(
        "/api/v1/extensions/agents/contract-draft",
        json={
            "agent_id": "custom_research_agent",
            "agent_name": "Research Investigation Agent",
            "agent_type": "reasoning",
            "description": "Helps the Host plan and execute outside research.",
            "supported_capabilities": ["synthesize_brief", "diagnose_assess"],
            "relevant_domain_packs": ["research_intelligence_pack"],
            "relevant_industry_packs": ["saas_pack"],
            "role_focus": "拆研究子問題\n補外部資料缺口",
            "input_focus": "DecisionContext\n可引用材料",
            "output_focus": "來源品質摘要\ncitation-ready handoff",
            "when_to_use": "證據不足，需要外部補完時",
            "boundary_focus": "不取代 Host 最終拍板",
            "version": "1.0.0",
            "status": "active",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert "Research Investigation Agent" in payload["search_query"]
    assert len(payload["sources"]) == 2
    assert payload["draft"]["agent_id"] == "custom_research_agent"
    assert payload["draft"]["agent_name"] == "Research Investigation Agent"
    assert payload["draft"]["primary_responsibilities"]
    assert payload["draft"]["output_contract"]
    assert payload["draft"]["trace_requirements"]
    assert payload["generation_notes"]


def test_pack_contract_draft_generation_uses_search_and_returns_full_contract(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fake_search(query: str, *, max_results: int = 3, timeout_seconds: int = 20):
        assert "Clinic Growth Pack" in query
        return [
            SearchResult(
                title="Clinic patient retention metrics",
                url="https://example.com/clinic-metrics",
                snippet="Retention, visit frequency, and utilization are common clinic signals.",
            ),
        ]

    monkeypatch.setattr(
        "app.services.extension_contract_synthesis.search_external_sources",
        fake_search,
    )

    response = client.post(
        "/api/v1/extensions/packs/contract-draft",
        json={
            "pack_id": "clinic_growth_pack",
            "pack_type": "industry",
            "pack_name": "Clinic Growth Pack",
            "description": "Supports clinic growth and operating decisions.",
            "definition": "Private clinics balancing acquisition, utilization, and retention.",
            "domain_lenses": [],
            "routing_keywords": "clinic\npatient flow\nretention",
            "common_business_models": "self-pay\nmembership",
            "common_problem_patterns": "new patient acquisition is unstable\nfollow-up visits are dropping",
            "key_signals": "new patient count\nretention rate\nprovider utilization",
            "evidence_expectations": "monthly patient funnel\nprovider schedule utilization",
            "common_risks": "over-investing in acquisition before fixing retention",
            "version": "1.0.0",
            "status": "active",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert "Clinic Growth Pack" in payload["search_query"]
    assert len(payload["sources"]) == 1
    assert payload["draft"]["pack_id"] == "clinic_growth_pack"
    assert payload["draft"]["pack_name"] == "Clinic Growth Pack"
    assert payload["draft"]["common_problem_patterns"]
    assert payload["draft"]["decision_patterns"]
    assert payload["draft"]["deliverable_presets"]
    assert payload["draft"]["pack_rationale"]
    assert payload["generation_notes"]


def test_pack_contract_synthesis_schema_uses_strict_stage_keys() -> None:
    spec = build_pack_contract_synthesis_spec(
        PackContractSynthesisRequest(
            pack_id="sample_pack",
            pack_type="domain",
            pack_name="Sample Pack",
        )
    )

    stage_schema = spec.schema["properties"]["stage_specific_heuristics"]
    assert stage_schema["additionalProperties"] is False
    assert stage_schema["required"] == ["創業階段", "制度化階段", "規模化階段"]


def test_agent_contract_synthesis_normalizes_invalid_model_output(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured_request = None

    class FakeProvider:
        def generate_agent_contract_synthesis(self, request):
            nonlocal captured_request
            captured_request = request
            from app.model_router.base import AgentContractSynthesisOutput

            return AgentContractSynthesisOutput(
                agent_type="made_up_type",
                supported_capabilities=["fake_capability"],
                relevant_domain_packs=["operations_pack", "invented_pack"],
                relevant_industry_packs=["saas_pack", "invented_industry"],
                description="Synthetic description",
                primary_responsibilities=["Do the core work"],
                out_of_scope=["Do not replace Host"],
                defer_rules=["Defer when evidence is thin"],
                preferred_execution_modes=["multi_agent"],
                input_requirements=["DecisionContext"],
                minimum_evidence_readiness=["At least one evidence item"],
                required_context_fields=["DecisionContext"],
                output_contract=["Findings"],
                produced_objects=["Insight"],
                deliverable_impact=["Shapes the memo"],
                writeback_expectations=["Preserve provenance"],
                invocation_rules=["Use when needed"],
                escalation_rules=["Escalate on major uncertainty"],
                handoff_targets=["Host Agent"],
                evaluation_focus=["Signal quality"],
                failure_modes_to_watch=["Weak evidence wrapped as fact"],
                trace_requirements=["Keep traceability"],
                synthesis_summary="summary",
                generation_notes=["note"],
            )

    monkeypatch.setattr(extension_contract_synthesis, "get_model_provider", lambda: FakeProvider())
    monkeypatch.setattr(extension_contract_synthesis, "search_external_sources", lambda *args, **kwargs: [])

    response = extension_contract_synthesis.synthesize_agent_contract_draft(
        workbench_schemas.AgentContractDraftRequest(
            agent_id="synthetic_agent",
            agent_name="Synthetic Agent",
            agent_type="reasoning",
            description="Handles synthetic work.",
        )
    )

    assert response.draft.agent_type == "reasoning"
    assert response.draft.supported_capabilities == ["diagnose_assess", "synthesize_brief"]
    assert response.draft.relevant_domain_packs == ["operations_pack"]
    assert response.draft.relevant_industry_packs == ["saas_pack"]
    assert captured_request is not None
    assert captured_request.response_language == "zh-Hant"


def test_pack_contract_synthesis_normalizes_invalid_model_output(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured_request = None

    class FakeProvider:
        def generate_pack_contract_synthesis(self, request):
            nonlocal captured_request
            captured_request = request
            from app.model_router.base import PackContractSynthesisOutput

            return PackContractSynthesisOutput(
                description="Synthetic pack description",
                domain_definition="Synthetic domain definition",
                industry_definition="",
                common_business_models=[],
                common_problem_patterns=["Pattern"],
                stage_specific_heuristics={
                    "創業階段": ["A"],
                    "制度化階段": ["B"],
                    "規模化階段": ["C"],
                },
                key_kpis_or_operating_signals=["Signal"],
                key_kpis=["Signal"],
                domain_lenses=["operations", "invented_lens"],
                relevant_client_types=["中小企業", "未知客群"],
                relevant_client_stages=["創業階段", "未知階段"],
                default_decision_context_patterns=["Pattern"],
                evidence_expectations=["Evidence"],
                risk_libraries=["Risk library"],
                common_risks=["Risk"],
                decision_patterns=["Decision"],
                deliverable_presets=["Preset"],
                recommendation_patterns=["Recommendation"],
                routing_hints=["Hint"],
                pack_notes=["Note"],
                scope_boundaries=["Boundary"],
                pack_rationale=["Rationale"],
                synthesis_summary="summary",
                generation_notes=["note"],
            )

    monkeypatch.setattr(extension_contract_synthesis, "get_model_provider", lambda: FakeProvider())
    monkeypatch.setattr(extension_contract_synthesis, "search_external_sources", lambda *args, **kwargs: [])

    response = extension_contract_synthesis.synthesize_pack_contract_draft(
        workbench_schemas.PackContractDraftRequest(
            pack_id="synthetic_pack",
            pack_type="domain",
            pack_name="Synthetic Pack",
            description="Handles synthetic cases.",
        )
    )

    assert response.draft.domain_lenses == ["operations"]
    assert response.draft.relevant_client_types == ["中小企業"]
    assert response.draft.relevant_client_stages == ["創業階段"]
    assert captured_request is not None
    assert captured_request.response_language == "zh-Hant"


def test_task_creation_attaches_background_text_as_context_and_evidence(client: TestClient) -> None:
    response = client.post("/api/v1/tasks", json=create_task_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Research memo synthesis"
    assert body["external_data_strategy"] == "supplemental"
    assert body["contexts"][0]["summary"].startswith("The client wants a quick internal summary")
    assert any(item["evidence_type"] == "background_text" for item in body["evidence"])
    assert body["goals"][0]["description"] == "Highlight the strongest findings and next actions."
    assert body["client"] is not None
    assert body["engagement"] is not None
    assert body["workstream"] is not None
    assert body["decision_context"] is not None
    assert body["decision_context"]["judgment_to_make"]
    assert body["domain_lenses"]
    assert body["input_entry_mode"] == "one_line_inquiry"
    assert body["deliverable_class_hint"] == "exploratory_brief"
    assert body["flagship_lane"]["lane_id"] == "diagnostic_start"
    assert body["flagship_lane"]["label"] == "先快速看清問題與下一步"
    assert body["flagship_lane"]["summary"]
    assert body["flagship_lane"]["next_step_summary"]
    assert body["flagship_lane"]["upgrade_note"]
    assert body["flagship_lane"]["current_output_label"] == "探索型簡報"
    assert body["flagship_lane"]["upgrade_target_label"] == "評估 / 審閱備忘"
    assert body["flagship_lane"]["upgrade_requirements"]
    assert body["flagship_lane"]["upgrade_ready"] is False
    assert body["flagship_lane"]["boundary_note"]
    assert body["matter_workspace"]["flagship_lane"]["lane_id"] == "diagnostic_start"
    assert body["presence_state_summary"]["decision_context"]["state"] in {
        "explicit",
        "provisional",
    }


def test_task_creation_builds_case_world_draft_and_continuity_policy(client: TestClient) -> None:
    payload = create_task_payload("Case world draft")
    payload["engagement_continuity_mode"] = "follow_up"
    payload["writeback_depth"] = "milestone"

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["entry_preset"] == "one_line_inquiry"
    assert body["engagement_continuity_mode"] == "follow_up"
    assert body["writeback_depth"] == "milestone"
    assert body["case_world_draft"] is not None
    assert body["case_world_draft"]["canonical_intake_summary"]["problem_statement"]
    assert body["case_world_draft"]["task_interpretation"]["capability"]
    assert body["case_world_draft"]["facts"]
    assert body["case_world_draft"]["next_best_actions"]
    assert body["case_world_state"] is not None
    assert body["case_world_state"]["active_task_ids"] == [body["id"]]
    assert "work slice" in body["world_work_slice_summary"]
    assert body["matter_workspace"]["engagement_continuity_mode"] == "follow_up"
    assert body["matter_workspace"]["writeback_depth"] == "milestone"
    assert body["continuation_surface"]["workflow_layer"] == "checkpoint"


@pytest.mark.parametrize(
    ("initial_payload", "expected_mode", "expected_count"),
    [
        ({}, "one_line_inquiry", 0),
        (
            {
                "initial_source_urls": ["https://example.com/report"],
            },
            "single_document_intake",
            1,
        ),
        (
            {
                "initial_pasted_text": "One pasted intake note should count as a single formal material.",
                "initial_pasted_title": "Pasted kickoff note",
            },
            "single_document_intake",
            1,
        ),
        (
            {
                "initial_source_urls": ["https://example.com/report"],
                "initial_file_descriptors": [
                    {
                        "file_name": "notes.txt",
                        "content_type": "text/plain",
                        "file_size": 120,
                    }
                ],
            },
            "multi_material_case",
            2,
        ),
        (
            {
                "initial_source_urls": ["https://example.com/report"],
                "initial_pasted_text": "A second material can come from pasted text, not just a second file.",
                "initial_pasted_title": "Mixed note",
                "initial_file_descriptors": [
                    {
                        "file_name": "notes.txt",
                        "content_type": "text/plain",
                        "file_size": 120,
                    }
                ],
            },
            "multi_material_case",
            3,
        ),
    ],
)
def test_task_creation_compiles_world_first_from_initial_material_state(
    client: TestClient,
    initial_payload: dict,
    expected_mode: str,
    expected_count: int,
) -> None:
    payload = create_task_payload("World-first intake")
    payload.update(initial_payload)

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["case_world_state"] is not None
    assert body["case_world_state"]["canonical_intake_summary"]["resolved_input_state"] == expected_mode
    assert body["case_world_state"]["canonical_intake_summary"]["planned_material_count"] == expected_count
    assert body["case_world_state"]["latest_task_id"] == body["id"]
    assert body["case_world_state"]["latest_task_title"] == body["title"]


def test_task_creation_rejects_more_than_ten_initial_material_units(
    client: TestClient,
) -> None:
    payload = create_task_payload("Too many initial materials")
    payload.update(
        {
            "initial_source_urls": [f"https://example.com/{index}" for index in range(10)],
            "initial_pasted_text": "This pasted note would become the 11th material unit.",
            "initial_pasted_title": "Overflow note",
        }
    )

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 400
    assert "最多只能提交 10 份材料" in response.json()["detail"]


def test_task_creation_populates_explicit_ontology_context_spine(client: TestClient) -> None:
    payload = create_task_payload("Ontology spine")
    payload.update(
        {
            "client_name": "Acme Advisory",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Acme 內部診斷案",
            "workstream_name": "營運與銷售優化",
            "domain_lenses": ["營運", "銷售"],
            "decision_title": "Acme decision context",
            "decision_summary": "這次要先判斷是否該優先重整成交流程與交付節奏。",
            "judgment_to_make": "先判斷成交流程與交付節奏是否是目前最值得優先處理的決策點。",
        }
    )

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["client"]["name"] == "Acme Advisory"
    assert body["client"]["client_type"] == "中小企業"
    assert body["client"]["client_stage"] == "制度化階段"
    assert body["engagement"]["name"] == "Acme 內部診斷案"
    assert body["workstream"]["name"] == "營運與銷售優化"
    assert body["decision_context"]["title"] == "Acme decision context"
    assert body["decision_context"]["summary"].startswith("這次要先判斷")
    assert body["decision_context"]["judgment_to_make"].startswith("先判斷成交流程")
    assert body["decision_context"]["domain_lenses"] == ["營運", "銷售"]


def test_case_world_state_points_to_world_authority_spine(client: TestClient) -> None:
    payload = create_task_payload("World authority spine")
    payload.update(
        {
            "client_name": "Evergreen Consulting",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Evergreen 營運盤點",
            "workstream_name": "營運效率優化",
            "decision_title": "Evergreen decision context",
            "judgment_to_make": "先判斷目前的營運效率瓶頸是否已足以支持流程重整。",
            "domain_lenses": ["營運"],
        }
    )

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["client"]["identity_scope"] == "world_authority"
    assert body["engagement"]["identity_scope"] == "world_authority"
    assert body["workstream"]["identity_scope"] == "world_authority"
    assert body["slice_decision_context"] is None
    assert body["decision_context"]["identity_scope"] == "world_authority"
    assert body["client"]["task_reference_role"] == "compatibility_only"
    assert body["engagement"]["task_reference_role"] == "compatibility_only"
    assert body["workstream"]["task_reference_role"] == "compatibility_only"
    assert body["decision_context"]["task_reference_role"] == "compatibility_only"
    assert body["world_decision_context"]["identity_scope"] == "world_authority"
    assert body["world_decision_context"]["task_reference_role"] == "compatibility_only"
    assert body["case_world_state"]["client_id"]
    assert body["case_world_state"]["engagement_id"]
    assert body["case_world_state"]["workstream_id"]
    assert body["case_world_state"]["decision_context_id"]

    workspace_response = client.get(f"/api/v1/matters/{body['matter_workspace']['id']}")
    assert workspace_response.status_code == 200
    workspace = workspace_response.json()
    assert workspace["client"]["identity_scope"] == "world_authority"
    assert workspace["engagement"]["identity_scope"] == "world_authority"
    assert workspace["workstream"]["identity_scope"] == "world_authority"
    assert workspace["current_decision_context"]["identity_scope"] == "world_authority"
    assert workspace["client"]["task_reference_role"] == "compatibility_only"
    assert workspace["engagement"]["task_reference_role"] == "compatibility_only"
    assert workspace["workstream"]["task_reference_role"] == "compatibility_only"
    assert workspace["current_decision_context"]["task_reference_role"] == "compatibility_only"
    assert workspace["client"]["id"] == body["case_world_state"]["client_id"]
    assert workspace["engagement"]["id"] == body["case_world_state"]["engagement_id"]
    assert workspace["workstream"]["id"] == body["case_world_state"]["workstream_id"]
    assert workspace["current_decision_context"]["id"] == body["case_world_state"]["decision_context_id"]


def test_world_decision_context_prefers_canonical_world_payload_over_slice_fallback(
    client: TestClient,
) -> None:
    payload = create_task_payload("World payload decision context")
    payload["assumptions"] = "原始世界假設仍成立"

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    task_id = body["id"]
    matter_id = body["matter_workspace"]["id"]

    with SessionLocal() as db:
        task = db.get(models.Task, task_id)
        assert task is not None
        for goal in list(task.goals):
            db.delete(goal)
        for constraint in list(task.constraints):
            db.delete(constraint)
        if task.contexts:
            task.contexts[-1].assumptions = ""
            db.add(task.contexts[-1])
        db.commit()

    workspace = client.get(f"/api/v1/matters/{matter_id}").json()
    assert workspace["current_decision_context"]["identity_scope"] == "world_authority"
    assert workspace["current_decision_context"]["goals"] == [
        "Highlight the strongest findings and next actions."
    ]
    assert "Keep the output internal-only for now." in workspace["current_decision_context"]["constraints"]
    assert "原始世界假設仍成立" in "\n".join(workspace["current_decision_context"]["assumptions"])

    refreshed_task = client.get(f"/api/v1/tasks/{task_id}").json()
    assert refreshed_task["decision_context"]["identity_scope"] == "world_authority"
    assert refreshed_task["slice_decision_context"] is None
    assert refreshed_task["decision_context"]["goals"] == [
        "Highlight the strongest findings and next actions."
    ]


def test_slice_decision_context_only_surfaces_meaningful_overlay(client: TestClient) -> None:
    payload = create_task_payload("Meaningful overlay")
    response = client.post("/api/v1/tasks", json=payload)
    assert response.status_code == 201
    task_id = response.json()["id"]

    with SessionLocal() as db:
        task = db.get(models.Task, task_id)
        assert task is not None
        overlay = next(
            item for item in task.decision_contexts if item.identity_scope == "slice_overlay"
        )
        overlay.summary = "這是只屬於目前 work slice 的暫時判斷。"
        overlay.goal_summary = "先只在這個 slice 內檢查一輪。"
        db.add(overlay)
        db.commit()

    refreshed_task = client.get(f"/api/v1/tasks/{task_id}").json()
    assert refreshed_task["decision_context"]["identity_scope"] == "world_authority"
    assert refreshed_task["decision_context"]["summary"] != "這是只屬於目前 work slice 的暫時判斷。"
    assert refreshed_task["slice_decision_context"]["changed_fields"] == ["summary", "goals"]
    assert refreshed_task["slice_decision_context"]["summary"] == "這是只屬於目前 work slice 的暫時判斷。"
    assert refreshed_task["slice_decision_context"]["judgment_to_make"] is None
    assert refreshed_task["slice_decision_context"]["goals"] == ["先只在這個 slice 內檢查一輪。"]


def test_slice_decision_context_ignores_weak_whitespace_only_overlay(client: TestClient) -> None:
    payload = create_task_payload("Whitespace-only overlay")
    response = client.post("/api/v1/tasks", json=payload)
    assert response.status_code == 201
    created = response.json()
    task_id = created["id"]

    with SessionLocal() as db:
        task = db.get(models.Task, task_id)
        assert task is not None
        canonical = next(
            item for item in task.decision_contexts if item.identity_scope == "world_authority"
        )
        overlay = next(
            item for item in task.decision_contexts if item.identity_scope == "slice_overlay"
        )
        overlay.summary = f"  {canonical.summary}  "
        overlay.goal_summary = "\n".join(f"  {item}  " for item in canonical.goal_summary.splitlines() if item.strip())
        db.add(overlay)
        db.commit()

    refreshed_task = client.get(f"/api/v1/tasks/{task_id}").json()
    assert refreshed_task["decision_context"]["identity_scope"] == "world_authority"
    assert refreshed_task["slice_decision_context"] is None


def test_task_list_returns_object_aware_workspace_summary(client: TestClient) -> None:
    payload = create_task_payload("Object-aware list")
    payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "個人品牌與服務",
            "client_stage": "創業階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案重組與銷售收斂",
            "decision_title": "Northwind decision context",
            "judgment_to_make": "先判斷目前 SaaS 提案重組是否足以提升成交效率。",
            "domain_lenses": ["銷售", "行銷"],
        }
    )
    task = client.post("/api/v1/tasks", json=payload).json()

    response = client.get("/api/v1/tasks")

    assert response.status_code == 200
    item = next(row for row in response.json() if row["id"] == task["id"])
    assert item["client_name"] == "Northwind Studio"
    assert item["engagement_name"] == "Northwind Growth Sprint"
    assert item["workstream_name"] == "提案重組與銷售收斂"
    assert item["decision_context_title"] == "Northwind decision context"
    assert item["client_stage"] == "創業階段"
    assert item["client_type"] == "個人品牌與服務"
    assert item["domain_lenses"] == ["銷售", "行銷"]
    assert item["input_entry_mode"] == "one_line_inquiry"
    assert item["deliverable_class_hint"] == "exploratory_brief"
    assert item["external_research_heavy_candidate"] is False
    assert "marketing_sales_pack" in item["selected_pack_ids"]
    assert item["selected_pack_names"]
    assert item["pack_summary"]


def test_task_aggregate_includes_matter_workspace_summary(client: TestClient) -> None:
    payload = create_task_payload("Matter summary aggregate")
    payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "個人品牌與服務",
            "client_stage": "創業階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案重組與銷售收斂",
            "decision_title": "Northwind decision context",
            "judgment_to_make": "先判斷目前提案骨架是否足以支撐後續成交轉換。",
            "domain_lenses": ["銷售", "行銷"],
        }
    )

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["matter_workspace"] is not None
    assert body["matter_workspace"]["object_path"] == (
        "Northwind Studio / Northwind Growth Sprint / 提案重組與銷售收斂"
    )
    assert body["matter_workspace"]["total_task_count"] == 1
    assert body["matter_workspace"]["active_task_count"] == 1


def test_matter_workspace_routes_return_cross_task_continuity(client: TestClient) -> None:
    shared_payload = create_task_payload("Northwind growth sprint")
    shared_payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "個人品牌與服務",
            "client_stage": "創業階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案重組與銷售收斂",
            "decision_title": "Northwind primary decision",
            "judgment_to_make": "先判斷提案重組是否足以提升成交效率。",
            "domain_lenses": ["銷售", "行銷"],
        }
    )
    follow_up_payload = create_task_payload("Northwind follow-up")
    follow_up_payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "個人品牌與服務",
            "client_stage": "創業階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案重組與銷售收斂",
            "decision_title": "Northwind follow-up decision",
            "judgment_to_make": "先判斷新的提案摘要是否應該優先強化報價與成交主張。",
            "domain_lenses": ["銷售", "行銷"],
        }
    )

    first_task = client.post("/api/v1/tasks", json=shared_payload).json()
    second_task = client.post("/api/v1/tasks", json=follow_up_payload).json()
    run_response = client.post(f"/api/v1/tasks/{first_task['id']}/run")

    assert run_response.status_code == 200

    matters_response = client.get("/api/v1/matters")
    assert matters_response.status_code == 200
    matter = next(
        item
        for item in matters_response.json()
        if item["object_path"] == "Northwind Studio / Northwind Growth Sprint / 提案重組與銷售收斂"
    )
    assert matter["total_task_count"] == 2
    assert matter["deliverable_count"] >= 1

    workspace_response = client.get(f"/api/v1/matters/{matter['id']}")
    assert workspace_response.status_code == 200
    workspace = workspace_response.json()
    assert workspace["summary"]["total_task_count"] == 2
    assert len(workspace["related_tasks"]) == 2
    assert workspace["decision_trajectory"]
    assert workspace["related_deliverables"]
    assert workspace["readiness_hint"]
    assert workspace["continuity_notes"]
    assert {item["id"] for item in workspace["related_tasks"]} == {
        first_task["id"],
        second_task["id"],
    }


def test_shared_materials_and_evidence_follow_world_spine_across_task_slices(
    client: TestClient,
) -> None:
    shared_payload = create_task_payload("Northwind shared materials")
    shared_payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "個人品牌與服務",
            "client_stage": "創業階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案重組與銷售收斂",
            "decision_title": "Northwind primary decision",
            "judgment_to_make": "先判斷提案重組是否足以提升成交效率。",
            "domain_lenses": ["銷售", "行銷"],
        }
    )
    follow_up_payload = create_task_payload("Northwind shared materials follow-up")
    follow_up_payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "個人品牌與服務",
            "client_stage": "創業階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案重組與銷售收斂",
            "decision_title": "Northwind secondary decision",
            "judgment_to_make": "先判斷新的提案摘要是否應該優先強化報價與成交主張。",
            "domain_lenses": ["銷售", "行銷"],
        }
    )

    first_task = client.post("/api/v1/tasks", json=shared_payload).json()
    upload_response = client.post(
        f"/api/v1/tasks/{first_task['id']}/uploads",
        files=[("files", ("northwind-notes.txt", b"Northwind proposal notes with stronger commercial evidence.", "text/plain"))],
    )
    assert upload_response.status_code == 200

    refreshed_first = client.get(f"/api/v1/tasks/{first_task['id']}").json()
    shared_source_document = next(
        item for item in refreshed_first["uploads"] if item["continuity_scope"] == "world_shared"
    )
    shared_material = next(
        item for item in refreshed_first["source_materials"] if item["continuity_scope"] == "world_shared"
    )
    shared_evidence = next(
        item for item in refreshed_first["evidence"] if item["continuity_scope"] == "world_shared"
    )
    assert shared_material["continuity_scope"] == "world_shared"
    assert shared_evidence["continuity_scope"] == "world_shared"

    second_task = client.post("/api/v1/tasks", json=follow_up_payload).json()
    refreshed_second = client.get(f"/api/v1/tasks/{second_task['id']}").json()

    assert any(
        item["id"] == shared_source_document["id"]
        and item["matter_workspace_id"] == first_task["matter_workspace"]["id"]
        and item["continuity_scope"] == "world_shared"
        for item in refreshed_second["uploads"]
    )
    assert any(
        item["id"] == shared_material["id"]
        and item["matter_workspace_id"] == first_task["matter_workspace"]["id"]
        and item["continuity_scope"] == "world_shared"
        for item in refreshed_second["source_materials"]
    )
    assert any(
        item["id"] == shared_evidence["id"]
        and item["matter_workspace_id"] == first_task["matter_workspace"]["id"]
        and item["continuity_scope"] == "world_shared"
        for item in refreshed_second["evidence"]
    )

    second_upload_response = client.post(
        f"/api/v1/tasks/{second_task['id']}/uploads",
        files=[("files", ("northwind-notes.txt", b"Northwind proposal notes with stronger commercial evidence.", "text/plain"))],
    )
    assert second_upload_response.status_code == 200
    reused_item = second_upload_response.json()["uploaded"][0]
    assert reused_item["source_document"]["id"] == shared_source_document["id"]
    assert reused_item["source_document"]["participation"]["current_task_participation"] is True
    assert reused_item["source_document"]["participation"]["participation_task_count"] == 2
    assert reused_item["source_document"]["participation"]["participation_type"] == "shared_reuse"
    assert reused_item["source_document"]["participation"]["mapping_mode"] == "explicit_mapping"
    assert reused_item["source_document"]["participation"]["canonical_owner_scope"] == "world_canonical"
    assert reused_item["source_document"]["participation"]["compatibility_task_id"] == first_task["id"]
    assert reused_item["source_material"]["id"] == shared_material["id"]
    assert reused_item["evidence"]["id"] == shared_evidence["id"]
    assert reused_item["source_material"]["continuity_scope"] == "world_shared"
    assert reused_item["source_material"]["participation"]["canonical_owner_scope"] == "world_canonical"
    assert reused_item["source_material"]["participation"]["compatibility_task_id"] == first_task["id"]
    assert reused_item["evidence"]["participation"]["canonical_owner_scope"] == "world_canonical"
    assert reused_item["evidence"]["participation"]["compatibility_task_id"] == first_task["id"]

    refreshed_second_after_upload = client.get(f"/api/v1/tasks/{second_task['id']}").json()
    reused_source_document = next(
        item for item in refreshed_second_after_upload["uploads"] if item["id"] == shared_source_document["id"]
    )
    reused_material = next(
        item for item in refreshed_second_after_upload["source_materials"] if item["id"] == shared_material["id"]
    )
    reused_evidence = next(
        item for item in refreshed_second_after_upload["evidence"] if item["id"] == shared_evidence["id"]
    )
    assert reused_source_document["task_id"] == first_task["id"]
    assert reused_source_document["participation"]["current_task_participation"] is True
    assert reused_source_document["participation"]["participation_task_count"] == 2
    assert reused_source_document["participation"]["participation_type"] == "shared_reuse"
    assert reused_source_document["participation"]["canonical_owner_scope"] == "world_canonical"
    assert reused_source_document["participation"]["compatibility_task_id"] == first_task["id"]
    assert reused_material["participation"]["current_task_participation"] is True
    assert reused_material["participation"]["participation_task_count"] == 2
    assert reused_material["participation"]["participation_type"] == "shared_reuse"
    assert reused_material["participation"]["mapping_mode"] == "explicit_mapping"
    assert reused_material["participation"]["canonical_owner_scope"] == "world_canonical"
    assert reused_material["participation"]["compatibility_task_id"] == first_task["id"]
    assert reused_evidence["participation"]["current_task_participation"] is True
    assert reused_evidence["participation"]["participation_task_count"] == 2
    assert reused_evidence["participation"]["mapping_mode"] == "explicit_mapping"
    assert reused_evidence["participation"]["canonical_owner_scope"] == "world_canonical"
    assert reused_evidence["participation"]["compatibility_task_id"] == first_task["id"]

    workspace = client.get(f"/api/v1/matters/{first_task['matter_workspace']['id']}").json()
    assert workspace["summary"]["source_material_count"] == 1
    assert workspace["summary"]["artifact_count"] >= 1


def test_matter_scoped_canonicalization_review_lifecycle_updates_participation(
    client: TestClient,
) -> None:
    first_payload = create_task_payload("Northwind duplicate source 1")
    first_payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Duplicate Cleanup",
            "workstream_name": "資料整理與證據治理",
            "decision_title": "Northwind duplicate review 1",
            "judgment_to_make": "先判斷這批材料是否需要掛回同一條正式材料鏈。",
        }
    )
    second_payload = create_task_payload("Northwind duplicate source 2")
    second_payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Duplicate Cleanup",
            "workstream_name": "資料整理與證據治理",
            "decision_title": "Northwind duplicate review 2",
            "judgment_to_make": "先判斷同名材料是否其實是同一份正式來源。",
        }
    )

    first_task = client.post("/api/v1/tasks", json=first_payload).json()
    first_upload = client.post(
        f"/api/v1/tasks/{first_task['id']}/uploads",
        files=[("files", ("northwind-plan.txt", b"Northwind planning memo baseline evidence.", "text/plain"))],
    )
    assert first_upload.status_code == 200
    first_material_id = first_upload.json()["uploaded"][0]["source_material"]["id"]

    second_task = client.post("/api/v1/tasks", json=second_payload).json()
    second_upload = client.post(
        f"/api/v1/tasks/{second_task['id']}/uploads",
        files=[("files", ("northwind-plan (1).txt", b"Northwind planning memo updated but still near-duplicate.", "text/plain"))],
    )
    assert second_upload.status_code == 200
    second_material_id = second_upload.json()["uploaded"][0]["source_material"]["id"]

    workspace = client.get(f"/api/v1/matters/{first_task['matter_workspace']['id']}/artifact-evidence").json()
    assert workspace["canonicalization_summary"]["pending_review_count"] == 1
    candidate = workspace["canonicalization_candidates"][0]
    assert candidate["review_status"] == "pending_review"
    assert candidate["suggested_action"] == "merge_candidate"
    assert candidate["match_basis"] == "display_name_match"
    assert candidate["task_count"] == 2

    keep_separate = client.post(
        f"/api/v1/matters/{first_task['matter_workspace']['id']}/canonicalization-reviews",
        json={
            "review_key": candidate["review_key"],
            "resolution": "keep_separate",
        },
    )
    assert keep_separate.status_code == 200
    keep_body = keep_separate.json()
    assert keep_body["canonicalization_summary"]["pending_review_count"] == 0
    assert keep_body["canonicalization_summary"]["kept_separate_count"] == 1

    kept_task = client.get(f"/api/v1/tasks/{second_task['id']}").json()
    kept_material = next(item for item in kept_task["source_materials"] if item["id"] == second_material_id)
    assert kept_material["participation"]["canonical_object_id"] == second_material_id
    assert kept_material["participation"]["participation_task_count"] == 1

    confirm_merge = client.post(
        f"/api/v1/matters/{first_task['matter_workspace']['id']}/canonicalization-reviews",
        json={
            "review_key": candidate["review_key"],
            "resolution": "human_confirmed_canonical_row",
        },
    )
    assert confirm_merge.status_code == 200
    merged_body = confirm_merge.json()
    assert merged_body["canonicalization_summary"]["pending_review_count"] == 0
    assert merged_body["canonicalization_summary"]["human_confirmed_count"] == 1

    merged_task = client.get(f"/api/v1/tasks/{second_task['id']}").json()
    merged_material = next(item for item in merged_task["source_materials"] if item["id"] == second_material_id)
    assert merged_material["participation"]["canonical_object_id"] == first_material_id
    assert merged_material["participation"]["participation_task_count"] == 2
    assert merged_task["canonicalization_summary"]["current_task_pending_count"] == 0

    split_response = client.post(
        f"/api/v1/matters/{first_task['matter_workspace']['id']}/canonicalization-reviews",
        json={
            "review_key": candidate["review_key"],
            "resolution": "split",
        },
    )
    assert split_response.status_code == 200
    split_body = split_response.json()
    assert split_body["canonicalization_summary"]["split_count"] == 1

    split_task = client.get(f"/api/v1/tasks/{second_task['id']}").json()
    split_material = next(item for item in split_task["source_materials"] if item["id"] == second_material_id)
    assert split_material["participation"]["canonical_object_id"] == second_material_id
    assert split_material["participation"]["participation_task_count"] == 1


def test_canonicalization_candidates_do_not_cross_matter_boundaries(
    client: TestClient,
) -> None:
    alpha_payload = create_task_payload("Alpha duplicate boundary")
    alpha_payload.update(
        {
            "client_name": "Alpha Studio",
            "engagement_name": "Alpha Review",
            "workstream_name": "Alpha Ops",
        }
    )
    beta_payload = create_task_payload("Beta duplicate boundary")
    beta_payload.update(
        {
            "client_name": "Beta Studio",
            "engagement_name": "Beta Review",
            "workstream_name": "Beta Ops",
        }
    )

    alpha_task = client.post("/api/v1/tasks", json=alpha_payload).json()
    beta_task = client.post("/api/v1/tasks", json=beta_payload).json()

    alpha_upload = client.post(
        f"/api/v1/tasks/{alpha_task['id']}/uploads",
        files=[("files", ("same-name.txt", b"Alpha matter source content.", "text/plain"))],
    )
    beta_upload = client.post(
        f"/api/v1/tasks/{beta_task['id']}/uploads",
        files=[("files", ("same-name.txt", b"Beta matter source content.", "text/plain"))],
    )
    assert alpha_upload.status_code == 200
    assert beta_upload.status_code == 200

    alpha_workspace = client.get(
        f"/api/v1/matters/{alpha_task['matter_workspace']['id']}/artifact-evidence"
    ).json()
    beta_workspace = client.get(
        f"/api/v1/matters/{beta_task['matter_workspace']['id']}/artifact-evidence"
    ).json()
    assert alpha_workspace["canonicalization_summary"]["pending_review_count"] == 0
    assert beta_workspace["canonicalization_summary"]["pending_review_count"] == 0


def test_core_context_keeps_world_authority_and_slice_overlay_rows(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Overlay scope rows")).json()

    with SessionLocal() as db:
        task_row = db.get(models.Task, task["id"])
        assert task_row is not None
        assert {item.identity_scope for item in task_row.clients} == {
            "slice_overlay",
            "world_authority",
        }
        assert {item.identity_scope for item in task_row.engagements} == {
            "slice_overlay",
            "world_authority",
        }
        assert {item.identity_scope for item in task_row.workstreams} == {
            "slice_overlay",
            "world_authority",
        }
        assert {item.identity_scope for item in task_row.decision_contexts} == {
            "slice_overlay",
            "world_authority",
        }


def test_follow_up_promotes_canonical_core_context_links_to_latest_slice(client: TestClient) -> None:
    primary_payload = create_task_payload("Core context primary")
    primary_payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案與成交主張",
            "decision_title": "Northwind primary decision",
            "judgment_to_make": "先判斷現有成交主張是否需要重寫。",
            "domain_lenses": ["營運", "銷售"],
        }
    )
    follow_up_payload = create_task_payload("Core context follow-up")
    follow_up_payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案與成交主張",
            "decision_title": "Northwind follow-up decision",
            "judgment_to_make": "再判斷 follow-up 補件後是否要同步改寫價格敘事。",
            "domain_lenses": ["營運", "銷售"],
        }
    )

    first_task = client.post("/api/v1/tasks", json=primary_payload).json()
    second_task = client.post("/api/v1/tasks", json=follow_up_payload).json()

    with SessionLocal() as db:
        second_task_row = get_loaded_task(db, second_task["id"])
        matter_workspace_id = second_task_row.matter_workspace_links[0].matter_workspace_id
        canonical_client = db.scalars(
            select(models.Client).where(
                models.Client.matter_workspace_id == matter_workspace_id,
                models.Client.identity_scope == "world_authority",
            )
        ).one()
        canonical_engagement = db.scalars(
            select(models.Engagement).where(
                models.Engagement.matter_workspace_id == matter_workspace_id,
                models.Engagement.identity_scope == "world_authority",
            )
        ).one()
        canonical_workstream = db.scalars(
            select(models.Workstream).where(
                models.Workstream.matter_workspace_id == matter_workspace_id,
                models.Workstream.identity_scope == "world_authority",
            )
        ).one()
        canonical_decision_context = db.scalars(
            select(models.DecisionContext).where(
                models.DecisionContext.matter_workspace_id == matter_workspace_id,
                models.DecisionContext.identity_scope == "world_authority",
            )
        ).one()
        overlay_engagement = next(
            item for item in second_task_row.engagements if item.identity_scope == "slice_overlay"
        )
        overlay_workstream = next(
            item for item in second_task_row.workstreams if item.identity_scope == "slice_overlay"
        )
        overlay_decision_context = next(
            item
            for item in second_task_row.decision_contexts
            if item.identity_scope == "slice_overlay"
        )

        assert canonical_client.task_id == first_task["id"]
        assert canonical_engagement.task_id == first_task["id"]
        assert canonical_workstream.task_id == second_task["id"]
        assert canonical_decision_context.task_id == second_task["id"]
        assert overlay_engagement.client_id == canonical_client.id
        assert overlay_workstream.engagement_id == canonical_engagement.id
        assert overlay_decision_context.client_id == canonical_client.id
        assert overlay_decision_context.engagement_id == canonical_engagement.id
        assert overlay_decision_context.workstream_id == canonical_workstream.id

    first_aggregate = client.get(f"/api/v1/tasks/{first_task['id']}").json()
    second_aggregate = client.get(f"/api/v1/tasks/{second_task['id']}").json()
    assert first_aggregate["client"]["identity_scope"] == "world_authority"
    assert second_aggregate["client"]["identity_scope"] == "world_authority"
    assert second_aggregate["decision_context"]["identity_scope"] == "world_authority"
    assert first_aggregate["client"]["task_reference_role"] == "compatibility_only"
    assert second_aggregate["client"]["task_reference_role"] == "compatibility_only"
    assert first_aggregate["client"]["task_id"] == first_task["id"]
    assert second_aggregate["client"]["task_id"] == second_task["id"]
    assert second_aggregate["decision_context"]["task_reference_role"] == "compatibility_only"
    assert second_aggregate["decision_context"]["task_id"] == second_task["id"]


def test_task_list_and_host_payload_prefer_world_authority_core_context(client: TestClient) -> None:
    payload = create_task_payload("World authority list and host payload")
    payload.update(
        {
            "client_name": "Evergreen Consulting",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Evergreen 營運盤點",
            "workstream_name": "營運效率優化",
            "decision_title": "Evergreen decision context",
            "judgment_to_make": "先判斷目前的營運效率瓶頸是否已足以支持流程重整。",
            "domain_lenses": ["營運"],
        }
    )

    task = client.post("/api/v1/tasks", json=payload).json()

    with SessionLocal() as db:
        task_row = get_loaded_task(db, task["id"])
        overlay_client = next(
            item for item in task_row.clients if item.identity_scope == "slice_overlay"
        )
        overlay_engagement = next(
            item for item in task_row.engagements if item.identity_scope == "slice_overlay"
        )
        overlay_workstream = next(
            item for item in task_row.workstreams if item.identity_scope == "slice_overlay"
        )
        overlay_decision_context = next(
            item
            for item in task_row.decision_contexts
            if item.identity_scope == "slice_overlay"
        )
        overlay_client.name = "Temporary overlay client"
        overlay_engagement.name = "Temporary overlay engagement"
        overlay_workstream.name = "Temporary overlay workstream"
        overlay_decision_context.summary = "只屬於 overlay 的暫時摘要。"
        db.add(overlay_client)
        db.add(overlay_engagement)
        db.add(overlay_workstream)
        db.add(overlay_decision_context)
        db.commit()

    task_list = client.get("/api/v1/tasks").json()
    listed_task = next(item for item in task_list if item["id"] == task["id"])
    assert listed_task["client_name"] == "Evergreen Consulting"
    assert listed_task["engagement_name"] == "Evergreen 營運盤點"
    assert listed_task["workstream_name"] == "營運效率優化"
    assert listed_task["decision_context_title"] == "Evergreen decision context"

    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert aggregate["client"]["name"] == "Evergreen Consulting"
    assert aggregate["engagement"]["name"] == "Evergreen 營運盤點"
    assert aggregate["workstream"]["name"] == "營運效率優化"
    assert aggregate["decision_context"]["summary"] != "只屬於 overlay 的暫時摘要。"

    matter_workspace = client.get(f"/api/v1/matters/{task['matter_workspace']['id']}").json()
    assert matter_workspace["client"]["name"] == "Evergreen Consulting"
    assert matter_workspace["engagement"]["name"] == "Evergreen 營運盤點"
    assert matter_workspace["workstream"]["name"] == "營運效率優化"
    assert matter_workspace["current_decision_context"]["summary"] != "只屬於 overlay 的暫時摘要。"

    evidence_workspace = client.get(
        f"/api/v1/matters/{task['matter_workspace']['id']}/artifact-evidence"
    ).json()
    assert evidence_workspace["client"]["name"] == "Evergreen Consulting"
    assert evidence_workspace["engagement"]["name"] == "Evergreen 營運盤點"
    assert evidence_workspace["workstream"]["name"] == "營運效率優化"
    assert evidence_workspace["current_decision_context"]["summary"] != "只屬於 overlay 的暫時摘要。"

    with SessionLocal() as db:
        task_row = get_loaded_task(db, task["id"])
        payload = HostOrchestrator(db).build_payload(task_row)
        assert payload.client is not None
        assert payload.engagement is not None
        assert payload.workstream is not None
        assert payload.decision_context is not None
        assert payload.client.identity_scope == "world_authority"
        assert payload.engagement.identity_scope == "world_authority"
        assert payload.workstream.identity_scope == "world_authority"
        assert payload.decision_context.identity_scope == "world_authority"
        assert payload.client.task_reference_role == "compatibility_only"
        assert payload.engagement.task_reference_role == "compatibility_only"
        assert payload.workstream.task_reference_role == "compatibility_only"
        assert payload.decision_context.task_reference_role == "compatibility_only"
        assert payload.client.name == "Evergreen Consulting"
        assert payload.decision_context.summary != "只屬於 overlay 的暫時摘要。"


def test_world_shared_materials_create_participation_links(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Participation link rows")).json()
    upload_response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("participation.txt", b"Evidence that should become world-shared.", "text/plain"))],
    )
    assert upload_response.status_code == 200

    with SessionLocal() as db:
        task_row = db.get(models.Task, task["id"])
        assert task_row is not None
        link_types = {item.object_type for item in task_row.object_participation_links}
        assert {
            "source_document",
            "source_material",
            "artifact",
            "evidence",
        }.issubset(link_types)
        document_link = next(
            item for item in task_row.object_participation_links if item.object_type == "source_document"
        )
        evidence_link = next(
            item for item in task_row.object_participation_links if item.object_type == "evidence"
        )
        assert document_link.source_document_id is not None
        assert evidence_link.source_document_id is not None
        assert evidence_link.evidence_id is not None


def test_artifact_evidence_workspace_route_returns_formal_source_and_support_chains(
    client: TestClient,
) -> None:
    payload = create_contract_review_payload("Artifact evidence workspace")
    payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Risk Review",
            "workstream_name": "合約與風險審閱",
            "decision_title": "Northwind legal review decision",
            "judgment_to_make": "先判斷這份合作文件是否已具備可接受的責任與終止條款邊界。",
            "domain_lenses": ["法務", "營運"],
        }
    )

    task = client.post("/api/v1/tasks", json=payload).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "agreement.txt",
                    b"Supplier may terminate for convenience on 10 days notice. Liability cap excludes confidentiality breaches. Acceptance criteria are not clearly defined.",
                    "text/plain",
                ),
            )
        ],
    )
    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run_response.status_code == 200

    matter = client.get("/api/v1/matters").json()[0]
    workspace_response = client.get(
        f"/api/v1/matters/{matter['id']}/artifact-evidence"
    )

    assert workspace_response.status_code == 200
    workspace = workspace_response.json()
    assert workspace["matter_summary"]["id"] == matter["id"]
    assert workspace["current_decision_context"]["identity_scope"] == "world_authority"
    assert workspace["source_material_cards"]
    assert workspace["artifact_cards"]
    assert workspace["evidence_chains"]
    assert workspace["sufficiency_summary"]
    assert workspace["high_impact_gaps"] is not None
    assert workspace["continuity_notes"] is not None
    assert any(
        item["linked_recommendations"] or item["linked_risks"] or item["linked_action_items"]
        for item in workspace["evidence_chains"]
    )
    assert any(
        item["canonical_owner_scope"] == "world_canonical" and item["mapping_mode"] == "explicit_mapping"
        for item in workspace["source_material_cards"]
    )
    assert any(
        item["canonical_owner_scope"] == "world_canonical" and item["mapping_mode"] == "explicit_mapping"
        for item in workspace["artifact_cards"]
    )


def test_deliverable_workspace_route_returns_formal_deliverable_context(
    client: TestClient,
) -> None:
    payload = create_task_payload("Deliverable workspace")
    payload.update(
        {
            "description": "請先判斷電商品牌的通路、回購與毛利結構是否需要調整，並形成正式交付物。",
            "client_name": "Northwind Commerce",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Commerce Sprint",
            "workstream_name": "通路與毛利決策",
            "decision_title": "Northwind commerce decision",
            "judgment_to_make": "先判斷目前電商品牌是否應優先調整通路組合與 SKU 結構。",
            "domain_lenses": ["營運", "財務", "行銷"],
        }
    )

    task = client.post("/api/v1/tasks", json=payload).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "commerce-notes.txt",
                    b"Repeat purchase is falling while marketplace commissions are rising. Best-selling SKUs have lower contribution margin than expected.",
                    "text/plain",
                ),
            )
        ],
    )

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run_response.status_code == 200
    deliverable_id = run_response.json()["deliverable"]["id"]
    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()

    workspace_response = client.get(f"/api/v1/deliverables/{deliverable_id}")

    assert workspace_response.status_code == 200
    workspace = workspace_response.json()
    assert workspace["deliverable"]["id"] == deliverable_id
    assert workspace["task"]["id"] == task["id"]
    assert workspace["task"]["client"]["identity_scope"] == "world_authority"
    assert workspace["task"]["world_decision_context"]["identity_scope"] == "world_authority"
    assert workspace["deliverable_class"] in {
        "assessment_review_memo",
        "decision_action_deliverable",
    }
    assert workspace["workspace_status"] == "current"
    assert workspace["linked_evidence"]
    assert any(
        item["retrieval_provenance"] and item["retrieval_provenance"]["support_kind"] == "chunk_object"
        for item in workspace["linked_evidence"]
    )
    assert workspace["linked_recommendations"]
    assert workspace["linked_risks"] is not None
    assert workspace["linked_action_items"] is not None
    assert workspace["confidence_summary"]
    assert workspace["limitation_notes"] is not None
    assert workspace["continuity_notes"] is not None
    assert aggregate["object_sets"]
    assert {item["set_type"] for item in aggregate["object_sets"]} >= {
        "risk_set_v1",
        "evidence_set_v1",
    }
    assert any(item["scope_type"] == "task" for item in aggregate["object_sets"])
    assert any(item["scope_type"] == "deliverable" for item in aggregate["object_sets"])
    assert workspace["object_sets"]
    evidence_set = next(
        item for item in workspace["object_sets"] if item["set_type"] == "evidence_set_v1"
    )
    risk_set = next(item for item in workspace["object_sets"] if item["set_type"] == "risk_set_v1")
    assert evidence_set["scope_type"] == "deliverable"
    assert evidence_set["creation_mode"] == "deliverable_support_bundle"
    assert evidence_set["membership_source_summary"]["primary_source"] == "deliverable_support_bundle"
    assert evidence_set["member_count"] >= 1
    assert any(member["member_object_type"] == "evidence" for member in evidence_set["members"])
    assert risk_set["scope_type"] == "task"
    assert risk_set["creation_mode"] == "host_curated"
    assert risk_set["membership_source_summary"]["primary_source"] == "host_curated"
    assert risk_set["member_count"] >= 1
    assert any(member["member_object_type"] == "risk" for member in risk_set["members"])


def test_matter_workspace_metadata_update_persists_and_survives_workspace_sync(
    client: TestClient,
) -> None:
    shared_payload = create_task_payload("Matter metadata sync")
    shared_payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案重組與銷售收斂",
            "decision_title": "Northwind matter metadata",
            "judgment_to_make": "先判斷提案重組是否要先收斂核心成交主張。",
            "domain_lenses": ["銷售", "行銷"],
        }
    )

    first_task = client.post("/api/v1/tasks", json=shared_payload).json()
    matter = client.get("/api/v1/matters").json()[0]

    update_response = client.put(
        f"/api/v1/matters/{matter['id']}/metadata",
        json={
            "title": "北風提案收斂案",
            "summary": "先聚焦提案主張、來源厚度與下一份交付物改版。",
            "status": "paused",
        },
    )

    assert update_response.status_code == 200
    updated_workspace = update_response.json()
    assert updated_workspace["summary"]["title"] == "北風提案收斂案"
    assert updated_workspace["summary"]["workspace_summary"] == "先聚焦提案主張、來源厚度與下一份交付物改版。"
    assert updated_workspace["summary"]["status"] == "paused"

    follow_up_payload = create_task_payload("Matter metadata follow-up")
    follow_up_payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Growth Sprint",
            "workstream_name": "提案重組與銷售收斂",
            "decision_title": "Northwind matter metadata follow-up",
            "judgment_to_make": "再確認提案摘要是否要補強價格與成交風險。",
            "domain_lenses": ["銷售", "行銷"],
        }
    )
    client.post("/api/v1/tasks", json=follow_up_payload).json()

    matter_after = next(
        item for item in client.get("/api/v1/matters").json() if item["id"] == matter["id"]
    )
    assert matter_after["title"] == "北風提案收斂案"
    assert matter_after["workspace_summary"] == "先聚焦提案主張、來源厚度與下一份交付物改版。"
    assert matter_after["status"] == "paused"
    assert first_task["matter_workspace"]["id"] == matter["id"]


def test_deliverable_metadata_update_persists_to_workspace_and_task_list(
    client: TestClient,
) -> None:
    payload = create_task_payload("Deliverable metadata update")
    payload.update(
        {
            "description": "請先判斷是否該優先調整通路組合與 SKU 結構，並形成正式交付物。",
            "client_name": "Northwind Commerce",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Commerce Sprint",
            "workstream_name": "通路與毛利決策",
            "decision_title": "Northwind deliverable metadata",
            "judgment_to_make": "先判斷目前是否該優先調整通路組合與 SKU 結構。",
            "domain_lenses": ["營運", "財務", "行銷"],
        }
    )

    task = client.post("/api/v1/tasks", json=payload).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "commerce-notes.txt",
                    b"Repeat purchase is falling while marketplace commissions are rising.",
                    "text/plain",
                ),
            )
        ],
    )
    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")
    deliverable_id = run_response.json()["deliverable"]["id"]

    update_response = client.put(
        f"/api/v1/deliverables/{deliverable_id}/metadata",
        json={
            "title": "正式通路調整備忘錄",
            "summary": "先收斂通路結構，再處理 SKU 與回購節奏。",
            "status": "pending_confirmation",
            "version_tag": "v1.1",
        },
    )

    assert update_response.status_code == 200
    updated_workspace = update_response.json()
    assert updated_workspace["deliverable"]["title"] == "正式通路調整備忘錄"
    assert updated_workspace["deliverable"]["summary"] == "先收斂通路結構，再處理 SKU 與回購節奏。"
    assert updated_workspace["deliverable"]["status"] == "pending_confirmation"
    assert updated_workspace["deliverable"]["version_tag"] == "v1.1"

    reloaded_workspace = client.get(f"/api/v1/deliverables/{deliverable_id}").json()
    assert reloaded_workspace["deliverable"]["title"] == "正式通路調整備忘錄"
    assert reloaded_workspace["deliverable"]["summary"] == "先收斂通路結構，再處理 SKU 與回購節奏。"
    assert reloaded_workspace["deliverable"]["status"] == "pending_confirmation"
    assert reloaded_workspace["deliverable"]["version_tag"] == "v1.1"

    task_list_item = next(
        item for item in client.get("/api/v1/tasks").json() if item["id"] == task["id"]
    )
    assert task_list_item["latest_deliverable_title"] == "正式通路調整備忘錄"
    assert task_list_item["latest_deliverable_summary"] == "先收斂通路結構，再處理 SKU 與回購節奏。"
    assert task_list_item["latest_deliverable_status"] == "pending_confirmation"
    assert task_list_item["latest_deliverable_version_tag"] == "v1.1"


def test_task_aggregate_includes_pack_resolution_from_context_spine(client: TestClient) -> None:
    payload = create_task_payload("Pack-aware aggregate")
    payload.update(
        {
            "description": "請判斷這個電商品牌是否該優先調整通路配置、SKU 組合與回購策略。",
            "client_name": "Orbit Labs",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Orbit Growth Review",
            "workstream_name": "營運與財務收斂",
            "domain_lenses": ["營運", "財務"],
            "judgment_to_make": "先判斷電商品牌的通路配置、SKU 組合與回購策略是否需要優先調整。",
        }
    )

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["pack_resolution"]["selected_domain_packs"]
    assert any(
        item["pack_id"] == "operations_pack"
        for item in body["pack_resolution"]["selected_domain_packs"]
    )
    assert any(
        item["pack_id"] == "finance_fundraising_pack"
        for item in body["pack_resolution"]["selected_domain_packs"]
    )
    operations_pack = next(
        item
        for item in body["pack_resolution"]["selected_domain_packs"]
        if item["pack_id"] == "operations_pack"
    )
    assert operations_pack["selection_score"] > 0
    assert operations_pack["selection_signals"]
    assert operations_pack["domain_definition"]
    assert operations_pack["common_problem_patterns"]
    assert operations_pack["key_kpis_or_operating_signals"]
    assert operations_pack["scope_boundaries"]
    assert operations_pack["pack_rationale"]
    assert any(
        item["pack_id"] == "ecommerce_pack"
        for item in body["pack_resolution"]["selected_industry_packs"]
    )
    ecommerce_pack = next(
        item
        for item in body["pack_resolution"]["selected_industry_packs"]
        if item["pack_id"] == "ecommerce_pack"
    )
    assert ecommerce_pack["selection_score"] > 0
    assert ecommerce_pack["selection_signals"]
    assert ecommerce_pack["industry_definition"]
    assert ecommerce_pack["key_kpis"]
    assert ecommerce_pack["decision_patterns"]
    assert body["pack_resolution"]["resolver_notes"]
    assert body["pack_resolution"]["evidence_expectations"]
    assert body["pack_resolution"]["decision_context_patterns"]
    assert body["pack_resolution"]["ready_interface_ids"] == [
        "evidence_readiness_v1",
        "decision_framing_v1",
        "deliverable_shaping_v1",
    ]
    assert body["pack_resolution"]["ready_rule_binding_ids"] == [
        "readiness_gate_v1",
        "decision_context_hint_v1",
        "deliverable_hint_v1",
    ]
    assert body["pack_resolution"]["contract_status"] == "ready"
    assert operations_pack["contract_baseline"]["status"] == "ready"
    assert "operations_pack" in body["case_world_state"]["selected_domain_packs"]
    assert "ecommerce_pack" in body["case_world_state"]["selected_industry_packs"]
    assert body["agent_selection"]["host_agent"]["agent_id"] == "host_agent"
    assert body["agent_selection"]["host_agent"]["selection_score"] >= 100
    assert body["agent_selection"]["host_agent"]["selection_signals"]
    assert body["agent_selection"]["selected_agent_ids"]
    assert body["agent_selection"]["selected_agent_names"]
    assert all(
        item["selection_score"] > 0 and item["selection_signals"]
        for item in body["agent_selection"]["selected_reasoning_agents"]
    )
    assert "deferred_agent_notes" in body["agent_selection"]
    assert "escalation_notes" in body["agent_selection"]


def test_task_aggregate_supports_second_wave_industry_and_new_domain_packs(client: TestClient) -> None:
    payload = create_multi_agent_payload("Second-wave pack aggregate")
    payload.update(
        {
            "description": "請判斷這家 SaaS 公司是否該先重整產品方案、定價與組織人力配置，再擴大 enterprise pipeline。",
            "client_name": "Northstar Cloud",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northstar Growth and Org Review",
            "workstream_name": "產品 / 組織收斂",
            "domain_lenses": ["產品服務", "組織人力", "銷售"],
            "judgment_to_make": "先判斷這家 SaaS 公司是否應優先重整 offer architecture、pricing 與團隊設計，再擴大 enterprise pipeline。",
        }
    )

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert any(
        item["pack_id"] == "organization_people_pack"
        for item in body["pack_resolution"]["selected_domain_packs"]
    )
    assert any(
        item["pack_id"] == "product_service_pack"
        for item in body["pack_resolution"]["selected_domain_packs"]
    )
    assert any(
        item["pack_id"] == "saas_pack"
        for item in body["pack_resolution"]["selected_industry_packs"]
    )
    assert {
        item["pack_id"] for item in body["pack_resolution"]["selected_industry_packs"]
    } == {"saas_pack"}
    assert all(
        item["selection_score"] > 0 and item["selection_signals"]
        for item in body["pack_resolution"]["selected_domain_packs"]
    )
    assert all(
        item["selection_score"] > 0 and item["selection_signals"]
        for item in body["pack_resolution"]["selected_industry_packs"]
    )
    assert body["pack_resolution"]["deliverable_presets"]
    assert body["pack_resolution"]["evidence_expectations"]
    assert body["pack_resolution"]["decision_context_patterns"]
    assert "decision_context_hint_v1" in body["pack_resolution"]["ready_rule_binding_ids"]
    assert "strategy_decision_agent" in body["agent_selection"]["selected_agent_ids"]
    assert all(
        item["selection_score"] > 0 and item["selection_signals"]
        for item in body["agent_selection"]["selected_reasoning_agents"]
    )


def test_task_aggregate_supports_batch2_industry_pack_contracts(client: TestClient) -> None:
    payload = create_multi_agent_payload("Batch2 pack aggregate")
    payload.update(
        {
            "description": "請判斷這家製造公司是否該先修正良率、排程與瓶頸站位，再決定是否擴產與接更多急單。",
            "client_name": "Atlas Manufacturing",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Atlas Capacity and Quality Review",
            "workstream_name": "製造營運與供應鏈收斂",
            "domain_lenses": ["營運", "財務"],
            "judgment_to_make": "先判斷這家製造公司是否應優先修正良率、排程與 throughput bottleneck，再決定是否擴產。",
        }
    )

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert {
        item["pack_id"] for item in body["pack_resolution"]["selected_industry_packs"]
    } == {"manufacturing_pack"}
    manufacturing_pack = next(
        item
        for item in body["pack_resolution"]["selected_industry_packs"]
        if item["pack_id"] == "manufacturing_pack"
    )
    assert manufacturing_pack["selection_score"] > 0
    assert manufacturing_pack["selection_signals"]
    assert manufacturing_pack["industry_definition"]
    assert manufacturing_pack["common_business_models"]
    assert manufacturing_pack["decision_patterns"]
    assert manufacturing_pack["deliverable_presets"]
    assert manufacturing_pack["contract_baseline"]["status"] == "ready"
    assert body["pack_resolution"]["resolver_notes"]
    assert body["pack_resolution"]["evidence_expectations"]
    assert body["pack_resolution"]["decision_context_patterns"]
    assert body["pack_resolution"]["contract_status"] == "ready"
    assert "manufacturing_pack" in body["case_world_state"]["selected_industry_packs"]
    assert body["agent_selection"]["rationale"]


def test_domain_pack_resolution_can_infer_business_development_from_decision_context(
    client: TestClient,
) -> None:
    payload = create_task_payload("Domain pack inferred from decision context")
    payload.update(
        {
            "description": "請判斷這家公司是否該先重整 partnership 結構、channel governance 與 reseller enablement，再擴大 partner-sourced pipeline。",
            "client_name": "Northwind Partners",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Channel Review",
            "workstream_name": "Partnership and channel expansion",
            "domain_lenses": [],
            "judgment_to_make": "先判斷 partnership、channel expansion 與 partner governance 應該怎麼排序。",
        }
    )

    response = client.post("/api/v1/tasks", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert any(
        item["pack_id"] == "business_development_pack"
        for item in body["pack_resolution"]["selected_domain_packs"]
    )
    business_development_pack = next(
        item
        for item in body["pack_resolution"]["selected_domain_packs"]
        if item["pack_id"] == "business_development_pack"
    )
    assert business_development_pack["selection_score"] >= 24
    assert any(
        "routing hints" in signal
        or "問題型態" in signal
        or "客戶階段" in signal
        for signal in business_development_pack["selection_signals"]
    )
    assert body["pack_resolution"]["decision_context_patterns"]
    assert any("Domain / Functional Packs" in item for item in body["agent_selection"]["rationale"])
    assert body["agent_selection"]["deferred_agent_notes"]


def test_extension_manager_endpoint_returns_catalogs(client: TestClient) -> None:
    response = client.get("/api/v1/extensions/manager")

    assert response.status_code == 200
    body = response.json()
    assert body["pack_registry"]["packs"]
    assert body["agent_registry"]["agents"]
    assert body["agent_registry"]["host_agent_id"] == "host_agent"
    operations_pack = next(
        item for item in body["pack_registry"]["packs"] if item["pack_id"] == "operations_pack"
    )
    assert operations_pack["contract_baseline"]["status"] == "ready"


def test_task_extension_overrides_write_back_to_aggregate(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Override task")).json()

    response = client.put(
        f"/api/v1/tasks/{task['id']}/extensions",
        json={
            "pack_override_ids": ["legal_risk_pack", "online_education_pack"],
            "agent_override_ids": ["legal_risk_agent", "research_intelligence_agent"],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["pack_resolution"]["override_pack_ids"] == [
        "legal_risk_pack",
        "online_education_pack",
    ]
    assert any(
        item["pack_id"] == "legal_risk_pack"
        for item in body["pack_resolution"]["selected_domain_packs"]
    )
    assert any(
        item["pack_id"] == "online_education_pack"
        for item in body["pack_resolution"]["selected_industry_packs"]
    )
    assert body["agent_selection"]["override_agent_ids"] == [
        "legal_risk_agent",
        "research_intelligence_agent",
    ]
    assert "legal_risk_agent" in body["agent_selection"]["selected_agent_ids"]
    assert "research_intelligence_agent" in body["agent_selection"]["selected_agent_ids"]
    assert "deferred_agent_notes" in body["agent_selection"]
    assert "escalation_notes" in body["agent_selection"]


def test_file_upload_creates_usable_txt_evidence(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("TXT upload")).json()

    response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("notes.txt", b"Alpha insight.\nBeta insight.\nGamma insight.", "text/plain"))],
    )

    assert response.status_code == 200
    uploaded = response.json()["uploaded"][0]
    assert uploaded["source_document"]["ingest_status"] == "processed"
    assert uploaded["evidence"]["evidence_type"] == "uploaded_file_excerpt"
    assert "Alpha insight" in uploaded["evidence"]["excerpt_or_summary"]
    assert uploaded["source_material"]["source_document_id"] == uploaded["source_document"]["id"]
    assert uploaded["artifact"]["source_document_id"] == uploaded["source_document"]["id"]
    assert uploaded["artifact"]["source_material_id"] == uploaded["source_material"]["id"]
    assert uploaded["source_document"]["participation"]["current_task_participation"] is True
    assert uploaded["source_document"]["participation"]["participation_type"] == "direct_ingest"
    assert uploaded["source_document"]["participation"]["mapping_mode"] == "explicit_mapping"
    assert uploaded["source_document"]["participation"]["canonical_owner_scope"] == "world_canonical"
    assert uploaded["source_document"]["participation"]["compatibility_task_id"] == task["id"]
    assert uploaded["source_material"]["participation"]["current_task_participation"] is True
    assert uploaded["source_material"]["participation"]["canonical_owner_scope"] == "world_canonical"
    assert uploaded["source_material"]["participation"]["compatibility_task_id"] == task["id"]
    assert uploaded["evidence"]["participation"]["current_task_participation"] is True
    assert uploaded["evidence"]["participation"]["canonical_owner_scope"] == "world_canonical"
    assert uploaded["evidence"]["participation"]["compatibility_task_id"] == task["id"]
    assert uploaded["evidence"]["retrieval_provenance"]["support_kind"] == "source_reference"

    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert aggregate["source_materials"]
    assert aggregate["artifacts"]
    assert aggregate["input_entry_mode"] == "single_document_intake"
    assert aggregate["presence_state_summary"]["artifact"]["state"] == "explicit"
    assert aggregate["source_materials"][0]["source_document_id"] == uploaded["source_document"]["id"]
    assert aggregate["artifacts"][0]["source_document_id"] == uploaded["source_document"]["id"]
    chunk_evidence = next(item for item in aggregate["evidence"] if item["evidence_type"] == "source_chunk")
    assert chunk_evidence["chunk_object_id"] is not None
    assert chunk_evidence["retrieval_provenance"]["support_kind"] == "chunk_object"
    assert "片段" in chunk_evidence["retrieval_provenance"]["locator_label"]
    assert "Alpha insight" in chunk_evidence["retrieval_provenance"]["chunk_object"]["excerpt_text"]


def test_single_document_intake_updates_entry_mode_and_deliverable_hint(
    client: TestClient,
) -> None:
    task = client.post("/api/v1/tasks", json=create_contract_review_payload("Single document intake")).json()

    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("agreement.txt", b"Termination and liability clauses need review.", "text/plain"))],
    )

    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()

    assert aggregate["input_entry_mode"] == "single_document_intake"
    assert aggregate["deliverable_class_hint"] == "assessment_review_memo"
    assert aggregate["flagship_lane"]["lane_id"] == "material_review_start"
    assert aggregate["flagship_lane"]["label"] == "先審閱手上已有材料"
    assert "核心材料" in aggregate["flagship_lane"]["summary"]
    assert "高風險點" in aggregate["flagship_lane"]["next_step_summary"]
    assert aggregate["flagship_lane"]["upgrade_note"]
    assert aggregate["flagship_lane"]["current_output_label"] == "評估 / 審閱備忘"
    assert aggregate["flagship_lane"]["upgrade_target_label"] == "決策 / 行動交付物"
    assert aggregate["flagship_lane"]["upgrade_requirements"]
    assert "最終決策版本" in aggregate["flagship_lane"]["boundary_note"]
    assert aggregate["matter_workspace"]["flagship_lane"]["lane_id"] == "material_review_start"
    assert aggregate["presence_state_summary"]["artifact"]["state"] == "explicit"
    assert aggregate["presence_state_summary"]["source_material"]["state"] == "explicit"


def test_multi_material_case_exposes_decision_convergence_flagship_lane(
    client: TestClient,
) -> None:
    task = client.post(
        "/api/v1/tasks",
        json=create_multi_agent_payload("Decision convergence lane"),
    ).json()

    upload = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "market-note.txt",
                    b"Channel conflict and margin pressure are both rising across the last quarter.",
                    "text/plain",
                ),
            ),
            (
                "files",
                (
                    "ops-note.txt",
                    b"Fulfillment delays are now affecting renewal timing and account-level trust.",
                    "text/plain",
                ),
            ),
        ],
    )

    assert upload.status_code == 200

    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()

    assert aggregate["input_entry_mode"] == "multi_material_case"
    assert aggregate["deliverable_class_hint"] == "decision_action_deliverable"
    assert aggregate["flagship_lane"]["lane_id"] == "decision_convergence_start"
    assert aggregate["flagship_lane"]["label"] == "先比較方案並收斂決策"
    assert aggregate["flagship_lane"]["summary"]
    assert aggregate["flagship_lane"]["next_step_summary"]
    assert aggregate["flagship_lane"]["upgrade_note"]
    assert aggregate["flagship_lane"]["current_output_label"] == "決策 / 行動交付物"
    assert aggregate["flagship_lane"]["upgrade_target_label"]
    assert aggregate["flagship_lane"]["boundary_note"]
    assert aggregate["matter_workspace"]["flagship_lane"]["lane_id"] == "decision_convergence_start"


def test_file_upload_creates_usable_md_evidence(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("MD upload")).json()

    response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("notes.md", b"# Header\n\nImportant market note in markdown.", "text/markdown"))],
    )

    assert response.status_code == 200
    uploaded = response.json()["uploaded"][0]
    assert uploaded["source_document"]["ingest_status"] == "processed"
    assert uploaded["evidence"]["evidence_type"] == "uploaded_file_excerpt"
    assert "Important market note" in uploaded["evidence"]["excerpt_or_summary"]


def test_file_upload_creates_usable_docx_evidence(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("DOCX upload")).json()
    document = Document()
    document.add_paragraph("Key operational dependency sits in the approval workflow.")
    buffer = BytesIO()
    document.save(buffer)

    response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "notes.docx",
                    buffer.getvalue(),
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ),
            )
        ],
    )

    assert response.status_code == 200
    uploaded = response.json()["uploaded"][0]
    assert uploaded["source_document"]["ingest_status"] == "processed"
    assert uploaded["evidence"]["evidence_type"] == "uploaded_file_excerpt"
    assert "approval workflow" in uploaded["evidence"]["excerpt_or_summary"]


def test_file_ingestion_failure_creates_explicit_uncertainty_evidence(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Broken upload")).json()
    matter_id = task["matter_workspace"]["id"]

    response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("empty.txt", b"", "text/plain"))],
    )

    assert response.status_code == 200
    uploaded = response.json()["uploaded"][0]
    assert uploaded["source_document"]["ingest_status"] == "failed"
    assert uploaded["source_document"]["ingestion_error"] == "上傳檔案為空白內容。"
    assert uploaded["evidence"]["evidence_type"] == "uploaded_file_ingestion_issue"
    assert "未能完整擷取" in uploaded["evidence"]["excerpt_or_summary"]

    matter_workspace = client.get(f"/api/v1/matters/{matter_id}").json()
    evidence_workspace = client.get(f"/api/v1/matters/{matter_id}/artifact-evidence").json()
    recent_material = next(
        item
        for item in matter_workspace["related_source_materials"]
        if item["title"] == "empty.txt"
    )
    source_card = next(
        item
        for item in evidence_workspace["source_material_cards"]
        if item["title"] == "empty.txt"
    )
    assert recent_material["ingest_status"] == "failed"
    assert recent_material["ingestion_error"] == "上傳檔案為空白內容。"
    assert source_card["ingest_status"] == "failed"
    assert source_card["ingestion_error"] == "上傳檔案為空白內容。"


def test_limited_support_image_upload_returns_reference_level_status(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Limited image upload")).json()
    matter_id = task["matter_workspace"]["id"]

    response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("photo.png", b"fake image bytes", "image/png"))],
    )

    assert response.status_code == 200
    uploaded = response.json()["uploaded"][0]
    assert uploaded["source_document"]["ingest_status"] == "metadata_only"
    assert uploaded["source_document"]["support_level"] == "limited"
    assert uploaded["source_document"]["metadata_only"] is True
    assert uploaded["source_document"]["ingestion_error"]
    assert uploaded["evidence"]["evidence_type"] == "uploaded_file_unparsed"
    assert "只建立 reference / metadata" in uploaded["evidence"]["excerpt_or_summary"]
    assert uploaded["evidence"]["media_reference_id"] is not None
    assert uploaded["evidence"]["retrieval_provenance"]["support_kind"] == "media_reference"
    assert uploaded["evidence"]["retrieval_provenance"]["media_reference"]["usable_scope"] == "reference_only"

    matter_workspace = client.get(f"/api/v1/matters/{matter_id}").json()
    evidence_workspace = client.get(f"/api/v1/matters/{matter_id}/artifact-evidence").json()
    recent_material = next(
        item
        for item in matter_workspace["related_source_materials"]
        if item["title"] == "photo.png"
    )
    source_card = next(
        item
        for item in evidence_workspace["source_material_cards"]
        if item["title"] == "photo.png"
    )
    assert recent_material["ingest_status"] == "metadata_only"
    assert recent_material["ingest_strategy"] == "image_reference"
    assert recent_material["ingestion_error"]
    assert recent_material["extract_availability"] == "reference_only"
    assert recent_material["current_usable_scope"] == "reference_only"
    assert source_card["support_level"] == "limited"
    assert source_card["ingest_strategy"] == "image_reference"
    assert source_card["ingestion_error"]
    assert source_card["availability_state"] == "reference_only"
    assert source_card["extract_availability"] == "reference_only"
    assert source_card["current_usable_scope"] == "reference_only"
    linked_issue = next(
        item for item in evidence_workspace["evidence_chains"] if item["evidence"]["title"] == "photo.png"
    )
    assert linked_issue["evidence"]["retrieval_provenance"]["support_kind"] == "media_reference"


def test_table_heavy_csv_upload_returns_limited_extract_contract(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("CSV upload")).json()
    matter_id = task["matter_workspace"]["id"]

    response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("metrics.csv", b"week,revenue,margin\n1,100,0.3\n2,90,0.28\n", "text/csv"))],
    )

    assert response.status_code == 200
    uploaded = response.json()["uploaded"][0]
    assert uploaded["source_document"]["ingest_status"] == "processed"
    assert uploaded["source_document"]["support_level"] == "limited"
    assert uploaded["source_document"]["ingest_strategy"] == "table_snapshot"
    assert uploaded["source_document"]["extract_availability"] == "partial_extract_ready"
    assert uploaded["source_document"]["current_usable_scope"] == "limited_extract"
    assert uploaded["evidence"]["evidence_type"] == "uploaded_file_excerpt"

    matter_workspace = client.get(f"/api/v1/matters/{matter_id}").json()
    evidence_workspace = client.get(f"/api/v1/matters/{matter_id}/artifact-evidence").json()
    recent_material = next(
        item
        for item in matter_workspace["related_source_materials"]
        if item["title"] == "metrics.csv"
    )
    source_card = next(
        item
        for item in evidence_workspace["source_material_cards"]
        if item["title"] == "metrics.csv"
    )
    assert recent_material["support_level"] == "limited"
    assert recent_material["extract_availability"] == "partial_extract_ready"
    assert recent_material["current_usable_scope"] == "limited_extract"
    assert source_card["support_level"] == "limited"
    assert source_card["diagnostic_category"] == "accepted_limited_table_extract"
    assert source_card["extract_availability"] == "partial_extract_ready"
    assert source_card["current_usable_scope"] == "limited_extract"


def test_scanned_pdf_upload_returns_reference_only_contract(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Scanned PDF upload")).json()
    matter_id = task["matter_workspace"]["id"]

    buffer = BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=300, height=300)
    writer.write(buffer)

    response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("scan.pdf", buffer.getvalue(), "application/pdf"))],
    )

    assert response.status_code == 200
    uploaded = response.json()["uploaded"][0]
    assert uploaded["source_document"]["ingest_status"] == "metadata_only"
    assert uploaded["source_document"]["support_level"] == "limited"
    assert uploaded["source_document"]["ingest_strategy"] == "scanned_pdf_reference"
    assert uploaded["source_document"]["availability_state"] == "reference_only"
    assert uploaded["source_document"]["extract_availability"] == "reference_only"
    assert uploaded["source_document"]["current_usable_scope"] == "reference_only"
    assert uploaded["evidence"]["evidence_type"] == "uploaded_file_unparsed"

    matter_workspace = client.get(f"/api/v1/matters/{matter_id}").json()
    evidence_workspace = client.get(f"/api/v1/matters/{matter_id}/artifact-evidence").json()
    recent_material = next(
        item
        for item in matter_workspace["related_source_materials"]
        if item["title"] == "scan.pdf"
    )
    source_card = next(
        item
        for item in evidence_workspace["source_material_cards"]
        if item["title"] == "scan.pdf"
    )
    assert recent_material["ingest_strategy"] == "scanned_pdf_reference"
    assert recent_material["availability_state"] == "reference_only"
    assert source_card["diagnostic_category"] == "reference_only_scan"
    assert source_card["extract_availability"] == "reference_only"
    assert source_card["current_usable_scope"] == "reference_only"


def test_unsupported_file_upload_returns_explicit_unsupported_status(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Unsupported upload")).json()
    matter_id = task["matter_workspace"]["id"]

    response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "deck.pptx",
                    b"fake pptx bytes",
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ),
            )
        ],
    )

    assert response.status_code == 200
    uploaded = response.json()["uploaded"][0]
    assert uploaded["source_document"]["ingest_status"] == "unsupported"
    assert uploaded["source_document"]["support_level"] == "unsupported"
    assert uploaded["source_document"]["metadata_only"] is True
    assert uploaded["source_document"]["ingestion_error"]
    assert uploaded["evidence"]["evidence_type"] == "uploaded_file_ingestion_issue"
    assert "尚未正式支援" in uploaded["evidence"]["excerpt_or_summary"]

    matter_workspace = client.get(f"/api/v1/matters/{matter_id}").json()
    evidence_workspace = client.get(f"/api/v1/matters/{matter_id}/artifact-evidence").json()
    recent_material = next(
        item
        for item in matter_workspace["related_source_materials"]
        if item["title"] == "deck.pptx"
    )
    source_card = next(
        item
        for item in evidence_workspace["source_material_cards"]
        if item["title"] == "deck.pptx"
    )
    assert recent_material["ingest_status"] == "unsupported"
    assert recent_material["ingestion_error"]
    assert source_card["ingest_status"] == "unsupported"
    assert source_card["ingestion_error"]


def test_task_creation_auto_infers_consulting_scaffold_when_advanced_fields_missing(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/tasks",
        json={
            "title": "Simple intake",
            "description": "Should we expand into a new market this year?",
            "task_type": "research_synthesis",
            "mode": "specialist",
            "subject_name": "Taiwan market expansion",
            "background_text": "",
            "constraints": [],
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["goals"][0]["description"]
    assert body["goals"][0]["success_criteria"]
    assert any(item["constraint_type"] == "system_inferred" for item in body["constraints"])
    assert body["external_data_strategy"] == "supplemental"
    assert body["contexts"][0]["summary"].startswith("工作流程：specialist")


def test_source_ingestion_from_pasted_text_creates_normalized_evidence_and_chunks(
    client: TestClient,
) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Pasted source")).json()

    response = client.post(
        f"/api/v1/tasks/{task['id']}/sources",
        json={
            "pasted_text": (
                "Customer interviews show adoption friction around setup speed and approval flow. "
                "The team believes a simpler onboarding sequence could improve conversion. "
                "Competitors position speed as a premium differentiator. " * 10
            ),
            "pasted_title": "訪談紀錄",
        },
    )

    assert response.status_code == 200
    ingested = response.json()["ingested"][0]
    assert ingested["source_document"]["source_type"] == "manual_input"
    assert ingested["source_document"]["ingest_status"] == "processed"
    assert ingested["evidence"]["evidence_type"] == "source_excerpt"
    assert "關聯度" in ingested["evidence"]["excerpt_or_summary"]
    assert ingested["source_document"]["participation"]["current_task_participation"] is True
    assert ingested["source_document"]["participation"]["participation_type"] == "direct_ingest"
    assert ingested["source_document"]["participation"]["mapping_mode"] == "explicit_mapping"
    assert ingested["source_document"]["participation"]["canonical_owner_scope"] == "world_canonical"
    assert ingested["source_document"]["participation"]["compatibility_task_id"] == task["id"]

    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert any(item["evidence_type"] == "source_chunk" for item in aggregate["evidence"])
    assert any(
        item["retrieval_provenance"]["support_kind"] == "chunk_object"
        for item in aggregate["evidence"]
        if item["evidence_type"] == "source_chunk"
    )


def test_source_ingestion_from_url_extracts_text_and_metadata(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services import sources as source_service

    task = client.post("/api/v1/tasks", json=create_task_payload("URL source")).json()

    monkeypatch.setattr(
        source_service,
        "fetch_remote_source",
        lambda url: RemoteSourceContent(
            source_type="manual_url",
            source_url=url,
            title="市場新聞摘要",
            content_type="text/html",
            normalized_text="Market demand is improving and channel partners expect faster implementation support.",
        ),
    )

    response = client.post(
        f"/api/v1/tasks/{task['id']}/sources",
        json={"urls": ["https://example.com/news"]},
    )

    assert response.status_code == 200
    ingested = response.json()["ingested"][0]
    assert ingested["source_document"]["source_type"] == "manual_url"
    assert ingested["source_document"]["file_name"] == "市場新聞摘要"
    assert ingested["evidence"]["evidence_type"] == "source_excerpt"
    assert ingested["source_document"]["participation"]["current_task_participation"] is True
    assert ingested["source_document"]["participation"]["participation_type"] == "direct_ingest"
    assert ingested["source_document"]["participation"]["mapping_mode"] == "explicit_mapping"
    assert ingested["source_document"]["participation"]["canonical_owner_scope"] == "world_canonical"
    assert ingested["source_document"]["participation"]["compatibility_task_id"] == task["id"]


def test_fetch_remote_source_normalizes_non_ascii_request_urls(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    requested: dict[str, object] = {}

    class _FakeHeaders:
        @staticmethod
        def get_content_type() -> str:
            return "text/html"

    class _FakeResponse:
        headers = _FakeHeaders()

        def __enter__(self) -> "_FakeResponse":
            return self

        def __exit__(self, exc_type, exc, tb) -> None:  # noqa: ANN001
            return None

        @staticmethod
        def read() -> bytes:
            return "<html><head><title>中文頁面標題</title></head><body><p>這是一段足夠長的中文內容，讓抽取器可以保留它作為有效文字材料。</p></body></html>".encode(
                "utf-8"
            )

        def geturl(self) -> str:
            return requested["full_url"]  # type: ignore[return-value]

    def fake_urlopen(http_request, timeout):  # noqa: ANN001
        requested["full_url"] = http_request.full_url
        requested["timeout"] = timeout
        return _FakeResponse()

    monkeypatch.setattr(remote_ingestion.request, "urlopen", fake_urlopen)

    source = remote_ingestion.fetch_remote_source(
        "https://例子.測試/路徑?q=測試 值",
        timeout_seconds=12,
    )

    assert requested["full_url"] == "https://xn--fsqu00a.xn--g6w251d/%E8%B7%AF%E5%BE%91?q=%E6%B8%AC%E8%A9%A6%20%E5%80%BC"
    assert requested["timeout"] == 12
    assert source.source_url == "https://例子.測試/路徑?q=測試 值"
    assert source.title == "中文頁面標題"
    assert "這是一段足夠長的中文內容" in source.normalized_text


def test_source_ingestion_rejects_more_than_ten_material_units_per_request(
    client: TestClient,
) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Source limit")).json()

    response = client.post(
        f"/api/v1/tasks/{task['id']}/sources",
        json={
            "urls": [f"https://example.com/source-{index}" for index in range(10)],
            "pasted_text": "This pasted supplement would become the 11th material unit.",
            "pasted_title": "Overflow source note",
        },
    )

    assert response.status_code == 400
    assert "最多只能補入 10 份材料" in response.json()["detail"]


def test_file_upload_rejects_more_than_ten_files_per_request(
    client: TestClient,
) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Upload limit")).json()

    files = [
        (
            "files",
            (f"file-{index}.txt", f"content-{index}".encode("utf-8"), "text/plain"),
        )
        for index in range(11)
    ]
    response = client.post(f"/api/v1/tasks/{task['id']}/uploads", files=files)

    assert response.status_code == 400
    assert "最多只能上傳 10 份檔案" in response.json()["detail"]


def test_sentence_only_case_supports_batched_material_supplements_on_same_matter(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services import sources as source_service

    task = client.post("/api/v1/tasks", json=create_task_payload("Batched supplements")).json()
    matter_id = task["matter_workspace"]["id"]

    monkeypatch.setattr(
        source_service,
        "fetch_remote_source",
        lambda url: RemoteSourceContent(
            source_type="manual_url",
            source_url=url,
            title=f"Source for {url.rsplit('/', 1)[-1]}",
            content_type="text/html",
            normalized_text=f"Normalized text for {url}.",
        ),
    )

    first_batch = client.post(
        f"/api/v1/matters/{matter_id}/sources",
        json={"urls": ["https://example.com/first"]},
    )
    assert first_batch.status_code == 200

    second_batch = client.post(
        f"/api/v1/matters/{matter_id}/uploads",
        files=[("files", ("follow-up.txt", b"Uploaded follow-up material for the same matter.", "text/plain"))],
    )
    assert second_batch.status_code == 200

    third_batch = client.post(
        f"/api/v1/matters/{matter_id}/sources",
        json={
            "urls": ["https://example.com/second"],
            "pasted_text": "A pasted supplement should join the same matter world instead of opening a new intake branch.",
            "pasted_title": "Batched pasted note",
        },
    )
    assert third_batch.status_code == 200

    refreshed_task = client.get(f"/api/v1/tasks/{task['id']}").json()
    source_types = {item["source_type"] for item in refreshed_task["uploads"]}

    assert refreshed_task["matter_workspace"]["id"] == matter_id
    assert refreshed_task["case_world_state"]["supplement_count"] >= 3
    assert source_types >= {"manual_url", "manual_input", "manual_upload"}
    assert len(refreshed_task["source_materials"]) >= 4


def test_google_docs_without_permission_returns_explicit_ingestion_issue(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services import sources as source_service

    task = client.post("/api/v1/tasks", json=create_task_payload("Google docs source")).json()
    monkeypatch.setattr(
        source_service,
        "fetch_remote_source",
        lambda url: (_ for _ in ()).throw(
            RuntimeError("Google Docs 連結目前沒有可讀權限，請確認文件已公開或可供目前環境讀取。")
        ),
    )

    response = client.post(
        f"/api/v1/tasks/{task['id']}/sources",
        json={"urls": ["https://docs.google.com/document/d/demo/edit"]},
    )

    assert response.status_code == 200
    ingested = response.json()["ingested"][0]
    assert ingested["source_document"]["ingest_status"] == "failed"
    assert ingested["evidence"]["evidence_type"] == "source_ingestion_issue"
    assert "Google Docs 連結目前沒有可讀權限" in ingested["evidence"]["excerpt_or_summary"]


def test_google_docs_public_link_creates_processed_source(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services import sources as source_service

    task = client.post("/api/v1/tasks", json=create_task_payload("Google docs public")).json()
    monkeypatch.setattr(
        source_service,
        "fetch_remote_source",
        lambda url: RemoteSourceContent(
            source_type="google_docs",
            source_url=url,
            title="公開 Google Docs",
            content_type="text/plain",
            normalized_text="This public Google Docs note contains a usable strategy summary.",
        ),
    )

    response = client.post(
        f"/api/v1/tasks/{task['id']}/sources",
        json={"urls": ["https://docs.google.com/document/d/demo-public/edit"]},
    )

    assert response.status_code == 200
    ingested = response.json()["ingested"][0]
    assert ingested["source_document"]["source_type"] == "google_docs"
    assert ingested["source_document"]["ingest_status"] == "processed"
    assert ingested["evidence"]["evidence_type"] == "source_excerpt"


def test_source_url_retry_can_recover_after_previous_failed_ingestion(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services import sources as source_service

    task = client.post("/api/v1/tasks", json=create_task_payload("URL retry recovery")).json()
    attempts = {"count": 0}

    def fake_fetch_remote_source(url: str) -> RemoteSourceContent:
        attempts["count"] += 1
        if attempts["count"] == 1:
            raise RuntimeError("Temporary upstream failure")
        return RemoteSourceContent(
            source_type="manual_url",
            source_url=url,
            title="Recovered market brief",
            content_type="text/html",
            normalized_text="Recovered evidence now includes usable implementation details.",
        )

    monkeypatch.setattr(source_service, "fetch_remote_source", fake_fetch_remote_source)

    first_response = client.post(
        f"/api/v1/tasks/{task['id']}/sources",
        json={"urls": ["https://example.com/retry-source"]},
    )

    assert first_response.status_code == 200
    first_item = first_response.json()["ingested"][0]
    assert first_item["source_document"]["ingest_status"] == "failed"
    assert first_item["evidence"]["evidence_type"] == "source_ingestion_issue"

    second_response = client.post(
        f"/api/v1/tasks/{task['id']}/sources",
        json={"urls": ["https://example.com/retry-source"]},
    )

    assert second_response.status_code == 200
    second_item = second_response.json()["ingested"][0]
    assert second_item["source_document"]["ingest_status"] == "processed"
    assert second_item["source_document"]["file_name"] == "Recovered market brief"
    assert second_item["evidence"]["evidence_type"] == "source_excerpt"
    assert attempts["count"] == 2


def test_research_synthesis_specialist_run_and_history_persistence(client: TestClient) -> None:
    payload = create_task_payload("Specialist run")
    payload.update(
        {
            "description": "Turn the ecommerce working notes into a structured internal synthesis for channel, SKU, and retention decisions.",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "domain_lenses": ["營運", "財務"],
            "judgment_to_make": "先判斷電商品牌的通路、SKU 與回購策略是否需要調整。",
        }
    )
    task = client.post("/api/v1/tasks", json=payload).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "research.txt",
                    b"The competitor set overlaps heavily and pricing differs by service tier. Customers value implementation speed.",
                    "text/plain",
                ),
            ),
        ],
    )

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert run_response.status_code == 200
    run_body = run_response.json()
    assert run_body["run"]["status"] == "completed"
    assert run_body["deliverable"]["deliverable_type"] == "research_synthesis"
    assert run_body["recommendations"]
    assert run_body["action_items"]
    content = run_body["deliverable"]["content_structure"]
    assert_consultant_output_shell(content)
    assert content["key_findings"]
    assert content["implications"]
    assert "research_gaps" in content
    assert "external_data_usage" in content
    assert content["capability_frame"]["capability"] == "synthesize_brief"
    assert content["capability_frame"]["execution_mode"] == "specialist"
    assert "operations_pack" in content["capability_frame"]["selected_domain_pack_ids"]
    assert "ecommerce_pack" in content["capability_frame"]["selected_industry_pack_ids"]
    assert "host_agent" == content["capability_frame"]["host_agent"]
    assert "research_synthesis_specialist" in content["capability_frame"]["selected_specialist_agents"]
    assert content["capability_frame"]["selected_agent_details"]
    assert content["agent_selection"]["selected_agent_ids"]
    assert "deferred_agent_notes" in content["capability_frame"]
    assert "escalation_notes" in content["capability_frame"]
    assert "agent_selection_implications" in content["readiness_governance"]
    assert content["selected_packs"]["selected_domain_packs"]
    assert content["selected_packs"]["selected_industry_packs"]
    assert content["selected_packs"]["selected_domain_packs"][0]["domain_definition"]
    assert content["selected_packs"]["selected_domain_packs"][0]["common_problem_patterns"]
    assert content["selected_packs"]["selected_industry_packs"][0]["key_kpis"]
    assert content["selected_packs"]["selected_industry_packs"][0]["decision_patterns"]
    assert content["readiness_governance"]["pack_evidence_expectations"]
    assert content["decision_context_summary"]
    assert content["input_entry_mode"] in {
        "single_document_intake",
        "multi_material_case",
    }
    assert content["deliverable_class"] in {
        "assessment_review_memo",
        "decision_action_deliverable",
    }
    assert content["sparse_input_operating_state"]["presence_state_summary"]["decision_context"]["state"]
    assert content["readiness_governance"]["decision_context_clear"] is True
    assert content["ontology_chain_summary"]["decision_context"]
    assert content["ontology_context"]["decision_context"]["judgment_to_make"]
    assert content["ontology_context"]["source_materials"]
    assert run_body["recommendations"][0]["supporting_evidence_ids"]
    assert run_body["deliverable"]["linked_objects"]
    assert any(
        item["object_type"] == "decision_context"
        for item in run_body["deliverable"]["linked_objects"]
    )
    assert any(
        item["object_type"] == "evidence"
        for item in run_body["deliverable"]["linked_objects"]
    )

    history_response = client.get(f"/api/v1/tasks/{task['id']}/history")

    assert history_response.status_code == 200
    history = history_response.json()
    assert len(history["runs"]) == 1
    assert len(history["deliverables"]) == 1
    assert len(history["recommendations"]) >= 1
    assert len(history["action_items"]) >= 1
    assert len(history["evidence"]) >= 2


def test_document_restructuring_specialist_run_and_history_persistence(
    client: TestClient,
) -> None:
    task = client.post(
        "/api/v1/tasks",
        json=create_document_restructuring_payload("Document restructuring run"),
    ).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "draft.md",
                    b"# Draft\n\nThe recommendation appears too late. Risks are mixed into the middle sections. Evidence is repeated across paragraphs.",
                    "text/markdown",
                ),
            )
        ],
    )

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert run_response.status_code == 200
    run_body = run_response.json()
    assert run_body["run"]["status"] == "completed"
    assert run_body["run"]["agent_id"] == "document_restructuring"
    assert run_body["deliverable"]["deliverable_type"] == "document_restructuring"
    content = run_body["deliverable"]["content_structure"]
    assert_consultant_output_shell(content)
    assert content["deliverable_class"] == "assessment_review_memo"
    assert content["draft_outline"] or content["proposed_outline"]
    assert content["structure_adjustments"] or content["rewrite_guidance"]
    assert content["restructuring_strategy"]
    assert run_body["recommendations"]
    assert run_body["action_items"]

    history_response = client.get(f"/api/v1/tasks/{task['id']}/history")

    assert history_response.status_code == 200
    history = history_response.json()
    assert len(history["runs"]) == 1
    assert history["runs"][0]["agent_id"] == "document_restructuring"
    assert len(history["deliverables"]) == 1
    assert history["deliverables"][0]["deliverable_type"] == "document_restructuring"
    assert len(history["recommendations"]) >= 1
    assert len(history["action_items"]) >= 1


def test_contract_review_specialist_run_and_history_persistence(
    client: TestClient,
) -> None:
    task = client.post(
        "/api/v1/tasks",
        json=create_contract_review_payload("Contract review run"),
    ).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "agreement.txt",
                    b"Supplier may terminate for convenience on 10 days notice. Liability cap excludes confidentiality breaches. Acceptance criteria are not clearly defined.",
                    "text/plain",
                ),
            )
        ],
    )

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert run_response.status_code == 200
    run_body = run_response.json()
    assert run_body["run"]["status"] == "completed"
    assert run_body["run"]["agent_id"] == "contract_review"
    assert run_body["deliverable"]["deliverable_type"] == "contract_review"
    content = run_body["deliverable"]["content_structure"]
    assert_consultant_output_shell(content)
    assert content["findings"]
    assert content["capability_frame"]["capability"] == "review_challenge"
    assert content["deliverable_class"] == "assessment_review_memo"
    assert content["readiness_governance"]["artifact_coverage"]
    assert content["high_risk_clauses"]
    assert content["obligations_identified"]
    assert content["redline_recommendations"]
    assert "missing_attachments_or_clauses" in content
    assert run_body["risks"]
    assert run_body["recommendations"]
    assert run_body["action_items"]
    assert run_body["recommendations"][0]["supporting_evidence_ids"]
    assert any(
        item["object_type"] == "recommendation"
        for item in run_body["deliverable"]["linked_objects"]
    )

    history_response = client.get(f"/api/v1/tasks/{task['id']}/history")

    assert history_response.status_code == 200
    history = history_response.json()
    assert len(history["runs"]) == 1
    assert history["runs"][0]["agent_id"] == "contract_review"
    assert len(history["deliverables"]) == 1
    assert history["deliverables"][0]["deliverable_type"] == "contract_review"
    assert history["deliverables"][0]["content_structure"]["risks"]
    assert len(history["recommendations"]) >= 1
    assert len(history["action_items"]) >= 1
    workspace_response = client.get(f"/api/v1/deliverables/{run_body['deliverable']['id']}")
    assert workspace_response.status_code == 200
    workspace = workspace_response.json()
    clause_set = next(
        item for item in workspace["object_sets"] if item["set_type"] == "clause_obligation_set_v1"
    )
    assert clause_set["scope_type"] == "deliverable"
    assert clause_set["creation_mode"] == "deliverable_support_bundle"
    assert clause_set["membership_source_summary"]["primary_source"] == "deliverable_support_bundle"
    assert any(member["member_object_type"] == "clause" for member in clause_set["members"])
    assert any(member["member_object_type"] == "obligation" for member in clause_set["members"])
    assert any(member["support_evidence_id"] for member in clause_set["members"])

    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert len(aggregate["risks"]) >= 1
    assert any(item["set_type"] == "clause_obligation_set_v1" for item in aggregate["object_sets"])


def test_operations_process_issue_set_persists_to_deliverable_workspace(
    client: TestClient,
) -> None:
    payload = create_operations_process_payload("Operations remediation bundle")
    payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Operations Sprint",
            "workstream_name": "Delivery workflow hardening",
            "decision_title": "Workflow remediation priority",
            "judgment_to_make": "先判斷是否應優先修 handoff、approval bottleneck 與 owner gap，再決定是否擴大交付量。",
            "domain_lenses": ["營運", "財務"],
        }
    )

    task = client.post("/api/v1/tasks", json=payload).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "workflow.txt",
                    b"Approval workflow is delayed because handoff between sales and operations is unclear. Backlog is growing, owner mapping is inconsistent, and exception approvals rely on one founder. Team needs a tighter SLA, dependency map, and control check before scaling delivery.",
                    "text/plain",
                ),
            )
        ],
    )

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert run_response.status_code == 200
    run_body = run_response.json()
    deliverable_id = run_body["deliverable"]["id"]
    workspace_response = client.get(f"/api/v1/deliverables/{deliverable_id}")
    assert workspace_response.status_code == 200
    workspace = workspace_response.json()

    process_set = next(
        item for item in workspace["object_sets"] if item["set_type"] == "process_issue_set_v1"
    )
    assert process_set["scope_type"] == "deliverable"
    assert process_set["creation_mode"] == "deliverable_support_bundle"
    assert process_set["membership_source_summary"]["primary_source"] == "deliverable_support_bundle"
    assert process_set["member_count"] >= 1
    member = next(
        item for item in process_set["members"] if item["member_object_type"] == "process_issue"
    )
    assert member["support_evidence_id"] is not None
    assert member["member_metadata"]["issue_type"]
    assert member["member_metadata"]["severity"]
    assert member["member_metadata"]["affected_process_step"]

    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert any(item["set_type"] == "process_issue_set_v1" for item in aggregate["object_sets"])


def test_deliverable_export_and_publish_include_support_bundle_summary(
    client: TestClient,
) -> None:
    payload = create_operations_process_payload("Operations export hardening")
    payload.update(
        {
            "client_name": "Northwind Studio",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Operations Sprint",
            "workstream_name": "Delivery workflow hardening",
            "decision_title": "Workflow remediation priority",
            "judgment_to_make": "先判斷是否應優先修 handoff、approval bottleneck 與 owner gap，再決定是否擴大交付量。",
            "domain_lenses": ["營運", "財務"],
        }
    )

    task = client.post("/api/v1/tasks", json=payload).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "workflow.txt",
                    b"Approval workflow is delayed because handoff between sales and operations is unclear. Backlog is growing, one founder still approves exceptions, and remediation owner mapping is inconsistent.",
                    "text/plain",
                ),
            )
        ],
    )

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run_response.status_code == 200
    deliverable_id = run_response.json()["deliverable"]["id"]

    export_response = client.get(f"/api/v1/deliverables/{deliverable_id}/export")
    assert export_response.status_code == 200
    export_text = export_response.text
    assert "## 支撐集合摘要" in export_text
    assert "流程問題集" in export_text

    workspace = client.get(f"/api/v1/deliverables/{deliverable_id}").json()
    publish_response = client.post(
        f"/api/v1/deliverables/{deliverable_id}/publish",
        json={
            "title": workspace["deliverable"]["title"],
            "summary": workspace["deliverable"]["summary"],
            "version_tag": workspace["deliverable"]["version_tag"] or f"v{workspace['deliverable']['version']}",
            "publish_note": "Publish after deliverable hardening verification.",
            "artifact_formats": ["markdown"],
            "content_sections": workspace["content_sections"],
        },
    )
    assert publish_response.status_code == 200
    published = publish_response.json()
    assert published["publish_records"]
    latest_event = next(
        item for item in published["version_events"] if item["event_type"] == "published"
    )
    assert latest_event["event_payload"]["support_bundle_summary"]
    assert any(
        item["display_title"] == "這次交付的流程問題集"
        for item in latest_event["event_payload"]["support_bundle_summary"]
    )


def test_specialist_run_returns_explicit_uncertainty_when_no_usable_evidence(
    client: TestClient,
) -> None:
    payload = create_task_payload("No usable evidence")
    payload["background_text"] = ""
    payload["external_data_strategy"] = "strict"
    payload["goal_description"] = "Return a synthesis only if enough evidence exists."
    task = client.post("/api/v1/tasks", json=payload).json()

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert body["run"]["status"] == "completed"
    assert body["deliverable"]["content_structure"]["background_summary"]
    assert body["risks"]
    assert body["recommendations"]
    assert body["action_items"]


def test_deliverable_feedback_persists_on_deliverable_workspace(
    client: TestClient,
) -> None:
    payload = create_contract_review_payload("Deliverable feedback foundation")
    task = client.post("/api/v1/tasks", json=payload).json()

    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("agreement.txt", b"Termination and liability clauses need review.", "text/plain"))],
    )
    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run_response.status_code == 200
    deliverable_id = run_response.json()["deliverable"]["id"]

    feedback_response = client.post(
        f"/api/v1/deliverables/{deliverable_id}/feedback",
        json={"feedback_status": "adopted", "note": "這份交付可直接採用。"},
    )

    assert feedback_response.status_code == 200
    workspace = feedback_response.json()
    assert workspace["deliverable"]["adoption_feedback"]["feedback_status"] == "adopted"
    assert workspace["deliverable"]["adoption_feedback"]["note"] == "這份交付可直接採用。"
    assert workspace["task"]["deliverables"][0]["adoption_feedback"]["feedback_status"] == "adopted"


def test_recommendation_feedback_persists_on_task_aggregate(
    client: TestClient,
) -> None:
    payload = create_task_payload("Recommendation feedback foundation")
    task = client.post("/api/v1/tasks", json=payload).json()

    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("notes.txt", b"Pricing and channel suggestions need review.", "text/plain"))],
    )
    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run_response.status_code == 200

    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    recommendation_id = aggregate["recommendations"][0]["id"]

    feedback_response = client.post(
        f"/api/v1/tasks/{task['id']}/recommendations/{recommendation_id}/feedback",
        json={"feedback_status": "template_candidate", "note": "這類建議可作為範本候選。"},
    )

    assert feedback_response.status_code == 200
    updated = feedback_response.json()
    recommendation = next(item for item in updated["recommendations"] if item["id"] == recommendation_id)
    assert recommendation["adoption_feedback"]["feedback_status"] == "template_candidate"
    assert recommendation["adoption_feedback"]["note"] == "這類建議可作為範本候選。"


def test_specialist_run_returns_explicit_uncertainty_when_model_router_fails(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    payload = create_task_payload("Router failure")
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()
    monkeypatch.setenv("MODEL_PROVIDER_FAILURE_MODE", "always_fail")

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 503
    assert "Mock 模型供應器的失敗模式目前已啟用" in response.json()["detail"]

    refreshed = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert refreshed["status"] == "failed"
    assert refreshed["runs"][0]["status"] == "failed"
    assert refreshed["deliverables"] == []

    monkeypatch.delenv("MODEL_PROVIDER_FAILURE_MODE", raising=False)


def test_host_normalizes_incomplete_specialist_output(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.agents.base import AgentResult, DeliverableDraft, SpecialistAgent
    from app.agents.registry import AgentRegistry

    class IncompleteAgent(SpecialistAgent):
        descriptor = AgentRegistry(None).get_descriptor("research_synthesis")  # type: ignore[arg-type]

        def run(self, payload):  # noqa: ANN001
            return AgentResult(
                deliverable=DeliverableDraft(
                    deliverable_type="research_synthesis",
                    title=f"{payload.title} - Incomplete",
                    content_structure={},
                )
            )

    monkeypatch.setattr(AgentRegistry, "get_specialist_agent", lambda self, agent_id: IncompleteAgent())
    payload = create_task_payload("Incomplete output")
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    missing_information = " ".join(body["deliverable"]["content_structure"]["missing_information"])
    assert "Host 已補上一個明確占位" in missing_information
    assert body["deliverable"]["content_structure"]["executive_summary"]
    assert body["deliverable"]["content_structure"]["core_judgment"]
    assert body["recommendations"]
    assert body["action_items"]
    assert body["risks"]


def test_multi_agent_happy_path_converges_and_saves_history(client: TestClient) -> None:
    payload = create_multi_agent_payload()
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "convergence.txt",
                    b"Customers care about implementation speed. Pricing complexity creates adoption friction. Competitor positioning overlaps in the mid-market tier.",
                    "text/plain",
                ),
            ),
            (
                "files",
                (
                    "financial.txt",
                    b"Gross margin is healthy, but implementation bottlenecks are delaying onboarding and revenue realization.",
                    "text/plain",
                ),
            )
        ],
    )

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert body["run"]["status"] == "completed"
    assert body["run"]["agent_id"] == "host_orchestrator"
    assert body["deliverable"]["deliverable_type"] == "multi_agent_convergence"
    content = body["deliverable"]["content_structure"]
    assert_consultant_output_shell(content)
    assert content["capability_frame"]["capability"] == "decide_converge"
    assert content["capability_frame"]["execution_mode"] == "multi_agent"
    assert content["capability_frame"]["selected_agents"]
    assert content["capability_frame"]["selected_agent_details"]
    assert content["capability_frame"]["runtime_agents"]
    assert content["capability_frame"]["selected_supporting_agents"] == content["participating_agents"][1:]
    assert "deferred_agent_notes" in content["agent_selection"]
    assert "escalation_notes" in content["agent_selection"]
    assert content["deliverable_class"] == "decision_action_deliverable"
    assert content["readiness_governance"]["evidence_coverage"]
    assert "strategy_business_analysis" in content["participating_agents"]
    assert set(content["participating_agents"]) == {
        "strategy_business_analysis",
        "research_intelligence",
        "operations",
        "legal_risk",
    }
    assert content["findings"]
    assert content["insights"]
    assert content["convergence_summary"]
    assert "divergent_views" in content
    assert content["orchestration_summary"]
    assert body["recommendations"]
    assert body["action_items"]
    assert "external_data_usage" in content
    assert body["recommendations"][0]["supporting_evidence_ids"]
    assert any(item["object_type"] == "workstream" for item in body["deliverable"]["linked_objects"])
    assert any(item["object_type"] == "evidence" for item in body["deliverable"]["linked_objects"])

    history = client.get(f"/api/v1/tasks/{task['id']}/history").json()
    assert len(history["runs"]) == 1
    assert history["runs"][0]["agent_id"] == "host_orchestrator"
    assert len(history["deliverables"]) == 1


def test_host_readiness_governance_surfaces_artifact_gap_for_document_restructuring(
    client: TestClient,
) -> None:
    payload = create_document_restructuring_payload("Document restructuring gap")
    payload["background_text"] = ""
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    content = response.json()["deliverable"]["content_structure"]
    assert content["capability_frame"]["capability"] == "restructure_reframe"
    assert content["readiness_governance"]["level"] in {"caution", "insufficient"}
    assert content["readiness_governance"]["supported_deliverable_class"] in {
        "exploratory_brief",
        "assessment_review_memo",
    }
    assert any(
        "artifact" in item or "文件" in item or "草稿" in item
        for item in content["readiness_governance"]["missing_information"]
    )


def test_sparse_external_event_case_caps_deliverable_to_exploratory_brief(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.agents import host as host_module
    from app.services import sources as source_service

    payload = create_task_payload("External event case")
    payload.update(
        {
            "description": "川普提高關稅後，台灣零組件出口商接下來三個月該先注意哪些風險？",
            "background_text": "",
            "subject_name": "",
            "goal_description": "先形成外部情勢判斷與待驗證事項。",
        }
    )
    task = client.post("/api/v1/tasks", json=payload).json()
    assert task["external_research_heavy_candidate"] is True

    monkeypatch.setattr(
        host_module,
        "search_external_sources",
        lambda query: [
            SearchResult(
                title="Tariff update",
                url="https://example.com/tariff-update",
                snippet="Latest tariff change",
            )
        ],
    )
    monkeypatch.setattr(
        source_service,
        "fetch_remote_source",
        lambda url: RemoteSourceContent(
            source_type="manual_url",
            source_url=url,
            title="Tariff update",
            content_type="text/html",
            normalized_text="External coverage explains tariff changes and likely supply chain impacts.",
        ),
    )

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    content = response.json()["deliverable"]["content_structure"]
    assert content["deliverable_class"] == "exploratory_brief"
    assert content["readiness_governance"]["external_research_heavy_case"] is True


def test_sparse_external_event_case_exposes_research_guidance(client: TestClient) -> None:
    payload = create_task_payload("Research guidance case")
    payload.update(
        {
            "description": "川普提高關稅後，台灣零組件出口商接下來三個月該先注意哪些風險？",
            "background_text": "",
            "subject_name": "",
            "goal_description": "先形成外部情勢判斷與待驗證事項。",
        }
    )

    task = client.post("/api/v1/tasks", json=payload).json()

    assert task["research_guidance"]["status"] == "recommended"
    assert task["research_guidance"]["recommended_depth"] == "deep_research"
    assert task["research_guidance"]["label"] == "系統研究建議"
    assert task["research_guidance"]["summary"]
    assert task["research_guidance"]["execution_owner_label"] == "由系統研究主線處理"
    assert task["research_guidance"]["suggested_questions"]
    assert task["research_guidance"]["stop_condition"]
    assert task["research_guidance"]["handoff_summary"]
    assert task["research_guidance"]["boundary_note"]
    assert "補件主鏈" in task["research_guidance"]["supplement_boundary_note"]


def test_single_document_contract_review_keeps_research_guidance_low_noise(
    client: TestClient,
) -> None:
    payload = create_contract_review_payload("Research low-noise case")
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()

    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("agreement.txt", b"Termination and liability clauses need review.", "text/plain"))],
    )

    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()

    assert aggregate["research_guidance"]["status"] == "not_needed"
    assert aggregate["research_guidance"]["label"] == "目前不用先啟動系統研究"
    assert aggregate["research_guidance"]["execution_owner_label"] == "目前不需要啟動系統研究主線"
    assert "補件主鏈" in aggregate["research_guidance"]["supplement_boundary_note"]
    assert aggregate["research_guidance"]["suggested_questions"] == []


def test_host_routes_multi_agent_based_on_context_spine(
    client: TestClient,
) -> None:
    payload = create_multi_agent_payload("Context-aware routing")
    payload.update(
        {
            "description": "請盤點這次制度化階段的營運與法務風險，判斷是否要先處理交付流程與合規風險。",
            "background_text": "目前主要擔心交付流程卡點、責任邊界不清，以及客戶承諾與內部流程不一致。",
            "client_stage": "制度化階段",
            "client_type": "中小企業",
            "domain_lenses": ["營運", "法務"],
            "decision_summary": "這次要先判斷交付流程與合規風險，是否已經成為制度化階段的主要瓶頸。",
            "judgment_to_make": "先判斷是否應優先處理交付流程與法務風險，而不是先擴大客戶開發。",
        }
    )
    task = client.post("/api/v1/tasks", json=payload).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "ops-legal.txt",
                    b"Delivery ownership is unclear, acceptance criteria are inconsistent, and contract obligations are not mapped to the operating workflow.",
                    "text/plain",
                ),
            )
        ],
    )

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    content = response.json()["deliverable"]["content_structure"]
    assert content["capability_frame"]["capability"] == "risk_surfacing"
    assert content["participating_agents"][0] == "operations"
    assert "Legal / Risk Agent 提前" in " ".join(content["capability_frame"]["routing_rationale"])


def test_operations_agent_participates_in_multi_agent_convergence(client: TestClient) -> None:
    payload = create_multi_agent_payload("Operations core agent")
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "ops.txt",
                    b"Delivery depends on cross-team sequencing, named owners, and acceptance criteria. Pricing approvals can delay launch if the workflow is unclear.",
                    "text/plain",
                ),
            )
        ],
    )

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    participating_agents = body["deliverable"]["content_structure"]["participating_agents"]
    assert "operations" in participating_agents
    assert len(participating_agents) == 4
    assert body["deliverable"]["content_structure"]["findings"]
    assert body["deliverable"]["content_structure"]["action_items"]


def test_strict_external_data_strategy_never_triggers_search(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.agents import host as host_module

    payload = create_task_payload("Strict mode")
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()

    def fail_if_called(query):  # noqa: ANN001
        raise AssertionError(f"search should not be called for strict mode: {query}")

    monkeypatch.setattr(host_module, "search_external_sources", fail_if_called)

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert body["deliverable"]["content_structure"]["external_data_strategy"] == "strict"
    assert body["deliverable"]["content_structure"]["external_search_used"] is False


def test_supplemental_external_data_strategy_searches_when_evidence_is_thin(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.agents import host as host_module
    from app.services import sources as source_service

    task = client.post("/api/v1/tasks", json=create_task_payload("Supplemental search")).json()
    calls: list[str] = []

    def fake_search(query):  # noqa: ANN001
        calls.append(query)
        return [
            SearchResult(
                title="Latest market signal",
                url="https://example.com/latest-market-signal",
                snippet="Fresh market signal",
            )
        ]

    monkeypatch.setattr(host_module, "search_external_sources", fake_search)
    monkeypatch.setattr(
        source_service,
        "fetch_remote_source",
        lambda url: RemoteSourceContent(
            source_type="manual_url",
            source_url=url,
            title="Latest market signal",
            content_type="text/html",
            normalized_text="External source says adoption is rising and implementation speed matters.",
        ),
    )

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert len(calls) == 1
    assert body["deliverable"]["content_structure"]["external_data_strategy"] == "supplemental"
    assert body["deliverable"]["content_structure"]["external_search_used"] is True
    assert body["deliverable"]["content_structure"]["sources_used"]

    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert any(item["source_type"] == "external_search" for item in aggregate["uploads"])


def test_latest_external_data_strategy_always_triggers_search(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.agents import host as host_module
    from app.services import sources as source_service

    payload = create_task_payload("Latest mode search")
    payload["external_data_strategy"] = "latest"
    task = client.post("/api/v1/tasks", json=payload).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("enough.txt", b"One. Two. Three. Four.", "text/plain"))],
    )
    calls: list[str] = []

    def fake_search(query):  # noqa: ANN001
        calls.append(query)
        return [
            SearchResult(
                title="Fresh news source",
                url="https://example.com/fresh-news",
                snippet="Latest source",
            )
        ]

    monkeypatch.setattr(host_module, "search_external_sources", fake_search)
    monkeypatch.setattr(
        source_service,
        "fetch_remote_source",
        lambda url: RemoteSourceContent(
            source_type="manual_url",
            source_url=url,
            title="Fresh news source",
            content_type="text/html",
            normalized_text="A fresh external source was intentionally added for latest mode.",
        ),
    )

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert len(calls) == 1
    assert body["deliverable"]["content_structure"]["external_data_strategy"] == "latest"
    assert body["deliverable"]["content_structure"]["external_search_used"] is True


def test_external_search_persists_research_run_and_source_provenance(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.agents import host as host_module
    from app.services import sources as source_service

    payload = create_task_payload("Research provenance")
    payload["external_data_strategy"] = "supplemental"
    task = client.post("/api/v1/tasks", json=payload).json()

    monkeypatch.setattr(
        host_module,
        "search_external_sources",
        lambda query: [
            SearchResult(
                title="Public source",
                url="https://example.com/public-source",
                snippet="Public source",
            )
        ],
    )
    monkeypatch.setattr(
        source_service,
        "fetch_remote_source",
        lambda url: RemoteSourceContent(
            source_type="manual_url",
            source_url=url,
            title="Public source",
            content_type="text/html",
            normalized_text="External public source says implementation quality is the main bottleneck.",
        ),
    )

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert run_response.status_code == 200
    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert aggregate["research_runs"]
    assert aggregate["research_runs"][0]["source_count"] >= 1
    assert aggregate["research_runs"][0]["query"]
    assert aggregate["research_runs"][0]["research_depth"] in {
        "light_completion",
        "standard_investigation",
        "deep_research",
    }
    assert aggregate["research_runs"][0]["source_quality_summary"]
    assert aggregate["research_runs"][0]["citation_handoff_summary"]
    assert aggregate["research_runs"][0]["evidence_gap_focus"]
    assert any(item["research_run_id"] == aggregate["research_runs"][0]["id"] for item in aggregate["uploads"])
    deliverable = run_response.json()["deliverable"]
    assert deliverable["content_structure"]["external_data_usage"]["delegation_status"] in {
        "delegated",
        "satisfied_by_multi_agent",
        "not_needed",
    }
    assert "research_depth" in deliverable["content_structure"]["research_provenance"]


def test_continuous_writeback_creates_decision_and_outcome_records(
    client: TestClient,
) -> None:
    payload = create_task_payload("Continuous writeback")
    payload["external_data_strategy"] = "strict"
    payload["engagement_continuity_mode"] = "continuous"
    payload["writeback_depth"] = "full"
    task = client.post("/api/v1/tasks", json=payload).json()

    upload_response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("notes.txt", b"Margin is down while retention is stable and support load is rising.", "text/plain"))],
    )
    assert upload_response.status_code == 200

    first_run = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert first_run.status_code == 200
    first_aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert len(first_aggregate["decision_records"]) == 1
    assert len(first_aggregate["action_plans"]) == 1
    assert first_aggregate["action_executions"]
    assert first_aggregate["outcome_records"] == []
    assert first_aggregate["decision_records"][0]["function_type"] == "synthesize_brief"
    assert first_aggregate["decision_records"][0]["approval_status"] == "pending"
    assert first_aggregate["action_plans"][0]["action_type"] == "progression_action"
    assert first_aggregate["action_plans"][0]["approval_status"] == "pending"
    assert first_aggregate["audit_events"]
    assert first_aggregate["audit_events"][0]["event_type"] == "writeback_generated"

    follow_up_ingest = client.post(
        f"/api/v1/tasks/{task['id']}/sources",
        json={
            "urls": [],
            "pasted_text": "Follow-up note: support tickets are still rising after the first pricing test.",
            "pasted_title": "Follow-up outcome note",
        },
    )
    assert follow_up_ingest.status_code == 200

    second_run = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert second_run.status_code == 200
    second_aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert len(second_aggregate["decision_records"]) >= 2
    assert len(second_aggregate["outcome_records"]) >= 1
    assert second_aggregate["outcome_records"][0]["function_type"] == "synthesize_brief"
    assert second_aggregate["audit_events"]


def test_one_off_case_can_close_and_reopen_without_continuous_records(
    client: TestClient,
) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("One-off closure")).json()
    matter_id = task["matter_workspace"]["id"]

    upload_response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("closure.txt", b"One-off cases should support formal closure and reopen.", "text/plain"))],
    )
    assert upload_response.status_code == 200

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run_response.status_code == 200

    close_response = client.post(
        f"/api/v1/matters/{matter_id}/continuation",
        json={"action": "close"},
    )
    assert close_response.status_code == 200
    closed_workspace = close_response.json()
    assert closed_workspace["summary"]["status"] == "closed"
    assert closed_workspace["continuation_surface"]["current_state"] == "closed"
    assert closed_workspace["outcome_records"] == []

    blocked_run = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert blocked_run.status_code == 409
    assert "重新開啟" in blocked_run.json()["detail"]

    reopen_response = client.post(
        f"/api/v1/matters/{matter_id}/continuation",
        json={"action": "reopen"},
    )
    assert reopen_response.status_code == 200
    reopened_workspace = reopen_response.json()
    assert reopened_workspace["summary"]["status"] == "active"
    assert reopened_workspace["continuation_surface"]["can_reopen"] is False

    matter_follow_up = client.post(
        f"/api/v1/matters/{matter_id}/sources",
        json={
            "urls": [],
            "pasted_text": "Reopened one-off matter with one additional note.",
            "pasted_title": "Reopen note",
        },
    )
    assert matter_follow_up.status_code == 200


def test_follow_up_checkpoint_action_creates_lightweight_decision_record(
    client: TestClient,
) -> None:
    payload = create_task_payload("Follow-up checkpoint")
    payload["engagement_continuity_mode"] = "follow_up"
    payload["writeback_depth"] = "milestone"
    task = client.post("/api/v1/tasks", json=payload).json()
    matter_id = task["matter_workspace"]["id"]

    upload_response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("checkpoint.txt", b"Checkpoint cases should keep milestone writeback without full outcome loops.", "text/plain"))],
    )
    assert upload_response.status_code == 200
    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run_response.status_code == 200

    before_workspace = client.get(f"/api/v1/matters/{matter_id}").json()
    before_decision_count = len(before_workspace["decision_records"])
    assert before_workspace["continuation_surface"]["workflow_layer"] == "checkpoint"

    checkpoint_response = client.post(
        f"/api/v1/matters/{matter_id}/continuation",
        json={
            "action": "checkpoint",
            "summary": "Checkpoint：這輪只更新 milestone decision summary，不需要完整 outcome loop。",
        },
    )
    assert checkpoint_response.status_code == 200
    workspace = checkpoint_response.json()
    assert len(workspace["decision_records"]) == before_decision_count + 1
    assert workspace["outcome_records"] == []
    assert workspace["continuation_surface"]["checkpoint_enabled"] is True
    assert workspace["continuation_surface"]["outcome_logging_enabled"] is False
    assert workspace["decision_records"][0]["function_type"] == "checkpoint_update"
    assert workspace["decision_records"][0]["approval_status"] == "approved"
    assert workspace["audit_events"][0]["event_type"] == "continuation_action_applied"


def test_follow_up_surfaces_show_latest_previous_checkpoint_and_change_guidance(
    client: TestClient,
) -> None:
    primary_payload = create_task_payload("Follow-up cadence baseline")
    primary_payload.update(
        {
            "engagement_continuity_mode": "follow_up",
            "writeback_depth": "milestone",
            "client_name": "Northwind Studio",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Follow-up Sprint",
            "workstream_name": "渠道與報價調整",
            "decision_title": "Northwind follow-up decision",
            "judgment_to_make": "先判斷目前渠道與報價調整是否需要進一步修正。",
            "domain_lenses": ["營運", "銷售"],
        }
    )
    second_payload = create_task_payload("Follow-up checkpoint refresh")
    second_payload.update(
        {
            "engagement_continuity_mode": "follow_up",
            "writeback_depth": "milestone",
            "client_name": "Northwind Studio",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Northwind Follow-up Sprint",
            "workstream_name": "渠道與報價調整",
            "decision_title": "Northwind follow-up refresh",
            "judgment_to_make": "再判斷補件後是否需要調整報價結構與渠道優先順序。",
            "domain_lenses": ["營運", "銷售"],
        }
    )

    first_task = client.post("/api/v1/tasks", json=primary_payload).json()
    matter_id = first_task["matter_workspace"]["id"]
    first_upload = client.post(
        f"/api/v1/tasks/{first_task['id']}/uploads",
        files=[("files", ("follow-up-1.txt", b"Initial follow-up baseline with channel and pricing concerns.", "text/plain"))],
    )
    assert first_upload.status_code == 200
    first_run = client.post(f"/api/v1/tasks/{first_task['id']}/run")
    assert first_run.status_code == 200

    first_checkpoint_summary = "Checkpoint A：先維持主方案，但需追蹤報價與渠道效率。"
    first_checkpoint = client.post(
        f"/api/v1/matters/{matter_id}/continuation",
        json={
            "action": "checkpoint",
            "summary": first_checkpoint_summary,
            "note": "先確認下一輪補件是否足以調整報價節奏。",
        },
    )
    assert first_checkpoint.status_code == 200

    second_task = client.post("/api/v1/tasks", json=second_payload).json()
    second_upload = client.post(
        f"/api/v1/tasks/{second_task['id']}/uploads",
        files=[("files", ("follow-up-2.txt", b"Updated follow-up notes show channel mix improved while premium conversion still lags.", "text/plain"))],
    )
    assert second_upload.status_code == 200
    second_run = client.post(f"/api/v1/tasks/{second_task['id']}/run")
    assert second_run.status_code == 200
    second_deliverable_id = second_run.json()["deliverable"]["id"]

    second_checkpoint_summary = "Checkpoint B：這輪改成優先修正 premium 報價敘事，渠道主線先延續。"
    second_checkpoint = client.post(
        f"/api/v1/matters/{matter_id}/continuation",
        json={
            "action": "checkpoint",
            "summary": second_checkpoint_summary,
            "note": "下一輪 follow-up 先補 premium 轉換與定價反饋。",
        },
    )
    assert second_checkpoint.status_code == 200

    matter_workspace = client.get(f"/api/v1/matters/{matter_id}").json()
    task_aggregate = client.get(f"/api/v1/tasks/{second_task['id']}").json()
    deliverable_workspace = client.get(f"/api/v1/deliverables/{second_deliverable_id}").json()
    evidence_workspace = client.get(f"/api/v1/matters/{matter_id}/artifact-evidence").json()

    for payload in (
        matter_workspace["continuation_surface"],
        task_aggregate["continuation_surface"],
        deliverable_workspace["continuation_surface"],
        evidence_workspace["continuation_surface"],
    ):
        assert payload["workflow_layer"] == "checkpoint"
        assert payload["checkpoint_enabled"] is True
        assert payload["outcome_logging_enabled"] is False
        assert "回來更新" in payload["title"]
        assert "checkpoint" in payload["summary"]
        assert "完整長期追蹤" in payload["summary"]
        assert payload["follow_up_lane"]["latest_update"]["summary"] == second_checkpoint_summary
        assert payload["follow_up_lane"]["previous_checkpoint"]["summary"] == first_checkpoint_summary
        assert len(payload["follow_up_lane"]["recent_checkpoints"]) >= 2
        assert payload["follow_up_lane"]["what_changed"]
        assert payload["follow_up_lane"]["evidence_update_goal"]

    assert matter_workspace["outcome_records"] == []
    assert task_aggregate["outcome_records"] == []
    assert evidence_workspace["continuation_surface"]["follow_up_lane"]["next_follow_up_actions"]


def test_continuous_manual_outcome_logging_updates_progression_surface(
    client: TestClient,
) -> None:
    payload = create_task_payload("Continuous manual outcome")
    payload["external_data_strategy"] = "strict"
    payload["engagement_continuity_mode"] = "continuous"
    payload["writeback_depth"] = "full"
    task = client.post("/api/v1/tasks", json=payload).json()
    matter_id = task["matter_workspace"]["id"]

    upload_response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("progress.txt", b"Continuous cases should support progression and manual outcome logging.", "text/plain"))],
    )
    assert upload_response.status_code == 200
    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run_response.status_code == 200

    workspace_before = client.get(f"/api/v1/matters/{matter_id}").json()
    before_outcomes = len(workspace_before["outcome_records"])
    assert workspace_before["continuation_surface"]["workflow_layer"] == "progression"

    outcome_response = client.post(
        f"/api/v1/matters/{matter_id}/continuation",
        json={
            "action": "record_outcome",
            "summary": "第一輪建議已開始執行，但目前卡在跨部門 handoff。",
            "note": "需要回到 deliverable 調整下一步與 owner hint。",
            "action_status": "blocked",
        },
    )
    assert outcome_response.status_code == 200
    workspace_after = outcome_response.json()
    assert len(workspace_after["outcome_records"]) == before_outcomes + 1
    assert workspace_after["outcome_records"][0]["signal_type"] == "manual_outcome_log"
    assert workspace_after["outcome_records"][0]["function_type"] == "outcome_observation"
    assert "跨部門 handoff" in workspace_after["outcome_records"][0]["summary"]
    assert any(item["status"] == "blocked" for item in workspace_after["action_executions"])
    assert workspace_after["audit_events"][0]["event_type"] == "continuation_action_applied"
    progression_lane = workspace_after["continuation_surface"]["progression_lane"]
    assert progression_lane["latest_progression"]["summary"]
    assert progression_lane["what_changed"]
    assert progression_lane["action_states"]
    assert progression_lane["next_progression_actions"]
    assert progression_lane["evidence_update_goal"]


def test_task_writeback_approval_marks_pending_records_approved(
    client: TestClient,
) -> None:
    payload = create_task_payload("Wave 1 approval")
    payload["external_data_strategy"] = "strict"
    payload["engagement_continuity_mode"] = "continuous"
    payload["writeback_depth"] = "full"
    task = client.post("/api/v1/tasks", json=payload).json()

    upload_response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("approval.txt", b"Approval contract should distinguish generated writeback from formal confirmation.", "text/plain"))],
    )
    assert upload_response.status_code == 200

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run_response.status_code == 200
    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()

    decision_record = aggregate["decision_records"][0]
    action_plan = aggregate["action_plans"][0]
    assert decision_record["approval_status"] == "pending"
    assert action_plan["approval_status"] == "pending"

    approve_decision = client.post(
        f"/api/v1/tasks/{task['id']}/writeback-approval",
        json={"target_type": "decision_record", "target_id": decision_record["id"], "note": ""},
    )
    assert approve_decision.status_code == 200
    decision_approved = approve_decision.json()
    assert decision_approved["decision_records"][0]["approval_status"] == "approved"
    assert any(item["event_type"] == "approval_recorded" for item in decision_approved["audit_events"])

    approve_plan = client.post(
        f"/api/v1/tasks/{task['id']}/writeback-approval",
        json={"target_type": "action_plan", "target_id": action_plan["id"], "note": ""},
    )
    assert approve_plan.status_code == 200
    plan_approved = approve_plan.json()
    assert plan_approved["action_plans"][0]["approval_status"] == "approved"
    assert any(
        item["event_type"] == "approval_recorded" and item["action_plan_id"] == action_plan["id"]
        for item in plan_approved["audit_events"]
    )


def test_continuous_surfaces_show_latest_previous_progression_and_guidance(
    client: TestClient,
) -> None:
    payload = create_task_payload("Continuous progression surface")
    payload["external_data_strategy"] = "strict"
    payload["engagement_continuity_mode"] = "continuous"
    payload["writeback_depth"] = "full"
    task = client.post("/api/v1/tasks", json=payload).json()
    matter_id = task["matter_workspace"]["id"]

    upload_response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("progress.txt", b"Continuous progression should expose action state and outcome continuity.", "text/plain"))],
    )
    assert upload_response.status_code == 200
    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run_response.status_code == 200
    deliverable_id = run_response.json()["deliverable"]["id"]

    first_outcome = client.post(
        f"/api/v1/matters/{matter_id}/continuation",
        json={
            "action": "record_outcome",
            "summary": "第一輪 action 已啟動，但目前仍在跨部門協調中。",
            "note": "先補 owner 與 handoff 訊號。",
            "action_status": "in_progress",
        },
    )
    assert first_outcome.status_code == 200
    second_outcome = client.post(
        f"/api/v1/matters/{matter_id}/continuation",
        json={
            "action": "record_outcome",
            "summary": "第二輪 outcome 顯示主要阻塞已解除，可以考慮刷新 deliverable。",
            "note": "目前需要確認是否正式改寫下一步。",
            "action_status": "completed",
        },
    )
    assert second_outcome.status_code == 200

    matter_workspace = client.get(f"/api/v1/matters/{matter_id}").json()
    task_aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    evidence_workspace = client.get(f"/api/v1/matters/{matter_id}/artifact-evidence").json()
    deliverable_workspace = client.get(f"/api/v1/deliverables/{deliverable_id}").json()

    for payload in (
        matter_workspace["continuation_surface"],
        task_aggregate["continuation_surface"],
        evidence_workspace["continuation_surface"],
        deliverable_workspace["continuation_surface"],
    ):
        assert payload["workflow_layer"] == "progression"
        assert "持續推進" in payload["title"]
        assert "outcome" in payload["summary"]
        assert payload["follow_up_lane"] is None
        assert payload["progression_lane"]["latest_progression"]["summary"].startswith("第二輪 outcome")
        assert payload["progression_lane"]["previous_progression"]["summary"].startswith("第一輪 action")
        assert payload["progression_lane"]["what_changed"]
        assert payload["progression_lane"]["next_progression_actions"]

    assert evidence_workspace["continuation_surface"]["progression_lane"]["evidence_update_goal"]
    assert deliverable_workspace["continuation_surface"]["progression_lane"]["action_states"]
    assert deliverable_workspace["continuation_surface"]["progression_lane"]["outcome_signals"]


def test_matter_follow_up_sources_update_world_first(client: TestClient) -> None:
    task = client.post("/api/v1/tasks", json=create_task_payload("Matter follow-up world")).json()
    matter_id = task["matter_workspace"]["id"]

    response = client.post(
        f"/api/v1/matters/{matter_id}/sources",
        json={
            "urls": ["https://example.com/follow-up"],
            "pasted_text": "Follow-up note about channel performance and margin pressure.",
            "pasted_title": "Follow-up note",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["world_updated_first"] is True
    assert body["matter_workspace_id"] == matter_id
    assert body["world_update_summary"]

    refreshed_task = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert refreshed_task["case_world_state"]["supplement_count"] >= 1
    assert refreshed_task["case_world_state"]["last_supplement_summary"]


def test_multi_agent_with_insufficient_evidence_returns_explicit_uncertainty(
    client: TestClient,
) -> None:
    payload = create_multi_agent_payload("Multi-agent weak evidence")
    payload["background_text"] = ""
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert body["deliverable"]["content_structure"]["background_summary"]
    assert body["risks"]
    assert body["recommendations"]
    assert body["action_items"]


def test_multi_agent_still_uses_model_router(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.model_router.mock import MockModelProvider

    payload = create_multi_agent_payload("Router spy")
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("spy.txt", b"One strong evidence sentence for router spying.", "text/plain"))],
    )

    calls: list[str] = []
    original = MockModelProvider.generate_core_analysis

    def spy(self, request):  # noqa: ANN001
        calls.append(request.agent_id)
        return original(self, request)

    monkeypatch.setattr(MockModelProvider, "generate_core_analysis", spy)

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    assert set(calls) == {
        "strategy_business_analysis",
        "research_intelligence",
        "operations",
        "legal_risk",
    }
    assert len(calls) == 4


def test_document_restructuring_still_uses_model_router(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.model_router.mock import MockModelProvider

    task = client.post(
        "/api/v1/tasks",
        json=create_document_restructuring_payload("Document router spy"),
    ).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "outline.txt",
                    b"The draft needs a clearer opener, grouped findings, and a separate risk section.",
                    "text/plain",
                ),
            )
        ],
    )

    calls: list[str] = []
    original = MockModelProvider.generate_document_restructuring

    def spy(self, request):  # noqa: ANN001
        calls.append(request.task_title)
        return original(self, request)

    monkeypatch.setattr(MockModelProvider, "generate_document_restructuring", spy)

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    assert calls == ["Document router spy"]


def test_contract_review_still_uses_model_router(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.model_router.mock import MockModelProvider

    task = client.post(
        "/api/v1/tasks",
        json=create_contract_review_payload("Contract router spy"),
    ).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "contract.txt",
                    b"Termination rights are broad, liability language is uneven, and acceptance criteria are unclear.",
                    "text/plain",
                ),
            )
        ],
    )

    calls: list[str] = []
    original = MockModelProvider.generate_contract_review

    def spy(self, request):  # noqa: ANN001
        calls.append(request.task_title)
        return original(self, request)

    monkeypatch.setattr(MockModelProvider, "generate_contract_review", spy)

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    assert calls == ["Contract router spy"]


def test_host_remains_orchestration_center_for_multi_agent(
    client: TestClient,
) -> None:
    payload = create_multi_agent_payload("Host-centered multi-agent")
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 200
    body = response.json()
    assert body["run"]["agent_id"] == "host_orchestrator"
    assert body["run"]["flow_mode"] == "multi_agent"
    assert body["deliverable"]["content_structure"]["generated_by_agent"] == "host_orchestrator"


def test_factory_returns_openai_provider_when_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.core.config import settings
    from app.model_router.factory import get_model_provider
    from app.model_router.openai_provider import OpenAIModelProvider

    monkeypatch.setattr(settings, "model_provider", "openai")
    monkeypatch.setattr(settings, "openai_api_key", "test-key")
    monkeypatch.setattr(settings, "openai_model", "gpt-5.4")
    monkeypatch.setattr(settings, "openai_base_url", "https://api.openai.com/v1")
    monkeypatch.setattr(settings, "openai_timeout_seconds", 30)

    provider = get_model_provider()

    assert isinstance(provider, OpenAIModelProvider)


def test_factory_raises_when_openai_key_is_missing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.core.config import settings
    from app.model_router.factory import get_model_provider
    from app.model_router.base import ModelProviderError

    monkeypatch.setattr(settings, "model_provider", "openai")
    monkeypatch.setattr(settings, "openai_api_key", None)

    with pytest.raises(ModelProviderError):
        get_model_provider()


def test_openai_provider_parses_structured_response(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.model_router import openai_provider
    from app.model_router.base import ResearchSynthesisRequest
    from app.model_router.openai_provider import OpenAIModelProvider

    class FakeResponse:
        def __init__(self, payload: dict):
            self.payload = payload

        def read(self) -> bytes:
            return json.dumps(self.payload).encode("utf-8")

        def __enter__(self):  # noqa: ANN204
            return self

        def __exit__(self, exc_type, exc, tb):  # noqa: ANN001, ANN204
            return False

    def fake_urlopen(http_request, timeout):  # noqa: ANN001
        request_body = json.loads(http_request.data.decode("utf-8"))
        assert request_body["model"] == "gpt-5.4-mini"
        assert request_body["response_format"]["json_schema"]["name"] == "research_synthesis_output"
        assert timeout == 15
        return FakeResponse(
            {
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(
                                {
                                    "problem_definition": "Test problem",
                                    "background_summary": "Short summary",
                                    "findings": ["Finding one"],
                                    "risks": ["Risk one"],
                                    "recommendations": ["Recommendation one"],
                                    "action_items": ["Action one"],
                                    "missing_information": ["Missing item"],
                                }
                            )
                        }
                    }
                ]
            }
        )

    monkeypatch.setattr(openai_provider.request, "urlopen", fake_urlopen)
    provider = OpenAIModelProvider(
        api_key="test-key",
        model="gpt-5.4-mini",
        base_url="https://api.openai.com/v1",
        timeout_seconds=15,
    )

    result = provider.generate_research_synthesis(
        ResearchSynthesisRequest(
            task_title="Test task",
            task_description="Test description",
            background_text="Background",
            goals=["Goal"],
            constraints=["Constraint"],
            evidence=[{"id": "e1", "title": "Evidence", "content": "Useful evidence"}],
        )
    )

    assert result.findings == ["Finding one"]
    assert result.recommendations == ["Recommendation one"]


def test_research_intelligence_structured_schema_requires_every_property() -> None:
    from app.model_router.base import CoreAnalysisRequest
    from app.model_router.structured_tasks import build_core_analysis_spec

    spec = build_core_analysis_spec(
        CoreAnalysisRequest(
            agent_id="research_intelligence",
            task_title="Research schema test",
            task_description="Ensure the research schema is strict-provider compatible.",
            background_text="Minimal background",
            research_depth="standard_investigation",
            research_sub_questions=["What needs to be answered?"],
            evidence_gap_focus=["Which evidence gap blocks confidence?"],
        )
    )

    schema = spec.schema
    assert schema["type"] == "object"
    assert schema["additionalProperties"] is False
    assert set(schema["required"]) == set(schema["properties"].keys())
    assert "research_sub_questions" in schema["required"]
    assert "citation_handoff" in schema["required"]


def test_core_analysis_spec_defaults_to_traditional_chinese_output_instruction() -> None:
    from app.model_router.base import CoreAnalysisRequest
    from app.model_router.structured_tasks import build_core_analysis_spec

    spec = build_core_analysis_spec(
        CoreAnalysisRequest(
            agent_id="legal_risk",
            task_title="Language guardrail test",
            task_description="Ensure the default output language stays in Traditional Chinese.",
        )
    )

    assert "繁體中文" in spec.system_prompt
    assert "避免中英夾雜" in spec.system_prompt


def test_openai_provider_retries_once_after_timeout(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.model_router import openai_provider
    from app.model_router.base import ResearchSynthesisRequest
    from app.model_router.openai_provider import OpenAIModelProvider

    class FakeResponse:
        def __init__(self, payload: dict):
            self.payload = payload

        def read(self) -> bytes:
            return json.dumps(self.payload).encode("utf-8")

        def __enter__(self):  # noqa: ANN204
            return self

        def __exit__(self, exc_type, exc, tb):  # noqa: ANN001, ANN204
            return False

    attempts: list[int] = []

    def fake_urlopen(http_request, timeout):  # noqa: ANN001
        attempts.append(timeout)
        if len(attempts) == 1:
            raise TimeoutError("The read operation timed out")
        return FakeResponse(
            {
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(
                                {
                                    "problem_definition": "Retry test",
                                    "background_summary": "Retried successfully",
                                    "findings": ["Recovered finding"],
                                    "risks": ["Recovered risk"],
                                    "recommendations": ["Recovered recommendation"],
                                    "action_items": ["Recovered action"],
                                    "missing_information": [],
                                }
                            )
                        }
                    }
                ]
            }
        )

    monkeypatch.setattr(openai_provider.request, "urlopen", fake_urlopen)
    provider = OpenAIModelProvider(
        api_key="test-key",
        model="gpt-5.4",
        base_url="https://api.openai.com/v1",
        timeout_seconds=60,
    )

    result = provider.generate_research_synthesis(
        ResearchSynthesisRequest(
            task_title="Retry timeout task",
            task_description="Retry timeout description",
            background_text="Background",
            goals=["Goal"],
            constraints=["Constraint"],
            evidence=[{"id": "e1", "title": "Evidence", "content": "Useful evidence"}],
        )
    )

    assert attempts == [60, 120]
    assert result.findings == ["Recovered finding"]


def test_openai_provider_retries_once_after_parse_body_400_when_local_body_is_valid(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from urllib import error

    from app.model_router import openai_provider
    from app.model_router.base import CoreAnalysisRequest
    from app.model_router.openai_provider import OpenAIModelProvider

    class FakeResponse:
        def __init__(self, payload: dict):
            self.payload = payload

        def read(self) -> bytes:
            return json.dumps(self.payload).encode("utf-8")

        def __enter__(self):  # noqa: ANN204
            return self

        def __exit__(self, exc_type, exc, tb):  # noqa: ANN001, ANN204
            return False

    class FakeHTTPError(error.HTTPError):
        def __init__(self, body: str):
            super().__init__(
                url="https://api.openai.com/v1/chat/completions",
                code=400,
                msg="Bad Request",
                hdrs=None,
                fp=None,
            )
            self._body = body

        def read(self) -> bytes:
            return self._body.encode("utf-8")

    attempts: list[int] = []

    def fake_urlopen(http_request, timeout):  # noqa: ANN001
        request_body = json.loads(http_request.data.decode("utf-8"))
        attempts.append(timeout)
        if len(attempts) == 1:
            assert request_body["response_format"]["json_schema"]["name"] == "finance_capital_core_output"
            raise FakeHTTPError(
                json.dumps(
                    {
                        "error": {
                            "message": (
                                "We could not parse the JSON body of your request. "
                                "(HINT: This likely means you aren't using your HTTP library correctly. "
                                "The OpenAI API expects a JSON payload, but what was sent was not valid JSON.)"
                            ),
                            "type": "invalid_request_error",
                            "param": None,
                            "code": None,
                        }
                    }
                )
            )
        return FakeResponse(
            {
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(
                                {
                                    "findings": ["Finance finding"],
                                    "risks": ["Finance risk"],
                                    "recommendations": ["Finance recommendation"],
                                    "action_items": ["Finance action"],
                                    "missing_information": [],
                                }
                            )
                        }
                    }
                ]
            }
        )

    monkeypatch.setattr(openai_provider.request, "urlopen", fake_urlopen)
    provider = OpenAIModelProvider(
        api_key="test-key",
        model="gpt-5.4",
        base_url="https://api.openai.com/v1",
        timeout_seconds=60,
    )

    result = provider.generate_core_analysis(
        CoreAnalysisRequest(
            agent_id="finance_capital",
            task_title="Finance retry task",
            task_description="Finance retry description",
            background_text="Background",
            goals=["Goal"],
            constraints=["Constraint"],
            evidence=[{"id": "e1", "title": "Evidence", "content": "Useful evidence"}],
        )
    )

    assert attempts == [60, 120]
    assert result.findings == ["Finance finding"]


def test_specialist_run_fails_closed_when_model_provider_errors(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    payload = create_task_payload("Provider failure should fail closed")
    payload["external_data_strategy"] = "strict"
    task = client.post("/api/v1/tasks", json=payload).json()
    monkeypatch.setenv("MODEL_PROVIDER_FAILURE_MODE", "always_fail")

    response = client.post(f"/api/v1/tasks/{task['id']}/run")

    assert response.status_code == 503
    assert "Mock 模型供應器的失敗模式目前已啟用" in response.json()["detail"]

    refreshed = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert refreshed["status"] == "failed"
    assert refreshed["runs"][0]["status"] == "failed"
    assert refreshed["deliverables"] == []
