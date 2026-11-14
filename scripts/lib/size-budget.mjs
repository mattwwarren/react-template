/**
 * @param {{path: string, lines: number}[]} files
 * @param {Record<string, number>} ratchet  files over budget when the gate landed → their line count then
 * @param {number} [limit]
 * @returns {string[]}
 */
export function sizeViolations(files, ratchet, limit = 400) {
  const out = [];
  const seen = new Set();
  for (const { path, lines } of files) {
    seen.add(path);
    const recorded = ratchet[path];
    if (recorded === undefined) {
      if (lines > limit)
        out.push(`${path}: ${lines} lines > ${limit}. Split it by responsibility (see ARCHITECTURE.md).`);
    } else if (lines <= limit) {
      out.push(`${path}: now ${lines} lines, within budget — remove its entry from scripts/size-budget.json.`);
    } else if (lines > recorded) {
      out.push(`${path}: grew from ${recorded} to ${lines} lines. Over-budget files may only shrink; split instead.`);
    } else if (lines < recorded) {
      out.push(`${path}: shrank to ${lines} lines — lower its entry in scripts/size-budget.json to ${lines}.`);
    }
  }
  for (const path of Object.keys(ratchet)) {
    if (!seen.has(path)) out.push(`${path}: no longer exists — remove its entry from scripts/size-budget.json.`);
  }
  return out;
}
