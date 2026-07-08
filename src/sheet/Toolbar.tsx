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
import { cellId, cellIdToKey, MAX_COL_COUNT, MAX_ROW_COUNT, parseA1 } from './schema'
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
export const DEFAULT_CELL_BACKGROUND_COLOR = '#ffffff'
export const DEFAULT_CELL_TEXT_COLOR = '#000000'
const colorInputValue = (color: string | undefined, fallback: string): string => {
  if (!color) return fallback
  const hex = color.slice(1)
  if (hex.length === 3 || hex.length === 4) return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase()
  if (hex.length === 6 || hex.length === 8) return `#${hex.slice(0, 6)}`.toLowerCase()
  return fallback
}

const cellTargetLabel = (selectedIds: string[], focusKey: string | null): string => {
  if (selectedIds.length > 1) return `선택 셀 ${selectedIds.length}개`
  if (focusKey) return focusKey
  return selectedIds[0] ? cellIdToKey(selectedIds[0]) : '선택 셀'
}

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
  condRuleCount: number
  ask: Ask
  undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean
  mergeSelection: () => void
  rowCount: number
  colCount: number
}

export function Toolbar({ display, writeCell, writeCells, writeCellRange, focusKey, selectedIds, setFormat, formatOf, insertRow, deleteRow, insertCol, deleteCol, appendRows, appendCols, sortByCol, updateStyle, styleOf, freeze, toggleFreezeRows, toggleFreezeCols, filter, applyFilter, clearFilter, hasHidden, showAll, setListRule, setCheckboxRule, clearRule, openHelp, insertLink, addCondRule, clearCondRules, condRuleCount, sheet, previewSheetReplacement, applySheetReplacement, clearCellValues, ask, confirm, undo, redo, canUndo, canRedo, showFormulas, toggleShowFormulas, showGridlines, toggleShowGridlines, clearAllFormats, mergeSelection, rowCount, colCount }: Props) {
  const focus = focusKey ? parseA1(focusKey) : null
  const focusRow = focus?.row
  const hasFocusedRow = focusRow !== undefined
  const hasFocusedCol = !!focus
  const focusRowLabel = focusRow !== undefined ? `${focusRow + 1}행` : '현재 행'
  const focusColLabel = focus ? `${focus.col}열` : '현재 열'
  const insertRowLabel = hasFocusedRow ? `${focusRowLabel} 위에 행 삽입` : '삽입할 기준 행 없음'
  const deleteRowLabel = hasFocusedRow ? `${focusRowLabel} 삭제` : '삭제할 행 없음'
  const insertColLabel = hasFocusedCol ? `${focusColLabel} 왼쪽에 열 삽입` : '삽입할 기준 열 없음'
  const deleteColLabel = hasFocusedCol ? `${focusColLabel} 삭제` : '삭제할 열 없음'
  const insertRowTitle = `${insertRowLabel} (Ctrl/⌘+Alt+=)`
  const deleteRowTitle = `${deleteRowLabel} (Ctrl/⌘+Alt+-)`
  const insertColTitle = `${insertColLabel} (Ctrl/⌘+Alt+Shift+=)`
  const deleteColTitle = `${deleteColLabel} (Ctrl/⌘+Alt+Shift+-)`
  const canAppendRows = rowCount < MAX_ROW_COUNT
  const canAppendCols = colCount < MAX_COL_COUNT
  const appendRowsLabel = canAppendRows ? `아래에 행 20개 추가 (현재 ${rowCount}행)` : `행 최대 개수 도달 (현재 ${rowCount}행)`
  const appendColsLabel = canAppendCols ? `오른쪽에 열 1개 추가 (현재 ${colCount}열)` : `열 최대 개수 도달 (현재 ${colCount}열)`
  const sortAscLabel = !focus
    ? '오름차순 정렬할 열 없음'
    : rowCount <= 1
      ? `${focus.col}열 오름차순 정렬할 데이터 행 없음`
      : `${focus.col}열 오름차순 정렬`
  const sortDescLabel = !focus
    ? '내림차순 정렬할 열 없음'
    : rowCount <= 1
      ? `${focus.col}열 내림차순 정렬할 데이터 행 없음`
      : `${focus.col}열 내림차순 정렬`
  const freezeRowsPressed = freeze.rows > 0
  const freezeColsPressed = freeze.cols > 0
  const freezeRowsLabel = `첫 행 고정 토글 ${freezeRowsPressed ? '켜짐' : '꺼짐'} (현재 ${freeze.rows}행 고정)`
  const freezeColsLabel = `첫 열 고정 토글 ${freezeColsPressed ? '켜짐' : '꺼짐'} (현재 ${freeze.cols}열 고정)`
  const filterStateLabel = filter ? '필터 켜짐' : '필터 꺼짐'
  const filterCriteriaLabel = filter ? `${filter.col}열 필터: ${filter.text}` : null
  const filterActionLabel = filterCriteriaLabel ? `${filterStateLabel}, ${filterCriteriaLabel} 수정` : `${filterStateLabel}, 현재 열로 행 필터`
  const clearFilterLabel = filterCriteriaLabel ? `${filterCriteriaLabel} 해제` : '필터 해제'
  const showAllTitle = '숨김 행/열 모두 표시 (Ctrl/⌘+Shift+0)'
  const undoLabel = canUndo ? '실행 취소' : '실행 취소할 작업 없음'
  const redoLabel = canRedo ? '다시 실행' : '다시 실행할 작업 없음'
  const focusedStyle = focusKey ? styleOf(focusKey) : undefined
  const bgColorValue = colorInputValue(focusedStyle?.bg, DEFAULT_CELL_BACKGROUND_COLOR)
  const fgColorValue = colorInputValue(focusedStyle?.fg, DEFAULT_CELL_TEXT_COLOR)
  const hasCellTarget = selectedIds.length > 0 || !!focusKey
  const cellTarget = cellTargetLabel(selectedIds, focusKey)
  const bgColorLabel = hasCellTarget ? `${cellTarget} 배경색 선택 (현재 색상 ${focusedStyle?.bg ?? bgColorValue})` : '배경색을 적용할 셀 없음'
  const fgColorLabel = hasCellTarget ? `${cellTarget} 글자색 선택 (현재 색상 ${focusedStyle?.fg ?? fgColorValue})` : '글자색을 적용할 셀 없음'
  const listValidationLabel = hasCellTarget ? `${cellTarget} 드롭다운 목록 유효성 검사 설정` : '드롭다운 목록을 설정할 셀 없음'
  const listValidationTitle = listValidationLabel
  const checkboxLabel = hasCellTarget ? `${cellTarget} 체크박스로 변환` : '체크박스로 변환할 셀 없음'
  const leftAlignPressed = focusedStyle?.a === 'left'
  const centerAlignPressed = focusedStyle?.a === 'center'
  const rightAlignPressed = focusedStyle?.a === 'right'
  const leftAlignLabel = hasCellTarget ? `${cellTarget} 왼쪽 정렬 ${leftAlignPressed ? '켜짐' : '꺼짐'}` : '왼쪽 정렬할 셀 없음'
  const centerAlignLabel = hasCellTarget ? `${cellTarget} 가운데 정렬 ${centerAlignPressed ? '켜짐' : '꺼짐'}` : '가운데 정렬할 셀 없음'
  const rightAlignLabel = hasCellTarget ? `${cellTarget} 오른쪽 정렬 ${rightAlignPressed ? '켜짐' : '꺼짐'}` : '오른쪽 정렬할 셀 없음'
  const clearFormatLabel = hasCellTarget ? `${cellTarget} 서식 모두 해제` : '서식을 해제할 셀 없음'
  const canSort = !!focus && rowCount > 1
  const canToggleFreezeRows = rowCount > 1 || freeze.rows > 0
  const canToggleFreezeCols = colCount > 1 || freeze.cols > 0
  const canOpenFilterPrompt = !!focus && rowCount > 1
  const filterColumnLabel = filter?.col ?? focus?.col ?? '현재'
  const disabledFilterLabel = !focus
    ? filterCriteriaLabel
      ? `${filterStateLabel}, ${filterCriteriaLabel}, 수정할 열 없음`
      : `${filterStateLabel}, 필터를 적용할 열 없음`
    : rowCount <= 1
      ? filterCriteriaLabel
        ? `${filterStateLabel}, ${filterCriteriaLabel}, 수정할 데이터 행 없음`
        : `${filterStateLabel}, ${filterColumnLabel}열에 필터할 데이터 행 없음`
      : filterActionLabel
  const filterLabel = canOpenFilterPrompt ? filterActionLabel : disabledFilterLabel
  const canMerge = canMergeSelection(selectedIds, focus ? cellId(focus.col, focus.row) : null, sheet.merges)
  const mergeTarget = cellTarget
  const mergeLabel = canMerge
    ? selectedIds.length > 1
      ? `${mergeTarget} 병합 또는 병합 해제`
      : `${mergeTarget} 병합 해제`
    : '병합 가능한 셀 범위 없음'
  const mergeTitle = canMerge ? `${mergeLabel} (Alt+Shift+M)` : mergeLabel
  const canAutoSum = focus ? autoSumFormula(focus.col, focus.row, display) !== null : false
  const autoSumLabel = canAutoSum && focusKey ? `${focusKey}에 자동 합계` : '자동 합계할 숫자 범위 없음'
  const autoSumTitle = canAutoSum && focusKey ? `${autoSumLabel} (위쪽 연속 숫자 합)` : autoSumLabel
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
      <button {...toolbarCommandButtonProps} onClick={undo} disabled={!canUndo} title={`${undoLabel} (Ctrl/⌘+Z)`} aria-keyshortcuts="Control+Z Meta+Z" aria-label={undoLabel}>↶</button><button {...toolbarCommandButtonProps} onClick={redo} disabled={!canRedo} title={`${redoLabel} (Ctrl/⌘+Shift+Z)`} aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z" aria-label={redoLabel}>↷</button>
      <button {...toolbarCommandButtonProps} onClick={() => focusRow !== undefined && insertRow(focusRow)} disabled={!hasFocusedRow} title={insertRowTitle} aria-label={insertRowLabel} aria-keyshortcuts="Control+Alt+= Meta+Alt+=">+행</button><button {...toolbarCommandButtonProps} onClick={() => focusRow !== undefined && deleteRow(focusRow)} disabled={!hasFocusedRow} title={deleteRowTitle} aria-label={deleteRowLabel} aria-keyshortcuts="Control+Alt+- Meta+Alt+-">−행</button>
      <button {...toolbarCommandButtonProps} onClick={() => focus && insertCol(focus.col)} disabled={!hasFocusedCol} title={insertColTitle} aria-label={insertColLabel} aria-keyshortcuts="Control+Alt+Shift+= Meta+Alt+Shift+=">+열</button><button {...toolbarCommandButtonProps} onClick={() => focus && deleteCol(focus.col)} disabled={!hasFocusedCol} title={deleteColTitle} aria-label={deleteColLabel} aria-keyshortcuts="Control+Alt+Shift+- Meta+Alt+Shift+-">−열</button>
      <button {...toolbarCommandButtonProps} onClick={() => appendRows(20)} disabled={!canAppendRows} title={appendRowsLabel} aria-label={appendRowsLabel}>+20행</button><button {...toolbarCommandButtonProps} onClick={() => appendCols(1)} disabled={!canAppendCols} title={appendColsLabel} aria-label={appendColsLabel}>+끝열</button>
      <button {...toolbarCommandButtonProps} onClick={() => canSort && sortByCol(focus.col, 'asc')} disabled={!canSort} title={sortAscLabel} aria-label={sortAscLabel}>↑정렬</button><button {...toolbarCommandButtonProps} onClick={() => canSort && sortByCol(focus.col, 'desc')} disabled={!canSort} title={sortDescLabel} aria-label={sortDescLabel}>↓정렬</button>
      <button {...toolbarCommandButtonProps} onClick={runAutoSum} disabled={!canAutoSum} title={autoSumTitle} aria-label={autoSumLabel}>Σ</button>
      <StyleToggleButtons toggle={toggle} styleOf={styleOf} focusKey={focusKey} targetLabel={cellTarget} disabled={!hasCellTarget} />
      <button {...toolbarCommandButtonProps} onClick={() => setAlign('left')} disabled={!hasCellTarget} aria-pressed={leftAlignPressed} title={leftAlignLabel} aria-label={leftAlignLabel}>⇤</button>
      <button {...toolbarCommandButtonProps} onClick={() => setAlign('center')} disabled={!hasCellTarget} aria-pressed={centerAlignPressed} title={centerAlignLabel} aria-label={centerAlignLabel}>⇔</button>
      <button {...toolbarCommandButtonProps} onClick={() => setAlign('right')} disabled={!hasCellTarget} aria-pressed={rightAlignPressed} title={rightAlignLabel} aria-label={rightAlignLabel}>⇥</button>
      <label className="color-pick" title={bgColorLabel}>🎨<input type="color" value={bgColorValue} title={bgColorLabel} aria-label={bgColorLabel} disabled={!hasCellTarget} onKeyDown={stopToolbarActivationKeyDown} onChange={(e) => setBg(e.target.value)} /></label>
      <label className="color-pick" title={fgColorLabel}>A<input type="color" value={fgColorValue} title={fgColorLabel} aria-label={fgColorLabel} disabled={!hasCellTarget} onKeyDown={stopToolbarActivationKeyDown} onChange={(e) => setFg(e.target.value)} /></label>
      <button {...toolbarCommandButtonProps} onClick={clearStyle} disabled={!hasCellTarget} title={clearFormatLabel} aria-label={clearFormatLabel} aria-keyshortcuts={'Control+\\ Meta+\\'}>✕서식</button><button {...toolbarCommandButtonProps} onClick={() => canMerge && mergeSelection()} disabled={!canMerge} title={mergeTitle} aria-label={mergeLabel} aria-keyshortcuts="Alt+Shift+M">⊞병합</button>
      <button {...toolbarCommandButtonProps} onClick={toggleFreezeRows} disabled={!canToggleFreezeRows} title={freezeRowsLabel} aria-label={freezeRowsLabel} aria-pressed={freezeRowsPressed} style={freezeRowsPressed ? activeToolbarStateStyle : undefined}>📌행{freeze.rows > 1 ? `×${freeze.rows}` : ''}</button><button {...toolbarCommandButtonProps} onClick={toggleFreezeCols} disabled={!canToggleFreezeCols} title={freezeColsLabel} aria-label={freezeColsLabel} aria-pressed={freezeColsPressed} style={freezeColsPressed ? activeToolbarStateStyle : undefined}>📌열{freeze.cols > 1 ? `×${freeze.cols}` : ''}</button>
      <button {...toolbarCommandButtonProps} onClick={openFilterPrompt} disabled={!canOpenFilterPrompt} title={filterLabel} aria-label={filterLabel} aria-pressed={!!filter} style={filter ? activeToolbarStateStyle : undefined}>🔽필터{filter ? ` ${filter.col}` : ''}</button>
      {filter && <button {...toolbarCommandButtonProps} onClick={clearFilter} title={clearFilterLabel} aria-label={clearFilterLabel}>✕</button>}
      {hasHidden && <button {...toolbarCommandButtonProps} onClick={showAll} title={showAllTitle} aria-label="숨김 행과 열 모두 표시" aria-keyshortcuts="Control+Shift+0 Meta+Shift+0">👁모두표시</button>}
      <button {...toolbarCommandButtonProps} onClick={openListValidationPrompt} disabled={!hasCellTarget} title={listValidationTitle} aria-label={listValidationLabel}>▾목록</button>
      <button {...toolbarCommandButtonProps} onClick={convertToCheckbox} disabled={!hasCellTarget} title={checkboxLabel} aria-label={checkboxLabel}>☑체크</button>
      <CondFmtButtons col={focus?.col ?? null} ruleCount={condRuleCount} addCondRule={addCondRule} clearCondRules={clearCondRules} ask={ask} />
      <FormatButtons apply={applyF} current={focusKey ? formatOf(focusKey) : 'plain'} targetLabel={cellTarget} disabled={!hasCellTarget} />
      <OverflowMenu display={display} writeCell={writeCell} writeCells={writeCells} writeCellRange={writeCellRange} openHelp={openHelp} insertLink={insertLink} canInsertLink={!!focusKey} sheet={sheet} previewSheetReplacement={previewSheetReplacement} applySheetReplacement={applySheetReplacement} clearCellValues={clearCellValues} confirm={confirm} showFormulas={showFormulas} toggleShowFormulas={toggleShowFormulas} showGridlines={showGridlines} toggleShowGridlines={toggleShowGridlines} clearAllFormats={clearAllFormats} />
    </>
  )
}
