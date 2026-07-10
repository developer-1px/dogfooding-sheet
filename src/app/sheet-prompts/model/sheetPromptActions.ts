import { useMemo } from 'react'
import { DEFAULT_WIDTH } from '../../../features/sheet-layout/hooks/useColWidths'
import { DEFAULT_HEIGHT } from '../../../features/sheet-layout/hooks/useRowHeights'
import { gotoCell } from '../../../features/selection/model/gotoCell'
import type { WriteCell } from '../../../entities/Sheet/schema'
import type { Ask } from '../../../shared/ports/dialog'
import type { Filter } from '../../../features/visibility/hooks/useFilter'

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

const resizePromptValue = (value: string, defaultValue: number): number | null => {
  if (value === '') return defaultValue
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const formulaStringLiteral = (value: string): string =>
  `"${value.replace(/"/g, '""')}"`

const runPromptResult = <T,>(promise: Promise<T>, apply: (value: T) => void): void => {
  void promise.then(apply).catch(() => {})
}

export function sheetPromptActions(ask: Ask, getCtx: () => SheetPromptController | null): SheetPromptActions {
  return {
    openGoto: () => {
      runPromptResult(ask(GOTO_PROMPT), (v) => {
        const c = getCtx()
        if (v && c) gotoCell(v, c.setFocusId, c.setSelectedIds, { rowCount: c.rowCount, colCount: c.colCount }, c.setSelectAnchor)
      })
    },
    openNote: (key?: string) => {
      const c = getCtx()
      const k = key ?? c?.focusKey
      if (!c || !k) return
      runPromptResult(ask({ label: '셀 노트', initial: c.noteOf(k) ?? '', submitLabel: '저장' }),
        (v) => { if (v !== null) getCtx()?.setNote(k, v) },
      )
    },
    openLink: () => {
      const c = getCtx()
      const k = c?.focusKey
      if (!c || !k) return
      runPromptResult(ask({ label: '하이퍼링크 URL', placeholder: 'https://...', submitLabel: '삽입' }),
        (url) => {
          if (!url) return
          const urlLiteral = formulaStringLiteral(url)
          c.writeCell(k, `=HYPERLINK(${urlLiteral}, ${urlLiteral})`)
        },
      )
    },
    promptRowHeight: (row: number) => {
      const c = getCtx()
      if (!c) return
      runPromptResult(ask({ label: `${row + 1}행 높이 (px, 비우면 기본값)`, initial: String(c.rowHeightOf(row)), submitLabel: '적용' }),
        (v) => {
          if (v === null) return
          const n = resizePromptValue(v, DEFAULT_HEIGHT)
          if (n !== null) c.setRowHeight(row, n)
        },
      )
    },
    promptColWidth: (col: string) => {
      const c = getCtx()
      if (!c) return
      const cur = c.sheet.colWidths[col] ?? DEFAULT_WIDTH
      runPromptResult(ask({ label: `${col}열 너비 (px, 비우면 기본값)`, initial: String(cur), submitLabel: '적용' }),
        (v) => {
          if (v === null) return
          const n = resizePromptValue(v, DEFAULT_WIDTH)
          if (n !== null) c.setColWidth(col, n)
        },
      )
    },
    promptFilter: (col: string) => {
      const c = getCtx()
      if (!c) return
      runPromptResult(ask({ label: `${col}열 필터 조건`, initial: c.filter?.col === col ? c.filter.text : '', submitLabel: '필터' }),
        (v) => {
          if (v === null) return
          if (v === '') c.clearFilter()
          else c.applyFilter(col, v)
        },
      )
    },
  }
}

export function useSheetPromptActions(ask: Ask, getCtx: () => SheetPromptController | null): SheetPromptActions {
  return useMemo(() => sheetPromptActions(ask, getCtx), [ask, getCtx])
}
