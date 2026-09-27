import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("material support is read from the server rather than duplicate UI limits", () => {
  const api = readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8");
  assert.match(api, /tasks\/support\/materials/);
  const form = readFileSync(new URL("../src/components/task-create-form.tsx", import.meta.url), "utf8");
  assert.match(form, /MaterialSupportNotice/);
});

test("material card offers re-read while retaining old evidence", () => {
  const source = readFileSync(new URL("../src/components/evidence-secondary-panel-bodies.tsx", import.meta.url), "utf8");
  assert.match(source, /重新讀取原檔/);
  assert.match(source, /onReprocess/);
  assert.match(source, /舊版依據仍保留/);
});
