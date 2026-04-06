import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPrimaryNavForMembershipRole,
  resolveProtectedPathForMembershipRole,
} from "../src/lib/permissions.ts";
import { buildDemoMemberSummary, canRevokeInvite } from "../src/lib/demo-workspace.ts";

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
