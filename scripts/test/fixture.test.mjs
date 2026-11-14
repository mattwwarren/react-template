import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const FIXTURE = join(import.meta.dirname, "fixture.mjs");
const PROGRAM = `
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeRepo, tempDir } from ${JSON.stringify(FIXTURE)};
const plain = tempDir("harness-leakcheck-");
writeFileSync(join(plain, "f.txt"), "x");
const repo = makeRepo({}, { "src/a.ts": "export const a = 1;\\n" });
console.log(JSON.stringify([plain, repo, existsSync(plain), existsSync(repo)]));
`;

test("temp dirs made through the fixture exist while the test process runs and are gone when it exits", () => {
  const r = spawnSync("node", ["--input-type=module", "-e", PROGRAM], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const [plain, repo, plainThen, repoThen] = JSON.parse(r.stdout);
  assert.equal(plainThen, true);
  assert.equal(repoThen, true);
  assert.equal(existsSync(plain), false, `${plain} leaked`);
  assert.equal(existsSync(repo), false, `${repo} leaked`);
});
