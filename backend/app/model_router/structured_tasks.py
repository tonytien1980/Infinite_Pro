from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from app.model_router.base import (
    AgentContractSynthesisOutput,
    AgentContractSynthesisRequest,
    ContractReviewOutput,
    ContractReviewRequest,
    CoreAnalysisOutput,
    CoreAnalysisRequest,
    DocumentRestructuringOutput,
    DocumentRestructuringRequest,
    ModelProviderError,
    PackContractSynthesisOutput,
    PackContractSynthesisRequest,
    ResearchSynthesisOutput,
    ResearchSynthesisRequest,
)

def build_language_instruction(response_language: str) -> str:
    if response_language == "en":
        return (
            "Use English for all natural-language fields."
            " Keep terminology precise and consultant-facing."
        )
    return (
        "預設使用繁體中文輸出所有自然語言欄位內容，包含 problem_definition、background_summary、"
        "findings、risks、recommendations、action_items、missing_information 與其他說明文字。"
        "除非任務內容明確要求英文，否則不要用英文整句作為摘要、建議、風險或行動項目。"
        "若輸入資料是英文，可保留必要專有名詞、原始條款名稱或引用片段，但說明、結論與建議仍須寫成繁體中文。"
        "避免中英夾雜。"
    )

ALLOWED_AGENT_TYPES = ["reasoning", "specialist"]
ALLOWED_AGENT_CAPABILITIES = [
    "diagnose_assess",
    "decide_converge",
    "review_challenge",
    "synthesize_brief",
    "restructure_reframe",
    "plan_roadmap",
    "scenario_comparison",
    "risk_surfacing",
]
KNOWN_DOMAIN_PACK_IDS = [
    "operations_pack",
    "finance_fundraising_pack",
    "legal_risk_pack",
    "marketing_sales_pack",
    "business_development_pack",
    "research_intelligence_pack",
    "organization_people_pack",
    "product_service_pack",
]
KNOWN_INDUSTRY_PACK_IDS = [
    "online_education_pack",
    "ecommerce_pack",
    "gaming_pack",
    "funeral_services_pack",
    "health_supplements_pack",
    "energy_pack",
    "saas_pack",
    "media_creator_pack",
    "professional_services_pack",
    "manufacturing_pack",
    "healthcare_clinic_pack",
]
STANDARD_DOMAIN_LENSES = [
    "operations",
    "finance",
    "fundraising",
    "legal",
    "risk",
    "marketing",
    "sales",
    "business_development",
    "research",
    "intelligence",
    "organization",
    "people",
    "product",
    "service",
]


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
    precedent_context: list[str] | None = None,
    review_lens_context: list[str] | None = None,
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
            "可參考 precedent 模式：\n"
            + ("\n".join(f"- {item}" for item in precedent_context) if precedent_context else "- 目前沒有可安全引用的既有模式。"),
            "這輪先看哪幾點：\n"
            + ("\n".join(f"- {item}" for item in review_lens_context) if review_lens_context else "- 目前沒有額外 review lenses。"),
        ]
    )


def render_search_results_context(results: list[dict[str, Any]]) -> str:
    if not results:
        return "外部搜尋結果：\n目前沒有額外搜尋結果。"

    blocks: list[str] = []
    for index, item in enumerate(results, start=1):
        blocks.append(
            "\n".join(
                [
                    f"搜尋結果 {index}：",
                    f"- title: {item.get('title', '')}",
                    f"- url: {item.get('url', '')}",
                    f"- snippet: {_truncate(str(item.get('snippet', '')), limit=400)}",
                ]
            )
        )
    return "外部搜尋結果：\n" + "\n\n".join(blocks)


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
            + build_language_instruction(request_payload.response_language)
        ),
        user_prompt=render_request_context(
            task_title=request_payload.task_title,
            task_description=request_payload.task_description,
            background_text=request_payload.background_text,
            goals=request_payload.goals,
            constraints=request_payload.constraints,
            evidence=request_payload.evidence,
            precedent_context=request_payload.precedent_context,
            review_lens_context=request_payload.review_lens_context,
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
        precedent_context=request_payload.precedent_context,
        review_lens_context=request_payload.review_lens_context,
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

    required_fields = list(properties.keys())

    return StructuredTaskSpec(
        schema_name=f"{request_payload.agent_id}_core_output",
        schema={
            "type": "object",
            "additionalProperties": False,
            "properties": properties,
            "required": required_fields,
        },
        system_prompt=(
            role_prompt_by_agent.get(
                request_payload.agent_id,
                "你是 Infinite Pro 的核心分析代理。",
            )
            + " 請只使用提供的任務脈絡。輸出要精簡、結構化，且符合顧問式交付語氣：先判斷、後依據。"
            + build_language_instruction(request_payload.response_language)
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
            + build_language_instruction(request_payload.response_language)
        ),
        user_prompt=render_request_context(
            task_title=request_payload.task_title,
            task_description=request_payload.task_description,
            background_text=request_payload.background_text,
            goals=request_payload.goals,
            constraints=request_payload.constraints,
            evidence=request_payload.evidence,
            precedent_context=request_payload.precedent_context,
            review_lens_context=request_payload.review_lens_context,
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
                "obligations_identified": _string_list_schema("Obligations or commitments that should be tracked."),
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
                "obligations_identified",
            ],
        },
        system_prompt=(
            "你是 Infinite Pro 的合約審閱代理。"
            "請提供審慎的內部議題標記結果，而不是法律意見。"
            "只能使用提供的合約素材，並明確列出不確定性。"
            "請先給高風險判斷，再給 redline / 修改建議與待補資料。"
            + build_language_instruction(request_payload.response_language)
        ),
        user_prompt=render_request_context(
            task_title=request_payload.task_title,
            task_description=request_payload.task_description,
            background_text=request_payload.background_text,
            goals=request_payload.goals,
            constraints=request_payload.constraints,
            evidence=request_payload.evidence,
            precedent_context=request_payload.precedent_context,
            review_lens_context=request_payload.review_lens_context,
        ),
        output_model=ContractReviewOutput,
    )


def build_agent_contract_synthesis_spec(
    request_payload: AgentContractSynthesisRequest,
) -> StructuredTaskSpec:
    search_results = [item.model_dump(mode="json") for item in request_payload.search_results]
    schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "agent_type": {"type": "string", "enum": ALLOWED_AGENT_TYPES},
            "supported_capabilities": _string_list_schema("Supported capability ids."),
            "relevant_domain_packs": _string_list_schema("Relevant domain pack ids, if strongly coupled."),
            "relevant_industry_packs": _string_list_schema("Relevant industry pack ids, if strongly coupled."),
            "description": {"type": "string"},
            "primary_responsibilities": _string_list_schema("Primary responsibilities for this agent."),
            "out_of_scope": _string_list_schema("Explicit out-of-scope boundaries."),
            "defer_rules": _string_list_schema("Conditions where this agent should defer or stay conservative."),
            "preferred_execution_modes": _string_list_schema("Preferred execution modes."),
            "input_requirements": _string_list_schema("Inputs this agent expects."),
            "minimum_evidence_readiness": _string_list_schema("Minimum evidence readiness before strong use."),
            "required_context_fields": _string_list_schema("Context fields this agent depends on."),
            "output_contract": _string_list_schema("What this agent should output for Host."),
            "produced_objects": _string_list_schema("Ontology objects or output objects this agent tends to produce."),
            "deliverable_impact": _string_list_schema("How this agent changes deliverable shaping."),
            "writeback_expectations": _string_list_schema("What should be preserved in writeback."),
            "invocation_rules": _string_list_schema("When Host should invoke this agent."),
            "escalation_rules": _string_list_schema("When Host should escalate or defer instead."),
            "handoff_targets": _string_list_schema("Downstream handoff targets."),
            "evaluation_focus": _string_list_schema("How to evaluate whether this agent did a good job."),
            "failure_modes_to_watch": _string_list_schema("Common failure modes to watch."),
            "trace_requirements": _string_list_schema("Traceability requirements."),
            "synthesis_summary": {"type": "string"},
            "generation_notes": _string_list_schema("Notes about how this contract was generated or bounded."),
        },
    }
    schema["required"] = list(schema["properties"].keys())

    user_prompt = "\n\n".join(
        [
            "你正在為 Infinite Pro 生成一份正式 Agent contract 草案。",
            f"Agent ID：{request_payload.agent_id}",
            f"Agent 名稱：{request_payload.agent_name}",
            f"Agent 類型：{request_payload.agent_type}",
            f"一句話說明：{request_payload.description or '目前未提供。'}",
            "希望具備的能力：\n"
            + (
                "\n".join(f"- {item}" for item in request_payload.supported_capabilities)
                if request_payload.supported_capabilities
                else "- 目前未提供。"
            ),
            "相關問題面向模組包：\n"
            + (
                "\n".join(f"- {item}" for item in request_payload.relevant_domain_packs)
                if request_payload.relevant_domain_packs
                else "- 目前未提供。"
            ),
            "相關產業模組包：\n"
            + (
                "\n".join(f"- {item}" for item in request_payload.relevant_industry_packs)
                if request_payload.relevant_industry_packs
                else "- 目前未提供。"
            ),
            "允許使用的 agent_type：\n" + "\n".join(f"- {item}" for item in ALLOWED_AGENT_TYPES),
            "允許使用的 supported_capabilities：\n"
            + "\n".join(f"- {item}" for item in ALLOWED_AGENT_CAPABILITIES),
            "若真的需要填 relevant_domain_packs，請只從下列 IDs 中選擇；若這個 agent 預設應是通用型，就回傳空陣列：\n"
            + "\n".join(f"- {item}" for item in KNOWN_DOMAIN_PACK_IDS),
            "若真的需要填 relevant_industry_packs，請只從下列 IDs 中選擇；若這個 agent 預設應是跨產業通用型，就回傳空陣列：\n"
            + "\n".join(f"- {item}" for item in KNOWN_INDUSTRY_PACK_IDS),
            f"這個代理最擅長幫什麼：\n{request_payload.role_focus or '目前未提供。'}",
            f"它通常需要哪些輸入：\n{request_payload.input_focus or '目前未提供。'}",
            f"你希望它交出什麼結果：\n{request_payload.output_focus or '目前未提供。'}",
            f"什麼情況適合啟用它：\n{request_payload.when_to_use or '目前未提供。'}",
            f"已知邊界／不該做什麼：\n{request_payload.boundary_focus or '目前未提供。'}",
            f"外部搜尋查詢：\n{request_payload.search_query or '目前未提供。'}",
            render_search_results_context(search_results),
        ]
    )

    return StructuredTaskSpec(
        schema_name="agent_contract_synthesis_output",
        schema=schema,
        system_prompt=(
            "你是 Infinite Pro 的 Agent contract synthesizer。"
            "請根據使用者提供的最少輸入，加上外部搜尋結果，為單人顧問完整工作台生成一份正式 agent contract 草案。"
            "重要原則：Host 是唯一 orchestration center；agents 是能力模組，不是人格扮演；packs 是 context modules，不是 agents。"
            "使用者不需要先定義 capability、pack 綁定或 agent type；你應先推導這些欄位，再補完其餘 contract。"
            "除非這個 agent 明顯只屬於某個特殊 pack，否則 relevant_domain_packs / relevant_industry_packs 應優先維持空陣列。"
            "請把輸出寫成可直接進 registry 的正式規格，而不是行銷文案。"
            "請優先生成高訊號、可採用的短版 contract：description 保持單一精實段落，各 list 欄位盡量控制在 2-6 條，不要為了看起來完整而展開冗長百科式列舉。"
            "搜尋結果只能用來補強對產業、能力與常見風險的理解，不能編造成確定事實。"
            + build_language_instruction(request_payload.response_language)
        ),
        user_prompt=user_prompt,
        output_model=AgentContractSynthesisOutput,
    )


def build_pack_contract_synthesis_spec(
    request_payload: PackContractSynthesisRequest,
) -> StructuredTaskSpec:
    search_results = [item.model_dump(mode="json") for item in request_payload.search_results]
    stage_heuristics_schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "創業階段": {
                "type": "array",
                "items": {"type": "string"},
            },
            "制度化階段": {
                "type": "array",
                "items": {"type": "string"},
            },
            "規模化階段": {
                "type": "array",
                "items": {"type": "string"},
            },
        },
        "required": ["創業階段", "制度化階段", "規模化階段"],
    }
    schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "description": {"type": "string"},
            "domain_definition": {"type": "string"},
            "industry_definition": {"type": "string"},
            "common_business_models": _string_list_schema("Common business models if relevant."),
            "common_problem_patterns": _string_list_schema("Common problem patterns."),
            "stage_specific_heuristics": stage_heuristics_schema,
            "key_kpis_or_operating_signals": _string_list_schema("Key KPIs or operating signals."),
            "key_kpis": _string_list_schema("Key KPIs."),
            "domain_lenses": _string_list_schema("Domain lenses relevant to this pack."),
            "relevant_client_types": _string_list_schema("Relevant client types."),
            "relevant_client_stages": _string_list_schema("Relevant client stages."),
            "default_decision_context_patterns": _string_list_schema("Default decision-context patterns."),
            "evidence_expectations": _string_list_schema("Evidence expectations."),
            "risk_libraries": _string_list_schema("Risk library anchors."),
            "common_risks": _string_list_schema("Common risks."),
            "decision_patterns": _string_list_schema("Decision patterns."),
            "deliverable_presets": _string_list_schema("Deliverable presets."),
            "recommendation_patterns": _string_list_schema("Recommendation patterns."),
            "routing_hints": _string_list_schema("Routing hints."),
            "pack_notes": _string_list_schema("Pack notes."),
            "scope_boundaries": _string_list_schema("Scope boundaries."),
            "pack_rationale": _string_list_schema("Why this pack should exist independently."),
            "synthesis_summary": {"type": "string"},
            "generation_notes": _string_list_schema("Notes about how this contract was generated or bounded."),
        },
    }
    schema["required"] = list(schema["properties"].keys())

    user_prompt = "\n\n".join(
        [
            "你正在為 Infinite Pro 生成一份正式 Pack contract 草案。",
            f"Pack ID：{request_payload.pack_id}",
            f"Pack 名稱：{request_payload.pack_name}",
            f"Pack 類型：{request_payload.pack_type}",
            f"一句話說明：{request_payload.description or '目前未提供。'}",
            f"核心定義：\n{request_payload.definition or '目前未提供。'}",
            "標準 domain_lenses（若適用請優先使用這組）:\n"
            + "\n".join(f"- {item}" for item in STANDARD_DOMAIN_LENSES),
            "主要對應問題面向：\n"
            + (
                "\n".join(f"- {item}" for item in request_payload.domain_lenses)
                if request_payload.domain_lenses
                else "- 目前未提供。"
            ),
            f"常見提法 / 搜尋線索：\n{request_payload.routing_keywords or '目前未提供。'}",
            f"常見商業模式：\n{request_payload.common_business_models or '目前未提供。'}",
            f"常見問題型態：\n{request_payload.common_problem_patterns or '目前未提供。'}",
            f"關鍵指標 / 經營訊號：\n{request_payload.key_signals or '目前未提供。'}",
            f"通常需要哪些資料：\n{request_payload.evidence_expectations or '目前未提供。'}",
            f"常見風險或提醒：\n{request_payload.common_risks or '目前未提供。'}",
            f"外部搜尋查詢：\n{request_payload.search_query or '目前未提供。'}",
            render_search_results_context(search_results),
        ]
    )

    return StructuredTaskSpec(
        schema_name="pack_contract_synthesis_output",
        schema=schema,
        system_prompt=(
            "你是 Infinite Pro 的 Pack contract synthesizer。"
            "請根據使用者提供的最少輸入，加上外部搜尋結果，生成一份正式 pack contract 草案。"
            "重要原則：packs 是 structured context modules，不是 agents；要能影響 evidence expectations、decision patterns、deliverable presets 與 routing hints。"
            "若是 domain pack，重點是問題邊界與顧問工作模組；若是 industry pack，重點是商業模式、常見指標、產業限制與情境。"
            "請優先生成高訊號、可採用的短版 contract：definition / description 保持單一精實段落，各 list 欄位盡量控制在 2-6 條，不要為了看起來完整而展開冗長百科式列舉。"
            "搜尋結果只能用來補強常見問題、指標與情境，不可把模糊外部訊號包裝成高確定性事實。"
            + build_language_instruction(request_payload.response_language)
        ),
        user_prompt=user_prompt,
        output_model=PackContractSynthesisOutput,
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
