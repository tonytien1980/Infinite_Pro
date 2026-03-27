from __future__ import annotations

import json
import logging
from typing import Any
from urllib import error, request

from app.model_router.base import (
    ContractReviewRequest,
    CoreAnalysisRequest,
    DocumentRestructuringRequest,
    ModelProvider,
    ModelProviderError,
    ResearchSynthesisRequest,
)
from app.model_router.structured_tasks import (
    StructuredTaskSpec,
    build_contract_review_spec,
    build_core_analysis_spec,
    build_document_restructuring_spec,
    build_research_synthesis_spec,
)

logger = logging.getLogger(__name__)


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
        spec: StructuredTaskSpec,
    ) -> Any:
        payload = {
            "model": self.model,
            "store": False,
            "messages": [
                {"role": "system", "content": spec.system_prompt},
                {"role": "user", "content": spec.user_prompt},
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": spec.schema_name,
                    "strict": True,
                    "schema": spec.schema,
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

        logger.info("OpenAI model provider returned structured output for schema=%s", spec.schema_name)
        return spec.output_model.model_validate(parsed)

    def generate_research_synthesis(
        self,
        request_payload: ResearchSynthesisRequest,
    ) -> Any:
        return self._request_structured_output(
            spec=build_research_synthesis_spec(request_payload),
        )

    def generate_core_analysis(
        self,
        request_payload: CoreAnalysisRequest,
    ) -> Any:
        return self._request_structured_output(
            spec=build_core_analysis_spec(request_payload),
        )

    def generate_document_restructuring(
        self,
        request_payload: DocumentRestructuringRequest,
    ) -> Any:
        return self._request_structured_output(
            spec=build_document_restructuring_spec(request_payload),
        )

    def generate_contract_review(
        self,
        request_payload: ContractReviewRequest,
    ) -> Any:
        return self._request_structured_output(
            spec=build_contract_review_spec(request_payload),
        )
