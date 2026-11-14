import assert from "node:assert/strict";
import { test } from "node:test";
import { classifySpecifier, importsOf, resolveToFile } from "../lib/imports.mjs";

const rules = { aliases: { "@/": "src/" }, external: "allow" };

test("relative specifiers resolve against the importer", () => {
  assert.deepEqual(classifySpecifier("src/a/b.ts", "../c/d", rules), { kind: "internal", target: "src/c/d" });
  assert.deepEqual(classifySpecifier("src/a/b.ts", "./e", rules), { kind: "internal", target: "src/a/e" });
});
test("aliases map to their directory", () => {
  assert.deepEqual(classifySpecifier("src/a.ts", "@/lib/x", rules), { kind: "internal", target: "src/lib/x" });
});
test("bare specifiers are external when allowed, unresolvable when denied", () => {
  assert.deepEqual(classifySpecifier("src/a.ts", "react", rules), { kind: "external" });
  assert.deepEqual(classifySpecifier("src/a.ts", "react", { ...rules, external: "deny" }), { kind: "bare" });
});
test("absolute specifiers and specifiers climbing out of the repo are flagged", () => {
  assert.deepEqual(classifySpecifier("src/a.ts", "/x.js", rules), { kind: "absolute" });
  assert.deepEqual(classifySpecifier("a.ts", "../x", rules), { kind: "escape" });
});

test("resolveToFile finds extension-less, index and .js-for-.ts specifiers", () => {
  const known = new Set(["src/x.ts", "src/sub/index.tsx", "src/y.ts"]);
  const exts = [".ts", ".tsx", ".js"];
  assert.equal(resolveToFile("src/x", known, exts), "src/x.ts");
  assert.equal(resolveToFile("src/sub", known, exts), "src/sub/index.tsx");
  assert.equal(resolveToFile("src/y.js", known, exts), "src/y.ts");
  assert.equal(resolveToFile("src/missing", known, exts), null);
});

test("importsOf marks type-only static imports, including multi-line ones", () => {
  const text = [
    'import type { A } from "./a";',
    'export type { B } from "./b";',
    'import { C } from "./c";',
    "import type {",
    "  D,",
    '} from "./d";',
    'const e = await import("./e");',
  ].join("\n");
  const got = importsOf(text).map((i) => [i.specifier, i.typeOnly]);
  assert.deepEqual(got, [
    ["./a", true],
    ["./b", true],
    ["./c", false],
    ["./d", true],
    ["./e", false],
  ]);
});

test("a JSX apostrophe does not hide the next line's import", () => {
  const text = "export const A = () => <p>Don't</p>;\nimport { x } from \"@/features/x\";";
  assert.deepEqual(importsOf(text).map((i) => i.specifier), ["@/features/x"]);
});

test("commented-out and string-embedded imports are ignored", () => {
  assert.deepEqual(importsOf('// import { s } from "../core/state.js";\nconst s = "import x from \\"a\\"";'), []);
});

test("require() and import x = require() are imports; a computed require is null", () => {
  const text = [
    'import x = require("../api/x");',
    'const y = require("../api/y");',
    "const z = require(name);",
    "const t = require(`../api/t`);",
  ].join("\n");
  const got = importsOf(text).map((i) => [i.specifier, i.typeOnly]);
  assert.deepEqual(got, [
    ["../api/x", false],
    ["../api/y", false],
    [null, false],
    [null, false],
  ]);
});

test("method calls named import/require are not imports", () => {
  assert.deepEqual(importsOf('obj.import("../api/x"); a?.require("../api/y"); my$require("z"); xrequire("w");'), []);
});

test("the longest matching alias prefix wins", () => {
  const overlapping = { aliases: { "@/": "src/", "@/lib/": "src/lib2/" }, external: "allow" };
  assert.deepEqual(classifySpecifier("src/a.ts", "@/lib/x", overlapping), { kind: "internal", target: "src/lib2/x" });
  assert.deepEqual(classifySpecifier("src/a.ts", "@/other/x", overlapping), { kind: "internal", target: "src/other/x" });
  const reversed = { aliases: { "@/lib/": "src/lib2/", "@/": "src/" }, external: "allow" };
  assert.deepEqual(classifySpecifier("src/a.ts", "@/lib/x", reversed), { kind: "internal", target: "src/lib2/x" });
});

test("typeOnly follows the statement the from belongs to, even on one line", () => {
  const sameLine = 'import type A from "../api/x"; import { b } from "../api/y";';
  assert.deepEqual(importsOf(sameLine).map((i) => [i.specifier, i.typeOnly]), [
    ["../api/x", true],
    ["../api/y", false],
  ]);
  const afterTypeAlias = 'export type T = string; const x = 1; export { a } from "./a";';
  assert.deepEqual(importsOf(afterTypeAlias).map((i) => [i.specifier, i.typeOnly]), [["./a", false]]);
});

test("inline type modifiers and type-prefixed names are not type-only imports", () => {
  assert.equal(importsOf('import { type A } from "x";')[0].typeOnly, false);
  assert.equal(importsOf('import typeFoo from "x";')[0].typeOnly, false);
  assert.equal(importsOf('import type from "x";')[0].typeOnly, false);
});

test("typeOnly survives a very long import list", () => {
  const names = Array.from({ length: 2000 }, (_, i) => `  name${i},`).join("\n");
  assert.equal(importsOf(`import type {\n${names}\n} from "./big";`)[0].typeOnly, true);
});
