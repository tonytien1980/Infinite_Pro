from __future__ import annotations

import re
from os import getenv

from app.model_router.base import (
    ContractReviewOutput,
    ContractReviewRequest,
    CoreAnalysisOutput,
    CoreAnalysisRequest,
    DocumentRestructuringOutput,
    DocumentRestructuringRequest,
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

    def generate_core_analysis(
        self,
        request: CoreAnalysisRequest,
    ) -> CoreAnalysisOutput:
        if getenv("MODEL_PROVIDER_FAILURE_MODE", "").lower() == "always_fail":
            raise ModelProviderError(f"Mock model provider failed for core agent '{request.agent_id}'.")

        evidence_text = " ".join(
            _clean_text(str(item.get("content", ""))) for item in request.evidence if item.get("content")
        )
        corpus = _clean_text(" ".join(filter(None, [request.background_text, evidence_text])))
        sentences = _split_sentences(corpus)
        findings = sentences[:2] if sentences else []

        missing_information: list[str] = []
        if not request.evidence:
            missing_information.append(
                f"{request.agent_id} received no uploaded evidence and had to rely on task context only."
            )
        if len(corpus) < 100:
            missing_information.append(
                f"{request.agent_id} did not have enough evidence depth for high-confidence analysis."
            )

        if request.agent_id == "strategy_business_analysis":
            if not findings:
                findings = [
                    "The strategy view could not produce strong findings because the evidence base is still thin.",
                ]
            recommendations = [
                "Prioritize the most decision-relevant themes and turn them into a short convergence brief.",
            ]
            action_items = [
                "Clarify which decision the task owner needs this analysis to support.",
            ]
            risks = [
                "Strategic risk: limited evidence may make prioritization unstable until more source material is added."
            ]
        elif request.agent_id == "market_research_insight":
            if not findings:
                findings = [
                    "The market insight view could not extract a strong external signal because the evidence set is still too thin.",
                ]
            recommendations = [
                "Highlight the strongest market-facing signals and separate them from internal assumptions.",
            ]
            action_items = [
                "Mark which findings are true market evidence versus internal interpretation before reuse.",
            ]
            risks = [
                "Signal risk: limited evidence may blur the line between observed market behavior and internal hypothesis."
            ]
        elif request.agent_id == "operations":
            if not findings:
                findings = [
                    "The operations view could not confirm a strong execution plan because the current evidence is too thin.",
                ]
            recommendations = [
                "Translate the current recommendation into a smaller set of execution-ready workstreams with explicit owners.",
            ]
            action_items = [
                "Identify the operational dependencies, owners, and sequencing before execution starts.",
                "Check each recommendation against delivery constraints before moving it into a plan.",
            ]
            risks = [
                "Operational risk: unclear sequencing or ownership could block execution even if the recommendation itself is sound."
            ]
        else:
            if not findings:
                findings = [
                    "The risk review could not identify strong challenge signals because evidence coverage is limited.",
                ]
            recommendations = [
                "Stress-test the current conclusions against evidence gaps before presenting them as final.",
            ]
            action_items = [
                "Document the main assumptions and confirm them with the task owner.",
            ]
            risks = [
                "Execution risk: weak evidence could hide downstream delivery or feasibility issues."
            ]

        return CoreAnalysisOutput(
            findings=findings,
            risks=risks,
            recommendations=recommendations,
            action_items=action_items,
            missing_information=missing_information,
        )

    def generate_document_restructuring(
        self,
        request: DocumentRestructuringRequest,
    ) -> DocumentRestructuringOutput:
        if getenv("MODEL_PROVIDER_FAILURE_MODE", "").lower() == "always_fail":
            raise ModelProviderError("Mock model provider failure mode is enabled.")

        evidence_text = " ".join(
            _clean_text(str(item.get("content", ""))) for item in request.evidence if item.get("content")
        )
        corpus = _clean_text(" ".join(filter(None, [request.background_text, evidence_text])))
        sentences = _split_sentences(corpus)
        findings = sentences[:3] if sentences else []

        if not findings:
            findings = [
                "The current material is not yet structured enough to infer a strong revised document flow.",
            ]

        background_summary = " ".join(sentences[:2]) if sentences else (
            request.background_text[:240] if request.background_text else "No draft background text was available."
        )
        primary_goal = request.goals[0] if request.goals else "produce a cleaner internal draft"
        missing_information: list[str] = []
        if not request.evidence:
            missing_information.append(
                "No uploaded draft document was available, so the restructuring suggestion relies on manual context only."
            )
        if len(corpus) < 140:
            missing_information.append(
                "The source material is thin; the proposed structure should be treated as a working outline rather than a final rewrite."
            )

        proposed_outline = [
            "1. Executive summary",
            "2. Context and objective",
            "3. Key findings",
            "4. Risks and considerations",
            "5. Recommended next steps",
        ]
        rewrite_guidance = [
            "Lead with the decision context before detailed evidence.",
            "Group overlapping points under a smaller set of section headers.",
            "Move assumptions and caveats into a dedicated risks section.",
        ]
        risks = [
            "Structure risk: a weak source draft may still hide gaps that should be resolved before external sharing.",
        ]
        recommendations = [
            f"Use the proposed outline to {primary_goal}.",
            "Rewrite repetitive passages into shorter evidence-backed sections.",
        ]
        action_items = [
            "Reorganize the current draft to match the proposed section order.",
            "Confirm which findings are strong enough to keep in the final version.",
        ]
        if missing_information:
            recommendations.append("Add a fuller source draft before treating this restructuring pass as final.")
            action_items.append("Upload the latest working draft so the next pass can restructure the real document content.")

        return DocumentRestructuringOutput(
            problem_definition=request.task_description or request.task_title,
            background_summary=background_summary,
            findings=findings,
            risks=risks,
            recommendations=recommendations,
            action_items=action_items,
            missing_information=missing_information,
            proposed_outline=proposed_outline,
            rewrite_guidance=rewrite_guidance,
        )

    def generate_contract_review(
        self,
        request: ContractReviewRequest,
    ) -> ContractReviewOutput:
        if getenv("MODEL_PROVIDER_FAILURE_MODE", "").lower() == "always_fail":
            raise ModelProviderError("Mock model provider failure mode is enabled.")

        evidence_text = " ".join(
            _clean_text(str(item.get("content", ""))) for item in request.evidence if item.get("content")
        )
        corpus = _clean_text(" ".join(filter(None, [request.background_text, evidence_text])))
        sentences = _split_sentences(corpus)
        findings = sentences[:3] if sentences else []

        if not findings:
            findings = [
                "The review did not find enough contract text to extract strong clause-level findings.",
            ]

        background_summary = " ".join(sentences[:2]) if sentences else (
            request.background_text[:240] if request.background_text else "No contract review background was available."
        )
        missing_information: list[str] = []
        if not request.evidence:
            missing_information.append(
                "No uploaded contract text was available, so the review relies on background context only."
            )
        if len(corpus) < 160:
            missing_information.append(
                "The available contract material is limited; this output should be treated as an issue-spotting draft, not a final legal review."
            )

        clauses_reviewed = [
            "scope and deliverables",
            "commercial terms",
            "termination and liability",
        ]
        risks = [
            "Contract risk: unclear obligations or missing protections could create downstream delivery or commercial exposure.",
        ]
        recommendations = [
            "Review the highest-risk clauses with counsel or the deal owner before external circulation.",
            "Clarify ambiguous obligations and acceptance criteria in the next draft.",
        ]
        action_items = [
            "Extract the clauses that control scope, liability, and termination into a short review checklist.",
            "Confirm which requested redlines are commercial versus legal before the next review pass.",
        ]
        if missing_information:
            recommendations.append("Upload the latest executable draft so the next pass can review the actual clause language.")
            action_items.append("Attach the current contract draft or key excerpts before relying on this review.")

        return ContractReviewOutput(
            problem_definition=request.task_description or request.task_title,
            background_summary=background_summary,
            findings=findings,
            risks=risks,
            recommendations=recommendations,
            action_items=action_items,
            missing_information=missing_information,
            clauses_reviewed=clauses_reviewed,
        )
