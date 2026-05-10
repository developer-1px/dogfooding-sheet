import { useRef } from 'react'
import { fromList, type UiEvent } from '@p/aria-kernel'
import { useMenuButtonPattern } from '@p/aria-kernel/patterns'
import { exportCsv, importCsvInto, downloadFile, parseCsv } from '../lib/csv'
import type { ConfirmOptions } from './useConfirm'
import { ROW_COUNT, SheetSchema, type Sheet } from './schema'

interface Props {
  display: (k: string) => string
  writeCell: (k: string, v: string) => void
  openHelp: () => void
  insertLink: () => void
  sheet: Sheet
  resetSheet: (s: Sheet) => void
  resetCells: (cells: Record<string, string>) => void
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  showFormulas: boolean
  toggleShowFormulas: () => void
  showGridlines: boolean
  toggleShowGridlines: () => void
  clearAllFormats: () => void
}

export function OverflowMenu({ display, writeCell, openHelp, insertLink, sheet, resetSheet, resetCells, confirm, showFormulas, toggleShowFormulas, showGridlines, toggleShowGridlines, clearAllFormats }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const jsonRef = useRef<HTMLInputElement | null>(null)
  const exportCsvFile = () => downloadFile('sheet.csv', exportCsv((k) => display(k), { rowCount: ROW_COUNT }))
  const importCsvFile = async (f: File) => {
    const t = await f.text(); try { parseCsv(t) } catch { return }
    if (await confirm({ message: 'CSV 내용으로 셀을 채우시겠습니까? 기존 셀이 덮어써집니다. (실행 취소 가능)', confirmLabel: '가져오기' })) importCsvInto(t, writeCell, { rowCount: ROW_COUNT })
  }
  const exportJson = () => downloadFile('sheet.json', JSON.stringify(sheet, null, 2))
  const importJson = async (f: File) => {
    const t = await f.text()
    let parsed; try { parsed = SheetSchema.safeParse(JSON.parse(t)) } catch { return }
    if (!parsed.success) return
    if (await confirm({ message: '현재 시트를 가져온 JSON으로 교체하시겠습니까? (실행 취소 가능)', confirmLabel: '교체' })) resetSheet(parsed.data)
  }

  const items = [
    { id: 'help', label: '도움말 (F1)', action: openHelp },
    { id: 'show-formulas', label: `${showFormulas ? '✓ ' : ''}수식 표시 (Ctrl/⌘+\`)`, action: toggleShowFormulas },
    { id: 'show-gridlines', label: `${showGridlines ? '✓ ' : ''}격자선 표시`, action: toggleShowGridlines },
    { id: 'link', label: '하이퍼링크 삽입 (Ctrl/⌘+K)', action: insertLink },
    { id: 'print', label: '인쇄 (Ctrl/⌘+P)', action: () => window.print() },
    { id: 'csv-export', label: 'CSV 내보내기', action: exportCsvFile },
    { id: 'csv-import', label: 'CSV 가져오기', action: () => fileRef.current?.click() },
    { id: 'json-export', label: 'JSON 내보내기', action: exportJson },
    { id: 'json-import', label: 'JSON 가져오기', action: () => jsonRef.current?.click() },
    { id: 'clear-all', label: '전체 셀 지우기', action: () => { confirm({ message: '모든 셀을 지우시겠습니까? (실행 취소 가능)', confirmLabel: '지우기' }).then((ok) => { if (ok) resetCells({}) }) } },
    { id: 'clear-formats', label: '전체 서식 지우기', action: () => { confirm({ message: '모든 셀 서식·스타일·조건부 서식을 지우시겠습니까? (실행 취소 가능)', confirmLabel: '지우기' }).then((ok) => { if (ok) clearAllFormats() }) } },
  ]
  const data = fromList(items.map(({ id, label }) => ({ id, label })))

  const onEvent = (e: UiEvent) => {
    if (e.type === 'activate' && e.id) {
      items.find((it) => it.id === e.id)?.action()
      setOpen(false)
    }
  }

  const { triggerProps, menuProps, itemProps, open, setOpen } = useMenuButtonPattern(data, onEvent, {
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
