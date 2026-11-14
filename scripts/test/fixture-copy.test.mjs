// copyGateScripts decides what a fixture repo inherits from a scripts/ directory. In a host repo that directory
// also holds the host's own code and tests, which must never reach a fixture.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { copyGateScripts, tempDir, write } from "./fixture.mjs";

const HARNESS = ["lib/x.mjs", "test/a.test.mjs", "check-size-budget.mjs", "check-no-suppressions.sh", "bootstrap.mjs"];
const HOST = ["seed.py", "build.sh", "tools/gen.mjs", "size-budget.json", "import-cycles.json", "ci-local.sh"];
// Only a lock can tell a host's test file from the harness's own: the source tree has no lock and copies test/ whole.
const HOST_TEST = "test/host.test.mjs";

function copied(root) {
  const to = join(tempDir("harness-dst-"), "scripts");
  copyGateScripts(join(root, "scripts"), to);
  return (rel) => existsSync(join(to, rel));
}

test("with no harness.lock only the harness's own files are copied (the source tree)", () => {
  const root = tempDir("harness-src-");
  for (const rel of [...HARNESS, ...HOST]) write(root, `scripts/${rel}`, "x\n");
  const has = copied(root);
  for (const rel of HARNESS) assert.ok(has(rel), `${rel} is copied`);
  for (const rel of HOST) assert.ok(!has(rel), `${rel} is not copied`);
});

test("with a harness.lock exactly the files it manages are copied, and the host's scripts are not", () => {
  const root = tempDir("harness-src-");
  for (const rel of [...HARNESS, ...HOST, HOST_TEST]) write(root, `scripts/${rel}`, "x\n");
  write(root, "harness.lock", JSON.stringify({ files: Object.fromEntries(HARNESS.map((rel) => [`scripts/${rel}`, "h"])) }));
  const has = copied(root);
  for (const rel of HARNESS) assert.ok(has(rel), `${rel} is copied`);
  for (const rel of [...HOST, HOST_TEST]) assert.ok(!has(rel), `${rel} is not copied`);
});

test("a path outside the lock is not copied even when it is named like a harness file", () => {
  const root = tempDir("harness-src-");
  for (const rel of ["lib/x.mjs", "lib/host-extra.mjs", "check-host.mjs"]) write(root, `scripts/${rel}`, "x\n");
  write(root, "harness.lock", JSON.stringify({ files: { "scripts/lib/x.mjs": "h" } }));
  const has = copied(root);
  assert.ok(has("lib/x.mjs"));
  assert.ok(!has("lib/host-extra.mjs"));
  assert.ok(!has("check-host.mjs"));
});

test("an unusable harness.lock is an error, never read as no harness files", () => {
  const root = tempDir("harness-src-");
  write(root, "scripts/lib/x.mjs", "x\n");
  write(root, "harness.lock", "{oops");
  assert.throws(() => copyGateScripts(join(root, "scripts"), join(tempDir("harness-dst-"), "scripts")), /not valid JSON/);
});
