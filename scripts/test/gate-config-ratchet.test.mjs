// Tier 1 gates that compare harness.config.json with the merge base (the tier 2 one is gate-ratchets-config.test.mjs).
import { defineConfigRatchetCases } from "./config-ratchet-cases.mjs";

defineConfigRatchetCases({
  name: "size",
  script: "check-size-budget.mjs",
  config: {},
  files: { "scripts/size-budget.json": "{}", "src/a.ts": "x\n", "lib/b.ts": "x\n", "other-allowlist.json": "[]" },
});

defineConfigRatchetCases({
  name: "cycles",
  script: "check-import-cycles.mjs",
  config: { imports: { sourceGlobs: ["src/*.ts"] }, cycles: { scopePrefixes: ["src/"] } },
  files: {
    "scripts/import-cycles.json": "{}",
    "src/a.ts": "export const a = 1;\n",
    "src/b.ts": 'import "./a";\n',
    "other-allowlist.json": "[]",
  },
});
