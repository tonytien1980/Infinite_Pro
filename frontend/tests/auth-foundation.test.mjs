import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPrimaryNavForMembershipRole,
  canManageMembers,
  canManageExtensions,
  isPublicAppPath,
} from "../src/lib/permissions.ts";
import {
  labelForFirmOperatingPosture,
  summarizeFirmOperatingSignals,
} from "../src/lib/firm-operating.ts";

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
