import test from "node:test";
import assert from "node:assert/strict";

import {
  noteDisclosureOpened,
  shouldRenderDisclosureBody,
  shouldRenderPendingIntakePreviewList,
} from "../src/lib/workbench-performance-gates.ts";

test("closed lazy disclosures do not render body before first open", () => {
  assert.equal(
    shouldRenderDisclosureBody({
      lazy: true,
      isOpen: false,
      hasOpenedOnce: false,
    }),
    false,
  );
});

test("lazy disclosures keep their body mounted after first open so work state can persist", () => {
  const hasOpenedOnce = noteDisclosureOpened({
    nextOpen: true,
    hasOpenedOnce: false,
  });

  assert.equal(hasOpenedOnce, true);
  assert.equal(
    shouldRenderDisclosureBody({
      lazy: true,
      isOpen: false,
      hasOpenedOnce,
    }),
    true,
  );
});

test("eager disclosures always render their body", () => {
  assert.equal(
    shouldRenderDisclosureBody({
      lazy: false,
      isOpen: false,
      hasOpenedOnce: false,
    }),
    true,
  );
});

test("pending intake preview list only mounts when there are pending items", () => {
  assert.equal(shouldRenderPendingIntakePreviewList(0), false);
  assert.equal(shouldRenderPendingIntakePreviewList(1), true);
});
