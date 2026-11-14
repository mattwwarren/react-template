// Run once after installing the gates: records today's debt as ratchet files so the gates start green
// and can only get stricter. Never overwrites an existing ratchet file (changing one is the merge-base
// gate's business). Commit the result in the same change that installs the gates; a reviewer should
// check that no recorded count is higher than the code's real count.
//
// It records only what it could measure: a measurement the matching gate would refuse to make (no files,
// an empty graph) is an exit-2 failure here too, and an unconfigured cycles gate gets no ratchet file at all
// (a recorded `{}` would later report the first real cycle as "new" instead of recording it).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireConfig } from "./lib/config.mjs";
import { cannotRun, readTree } from "./lib/git-files.mjs";
import { cycleRatchet, cycles, featureGraph } from "./lib/import-cycles.mjs";
import { IMPORT_CYCLES_RATCHET_PATH, SIZE_RATCHET_PATH } from "./lib/ratchet-file.mjs";
import { overBudget, sizedFiles } from "./lib/tree-lines.mjs";

process.chdir(join(dirname(fileURLToPath(import.meta.url)), ".."));
const config = requireConfig();

/** Write `value` as JSON unless the file exists; the exclusive flag makes "never overwrite" atomic. */
function create(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  try {
    writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
    console.log(`kept ${path} (already exists)`);
    return;
  }
  console.log(`wrote ${path}`);
}

function measureSize() {
  const files = sizedFiles(config.size);
  if (files.length === 0) cannotRun("no files matched size.globs; refusing to record a size budget for an empty tree");
  return overBudget(files, config.size.limit);
}

/** The cycle ratchet, or null when the cycles gate is not configured. */
function measureCycles() {
  if (config.cycles.scopePrefixes.length === 0 || config.imports.sourceGlobs.length === 0) return null;
  const files = readTree(config.imports.sourceGlobs);
  if (files.length === 0) cannotRun("no files matched imports.sourceGlobs; refusing to record an empty graph");
  const graph = featureGraph(files, config);
  if (graph.size === 0)
    cannotRun(
      "cycles.scopePrefixes selected no modules among the files matched by imports.sourceGlobs and imports.extensions; refusing to record an empty graph",
    );
  return cycleRatchet(cycles(graph));
}

// Measure everything before writing anything, so a failed measurement leaves no partial state.
const sizeRatchet = measureSize();
const cycleRecord = measureCycles();

create(SIZE_RATCHET_PATH, sizeRatchet);
if (cycleRecord === null)
  console.log(
    `skipped ${IMPORT_CYCLES_RATCHET_PATH} (cycles gate not configured: set cycles.scopePrefixes and imports.sourceGlobs, then rerun)`,
  );
else create(IMPORT_CYCLES_RATCHET_PATH, cycleRecord);

if (config.tier === "t2") create(config.axe.allowlist, []);
