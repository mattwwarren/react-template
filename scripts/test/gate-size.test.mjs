import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { commitAll, makeRepo, runScript, write } from "./fixture.mjs";

const lines = (n) => "x\n".repeat(n);

test("a new file over the limit fails", () => {
  const dir = makeRepo({}, { "scripts/size-budget.json": "{}", "src/a.ts": lines(401) });
  const r = runScript(dir, "check-size-budget.mjs");
  assert.equal(r.status, 1);
  assert.match(r.err, /src\/a\.ts: 401 lines > 400/);
});

test("files within the limit pass", () => {
  const dir = makeRepo({}, { "scripts/size-budget.json": "{}", "src/a.ts": lines(400) });
  const r = runScript(dir, "check-size-budget.mjs");
  assert.equal(r.status, 0);
  assert.match(r.out, /size budget: \d+ files OK/);
});

test("a ratcheted file at its recorded size passes", () => {
  const dir = makeRepo({}, { "scripts/size-budget.json": '{"src/big.ts":450}', "src/big.ts": lines(450) });
  assert.equal(runScript(dir, "check-size-budget.mjs").status, 0);
});

test("raising a ratchet above the merge base fails", () => {
  const dir = makeRepo({}, { "scripts/size-budget.json": '{"src/big.ts":450}', "src/big.ts": lines(450) });
  write(dir, "src/big.ts", lines(500));
  write(dir, "scripts/size-budget.json", '{"src/big.ts":500}');
  commitAll(dir);
  const r = runScript(dir, "check-size-budget.mjs");
  assert.equal(r.status, 1);
  assert.match(r.err, /ratchet raised from 450 to 500/);
});

test("a missing ratchet file cannot run (exit 2, never a pass)", () => {
  const dir = makeRepo({}, { "src/a.ts": lines(3) });
  const r = runScript(dir, "check-size-budget.mjs");
  assert.equal(r.status, 2);
  assert.match(r.err, /cannot read scripts\/size-budget\.json/);
});

test("a custom limit from the config applies", () => {
  const dir = makeRepo({ size: { limit: 10 } }, { "scripts/size-budget.json": "{}", "src/a.ts": lines(11) });
  assert.match(runScript(dir, "check-size-budget.mjs").err, /11 lines > 10/);
});

test("no merge base cannot run", () => {
  const dir = makeRepo({}, { "scripts/size-budget.json": "{}", "src/a.ts": "x\n" });
  execFileSync("git", ["update-ref", "-d", "refs/remotes/origin/main"], { cwd: dir });
  const r = runScript(dir, "check-size-budget.mjs");
  assert.equal(r.status, 2);
  assert.match(r.err, /cannot find the merge base/);
});

test("a ratchet file absent at the merge base bootstraps", () => {
  const dir = makeRepo({}, { "src/big.ts": lines(450) });
  write(dir, "scripts/size-budget.json", '{"src/big.ts":450}');
  commitAll(dir);
  assert.equal(runScript(dir, "check-size-budget.mjs").status, 0);
});

test("a malformed ratchet cannot run (exit 2)", () => {
  const dir = makeRepo({}, { "scripts/size-budget.json": '{"src/big.ts":"x"}', "src/big.ts": lines(450) });
  const r = runScript(dir, "check-size-budget.mjs");
  assert.equal(r.status, 2);
  assert.match(r.err, /scripts\/size-budget\.json/);
});
