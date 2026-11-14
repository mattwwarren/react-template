import assert from "node:assert/strict";
import { test } from "node:test";
import { makeRepo, runScript } from "./fixture.mjs";

const CONFIG = {
  tier: "t2",
  tokens: { tokenFiles: ["src/index.css"], scopePrefixes: ["src/"], scanTailwindClasses: true },
};

test("a clean tree passes", () => {
  const dir = makeRepo(CONFIG, {
    "src/index.css": ":root{--c:#fff}",
    "src/a.css": ".a{color:var(--c)}",
    "src/a.tsx": '<div className="bg-primary" />',
  });
  const r = runScript(dir, "check-design-tokens.mjs");
  assert.equal(r.status, 0);
  assert.match(r.out, /design tokens: 2 files OK/);
});

test("a raw value outside the token file fails with file and line", () => {
  const dir = makeRepo(CONFIG, { "src/index.css": ":root{--c:#fff}", "src/a.css": "\n.a{color:#fff}" });
  const r = runScript(dir, "check-design-tokens.mjs");
  assert.equal(r.status, 1);
  assert.match(r.err, /src\/a\.css:2: raw hex colour/);
});

test("no token file configured cannot run (exit 2)", () => {
  const dir = makeRepo({ tier: "t2", tokens: { scopePrefixes: ["src/"] } }, { "src/a.css": ".a{}" });
  const r = runScript(dir, "check-design-tokens.mjs");
  assert.equal(r.status, 2);
  assert.match(r.err, /"tokens.tokenFiles" is empty/);
});

test("an empty scope cannot run (exit 2)", () => {
  const dir = makeRepo(CONFIG, { "other/a.css": ".a{}" });
  const r = runScript(dir, "check-design-tokens.mjs");
  assert.equal(r.status, 2);
  assert.match(r.err, /no files found under tokens\.scopePrefixes/);
});
