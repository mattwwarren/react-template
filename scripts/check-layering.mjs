// Gate step: layering (see scripts/lib/layering.mjs). `--matrix` prints which layer imports which,
// to choose the layers for an existing codebase; it never fails.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireConfig } from "./lib/config.mjs";
import { cannotRun, readTree } from "./lib/git-files.mjs";
import { describeOrder, layeringViolations, layerMatrix } from "./lib/layering.mjs";
import { runGate } from "./lib/run-gate.mjs";

process.chdir(join(dirname(fileURLToPath(import.meta.url)), ".."));

const config = requireConfig();
if (config.layering.layers.length === 0)
  cannotRun('"layering.layers" is empty: define the layers in harness.config.json, or remove this step from scripts/ci-local.sh');
if (config.imports.sourceGlobs.length === 0)
  cannotRun('"imports.sourceGlobs" is empty: say which files to check in harness.config.json');

const files = readTree(config.imports.sourceGlobs);
if (files.length === 0) cannotRun("no files matched imports.sourceGlobs; refusing to call the layering clean");

if (process.argv.includes("--matrix")) {
  for (const line of layerMatrix(files, config)) console.log(line);
  process.exit(0);
}

runGate({
  heading: `Layering violations (${describeOrder(config.layering.layers)})`,
  problems: layeringViolations(files, config),
  ok: `layering: ${files.length} files OK`,
});
