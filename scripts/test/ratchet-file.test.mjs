import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import { tempDir } from "./fixture.mjs";

const LIB = pathToFileURL(join(import.meta.dirname, "..", "lib", "ratchet-file.mjs")).href;
const dir = tempDir("ratchet-file-");

/** Runs readRatchetFile on a file with the given text (or a missing file when text is null) in a child process. */
function read(text) {
  const path = join(dir, `r-${Math.random().toString(36).slice(2)}.json`);
  if (text !== null) writeFileSync(path, text);
  const code = `import { readRatchetFile } from ${JSON.stringify(LIB)}; console.log(JSON.stringify(readRatchetFile(process.argv[1])));`;
  const r = spawnSync("node", ["--input-type=module", "-e", code, path], { encoding: "utf8" });
  return { status: r.status, out: r.stdout, err: r.stderr, path };
}

test("a plain object of positive integers is returned as parsed", () => {
  const r = read('{"a":1,"b":450}');
  assert.equal(r.status, 0);
  assert.deepEqual(JSON.parse(r.out), { a: 1, b: 450 });
});
test("an empty object is valid", () => {
  const r = read("{}");
  assert.equal(r.status, 0);
  assert.deepEqual(JSON.parse(r.out), {});
});
test("null cannot run", () => {
  const r = read("null");
  assert.equal(r.status, 2);
  assert.match(r.err, /r-.*\.json: .*JSON object/);
});
test("an array cannot run", () => {
  const r = read("[1,2]");
  assert.equal(r.status, 2);
  assert.match(r.err, /JSON object/);
});
test("a string value cannot run and the message names the entry", () => {
  const r = read('{"ok":2,"cycle-1":"x"}');
  assert.equal(r.status, 2);
  assert.match(r.err, /"cycle-1"/);
  assert.match(r.err, /positive integer/);
});
test("zero cannot run", () => {
  const r = read('{"a":0}');
  assert.equal(r.status, 2);
  assert.match(r.err, /"a"/);
});
test("a negative count cannot run", () => {
  assert.equal(read('{"a":-3}').status, 2);
});
test("a fractional count cannot run", () => {
  assert.equal(read('{"a":2.5}').status, 2);
});
test("invalid JSON cannot run", () => {
  const r = read("{not json");
  assert.equal(r.status, 2);
  assert.match(r.err, /cannot read .*r-.*\.json/);
});
test("a missing file cannot run", () => {
  const r = read(null);
  assert.equal(r.status, 2);
  assert.match(r.err, /cannot read .*r-.*\.json/);
});
