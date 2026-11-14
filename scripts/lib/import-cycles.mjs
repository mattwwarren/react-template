// Import cycles among the modules under `cycles.scopePrefixes`. Modules may import each other
// (layering allows it), and a cycle works only while every import is used at call time, not at
// module load. The cycles that exist today are recorded as a shrink-only ratchet
// (scripts/import-cycles.json): none may grow and none may appear, so the debt can only go down.
import { classifySpecifier, importsOf, resolveToFile } from "./imports.mjs";

/**
 * The import graph among the files under cycles.scopePrefixes: file path -> the in-scope files it imports.
 * Type-only imports are erased at runtime, so they do not form cycles and are skipped.
 * @param {{path: string, text: string}[]} files
 * @param {any} config a parsed harness config
 * @returns {Map<string, string[]>}
 */
export function featureGraph(files, config) {
  const { scopePrefixes } = config.cycles;
  const { aliases, external, extensions } = config.imports;
  const known = new Set(
    files
      .map((f) => f.path)
      .filter((p) => scopePrefixes.some((s) => p.startsWith(s)) && extensions.some((e) => p.endsWith(e))),
  );
  const rules = { aliases, external };
  /** @type {Map<string, string[]>} */
  const graph = new Map();
  for (const { path, text } of files) {
    if (!known.has(path)) continue;
    const edges = new Set();
    for (const { specifier, typeOnly } of importsOf(text)) {
      if (specifier === null || typeOnly) continue;
      const c = classifySpecifier(path, specifier, rules);
      if (c.kind !== "internal") continue;
      const file = resolveToFile(c.target, known, extensions);
      if (file !== null) edges.add(file);
    }
    graph.set(path, [...edges].sort());
  }
  return graph;
}

/**
 * Strongly connected components with more than one module (or a module importing itself), by
 * Tarjan's algorithm. Each component is a list of paths, sorted.
 * @param {Map<string, string[]>} graph
 * @returns {string[][]}
 */
export function cycles(graph) {
  let counter = 0;
  /** @type {Map<string, number>} */
  const index = new Map();
  /** @type {Map<string, number>} */
  const low = new Map();
  /** @type {string[]} */
  const stack = [];
  const onStack = new Set();
  /** @type {string[][]} */
  const found = [];

  /** @param {string} node */
  function visit(node) {
    index.set(node, counter);
    low.set(node, counter);
    counter++;
    stack.push(node);
    onStack.add(node);
    for (const next of graph.get(node) ?? []) {
      if (!index.has(next)) {
        visit(next);
        low.set(node, Math.min(low.get(node) ?? 0, low.get(next) ?? 0));
      } else if (onStack.has(next)) {
        low.set(node, Math.min(low.get(node) ?? 0, index.get(next) ?? 0));
      }
    }
    if (low.get(node) !== index.get(node)) return;
    /** @type {string[]} */
    const component = [];
    for (let member = stack.pop(); member !== undefined; member = stack.pop()) {
      onStack.delete(member);
      component.push(member);
      if (member === node) break;
    }
    if (component.length > 1 || (graph.get(node) ?? []).includes(node)) found.push(component.sort());
  }

  for (const node of [...graph.keys()].sort()) if (!index.has(node)) visit(node);
  return found.sort((a, b) => b.length - a.length || (a[0] ?? "").localeCompare(b[0] ?? ""));
}

/**
 * The ratchet's shape: cycle sizes by rank, largest first. `{ "cycle-1": 10 }` means the largest
 * cycle has ten modules. A new cycle adds a key; a grown cycle raises a count.
 * @param {string[][]} found
 * @returns {Record<string, number>}
 */
export function cycleRatchet(found) {
  return Object.fromEntries(found.map((component, i) => [`cycle-${i + 1}`, component.length]));
}

/**
 * Compares the cycles that exist with the recorded ratchet. Anything bigger or new fails; so does
 * anything smaller or gone that is still recorded, so the record always says what is true.
 * @param {Record<string, number>} actual  cycleRatchet() of the code
 * @param {Record<string, number>} recorded  scripts/import-cycles.json
 * @returns {string[]}
 */
export function cycleProblems(actual, recorded) {
  const out = [];
  for (const [key, size] of Object.entries(actual)) {
    const allowed = recorded[key];
    if (allowed === undefined)
      out.push(
        `${key}: a new import cycle of ${size} modules. Break the cycle (events or a registration seam in a lower layer) instead of recording it.`,
      );
    else if (size > allowed)
      out.push(`${key}: the cycle grew from ${allowed} to ${size} modules. Do not add imports inside it.`);
    else if (size < allowed)
      out.push(
        `${key}: the cycle shrank from ${allowed} to ${size}. Lower it in scripts/import-cycles.json so the ratchet records what is true.`,
      );
  }
  for (const key of Object.keys(recorded))
    if (!(key in actual))
      out.push(`${key}: no such cycle any more. Remove it from scripts/import-cycles.json (the debt is paid).`);
  return out;
}
