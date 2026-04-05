from __future__ import annotations

from hashlib import sha1

from app.domain import schemas
from app.domain.enums import DeliverableClass, EngagementContinuityMode
from app.services.precedent_intelligence import select_weighted_precedent_reference_items


TASK_HEURISTIC_PLAYBOOKS: dict[str, dict[str, object]] = {
    "contract_review": {
        "label": "合約審閱工作主線",
        "stages": [
            (
                "先補齊審閱範圍與條款邊界",
                "先確認哪些條款、附件、定義與資料處理內容真的在本輪審閱範圍內。",
                "這類案件若太早跳進細節判斷，最容易忽略附件、定義與邊界缺口。",
            ),
            (
                "再收斂高風險點與談判邊界",
                "把 termination、liability、indemnity、驗收與資料條款收斂成可判斷的高風險區塊。",
                "這一段會直接決定是可接受、需重談，還是暫時不宜推進。",
            ),
            (
                "最後整理成審閱備忘與建議處置",
                "把主要發現、風險與建議處置收成可回看的 review memo。",
                "這樣能先把 judgment 站穩，而不是太早假裝已完成最終決策版本。",
            ),
        ],
    },
    "research_synthesis": {
        "label": "研究綜整工作主線",
        "stages": [
            (
                "先定義研究問題與證據門檻",
                "先分清楚這輪要回答什麼、哪些屬於正式事實、哪些還只是待驗證假設。",
                "研究案最怕一開始就把探索性內容寫成結論。",
            ),
            (
                "再整理來源品質與主要發現",
                "把來源新鮮度、證據強度與主要發現放到同一條閱讀順序裡。",
                "這能避免只剩濃縮摘要，卻看不出哪些判斷其實還站不穩。",
            ),
            (
                "最後分開可採納結論與待補問題",
                "把目前可採納的判斷、風險與仍待補的問題清楚拆開。",
                "後續交付與 follow-up 才不會把探索性內容誤當既定結論。",
            ),
        ],
    },
    "document_restructuring": {
        "label": "文件重構工作主線",
        "stages": [
            (
                "先對齊受眾、用途與不能改動的內容",
                "先分清楚這份文件是給誰看、要推進什麼、哪些原始訊息必須保留。",
                "文件重構不是重寫成另一份新文件，先守住目的與邊界最重要。",
            ),
            (
                "再重排結構與主線順序",
                "把主結論、支撐點與段落順序排成更好讀的版本。",
                "這一步是在改善閱讀判斷，不是只調整表面排版。",
            ),
            (
                "最後收成重構建議與改寫方向",
                "把建議結構、改寫方向與待補資料整理成可執行的改稿依據。",
                "這樣下一步才知道是直接改文，還是先補背景與原始素材。",
            ),
        ],
    },
    "complex_convergence": {
        "label": "複雜收斂工作主線",
        "stages": [
            (
                "先定義這輪真正要收斂的決策",
                "先確認要替誰收斂哪個 judgment，以及目前允許的取捨邊界。",
                "複雜案最容易卡在每個人都在討論，但其實沒有對齊同一個決策。",
            ),
            (
                "再比較主要方案、風險與依賴",
                "把不同方案的差異、高影響風險與落地依賴放到同一條比較主線。",
                "這一步能避免只剩抽象方向，卻沒有看見真正會卡住落地的條件。",
            ),
            (
                "最後定一個最值得先落地的下一步",
                "把最有價值的下一個動作、其 owner 與依賴條件定清楚。",
                "收斂後若沒有最先做的那一步，團隊通常還是會停在抽象共識。",
            ),
        ],
    },
}


def _normalize_key(value: str) -> str:
    return " ".join(value.strip().lower().split())


def _build_stage_id(source_kind: str, title: str) -> str:
    return f"{source_kind}:{sha1(title.encode('utf-8')).hexdigest()[:12]}"


def _coerce_pack_stage_title(value: str) -> str:
    title = value.strip()
    if not title:
        return ""
    if title.startswith(("先", "再", "最後")):
        return title
    return f"先處理：{title}"


def _playbook_label(task_type: str, deliverable_class_hint: DeliverableClass) -> str:
    heuristic = TASK_HEURISTIC_PLAYBOOKS.get(task_type)
    if heuristic:
        return str(heuristic["label"])
    if deliverable_class_hint == DeliverableClass.DECISION_ACTION_DELIVERABLE:
        return "決策收斂工作主線"
    if deliverable_class_hint == DeliverableClass.ASSESSMENT_REVIEW_MEMO:
        return "審閱 / 評估工作主線"
    return "探索 / 診斷工作主線"


def build_domain_playbook_guidance(
    *,
    task_type: str,
    client_stage: str | None,
    deliverable_class_hint: DeliverableClass,
    flagship_lane: schemas.FlagshipLaneRead,
    research_guidance: schemas.ResearchGuidanceRead,
    organization_memory_guidance: schemas.OrganizationMemoryGuidanceRead,
    continuation_surface: schemas.ContinuationSurfaceRead | None,
    pack_resolution: schemas.PackResolutionRead,
    precedent_reference_guidance: schemas.PrecedentReferenceGuidanceRead,
) -> schemas.DomainPlaybookGuidanceRead:
    stages: list[schemas.DomainPlaybookStageRead] = []
    seen_keys: set[str] = set()
    source_kinds_used: list[str] = []
    source_lifecycle_summary = ""

    def add_stage(
        *,
        title: str,
        summary: str,
        why_now: str,
        source_kind: str,
        source_label: str,
        priority: str,
    ) -> None:
        key = _normalize_key(title)
        if not title or key in seen_keys or len(stages) >= 4:
            return
        seen_keys.add(key)
        if source_kind not in source_kinds_used:
            source_kinds_used.append(source_kind)
        stages.append(
            schemas.DomainPlaybookStageRead(
                stage_id=_build_stage_id(source_kind, title),
                title=title,
                summary=summary,
                why_now=why_now,
                source_kind=source_kind,  # type: ignore[arg-type]
                source_label=source_label,
                priority=priority,  # type: ignore[arg-type]
            )
        )

    if (
        organization_memory_guidance.status == "available"
        and organization_memory_guidance.cross_matter_items
    ):
        top_related = organization_memory_guidance.cross_matter_items[0]
        organization_memory_is_background_only = (
            len(organization_memory_guidance.cross_matter_items) == 1
            or top_related.freshness_label == "較舊背景"
        )
        add_stage(
            title="先對照同客戶既有案件的限制與推進節奏",
            summary=top_related.summary or "同客戶既有案件已留下可回看的穩定背景。",
            why_now=(
                "同客戶跨案件背景目前仍偏背景參考，先拿來校正，不要讓它單獨主導整條工作主線。"
                if organization_memory_is_background_only
                else top_related.relation_reason or organization_memory_guidance.cross_matter_summary
            ),
            source_kind="organization_memory",
            source_label=(
                "來源：cross-matter organization memory（先留背景）"
                if organization_memory_is_background_only
                else "來源：cross-matter organization memory（穩定背景）"
            ),
            priority="medium" if organization_memory_is_background_only else ("high" if not stages else "medium"),
        )
        source_lifecycle_summary = (
            "shared sources 目前仍偏背景校正，先不要讓單一 precedent 或跨案件背景主導整條工作主線。"
            if organization_memory_is_background_only
            else "shared sources 目前已有較穩定來源，可直接拿來校正工作主線。"
        )

    if research_guidance.status in {"recommended", "active"}:
        add_stage(
            title="先補研究與外部事實",
            summary=research_guidance.suggested_questions[0] if research_guidance.suggested_questions else research_guidance.summary,
            why_now=research_guidance.summary or "這輪仍有明顯外部研究缺口，先把公開事實補齊會比直接收斂更穩。",
            source_kind="research_guidance",
            source_label="來源：research guidance",
            priority="high",
        )

    if precedent_reference_guidance.status == "available":
        weighted_matches = select_weighted_precedent_reference_items(
            precedent_reference_guidance,
            asset_code="domain_playbook",
            limit=1,
        )
        top_match = weighted_matches[0] if weighted_matches else None
        if top_match is not None:
            precedent_is_background_only = top_match.shared_intelligence_signal.stability != "stable"
            add_stage(
                title=f"對照「{top_match.title or '既有模式'}」校正本輪推進順序",
                summary=top_match.summary or top_match.reusable_reason or "先沿用相似 precedent 的工作主線校正這輪順序。",
                why_now=(
                    "這筆 precedent 目前仍偏觀察 / 恢復期，先拿來校正順序，不要讓它單獨主導整條工作主線。"
                    if precedent_is_background_only
                    else top_match.match_reason or "目前已有相似 precedent，可先用它確認這輪不要走偏。"
                ),
                source_kind="precedent_reference",
                source_label=(
                    "來源：precedent reference（先留背景）"
                    if precedent_is_background_only
                    else (
                        "來源：precedent reference（共享模式優先）"
                        if top_match.shared_intelligence_signal.weight_action == "upweight"
                        else "來源：precedent reference"
                    )
                ),
                priority="medium" if precedent_is_background_only else ("high" if not stages else "medium"),
            )
            if not source_lifecycle_summary:
                source_lifecycle_summary = (
                    "shared sources 目前仍偏背景校正，先不要讓單一 precedent 或跨案件背景主導整條工作主線。"
                    if precedent_is_background_only
                    else "shared sources 目前已有較穩定來源，可直接拿來校正工作主線。"
                )

    pack_stage_added = False
    for pack in [*pack_resolution.selected_domain_packs, *pack_resolution.selected_industry_packs]:
        stage_heuristics: list[str] = []
        if client_stage and pack.stage_specific_heuristics.get(client_stage):
            stage_heuristics = pack.stage_specific_heuristics[client_stage]
        elif pack.stage_specific_heuristics:
            stage_heuristics = next(iter(pack.stage_specific_heuristics.values()))
        for stage_hint in stage_heuristics[:1]:
            title = _coerce_pack_stage_title(stage_hint)
            add_stage(
                title=title,
                summary=f"{pack.pack_name} 已在目前案件中被選入，這一步可先用來穩住 domain workflow。",
                why_now="這是 pack 在當前 client stage 下較穩的工作順序提示。",
                source_kind="pack_stage_heuristic",
                source_label="來源：pack stage heuristic",
                priority="high" if not stages else "medium",
            )
            pack_stage_added = True
            break
        if pack_stage_added:
            break

    heuristic = TASK_HEURISTIC_PLAYBOOKS.get(task_type, {})
    for index, item in enumerate(heuristic.get("stages", [])):  # type: ignore[union-attr]
        title, summary, why_now = item
        add_stage(
            title=title,
            summary=summary,
            why_now=why_now,
            source_kind="task_heuristic",
            source_label="來源：task heuristic",
            priority="high" if not stages and index == 0 else "medium",
        )

    if continuation_surface and continuation_surface.mode != EngagementContinuityMode.ONE_OFF:
        continuation_title = (
            "把最新 checkpoint 寫回主線並決定這輪更新範圍"
            if continuation_surface.workflow_layer == "checkpoint"
            else "把最新結果寫回主線並排好下一步推進"
        )
        continuation_summary = (
            continuation_surface.timeline_items[0].summary
            if continuation_surface.timeline_items
            else continuation_surface.summary
        )
        continuation_next = (
            continuation_surface.next_step_queue[0]
            if continuation_surface.next_step_queue
            else "先把這輪變化正式寫回，再決定是否刷新交付物。"
        )
        add_stage(
            title=continuation_title,
            summary=continuation_summary,
            why_now=continuation_next,
            source_kind="continuity_signal",
            source_label="來源：continuation surface",
            priority="medium",
        )

    if not stages:
        return schemas.DomainPlaybookGuidanceRead(
            status="none",
            label="目前沒有可收斂的 domain playbook",
            summary="這一輪先依現有證據與主問題推進，不額外補工作主線提示。",
            fit_summary="",
            source_mix_summary="",
            source_lifecycle_summary="",
            boundary_note="domain playbook 是在提示這類案子通常怎麼走，不是強制 checklist。",
        )

    current_stage_label = stages[0].title
    next_stage_label = stages[1].title if len(stages) > 1 else ""
    playbook_label = _playbook_label(task_type, deliverable_class_hint)
    if organization_memory_guidance.status == "available" and organization_memory_guidance.continuity_anchor:
        playbook_label = f"{playbook_label}｜{organization_memory_guidance.continuity_anchor}"
    playbook_label = playbook_label.replace("｜這案目前延續", "｜延續").strip()

    summary = (
        f"Host 先整理出「{_playbook_label(task_type, deliverable_class_hint)}」，"
        f"這輪目前先做「{current_stage_label}」"
    )
    if next_stage_label:
        summary += f"，下一步通常接「{next_stage_label}」。"
    else:
        summary += "。"

    fit_parts: list[str] = []
    if (
        organization_memory_guidance.status == "available"
        and organization_memory_guidance.cross_matter_items
    ):
        fit_parts.append("同客戶跨案件背景已成立")
    if precedent_reference_guidance.status == "available":
        fit_parts.append("已有可參考的既有模式")
    if research_guidance.status in {"recommended", "active"}:
        fit_parts.append("研究與外部事實仍在影響主線")
    if any(item.source_kind == "pack_stage_heuristic" for item in stages):
        fit_parts.append("pack stage heuristic 已提供較穩的順序提示")
    if not fit_parts:
        fit_parts.append("目前仍以 task heuristic 補最小可信工作主線")
    fit_summary = "這輪為何適用：" + "、".join(fit_parts) + "。"

    source_label_map = {
        "organization_memory": "cross-matter organization memory",
        "precedent_reference": "precedent reference",
        "research_guidance": "research guidance",
        "pack_stage_heuristic": "pack stage heuristic",
        "continuity_signal": "continuity signal",
        "task_heuristic": "task heuristic",
    }
    source_mix_summary = "收斂依據：" + "、".join(
        source_label_map[item] for item in source_kinds_used if item in source_label_map
    )
    if not source_lifecycle_summary:
        source_lifecycle_summary = "目前仍以 pack / task heuristic 為主，shared source 還不夠厚。"

    return schemas.DomainPlaybookGuidanceRead(
        status="available" if any(item.source_kind != "task_heuristic" for item in stages) else "fallback",
        label="這類案子通常怎麼走",
        summary=summary,
        playbook_label=playbook_label,
        current_stage_label=current_stage_label,
        next_stage_label=next_stage_label,
        fit_summary=fit_summary,
        source_mix_summary=source_mix_summary,
        source_lifecycle_summary=source_lifecycle_summary,
        boundary_note="這是在提示工作主線，不是強制 checklist；若和這案正式證據衝突，仍以這案正式判斷為準。",
        stages=stages,
    )
