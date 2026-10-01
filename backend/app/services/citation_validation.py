from __future__ import annotations

import re
import unicodedata

from app.model_router.base import CitedStatement, ModelProviderError


class CitationValidationError(ModelProviderError, ValueError):
    """Invalid source attribution must not be downgraded to a successful report."""


def normalize_quote(text: str) -> str:
    return " ".join(text.split())


def _numbers(text: str) -> set[str]:
    text = unicodedata.normalize("NFKC", text)
    return {number.replace(",", "") for number in re.findall(r"[+-]?\d[\d,]*(?:\.\d+)?%?", text)}


def validate_cited_statement(statement: CitedStatement, permitted_text: dict[str, str]) -> None:
    if statement.kind == "fact" and not statement.citations:
        raise CitationValidationError("Fact requires a permitted source")
    for citation in statement.citations:
        if citation.evidence_id not in permitted_text:
            raise CitationValidationError("Citation is outside the permitted evidence set")
        quote = normalize_quote(citation.quote)
        if not quote or quote not in normalize_quote(permitted_text[citation.evidence_id]):
            raise CitationValidationError("Citation quote is not present in the source")
    # This rejects invented literal numbers, not a proof of semantic entailment or arithmetic.
    if statement.kind == "fact":
        quoted_numbers = _numbers(" ".join(item.quote for item in statement.citations))
        if not _numbers(statement.text).issubset(quoted_numbers):
            raise CitationValidationError("Factual numbers must appear in the cited quotes")


def run_cited_analysis(generate, request, permitted_text: dict[str, str]):
    for attempt in range(2):
        try:
            output = generate(request)
            for name in ("findings", "risks", "recommendations"):
                for statement in getattr(output, name):
                    validate_cited_statement(statement, permitted_text)
            return output
        except ValueError as exc:
            if attempt:
                raise CitationValidationError("引用檢核未通過；未產出正式成果，請檢查來源後重試。") from exc
            request.repair_reason = str(exc)


def cited_output(output) -> dict[str, list[dict]]:
    return {name: [item.model_dump(mode="json") for item in getattr(output, name)]
            for name in ("findings", "risks", "recommendations")}
