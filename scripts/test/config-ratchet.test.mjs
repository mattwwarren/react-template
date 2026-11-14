import assert from "node:assert/strict";
import { test } from "node:test";
import { configRegressions } from "../lib/config-ratchet.mjs";

const found = (base, head) => configRegressions(base, head);
const named = (key) => new RegExp(`"${key.replace(".", "\\.")}"`);

test("an absent base config is the bootstrap: nothing to compare", () => {
  assert.deepEqual(found(null, { size: { limit: 9999 }, baseRef: "origin/x" }), []);
});

test("an equal config, or one that only tightens, has no regressions", () => {
  assert.deepEqual(found({}, {}), []);
  assert.deepEqual(found({ size: { limit: 500 } }, { size: { limit: 300 } }), []);
  assert.deepEqual(found({ tokens: { exemptPrefixes: ["a/", "b/"] } }, { tokens: { exemptPrefixes: ["a/"] } }), []);
  assert.deepEqual(found({ suppressions: { excludePrefixes: ["v/"] } }, {}), []);
});

test("defaults are applied to both sides: restating a default is equal, deleting a key restores the default", () => {
  assert.deepEqual(found({}, { size: { limit: 400 }, baseRef: "origin/main" }), []);
  assert.deepEqual(found({ size: { limit: 500 } }, {}), []);
  assert.match(found({ size: { limit: 300 } }, {})[0], /"size.limit" raised from 300 to 400/);
});

test("a changed baseRef or axe.allowlist is reported by name", () => {
  assert.match(found({}, { baseRef: "origin/other" })[0], /"baseRef" changed from "origin\/main" to "origin\/other"/);
  assert.match(found({}, { axe: { allowlist: "x.json" } })[0], /"axe.allowlist" changed from "tests\/e2e\/axe-allowlist.json" to "x.json"/);
});

test("a raised size.limit is reported", () => {
  assert.match(found({}, { size: { limit: 401 } })[0], /"size.limit" raised from 400 to 401/);
});

for (const [key, base, grown] of [
  ["size.excludePrefixes", { size: { excludePrefixes: ["dist/"] } }, { size: { excludePrefixes: ["dist/", "src/"] } }],
  ["tokens.exemptPrefixes", {}, { tokens: { exemptPrefixes: ["src/"] } }],
  ["tokens.tokenFiles", { tokens: { tokenFiles: ["a.css"] } }, { tokens: { tokenFiles: ["a.css", "b.css"] } }],
  ["suppressions.excludePrefixes", {}, { suppressions: { excludePrefixes: ["vendor/"] } }],
  ["layering.ignoreImporters", {}, { layering: { ignoreImporters: [".test."] } }],
]) {
  test(`${key} gaining an entry is reported`, () => {
    const problems = found(base, grown);
    assert.equal(problems.length, 1);
    assert.match(problems[0], named(key));
    assert.match(problems[0], /gained/);
  });
}

for (const [key, base, shrunk] of [
  ["size.globs", {}, { size: { globs: ["*.ts"] } }],
  ["imports.sourceGlobs", { imports: { sourceGlobs: ["src/*.ts", "lib/*.ts"] } }, { imports: { sourceGlobs: ["src/*.ts"] } }],
  ["imports.extensions", {}, { imports: { extensions: [".ts"] } }],
  ["layering.entry", { layering: { entry: ["src/main.ts"] } }, {}],
  ["cycles.scopePrefixes", { cycles: { scopePrefixes: ["src/", "lib/"] } }, { cycles: { scopePrefixes: ["src/"] } }],
  ["tokens.scopePrefixes", { tokens: { scopePrefixes: ["src/"] } }, { tokens: { scopePrefixes: [] } }],
]) {
  test(`${key} losing an entry (a narrower scan) is reported`, () => {
    const problems = found(base, shrunk);
    assert.equal(problems.length, 1);
    assert.match(problems[0], named(key));
    assert.match(problems[0], /lost/);
  });
}

test("switches that turn a check off are reported", () => {
  assert.match(found({ imports: { external: "deny" } }, { imports: { external: "allow" } })[0], /"imports.external".*"deny".*"allow"/);
  assert.match(found({}, { layering: { unlayered: "allow" } })[0], /"layering.unlayered".*"deny".*"allow"/);
  assert.match(found({ tokens: { scanTailwindClasses: true } }, {})[0], /"tokens.scanTailwindClasses"/);
  assert.match(found({ tokens: { forbidPaletteClasses: true } }, {})[0], /"tokens.forbidPaletteClasses"/);
  assert.deepEqual(found({}, { imports: { external: "deny" }, layering: { unlayered: "deny" }, tokens: { scanTailwindClasses: true } }), []);
});

test("an import alias that is removed or re-pointed is reported; a new one is not", () => {
  const base = { imports: { aliases: { "@/": "src/" } } };
  assert.match(found(base, {})[0], /"imports.aliases" entry "@\/" was removed/);
  assert.match(found(base, { imports: { aliases: { "@/": "lib/" } } })[0], /"imports.aliases" entry "@\/" changed/);
  assert.deepEqual(found(base, { imports: { aliases: { "@/": "src/", "~/": "app/" } } }), []);
});

test("layers: removing a layer, reordering the survivors, or losing a directory is reported; adding is not", () => {
  const lib = { name: "lib", dirs: ["src/lib/"] };
  const ui = { name: "ui", dirs: ["src/ui/"] };
  const app = { name: "app", dirs: ["src/app/"] };
  const base = { layering: { layers: [lib, ui, app] } };
  assert.match(found(base, { layering: { layers: [lib, app] } })[0], /layer "ui" was removed/);
  assert.match(found(base, { layering: { layers: [ui, lib, app] } })[0], /layer order/);
  assert.match(found(base, { layering: { layers: [lib, { ...ui, dirs: ["src/other/"] }, app] } })[0], /layer "ui" lost "src\/ui\/"/);
  const extra = { name: "extra", dirs: ["src/extra/"] };
  assert.deepEqual(found(base, { layering: { layers: [lib, extra, ui, app] } }), []);
  assert.deepEqual(found(base, { layering: { layers: [lib, { ...ui, dirs: ["src/ui/", "src/more/"] }, app] } }), []);
});

test("every regression is its own message", () => {
  assert.equal(found({}, { baseRef: "origin/x", size: { limit: 500 }, suppressions: { excludePrefixes: ["v/"] } }).length, 3);
});
