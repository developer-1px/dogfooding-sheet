import { describe, expect, it } from 'vitest'
import { applyFillWrites, cancelGridEdit, cellId, cellKey, clearGridSelection, commitGridEdit, createGridEditState, createGridSelectionState, cycleTrailingFormulaRef, deleteRow, extendSeries, fillDownWrites, fillRightWrites, homeEndTarget, idsBetween, idsForFormulaPick, insertRow, jumpToEdge, moveCellIdByDelta, offsetFormulaRefs, pageTarget, rectFromIds, rectToTsv, refForFormulaPick, replaceTrailingFormulaRef, resolveCellRef, resolveGotoTarget, resolveRange, selectionAddress, setGridSelectedIds, setGridSelectionFocus, sortByColumn, startGridEdit, tabTarget, targetGridIds, writesFromTsv } from './index'

describe('@spredsheet/grid', () => {
  it('keeps A1 keys and DOM ids as pure coordinate transforms', () => {
    expect(cellKey('B', 2)).toBe('B3')
    expect(cellId('C', 4)).toBe('r4-C')
    expect(rectFromIds(['r1-B', 'r3-D'])).toEqual({ rMin: 1, rMax: 3, cMin: 1, cMax: 3 })
  })

  it('moves cell ids within grid bounds', () => {
    const bounds = { rowCount: 3, colLetters: ['A', 'B', 'C'] }
    expect(moveCellIdByDelta('r1-B', 1, 1, bounds)).toBe('r2-C')
    expect(moveCellIdByDelta('r0-A', -1, -1, bounds)).toBe('r0-A')
    expect(moveCellIdByDelta('x', 1, 0, bounds)).toBeNull()
  })

  it('runs edit state transitions without React or DOM', () => {
    let state = createGridEditState('r0-A')
    const started = startGridEdit(state, 'r0-A', 'old', { caret: 'end' })
    state = started.state

    expect(started.caret).toBe('end')
    expect(state).toEqual({ focusId: 'r0-A', editing: 'r0-A', draft: 'old' })

    const committed = commitGridEdit({ ...state, draft: 'new' }, () => 'r1-A')
    expect(committed.write).toEqual({ id: 'r0-A', value: 'new' })
    expect(committed.state).toEqual({ focusId: 'r1-A', editing: null, draft: '' })

    expect(cancelGridEdit(startGridEdit(committed.state, 'r1-A', 'draft').state)).toEqual({
      focusId: 'r1-A',
      editing: null,
      draft: '',
    })
  })

  it('runs selection state transitions without React or DOM', () => {
    let state = createGridSelectionState('r0-A')
    state = setGridSelectedIds(state, ['r0-A', 'r0-B'])
    state = setGridSelectionFocus(state, 'r1-C', { anchor: 'r1-C', clearSelection: true })

    expect(state).toEqual({ focusId: 'r1-C', anchorId: 'r1-C', selectedIds: [] })
    expect(targetGridIds(state)).toEqual(['r1-C'])

    state = setGridSelectedIds(state, (ids) => [...ids, 'r1-C'])
    expect(clearGridSelection(state)).toEqual({ focusId: 'r1-C', anchorId: 'r1-C', selectedIds: [] })
  })

  it('computes fill writes without applying them', () => {
    expect(fillDownWrites(
      ['r0-A', 'r1-A', 'r2-A', 'r0-B', 'r1-B', 'r2-B'],
      { A1: 'x', B1: 'y' },
    )).toEqual([
      ['A2', 'x'],
      ['A3', 'x'],
      ['B2', 'y'],
      ['B3', 'y'],
    ])
    expect(fillRightWrites(
      ['r0-A', 'r0-B', 'r0-C', 'r1-A', 'r1-B', 'r1-C'],
      { A1: 'x', A2: 'y' },
    )).toEqual([
      ['B1', 'x'],
      ['C1', 'x'],
      ['B2', 'y'],
      ['C2', 'y'],
    ])
  })

  it('extends fill series and computes auto-fill writes', () => {
    expect(extendSeries(['Mon', 'Tue'], 5)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
    expect(extendSeries(['2026-01-01', '2026-01-02'], 4)).toEqual(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04'])
    expect(applyFillWrites(
      { rMin: 0, rMax: 1, cMin: 0, cMax: 0 },
      { rMin: 0, rMax: 4, cMin: 0, cMax: 0 },
      { A1: '1', A2: '2' },
    )).toEqual([
      ['A3', '3'],
      ['A4', '4'],
      ['A5', '5'],
    ])
  })

  it('builds formula pick references and cycles absolute refs', () => {
    expect(refForFormulaPick('r0-A', 'r0-A')).toBe('A1')
    expect(refForFormulaPick('r0-A', 'r1-B')).toBe('A1:B2')
    expect(idsForFormulaPick('r0-A', 'r1-B')).toEqual(['r0-A', 'r0-B', 'r1-A', 'r1-B'])
    expect(replaceTrailingFormulaRef('=SUM(', 'A1:B2')).toBe('=SUM(A1:B2')
    expect(replaceTrailingFormulaRef('=SUM(A1', 'B2')).toBe('=SUM(B2')
    expect(replaceTrailingFormulaRef('=SUM(A1)', 'B2')).toBe('=SUM(A1)B2')
    expect(cycleTrailingFormulaRef('=A1')).toBe('=$A$1')
    expect(cycleTrailingFormulaRef('=SUM(A1:B2')).toBe('=SUM($A$1:$B$2')
  })

  it('resolves goto addresses and formats selections', () => {
    const bounds = { rowCount: 3, colCount: 3 }
    expect(resolveCellRef(' B2 ', bounds)).toBe('r1-B')
    expect(resolveCellRef('D1', bounds)).toBeNull()
    expect(resolveRange('A1:B2', bounds)).toEqual(['r0-A', 'r0-B', 'r1-A', 'r1-B'])
    expect(resolveRange('B:B', bounds)).toEqual(['r0-B', 'r1-B', 'r2-B'])
    expect(resolveRange('2:2', bounds)).toEqual(['r1-A', 'r1-B', 'r1-C'])
    expect(resolveGotoTarget('A1:B2', bounds)).toEqual({
      type: 'range',
      focusId: 'r0-A',
      selectedIds: ['r0-A', 'r0-B', 'r1-A', 'r1-B'],
    })
    expect(selectionAddress(['r0-A', 'r0-B', 'r1-A', 'r1-B'], null, 3, ['A', 'B', 'C'])).toBe('A1:B2')
  })

  it('computes keyboard navigation targets', () => {
    expect(jumpToEdge('r0-A', { A1: 'a', A2: 'b', A3: 'c', A5: 'd' }, 10, 'ArrowDown')).toBe('r2-A')
    expect(tabTarget('r0-A', false)).toBe('r0-B')
    expect(tabTarget('r0-A', true)).toBeNull()
    expect(homeEndTarget('r3-E', 20, 'Home', true)).toBe('r0-A')
    expect(pageTarget('r3-E', 20, 'PageDown')).toBe('r13-E')
    expect(idsBetween('r0-A', 'r1-B')).toEqual(['r0-A', 'r0-B', 'r1-A', 'r1-B'])
  })

  it('shifts row data and row references', () => {
    expect(insertRow({ A1: '1', A2: '=A1', A3: '=A2' }, 1, 4)).toEqual({
      A1: '1',
      A3: '=A1',
      A4: '=A3',
    })
    expect(deleteRow({ A1: '1', A2: '=A1', A3: '=A2' }, 1)).toEqual({
      A1: '1',
      A2: '=#REF!',
    })
  })

  it('offsets copied formula references relatively', () => {
    expect(offsetFormulaRefs('=A1+B2', 2, 1)).toBe('=B3+C4')
    expect(offsetFormulaRefs('=$A$1+A$1+$A1+A1', 2, 1)).toBe('=$A$1+B$1+$A3+B3')
    expect(offsetFormulaRefs('=A1', -1, 0)).toBe('=#REF!')
    expect(offsetFormulaRefs('plain', 2, 1)).toBe('plain')
  })

  it('converts TSV without touching the system clipboard', () => {
    const cells = { A1: 'name', B1: 'score', A2: 'Kim', B2: '10' }
    expect(rectToTsv({ rMin: 0, rMax: 1, cMin: 0, cMax: 1 }, (k) => cells[k] ?? '')).toBe('name\tscore\nKim\t10')
    expect(writesFromTsv('A\tB\nC\tD', { col: 'B', row: 1 }, { maxRow: 3, maxCol: 3 })).toEqual([
      ['B2', 'A'],
      ['C2', 'B'],
      ['B3', 'C'],
      ['C3', 'D'],
    ])
  })

  it('sorts grid rows by a column while preserving outside rows', () => {
    expect(sortByColumn({ A1: 'name', A2: 'B', B2: '2', A3: 'A', B3: '1' }, { col: 'B', dir: 'asc', rowCount: 3 })).toEqual({
      A1: 'name',
      A2: 'A',
      B2: '1',
      A3: 'B',
      B3: '2',
    })
  })

  it('sorts common formatted numeric values numerically', () => {
    expect(sortByColumn({
      A1: 'item', B1: 'amount',
      A2: 'fee', B2: '$9.50',
      A3: 'total', B3: '1,234',
      A4: 'discount', B4: '(10)',
      A5: 'rate', B5: '50%',
    }, { col: 'B', dir: 'asc', rowCount: 5 })).toEqual({
      A1: 'item', B1: 'amount',
      A2: 'discount', B2: '(10)',
      A3: 'rate', B3: '50%',
      A4: 'fee', B4: '$9.50',
      A5: 'total', B5: '1,234',
    })
  })
})
