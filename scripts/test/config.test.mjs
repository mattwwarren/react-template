import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { DEFAULTS, loadConfig, parseConfig } from "../lib/config.mjs";

test("an empty object yields the defaults and no errors", () => {
  const { config, errors } = parseConfig({});
  assert.deepEqual(errors, []);
  assert.equal(config.size.limit, 400);
  assert.equal(config.baseRef, "origin/main");
  assert.equal(config.tier, "t1");
  assert.deepEqual(config.layering.layers, []);
  assert.equal(config.layering.unlayered, "deny");
});

test("a partly given section keeps its other defaults", () => {
  const { config } = parseConfig({ size: { limit: 300 } });
  assert.equal(config.size.limit, 300);
  assert.deepEqual(config.size.globs, DEFAULTS.size.globs);
});

test("unknown keys are errors, so a typo cannot silently disable a gate", () => {
  assert.deepEqual(parseConfig({ sise: {} }).errors, ['unknown key "sise"']);
  assert.deepEqual(parseConfig({ size: { limt: 1 } }).errors, ['unknown key "size.limt"']);
});

test("non-object input is rejected", () => {
  assert.deepEqual(parseConfig([]).errors, ["the config must be a JSON object"]);
  assert.deepEqual(parseConfig(null).errors, ["the config must be a JSON object"]);
});

test("scalar fields are validated", () => {
  assert.match(parseConfig({ tier: "t3" }).errors[0], /"tier"/);
  assert.match(parseConfig({ baseRef: "" }).errors[0], /"baseRef"/);
  assert.match(parseConfig({ size: { limit: 0 } }).errors[0], /"size.limit"/);
  assert.match(parseConfig({ imports: { external: "maybe" } }).errors[0], /"imports.external"/);
  assert.match(parseConfig({ layering: { unlayered: "maybe" } }).errors[0], /"layering.unlayered"/);
});

test("baseRef must be a remote-tracking ref, so the merge base cannot be HEAD or a local branch", () => {
  for (const good of ["origin/main", "refs/remotes/origin/main", "upstream/release/1.2", "origin/feature-x"])
    assert.deepEqual(parseConfig({ baseRef: good }).errors, [], good);
  for (const bad of [
    "HEAD",
    "HEAD~1",
    "main",
    "refs/heads/main",
    "origin/main..HEAD",
    "origin/ma in",
    "-origin/main",
    "origin:main",
    "origin/main@{1}",
    "origin/",
    "/main",
    "refs/remotes/origin",
    "origin/main~2",
  ]) {
    const { errors } = parseConfig({ baseRef: bad });
    assert.equal(errors.length, 1, bad);
    assert.match(errors[0], /"baseRef"/, bad);
    assert.match(errors[0], /remote-tracking/, bad);
  }
});

test("list fields must be lists of non-empty strings", () => {
  assert.match(parseConfig({ size: { globs: "*.ts" } }).errors[0], /"size.globs"/);
  assert.match(parseConfig({ tokens: { tokenFiles: [""] } }).errors[0], /"tokens.tokenFiles"/);
});

test("layer dirs must end with a slash", () => {
  const { errors } = parseConfig({ layering: { layers: [{ name: "lib", dirs: ["src/lib"] }] } });
  assert.deepEqual(errors, ['layer "lib" needs a non-empty "dirs" list of directories ending in "/"']);
});

test("layers need unique names", () => {
  const layer = { name: "lib", dirs: ["src/lib/"] };
  assert.deepEqual(parseConfig({ layering: { layers: [layer, layer] } }).errors, ['duplicate layer name "lib"']);
});

test("alias prefixes and targets must end with a slash", () => {
  assert.match(parseConfig({ imports: { aliases: { "@": "src/" } } }).errors[0], /"imports.aliases"/);
  assert.match(parseConfig({ imports: { aliases: { "@/": "src" } } }).errors[0], /"imports.aliases"/);
  assert.deepEqual(parseConfig({ imports: { aliases: { "@/": "src/" } } }).errors, []);
});

test("suppressions.excludePrefixes defaults to none and is a list of repo-relative paths", () => {
  assert.deepEqual(parseConfig({}).config.suppressions, { excludePrefixes: [] });
  assert.deepEqual(parseConfig({ suppressions: { excludePrefixes: ["public/sw.js", "vendor/"] } }).errors, []);
  assert.match(parseConfig({ suppressions: { excludePrefixes: "public/sw.js" } }).errors[0], /"suppressions.excludePrefixes"/);
  assert.match(parseConfig({ suppressions: { excludePrefixes: [""] } }).errors[0], /"suppressions.excludePrefixes"/);
  assert.match(parseConfig({ suppressions: { exclude: [] } }).errors[0], /unknown key "suppressions.exclude"/);
});

test("suppressions.excludePrefixes entries cannot be absolute, climb out, or name the whole repo", () => {
  for (const bad of ["/etc/x.js", "../x.js", "a/../b.js", "./x.js", ".", "./", ":(top)x"]) {
    const { errors } = parseConfig({ suppressions: { excludePrefixes: [bad] } });
    assert.equal(errors.length, 1, bad);
    assert.match(errors[0], /"suppressions.excludePrefixes" entry/);
  }
});

test("token booleans are validated", () => {
  assert.match(parseConfig({ tokens: { scanTailwindClasses: "yes" } }).errors[0], /"tokens.scanTailwindClasses"/);
});

test("null and array sections are errors, not silently the defaults", () => {
  assert.deepEqual(parseConfig({ size: null }).errors, ['"size" must be an object']);
  assert.deepEqual(parseConfig({ size: [] }).errors, ['"size" must be an object']);
});

test("a layer with an unknown key is an error", () => {
  const { errors } = parseConfig({ layering: { layers: [{ name: "a", dirs: ["a/"], foo: 1 }] } });
  assert.deepEqual(errors, ['layer "a" has unknown key "foo"']);
});

test("inherited Object.prototype names are reported as unknown keys", () => {
  assert.deepEqual(parseConfig(JSON.parse('{"constructor": 1}')).errors, ['unknown key "constructor"']);
  assert.deepEqual(parseConfig(JSON.parse('{"size": {"toString": 1}}')).errors, ['unknown key "size.toString"']);
});

test("the returned config cannot mutate DEFAULTS", () => {
  const before = JSON.stringify(DEFAULTS);
  const { config } = parseConfig({});
  config.size.globs.push("*.polluted");
  config.imports.extensions.push(".polluted");
  config.imports.aliases["@/"] = "src/";
  assert.equal(JSON.stringify(DEFAULTS), before);
  assert.equal(JSON.stringify(parseConfig({}).config.size.globs), JSON.stringify(DEFAULTS.size.globs));
  assert.deepEqual(parseConfig({}).config.imports.aliases, {});
  for (const list of [DEFAULTS.size.globs, DEFAULTS.size.excludePrefixes, DEFAULTS.imports.extensions])
    assert.equal(Object.isFrozen(list), true);
  assert.equal(Object.isFrozen(DEFAULTS.imports.aliases), true);
});

test("loadConfig reports a missing file and invalid JSON as errors", () => {
  const dir = mkdtempSync(join(tmpdir(), "harness-config-"));
  try {
    const missing = loadConfig(join(dir, "nope.json"));
    assert.equal(missing.config, null);
    assert.match(missing.errors[0], /cannot read/);
    const bad = join(dir, "bad.json");
    writeFileSync(bad, "{ not json");
    const invalid = loadConfig(bad);
    assert.equal(invalid.config, null);
    assert.match(invalid.errors[0], /cannot read/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("requireConfig on a missing file exits with status 2", () => {
  const url = pathToFileURL(new URL("../lib/config.mjs", import.meta.url).pathname).href;
  const run = spawnSync(
    process.execPath,
    ["-e", `import(${JSON.stringify(url)}).then((m) => m.requireConfig("/nonexistent/harness.config.json"))`],
    { encoding: "utf8" },
  );
  assert.equal(run.status, 2);
});
