// Accessibility gate for the e2e suite: runs axe (via @axe-core/playwright) in the page and fails on
// serious/critical WCAG 2.x A/AA violations that are not recorded in the axe allowlist.
//
// The allowlist records problems that already existed when the scan was added, so the suite can be
// green while each one stays visible. It is a shrink-only ratchet (scripts/check-ratchets.mjs): fix the
// problem and delete the entry; entries cannot be added. An entry that no longer occurs fails the scan
// so the list cannot rot.
//
// Installed at <stack axeHelper path>, e.g. tests/e2e/support/axe.mjs, three levels below the repo root.
// The allowlist location comes from harness.config.json `axe.allowlist` (default
// tests/e2e/axe-allowlist.json), the same setting the ratchet gate reads, resolved from the repo root.
// The verdict logic is scripts/lib/axe-verdict.mjs, also three levels up.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { loadAllowlist } from "../../../scripts/lib/axe-allowlist-load.mjs";
import { axeFailures } from "../../../scripts/lib/axe-verdict.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Fails when the page has serious or critical accessibility violations that are not allowlisted,
 * or when an allowlist entry for this label no longer occurs.
 * @param {import("@playwright/test").Page} page
 * @param {string} label  names the screen being scanned (e.g. "main", "settings-dialog"); allowlist entries
 *   are per label. A `within`-scoped scan must use its own distinct label: entries recorded for the same
 *   label outside the scope would be reported as stale.
 * @param {{ within?: string }} [scope]  a CSS selector to scan only that part of the page (a surface under change)
 */
export async function assertAccessible(page, label, { within = "" } = {}) {
  let builder = new AxeBuilder({ page }).withTags(TAGS);
  if (within) builder = builder.include(within);
  const { violations } = await builder.analyze();
  const failures = axeFailures(violations, loadAllowlist(ROOT), label);
  if (failures.length > 0) throw new Error(`accessibility check "${label}" failed:\n${failures.join("\n")}`);
}
