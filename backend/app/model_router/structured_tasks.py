from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from app.model_router.base import (
    ContractReviewOutput,
    ContractReviewRequest,
    CoreAnalysisOutput,
    CoreAnalysisRequest,
    DocumentRestructuringOutput,
    DocumentRestructuringRequest,
    ModelProviderError,
    ResearchSynthesisOutput,
    ResearchSynthesisRequest,
)

DEFAULT_LANGUAGE_INSTRUCTION = (
    "預設使用繁體中文輸出所有 problem_definition、background_summary、findings、risks、"
    "recommendations、action_items、missing_information 與其他欄位內容。"
    "只有在任務內容明確要求英文時，才改用英文。"
)


@dataclass(frozen=True)
class StructuredTaskSpec:
    schema_name: str
    schema: dict[str, Any]
    system_prompt: str
    user_prompt: str
    output_model: type[Any]


def _string_list_schema(description: str) -> dict[str, Any]:
    return {
        "type": "array",
        "description": description,
        "items": {"type": "string"},
    }


def _truncate(value: str, limit: int = 1600) -> str:
    if len(value) <= limit:
        return value
    return f"{value[:limit].rstrip()}..."


def render_request_context(
    *,
    task_title: str,
    task_description: str,
    background_text: str,
    goals: list[str],
    constraints: list[str],
    evidence: list[dict[str, Any]],
) -> str:
    evidence_blocks = []
    for index, item in enumerate(evidence, start=1):
        evidence_blocks.append(
            "\n".join(
                [
                    f"證據 {index}：",
                    f"- id: {item.get('id', '')}",
                    f"- title: {item.get('title', '')}",
                    f"- content: {_truncate(str(item.get('content', '')))}",
                ]
            )
        )

    return "\n\n".join(
        [
            f"任務標題：\n{task_title or '未命名任務'}",
            f"任務說明：\n{task_description or '目前未提供任務說明。'}",
            f"背景文字：\n{background_text or '目前未提供背景文字。'}",
            "目標：\n" + ("\n".join(f"- {goal}" for goal in goals) if goals else "- 目前未提供。"),
            "限制條件：\n"
            + ("\n".join(f"- {constraint}" for constraint in constraints) if constraints else "- 目前未提供。"),
            "證據：\n" + ("\n\n".join(evidence_blocks) if evidence_blocks else "目前未提供上傳證據。"),
        ]
    )


def build_research_synthesis_spec(
    request_payload: ResearchSynthesisRequest,
) -> StructuredTaskSpec:
    return StructuredTaskSpec(
        schema_name="research_synthesis_output",
        schema={
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "problem_definition": {"type": "string"},
                "background_summary": {"type": "string"},
                "findings": _string_list_schema("Evidence-grounded findings."),
                "risks": _string_list_schema("Risks, caveats, or concerns."),
                "recommendations": _string_list_schema("Concrete recommendations."),
                "action_items": _string_list_schema("Immediate next actions."),
                "missing_information": _string_list_schema(
                    "Explicit evidence gaps, uncertainty, or unanswered questions."
                ),
            },
            "required": [
                "problem_definition",
                "background_summary",
                "findings",
                "risks",
                "recommendations",
                "action_items",
                "missing_information",
            ],
        },
        system_prompt=(
            "你是 Infinite Pro 的研究綜整代理。"
            "請只使用提供的任務脈絡與證據，不要編造事實。"
            "輸出要像顧問交付草稿：先結論、後依據，建議要可執行，風險與缺漏資訊要明確。"
            + DEFAULT_LANGUAGE_INSTRUCTION
        ),
        user_prompt=render_request_context(
            task_title=request_payload.task_title,
            task_description=request_payload.task_description,
            background_text=request_payload.background_text,
            goals=request_payload.goals,
            constraints=request_payload.constraints,
            evidence=request_payload.evidence,
        ),
        output_model=ResearchSynthesisOutput,
    )


def build_core_analysis_spec(
    request_payload: CoreAnalysisRequest,
) -> StructuredTaskSpec:
    role_prompt_by_agent = {
        "strategy_business_analysis": (
            "你是策略 / 商業分析代理。"
            "請聚焦在優先順序、決策框架、商業取捨與策略含義。"
        ),
        "finance_capital": (
            "你是財務 / 資本代理。"
            "請聚焦在經濟性、現金流、單位經濟、資本配置、募資 readiness 與數字假設品質。"
        ),
        "market_research_insight": (
            "你是市場 / 研究洞察代理。"
            "請聚焦在市場訊號、客戶動態、外部證據與模式辨識。"
        ),
        "research_intelligence": (
            "你是研究 / 情報代理。"
            "請聚焦在外部發現、來源品質、證據缺口、矛盾訊號、新鮮度與不確定性 framing。"
        ),
        "legal_risk": (
            "你是法務 / 風險代理。"
            "請聚焦在法務邊界、合規責任、契約影響、法律曝險與 escalation 需求。"
        ),
        "operations": (
            "你是營運代理。"
            "請聚焦在限制條件、可執行性、順序安排、執行依賴與營運風險。"
        ),
        "marketing_growth": (
            "你是行銷 / 成長代理。"
            "請聚焦在定位、需求生成、訊息、受眾反應、渠道與 growth mechanism。"
        ),
        "sales_business_development": (
            "你是銷售 / 商務開發代理。"
            "請聚焦在 pipeline、商務動作、夥伴結構、商機開發與成交阻力。"
        ),
        "document_communication": (
            "你是文件 / 溝通代理。"
            "請聚焦在受眾、訊息結構、敘事順序、可讀性與交付物採納率。"
        ),
    }

    is_research_investigation = request_payload.agent_id == "research_intelligence"
    properties = {
        "findings": _string_list_schema("Core findings from this perspective."),
        "risks": _string_list_schema("Risks or challenge points from this perspective."),
        "recommendations": _string_list_schema("Recommendations from this perspective."),
        "action_items": _string_list_schema("Immediate actions from this perspective."),
        "missing_information": _string_list_schema("Uncertainty or missing information."),
    }
    if is_research_investigation:
        properties.update(
            {
                "research_sub_questions": _string_list_schema(
                    "The research sub-questions this investigation is explicitly trying to answer."
                ),
                "source_quality_notes": _string_list_schema(
                    "Notes on source quality, coverage, authority, or freshness."
                ),
                "contradiction_notes": _string_list_schema(
                    "Conflicting or unresolved signals that should be preserved."
                ),
                "evidence_gap_notes": _string_list_schema(
                    "High-impact evidence gaps that still block stronger conclusions."
                ),
                "citation_handoff": _string_list_schema(
                    "Citation-ready handoff notes for downstream reasoning or deliverable shaping."
                ),
            }
        )

    user_prompt = render_request_context(
        task_title=request_payload.task_title,
        task_description=request_payload.task_description,
        background_text=request_payload.background_text,
        goals=request_payload.goals,
        constraints=request_payload.constraints,
        evidence=request_payload.evidence,
    )
    if is_research_investigation:
        research_context_blocks = [
            "Research depth：\n" + (request_payload.research_depth or "standard_investigation"),
            "研究子問題：\n"
            + (
                "\n".join(f"- {item}" for item in request_payload.research_sub_questions)
                if request_payload.research_sub_questions
                else "- 目前未提供。"
            ),
            "高影響證據缺口：\n"
            + (
                "\n".join(f"- {item}" for item in request_payload.evidence_gap_focus)
                if request_payload.evidence_gap_focus
                else "- 目前未提供。"
            ),
        ]
        user_prompt = user_prompt + "\n\n" + "\n\n".join(research_context_blocks)

    return StructuredTaskSpec(
        schema_name=f"{request_payload.agent_id}_core_output",
        schema={
            "type": "object",
            "additionalProperties": False,
            "properties": properties,
            "required": [
                "findings",
                "risks",
                "recommendations",
                "action_items",
                "missing_information",
            ],
        },
        system_prompt=(
            role_prompt_by_agent.get(
                request_payload.agent_id,
                "你是 Infinite Pro 的核心分析代理。",
            )
            + " 請只使用提供的任務脈絡。輸出要精簡、結構化，且符合顧問式交付語氣：先判斷、後依據。"
            + DEFAULT_LANGUAGE_INSTRUCTION
        ),
        user_prompt=user_prompt,
        output_model=CoreAnalysisOutput,
    )


def build_document_restructuring_spec(
    request_payload: DocumentRestructuringRequest,
) -> StructuredTaskSpec:
    return StructuredTaskSpec(
        schema_name="document_restructuring_output",
        schema={
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "problem_definition": {"type": "string"},
                "background_summary": {"type": "string"},
                "findings": _string_list_schema("Issues in the current document structure."),
                "risks": _string_list_schema("Risks if the document remains unchanged."),
                "recommendations": _string_list_schema("Restructuring recommendations."),
                "action_items": _string_list_schema("Immediate rewrite or restructuring actions."),
                "missing_information": _string_list_schema("Gaps or uncertainty about the draft."),
                "proposed_outline": _string_list_schema("Suggested section outline."),
                "rewrite_guidance": _string_list_schema("Practical rewrite guidance."),
            },
            "required": [
                "problem_definition",
                "background_summary",
                "findings",
                "risks",
                "recommendations",
                "action_items",
                "missing_information",
                "proposed_outline",
                "rewrite_guidance",
            ],
        },
        system_prompt=(
            "你是 Infinite Pro 的文件重構代理。"
            "請把素材重整成更清楚的內部交付物，並明確指出缺漏資料，不要假裝草稿已完整。"
            "建議要可執行，輸出順序要先給重組判斷，再給結構依據。"
            + DEFAULT_LANGUAGE_INSTRUCTION
        ),
        user_prompt=render_request_context(
            task_title=request_payload.task_title,
            task_description=request_payload.task_description,
            background_text=request_payload.background_text,
            goals=request_payload.goals,
            constraints=request_payload.constraints,
            evidence=request_payload.evidence,
        ),
        output_model=DocumentRestructuringOutput,
    )


def build_contract_review_spec(
    request_payload: ContractReviewRequest,
) -> StructuredTaskSpec:
    return StructuredTaskSpec(
        schema_name="contract_review_output",
        schema={
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "problem_definition": {"type": "string"},
                "background_summary": {"type": "string"},
                "findings": _string_list_schema("Contract findings or flagged issues."),
                "risks": _string_list_schema("Contractual or commercial risks."),
                "recommendations": _string_list_schema("Recommended review or redline actions."),
                "action_items": _string_list_schema("Immediate next actions."),
                "missing_information": _string_list_schema("Unclear clauses or evidence gaps."),
                "clauses_reviewed": _string_list_schema("Clauses or issue areas reviewed."),
            },
            "required": [
                "problem_definition",
                "background_summary",
                "findings",
                "risks",
                "recommendations",
                "action_items",
                "missing_information",
                "clauses_reviewed",
            ],
        },
        system_prompt=(
            "你是 Infinite Pro 的合約審閱代理。"
            "請提供審慎的內部議題標記結果，而不是法律意見。"
            "只能使用提供的合約素材，並明確列出不確定性。"
            "請先給高風險判斷，再給 redline / 修改建議與待補資料。"
            + DEFAULT_LANGUAGE_INSTRUCTION
        ),
        user_prompt=render_request_context(
            task_title=request_payload.task_title,
            task_description=request_payload.task_description,
            background_text=request_payload.background_text,
            goals=request_payload.goals,
            constraints=request_payload.constraints,
            evidence=request_payload.evidence,
        ),
        output_model=ContractReviewOutput,
    )


def build_json_only_instruction(schema_name: str, schema: dict[str, Any]) -> str:
    return (
        "你必須只回傳單一 JSON 物件，不可包含 markdown、註解、額外說明或三引號。"
        f" JSON schema name: {schema_name}。"
        f" JSON schema: {json.dumps(schema, ensure_ascii=False)}"
    )


def extract_json_payload(text: str) -> dict[str, Any]:
    candidate = text.strip()
    if candidate.startswith("```"):
        candidate = candidate.strip("`")
        if candidate.startswith("json"):
            candidate = candidate[4:].lstrip()

    try:
        payload = json.loads(candidate)
        if isinstance(payload, dict):
            return payload
    except json.JSONDecodeError:
        pass

    start = candidate.find("{")
    end = candidate.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ModelProviderError("模型沒有回傳可解析的 JSON 物件。")

    try:
        payload = json.loads(candidate[start : end + 1])
    except json.JSONDecodeError as exc:
        raise ModelProviderError("模型回傳了無法解析的 JSON。") from exc

    if not isinstance(payload, dict):
        raise ModelProviderError("模型回傳的 JSON 內容不是物件格式。")
    return payload
