// Shared by the gate-*config*.test.mjs files; not itself a test (the *.test.mjs glob does not match it).
// harness.config.json is itself a ratchet: a PR that loosens it must fail every gate that compares ratchet
// files with the merge base, whichever of them is run.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { commitAll, makeRepo, runScript, write } from "./fixture.mjs";

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" });
const CONFIG_FILE = "harness.config.json";

// The head config is the gate's base config with `change` merged over it, section by section.
const merged = (base, change) => {
  const out = { ...base };
  for (const [key, value] of Object.entries(change))
    out[key] = value !== null && typeof value === "object" && !Array.isArray(value) ? { ...base[key], ...value } : value;
  return out;
};

/** A repo whose merge base holds the gate's config, plus one commit that changes the config as `change` says. */
function pr(gate, change, extraFiles = {}) {
  const dir = makeRepo(gate.config, gate.files);
  git(dir, "update-ref", "refs/remotes/origin/other", "HEAD");
  write(dir, CONFIG_FILE, JSON.stringify(merged(gate.config, change)));
  for (const [path, text] of Object.entries(extraFiles)) write(dir, path, text);
  commitAll(dir);
  return dir;
}

/**
 * @param {{name: string, script: string, config: object, files: Record<string, string>}} gate
 *   `files` must include a file at "other-allowlist.json" (an existing second path for axe.allowlist)
 */
export function defineConfigRatchetCases(gate) {
  const reports = (change, label, re) =>
    test(`${gate.name}: ${label} fails with exit 1`, () => {
      const r = runScript(pr(gate, change), gate.script);
      assert.equal(r.status, 1, r.err);
      assert.match(r.err, re);
    });

  test(`${gate.name}: an unchanged config passes`, () => {
    const dir = pr(gate, {}, { "unrelated.txt": "x\n" });
    assert.equal(runScript(dir, gate.script).status, 0);
  });

  test(`${gate.name}: baseRef HEAD is a config error (exit 2), not a way to compare files with themselves`, () => {
    const r = runScript(pr(gate, { baseRef: "HEAD" }), gate.script);
    assert.equal(r.status, 2, r.err);
    assert.match(r.err, /"baseRef"/);
    assert.match(r.err, /remote-tracking/);
  });

  test(`${gate.name}: a baseRef that is only a local branch is refused (exit 2)`, () => {
    const dir = makeRepo({ ...gate.config, baseRef: "origin/ghost" }, gate.files);
    git(dir, "branch", "origin/ghost");
    const r = runScript(dir, gate.script);
    assert.equal(r.status, 2, r.err);
    assert.match(r.err, /cannot find the merge base/);
  });

  test(`${gate.name}: a local branch named like the base ref does not shadow the remote-tracking ref`, () => {
    const dir = pr(gate, { size: { limit: 500 } });
    git(dir, "branch", "origin/main");
    const r = runScript(dir, gate.script);
    assert.equal(r.status, 1, r.err);
    assert.match(r.err, /"size.limit" raised from 400 to 500/);
  });

  reports({ baseRef: "origin/other" }, "changing baseRef in the PR", /"baseRef" changed from "origin\/main" to "origin\/other"/);
  reports({ size: { limit: 500 } }, "raising size.limit", /"size.limit" raised from 400 to 500/);
  reports(
    { size: { excludePrefixes: ["node_modules/", "src/"] } },
    "growing size.excludePrefixes",
    /"size.excludePrefixes" gained "src\/"/,
  );
  reports({ tokens: { exemptPrefixes: ["src/"] } }, "growing tokens.exemptPrefixes", /"tokens.exemptPrefixes" gained "src\/"/);
  reports({ tokens: { tokenFiles: ["src/x.css"] } }, "growing tokens.tokenFiles", /"tokens.tokenFiles" gained "src\/x.css"/);
  reports(
    { suppressions: { excludePrefixes: ["src/"] } },
    "growing suppressions.excludePrefixes",
    /"suppressions.excludePrefixes" gained "src\/"/,
  );
  reports(
    { axe: { allowlist: "other-allowlist.json" } },
    "renaming axe.allowlist",
    /"axe.allowlist" changed from "tests\/e2e\/axe-allowlist.json" to "other-allowlist.json"/,
  );

  test(`${gate.name}: a shrunk config passes`, () => {
    const dir = makeRepo(merged(gate.config, { size: { limit: 500 } }), gate.files);
    write(dir, CONFIG_FILE, JSON.stringify(gate.config));
    commitAll(dir);
    assert.equal(runScript(dir, gate.script).status, 0);
  });

  test(`${gate.name}: a config absent at the merge base is the bootstrap (exit 0)`, () => {
    const dir = makeRepo({}, gate.files);
    git(dir, "rm", "-q", CONFIG_FILE);
    git(dir, "commit", "-q", "-m", "no config yet");
    git(dir, "update-ref", "refs/remotes/origin/main", "HEAD");
    write(dir, CONFIG_FILE, JSON.stringify(merged(gate.config, { size: { limit: 9999 } })));
    commitAll(dir);
    assert.equal(runScript(dir, gate.script).status, 0);
  });

  test(`${gate.name}: a base config that is not JSON cannot run (exit 2)`, () => {
    const dir = makeRepo({}, gate.files);
    write(dir, CONFIG_FILE, "{oops");
    commitAll(dir);
    git(dir, "update-ref", "refs/remotes/origin/main", "HEAD");
    write(dir, CONFIG_FILE, JSON.stringify(gate.config));
    commitAll(dir);
    const r = runScript(dir, gate.script);
    assert.equal(r.status, 2, r.err);
    assert.match(r.err, /harness\.config\.json/);
  });

  test(`${gate.name}: a base config with the wrong shape cannot run (exit 2)`, () => {
    const dir = makeRepo({}, gate.files);
    write(dir, CONFIG_FILE, JSON.stringify({ size: { limt: 1 } }));
    commitAll(dir);
    git(dir, "update-ref", "refs/remotes/origin/main", "HEAD");
    write(dir, CONFIG_FILE, JSON.stringify(gate.config));
    commitAll(dir);
    const r = runScript(dir, gate.script);
    assert.equal(r.status, 2, r.err);
    assert.match(r.err, /at the merge base is invalid/);
  });
}
