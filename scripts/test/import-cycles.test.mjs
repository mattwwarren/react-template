import assert from "node:assert/strict";
import { test } from "node:test";
import { parseConfig } from "../lib/config.mjs";
import { cycleProblems, cycleRatchet, cycles, featureGraph } from "../lib/import-cycles.mjs";

const config = parseConfig({
  imports: { aliases: { "@/": "src/" } },
  cycles: { scopePrefixes: ["src/features/"] },
}).config;
const files = (o) => Object.entries(o).map(([path, text]) => ({ path, text }));
const found = (o) => cycles(featureGraph(files(o), config));

test("a two-module cycle through an alias and an extension-less specifier is found", () => {
  const got = found({
    "src/features/a.ts": 'import { b } from "@/features/b";',
    "src/features/b.ts": 'import { a } from "./a";',
  });
  assert.deepEqual(got, [["src/features/a.ts", "src/features/b.ts"]]);
});
test("directory index and .js-for-.ts specifiers resolve", () => {
  const got = found({
    "src/features/a.ts": 'import "./sub"; import "./c.js";',
    "src/features/sub/index.ts": 'import "../a";',
    "src/features/c.ts": "export const c = 1;",
  });
  assert.equal(got.length, 1);
});
test("type-only imports do not form cycles", () => {
  assert.deepEqual(
    found({
      "src/features/a.ts": 'import type { B } from "./b";',
      "src/features/b.ts": 'import { a } from "./a";',
    }),
    [],
  );
  assert.deepEqual(
    found({
      "src/features/a.ts": 'import type {\n  B,\n} from "./b";',
      "src/features/b.ts": 'import { a } from "./a";',
    }),
    [],
  );
});
test("files outside the scope are not in the graph", () => {
  assert.deepEqual(
    found({
      "src/lib/x.ts": 'import "../features/a";',
      "src/features/a.ts": 'import "../lib/x";',
    }),
    [],
  );
});
test("a module importing itself is a cycle", () => {
  assert.equal(found({ "src/features/a.ts": 'import "./a";' }).length, 1);
});
test("cycleRatchet and cycleProblems keep the reference behaviour", () => {
  const ratchet = cycleRatchet([["a", "b"], ["c", "d", "e"]]);
  assert.deepEqual(ratchet, { "cycle-1": 2, "cycle-2": 3 });
  assert.match(cycleProblems({ "cycle-1": 3 }, { "cycle-1": 2 })[0], /grew from 2 to 3/);
  assert.match(cycleProblems({}, { "cycle-1": 2 })[0], /no such cycle any more/);
});
