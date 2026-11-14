// Gate step: import cycles under cycles.scopePrefixes are a shrink-only ratchet (scripts/import-cycles.json).
// The file may only lose entries or lower counts relative to the merge base, and the cycles in the code
// must match it: no new cycle, no cycle that grows. `--list` prints the modules of each current cycle.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireConfig } from "./lib/config.mjs";
import { configProblems } from "./lib/config-ratchet.mjs";
import { cannotRun, readJsonAtMergeBase, readTree } from "./lib/git-files.mjs";
import { cycleProblems, cycleRatchet, cycles, featureGraph } from "./lib/import-cycles.mjs";
import { ratchetRegressions } from "./lib/ratchet.mjs";
import { readRatchetFile } from "./lib/ratchet-file.mjs";
import { runGate } from "./lib/run-gate.mjs";

const RATCHET = "scripts/import-cycles.json";
process.chdir(join(dirname(fileURLToPath(import.meta.url)), ".."));

const config = requireConfig();
if (config.cycles.scopePrefixes.length === 0)
  cannotRun('"cycles.scopePrefixes" is empty: configure the gate in harness.config.json, or remove this step from scripts/ci-local.sh');
if (config.imports.sourceGlobs.length === 0) cannotRun('"imports.sourceGlobs" is empty');

const files = readTree(config.imports.sourceGlobs);
if (files.length === 0) cannotRun("no files matched imports.sourceGlobs; refusing to call the import graph clean");
const graph = featureGraph(files, config);
if (graph.size === 0)
  cannotRun(
    "cycles.scopePrefixes selected no modules among the files matched by imports.sourceGlobs and imports.extensions; refusing to call the import graph clean",
  );
const found = cycles(graph);

if (process.argv.includes("--list")) {
  for (const [i, component] of found.entries())
    console.log(`cycle-${i + 1} (${component.length}): ${component.join(" ")}`);
  process.exit(0);
}

const recorded = readRatchetFile(RATCHET);

runGate({
  heading: "Import cycle violations",
  problems: [
    ...configProblems(config),
    ...ratchetRegressions(readJsonAtMergeBase(RATCHET, config.baseRef), recorded),
    ...cycleProblems(cycleRatchet(found), recorded),
  ],
  ok:
    found.length === 0
      ? "import cycles: none OK"
      : `import cycles: ${found.length} recorded (${found.map((c) => c.length).join(", ")} modules) OK`,
});
