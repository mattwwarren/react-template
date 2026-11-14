import assert from "node:assert/strict";
import { test } from "node:test";
import { commitAll, makeRepo, runScript, write } from "./fixture.mjs";

const CONFIG = {
  imports: { sourceGlobs: ["src/*.ts"], aliases: { "@/": "src/" } },
  cycles: { scopePrefixes: ["src/"] },
};
const CYCLE = { "src/a.ts": 'import "./b";', "src/b.ts": 'import "./a";' };

test("a new cycle fails when the ratchet is empty", () => {
  const dir = makeRepo(CONFIG, { "scripts/import-cycles.json": "{}", ...CYCLE });
  const r = runScript(dir, "check-import-cycles.mjs");
  assert.equal(r.status, 1);
  assert.match(r.err, /cycle-1: a new import cycle of 2/);
});

test("a recorded cycle at its recorded size passes", () => {
  const dir = makeRepo(CONFIG, { "scripts/import-cycles.json": '{"cycle-1":2}', ...CYCLE });
  const r = runScript(dir, "check-import-cycles.mjs");
  assert.equal(r.status, 0);
});

test("no cycles and an empty ratchet pass", () => {
  const dir = makeRepo(CONFIG, { "scripts/import-cycles.json": "{}", "src/a.ts": 'import "./b";', "src/b.ts": "export const b = 1;" });
  assert.equal(runScript(dir, "check-import-cycles.mjs").status, 0);
});

test("--list prints the modules of each cycle", () => {
  const dir = makeRepo(CONFIG, { "scripts/import-cycles.json": '{"cycle-1":2}', ...CYCLE });
  assert.match(runScript(dir, "check-import-cycles.mjs", "--list").out, /cycle-1 \(2\): src\/a\.ts src\/b\.ts/);
});

test("an empty cycles scope cannot run (exit 2)", () => {
  const dir = makeRepo({ imports: CONFIG.imports }, { "scripts/import-cycles.json": "{}", ...CYCLE });
  assert.equal(runScript(dir, "check-import-cycles.mjs").status, 2);
});

test("a scope that selects no modules cannot run (typo in scopePrefixes)", () => {
  const dir = makeRepo({ ...CONFIG, cycles: { scopePrefixes: ["srcc/"] } }, { "scripts/import-cycles.json": "{}", ...CYCLE });
  const r = runScript(dir, "check-import-cycles.mjs");
  assert.equal(r.status, 2);
  assert.match(r.err, /scopePrefixes selected no modules/);
});

test("extensions that exclude every file in scope cannot run", () => {
  const config = { ...CONFIG, imports: { ...CONFIG.imports, extensions: [".js"] } };
  const dir = makeRepo(config, { "scripts/import-cycles.json": "{}", ...CYCLE });
  const r = runScript(dir, "check-import-cycles.mjs");
  assert.equal(r.status, 2);
  assert.match(r.err, /selected no modules/);
});

test("a malformed ratchet cannot run (exit 2)", () => {
  for (const text of ['{"cycle-1":"x"}', "null", "[]"]) {
    const dir = makeRepo(CONFIG, { "scripts/import-cycles.json": text, ...CYCLE });
    const r = runScript(dir, "check-import-cycles.mjs");
    assert.equal(r.status, 2, text);
    assert.match(r.err, /scripts\/import-cycles\.json/);
  }
});

test("a missing ratchet file cannot run (exit 2)", () => {
  const dir = makeRepo(CONFIG, { ...CYCLE });
  const r = runScript(dir, "check-import-cycles.mjs");
  assert.equal(r.status, 2);
  assert.match(r.err, /cannot read scripts\/import-cycles\.json/);
});

test("no cycles reads as none in the ok line", () => {
  const dir = makeRepo(CONFIG, { "scripts/import-cycles.json": "{}", "src/a.ts": "export const a = 1;" });
  const r = runScript(dir, "check-import-cycles.mjs");
  assert.equal(r.status, 0);
  assert.match(r.out, /import cycles: none OK/);
});

test("raising the ratchet above the merge base fails", () => {
  const dir = makeRepo(CONFIG, { "scripts/import-cycles.json": '{"cycle-1":2}', ...CYCLE });
  write(dir, "scripts/import-cycles.json", '{"cycle-1":3}');
  commitAll(dir);
  const r = runScript(dir, "check-import-cycles.mjs");
  assert.equal(r.status, 1);
  assert.match(r.err, /ratchet raised from 2 to 3/);
});

test("a shrunk cycle must be lowered in the ratchet", () => {
  const dir = makeRepo(CONFIG, { "scripts/import-cycles.json": '{"cycle-1":3}', ...CYCLE });
  const r = runScript(dir, "check-import-cycles.mjs");
  assert.equal(r.status, 1);
  assert.match(r.err, /shrank from 3 to 2/);
  assert.match(r.err, /Lower it/);
});
