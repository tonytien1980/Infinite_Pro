import test from "node:test";
import assert from "node:assert/strict";

import {
  buildWorkspaceLocalRail,
  compressGuideItemsForShellV2,
} from "../src/lib/workspace-local-rail.ts";

test("local rail keeps only section name, role, and next-read cue", () => {
  const rail = buildWorkspaceLocalRail([
    {
      href: "#task-mainline",
      title: "主線",
      description: "先看這輪在判斷什麼",
      whenToUse: "一進頁面先看這裡",
    },
  ]);

  assert.equal(rail.items[0].title, "主線");
  assert.equal(rail.items[0].role, "先看這輪在判斷什麼");
  assert.equal(rail.items[0].cue, "一進頁面先看這裡");
});

test("guide compression preserves non-duplicate meta", () => {
  const items = compressGuideItemsForShellV2([
    {
      href: "#evidence",
      eyebrow: "先看缺什麼",
      title: "充分性摘要與高影響缺口",
      copy: "先判斷目前缺的是來源、證據，還是仍不夠支撐這輪判斷。",
      meta: "目前仍有高影響缺口，先補這些最有效。",
    },
  ]);

  assert.equal(items[0].title, "充分性摘要與高影響缺口");
  assert.equal(items[0].copy, "先判斷目前缺的是來源、證據，還是仍不夠支撐這輪判斷。");
  assert.equal(items[0].meta, "目前仍有高影響缺口，先補這些最有效。");
});

test("guide compression strips meta only when it repeats the main copy", () => {
  const items = compressGuideItemsForShellV2([
    {
      href: "#evidence",
      eyebrow: "先看缺什麼",
      title: "充分性摘要與高影響缺口",
      copy: "先判斷目前缺的是來源、證據，還是仍不夠支撐這輪判斷。",
      meta: "先判斷目前缺的是來源、證據，還是仍不夠支撐這輪判斷。",
    },
  ]);

  assert.equal(items[0].meta, undefined);
});
