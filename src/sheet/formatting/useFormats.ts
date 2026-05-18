import { useEffect } from 'react'
import type { SheetOps } from '../schema'
import { upsertKeys } from '../../lib/dictOps'
import { migrateLegacyKey } from '../../lib/legacyMigrate'

export type Format = 'plain' | 'currency' | 'eur' | 'krw' | 'percent' | 'integer' | 'thousand' | 'scientific' | 'date'
export type FormatLookup = (k: string) => Format
const LEGACY_KEY = 'spreadsheet:formats:v1'

const migrateLegacy = (formats: Record<string, Format>, ops: SheetOps) =>
  migrateLegacyKey(LEGACY_KEY, Object.keys(formats).length === 0, ops,
    (raw) => raw && typeof raw === 'object' && Object.keys(raw).length > 0 ? raw as Record<string, Format> : undefined,
    (o, v) => o.replace('/formats', v),
  )

export function useFormats(formats: Record<string, Format>, ops: SheetOps) {
  useEffect(() => { migrateLegacy(formats, ops) }, [])

  const setFormat = (keys: string[], fmt: Format) => {
    upsertKeys(ops, '/formats', formats, keys.map((k) => [k, fmt === 'plain' ? undefined : fmt]))
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
