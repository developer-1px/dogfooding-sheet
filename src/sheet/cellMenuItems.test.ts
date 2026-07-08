import { describe, expect, it } from 'vitest'
import { cellMenuItems, cellMenuLabel, type CellMenuActions, type CellMenuEntry } from './cellMenuItems'

const labels = (items: CellMenuEntry[]) => items.map((item) => item === 'separator' ? '---' : item.label)
const item = (items: CellMenuEntry[], label: string) => {
  const found = items.find((entry) => entry !== 'separator' && entry.label === label)
  if (!found || found === 'separator') throw new Error(`missing item: ${label}`)
  return found
}

function actions(overrides: Partial<CellMenuActions> = {}, calls: string[] = []): CellMenuActions {
  return {
    sheet: { cells: { B2: 'value' }, merges: [] },
    selectedIds: ['r1-B'],
    focusId: 'r1-B',
    rowCount: 20,
    colLetters: ['A', 'B', 'C'],
    hiddenRows: new Set(),
    hiddenCols: new Set(),
    filterCol: null,
    clearFilter: () => calls.push('clearFilter'),
    writeCell: (key, value) => calls.push(`writeCell:${key}:${value}`),
    noteOf: () => undefined,
    setNote: (key, text) => calls.push(`setNote:${key}:${text}`),
    editNote: (key) => calls.push(`editNote:${key}`),
    insertLink: () => calls.push('insertLink'),
    promptRowHeight: (row) => calls.push(`promptRowHeight:${row}`),
    promptColWidth: (col) => calls.push(`promptColWidth:${col}`),
    promptFilter: (col) => calls.push(`promptFilter:${col}`),
    freeze: { rows: 0, cols: 0 },
    setFreezeRows: (rows) => calls.push(`setFreezeRows:${rows}`),
    setFreezeCols: (cols) => calls.push(`setFreezeCols:${cols}`),
    hideRow: (row) => calls.push(`hideRow:${row}`),
    hideCol: (col) => calls.push(`hideCol:${col}`),
    showRow: (row) => calls.push(`showRow:${row}`),
    showCol: (col) => calls.push(`showCol:${col}`),
    insertRow: (row) => calls.push(`insertRow:${row}`),
    deleteRow: (row) => calls.push(`deleteRow:${row}`),
    insertCol: (col) => calls.push(`insertCol:${col}`),
    deleteCol: (col) => calls.push(`deleteCol:${col}`),
    appendRows: (count) => calls.push(`appendRows:${count ?? ''}`),
    appendCols: (count) => calls.push(`appendCols:${count ?? ''}`),
    sortByCol: (col, dir) => calls.push(`sortByCol:${col}:${dir}`),
    mergeSelection: () => calls.push('mergeSelection'),
    ...overrides,
  }
}

describe('cellMenuItems', () => {
  it('labels context menus by kind', () => {
    expect(cellMenuLabel('cell')).toBe('셀 컨텍스트 메뉴')
    expect(cellMenuLabel('row')).toBe('행 헤더 컨텍스트 메뉴')
    expect(cellMenuLabel('col')).toBe('열 헤더 컨텍스트 메뉴')
  })

  it('builds row header items with adjacent row restore actions', () => {
    const calls: string[] = []
    const items = cellMenuItems(actions({ hiddenRows: new Set([0, 2]) }, calls), 'r1-B', 'row')

    expect(labels(items)).toContain('1행 숨김 표시')
    expect(labels(items)).toContain('3행 숨김 표시')
    item(items, '3행 숨김 표시').onClick()
    expect(calls).toEqual(['showRow:2'])
  })

  it('builds column header items with filter and adjacent column restore actions', () => {
    const calls: string[] = []
    const items = cellMenuItems(actions({
      hiddenCols: new Set(['A', 'C']),
      filterCol: 'B',
      freeze: { rows: 0, cols: 2 },
    }, calls), 'r1-B', 'col')

    expect(labels(items)).toContain('A열 숨김 표시')
    expect(labels(items)).toContain('C열 숨김 표시')
    expect(labels(items)).toContain('필터 수정…')
    expect(labels(items)).toContain('필터 해제')
    expect(labels(items)).toContain('열 고정 해제')
    expect(item(items, '필터 수정…').disabled).toBe(false)
    expect(item(items, 'B 내림차순 정렬').disabled).toBe(false)
    item(items, 'A열 숨김 표시').onClick()
    item(items, '필터 해제').onClick()
    item(items, '열 고정 해제').onClick()
    item(items, 'B 내림차순 정렬').onClick()
    expect(calls).toEqual(['showCol:A', 'clearFilter', 'setFreezeCols:0', 'sortByCol:B:desc'])
  })

  it('disables filter setup in column menus on single-row sheets while keeping clear available', () => {
    const inactiveItems = cellMenuItems(actions({ rowCount: 1, filterCol: null }), 'r0-B', 'col')
    const applyFilter = item(inactiveItems, '필터 적용…')
    expect(applyFilter.disabled).toBe(true)
    expect(applyFilter.disabledLabel).toBe('B열에 필터할 데이터 행 없음')

    const calls: string[] = []
    const activeItems = cellMenuItems(actions({ rowCount: 1, filterCol: 'B' }, calls), 'r0-B', 'col')
    const editFilter = item(activeItems, '필터 수정…')
    const clearFilter = item(activeItems, '필터 해제')

    expect(editFilter.disabled).toBe(true)
    expect(editFilter.disabledLabel).toBe('B열 필터를 수정할 데이터 행 없음')
    expect(clearFilter.disabled).toBeUndefined()

    clearFilter.onClick()

    expect(calls).toEqual(['clearFilter'])
  })

  it('builds cell items from address, note, structure, freeze, and sort state', () => {
    const calls: string[] = []
    const items = cellMenuItems(actions({
      noteOf: () => 'note',
      freeze: { rows: 2, cols: 0 },
    }, calls), 'r1-B')

    expect(labels(items)).toContain('노트 편집 (Ctrl/⌘+Shift+M)')
    expect(labels(items)).toContain('노트 삭제')
    expect(labels(items)).toContain('행 고정 해제')
    expect(labels(items)).toContain('B열까지 고정')
    expect(item(items, 'B 오름차순 정렬').disabled).toBe(false)
    item(items, '지우기 (Delete/Backspace)').onClick()
    item(items, '노트 삭제').onClick()
    item(items, 'B 오름차순 정렬').onClick()
    expect(calls).toEqual(['writeCell:B2:', 'setNote:B2:', 'sortByCol:B:asc'])
  })

  it('disables sort actions in cell and column menus when a single-row sheet cannot be sorted', () => {
    const cellItems = cellMenuItems(actions({ rowCount: 1 }), 'r0-B')
    const colItems = cellMenuItems(actions({ rowCount: 1 }), 'r0-B', 'col')

    expect(item(cellItems, 'B 오름차순 정렬').disabled).toBe(true)
    expect(item(cellItems, 'B 오름차순 정렬').disabledLabel).toBe('B열 오름차순 정렬할 데이터 행 없음')
    expect(item(cellItems, 'B 내림차순 정렬').disabled).toBe(true)
    expect(item(cellItems, 'B 내림차순 정렬').disabledLabel).toBe('B열 내림차순 정렬할 데이터 행 없음')
    expect(item(colItems, 'B 오름차순 정렬').disabled).toBe(true)
    expect(item(colItems, 'B 오름차순 정렬').disabledLabel).toBe('B열 오름차순 정렬할 데이터 행 없음')
    expect(item(colItems, 'B 내림차순 정렬').disabled).toBe(true)
    expect(item(colItems, 'B 내림차순 정렬').disabledLabel).toBe('B열 내림차순 정렬할 데이터 행 없음')
  })

  it('disables inactive freeze actions in cell and header menus on single-axis sheets', () => {
    const singleAxisActions = actions({ rowCount: 1, colLetters: ['A'] })
    const cellItems = cellMenuItems(singleAxisActions, 'r0-A')
    const rowItems = cellMenuItems(singleAxisActions, 'r0-A', 'row')
    const colItems = cellMenuItems(singleAxisActions, 'r0-A', 'col')

    expect(item(cellItems, '1행까지 고정').disabled).toBe(true)
    expect(item(cellItems, '1행까지 고정').disabledLabel).toBe('1행까지 고정할 추가 행 없음')
    expect(item(cellItems, 'A열까지 고정').disabled).toBe(true)
    expect(item(cellItems, 'A열까지 고정').disabledLabel).toBe('A열까지 고정할 추가 열 없음')
    expect(item(rowItems, '1행까지 고정').disabled).toBe(true)
    expect(item(rowItems, '1행까지 고정').disabledLabel).toBe('1행까지 고정할 추가 행 없음')
    expect(item(colItems, 'A열까지 고정').disabled).toBe(true)
    expect(item(colItems, 'A열까지 고정').disabledLabel).toBe('A열까지 고정할 추가 열 없음')
  })

  it('keeps active freeze actions enabled on single-axis sheets so they can be cleared', () => {
    const calls: string[] = []
    const activeFreezeActions = actions({
      rowCount: 1,
      colLetters: ['A'],
      freeze: { rows: 1, cols: 1 },
    }, calls)
    const cellItems = cellMenuItems(activeFreezeActions, 'r0-A')

    const rowFreeze = item(cellItems, '행 고정 해제')
    const colFreeze = item(cellItems, '열 고정 해제')

    expect(rowFreeze.disabled).toBe(false)
    expect(colFreeze.disabled).toBe(false)

    rowFreeze.onClick()
    colFreeze.onClick()

    expect(calls).toEqual(['setFreezeRows:0', 'setFreezeCols:0'])
  })

  it('exposes the merge shortcut metadata on cell, row, and column menus', () => {
    const mergeLabel = '셀 병합 / 해제 (Alt+Shift+M)'

    expect(item(cellMenuItems(actions(), 'r1-B'), mergeLabel).keyShortcuts).toBe('Alt+Shift+M')
    expect(item(cellMenuItems(actions(), 'r1-B', 'row'), mergeLabel).keyShortcuts).toBe('Alt+Shift+M')
    expect(item(cellMenuItems(actions(), 'r1-B', 'col'), mergeLabel).keyShortcuts).toBe('Alt+Shift+M')
  })

  it('disables merge actions for a single unmerged focused cell', () => {
    const calls: string[] = []
    const merge = item(cellMenuItems(actions({}, calls), 'r1-B'), '셀 병합 / 해제 (Alt+Shift+M)')

    expect(merge.disabled).toBe(true)
    expect(merge.disabledLabel).toBe('병합 가능한 셀 범위 없음')

    merge.onClick()

    expect(calls).toEqual([])
  })

  it('enables merge actions for a supported row selection', () => {
    const calls: string[] = []
    const merge = item(
      cellMenuItems(actions({ selectedIds: ['r1-A', 'r1-B'], focusId: 'r1-A' }, calls), 'r1-A', 'row'),
      '셀 병합 / 해제 (Alt+Shift+M)',
    )

    expect(merge.disabled).toBe(false)

    merge.onClick()

    expect(calls).toEqual(['mergeSelection'])
  })

  it('enables merge actions for a focused cell inside an existing merge', () => {
    const calls: string[] = []
    const merge = item(
      cellMenuItems(actions({
        sheet: { cells: { B2: 'value' }, merges: [[1, 1, 1, 2]] },
        selectedIds: [],
        focusId: 'r1-C',
      }, calls), 'r1-C'),
      '셀 병합 / 해제 (Alt+Shift+M)',
    )

    expect(merge.disabled).toBe(false)

    merge.onClick()

    expect(calls).toEqual(['mergeSelection'])
  })

  it('exposes row structure shortcut metadata on row and cell menus', () => {
    const insertLabel = '위에 행 삽입 (Ctrl/⌘+Alt+=)'
    const insertBelowLabel = '아래 행 삽입'
    const deleteLabel = '행 삭제 (Ctrl/⌘+Alt+-)'
    const hideLabel = '2행 숨기기 (Ctrl/⌘+Alt+9)'
    const rowCalls: string[] = []
    const rowItems = cellMenuItems(actions({}, rowCalls), 'r1-B', 'row')

    expect(item(rowItems, insertLabel).keyShortcuts).toBe('Control+Alt+= Meta+Alt+=')
    expect(item(rowItems, insertBelowLabel).disabled).toBe(false)
    expect(item(rowItems, deleteLabel).keyShortcuts).toBe('Control+Alt+- Meta+Alt+-')
    expect(item(rowItems, hideLabel).keyShortcuts).toBe('Control+Alt+9 Meta+Alt+9')
    expect(item(rowItems, hideLabel).disabled).toBe(false)

    item(rowItems, insertLabel).onClick()
    item(rowItems, insertBelowLabel).onClick()
    item(rowItems, deleteLabel).onClick()
    item(rowItems, hideLabel).onClick()
    expect(rowCalls).toEqual(['insertRow:1', 'insertRow:2', 'deleteRow:1', 'hideRow:1'])

    const cellItems = cellMenuItems(actions(), 'r1-B')
    expect(item(cellItems, insertLabel).keyShortcuts).toBe('Control+Alt+= Meta+Alt+=')
    expect(item(cellItems, insertBelowLabel).disabled).toBe(false)
    expect(item(cellItems, deleteLabel).keyShortcuts).toBe('Control+Alt+- Meta+Alt+-')
    expect(item(cellItems, hideLabel).keyShortcuts).toBe('Control+Alt+9 Meta+Alt+9')
    expect(item(cellItems, hideLabel).disabled).toBe(false)
  })

  it('disables row hide actions in cell and row menus on single-row sheets', () => {
    const rowItems = cellMenuItems(actions({ rowCount: 1 }), 'r0-B', 'row')
    const cellItems = cellMenuItems(actions({ rowCount: 1 }), 'r0-B')

    expect(item(rowItems, '1행 숨기기 (Ctrl/⌘+Alt+9)').disabled).toBe(true)
    expect(item(rowItems, '1행 숨기기 (Ctrl/⌘+Alt+9)').disabledLabel).toBe('숨기려면 하나 이상의 행이 더 필요함')
    expect(item(cellItems, '1행 숨기기 (Ctrl/⌘+Alt+9)').disabled).toBe(true)
    expect(item(cellItems, '1행 숨기기 (Ctrl/⌘+Alt+9)').disabledLabel).toBe('숨기려면 하나 이상의 행이 더 필요함')
  })

  it('disables insert-below row actions on the final row', () => {
    const rowItems = cellMenuItems(actions({ rowCount: 2 }), 'r1-B', 'row')
    const cellItems = cellMenuItems(actions({ rowCount: 2 }), 'r1-B')

    expect(item(rowItems, '아래 행 삽입').disabled).toBe(true)
    expect(item(rowItems, '아래 행 삽입').disabledLabel).toBe('아래에 삽입할 행 위치 없음')
    expect(item(cellItems, '아래 행 삽입').disabled).toBe(true)
    expect(item(cellItems, '아래 행 삽입').disabledLabel).toBe('아래에 삽입할 행 위치 없음')
  })

  it('exposes column structure shortcut metadata on column and cell menus', () => {
    const insertLabel = 'B열 왼쪽에 삽입 (Ctrl/⌘+Alt+Shift+=)'
    const deleteLabel = 'B열 삭제 (Ctrl/⌘+Alt+Shift+-)'
    const hideLabel = 'B열 숨기기 (Ctrl/⌘+Alt+0)'
    const colCalls: string[] = []
    const colItems = cellMenuItems(actions({}, colCalls), 'r1-B', 'col')

    expect(item(colItems, insertLabel).keyShortcuts).toBe('Control+Alt+Shift+= Meta+Alt+Shift+=')
    expect(item(colItems, deleteLabel).keyShortcuts).toBe('Control+Alt+Shift+- Meta+Alt+Shift+-')
    expect(item(colItems, hideLabel).keyShortcuts).toBe('Control+Alt+0 Meta+Alt+0')
    expect(item(colItems, hideLabel).disabled).toBe(false)

    item(colItems, insertLabel).onClick()
    item(colItems, deleteLabel).onClick()
    item(colItems, hideLabel).onClick()
    expect(colCalls).toEqual(['insertCol:B', 'deleteCol:B', 'hideCol:B'])

    const cellItems = cellMenuItems(actions(), 'r1-B')
    expect(item(cellItems, insertLabel).keyShortcuts).toBe('Control+Alt+Shift+= Meta+Alt+Shift+=')
    expect(item(cellItems, deleteLabel).keyShortcuts).toBe('Control+Alt+Shift+- Meta+Alt+Shift+-')
    expect(item(cellItems, hideLabel).keyShortcuts).toBe('Control+Alt+0 Meta+Alt+0')
    expect(item(cellItems, hideLabel).disabled).toBe(false)
  })

  it('disables column hide actions in cell and column menus on single-column sheets', () => {
    const colItems = cellMenuItems(actions({ colLetters: ['A'] }), 'r0-A', 'col')
    const cellItems = cellMenuItems(actions({ colLetters: ['A'] }), 'r0-A')

    expect(item(colItems, 'A열 숨기기 (Ctrl/⌘+Alt+0)').disabled).toBe(true)
    expect(item(colItems, 'A열 숨기기 (Ctrl/⌘+Alt+0)').disabledLabel).toBe('숨기려면 하나 이상의 열이 더 필요함')
    expect(item(cellItems, 'A열 숨기기 (Ctrl/⌘+Alt+0)').disabled).toBe(true)
    expect(item(cellItems, 'A열 숨기기 (Ctrl/⌘+Alt+0)').disabledLabel).toBe('숨기려면 하나 이상의 열이 더 필요함')
  })

  it('exposes the hyperlink shortcut metadata and keeps its action wired', () => {
    const calls: string[] = []
    const link = item(cellMenuItems(actions({}, calls), 'r1-B'), '하이퍼링크 삽입 (Ctrl/⌘+K)')

    expect(link.keyShortcuts).toBe('Control+K Meta+K')
    link.onClick()
    expect(calls).toEqual(['insertLink'])
  })

  it('exposes note add and edit shortcut metadata while keeping actions wired', () => {
    const addCalls: string[] = []
    const addNote = item(cellMenuItems(actions({}, addCalls), 'r1-B'), '노트 추가 (Ctrl/⌘+Shift+M)')

    expect(addNote.keyShortcuts).toBe('Control+Shift+M Meta+Shift+M')
    addNote.onClick()
    expect(addCalls).toEqual(['editNote:B2'])

    const editCalls: string[] = []
    const editNote = item(
      cellMenuItems(actions({ noteOf: () => 'note' }, editCalls), 'r1-B'),
      '노트 편집 (Ctrl/⌘+Shift+M)',
    )

    expect(editNote.keyShortcuts).toBe('Control+Shift+M Meta+Shift+M')
    editNote.onClick()
    expect(editCalls).toEqual(['editNote:B2'])
  })

  it('exposes the clear shortcut metadata and keeps its action wired', () => {
    const calls: string[] = []
    const clear = item(cellMenuItems(actions({}, calls), 'r1-B'), '지우기 (Delete/Backspace)')

    expect(clear.keyShortcuts).toBe('Delete Backspace')
    expect(clear.disabled).toBe(false)
    clear.onClick()
    expect(calls).toEqual(['writeCell:B2:'])
  })

  it('disables the clear action when the focused cell has no value', () => {
    const calls: string[] = []
    const clear = item(cellMenuItems(actions({ sheet: { cells: {}, merges: [] } }, calls), 'r1-B'), '지우기 (Delete/Backspace)')

    expect(clear.disabled).toBe(true)
    expect(clear.disabledLabel).toBe('지울 셀 값 없음')

    clear.onClick()

    expect(calls).toEqual([])
  })

  it('exposes clipboard shortcut metadata and keeps actions wired', async () => {
    const calls: string[] = []
    let clipboardText = ''
    const clipboardTextBridge = {
      readText: () => Promise.resolve(clipboardText),
      writeText: (text: string) => {
        clipboardText = text
        return Promise.resolve(true)
      },
    }
    const items = cellMenuItems(actions({ clipboardText: clipboardTextBridge }, calls), 'r1-B')
    const cut = item(items, '잘라내기 (Ctrl/⌘+X)')
    const copy = item(items, '복사 (Ctrl/⌘+C)')
    const paste = item(items, '붙여넣기 (Ctrl/⌘+V)')

    expect(cut.keyShortcuts).toBe('Control+X Meta+X')
    expect(copy.keyShortcuts).toBe('Control+C Meta+C')
    expect(paste.keyShortcuts).toBe('Control+V Meta+V')

    await copy.onClick()
    expect(clipboardText).toBe('value')

    await cut.onClick()
    expect(clipboardText).toBe('value')

    clipboardText = 'pasted'
    await paste.onClick()
    expect(calls).toEqual(['writeCell:B2:', 'writeCell:B2:pasted'])
  })

  it('returns no items for an invalid cell id', () => {
    expect(cellMenuItems(actions(), 'bad-id')).toEqual([])
  })
})
