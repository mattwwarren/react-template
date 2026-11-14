// Which files in a repo belong to the harness. In an installed repo scripts/ also holds the host project's own
// code, so "everything under scripts/" is never the harness; harness.lock, written by the installer, is the list.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const LOCK_FILE = "harness.lock";

/**
 * The repo-relative paths the installer manages (the keys of harness.lock "files") in the repo at `root`, or null
 * when there is no lock: the harness's own source tree, whose callers fall back to an explicit allowlist.
 * Throws when the lock exists but is unusable, so a broken lock is never read as "no harness files".
 * @param {string} root
 * @returns {string[] | null}
 */
export function lockedPaths(root) {
  const file = join(root, LOCK_FILE);
  if (!existsSync(file)) return null;
  let lock;
  try {
    lock = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    throw new Error(`${file} is not valid JSON: ${err.message}`);
  }
  const files = lock?.files;
  if (files === null || typeof files !== "object" || Array.isArray(files)) throw new Error(`${file} has no "files" object`);
  return Object.keys(files);
}
