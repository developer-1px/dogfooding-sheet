import { useRef } from 'react'
import { fromList, type UiEvent } from '@p/aria-kernel'
import { useMenuButtonPattern } from '@p/aria-kernel/patterns'
import { exportCsv, importCsvInto, downloadFile, parseCsv } from '../lib/csv'
import { ROW_COUNT } from './schema'

interface Props {
  display: (k: string) => string
  writeCell: (k: string, v: string) => void
  openHelp: () => void
}

export function OverflowMenu({ display, writeCell, openHelp }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const exportCsvFile = () => downloadFile('sheet.csv', exportCsv((k) => display(k), { rowCount: ROW_COUNT }))
  const importCsvFile = (f: File) => f.text().then((t) => { parseCsv(t); importCsvInto(t, writeCell, { rowCount: ROW_COUNT }) })

  const items = [
    { id: 'help', label: '도움말 (F1)', action: openHelp },
    { id: 'export', label: 'CSV 내보내기', action: exportCsvFile },
    { id: 'import', label: 'CSV 가져오기', action: () => fileRef.current?.click() },
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
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsvFile(f); e.target.value = '' }}
      />
    </span>
  )
}
