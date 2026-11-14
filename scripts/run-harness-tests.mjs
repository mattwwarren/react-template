// Runs the harness's own tests: the files harness.lock manages under scripts/test/, by explicit name. A glob over
// scripts/test/ would also run whatever tests the host project keeps there. Exit 2 when it cannot tell which
// files are the harness's (no or unusable lock, no tests listed), never a pass.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cannotRun } from "./lib/git-files.mjs";
import { lockedPaths } from "./lib/harness-files.mjs";

process.chdir(join(dirname(fileURLToPath(import.meta.url)), ".."));

let managed = null;
try {
  managed = lockedPaths(".");
} catch (err) {
  cannotRun(err.message);
}
if (managed === null) cannotRun("harness.lock not found: the harness tests are the files it lists; reinstall the harness");
const tests = managed.filter((p) => /^scripts\/test\/[^/]+\.test\.mjs$/.test(p)).sort();
if (tests.length === 0) cannotRun("harness.lock lists no scripts/test/*.test.mjs files; refusing to call the harness tests passed");

const env = { ...process.env };
delete env.NODE_TEST_CONTEXT; // when started from another test run, run standalone instead of reporting into it
const run = spawnSync("node", ["--test", ...tests], { stdio: "inherit", env });
process.exit(run.status ?? 1);
