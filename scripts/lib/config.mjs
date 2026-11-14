// The one place a repo says how the gates apply to it. Unknown keys are errors: a misspelt key that
// is silently ignored would turn a gate off without anyone noticing.
import { readFileSync } from "node:fs";
import { baseRefProblem, cannotRun } from "./git-files.mjs";

export const CONFIG_FILE = "harness.config.json";
export const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

// Frozen all the way down: parseConfig hands out clones, so nothing a caller does to a returned
// config can leak into the next parse.
function deepFreeze(value) {
  for (const inner of Object.values(value)) if (inner !== null && typeof inner === "object") deepFreeze(inner);
  return Object.freeze(value);
}

export const DEFAULTS = deepFreeze({
  tier: "t1",
  baseRef: "origin/main",
  size: {
    limit: 400,
    globs: ["*.ts", "*.tsx", "*.js", "*.jsx", "*.mjs", "*.cjs", "*.css", "*.html", "*.py", "*.sh"],
    excludePrefixes: ["node_modules/", "dist/", "docs/", "test-results/", "playwright-report/", ".claude/worktrees/"],
  },
  imports: { sourceGlobs: [], aliases: {}, extensions: [...SOURCE_EXTENSIONS], external: "allow" },
  layering: { layers: [], entry: [], unlayered: "deny", ignoreImporters: [] },
  cycles: { scopePrefixes: [] },
  tokens: {
    tokenFiles: [],
    scopePrefixes: [],
    exemptPrefixes: [],
    scanTailwindClasses: false,
    forbidPaletteClasses: false,
  },
  axe: { allowlist: "tests/e2e/axe-allowlist.json" },
  // Vendored or generated third-party files the no-suppression scan must not read. Each entry is an exact
  // repo-relative file path or a directory ending in "/". Never app code; widening it to get green is forbidden.
  suppressions: { excludePrefixes: [] },
});

// A path from the repo root that cannot reach outside it or name the whole repo.
const badRepoPath = (p) => p.startsWith("/") || p.startsWith(":") || p === "." || p.startsWith("./") || p.split("/").includes("..");

const isStringList = (v) => Array.isArray(v) && v.every((s) => typeof s === "string" && s !== "");
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

function fieldErrors(c) {
  const e = [];
  if (!["t1", "t2"].includes(c.tier)) e.push('"tier" must be "t1" or "t2"');
  const baseRefError = baseRefProblem(c.baseRef);
  if (baseRefError) e.push(baseRefError);
  if (!Number.isInteger(c.size.limit) || c.size.limit < 1) e.push('"size.limit" must be a positive integer');
  const lists = [
    ["size.globs", c.size.globs],
    ["size.excludePrefixes", c.size.excludePrefixes],
    ["imports.sourceGlobs", c.imports.sourceGlobs],
    ["imports.extensions", c.imports.extensions],
    ["layering.entry", c.layering.entry],
    ["layering.ignoreImporters", c.layering.ignoreImporters],
    ["cycles.scopePrefixes", c.cycles.scopePrefixes],
    ["tokens.tokenFiles", c.tokens.tokenFiles],
    ["tokens.scopePrefixes", c.tokens.scopePrefixes],
    ["tokens.exemptPrefixes", c.tokens.exemptPrefixes],
    ["suppressions.excludePrefixes", c.suppressions.excludePrefixes],
  ];
  for (const [name, list] of lists) if (!isStringList(list)) e.push(`"${name}" must be a list of non-empty strings`);
  if (isStringList(c.suppressions.excludePrefixes))
    for (const p of c.suppressions.excludePrefixes)
      if (badRepoPath(p))
        e.push(`"suppressions.excludePrefixes" entry "${p}" must be a path from the repo root: a file, or a directory ending in "/"`);
  if (!["allow", "deny"].includes(c.imports.external)) e.push('"imports.external" must be "allow" or "deny"');
  if (!["allow", "deny"].includes(c.layering.unlayered)) e.push('"layering.unlayered" must be "allow" or "deny"');
  if (!isPlainObject(c.imports.aliases)) e.push('"imports.aliases" must be an object');
  else
    for (const [prefix, dir] of Object.entries(c.imports.aliases))
      if (!prefix.endsWith("/") || typeof dir !== "string" || !dir.endsWith("/"))
        e.push(`"imports.aliases" entry "${prefix}" must map a prefix ending in "/" to a directory ending in "/"`);
  if (!Array.isArray(c.layering.layers)) e.push('"layering.layers" must be a list');
  else {
    const seen = new Set();
    for (const [i, layer] of c.layering.layers.entries()) {
      const named = typeof layer?.name === "string" && layer.name !== "";
      const label = named ? layer.name : `#${i + 1}`;
      if (!named) e.push(`layer ${label} needs a "name"`);
      else if (seen.has(label)) e.push(`duplicate layer name "${label}"`);
      seen.add(label);
      if (isPlainObject(layer))
        for (const key of Object.keys(layer))
          if (key !== "name" && key !== "dirs") e.push(`layer "${label}" has unknown key "${key}"`);
      if (!isStringList(layer?.dirs) || layer.dirs.length === 0 || !layer.dirs.every((d) => d.endsWith("/")))
        e.push(`layer "${label}" needs a non-empty "dirs" list of directories ending in "/"`);
    }
  }
  for (const name of ["scanTailwindClasses", "forbidPaletteClasses"])
    if (typeof c.tokens[name] !== "boolean") e.push(`"tokens.${name}" must be true or false`);
  if (typeof c.axe.allowlist !== "string" || c.axe.allowlist === "") e.push('"axe.allowlist" must be a path');
  return e;
}

/** @returns {{config: any, errors: string[]}} config is null only when the input is not an object */
export function parseConfig(raw) {
  if (!isPlainObject(raw)) return { config: null, errors: ["the config must be a JSON object"] };
  const errors = [];
  for (const key of Object.keys(raw)) if (!Object.hasOwn(DEFAULTS, key)) errors.push(`unknown key "${key}"`);
  const config = { tier: DEFAULTS.tier, baseRef: DEFAULTS.baseRef };
  for (const scalar of ["tier", "baseRef"]) if (Object.hasOwn(raw, scalar)) config[scalar] = raw[scalar];
  for (const [name, defaults] of Object.entries(DEFAULTS)) {
    if (typeof defaults !== "object") continue;
    // A present-but-null section must reach the object check, not fall back to the defaults.
    const given = Object.hasOwn(raw, name) ? raw[name] : {};
    if (!isPlainObject(given)) {
      errors.push(`"${name}" must be an object`);
      config[name] = structuredClone(defaults);
      continue;
    }
    for (const key of Object.keys(given)) if (!Object.hasOwn(defaults, key)) errors.push(`unknown key "${name}.${key}"`);
    config[name] = { ...structuredClone(defaults), ...given };
  }
  errors.push(...fieldErrors(config));
  return { config, errors };
}

export function loadConfig(path = CONFIG_FILE) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    return { config: null, errors: [`cannot read ${path}: ${err.message}`] };
  }
  return parseConfig(raw);
}

/** The config, or exit 2: a gate with a broken config never reports success. */
export function requireConfig(path = CONFIG_FILE) {
  const { config, errors } = loadConfig(path);
  if (errors.length > 0) cannotRun(`${path} is invalid:\n  ${errors.join("\n  ")}`);
  return config;
}
