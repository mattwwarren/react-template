import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { copyGateScripts, runScript, tempDir, write } from "./fixture.mjs";

const PASSING = 'import { test } from "node:test";\ntest("harness test ran", () => {});\n';
const FAILING = 'import { test } from "node:test";\ntest("failing harness test", () => { throw new Error("boom"); });\n';
const HOST = 'import { test } from "node:test";\ntest("host-only test", () => {});\n';

/** A repo with the runner, a harness test, a host test of the same shape, and the given lock (null for none). */
function repo(lockFiles, harnessTest = PASSING) {
  const dir = tempDir("harness-runner-");
  copyGateScripts(join(import.meta.dirname, ".."), join(dir, "scripts"));
  // The copy brought the real harness tests; the runner is checked against stand-ins only.
  write(dir, "scripts/test/stub.test.mjs", harnessTest);
  write(dir, "scripts/test/host.test.mjs", HOST);
  if (lockFiles !== null) write(dir, "harness.lock", JSON.stringify({ files: lockFiles }));
  return dir;
}

test("it runs the files harness.lock lists and not the other tests in scripts/test", () => {
  const dir = repo({ "scripts/test/stub.test.mjs": "h" });
  const r = runScript(dir, "run-harness-tests.mjs");
  assert.equal(r.status, 0, r.out + r.err);
  assert.match(r.out, /harness test ran/);
  assert.doesNotMatch(r.out, /host-only test/);
});

test("a failing harness test fails the run", () => {
  const dir = repo({ "scripts/test/stub.test.mjs": "h" }, FAILING);
  const r = runScript(dir, "run-harness-tests.mjs");
  assert.notEqual(r.status, 0);
  assert.match(r.out, /failing harness test/);
});

test("no harness.lock cannot run (exit 2)", () => {
  const r = runScript(repo(null), "run-harness-tests.mjs");
  assert.equal(r.status, 2);
  assert.match(r.err, /harness\.lock not found/);
});

test("a lock that lists no tests cannot run (exit 2)", () => {
  const r = runScript(repo({ "scripts/lib/x.mjs": "h" }), "run-harness-tests.mjs");
  assert.equal(r.status, 2);
  assert.match(r.err, /lists no scripts\/test/);
});

test("a lock that is not JSON cannot run (exit 2)", () => {
  const dir = repo(null);
  write(dir, "harness.lock", "{oops");
  assert.equal(runScript(dir, "run-harness-tests.mjs").status, 2);
});
