import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const UI_DIR = path.resolve(__dirname, '..')
const MARKER = '// shadcn-patch(exactOptionalPropertyTypes):'
const PATCH_PATTERN = ' as NonNullable<'

describe('shadcn-patch markers', () => {
  it('marks every exactOptionalPropertyTypes patch line so CLI-regen exceptions stay greppable', () => {
    const files = readdirSync(UI_DIR).filter((f) => f.endsWith('.tsx'))
    const unmarkedPatches: string[] = []

    for (const file of files) {
      const lines = readFileSync(path.join(UI_DIR, file), 'utf-8').split('\n')
      lines.forEach((line, i) => {
        if (!line.includes(PATCH_PATTERN)) return

        // Walk upward through the contiguous run of `//` comment lines directly above
        // the patch line — the marker may sit anywhere in a multi-line explanation.
        let j = i - 1
        let marked = false
        while (j >= 0 && lines[j].trim().startsWith('//')) {
          if (lines[j].includes(MARKER)) {
            marked = true
            break
          }
          j -= 1
        }

        if (!marked) unmarkedPatches.push(`${file}:${i + 1}`)
      })
    }

    expect(unmarkedPatches).toEqual([])
  })

  it('keeps the known exactOptionalPropertyTypes exceptions marked (dropdown-menu.tsx, sonner.tsx)', () => {
    const dropdownMenu = readFileSync(path.join(UI_DIR, 'dropdown-menu.tsx'), 'utf-8')
    const sonner = readFileSync(path.join(UI_DIR, 'sonner.tsx'), 'utf-8')
    expect(dropdownMenu).toContain(MARKER)
    expect(sonner).toContain(MARKER)
  })
})
