import { act, createElement, type ComponentProps, type KeyboardEventHandler } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { keyDown, setInputValue, setupReactDOM } from './test-utils'
import { DEFAULT_CELL_BACKGROUND_COLOR, DEFAULT_CELL_TEXT_COLOR, Toolbar } from './Toolbar'
import { initialSheet, MAX_COL_COUNT, MAX_ROW_COUNT } from './schema'

const toolbarActionMocks = vi.hoisted(() => ({
  applyCheckboxValidation: vi.fn(() => false),
  applyToolbarFormat: vi.fn(() => false),
  clearToolbarStyle: vi.fn(() => false),
  promptListValidation: vi.fn(() => Promise.resolve('cancelled')),
  promptToolbarFilter: vi.fn(() => Promise.resolve('cancelled')),
  setToolbarAlignment: vi.fn(() => false),
  setToolbarColor: vi.fn(() => false),
  toggleToolbarStyle: vi.fn(() => false),
}))

vi.mock('./toolbarActions', () => ({
  applyCheckboxValidation: toolbarActionMocks.applyCheckboxValidation,
  applyToolbarAutoSum: () => false,
  applyToolbarFormat: toolbarActionMocks.applyToolbarFormat,
  clearToolbarStyle: toolbarActionMocks.clearToolbarStyle,
  promptListValidation: toolbarActionMocks.promptListValidation,
  promptToolbarFilter: toolbarActionMocks.promptToolbarFilter,
  setToolbarAlignment: toolbarActionMocks.setToolbarAlignment,
  setToolbarColor: toolbarActionMocks.setToolbarColor,
  toggleToolbarStyle: toolbarActionMocks.toggleToolbarStyle,
}))

describe('Toolbar component', () => {
  const dom = setupReactDOM()

  const renderToolbar = (
    overrides: Partial<ComponentProps<typeof Toolbar>> = {},
    options: { onKeyDown?: KeyboardEventHandler<HTMLFormElement> } = {},
  ) => {
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

    act(() => dom.root.render(createElement('form', { onKeyDown: options.onKeyDown }, createElement(Toolbar, props))))
    return props
  }

  it('renders toolbar command buttons as non-submit controls', () => {
    renderToolbar()

    const buttons = [...document.querySelectorAll<HTMLButtonElement>('button')]

    expect(buttons.length).toBeGreaterThan(20)
    expect(buttons.every((button) => button.type === 'button')).toBe(true)
    const undoButton = document.querySelector<HTMLButtonElement>('button[aria-label="실행 취소"]')
    const redoButton = document.querySelector<HTMLButtonElement>('button[aria-label="다시 실행"]')
    expect(undoButton?.type).toBe('button')
    expect(undoButton?.disabled).toBe(false)
    expect(undoButton?.getAttribute('title')).toBe('실행 취소 (Ctrl/⌘+Z)')
    expect(undoButton?.getAttribute('aria-keyshortcuts')).toBe('Control+Z Meta+Z')
    expect(redoButton?.type).toBe('button')
    expect(redoButton?.disabled).toBe(false)
    expect(redoButton?.getAttribute('title')).toBe('다시 실행 (Ctrl/⌘+Shift+Z)')
    expect(redoButton?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+Z Meta+Shift+Z')
    const filterButton = document.querySelector<HTMLButtonElement>('button[aria-label="필터 켜짐, B열 필터: needle 수정"]')
    expect(filterButton?.type).toBe('button')
    expect(filterButton?.disabled).toBe(false)
    expect(filterButton?.getAttribute('title')).toBe('필터 켜짐, B열 필터: needle 수정')
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
    expect(autoSum?.getAttribute('aria-label')).toBe('자동 합계')
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
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="굵게 꺼짐"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="굵게 꺼짐"]')?.getAttribute('title')).toBe('굵게 꺼짐 (Ctrl/⌘+B)')
    const leftAlign = document.querySelector<HTMLButtonElement>('button[aria-label="왼쪽 정렬 꺼짐"]')
    const centerAlign = document.querySelector<HTMLButtonElement>('button[aria-label="가운데 정렬 꺼짐"]')
    const rightAlign = document.querySelector<HTMLButtonElement>('button[aria-label="오른쪽 정렬 꺼짐"]')
    expect(leftAlign?.textContent).toBe('⇤')
    expect(leftAlign?.disabled).toBe(false)
    expect(leftAlign?.getAttribute('aria-pressed')).toBe('false')
    expect(leftAlign?.getAttribute('title')).toBe('왼쪽 정렬 꺼짐')
    expect(centerAlign?.textContent).toBe('⇔')
    expect(centerAlign?.disabled).toBe(false)
    expect(centerAlign?.getAttribute('aria-pressed')).toBe('false')
    expect(centerAlign?.getAttribute('title')).toBe('가운데 정렬 꺼짐')
    expect(rightAlign?.textContent).toBe('⇥')
    expect(rightAlign?.disabled).toBe(false)
    expect(rightAlign?.getAttribute('aria-pressed')).toBe('false')
    expect(rightAlign?.getAttribute('title')).toBe('오른쪽 정렬 꺼짐')
    const defaultBgColor = document.querySelector<HTMLInputElement>('input[aria-label^="배경색 선택"]')
    const defaultFgColor = document.querySelector<HTMLInputElement>('input[aria-label^="글자색 선택"]')
    expect(defaultBgColor?.disabled).toBe(false)
    expect(defaultBgColor?.value).toBe(DEFAULT_CELL_BACKGROUND_COLOR)
    expect(defaultBgColor?.getAttribute('aria-label')).toBe(`배경색 선택 (현재 색상 ${DEFAULT_CELL_BACKGROUND_COLOR})`)
    expect(defaultFgColor?.disabled).toBe(false)
    expect(defaultFgColor?.value).toBe(DEFAULT_CELL_TEXT_COLOR)
    expect(defaultFgColor?.getAttribute('aria-label')).toBe(`글자색 선택 (현재 색상 ${DEFAULT_CELL_TEXT_COLOR})`)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 일반 켜짐"]')?.disabled).toBe(false)

    const mergeButton = document.querySelector<HTMLButtonElement>('button[aria-label="병합 가능한 셀 범위 없음"]')
    expect(mergeButton?.textContent).toBe('⊞병합')
    expect(mergeButton?.disabled).toBe(true)
    expect(mergeButton?.getAttribute('title')).toBe('병합 가능한 셀 범위 없음')
    expect(mergeButton?.getAttribute('aria-keyshortcuts')).toBe('Alt+Shift+M')

    expect(document.querySelector<HTMLButtonElement>('button[aria-label="드롭다운 목록 유효성 검사 설정"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="체크박스로 변환"]')?.disabled).toBe(false)
    const addCondFormat = document.querySelector<HTMLButtonElement>('button[aria-label="B열 조건부 서식 추가"]')
    expect(addCondFormat?.disabled).toBe(false)
    expect(addCondFormat?.getAttribute('title')).toBe('B열 조건부 서식 추가')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식 모두 해제"]')?.disabled).toBe(false)
  })

  it('clarifies disabled toolbar undo and redo labels', () => {
    renderToolbar({ canUndo: false, canRedo: false })

    const undoButton = document.querySelector<HTMLButtonElement>('button[aria-label="실행 취소할 작업 없음"]')
    const redoButton = document.querySelector<HTMLButtonElement>('button[aria-label="다시 실행할 작업 없음"]')

    expect(undoButton?.textContent).toBe('↶')
    expect(undoButton?.disabled).toBe(true)
    expect(undoButton?.getAttribute('title')).toBe('실행 취소할 작업 없음 (Ctrl/⌘+Z)')
    expect(undoButton?.getAttribute('aria-keyshortcuts')).toBe('Control+Z Meta+Z')
    expect(redoButton?.textContent).toBe('↷')
    expect(redoButton?.disabled).toBe(true)
    expect(redoButton?.getAttribute('title')).toBe('다시 실행할 작업 없음 (Ctrl/⌘+Shift+Z)')
    expect(redoButton?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+Z Meta+Shift+Z')
  })

  it('labels the active alignment button state', () => {
    renderToolbar({ styleOf: () => ({ a: 'center' }) })

    const leftAlign = document.querySelector<HTMLButtonElement>('button[aria-label="왼쪽 정렬 꺼짐"]')
    const centerAlign = document.querySelector<HTMLButtonElement>('button[aria-label="가운데 정렬 켜짐"]')
    const rightAlign = document.querySelector<HTMLButtonElement>('button[aria-label="오른쪽 정렬 꺼짐"]')

    expect(leftAlign?.getAttribute('aria-pressed')).toBe('false')
    expect(leftAlign?.getAttribute('title')).toBe('왼쪽 정렬 꺼짐')
    expect(centerAlign?.textContent).toBe('⇔')
    expect(centerAlign?.getAttribute('aria-pressed')).toBe('true')
    expect(centerAlign?.getAttribute('title')).toBe('가운데 정렬 켜짐')
    expect(rightAlign?.getAttribute('aria-pressed')).toBe('false')
    expect(rightAlign?.getAttribute('title')).toBe('오른쪽 정렬 꺼짐')
  })

  it('keeps toolbar color picker activation keys inside the color controls', () => {
    const parentKeys: string[] = []
    toolbarActionMocks.setToolbarColor.mockClear()

    renderToolbar({
      styleOf: () => ({ bg: '#ffeeaa', fg: '#001122' }),
    }, { onKeyDown: (event) => parentKeys.push(event.key) })

    const bgColor = document.querySelector<HTMLInputElement>('input[aria-label^="배경색 선택"]')
    const fgColor = document.querySelector<HTMLInputElement>('input[aria-label^="글자색 선택"]')

    expect(bgColor?.disabled).toBe(false)
    expect(bgColor?.value).toBe('#ffeeaa')
    expect(bgColor?.getAttribute('aria-label')).toBe('배경색 선택 (현재 색상 #ffeeaa)')
    expect(bgColor?.getAttribute('title')).toBe('배경색 선택 (현재 색상 #ffeeaa)')
    expect(fgColor?.disabled).toBe(false)
    expect(fgColor?.value).toBe('#001122')
    expect(fgColor?.getAttribute('aria-label')).toBe('글자색 선택 (현재 색상 #001122)')
    expect(fgColor?.getAttribute('title')).toBe('글자색 선택 (현재 색상 #001122)')

    act(() => keyDown(bgColor!, 'Enter'))
    act(() => keyDown(fgColor!, ' '))

    expect(parentKeys).toEqual([])

    act(() => setInputValue(bgColor!, '#ff0000'))
    act(() => setInputValue(fgColor!, '#00ff00'))

    expect(toolbarActionMocks.setToolbarColor).toHaveBeenCalledWith(expect.objectContaining({ target: 'bg', color: '#ff0000' }))
    expect(toolbarActionMocks.setToolbarColor).toHaveBeenCalledWith(expect.objectContaining({ target: 'fg', color: '#00ff00' }))
  })

  it('keeps toolbar formatting button activation keys inside the toolbar controls', async () => {
    const parentKeys: string[] = []
    const ask = vi.fn(() => Promise.resolve('>5 #ff0000'))
    toolbarActionMocks.applyToolbarFormat.mockClear()
    toolbarActionMocks.toggleToolbarStyle.mockClear()

    const props = renderToolbar({
      ask,
      formatOf: () => 'percent',
      styleOf: () => ({ b: true }),
    }, { onKeyDown: (event) => parentKeys.push(event.key) })

    const bold = document.querySelector<HTMLButtonElement>('button[aria-label="굵게 켜짐"]')
    const percent = document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 백분율 켜짐"]')
    const addCondFormat = document.querySelector<HTMLButtonElement>('button[aria-label="B열 조건부 서식 추가"]')
    const clearCondFormat = document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식 모두 해제"]')

    expect(bold?.disabled).toBe(false)
    expect(bold?.getAttribute('aria-pressed')).toBe('true')
    expect(bold?.getAttribute('title')).toBe('굵게 켜짐 (Ctrl/⌘+B)')
    expect(bold?.getAttribute('aria-keyshortcuts')).toBe('Control+B Meta+B')
    expect(percent?.disabled).toBe(false)
    expect(percent?.getAttribute('aria-pressed')).toBe('true')
    expect(percent?.getAttribute('title')).toBe('백분율 켜짐 (Ctrl/⌘+Shift+5)')
    expect(percent?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+5 Meta+Shift+5')
    expect(addCondFormat?.disabled).toBe(false)
    expect(addCondFormat?.getAttribute('title')).toBe('B열 조건부 서식 추가')
    expect(clearCondFormat?.disabled).toBe(false)

    act(() => keyDown(bold!, 'Enter'))
    act(() => keyDown(percent!, ' '))
    act(() => keyDown(addCondFormat!, 'Enter'))
    act(() => keyDown(clearCondFormat!, ' '))

    expect(parentKeys).toEqual([])

    act(() => bold!.click())
    act(() => percent!.click())
    await act(async () => {
      addCondFormat!.click()
      await Promise.resolve()
    })
    act(() => clearCondFormat!.click())

    expect(toolbarActionMocks.toggleToolbarStyle).toHaveBeenCalledWith(expect.objectContaining({ flag: 'b' }))
    expect(toolbarActionMocks.applyToolbarFormat).toHaveBeenCalledWith(expect.objectContaining({ format: 'percent' }))
    expect(props.addCondRule).toHaveBeenCalledWith({ col: 'B', op: '>', value: '5', color: '#ff0000' })
    expect(props.clearCondRules).toHaveBeenCalledTimes(1)
  })

  it('keeps direct toolbar command activation keys inside the toolbar controls', async () => {
    const parentKeys: string[] = []
    toolbarActionMocks.applyCheckboxValidation.mockClear()
    toolbarActionMocks.clearToolbarStyle.mockClear()
    toolbarActionMocks.promptListValidation.mockClear()
    toolbarActionMocks.promptToolbarFilter.mockClear()
    toolbarActionMocks.setToolbarAlignment.mockClear()

    const props = renderToolbar({
      selectedIds: ['r1-B', 'r1-C'],
      sheet: { ...initialSheet, merges: [] },
      freeze: { rows: 1, cols: 0 },
    }, { onKeyDown: (event) => parentKeys.push(event.key) })

    const directButtons = [
      document.querySelector<HTMLButtonElement>('button[aria-label="실행 취소"]'),
      document.querySelector<HTMLButtonElement>('button[aria-label="2행 위에 행 삽입"]'),
      document.querySelector<HTMLButtonElement>('button[aria-label="B열 오름차순 정렬"]'),
      document.querySelector<HTMLButtonElement>('button[aria-label="왼쪽 정렬 꺼짐"]'),
      document.querySelector<HTMLButtonElement>('button[aria-label="서식 모두 해제"]'),
      document.querySelector<HTMLButtonElement>('button[aria-label="선택 셀 병합 또는 병합 해제"]'),
      document.querySelector<HTMLButtonElement>('button[aria-label="첫 행 고정 토글 켜짐 (현재 1행 고정)"]'),
      document.querySelector<HTMLButtonElement>('button[aria-label="필터 켜짐, B열 필터: needle 수정"]'),
      document.querySelector<HTMLButtonElement>('button[aria-label="B열 필터: needle 해제"]'),
      document.querySelector<HTMLButtonElement>('button[aria-label="숨김 행과 열 모두 표시"]'),
      document.querySelector<HTMLButtonElement>('button[aria-label="드롭다운 목록 유효성 검사 설정"]'),
      document.querySelector<HTMLButtonElement>('button[aria-label="체크박스로 변환"]'),
    ]

    for (const [index, button] of directButtons.entries()) {
      expect(button?.disabled).toBe(false)
      act(() => keyDown(button!, index % 2 === 0 ? 'Enter' : ' '))
    }

    expect(parentKeys).toEqual([])

    act(() => directButtons[0]!.click())
    act(() => directButtons[1]!.click())
    act(() => directButtons[2]!.click())
    act(() => directButtons[3]!.click())
    act(() => directButtons[4]!.click())
    act(() => directButtons[5]!.click())
    act(() => directButtons[6]!.click())
    await act(async () => {
      directButtons[7]!.click()
      await Promise.resolve()
    })
    act(() => directButtons[8]!.click())
    act(() => directButtons[9]!.click())
    await act(async () => {
      directButtons[10]!.click()
      await Promise.resolve()
    })
    act(() => directButtons[11]!.click())

    expect(props.undo).toHaveBeenCalledTimes(1)
    expect(props.insertRow).toHaveBeenCalledWith(1)
    expect(props.sortByCol).toHaveBeenCalledWith('B', 'asc')
    expect(toolbarActionMocks.setToolbarAlignment).toHaveBeenCalledWith(expect.objectContaining({ alignment: 'left' }))
    expect(toolbarActionMocks.clearToolbarStyle).toHaveBeenCalledTimes(1)
    expect(props.mergeSelection).toHaveBeenCalledTimes(1)
    expect(props.toggleFreezeRows).toHaveBeenCalledTimes(1)
    expect(toolbarActionMocks.promptToolbarFilter).toHaveBeenCalledTimes(1)
    expect(props.clearFilter).toHaveBeenCalledTimes(1)
    expect(props.showAll).toHaveBeenCalledTimes(1)
    expect(toolbarActionMocks.promptListValidation).toHaveBeenCalledTimes(1)
    expect(toolbarActionMocks.applyCheckboxValidation).toHaveBeenCalledTimes(1)
  })

  it('disables toolbar merge for a single unmerged focused cell', () => {
    const props = renderToolbar()

    const mergeButton = document.querySelector<HTMLButtonElement>('button[aria-label="병합 가능한 셀 범위 없음"]')

    expect(mergeButton?.textContent).toBe('⊞병합')
    expect(mergeButton?.disabled).toBe(true)
    expect(mergeButton?.getAttribute('title')).toBe('병합 가능한 셀 범위 없음')
    expect(mergeButton?.getAttribute('aria-keyshortcuts')).toBe('Alt+Shift+M')

    act(() => mergeButton!.click())

    expect(props.mergeSelection).not.toHaveBeenCalled()
  })

  it('disables toolbar merge for unsupported multi-row selections', () => {
    renderToolbar({ focusKey: null, selectedIds: ['r1-B', 'r1-C', 'r2-B', 'r2-C'] })

    const mergeButton = document.querySelector<HTMLButtonElement>('button[aria-label="병합 가능한 셀 범위 없음"]')

    expect(mergeButton?.textContent).toBe('⊞병합')
    expect(mergeButton?.disabled).toBe(true)
    expect(mergeButton?.getAttribute('title')).toBe('병합 가능한 셀 범위 없음')
    expect(mergeButton?.getAttribute('aria-keyshortcuts')).toBe('Alt+Shift+M')
  })

  it('enables toolbar merge for a supported multi-cell selection', () => {
    const props = renderToolbar({ selectedIds: ['r1-B', 'r1-C'] })

    const mergeButton = document.querySelector<HTMLButtonElement>('button[aria-label="선택 셀 병합 또는 병합 해제"]')

    expect(mergeButton?.disabled).toBe(false)
    expect(mergeButton?.getAttribute('title')).toBe('선택 셀 병합 / 병합 해제 (Alt+Shift+M)')
    expect(mergeButton?.getAttribute('aria-keyshortcuts')).toBe('Alt+Shift+M')

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

    const sortAsc = document.querySelector<HTMLButtonElement>('button[aria-label="오름차순 정렬할 열 없음"]')
    const sortDesc = document.querySelector<HTMLButtonElement>('button[aria-label="내림차순 정렬할 열 없음"]')

    expect(sortAsc?.textContent).toBe('↑정렬')
    expect(sortAsc?.disabled).toBe(true)
    expect(sortAsc?.getAttribute('title')).toBe('오름차순 정렬할 열 없음')
    expect(sortDesc?.textContent).toBe('↓정렬')
    expect(sortDesc?.disabled).toBe(true)
    expect(sortDesc?.getAttribute('title')).toBe('내림차순 정렬할 열 없음')
  })

  it('disables toolbar sort buttons when sorting cannot change a single-row sheet', () => {
    renderToolbar({ rowCount: 1, focusKey: 'B1', selectedIds: ['B1'], filter: null })

    const sortAsc = document.querySelector<HTMLButtonElement>('button[aria-label="B열 오름차순 정렬할 데이터 행 없음"]')
    const sortDesc = document.querySelector<HTMLButtonElement>('button[aria-label="B열 내림차순 정렬할 데이터 행 없음"]')

    expect(sortAsc?.textContent).toBe('↑정렬')
    expect(sortAsc?.disabled).toBe(true)
    expect(sortAsc?.getAttribute('title')).toBe('B열 오름차순 정렬할 데이터 행 없음')
    expect(sortDesc?.textContent).toBe('↓정렬')
    expect(sortDesc?.disabled).toBe(true)
    expect(sortDesc?.getAttribute('title')).toBe('B열 내림차순 정렬할 데이터 행 없음')
  })

  it('disables append buttons at sheet limits', () => {
    renderToolbar({ rowCount: MAX_ROW_COUNT, colCount: MAX_COL_COUNT })

    const appendRows = document.querySelector<HTMLButtonElement>(`button[aria-label="행 최대 개수 도달 (현재 ${MAX_ROW_COUNT}행)"]`)
    const appendCols = document.querySelector<HTMLButtonElement>(`button[aria-label="열 최대 개수 도달 (현재 ${MAX_COL_COUNT}열)"]`)

    expect(appendRows?.textContent).toBe('+20행')
    expect(appendRows?.disabled).toBe(true)
    expect(appendRows?.getAttribute('title')).toBe(`행 최대 개수 도달 (현재 ${MAX_ROW_COUNT}행)`)
    expect(appendCols?.textContent).toBe('+끝열')
    expect(appendCols?.disabled).toBe(true)
    expect(appendCols?.getAttribute('title')).toBe(`열 최대 개수 도달 (현재 ${MAX_COL_COUNT}열)`)
  })

  it('disables inactive freeze toggles when a single row or column cannot be meaningfully frozen', () => {
    renderToolbar({ rowCount: 1, colCount: 1, freeze: { rows: 0, cols: 0 } })

    const freezeRows = document.querySelector<HTMLButtonElement>('button[aria-label="첫 행 고정 토글 꺼짐 (현재 0행 고정)"]')
    const freezeCols = document.querySelector<HTMLButtonElement>('button[aria-label="첫 열 고정 토글 꺼짐 (현재 0열 고정)"]')

    expect(freezeRows?.textContent).toBe('📌행')
    expect(freezeRows?.disabled).toBe(true)
    expect(freezeRows?.getAttribute('title')).toBe('첫 행 고정 토글 꺼짐 (현재 0행 고정)')
    expect(freezeRows?.getAttribute('aria-pressed')).toBe('false')
    expect(freezeCols?.textContent).toBe('📌열')
    expect(freezeCols?.disabled).toBe(true)
    expect(freezeCols?.getAttribute('title')).toBe('첫 열 고정 토글 꺼짐 (현재 0열 고정)')
    expect(freezeCols?.getAttribute('aria-pressed')).toBe('false')
  })

  it('keeps active freeze toggles enabled on a single row or column so they can be cleared', () => {
    renderToolbar({ rowCount: 1, colCount: 1, freeze: { rows: 1, cols: 1 } })

    const freezeRows = document.querySelector<HTMLButtonElement>('button[aria-label="첫 행 고정 토글 켜짐 (현재 1행 고정)"]')
    const freezeCols = document.querySelector<HTMLButtonElement>('button[aria-label="첫 열 고정 토글 켜짐 (현재 1열 고정)"]')

    expect(freezeRows?.textContent).toBe('📌행')
    expect(freezeRows?.disabled).toBe(false)
    expect(freezeRows?.getAttribute('aria-pressed')).toBe('true')
    expect(freezeRows?.getAttribute('title')).toBe('첫 행 고정 토글 켜짐 (현재 1행 고정)')
    expect(freezeCols?.textContent).toBe('📌열')
    expect(freezeCols?.disabled).toBe(false)
    expect(freezeCols?.getAttribute('aria-pressed')).toBe('true')
    expect(freezeCols?.getAttribute('title')).toBe('첫 열 고정 토글 켜짐 (현재 1열 고정)')
  })

  it('disables AutoSum when no contiguous numeric range exists', () => {
    renderToolbar({
      focusKey: 'A1',
      selectedIds: ['A1'],
      display: () => '',
    })

    const autoSum = document.querySelector<HTMLButtonElement>('button[aria-label="자동 합계할 숫자 범위 없음"]')

    expect(autoSum?.textContent).toBe('Σ')
    expect(autoSum?.disabled).toBe(true)
    expect(autoSum?.getAttribute('title')).toBe('자동 합계할 숫자 범위 없음')
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

    const filterButton = document.querySelector<HTMLButtonElement>('button[aria-label="필터 켜짐, B열 필터: needle, 수정할 열 없음"]')
    const clearFilter = document.querySelector<HTMLButtonElement>('button[aria-label="B열 필터: needle 해제"]')

    expect(filterButton?.textContent).toBe('🔽필터 B')
    expect(filterButton?.disabled).toBe(true)
    expect(filterButton?.getAttribute('title')).toBe('필터 켜짐, B열 필터: needle, 수정할 열 없음')
    expect(filterButton?.getAttribute('aria-pressed')).toBe('true')
    expect(clearFilter?.disabled).toBe(false)
    expect(clearFilter?.getAttribute('title')).toBe('B열 필터: needle 해제')
  })

  it('disables toolbar filter setup without a focused column or active filter', () => {
    renderToolbar({ focusKey: null, selectedIds: [], filter: null })

    const filterButton = document.querySelector<HTMLButtonElement>('button[aria-label="필터 꺼짐, 필터를 적용할 열 없음"]')

    expect(filterButton?.textContent).toBe('🔽필터')
    expect(filterButton?.disabled).toBe(true)
    expect(filterButton?.getAttribute('title')).toBe('필터 꺼짐, 필터를 적용할 열 없음')
    expect(filterButton?.getAttribute('aria-pressed')).toBe('false')
  })

  it('labels an enabled inactive filter setup as off', () => {
    renderToolbar({ focusKey: 'B2', selectedIds: ['B2'], filter: null })

    const filterButton = document.querySelector<HTMLButtonElement>('button[aria-label="필터 꺼짐, 현재 열로 행 필터"]')

    expect(filterButton?.textContent).toBe('🔽필터')
    expect(filterButton?.disabled).toBe(false)
    expect(filterButton?.getAttribute('title')).toBe('필터 꺼짐, 현재 열로 행 필터')
    expect(filterButton?.getAttribute('aria-pressed')).toBe('false')
  })

  it('disables toolbar filter setup on a single-row sheet but keeps clearing available', () => {
    renderToolbar({ rowCount: 1, focusKey: 'B1', selectedIds: ['B1'], filter: { col: 'B', text: 'needle' } })

    const filterButton = document.querySelector<HTMLButtonElement>('button[aria-label="필터 켜짐, B열 필터: needle, 수정할 데이터 행 없음"]')
    const clearFilter = document.querySelector<HTMLButtonElement>('button[aria-label="B열 필터: needle 해제"]')

    expect(filterButton?.textContent).toBe('🔽필터 B')
    expect(filterButton?.disabled).toBe(true)
    expect(filterButton?.getAttribute('title')).toBe('필터 켜짐, B열 필터: needle, 수정할 데이터 행 없음')
    expect(filterButton?.getAttribute('aria-pressed')).toBe('true')
    expect(clearFilter?.disabled).toBe(false)
    expect(clearFilter?.getAttribute('title')).toBe('B열 필터: needle 해제')
  })

  it('disables toolbar filter setup on a single-row sheet without an active filter', () => {
    renderToolbar({ rowCount: 1, focusKey: 'B1', selectedIds: ['B1'], filter: null })

    const filterButton = document.querySelector<HTMLButtonElement>('button[aria-label="필터 꺼짐, B열에 필터할 데이터 행 없음"]')

    expect(filterButton?.textContent).toBe('🔽필터')
    expect(filterButton?.disabled).toBe(true)
    expect(filterButton?.getAttribute('title')).toBe('필터 꺼짐, B열에 필터할 데이터 행 없음')
    expect(filterButton?.getAttribute('aria-pressed')).toBe('false')
  })

  it('disables validation commands without target cells', () => {
    renderToolbar({ focusKey: null, selectedIds: [], filter: null })

    const listValidation = document.querySelector<HTMLButtonElement>('button[aria-label="드롭다운 목록을 설정할 셀 없음"]')
    const checkbox = document.querySelector<HTMLButtonElement>('button[aria-label="체크박스로 변환할 셀 없음"]')

    expect(listValidation?.textContent).toBe('▾목록')
    expect(listValidation?.disabled).toBe(true)
    expect(listValidation?.getAttribute('title')).toBe('드롭다운 목록을 설정할 셀 없음')
    expect(checkbox?.textContent).toBe('☑체크')
    expect(checkbox?.disabled).toBe(true)
    expect(checkbox?.getAttribute('title')).toBe('체크박스로 변환할 셀 없음')
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

    const bold = document.querySelector<HTMLButtonElement>('button[aria-label="굵게 적용할 셀 없음"]')
    const italic = document.querySelector<HTMLButtonElement>('button[aria-label="기울임 적용할 셀 없음"]')
    const underline = document.querySelector<HTMLButtonElement>('button[aria-label="밑줄 적용할 셀 없음"]')
    const strike = document.querySelector<HTMLButtonElement>('button[aria-label="취소선 적용할 셀 없음"]')
    const wrap = document.querySelector<HTMLButtonElement>('button[aria-label="텍스트 줄바꿈할 셀 없음"]')
    const border = document.querySelector<HTMLButtonElement>('button[aria-label="셀 테두리 설정할 셀 없음"]')
    const leftAlign = document.querySelector<HTMLButtonElement>('button[aria-label="왼쪽 정렬할 셀 없음"]')
    const centerAlign = document.querySelector<HTMLButtonElement>('button[aria-label="가운데 정렬할 셀 없음"]')
    const rightAlign = document.querySelector<HTMLButtonElement>('button[aria-label="오른쪽 정렬할 셀 없음"]')
    const bgColor = document.querySelector<HTMLInputElement>('input[aria-label="배경색을 적용할 셀 없음"]')
    const fgColor = document.querySelector<HTMLInputElement>('input[aria-label="글자색을 적용할 셀 없음"]')
    const clearFormat = document.querySelector<HTMLButtonElement>('button[aria-label="서식을 해제할 셀 없음"]')
    const plainFormat = document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 일반 적용할 셀 없음"]')
    const percentFormat = document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 백분율 적용할 셀 없음"]')
    const eurFormat = document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: EUR 적용할 셀 없음"]')

    expect(bold?.textContent).toBe('B')
    expect(bold?.disabled).toBe(true)
    expect(bold?.getAttribute('title')).toBe('굵게 적용할 셀 없음 (Ctrl/⌘+B)')
    expect(bold?.getAttribute('aria-keyshortcuts')).toBe('Control+B Meta+B')
    expect(italic?.textContent).toBe('I')
    expect(italic?.disabled).toBe(true)
    expect(italic?.getAttribute('title')).toBe('기울임 적용할 셀 없음 (Ctrl/⌘+I)')
    expect(italic?.getAttribute('aria-keyshortcuts')).toBe('Control+I Meta+I')
    expect(underline?.textContent).toBe('U')
    expect(underline?.disabled).toBe(true)
    expect(underline?.getAttribute('title')).toBe('밑줄 적용할 셀 없음 (Ctrl/⌘+U)')
    expect(underline?.getAttribute('aria-keyshortcuts')).toBe('Control+U Meta+U')
    expect(strike?.textContent).toBe('S')
    expect(strike?.disabled).toBe(true)
    expect(strike?.getAttribute('title')).toBe('취소선 적용할 셀 없음 (Alt+Shift+5)')
    expect(strike?.getAttribute('aria-keyshortcuts')).toBe('Alt+Shift+5')
    expect(wrap?.textContent).toBe('↵줄')
    expect(wrap?.disabled).toBe(true)
    expect(wrap?.getAttribute('title')).toBe('텍스트 줄바꿈할 셀 없음')
    expect(wrap?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(border?.textContent).toBe('▢')
    expect(border?.disabled).toBe(true)
    expect(border?.getAttribute('title')).toBe('셀 테두리 설정할 셀 없음')
    expect(border?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(leftAlign?.textContent).toBe('⇤')
    expect(leftAlign?.disabled).toBe(true)
    expect(leftAlign?.getAttribute('title')).toBe('왼쪽 정렬할 셀 없음')
    expect(centerAlign?.textContent).toBe('⇔')
    expect(centerAlign?.disabled).toBe(true)
    expect(centerAlign?.getAttribute('title')).toBe('가운데 정렬할 셀 없음')
    expect(rightAlign?.textContent).toBe('⇥')
    expect(rightAlign?.disabled).toBe(true)
    expect(rightAlign?.getAttribute('title')).toBe('오른쪽 정렬할 셀 없음')
    expect(bgColor?.disabled).toBe(true)
    expect(bgColor?.getAttribute('title')).toBe('배경색을 적용할 셀 없음')
    expect(fgColor?.disabled).toBe(true)
    expect(fgColor?.getAttribute('title')).toBe('글자색을 적용할 셀 없음')
    expect(clearFormat?.textContent).toBe('✕서식')
    expect(clearFormat?.disabled).toBe(true)
    expect(clearFormat?.getAttribute('title')).toBe('서식을 해제할 셀 없음')
    expect(clearFormat?.getAttribute('aria-keyshortcuts')).toBe('Control+\\ Meta+\\')
    expect(plainFormat?.textContent).toBe('123')
    expect(plainFormat?.disabled).toBe(true)
    expect(plainFormat?.getAttribute('title')).toBe('일반 적용할 셀 없음 (Ctrl/⌘+Shift+1)')
    expect(plainFormat?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+1 Meta+Shift+1')
    expect(percentFormat?.textContent).toBe('%')
    expect(percentFormat?.disabled).toBe(true)
    expect(percentFormat?.getAttribute('title')).toBe('백분율 적용할 셀 없음 (Ctrl/⌘+Shift+5)')
    expect(percentFormat?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+5 Meta+Shift+5')
    expect(eurFormat?.textContent).toBe('€')
    expect(eurFormat?.disabled).toBe(true)
    expect(eurFormat?.getAttribute('title')).toBe('EUR 적용할 셀 없음')
    expect(eurFormat?.hasAttribute('aria-keyshortcuts')).toBe(false)
  })

  it('keeps formatting controls enabled for selected cells without focus', () => {
    renderToolbar({ focusKey: null, selectedIds: ['B2'], filter: null })

    expect(document.querySelector<HTMLButtonElement>('button[aria-label="굵게 꺼짐"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="왼쪽 정렬 꺼짐"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLInputElement>('input[aria-label^="배경색 선택"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLInputElement>('input[aria-label^="글자색 선택"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="서식 모두 해제"]')?.disabled).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 일반 켜짐"]')?.disabled).toBe(false)
  })

  it('disables conditional format add without a focused column but keeps clearing available', () => {
    renderToolbar({ focusKey: null, selectedIds: ['B2'], filter: null })

    const addCondFormat = document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식을 추가할 열 없음"]')
    const clearCondFormat = document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식 모두 해제"]')

    expect(addCondFormat?.textContent).toBe('🎨조건')
    expect(addCondFormat?.disabled).toBe(true)
    expect(addCondFormat?.getAttribute('title')).toBe('조건부 서식을 추가할 열 없음')
    expect(clearCondFormat?.textContent).toBe('✕조건')
    expect(clearCondFormat?.disabled).toBe(false)
    expect(clearCondFormat?.getAttribute('title')).toBe('조건부 서식 모두 해제')
  })

  it('disables conditional format clear when no rules exist', () => {
    renderToolbar({ hasCondRules: false })

    const addCondFormat = document.querySelector<HTMLButtonElement>('button[aria-label="B열 조건부 서식 추가"]')
    const clearCondFormat = document.querySelector<HTMLButtonElement>('button[aria-label="해제할 조건부 서식 없음"]')

    expect(addCondFormat?.disabled).toBe(false)
    expect(addCondFormat?.getAttribute('title')).toBe('B열 조건부 서식 추가')
    expect(clearCondFormat?.textContent).toBe('✕조건')
    expect(clearCondFormat?.disabled).toBe(true)
    expect(clearCondFormat?.getAttribute('title')).toBe('해제할 조건부 서식 없음')
  })

  it('clarifies disabled structure command labels without focus', () => {
    const props = renderToolbar({ focusKey: null, selectedIds: [], filter: null })

    const insertRow = document.querySelector<HTMLButtonElement>('button[aria-label="삽입할 기준 행 없음"]')
    const deleteRow = document.querySelector<HTMLButtonElement>('button[aria-label="삭제할 행 없음"]')
    const insertCol = document.querySelector<HTMLButtonElement>('button[aria-label="삽입할 기준 열 없음"]')
    const deleteCol = document.querySelector<HTMLButtonElement>('button[aria-label="삭제할 열 없음"]')

    expect(insertRow?.textContent).toBe('+행')
    expect(insertRow?.disabled).toBe(true)
    expect(insertRow?.getAttribute('title')).toBe('삽입할 기준 행 없음 (Ctrl/⌘+Alt+=)')
    expect(insertRow?.getAttribute('aria-keyshortcuts')).toBe('Control+Alt+= Meta+Alt+=')
    expect(deleteRow?.textContent).toBe('−행')
    expect(deleteRow?.disabled).toBe(true)
    expect(deleteRow?.getAttribute('title')).toBe('삭제할 행 없음 (Ctrl/⌘+Alt+-)')
    expect(deleteRow?.getAttribute('aria-keyshortcuts')).toBe('Control+Alt+- Meta+Alt+-')

    expect(insertCol?.textContent).toBe('+열')
    expect(insertCol?.disabled).toBe(true)
    expect(insertCol?.getAttribute('title')).toBe('삽입할 기준 열 없음 (Ctrl/⌘+Alt+Shift+=)')
    expect(insertCol?.getAttribute('aria-keyshortcuts')).toBe('Control+Alt+Shift+= Meta+Alt+Shift+=')
    expect(deleteCol?.textContent).toBe('−열')
    expect(deleteCol?.disabled).toBe(true)
    expect(deleteCol?.getAttribute('title')).toBe('삭제할 열 없음 (Ctrl/⌘+Alt+Shift+-)')
    expect(deleteCol?.getAttribute('aria-keyshortcuts')).toBe('Control+Alt+Shift+- Meta+Alt+Shift+-')

    act(() => insertRow!.click())
    act(() => deleteRow!.click())
    act(() => insertCol!.click())
    act(() => deleteCol!.click())

    expect(props.insertRow).not.toHaveBeenCalled()
    expect(props.deleteRow).not.toHaveBeenCalled()
    expect(props.insertCol).not.toHaveBeenCalled()
    expect(props.deleteCol).not.toHaveBeenCalled()
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
