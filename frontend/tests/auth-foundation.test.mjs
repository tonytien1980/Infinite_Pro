import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildPrimaryNavForMembershipRole,
  canManageMembers,
  canManageExtensions,
  isPublicAppPath,
} from "../src/lib/permissions.ts";
import { getLoginPath, resolveLoginNextPath } from "../src/lib/session.ts";
import {
  labelForFirmOperatingPosture,
  summarizeFirmOperatingSignals,
} from "../src/lib/firm-operating.ts";
import { buildPhaseFiveClosureView } from "../src/lib/phase-five-closure.ts";

test("owner sees members nav and consultant does not", () => {
  const ownerNav = buildPrimaryNavForMembershipRole("owner");
  const consultantNav = buildPrimaryNavForMembershipRole("consultant");

  assert.equal(ownerNav.some((item) => item.href === "/members"), true);
  assert.equal(consultantNav.some((item) => item.href === "/members"), false);
});

test("public login path stays public but app routes do not", () => {
  assert.equal(isPublicAppPath("/login"), true);
  assert.equal(isPublicAppPath("/matters"), false);
});

test("login path and next-path helper keep protected return targets safe and stable", () => {
  assert.equal(getLoginPath("/demo"), "/login?next=%2Fdemo");
  assert.equal(resolveLoginNextPath("?next=%2Fdemo"), "/demo");
  assert.equal(resolveLoginNextPath("?next=%2Fmatters%2Fabc"), "/matters/abc");
  assert.equal(resolveLoginNextPath("?next=https%3A%2F%2Fevil.example"), null);
  assert.equal(resolveLoginNextPath("?next=%2F%2Fevil.example"), null);
  assert.equal(resolveLoginNextPath("?next=demo"), null);
});

test("login page forwards the preserved next path into Google start", () => {
  const source = readFileSync(
    new URL("../src/components/login-page-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /resolveLoginNextPath/);
  assert.match(source, /startGoogleLogin\(nextPath \|\| undefined\)/);
});

test("consultant can view agents packs but cannot manage extensions", () => {
  assert.equal(canManageMembers("consultant"), false);
  assert.equal(canManageExtensions("consultant"), false);
});

test("firm operating posture labels stay low-noise and readable", () => {
  assert.equal(labelForFirmOperatingPosture("steady"), "目前運作穩定");
  assert.equal(
    labelForFirmOperatingPosture("attention_needed"),
    "有幾個地方值得先處理",
  );
});

test("firm operating signal summary keeps top items compact", () => {
  assert.equal(
    summarizeFirmOperatingSignals([
      { signalId: "provider_guardrail", label: "Firm provider", value: "驗證成功", status: "ok", detail: "" },
      { signalId: "demo_policy", label: "demo workspace", value: "啟用中", status: "ok", detail: "" },
      { signalId: "pending_demo_invites", label: "待接受 demo 邀請", value: "1", status: "attention", detail: "" },
    ]),
    "Firm provider：驗證成功｜demo workspace：啟用中｜待接受 demo 邀請：1",
  );
});

test("phase 5 closure view stays consultant-readable", () => {
  const view = buildPhaseFiveClosureView({
    phase_id: "phase_5",
    phase_label: "Single-Firm Cloud Foundation",
    closure_status: "ready_to_close",
    closure_status_label: "可準備收口",
    summary: "phase 5 六條主線已站穩。",
    foundation_snapshot: "已補 6 項｜剩 1 項",
    completed_count: 6,
    remaining_count: 1,
    completed_items: [],
    asset_audits: [],
    remaining_items: ["phase 5 sign-off 與下一階段 handoff"],
    recommended_next_step: "準備 sign-off。",
    signed_off_at: null,
    signed_off_by_label: "",
    next_phase_label: "",
    handoff_summary: "",
    handoff_items: [],
  });

  assert.equal(view.title, "第 5 階段收尾狀態");
  assert.equal(view.statusLabel, "可準備收口");
  assert.equal(view.canSignOff, true);
});
