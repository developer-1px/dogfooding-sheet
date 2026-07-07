import { act, createElement, type ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { setupReactDOM } from './test-utils'
import { Toolbar } from './Toolbar'
import { initialSheet, MAX_COL_COUNT, MAX_ROW_COUNT } from './schema'

vi.mock('./toolbarActions', () => ({
  applyCheckboxValidation: () => false,
  applyToolbarAutoSum: () => false,
  applyToolbarFormat: () => false,
  clearToolbarStyle: () => false,
  promptListValidation: () => Promise.resolve('cancelled'),
  promptToolbarFilter: () => Promise.resolve('cancelled'),
  setToolbarAlignment: () => false,
  setToolbarColor: () => false,
  toggleToolbarStyle: () => false,
}))

describe('Toolbar component', () => {
  const dom = setupReactDOM()

  const renderToolbar = (overrides: Partial<ComponentProps<typeof Toolbar>> = {}) => {
    const props: ComponentProps<typeof Toolbar> = {
      display: () => '1',
      writeCell: vi.fn(),
      writeCells: vi.fn(),
      writeCellRange: vi.fn(() => false),
      focusKey: 'B2',
      selectedIds: ['r1-B'],
      setFormat: vi.fn(),
      formatOf: () => 'plain',
      insertRow: vi.fn(),
      deleteRow: vi.fn(),
      insertCol: vi.fn(),
      deleteCol: vi.fn(),
      appendRows: vi.fn(),
      appendCols: vi.fn(),
      sortByCol: vi.fn(),
      updateStyle: vi.fn(),
      styleOf: () => undefined,
      freeze: { rows: 0, cols: 0 },
      toggleFreezeRows: vi.fn(),
      toggleFreezeCols: vi.fn(),
      setFreezeRows: vi.fn(),
      setFreezeCols: vi.fn(),
      filter: { col: 'B', text: 'needle' },
      applyFilter: vi.fn(),
      clearFilter: vi.fn(),
      hasHidden: true,
      showAll: vi.fn(),
      setListRule: vi.fn(),
      setCheckboxRule: vi.fn(),
      clearRule: vi.fn(),
      openHelp: vi.fn(),
      insertLink: vi.fn(),
      addCondRule: vi.fn(),
      clearCondRules: vi.fn(),
      hasCondRules: true,
      sheet: initialSheet,
      previewSheetReplacement: () => null,
      applySheetReplacement: vi.fn(() => false),
      clearCellValues: vi.fn(() => false),
      ask: () => Promise.resolve(null),
      confirm: () => Promise.resolve(false),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: true,
      canRedo: true,
      showFormulas: false,
      toggleShowFormulas: vi.fn(),
      showGridlines: true,
      toggleShowGridlines: vi.fn(),
      clearAllFormats: vi.fn(() => false),
      mergeSelection: vi.fn(),
      rowCount: 10,
      colCount: 5,
      ...overrides,
    }

    act(() => dom.root.render(createElement('form', null, createElement(Toolbar, props))))
    return props
  }

  it('renders toolbar command buttons as non-submit controls', () => {
    renderToolbar()

    const buttons = [...document.querySelectorAll<HTMLButtonElement>('button')]

    expect(buttons.length).toBeGreaterThan(20)
    expect(buttons.every((button) => button.type === 'button')).toBe(true)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="실행 취소"]')?.type).toBe('button')
    const filterButton = document.querySelector<HTMLButtonElement>('button[aria-label="B열 필터 수정"]')
    expect(filterButton?.type).toBe('button')
    expect(filterButton?.disabled).toBe(false)
    expect(filterButton?.getAttribute('title')).toBe('B열 필터 수정')
    const sortAsc = document.querySelector<HTMLButtonElement>('button[aria-label="B열 오름차순 정렬"]')
    const sortDesc = document.querySelector<HTMLButtonElement>('button[aria-label="B열 내림차순 정렬"]')
    const autoSum = document.querySelector<HTMLButtonElement>('button[aria-label="자동 합계"]')
    expect(sortAsc?.textContent).toBe('↑정렬')
    expect(sortAsc?.disabled).toBe(false)
    expect(sortAsc?.getAttribute('title')).toBe('B열 오름차순 정렬')
    expect(sortDesc?.textContent).toBe('↓정렬')
    expect(sortDesc?.disabled).toBe(false)
    expect(sortDesc?.getAttribute('title')).toBe('B열 내림차순 정렬')
    expect(autoSum?.textContent).toBe('Σ')
    expect(autoSum?.disabled).toBe(false)
    expect(autoSum?.getAttribute('title')).toBe('자동 합계 (위쪽 연속 숫자 합)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숨김 행과 열 모두 표시"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('.overflow-trigger')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="아래에 행 20개 추가 (현재 10행)"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="오른쪽에 열 1개 추가 (현재 5열)"]')?.disabled).toBe(false)

    const clearFormatButton = document.querySelector<HTMLButtonElement>('button[aria-label="서식 모두 해제"]')
    expect(clearFormatButton?.textContent).toBe('✕서식')
    expect(clearFormatButton?.disabled).toBe(false)
    expect(clearFormatButton?.getAttribute('title')).toBe('서식 모두 해제')
    expect(clearFormatButton?.getAttribute('aria-keyshortcuts')).toBe('Control+\\ Meta+\\')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="굵게"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="왼쪽 정렬"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLInputElement>('input[aria-label="배경색 선택"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLInputElement>('input[aria-label="글자색 선택"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 일반"]')?.disabled).toBe(false)

    const mergeButton = document.querySelector<HTMLButtonElement>('button[aria-label="선택 셀 병합 또는 병합 해제"]')
    expect(mergeButton?.textContent).toBe('⊞병합')
    expect(mergeButton?.disabled).toBe(true)
    expect(mergeButton?.getAttribute('title')).toBe('선택 셀 병합 / 병합 해제 (Alt+Shift+M)')
    expect(mergeButton?.getAttribute('aria-keyshortcuts')).toBe('Alt+Shift+M')

    expect(document.querySelector<HTMLButtonElement>('button[aria-label="드롭다운 목록 유효성 검사 설정"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="체크박스로 변환"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식 추가"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식 모두 해제"]')?.disabled).toBe(false)
  })

  it('disables toolbar merge for a single unmerged focused cell', () => {
    const props = renderToolbar()

    const mergeButton = document.querySelector<HTMLButtonElement>('button[aria-label="선택 셀 병합 또는 병합 해제"]')

    expect(mergeButton?.textContent).toBe('⊞병합')
    expect(mergeButton?.disabled).toBe(true)
    expect(mergeButton?.getAttribute('title')).toBe('선택 셀 병합 / 병합 해제 (Alt+Shift+M)')

    act(() => mergeButton!.click())

    expect(props.mergeSelection).not.toHaveBeenCalled()
  })

  it('enables toolbar merge for a supported multi-cell selection', () => {
    const props = renderToolbar({ selectedIds: ['r1-B', 'r1-C'] })

    const mergeButton = document.querySelector<HTMLButtonElement>('button[aria-label="선택 셀 병합 또는 병합 해제"]')

    expect(mergeButton?.disabled).toBe(false)

    act(() => mergeButton!.click())

    expect(props.mergeSelection).toHaveBeenCalledTimes(1)
  })

  it('enables toolbar merge for a focused cell inside an existing merge', () => {
    const props = renderToolbar({
      focusKey: 'C2',
      selectedIds: [],
      sheet: { ...initialSheet, merges: [[1, 1, 1, 2]] },
    })

    const mergeButton = document.querySelector<HTMLButtonElement>('button[aria-label="선택 셀 병합 또는 병합 해제"]')

    expect(mergeButton?.disabled).toBe(false)

    act(() => mergeButton!.click())

    expect(props.mergeSelection).toHaveBeenCalledTimes(1)
  })

  it('disables toolbar sort buttons without a focused column', () => {
    renderToolbar({ focusKey: null, filter: null })

    const sortAsc = document.querySelector<HTMLButtonElement>('button[aria-label="현재 열 오름차순 정렬"]')
    const sortDesc = document.querySelector<HTMLButtonElement>('button[aria-label="현재 열 내림차순 정렬"]')

    expect(sortAsc?.textContent).toBe('↑정렬')
    expect(sortAsc?.disabled).toBe(true)
    expect(sortAsc?.getAttribute('title')).toBe('현재 열 오름차순 정렬')
    expect(sortDesc?.textContent).toBe('↓정렬')
    expect(sortDesc?.disabled).toBe(true)
    expect(sortDesc?.getAttribute('title')).toBe('현재 열 내림차순 정렬')
  })

  it('disables toolbar sort buttons when sorting cannot change a single-row sheet', () => {
    renderToolbar({ rowCount: 1, focusKey: 'B1', selectedIds: ['B1'], filter: null })

    const sortAsc = document.querySelector<HTMLButtonElement>('button[aria-label="B열 오름차순 정렬"]')
    const sortDesc = document.querySelector<HTMLButtonElement>('button[aria-label="B열 내림차순 정렬"]')

    expect(sortAsc?.textContent).toBe('↑정렬')
    expect(sortAsc?.disabled).toBe(true)
    expect(sortAsc?.getAttribute('title')).toBe('B열 오름차순 정렬')
    expect(sortDesc?.textContent).toBe('↓정렬')
    expect(sortDesc?.disabled).toBe(true)
    expect(sortDesc?.getAttribute('title')).toBe('B열 내림차순 정렬')
  })

  it('disables append buttons at sheet limits', () => {
    renderToolbar({ rowCount: MAX_ROW_COUNT, colCount: MAX_COL_COUNT })

    const appendRows = document.querySelector<HTMLButtonElement>(`button[aria-label="아래에 행 20개 추가 (현재 ${MAX_ROW_COUNT}행)"]`)
    const appendCols = document.querySelector<HTMLButtonElement>(`button[aria-label="오른쪽에 열 1개 추가 (현재 ${MAX_COL_COUNT}열)"]`)

    expect(appendRows?.textContent).toBe('+20행')
    expect(appendRows?.disabled).toBe(true)
    expect(appendRows?.getAttribute('title')).toBe(`아래에 행 20개 추가 (현재 ${MAX_ROW_COUNT}행)`)
    expect(appendCols?.textContent).toBe('+끝열')
    expect(appendCols?.disabled).toBe(true)
    expect(appendCols?.getAttribute('title')).toBe(`오른쪽에 열 1개 추가 (현재 ${MAX_COL_COUNT}열)`)
  })

  it('disables inactive freeze toggles when a single row or column cannot be meaningfully frozen', () => {
    renderToolbar({ rowCount: 1, colCount: 1, freeze: { rows: 0, cols: 0 } })

    const freezeRows = document.querySelector<HTMLButtonElement>('button[aria-label="첫 행 고정 토글 (현재 0행 고정)"]')
    const freezeCols = document.querySelector<HTMLButtonElement>('button[aria-label="첫 열 고정 토글 (현재 0열 고정)"]')

    expect(freezeRows?.textContent).toBe('📌행')
    expect(freezeRows?.disabled).toBe(true)
    expect(freezeRows?.getAttribute('title')).toBe('첫 행 고정 토글 (현재 0행 고정)')
    expect(freezeRows?.getAttribute('aria-pressed')).toBe('false')
    expect(freezeCols?.textContent).toBe('📌열')
    expect(freezeCols?.disabled).toBe(true)
    expect(freezeCols?.getAttribute('title')).toBe('첫 열 고정 토글 (현재 0열 고정)')
    expect(freezeCols?.getAttribute('aria-pressed')).toBe('false')
  })

  it('keeps active freeze toggles enabled on a single row or column so they can be cleared', () => {
    renderToolbar({ rowCount: 1, colCount: 1, freeze: { rows: 1, cols: 1 } })

    const freezeRows = document.querySelector<HTMLButtonElement>('button[aria-label="첫 행 고정 토글 (현재 1행 고정)"]')
    const freezeCols = document.querySelector<HTMLButtonElement>('button[aria-label="첫 열 고정 토글 (현재 1열 고정)"]')

    expect(freezeRows?.textContent).toBe('📌행')
    expect(freezeRows?.disabled).toBe(false)
    expect(freezeRows?.getAttribute('aria-pressed')).toBe('true')
    expect(freezeCols?.textContent).toBe('📌열')
    expect(freezeCols?.disabled).toBe(false)
    expect(freezeCols?.getAttribute('aria-pressed')).toBe('true')
  })

  it('disables AutoSum when no contiguous numeric range exists', () => {
    renderToolbar({
      focusKey: 'A1',
      selectedIds: ['A1'],
      display: () => '',
    })

    const autoSum = document.querySelector<HTMLButtonElement>('button[aria-label="자동 합계"]')

    expect(autoSum?.textContent).toBe('Σ')
    expect(autoSum?.disabled).toBe(true)
    expect(autoSum?.getAttribute('title')).toBe('자동 합계 (위쪽 연속 숫자 합)')
  })

  it('disables the overflow hyperlink command without a focused cell', () => {
    renderToolbar({ focusKey: null, selectedIds: ['B2'], filter: null })

    const trigger = document.querySelector<HTMLButtonElement>('.overflow-trigger')
    act(() => trigger!.click())

    const link = [...document.querySelectorAll<HTMLButtonElement>('.overflow-item')]
      .find((item) => item.textContent === '하이퍼링크 삽입 (Ctrl/⌘+K)')

    expect(link?.disabled).toBe(true)
    expect(link?.getAttribute('aria-keyshortcuts')).toBe('Control+K Meta+K')
  })

  it('disables toolbar filter setup without a focused column but keeps clearing available', () => {
    renderToolbar({ focusKey: null, selectedIds: [], filter: { col: 'B', text: 'needle' } })

    const filterButton = document.querySelector<HTMLButtonElement>('button[aria-label="B열 필터 수정"]')
    const clearFilter = document.querySelector<HTMLButtonElement>('button[aria-label="필터 해제"]')

    expect(filterButton?.textContent).toBe('🔽필터 B')
    expect(filterButton?.disabled).toBe(true)
    expect(filterButton?.getAttribute('title')).toBe('B열 필터 수정')
    expect(filterButton?.getAttribute('aria-pressed')).toBe('true')
    expect(clearFilter?.disabled).toBe(false)
  })

  it('disables toolbar filter setup on a single-row sheet but keeps clearing available', () => {
    renderToolbar({ rowCount: 1, focusKey: 'B1', selectedIds: ['B1'], filter: { col: 'B', text: 'needle' } })

    const filterButton = document.querySelector<HTMLButtonElement>('button[aria-label="B열 필터 수정"]')
    const clearFilter = document.querySelector<HTMLButtonElement>('button[aria-label="필터 해제"]')

    expect(filterButton?.textContent).toBe('🔽필터 B')
    expect(filterButton?.disabled).toBe(true)
    expect(filterButton?.getAttribute('title')).toBe('B열 필터 수정')
    expect(filterButton?.getAttribute('aria-pressed')).toBe('true')
    expect(clearFilter?.disabled).toBe(false)
  })

  it('disables validation commands without target cells', () => {
    renderToolbar({ focusKey: null, selectedIds: [], filter: null })

    const listValidation = document.querySelector<HTMLButtonElement>('button[aria-label="드롭다운 목록 유효성 검사 설정"]')
    const checkbox = document.querySelector<HTMLButtonElement>('button[aria-label="체크박스로 변환"]')

    expect(listValidation?.textContent).toBe('▾목록')
    expect(listValidation?.disabled).toBe(true)
    expect(listValidation?.getAttribute('title')).toBe('유효성 검사 (드롭다운 목록)')
    expect(checkbox?.textContent).toBe('☑체크')
    expect(checkbox?.disabled).toBe(true)
    expect(checkbox?.getAttribute('title')).toBe('체크박스로 변환')
  })

  it('keeps validation commands enabled for selected cells without focus', () => {
    renderToolbar({ focusKey: null, selectedIds: ['B2'], filter: null })

    const listValidation = document.querySelector<HTMLButtonElement>('button[aria-label="드롭다운 목록 유효성 검사 설정"]')
    const checkbox = document.querySelector<HTMLButtonElement>('button[aria-label="체크박스로 변환"]')

    expect(listValidation?.disabled).toBe(false)
    expect(checkbox?.disabled).toBe(false)
  })

  it('disables formatting controls without target cells', () => {
    renderToolbar({ focusKey: null, selectedIds: [], filter: null })

    const bold = document.querySelector<HTMLButtonElement>('button[aria-label="굵게"]')
    const leftAlign = document.querySelector<HTMLButtonElement>('button[aria-label="왼쪽 정렬"]')
    const bgColor = document.querySelector<HTMLInputElement>('input[aria-label="배경색 선택"]')
    const fgColor = document.querySelector<HTMLInputElement>('input[aria-label="글자색 선택"]')
    const clearFormat = document.querySelector<HTMLButtonElement>('button[aria-label="서식 모두 해제"]')
    const plainFormat = document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 일반"]')

    expect(bold?.textContent).toBe('B')
    expect(bold?.disabled).toBe(true)
    expect(bold?.getAttribute('title')).toBe('굵게 (Ctrl/⌘+B)')
    expect(leftAlign?.textContent).toBe('⇤')
    expect(leftAlign?.disabled).toBe(true)
    expect(bgColor?.disabled).toBe(true)
    expect(fgColor?.disabled).toBe(true)
    expect(clearFormat?.textContent).toBe('✕서식')
    expect(clearFormat?.disabled).toBe(true)
    expect(plainFormat?.textContent).toBe('123')
    expect(plainFormat?.disabled).toBe(true)
    expect(plainFormat?.getAttribute('title')).toBe('일반 (Ctrl/⌘+Shift+1)')
  })

  it('keeps formatting controls enabled for selected cells without focus', () => {
    renderToolbar({ focusKey: null, selectedIds: ['B2'], filter: null })

    expect(document.querySelector<HTMLButtonElement>('button[aria-label="굵게"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="왼쪽 정렬"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLInputElement>('input[aria-label="배경색 선택"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLInputElement>('input[aria-label="글자색 선택"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="서식 모두 해제"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 일반"]')?.disabled).toBe(false)
  })

  it('disables conditional format add without a focused column but keeps clearing available', () => {
    renderToolbar({ focusKey: null, selectedIds: ['B2'], filter: null })

    const addCondFormat = document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식 추가"]')
    const clearCondFormat = document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식 모두 해제"]')

    expect(addCondFormat?.textContent).toBe('🎨조건')
    expect(addCondFormat?.disabled).toBe(true)
    expect(addCondFormat?.getAttribute('title')).toBe('조건부 서식 추가')
    expect(clearCondFormat?.textContent).toBe('✕조건')
    expect(clearCondFormat?.disabled).toBe(false)
    expect(clearCondFormat?.getAttribute('title')).toBe('조건부 서식 모두 해제')
  })

  it('disables conditional format clear when no rules exist', () => {
    renderToolbar({ hasCondRules: false })

    const addCondFormat = document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식 추가"]')
    const clearCondFormat = document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식 모두 해제"]')

    expect(addCondFormat?.disabled).toBe(false)
    expect(clearCondFormat?.textContent).toBe('✕조건')
    expect(clearCondFormat?.disabled).toBe(true)
    expect(clearCondFormat?.getAttribute('title')).toBe('조건부 서식 모두 해제')
  })

  it('exposes structure shortcut hints without changing labels or wiring', () => {
    const props = renderToolbar()

    const insertRow = document.querySelector<HTMLButtonElement>('button[aria-label="2행 위에 행 삽입"]')
    const deleteRow = document.querySelector<HTMLButtonElement>('button[aria-label="2행 삭제"]')
    const insertCol = document.querySelector<HTMLButtonElement>('button[aria-label="B열 왼쪽에 열 삽입"]')
    const deleteCol = document.querySelector<HTMLButtonElement>('button[aria-label="B열 삭제"]')
    const showAll = document.querySelector<HTMLButtonElement>('button[aria-label="숨김 행과 열 모두 표시"]')

    expect(insertRow?.textContent).toBe('+행')
    expect(insertRow?.getAttribute('title')).toBe('2행 위에 행 삽입 (Ctrl/⌘+Alt+=)')
    expect(insertRow?.getAttribute('aria-keyshortcuts')).toBe('Control+Alt+= Meta+Alt+=')
    expect(deleteRow?.textContent).toBe('−행')
    expect(deleteRow?.getAttribute('title')).toBe('2행 삭제 (Ctrl/⌘+Alt+-)')
    expect(deleteRow?.getAttribute('aria-keyshortcuts')).toBe('Control+Alt+- Meta+Alt+-')

    expect(insertCol?.textContent).toBe('+열')
    expect(insertCol?.getAttribute('title')).toBe('B열 왼쪽에 열 삽입 (Ctrl/⌘+Alt+Shift+=)')
    expect(insertCol?.getAttribute('aria-keyshortcuts')).toBe('Control+Alt+Shift+= Meta+Alt+Shift+=')
    expect(deleteCol?.textContent).toBe('−열')
    expect(deleteCol?.getAttribute('title')).toBe('B열 삭제 (Ctrl/⌘+Alt+Shift+-)')
    expect(deleteCol?.getAttribute('aria-keyshortcuts')).toBe('Control+Alt+Shift+- Meta+Alt+Shift+-')

    expect(showAll?.textContent).toBe('👁모두표시')
    expect(showAll?.getAttribute('title')).toBe('숨김 행/열 모두 표시 (Ctrl/⌘+Shift+0)')
    expect(showAll?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+0 Meta+Shift+0')

    act(() => insertRow!.click())
    act(() => deleteRow!.click())
    act(() => insertCol!.click())
    act(() => deleteCol!.click())
    act(() => showAll!.click())

    expect(props.insertRow).toHaveBeenCalledWith(1)
    expect(props.deleteRow).toHaveBeenCalledWith(1)
    expect(props.insertCol).toHaveBeenCalledWith('B')
    expect(props.deleteCol).toHaveBeenCalledWith('B')
    expect(props.showAll).toHaveBeenCalledTimes(1)
  })
})
