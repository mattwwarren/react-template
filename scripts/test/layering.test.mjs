import assert from "node:assert/strict";
import { test } from "node:test";
import { parseConfig } from "../lib/config.mjs";
import { describeOrder, layerMatrix, layeringViolations } from "../lib/layering.mjs";

function config(over = {}) {
  const { config: c, errors } = parseConfig({
    imports: { aliases: { "@/": "src/" }, ...over.imports },
    layering: {
      layers: [
        { name: "lib", dirs: ["src/lib/"] },
        { name: "api", dirs: ["src/api/"] },
        { name: "features", dirs: ["src/features/"] },
      ],
      entry: ["src/main.tsx"],
      ...over.layering,
    },
  });
  assert.deepEqual(errors, []);
  return c;
}
const check = (path, text, over) => layeringViolations([{ path, text }], config(over));

test("a lower layer importing a higher one fails", () => {
  const v = check("src/lib/a.ts", 'import { x } from "@/api/client";');
  assert.equal(v.length, 1);
  assert.match(v[0], /src\/lib\/a\.ts:1: imports src\/api\/client — lib may not import api/);
  assert.match(v[0], /lib < api < features/);
});
test("same layer and lower layers pass", () => {
  assert.deepEqual(check("src/api/a.ts", 'import { b } from "./b"; import { l } from "../lib/l";'), []);
  assert.deepEqual(check("src/features/a.tsx", 'import { x } from "@/api/x"; import { y } from "@/lib/y";'), []);
});
test("type-only imports are still layer violations", () => {
  assert.equal(check("src/lib/a.ts", 'import type { T } from "@/features/x";').length, 1);
});
test("nothing may import an entry point", () => {
  assert.match(check("src/features/a.tsx", 'import "../main";')[0], /entry point/);
});
test("an unlayered importer is unrestricted", () => {
  assert.deepEqual(check("src/App.tsx", 'import { x } from "@/features/x"; import "./main.css";'), []);
});
test("a layered file importing an internal target in no layer fails by default", () => {
  assert.match(check("src/lib/a.ts", 'import { u } from "../test/utils";')[0], /is in no layer/);
  assert.deepEqual(check("src/lib/a.ts", 'import { u } from "../test/utils";', { layering: { unlayered: "allow" } }), []);
});
test("bare packages are external by default; denied when configured", () => {
  assert.deepEqual(check("src/lib/a.ts", 'import React from "react";'), []);
  assert.match(check("src/lib/a.ts", 'import React from "react";', { imports: { external: "deny" } })[0], /cannot be resolved/);
});
test("ignoreImporters skips matching importers", () => {
  const over = { layering: { ignoreImporters: ["__tests__/"] } };
  assert.deepEqual(check("src/lib/__tests__/a.test.ts", 'import { f } from "@/features/x";', over), []);
});
test("a computed dynamic import cannot be checked and fails", () => {
  assert.match(check("src/lib/a.ts", "const m = await import(path);")[0], /computed specifier/);
});
test("commented-out imports are ignored", () => {
  assert.deepEqual(check("src/lib/a.ts", '// import { s } from "@/features/x";\n/* import "@/api/y" */'), []);
});
test("multi-line imports report the line of the closing from", () => {
  assert.match(check("src/lib/a.ts", 'import {\n  a,\n  b,\n} from "@/api/x";')[0], /a\.ts:4:/);
});
test("a JSX apostrophe does not blind the scanner", () => {
  assert.equal(check("src/lib/a.tsx", "export const A = () => <p>Don't</p>;\nimport { x } from \"@/features/x\";").length, 1);
});

test("import x = require() and require() are layer-checked", () => {
  assert.match(check("src/lib/a.ts", 'import x = require("../api/x");')[0], /lib may not import api/);
  assert.match(check("src/lib/a.ts", 'const x = require("../api/x");')[0], /lib may not import api/);
  assert.match(check("src/lib/a.ts", "const x = require(name);")[0], /computed specifier/);
});

test("a same-line type-only import does not excuse the next import", () => {
  const v = check("src/lib/a.ts", 'import type A from "../lib/a"; import { b } from "../api/y";');
  assert.equal(v.length, 1);
  assert.match(v[0], /imports src\/api\/y/);
});

test("describeOrder lists layers lowest first", () => {
  assert.equal(describeOrder(config().layering.layers), "lib < api < features");
});

test("layerMatrix skips ignoreImporters like the gate does", () => {
  const files = [
    { path: "src/lib/__tests__/a.test.ts", text: 'import { x } from "@/features/x";' },
    { path: "src/api/b.ts", text: 'import { y } from "../lib/y";' },
  ];
  const cfg = config({ layering: { ignoreImporters: ["__tests__/"] } });
  assert.deepEqual(layerMatrix(files, cfg), ["api -> lib: 1"]);
});

test("layerMatrix counts importer->target layer pairs and marks violations", () => {
  const files = [
    { path: "src/lib/a.ts", text: 'import { x } from "@/api/x";' },
    { path: "src/api/b.ts", text: 'import { y } from "../lib/y";' },
    { path: "src/features/c.tsx", text: 'import { z } from "../util/z";' },
  ];
  assert.deepEqual(layerMatrix(files, config()), [
    "api -> lib: 1",
    "features -> (none): 1  <-- violates the order",
    "lib -> api: 1  <-- violates the order",
  ]);
});

test("a directory import (barrel) resolves into the layer that owns the directory", () => {
  // `@/api` names the directory src/api (its index file), not a path under "src/api/".
  assert.deepEqual(check("src/features/a.tsx", 'import { u } from "@/api";'), []);
  assert.match(check("src/lib/a.ts", 'import { u } from "@/api";')[0], /lib may not import api/);
  assert.match(check("src/lib/a.ts", 'import { u } from "../features";')[0], /lib may not import features/);
});
test("layerMatrix attributes a directory import to the layer that owns the directory", () => {
  const files = [{ path: "src/features/a.tsx", text: 'import { u } from "@/api";' }];
  assert.deepEqual(layerMatrix(files, config()), ["features -> api: 1"]);
});
