import { useRef } from 'react'
import { useSheet } from './sheet/useSheet'
import { FormulaBar } from './sheet/FormulaBar'
import { Grid } from './sheet/Grid'
import { StatusBar } from './sheet/StatusBar'
import { parseCellId } from './sheet/schema'
import { rectFromIds, formatRect } from './sheet/clipboard'
import { exportCsv, importCsvInto, downloadFile, parseCsv } from './sheet/csv'
import { Find } from './sheet/Find'
import './App.css'

export default function App() {
  const ctx = useSheet()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const rawValue = ctx.focusKey ? ctx.sheet.cells[ctx.focusKey] ?? '' : ''

  const rect = ctx.selectedIds.length > 1 ? rectFromIds(ctx.selectedIds) : null
  const addr = rect ? formatRect(rect) : ctx.focusKey

  const onExport = () => {
    const csv = exportCsv((k) => ctx.display(k))
    downloadFile('sheet.csv', csv)
  }
  const onImport = (file: File) => {
    file.text().then((text) => {
      // pre-validate to avoid partial failures on malformed input
      parseCsv(text)
      importCsvInto(text, ctx.writeCell)
    })
  }

  return (
    <div className="sheet-app">
      <FormulaBar
        addr={addr}
        value={rawValue}
        onCommit={(v) => ctx.focusKey && ctx.writeCell(ctx.focusKey, v)}
        onUndo={() => ctx.ops.undo()}
        onRedo={() => ctx.ops.redo()}
        canUndo={ctx.ops.canUndo()}
        canRedo={ctx.ops.canRedo()}
        extra={
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
        }
      />
      <Grid ctx={ctx} />
      <StatusBar selectedIds={ctx.selectedIds} display={ctx.display} parseId={parseCellId} />
      <Find
        open={ctx.findOpen}
        onClose={() => ctx.setFindOpen(false)}
        cells={ctx.sheet.cells}
        display={ctx.display}
        onJump={(id) => { ctx.setFocusId(id); ctx.setSelectedIds([id]) }}
      />
    </div>
  )
}
