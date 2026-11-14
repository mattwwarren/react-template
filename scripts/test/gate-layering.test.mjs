import assert from "node:assert/strict";
import { test } from "node:test";
import { makeRepo, runScript } from "./fixture.mjs";

const CONFIG = {
  imports: { sourceGlobs: ["src/*.ts", "src/*.tsx"], aliases: { "@/": "src/" } },
  layering: {
    layers: [
      { name: "lib", dirs: ["src/lib/"] },
      { name: "features", dirs: ["src/features/"] },
    ],
    entry: ["src/main.tsx"],
  },
};

test("a clean tree passes", () => {
  const dir = makeRepo(CONFIG, { "src/features/a.ts": 'import { l } from "@/lib/l";', "src/lib/l.ts": "export const l = 1;" });
  const r = runScript(dir, "check-layering.mjs");
  assert.equal(r.status, 0);
  assert.match(r.out, /layering: 2 files OK/);
});

test("a violation fails and names file, line and rule", () => {
  const dir = makeRepo(CONFIG, { "src/lib/l.ts": 'import { f } from "@/features/a";', "src/features/a.ts": "export const f = 1;" });
  const r = runScript(dir, "check-layering.mjs");
  assert.equal(r.status, 1);
  assert.match(r.err, /src\/lib\/l\.ts:1: imports src\/features\/a — lib may not import features/);
});

test("no layers configured cannot run (exit 2)", () => {
  const dir = makeRepo({ imports: CONFIG.imports }, { "src/a.ts": "export const a = 1;" });
  const r = runScript(dir, "check-layering.mjs");
  assert.equal(r.status, 2);
  assert.match(r.err, /"layering.layers" is empty/);
});

test("--matrix prints the layer pairs and exits 0 even with violations", () => {
  const dir = makeRepo(CONFIG, { "src/lib/l.ts": 'import { f } from "@/features/a";', "src/features/a.ts": "export const f = 1;" });
  const r = runScript(dir, "check-layering.mjs", "--matrix");
  assert.equal(r.status, 0);
  assert.match(r.out, /lib -> features: 1  <-- violates the order/);
});
