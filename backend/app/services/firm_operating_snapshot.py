from __future__ import annotations

from app.core.auth import CurrentMember
from app.services.demo_workspace import get_demo_workspace_policy
from app.services.members import list_firm_members
from app.services.personal_provider_settings import get_personal_provider_settings
from app.services.system_provider_settings import get_system_provider_settings
from app.workbench import schemas
from sqlalchemy.orm import Session


def _provider_validation_label(status: schemas.ProviderValidationStatus) -> str:
    if status == "success":
        return "驗證成功"
    if status == "invalid_api_key":
        return "API key 無效"
    if status == "base_url_unreachable":
        return "基礎網址無法連線"
    if status == "model_unavailable":
        return "模型不可用"
    if status == "timeout":
        return "請求逾時"
    if status == "unknown_error":
        return "未知錯誤"
    return "未驗證"


def get_firm_operating_snapshot(
    db: Session,
    *,
    current_member: CurrentMember,
) -> schemas.FirmOperatingSnapshotRead:
    member_state = list_firm_members(db, current_member=current_member)
    demo_policy = get_demo_workspace_policy(db, firm_id=current_member.firm.id)

    active_members = sum(1 for item in member_state.members if item.status == "active")
    demo_seat_value = f"{member_state.summary.active_demo_member_count} / {demo_policy.max_active_demo_members}"
    pending_demo_invites = member_state.summary.pending_demo_invite_count

    if current_member.membership.role == "owner":
        provider = get_system_provider_settings(db).current
        provider_attention = provider.last_validation_status != "success"
        demo_policy_attention = demo_policy.status != "active"
        pending_attention = pending_demo_invites > 0
        operating_posture = (
            "attention_needed"
            if provider_attention or demo_policy_attention or pending_attention
            else "steady"
        )
        if provider_attention:
            priority_note = "先確認 Firm Settings 的 provider 驗證狀態。"
            action_label = "檢查 Firm Settings"
            action_href = "/settings"
        elif demo_policy_attention:
            priority_note = "demo workspace 目前停用，若仍要展示，請先回 Firm Settings。"
            action_label = "調整 Demo Policy"
            action_href = "/settings"
        elif pending_attention:
            priority_note = "目前有待接受 demo 邀請，先回 Members 檢查是否需要追蹤。"
            action_label = "查看 Members"
            action_href = "/members"
        else:
            priority_note = "目前這間 firm 的登入、demo 與 provider 邊界都已站穩。"
            action_label = "查看 Members"
            action_href = "/members"

        return schemas.FirmOperatingSnapshotRead(
            role="owner",
            operating_posture=operating_posture,
            operating_summary=(
                "目前有幾個 firm operating 邊界值得先處理。"
                if operating_posture == "attention_needed"
                else "目前這間 firm 已可穩定登入、展示並正式工作。"
            ),
            priority_note=priority_note,
            action_label=action_label,
            action_href=action_href,
            signals=[
                schemas.FirmOperatingSignalRead(
                    signal_id="active_members",
                    label="已啟用成員",
                    value=str(active_members),
                    status="ok",
                    detail="目前可進正式 workspace 的成員數量。",
                ),
                schemas.FirmOperatingSignalRead(
                    signal_id="demo_seats",
                    label="demo 席位",
                    value=demo_seat_value,
                    status="attention" if demo_policy.max_active_demo_members == 0 else "ok",
                    detail="目前已啟用 demo 帳號數量與上限。",
                ),
                schemas.FirmOperatingSignalRead(
                    signal_id="pending_demo_invites",
                    label="待接受 demo 邀請",
                    value=str(pending_demo_invites),
                    status="attention" if pending_attention else "ok",
                    detail="待接受 demo 邀請過多時，owner 應回頭確認展示安排。",
                ),
                schemas.FirmOperatingSignalRead(
                    signal_id="demo_policy",
                    label="demo workspace",
                    value="啟用中" if demo_policy.status == "active" else "已停用",
                    status="attention" if demo_policy_attention else "ok",
                    detail="這條規則決定 demo 帳號能否繼續進入 `/demo`。",
                ),
                schemas.FirmOperatingSignalRead(
                    signal_id="provider_guardrail",
                    label="Firm provider",
                    value=_provider_validation_label(provider.last_validation_status),
                    status="attention" if provider_attention else "ok",
                    detail=provider.last_validation_message,
                ),
            ],
        )

    personal = get_personal_provider_settings(db, user_id=current_member.user.id).current
    personal_attention = (
        (not personal.api_key_configured)
        or personal.last_validation_status != "success"
    )
    return schemas.FirmOperatingSnapshotRead(
        role="consultant",
        operating_posture="attention_needed" if personal_attention else "steady",
        operating_summary=(
            "目前 firm 已可正式工作，但你自己的工作設定還值得先確認。"
            if personal_attention
            else "目前這間 firm 已可直接工作，你可以回到案件或交付物繼續推進。"
        ),
        priority_note=(
            "先完成 Personal Provider Settings，才能正式執行分析。"
            if personal_attention
            else "你的個人模型設定已可工作，可以直接回到案件主線。"
        ),
        action_label="完成個人模型設定" if personal_attention else "回到案件列表",
        action_href="/settings" if personal_attention else "/matters",
        signals=[
            schemas.FirmOperatingSignalRead(
                signal_id="active_members",
                label="已啟用成員",
                value=str(active_members),
                status="ok",
                detail="這間 firm 目前已啟用的成員數量。",
            ),
            schemas.FirmOperatingSignalRead(
                signal_id="demo_workspace",
                label="demo workspace",
                value="啟用中" if demo_policy.status == "active" else "已停用",
                status="ok",
                detail="這是展示環境的狀態，不影響你的正式辦案權限。",
            ),
            schemas.FirmOperatingSignalRead(
                signal_id="personal_provider",
                label="個人模型設定",
                value=_provider_validation_label(personal.last_validation_status),
                status="attention" if personal_attention else "ok",
                detail=personal.last_validation_message,
            ),
        ],
    )
