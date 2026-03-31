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


def _sanitize_model_id(model_id: str) -> str:
    return model_id.removeprefix("models/")


def _extract_text_content(response_payload: dict[str, Any]) -> str:
    candidates = response_payload.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        raise ModelProviderError("Gemini provider 未回傳可用候選結果。")

    content = candidates[0].get("content", {})
    parts = content.get("parts")
    if not isinstance(parts, list) or not parts:
        raise ModelProviderError("Gemini provider 未回傳可解析內容。")

    text_parts: list[str] = []
    for item in parts:
        if not isinstance(item, dict):
            continue
        text = item.get("text")
        if isinstance(text, str):
            text_parts.append(text)

    if text_parts:
        return "".join(text_parts)
    raise ModelProviderError("Gemini provider 回傳了不支援的內容格式。")


class GeminiModelProvider(ModelProvider):
    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        base_url: str,
        timeout_seconds: int,
    ):
        self.api_key = api_key
        self.model = _sanitize_model_id(model)
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds

    def _request_structured_output(
        self,
        *,
        spec: StructuredTaskSpec,
    ) -> Any:
        endpoint = f"{self.base_url}/models/{self.model}:generateContent"
        payload = {
            "systemInstruction": {
                "parts": [{"text": spec.system_prompt}],
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": build_json_only_instruction(spec.schema_name, spec.schema)
                            + "\n\n"
                            + spec.user_prompt
                        }
                    ],
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.1,
            },
        }

        http_request = request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": self.api_key,
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
                f"Gemini provider 回傳 HTTP {exc.code}：{error_body or exc.reason}"
            ) from exc
        except error.URLError as exc:
            raise ModelProviderError(f"Gemini provider 連線失敗：{exc.reason}") from exc
        except json.JSONDecodeError as exc:
            raise ModelProviderError("Gemini provider 回傳了無效 JSON。") from exc

        parsed = extract_json_payload(_extract_text_content(raw_payload))
        logger.info("Gemini model provider returned structured output for schema=%s", spec.schema_name)
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
        return self._request_structured_output(
            spec=build_agent_contract_synthesis_spec(request_payload)
        )

    def generate_pack_contract_synthesis(
        self,
        request_payload: PackContractSynthesisRequest,
    ) -> PackContractSynthesisOutput:
        return self._request_structured_output(
            spec=build_pack_contract_synthesis_spec(request_payload)
        )
