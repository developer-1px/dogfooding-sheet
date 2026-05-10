import type { Format } from './useFormats'
import type { CellStyle } from './useStyles'
import { OverflowMenu } from './OverflowMenu'
import { CondFmtButtons } from './CondFmtButtons'
import { cellIdToKey } from '../lib/a1'

interface Props {
  display: (k: string) => string
  writeCell: (k: string, v: string) => void
  focusKey: string | null
  selectedIds: string[]
  setFormat: (keys: string[], f: Format) => void
  insertRow: (atRow: number) => void
  deleteRow: (atRow: number) => void
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
}

export function Toolbar({ display, writeCell, focusKey, selectedIds, setFormat, insertRow, deleteRow, sortByCol, updateStyle, styleOf, freeze, toggleFreezeRows, toggleFreezeCols, filter, applyFilter, clearFilter, hasHidden, showAll, setListRule, clearRule, openHelp, addCondRule, clearCondRules }: Props) {
  const focus = focusKey ? /^([A-J])(\d+)$/.exec(focusKey) : null
  const focusRow = focus ? Number(focus[2]) - 1 : 0
  const targetKeys = (): string[] => {
    const ids = selectedIds.length > 0 ? selectedIds : (focusKey ? [focusKey] : [])
    return ids.map((id) => id.includes('-') ? cellIdToKey(id) : id)
  }
  const applyF = (f: Format) => setFormat(targetKeys(), f)
  const toggle = (k: 'b' | 'i') => {
    const keys = targetKeys()
    const cur = focusKey ? styleOf(focusKey)?.[k] : undefined
    updateStyle(keys, { [k]: !cur })
  }
  const setAlign = (a: CellStyle['a']) => updateStyle(targetKeys(), { a })

  return (
    <>
      <button onClick={() => insertRow(focusRow)} title="위에 행 삽입">+행</button>
      <button onClick={() => deleteRow(focusRow)} title="현재 행 삭제">−행</button>
      <button onClick={() => focus && sortByCol(focus[1], 'asc')} title="오름차순 정렬">↑정렬</button>
      <button onClick={() => focus && sortByCol(focus[1], 'desc')} title="내림차순 정렬">↓정렬</button>
      <button onClick={() => toggle('b')} title="굵게"><b>B</b></button>
      <button onClick={() => toggle('i')} title="기울임"><i>I</i></button>
      <button onClick={() => setAlign('left')} title="왼쪽 정렬">⇤</button>
      <button onClick={() => setAlign('center')} title="가운데 정렬">⇔</button>
      <button onClick={() => setAlign('right')} title="오른쪽 정렬">⇥</button>
      <label className="color-pick" title="배경색">🎨<input type="color" onChange={(e) => updateStyle(targetKeys(), { bg: e.target.value })} /></label>
      <label className="color-pick" title="글자색">A<input type="color" onChange={(e) => updateStyle(targetKeys(), { fg: e.target.value })} /></label>
      <button onClick={() => updateStyle(targetKeys(), { bg: '', fg: '' })} title="색상 초기화">✕색</button>
      <button onClick={toggleFreezeRows} title="첫 행 고정" style={freeze.rows ? { background: '#e8f0fe' } : undefined}>📌행</button>
      <button onClick={toggleFreezeCols} title="첫 열 고정" style={freeze.cols ? { background: '#e8f0fe' } : undefined}>📌열</button>
      <button onClick={() => {
        if (!focus) return
        const t = window.prompt(`${focus[1]}열에서 찾을 값`, filter?.text ?? '')
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
      <button onClick={() => applyF('currency')} title="통화">$</button>
      <button onClick={() => applyF('percent')} title="백분율">%</button>
      <button onClick={() => applyF('integer')} title="정수">.0</button>
      <button onClick={() => applyF('thousand')} title="1,000 천단위">1,K</button>
      <button onClick={() => applyF('scientific')} title="과학 표기">1E</button>
      <button onClick={() => applyF('plain')} title="일반">123</button>
      <OverflowMenu display={display} writeCell={writeCell} openHelp={openHelp} />
    </>
  )
}
