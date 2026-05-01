from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.auth import CurrentMember
from app.domain import models


def is_owner(member: CurrentMember) -> bool:
    return member.membership.role == "owner"


def _not_found() -> HTTPException:
    return HTTPException(status_code=404, detail="找不到指定案件或目前身份不可讀取。")


def stamp_task_ownership(task: models.Task, member: CurrentMember) -> None:
    task.firm_id = member.firm.id
    task.created_by_user_id = member.user.id


def stamp_matter_ownership(matter_workspace: models.MatterWorkspace, member: CurrentMember) -> None:
    matter_workspace.firm_id = member.firm.id
    matter_workspace.created_by_user_id = member.user.id


def scoped_matter_key(raw_matter_key: object, member: CurrentMember) -> str:
    owner_or_user_scope = "owner" if is_owner(member) else member.user.id
    return f"{member.firm.id}:{owner_or_user_scope}:{str(raw_matter_key)}"


def scope_matter_identity(identity: dict[str, object], member: CurrentMember) -> dict[str, object]:
    scoped = dict(identity)
    scoped["matter_key"] = scoped_matter_key(scoped["matter_key"], member)
    return scoped


def task_access_statement(member: CurrentMember):
    base = select(models.Task)
    if is_owner(member):
        return base.where(or_(models.Task.firm_id == member.firm.id, models.Task.firm_id.is_(None)))
    return base.where(
        models.Task.firm_id == member.firm.id,
        models.Task.created_by_user_id == member.user.id,
    )


def matter_access_statement(member: CurrentMember):
    base = select(models.MatterWorkspace)
    if is_owner(member):
        return base.where(
            or_(
                models.MatterWorkspace.firm_id == member.firm.id,
                models.MatterWorkspace.firm_id.is_(None),
            )
        )
    return base.where(
        models.MatterWorkspace.firm_id == member.firm.id,
        models.MatterWorkspace.created_by_user_id == member.user.id,
    )


def assert_task_access(task: models.Task | None, member: CurrentMember) -> models.Task:
    if task is None:
        raise _not_found()
    if is_owner(member):
        if task.firm_id in {None, member.firm.id}:
            return task
        raise _not_found()
    if task.firm_id == member.firm.id and task.created_by_user_id == member.user.id:
        return task
    raise _not_found()


def assert_matter_access(
    matter_workspace: models.MatterWorkspace | None,
    member: CurrentMember,
) -> models.MatterWorkspace:
    if matter_workspace is None:
        raise _not_found()
    if is_owner(member):
        if matter_workspace.firm_id in {None, member.firm.id}:
            return matter_workspace
        raise _not_found()
    if (
        matter_workspace.firm_id == member.firm.id
        and matter_workspace.created_by_user_id == member.user.id
    ):
        return matter_workspace
    raise _not_found()


def assert_deliverable_access(db: Session, deliverable_id: str, member: CurrentMember) -> models.Deliverable:
    deliverable = db.scalar(select(models.Deliverable).where(models.Deliverable.id == deliverable_id))
    if deliverable is None:
        raise _not_found()
    task = db.get(models.Task, deliverable.task_id)
    assert_task_access(task, member)
    return deliverable
