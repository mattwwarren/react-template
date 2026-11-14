import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { lockedPaths } from "../lib/harness-files.mjs";

const SCRIPTS = join(import.meta.dirname, "..");
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" });

// Every temp dir a test makes goes through tempDir, and all of them are removed when the test process exits
// (each test file runs in its own process), so a run leaves nothing behind in the system temp dir.
const made = new Set();
process.on("exit", () => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
});

/** A new empty directory under the system temp dir, removed when the test process exits. */
export function tempDir(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  made.add(dir);
  return dir;
}

export function write(dir, path, text) {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), text);
}

export function commitAll(dir, message = "change") {
  git(dir, "add", ".");
  git(dir, "commit", "-q", "-m", message);
}

// In the harness's own source tree (no harness.lock) the harness files are: everything under lib/ and test/, the
// check-* gate steps, and the two other entry points. Nothing else in a scripts/ directory is the harness.
const OWN_FILE = /^(?:(?:lib|test)\/.+|check-[^/]+|bootstrap\.mjs|run-harness-tests\.mjs)$/;

/**
 * Copy only the harness's own files from the scripts directory `from` to `to`. In an installed repo that is what
 * harness.lock manages, so the host project's own code in scripts/ (and its size-budget.json, import-cycles.json
 * and ci-local.sh) never reaches a fixture repo; in the source tree it is the OWN_FILE allowlist.
 */
export function copyGateScripts(from, to) {
  const source = resolve(from);
  const managed = lockedPaths(dirname(source));
  const own = managed === null ? (rel) => OWN_FILE.test(rel) : (rel) => managed.includes(`${basename(source)}/${rel}`);
  for (const rel of readdirSync(source, { recursive: true })) {
    if (!statSync(join(source, rel)).isFile() || !own(rel.split(sep).join("/"))) continue;
    mkdirSync(dirname(join(to, rel)), { recursive: true });
    copyFileSync(join(source, rel), join(to, rel));
  }
}

/** A throwaway git repo holding a copy of the gate scripts, a config and the given files; origin/main points at the first commit. */
export function makeRepo(config, files) {
  const dir = tempDir("harness-fixture-");
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.email", "t@example.com");
  git(dir, "config", "user.name", "t");
  copyGateScripts(SCRIPTS, join(dir, "scripts"));
  write(dir, "harness.config.json", JSON.stringify(config));
  for (const [path, text] of Object.entries(files)) write(dir, path, text);
  commitAll(dir, "base");
  git(dir, "update-ref", "refs/remotes/origin/main", "HEAD");
  return dir;
}

const result = (r) => ({ status: r.status, out: r.stdout, err: r.stderr });

export function runScript(dir, script, ...args) {
  return result(spawnSync("node", [join("scripts", script), ...args], { cwd: dir, encoding: "utf8" }));
}

export function runShell(dir, script, ...args) {
  return result(spawnSync("bash", [join("scripts", script), ...args], { cwd: dir, encoding: "utf8" }));
}
