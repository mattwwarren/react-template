import assert from "node:assert/strict";
import { test } from "node:test";
import { commitAll, makeRepo, runScript, write } from "./fixture.mjs";

const FILE = "tests/e2e/axe-allowlist.json";
const CONFIG = { tier: "t2", axe: { allowlist: FILE } };
const ENTRY = { label: "main", id: "color-contrast", target: "#a" };
const list = (...entries) => JSON.stringify(entries);

test("an unchanged allowlist passes", () => {
  const dir = makeRepo(CONFIG, { [FILE]: list(ENTRY) });
  const r = runScript(dir, "check-ratchets.mjs");
  assert.equal(r.status, 0);
  assert.match(r.out, /ratchets: .* OK \(1 recorded\)/);
});

test("adding an entry relative to the merge base fails", () => {
  const dir = makeRepo(CONFIG, { [FILE]: list() });
  write(dir, FILE, list(ENTRY));
  commitAll(dir);
  const r = runScript(dir, "check-ratchets.mjs");
  assert.equal(r.status, 1);
  assert.match(r.err, /new ratchet entry/);
});

test("removing an entry passes", () => {
  const dir = makeRepo(CONFIG, { [FILE]: list(ENTRY) });
  write(dir, FILE, list());
  commitAll(dir);
  assert.equal(runScript(dir, "check-ratchets.mjs").status, 0);
});

test("a missing allowlist cannot run (exit 2)", () => {
  const dir = makeRepo(CONFIG, {});
  const r = runScript(dir, "check-ratchets.mjs");
  assert.equal(r.status, 2);
  assert.match(r.err, /cannot read tests\/e2e\/axe-allowlist\.json/);
});

test("an allowlist that is not an array cannot run (exit 2)", () => {
  const dir = makeRepo(CONFIG, { [FILE]: "{}" });
  const r = runScript(dir, "check-ratchets.mjs");
  assert.equal(r.status, 2);
  assert.match(r.err, /must be a JSON array/);
});

test("an allowlist that is not JSON cannot run (exit 2)", () => {
  const dir = makeRepo(CONFIG, { [FILE]: "[oops" });
  const r = runScript(dir, "check-ratchets.mjs");
  assert.equal(r.status, 2);
  assert.match(r.err, /cannot read tests\/e2e\/axe-allowlist\.json/);
});

for (const [name, bad, element] of [
  ["a null element", "[null]", /element 0.*plain object/],
  ["a string element", '["main|color-contrast|#a"]', /element 0.*plain object/],
  ["an entry with no target", '[{"label":"main","id":"color-contrast"}]', /element 0.*"target"/],
]) {
  test(`${name} in the head allowlist cannot run (exit 2)`, () => {
    const dir = makeRepo(CONFIG, { [FILE]: list(ENTRY) });
    write(dir, FILE, bad);
    commitAll(dir);
    const r = runScript(dir, "check-ratchets.mjs");
    assert.equal(r.status, 2);
    assert.match(r.err, /tests\/e2e\/axe-allowlist\.json/);
    assert.match(r.err, element);
  });
  test(`${name} in the merge-base allowlist cannot run (exit 2)`, () => {
    const dir = makeRepo(CONFIG, { [FILE]: bad });
    write(dir, FILE, list(ENTRY));
    commitAll(dir);
    const r = runScript(dir, "check-ratchets.mjs");
    assert.equal(r.status, 2);
    assert.match(r.err, /at the merge base/);
    assert.match(r.err, element);
  });
}
