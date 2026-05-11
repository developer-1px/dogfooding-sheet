import type { Format, FormatLookup } from './useFormats'
import type { SheetMutations } from './sheetMutations'
import type { FreezeState } from './useFreeze'
import { CLEAR_STYLE, type CellStyle, type StyleLookup } from './useStyles'
import type { Ask } from './usePrompt'
import type { CondRule } from './useCondFormat'
import type { Filter } from './useFilter'
import type { Confirm } from './useConfirm'
import { OverflowMenu } from './OverflowMenu'
import { CondFmtButtons } from './CondFmtButtons'
import { FormatButtons } from './FormatButtons'
import { StyleToggleButtons } from './StyleToggleButtons'
import { autoSumFormula } from '../lib/autoSum'
import { cellIdToKey, cellKey, parseA1, type Cells, type Writes, type WriteCell, type WriteMany, type Display } from './schema'

interface Props extends SheetMutations {
  display: Display
  writeCell: WriteCell; writeCells: WriteMany
  focusKey: string | null
  selectedIds: string[]
  setFormat: (keys: string[], f: Format) => void
  formatOf: FormatLookup
  updateStyle: (keys: string[], patch: Partial<CellStyle>) => void
  styleOf: StyleLookup
  freeze: FreezeState
  toggleFreezeRows: () => void
  toggleFreezeCols: () => void
  filter: Filter | null
  applyFilter: (col: string, text: string) => void
  clearFilter: () => void
  hasHidden: boolean
  showAll: () => void
  setListRule: (keys: string[], options: string[]) => void
  setCheckboxRule: (keys: string[]) => void
  clearRule: (keys: string[]) => void
  openHelp: () => void
  insertLink: () => void
  addCondRule: (r: CondRule) => void
  clearCondRules: () => void
  sheet: import('./schema').Sheet
  resetSheet: (s: import('./schema').Sheet) => void
  resetCells: (c: Cells) => void
  ask: Ask
  confirm: Confirm
  undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean
  showFormulas: boolean; toggleShowFormulas: () => void
  showGridlines: boolean; toggleShowGridlines: () => void
  clearAllFormats: () => void
  mergeSelection: () => void
}

export function Toolbar({ display, writeCell, writeCells, focusKey, selectedIds, setFormat, formatOf, insertRow, deleteRow, insertCol, deleteCol, sortByCol, updateStyle, styleOf, freeze, toggleFreezeRows, toggleFreezeCols, filter, applyFilter, clearFilter, hasHidden, showAll, setListRule, setCheckboxRule, clearRule, openHelp, insertLink, addCondRule, clearCondRules, sheet, resetSheet, resetCells, ask, confirm, undo, redo, canUndo, canRedo, showFormulas, toggleShowFormulas, showGridlines, toggleShowGridlines, clearAllFormats, mergeSelection }: Props) {
  const focus = focusKey ? parseA1(focusKey) : null
  const focusRow = focus ? focus.row : 0
  const targetKeys = (): string[] => (selectedIds.length > 0 ? selectedIds : focusKey ? [focusKey] : []).map((id) => id.includes('-') ? cellIdToKey(id) : id)
  const applyF = (f: Format) => setFormat(targetKeys(), f)
  const toggle = (k: 'b' | 'i' | 'u' | 's' | 'w' | 'bd') => updateStyle(targetKeys(), { [k]: !(focusKey && styleOf(focusKey)?.[k]) })
  const setAlign = (a: CellStyle['a']) => updateStyle(targetKeys(), { a })

  return (
    <>
      <button onClick={undo} disabled={!canUndo} title="실행 취소 (Ctrl/⌘+Z)" aria-keyshortcuts="Control+Z Meta+Z" aria-label="실행 취소">↶</button><button onClick={redo} disabled={!canRedo} title="다시 실행 (Ctrl/⌘+Shift+Z)" aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z" aria-label="다시 실행">↷</button>
      <button onClick={() => insertRow(focusRow)} title="위에 행 삽입">+행</button><button onClick={() => deleteRow(focusRow)} title="현재 행 삭제">−행</button>
      <button onClick={() => focus && insertCol(focus.col)} title="왼쪽에 열 삽입">+열</button><button onClick={() => focus && deleteCol(focus.col)} title="현재 열 삭제">−열</button>
      <button onClick={() => focus && sortByCol(focus.col, 'asc')} title="오름차순 정렬">↑정렬</button><button onClick={() => focus && sortByCol(focus.col, 'desc')} title="내림차순 정렬">↓정렬</button>
      <button onClick={() => { const f = focus && autoSumFormula(focus.col, focusRow, display); if (f && focus) writeCell(cellKey(focus.col, focusRow), f) }} title="자동 합계 (위쪽 연속 숫자 합)">Σ</button>
      <StyleToggleButtons toggle={toggle} styleOf={styleOf} focusKey={focusKey} />
      <button onClick={() => setAlign('left')} aria-pressed={focusKey ? styleOf(focusKey)?.a === 'left' : false} title="왼쪽 정렬">⇤</button>
      <button onClick={() => setAlign('center')} aria-pressed={focusKey ? styleOf(focusKey)?.a === 'center' : false} title="가운데 정렬">⇔</button>
      <button onClick={() => setAlign('right')} aria-pressed={focusKey ? styleOf(focusKey)?.a === 'right' : false} title="오른쪽 정렬">⇥</button>
      <label className="color-pick" title="배경색">🎨<input type="color" onChange={(e) => updateStyle(targetKeys(), { bg: e.target.value })} /></label>
      <label className="color-pick" title="글자색">A<input type="color" onChange={(e) => updateStyle(targetKeys(), { fg: e.target.value })} /></label>
      <button onClick={() => updateStyle(targetKeys(), CLEAR_STYLE)} title="서식 모두 해제">✕서식</button><button onClick={mergeSelection} disabled={selectedIds.length < 2 && !focusKey} title="선택 셀 병합 / 병합 해제 (Alt+Shift+M)">⊞병합</button>
      <button onClick={toggleFreezeRows} title={`첫 행 고정 토글 (현재 ${freeze.rows}행 고정)`} style={freeze.rows ? { background: '#e8f0fe' } : undefined}>📌행{freeze.rows > 1 ? `×${freeze.rows}` : ''}</button><button onClick={toggleFreezeCols} title={`첫 열 고정 토글 (현재 ${freeze.cols}열 고정)`} style={freeze.cols ? { background: '#e8f0fe' } : undefined}>📌열{freeze.cols > 1 ? `×${freeze.cols}` : ''}</button>
      <button onClick={() => {
        if (!focus) return
        const col = focus.col
        ask({ label: `${col}열에서 찾을 값`, initial: filter?.text ?? '', submitLabel: '필터' }).then((t) => {
          if (t === null) return
          if (t === '') clearFilter(); else applyFilter(col, t)
        })
      }} title="현재 열로 행 필터" style={filter ? { background: '#e8f0fe' } : undefined}>🔽필터{filter ? ` ${filter.col}` : ''}</button>
      {filter && <button onClick={clearFilter} title="필터 해제">✕</button>}
      {hasHidden && <button onClick={showAll} title="숨김 행/열 모두 표시">👁모두표시</button>}
      <button onClick={() => {
        const keys = targetKeys(); if (keys.length === 0) return
        ask({ label: '허용 값 (쉼표 구분, 비우면 해제)', submitLabel: '적용' }).then((csv) => {
          if (csv === null) return
          const opts = csv.split(',').map((s) => s.trim()).filter(Boolean)
          if (opts.length === 0) clearRule(keys); else setListRule(keys, opts)
        })
      }} title="유효성 검사 (드롭다운 목록)">▾목록</button>
      <button onClick={() => { const keys = targetKeys(); if (keys.length) setCheckboxRule(keys) }} title="체크박스로 변환">☑체크</button>
      <CondFmtButtons col={focus?.col ?? null} addCondRule={addCondRule} clearCondRules={clearCondRules} ask={ask} />
      <FormatButtons apply={applyF} current={focusKey ? formatOf(focusKey) : 'plain'} />
      <OverflowMenu display={display} writeCell={writeCell} writeCells={writeCells} openHelp={openHelp} insertLink={insertLink} sheet={sheet} resetSheet={resetSheet} resetCells={resetCells} confirm={confirm} showFormulas={showFormulas} toggleShowFormulas={toggleShowFormulas} showGridlines={showGridlines} toggleShowGridlines={toggleShowGridlines} clearAllFormats={clearAllFormats} />
    </>
  )
}
