#!/usr/bin/env bash
# The merge gate. Runs every check in order, fails fast, names the step that failed.
# CI runs this same script, so local and CI cannot drift. Written by the maintainer's global
# agentic-ui-harness skill: edit the project steps freely, never loosen a harness step.
set -euo pipefail
cd "$(dirname "$0")/.."


for tool in node npm git; do
  command -v "$tool" >/dev/null 2>&1 || {
    printf 'missing required tool: %s\n' "$tool" >&2
    exit 1
  }
done


run() {
  local name="$1"
  shift
  printf '\n==> %s\n' "$name"
  if ! "$@"; then
    printf '\nGATE FAILED at: %s\n' "$name" >&2
    exit 1
  fi
}

# Install from the lockfiles first so a local run cannot pass against stale dependencies.
run 'install: node deps (lockfile)' npm ci

# --- harness gates (cheap, so they fail first) ---
run 'no suppression comments' scripts/check-no-suppressions.sh
run 'size budget (shrink-only ratchet)' node scripts/check-size-budget.mjs
run layering node scripts/check-layering.mjs
run 'import cycles (shrink-only ratchet)' node scripts/check-import-cycles.mjs
run 'harness gate tests' node scripts/run-harness-tests.mjs

# --- project steps ---
run 'biome: lint + format (warnings are errors)' npx biome check --error-on-warnings .
# src/api/generated/ is gitignored and normally comes from the backend spec (npm run generate:types).
# A clean clone or CI has no backend spec, so generate from the checked-in stub, but only when absent:
# a developer's real generated types are never overwritten.
run 'generate API types from the stub when absent' bash -c 'if [ ! -f src/api/generated/types.ts ]; then mkdir -p src/api/generated && npx openapi-typescript tests/fixtures/openapi-stub.json -o src/api/generated/types.ts; fi'
run 'build: tsc -b is the real type gate' npm run build
run 'unit tests' npx vitest run
run 'e2e: playwright' npm run test:e2e

printf '\nGATE PASSED\n'
