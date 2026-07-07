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
import { parseA1 } from './schema'
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
  ask: Ask
  undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean
  mergeSelection: () => void
  rowCount: number
  colCount: number
}

export function Toolbar({ display, writeCell, writeCells, writeCellRange, focusKey, selectedIds, setFormat, formatOf, insertRow, deleteRow, insertCol, deleteCol, appendRows, appendCols, sortByCol, updateStyle, styleOf, freeze, toggleFreezeRows, toggleFreezeCols, filter, applyFilter, clearFilter, hasHidden, showAll, setListRule, setCheckboxRule, clearRule, openHelp, insertLink, addCondRule, clearCondRules, sheet, previewSheetReplacement, applySheetReplacement, clearCellValues, ask, confirm, undo, redo, canUndo, canRedo, showFormulas, toggleShowFormulas, showGridlines, toggleShowGridlines, clearAllFormats, mergeSelection, rowCount, colCount }: Props) {
  const focus = focusKey ? parseA1(focusKey) : null
  const focusRow = focus?.row
  const focusRowLabel = focusRow !== undefined ? `${focusRow + 1}행` : '현재 행'
  const focusColLabel = focus ? `${focus.col}열` : '현재 열'
  const appendRowsLabel = `아래에 행 20개 추가 (현재 ${rowCount}행)`
  const appendColsLabel = `오른쪽에 열 1개 추가 (현재 ${colCount}열)`
  const freezeRowsLabel = `첫 행 고정 토글 (현재 ${freeze.rows}행 고정)`
  const freezeColsLabel = `첫 열 고정 토글 (현재 ${freeze.cols}열 고정)`
  const filterLabel = filter ? `${filter.col}열 필터 수정` : '현재 열로 행 필터'
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
      <button onClick={undo} disabled={!canUndo} title="실행 취소 (Ctrl/⌘+Z)" aria-keyshortcuts="Control+Z Meta+Z" aria-label="실행 취소">↶</button><button onClick={redo} disabled={!canRedo} title="다시 실행 (Ctrl/⌘+Shift+Z)" aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z" aria-label="다시 실행">↷</button>
      <button onClick={() => focusRow !== undefined && insertRow(focusRow)} disabled={focusRow === undefined} title={`${focusRowLabel} 위에 행 삽입`} aria-label={`${focusRowLabel} 위에 행 삽입`}>+행</button><button onClick={() => focusRow !== undefined && deleteRow(focusRow)} disabled={focusRow === undefined} title={`${focusRowLabel} 삭제`} aria-label={`${focusRowLabel} 삭제`}>−행</button>
      <button onClick={() => focus && insertCol(focus.col)} disabled={!focus} title={`${focusColLabel} 왼쪽에 열 삽입`} aria-label={`${focusColLabel} 왼쪽에 열 삽입`}>+열</button><button onClick={() => focus && deleteCol(focus.col)} disabled={!focus} title={`${focusColLabel} 삭제`} aria-label={`${focusColLabel} 삭제`}>−열</button>
      <button onClick={() => appendRows(20)} title={appendRowsLabel} aria-label={appendRowsLabel}>+20행</button><button onClick={() => appendCols(1)} title={appendColsLabel} aria-label={appendColsLabel}>+끝열</button>
      <button onClick={() => focus && sortByCol(focus.col, 'asc')} title="오름차순 정렬" aria-label="오름차순 정렬">↑정렬</button><button onClick={() => focus && sortByCol(focus.col, 'desc')} title="내림차순 정렬" aria-label="내림차순 정렬">↓정렬</button>
      <button onClick={runAutoSum} disabled={!focus} title="자동 합계 (위쪽 연속 숫자 합)" aria-label="자동 합계">Σ</button>
      <StyleToggleButtons toggle={toggle} styleOf={styleOf} focusKey={focusKey} />
      <button onClick={() => setAlign('left')} aria-pressed={focusKey ? styleOf(focusKey)?.a === 'left' : false} title="왼쪽 정렬" aria-label="왼쪽 정렬">⇤</button>
      <button onClick={() => setAlign('center')} aria-pressed={focusKey ? styleOf(focusKey)?.a === 'center' : false} title="가운데 정렬" aria-label="가운데 정렬">⇔</button>
      <button onClick={() => setAlign('right')} aria-pressed={focusKey ? styleOf(focusKey)?.a === 'right' : false} title="오른쪽 정렬" aria-label="오른쪽 정렬">⇥</button>
      <label className="color-pick" title="배경색">🎨<input type="color" aria-label="배경색 선택" onChange={(e) => setBg(e.target.value)} /></label>
      <label className="color-pick" title="글자색">A<input type="color" aria-label="글자색 선택" onChange={(e) => setFg(e.target.value)} /></label>
      <button onClick={clearStyle} title="서식 모두 해제" aria-label="서식 모두 해제">✕서식</button><button onClick={mergeSelection} disabled={selectedIds.length < 2 && !focusKey} title="선택 셀 병합 / 병합 해제 (Alt+Shift+M)" aria-label="선택 셀 병합 또는 병합 해제">⊞병합</button>
      <button onClick={toggleFreezeRows} title={freezeRowsLabel} aria-label={freezeRowsLabel} aria-pressed={freeze.rows > 0} style={freeze.rows ? { background: '#e8f0fe' } : undefined}>📌행{freeze.rows > 1 ? `×${freeze.rows}` : ''}</button><button onClick={toggleFreezeCols} title={freezeColsLabel} aria-label={freezeColsLabel} aria-pressed={freeze.cols > 0} style={freeze.cols ? { background: '#e8f0fe' } : undefined}>📌열{freeze.cols > 1 ? `×${freeze.cols}` : ''}</button>
      <button onClick={openFilterPrompt} title="현재 열로 행 필터" aria-label={filterLabel} aria-pressed={!!filter} style={filter ? { background: '#e8f0fe' } : undefined}>🔽필터{filter ? ` ${filter.col}` : ''}</button>
      {filter && <button onClick={clearFilter} title="필터 해제" aria-label="필터 해제">✕</button>}
      {hasHidden && <button onClick={showAll} title="숨김 행/열 모두 표시" aria-label="숨김 행과 열 모두 표시">👁모두표시</button>}
      <button onClick={openListValidationPrompt} title="유효성 검사 (드롭다운 목록)" aria-label="드롭다운 목록 유효성 검사 설정">▾목록</button>
      <button onClick={convertToCheckbox} title="체크박스로 변환" aria-label="체크박스로 변환">☑체크</button>
      <CondFmtButtons col={focus?.col ?? null} addCondRule={addCondRule} clearCondRules={clearCondRules} ask={ask} />
      <FormatButtons apply={applyF} current={focusKey ? formatOf(focusKey) : 'plain'} />
      <OverflowMenu display={display} writeCell={writeCell} writeCells={writeCells} writeCellRange={writeCellRange} openHelp={openHelp} insertLink={insertLink} sheet={sheet} previewSheetReplacement={previewSheetReplacement} applySheetReplacement={applySheetReplacement} clearCellValues={clearCellValues} confirm={confirm} showFormulas={showFormulas} toggleShowFormulas={toggleShowFormulas} showGridlines={showGridlines} toggleShowGridlines={toggleShowGridlines} clearAllFormats={clearAllFormats} />
    </>
  )
}
