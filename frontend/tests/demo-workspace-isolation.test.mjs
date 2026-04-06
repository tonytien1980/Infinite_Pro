import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPrimaryNavForMembershipRole,
  resolveProtectedPathForMembershipRole,
} from "../src/lib/permissions.ts";
import {
  buildDemoMemberSummary,
  canRevokeInvite,
  buildFormalWorkspaceExplainer,
  labelForDemoWorkspacePolicyStatus,
  summarizeDemoShowcaseHighlights,
  summarizeDemoWorkspaceCapacity,
} from "../src/lib/demo-workspace.ts";

test("demo sees only the demo nav entry", () => {
  const nav = buildPrimaryNavForMembershipRole("demo");
  assert.deepEqual(nav, [{ href: "/demo", label: "Demo Workspace" }]);
});

test("demo is redirected away from firm workspace paths", () => {
  assert.equal(resolveProtectedPathForMembershipRole("demo", "/matters"), "/demo");
  assert.equal(resolveProtectedPathForMembershipRole("demo", "/deliverables"), "/demo");
  assert.equal(resolveProtectedPathForMembershipRole("owner", "/matters"), null);
});

test("demo member summary counts active and pending demo seats", () => {
  const summary = buildDemoMemberSummary({
    members: [
      { id: "1", email: "owner@example.com", fullName: "Owner", role: "owner", status: "active" },
      { id: "2", email: "demo1@example.com", fullName: "Demo 1", role: "demo", status: "active" },
      { id: "3", email: "demo2@example.com", fullName: "Demo 2", role: "demo", status: "disabled" },
    ],
    pendingInvites: [
      { id: "i1", email: "demo3@example.com", role: "demo", status: "pending" },
    ],
    summary: { activeDemoMemberCount: 1, pendingDemoInviteCount: 1 },
  });

  assert.equal(summary.activeCount, 1);
  assert.equal(summary.pendingCount, 1);
});

test("only pending invites are revokable", () => {
  assert.equal(canRevokeInvite("pending"), true);
  assert.equal(canRevokeInvite("accepted"), false);
  assert.equal(canRevokeInvite("revoked"), false);
});

test("demo workspace policy status is rendered in Traditional Chinese", () => {
  assert.equal(labelForDemoWorkspacePolicyStatus("active"), "啟用中");
  assert.equal(labelForDemoWorkspacePolicyStatus("inactive"), "已停用");
});

test("demo workspace capacity summary handles zero and positive limits", () => {
  assert.equal(
    summarizeDemoWorkspaceCapacity({
      status: "active",
      workspaceSlug: "demo",
      seedVersion: "v1",
      maxActiveDemoMembers: 3,
    }),
    "最多可啟用 3 個 demo 帳號。",
  );
  assert.equal(
    summarizeDemoWorkspaceCapacity({
      status: "inactive",
      workspaceSlug: "demo",
      seedVersion: "v1",
      maxActiveDemoMembers: 0,
    }),
    "目前不開放啟用 demo 帳號。",
  );
});

test("demo showcase summary keeps highlights consultant-readable", () => {
  assert.equal(
    summarizeDemoShowcaseHighlights([
      "matter / case world 的正式工作面",
      "deliverable shaping 的收斂讀法",
      "history / shared intelligence 的唯讀展示",
    ]),
    "你可以先看 matter / case world 的正式工作面、deliverable shaping 的收斂讀法、history / shared intelligence 的唯讀展示。",
  );
});

test("formal workspace explainer falls back to a safe default", () => {
  assert.equal(
    buildFormalWorkspaceExplainer(null),
    "正式版 workspace 會讓 consultant 進入自己的辦案路徑；demo 則只展示產品如何工作，不提供操作權限。",
  );
});
