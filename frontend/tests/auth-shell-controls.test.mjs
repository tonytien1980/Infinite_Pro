import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { shouldRedirectToLoginAfterLogout } from "../src/lib/session.ts";

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

test("logout redirect only happens on success or an already-invalid session", () => {
  assert.equal(shouldRedirectToLoginAfterLogout(null), true);
  assert.equal(shouldRedirectToLoginAfterLogout({ status: 401 }), true);
  assert.equal(shouldRedirectToLoginAfterLogout({ status: 403 }), true);
  assert.equal(shouldRedirectToLoginAfterLogout({ status: 500 }), false);
  assert.equal(shouldRedirectToLoginAfterLogout(new Error("network timeout")), false);
});

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
