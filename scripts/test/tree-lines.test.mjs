import assert from "node:assert/strict";
import { test } from "node:test";
import { lineCount, overBudget } from "../lib/tree-lines.mjs";

test("lineCount ignores the final newline", () => {
  assert.equal(lineCount("a\nb\n"), 2);
  assert.equal(lineCount("a\nb"), 2);
  assert.equal(lineCount("a\n"), 1);
});

test("overBudget lists only files strictly over the limit, sorted", () => {
  const files = [
    { path: "z.ts", lines: 401 },
    { path: "a.ts", lines: 900 },
    { path: "ok.ts", lines: 400 },
  ];
  assert.deepEqual(overBudget(files, 400), { "a.ts": 900, "z.ts": 401 });
  assert.deepEqual(Object.keys(overBudget(files, 400)), ["a.ts", "z.ts"]);
});
