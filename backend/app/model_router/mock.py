from __future__ import annotations

import re
from os import getenv

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


def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _split_sentences(text: str) -> list[str]:
    chunks = re.split(r"(?<=[.!?。！？])\s+|\n+", text)
    return [chunk.strip(" -") for chunk in chunks if len(chunk.strip()) > 20]


def _split_lines(text: str) -> list[str]:
    return [item.strip() for item in text.splitlines() if item.strip()]


def _unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys(item for item in values if item))


CAPABILITY_CONTEXT_FIELDS: dict[str, list[str]] = {
    "diagnose_assess": ["DecisionContext", "Evidence", "Goals", "Constraints"],
    "decide_converge": ["DecisionContext", "Options", "Constraints", "Evidence"],
    "review_challenge": ["Artifact", "DecisionContext", "Evidence"],
    "synthesize_brief": ["DecisionContext", "SourceMaterial", "Evidence"],
    "restructure_reframe": ["Artifact", "Audience", "DecisionContext"],
    "plan_roadmap": ["Goals", "Constraints", "Timeline", "DecisionContext"],
    "scenario_comparison": ["DecisionContext", "Options", "Evidence"],
    "risk_surfacing": ["DecisionContext", "Evidence", "Assumptions", "Constraints"],
}

CAPABILITY_OBJECTS: dict[str, list[str]] = {
    "diagnose_assess": ["Insight", "Risk", "Recommendation"],
    "decide_converge": ["Option", "Recommendation", "ActionItem"],
    "review_challenge": ["Risk", "Recommendation", "EvidenceGap"],
    "synthesize_brief": ["Insight", "Evidence", "EvidenceGap"],
    "restructure_reframe": ["Deliverable", "Recommendation"],
    "plan_roadmap": ["ActionItem", "Recommendation", "Timeline"],
    "scenario_comparison": ["Option", "Recommendation", "Risk"],
    "risk_surfacing": ["Risk", "EvidenceGap", "Recommendation"],
}


class MockModelProvider(ModelProvider):
    """Deterministic local provider so the first MVP slice runs without external LLM credentials."""

    def generate_research_synthesis(
        self,
        request: ResearchSynthesisRequest,
    ) -> ResearchSynthesisOutput:
        if getenv("MODEL_PROVIDER_FAILURE_MODE", "").lower() == "always_fail":
            raise ModelProviderError("Mock 模型供應器的失敗模式目前已啟用。")

        evidence_text = " ".join(
            _clean_text(str(item.get("content", ""))) for item in request.evidence if item.get("content")
        )
        corpus = _clean_text(" ".join(filter(None, [request.background_text, evidence_text])))
        sentences = _split_sentences(corpus)
        findings = sentences[:3] if sentences else []
        background_summary = " ".join(sentences[:2]) if sentences else (
            request.background_text[:240] if request.background_text else "目前尚未提供足夠完整的背景文字。"
        )

        if not findings:
            findings = [
                "目前結構化證據仍有限，因此這份綜整主要建立在既有簡述與背景資料之上。",
            ]

        missing_information: list[str] = []
        if len(request.evidence) == 0:
            missing_information.append("目前沒有可用的上傳來源檔案，這份綜整主要依賴手動背景文字。")
        if len(corpus) < 120:
            missing_information.append("目前證據基礎偏薄，若補充更多支持文件，結論可信度會更高。")
        if not request.goals:
            missing_information.append("這次研究綜整尚未提供明確的成功標準。")

        risks = []
        if missing_information:
            risks.append("覆蓋風險：由於支持證據有限，目前交付物可能遺漏細節或脈絡。")
        if request.constraints:
            risks.append("限制風險：所有建議都應先對照既有限制條件，再決定是否可直接採用。")
        if not risks:
            risks.append("解讀風險：這份綜整在轉作對外內容前，仍需由任務負責人再審視。")

        primary_goal = request.goals[0] if request.goals else "把目前資料整理成可供決策的綜整結果"
        recommendations = [
            f"先把這份綜整當成支撐「{primary_goal}」的內部工作簡報。",
            "在對外使用前，請先把最重要的發現回頭對照原始來源再次確認。",
        ]
        if missing_information:
            recommendations.append("請補充更多文件或筆記，提升下一輪綜整的完整度與可信度。")

        action_items = [
            "先檢查這次整理出的發現，標記哪些內容應保留進下一版交付物。",
            "在定稿前，先和任務負責人確認待補資料與關鍵假設。",
        ]
        if request.evidence:
            action_items.append("回頭比對上傳檔案中的關鍵段落，保留最有力的證據依據。")
        else:
            action_items.append("至少補上一份支持文件，讓下一輪綜整能建立在更扎實的證據上。")

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
            raise ModelProviderError(f"Mock 模型供應器在核心代理 '{request.agent_id}' 執行時失敗。")

        evidence_text = " ".join(
            _clean_text(str(item.get("content", ""))) for item in request.evidence if item.get("content")
        )
        corpus = _clean_text(" ".join(filter(None, [request.background_text, evidence_text])))
        sentences = _split_sentences(corpus)
        findings = sentences[:2] if sentences else []

        missing_information: list[str] = []
        if not request.evidence:
            missing_information.append(
                f"{request.agent_id} 沒有收到可用的上傳證據，只能依賴任務脈絡進行分析。"
            )
        if len(corpus) < 100:
            missing_information.append(
                f"{request.agent_id} 目前缺乏足夠證據厚度，難以形成高信心分析。"
            )

        research_sub_questions: list[str] = []
        source_quality_notes: list[str] = []
        contradiction_notes: list[str] = []
        evidence_gap_notes: list[str] = []
        citation_handoff: list[str] = []

        if request.agent_id == "strategy_business_analysis":
            if not findings:
                findings = [
                    "策略視角目前無法形成足夠強的發現，主因是證據基礎仍偏薄。",
                ]
            recommendations = [
                "先把最影響決策的主題排序，再整理成簡短的收斂簡報。",
            ]
            action_items = [
                "先釐清這份分析最終要支援哪一個決策。",
            ]
            risks = [
                "策略風險：在補入更多來源資料前，目前的優先順序仍可能變動。"
            ]
        elif request.agent_id == "finance_capital":
            if not findings:
                findings = [
                    "財務 / 資本視角目前仍缺乏足夠穩定的數字與假設，因此難以形成高信心判斷。",
                ]
            recommendations = [
                "先把最影響決策的財務假設、現金壓力與回收節奏獨立標示。",
            ]
            action_items = [
                "請先確認關鍵假設、現金流壓力與價格 / 投入邏輯是否一致。",
            ]
            risks = [
                "財務風險：若關鍵數字與假設未先校正，後續策略與行動排序都可能失真。"
            ]
        elif request.agent_id == "market_research_insight":
            if not findings:
                findings = [
                    "市場洞察視角目前無法抽出足夠強的外部訊號，因為證據集合仍偏薄。",
                ]
            recommendations = [
                "請把最強的市場訊號獨立標示，並和內部假設清楚區分。",
            ]
            action_items = [
                "在重用前，先標記哪些內容是真正市場證據，哪些只是內部推論。",
            ]
            risks = [
                "訊號風險：證據不足時，容易把外部市場事實與內部假設混在一起。"
            ]
        elif request.agent_id == "research_intelligence":
            if not findings:
                findings = [
                    "研究 / 情報視角目前仍缺乏足夠可靠的來源覆蓋，因此無法穩定辨識外部訊號與證據缺口。",
                ]
            recommendations = [
                "先把來源品質、時間新鮮度與仍待查證的缺口明確拆開。",
            ]
            action_items = [
                "在重用前，先標示哪些內容是高可信來源、哪些仍屬待驗證訊號。",
            ]
            risks = [
                "研究風險：若來源品質與新鮮度未先分級，後續很容易把弱訊號誤當成可採用事實。"
            ]
            research_sub_questions = request.research_sub_questions or [
                "這輪最值得先回答的外部研究問題是什麼",
                "哪些來源最能補上當前 evidence gap",
            ]
            source_quality_notes = [
                "請先區分高可信來源、一般公開來源與仍待驗證訊號。",
                f"目前 research depth 為 {request.research_depth or 'standard_investigation'}，來源覆蓋應和這個深度相稱。",
            ]
            contradiction_notes = [
                "若不同來源對同一結論方向不一致，請保留矛盾而不是強行收斂。",
            ]
            evidence_gap_notes = request.evidence_gap_focus or [
                "仍需標示哪些高影響缺口會阻止更強的結論。",
            ]
            citation_handoff = [
                "請保留可直接交給 Host 或 specialist 的來源摘要、用途與限制。",
            ]
        elif request.agent_id == "legal_risk":
            if not findings:
                findings = [
                    "法務 / 風險視角目前仍缺乏足夠完整的條款、責任與合規脈絡，因此無法形成高信心邊界判斷。",
                ]
            recommendations = [
                "先把法務邊界、責任分配與需要 escalation 的議題獨立標示。",
            ]
            action_items = [
                "在正式依賴結論前，請先補齊關鍵條款、法遵要求或需升級審閱的素材。",
            ]
            risks = [
                "法律風險：若權利義務與合規邊界未先釐清，後續商務或執行決策可能建立在錯誤前提上。"
            ]
        elif request.agent_id == "operations":
            if not findings:
                findings = [
                    "營運視角目前無法確認可執行的落地方案，因為現有證據仍不足。",
                ]
            recommendations = [
                "請把目前建議拆成更小的執行工作流，並為每段工作指定清楚責任。",
            ]
            action_items = [
                "在正式執行前，先確認依賴關係、負責人與執行順序。",
                "把每項建議都先對照交付限制，再納入行動計畫。",
            ]
            risks = [
                "營運風險：即使方向正確，若順序與責任不清，執行仍可能卡住。"
            ]
        elif request.agent_id == "marketing_growth":
            if not findings:
                findings = [
                    "行銷 / 成長視角目前仍缺乏足夠受眾與需求訊號，因此難以判斷最有效的獲客與訊息方向。",
                ]
            recommendations = [
                "先把最關鍵的受眾、訊息與成長機制拆開，再決定優先試哪一條路徑。",
            ]
            action_items = [
                "請先確認目前最值得放大的需求訊號與渠道假設是否一致。",
            ]
            risks = [
                "成長風險：若定位與訊息不清，就算投入渠道也可能放大低品質流量。"
            ]
        elif request.agent_id == "sales_business_development":
            if not findings:
                findings = [
                    "銷售 / 商務開發視角目前仍缺乏足夠的商機與合作脈絡，因此難以判斷最佳成交與拓展路徑。",
                ]
            recommendations = [
                "先把 pipeline、商務動作與夥伴結構拆開，再決定最值得推進的機會路徑。",
            ]
            action_items = [
                "請先釐清目前成交阻力、夥伴角色與下一步商務動作是否一致。",
            ]
            risks = [
                "商務風險：若成交路徑與夥伴結構不清，機會開發很容易停在表面接觸而無法轉成實際進展。"
            ]
        elif request.agent_id == "document_communication":
            if not findings:
                findings = [
                    "文件 / 溝通視角目前仍缺乏足夠明確的受眾與交付目的，因此無法穩定排出最佳敘事順序。",
                ]
            recommendations = [
                "先把受眾、主訊息與閱讀順序釐清，再重排文件結構。",
            ]
            action_items = [
                "請先確認這份交付物最終要說服誰、解決哪個決策問題。",
            ]
            risks = [
                "溝通風險：即使內容正確，若結構與訊息順序不對，交付物仍可能無法被採納。"
            ]
        else:
            if not findings:
                findings = [
                    "風險檢視視角目前無法提出足夠強的反證訊號，因為證據覆蓋仍有限。",
                ]
            recommendations = [
                "在把結論視為定案前，先用目前的證據缺口再次壓力測試。",
            ]
            action_items = [
                "請先把主要假設寫清楚，再和任務負責人逐一確認。",
            ]
            risks = [
                "執行風險：若證據過弱，後續可行性與落地問題可能被低估。"
            ]

        return CoreAnalysisOutput(
            findings=findings,
            risks=risks,
            recommendations=recommendations,
            action_items=action_items,
            missing_information=missing_information,
            research_sub_questions=research_sub_questions,
            source_quality_notes=source_quality_notes,
            contradiction_notes=contradiction_notes,
            evidence_gap_notes=evidence_gap_notes,
            citation_handoff=citation_handoff,
        )

    def generate_document_restructuring(
        self,
        request: DocumentRestructuringRequest,
    ) -> DocumentRestructuringOutput:
        if getenv("MODEL_PROVIDER_FAILURE_MODE", "").lower() == "always_fail":
            raise ModelProviderError("Mock 模型供應器的失敗模式目前已啟用。")

        evidence_text = " ".join(
            _clean_text(str(item.get("content", ""))) for item in request.evidence if item.get("content")
        )
        corpus = _clean_text(" ".join(filter(None, [request.background_text, evidence_text])))
        sentences = _split_sentences(corpus)
        findings = sentences[:3] if sentences else []

        if not findings:
            findings = [
                "目前素材結構仍不夠清楚，因此還無法穩定推導出更強的改寫架構。",
            ]

        background_summary = " ".join(sentences[:2]) if sentences else (
            request.background_text[:240] if request.background_text else "目前尚未提供足夠的草稿背景內容。"
        )
        primary_goal = request.goals[0] if request.goals else "整理出更清楚的內部版本"
        missing_information: list[str] = []
        if not request.evidence:
            missing_information.append(
                "目前沒有可用的上傳草稿，因此這次重構建議主要依賴手動背景脈絡。"
            )
        if len(corpus) < 140:
            missing_information.append(
                "目前來源素材仍偏薄，建議把這次產出的結構視為工作大綱，而非最終改寫版。"
            )

        proposed_outline = [
            "1. 執行摘要",
            "2. 背景與目標",
            "3. 主要發現",
            "4. 風險與考量",
            "5. 建議後續動作",
        ]
        rewrite_guidance = [
            "先交代決策脈絡，再進入細部證據。",
            "把重複內容收斂到更少的段落標題下。",
            "把假設與保留條件集中整理到獨立的風險段落。",
        ]
        risks = [
            "結構風險：若原始草稿本身太弱，仍可能隱藏對外分享前應先補齊的缺口。",
        ]
        recommendations = [
            f"先用這份建議大綱來支撐「{primary_goal}」。",
            "把重複段落改寫成更短、且能對應證據的章節。",
        ]
        action_items = [
            "先依照建議段落順序重組目前草稿。",
            "確認哪些發現足夠強，應保留在最終版本中。",
        ]
        if missing_information:
            recommendations.append("請先補上更完整的來源草稿，再把這次重構結果視為定稿依據。")
            action_items.append("請上傳最新工作版本，讓下一輪真正依據文件內容進行重構。")

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
            raise ModelProviderError("Mock 模型供應器的失敗模式目前已啟用。")

        evidence_text = " ".join(
            _clean_text(str(item.get("content", ""))) for item in request.evidence if item.get("content")
        )
        corpus = _clean_text(" ".join(filter(None, [request.background_text, evidence_text])))
        sentences = _split_sentences(corpus)
        findings = sentences[:3] if sentences else []

        if not findings:
            findings = [
                "目前可用的合約文字不足，還無法穩定抽出條款層級的強發現。",
            ]

        background_summary = " ".join(sentences[:2]) if sentences else (
            request.background_text[:240] if request.background_text else "目前尚未提供足夠的合約審閱背景。"
        )
        missing_information: list[str] = []
        if not request.evidence:
            missing_information.append(
                "目前沒有可用的上傳合約文字，因此這次審閱主要依賴背景脈絡。"
            )
        if len(corpus) < 160:
            missing_information.append(
                "目前可用的合約素材仍有限，這次輸出應視為議題標記草稿，而非最終法律審閱。"
            )

        clauses_reviewed = [
            "工作範圍與交付內容",
            "商務條件",
            "終止與責任",
        ]
        obligations_identified = [
            "應把驗收標準與交付義務寫清楚，避免履約範圍被單方擴張。",
            "應明確誰負責保密與資料處理義務，並補上違反時的 escalation 路徑。",
        ]
        risks = [
            "合約風險：若義務不清或保護條款不足，後續可能造成履約或商務曝險。",
        ]
        recommendations = [
            "在對外流轉前，先由法務或案件負責人再檢查高風險條款。",
            "在下一版草稿中釐清模糊義務與驗收標準。",
        ]
        action_items = [
            "把影響範圍、責任與終止的條款摘出來，整理成短版審閱清單。",
            "在下一輪審閱前，先區分哪些 redline 屬於商務調整、哪些屬於法律調整。",
        ]
        if missing_information:
            recommendations.append("請上傳最新可執行版本，讓下一輪能直接檢查實際條文內容。")
            action_items.append("在依賴這次審閱前，請補上目前合約草稿或關鍵條文摘錄。")

        return ContractReviewOutput(
            problem_definition=request.task_description or request.task_title,
            background_summary=background_summary,
            findings=findings,
            risks=risks,
            recommendations=recommendations,
            action_items=action_items,
            missing_information=missing_information,
            clauses_reviewed=clauses_reviewed,
            obligations_identified=obligations_identified,
        )

    def generate_agent_contract_synthesis(
        self,
        request: AgentContractSynthesisRequest,
    ) -> AgentContractSynthesisOutput:
        if getenv("MODEL_PROVIDER_FAILURE_MODE", "").lower() == "always_fail":
            raise ModelProviderError("Mock 模型供應器的失敗模式目前已啟用。")

        responsibility_lines = _split_lines(request.role_focus)
        input_lines = _split_lines(request.input_focus)
        output_lines = _split_lines(request.output_focus)
        usage_lines = _split_lines(request.when_to_use)
        boundary_lines = _split_lines(request.boundary_focus)
        source_titles = [item.title for item in request.search_results[:3]]

        required_context_fields = _unique(
            field
            for capability in request.supported_capabilities
            for field in CAPABILITY_CONTEXT_FIELDS.get(capability, ["DecisionContext", "Evidence"])
        ) or ["DecisionContext", "Evidence"]
        produced_objects = _unique(
            item
            for capability in request.supported_capabilities
            for item in CAPABILITY_OBJECTS.get(capability, ["Insight", "Recommendation"])
        ) or ["Insight", "Recommendation"]

        if request.agent_type == "host":
            preferred_execution_modes = ["host"]
            handoff_targets = ["Reasoning Agents", "Specialist Agents"]
        elif request.agent_type == "reasoning":
            preferred_execution_modes = ["multi_agent", "specialist"]
            handoff_targets = ["Host Agent", "Research Synthesis Specialist"]
        else:
            preferred_execution_modes = ["specialist", "multi_agent"]
            handoff_targets = ["Host Agent"]

        primary_responsibilities = responsibility_lines or [
            f"{request.agent_name} 會補上這個專業視角最重要的判斷與取捨。",
            "把自己的專業觀點整理成 Host 可直接採用的分析輸出。",
        ]
        out_of_scope = boundary_lines or [
            "不取代 Host 做最終收斂與拍板。",
            "不假裝超出自身證據基礎的高確定性結論。",
        ]
        input_requirements = input_lines or [
            "清楚的 DecisionContext 與至少一組可引用材料。",
            "能看出這輪要支援哪個判斷或交付物。",
        ]
        output_contract = output_lines or [
            "給出可採用的 findings、recommendations 與 missing information。",
            "保留仍待驗證的假設、限制與信心邊界。",
        ]
        invocation_rules = usage_lines or [
            "當 Host 需要這個專業視角補完判斷時啟用。",
        ]

        description = request.description.strip() or (
            f"{request.agent_name} 專責補上 {request.agent_type} 類代理應負責的分析與交接。"
        )
        generation_notes = [
            f"這份代理草案依賴最少輸入與 {len(request.search_results)} 筆外部搜尋結果補完。",
        ]
        if source_titles:
            generation_notes.append(f"Mock provider 參考了外部來源標題：{'、'.join(source_titles)}。")

        return AgentContractSynthesisOutput(
            agent_type=(
                "specialist"
                if any(
                    keyword in " ".join(
                        [request.agent_name, request.description, request.role_focus]
                    )
                    for keyword in ["審閱", "review", "重構", "rewrite", "專家", "specialist"]
                )
                else "reasoning"
            ),
            supported_capabilities=_unique(
                request.supported_capabilities
                or [
                    "synthesize_brief",
                    "diagnose_assess",
                ]
            ),
            relevant_domain_packs=_unique(request.relevant_domain_packs),
            relevant_industry_packs=_unique(request.relevant_industry_packs),
            description=description,
            primary_responsibilities=primary_responsibilities,
            out_of_scope=out_of_scope,
            defer_rules=[
                "當 DecisionContext 或材料仍偏薄時，先回報 evidence gap，不硬做結論。",
                "若缺少這個代理依賴的核心輸入，應先請 Host 補件或降級使用。",
            ],
            preferred_execution_modes=preferred_execution_modes,
            input_requirements=input_requirements,
            minimum_evidence_readiness=[
                "至少要有清楚的判斷問題與一份可引用材料。",
                "若要形成高信心結論，至少要能看出主要 evidence chain。",
            ],
            required_context_fields=required_context_fields,
            output_contract=output_contract,
            produced_objects=produced_objects,
            deliverable_impact=[
                f"{request.agent_name} 的輸出會直接影響 Host 如何塑造交付物主線與限制說明。",
            ],
            writeback_expectations=[
                "保留為何啟用這個代理、它補了哪些判斷、還缺哪些證據。",
            ],
            invocation_rules=invocation_rules,
            escalation_rules=[
                "當外部研究、權威來源或跨代理收斂需求升高時，先回到 Host 做治理決定。",
            ],
            handoff_targets=handoff_targets,
            evaluation_focus=[
                "是否真的補到這個代理應負責的判斷，而不是只做泛用摘要。",
                "輸出是否足夠讓 Host 直接採用或明確 defer。",
            ],
            failure_modes_to_watch=[
                "把弱訊號誤包裝成高確定性結論。",
                "輸出看起來完整，但沒有真正改善 Host 的判斷品質。",
            ],
            trace_requirements=[
                "需保留被選用原因、主要輸入、主要結論與仍待補的 evidence gap。",
            ],
            synthesis_summary=(
                f"已把 {request.agent_name} 補成正式 agent contract，聚焦在責任邊界、"
                "輸入輸出契約、handoff 與 trace 要求。"
            ),
            generation_notes=generation_notes,
        )

    def generate_pack_contract_synthesis(
        self,
        request: PackContractSynthesisRequest,
    ) -> PackContractSynthesisOutput:
        if getenv("MODEL_PROVIDER_FAILURE_MODE", "").lower() == "always_fail":
            raise ModelProviderError("Mock 模型供應器的失敗模式目前已啟用。")

        definition = request.definition.strip() or request.description.strip()
        problem_patterns = _split_lines(request.common_problem_patterns)
        key_signals = _split_lines(request.key_signals)
        evidence_expectations = _split_lines(request.evidence_expectations)
        common_risks = _split_lines(request.common_risks)
        business_models = _split_lines(request.common_business_models)
        source_titles = [item.title for item in request.search_results[:3]]

        if not problem_patterns:
            problem_patterns = [f"{request.pack_name} 相關案件目前仍需補更多典型問題型態。"]
        if not key_signals:
            key_signals = ["需要至少一組能反映健康度、風險或進展的核心經營訊號。"]
        if not evidence_expectations:
            evidence_expectations = ["至少要有可引用材料、背景脈絡與支撐判斷的 evidence chain。"]
        if not common_risks:
            common_risks = ["若缺少明確脈絡，容易把這類案件錯當成泛用問題處理。"]

        domain_definition = definition if request.pack_type == "domain" else ""
        industry_definition = definition if request.pack_type == "industry" else ""
        if request.pack_type == "industry" and not business_models:
            business_models = ["主要商業模式仍待補充，但已先建立這個產業脈絡。"]

        generation_notes = [
            f"這份模組包草案依賴最少輸入與 {len(request.search_results)} 筆外部搜尋結果補完。",
        ]
        if source_titles:
            generation_notes.append(f"Mock provider 參考了外部來源標題：{'、'.join(source_titles)}。")

        return PackContractSynthesisOutput(
            description=request.description.strip()
            or f"{request.pack_name} 提供這類案件的核心 context、證據與決策引導。",
            domain_definition=domain_definition,
            industry_definition=industry_definition,
            common_business_models=business_models if request.pack_type == "industry" else [],
            common_problem_patterns=problem_patterns,
            stage_specific_heuristics={
                "創業階段": ["先檢查核心假設是否成立，避免過早擴張流程。"],
                "制度化階段": ["優先檢查流程、角色與資料是否開始脫節。"],
                "規模化階段": ["優先檢查治理、風險與複雜度是否已超出舊作法。"],
            },
            key_kpis_or_operating_signals=key_signals,
            key_kpis=key_signals,
            domain_lenses=request.domain_lenses or (["綜合"] if request.pack_type == "industry" else []),
            relevant_client_types=["中小企業", "個人品牌與服務", "自媒體", "大型企業"],
            relevant_client_stages=["創業階段", "制度化階段", "規模化階段"],
            default_decision_context_patterns=[
                f"這輪是否應優先處理 {request.pack_name} 相關的核心問題",
                "應該先補哪些證據，才能做更高信心的判斷",
            ],
            evidence_expectations=evidence_expectations,
            risk_libraries=[
                f"{request.pack_name} 特有的執行風險與誤判風險",
            ],
            common_risks=common_risks,
            decision_patterns=[
                f"是否該優先處理：{item}" for item in problem_patterns[:4]
            ],
            deliverable_presets=[
                f"{request.pack_name} 評估備忘",
                f"{request.pack_name} 決策簡報",
            ],
            recommendation_patterns=[
                "先處理最影響決策品質的 evidence gap，再收斂動作排序。",
                "把專屬脈絡拉回 Host 的主線，而不是讓 pack 自成平行結論。",
            ],
            routing_hints=_unique(
                [request.pack_name.strip(), *_split_lines(request.routing_keywords), *request.domain_lenses]
            ),
            pack_notes=[
                "這份草案已可直接進 registry；若要調整細節，請切到完整模式微調。",
            ],
            scope_boundaries=[
                "不取代 Host 做跨 pack 收斂與最終取捨。",
                f"{request.pack_name} 應聚焦在自己的 context module，而不是吞掉所有案件語境。",
            ],
            pack_rationale=[
                f"{request.pack_name} 需要獨立存在，因為它的 evidence、decision 與 deliverable pattern 不應被泛化。",
                "若只留下名稱，Host 很難把它當成真正可用的 context module。",
            ],
            synthesis_summary=(
                f"已把 {request.pack_name} 補成正式 pack contract，涵蓋定義、問題型態、"
                "證據期待、決策模式與交付 preset。"
            ),
            generation_notes=generation_notes,
        )
