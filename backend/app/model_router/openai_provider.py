from __future__ import annotations

import json
import logging
from typing import Any, TypeVar
from urllib import error, request

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

logger = logging.getLogger(__name__)

T = TypeVar(
    "T",
    ResearchSynthesisOutput,
    CoreAnalysisOutput,
    DocumentRestructuringOutput,
    ContractReviewOutput,
)

DEFAULT_LANGUAGE_INSTRUCTION = (
    "預設使用繁體中文輸出所有 problem_definition、background_summary、findings、risks、"
    "recommendations、action_items、missing_information 與其他欄位內容。"
    "只有在任務內容明確要求英文時，才改用英文。"
)


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


def _render_request_context(
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


def _extract_message_content(response_payload: dict[str, Any]) -> str:
    choices = response_payload.get("choices")
    if not isinstance(choices, list) or not choices:
        raise ModelProviderError("OpenAI provider 未回傳可用結果。")

    message = choices[0].get("message", {})
    refusal = message.get("refusal")
    if refusal:
        raise ModelProviderError(f"OpenAI provider 拒絕了這次請求：{refusal}")

    content = message.get("content")
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if not isinstance(item, dict):
                continue
            text = item.get("text")
            if isinstance(text, str):
                parts.append(text)
        if parts:
            return "".join(parts)

    raise ModelProviderError("OpenAI provider 回傳了不支援的內容格式。")


class OpenAIModelProvider(ModelProvider):
    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        base_url: str,
        timeout_seconds: int,
    ):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds

    def _request_structured_output(
        self,
        *,
        schema_name: str,
        schema: dict[str, Any],
        system_prompt: str,
        user_prompt: str,
        output_model: type[T],
    ) -> T:
        payload = {
            "model": self.model,
            "store": False,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": schema_name,
                    "strict": True,
                    "schema": schema,
                },
            },
        }

        http_request = request.Request(
            f"{self.base_url}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
            method="POST",
        )

        try:
            with request.urlopen(http_request, timeout=self.timeout_seconds) as response:
                raw_payload = json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            try:
                error_body = exc.read().decode("utf-8")
            except Exception:  # noqa: BLE001
                error_body = ""
            raise ModelProviderError(
                f"OpenAI provider 回傳 HTTP {exc.code}：{error_body or exc.reason}"
            ) from exc
        except error.URLError as exc:
            raise ModelProviderError(f"OpenAI provider 連線失敗：{exc.reason}") from exc
        except json.JSONDecodeError as exc:
            raise ModelProviderError("OpenAI provider 回傳了無效 JSON。") from exc

        try:
            parsed = json.loads(_extract_message_content(raw_payload))
        except json.JSONDecodeError as exc:
            raise ModelProviderError("OpenAI provider 沒有回傳有效的 JSON 內容。") from exc

        logger.info("OpenAI model provider returned structured output for schema=%s", schema_name)
        return output_model.model_validate(parsed)

    def generate_research_synthesis(
        self,
        request_payload: ResearchSynthesisRequest,
    ) -> ResearchSynthesisOutput:
        return self._request_structured_output(
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
                "你是 AI Advisory OS 的研究綜整代理。"
                "請只使用提供的任務脈絡與證據，不要編造事實。"
                "輸出要精簡、結構化，並明確標示不確定性。"
                + DEFAULT_LANGUAGE_INSTRUCTION
            ),
            user_prompt=_render_request_context(
                task_title=request_payload.task_title,
                task_description=request_payload.task_description,
                background_text=request_payload.background_text,
                goals=request_payload.goals,
                constraints=request_payload.constraints,
                evidence=request_payload.evidence,
            ),
            output_model=ResearchSynthesisOutput,
        )

    def generate_core_analysis(
        self,
        request_payload: CoreAnalysisRequest,
    ) -> CoreAnalysisOutput:
        role_prompt_by_agent = {
            "strategy_business_analysis": (
                "你是策略 / 商業分析代理。"
                "請聚焦在優先順序、決策框架、商業取捨與策略含義。"
            ),
            "market_research_insight": (
                "你是市場 / 研究洞察代理。"
                "請聚焦在市場訊號、客戶動態、外部證據與模式辨識。"
            ),
            "operations": (
                "你是營運代理。"
                "請聚焦在限制條件、可執行性、順序安排、執行依賴與營運風險。"
            ),
            "risk_challenge": (
                "你是風險 / 挑戰代理。"
                "請聚焦在挑戰假設、下行情境、證據缺口與失敗模式。"
            ),
        }

        return self._request_structured_output(
            schema_name=f"{request_payload.agent_id}_core_output",
            schema={
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "findings": _string_list_schema("Core findings from this perspective."),
                    "risks": _string_list_schema("Risks or challenge points from this perspective."),
                    "recommendations": _string_list_schema("Recommendations from this perspective."),
                    "action_items": _string_list_schema("Immediate actions from this perspective."),
                    "missing_information": _string_list_schema("Uncertainty or missing information."),
                },
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
                    "你是 AI Advisory OS 的核心分析代理。",
                )
                + " 請只使用提供的任務脈絡。輸出要精簡且結構化。"
                + DEFAULT_LANGUAGE_INSTRUCTION
            ),
            user_prompt=_render_request_context(
                task_title=request_payload.task_title,
                task_description=request_payload.task_description,
                background_text=request_payload.background_text,
                goals=request_payload.goals,
                constraints=request_payload.constraints,
                evidence=request_payload.evidence,
            ),
            output_model=CoreAnalysisOutput,
        )

    def generate_document_restructuring(
        self,
        request_payload: DocumentRestructuringRequest,
    ) -> DocumentRestructuringOutput:
        return self._request_structured_output(
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
                "你是 AI Advisory OS 的文件重構代理。"
                "請把素材重整成更清楚的內部交付物，並明確指出缺漏資料，不要假裝草稿已完整。"
                + DEFAULT_LANGUAGE_INSTRUCTION
            ),
            user_prompt=_render_request_context(
                task_title=request_payload.task_title,
                task_description=request_payload.task_description,
                background_text=request_payload.background_text,
                goals=request_payload.goals,
                constraints=request_payload.constraints,
                evidence=request_payload.evidence,
            ),
            output_model=DocumentRestructuringOutput,
        )

    def generate_contract_review(
        self,
        request_payload: ContractReviewRequest,
    ) -> ContractReviewOutput:
        return self._request_structured_output(
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
                "你是 AI Advisory OS 的合約審閱代理。"
                "請提供審慎的內部議題標記結果，而不是法律意見。"
                "只能使用提供的合約素材，並明確列出不確定性。"
                + DEFAULT_LANGUAGE_INSTRUCTION
            ),
            user_prompt=_render_request_context(
                task_title=request_payload.task_title,
                task_description=request_payload.task_description,
                background_text=request_payload.background_text,
                goals=request_payload.goals,
                constraints=request_payload.constraints,
                evidence=request_payload.evidence,
            ),
            output_model=ContractReviewOutput,
        )
