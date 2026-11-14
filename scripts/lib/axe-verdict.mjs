// The pure part of the accessibility gate: given axe's violations and the recorded allowlist, what fails.
import { allowKey } from "./axe-allowlist.mjs";

const BLOCKING = new Set(["serious", "critical"]);
const TARGETS_SHOWN = 3;

/** A node's selector as one stable string (axe nests arrays for iframes and shadow roots). */
const targetOf = (target) => target.flat(Infinity).join(" >> ");

/**
 * Failure messages for serious/critical violations that are not allowlisted, plus stale allowlist entries
 * for this label (an entry that no longer occurs must be deleted, so the list cannot rot).
 * @param {{id: string, impact: string | null, help: string, nodes: {target: unknown[]}[]}[]} violations
 * @param {{label: string, id: string, target: string}[]} allowlist
 * @param {string} label  names the screen being scanned
 * @returns {string[]}
 */
export function axeFailures(violations, allowlist, label) {
  const mine = allowlist.filter((entry) => entry.label === label);
  const allowed = new Set(mine.map(allowKey));
  const seen = new Set();
  const failures = [];
  for (const violation of violations.filter((v) => BLOCKING.has(v.impact ?? ""))) {
    const unlisted = [];
    for (const node of violation.nodes) {
      const key = allowKey({ label, id: violation.id, target: targetOf(node.target) });
      seen.add(key);
      if (!allowed.has(key)) unlisted.push(targetOf(node.target));
    }
    if (unlisted.length > 0) {
      const shown = unlisted.slice(0, TARGETS_SHOWN).join("\n      ");
      const more = unlisted.length > TARGETS_SHOWN ? `\n      (+${unlisted.length - TARGETS_SHOWN} more)` : "";
      failures.push(`  ${violation.id} (${violation.impact}): ${violation.help}\n      ${shown}${more}`);
    }
  }
  for (const entry of mine) {
    if (!seen.has(allowKey(entry)))
      failures.push(`  stale allowlist entry, remove it from the axe allowlist: ${allowKey(entry)}`);
  }
  return failures;
}
