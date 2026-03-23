from __future__ import annotations

from collections.abc import Iterable

from app.domain.enums import CapabilityArchetype
from app.extensions.schemas import (
    AgentRegistrySnapshot,
    AgentSpec,
    AgentType,
    ExtensionManagerSnapshot,
    ExtensionStatus,
    PackRegistrySnapshot,
    PackSpec,
    PackType,
)


def build_pack_catalog() -> list[PackSpec]:
    return [
        PackSpec(
            pack_id="operations_pack",
            pack_type=PackType.DOMAIN,
            pack_name="Operations Pack",
            description="Operational diagnosis, execution sequencing, process constraints, and delivery feasibility.",
            domain_lenses=["operations"],
            default_decision_context_patterns=["operating model diagnosis", "execution readiness", "resource sequencing"],
            evidence_expectations=["process documentation", "delivery dependencies", "resource constraints"],
            risk_libraries=["delivery risk", "dependency risk", "throughput risk"],
            recommendation_patterns=["execution sequence", "operating model adjustment", "constraint mitigation"],
            deliverable_presets=["operational assessment memo", "execution roadmap"],
            routing_hints=["operations", "process", "execution", "workflow"],
        ),
        PackSpec(
            pack_id="finance_fundraising_pack",
            pack_type=PackType.DOMAIN,
            pack_name="Finance / Fundraising Pack",
            description="Financial structure, capital needs, fundraising readiness, and economics-oriented analysis.",
            domain_lenses=["finance", "fundraising"],
            default_decision_context_patterns=["capital planning", "unit economics review", "fundraising readiness"],
            evidence_expectations=["financial model", "revenue assumptions", "cash flow signals"],
            risk_libraries=["cash risk", "capital structure risk", "fundraising risk"],
            recommendation_patterns=["capital allocation", "funding strategy", "financial discipline"],
            deliverable_presets=["finance assessment memo", "fundraising decision brief"],
            routing_hints=["finance", "fundraising", "cash flow", "capital"],
        ),
        PackSpec(
            pack_id="legal_risk_pack",
            pack_type=PackType.DOMAIN,
            pack_name="Legal / Risk Pack",
            description="Legal boundaries, contractual interpretation, compliance concerns, and formal risk surfacing.",
            domain_lenses=["legal", "risk"],
            default_decision_context_patterns=["contract review", "risk challenge", "compliance review"],
            evidence_expectations=["contracts", "terms", "compliance materials"],
            risk_libraries=["contractual risk", "liability risk", "compliance risk"],
            recommendation_patterns=["redline recommendation", "risk mitigation", "clarification request"],
            deliverable_presets=["review memo", "risk brief"],
            routing_hints=["legal", "contract", "risk", "compliance"],
        ),
        PackSpec(
            pack_id="marketing_sales_pack",
            pack_type=PackType.DOMAIN,
            pack_name="Marketing / Sales Pack",
            description="Demand generation, messaging, funnel design, go-to-market execution, and commercial traction framing.",
            domain_lenses=["marketing", "sales"],
            default_decision_context_patterns=["go-to-market decision", "message-market fit", "funnel diagnosis"],
            evidence_expectations=["customer journey materials", "campaign artifacts", "sales collateral"],
            risk_libraries=["channel risk", "conversion risk", "message risk"],
            recommendation_patterns=["positioning refinement", "funnel adjustment", "sales enablement"],
            deliverable_presets=["growth brief", "GTM decision memo"],
            routing_hints=["marketing", "sales", "growth", "GTM"],
        ),
        PackSpec(
            pack_id="business_development_pack",
            pack_type=PackType.DOMAIN,
            pack_name="Business Development Pack",
            description="Partnerships, channel expansion, strategic alliances, and commercial opportunity development.",
            domain_lenses=["business_development", "sales"],
            default_decision_context_patterns=["partnership evaluation", "channel expansion", "deal shaping"],
            evidence_expectations=["partner materials", "deal structures", "market access evidence"],
            risk_libraries=["partner dependency risk", "deal execution risk", "channel conflict risk"],
            recommendation_patterns=["partner strategy", "deal structure recommendation", "channel prioritization"],
            deliverable_presets=["business development brief", "partnership review memo"],
            routing_hints=["partnership", "business development", "channel", "alliance"],
        ),
        PackSpec(
            pack_id="research_intelligence_pack",
            pack_type=PackType.DOMAIN,
            pack_name="Research / Intelligence Pack",
            description="Research-heavy synthesis, external signal interpretation, and evidence-driven situation assessment.",
            domain_lenses=["research", "intelligence"],
            default_decision_context_patterns=["market scan", "situation assessment", "signal synthesis"],
            evidence_expectations=["external sources", "competitive information", "signal clustering"],
            risk_libraries=["signal ambiguity", "recency risk", "information quality risk"],
            recommendation_patterns=["research brief", "situation framing", "further inquiry guidance"],
            deliverable_presets=["exploratory brief", "research memo"],
            routing_hints=["research", "intelligence", "signals", "market"],
        ),
        PackSpec(
            pack_id="online_education_pack",
            pack_type=PackType.INDUSTRY,
            pack_name="Online Education Pack",
            description="Learning-business context for digital courses, cohorts, tutoring, memberships, and education delivery systems.",
            industry_definition="For businesses monetizing structured learning outcomes through digital courses, cohorts, tutoring, memberships, or B2B education products.",
            common_business_models=[
                "一次性課程銷售",
                "cohort / bootcamp",
                "會員訂閱",
                "顧問式教學 / tutoring",
                "B2B 教育授權",
            ],
            stage_specific_heuristics={
                "創業階段": [
                    "先驗證學習成果與招生訊息是否能形成穩定轉單。",
                    "優先辨識課程完成率與退款風險，而不是過早擴大內容產品線。",
                ],
                "制度化階段": [
                    "重點檢查招生漏斗、課程交付 SOP 與講師 / 助教產能。",
                    "應把續購與完成率視為比表面營收更重要的健康訊號。",
                ],
                "規模化階段": [
                    "優先檢查 cohort 擴張是否壓縮教學品質與 support capacity。",
                    "B2C 與 B2B 教育產品線應分開評估其交付與銷售節奏。",
                ],
            },
            key_kpis=[
                "lead-to-enrollment conversion",
                "trial / webinar-to-sale conversion",
                "course completion rate",
                "learner retention / repeat purchase",
                "refund rate",
                "contribution margin per cohort",
            ],
            domain_lenses=["marketing", "sales", "operations"],
            relevant_client_types=["個人品牌與服務", "自媒體", "中小企業"],
            relevant_client_stages=["創業階段", "制度化階段", "規模化階段"],
            default_decision_context_patterns=[
                "course portfolio decision",
                "learner funnel diagnosis",
                "pricing and cohort model review",
            ],
            evidence_expectations=[
                "招生漏斗資料",
                "課程完成率與續購資料",
                "產品組合與定價材料",
                "學員回饋 / NPS / 客訴訊號",
                "內容交付與講師產能資料",
            ],
            risk_libraries=["completion risk", "refund risk", "instructor dependency risk"],
            common_risks=[
                "過度依賴單一講師或創辦人",
                "招生成本高於終身價值",
                "完成率偏低導致口碑與續購受損",
                "退款 / 課程體驗風險放大",
                "平台與流量依賴",
            ],
            decision_patterns=[
                "是否應調整課程 / cohort 組合",
                "是否應重設定價與升級路徑",
                "是否應優先優化招生漏斗或教學完成率",
                "是否應從 B2C 擴到 B2B / 授權模式",
            ],
            recommendation_patterns=[
                "learner funnel adjustment",
                "curriculum portfolio reprioritization",
                "delivery capacity hardening",
            ],
            deliverable_presets=[
                "online education growth brief",
                "learner funnel review memo",
                "course portfolio decision memo",
            ],
            routing_hints=[
                "線上教育",
                "線上課程",
                "課程",
                "教學",
                "補教",
                "cohort",
                "bootcamp",
                "tutoring",
                "education",
                "edtech",
                "學員",
                "招生",
            ],
            pack_notes=[
                "對教育型生意，不能只看營收，還要同步檢查完成率、退款與交付品質。",
            ],
        ),
        PackSpec(
            pack_id="ecommerce_pack",
            pack_type=PackType.INDUSTRY,
            pack_name="Ecommerce Pack",
            description="Commerce context for direct-to-consumer, marketplace, social commerce, and omnichannel selling models.",
            industry_definition="For businesses selling physical or digital goods through owned stores, marketplaces, social commerce, or omnichannel operations.",
            common_business_models=[
                "DTC 自營電商",
                "平台型電商 / marketplace",
                "社群電商 / 直播帶貨",
                "訂閱制補貨",
                "零售批發混合通路",
            ],
            stage_specific_heuristics={
                "創業階段": [
                    "先確認核心 SKU、價格帶與主要通路是否成立。",
                    "不應只看 GMV，必須同步檢查單筆訂單貢獻毛利。",
                ],
                "制度化階段": [
                    "重點是回購、SKU 毛利、庫存週轉與履約穩定度。",
                    "通路擴張前應先確認促銷依賴是否已侵蝕毛利與品牌定位。",
                ],
                "規模化階段": [
                    "應優先檢查 channel mix、需求預測與廣告效率，而不是只追求更多營收。",
                    "跨通路經營時要把平台依賴與供應鏈壓力視為高優先風險。",
                ],
            },
            key_kpis=[
                "conversion rate",
                "average order value",
                "repeat purchase rate",
                "contribution margin",
                "CAC / MER / ROAS",
                "return rate",
                "inventory turns",
            ],
            domain_lenses=["marketing", "sales", "operations", "finance"],
            relevant_client_types=["中小企業", "大型企業", "個人品牌與服務"],
            relevant_client_stages=["創業階段", "制度化階段", "規模化階段"],
            default_decision_context_patterns=[
                "channel mix decision",
                "SKU and margin diagnosis",
                "retention versus acquisition prioritization",
            ],
            evidence_expectations=[
                "通路 / 流量與轉換漏斗",
                "SKU 毛利與退貨資料",
                "客單與回購 cohort",
                "存貨周轉與履約資料",
                "平台 / 廣告依賴資料",
            ],
            risk_libraries=["channel dependency risk", "inventory risk", "margin compression risk"],
            common_risks=[
                "廣告成本惡化",
                "單一平台依賴",
                "SKU 組合與庫存錯配",
                "退貨侵蝕毛利",
                "促銷依賴造成品牌與利潤受損",
            ],
            decision_patterns=[
                "是否該調整通路 mix",
                "是否該集中 SKU 與價格帶",
                "是否優先提升回購而非買量",
                "是否該重做促銷與會員策略",
            ],
            recommendation_patterns=[
                "channel prioritization",
                "SKU portfolio rationalization",
                "retention-first growth sequence",
            ],
            deliverable_presets=[
                "ecommerce operating review",
                "commerce channel decision memo",
                "SKU and margin brief",
            ],
            routing_hints=[
                "電商",
                "ecommerce",
                "shopify",
                "商城",
                "購物車",
                "dtc",
                "蝦皮",
                "momo",
                "平台電商",
                "商品",
                "sku",
                "履約",
            ],
            pack_notes=[
                "電商案件應同時看通路、毛利、庫存與回購，不可只看流量與營收表面成長。",
            ],
        ),
        PackSpec(
            pack_id="gaming_pack",
            pack_type=PackType.INDUSTRY,
            pack_name="Gaming Pack",
            description="Gaming context for launch readiness, live ops, player retention, monetization design, and portfolio volatility.",
            industry_definition="For game studios, publishers, and live-ops businesses monetizing player engagement through premium, free-to-play, service, or hybrid models.",
            common_business_models=[
                "Premium 遊戲銷售",
                "Free-to-play + IAP",
                "廣告變現",
                "訂閱 / season pass",
                "發行 / 聯運 / IP 授權",
            ],
            stage_specific_heuristics={
                "創業階段": [
                    "應先確認核心玩法與留存是否成立，避免在 retention 未過關前過早放大 UA。",
                    "首款產品應優先驗證玩家黏著與變現假設，而不是只追求下載量。",
                ],
                "制度化階段": [
                    "要把 live ops 節奏、內容產能與 monetization loop 一起檢查。",
                    "若同時經營多平台或多作品，應先釐清作品組合的資源分配。",
                ],
                "規模化階段": [
                    "應把 portfolio risk、平台政策與內容 cadence 視為核心治理議題。",
                    "擴大投放與跨區發行前，必須確認 retention 與 payer economics 是否穩定。",
                ],
            },
            key_kpis=[
                "D1 / D7 / D30 retention",
                "DAU / MAU",
                "payer conversion",
                "ARPDAU / ARPPU",
                "CPI versus LTV",
                "content cadence health",
                "wishlists / launch conversion",
            ],
            domain_lenses=["marketing", "operations", "finance", "research"],
            relevant_client_types=["中小企業", "大型企業"],
            relevant_client_stages=["創業階段", "制度化階段", "規模化階段"],
            default_decision_context_patterns=[
                "launch readiness review",
                "live ops prioritization",
                "monetization and retention trade-off",
            ],
            evidence_expectations=[
                "留存 cohort",
                "付費與虛寶資料",
                "UA / CPI / ROAS",
                "live ops 節奏與活動資料",
                "玩家評價與社群訊號",
                "平台檔期與商店頁資料",
            ],
            risk_libraries=["retention risk", "platform risk", "portfolio volatility risk"],
            common_risks=[
                "留存不足導致買量失效",
                "內容更新節奏跟不上",
                "平台政策或商店檔期風險",
                "付費設計引發玩家反彈",
                "單一作品依賴與 hit-driven 波動",
            ],
            decision_patterns=[
                "是否該優先改善留存還是買量",
                "是否該調整 monetization loop",
                "是否適合做 live ops / content cadence investment",
                "是否該採 premium / F2P / hybrid 路線",
            ],
            recommendation_patterns=[
                "retention-first launch sequence",
                "live ops calendar prioritization",
                "monetization risk mitigation",
            ],
            deliverable_presets=[
                "gaming live-ops brief",
                "game launch readiness memo",
                "player economy risk review",
            ],
            routing_hints=[
                "遊戲",
                "gaming",
                "game",
                "玩家",
                "live ops",
                "steam",
                "app store",
                "google play",
                "課金",
                "retention",
                "發行",
                "wishlist",
            ],
            pack_notes=[
                "遊戲案件應先判斷 retention / monetization / content cadence 三者是否同時成立，再談規模化買量。",
            ],
        ),
        PackSpec(
            pack_id="funeral_services_pack",
            pack_type=PackType.INDUSTRY,
            pack_name="Funeral Services Pack",
            description="Funeral and memorial service context where trust, compliance, referral channels, and operational sensitivity dominate decisions.",
            industry_definition="For funeral, memorial, and bereavement service businesses where service trust, compliance, referral channels, and operational sensitivity matter.",
            common_business_models=[
                "單次禮儀 / 喪葬服務",
                "套裝儀式服務",
                "生前契約 / pre-need",
                "殯儀轉介與合作通路",
                "塔位 / 周邊紀念服務",
            ],
            stage_specific_heuristics={
                "創業階段": [
                    "應先確認服務信任、轉介來源與成交流程是否穩定。",
                    "在初期擴張前，需先確保資訊揭露與服務品質一致。",
                ],
                "制度化階段": [
                    "重點是接案到交付 SOP、報價透明度與人力排程能力。",
                    "應把 pre-need、轉介結構與方案毛利一起看，而非只看案量。",
                ],
                "規模化階段": [
                    "擴點或擴服務前，需先檢查品牌信任與法遵風險是否可複製管理。",
                    "轉介與合作通路集中度應被視為高優先風險。",
                ],
            },
            key_kpis=[
                "lead-to-case conversion",
                "average case value",
                "package mix margin",
                "referral source concentration",
                "service capacity utilization",
                "pre-need attach / conversion",
                "customer complaint rate",
            ],
            domain_lenses=["operations", "legal", "sales"],
            relevant_client_types=["中小企業", "大型企業"],
            relevant_client_stages=["創業階段", "制度化階段", "規模化階段"],
            default_decision_context_patterns=[
                "service package design",
                "referral channel dependency review",
                "service trust and SOP hardening",
            ],
            evidence_expectations=[
                "服務流程與轉介來源",
                "方案組合與報價資料",
                "個案量與人力排程",
                "法遵 / 契約 / 資訊揭露材料",
                "客訴與口碑訊號",
            ],
            risk_libraries=["reputation risk", "compliance risk", "capacity risk"],
            common_risks=[
                "信任與聲譽損傷",
                "法遵或資訊揭露風險",
                "過度依賴單一轉介來源",
                "旺淡季與人力容量錯配",
                "價格不透明導致成交與口碑受損",
            ],
            decision_patterns=[
                "是否該重整服務組合與報價架構",
                "是否該降低轉介依賴",
                "是否該優先強化 pre-need 模式",
                "是否該補強接案到交付的服務 SOP",
            ],
            recommendation_patterns=[
                "service package redesign",
                "referral diversification",
                "trust and compliance hardening",
            ],
            deliverable_presets=[
                "funeral services operating memo",
                "service trust risk brief",
                "referral channel review",
            ],
            routing_hints=[
                "殯葬",
                "禮儀",
                "葬儀",
                "funeral",
                "memorial",
                "喪葬",
                "生前契約",
                "塔位",
                "殯儀",
            ],
            pack_notes=[
                "喪葬服務案件需要把信任、法遵、轉介結構與人力容量一起視為核心決策條件。",
            ],
        ),
        PackSpec(
            pack_id="health_supplements_pack",
            pack_type=PackType.INDUSTRY,
            pack_name="Health Supplements Pack",
            description="Supplement and nutraceutical context where claims compliance, repeat purchase, trust, and SKU economics are core.",
            industry_definition="For health supplement and nutraceutical businesses where claims compliance, repeat purchase, trust, channel mix, and SKU economics are core.",
            common_business_models=[
                "DTC 保健品牌",
                "訂閱補貨",
                "平台電商銷售",
                "藥局 / 零售通路",
                "代工 / 聯名 / 專業通路合作",
            ],
            stage_specific_heuristics={
                "創業階段": [
                    "應先確認核心產品主張、法規可行性與首批回購是否成立。",
                    "初期不宜同時擴太多 SKU 與通路，避免庫存與訊息分散。",
                ],
                "制度化階段": [
                    "重點是 SKU 貢獻毛利、回購 cohort、claim 合規與通路效率。",
                    "若投放成長建立在低回購之上，應優先修正產品與 retention 而非加碼買量。",
                ],
                "規模化階段": [
                    "擴大通路前，必須先管理效期、品質信任與廣告 / 平台政策風險。",
                    "品牌規模化要把合規、供應鏈與客訴機制一起納入治理。",
                ],
            },
            key_kpis=[
                "repeat purchase rate",
                "subscription retention",
                "average order value",
                "contribution margin by SKU",
                "inventory expiry / turns",
                "CAC / MER / ROAS",
                "refund / complaint rate",
            ],
            domain_lenses=["marketing", "sales", "finance", "legal"],
            relevant_client_types=["中小企業", "大型企業", "個人品牌與服務"],
            relevant_client_stages=["創業階段", "制度化階段", "規模化階段"],
            default_decision_context_patterns=[
                "SKU portfolio decision",
                "claim and compliance review",
                "channel and retention prioritization",
            ],
            evidence_expectations=[
                "SKU 組合與回購 cohort",
                "法規 / 成分 / claim 材料",
                "通路與廣告表現",
                "評價與退貨 / 客訴資料",
                "庫存週轉與效期資料",
            ],
            risk_libraries=["claim compliance risk", "channel dependency risk", "inventory expiry risk"],
            common_risks=[
                "功效宣稱或法遵風險",
                "廣告與平台政策風險",
                "SKU 複雜度造成庫存壓力",
                "低回購導致 CAC 無法回收",
                "品質信任事件放大",
            ],
            decision_patterns=[
                "是否該集中明星 SKU",
                "是否該調整 claim 與訊息策略",
                "是否優先做訂閱 / 回購而非買量",
                "是否該重整通路與投放配置",
                "是否需先補強 compliance 與品質信任",
            ],
            recommendation_patterns=[
                "hero SKU focus",
                "compliance-first messaging",
                "retention before acquisition scale-up",
            ],
            deliverable_presets=[
                "supplements growth memo",
                "claim and channel risk review",
                "SKU portfolio decision brief",
            ],
            routing_hints=[
                "保健食品",
                "保健",
                "健康食品",
                "supplement",
                "supplements",
                "nutraceutical",
                "維他命",
                "益生菌",
                "魚油",
                "膠原",
            ],
            pack_notes=[
                "保健品案件不應只看流量與營收，必須把回購、claim 合規、品質信任與 SKU 結構一起看。",
            ],
        ),
    ]


def build_agent_catalog() -> list[AgentSpec]:
    return [
        AgentSpec(
            agent_id="host_agent",
            agent_name="Host Agent",
            agent_type=AgentType.HOST,
            description="The only orchestration center. Frames decisions, resolves packs, selects agents, governs readiness, and converges deliverables.",
            supported_capabilities=list(CapabilityArchetype),
            input_requirements=["DecisionContext", "Context spine", "Pack resolver outputs", "Evidence"],
            output_contract=["Capability frame", "Readiness governance", "Deliverable convergence"],
            invocation_rules=["Always present", "Cannot be disabled while the system is active"],
            escalation_rules=["Escalate missing-world-state ambiguity before claiming high-confidence decisions"],
        ),
        AgentSpec(
            agent_id="strategy_decision_agent",
            agent_name="Strategy / Decision Agent",
            agent_type=AgentType.REASONING,
            description="Handles framing, option comparison, prioritization, and decision convergence.",
            supported_capabilities=[
                CapabilityArchetype.DIAGNOSE_ASSESS,
                CapabilityArchetype.DECIDE_CONVERGE,
                CapabilityArchetype.SCENARIO_COMPARISON,
                CapabilityArchetype.RISK_SURFACING,
            ],
            relevant_domain_packs=["operations_pack", "finance_fundraising_pack", "marketing_sales_pack"],
            input_requirements=["DecisionContext", "Evidence", "Goals", "Constraints"],
            output_contract=["Insights", "Options", "Recommendations"],
            invocation_rules=["Prefer for cross-functional decision framing"],
            escalation_rules=["Escalate when no coherent decision context can be framed"],
        ),
        AgentSpec(
            agent_id="operations_agent",
            agent_name="Operations Agent",
            agent_type=AgentType.REASONING,
            description="Evaluates feasibility, process implications, dependencies, and execution sequencing.",
            supported_capabilities=[
                CapabilityArchetype.DIAGNOSE_ASSESS,
                CapabilityArchetype.DECIDE_CONVERGE,
                CapabilityArchetype.PLAN_ROADMAP,
                CapabilityArchetype.RISK_SURFACING,
            ],
            relevant_domain_packs=["operations_pack"],
            relevant_industry_packs=[
                "online_education_pack",
                "ecommerce_pack",
                "funeral_services_pack",
            ],
            input_requirements=["Evidence", "Constraints", "Artifacts"],
            output_contract=["Operational insights", "Risks", "Action items"],
            invocation_rules=["Prefer when execution design or operating model implications matter"],
            escalation_rules=["Escalate if core process evidence is missing"],
        ),
        AgentSpec(
            agent_id="finance_agent",
            agent_name="Finance Agent",
            agent_type=AgentType.REASONING,
            description="Handles economics, capital, cash flow, and fundraising-oriented reasoning.",
            supported_capabilities=[
                CapabilityArchetype.DIAGNOSE_ASSESS,
                CapabilityArchetype.DECIDE_CONVERGE,
                CapabilityArchetype.PLAN_ROADMAP,
                CapabilityArchetype.SCENARIO_COMPARISON,
            ],
            relevant_domain_packs=["finance_fundraising_pack"],
            relevant_industry_packs=[
                "ecommerce_pack",
                "gaming_pack",
                "health_supplements_pack",
                "online_education_pack",
            ],
            input_requirements=["Financial artifacts", "Assumptions", "Evidence"],
            output_contract=["Financial insights", "Risks", "Recommendations"],
            invocation_rules=["Prefer when capital, pricing, or economics are decision-critical"],
            escalation_rules=["Escalate if financial assumptions are missing or contradictory"],
        ),
        AgentSpec(
            agent_id="legal_risk_agent",
            agent_name="Legal / Risk Agent",
            agent_type=AgentType.REASONING,
            description="Surfaces legal boundaries, compliance risks, and contract-related implications.",
            supported_capabilities=[
                CapabilityArchetype.REVIEW_CHALLENGE,
                CapabilityArchetype.RISK_SURFACING,
                CapabilityArchetype.DECIDE_CONVERGE,
            ],
            relevant_domain_packs=["legal_risk_pack"],
            relevant_industry_packs=[
                "funeral_services_pack",
                "health_supplements_pack",
                "gaming_pack",
            ],
            input_requirements=["Artifacts", "Evidence", "Constraints"],
            output_contract=["Risk surfacing", "Recommendations", "Issue summaries"],
            invocation_rules=["Prefer when legal exposure or governance matters"],
            escalation_rules=["Escalate if required legal materials are missing"],
        ),
        AgentSpec(
            agent_id="marketing_growth_agent",
            agent_name="Marketing / Growth Agent",
            agent_type=AgentType.REASONING,
            description="Analyzes positioning, acquisition, demand shaping, and growth narratives.",
            supported_capabilities=[
                CapabilityArchetype.DIAGNOSE_ASSESS,
                CapabilityArchetype.SYNTHESIZE_BRIEF,
                CapabilityArchetype.DECIDE_CONVERGE,
                CapabilityArchetype.PLAN_ROADMAP,
            ],
            relevant_domain_packs=["marketing_sales_pack"],
            relevant_industry_packs=[
                "online_education_pack",
                "ecommerce_pack",
                "gaming_pack",
                "health_supplements_pack",
            ],
            input_requirements=["Audience signals", "Artifacts", "External research"],
            output_contract=["Growth insights", "Recommendations", "Narrative risks"],
            invocation_rules=["Prefer when market-facing messaging or acquisition is core"],
            escalation_rules=["Escalate if audience evidence is too sparse for specific claims"],
        ),
        AgentSpec(
            agent_id="sales_business_development_agent",
            agent_name="Sales / Business Development Agent",
            agent_type=AgentType.REASONING,
            description="Assesses pipeline, commercial motion, partnerships, and opportunity development.",
            supported_capabilities=[
                CapabilityArchetype.DIAGNOSE_ASSESS,
                CapabilityArchetype.DECIDE_CONVERGE,
                CapabilityArchetype.PLAN_ROADMAP,
                CapabilityArchetype.SCENARIO_COMPARISON,
            ],
            relevant_domain_packs=["marketing_sales_pack", "business_development_pack"],
            relevant_industry_packs=[
                "online_education_pack",
                "ecommerce_pack",
                "funeral_services_pack",
            ],
            input_requirements=["Commercial artifacts", "Evidence", "Goals"],
            output_contract=["Commercial options", "Action items", "Risks"],
            invocation_rules=["Prefer when GTM, pipeline, or partnership choices are central"],
            escalation_rules=["Escalate if pipeline reality and goals are badly misaligned"],
        ),
        AgentSpec(
            agent_id="research_intelligence_agent",
            agent_name="Research / Intelligence Agent",
            agent_type=AgentType.REASONING,
            description="Synthesizes external signals, research inputs, and multi-source evidence into decision-useful frames.",
            supported_capabilities=[
                CapabilityArchetype.SYNTHESIZE_BRIEF,
                CapabilityArchetype.DIAGNOSE_ASSESS,
                CapabilityArchetype.SCENARIO_COMPARISON,
                CapabilityArchetype.RISK_SURFACING,
            ],
            relevant_domain_packs=["research_intelligence_pack"],
            relevant_industry_packs=[
                "online_education_pack",
                "ecommerce_pack",
                "gaming_pack",
                "funeral_services_pack",
                "health_supplements_pack",
            ],
            input_requirements=["Source materials", "Evidence", "DecisionContext"],
            output_contract=["Synthesis briefs", "Evidence summaries", "Uncertainty framing"],
            invocation_rules=["Prefer for external-research-heavy or sparse-input cases"],
            escalation_rules=["Escalate if source quality is too weak to support claims"],
        ),
        AgentSpec(
            agent_id="document_communication_agent",
            agent_name="Document / Communication Agent",
            agent_type=AgentType.REASONING,
            description="Shapes documents, narratives, drafts, and communication-oriented deliverables.",
            supported_capabilities=[
                CapabilityArchetype.RESTRUCTURE_REFRAME,
                CapabilityArchetype.SYNTHESIZE_BRIEF,
                CapabilityArchetype.PLAN_ROADMAP,
            ],
            relevant_domain_packs=["marketing_sales_pack"],
            relevant_industry_packs=[
                "online_education_pack",
                "funeral_services_pack",
                "health_supplements_pack",
            ],
            input_requirements=["Artifacts", "Audience", "Goals"],
            output_contract=["Restructured drafts", "Communication recommendations", "Audience-aware deliverables"],
            invocation_rules=["Prefer when artifact restructuring or narrative shaping is required"],
            escalation_rules=["Escalate if target audience or deliverable purpose is missing"],
        ),
        AgentSpec(
            agent_id="contract_review_specialist",
            agent_name="Contract Review Specialist",
            agent_type=AgentType.SPECIALIST,
            description="Document-centered specialist for contract review, clause risk surfacing, and redline-oriented outputs.",
            supported_capabilities=[CapabilityArchetype.REVIEW_CHALLENGE],
            relevant_domain_packs=["legal_risk_pack"],
            input_requirements=["Contract artifact", "Supporting evidence"],
            output_contract=["High-risk clauses", "Redline recommendations", "Missing items"],
            invocation_rules=["Prefer for single-document legal review tasks"],
            escalation_rules=["Escalate if contract attachments are missing"],
        ),
        AgentSpec(
            agent_id="research_synthesis_specialist",
            agent_name="Research Synthesis Specialist",
            agent_type=AgentType.SPECIALIST,
            description="Evidence-heavy specialist for synthesizing research materials into a decision-useful brief.",
            supported_capabilities=[CapabilityArchetype.SYNTHESIZE_BRIEF],
            relevant_domain_packs=["research_intelligence_pack"],
            input_requirements=["Source materials", "Evidence", "DecisionContext"],
            output_contract=["Findings", "Implications", "Research gaps"],
            invocation_rules=["Prefer for multi-source research synthesis"],
            escalation_rules=["Escalate if evidence coverage is too thin for conclusions"],
        ),
        AgentSpec(
            agent_id="document_restructuring_specialist",
            agent_name="Document Restructuring Specialist",
            agent_type=AgentType.SPECIALIST,
            description="Artifact-centered specialist for restructuring proposals, memos, and drafts for a target audience.",
            supported_capabilities=[CapabilityArchetype.RESTRUCTURE_REFRAME],
            relevant_domain_packs=["marketing_sales_pack"],
            relevant_industry_packs=[
                "online_education_pack",
                "funeral_services_pack",
                "health_supplements_pack",
            ],
            input_requirements=["Artifact", "Audience", "Goal"],
            output_contract=["Restructuring strategy", "Structure adjustments", "Draft outline"],
            invocation_rules=["Prefer for single-document restructuring tasks"],
            escalation_rules=["Escalate if source document purpose is unclear"],
        ),
    ]


class ExtensionRegistry:
    def __init__(self) -> None:
        self._packs = {pack.pack_id: pack for pack in build_pack_catalog()}
        self._agents = {agent.agent_id: agent for agent in build_agent_catalog()}
        host_agents = [
            agent.agent_id
            for agent in self._agents.values()
            if agent.agent_type == AgentType.HOST and agent.status == ExtensionStatus.ACTIVE
        ]
        if len(host_agents) != 1:
            raise ValueError("ExtensionRegistry requires exactly one active Host Agent.")
        self._host_agent_id = host_agents[0]

    def list_packs(self, pack_type: PackType | None = None) -> list[PackSpec]:
        packs = list(self._packs.values())
        if pack_type is not None:
            packs = [pack for pack in packs if pack.pack_type == pack_type]
        return sorted(packs, key=lambda item: (item.pack_type.value, item.pack_id))

    def get_pack(self, pack_id: str) -> PackSpec | None:
        return self._packs.get(pack_id)

    def list_agents(self, agent_type: AgentType | None = None) -> list[AgentSpec]:
        agents = list(self._agents.values())
        if agent_type is not None:
            agents = [agent for agent in agents if agent.agent_type == agent_type]
        return sorted(agents, key=lambda item: (item.agent_type.value, item.agent_id))

    def get_agent(self, agent_id: str) -> AgentSpec | None:
        return self._agents.get(agent_id)

    def get_host_agent(self) -> AgentSpec:
        return self._agents[self._host_agent_id]

    def pack_registry_snapshot(self) -> PackRegistrySnapshot:
        packs = self.list_packs()
        return PackRegistrySnapshot(
            packs=packs,
            active_pack_ids=[pack.pack_id for pack in packs if pack.status == ExtensionStatus.ACTIVE],
            draft_pack_ids=[pack.pack_id for pack in packs if pack.status == ExtensionStatus.DRAFT],
            inactive_pack_ids=[
                pack.pack_id
                for pack in packs
                if pack.status in {ExtensionStatus.INACTIVE, ExtensionStatus.DEPRECATED}
            ],
        )

    def agent_registry_snapshot(self) -> AgentRegistrySnapshot:
        agents = self.list_agents()
        return AgentRegistrySnapshot(
            agents=agents,
            host_agent_id=self._host_agent_id,
            active_agent_ids=[agent.agent_id for agent in agents if agent.status == ExtensionStatus.ACTIVE],
            draft_agent_ids=[agent.agent_id for agent in agents if agent.status == ExtensionStatus.DRAFT],
            inactive_agent_ids=[
                agent.agent_id
                for agent in agents
                if agent.status in {ExtensionStatus.INACTIVE, ExtensionStatus.DEPRECATED}
            ],
        )

    def manager_snapshot(self) -> ExtensionManagerSnapshot:
        return ExtensionManagerSnapshot(
            pack_registry=self.pack_registry_snapshot(),
            agent_registry=self.agent_registry_snapshot(),
        )
