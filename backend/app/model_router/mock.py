from __future__ import annotations

import re
from os import getenv

from app.model_router.base import (
    ModelProvider,
    ModelProviderError,
    ResearchSynthesisOutput,
    ResearchSynthesisRequest,
)


def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _split_sentences(text: str) -> list[str]:
    chunks = re.split(r"(?<=[.!?])\s+|\n+", text)
    return [chunk.strip(" -") for chunk in chunks if len(chunk.strip()) > 20]


class MockModelProvider(ModelProvider):
    """Deterministic local provider so the first MVP slice runs without external LLM credentials."""

    def generate_research_synthesis(
        self,
        request: ResearchSynthesisRequest,
    ) -> ResearchSynthesisOutput:
        if getenv("MODEL_PROVIDER_FAILURE_MODE", "").lower() == "always_fail":
            raise ModelProviderError("Mock model provider failure mode is enabled.")

        evidence_text = " ".join(
            _clean_text(str(item.get("content", ""))) for item in request.evidence if item.get("content")
        )
        corpus = _clean_text(" ".join(filter(None, [request.background_text, evidence_text])))
        sentences = _split_sentences(corpus)
        findings = sentences[:3] if sentences else []
        background_summary = " ".join(sentences[:2]) if sentences else (
            request.background_text[:240] if request.background_text else "No detailed background text was provided."
        )

        if not findings:
            findings = [
                "The current task has limited structured evidence, so the synthesis is grounded mostly in the provided brief.",
            ]

        missing_information: list[str] = []
        if len(request.evidence) == 0:
            missing_information.append("No uploaded source files were available, so the synthesis relies on manual background text only.")
        if len(corpus) < 120:
            missing_information.append("The evidence base is thin; adding more supporting documents would improve confidence.")
        if not request.goals:
            missing_information.append("No explicit success criteria were provided for the research synthesis.")

        risks = []
        if missing_information:
            risks.append("Coverage risk: the current deliverable may miss nuance because the supporting evidence is limited.")
        if request.constraints:
            risks.append(
                "Constraint risk: any recommendation should be checked against the provided delivery limits before reuse."
            )
        if not risks:
            risks.append("Interpretation risk: the synthesis still needs owner review before it is reused in client-facing material.")

        primary_goal = request.goals[0] if request.goals else "turn the collected material into a decision-ready synthesis"
        recommendations = [
            f"Use this synthesis as a structured brief to {primary_goal}.",
            "Validate the strongest findings against the original uploaded sources before publishing externally.",
        ]
        if missing_information:
            recommendations.append("Collect additional documents or notes to strengthen the next iteration of the synthesis.")

        action_items = [
            "Review the synthesized findings and mark which points should move into the next deliverable.",
            "Confirm any assumptions or missing data with the task owner before finalizing the report.",
        ]
        if request.evidence:
            action_items.append("Cross-check the highlighted findings against the uploaded files and keep the strongest citations.")
        else:
            action_items.append("Upload at least one supporting document so the next run can create stronger evidence-backed insights.")

        problem_definition = request.task_description or request.task_title
        return ResearchSynthesisOutput(
            problem_definition=problem_definition,
            background_summary=background_summary,
            findings=findings,
            risks=risks,
            recommendations=recommendations,
            action_items=action_items,
            missing_information=missing_information,
        )
