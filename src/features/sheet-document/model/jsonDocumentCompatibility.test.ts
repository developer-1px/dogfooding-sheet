import { describe, expect, it } from 'vitest'
import { createJSONDocument, type Pointer } from '@interactive-os/json-document'
import * as z from 'zod'

const CompatibilitySchema = z.object({
  cells: z.record(z.string(), z.string()),
})

describe('json-document 1.1 compatibility', () => {
  it('consumes the unified edit result from spreadsheet-style mutations', () => {
    const doc = createJSONDocument(CompatibilitySchema, { cells: { A1: 'before' } })

    const result = doc.replace('/cells/A1' as Pointer, 'after')

    expect(result).toMatchObject({
      ok: true,
      value: { cells: { A1: 'after' } },
      applied: [{ op: 'replace', path: '/cells/A1', value: 'after' }],
      target: '/cells/A1',
    })
  })

  it('treats published document values as transitively immutable snapshots', () => {
    const initial = { cells: { A1: 'before' } }
    const doc = createJSONDocument(CompatibilitySchema, initial)

    initial.cells.A1 = 'mutated outside the document'

    expect(doc.value.cells.A1).toBe('before')
    expect(Object.isFrozen(doc.value)).toBe(true)
    expect(Object.isFrozen(doc.value.cells)).toBe(true)
  })
})
