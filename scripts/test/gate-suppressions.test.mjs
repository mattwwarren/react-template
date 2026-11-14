import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { makeRepo, runShell } from "./fixture.mjs";

test("a suppression comment in a tsx file fails", () => {
  const dir = makeRepo({}, { "src/a.tsx": "// @ts-ignore\nexport const a = 1;\n" });
  const r = runShell(dir, "check-no-suppressions.sh");
  assert.equal(r.status, 1);
  assert.match(r.err, /Suppression comments are not allowed/);
  assert.match(r.err, /src\/a\.tsx:1/);
});

test("a suppression comment in a cjs or jsx file fails", () => {
  const dir = makeRepo({}, { "a.cjs": "// eslint-disable-next-line\nmodule.exports = 1;\n", "src/b.jsx": "// @ts-nocheck\nexport const b = 1;\n" });
  const r = runShell(dir, "check-no-suppressions.sh");
  assert.equal(r.status, 1);
  assert.match(r.err, /a\.cjs:1/);
  assert.match(r.err, /src\/b\.jsx:1/);
});

test("python and biome suppressions fail too", () => {
  const dir = makeRepo({}, { "x.py": "import os  # noqa\n", "src/b.ts": "// biome-ignore lint: no\nexport const b = 1;\n" });
  const r = runShell(dir, "check-no-suppressions.sh");
  assert.equal(r.status, 1);
  assert.match(r.err, /x\.py:1/);
  assert.match(r.err, /src\/b\.ts:1/);
});

test("a clean tree passes", () => {
  const dir = makeRepo({}, { "src/a.tsx": "export const a = 1;\n" });
  const r = runShell(dir, "check-no-suppressions.sh");
  assert.equal(r.status, 0);
  assert.match(r.out, /no suppression comments/);
});

// scripts/ is scanned like any other directory, so the only way to a tree with no source files is to hide it.
const HIDE_SCRIPTS = { ".gitignore": "scripts/\n" };

test("a tree with no source files cannot run (exit 2)", () => {
  const dir = makeRepo({}, HIDE_SCRIPTS);
  assert.equal(runShell(dir, "check-no-suppressions.sh").status, 2);
});

// An entry is an exact file path or a directory ending in "/": a path prefix, never a string prefix.
const VENDORED = "/* eslint-disable */\nexport const w = 1;\n";
const CLEAN = "export const a = 1;\n";

test("an excluded vendored file with a suppression passes", () => {
  const dir = makeRepo({ suppressions: { excludePrefixes: ["public/sw.js"] } }, { "public/sw.js": VENDORED, "src/a.ts": CLEAN });
  const r = runShell(dir, "check-no-suppressions.sh");
  assert.equal(r.status, 0);
  assert.match(r.out, /no suppression comments/);
});

test("the same marker in a file that is not excluded still fails, and only that file is named", () => {
  const dir = makeRepo(
    { suppressions: { excludePrefixes: ["public/sw.js"] } },
    { "public/sw.js": VENDORED, "src/a.ts": "// @ts-ignore\nexport const a = 1;\n" },
  );
  const r = runShell(dir, "check-no-suppressions.sh");
  assert.equal(r.status, 1);
  assert.match(r.err, /Suppression comments are not allowed/);
  assert.match(r.err, /src\/a\.ts:1/);
  assert.doesNotMatch(r.err, /public\/sw\.js/);
});

test("a file entry exempts that file only, not another file whose name starts the same way", () => {
  const dir = makeRepo(
    { suppressions: { excludePrefixes: ["public/sw.js"] } },
    { "public/sw.js": VENDORED, "public/sw.js.js": VENDORED, "public/sw.jsx": VENDORED, "src/a.ts": CLEAN },
  );
  const r = runShell(dir, "check-no-suppressions.sh");
  assert.equal(r.status, 1);
  assert.match(r.err, /public\/sw\.js\.js:1/);
  assert.match(r.err, /public\/sw\.jsx:1/);
  assert.doesNotMatch(r.err, /public\/sw\.js:1/);
});

test("a directory entry ending in a slash exempts that directory tree only", () => {
  const dir = makeRepo(
    { suppressions: { excludePrefixes: ["vendor/"] } },
    { "vendor/a/b.js": VENDORED, "vendor-extra/c.js": VENDORED, "vendorx.js": VENDORED, "src/a.ts": CLEAN },
  );
  const r = runShell(dir, "check-no-suppressions.sh");
  assert.equal(r.status, 1);
  assert.match(r.err, /vendor-extra\/c\.js:1/);
  assert.match(r.err, /vendorx\.js:1/);
  assert.doesNotMatch(r.err, /vendor\/a\/b\.js/);
});

test("exclusions are paths from the repo root, not patterns, and odd file names are safe", () => {
  const dir = makeRepo(
    { suppressions: { excludePrefixes: ["public/my sw.js", "pub*/"] } },
    { "public/my sw.js": VENDORED, "public/other.js": VENDORED, "src/a.ts": CLEAN, "sub/public/my sw.js": VENDORED },
  );
  const r = runShell(dir, "check-no-suppressions.sh");
  assert.equal(r.status, 1);
  assert.match(r.err, /public\/other\.js:1/);
  assert.match(r.err, /sub\/public\/my sw\.js:1/);
  assert.doesNotMatch(r.err, /^public\/my sw\.js/m);
});

test("excluding every source file still cannot run (exit 2)", () => {
  const dir = makeRepo({ suppressions: { excludePrefixes: ["public/sw.js"] } }, { ...HIDE_SCRIPTS, "public/sw.js": VENDORED });
  const r = runShell(dir, "check-no-suppressions.sh");
  assert.equal(r.status, 2);
  assert.match(r.err, /no source files found to scan/);
});

test("an invalid config cannot run (exit 2) and says why", () => {
  const dir = makeRepo({ suppressions: { excludePrefixes: "public/sw.js" } }, { "src/a.ts": CLEAN });
  const r = runShell(dir, "check-no-suppressions.sh");
  assert.equal(r.status, 2);
  assert.match(r.err, /harness\.config\.json is invalid/);
  assert.match(r.err, /"suppressions\.excludePrefixes" must be a list of non-empty strings/);
  assert.doesNotMatch(r.out, /no suppression comments/);
});

test("a missing config cannot run (exit 2) and says why", () => {
  const dir = makeRepo({}, { "src/a.ts": CLEAN });
  rmSync(join(dir, "harness.config.json"));
  const r = runShell(dir, "check-no-suppressions.sh");
  assert.equal(r.status, 2);
  assert.match(r.err, /cannot read harness\.config\.json/);
  assert.doesNotMatch(r.out, /no suppression comments/);
});

// scripts/ is the host project's own code in an installed repo: only the harness's files that must contain the
// marker strings (the checker and its own test) are exempt, by exact path.
const NOQA = "x = 1  # noqa\n";
const HARNESS_TEST = "scripts/test/gate-suppressions.test.mjs";
const lock = (...paths) => JSON.stringify({ files: Object.fromEntries(paths.map((p) => [p, "h"])) });

test("a marker in the host project's own scripts/ code fails like one anywhere else", () => {
  const dir = makeRepo({}, { "scripts/seed2.py": NOQA, "tools/seed3.py": NOQA });
  const r = runShell(dir, "check-no-suppressions.sh");
  assert.equal(r.status, 1);
  assert.match(r.err, /scripts\/seed2\.py:1/);
  assert.match(r.err, /tools\/seed3\.py:1/);
});

test("a marker in a host test under scripts/test, or in a harness file that needs none, fails", () => {
  const dir = makeRepo({}, { "scripts/test/host.test.mjs": "// @ts-ignore\n", "scripts/lib/css-scan.mjs": "// eslint-disable\n" });
  const r = runShell(dir, "check-no-suppressions.sh");
  assert.equal(r.status, 1);
  assert.match(r.err, /scripts\/test\/host\.test\.mjs:1/);
  assert.match(r.err, /scripts\/lib\/css-scan\.mjs:1/);
});

test("the harness's own gate test, which holds the marker strings on purpose, is ignored by exact path", () => {
  const dir = makeRepo({}, { [HARNESS_TEST]: "// @ts-ignore\n", "src/a.ts": "export const a = 1;\n" });
  const r = runShell(dir, "check-no-suppressions.sh");
  assert.equal(r.status, 0, r.err);
  assert.match(r.out, /no suppression comments/);
});

test("a file that only shares a name with the harness's gate test is still scanned", () => {
  const dir = makeRepo({}, { "other/test/gate-suppressions.test.mjs": "// @ts-ignore\n", "scripts/test/gate-suppressions.test.mjs.js": "// @ts-ignore\n" });
  const r = runShell(dir, "check-no-suppressions.sh");
  assert.equal(r.status, 1);
  assert.match(r.err, /other\/test\/gate-suppressions\.test\.mjs:1/);
  assert.match(r.err, /gate-suppressions\.test\.mjs\.js:1/);
});

test("with a harness.lock, a file at the harness test's path that the lock does not manage is the host's and is scanned", () => {
  const owned = makeRepo({}, { "harness.lock": lock(HARNESS_TEST, "scripts/check-no-suppressions.sh"), [HARNESS_TEST]: "// @ts-ignore\n", "src/a.ts": "export const a = 1;\n" });
  assert.equal(runShell(owned, "check-no-suppressions.sh").status, 0);
  const hosts = makeRepo({}, { "harness.lock": lock("scripts/lib/x.mjs"), [HARNESS_TEST]: "// @ts-ignore\n", "src/a.ts": "export const a = 1;\n" });
  const r = runShell(hosts, "check-no-suppressions.sh");
  assert.equal(r.status, 1);
  assert.match(r.err, /scripts\/test\/gate-suppressions\.test\.mjs:1/);
});

test("an unusable harness.lock cannot run (exit 2)", () => {
  const dir = makeRepo({}, { "harness.lock": "{oops", "src/a.ts": "export const a = 1;\n" });
  const r = runShell(dir, "check-no-suppressions.sh");
  assert.equal(r.status, 2);
  assert.match(r.err, /harness\.lock/);
});
