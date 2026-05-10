import type { Format } from './useFormats'
import type { CellStyle } from './useStyles'
import type { PromptOptions } from './usePrompt'
import type { ConfirmOptions } from './useConfirm'
import { OverflowMenu } from './OverflowMenu'
import { CondFmtButtons } from './CondFmtButtons'
import { FormatButtons } from './FormatButtons'
import { autoSumFormula } from '../lib/autoSum'
import { cellIdToKey } from '../lib/a1'

interface Props {
  display: (k: string) => string
  writeCell: (k: string, v: string) => void
  focusKey: string | null
  selectedIds: string[]
  setFormat: (keys: string[], f: Format) => void
  formatOf: (k: string) => Format
  insertRow: (atRow: number) => void
  deleteRow: (atRow: number) => void
  insertCol: (col: string) => void
  deleteCol: (col: string) => void
  sortByCol: (col: string, dir: 'asc' | 'desc') => void
  updateStyle: (keys: string[], patch: Partial<CellStyle>) => void
  styleOf: (k: string) => CellStyle | undefined
  freeze: { rows: 0 | 1; cols: 0 | 1 }
  toggleFreezeRows: () => void
  toggleFreezeCols: () => void
  filter: { col: string; text: string } | null
  applyFilter: (col: string, text: string) => void
  clearFilter: () => void
  hasHidden: boolean
  showAll: () => void
  setListRule: (keys: string[], options: string[]) => void
  setCheckboxRule: (keys: string[]) => void
  clearRule: (keys: string[]) => void
  openHelp: () => void
  insertLink: () => void
  addCondRule: (r: { col: string; op: '>' | '<' | '=' | '!=' | 'contains'; value: string; color: string }) => void
  clearCondRules: () => void
  sheet: import('./schema').Sheet
  resetSheet: (s: import('./schema').Sheet) => void
  resetCells: (c: Record<string, string>) => void
  ask: (opts: PromptOptions) => Promise<string | null>
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

export function Toolbar({ display, writeCell, focusKey, selectedIds, setFormat, formatOf, insertRow, deleteRow, insertCol, deleteCol, sortByCol, updateStyle, styleOf, freeze, toggleFreezeRows, toggleFreezeCols, filter, applyFilter, clearFilter, hasHidden, showAll, setListRule, setCheckboxRule, clearRule, openHelp, insertLink, addCondRule, clearCondRules, sheet, resetSheet, resetCells, ask, confirm }: Props) {
  const focus = focusKey ? /^([A-J])(\d+)$/.exec(focusKey) : null
  const focusRow = focus ? Number(focus[2]) - 1 : 0
  const targetKeys = (): string[] => (selectedIds.length > 0 ? selectedIds : focusKey ? [focusKey] : []).map((id) => id.includes('-') ? cellIdToKey(id) : id)
  const applyF = (f: Format) => setFormat(targetKeys(), f)
  const toggle = (k: 'b' | 'i' | 'u' | 'w') => updateStyle(targetKeys(), { [k]: !(focusKey && styleOf(focusKey)?.[k]) })
  const setAlign = (a: CellStyle['a']) => updateStyle(targetKeys(), { a })

  return (
    <>
      <button onClick={() => insertRow(focusRow)} title="위에 행 삽입">+행</button>
      <button onClick={() => deleteRow(focusRow)} title="현재 행 삭제">−행</button>
      <button onClick={() => focus && insertCol(focus[1])} title="왼쪽에 열 삽입">+열</button>
      <button onClick={() => focus && deleteCol(focus[1])} title="현재 열 삭제">−열</button>
      <button onClick={() => focus && sortByCol(focus[1], 'asc')} title="오름차순 정렬">↑정렬</button>
      <button onClick={() => focus && sortByCol(focus[1], 'desc')} title="내림차순 정렬">↓정렬</button>
      <button onClick={() => { const f = focus && autoSumFormula(focus[1], focusRow, display); if (f && focus) writeCell(`${focus[1]}${focusRow + 1}`, f) }} title="자동 합계 (위쪽 연속 숫자 합)">Σ</button>
      <button onClick={() => toggle('b')} aria-pressed={!!(focusKey && styleOf(focusKey)?.b)} title="굵게"><b>B</b></button>
      <button onClick={() => toggle('i')} aria-pressed={!!(focusKey && styleOf(focusKey)?.i)} title="기울임"><i>I</i></button>
      <button onClick={() => toggle('u')} aria-pressed={!!(focusKey && styleOf(focusKey)?.u)} title="밑줄"><u>U</u></button>
      <button onClick={() => toggle('w')} aria-pressed={!!(focusKey && styleOf(focusKey)?.w)} title="텍스트 줄바꿈">↵줄</button>
      <button onClick={() => setAlign('left')} aria-pressed={focusKey ? styleOf(focusKey)?.a === 'left' : false} title="왼쪽 정렬">⇤</button>
      <button onClick={() => setAlign('center')} aria-pressed={focusKey ? styleOf(focusKey)?.a === 'center' : false} title="가운데 정렬">⇔</button>
      <button onClick={() => setAlign('right')} aria-pressed={focusKey ? styleOf(focusKey)?.a === 'right' : false} title="오른쪽 정렬">⇥</button>
      <label className="color-pick" title="배경색">🎨<input type="color" onChange={(e) => updateStyle(targetKeys(), { bg: e.target.value })} /></label>
      <label className="color-pick" title="글자색">A<input type="color" onChange={(e) => updateStyle(targetKeys(), { fg: e.target.value })} /></label>
      <button onClick={() => updateStyle(targetKeys(), { b: false, i: false, u: false, a: undefined, bg: '', fg: '' })} title="서식 모두 해제">✕서식</button>
      <button onClick={toggleFreezeRows} title="첫 행 고정" style={freeze.rows ? { background: '#e8f0fe' } : undefined}>📌행</button>
      <button onClick={toggleFreezeCols} title="첫 열 고정" style={freeze.cols ? { background: '#e8f0fe' } : undefined}>📌열</button>
      <button onClick={() => {
        if (!focus) return
        const col = focus[1]
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
      <CondFmtButtons col={focus?.[1] ?? null} addCondRule={addCondRule} clearCondRules={clearCondRules} ask={ask} />
      <FormatButtons apply={applyF} current={focusKey ? formatOf(focusKey) : 'plain'} />
      <OverflowMenu display={display} writeCell={writeCell} openHelp={openHelp} insertLink={insertLink} sheet={sheet} resetSheet={resetSheet} resetCells={resetCells} confirm={confirm} />
    </>
  )
}
