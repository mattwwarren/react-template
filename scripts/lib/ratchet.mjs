/**
 * A ratchet file may only lose entries or lower counts relative to the merge base.
 * @param {Record<string, number> | null} baseEntries  the file at the merge base; null when absent there (bootstrap)
 * @param {Record<string, number>} headEntries
 * @returns {string[]}
 */
export function ratchetRegressions(baseEntries, headEntries) {
  if (baseEntries === null) return [];
  const out = [];
  for (const [key, count] of Object.entries(headEntries)) {
    const base = baseEntries[key];
    if (base === undefined) {
      out.push(
        `${key}: new ratchet entry (not present at the merge base). Fix the underlying problem instead of recording it; ratchet files may only shrink.`,
      );
    } else if (count > base) {
      out.push(
        `${key}: ratchet raised from ${base} to ${count}. Fix the underlying problem instead; ratchet counts may only go down.`,
      );
    }
  }
  return out;
}
