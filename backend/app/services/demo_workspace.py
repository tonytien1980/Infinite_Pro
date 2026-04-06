from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.demo import schemas as demo_schemas
from app.domain import models


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
        title="Infinite Pro Demo Workspace",
        subtitle=f"固定展示資料｜唯讀｜seed {policy.seed_version}",
        entry_message="你目前正在 demo workspace。這裡只能看，不能新增、修改、分析或治理。",
        sections=[
            demo_schemas.DemoWorkspaceSectionRead(
                section_id="sample_matters",
                title="Sample Matters",
                summary="展示案件世界與主要工作面會長成什麼樣子。",
                items=[
                    "創業階段成長診斷",
                    "制度化階段營運 review",
                ],
            ),
            demo_schemas.DemoWorkspaceSectionRead(
                section_id="sample_deliverables",
                title="Sample Deliverables",
                summary="展示交付物如何從案件世界與 shared intelligence 收斂出來。",
                items=[
                    "旗艦診斷 memo",
                    "持續顧問 follow-up brief",
                ],
            ),
            demo_schemas.DemoWorkspaceSectionRead(
                section_id="sample_history",
                title="Sample History",
                summary="展示 history、precedent、shared intelligence 的唯讀讀法。",
                items=[
                    "precedent review lane",
                    "phase 4 closure review",
                ],
            ),
            demo_schemas.DemoWorkspaceSectionRead(
                section_id="workspace_rules",
                title="Demo Rules",
                summary="說明 demo workspace 的正式邊界。",
                items=[
                    "不能新增案件",
                    "不能上傳材料",
                    "不能執行分析",
                    "不能碰正式資料",
                ],
            ),
        ],
    )
