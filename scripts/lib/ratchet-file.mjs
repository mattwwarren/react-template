import { readFileSync } from "node:fs";
import { cannotRun } from "./git-files.mjs";

/**
 * Reads a ratchet file (a JSON object of name -> positive integer) from the working tree.
 * Fails closed (exit 2) when it cannot be read or parsed, or is not a plain object whose values
 * are all positive integers: a malformed ratchet must never be read as "no debt recorded".
 * @param {string} path repo-relative path of the ratchet file
 * @returns {Record<string, number>}
 */
export function readRatchetFile(path) {
  /** @type {any} */
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    return cannotRun(`cannot read ${path}: ${err.message}`);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed))
    return cannotRun(`${path}: must be a JSON object of name -> positive integer, got ${parsed === null ? "null" : Array.isArray(parsed) ? "an array" : typeof parsed}`);
  for (const [key, value] of Object.entries(parsed))
    if (!Number.isInteger(value) || value <= 0)
      return cannotRun(`${path}: entry ${JSON.stringify(key)} must be a positive integer, got ${JSON.stringify(value)}`);
  return parsed;
}
