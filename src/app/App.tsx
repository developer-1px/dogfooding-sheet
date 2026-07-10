import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSheet } from '../widgets/sheet-workspace/model/useSheet'
import { FormulaBar } from '../widgets/formula-bar/ui/FormulaBar'
import { Grid } from '../widgets/sheet-grid/ui/Grid'
import { StatusBar } from '../widgets/status-bar/ui/StatusBar'
import { parseCellId } from '../entities/Sheet/schema'
import { selectionAddress } from '../features/selection/model/gotoCell'
import { Find } from '../features/find/ui/Find'
import { HelpDialog } from '../widgets/dialogs/ui/HelpDialog'
import { usePrompt } from '../widgets/dialogs/hooks/usePrompt'
import { useConfirm } from '../widgets/dialogs/hooks/useConfirm'
import { Tabs } from '../features/tabs/ui/Tabs'
import { buildMergeMap } from '../features/structure/hooks/useMerges'
import { SheetToolbar } from '../widgets/sheet-toolbar/ui/SheetToolbar'
import { useSheetPromptActions, type SheetPromptController } from './sheet-prompts/model/sheetPromptActions'
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
  const mergeHidden = useMemo(() => buildMergeMap(ctx.merges).hidden, [ctx.merges])

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
      <StatusBar selectedIds={ctx.selectedIds} focusId={ctx.focusId} rowCount={ctx.rowCount} colCount={ctx.colLetters.length} display={ctx.display} parseId={parseCellId} persistence={ctx.persistence} />
      <HelpDialog open={ctx.helpOpen} onClose={() => ctx.setHelpOpen(false)} />
      <Find
        open={ctx.findOpen}
        mode={ctx.findMode}
        onClose={() => ctx.setFindOpen(false)}
        cells={ctx.sheet.cells}
        display={ctx.display}
        onJump={(id) => { ctx.setFocusId(id); ctx.setSelectedIds([id]) }}
        writeCell={ctx.writeCell}
        writeCells={ctx.writeCells}
        replaceCellsByQuery={ctx.replaceCellsByQuery}
        replaceCellText={ctx.replaceCellText}
        skipIds={mergeHidden}
        rowCount={ctx.rowCount}
        colLetters={ctx.colLetters}
      />
      {promptDialog}
      {confirmDialog}
      <DevToolsOverlay />
    </div>
  )
}
