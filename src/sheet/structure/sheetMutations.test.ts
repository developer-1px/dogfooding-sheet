import { describe, expect, it } from 'vitest'
import { SheetSchema, initialSheet, type SheetOps } from '../schema'
import { sheetMutations } from './sheetMutations'

const recordingOps = () => {
  const calls: unknown[] = []
  return {
    calls,
    ops: {
      replace: (path: never, value: never) => { calls.push(['replace', path, value]) },
      patch: (patch: never) => { calls.push(['patch', patch]) },
    } as unknown as SheetOps,
  }
}

const sheet = (overrides: Partial<typeof initialSheet> = {}) =>
  SheetSchema.parse({ ...initialSheet, rowCount: 4, colCount: 4, cells: {}, ...overrides })

describe('sheetMutations', () => {
  it('moves row-scoped cell metadata with inserted rows', () => {
    const { ops, calls } = recordingOps()
    const state = sheet({
      cells: { A1: 'head', A2: 'value', B4: 'drop' },
      notes: { A2: 'note', B4: 'drop' },
      styles: { A2: { b: true }, B4: { i: true } },
      formats: { A2: 'currency', B4: 'percent' },
      validation: { A2: { type: 'checkbox' }, B4: { type: 'list', options: ['x'] } },
      hidden: { rows: [1, 3], cols: ['B'] },
      rowHeights: { '1': 42, '3': 50 },
      merges: [[0, 0, 0, 1]],
    })

    sheetMutations(state, ops).insertRow(1)

    expect(calls).toEqual([['patch', [
      { op: 'replace', path: '/cells', value: { A1: 'head', A3: 'value' } },
      { op: 'replace', path: '/notes', value: { A3: 'note' } },
      { op: 'replace', path: '/styles', value: { A3: { b: true } } },
      { op: 'replace', path: '/formats', value: { A3: 'currency' } },
      { op: 'replace', path: '/validation', value: { A3: { type: 'checkbox' } } },
      { op: 'replace', path: '/hidden', value: { rows: [2], cols: ['B'] } },
      { op: 'replace', path: '/rowHeights', value: { '2': 42 } },
      { op: 'replace', path: '/merges', value: [] },
    ]]])
  })

  it('moves column-scoped metadata with deleted columns', () => {
    const { ops, calls } = recordingOps()
    const state = sheet({
      cells: { A1: 'keep', B1: 'drop', C1: 'move', D2: 'also move' },
      notes: { B1: 'drop', C1: 'note' },
      styles: { C1: { b: true } },
      formats: { C1: 'percent' },
      validation: { C1: { type: 'checkbox' } },
      condFormat: [
        { col: 'B', op: '>', value: '1', color: '#fff' },
        { col: 'D', op: '<', value: '9', color: '#000' },
      ],
      hidden: { rows: [1], cols: ['B', 'D'] },
      colWidths: { B: 80, C: 120, D: 140 },
      merges: [[0, 0, 0, 1]],
    })

    sheetMutations(state, ops).deleteCol('B')

    expect(calls).toEqual([['patch', [
      { op: 'replace', path: '/cells', value: { A1: 'keep', B1: 'move', C2: 'also move' } },
      { op: 'replace', path: '/notes', value: { B1: 'note' } },
      { op: 'replace', path: '/styles', value: { B1: { b: true } } },
      { op: 'replace', path: '/formats', value: { B1: 'percent' } },
      { op: 'replace', path: '/validation', value: { B1: { type: 'checkbox' } } },
      { op: 'replace', path: '/condFormat', value: [{ col: 'C', op: '<', value: '9', color: '#000' }] },
      { op: 'replace', path: '/hidden', value: { rows: [1], cols: ['C'] } },
      { op: 'replace', path: '/colWidths', value: { B: 120, C: 140 } },
      { op: 'replace', path: '/merges', value: [] },
    ]]])
  })

  it('ignores structure requests outside current sheet bounds', () => {
    const { ops, calls } = recordingOps()
    const state = sheet()
    const mutations = sheetMutations(state, ops)

    mutations.insertRow(4)
    mutations.deleteRow(-1)
    mutations.insertCol('Z')
    mutations.deleteCol('bad')

    expect(calls).toEqual([])
  })

  it('only appends positive row and column counts', () => {
    const { ops, calls } = recordingOps()
    const state = sheet({ rowCount: 4, colCount: 4 })
    const mutations = sheetMutations(state, ops)

    mutations.appendRows(0)
    mutations.appendRows(-1)
    mutations.appendRows(2)
    mutations.appendCols(0)
    mutations.appendCols(-1)
    mutations.appendCols(2)

    expect(calls).toEqual([
      ['replace', '/rowCount', 6],
      ['replace', '/colCount', 6],
    ])
  })

  it('sorts cell metadata with the data rows', () => {
    const { ops, calls } = recordingOps()
    const state = sheet({
      cells: {
        A1: 'name', B1: 'rank',
        A2: 'slow', B2: '3', C2: 'tail',
        A3: 'fast', B3: '1',
        A4: 'mid', B4: '2',
      },
      notes: { A2: 'slow note', A3: 'fast note' },
      styles: { B2: { b: true }, B3: { i: true } },
      formats: { C2: 'currency' },
      validation: { A4: { type: 'checkbox' } },
      hidden: { rows: [1, 3], cols: ['C'] },
      rowHeights: { '1': 31, '2': 32, '3': 33 },
      merges: [[0, 0, 0, 1]],
    })

    sheetMutations(state, ops).sortByCol('B', 'asc')

    expect(calls).toEqual([['patch', [
      { op: 'replace', path: '/cells', value: {
        A1: 'name', B1: 'rank',
        A2: 'fast', B2: '1',
        A3: 'mid', B3: '2',
        A4: 'slow', B4: '3', C4: 'tail',
      } },
      { op: 'replace', path: '/notes', value: { A4: 'slow note', A2: 'fast note' } },
      { op: 'replace', path: '/styles', value: { B4: { b: true }, B2: { i: true } } },
      { op: 'replace', path: '/formats', value: { C4: 'currency' } },
      { op: 'replace', path: '/validation', value: { A3: { type: 'checkbox' } } },
      { op: 'replace', path: '/hidden', value: { rows: [2, 3], cols: ['C'] } },
      { op: 'replace', path: '/rowHeights', value: { '1': 32, '2': 33, '3': 31 } },
      { op: 'replace', path: '/merges', value: [] },
    ]]])
  })
})
