#!/usr/bin/env bash
# Fails if any source file carries a lint/type suppression comment. A suppressed
# checker is a disabled instrument: fix the code, or get explicit approval and
# change this list on purpose. Scans tracked AND untracked-but-not-ignored files.
#
# Fails closed: a scan that cannot run (grep error, unreadable file) is a failure,
# never a pass. File names are NUL-delimited, so spaces and odd characters are safe.
set -euo pipefail
cd "$(dirname "$0")/.."

pattern='@ts-ignore|@ts-expect-error|@ts-nocheck|biome-ignore|eslint-disable|prettier-ignore'
pattern+='|# *noqa|# *ruff: *noqa|# *fmt: *(off|skip)|# *isort: *skip'
pattern+='|# *type: *ignore|# *pyright: *ignore|# *mypy: *ignore-errors|# *pylint: *disable'

# Code only (docs may name these markers). Everything under scripts/ is scanned, because in an installed repo
# it holds the host project's own code; the only exclusions are the harness's own files that must contain the
# marker strings (this checker and its test, listed in lib/suppression-excludes.mjs) and the config's list.
# The listing goes through a temp file, not a process substitution: `set -e` cannot
# see a failure inside `< <(...)`, and a failed listing must never read as "clean".
list_file=$(mktemp)
excl_file=$(mktemp)
trap 'rm -f "$list_file" "$excl_file"' EXIT

# harness.config.json `suppressions.excludePrefixes`: vendored or generated third-party files only. A missing
# or invalid config or harness.lock exits 2 here (the helper says why); it must never fall back to scanning
# without the list.
if ! node scripts/lib/suppression-excludes.mjs >"$excl_file"; then
  echo "cannot read the suppression exclusions from harness.config.json and harness.lock; refusing to call the tree clean" >&2
  exit 2
fi
excludes=()
while IFS= read -r -d '' spec; do
  excludes+=("$spec")
done <"$excl_file"

if ! git ls-files -z --cached --others --exclude-standard -- \
  '*.mjs' '*.cjs' '*.js' '*.jsx' '*.ts' '*.tsx' '*.py' '*.html' '*.css' \
  ${excludes[@]+"${excludes[@]}"} >"$list_file"; then
  echo "cannot list files with git (not a work tree, bad GIT_DIR, dubious ownership?); refusing to call the tree clean" >&2
  exit 2
fi

files=()
while IFS= read -r -d '' f; do
  files+=("$f")
done <"$list_file"

# A repo this gate guards always has source files; finding none means the scan
# did not see the tree, which is a failure, not a pass.
if [ "${#files[@]}" -eq 0 ]; then
  echo "no source files found to scan; refusing to call the tree clean" >&2
  exit 2
fi

# grep exits 0 on a match, 1 on no match, >=2 on error. Only 1 is "clean".
set +e
hits=$(grep -nHE -- "$pattern" "${files[@]}")
rc=$?
set -e

if [ "$rc" -eq 0 ]; then
  echo "Suppression comments are not allowed:" >&2
  echo "$hits" >&2
  exit 1
elif [ "$rc" -ge 2 ]; then
  echo "suppression scan failed (grep exit $rc); refusing to call the tree clean" >&2
  exit "$rc"
fi
echo "no suppression comments"
