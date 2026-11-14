// Gate step: no source file over size.limit lines, except files recorded in scripts/size-budget.json,
// which may only shrink. The ratchet file itself is compared with the merge base so it cannot be
// edited upward to make a failure disappear. harness.config.json is compared the same way (config-ratchet.mjs).
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireConfig } from "./lib/config.mjs";
import { configProblems } from "./lib/config-ratchet.mjs";
import { cannotRun, readJsonAtMergeBase } from "./lib/git-files.mjs";
import { ratchetRegressions } from "./lib/ratchet.mjs";
import { readRatchetFile, SIZE_RATCHET_PATH } from "./lib/ratchet-file.mjs";
import { runGate } from "./lib/run-gate.mjs";
import { sizeViolations } from "./lib/size-budget.mjs";
import { sizedFiles } from "./lib/tree-lines.mjs";

process.chdir(join(dirname(fileURLToPath(import.meta.url)), ".."));

const config = requireConfig();
const files = sizedFiles(config.size);
if (files.length === 0) cannotRun("no files matched size.globs; refusing to call the tree within budget");

const head = readRatchetFile(SIZE_RATCHET_PATH);

const problems = [
  ...configProblems(config),
  ...ratchetRegressions(readJsonAtMergeBase(SIZE_RATCHET_PATH, config.baseRef), head),
  ...sizeViolations(files, head, config.size.limit),
];
runGate({ heading: "Size budget violations", problems, ok: `size budget: ${files.length} files OK` });
