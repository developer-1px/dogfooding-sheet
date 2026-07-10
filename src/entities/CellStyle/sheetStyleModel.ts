import { colIndex } from '@spredsheet/grid'
import { isSafeCellText } from '../CellValue/cellValue'
import { MAX_SHEET_NAME_LENGTH } from '../Sheet/sheetLimits'

const COLOR_RE = /^#[0-9a-fA-F]{3,8}$/
export const MAX_VALIDATION_OPTIONS = 100
export const COND_FORMAT_OPS = ['>', '<', '=', '!=', 'contains'] as const
export type CondFormatOp = typeof COND_FORMAT_OPS[number]

export interface NormalizedCondRule {
  col: string
  op: CondFormatOp
  value: string
  color: string
}

export interface NormalizedFreeze {
  rows: number
  cols: number
}

export interface NormalizedCellStyle {
  b?: boolean
  i?: boolean
  u?: boolean
  s?: boolean
  w?: boolean
  bd?: boolean
  a?: 'left' | 'center' | 'right'
  bg?: string
  fg?: string
}

export const normalizeSheetName = (name: string): string | null => {
  const trimmed = name.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_SHEET_NAME_LENGTH ? trimmed : null
}

export const isSafeSheetName = (name: string): boolean =>
  name === normalizeSheetName(name)

export const isSafeColor = (color: string): boolean =>
  COLOR_RE.test(color)
export const isSafeTabColor = isSafeColor

export const isCondFormatOp = (value: unknown): value is CondFormatOp =>
  typeof value === 'string' && (COND_FORMAT_OPS as readonly string[]).includes(value)

export const normalizeCellStyle = (style: NormalizedCellStyle): NormalizedCellStyle | undefined => {
  const next: NormalizedCellStyle = {}
  if (style.b) next.b = true
  if (style.i) next.i = true
  if (style.u) next.u = true
  if (style.s) next.s = true
  if (style.w) next.w = true
  if (style.bd) next.bd = true
  if (style.a) next.a = style.a
  if (style.bg && isSafeColor(style.bg)) next.bg = style.bg
  if (style.fg && isSafeColor(style.fg)) next.fg = style.fg
  return Object.keys(next).length > 0 ? next : undefined
}

const isColInBounds = (col: string, colCount: number): boolean => {
  const index = colIndex(col)
  return index >= 0 && index < colCount
}

export const normalizeCondRule = (
  rule: { col?: unknown; op?: unknown; value?: unknown; color?: unknown },
  bundle: { colCount: number },
): NormalizedCondRule | undefined => {
  if (typeof rule.col !== 'string' || !isColInBounds(rule.col, bundle.colCount)) return undefined
  if (!isCondFormatOp(rule.op)) return undefined
  if (typeof rule.value !== 'string' || rule.value === '' || !isSafeCellText(rule.value)) return undefined
  if (typeof rule.color !== 'string' || !isSafeColor(rule.color)) return undefined
  return { col: rule.col, op: rule.op, value: rule.value, color: rule.color }
}

const normalizeBoundedCount = (value: unknown, max: number): number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? Math.min(value, Math.max(0, max)) : 0

export const normalizeFreeze = (
  freeze: { rows?: unknown; cols?: unknown },
  bundle: { rowCount: number; colCount: number },
): NormalizedFreeze => ({
  rows: normalizeBoundedCount(freeze.rows, bundle.rowCount),
  cols: normalizeBoundedCount(freeze.cols, bundle.colCount),
})

export const normalizeValidationOptions = (values: readonly unknown[]): string[] => {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of values) {
    const value = String(raw).trim()
    if (value === '' || !isSafeCellText(value) || seen.has(value)) continue
    seen.add(value)
    out.push(value)
    if (out.length >= MAX_VALIDATION_OPTIONS) break
  }
  return out
}
