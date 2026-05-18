import { describe, expect, it } from 'vitest'
import { SheetSchema, initialSheet } from './schema'

describe('SheetSchema', () => {
  it('accepts persisted time formats', () => {
    const parsed = SheetSchema.safeParse({
      ...initialSheet,
      formats: { A1: 'time' },
    })

    expect(parsed.success).toBe(true)
  })
})
