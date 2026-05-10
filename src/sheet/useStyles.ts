import { useEffect, useState } from 'react'

export interface CellStyle {
  b?: boolean
  i?: boolean
  u?: boolean
  a?: 'left' | 'center' | 'right'
  bg?: string
  fg?: string
}

const STORAGE_KEY = 'spreadsheet:styles:v1'

const load = (): Record<string, CellStyle> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw)
    return obj && typeof obj === 'object' ? obj : {}
  } catch { return {} }
}

const merge = (a: CellStyle | undefined, b: Partial<CellStyle>): CellStyle | undefined => {
  const next: CellStyle = { ...(a ?? {}), ...b }
  if (next.b === false) delete next.b
  if (next.i === false) delete next.i
  if (next.u === false) delete next.u
  if (next.a === undefined) delete next.a
  if (!next.bg) delete next.bg
  if (!next.fg) delete next.fg
  return Object.keys(next).length === 0 ? undefined : next
}

export function useStyles() {
  const [styles, setStyles] = useState<Record<string, CellStyle>>(load)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(styles)) } catch { /* quota */ }
  }, [styles])

  const updateStyle = (keys: string[], patch: Partial<CellStyle>) => {
    setStyles((prev) => {
      const next = { ...prev }
      for (const k of keys) {
        const merged = merge(next[k], patch)
        if (merged) next[k] = merged
        else delete next[k]
      }
      return next
    })
  }

  const styleOf = (k: string): CellStyle | undefined => styles[k]

  return { styles, updateStyle, styleOf }
}

export const styleToProps = (s: CellStyle | undefined): { className: string; style: React.CSSProperties } => {
  if (!s) return { className: '', style: {} }
  const cn: string[] = []
  if (s.b) cn.push('bold')
  if (s.i) cn.push('italic')
  if (s.u) cn.push('underline')
  if (s.a) cn.push(`align-${s.a}`)
  const style: React.CSSProperties = {}
  if (s.bg) style.background = s.bg
  if (s.fg) style.color = s.fg
  return { className: cn.join(' '), style }
}
