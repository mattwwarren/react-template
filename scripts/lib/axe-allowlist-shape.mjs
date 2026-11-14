// Shape check for the axe allowlist file. The gate reads it twice (head and merge base) and a
// malformed element (null, a string, a missing field) would otherwise surface as a TypeError
// mid-ratchet instead of a clear "cannot run".
const FIELDS = ["label", "id", "target"];

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/**
 * What is wrong with a parsed allowlist; empty when it is usable.
 * @param {unknown} list
 * @returns {string[]}
 */
export function allowlistProblems(list) {
  if (!Array.isArray(list)) return ["must be a JSON array"];
  const problems = [];
  for (const [i, entry] of list.entries()) {
    if (!isPlainObject(entry)) {
      problems.push(`element ${i} must be a plain object with "label", "id" and "target"`);
      continue;
    }
    for (const field of FIELDS) {
      if (typeof entry[field] !== "string" || entry[field] === "")
        problems.push(`element ${i} needs a non-empty string "${field}"`);
      // allowKey joins label, id and target on "|"; only the last may contain it (CSS selectors do).
      else if (field !== "target" && entry[field].includes("|"))
        problems.push(`element ${i} "${field}" must not contain "|" (it separates the allowlist key)`);
    }
  }
  return problems;
}
