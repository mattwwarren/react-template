import assert from "node:assert/strict";
import { test } from "node:test";
import { ratchetRegressions } from "../lib/ratchet.mjs";

test("null base (file absent at the merge base) bootstraps", () =>
  assert.deepEqual(ratchetRegressions(null, { "a.js": 900 }), []));
test("an added key fails", () =>
  assert.match(ratchetRegressions({ "a.js": 900 }, { "a.js": 900, "b.js": 500 })[0], /b\.js: new ratchet entry/));
test("a raised count fails", () =>
  assert.match(ratchetRegressions({ "a.js": 900 }, { "a.js": 901 })[0], /raised from 900 to 901/));
test("a lowered count passes", () => assert.deepEqual(ratchetRegressions({ "a.js": 900 }, { "a.js": 800 }), []));
test("an unchanged count passes", () => assert.deepEqual(ratchetRegressions({ "a.js": 900 }, { "a.js": 900 }), []));
test("a removed key passes", () =>
  assert.deepEqual(ratchetRegressions({ "a.js": 900, "b.js": 500 }, { "a.js": 900 }), []));
