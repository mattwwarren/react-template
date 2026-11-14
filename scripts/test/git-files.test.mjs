import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { baseRefProblem, readJsonAtMergeBase } from "../lib/git-files.mjs";
import { tempDir } from "./fixture.mjs";

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" });

function repo() {
  const dir = tempDir("harness-git-");
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.email", "t@example.com");
  git(dir, "config", "user.name", "t");
  writeFileSync(join(dir, "r.json"), '{"a":1}');
  git(dir, "add", ".");
  git(dir, "commit", "-q", "-m", "base");
  git(dir, "update-ref", "refs/remotes/upstream/main", "HEAD");
  writeFileSync(join(dir, "r.json"), '{"a":2}');
  git(dir, "commit", "-qam", "change");
  return dir;
}

test("readJsonAtMergeBase reads the file as it was at the given base ref", () => {
  process.chdir(repo());
  assert.deepEqual(readJsonAtMergeBase("r.json", "upstream/main"), { a: 1 });
});

test("readJsonAtMergeBase returns null for a file absent at the base (bootstrap)", () => {
  process.chdir(repo());
  assert.equal(readJsonAtMergeBase("new.json", "upstream/main"), null);
});

test("readJsonAtMergeBase reads the remote-tracking ref, not a local branch or tag with the same short name", () => {
  const dir = repo();
  git(dir, "branch", "upstream/main");
  git(dir, "tag", "upstream/main");
  process.chdir(dir);
  assert.deepEqual(readJsonAtMergeBase("r.json", "upstream/main"), { a: 1 });
  assert.deepEqual(readJsonAtMergeBase("r.json", "refs/remotes/upstream/main"), { a: 1 });
});

test("baseRefProblem accepts remote-tracking refs and names the key when it refuses anything else", () => {
  assert.equal(baseRefProblem("origin/main"), null);
  assert.equal(baseRefProblem("refs/remotes/origin/release/1.0"), null);
  for (const bad of ["HEAD", "main", "HEAD~2", "origin/main..", "refs/heads/main", "origin/x.lock", "origin/a b", undefined, 5])
    assert.match(baseRefProblem(bad), /^"baseRef" .*remote-tracking/, String(bad));
});
