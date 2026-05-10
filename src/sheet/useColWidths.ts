import { useEffect, useRef, useState } from 'react'
import { COL_LETTERS } from './schema'

const STORAGE_KEY = 'spreadsheet:colwidths:v1'
const DEFAULT_WIDTH = 100
const MIN_WIDTH = 40

const load = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw)
    return obj && typeof obj === 'object' ? obj : {}
  } catch { return {} }
}

export function useColWidths() {
  const [widths, setWidths] = useState<Record<string, number>>(load)
  const dragRef = useRef<{ col: string; startX: number; startW: number } | null>(null)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(widths)) } catch { /* quota */ }
  }, [widths])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current
      if (!d) return
      const w = Math.max(MIN_WIDTH, d.startW + (e.clientX - d.startX))
      setWidths((prev) => ({ ...prev, [d.col]: w }))
    }
    const onUp = () => { dragRef.current = null; document.body.style.cursor = '' }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

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
    setWidths((prev) => ({ ...prev, [col]: Math.min(400, max) }))
  }

  const startResize = (col: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { col, startX: e.clientX, startW: widths[col] ?? DEFAULT_WIDTH }
    document.body.style.cursor = 'col-resize'
  }

  const widthOf = (col: string) => widths[col] ?? DEFAULT_WIDTH

  const gridTemplateFor = (visibleCols: readonly string[] = COL_LETTERS) =>
    `48px ${visibleCols.map((c) => `${widthOf(c)}px`).join(' ')}`

  return { widths, widthOf, gridTemplate: gridTemplateFor(), gridTemplateFor, startResize, autoFit }
}
