from __future__ import annotations

from urllib import error

from fastapi import HTTPException

from app.model_router.base import (
    AgentContractSynthesisRequest,
    ModelProviderError,
    PackContractSynthesisRequest,
    SearchResultContext,
)
from app.model_router.factory import get_model_provider
from app.services.external_search import SearchResult, search_external_sources
from app.workbench import schemas as workbench_schemas


def _humanize_identifier(value: str) -> str:
    text = value.strip().replace("_", " ")
    text = text.removesuffix(" pack").removesuffix(" agent")
    return " ".join(text.split())


def _first_non_empty_lines(value: str, *, limit: int = 3) -> list[str]:
    return [item.strip() for item in value.splitlines() if item.strip()][:limit]


def _build_agent_search_query(
    payload: workbench_schemas.AgentContractDraftRequest,
) -> str:
    capability_terms = [_humanize_identifier(item) for item in payload.supported_capabilities[:4]]
    domain_terms = [_humanize_identifier(item) for item in payload.relevant_domain_packs[:3]]
    industry_terms = [_humanize_identifier(item) for item in payload.relevant_industry_packs[:3]]
    role_terms = _first_non_empty_lines(payload.role_focus, limit=2)
    usage_terms = _first_non_empty_lines(payload.when_to_use, limit=2)

    parts = [
        payload.agent_name.strip(),
        payload.description.strip(),
        *capability_terms,
        *domain_terms,
        *industry_terms,
        *role_terms,
        *usage_terms,
        "consulting agent responsibilities evidence decision workflow",
    ]
    return " ".join(part for part in parts if part).strip()


def _build_pack_search_query(
    payload: workbench_schemas.PackContractDraftRequest,
) -> str:
    routing_terms = _first_non_empty_lines(payload.routing_keywords, limit=3)
    problem_terms = _first_non_empty_lines(payload.common_problem_patterns, limit=2)
    signal_terms = _first_non_empty_lines(payload.key_signals, limit=2)
    evidence_terms = _first_non_empty_lines(payload.evidence_expectations, limit=2)

    suffix = (
        "industry business model KPIs operating signals consulting"
        if payload.pack_type == "industry"
        else "functional consulting evidence decision patterns deliverables"
    )
    parts = [
        payload.pack_name.strip(),
        payload.description.strip(),
        payload.definition.strip(),
        *[_humanize_identifier(item) for item in payload.domain_lenses[:4]],
        *routing_terms,
        *problem_terms,
        *signal_terms,
        *evidence_terms,
        suffix,
    ]
    return " ".join(part for part in parts if part).strip()


def _run_external_search(query: str) -> tuple[list[SearchResult], list[str]]:
    if not query.strip():
        return [], ["這次沒有形成足夠清楚的搜尋查詢，因此草案只依賴最少輸入與模型補完。"]

    try:
        results = search_external_sources(query, max_results=3)
    except (error.URLError, TimeoutError, ValueError) as exc:
        return [], [f"外部搜尋暫時不可用，因此這次草案主要依賴使用者輸入與模型補完：{exc}"]
    except Exception as exc:  # noqa: BLE001
        return [], [f"外部搜尋暫時未能提供可用結果：{exc}"]

    if results:
        return results, []
    return [], ["外部搜尋沒有取回可用來源，因此這次草案主要依賴使用者輸入與模型補完。"]


def _serialize_sources(
    results: list[SearchResult],
) -> list[workbench_schemas.ExtensionSynthesisSourceResponse]:
    return [
        workbench_schemas.ExtensionSynthesisSourceResponse(
            title=item.title,
            url=item.url,
            snippet=item.snippet,
        )
        for item in results
    ]


def _build_agent_contract_draft(
    payload: workbench_schemas.AgentContractDraftRequest,
    search_query: str,
    search_results: list[SearchResult],
) -> tuple[
    workbench_schemas.AgentCatalogEntryUpdateRequest,
    str,
    list[str],
]:
    provider = get_model_provider()
    output = provider.generate_agent_contract_synthesis(
        AgentContractSynthesisRequest(
            agent_id=payload.agent_id,
            agent_name=payload.agent_name,
            agent_type=payload.agent_type,
            description=payload.description,
            supported_capabilities=payload.supported_capabilities,
            relevant_domain_packs=payload.relevant_domain_packs,
            relevant_industry_packs=payload.relevant_industry_packs,
            role_focus=payload.role_focus,
            input_focus=payload.input_focus,
            output_focus=payload.output_focus,
            when_to_use=payload.when_to_use,
            boundary_focus=payload.boundary_focus,
            search_query=search_query,
            search_results=[
                SearchResultContext(title=item.title, url=item.url, snippet=item.snippet)
                for item in search_results
            ],
        )
    )
    return workbench_schemas.AgentCatalogEntryUpdateRequest(
        agent_id=payload.agent_id,
        agent_name=payload.agent_name,
        agent_type=payload.agent_type,
        description=output.description,
        supported_capabilities=payload.supported_capabilities,
        relevant_domain_packs=payload.relevant_domain_packs,
        relevant_industry_packs=payload.relevant_industry_packs,
        primary_responsibilities=output.primary_responsibilities,
        out_of_scope=output.out_of_scope,
        defer_rules=output.defer_rules,
        preferred_execution_modes=output.preferred_execution_modes,
        input_requirements=output.input_requirements,
        minimum_evidence_readiness=output.minimum_evidence_readiness,
        required_context_fields=output.required_context_fields,
        output_contract=output.output_contract,
        produced_objects=output.produced_objects,
        deliverable_impact=output.deliverable_impact,
        writeback_expectations=output.writeback_expectations,
        invocation_rules=output.invocation_rules,
        escalation_rules=output.escalation_rules,
        handoff_targets=output.handoff_targets,
        evaluation_focus=output.evaluation_focus,
        failure_modes_to_watch=output.failure_modes_to_watch,
        trace_requirements=output.trace_requirements,
        version=payload.version,
        status=payload.status,
        is_custom=False,
    ), output.synthesis_summary, output.generation_notes


def _build_pack_contract_draft(
    payload: workbench_schemas.PackContractDraftRequest,
    search_query: str,
    search_results: list[SearchResult],
) -> tuple[
    workbench_schemas.PackCatalogEntryUpdateRequest,
    str,
    list[str],
]:
    provider = get_model_provider()
    output = provider.generate_pack_contract_synthesis(
        PackContractSynthesisRequest(
            pack_id=payload.pack_id,
            pack_type=payload.pack_type,
            pack_name=payload.pack_name,
            description=payload.description,
            definition=payload.definition,
            domain_lenses=payload.domain_lenses,
            routing_keywords=payload.routing_keywords,
            common_business_models=payload.common_business_models,
            common_problem_patterns=payload.common_problem_patterns,
            key_signals=payload.key_signals,
            evidence_expectations=payload.evidence_expectations,
            common_risks=payload.common_risks,
            search_query=search_query,
            search_results=[
                SearchResultContext(title=item.title, url=item.url, snippet=item.snippet)
                for item in search_results
            ],
        )
    )
    return workbench_schemas.PackCatalogEntryUpdateRequest(
        pack_id=payload.pack_id,
        pack_type=payload.pack_type,
        pack_name=payload.pack_name,
        description=output.description,
        domain_definition=output.domain_definition,
        industry_definition=output.industry_definition,
        common_business_models=output.common_business_models,
        common_problem_patterns=output.common_problem_patterns,
        stage_specific_heuristics=output.stage_specific_heuristics,
        key_kpis_or_operating_signals=output.key_kpis_or_operating_signals,
        key_kpis=output.key_kpis,
        domain_lenses=output.domain_lenses,
        relevant_client_types=output.relevant_client_types,
        relevant_client_stages=output.relevant_client_stages,
        default_decision_context_patterns=output.default_decision_context_patterns,
        evidence_expectations=output.evidence_expectations,
        risk_libraries=output.risk_libraries,
        common_risks=output.common_risks,
        decision_patterns=output.decision_patterns,
        deliverable_presets=output.deliverable_presets,
        recommendation_patterns=output.recommendation_patterns,
        routing_hints=output.routing_hints,
        pack_notes=output.pack_notes,
        scope_boundaries=output.scope_boundaries,
        pack_rationale=output.pack_rationale,
        version=payload.version,
        status=payload.status,
        override_rules=[],
        is_custom=False,
    ), output.synthesis_summary, output.generation_notes


def synthesize_agent_contract_draft(
    payload: workbench_schemas.AgentContractDraftRequest,
) -> workbench_schemas.AgentContractDraftResponse:
    search_query = _build_agent_search_query(payload)
    search_results, search_notes = _run_external_search(search_query)

    try:
        draft, synthesis_summary, generation_notes = _build_agent_contract_draft(
            payload,
            search_query,
            search_results,
        )
    except ModelProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return workbench_schemas.AgentContractDraftResponse(
        search_query=search_query,
        sources=_serialize_sources(search_results),
        synthesis_summary=synthesis_summary,
        generation_notes=[*generation_notes, *search_notes],
        draft=draft,
    )


def synthesize_pack_contract_draft(
    payload: workbench_schemas.PackContractDraftRequest,
) -> workbench_schemas.PackContractDraftResponse:
    search_query = _build_pack_search_query(payload)
    search_results, search_notes = _run_external_search(search_query)

    try:
        draft, synthesis_summary, generation_notes = _build_pack_contract_draft(
            payload,
            search_query,
            search_results,
        )
    except ModelProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return workbench_schemas.PackContractDraftResponse(
        search_query=search_query,
        sources=_serialize_sources(search_results),
        synthesis_summary=synthesis_summary,
        generation_notes=[*generation_notes, *search_notes],
        draft=draft,
    )
