import { describe, expect, it } from 'vitest'
import { SheetSchema, blankBundle, cloneBundle, initialSheet } from './schema'

describe('SheetSchema', () => {
  it('accepts persisted time formats', () => {
    const parsed = SheetSchema.safeParse({
      ...initialSheet,
      formats: { A1: 'time' },
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects invalid persisted tab state', () => {
    expect(SheetSchema.safeParse({
      ...initialSheet,
      tabs: { ...initialSheet.tabs, order: [], active: 'Sheet1' },
    }).success).toBe(false)

    expect(SheetSchema.safeParse({
      ...initialSheet,
      tabs: { ...initialSheet.tabs, order: ['Sheet1'], active: 'Missing' },
    }).success).toBe(false)

    expect(SheetSchema.safeParse({
      ...initialSheet,
      tabs: { ...initialSheet.tabs, order: ['Sheet1', 'Sheet1'], active: 'Sheet1' },
    }).success).toBe(false)

    expect(SheetSchema.safeParse({
      ...initialSheet,
      tabs: { ...initialSheet.tabs, order: ['   '], active: '   ' },
    }).success).toBe(false)
  })

  it('creates isolated blank bundles', () => {
    const a = blankBundle()
    const b = blankBundle()

    a.cells.A1 = 'x'
    a.styles.A1 = { b: true }
    a.condFormat.push({ col: 'A', op: '>', value: '1', color: '#fff' })
    a.hidden.rows.push(0)
    a.merges.push([0, 0, 1, 1])

    expect(b.cells).toEqual({})
    expect(b.styles).toEqual({})
    expect(b.condFormat).toEqual([])
    expect(b.hidden.rows).toEqual([])
    expect(b.merges).toEqual([])
  })

  it('clones bundles without sharing nested state', () => {
    const source = {
      ...blankBundle(),
      cells: { A1: 'x' },
      styles: { A1: { b: true } },
      validation: { B1: { type: 'list' as const, options: ['yes', 'no'] } },
      condFormat: [{ col: 'A', op: '>' as const, value: '1', color: '#fff' }],
      hidden: { rows: [1], cols: ['B'] },
      merges: [[0, 0, 1, 1] as [number, number, number, number]],
    }

    const cloned = cloneBundle(source)

    expect(cloned).toEqual(source)
    expect(cloned.cells).not.toBe(source.cells)
    expect(cloned.styles.A1).not.toBe(source.styles.A1)
    expect(cloned.validation.B1).not.toBe(source.validation.B1)
    expect(cloned.condFormat[0]).not.toBe(source.condFormat[0])
    expect(cloned.hidden.rows).not.toBe(source.hidden.rows)
    expect(cloned.merges[0]).not.toBe(source.merges[0])
  })
})
