// Gate step: raw colours, font-size px and z-index numbers live only in the configured token file(s).
// See scripts/lib/design-tokens.mjs for the rules and scripts/lib/tailwind-scan.mjs for Tailwind/JSX.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireConfig } from "./lib/config.mjs";
import { inTokenScope, tokenViolations } from "./lib/design-tokens.mjs";
import { cannotRun, readTree } from "./lib/git-files.mjs";
import { runGate } from "./lib/run-gate.mjs";

process.chdir(join(dirname(fileURLToPath(import.meta.url)), ".."));

const { tokens } = requireConfig();
if (tokens.tokenFiles.length === 0)
  cannotRun('"tokens.tokenFiles" is empty: name the file(s) where raw design values may live');
if (tokens.scopePrefixes.length === 0) cannotRun('"tokens.scopePrefixes" is empty: say which directories to check');

const EXTENSIONS = ["css", "html", "ts", "tsx", "js", "jsx", "mjs", "cjs"];
const files = readTree(
  tokens.scopePrefixes.flatMap((prefix) => EXTENSIONS.map((ext) => `${prefix}*.${ext}`)),
  (path) => inTokenScope(path, tokens),
);
if (files.length === 0) cannotRun("no files found under tokens.scopePrefixes; refusing to call the design tokens clean");

runGate({
  heading: "Design token violations",
  problems: tokenViolations(files, tokens),
  ok: `design tokens: ${files.length} files OK`,
});
