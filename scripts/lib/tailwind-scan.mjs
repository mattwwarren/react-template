// Token rules for TS/TSX/JS sources: Tailwind utility classes held in strings, and the JSX style prop.
// Known gaps: classes assembled from fragments at run time, and style objects built elsewhere and passed in.
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const COLOUR_FN = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/i;
const NAMED_COLOUR = /^(?:aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)$/i;
const COLOUR_UTILITY = /^(?:bg|text|border|ring|fill|stroke|from|via|to|outline|divide|decoration|accent|caret|shadow)$/;
const ARBITRARY = /(?<![\w-])(?:[\w-]+:)*(-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*)-\[([^\]\s]+)\]/g;
const PALETTE =
  /(?<![\w-])(?:[\w-]+:)*(?:bg|text|border|ring|fill|stroke|from|via|to|outline|divide|decoration|accent|caret|shadow)-(?:(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}|black|white)(?![\w-])/g;
const STYLE_PROP = /\bstyle\s*=\s*\{(\s*)(\{)?/g;

export const USE_TOKEN_CLASS =
  "use a semantic token class (e.g. bg-primary, text-muted-foreground) or add a token to the theme file";
export const USE_STYLE_CLASS =
  "style it with a class; the style prop may only carry computed geometry or a --custom property";

/** Raw design values written as arbitrary-value classes. */
function arbitraryProblems({ start, text }) {
  const out = [];
  for (const m of text.matchAll(ARBITRARY)) {
    const name = m[1].replace(/^-/, "");
    const value = m[2].replace(/var\(\s*--[\w-]+/g, "var(");
    const at = start + m.index;
    if (HEX.test(value) || COLOUR_FN.test(value) || (COLOUR_UTILITY.test(name) && NAMED_COLOUR.test(value)))
      out.push([at, `raw colour in the class "${m[0]}"`, USE_TOKEN_CLASS]);
    else if (name === "text" && /^\d+(?:\.\d+)?(?:px|rem|em)$/.test(value))
      out.push([at, `raw font size in the class "${m[0]}"`, USE_TOKEN_CLASS]);
    else if (name === "z" && /^-?\d+$/.test(value)) out.push([at, `raw z-index in the class "${m[0]}"`, USE_TOKEN_CLASS]);
  }
  return out;
}

function paletteProblems({ start, text }) {
  return [...text.matchAll(PALETTE)].map((m) => [start + m.index, `default-palette class "${m[0]}"`, USE_TOKEN_CLASS]);
}

/** [from, to) offsets of the top-level entries of the object literal whose `{` is at `open`. */
function objectEntries(skeleton, open) {
  const entries = [];
  let depth = 0;
  let from = open + 1;
  for (let i = open; i < skeleton.length; i++) {
    const c = skeleton[i];
    if (c === "{" || c === "(" || c === "[") depth++;
    else if (c === "}" || c === ")" || c === "]") {
      depth--;
      if (depth === 0) {
        entries.push([from, i]);
        return entries;
      }
    } else if (c === "," && depth === 1) {
      entries.push([from, i]);
      from = i + 1;
    }
  }
  return entries;
}

function styleProblems({ code, skeleton }, allowedKeys) {
  const out = [];
  for (const m of skeleton.matchAll(STYLE_PROP)) {
    if (!m[2]) {
      out.push([m.index, "style prop is not an object literal (its keys cannot be checked)", USE_STYLE_CLASS]);
      continue;
    }
    const open = m.index + m[0].length - 1;
    for (const [from, to] of objectEntries(skeleton, open)) {
      const raw = code.slice(from, to);
      if (/^\s*$/.test(raw)) continue;
      if (/^\s*\.\.\./.test(raw)) {
        out.push([from, "spread inside a style object (its keys cannot be checked)", USE_STYLE_CLASS]);
        continue;
      }
      const key = /^\s*(?:([A-Za-z_$][\w$]*)|["']([^"']+)["'])\s*(?::|$)/.exec(raw);
      if (!key) {
        out.push([from, "computed or unreadable key in a style object", USE_STYLE_CLASS]);
        continue;
      }
      const name = key[1] ?? key[2];
      if (!name.startsWith("--") && !allowedKeys.has(name))
        out.push([from, `inline style property "${name}"`, USE_STYLE_CLASS]);
    }
  }
  return out;
}

/**
 * @param {{code: string, skeleton: string, strings: {start: number, text: string}[]}} scan  the scanJs() result
 * @param {{palette: boolean, allowedStyleKeys: Set<string>}} options
 * @returns {[number, string, string][]}  [offset, what is wrong, how to fix it]
 */
export function tailwindProblems(scan, { palette, allowedStyleKeys }) {
  const out = [];
  for (const s of scan.strings) {
    out.push(...arbitraryProblems(s));
    if (palette) out.push(...paletteProblems(s));
  }
  out.push(...styleProblems(scan, allowedStyleKeys));
  return out;
}
