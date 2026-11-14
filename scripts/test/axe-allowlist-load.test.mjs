import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { loadAllowlist } from "../lib/axe-allowlist-load.mjs";
import { tempDir } from "./fixture.mjs";

const ENTRY = { label: "main", id: "color-contrast", target: "#a" };

function root(files) {
  const dir = tempDir("axe-load-");
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
}

test("a missing config file throws an error naming it", () => {
  assert.throws(() => loadAllowlist(root({})), /harness\.config\.json/);
});

test("an invalid config throws an error naming the config file and the problem", () => {
  const dir = root({ "harness.config.json": JSON.stringify({ axe: { allowlist: "" } }) });
  assert.throws(() => loadAllowlist(dir), /harness\.config\.json.*invalid[\s\S]*axe\.allowlist/);
});

test("a missing allowlist file throws an error naming its path", () => {
  const dir = root({ "harness.config.json": "{}" });
  assert.throws(() => loadAllowlist(dir), /cannot read .*tests[\\/]e2e[\\/]axe-allowlist\.json/);
});

test("an allowlist that is not JSON throws an error naming its path", () => {
  const dir = root({ "harness.config.json": "{}", "tests/e2e/axe-allowlist.json": "[oops" });
  assert.throws(() => loadAllowlist(dir), /cannot read .*axe-allowlist\.json/);
});

test("a malformed allowlist throws '<path> is malformed: <first problem>'", () => {
  const dir = root({ "harness.config.json": "{}", "tests/e2e/axe-allowlist.json": "[null]" });
  assert.throws(() => loadAllowlist(dir), /axe-allowlist\.json is malformed: element 0 must be a plain object/);
});

test("a non-array allowlist is malformed", () => {
  const dir = root({ "harness.config.json": "{}", "tests/e2e/axe-allowlist.json": "{}" });
  assert.throws(() => loadAllowlist(dir), /is malformed: must be a JSON array/);
});

test("the default path loads when the config does not set one", () => {
  const dir = root({ "harness.config.json": "{}", "tests/e2e/axe-allowlist.json": JSON.stringify([ENTRY]) });
  assert.deepEqual(loadAllowlist(dir), [ENTRY]);
});

test("a custom axe.allowlist path from the config is the file that is read", () => {
  const dir = root({
    "harness.config.json": JSON.stringify({ axe: { allowlist: "qa/a11y.json" } }),
    "qa/a11y.json": JSON.stringify([ENTRY]),
    "tests/e2e/axe-allowlist.json": "[]",
  });
  assert.deepEqual(loadAllowlist(dir), [ENTRY]);
});
