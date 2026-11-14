import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** Exit code for "the check itself could not run" (never a pass). */
export const EXIT_CANNOT_RUN = 2;

/** Print a message and stop with the fail-closed exit code. */
export function cannotRun(message) {
  console.error(message);
  process.exit(EXIT_CANNOT_RUN);
}

/**
 * Tracked and untracked-but-not-ignored files matching the pathspecs, read from disk.
 * Fails closed (exit 2) when git cannot list the tree. Files deleted from disk but still
 * in the index are skipped: there is nothing there to check.
 * @param {string[]} pathspecs
 * @param {(path: string) => boolean} [keep]
 * @returns {{path: string, text: string}[]}
 */
export function readTree(pathspecs, keep = () => true) {
  let listing = "";
  try {
    listing = execFileSync(
      "git",
      ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", ...pathspecs],
      {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      },
    );
  } catch (err) {
    cannotRun(`cannot list files with git (${err.message.split("\n")[0]}); refusing to call the tree clean`);
  }
  const paths = [...new Set(listing.split("\0").filter(Boolean))].filter(keep).sort();
  const files = [];
  for (const path of paths) {
    try {
      files.push({ path, text: readFileSync(path, "utf8") });
    } catch (err) {
      if (err.code !== "ENOENT") cannotRun(`cannot read ${path}: ${err.message}`);
    }
  }
  return files;
}

const git = (/** @type {string[]} */ ...args) =>
  execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

// <remote>/<branch> or refs/remotes/<remote>/<branch>: every segment starts with a letter, digit or underscore, so
// there is no empty segment, no leading "-" or ".", and no ":", "~", "^", "@{" or whitespace anywhere.
const REMOTE_REF = /^(?:refs\/remotes\/)?([A-Za-z0-9_][A-Za-z0-9._-]*)\/([A-Za-z0-9_][A-Za-z0-9._-]*(?:\/[A-Za-z0-9_][A-Za-z0-9._-]*)*)$/;

/**
 * Why `ref` cannot be the ref the merge base is taken against, or null when it can. Only a remote-tracking ref
 * qualifies: with HEAD, HEAD~n or a local branch the merge base is the change itself and every ratchet file
 * would be compared with itself.
 * @param {unknown} ref
 * @returns {string | null}
 */
export function baseRefProblem(ref) {
  const hint = `must be a remote-tracking ref such as "origin/main" or "refs/remotes/origin/main" (HEAD, HEAD~n and local branches would compare the ratchet files with themselves)`;
  if (typeof ref !== "string" || ref === "") return `"baseRef" ${hint}`;
  const m = REMOTE_REF.exec(ref);
  const segments = ref.split("/");
  if (!m || m[1] === "refs" || ref.includes("..") || segments.some((s) => s.endsWith(".") || s.endsWith(".lock")))
    return `"baseRef" "${ref}" ${hint}`;
  return null;
}

/** The full refs/remotes/... name, so a local branch or tag of the same short name can never shadow it. */
export const remoteTrackingRef = (/** @type {string} */ baseRef) =>
  baseRef.startsWith("refs/remotes/") ? baseRef : `refs/remotes/${baseRef}`;

/**
 * A JSON file as it was at the merge base with the remote-tracking `baseRef`; null when it did not exist
 * there yet (bootstrap). Fails closed (exit 2) when the ref is not a remote-tracking ref that resolves, or
 * when the merge base or the file cannot be read.
 * @param {string} path repo-relative path of the file
 * @param {string} [baseRef] the remote-tracking ref the merge base is taken against (default origin/main)
 * @returns {any}
 */
export function readJsonAtMergeBase(path, baseRef = "origin/main") {
  const problem = baseRefProblem(baseRef);
  if (problem) cannotRun(problem);
  const full = remoteTrackingRef(baseRef);
  let base = "";
  try {
    git("rev-parse", "--verify", "--quiet", full);
    base = git("merge-base", "HEAD", full).trim();
  } catch {
    cannotRun(
      `cannot find the merge base to check ${path} against: ${full} is not a remote-tracking ref in this checkout; fetch ${baseRef} (CI needs fetch-depth: 0)`,
    );
  }
  try {
    if (!git("ls-tree", base, "--", path).trim()) return null;
    return JSON.parse(git("show", `${base}:${path}`));
  } catch (err) {
    return cannotRun(`cannot read ${path} at merge base ${base}: ${err.message.split("\n")[0]}`);
  }
}
