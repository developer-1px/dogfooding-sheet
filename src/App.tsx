import { useState } from 'react'
import { useSheet } from './sheet/useSheet'
import { FormulaBar } from './sheet/FormulaBar'
import { Grid } from './sheet/Grid'
import { StatusBar } from './sheet/StatusBar'
import { parseCellId } from './sheet/schema'
import { rectFromIds, formatRect } from './lib/clipboard'
import { gotoCell } from './lib/gotoCell'
import { Find } from './sheet/Find'
import { HelpDialog } from './sheet/HelpDialog'
import { PromptDialog } from './sheet/PromptDialog'
import { Tabs } from './sheet/Tabs'
import { Toolbar } from './sheet/Toolbar'
import './App.css'

export default function App() {
  const [gotoOpen, setGotoOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const ctx = useSheet({
    openGoto: () => setGotoOpen(true),
    openNote: () => setNoteOpen(true),
  })
  const rawValue = ctx.focusKey ? ctx.sheet.cells[ctx.focusKey] ?? '' : ''
  const rect = ctx.selectedIds.length > 1 ? rectFromIds(ctx.selectedIds) : null
  const addr = rect ? formatRect(rect) : ctx.focusKey

  return (
    <div className="sheet-app">
      <FormulaBar
        addr={addr}
        onAddrClick={() => setGotoOpen(true)}
        value={rawValue}
        onCommit={(v) => ctx.focusKey && ctx.writeCell(ctx.focusKey, v)}
        onUndo={() => ctx.ops.undo()}
        onRedo={() => ctx.ops.redo()}
        canUndo={ctx.ops.canUndo()}
        canRedo={ctx.ops.canRedo()}
        extra={
          <Toolbar
            display={ctx.display}
            writeCell={ctx.writeCell}
            focusKey={ctx.focusKey}
            selectedIds={ctx.selectedIds}
            setFormat={ctx.setFormat}
            insertRow={ctx.insertRow}
            deleteRow={ctx.deleteRow}
            insertCol={ctx.insertCol}
            deleteCol={ctx.deleteCol}
            sortByCol={ctx.sortByCol}
            updateStyle={ctx.updateStyle}
            styleOf={ctx.styleOf}
            freeze={ctx.freeze}
            toggleFreezeRows={ctx.toggleFreezeRows}
            toggleFreezeCols={ctx.toggleFreezeCols}
            filter={ctx.filter}
            applyFilter={ctx.applyFilter}
            clearFilter={ctx.clearFilter}
            hasHidden={ctx.hasHidden}
            showAll={ctx.showAll}
            setListRule={ctx.setListRule}
            setCheckboxRule={ctx.setCheckboxRule}
            clearRule={ctx.clearRule}
            openHelp={() => ctx.setHelpOpen(true)}
            addCondRule={ctx.addCondRule}
            clearCondRules={ctx.clearCondRules}
            cells={ctx.sheet.cells}
            resetCells={(c) => ctx.ops.replace('/cells', c)}
          />
        }
      />
      <Grid ctx={ctx} />
      <Tabs
        state={ctx.tabs}
        switchTab={ctx.switchTab}
        addSheet={ctx.addSheet}
        deleteSheet={ctx.deleteSheet}
        renameSheet={ctx.renameSheet}
        duplicateSheet={ctx.duplicateSheet}
      />
      <StatusBar selectedIds={ctx.selectedIds} display={ctx.display} parseId={parseCellId} />
      <HelpDialog open={ctx.helpOpen} onClose={() => ctx.setHelpOpen(false)} />
      <Find
        open={ctx.findOpen}
        mode={ctx.findMode}
        onClose={() => ctx.setFindOpen(false)}
        cells={ctx.sheet.cells}
        display={ctx.display}
        onJump={(id) => { ctx.setFocusId(id); ctx.setSelectedIds([id]) }}
        writeCell={ctx.writeCell}
      />
      <PromptDialog
        open={gotoOpen}
        label="이동할 셀 (예: B5)"
        placeholder="B5"
        submitLabel="이동"
        onSubmit={(v) => { gotoCell(v, ctx.setFocusId); setGotoOpen(false) }}
        onCancel={() => setGotoOpen(false)}
      />
      <PromptDialog
        open={noteOpen}
        label="셀 노트"
        initial={ctx.focusKey ? ctx.noteOf(ctx.focusKey) ?? '' : ''}
        submitLabel="저장"
        onSubmit={(v) => { if (ctx.focusKey) ctx.setNote(ctx.focusKey, v); setNoteOpen(false) }}
        onCancel={() => setNoteOpen(false)}
      />
    </div>
  )
}
