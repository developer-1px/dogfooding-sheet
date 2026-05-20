import { describe, expect, it } from 'vitest'
import { MAX_SHEET_NAME_LENGTH, MAX_SHEET_TABS, SheetSchema, blankBundle, cloneBundle, initialSheet } from './schema'
import { MAX_CELL_TEXT_LENGTH } from './cellValue'

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

    expect(SheetSchema.safeParse({
      ...initialSheet,
      tabs: { ...initialSheet.tabs, order: ['Sheet1', 'Sheet2'], active: 'Sheet1', saved: {} },
    }).success).toBe(false)

    expect(SheetSchema.safeParse({
      ...initialSheet,
      tabs: { ...initialSheet.tabs, order: ['Sheet1'], active: 'Sheet1', saved: { Ghost: blankBundle() } },
    }).success).toBe(false)

    expect(SheetSchema.safeParse({
      ...initialSheet,
      tabs: { ...initialSheet.tabs, order: ['Sheet1'], active: 'Sheet1', colors: { Ghost: '#ff0000' } },
    }).success).toBe(false)

    expect(SheetSchema.safeParse({
      ...initialSheet,
      tabs: { ...initialSheet.tabs, order: ['Sheet1'], active: 'Sheet1', colors: { Sheet1: 'red' } },
    }).success).toBe(false)

    const tooManyTabs = Array.from({ length: MAX_SHEET_TABS + 1 }, (_v, i) => `S${i + 1}`)
    expect(SheetSchema.safeParse({
      ...initialSheet,
      tabs: {
        order: tooManyTabs,
        active: tooManyTabs[0],
        saved: Object.fromEntries(tooManyTabs.slice(1).map((name) => [name, blankBundle()])),
        colors: {},
      },
    }).success).toBe(false)

    const tooLongName = 'x'.repeat(MAX_SHEET_NAME_LENGTH + 1)
    expect(SheetSchema.safeParse({
      ...initialSheet,
      tabs: { ...initialSheet.tabs, order: [tooLongName], active: tooLongName },
    }).success).toBe(false)
  })

  it('accepts active sheet as live bundle and inactive sheets as saved bundles', () => {
    expect(SheetSchema.safeParse({
      ...initialSheet,
      cells: { A1: 'live active' },
      tabs: {
        order: ['Sheet1', 'Sheet2'],
        active: 'Sheet1',
        saved: { Sheet2: { ...blankBundle(), cells: { A1: 'stored inactive' } } },
        colors: { Sheet2: '#ff0000' },
      },
    }).success).toBe(true)
  })

  it('sanitizes empty and oversized persisted cell values without rejecting the sheet', () => {
    const parsed = SheetSchema.parse({
      ...initialSheet,
      cells: { A1: 'ok', B1: '', C1: 'x'.repeat(MAX_CELL_TEXT_LENGTH + 1) },
    })

    expect(parsed.cells).toEqual({ A1: 'ok' })
  })

  it('sanitizes persisted bundle state to sheet bounds', () => {
    const parsed = SheetSchema.parse({
      ...initialSheet,
      rowCount: 2,
      colCount: 2,
      cells: { A1: 'ok', C1: 'outside col', A3: 'outside row' },
      notes: { A1: ' note ', B1: '', C1: 'outside col' },
      styles: { A1: { b: true }, B1: { bg: 'red', fg: '#fff' }, C1: { i: true } },
      formats: { B1: 'currency', C1: 'percent' },
      validation: {
        A1: { type: 'list', options: ['open', 'open', '', 'x'.repeat(MAX_CELL_TEXT_LENGTH + 1)] },
        B1: { type: 'checkbox' },
        C1: { type: 'checkbox' },
      },
      condFormat: [
        { col: 'A', op: '>' as const, value: '1', color: '#fff' },
        { col: 'A', op: '<' as const, value: '2', color: '#000' },
        { col: 'C', op: '=' as const, value: 'x', color: '#fff' },
        { col: 'B', op: 'contains' as const, value: 'bad color', color: 'red' },
      ],
      hidden: { rows: [1, 1, 2, 0.5], cols: ['A', 'A', 'C'] },
      colWidths: { A: 20, C: 120 },
      rowHeights: { '0': 10, '2': 30, bad: 40 },
      merges: [[0, 0, 0, 1], [0, 2, 0, 1], [1, 1, 1, 1]],
    })

    expect(parsed.cells).toEqual({ A1: 'ok' })
    expect(parsed.notes).toEqual({ A1: 'note' })
    expect(parsed.styles).toEqual({ A1: { b: true }, B1: { fg: '#fff' } })
    expect(parsed.formats).toEqual({ B1: 'currency' })
    expect(parsed.validation).toEqual({ A1: { type: 'list', options: ['open'] }, B1: { type: 'checkbox' } })
    expect(parsed.condFormat).toEqual([{ col: 'A', op: '<', value: '2', color: '#000' }])
    expect(parsed.hidden).toEqual({ rows: [1], cols: ['A'] })
    expect(parsed.colWidths).toEqual({ A: 40 })
    expect(parsed.rowHeights).toEqual({ '0': 18 })
    expect(parsed.merges).toEqual([[0, 0, 0, 1]])
  })

  it('sanitizes inactive saved tab bundles', () => {
    const parsed = SheetSchema.parse({
      ...initialSheet,
      tabs: {
        order: ['Sheet1', 'Sheet2'],
        active: 'Sheet1',
        saved: {
          Sheet2: { ...blankBundle(), rowCount: 1, colCount: 1, cells: { A1: 'stored', B1: 'outside' }, hidden: { rows: [1], cols: ['B'] } },
        },
        colors: {},
      },
    })

    expect(parsed.tabs.saved.Sheet2.cells).toEqual({ A1: 'stored' })
    expect(parsed.tabs.saved.Sheet2.hidden).toEqual({ rows: [], cols: [] })
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
