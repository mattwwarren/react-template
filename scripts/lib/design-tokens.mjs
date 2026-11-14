// Raw design values (colours, font-size px, z-index numbers) live only in the configured token files (tokens.tokenFiles).
// Everything else references them through var(--token). JS may write inline geometry and --custom properties only.
import { cssProblems, JS_COLOR_FN_RE } from "./css-scan.mjs";
import { lineAt, scanJs } from "./js-scan.mjs";
import { tailwindProblems } from "./tailwind-scan.mjs";

const JS_FILE = /\.[cm]?[jt]sx?$/;

/** Inline-style properties JS may write: geometry computed at run time. Colour, display etc. belong in CSS. */
const JS_STYLE_ALLOWED = new Set([
  "left",
  "top",
  "right",
  "bottom",
  "width",
  "height",
  "maxWidth",
  "maxHeight",
  "minWidth",
  "minHeight",
  "transform",
  "flex",
  "flexBasis",
  "gridTemplateColumns",
  "gridTemplateRows",
]);

const USE_TOKEN = "use a token from the token file (add one there if no role fits)";
const USE_CLASS =
  "toggle a class or the hidden attribute and style it in your stylesheets; JS may only set geometry or a --custom property";
const USE_FONT_TOKEN =
  "read the size from a token with getComputedStyle(...).getPropertyValue('--font-…') (add one to the token file)";

const ASSIGN_OP = String.raw`(?:\*\*|\?\?|&&|\|\||[-+*/%&|^])?=(?!=)`;

/** @typedef {[number, string, string?]} Finding  offset, what is wrong, how to fix it (default: use a token) */

/**
 * Every match of `re` in `text`. `what` may be a function of the match; `accept` filters matches.
 * @param {string} text
 * @param {string} re
 * @param {string | ((m: RegExpMatchArray) => string)} what
 * @param {string} fix
 * @param {(m: RegExpMatchArray) => boolean} [accept]
 * @returns {Finding[]}
 */
function matches(text, re, what, fix, accept = () => true) {
  /** @type {Finding[]} */
  const out = [];
  for (const m of text.matchAll(new RegExp(re, "g")))
    if (accept(m)) out.push([m.index, typeof what === "function" ? what(m) : what, fix]);
  return out;
}

/** Rules over what a JS string literal says, wherever it ends up (querySelector, innerHTML, injected CSS). */
function stringProblems({ start, text }) {
  const out = [];
  // A hex colour in value position: at the start, or after whitespace, `:`, `(` or `,`. "#addtab" (a selector) is not one.
  for (const m of text.matchAll(/(?:^|[\s:(,])(#[0-9a-fA-F]{3,8})\b/g))
    out.push([start + m.index + m[0].length - m[1].length, "raw hex colour"]);
  for (const m of text.matchAll(JS_COLOR_FN_RE)) out.push([start + m.index, "raw colour function"]);
  for (const m of text.matchAll(/\bstyle\s*=\s*\\?["']/gi))
    out.push([start + m.index, "inline style attribute in a string", USE_CLASS]);
  // CSS held in a string: any `{ … }` block gets the full declaration rules.
  if (text.includes("{")) for (const [offset, what] of cssProblems(text)) out.push([start + offset, what]);
  return out;
}

/** Rules over JS code (comments and string contents already blanked, except where noted). */
function codeProblems(skeleton, code) {
  const out = [];
  out.push(
    ...matches(
      skeleton,
      String.raw`\.style\.([a-zA-Z]+)\s*${ASSIGN_OP}`,
      (m) => `inline style write to style.${m[1]}`,
      USE_CLASS,
      (m) => !JS_STYLE_ALLOWED.has(m[1]),
    ),
  );
  out.push(...matches(skeleton, String.raw`\.style\s*\[`, "bracket access on .style", USE_CLASS));
  out.push(
    ...matches(skeleton, String.raw`\bObject\.assign\(\s*[\w$.?]*\.style\b`, "Object.assign onto .style", USE_CLASS),
  );
  out.push(
    ...matches(
      skeleton,
      String.raw`(?:[=,]|(?<!Object\.assign)\()\s*[\w$.?]+\.style\s*(?=[;,)\n])`,
      "the .style object is aliased or passed on (writes through it cannot be checked)",
      USE_CLASS,
    ),
  );
  // Strings are kept in `code`, so these can read the first argument.
  out.push(...matches(code, String.raw`\.setAttribute\(\s*["'\`]style["'\`]`, "setAttribute('style', …)", USE_CLASS));
  out.push(
    ...matches(
      code,
      String.raw`\.style\.setProperty\(\s*(?!["'\`]--)`,
      "style.setProperty on a non-custom property",
      USE_CLASS,
    ),
  );
  out.push(...matches(skeleton, String.raw`\bfontSize\s*[:=]\s*-?\d`, "raw font size number", USE_FONT_TOKEN));
  return out;
}

/**
 * @param {{path: string, text: string}[]} files
 * @param {{tokenFiles: string[], exemptPrefixes: string[], scanTailwindClasses: boolean, forbidPaletteClasses: boolean}} tokens
 * @returns {string[]}
 */
export function tokenViolations(files, tokens) {
  const out = [];
  for (const { path, text } of files) {
    if (tokens.tokenFiles.includes(path) || tokens.exemptPrefixes.some((p) => path.startsWith(p))) continue;
    /** @type {Finding[]} */
    let found = [];
    if (path.endsWith(".css")) {
      found = cssProblems(text);
    } else if (JS_FILE.test(path)) {
      const scan = scanJs(text);
      const { code, skeleton, strings } = scan;
      found = [...strings.flatMap(stringProblems), ...codeProblems(skeleton, code)];
      if (tokens.scanTailwindClasses)
        found.push(
          ...tailwindProblems(scan, { palette: tokens.forbidPaletteClasses, allowedStyleKeys: JS_STYLE_ALLOWED }),
        );
    } else if (path.endsWith(".html")) {
      for (const el of htmlStyleElements(text)) for (const [o, w] of cssProblems(el.css)) found.push([el.start + o, w]);
      for (const m of text.matchAll(/\sstyle\s*=\s*["']/gi)) found.push([m.index, "inline style attribute", USE_CLASS]);
    }
    const seen = new Set();
    for (const [offset, what, fix = USE_TOKEN] of found.sort((a, b) => a[0] - b[0])) {
      const message = `${path}:${lineAt(text, offset)}: ${what} — ${fix}.`;
      if (!seen.has(message)) {
        seen.add(message);
        out.push(message);
      }
    }
  }
  return out;
}

/** `<style>` elements of an HTML document with the offset of their text. */
function htmlStyleElements(html) {
  return [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => ({
    css: m[1],
    start: m.index + m[0].indexOf(m[1]),
  }));
}

/** Files the design-token check applies to. */
export function inTokenScope(path, tokens) {
  return (
    tokens.scopePrefixes.some((p) => path.startsWith(p)) &&
    /\.(?:css|html|[cm]?[jt]sx?)$/.test(path) &&
    !tokens.tokenFiles.includes(path) &&
    !tokens.exemptPrefixes.some((p) => path.startsWith(p))
  );
}
