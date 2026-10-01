import pytest

from app.model_router import base


def statement(text="Revenue 120", kind="fact", evidence_id="own", quote="Revenue 120"):
    return base.CitedStatement(text=text, kind=kind, citations=[{"evidence_id": evidence_id, "quote": quote}])


def test_citation_contract_is_strict():
    assert hasattr(base, "CitedStatement"), "Provider output must carry per-statement citations"
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        base.CitedStatement(text=" ", kind="fact", citations=[])
    with pytest.raises(ValidationError):
        base.CitedStatement(text="ok", kind="fact", citations=[], trusted=True)


def test_citation_uses_permitted_source_and_verbatim_quote():
    from app.services.citation_validation import validate_cited_statement
    validate_cited_statement(statement(), {"own": "Revenue\n120\nCosts 90"})


@pytest.mark.parametrize("changes", [
    {"evidence_id": "other-consultant"}, {"evidence_id": "missing"},
    {"quote": "Revenue 999"}, {"quote": " "}, {"text": "Revenue 999"},
])
def test_invalid_citations_fail_closed(changes):
    from app.services.citation_validation import validate_cited_statement
    with pytest.raises(ValueError):
        validate_cited_statement(statement(**changes), {"own": "Revenue 120"})


def test_fact_requires_citation_but_explicit_assumption_does_not():
    from app.services.citation_validation import validate_cited_statement
    with pytest.raises(ValueError, match="Fact"):
        validate_cited_statement(base.CitedStatement(text="Profitable", kind="fact", citations=[]), {})
    validate_cited_statement(base.CitedStatement(text="Assume demand remains stable", kind="assumption", citations=[]), {})


def test_quote_presence_is_not_a_claim_of_semantic_entailment():
    from app.services.citation_validation import validate_cited_statement
    # Deliberate semantic counterexample: deterministic validation alone cannot certify this.
    validate_cited_statement(statement(text="Expansion is affordable", quote="Cash is constrained"), {"own": "Cash is constrained"})


def test_analysis_outputs_require_typed_statements_not_uncited_strings():
    from pydantic import ValidationError
    for model in (base.CoreAnalysisOutput, base.ResearchSynthesisOutput, base.ContractReviewOutput, base.DocumentRestructuringOutput):
        assert model.model_fields["findings"].annotation == list[base.CitedStatement]
    with pytest.raises(ValidationError):
        base.CoreAnalysisOutput(findings=["Made up"], risks=[], recommendations=[], action_items=[], missing_information=[])
    with pytest.raises(ValidationError):
        base.CoreAnalysisOutput(findings=[], risks=[], recommendations=[], action_items=[], missing_information=[], unauthorized="extra")


def test_analysis_mapping_keeps_each_statements_own_refs(client):
    from test_material_reprocessing import task_with_source
    from app.core.database import SessionLocal
    from app.agents.host import HostOrchestrator
    from app.agents.core.finance_capital import FinanceCapitalAgent
    from app.services.tasks import get_loaded_task
    from app.model_router.mock import MockModelProvider
    task, _ = task_with_source(client)
    with SessionLocal() as db:
        payload = HostOrchestrator(db).build_payload(get_loaded_task(db, task["id"]))
        permitted = payload.evidence[-1]
        class Exact(MockModelProvider):
            def generate_core_analysis(self, request):
                return base.CoreAnalysisOutput(
                    findings=[base.CitedStatement(text="ORIGINAL_TEXT", kind="fact", citations=[{"evidence_id": permitted.id, "quote": "ORIGINAL_TEXT"}])],
                    risks=[], recommendations=[], action_items=[], missing_information=[])
        result = FinanceCapitalAgent(Exact()).run(payload)
        assert result.insights[0].evidence_refs == [permitted.id]
        assert result.cited_statements["findings"][0]["citations"][0]["quote"] == "ORIGINAL_TEXT"


def test_assumptions_and_inferences_are_visible_in_public_text():
    assert base.CitedStatement(text="需求穩定", kind="assumption", citations=[]).display_text("zh-Hant") == "假設：需求穩定"
    assert base.CitedStatement(text="Demand may rise", kind="inference", citations=[]).display_text("en") == "Inference: Demand may rise"


@pytest.mark.parametrize("text,quote", [("收入999", "收入120"), ("USD999", "USD120"), ("收入９９９", "收入１２０")])
def test_chinese_attached_numbers_cannot_bypass_numeric_check(text, quote):
    from app.services.citation_validation import validate_cited_statement
    with pytest.raises(ValueError, match="numbers"):
        validate_cited_statement(statement(text=text, quote=quote), {"own": quote})


def test_invalid_analysis_gets_one_repair_then_fails_without_emptying_citations():
    from app.services.citation_validation import run_cited_analysis, CitationValidationError
    seen = []
    def invalid(request):
        seen.append(request.repair_reason)
        return base.CoreAnalysisOutput(findings=[statement(quote="invented")], risks=[], recommendations=[], action_items=[], missing_information=[])
    request = base.CoreAnalysisRequest(agent_id="finance_capital", task_title="test", task_description="")
    with pytest.raises(CitationValidationError):
        run_cited_analysis(invalid, request, {"own": "Revenue 120"})
    assert len(seen) == 2
    assert seen[1]


def test_repaired_analysis_keeps_correct_source():
    from app.services.citation_validation import run_cited_analysis
    def corrected(request):
        fact = statement(quote="wrong" if not request.repair_reason else "Revenue 120")
        return base.CoreAnalysisOutput(findings=[fact], risks=[], recommendations=[], action_items=[], missing_information=[])
    request = base.CoreAnalysisRequest(agent_id="finance_capital", task_title="test", task_description="")
    output = run_cited_analysis(corrected, request, {"own": "Revenue 120"})
    assert output.findings[0].citations[0].quote == "Revenue 120"


def test_exact_evidence_id_does_not_also_link_another_evidences_title(client):
    from test_material_reprocessing import task_with_source
    from app.core.database import SessionLocal
    from app.agents.host import HostOrchestrator
    from app.services.tasks import get_loaded_task
    task, _ = task_with_source(client)
    with SessionLocal() as db:
        host = HostOrchestrator(db)
        payload = host.build_payload(get_loaded_task(db, task["id"]))
        first, second = payload.evidence[:2]
        second.title = first.id
        assert host._resolve_evidence_ids(payload, [first.id]) == [first.id]
