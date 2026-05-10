import { useEffect } from 'react'
import type { JsonOps } from 'zod-crud'
import type { Sheet } from './schema'
import { upsertKey } from './lib/dictOps'
import { migrateLegacyKey } from './lib/legacyMigrate'

export interface CellStyle {
  b?: boolean
  i?: boolean
  u?: boolean
  w?: boolean
  a?: 'left' | 'center' | 'right'
  bg?: string
  fg?: string
}

const LEGACY_KEY = 'spreadsheet:styles:v1'

const merge = (a: CellStyle | undefined, b: Partial<CellStyle>): CellStyle | undefined => {
  const next: CellStyle = { ...(a ?? {}), ...b }
  if (next.b === false) delete next.b
  if (next.i === false) delete next.i
  if (next.u === false) delete next.u
  if (next.w === false) delete next.w
  if (next.a === undefined) delete next.a
  if (!next.bg) delete next.bg
  if (!next.fg) delete next.fg
  return Object.keys(next).length === 0 ? undefined : next
}

const migrateLegacy = (styles: Record<string, CellStyle>, ops: JsonOps<Sheet>) =>
  migrateLegacyKey(LEGACY_KEY, Object.keys(styles).length === 0, ops,
    (raw) => raw && typeof raw === 'object' && Object.keys(raw).length > 0 ? raw as Record<string, CellStyle> : undefined,
    (o, v) => o.replace('/styles', v),
  )

export function useStyles(styles: Record<string, CellStyle>, ops: JsonOps<Sheet>) {
  useEffect(() => { migrateLegacy(styles, ops) }, [])

  const updateStyle = (keys: string[], patch: Partial<CellStyle>) => {
    for (const k of keys) upsertKey(ops, '/styles', styles, k, merge(styles[k], patch))
  }

  return { updateStyle, styleOf: (k: string) => styles[k] }
}

export const styleToProps = (s: CellStyle | undefined): { className: string; style: React.CSSProperties } => {
  if (!s) return { className: '', style: {} }
  const cn: string[] = []
  if (s.b) cn.push('bold')
  if (s.i) cn.push('italic')
  if (s.u) cn.push('underline')
  if (s.w) cn.push('wrap')
  if (s.a) cn.push(`align-${s.a}`)
  const style: React.CSSProperties = {}
  if (s.bg) style.background = s.bg
  if (s.fg) style.color = s.fg
  return { className: cn.join(' '), style }
}
