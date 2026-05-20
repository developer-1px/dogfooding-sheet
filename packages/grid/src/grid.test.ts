import { describe, expect, it } from 'vitest'
import { addMergeToList, applyFillWrites, buildMergeMap, cancelGridEdit, cellId, cellKey, clearGridSelection, clearWritesForIds, colIndex, columnLabel, columnLabels, commitGridEdit, createGridEditState, createGridSelectionState, cycleTrailingFormulaRef, deleteRow, extendSeries, fillDownWrites, fillRightWrites, fillSourceRect, fillTargetForCell, freezeFormulaWrites, homeEndTarget, idsBetween, idsForFormulaPick, idsInFillTarget, insertRow, internalClipboardFromTsv, isFillCorner, jumpToEdge, MAX_TSV_TEXT_LENGTH, mergeActionForSelection, moveCellIdByDelta, normalizeMergeList, offsetFormulaRefs, pageTarget, parseA1, rectFromIds, rectToTsv, rectToTsvBounded, refForFormulaPick, removeMergeAt, replaceTrailingFormulaRef, resolveCellRef, resolveGotoTarget, resolveRange, rowColActionAtFocus, selectionAddress, setGridSelectedIds, setGridSelectionFocus, shiftFormulaCols, shiftFormulaRows, sortByColumn, sortRowOrder, startGridEdit, tabTarget, targetGridIds, writesFromInternalClipboard, writesFromInternalClipboardToRect, writesFromTsv, writesFromTsvToRect } from './index'

describe('@spredsheet/grid', () => {
  it('keeps A1 keys and DOM ids as pure coordinate transforms', () => {
    expect(cellKey('B', 2)).toBe('B3')
    expect(cellId('C', 4)).toBe('r4-C')
    expect(parseA1('B3')).toEqual({ col: 'B', row: 2 })
    expect(parseA1('A0')).toBeNull()
    expect(parseA1(`A${Number.MAX_SAFE_INTEGER + 1}`)).toBeNull()
    expect(rectFromIds(['r1-B', 'r3-D'])).toEqual({ rMin: 1, rMax: 3, cMin: 1, cMax: 3 })
  })

  it('supports column labels beyond single-letter spreadsheet columns', () => {
    expect(columnLabel(25)).toBe('Z')
    expect(columnLabel(26)).toBe('AA')
    expect(columnLabel(27)).toBe('AB')
    expect(columnLabels(28).at(-1)).toBe('AB')
    expect(colIndex('AA')).toBe(26)
    expect(cellId('AA', 0)).toBe('r0-AA')
    expect(rectFromIds(['r0-Z', 'r1-AA'])).toEqual({ rMin: 0, rMax: 1, cMin: 25, cMax: 26 })
    expect(writesFromTsv('x\ty', { col: 'Z', row: 0 })).toEqual([
      ['Z1', 'x'],
      ['AA1', 'y'],
    ])
    expect(offsetFormulaRefs('=Z1+AA1', 0, 1)).toBe('=AA1+AB1')
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

  it('computes fill handle source, corner, target, and target ids', () => {
    const source = { rMin: 0, rMax: 1, cMin: 0, cMax: 1 }
    expect(fillSourceRect(['r0-A', 'r0-B', 'r1-A', 'r1-B'], null)).toEqual(source)
    expect(fillSourceRect([], 'r2-C')).toEqual({ rMin: 2, rMax: 2, cMin: 2, cMax: 2 })
    expect(isFillCorner('r1-B', null, ['r0-A', 'r0-B', 'r1-A', 'r1-B'])).toBe(true)
    expect(isFillCorner('r1-A', null, ['r0-A', 'r0-B', 'r1-A', 'r1-B'])).toBe(false)
    const target = fillTargetForCell(source, 'r4-B', { rowCount: 10, colLetters: ['A', 'B', 'C'] })
    expect(target).toEqual({ rMin: 0, rMax: 4, cMin: 0, cMax: 1 })
    expect(idsInFillTarget({ rMin: 0, rMax: 1, cMin: 0, cMax: 1 }, ['A', 'B'])).toEqual(['r0-A', 'r0-B', 'r1-A', 'r1-B'])
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

  it('computes formula-freeze writes from displayed values', () => {
    expect(freezeFormulaWrites(
      ['r0-A', 'r0-B', 'bad'],
      { A1: '=1+1', B1: 'plain' },
      (key) => key === 'A1' ? '2' : '',
    )).toEqual([['A1', '2']])
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
    expect(shiftFormulaRows('=$A$1+A$1+$A1+A1+LOG10(100)', 0, 1, 10)).toBe('=$A$2+A$2+$A2+A2+LOG10(100)')
    expect(shiftFormulaRows('=A1+LOG10(100)', 0, -1)).toBe('=#REF!+LOG10(100)')
  })

  it('shifts column references without rewriting function names', () => {
    expect(shiftFormulaCols('=$A$1+A$1+$A1+A1+LOG10(100)', 0, 1)).toBe('=$B$1+B$1+$B1+B1+LOG10(100)')
    expect(shiftFormulaCols('=A1+LOG10(100)', 0, -1)).toBe('=#REF!+LOG10(100)')
  })

  it('offsets copied formula references relatively', () => {
    expect(offsetFormulaRefs('=A1+B2', 2, 1)).toBe('=B3+C4')
    expect(offsetFormulaRefs('=$A$1+A$1+$A1+A1', 2, 1)).toBe('=$A$1+B$1+$A3+B3')
    expect(offsetFormulaRefs('=A1', -1, 0)).toBe('=#REF!')
    expect(offsetFormulaRefs('=A1+LOG10(100)', 0, 1)).toBe('=B1+LOG10(100)')
    expect(offsetFormulaRefs('plain', 2, 1)).toBe('plain')
  })

  it('converts TSV without touching the system clipboard', () => {
    const cells = { A1: 'name', B1: 'score', A2: 'Kim', B2: '10' }
    const smallCells: Record<string, string> = { A1: 'A', B1: 'B' }
    expect(rectToTsv({ rMin: 0, rMax: 1, cMin: 0, cMax: 1 }, (k) => cells[k] ?? '')).toBe('name\tscore\nKim\t10')
    expect(rectToTsvBounded({ rMin: 0, rMax: 0, cMin: 0, cMax: 1 }, (k) => smallCells[k] ?? '', 3)).toBe('A\tB')
    expect(rectToTsvBounded({ rMin: 0, rMax: 0, cMin: 0, cMax: 1 }, (k) => smallCells[k] ?? '', 2)).toBeNull()
    expect(writesFromTsv('A\tB\nC\tD', { col: 'B', row: 1 }, { maxRow: 3, maxCol: 3 })).toEqual([
      ['B2', 'A'],
      ['C2', 'B'],
      ['B3', 'C'],
      ['C3', 'D'],
    ])
  })

  it('clips external TSV writes to target bounds before mapping cells', () => {
    expect(writesFromTsv(
      'A\tB\tC\tD\nE\tF\tG\tH\nI\tJ\tK\tL',
      { col: 'B', row: 1 },
      { maxRow: 3, maxCol: 4 },
    )).toEqual([
      ['B2', 'A'],
      ['C2', 'B'],
      ['D2', 'C'],
      ['B3', 'E'],
      ['C3', 'F'],
      ['D3', 'G'],
    ])

    expect(writesFromTsvToRect(
      'A\tB\tC\nD\tE\tF\nG\tH\tI',
      { rMin: 1, rMax: 3, cMin: 1, cMax: 3 },
      { maxRow: 3, maxCol: 3 },
    )).toEqual([
      ['B2', 'A'],
      ['C2', 'B'],
      ['B3', 'D'],
      ['C3', 'E'],
    ])
  })

  it('rejects oversized external TSV before parsing', () => {
    const oversized = `${'x'.repeat(MAX_TSV_TEXT_LENGTH)}x`
    expect(writesFromTsv(oversized, { col: 'A', row: 0 }, { maxRow: 20, maxCol: 10 })).toEqual([])
    expect(writesFromTsvToRect(oversized, { rMin: 0, rMax: 1, cMin: 0, cMax: 1 }, { maxRow: 20, maxCol: 10 })).toEqual([])
  })

  it('computes internal clipboard writes with formula offsets', () => {
    const clip = internalClipboardFromTsv(false, { rMin: 1, rMax: 1, cMin: 1, cMax: 1 }, '=A1')
    expect(writesFromInternalClipboard(clip, { col: 'B', row: 2 }, { maxRow: 20 })).toEqual([
      ['B3', '=A2'],
    ])
    expect(writesFromInternalClipboardToRect(clip, { rMin: 2, rMax: 3, cMin: 1, cMax: 2 }, { maxRow: 20 })).toEqual([
      ['B3', '=A2'],
      ['C3', '=B2'],
      ['B4', '=A3'],
      ['C4', '=B3'],
    ])
    expect(clearWritesForIds(['r0-A', 'bad', 'r1-B'])).toEqual([
      ['A1', ''],
      ['B2', ''],
    ])
  })

  it('parses internal clipboard TSV only within the copied rect', () => {
    const clip = internalClipboardFromTsv(false, { rMin: 0, rMax: 1, cMin: 0, cMax: 1 }, 'A\tB\tC\r\nD\tE\tF\nG\tH\tI')
    expect(clip.values).toEqual([
      ['A', 'B'],
      ['D', 'E'],
    ])
  })

  it('rejects oversized internal clipboard text before parsing', () => {
    const oversized = `${'x'.repeat(MAX_TSV_TEXT_LENGTH)}x`
    const clip = internalClipboardFromTsv(false, { rMin: 0, rMax: 0, cMin: 0, cMax: 0 }, oversized)
    expect(clip.text).toBe('')
    expect(writesFromInternalClipboard(clip, { col: 'A', row: 0 }, { maxRow: 20, maxCol: 10 })).toEqual([])
    expect(writesFromInternalClipboardToRect(clip, { rMin: 0, rMax: 1, cMin: 0, cMax: 1 }, { maxRow: 20, maxCol: 10 })).toEqual([])
  })

  it('clips internal clipboard writes to target bounds before offsetting formulas', () => {
    const clip = internalClipboardFromTsv(false, { rMin: 0, rMax: 1, cMin: 0, cMax: 2 }, '=A1\t=B1\t=C1\n=A2\t=B2\t=C2')

    expect(writesFromInternalClipboard(clip, { col: 'B', row: 1 }, { maxRow: 2, maxCol: 3 })).toEqual([
      ['B2', '=B2'],
      ['C2', '=C2'],
    ])

    expect(writesFromInternalClipboardToRect(clip, { rMin: 1, rMax: 3, cMin: 1, cMax: 3 }, { maxRow: 3, maxCol: 3 })).toEqual([
      ['B2', '=B2'],
      ['C2', '=C2'],
      ['B3', '=B3'],
      ['C3', '=C3'],
    ])
  })

  it('computes merge actions and merge maps', () => {
    expect(mergeActionForSelection(['r0-A', 'r0-B', 'r0-C'], null)).toEqual({
      type: 'merge',
      merge: [0, 0, 0, 2],
    })
    expect(mergeActionForSelection([], 'r3-B')).toEqual({ type: 'unmerge', row: 3, col: 1 })
    expect(mergeActionForSelection(['r1-A', 'r1-B', 'r2-A'], null)).toEqual({ type: 'none' })
    expect(addMergeToList([[0, 0, 0, 1]], [0, 0, 1, 2])).toEqual([[0, 0, 1, 2]])
    expect(removeMergeAt([[0, 0, 0, 2]], 0, 1)).toEqual([])
    const { anchors, hidden } = buildMergeMap([[0, 0, 0, 2]])
    expect(anchors.get('0,0')).toEqual({ anchorR: 0, anchorC: 0, rows: 1, cols: 3 })
    expect(hidden.has('0,1')).toBe(true)
  })

  it('normalizes merge lists to bounds and latest overlap wins', () => {
    expect(normalizeMergeList([
      [0, 0, 0, 1],
      [1, 1, 1, 1],
      [2, 2, 0, 1],
      [0, 0, 1, 2],
    ], { rowCount: 2, colCount: 3 })).toEqual([[0, 0, 1, 2]])
  })

  it('computes row and column actions at focus', () => {
    expect(rowColActionAtFocus('B5', 'insertRow')).toEqual({ type: 'insertRow', row: 4 })
    expect(rowColActionAtFocus('B5', 'hideCol')).toEqual({ type: 'hideCol', col: 'B' })
    expect(rowColActionAtFocus(null, 'deleteRow')).toEqual({ type: 'none' })
    expect(rowColActionAtFocus('garbage', 'deleteCol')).toEqual({ type: 'none' })
  })

  it('sorts grid rows by a column while preserving outside rows', () => {
    expect(sortByColumn({ A1: 'name', A2: 'B', B2: '2', A3: 'A', B3: '1' }, { col: 'B', dir: 'asc', rowCount: 3 })).toEqual({
      A1: 'name',
      A2: 'A',
      B2: '1',
      A3: 'B',
      B3: '2',
    })
    expect(sortRowOrder({ A1: 'name', A2: 'B', B2: '2', A3: 'A', B3: '1' }, { col: 'B', dir: 'asc', rowCount: 3 })).toEqual([2, 1])
  })

  it('keeps row-local formulas aligned when sorting rows', () => {
    expect(sortByColumn({
      A1: 'name', B1: 'rank', C1: 'double',
      A2: 'B', B2: '2', C2: '=B2*2',
      A3: 'A', B3: '1', C3: '=B3*2',
    }, { col: 'B', dir: 'asc', rowCount: 3, colCount: 3 })).toEqual({
      A1: 'name', B1: 'rank', C1: 'double',
      A2: 'A', B2: '1', C2: '=B2*2',
      A3: 'B', B3: '2', C3: '=B3*2',
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
