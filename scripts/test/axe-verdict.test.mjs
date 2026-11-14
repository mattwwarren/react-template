import assert from "node:assert/strict";
import { test } from "node:test";
import { axeFailures } from "../lib/axe-verdict.mjs";

const violation = (over = {}) => ({
  id: "color-contrast",
  impact: "serious",
  help: "Elements must have sufficient color contrast",
  nodes: [{ target: ["#a"] }],
  ...over,
});

test("no violations pass", () => assert.deepEqual(axeFailures([], [], "main"), []));
test("a serious violation that is not allowlisted fails", () => {
  const f = axeFailures([violation()], [], "main");
  assert.equal(f.length, 1);
  assert.match(f[0], /color-contrast \(serious\)/);
  assert.match(f[0], /#a/);
});
test("minor and moderate violations do not block", () => {
  assert.deepEqual(axeFailures([violation({ impact: "minor" }), violation({ impact: "moderate" })], [], "main"), []);
});
test("an allowlisted node passes", () => {
  const allow = [{ label: "main", id: "color-contrast", target: "#a" }];
  assert.deepEqual(axeFailures([violation()], allow, "main"), []);
});
test("allowlist entries for other labels are ignored, and do not count as stale", () => {
  const allow = [{ label: "other", id: "color-contrast", target: "#zzz" }];
  assert.equal(axeFailures([violation()], allow, "main").length, 1);
});
test("an allowlist entry that no longer occurs is stale and fails", () => {
  const allow = [{ label: "main", id: "color-contrast", target: "#gone" }];
  const f = axeFailures([], allow, "main");
  assert.match(f[0], /stale allowlist entry/);
  assert.match(f[0], /main\|color-contrast\|#gone/);
});
test("nested targets (iframes, shadow roots) are joined", () => {
  const v = violation({ nodes: [{ target: [["#frame", "#inner"]] }] });
  assert.match(axeFailures([v], [], "main")[0], /#frame >> #inner/);
});
test("only three targets are shown, with a count of the rest", () => {
  const v = violation({ nodes: ["#a", "#b", "#c", "#d", "#e"].map((t) => ({ target: [t] })) });
  assert.match(axeFailures([v], [], "main")[0], /\(\+2 more\)/);
});
