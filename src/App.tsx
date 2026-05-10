import { useSheet } from './sheet/useSheet'
import { FormulaBar } from './sheet/FormulaBar'
import { Grid } from './sheet/Grid'
import { StatusBar } from './sheet/StatusBar'
import { parseCellId } from './sheet/schema'
import './App.css'

export default function App() {
  const ctx = useSheet()
  const rawValue = ctx.focusKey ? ctx.sheet.cells[ctx.focusKey] ?? '' : ''

  return (
    <div className="sheet-app">
      <FormulaBar
        addr={ctx.focusKey}
        value={rawValue}
        onCommit={(v) => ctx.focusKey && ctx.writeCell(ctx.focusKey, v)}
        onUndo={() => ctx.ops.undo()}
        onRedo={() => ctx.ops.redo()}
        canUndo={ctx.ops.canUndo()}
        canRedo={ctx.ops.canRedo()}
      />
      <Grid ctx={ctx} />
      <StatusBar selectedIds={ctx.selectedIds} display={ctx.display} parseId={parseCellId} />
    </div>
  )
}
