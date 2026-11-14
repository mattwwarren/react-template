import { readTree } from "./git-files.mjs";

/** Lines in a file's text; a final newline does not start another line. */
export const lineCount = (text) => text.split("\n").length - (text.endsWith("\n") ? 1 : 0);

/** Tracked and untracked-but-not-ignored files matching size.globs, with their line counts. */
export function sizedFiles(size) {
  const keep = (path) => !size.excludePrefixes.some((prefix) => path.startsWith(prefix));
  return readTree(size.globs, keep).map(({ path, text }) => ({ path, lines: lineCount(text) }));
}

/** The ratchet's shape: every file strictly over the limit, with its current count. */
export function overBudget(files, limit) {
  return Object.fromEntries(
    files
      .filter((f) => f.lines > limit)
      .map((f) => [f.path, f.lines])
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}
