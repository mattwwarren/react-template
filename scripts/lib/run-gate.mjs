/**
 * The end of every gate step: list the problems under `heading` on stderr and exit 1, or print the
 * `ok` line. (A step that cannot run at all exits 2 through cannotRun in git-files.mjs, never here.)
 * @param {{ heading: string, problems: string[], ok: string }} result
 */
export function runGate({ heading, problems, ok }) {
  if (problems.length > 0) {
    console.error(`${heading}:`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(ok);
}
