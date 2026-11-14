// Gate step: the axe allowlist may only lose entries relative to the merge base, so a failing
// accessibility check cannot be silenced by recording it. (The size and import-cycle ratchets have
// their own steps.)
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { allowlistProblems } from "./lib/axe-allowlist-shape.mjs";
import { allowRatchet } from "./lib/axe-allowlist.mjs";
import { requireConfig } from "./lib/config.mjs";
import { configProblems } from "./lib/config-ratchet.mjs";
import { cannotRun, readJsonAtMergeBase } from "./lib/git-files.mjs";
import { ratchetRegressions } from "./lib/ratchet.mjs";
import { runGate } from "./lib/run-gate.mjs";

process.chdir(join(dirname(fileURLToPath(import.meta.url)), ".."));

const config = requireConfig();
const ALLOWLIST = config.axe.allowlist;

/** Exit 2 unless the parsed allowlist is usable; `where` says which copy (head or merge base). */
function requireUsable(list, where) {
  const problems = allowlistProblems(list);
  if (problems.length > 0) cannotRun(`${ALLOWLIST} ${where} is malformed: ${problems[0]}`);
}

let head = [];
try {
  head = JSON.parse(readFileSync(ALLOWLIST, "utf8"));
} catch (err) {
  cannotRun(`cannot read ${ALLOWLIST}: ${err.message}`);
}
requireUsable(head, "in the working tree");

const base = readJsonAtMergeBase(ALLOWLIST, config.baseRef);
if (base !== null) requireUsable(base, "at the merge base");

runGate({
  heading: "Ratchet violations",
  problems: [
    ...configProblems(config),
    ...ratchetRegressions(base === null ? null : allowRatchet(base), allowRatchet(head)),
  ],
  ok: `ratchets: ${ALLOWLIST} OK (${head.length} recorded)`,
});
