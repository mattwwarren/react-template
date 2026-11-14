// A small character-level scanner for JavaScript source. The gate scripts use it so that a string such as
// "a/*" or 'a//b' cannot blind a comment-stripping regex, and so string contents are never mistaken for code.
//
// It understands '…' and "…" strings, template literals (including nested ${…}), // and /* */ comments, and regex
// literals. Regex literals are a heuristic: a `/` starts one when the previous significant character cannot end an
// expression (or the previous word is return/typeof/…). Good enough for source we own; not a full parser.

/**
 * @typedef {object} JsString
 * @property {string} quote      the opening quote character: ', " or `
 * @property {number} quoteStart offset of the opening quote
 * @property {number} start      offset of the first content character
 * @property {number} end        offset just past the last content character
 * @property {string} text       the content; for templates every ${…} expression is replaced by spaces
 */

const REGEX_AFTER = new Set([
  "",
  "(",
  ",",
  "=",
  ":",
  "[",
  "!",
  "&",
  "|",
  "?",
  "{",
  "}",
  ";",
  "+",
  "-",
  "*",
  "%",
  "<",
  ">",
  "~",
  "^",
]);
const REGEX_AFTER_WORD = /\b(?:return|typeof|case|in|of|delete|void|throw|else|do|yield|await)\s*$/;

/**
 * @param {string} text
 * @returns {{code: string, skeleton: string, strings: JsString[]}}
 *   code: the source with comments blanked. skeleton: code with string/template/regex contents blanked too (quotes kept).
 *   Offsets and line numbers are identical in all three.
 */
export function scanJs(text) {
  const n = text.length;
  const code = text.split("");
  const skeleton = text.split("");
  /** @type {JsString[]} */
  const strings = [];
  let last = ""; // last significant character seen in code

  const blank = (arr, from, to) => {
    for (let k = from; k < to; k++) if (arr[k] !== "\n") arr[k] = " ";
  };

  function scanString(i, quote) {
    let j = i + 1;
    while (j < n && text[j] !== quote && text[j] !== "\n") j += text[j] === "\\" ? 2 : 1;
    j = Math.min(j, n);
    strings.push({ quote, quoteStart: i, start: i + 1, end: j, text: text.slice(i + 1, j) });
    blank(skeleton, i + 1, j);
    return j < n && text[j] === quote ? j + 1 : j;
  }

  function scanTemplate(i) {
    const expressions = [];
    let j = i + 1;
    let chunkStart = j;
    while (j < n && text[j] !== "`") {
      if (text[j] === "\\") j += 2;
      else if (text[j] === "$" && text[j + 1] === "{") {
        blank(skeleton, chunkStart, j);
        const close = scanCode(j + 2, true);
        expressions.push([j, close + 1]);
        j = close + 1;
        chunkStart = j;
      } else j++;
    }
    j = Math.min(j, n);
    blank(skeleton, chunkStart, j);
    const body = text.split("").slice(i + 1, j);
    for (const [from, to] of expressions)
      for (let k = from; k < Math.min(to, j); k++) if (body[k - i - 1] !== "\n") body[k - i - 1] = " ";
    strings.push({ quote: "`", quoteStart: i, start: i + 1, end: j, text: body.join("") });
    return j < n ? j + 1 : j;
  }

  function scanRegex(i) {
    let j = i + 1;
    let inClass = false;
    while (j < n && text[j] !== "\n") {
      if (text[j] === "\\") j++;
      else if (text[j] === "[") inClass = true;
      else if (text[j] === "]") inClass = false;
      else if (text[j] === "/" && !inClass) {
        blank(skeleton, i + 1, j);
        j++;
        while (j < n && /[a-z]/i.test(text[j])) j++;
        return j;
      }
      j++;
    }
    return i + 1; // not a regex after all: treat the slash as an operator
  }

  function startsJsxTag(i) {
    const next = text[i + 1];
    if (next === ">" || next === "/") return true;
    if (next === undefined || !/[A-Za-z]/.test(next)) return false;
    const before = text.slice(0, i).trimEnd();
    const previous = before.at(-1) ?? "";
    return (
      i === 0 ||
      /[=(:,[!&|?{;]/.test(previous) ||
      previous === ">" ||
      /\b(?:return|throw)\s*$/.test(before)
    );
  }

  /** Scan code from i. With stopAtBrace, return the offset of the `}` that closes the enclosing ${ … }. */
  function scanCode(i, stopAtBrace) {
    let depth = 0;
    let jsxDepth = 0;
    let jsxText = false;
    let jsxTag = false;
    let closingJsxTag = false;
    while (i < n) {
      const c = text[i];
      const d = text[i + 1];
      if (jsxText) {
        if (c === "<") {
          jsxText = false;
          jsxTag = true;
          closingJsxTag = d === "/";
          i++;
        } else if (c === "{") {
          jsxText = false;
          const close = scanCode(i + 1, true);
          i = close + 1;
          jsxText = true;
        } else {
          if (c !== "\n") skeleton[i] = " ";
          i++;
        }
      } else if (!jsxTag && c === "<" && startsJsxTag(i)) {
        jsxTag = true;
        closingJsxTag = d === "/";
        i++;
      } else if (jsxTag && c === "{") {
        const close = scanCode(i + 1, true);
        i = close + 1;
      } else if (jsxTag && c === ">") {
        const before = text.slice(0, i).trimEnd();
        const selfClosing = before.endsWith("/");
        if (closingJsxTag) jsxDepth--;
        else if (!selfClosing) jsxDepth++;
        jsxTag = false;
        jsxText = jsxDepth > 0;
        i++;
      } else if (c === "/" && d === "/") {
        const nl = text.indexOf("\n", i);
        const end = nl < 0 ? n : nl;
        blank(code, i, end);
        blank(skeleton, i, end);
        i = end;
      } else if (c === "/" && d === "*") {
        const close = text.indexOf("*/", i + 2);
        const end = close < 0 ? n : close + 2;
        blank(code, i, end);
        blank(skeleton, i, end);
        i = end;
      } else if (c === '"' || c === "'") {
        i = scanString(i, c);
        last = c;
      } else if (c === "`") {
        i = scanTemplate(i);
        last = c;
      } else if (c === "/" && (REGEX_AFTER.has(last) || REGEX_AFTER_WORD.test(text.slice(Math.max(0, i - 12), i)))) {
        const end = scanRegex(i);
        last = end === i + 1 ? "/" : "x";
        i = end;
      } else {
        if (stopAtBrace) {
          if (c === "{") depth++;
          else if (c === "}") {
            if (depth === 0) return i;
            depth--;
          }
        }
        if (!/\s/.test(c)) last = c;
        i++;
      }
    }
    return n;
  }

  scanCode(0, false);
  return { code: code.join(""), skeleton: skeleton.join(""), strings };
}

/** 1-based line number of an offset. */
export const lineAt = (text, offset) => text.slice(0, offset).split("\n").length;
