// The Playwright helper needs a browser and @axe-core/playwright, so it cannot be imported here.
// These static checks guard against silent drift of the wiring it depends on; the allowlist-loading
// logic it calls is unit-tested in axe-allowlist-load.test.mjs.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

// In an installed repo the installer put the helper at the stack's axeHelper path and recorded that path in
// harness.lock; the lock decides (a repo may have an unrelated e2e/axe.mjs). Only the harness's own source tree,
// which has no lock, keeps the helper at gates/e2e/axe.mjs. Whatever does not resolve fails loudly below.
const ROOT = join(import.meta.dirname, "..", "..");
const LOCK = join(ROOT, "harness.lock");
function helperPath() {
  if (!existsSync(LOCK)) return join(ROOT, "e2e", "axe.mjs");
  const { axeHelper } = JSON.parse(readFileSync(LOCK, "utf8"));
  if (typeof axeHelper !== "string" || axeHelper === "") throw new Error("harness.lock has no axeHelper path");
  return join(ROOT, axeHelper);
}
const HELPER = helperPath();
const text = readFileSync(HELPER, "utf8");
const code = text
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("//") && !line.trimStart().startsWith("*"))
  .join("\n");

test("the helper imports axeFailures from the shared verdict lib", () => {
  assert.match(text, /import\s*\{\s*axeFailures\s*\}\s*from\s*"\.\.\/\.\.\/\.\.\/scripts\/lib\/axe-verdict\.mjs"/);
});
test("the helper imports AxeBuilder from @axe-core/playwright", () => {
  assert.match(text, /import\s+AxeBuilder\s+from\s*"@axe-core\/playwright"/);
});
test("the helper exports assertAccessible", () => {
  assert.match(text, /export\s+async\s+function\s+assertAccessible\s*\(/);
});
test("the helper loads the allowlist through loadAllowlist, rooted three levels up", () => {
  assert.match(
    text,
    /import\s*\{\s*loadAllowlist\s*\}\s*from\s*"\.\.\/\.\.\/\.\.\/scripts\/lib\/axe-allowlist-load\.mjs"/,
  );
  assert.match(code, /loadAllowlist\(ROOT\)/);
  assert.match(code, /ROOT\s*=\s*join\(HERE,\s*"\.\.",\s*"\.\.",\s*"\.\."\)/);
});
test("the helper does not hard-code the allowlist file name (harness.config.json decides)", () => {
  assert.doesNotMatch(code, /axe-allowlist\.json/);
  assert.doesNotMatch(code, /readFileSync/);
  assert.match(text, /harness\.config\.json/);
});
