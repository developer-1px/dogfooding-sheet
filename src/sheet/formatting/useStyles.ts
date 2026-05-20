import { useEffect } from 'react'
import { colIndex, normalizeCellStyle, parseA1, type NormalizedCellStyle, type SheetOps } from '../schema'
import { upsertKeys } from '../../lib/dictOps'
import { migrateLegacyKey } from '../../lib/legacyMigrate'

export type StyleLookup = (k: string) => CellStyle | undefined

export type CellStyle = NormalizedCellStyle

/** Patch that clears every style flag — pass to `updateStyle` for "remove all formatting". */
export const CLEAR_STYLE: Partial<CellStyle> = { b: false, i: false, u: false, s: false, w: false, bd: false, a: undefined, bg: '', fg: '' }

const LEGACY_KEY = 'spreadsheet:styles:v1'

interface StyleBounds {
  rowCount: number
  colCount: number
}

const validStyleKey = (key: string, bounds?: StyleBounds): boolean => {
  const ref = parseA1(key)
  if (!ref) return false
  if (!bounds) return true
  const col = colIndex(ref.col)
  return ref.row >= 0 && ref.row < bounds.rowCount && col >= 0 && col < bounds.colCount
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const coerceLegacyStyles = (raw: unknown, bounds?: StyleBounds): Record<string, CellStyle> | undefined => {
  if (!isRecord(raw)) return undefined
  const out: Record<string, CellStyle> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!validStyleKey(key, bounds) || !isRecord(value)) continue
    const style = normalizeCellStyle({
      b: value.b === true,
      i: value.i === true,
      u: value.u === true,
      s: value.s === true,
      w: value.w === true,
      bd: value.bd === true,
      a: value.a === 'left' || value.a === 'center' || value.a === 'right' ? value.a : undefined,
      bg: typeof value.bg === 'string' ? value.bg : undefined,
      fg: typeof value.fg === 'string' ? value.fg : undefined,
    })
    if (style) out[key] = style
  }
  return Object.keys(out).length > 0 ? out : undefined
}

const merge = (a: CellStyle | undefined, b: Partial<CellStyle>): CellStyle | undefined => {
  return normalizeCellStyle({ ...(a ?? {}), ...b })
}

const migrateLegacy = (styles: Record<string, CellStyle>, ops: SheetOps, bounds?: StyleBounds) =>
  migrateLegacyKey(LEGACY_KEY, Object.keys(styles).length === 0, ops,
    (raw) => coerceLegacyStyles(raw, bounds),
    (o, v) => o.replace('/styles', v),
  )

export function useStyles(styles: Record<string, CellStyle>, ops: SheetOps, bounds?: StyleBounds) {
  const rowCount = bounds?.rowCount
  const colCount = bounds?.colCount
  useEffect(() => {
    migrateLegacy(styles, ops, rowCount !== undefined && colCount !== undefined ? { rowCount, colCount } : undefined)
  }, [styles, ops, rowCount, colCount])

  const updateStyle = (keys: string[], patch: Partial<CellStyle>) => {
    const entries: Array<[string, CellStyle | undefined]> = []
    for (const key of keys) {
      if (validStyleKey(key, bounds)) entries.push([key, merge(styles[key], patch)])
    }
    upsertKeys(ops, '/styles', styles, entries)
  }

  return { updateStyle, styleOf: (k: string) => styles[k] }
}

export const styleToProps = (s: CellStyle | undefined): { className: string; style: React.CSSProperties } => {
  s = s ? normalizeCellStyle(s) : undefined
  if (!s) return { className: '', style: {} }
  const cn: string[] = []
  if (s.b) cn.push('bold')
  if (s.i) cn.push('italic')
  if (s.u) cn.push('underline')
  if (s.s) cn.push('strike')
  if (s.w) cn.push('wrap')
  if (s.bd) cn.push('bordered')
  if (s.a) cn.push(`align-${s.a}`)
  const style: React.CSSProperties = {}
  if (s.bg) style.background = s.bg
  if (s.fg) style.color = s.fg
  return { className: cn.join(' '), style }
}
