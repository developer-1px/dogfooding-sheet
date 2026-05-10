import type { Format } from './useFormats'
import type { CellStyle } from './useStyles'
import { OverflowMenu } from './OverflowMenu'
import { CondFmtButtons } from './CondFmtButtons'
import { autoSumFormula } from '../lib/autoSum'
import { cellIdToKey } from '../lib/a1'

interface Props {
  display: (k: string) => string
  writeCell: (k: string, v: string) => void
  focusKey: string | null
  selectedIds: string[]
  setFormat: (keys: string[], f: Format) => void
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
  clearRule: (keys: string[]) => void
  openHelp: () => void
  addCondRule: (r: { col: string; op: '>' | '<' | '=' | '!=' | 'contains'; value: string; color: string }) => void
  clearCondRules: () => void
  cells: Record<string, string>
  resetCells: (c: Record<string, string>) => void
}

export function Toolbar({ display, writeCell, focusKey, selectedIds, setFormat, insertRow, deleteRow, insertCol, deleteCol, sortByCol, updateStyle, styleOf, freeze, toggleFreezeRows, toggleFreezeCols, filter, applyFilter, clearFilter, hasHidden, showAll, setListRule, clearRule, openHelp, addCondRule, clearCondRules, cells, resetCells }: Props) {
  const focus = focusKey ? /^([A-J])(\d+)$/.exec(focusKey) : null
  const focusRow = focus ? Number(focus[2]) - 1 : 0
  const targetKeys = (): string[] => (selectedIds.length > 0 ? selectedIds : focusKey ? [focusKey] : []).map((id) => id.includes('-') ? cellIdToKey(id) : id)
  const applyF = (f: Format) => setFormat(targetKeys(), f)
  const toggle = (k: 'b' | 'i' | 'u') => updateStyle(targetKeys(), { [k]: !(focusKey && styleOf(focusKey)?.[k]) })
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
      <button onClick={() => toggle('b')} title="굵게"><b>B</b></button>
      <button onClick={() => toggle('i')} title="기울임"><i>I</i></button>
      <button onClick={() => toggle('u')} title="밑줄"><u>U</u></button>
      <button onClick={() => setAlign('left')} title="왼쪽 정렬">⇤</button>
      <button onClick={() => setAlign('center')} title="가운데 정렬">⇔</button>
      <button onClick={() => setAlign('right')} title="오른쪽 정렬">⇥</button>
      <label className="color-pick" title="배경색">🎨<input type="color" onChange={(e) => updateStyle(targetKeys(), { bg: e.target.value })} /></label>
      <label className="color-pick" title="글자색">A<input type="color" onChange={(e) => updateStyle(targetKeys(), { fg: e.target.value })} /></label>
      <button onClick={() => updateStyle(targetKeys(), { bg: '', fg: '' })} title="색상 초기화">✕색</button>
      <button onClick={() => updateStyle(targetKeys(), { b: false, i: false, u: false, a: undefined, bg: '', fg: '' })} title="서식 모두 해제">✕서식</button>
      <button onClick={toggleFreezeRows} title="첫 행 고정" style={freeze.rows ? { background: '#e8f0fe' } : undefined}>📌행</button>
      <button onClick={toggleFreezeCols} title="첫 열 고정" style={freeze.cols ? { background: '#e8f0fe' } : undefined}>📌열</button>
      <button onClick={() => {
        if (!focus) return
        let t: string | null = null
        try { t = window.prompt(`${focus[1]}열에서 찾을 값`, filter?.text ?? '') } catch { return }
        if (t === null) return
        if (t === '') clearFilter(); else applyFilter(focus[1], t)
      }} title="현재 열로 행 필터" style={filter ? { background: '#e8f0fe' } : undefined}>🔽필터{filter ? ` ${filter.col}` : ''}</button>
      {filter && <button onClick={clearFilter} title="필터 해제">✕</button>}
      {hasHidden && <button onClick={showAll} title="숨김 행/열 모두 표시">👁모두표시</button>}
      <button
        onClick={() => {
          const keys = targetKeys()
          if (keys.length === 0) return
          const csv = window.prompt('허용 값 (쉼표 구분, 비우면 해제)', '')
          if (csv === null) return
          const opts = csv.split(',').map((s) => s.trim()).filter(Boolean)
          if (opts.length === 0) clearRule(keys)
          else setListRule(keys, opts)
        }}
        title="유효성 검사 (드롭다운 목록)"
      >▾목록</button>
      <CondFmtButtons col={focus?.[1] ?? null} addCondRule={addCondRule} clearCondRules={clearCondRules} />
      <button onClick={() => applyF('currency')} title="USD">$</button>
      <button onClick={() => applyF('eur')} title="EUR">€</button>
      <button onClick={() => applyF('krw')} title="KRW">₩</button>
      <button onClick={() => applyF('percent')} title="백분율">%</button>
      <button onClick={() => applyF('integer')} title="정수">.0</button>
      <button onClick={() => applyF('thousand')} title="1,000 천단위">1,K</button>
      <button onClick={() => applyF('scientific')} title="과학 표기">1E</button>
      <button onClick={() => applyF('plain')} title="일반">123</button>
      <OverflowMenu display={display} writeCell={writeCell} openHelp={openHelp} cells={cells} resetCells={resetCells} />
    </>
  )
}
