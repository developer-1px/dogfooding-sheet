import { useMemo, useRef } from 'react'
import { fromList, type UiEvent } from '@interactive-os/aria-kernel'
import { useMenuButtonPattern } from '@interactive-os/aria-kernel/patterns'
import { exportCsv, importCsvInto, downloadFile, parseCsv } from '../lib/csv'
import type { Confirm } from './useConfirm'
import { SheetSchema, colLettersFor, type Sheet, type Cells, type WriteCell, type WriteMany, type Display } from './schema'

export interface OverflowProps {
  display: Display
  writeCell: WriteCell
  writeCells: WriteMany
  openHelp: () => void
  insertLink: () => void
  sheet: Sheet
  resetSheet: (s: Sheet) => void
  resetCells: (cells: Cells) => void
  confirm: Confirm
  showFormulas: boolean
  toggleShowFormulas: () => void
  showGridlines: boolean
  toggleShowGridlines: () => void
  clearAllFormats: () => void
}

export function OverflowMenu({ display, writeCell, writeCells, openHelp, insertLink, sheet, resetSheet, resetCells, confirm, showFormulas, toggleShowFormulas, showGridlines, toggleShowGridlines, clearAllFormats }: OverflowProps) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const jsonRef = useRef<HTMLInputElement | null>(null)
  const colLetters = colLettersFor(sheet.colCount)
  const exportCsvFile = () => downloadFile('sheet.csv', exportCsv((k) => display(k), { rowCount: sheet.rowCount, colLetters }))
  const importCsvFile = async (f: File) => {
    const t = await f.text(); try { parseCsv(t) } catch { return }
    if (await confirm({ message: 'CSV 내용으로 셀을 채우시겠습니까? 기존 셀이 덮어써집니다. (실행 취소 가능)', confirmLabel: '가져오기' })) importCsvInto(t, writeCell, { rowCount: sheet.rowCount, colLetters, writeMany: writeCells })
  }
  const exportJson = () => downloadFile('sheet.json', JSON.stringify(sheet, null, 2))
  const importJson = async (f: File) => {
    const t = await f.text()
    let parsed; try { parsed = SheetSchema.safeParse(JSON.parse(t)) } catch { return }
    if (!parsed.success) return
    if (await confirm({ message: '현재 시트를 가져온 JSON으로 교체하시겠습니까? (실행 취소 가능)', confirmLabel: '교체' })) resetSheet(parsed.data)
  }

  const items = useMemo(() => [
    { id: 'help', label: '도움말 (F1)' },
    { id: 'show-formulas', label: `${showFormulas ? '✓ ' : ''}수식 표시 (Ctrl/⌘+\`)` },
    { id: 'show-gridlines', label: `${showGridlines ? '✓ ' : ''}격자선 표시` },
    { id: 'link', label: '하이퍼링크 삽입 (Ctrl/⌘+K)' },
    { id: 'print', label: '인쇄 (Ctrl/⌘+P)' },
    { id: 'csv-export', label: 'CSV 내보내기' },
    { id: 'csv-import', label: 'CSV 가져오기' },
    { id: 'json-export', label: 'JSON 내보내기' },
    { id: 'json-import', label: 'JSON 가져오기' },
    { id: 'clear-all', label: '전체 셀 지우기' },
    { id: 'clear-formats', label: '전체 서식 지우기' },
  ], [showFormulas, showGridlines])
  const data = fromList(items.map(({ id, label }) => ({ id, label })))

  const onEvent = (e: UiEvent) => {
    if (e.type === 'activate' && e.id) {
      if (e.id === 'help') openHelp()
      else if (e.id === 'show-formulas') toggleShowFormulas()
      else if (e.id === 'show-gridlines') toggleShowGridlines()
      else if (e.id === 'link') insertLink()
      else if (e.id === 'print') window.print()
      else if (e.id === 'csv-export') exportCsvFile()
      else if (e.id === 'csv-import') fileRef.current?.click()
      else if (e.id === 'json-export') exportJson()
      else if (e.id === 'json-import') jsonRef.current?.click()
      else if (e.id === 'clear-all') confirm({ message: '모든 셀을 지우시겠습니까? (실행 취소 가능)', confirmLabel: '지우기' }).then((ok) => { if (ok) resetCells({}) })
      else if (e.id === 'clear-formats') confirm({ message: '모든 셀 서식·스타일·조건부 서식을 지우시겠습니까? (실행 취소 가능)', confirmLabel: '지우기' }).then((ok) => { if (ok) clearAllFormats() })
    }
  }

  const { triggerProps, menuProps, itemProps, open } = useMenuButtonPattern(data, onEvent, {
    label: '추가 메뉴',
  })

  return (
    <span className="overflow-menu">
      <button {...triggerProps} className="overflow-trigger" title="더 보기">⋮</button>
      {open && (
        <div {...menuProps} className="overflow-list">
          {items.map((it) => (
            <button key={it.id} {...itemProps(it.id)} className="overflow-item">{it.label}</button>
          ))}
        </div>
      )}
      <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsvFile(f); e.target.value = '' }} />
      <input ref={jsonRef} type="file" accept=".json,application/json" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = '' }} />
    </span>
  )
}
