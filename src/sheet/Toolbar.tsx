import { autoSumFormula } from '@spredsheet/grid'
import type { Format, FormatLookup } from './formatting/useFormats'
import type { SheetMutations } from './structure/sheetMutations'
import type { FreezeState, FreezeActions } from './visibility/useFreeze'
import type { CellStyle, StyleLookup } from './formatting/useStyles'
import type { Ask } from './usePrompt'
import type { CondActions } from './formatting/useCondFormat'
import type { Filter } from './visibility/useFilter'
import type { HiddenActions } from './visibility/useHidden'
import type { ValidationActions } from './validation/useValidation'
import { OverflowMenu, type OverflowProps } from './OverflowMenu'
import { CondFmtButtons } from './formatting/CondFmtButtons'
import { FormatButtons } from './formatting/FormatButtons'
import { StyleToggleButtons } from './formatting/StyleToggleButtons'
import { cellId, MAX_COL_COUNT, MAX_ROW_COUNT, parseA1 } from './schema'
import { canMergeSelection } from './structure/mergeSelection'
import {
  applyCheckboxValidation,
  applyToolbarFormat,
  applyToolbarAutoSum,
  clearToolbarStyle,
  promptListValidation,
  promptToolbarFilter,
  setToolbarAlignment,
  setToolbarColor,
  toggleToolbarStyle,
  type ToolbarStyleFlag,
} from './toolbarActions'
import { stopToolbarActivationKeyDown } from './toolbarKeyEvents'
import { activeToolbarStateStyle } from './toolbarStyles'

const toolbarCommandButtonProps = {
  type: 'button',
  onKeyDown: stopToolbarActivationKeyDown,
} as const

interface Props extends SheetMutations, OverflowProps, ValidationActions, CondActions, FreezeActions, Pick<HiddenActions, 'showAll'> {
  focusKey: string | null
  selectedIds: string[]
  setFormat: (keys: string[], f: Format) => void
  formatOf: FormatLookup
  updateStyle: (keys: string[], patch: Partial<CellStyle>) => void
  styleOf: StyleLookup
  freeze: FreezeState
  filter: Filter | null
  applyFilter: (col: string, text: string) => void
  clearFilter: () => void
  hasHidden: boolean
  hasCondRules: boolean
  ask: Ask
  undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean
  mergeSelection: () => void
  rowCount: number
  colCount: number
}

export function Toolbar({ display, writeCell, writeCells, writeCellRange, focusKey, selectedIds, setFormat, formatOf, insertRow, deleteRow, insertCol, deleteCol, appendRows, appendCols, sortByCol, updateStyle, styleOf, freeze, toggleFreezeRows, toggleFreezeCols, filter, applyFilter, clearFilter, hasHidden, showAll, setListRule, setCheckboxRule, clearRule, openHelp, insertLink, addCondRule, clearCondRules, hasCondRules, sheet, previewSheetReplacement, applySheetReplacement, clearCellValues, ask, confirm, undo, redo, canUndo, canRedo, showFormulas, toggleShowFormulas, showGridlines, toggleShowGridlines, clearAllFormats, mergeSelection, rowCount, colCount }: Props) {
  const focus = focusKey ? parseA1(focusKey) : null
  const focusRow = focus?.row
  const focusRowLabel = focusRow !== undefined ? `${focusRow + 1}행` : '현재 행'
  const focusColLabel = focus ? `${focus.col}열` : '현재 열'
  const insertRowTitle = `${focusRowLabel} 위에 행 삽입 (Ctrl/⌘+Alt+=)`
  const deleteRowTitle = `${focusRowLabel} 삭제 (Ctrl/⌘+Alt+-)`
  const insertColTitle = `${focusColLabel} 왼쪽에 열 삽입 (Ctrl/⌘+Alt+Shift+=)`
  const deleteColTitle = `${focusColLabel} 삭제 (Ctrl/⌘+Alt+Shift+-)`
  const appendRowsLabel = `아래에 행 20개 추가 (현재 ${rowCount}행)`
  const appendColsLabel = `오른쪽에 열 1개 추가 (현재 ${colCount}열)`
  const sortAscLabel = `${focusColLabel} 오름차순 정렬`
  const sortDescLabel = `${focusColLabel} 내림차순 정렬`
  const freezeRowsLabel = `첫 행 고정 토글 (현재 ${freeze.rows}행 고정)`
  const freezeColsLabel = `첫 열 고정 토글 (현재 ${freeze.cols}열 고정)`
  const filterLabel = filter ? `${filter.col}열 필터 수정` : '현재 열로 행 필터'
  const showAllTitle = '숨김 행/열 모두 표시 (Ctrl/⌘+Shift+0)'
  const hasCellTarget = selectedIds.length > 0 || !!focusKey
  const canAppendRows = rowCount < MAX_ROW_COUNT
  const canAppendCols = colCount < MAX_COL_COUNT
  const canSort = !!focus && rowCount > 1
  const canToggleFreezeRows = rowCount > 1 || freeze.rows > 0
  const canToggleFreezeCols = colCount > 1 || freeze.cols > 0
  const canOpenFilterPrompt = !!focus && rowCount > 1
  const canMerge = canMergeSelection(selectedIds, focus ? cellId(focus.col, focus.row) : null, sheet.merges)
  const canAutoSum = focus ? autoSumFormula(focus.col, focus.row, display) !== null : false
  const applyF = (format: Format) => applyToolbarFormat({ selectedIds, focusKey, format, setFormat })
  const toggle = (flag: ToolbarStyleFlag) => toggleToolbarStyle({ selectedIds, focusKey, flag, styleOf, updateStyle })
  const setAlign = (alignment: CellStyle['a']) => setToolbarAlignment({ selectedIds, focusKey, alignment, updateStyle })
  const setBg = (color: string) => setToolbarColor({ selectedIds, focusKey, target: 'bg', color, updateStyle })
  const setFg = (color: string) => setToolbarColor({ selectedIds, focusKey, target: 'fg', color, updateStyle })
  const clearStyle = () => clearToolbarStyle({ selectedIds, focusKey, updateStyle })
  const runAutoSum = () => applyToolbarAutoSum({ focusKey, display, writeCell })
  const openFilterPrompt = () => { void promptToolbarFilter({ ask, focusKey, filter, applyFilter, clearFilter }) }
  const openListValidationPrompt = () => { void promptListValidation({ ask, selectedIds, focusKey, setListRule, clearRule }) }
  const convertToCheckbox = () => applyCheckboxValidation({ selectedIds, focusKey, setCheckboxRule })

  return (
    <>
      <button {...toolbarCommandButtonProps} onClick={undo} disabled={!canUndo} title="실행 취소 (Ctrl/⌘+Z)" aria-keyshortcuts="Control+Z Meta+Z" aria-label="실행 취소">↶</button><button {...toolbarCommandButtonProps} onClick={redo} disabled={!canRedo} title="다시 실행 (Ctrl/⌘+Shift+Z)" aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z" aria-label="다시 실행">↷</button>
      <button {...toolbarCommandButtonProps} onClick={() => focusRow !== undefined && insertRow(focusRow)} disabled={focusRow === undefined} title={insertRowTitle} aria-label={`${focusRowLabel} 위에 행 삽입`} aria-keyshortcuts="Control+Alt+= Meta+Alt+=">+행</button><button {...toolbarCommandButtonProps} onClick={() => focusRow !== undefined && deleteRow(focusRow)} disabled={focusRow === undefined} title={deleteRowTitle} aria-label={`${focusRowLabel} 삭제`} aria-keyshortcuts="Control+Alt+- Meta+Alt+-">−행</button>
      <button {...toolbarCommandButtonProps} onClick={() => focus && insertCol(focus.col)} disabled={!focus} title={insertColTitle} aria-label={`${focusColLabel} 왼쪽에 열 삽입`} aria-keyshortcuts="Control+Alt+Shift+= Meta+Alt+Shift+=">+열</button><button {...toolbarCommandButtonProps} onClick={() => focus && deleteCol(focus.col)} disabled={!focus} title={deleteColTitle} aria-label={`${focusColLabel} 삭제`} aria-keyshortcuts="Control+Alt+Shift+- Meta+Alt+Shift+-">−열</button>
      <button {...toolbarCommandButtonProps} onClick={() => appendRows(20)} disabled={!canAppendRows} title={appendRowsLabel} aria-label={appendRowsLabel}>+20행</button><button {...toolbarCommandButtonProps} onClick={() => appendCols(1)} disabled={!canAppendCols} title={appendColsLabel} aria-label={appendColsLabel}>+끝열</button>
      <button {...toolbarCommandButtonProps} onClick={() => canSort && sortByCol(focus.col, 'asc')} disabled={!canSort} title={sortAscLabel} aria-label={sortAscLabel}>↑정렬</button><button {...toolbarCommandButtonProps} onClick={() => canSort && sortByCol(focus.col, 'desc')} disabled={!canSort} title={sortDescLabel} aria-label={sortDescLabel}>↓정렬</button>
      <button {...toolbarCommandButtonProps} onClick={runAutoSum} disabled={!canAutoSum} title="자동 합계 (위쪽 연속 숫자 합)" aria-label="자동 합계">Σ</button>
      <StyleToggleButtons toggle={toggle} styleOf={styleOf} focusKey={focusKey} disabled={!hasCellTarget} />
      <button {...toolbarCommandButtonProps} onClick={() => setAlign('left')} disabled={!hasCellTarget} aria-pressed={focusKey ? styleOf(focusKey)?.a === 'left' : false} title="왼쪽 정렬" aria-label="왼쪽 정렬">⇤</button>
      <button {...toolbarCommandButtonProps} onClick={() => setAlign('center')} disabled={!hasCellTarget} aria-pressed={focusKey ? styleOf(focusKey)?.a === 'center' : false} title="가운데 정렬" aria-label="가운데 정렬">⇔</button>
      <button {...toolbarCommandButtonProps} onClick={() => setAlign('right')} disabled={!hasCellTarget} aria-pressed={focusKey ? styleOf(focusKey)?.a === 'right' : false} title="오른쪽 정렬" aria-label="오른쪽 정렬">⇥</button>
      <label className="color-pick" title="배경색">🎨<input type="color" aria-label="배경색 선택" disabled={!hasCellTarget} onKeyDown={stopToolbarActivationKeyDown} onChange={(e) => setBg(e.target.value)} /></label>
      <label className="color-pick" title="글자색">A<input type="color" aria-label="글자색 선택" disabled={!hasCellTarget} onKeyDown={stopToolbarActivationKeyDown} onChange={(e) => setFg(e.target.value)} /></label>
      <button {...toolbarCommandButtonProps} onClick={clearStyle} disabled={!hasCellTarget} title="서식 모두 해제" aria-label="서식 모두 해제" aria-keyshortcuts={'Control+\\ Meta+\\'}>✕서식</button><button {...toolbarCommandButtonProps} onClick={() => canMerge && mergeSelection()} disabled={!canMerge} title="선택 셀 병합 / 병합 해제 (Alt+Shift+M)" aria-label="선택 셀 병합 또는 병합 해제" aria-keyshortcuts="Alt+Shift+M">⊞병합</button>
      <button {...toolbarCommandButtonProps} onClick={toggleFreezeRows} disabled={!canToggleFreezeRows} title={freezeRowsLabel} aria-label={freezeRowsLabel} aria-pressed={freeze.rows > 0} style={freeze.rows ? activeToolbarStateStyle : undefined}>📌행{freeze.rows > 1 ? `×${freeze.rows}` : ''}</button><button {...toolbarCommandButtonProps} onClick={toggleFreezeCols} disabled={!canToggleFreezeCols} title={freezeColsLabel} aria-label={freezeColsLabel} aria-pressed={freeze.cols > 0} style={freeze.cols ? activeToolbarStateStyle : undefined}>📌열{freeze.cols > 1 ? `×${freeze.cols}` : ''}</button>
      <button {...toolbarCommandButtonProps} onClick={openFilterPrompt} disabled={!canOpenFilterPrompt} title={filterLabel} aria-label={filterLabel} aria-pressed={!!filter} style={filter ? activeToolbarStateStyle : undefined}>🔽필터{filter ? ` ${filter.col}` : ''}</button>
      {filter && <button {...toolbarCommandButtonProps} onClick={clearFilter} title="필터 해제" aria-label="필터 해제">✕</button>}
      {hasHidden && <button {...toolbarCommandButtonProps} onClick={showAll} title={showAllTitle} aria-label="숨김 행과 열 모두 표시" aria-keyshortcuts="Control+Shift+0 Meta+Shift+0">👁모두표시</button>}
      <button {...toolbarCommandButtonProps} onClick={openListValidationPrompt} disabled={!hasCellTarget} title="유효성 검사 (드롭다운 목록)" aria-label="드롭다운 목록 유효성 검사 설정">▾목록</button>
      <button {...toolbarCommandButtonProps} onClick={convertToCheckbox} disabled={!hasCellTarget} title="체크박스로 변환" aria-label="체크박스로 변환">☑체크</button>
      <CondFmtButtons col={focus?.col ?? null} hasRules={hasCondRules} addCondRule={addCondRule} clearCondRules={clearCondRules} ask={ask} />
      <FormatButtons apply={applyF} current={focusKey ? formatOf(focusKey) : 'plain'} disabled={!hasCellTarget} />
      <OverflowMenu display={display} writeCell={writeCell} writeCells={writeCells} writeCellRange={writeCellRange} openHelp={openHelp} insertLink={insertLink} canInsertLink={!!focusKey} sheet={sheet} previewSheetReplacement={previewSheetReplacement} applySheetReplacement={applySheetReplacement} clearCellValues={clearCellValues} confirm={confirm} showFormulas={showFormulas} toggleShowFormulas={toggleShowFormulas} showGridlines={showGridlines} toggleShowGridlines={toggleShowGridlines} clearAllFormats={clearAllFormats} />
    </>
  )
}
