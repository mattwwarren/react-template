// Import statements of a JS/TS source file and what they point at. Uses the character-level scanner
// so comments and string contents are never mistaken for code.
import { scanJs } from "./js-scan.mjs";

/** Relative-path join without touching the filesystem. Returns null when it climbs above the root. */
export function resolveImport(fromPath, specifier) {
  const parts = fromPath.split("/").slice(0, -1);
  for (const seg of specifier.split("/")) {
    if (seg === "." || seg === "") continue;
    if (seg === "..") {
      if (parts.length === 0) return null;
      parts.pop();
    } else parts.push(seg);
  }
  return parts.join("/");
}

// An import/export keyword token (not a property access like `obj.import`, not part of a longer word).
const STATEMENT_KEYWORD = /(?<![.\w$])(?:import|export)\b/g;

/**
 * True when the statement a `from` at `offset` is erased at runtime. This includes `import type …` /
 * `export type …`, and named imports/exports where every specifier has the inline `type` modifier.
 */
function isTypeOnly(skeleton, keywords, offset) {
  let keyword;
  for (const k of keywords) {
    if (k.index >= offset) break;
    keyword = k;
  }
  if (keyword === undefined) return false;
  const after = skeleton.slice(keyword.index + keyword[0].length, offset).trim();
  if (after !== "type" && /^type\b/.test(after)) return true;
  if (!after.startsWith("{") || !after.endsWith("}")) return false;
  const specifiers = after.slice(1, -1).split(",").map((specifier) => specifier.trim()).filter(Boolean);
  return specifiers.length > 0 && specifiers.every((specifier) => /^type\s+(?!as\b)\S/.test(specifier));
}

/**
 * Import specifiers (null specifier = computed) with their offsets.
 * @returns {{specifier: string | null, offset: number, typeOnly: boolean}[]}
 */
export function importsOf(text) {
  const { skeleton, strings } = scanJs(text);
  const literalAt = (quoteOffset) => strings.find((s) => s.quoteStart === quoteOffset && s.quote !== "`")?.text ?? null;
  const keywords = [...skeleton.matchAll(STATEMENT_KEYWORD)];
  const found = [];
  // import x from "…", export … from "…", import "…": a quote right after `from` or a bare `import`.
  for (const m of skeleton.matchAll(/(?<![.\w$])(from|import)\s*(["'])/g)) {
    found.push({
      specifier: literalAt(m.index + m[0].length - 1),
      offset: m.index,
      typeOnly: m[1] === "from" && isTypeOnly(skeleton, keywords, m.index),
    });
  }
  // import("…") and require("…") (also `import x = require("…")`): checked when the argument is a plain
  // string; anything else is computed. A `.`-preceded call is a method, not an import.
  for (const m of skeleton.matchAll(/(?<![.\w$])(?:import|require)\s*\(\s*(.)?/g)) {
    const quote = m[1] === '"' || m[1] === "'" ? m.index + m[0].length - 1 : -1;
    found.push({ specifier: quote < 0 ? null : literalAt(quote), offset: m.index, typeOnly: false });
  }
  return found.sort((a, b) => a.offset - b.offset);
}

/**
 * What a specifier points at.
 * @param {string} fromPath repo-relative path of the importer
 * @param {string} specifier
 * @param {{aliases: Record<string, string>, external: "allow" | "deny"}} rules
 */
export function classifySpecifier(fromPath, specifier, rules) {
  if (specifier.startsWith(".")) {
    const target = resolveImport(fromPath, specifier);
    return target === null ? { kind: "escape" } : { kind: "internal", target };
  }
  // Longest matching prefix wins, so overlapping aliases do not depend on key order.
  const prefix = Object.keys(rules.aliases)
    .filter((p) => specifier.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  if (prefix !== undefined) return { kind: "internal", target: rules.aliases[prefix] + specifier.slice(prefix.length) };
  if (specifier.startsWith("/")) return { kind: "absolute" };
  return rules.external === "allow" ? { kind: "external" } : { kind: "bare" };
}

/** The known file a resolved import target names (extension-less, directory index, or .js written for a .ts file). */
export function resolveToFile(target, known, extensions) {
  const stem = target.replace(/\.[cm]?js$/, "");
  for (const base of new Set([target, stem])) {
    if (known.has(base)) return base;
    for (const ext of extensions) if (known.has(base + ext)) return base + ext;
    for (const ext of extensions) if (known.has(`${base}/index${ext}`)) return `${base}/index${ext}`;
  }
  return null;
}
