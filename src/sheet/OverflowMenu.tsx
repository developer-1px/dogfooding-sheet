import { useRef } from 'react'
import { fromList, type UiEvent } from '@p/aria-kernel'
import { useMenuButtonPattern } from '@p/aria-kernel/patterns'
import { exportCsv, importCsvInto, downloadFile, parseCsv } from '../lib/csv'
import type { ConfirmOptions } from './useConfirm'
import { ROW_COUNT } from './schema'

interface Props {
  display: (k: string) => string
  writeCell: (k: string, v: string) => void
  openHelp: () => void
  cells: Record<string, string>
  resetCells: (cells: Record<string, string>) => void
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

export function OverflowMenu({ display, writeCell, openHelp, cells, resetCells, confirm }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const jsonRef = useRef<HTMLInputElement | null>(null)
  const exportCsvFile = () => downloadFile('sheet.csv', exportCsv((k) => display(k), { rowCount: ROW_COUNT }))
  const importCsvFile = (f: File) => f.text().then((t) => { parseCsv(t); importCsvInto(t, writeCell, { rowCount: ROW_COUNT }) })
  const exportJson = () => downloadFile('sheet.json', JSON.stringify({ cells }, null, 2))
  const importJson = (f: File) => f.text().then((t) => { try { const o = JSON.parse(t); if (o?.cells && typeof o.cells === 'object') resetCells(o.cells) } catch { /* ignore */ } })

  const items = [
    { id: 'help', label: '도움말 (F1)', action: openHelp },
    { id: 'csv-export', label: 'CSV 내보내기', action: exportCsvFile },
    { id: 'csv-import', label: 'CSV 가져오기', action: () => fileRef.current?.click() },
    { id: 'json-export', label: 'JSON 내보내기', action: exportJson },
    { id: 'json-import', label: 'JSON 가져오기', action: () => jsonRef.current?.click() },
    { id: 'clear-all', label: '전체 셀 지우기', action: () => { confirm({ message: '모든 셀을 지우시겠습니까? (실행 취소 가능)', confirmLabel: '지우기' }).then((ok) => { if (ok) resetCells({}) }) } },
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
