from __future__ import annotations

from app.extensions.schemas import (
    PackContractBaseline,
    PackContractInterfaceId,
    PackContractRequirement,
    PackContractStatus,
    PackRequiredPropertyId,
    PackRuleBindingId,
    PackSpec,
)


INTERFACE_BLUEPRINTS: dict[
    PackContractInterfaceId,
    dict[str, list[PackRequiredPropertyId] | list[PackRuleBindingId] | str],
] = {
    PackContractInterfaceId.EVIDENCE_READINESS_V1: {
        "required_property_ids": [
            PackRequiredPropertyId.DEFINITION,
            PackRequiredPropertyId.COMMON_PROBLEM_PATTERNS,
            PackRequiredPropertyId.EVIDENCE_EXPECTATIONS,
        ],
        "rule_binding_ids": [PackRuleBindingId.READINESS_GATE_V1],
        "summary": "讓 pack 的證據期待變成正式 readiness gate，而不是鬆散提示。",
    },
    PackContractInterfaceId.DECISION_FRAMING_V1: {
        "required_property_ids": [
            PackRequiredPropertyId.DEFINITION,
            PackRequiredPropertyId.DEFAULT_DECISION_CONTEXT_PATTERNS,
            PackRequiredPropertyId.DECISION_PATTERNS,
        ],
        "rule_binding_ids": [PackRuleBindingId.DECISION_CONTEXT_HINT_V1],
        "summary": "讓 pack 能用穩定的 decision framing hints 影響 Host framing 與 normalization。",
    },
    PackContractInterfaceId.DELIVERABLE_SHAPING_V1: {
        "required_property_ids": [
            PackRequiredPropertyId.DELIVERABLE_PRESETS,
            PackRequiredPropertyId.ROUTING_HINTS,
            PackRequiredPropertyId.PACK_RATIONALE,
        ],
        "rule_binding_ids": [PackRuleBindingId.DELIVERABLE_HINT_V1],
        "summary": "讓 pack 的交付傾向與路由提示透過正式 contract 進入 deliverable shaping。",
    },
}

DOMAIN_INTERFACE_EXTRA_REQUIREMENTS: dict[
    PackContractInterfaceId,
    list[PackRequiredPropertyId],
] = {
    PackContractInterfaceId.EVIDENCE_READINESS_V1: [
        PackRequiredPropertyId.KEY_SIGNALS,
    ],
    PackContractInterfaceId.DECISION_FRAMING_V1: [
        PackRequiredPropertyId.STAGE_SPECIFIC_HEURISTICS,
        PackRequiredPropertyId.COMMON_RISKS,
    ],
    PackContractInterfaceId.DELIVERABLE_SHAPING_V1: [
        PackRequiredPropertyId.KEY_SIGNALS,
    ],
}

INDUSTRY_INTERFACE_EXTRA_REQUIREMENTS: dict[
    PackContractInterfaceId,
    list[PackRequiredPropertyId],
] = {
    PackContractInterfaceId.EVIDENCE_READINESS_V1: [
        PackRequiredPropertyId.KEY_SIGNALS,
    ],
    PackContractInterfaceId.DECISION_FRAMING_V1: [
        PackRequiredPropertyId.COMMON_BUSINESS_MODELS,
    ],
    PackContractInterfaceId.DELIVERABLE_SHAPING_V1: [
        PackRequiredPropertyId.KEY_SIGNALS,
    ],
}


def _unique_preserve_order(values: list[str]) -> list[str]:
    ordered: list[str] = []
    seen: set[str] = set()
    for value in values:
        normalized = value.strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        ordered.append(normalized)
    return ordered


def _definition_for_pack(pack: PackSpec) -> str:
    return (pack.domain_definition or pack.industry_definition or pack.description).strip()


def _property_is_ready(pack: PackSpec, property_id: PackRequiredPropertyId) -> bool:
    if property_id == PackRequiredPropertyId.DEFINITION:
        return bool(_definition_for_pack(pack))
    if property_id == PackRequiredPropertyId.COMMON_BUSINESS_MODELS:
        return len(pack.common_business_models) > 0
    if property_id == PackRequiredPropertyId.COMMON_PROBLEM_PATTERNS:
        return len(pack.common_problem_patterns) > 0
    if property_id == PackRequiredPropertyId.EVIDENCE_EXPECTATIONS:
        return len(pack.evidence_expectations) > 0
    if property_id == PackRequiredPropertyId.STAGE_SPECIFIC_HEURISTICS:
        return any(values for values in pack.stage_specific_heuristics.values())
    if property_id == PackRequiredPropertyId.KEY_SIGNALS:
        return len(pack.key_kpis_or_operating_signals or pack.key_kpis) > 0
    if property_id == PackRequiredPropertyId.COMMON_RISKS:
        return len(pack.common_risks) > 0
    if property_id == PackRequiredPropertyId.DEFAULT_DECISION_CONTEXT_PATTERNS:
        return len(pack.default_decision_context_patterns) > 0
    if property_id == PackRequiredPropertyId.DECISION_PATTERNS:
        return len(pack.decision_patterns) > 0
    if property_id == PackRequiredPropertyId.DELIVERABLE_PRESETS:
        return len(pack.deliverable_presets) > 0
    if property_id == PackRequiredPropertyId.ROUTING_HINTS:
        return len(pack.routing_hints) > 0
    if property_id == PackRequiredPropertyId.PACK_RATIONALE:
        return len(pack.pack_rationale) > 0
    return False


def _required_property_ids_for_interface(
    pack: PackSpec,
    interface_id: PackContractInterfaceId,
) -> list[PackRequiredPropertyId]:
    required_property_ids = list(INTERFACE_BLUEPRINTS[interface_id]["required_property_ids"])
    if pack.pack_type.value == "domain":
        required_property_ids.extend(DOMAIN_INTERFACE_EXTRA_REQUIREMENTS.get(interface_id, []))
    if pack.pack_type.value == "industry":
        required_property_ids.extend(INDUSTRY_INTERFACE_EXTRA_REQUIREMENTS.get(interface_id, []))
    deduped: list[PackRequiredPropertyId] = []
    seen: set[PackRequiredPropertyId] = set()
    for property_id in required_property_ids:
        if property_id in seen:
            continue
        seen.add(property_id)
        deduped.append(property_id)
    return deduped


def build_pack_contract_baseline(pack: PackSpec) -> PackContractBaseline:
    requirements: list[PackContractRequirement] = []
    ready_interface_ids: list[PackContractInterfaceId] = []
    ready_rule_binding_ids: list[PackRuleBindingId] = []
    missing_required_property_ids: list[PackRequiredPropertyId] = []

    for interface_id, blueprint in INTERFACE_BLUEPRINTS.items():
        required_property_ids = _required_property_ids_for_interface(pack, interface_id)
        rule_binding_ids = list(blueprint["rule_binding_ids"])
        summary = str(blueprint["summary"])
        missing = [
            property_id
            for property_id in required_property_ids
            if not _property_is_ready(pack, property_id)
        ]
        status = (
            PackContractStatus.READY
            if not missing
            else PackContractStatus.MISSING_REQUIRED_PROPERTIES
        )
        requirements.append(
            PackContractRequirement(
                interface_id=interface_id,
                required_property_ids=required_property_ids,
                missing_required_property_ids=missing,
                rule_binding_ids=rule_binding_ids,
                status=status,
                summary=summary,
            )
        )
        if not missing:
            ready_interface_ids.append(interface_id)
            ready_rule_binding_ids.extend(rule_binding_ids)
        else:
            missing_required_property_ids.extend(missing)

    return PackContractBaseline(
        pack_api_name=pack.pack_id,
        requirements=requirements,
        ready_interface_ids=ready_interface_ids,
        ready_rule_binding_ids=[
            PackRuleBindingId(item)
            for item in _unique_preserve_order([item.value for item in ready_rule_binding_ids])
        ],
        missing_required_property_ids=[
            PackRequiredPropertyId(item)
            for item in _unique_preserve_order([item.value for item in missing_required_property_ids])
        ],
        status=(
            PackContractStatus.READY
            if not missing_required_property_ids
            else PackContractStatus.MISSING_REQUIRED_PROPERTIES
        ),
    )


def apply_pack_contract_baseline(pack: PackSpec) -> PackSpec:
    payload = pack.model_dump(mode="json")
    payload["contract_baseline"] = build_pack_contract_baseline(pack).model_dump(mode="json")
    return PackSpec(**payload)


def validate_active_pack_contract(pack: PackSpec) -> list[str]:
    baseline = build_pack_contract_baseline(pack)
    if baseline.status == PackContractStatus.READY:
        return []

    errors: list[str] = []
    for requirement in baseline.requirements:
        if requirement.status == PackContractStatus.READY:
            continue
        missing = "、".join(item.value for item in requirement.missing_required_property_ids)
        errors.append(
            f"{requirement.interface_id.value} 缺少必要欄位：{missing}。"
        )
    return errors
