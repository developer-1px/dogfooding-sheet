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
    sheet: { cells: { B2: 'value' } },
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
    item(items, 'A열 숨김 표시').onClick()
    item(items, '필터 해제').onClick()
    item(items, '열 고정 해제').onClick()
    item(items, 'B 내림차순 정렬').onClick()
    expect(calls).toEqual(['showCol:A', 'clearFilter', 'setFreezeCols:0', 'sortByCol:B:desc'])
  })

  it('builds cell items from address, note, structure, freeze, and sort state', () => {
    const calls: string[] = []
    const items = cellMenuItems(actions({
      noteOf: () => 'note',
      freeze: { rows: 2, cols: 0 },
    }, calls), 'r1-B')

    expect(labels(items)).toContain('노트 편집')
    expect(labels(items)).toContain('노트 삭제')
    expect(labels(items)).toContain('행 고정 해제')
    expect(labels(items)).toContain('B열까지 고정')
    item(items, '지우기 (Delete/Backspace)').onClick()
    item(items, '노트 삭제').onClick()
    item(items, 'B 오름차순 정렬').onClick()
    expect(calls).toEqual(['writeCell:B2:', 'setNote:B2:', 'sortByCol:B:asc'])
  })

  it('exposes the merge shortcut metadata on cell, row, and column menus', () => {
    const mergeLabel = '셀 병합 / 해제 (Alt+Shift+M)'

    expect(item(cellMenuItems(actions(), 'r1-B'), mergeLabel).keyShortcuts).toBe('Alt+Shift+M')
    expect(item(cellMenuItems(actions(), 'r1-B', 'row'), mergeLabel).keyShortcuts).toBe('Alt+Shift+M')
    expect(item(cellMenuItems(actions(), 'r1-B', 'col'), mergeLabel).keyShortcuts).toBe('Alt+Shift+M')
  })

  it('exposes the hyperlink shortcut metadata and keeps its action wired', () => {
    const calls: string[] = []
    const link = item(cellMenuItems(actions({}, calls), 'r1-B'), '하이퍼링크 삽입 (Ctrl/⌘+K)')

    expect(link.keyShortcuts).toBe('Control+K Meta+K')
    link.onClick()
    expect(calls).toEqual(['insertLink'])
  })

  it('exposes the clear shortcut metadata and keeps its action wired', () => {
    const calls: string[] = []
    const clear = item(cellMenuItems(actions({}, calls), 'r1-B'), '지우기 (Delete/Backspace)')

    expect(clear.keyShortcuts).toBe('Delete Backspace')
    clear.onClick()
    expect(calls).toEqual(['writeCell:B2:'])
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
