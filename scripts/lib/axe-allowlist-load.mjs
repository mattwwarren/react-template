// Loads the axe allowlist for the e2e helper. harness.config.json (`axe.allowlist`, default
// tests/e2e/axe-allowlist.json) is the single source of truth for where it lives, the same as for the
// ratchet gate. This runs inside a test process, so every failure is a thrown Error naming the file,
// never a process exit.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { allowlistProblems } from "./axe-allowlist-shape.mjs";
import { CONFIG_FILE, loadConfig } from "./config.mjs";

/**
 * @param {string} root the repo root (the directory holding harness.config.json)
 * @returns {{label: string, id: string, target: string}[]}
 */
export function loadAllowlist(root) {
  const configPath = join(root, CONFIG_FILE);
  const { config, errors } = loadConfig(configPath);
  if (errors.length > 0) throw new Error(`${configPath} is invalid:\n  ${errors.join("\n  ")}`);
  const path = join(root, config.axe.allowlist);
  let list;
  try {
    list = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    throw new Error(`cannot read ${path}: ${err.message}`);
  }
  const problems = allowlistProblems(list);
  if (problems.length > 0) throw new Error(`${path} is malformed: ${problems[0]}`);
  return list;
}
