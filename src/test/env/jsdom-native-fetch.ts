/**
 * jsdom environment that keeps Node's own fetch primitives.
 *
 * jsdom installs its own File/Blob/FormData/Request/Response/Headers/fetch
 * globals. Node's fetch (undici) brand-checks multipart bodies against its
 * internal classes, so a jsdom File inside a jsdom FormData never parses in
 * MSW handlers (the useUploadDocument tests hang in waitFor). Capturing the
 * native globals before jsdom populates the sandbox and restoring them after
 * is the only mechanism that satisfies the brand check; substituting classes
 * from `node:buffer` or the `undici` npm package does not (verified on Vitest
 * 4 / Node 24, see react-template#23).
 *
 * Applied project-wide via vitest.config.ts `test.environment`; per-file
 * pragmas cannot reference a path in Vitest 4. A change to a shared test
 * environment is validated by the full suite, never a single file.
 */
import type { Environment } from 'vitest/environments'
import { builtinEnvironments } from 'vitest/environments'

const NATIVE = ['fetch', 'Request', 'Response', 'Headers', 'FormData', 'File', 'Blob'] as const

export default (<Environment>{
  name: 'jsdom-native-fetch',
  transformMode: 'web',
  async setup(global, options) {
    const native = Object.fromEntries(
      NATIVE.map((k) => [k, (globalThis as Record<string, unknown>)[k]])
    )
    const env = await builtinEnvironments.jsdom.setup(global, options)
    for (const k of NATIVE) (global as Record<string, unknown>)[k] = native[k]
    return env
  },
})
