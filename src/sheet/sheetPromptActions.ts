import { useMemo } from 'react'
import { DEFAULT_WIDTH } from './grid-view/useColWidths'
import { DEFAULT_HEIGHT } from './grid-view/useRowHeights'
import { gotoCell } from './selection/gotoCell'
import type { WriteCell } from './schema'
import type { Ask } from './usePrompt'
import type { Filter } from './visibility/useFilter'

export interface SheetPromptController {
  rowCount: number
  colCount: number
  focusKey: string | null
  sheet: { colWidths: Record<string, number> }
  filter: Filter | null
  rowHeightOf: (row: number) => number
  setFocusId: (id: string) => void
  setSelectedIds: (ids: string[]) => void
  setSelectAnchor: (id: string | null) => void
  noteOf: (key: string) => string | undefined
  setNote: (key: string, text: string) => void
  writeCell: WriteCell
  setRowHeight: (row: number, height: number) => void
  setColWidth: (col: string, width: number) => void
  clearFilter: () => void
  applyFilter: (col: string, text: string) => void
}

export interface SheetPromptActions {
  openGoto: () => void
  openNote: (key?: string) => void
  openLink: () => void
  promptRowHeight: (row: number) => void
  promptColWidth: (col: string) => void
  promptFilter: (col: string) => void
}

export const GOTO_PROMPT = {
  label: '이동할 셀 또는 범위 (예: B5, A1:C3, B:B, 2:2)',
  placeholder: 'B5 또는 B:B',
  submitLabel: '이동',
}

export function sheetPromptActions(ask: Ask, getCtx: () => SheetPromptController | null): SheetPromptActions {
  return {
    openGoto: () => {
      void ask(GOTO_PROMPT).then((v) => {
        const c = getCtx()
        if (v && c) gotoCell(v, c.setFocusId, c.setSelectedIds, { rowCount: c.rowCount, colCount: c.colCount }, c.setSelectAnchor)
      })
    },
    openNote: (key?: string) => {
      const c = getCtx()
      const k = key ?? c?.focusKey
      if (!c || !k) return
      void ask({ label: '셀 노트', initial: c.noteOf(k) ?? '', submitLabel: '저장' })
        .then((v) => { if (v !== null) getCtx()?.setNote(k, v) })
    },
    openLink: () => {
      const c = getCtx()
      const k = c?.focusKey
      if (!c || !k) return
      void ask({ label: '하이퍼링크 URL', placeholder: 'https://...', submitLabel: '삽입' })
        .then((url) => {
          if (!url) return
          const escapedUrl = url.replace(/"/g, '\\"')
          c.writeCell(k, `=HYPERLINK("${escapedUrl}", "${escapedUrl}")`)
        })
    },
    promptRowHeight: (row: number) => {
      const c = getCtx()
      if (!c) return
      void ask({ label: `${row + 1}행 높이 (px, 비우면 기본값)`, initial: String(c.rowHeightOf(row)), submitLabel: '적용' })
        .then((v) => {
          if (v === null) return
          const n = Number(v)
          c.setRowHeight(row, v === '' || !Number.isFinite(n) ? DEFAULT_HEIGHT : n)
        })
    },
    promptColWidth: (col: string) => {
      const c = getCtx()
      if (!c) return
      const cur = c.sheet.colWidths[col] ?? DEFAULT_WIDTH
      void ask({ label: `${col}열 너비 (px, 비우면 기본값)`, initial: String(cur), submitLabel: '적용' })
        .then((v) => {
          if (v === null) return
          const n = Number(v)
          c.setColWidth(col, v === '' || !Number.isFinite(n) ? DEFAULT_WIDTH : n)
        })
    },
    promptFilter: (col: string) => {
      const c = getCtx()
      if (!c) return
      void ask({ label: `${col}열 필터 조건`, initial: c.filter?.col === col ? c.filter.text : '', submitLabel: '필터' })
        .then((v) => {
          if (v === null) return
          if (v === '') c.clearFilter()
          else c.applyFilter(col, v)
        })
    },
  }
}

export function useSheetPromptActions(ask: Ask, getCtx: () => SheetPromptController | null): SheetPromptActions {
  return useMemo(() => sheetPromptActions(ask, getCtx), [ask, getCtx])
}
