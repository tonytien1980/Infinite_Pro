from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
import json
from pathlib import Path


MANIFEST_PATH = Path(__file__).parent / "fixtures" / "consulting_cases.json"


def load_cases() -> list[dict]:
    assert MANIFEST_PATH.is_file(), "The approved seven-case fixture is missing"
    payload = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    assert payload["synthetic"] is True
    assert payload["schema_version"] == 1
    return payload["cases"]


def test_manifest_covers_approved_dimensions() -> None:
    cases = load_cases()
    assert [case["id"] for case in cases] == list(range(1, 8))
    assert {case["stage"] for case in cases} == {"startup", "institutionalization", "scaling"}
    assert {case["client_type"] for case in cases} == {"smb", "large_company_group", "personal_brand_service", "self_media"}
    assert {domain for case in cases for domain in case["domains"]} == {
        "operations", "finance", "business_development", "legal", "marketing", "sales", "strategy",
    }


def test_each_case_has_materials_and_three_distinct_acceptance_variants() -> None:
    for case in load_cases():
        assert case["title"] and case["question"] and case["facts"], case["id"]
        assert {variant["kind"] for variant in case["variants"]} == {"base", "supplement", "counterexample"}
        assert len(case["variants"]) == 3
        for variant in case["variants"]:
            assert variant["materials"] and variant["must_include"] and variant["must_not_claim"], (case["id"], variant["kind"])
            assert variant["expected_decision_conditions"]
            assert all(material["id"] and material["text"] for material in variant["materials"])
        texts = [json.dumps(variant["materials"]) for variant in case["variants"]]
        assert len(set(texts)) == 3, case["id"]


def test_financial_fixture_expectations_are_recomputable_without_eval() -> None:
    checked = 0
    for case in load_cases():
        for check in case.get("calculation_checks", []):
            values = [Decimal(value) for value in check["inputs"]]
            if check["operation"] == "subtract":
                actual = values[0] - sum(values[1:])
            elif check["operation"] == "divide":
                assert len(values) == 2 and values[1] != 0
                actual = values[0] / values[1]
            elif check["operation"] == "multiply":
                actual = Decimal(1)
                for value in values:
                    actual *= value
            else:
                raise AssertionError(f"Unsupported fixture operation: {check['operation']}")
            expected = Decimal(check["expected"])
            assert actual.quantize(expected, rounding=ROUND_HALF_UP) == expected, (case["id"], check)
            checked += 1
    assert checked >= 7
