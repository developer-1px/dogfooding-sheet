import { useRef } from 'react'
import { exportCsv, importCsvInto, downloadFile, parseCsv } from './csv'
import type { Format } from './useFormats'

interface Props {
  display: (k: string) => string
  writeCell: (k: string, v: string) => void
  focusKey: string | null
  selectedIds: string[]
  setFormat: (keys: string[], f: Format) => void
  insertRow: (atRow: number) => void
  deleteRow: (atRow: number) => void
  sortByCol: (col: string, dir: 'asc' | 'desc') => void
}

const cellIdToKey = (id: string): string => {
  const m = /^r(\d+)-([A-J])$/.exec(id)
  return m ? `${m[2]}${Number(m[1]) + 1}` : id
}

export function Toolbar({ display, writeCell, focusKey, selectedIds, setFormat, insertRow, deleteRow, sortByCol }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null)

  const onExport = () => downloadFile('sheet.csv', exportCsv((k) => display(k)))
  const onImport = (file: File) => file.text().then((t) => { parseCsv(t); importCsvInto(t, writeCell) })

  const focus = focusKey ? /^([A-J])(\d+)$/.exec(focusKey) : null
  const focusRow = focus ? Number(focus[2]) - 1 : 0
  const applyF = (f: Format) => {
    const ids = selectedIds.length > 0 ? selectedIds : (focusKey ? [focusKey] : [])
    setFormat(ids.map((id) => id.includes('-') ? cellIdToKey(id) : id), f)
  }

  return (
    <>
      <button onClick={() => insertRow(focusRow)} title="위에 행 삽입">+행</button>
      <button onClick={() => deleteRow(focusRow)} title="현재 행 삭제">−행</button>
      <button onClick={() => focus && sortByCol(focus[1], 'asc')} title="오름차순 정렬">↑정렬</button>
      <button onClick={() => focus && sortByCol(focus[1], 'desc')} title="내림차순 정렬">↓정렬</button>
      <button onClick={() => applyF('currency')} title="통화">$</button>
      <button onClick={() => applyF('percent')} title="백분율">%</button>
      <button onClick={() => applyF('integer')} title="정수">.0</button>
      <button onClick={() => applyF('plain')} title="일반">123</button>
      <button onClick={onExport} title="CSV로 내보내기">⬇ CSV</button>
      <button onClick={() => fileRef.current?.click()} title="CSV 가져오기">⬆ CSV</button>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onImport(f)
          e.target.value = ''
        }}
      />
    </>
  )
}
