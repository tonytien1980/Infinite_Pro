import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPrimaryNavForMembershipRole,
  canManageMembers,
  canManageExtensions,
  isPublicAppPath,
} from "../src/lib/permissions.ts";

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
