// harness.config.json is a ratchet too: every ratchet file is only as strong as the config that says which ref
// it is compared with, where the allowlist lives, how big a file may be and what the scanners skip. A change
// that loosens any of that would turn a gate off while the gate still exits 0, so the config may only get
// stricter relative to the merge base. Both sides have their defaults applied before they are compared:
// deleting a key that restores a stricter default is fine, and adding one that restores a looser one is not.
import { CONFIG_FILE, parseConfig } from "./config.mjs";
import { cannotRun, readJsonAtMergeBase } from "./git-files.mjs";

const q = JSON.stringify;
const at = (config, key) => key.split(".").reduce((node, part) => node[part], config);
const quoted = (items) => items.map(q).join(", ");
const FOOTER = "Config settings may only get stricter; loosen one on the default branch, in its own reviewed change.";

// A different value is a regression whichever way it moves.
const CHANGED = ["baseRef", "axe.allowlist"];
// Lists whose new entries exempt more of the tree from a check.
const GROWN = [
  "size.excludePrefixes",
  "tokens.exemptPrefixes",
  "tokens.tokenFiles",
  "suppressions.excludePrefixes",
  "layering.ignoreImporters",
];
// Lists whose entries are what a check looks at, so losing one makes the check see less.
const SHRUNK = [
  "size.globs",
  "imports.sourceGlobs",
  "imports.extensions",
  "layering.entry",
  "cycles.scopePrefixes",
  "tokens.scopePrefixes",
];
// Settings with one strict value: moving off it is a regression.
const STRICT = [
  ["imports.external", "deny"],
  ["layering.unlayered", "deny"],
  ["tokens.scanTailwindClasses", true],
  ["tokens.forbidPaletteClasses", true],
];

function layerRegressions(base, head) {
  const out = [];
  const byName = new Map(head.map((layer) => [layer.name, layer]));
  const survivors = base.filter((layer) => byName.has(layer.name)).map((layer) => layer.name);
  for (const layer of base) {
    const now = byName.get(layer.name);
    if (!now) out.push(`"layering.layers": layer ${q(layer.name)} was removed. ${FOOTER}`);
    else
      for (const dir of layer.dirs)
        if (!now.dirs.includes(dir)) out.push(`"layering.layers": layer ${q(layer.name)} lost ${q(dir)}. ${FOOTER}`);
  }
  const order = head.map((layer) => layer.name).filter((name) => survivors.includes(name));
  if (order.join("\0") !== survivors.join("\0"))
    out.push(`"layering.layers": layer order changed from ${survivors.join(" < ")} to ${order.join(" < ")}. ${FOOTER}`);
  return out;
}

/**
 * What a change to harness.config.json loosens. Either side may be raw JSON or an already parsed config.
 * @param {any} baseConfig the config at the merge base; null or undefined when it did not exist there (bootstrap)
 * @param {any} headConfig the config in the working tree
 * @returns {string[]}
 */
export function configRegressions(baseConfig, headConfig) {
  if (baseConfig === null || baseConfig === undefined) return [];
  const base = parseConfig(baseConfig).config;
  const head = parseConfig(headConfig).config;
  const out = [];
  for (const key of CHANGED)
    if (at(base, key) !== at(head, key))
      out.push(`${q(key)} changed from ${q(at(base, key))} to ${q(at(head, key))}. ${FOOTER}`);
  if (head.size.limit > base.size.limit)
    out.push(`"size.limit" raised from ${base.size.limit} to ${head.size.limit}. ${FOOTER}`);
  for (const key of GROWN) {
    const gained = at(head, key).filter((entry) => !at(base, key).includes(entry));
    if (gained.length > 0) out.push(`${q(key)} gained ${quoted(gained)}, which exempts more of the tree. ${FOOTER}`);
  }
  for (const key of SHRUNK) {
    const lost = at(base, key).filter((entry) => !at(head, key).includes(entry));
    if (lost.length > 0) out.push(`${q(key)} lost ${quoted(lost)}, so the check sees less of the tree. ${FOOTER}`);
  }
  for (const [key, strict] of STRICT)
    if (at(base, key) === strict && at(head, key) !== strict)
      out.push(`${q(key)} changed from ${q(strict)} to ${q(at(head, key))}. ${FOOTER}`);
  for (const [prefix, dir] of Object.entries(base.imports.aliases)) {
    const now = head.imports.aliases[prefix];
    if (now === undefined) out.push(`"imports.aliases" entry ${q(prefix)} was removed. ${FOOTER}`);
    else if (now !== dir) out.push(`"imports.aliases" entry ${q(prefix)} changed from ${q(dir)} to ${q(now)}. ${FOOTER}`);
  }
  out.push(...layerRegressions(base.layering.layers, head.layering.layers));
  return out;
}

/**
 * harness.config.json as it was at the merge base, parsed with defaults; null when it did not exist there yet
 * (bootstrap). Fails closed (exit 2) when it is not valid JSON or not a valid config.
 * @param {string} baseRef a remote-tracking ref (see baseRefProblem)
 */
export function readBaseConfig(baseRef) {
  const raw = readJsonAtMergeBase(CONFIG_FILE, baseRef);
  if (raw === null) return null;
  const { config, errors } = parseConfig(raw);
  if (errors.length > 0) cannotRun(`${CONFIG_FILE} at the merge base is invalid:\n  ${errors.join("\n  ")}`);
  return config;
}

/** The regressions of the working-tree config against the merge base's, for a gate to list with its own problems. */
export const configProblems = (/** @type {any} */ headConfig) => configRegressions(readBaseConfig(headConfig.baseRef), headConfig);
