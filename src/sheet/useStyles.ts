import { useEffect } from 'react'
import type { JsonOps } from 'zod-crud'
import type { Sheet } from './schema'

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

function migrateLegacy(styles: Record<string, CellStyle>, ops: JsonOps<Sheet>) {
  if (Object.keys(styles).length > 0) return
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    const obj = JSON.parse(raw)
    if (obj && typeof obj === 'object' && Object.keys(obj).length > 0) ops.replace('/styles', obj as Record<string, CellStyle>)
    localStorage.removeItem(LEGACY_KEY)
  } catch { /* ignore */ }
}

export function useStyles(styles: Record<string, CellStyle>, ops: JsonOps<Sheet>) {
  useEffect(() => { migrateLegacy(styles, ops) }, [])

  const updateStyle = (keys: string[], patch: Partial<CellStyle>) => {
    const next = { ...styles }
    for (const k of keys) {
      const merged = merge(next[k], patch)
      if (merged) next[k] = merged
      else delete next[k]
    }
    ops.replace('/styles', next)
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
