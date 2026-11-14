import assert from "node:assert/strict";
import { test } from "node:test";
import { sizeViolations } from "../lib/size-budget.mjs";

test("new file over budget fails", () => {
  assert.match(sizeViolations([{ path: "a.js", lines: 401 }], {})[0], /a\.js: 401 lines > 400/);
});
test("file at budget passes", () => assert.deepEqual(sizeViolations([{ path: "a.js", lines: 400 }], {}), []));
test("ratcheted file may not grow", () => {
  assert.match(sizeViolations([{ path: "big.js", lines: 901 }], { "big.js": 900 })[0], /grew/);
});
test("ratcheted file that shrank must lower its entry", () => {
  assert.match(sizeViolations([{ path: "big.js", lines: 850 }], { "big.js": 900 })[0], /lower .*850/);
});
test("ratcheted file now under budget must drop its entry", () => {
  assert.match(sizeViolations([{ path: "big.js", lines: 300 }], { "big.js": 900 })[0], /remove/);
});
test("ratchet entry for a missing file fails", () => {
  assert.match(sizeViolations([], { "gone.js": 900 })[0], /gone\.js.*remove/);
});
test("exact ratchet count passes", () =>
  assert.deepEqual(sizeViolations([{ path: "big.js", lines: 900 }], { "big.js": 900 }), []));
