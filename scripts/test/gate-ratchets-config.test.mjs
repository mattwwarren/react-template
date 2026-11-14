// The tier 2 gate that compares harness.config.json with the merge base (its tier 1 siblings are
// gate-config-ratchet.test.mjs). Named so the installer treats it as tier 2 with check-ratchets.mjs.
import { defineConfigRatchetCases } from "./config-ratchet-cases.mjs";

const AXE = "tests/e2e/axe-allowlist.json";

defineConfigRatchetCases({
  name: "ratchets",
  script: "check-ratchets.mjs",
  config: { tier: "t2", axe: { allowlist: AXE } },
  files: { [AXE]: "[]", "other-allowlist.json": "[]" },
});
