import json

import pytest

from app.model_router import base


def test_run_attempt_budget_exists_at_provider_boundary():
    assert hasattr(base, "analysis_budget"), "All attempts, including retries, need one run budget"


def test_attempt_and_deadline_limits_are_shared_but_not_cross_run(monkeypatch):
    from app.core.config import settings
    from app.model_router.base import analysis_budget, begin_provider_attempt, AnalysisBudgetError
    monkeypatch.setattr(settings, "analysis_max_attempts", 2)
    with analysis_budget() as budget:
        assert begin_provider_attempt(None, {}, 120) <= 90
        begin_provider_attempt(None, {}, 120)
        with pytest.raises(AnalysisBudgetError):
            begin_provider_attempt(None, {}, 120)
        assert budget.attempts == 2
    with analysis_budget() as budget:
        begin_provider_attempt(None, {}, 120)
        assert budget.attempts == 1
        budget.deadline = 0
        with pytest.raises(AnalysisBudgetError):
            begin_provider_attempt(None, {}, 120)


def test_unknown_context_capacity_and_oversized_wire_payload_fail_before_attempt(monkeypatch):
    from app.core.config import settings
    from app.model_router.base import analysis_budget, begin_provider_attempt, AnalysisBudgetError
    monkeypatch.setattr(settings, "model_context_window_tokens", {"tested": 10000})
    monkeypatch.setattr(settings, "analysis_output_tokens", 1000)
    with analysis_budget() as budget:
        with pytest.raises(AnalysisBudgetError, match="context"):
            begin_provider_attempt("unknown", {}, 10)
        with pytest.raises(AnalysisBudgetError, match="context"):
            begin_provider_attempt("tested", {"system": "繁" * 5000}, 10)
        assert budget.attempts == 0
        begin_provider_attempt("tested", {"system": "short"}, 10)
        assert budget.attempts == 1


@pytest.mark.parametrize("kind", ["openai", "anthropic", "gemini"])
def test_reading_transport_uses_real_adapter_with_synthetic_response(monkeypatch, kind):
    from importlib import import_module
    from app.core.config import settings
    from app.model_router.mock import MockModelProvider
    from app.model_router.base import analysis_budget
    module = import_module(f"app.model_router.{kind}_provider")
    provider_class = getattr(module, {"openai": "OpenAIModelProvider", "anthropic": "AnthropicModelProvider", "gemini": "GeminiModelProvider"}[kind])
    payload = base.EvidenceReadingRequest(evidence=[{"id": "a", "content": "Revenue 120"}])
    output = MockModelProvider().read_evidence(payload).model_dump_json()
    wire = {
        "openai": {"choices": [{"message": {"content": output}}]},
        "anthropic": {"content": [{"type": "text", "text": output}]},
        "gemini": {"candidates": [{"content": {"parts": [{"text": output}]}}]},
    }[kind]
    calls = []
    class Response:
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def read(self): return json.dumps(wire).encode()
    def urlopen(request, timeout):
        calls.append((json.loads(request.data), timeout))
        return Response()
    monkeypatch.setattr(module.request, "urlopen", urlopen)
    monkeypatch.setattr(settings, "model_context_window_tokens", {"tested": 40000})
    provider = provider_class(api_key="synthetic", model="tested", base_url="https://synthetic.invalid", timeout_seconds=180)
    with analysis_budget() as budget:
        result = provider.read_evidence(payload)
        assert budget.attempts == 1
    assert result.covered_evidence_ids == ["a"]
    assert calls[0][1] <= 90


@pytest.mark.parametrize("kind", ["openai", "anthropic", "gemini"])
def test_truncated_but_valid_json_response_is_not_accepted(monkeypatch, kind):
    from importlib import import_module
    from app.model_router.mock import MockModelProvider
    module = import_module(f"app.model_router.{kind}_provider")
    provider_class = getattr(module, {"openai": "OpenAIModelProvider", "anthropic": "AnthropicModelProvider", "gemini": "GeminiModelProvider"}[kind])
    payload = base.EvidenceReadingRequest(evidence=[{"id": "a", "content": "Revenue 120"}])
    output = MockModelProvider().read_evidence(payload).model_dump_json()
    wire = {
        "openai": {"choices": [{"finish_reason": "length", "message": {"content": output}}]},
        "anthropic": {"stop_reason": "max_tokens", "content": [{"type": "text", "text": output}]},
        "gemini": {"candidates": [{"finishReason": "MAX_TOKENS", "content": {"parts": [{"text": output}]}}]},
    }[kind]
    class Response:
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def read(self): return json.dumps(wire).encode()
    monkeypatch.setattr(module.request, "urlopen", lambda *args, **kwargs: Response())
    provider = provider_class(api_key="synthetic", model="tested", base_url="https://synthetic.invalid", timeout_seconds=10)
    with pytest.raises(base.ModelProviderError):
        provider.read_evidence(payload)


def test_openai_timeout_retry_counts_against_same_budget(monkeypatch):
    from app.model_router import openai_provider
    from app.core.config import settings
    from app.model_router.base import analysis_budget, AnalysisBudgetError
    calls = []
    def timeout(*args, **kwargs):
        calls.append(kwargs["timeout"])
        raise TimeoutError("synthetic timeout")
    monkeypatch.setattr(openai_provider.request, "urlopen", timeout)
    monkeypatch.setattr(settings, "model_context_window_tokens", {"tested": 40000})
    monkeypatch.setattr(settings, "analysis_max_attempts", 1)
    provider = openai_provider.OpenAIModelProvider(api_key="synthetic", model="tested", base_url="https://synthetic.invalid", timeout_seconds=60)
    with analysis_budget() as budget:
        with pytest.raises(AnalysisBudgetError):
            provider.read_evidence(base.EvidenceReadingRequest(evidence=[{"id": "a", "content": "test"}]))
        assert budget.attempts == 1
    assert len(calls) == 1


def test_compatible_provider_can_use_its_native_output_limit_parameter(monkeypatch):
    from app.model_router.openai_provider import OpenAIModelProvider
    provider = OpenAIModelProvider(api_key="synthetic", model="tested", base_url="https://synthetic.invalid", timeout_seconds=10, output_token_parameter="max_tokens")
    assert provider.output_token_parameter == "max_tokens"


def test_analysis_output_budget_does_not_change_unrelated_extension_calls():
    assert hasattr(base, "analysis_output_token_limit")
    assert base.analysis_output_token_limit() is None
    with base.analysis_budget():
        assert base.analysis_output_token_limit() == 8192


def test_run_budgets_do_not_leak_between_concurrent_requests():
    from concurrent.futures import ThreadPoolExecutor
    from threading import Barrier
    from app.model_router.base import analysis_budget, begin_provider_attempt
    barrier = Barrier(2)
    def run(count):
        with analysis_budget() as budget:
            barrier.wait(timeout=5)
            for _ in range(count):
                begin_provider_attempt(None, {}, 10)
            barrier.wait(timeout=5)
            return budget.attempts
    with ThreadPoolExecutor(max_workers=2) as executor:
        assert list(executor.map(run, [2, 3])) == [2, 3]
