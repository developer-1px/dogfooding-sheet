import { useEffect, useRef } from 'react'
import type { JsonOps } from 'zod-crud'
import { COL_LETTERS } from './schema'
import type { Sheet } from './schema'

const LEGACY_KEY = 'spreadsheet:colwidths:v1'
const DEFAULT_WIDTH = 100
const MIN_WIDTH = 40

function migrateLegacy(widths: Record<string, number>, ops: JsonOps<Sheet>) {
  if (Object.keys(widths).length > 0) return
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    const obj = JSON.parse(raw)
    if (obj && typeof obj === 'object' && Object.keys(obj).length > 0) ops.replace('/colWidths', obj as Record<string, number>)
    localStorage.removeItem(LEGACY_KEY)
  } catch { /* ignore */ }
}

export function useColWidths(widths: Record<string, number>, ops: JsonOps<Sheet>) {
  const dragRef = useRef<{ col: string; startX: number; startW: number; current: number } | null>(null)
  useEffect(() => { migrateLegacy(widths, ops) }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current
      if (!d) return
      d.current = Math.max(MIN_WIDTH, d.startW + (e.clientX - d.startX))
      ops.replace('/colWidths', { ...widths, [d.col]: d.current })
    }
    const onUp = () => { dragRef.current = null; document.body.style.cursor = '' }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [widths])

  const autoFit = (col: string, samples: string[]) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.font = '13px system-ui, sans-serif'
    let max = MIN_WIDTH
    for (const s of samples) {
      const w = Math.ceil(ctx.measureText(s).width) + 16
      if (w > max) max = w
    }
    ops.replace('/colWidths', { ...widths, [col]: Math.min(400, max) })
  }

  const startResize = (col: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { col, startX: e.clientX, startW: widths[col] ?? DEFAULT_WIDTH, current: widths[col] ?? DEFAULT_WIDTH }
    document.body.style.cursor = 'col-resize'
  }

  const widthOf = (col: string) => widths[col] ?? DEFAULT_WIDTH

  const gridTemplateFor = (visibleCols: readonly string[] = COL_LETTERS) =>
    `48px ${visibleCols.map((c) => `${widthOf(c)}px`).join(' ')}`

  return { widthOf, gridTemplate: gridTemplateFor(), gridTemplateFor, startResize, autoFit }
}
