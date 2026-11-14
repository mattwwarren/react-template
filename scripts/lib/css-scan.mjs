// CSS declaration scanning for the design-token gate: works on a stylesheet, a <style> element or CSS held in a JS string.

/** The 148 CSS Color 4 named colours (transparent and currentColor are keywords, not listed). */
const NAMED_COLORS =
  `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown
burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod
darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen
darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue
firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew
hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray
lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid
mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream
mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen
paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue
saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen
steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`.split(/\s+/);

const NAMED_COLOR_RE = new RegExp(`\\b(${NAMED_COLORS.join("|")})\\b`, "i");
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;
const COLOR_FN = "rgba?|hsla?|hwb|lab|lch|oklab|oklch";
export const JS_COLOR_FN_RE = new RegExp(`\\b(${COLOR_FN})\\(`, "gi");
const CSS_COLOR_FN_RE = new RegExp(`\\b(${COLOR_FN}|color)\\(`, "i");
const PX_RE = /\b\d+(\.\d+)?px\b/;
const Z_NUMBER_RE = /^\s*-?\d+\s*(!important)?\s*$/;
const PROP_RE = /^-{0,2}[a-zA-Z][\w-]*$/;

const blank = (s) => s.replace(/[^\n]/g, " ");

/** Blank comments, quoted strings' contents and url(...) contents, keeping offsets: braces in them are not structure. */
export function maskCss(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(["'])(?:\\.|(?!\1)[^\\\n])*\1/g, (m) => m[0] + blank(m.slice(1, -1)) + m[0])
    .replace(/url\(([^)]*)\)/gi, (_, inner) => `url(${blank(inner)})`);
}

/** Split on `;` outside parentheses. Returns [piece, offset-in-text] pairs. */
function splitDeclarations(text, base) {
  const out = [];
  let depth = 0;
  let from = 0;
  for (let i = 0; i <= text.length; i++) {
    const c = text[i];
    if (c === "(") depth++;
    else if (c === ")") depth = Math.max(0, depth - 1);
    else if ((c === ";" && depth === 0) || i === text.length) {
      out.push([text.slice(from, i), base + from]);
      from = i + 1;
    }
  }
  return out;
}

/**
 * Declarations at every nesting depth (plain rules, @media/@supports bodies, native CSS nesting). At each depth the
 * text outside child blocks is a declaration list; whatever follows the last `;` before a child `{` is that child's
 * selector or at-rule prelude and is skipped. Top-level text (depth 0) holds only preludes, so it is skipped.
 * @param {string} masked  text already passed through maskCss
 * @returns {{prop: string, value: string, offset: number, valueOffset: number}[]}
 */
export function declarations(masked) {
  const out = [];
  const emit = (from, to) => {
    for (const [piece, offset] of splitDeclarations(masked.slice(from, to), from)) {
      const colon = piece.indexOf(":");
      if (colon <= 0) continue;
      const prop = piece.slice(0, colon).trim();
      if (!PROP_RE.test(prop)) continue;
      const lead = piece.length - piece.trimStart().length;
      out.push({
        prop: prop.toLowerCase(),
        value: piece.slice(colon + 1),
        offset: offset + lead,
        valueOffset: offset + colon + 1,
      });
    }
  };
  const segStart = [0];
  let depth = 0;
  for (let i = 0; i < masked.length; i++) {
    if (masked[i] === "{") {
      if (depth > 0) emit(segStart[depth], segStart[depth] + masked.slice(segStart[depth], i).lastIndexOf(";") + 1);
      depth++;
      segStart[depth] = i + 1;
    } else if (masked[i] === "}" && depth > 0) {
      emit(segStart[depth], i);
      depth--;
      segStart[depth] = i + 1;
    }
  }
  return out;
}

/**
 * Raw design values in the declarations of `text`. Colours go through every rule; px font sizes and z-index numbers too.
 * @returns {[number, string][]}  [offset, what]
 */
export function cssProblems(text) {
  const masked = maskCss(text);
  const out = [];
  for (const { prop, value, offset } of declarations(masked)) {
    // var(--name) -> var(): a custom-property name such as --on-white is never a colour, but a raw fallback still is.
    const bare = value.replace(/var\(\s*--[\w-]+/g, "var(");
    if (HEX_RE.test(bare)) out.push([offset, "raw hex colour"]);
    if (CSS_COLOR_FN_RE.test(bare)) out.push([offset, "raw colour function"]);
    const named = NAMED_COLOR_RE.exec(bare);
    if (named) out.push([offset, `raw named colour "${named[1]}"`]);
    if ((prop === "font-size" || prop === "font") && PX_RE.test(bare)) out.push([offset, "raw font size in px"]);
    if (prop === "z-index" && Z_NUMBER_RE.test(bare)) out.push([offset, "raw z-index number"]);
  }
  return out;
}
