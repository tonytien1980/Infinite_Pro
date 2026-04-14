import test from "node:test";
import assert from "node:assert/strict";

import {
  FIRST_LAYER_AVOID_TERMS,
  replaceFirstLayerTerm,
  shouldAvoidInFirstLayer,
} from "../src/lib/product-language.ts";

test("first-layer avoid list includes internal system language", () => {
  assert.equal(shouldAvoidInFirstLayer("寫回"), true);
  assert.equal(shouldAvoidInFirstLayer("治理"), true);
  assert.equal(shouldAvoidInFirstLayer("工作面"), true);
  assert.equal(shouldAvoidInFirstLayer("查看治理摘要"), true);
  assert.equal(shouldAvoidInFirstLayer("案件工作面設定"), true);
});

test("first-layer replacements prefer readable product language", () => {
  assert.equal(replaceFirstLayerTerm("工作面"), "頁面");
  assert.equal(replaceFirstLayerTerm("先補來源與證據"), "先補資料");
  assert.equal(replaceFirstLayerTerm("決策工作面"), "分析工作台");
});

test("second-layer strings stay unchanged under first-layer replacement", () => {
  assert.equal(replaceFirstLayerTerm("寫回紀錄"), "寫回紀錄");
  assert.equal(replaceFirstLayerTerm("決策寫回紀錄"), "決策寫回紀錄");
});

test("avoid-list stays explicit instead of drifting implicitly", () => {
  assert.ok(FIRST_LAYER_AVOID_TERMS.includes("decision brief"));
  assert.ok(FIRST_LAYER_AVOID_TERMS.includes("canonical"));
});
