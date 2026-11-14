import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { commitAll, copyGateScripts, makeRepo, runScript, tempDir, write } from "./fixture.mjs";

const CONFIG = {
  tier: "t2",
  imports: { sourceGlobs: ["src/*.ts"] },
  cycles: { scopePrefixes: ["src/"] },
  axe: { allowlist: "tests/e2e/axe-allowlist.json" },
};
const FILES = {
  "src/big.ts": "x\n".repeat(401),
  "src/a.ts": 'import "./b";',
  "src/b.ts": 'import "./a";',
};
const json = (dir, path) => JSON.parse(readFileSync(join(dir, path), "utf8"));

test("bootstrap records today's debt", () => {
  const dir = makeRepo(CONFIG, FILES);
  const r = runScript(dir, "bootstrap.mjs");
  assert.equal(r.status, 0);
  assert.deepEqual(json(dir, "scripts/size-budget.json"), { "src/big.ts": 401 });
  assert.deepEqual(json(dir, "scripts/import-cycles.json"), { "cycle-1": 2 });
  assert.deepEqual(json(dir, "tests/e2e/axe-allowlist.json"), []);
});

test("bootstrap never overwrites an existing ratchet file", () => {
  const dir = makeRepo(CONFIG, FILES);
  write(dir, "scripts/size-budget.json", '{"src/big.ts":999}');
  const r = runScript(dir, "bootstrap.mjs");
  assert.match(r.out, /kept scripts\/size-budget\.json/);
  assert.deepEqual(json(dir, "scripts/size-budget.json"), { "src/big.ts": 999 });
});

test("a tier-1 config does not create the axe allowlist", () => {
  const dir = makeRepo({ ...CONFIG, tier: "t1" }, FILES);
  const r = runScript(dir, "bootstrap.mjs");
  assert.equal(r.status, 0);
  assert.deepEqual(json(dir, "scripts/size-budget.json"), { "src/big.ts": 401 });
  assert.throws(() => readFileSync(join(dir, "tests/e2e/axe-allowlist.json")));
});

test("what bootstrap records is accepted by both gates once committed", () => {
  const dir = makeRepo(CONFIG, FILES);
  assert.equal(runScript(dir, "bootstrap.mjs").status, 0);
  commitAll(dir, "record debt");
  assert.equal(runScript(dir, "check-size-budget.mjs").status, 0);
  assert.equal(runScript(dir, "check-import-cycles.mjs").status, 0);
});

test("a debt-free tree records empty ratchets that both gates accept", () => {
  const dir = makeRepo(CONFIG, { "src/a.ts": 'import "./b";', "src/b.ts": "export const b = 1;\n" });
  assert.equal(runScript(dir, "bootstrap.mjs").status, 0);
  assert.deepEqual(json(dir, "scripts/size-budget.json"), {});
  assert.deepEqual(json(dir, "scripts/import-cycles.json"), {});
  commitAll(dir, "record debt");
  assert.equal(runScript(dir, "check-size-budget.mjs").status, 0);
  assert.equal(runScript(dir, "check-import-cycles.mjs").status, 0);
});

test("an unconfigured cycles scope skips the cycles ratchet instead of recording {}", () => {
  const dir = makeRepo({ tier: "t1" }, FILES);
  const r = runScript(dir, "bootstrap.mjs");
  assert.equal(r.status, 0);
  assert.match(r.out, /skipped scripts\/import-cycles\.json \(cycles gate not configured: set cycles\.scopePrefixes and imports\.sourceGlobs, then rerun\)/);
  assert.throws(() => readFileSync(join(dir, "scripts/import-cycles.json")));
  assert.deepEqual(json(dir, "scripts/size-budget.json"), { "src/big.ts": 401 });
});

test("a cycles scope that selects no modules cannot run and records nothing", () => {
  const dir = makeRepo({ ...CONFIG, cycles: { scopePrefixes: ["nope/"] } }, FILES);
  const r = runScript(dir, "bootstrap.mjs");
  assert.equal(r.status, 2);
  assert.match(r.err, /cycles\.scopePrefixes selected no modules/);
  assert.match(r.err, /refusing to record an empty graph/);
  assert.throws(() => readFileSync(join(dir, "scripts/import-cycles.json")));
});

test("no files matching size.globs cannot run and records nothing", () => {
  const dir = makeRepo({ ...CONFIG, size: { globs: ["*.nope"] } }, FILES);
  const r = runScript(dir, "bootstrap.mjs");
  assert.equal(r.status, 2);
  assert.match(r.err, /no files matched size\.globs; refusing to record a size budget/);
  assert.throws(() => readFileSync(join(dir, "scripts/size-budget.json")));
});

test("the fixture copies the gate code but not the ratchet files recorded in an installed project", () => {
  // Once bootstrap has run in an installed project, scripts/ holds that project's recorded debt next to the
  // gates; a fixture repo that inherited it would start with someone else's ratchets.
  const from = join(tempDir("harness-src-"), "scripts");
  mkdirSync(join(from, "lib"), { recursive: true });
  writeFileSync(join(from, "lib", "x.mjs"), "export {};\n");
  writeFileSync(join(from, "size-budget.json"), '{"src/real.ts":900}');
  writeFileSync(join(from, "import-cycles.json"), '{"cycle-1":6}');
  const to = join(tempDir("harness-dst-"), "scripts");
  copyGateScripts(from, to);
  assert.ok(existsSync(join(to, "lib", "x.mjs")));
  assert.ok(!existsSync(join(to, "size-budget.json")));
  assert.ok(!existsSync(join(to, "import-cycles.json")));
});
