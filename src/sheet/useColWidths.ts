import { useEffect, useRef, useState } from 'react'
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
  const dragRef = useRef<{ col: string; startX: number; startW: number } | null>(null)
  // Live drag overlay — bypasses ops to avoid one undo entry per mousemove (zod-crud#59).
  const [liveWidth, setLiveWidth] = useState<{ col: string; w: number } | null>(null)
  useEffect(() => { migrateLegacy(widths, ops) }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current
      if (!d) return
      const w = Math.max(MIN_WIDTH, d.startW + (e.clientX - d.startX))
      setLiveWidth({ col: d.col, w })
    }
    const onUp = () => {
      const d = dragRef.current
      if (d && liveWidthRef.current && liveWidthRef.current.col === d.col) {
        ops.replace('/colWidths', { ...widths, [d.col]: liveWidthRef.current.w })
      }
      dragRef.current = null
      setLiveWidth(null)
      document.body.style.cursor = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [widths])

  // Mirror liveWidth into a ref so onUp (captured once) sees the latest.
  const liveWidthRef = useRef<{ col: string; w: number } | null>(null)
  liveWidthRef.current = liveWidth

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
    dragRef.current = { col, startX: e.clientX, startW: widths[col] ?? DEFAULT_WIDTH }
    document.body.style.cursor = 'col-resize'
  }

  const widthOf = (col: string) =>
    liveWidth && liveWidth.col === col ? liveWidth.w : (widths[col] ?? DEFAULT_WIDTH)

  const gridTemplateFor = (visibleCols: readonly string[] = COL_LETTERS) =>
    `48px ${visibleCols.map((c) => `${widthOf(c)}px`).join(' ')}`

  return { widthOf, gridTemplate: gridTemplateFor(), gridTemplateFor, startResize, autoFit }
}
