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
    chunks = re.split(r"(?<=[.!?。！？])\s+|\n+", text)
    return [chunk.strip(" -") for chunk in chunks if len(chunk.strip()) > 20]


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
        )
