import { useCallback, useEffect, useRef } from 'react'
import { useSheet } from './sheet/useSheet'
import { FormulaBar } from './sheet/FormulaBar'
import { Grid } from './sheet/grid-view/Grid'
import { StatusBar } from './sheet/StatusBar'
import { parseCellId } from './sheet/schema'
import { selectionAddress } from './sheet/selection/gotoCell'
import { Find } from './sheet/find/Find'
import { HelpDialog } from './sheet/HelpDialog'
import { usePrompt } from './sheet/usePrompt'
import { useConfirm } from './sheet/useConfirm'
import { Tabs } from './sheet/tabs/Tabs'
import { buildMergeMap } from './sheet/structure/useMerges'
import { SheetToolbar } from './sheet/SheetToolbar'
import { useSheetPromptActions, type SheetPromptController } from './sheet/sheetPromptActions'
import { DevToolsOverlay } from './interactive-os/DevToolsOverlay'
import './App.css'

export default function App() {
  const { ask, dialog: promptDialog } = usePrompt()
  const { confirm, dialog: confirmDialog } = useConfirm()
  const ctxRef = useRef<SheetPromptController | null>(null)
  const getCtx = useCallback(() => ctxRef.current, [])
  const promptActions = useSheetPromptActions(ask, getCtx)
  const ctx = useSheet(promptActions)
  useEffect(() => { ctxRef.current = ctx }, [ctx])
  const rawValue = ctx.focusKey ? ctx.sheet.cells[ctx.focusKey] ?? '' : ''
  const addr = selectionAddress(ctx.selectedIds, ctx.focusKey, ctx.rowCount, ctx.colLetters)

  return (
    <div className="sheet-app">
      <FormulaBar
        addr={addr}
        onAddrClick={promptActions.openGoto}
        value={rawValue}
        onCommit={(v) => ctx.focusKey && ctx.writeCell(ctx.focusKey, v)}
        onUndo={() => ctx.ops.undo()}
        onRedo={() => ctx.ops.redo()}
        canUndo={ctx.ops.canUndo()}
        canRedo={ctx.ops.canRedo()}
        extra={<SheetToolbar ctx={ctx} ask={ask} confirm={confirm} />}
      />
      <Grid ctx={ctx} />
      <Tabs
        state={ctx.tabs}
        switchTab={ctx.switchTab}
        addSheet={ctx.addSheet}
        deleteSheet={ctx.deleteSheet}
        renameSheet={ctx.renameSheet}
        duplicateSheet={ctx.duplicateSheet}
        setTabColor={ctx.setTabColor}
        reorderTab={ctx.reorderTab}
        confirm={confirm}
      />
      <StatusBar selectedIds={ctx.selectedIds} focusId={ctx.focusId} rowCount={ctx.rowCount} colCount={ctx.colLetters.length} display={ctx.display} parseId={parseCellId} />
      <HelpDialog open={ctx.helpOpen} onClose={() => ctx.setHelpOpen(false)} />
      <Find
        open={ctx.findOpen}
        mode={ctx.findMode}
        onClose={() => ctx.setFindOpen(false)}
        cells={ctx.sheet.cells}
        display={ctx.display}
        onJump={(id) => { ctx.setFocusId(id); ctx.setSelectedIds([id]) }}
        writeCell={ctx.writeCell}
        skipIds={buildMergeMap(ctx.merges).hidden}
        rowCount={ctx.rowCount}
        colLetters={ctx.colLetters}
      />
      {promptDialog}
      {confirmDialog}
      <DevToolsOverlay />
    </div>
  )
}
