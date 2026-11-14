import assert from "node:assert/strict";
import { test } from "node:test";
import { inTokenScope, tokenViolations } from "../lib/design-tokens.mjs";

const tokens = (over = {}) => ({
  tokenFiles: ["src/index.css"],
  scopePrefixes: ["src/"],
  exemptPrefixes: ["src/components/ui/"],
  scanTailwindClasses: true,
  forbidPaletteClasses: false,
  ...over,
});
const check = (path, text, over) => tokenViolations([{ path, text }], tokens(over));

test("raw values are fine in the token file, flagged elsewhere in css", () => {
  assert.deepEqual(check("src/index.css", ":root { --c: #fff; }"), []);
  assert.match(check("src/a.css", ".a { color: #fff; }")[0], /src\/a\.css:1: raw hex colour/);
});
test("exempt prefixes are skipped", () => {
  assert.deepEqual(check("src/components/ui/button.tsx", 'const c = "bg-[#fff]";'), []);
});
test("tailwind arbitrary values: colours, font sizes, z-index", () => {
  const colourUtilities = [
    "bg",
    "text",
    "border",
    "ring",
    "ring-offset",
    "fill",
    "stroke",
    "from",
    "via",
    "to",
    "outline",
    "divide",
    "decoration",
    "accent",
    "caret",
    "shadow",
    "placeholder",
  ];
  const colourViolations = check(
    "src/a.tsx",
    `<div className="${colourUtilities.map((utility) => `${utility}-[red]`).join(" ")}" />`,
  );
  assert.equal(colourViolations.length, colourUtilities.length);
  for (const utility of colourUtilities)
    assert.ok(colourViolations.some((v) => v.includes(`raw colour in the class "${utility}-[red]"`)));
  assert.match(check("src/a.tsx", '<div className="text-[#fff]" />')[0], /raw colour/);
  assert.match(check("src/a.tsx", '<div className="hover:bg-[rgb(1,2,3)]" />')[0], /raw colour/);
  assert.match(check("src/a.tsx", '<div className="text-[13px]" />')[0], /raw font size/);
  assert.match(check("src/a.tsx", '<div className="z-[999]" />')[0], /raw z-index/);
});
test("tailwind arbitrary values that reference tokens or are not design values pass", () => {
  assert.deepEqual(
    check("src/a.tsx", '<div className="bg-[var(--brand)] bg-[transparent] text-[currentColor] data-[state=open]:bg-primary w-[37px]" />'),
    [],
  );
});
test("class scanning can be switched off", () => {
  assert.deepEqual(check("src/a.tsx", '<div className="text-[#fff]" />', { scanTailwindClasses: false }), []);
});
test("default-palette classes are flagged only when forbidden", () => {
  assert.deepEqual(check("src/a.tsx", '<div className="bg-red-500 text-white" />'), []);
  const v = check("src/a.tsx", '<div className="bg-red-500 text-white bg-primary" />', { forbidPaletteClasses: true });
  assert.equal(v.length, 2);
  assert.match(v[0], /default-palette class "bg-red-500"/);
});
test("classes in comments are ignored", () => {
  assert.deepEqual(check("src/a.tsx", '// className="text-[#fff]"\nexport const a = 1;'), []);
});
test("JSX style prop: geometry and custom properties pass, anything else is flagged", () => {
  assert.deepEqual(check("src/a.tsx", "<div style={{ left: x, width: 10, transform: t }} />"), []);
  assert.deepEqual(check("src/a.tsx", '<div style={{ "--w": w, height }} />'), []);
  assert.match(check("src/a.tsx", '<div style={{ color: "red" }} />')[0], /inline style property "color"/);
  assert.match(check("src/a.tsx", '<div style = {{ color: "red" }} />')[0], /inline style property "color"/);
});
test("JSX style prop: indirect objects and spreads cannot be checked", () => {
  assert.match(check("src/a.tsx", "<div style={styles} />")[0], /not an object literal/);
  assert.match(check("src/a.tsx", "<div style={{ ...base, left: 1 }} />")[0], /spread inside a style object/);
});
test("DOM style writes are flagged in ts files", () => {
  assert.match(check("src/a.ts", 'el.style.color = "x";')[0], /inline style write to style\.color/);
});
test("inTokenScope follows the config", () => {
  const t = tokens();
  assert.equal(inTokenScope("src/a.tsx", t), true);
  assert.equal(inTokenScope("src/index.css", t), false);
  assert.equal(inTokenScope("src/components/ui/x.tsx", t), false);
  assert.equal(inTokenScope("scripts/x.mjs", t), false);
  assert.equal(inTokenScope("src/a.json", t), false);
});
