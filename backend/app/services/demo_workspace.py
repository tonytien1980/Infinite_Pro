from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.demo import schemas as demo_schemas
from app.domain import models
from app.workbench import schemas as workbench_schemas


def _get_or_create_demo_workspace_policy(
    db: Session,
    *,
    firm_id: str,
) -> models.DemoWorkspacePolicy:
    policy = db.scalar(
        select(models.DemoWorkspacePolicy).where(
            models.DemoWorkspacePolicy.firm_id == firm_id
        )
    )
    if policy is not None:
        return policy

    policy = models.DemoWorkspacePolicy(firm_id=firm_id)
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


def get_demo_workspace_snapshot(
    db: Session,
    *,
    firm_id: str,
) -> demo_schemas.DemoWorkspaceRead:
    policy = _get_or_create_demo_workspace_policy(db, firm_id=firm_id)

    return demo_schemas.DemoWorkspaceRead(
        title="Infinite Pro 示範工作台",
        subtitle=f"固定展示資料｜唯讀｜seed {policy.seed_version}",
        entry_message="你目前正在示範工作台。這裡只供瀏覽，不能新增、修改、分析或管理。",
        hero_summary="這裡展示的是 Infinite Pro 如何把案件脈絡、結果與報告、共享判讀串成同一條工作流程。",
        showcase_highlights=[
            "案件主控台",
            "結果與報告的收斂讀法",
            "歷史紀錄與共享判讀的唯讀展示",
        ],
        read_only_rules=[
            "不能新增案件",
            "不能上傳材料",
            "不能執行分析",
            "不能碰正式資料",
        ],
        formal_workspace_explainer="正式版工作台會讓顧問進入自己的辦案路徑；示範工作台則只展示產品如何工作，不提供操作權限。",
        sections=[
            demo_schemas.DemoWorkspaceSectionRead(
                section_id="sample_matters",
                title="示範案件",
                summary="展示案件與主要工作台會長成什麼樣子。",
                items=[
                    "創業階段成長診斷",
                    "制度化階段營運檢視",
                ],
            ),
            demo_schemas.DemoWorkspaceSectionRead(
                section_id="sample_deliverables",
                title="示範結果",
                summary="展示結果與報告如何從案件脈絡與共享判讀收斂出來。",
                items=[
                    "旗艦診斷備忘錄",
                    "持續顧問後續摘要",
                ],
            ),
            demo_schemas.DemoWorkspaceSectionRead(
                section_id="sample_history",
                title="示範紀錄",
                summary="展示歷史紀錄、可重用內容與共享判讀的唯讀讀法。",
                items=[
                    "重用檢視",
                    "收尾檢查示例",
                ],
            ),
            demo_schemas.DemoWorkspaceSectionRead(
                section_id="workspace_rules",
                title="示範規則",
                summary="說明示範工作台的正式邊界。",
                items=[
                    "不能新增案件",
                    "不能上傳材料",
                    "不能執行分析",
                    "不能碰正式資料",
                ],
            ),
        ],
    )


def get_demo_workspace_policy(
    db: Session,
    *,
    firm_id: str,
) -> workbench_schemas.DemoWorkspacePolicyRead:
    policy = _get_or_create_demo_workspace_policy(db, firm_id=firm_id)
    return workbench_schemas.DemoWorkspacePolicyRead(
        status="active" if policy.status == "active" else "inactive",
        workspace_slug=policy.workspace_slug,
        seed_version=policy.seed_version,
        max_active_demo_members=policy.max_active_demo_members,
    )


def update_demo_workspace_policy(
    db: Session,
    *,
    firm_id: str,
    payload: workbench_schemas.DemoWorkspacePolicyUpdateRequest,
) -> workbench_schemas.DemoWorkspacePolicyRead:
    policy = _get_or_create_demo_workspace_policy(db, firm_id=firm_id)
    policy.status = "active" if payload.status == "active" else "inactive"
    policy.max_active_demo_members = payload.max_active_demo_members
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return get_demo_workspace_policy(db, firm_id=firm_id)
