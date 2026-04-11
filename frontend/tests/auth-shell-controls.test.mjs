import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

test("authenticated app shell exposes a logout control", () => {
  const source = readSource("../src/components/app-shell.tsx");

  assert.match(source, /登出/);
  assert.match(source, /logoutCurrentSession/);
});

test("new matter intake uses an explicit upload trigger instead of a bare visible file input", () => {
  const source = readSource("../src/components/task-create-form.tsx");

  assert.match(source, /選擇檔案/);
  assert.match(source, /className="button-secondary file-input-trigger"/);
  assert.match(source, /id="source-files"/);
  assert.match(source, /className="file-input-trigger-control"/);
});

test("evidence supplement flow also uses an explicit upload trigger", () => {
  const source = readSource("../src/components/artifact-evidence-workspace-panel.tsx");

  assert.match(source, /選擇檔案/);
  assert.match(source, /className="button-secondary file-input-trigger"/);
  assert.match(source, /id="matter-files"/);
  assert.match(source, /className="file-input-trigger-control"/);
});
