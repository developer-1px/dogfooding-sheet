import { useRef } from 'react'
import { useSheet, type SheetCtx } from './sheet/useSheet'
import { DEFAULT_HEIGHT } from './sheet/grid-view/useRowHeights'
import { DEFAULT_WIDTH } from './sheet/grid-view/useColWidths'
import { FormulaBar } from './sheet/FormulaBar'
import { Grid } from './sheet/grid-view/Grid'
import { StatusBar } from './sheet/StatusBar'
import { parseCellId } from './sheet/schema'
import { rectFromIds, formatRect } from '@spredsheet/grid'
import { gotoCell } from './sheet/selection/gotoCell'
import { Find } from './sheet/find/Find'
import { HelpDialog } from './sheet/HelpDialog'
import { usePrompt } from './sheet/usePrompt'
import { useConfirm } from './sheet/useConfirm'
import { Tabs } from './sheet/tabs/Tabs'
import { buildMergeMap } from './sheet/structure/useMerges'
import { SheetToolbar } from './sheet/SheetToolbar'
import { DevToolsOverlay } from './interactive-os/DevToolsOverlay'
import './App.css'

const GOTO_PROMPT = { label: '이동할 셀 또는 범위 (예: B5, A1:C3)', placeholder: 'B5', submitLabel: '이동' }

export default function App() {
  const { ask, dialog: promptDialog } = usePrompt()
  const { confirm, dialog: confirmDialog } = useConfirm()
  const ctxRef = useRef<SheetCtx | null>(null)
  const ctx = useSheet({
    openGoto: () => ask(GOTO_PROMPT)
      .then((v) => {
        const c = ctxRef.current
        if (v && c) gotoCell(v, c.setFocusId, c.setSelectedIds, { rowCount: c.rowCount, colCount: c.colCount })
      }),
    openNote: (key?: string) => {
      const c = ctxRef.current; const k = key ?? c?.focusKey; if (!c || !k) return
      ask({ label: '셀 노트', initial: c.noteOf(k) ?? '', submitLabel: '저장' })
        .then((v) => { if (v !== null) ctxRef.current?.setNote(k, v) })
    },
    openLink: () => {
      const c = ctxRef.current; const k = c?.focusKey; if (!c || !k) return
      ask({ label: '하이퍼링크 URL', placeholder: 'https://...', submitLabel: '삽입' })
        .then((url) => { if (url) c.writeCell(k, `=HYPERLINK("${url.replace(/"/g, '\\"')}", "${url.replace(/"/g, '\\"')}")`) })
    },
    promptRowHeight: (row: number) => {
      const c = ctxRef.current; if (!c) return
      ask({ label: `${row + 1}행 높이 (px, 비우면 기본값)`, initial: String(c.rowHeightOf(row)), submitLabel: '적용' })
        .then((v) => { if (v === null) return; const n = Number(v); if (v === '' || !Number.isFinite(n)) c.setRowHeight(row, DEFAULT_HEIGHT); else c.setRowHeight(row, n) })
    },
    promptColWidth: (col: string) => {
      const c = ctxRef.current; if (!c) return
      const cur = c.sheet.colWidths[col] ?? DEFAULT_WIDTH
      ask({ label: `${col}열 너비 (px, 비우면 기본값)`, initial: String(cur), submitLabel: '적용' })
        .then((v) => { if (v === null) return; const n = Number(v); c.setColWidth(col, (v === '' || !Number.isFinite(n)) ? DEFAULT_WIDTH : n) })
    },
  })
  ctxRef.current = ctx
  const rawValue = ctx.focusKey ? ctx.sheet.cells[ctx.focusKey] ?? '' : ''
  const rect = ctx.selectedIds.length > 1 ? rectFromIds(ctx.selectedIds) : null
  const addr = rect ? formatRect(rect) : ctx.focusKey

  return (
    <div className="sheet-app">
      <FormulaBar
        addr={addr}
        onAddrClick={() => ask(GOTO_PROMPT).then((v) => { if (v) gotoCell(v, ctx.setFocusId, ctx.setSelectedIds, { rowCount: ctx.rowCount, colCount: ctx.colCount }) })}
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
