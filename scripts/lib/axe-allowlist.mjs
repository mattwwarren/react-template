// The recorded accessibility violations (test/e2e/axe-allowlist.json), as a shrink-only ratchet.

/** @typedef {{label: string, id: string, target: string}} AllowEntry */

/** @param {AllowEntry} entry */
export const allowKey = (entry) => `${entry.label}|${entry.id}|${entry.target}`;

/**
 * The allowlist in the `key -> count` shape `ratchetRegressions` compares.
 * @param {AllowEntry[]} entries
 * @returns {Record<string, number>}
 */
export function allowRatchet(entries) {
  return Object.fromEntries(entries.map((entry) => [allowKey(entry), 1]));
}
