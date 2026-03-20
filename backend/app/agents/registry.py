from __future__ import annotations

from collections.abc import Iterable

from app.agents.base import AgentDescriptor, CoreAnalysisAgent, SpecialistAgent
from app.agents.core.market_research_insight import MarketResearchInsightAgent
from app.agents.core.operations import OperationsAgent
from app.agents.core.risk_challenge import RiskChallengeAgent
from app.agents.core.strategy_business_analysis import StrategyBusinessAnalysisAgent
from app.agents.specialists.contract_review import ContractReviewAgent
from app.agents.specialists.document_restructuring import DocumentRestructuringAgent
from app.agents.specialists.research_synthesis import ResearchSynthesisAgent
from app.domain.enums import AgentCategory, AgentStatus, FlowMode
from app.model_router.base import ModelProvider


def build_agent_catalog() -> list[AgentDescriptor]:
    return [
        AgentDescriptor(
            agent_id="strategy_business_analysis",
            agent_type="core_analysis",
            display_name="Strategy / Business Analysis Agent",
            agent_category=AgentCategory.CORE,
            supported_task_types=["complex_convergence"],
            supported_flow_modes=[FlowMode.MULTI_AGENT],
            required_inputs=["Task", "TaskContext", "Goal", "Evidence"],
            produced_objects=["Insight", "Option", "Recommendation"],
            default_model_policy="balanced",
            version="0.1.0",
            status=AgentStatus.ACTIVE,
        ),
        AgentDescriptor(
            agent_id="operations",
            agent_type="core_analysis",
            display_name="Operations Agent",
            agent_category=AgentCategory.CORE,
            supported_task_types=["complex_convergence"],
            supported_flow_modes=[FlowMode.MULTI_AGENT],
            required_inputs=["Task", "TaskContext", "Constraint", "Evidence"],
            produced_objects=["Insight", "Risk", "Recommendation", "ActionItem"],
            default_model_policy="balanced",
            version="0.1.0",
            status=AgentStatus.ACTIVE,
        ),
        AgentDescriptor(
            agent_id="market_research_insight",
            agent_type="core_analysis",
            display_name="Market / Research Insight Agent",
            agent_category=AgentCategory.CORE,
            supported_task_types=["complex_convergence"],
            supported_flow_modes=[FlowMode.MULTI_AGENT],
            required_inputs=["Task", "TaskContext", "Evidence"],
            produced_objects=["Insight", "Recommendation", "ActionItem"],
            default_model_policy="balanced",
            version="0.1.0",
            status=AgentStatus.ACTIVE,
        ),
        AgentDescriptor(
            agent_id="risk_challenge",
            agent_type="core_analysis",
            display_name="Risk / Challenge Agent",
            agent_category=AgentCategory.CORE,
            supported_task_types=["complex_convergence"],
            supported_flow_modes=[FlowMode.MULTI_AGENT],
            required_inputs=["Task", "Constraint", "Evidence"],
            produced_objects=["Risk", "Recommendation"],
            default_model_policy="balanced",
            version="0.1.0",
            status=AgentStatus.ACTIVE,
        ),
        AgentDescriptor(
            agent_id="contract_review",
            agent_type="specialist",
            display_name="Contract Review Agent",
            agent_category=AgentCategory.SPECIALIST,
            supported_task_types=["contract_review"],
            supported_flow_modes=[FlowMode.SPECIALIST],
            required_inputs=["Task", "TaskContext", "Evidence"],
            produced_objects=["Risk", "Recommendation", "ActionItem", "Deliverable"],
            default_model_policy="precise",
            version="0.1.0",
            status=AgentStatus.ACTIVE,
        ),
        AgentDescriptor(
            agent_id="research_synthesis",
            agent_type="specialist",
            display_name="Research Synthesis Agent",
            agent_category=AgentCategory.SPECIALIST,
            supported_task_types=["research_synthesis"],
            supported_flow_modes=[FlowMode.SPECIALIST],
            required_inputs=["Task", "TaskContext", "Evidence", "Insight"],
            produced_objects=["Insight", "Recommendation", "ActionItem", "Deliverable"],
            default_model_policy="balanced",
            version="0.1.0",
            status=AgentStatus.ACTIVE,
        ),
        AgentDescriptor(
            agent_id="document_restructuring",
            agent_type="specialist",
            display_name="Document Restructuring Agent",
            agent_category=AgentCategory.SPECIALIST,
            supported_task_types=["document_restructuring"],
            supported_flow_modes=[FlowMode.SPECIALIST],
            required_inputs=["Task", "TaskContext", "Evidence", "Goal"],
            produced_objects=["Recommendation", "ActionItem", "Deliverable"],
            default_model_policy="balanced",
            version="0.1.0",
            status=AgentStatus.ACTIVE,
        ),
    ]


class AgentRegistry:
    def __init__(self, model_provider: ModelProvider):
        self.catalog = build_agent_catalog()
        self._core_agents = {
            "strategy_business_analysis": StrategyBusinessAnalysisAgent(model_provider=model_provider),
            "market_research_insight": MarketResearchInsightAgent(model_provider=model_provider),
            "operations": OperationsAgent(model_provider=model_provider),
            "risk_challenge": RiskChallengeAgent(model_provider=model_provider),
        }
        self._specialist_agents = {
            "contract_review": ContractReviewAgent(model_provider=model_provider),
            "research_synthesis": ResearchSynthesisAgent(model_provider=model_provider),
            "document_restructuring": DocumentRestructuringAgent(model_provider=model_provider),
        }

    def descriptors(self) -> Iterable[AgentDescriptor]:
        return self.catalog

    def get_descriptor(self, agent_id: str) -> AgentDescriptor | None:
        return next((item for item in self.catalog if item.agent_id == agent_id), None)

    def get_specialist_agent(self, agent_id: str) -> SpecialistAgent:
        descriptor = self.get_descriptor(agent_id)
        if descriptor is None or descriptor.status != AgentStatus.ACTIVE:
            raise ValueError(f"Agent '{agent_id}' is not available.")
        if agent_id not in self._specialist_agents:
            raise ValueError(f"Agent '{agent_id}' has no runtime implementation yet.")
        return self._specialist_agents[agent_id]

    def get_core_agent(self, agent_id: str) -> CoreAnalysisAgent:
        descriptor = self.get_descriptor(agent_id)
        if descriptor is None or descriptor.status != AgentStatus.ACTIVE:
            raise ValueError(f"Agent '{agent_id}' is not available.")
        if agent_id not in self._core_agents:
            raise ValueError(f"Agent '{agent_id}' has no runtime implementation yet.")
        return self._core_agents[agent_id]
