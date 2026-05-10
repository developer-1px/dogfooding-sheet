import { useRef } from 'react'
import { exportCsv, importCsvInto, downloadFile, parseCsv } from './csv'

interface Props {
  display: (k: string) => string
  writeCell: (k: string, v: string) => void
}

export function CsvButtons({ display, writeCell }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const onExport = () => downloadFile('sheet.csv', exportCsv((k) => display(k)))
  const onImport = (file: File) => file.text().then((t) => { parseCsv(t); importCsvInto(t, writeCell) })

  return (
    <>
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
