import { useEffect } from 'react'
import type { JsonOps } from 'zod-crud'
import type { Sheet } from './schema'

export type Format = 'plain' | 'currency' | 'eur' | 'krw' | 'percent' | 'integer' | 'thousand' | 'scientific' | 'date'
const LEGACY_KEY = 'spreadsheet:formats:v1'

function migrateLegacy(formats: Record<string, Format>, ops: JsonOps<Sheet>) {
  if (Object.keys(formats).length > 0) return
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    const obj = JSON.parse(raw)
    if (obj && typeof obj === 'object' && Object.keys(obj).length > 0) ops.replace('/formats', obj as Record<string, Format>)
    localStorage.removeItem(LEGACY_KEY)
  } catch { /* ignore */ }
}

export function useFormats(formats: Record<string, Format>, ops: JsonOps<Sheet>) {
  useEffect(() => { migrateLegacy(formats, ops) }, [])

  const setFormat = (keys: string[], fmt: Format) => {
    const next = { ...formats }
    for (const k of keys) {
      if (fmt === 'plain') delete next[k]
      else next[k] = fmt
    }
    ops.replace('/formats', next)
  }

  return { setFormat, formatOf: (k: string): Format => formats[k] ?? 'plain' }
}

const CURRENCY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
const KRW = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })

export function applyFormat(value: string, fmt: Format): string {
  if (fmt === 'plain' || value === '') return value
  const n = Number(value)
  if (!Number.isFinite(n)) return value
  if (fmt === 'currency') return CURRENCY.format(n)
  if (fmt === 'eur') return EUR.format(n)
  if (fmt === 'krw') return KRW.format(n)
  if (fmt === 'percent') return `${(n * 100).toFixed(1)}%`
  if (fmt === 'integer') return String(Math.round(n))
  if (fmt === 'thousand') return n.toLocaleString('en-US')
  if (fmt === 'scientific') return n.toExponential(2)
  if (fmt === 'date') {
    const ms = n > 1e10 ? n : n * 1000
    const d = new Date(ms)
    if (isNaN(d.getTime())) return value
    const pad = (x: number) => String(x).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
  return value
}
