from __future__ import annotations

import json
import logging
from typing import Any
from urllib import error, request

from app.model_router.base import (
    AgentContractSynthesisOutput,
    AgentContractSynthesisRequest,
    ContractReviewOutput,
    ContractReviewRequest,
    CoreAnalysisOutput,
    CoreAnalysisRequest,
    DocumentRestructuringOutput,
    DocumentRestructuringRequest,
    ModelProvider,
    ModelProviderError,
    PackContractSynthesisOutput,
    PackContractSynthesisRequest,
    ResearchSynthesisOutput,
    ResearchSynthesisRequest,
)
from app.model_router.structured_tasks import (
    StructuredTaskSpec,
    build_agent_contract_synthesis_spec,
    build_contract_review_spec,
    build_core_analysis_spec,
    build_document_restructuring_spec,
    build_json_only_instruction,
    build_pack_contract_synthesis_spec,
    build_research_synthesis_spec,
    extract_json_payload,
)

logger = logging.getLogger(__name__)

ANTHROPIC_VERSION = "2023-06-01"


def _messages_endpoint(base_url: str) -> str:
    normalized = base_url.rstrip("/")
    if normalized.endswith("/messages"):
        return normalized
    return f"{normalized}/messages"


def _extract_text_content(response_payload: dict[str, Any]) -> str:
    content = response_payload.get("content")
    if not isinstance(content, list) or not content:
        raise ModelProviderError("Anthropic provider 未回傳可用內容。")

    parts: list[str] = []
    for item in content:
        if not isinstance(item, dict):
            continue
        if item.get("type") == "text" and isinstance(item.get("text"), str):
            parts.append(item["text"])

    if parts:
        return "".join(parts)
    raise ModelProviderError("Anthropic provider 回傳了不支援的內容格式。")


class AnthropicModelProvider(ModelProvider):
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
        spec: StructuredTaskSpec,
    ) -> Any:
        payload = {
            "model": self.model,
            "max_tokens": 1800,
            "system": spec.system_prompt,
            "messages": [
                {
                    "role": "user",
                    "content": build_json_only_instruction(spec.schema_name, spec.schema)
                    + "\n\n"
                    + spec.user_prompt,
                }
            ],
        }

        http_request = request.Request(
            _messages_endpoint(self.base_url),
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": ANTHROPIC_VERSION,
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
                f"Anthropic provider 回傳 HTTP {exc.code}：{error_body or exc.reason}"
            ) from exc
        except error.URLError as exc:
            raise ModelProviderError(f"Anthropic provider 連線失敗：{exc.reason}") from exc
        except json.JSONDecodeError as exc:
            raise ModelProviderError("Anthropic provider 回傳了無效 JSON。") from exc

        parsed = extract_json_payload(_extract_text_content(raw_payload))
        logger.info("Anthropic model provider returned structured output for schema=%s", spec.schema_name)
        return spec.output_model.model_validate(parsed)

    def generate_research_synthesis(
        self,
        request_payload: ResearchSynthesisRequest,
    ) -> ResearchSynthesisOutput:
        return self._request_structured_output(spec=build_research_synthesis_spec(request_payload))

    def generate_core_analysis(
        self,
        request_payload: CoreAnalysisRequest,
    ) -> CoreAnalysisOutput:
        return self._request_structured_output(spec=build_core_analysis_spec(request_payload))

    def generate_document_restructuring(
        self,
        request_payload: DocumentRestructuringRequest,
    ) -> DocumentRestructuringOutput:
        return self._request_structured_output(spec=build_document_restructuring_spec(request_payload))

    def generate_contract_review(
        self,
        request_payload: ContractReviewRequest,
    ) -> ContractReviewOutput:
        return self._request_structured_output(spec=build_contract_review_spec(request_payload))

    def generate_agent_contract_synthesis(
        self,
        request_payload: AgentContractSynthesisRequest,
    ) -> AgentContractSynthesisOutput:
        return self._request_structured_output(spec=build_agent_contract_synthesis_spec(request_payload))

    def generate_pack_contract_synthesis(
        self,
        request_payload: PackContractSynthesisRequest,
    ) -> PackContractSynthesisOutput:
        return self._request_structured_output(spec=build_pack_contract_synthesis_spec(request_payload))
