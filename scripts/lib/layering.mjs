// Layering: layers are listed lowest first; a file may import its own layer and the layers below it.
// The check fails closed: an import it cannot resolve (bare when external is denied, absolute, climbing
// out of the repo, computed dynamic) is a violation, never skipped.
import { classifySpecifier, importsOf } from "./imports.mjs";
import { lineAt } from "./js-scan.mjs";

const stem = (p) => p.replace(/\.[cm]?[jt]sx?$/, "");
const rulesOf = (config) => ({ aliases: config.imports.aliases, external: config.imports.external });

/**
 * Index of the first layer holding `path`, or -1 when it is in no layer. A directory import (`@/api`,
 * resolved to the directory `src/api`, no trailing slash) belongs to the layer that owns that directory.
 */
export const layerIndex = (path, layers) =>
  layers.findIndex((layer) => layer.dirs.some((dir) => path.startsWith(dir) || `${path}/` === dir));

export const describeOrder = (layers) => layers.map((l) => l.name).join(" < ");

/**
 * @param {{path: string, text: string}[]} files
 * @param {any} config a parsed harness config
 * @returns {string[]}
 */
export function layeringViolations(files, config) {
  const { layers, entry, unlayered, ignoreImporters } = config.layering;
  const rules = rulesOf(config);
  const order = describeOrder(layers);
  const out = [];
  for (const { path, text } of files) {
    if (ignoreImporters.some((s) => path.includes(s))) continue;
    const from = layerIndex(path, layers);
    for (const { specifier, offset } of importsOf(text)) {
      const at = `${path}:${lineAt(text, offset)}`;
      if (specifier === null) {
        out.push(`${at}: dynamic import with a computed specifier cannot be layer-checked — import a string literal path.`);
        continue;
      }
      const c = classifySpecifier(path, specifier, rules);
      if (c.kind === "external") continue;
      if (c.kind === "bare" || c.kind === "absolute") {
        out.push(
          `${at}: imports "${specifier}", which cannot be resolved to a file in this repo — use a relative path or a configured alias so the layer rules can see it.`,
        );
        continue;
      }
      if (c.kind === "escape") {
        out.push(`${at}: imports "${specifier}", which climbs out of the repo root.`);
        continue;
      }
      const base = `${at}: imports ${c.target}`;
      const hit = entry.find((e) => stem(e) === stem(c.target));
      if (hit) {
        out.push(`${base} — nothing may import ${hit} (it is an entry point). Move shared code into a layer.`);
        continue;
      }
      if (from === -1) continue;
      const to = layerIndex(c.target, layers);
      if (to === -1) {
        if (unlayered === "deny")
          out.push(
            `${base} — it is in no layer. Add its directory to a layer in harness.config.json, or move the code.`,
          );
      } else if (to > from) {
        out.push(
          `${base} — ${layers[from].name} may not import ${layers[to].name} (layers, lowest first: ${order}). Move the shared code down into a lower layer, pass it in as an argument, or have the upper layer register a callback.`,
        );
      }
    }
  }
  return out;
}

/** "importer layer -> target layer: count" lines for choosing layers; violations are marked. */
export function layerMatrix(files, config) {
  const { layers, unlayered, ignoreImporters } = config.layering;
  const rules = rulesOf(config);
  const name = (i) => (i === -1 ? "(none)" : layers[i].name);
  const counts = new Map();
  for (const { path, text } of files) {
    if (ignoreImporters.some((s) => path.includes(s))) continue;
    const from = layerIndex(path, layers);
    for (const { specifier } of importsOf(text)) {
      if (specifier === null) continue;
      const c = classifySpecifier(path, specifier, rules);
      if (c.kind !== "internal") continue;
      const to = layerIndex(c.target, layers);
      const key = `${name(from)} -> ${name(to)}`;
      const bad = from !== -1 && (to === -1 ? unlayered === "deny" : to > from);
      counts.set(key, { n: (counts.get(key)?.n ?? 0) + 1, bad: bad || counts.get(key)?.bad === true });
    }
  }
  return [...counts]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { n, bad }]) => `${key}: ${n}${bad ? "  <-- violates the order" : ""}`);
}
