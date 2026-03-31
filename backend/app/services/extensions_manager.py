from __future__ import annotations

from collections.abc import Iterable

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain import models
from app.domain.enums import CapabilityArchetype
from app.extensions.registry import ExtensionRegistry
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
from app.services.workbench import DEFAULT_WORKBENCH_PROFILE
from app.workbench import schemas as workbench_schemas

BASE_EXTENSION_REGISTRY = ExtensionRegistry()


def _parse_capability_list(values: Iterable[str]) -> list[CapabilityArchetype]:
    capabilities: list[CapabilityArchetype] = []
    for value in values:
        try:
            capabilities.append(CapabilityArchetype(value))
        except ValueError:
            continue
    return capabilities


def _build_agent_payload(
    payload: workbench_schemas.AgentCatalogEntryUpdateRequest,
) -> dict:
    return {
        "agent_id": payload.agent_id,
        "agent_name": payload.agent_name.strip(),
        "agent_type": payload.agent_type,
        "description": payload.description.strip(),
        "supported_capabilities": [item.value for item in _parse_capability_list(payload.supported_capabilities)],
        "relevant_domain_packs": [item.strip() for item in payload.relevant_domain_packs if item.strip()],
        "relevant_industry_packs": [item.strip() for item in payload.relevant_industry_packs if item.strip()],
        "primary_responsibilities": [item.strip() for item in payload.primary_responsibilities if item.strip()],
        "out_of_scope": [item.strip() for item in payload.out_of_scope if item.strip()],
        "defer_rules": [item.strip() for item in payload.defer_rules if item.strip()],
        "preferred_execution_modes": [item.strip() for item in payload.preferred_execution_modes if item.strip()],
        "input_requirements": [item.strip() for item in payload.input_requirements if item.strip()],
        "minimum_evidence_readiness": [
            item.strip() for item in payload.minimum_evidence_readiness if item.strip()
        ],
        "required_context_fields": [item.strip() for item in payload.required_context_fields if item.strip()],
        "output_contract": [item.strip() for item in payload.output_contract if item.strip()],
        "produced_objects": [item.strip() for item in payload.produced_objects if item.strip()],
        "deliverable_impact": [item.strip() for item in payload.deliverable_impact if item.strip()],
        "writeback_expectations": [
            item.strip() for item in payload.writeback_expectations if item.strip()
        ],
        "invocation_rules": [item.strip() for item in payload.invocation_rules if item.strip()],
        "escalation_rules": [item.strip() for item in payload.escalation_rules if item.strip()],
        "handoff_targets": [item.strip() for item in payload.handoff_targets if item.strip()],
        "evaluation_focus": [item.strip() for item in payload.evaluation_focus if item.strip()],
        "failure_modes_to_watch": [
            item.strip() for item in payload.failure_modes_to_watch if item.strip()
        ],
        "trace_requirements": [item.strip() for item in payload.trace_requirements if item.strip()],
        "version": payload.version.strip(),
        "status": payload.status,
    }


def _build_pack_payload(
    payload: workbench_schemas.PackCatalogEntryUpdateRequest,
) -> dict:
    return {
        "pack_id": payload.pack_id,
        "pack_type": payload.pack_type,
        "pack_name": payload.pack_name.strip(),
        "description": payload.description.strip(),
        "domain_definition": payload.domain_definition.strip(),
        "industry_definition": payload.industry_definition.strip(),
        "common_business_models": [item.strip() for item in payload.common_business_models if item.strip()],
        "common_problem_patterns": [item.strip() for item in payload.common_problem_patterns if item.strip()],
        "stage_specific_heuristics": {
            key.strip(): [item.strip() for item in values if item.strip()]
            for key, values in payload.stage_specific_heuristics.items()
            if key.strip()
        },
        "key_kpis_or_operating_signals": [
            item.strip() for item in payload.key_kpis_or_operating_signals if item.strip()
        ],
        "key_kpis": [item.strip() for item in payload.key_kpis if item.strip()],
        "domain_lenses": [item.strip() for item in payload.domain_lenses if item.strip()],
        "relevant_client_types": [item.strip() for item in payload.relevant_client_types if item.strip()],
        "relevant_client_stages": [item.strip() for item in payload.relevant_client_stages if item.strip()],
        "default_decision_context_patterns": [
            item.strip() for item in payload.default_decision_context_patterns if item.strip()
        ],
        "evidence_expectations": [item.strip() for item in payload.evidence_expectations if item.strip()],
        "risk_libraries": [item.strip() for item in payload.risk_libraries if item.strip()],
        "common_risks": [item.strip() for item in payload.common_risks if item.strip()],
        "decision_patterns": [item.strip() for item in payload.decision_patterns if item.strip()],
        "deliverable_presets": [item.strip() for item in payload.deliverable_presets if item.strip()],
        "recommendation_patterns": [
            item.strip() for item in payload.recommendation_patterns if item.strip()
        ],
        "routing_hints": [item.strip() for item in payload.routing_hints if item.strip()],
        "pack_notes": [item.strip() for item in payload.pack_notes if item.strip()],
        "scope_boundaries": [item.strip() for item in payload.scope_boundaries if item.strip()],
        "pack_rationale": [item.strip() for item in payload.pack_rationale if item.strip()],
        "version": payload.version.strip(),
        "status": payload.status,
        "override_rules": [item.strip() for item in payload.override_rules if item.strip()],
    }


def _agent_spec_from_payload(data: dict, base: AgentSpec | None = None) -> AgentSpec:
    base_data = (
        base.model_dump(mode="json")
        if base is not None
        else {
            "agent_id": data["agent_id"],
            "agent_name": data["agent_name"],
            "agent_type": AgentType.SPECIALIST,
            "description": "",
            "supported_capabilities": [],
            "relevant_domain_packs": [],
            "relevant_industry_packs": [],
            "primary_responsibilities": [],
            "out_of_scope": [],
            "defer_rules": [],
            "preferred_execution_modes": [],
            "input_requirements": [],
            "minimum_evidence_readiness": [],
            "required_context_fields": [],
            "output_contract": [],
            "produced_objects": [],
            "deliverable_impact": [],
            "writeback_expectations": [],
            "invocation_rules": [],
            "escalation_rules": [],
            "handoff_targets": [],
            "evaluation_focus": [],
            "failure_modes_to_watch": [],
            "trace_requirements": [],
            "version": "1.0.0",
            "status": ExtensionStatus.ACTIVE,
        }
    )
    base_data.update(
        {
            "agent_id": data["agent_id"],
            "agent_name": data["agent_name"],
            "agent_type": data["agent_type"],
            "description": data["description"],
            "supported_capabilities": data["supported_capabilities"],
            "relevant_domain_packs": data["relevant_domain_packs"],
            "relevant_industry_packs": data["relevant_industry_packs"],
            "primary_responsibilities": data.get(
                "primary_responsibilities",
                base_data.get("primary_responsibilities", []),
            ),
            "out_of_scope": data.get("out_of_scope", base_data.get("out_of_scope", [])),
            "defer_rules": data.get("defer_rules", base_data.get("defer_rules", [])),
            "preferred_execution_modes": data.get(
                "preferred_execution_modes",
                base_data.get("preferred_execution_modes", []),
            ),
            "input_requirements": data.get(
                "input_requirements",
                base_data.get("input_requirements", []),
            ),
            "minimum_evidence_readiness": data.get(
                "minimum_evidence_readiness",
                base_data.get("minimum_evidence_readiness", []),
            ),
            "required_context_fields": data.get(
                "required_context_fields",
                base_data.get("required_context_fields", []),
            ),
            "output_contract": data.get("output_contract", base_data.get("output_contract", [])),
            "produced_objects": data.get("produced_objects", base_data.get("produced_objects", [])),
            "deliverable_impact": data.get(
                "deliverable_impact",
                base_data.get("deliverable_impact", []),
            ),
            "writeback_expectations": data.get(
                "writeback_expectations",
                base_data.get("writeback_expectations", []),
            ),
            "invocation_rules": data.get("invocation_rules", base_data.get("invocation_rules", [])),
            "escalation_rules": data.get("escalation_rules", base_data.get("escalation_rules", [])),
            "handoff_targets": data.get("handoff_targets", base_data.get("handoff_targets", [])),
            "evaluation_focus": data.get("evaluation_focus", base_data.get("evaluation_focus", [])),
            "failure_modes_to_watch": data.get(
                "failure_modes_to_watch",
                base_data.get("failure_modes_to_watch", []),
            ),
            "trace_requirements": data.get(
                "trace_requirements",
                base_data.get("trace_requirements", []),
            ),
            "version": data["version"],
            "status": data["status"],
        }
    )
    return AgentSpec.model_validate(base_data)


def _pack_spec_from_payload(data: dict, base: PackSpec | None = None) -> PackSpec:
    base_data = (
        base.model_dump(mode="json")
        if base is not None
        else {
            "pack_id": data["pack_id"],
            "pack_type": PackType.DOMAIN,
            "pack_name": data["pack_name"],
            "description": "",
            "domain_definition": "",
            "industry_definition": "",
            "common_business_models": [],
            "common_problem_patterns": [],
            "stage_specific_heuristics": {},
            "key_kpis_or_operating_signals": [],
            "key_kpis": [],
            "domain_lenses": [],
            "relevant_client_types": [],
            "relevant_client_stages": [],
            "default_decision_context_patterns": [],
            "evidence_expectations": [],
            "risk_libraries": [],
            "common_risks": [],
            "decision_patterns": [],
            "recommendation_patterns": [],
            "deliverable_presets": [],
            "routing_hints": [],
            "pack_notes": [],
            "scope_boundaries": [],
            "pack_rationale": [],
            "version": "1.0.0",
            "status": ExtensionStatus.ACTIVE,
            "override_rules": [],
        }
    )
    base_data.update(
        {
            "pack_id": data["pack_id"],
            "pack_type": data["pack_type"],
            "pack_name": data["pack_name"],
            "description": data["description"],
            "domain_definition": data["domain_definition"],
            "industry_definition": data["industry_definition"],
            "common_business_models": data["common_business_models"],
            "common_problem_patterns": data["common_problem_patterns"],
            "stage_specific_heuristics": data["stage_specific_heuristics"],
            "key_kpis_or_operating_signals": data["key_kpis_or_operating_signals"],
            "key_kpis": data["key_kpis"],
            "domain_lenses": data["domain_lenses"],
            "relevant_client_types": data["relevant_client_types"],
            "relevant_client_stages": data["relevant_client_stages"],
            "default_decision_context_patterns": data["default_decision_context_patterns"],
            "evidence_expectations": data["evidence_expectations"],
            "risk_libraries": data["risk_libraries"],
            "common_risks": data["common_risks"],
            "decision_patterns": data["decision_patterns"],
            "deliverable_presets": data["deliverable_presets"],
            "recommendation_patterns": data["recommendation_patterns"],
            "routing_hints": data["routing_hints"],
            "pack_notes": data["pack_notes"],
            "scope_boundaries": data["scope_boundaries"],
            "pack_rationale": data["pack_rationale"],
            "version": data["version"],
            "status": data["status"],
            "override_rules": data["override_rules"],
        }
    )
    return PackSpec.model_validate(base_data)


def _load_extension_rows(db: Session) -> list[models.WorkbenchExtensionState]:
    return db.scalars(
        select(models.WorkbenchExtensionState)
        .where(models.WorkbenchExtensionState.profile_key == DEFAULT_WORKBENCH_PROFILE)
        .order_by(models.WorkbenchExtensionState.updated_at.desc())
    ).all()


def get_extension_manager_snapshot(db: Session) -> ExtensionManagerSnapshot:
    base_snapshot = BASE_EXTENSION_REGISTRY.manager_snapshot()
    pack_map = {pack.pack_id: pack for pack in base_snapshot.pack_registry.packs}
    pack_order = [pack.pack_id for pack in base_snapshot.pack_registry.packs]
    custom_packs: list[PackSpec] = []

    agent_map = {agent.agent_id: agent for agent in base_snapshot.agent_registry.agents}
    agent_order = [agent.agent_id for agent in base_snapshot.agent_registry.agents]
    custom_agents: list[AgentSpec] = []

    for row in _load_extension_rows(db):
        payload = row.payload if isinstance(row.payload, dict) else {}
        if row.extension_kind == "agent":
            spec = _agent_spec_from_payload(payload, agent_map.get(row.extension_id))
            if row.is_custom:
                custom_agents.append(spec)
            else:
                agent_map[row.extension_id] = spec
        elif row.extension_kind == "pack":
            spec = _pack_spec_from_payload(payload, pack_map.get(row.extension_id))
            if row.is_custom:
                custom_packs.append(spec)
            else:
                pack_map[row.extension_id] = spec

    packs = [*custom_packs, *[pack_map[pack_id] for pack_id in pack_order if pack_id in pack_map]]
    agents = [*custom_agents, *[agent_map[agent_id] for agent_id in agent_order if agent_id in agent_map]]

    host_agents = [
        agent.agent_id
        for agent in agents
        if agent.agent_type == AgentType.HOST and agent.status == ExtensionStatus.ACTIVE
    ]
    if len(host_agents) != 1:
        raise HTTPException(status_code=400, detail="目前必須維持且只能維持一個啟用中的 Host 代理。")

    return ExtensionManagerSnapshot(
        pack_registry=PackRegistrySnapshot(
            packs=packs,
            active_pack_ids=[pack.pack_id for pack in packs if pack.status == ExtensionStatus.ACTIVE],
            draft_pack_ids=[pack.pack_id for pack in packs if pack.status == ExtensionStatus.DRAFT],
            inactive_pack_ids=[
                pack.pack_id
                for pack in packs
                if pack.status in {ExtensionStatus.INACTIVE, ExtensionStatus.DEPRECATED}
            ],
        ),
        agent_registry=AgentRegistrySnapshot(
            agents=agents,
            host_agent_id=host_agents[0],
            active_agent_ids=[agent.agent_id for agent in agents if agent.status == ExtensionStatus.ACTIVE],
            draft_agent_ids=[agent.agent_id for agent in agents if agent.status == ExtensionStatus.DRAFT],
            inactive_agent_ids=[
                agent.agent_id
                for agent in agents
                if agent.status in {ExtensionStatus.INACTIVE, ExtensionStatus.DEPRECATED}
            ],
        ),
    )


def upsert_agent_catalog_entry(
    db: Session,
    agent_id: str,
    payload: workbench_schemas.AgentCatalogEntryUpdateRequest,
) -> ExtensionManagerSnapshot:
    if agent_id != payload.agent_id:
        raise HTTPException(status_code=400, detail="代理識別碼不一致。")

    base_agent = BASE_EXTENSION_REGISTRY.get_agent(agent_id)
    if payload.is_custom and payload.agent_type == "host":
        raise HTTPException(status_code=400, detail="Host 代理維持系統協調中心，本輪不新增第二個 Host。")
    if payload.agent_type == "host" and payload.status != "active":
        raise HTTPException(status_code=400, detail="Host 代理必須維持啟用狀態。")
    if not payload.is_custom and base_agent is None:
        raise HTTPException(status_code=404, detail="找不到指定系統代理。")

    row = db.scalars(
        select(models.WorkbenchExtensionState)
        .where(models.WorkbenchExtensionState.profile_key == DEFAULT_WORKBENCH_PROFILE)
        .where(models.WorkbenchExtensionState.extension_kind == "agent")
        .where(models.WorkbenchExtensionState.extension_id == agent_id)
    ).one_or_none()
    if row is None:
        row = models.WorkbenchExtensionState(
            profile_key=DEFAULT_WORKBENCH_PROFILE,
            extension_kind="agent",
            extension_id=agent_id,
        )

    row.is_custom = payload.is_custom
    row.payload = _build_agent_payload(payload)
    db.add(row)
    db.commit()
    return get_extension_manager_snapshot(db)


def upsert_pack_catalog_entry(
    db: Session,
    pack_id: str,
    payload: workbench_schemas.PackCatalogEntryUpdateRequest,
) -> ExtensionManagerSnapshot:
    if pack_id != payload.pack_id:
        raise HTTPException(status_code=400, detail="模組包識別碼不一致。")

    base_pack = BASE_EXTENSION_REGISTRY.get_pack(pack_id)
    if not payload.is_custom and base_pack is None:
        raise HTTPException(status_code=404, detail="找不到指定系統模組包。")

    row = db.scalars(
        select(models.WorkbenchExtensionState)
        .where(models.WorkbenchExtensionState.profile_key == DEFAULT_WORKBENCH_PROFILE)
        .where(models.WorkbenchExtensionState.extension_kind == "pack")
        .where(models.WorkbenchExtensionState.extension_id == pack_id)
    ).one_or_none()
    if row is None:
        row = models.WorkbenchExtensionState(
            profile_key=DEFAULT_WORKBENCH_PROFILE,
            extension_kind="pack",
            extension_id=pack_id,
        )

    row.is_custom = payload.is_custom
    row.payload = _build_pack_payload(payload)
    db.add(row)
    db.commit()
    return get_extension_manager_snapshot(db)
