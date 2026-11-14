// Prints the git pathspecs check-no-suppressions.sh must exclude, NUL-separated (file names stay safe whatever
// they contain), one `:(exclude,literal)<path>` each. `literal` makes an entry a plain path from the repo root,
// never a glob, so "public/sw.js" exempts that file only and "vendor/" exempts that directory tree only.
// Two sources, and nothing else: the harness's own files that must hold the marker strings (exact paths; in an
// installed repo only when harness.lock manages them, so a host file at the same path is still scanned), and
// the repo's suppressions.excludePrefixes (vendored or generated third-party files). The rest of scripts/ is the
// host project's code and is scanned. Exits 2 when the config or the lock is missing or invalid, so the scan can
// never run against a list it could not read.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireConfig } from "./config.mjs";
import { cannotRun } from "./git-files.mjs";
import { lockedPaths } from "./harness-files.mjs";

process.chdir(join(dirname(fileURLToPath(import.meta.url)), "..", ".."));

// The checker names the markers it looks for, and its test writes them into fixture files.
const HARNESS_MARKER_FILES = ["scripts/check-no-suppressions.sh", "scripts/test/gate-suppressions.test.mjs"];

const { suppressions } = requireConfig();
let managed = null;
try {
  managed = lockedPaths(".");
} catch (err) {
  cannotRun(err.message);
}
const harness = managed === null ? HARNESS_MARKER_FILES : HARNESS_MARKER_FILES.filter((p) => managed.includes(p));
for (const path of [...harness, ...suppressions.excludePrefixes]) process.stdout.write(`:(exclude,literal)${path}\0`);
