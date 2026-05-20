import { useEffect } from 'react'
import { colIndex, parseA1, type SheetOps } from '../schema'
import { upsertKeys } from '../../lib/dictOps'
import { migrateLegacyKey } from '../../lib/legacyMigrate'
import { normalizeStoredFormat, type Format } from './formatTypes'

export type { Format } from './formatTypes'
export type FormatLookup = (k: string) => Format
const LEGACY_KEY = 'spreadsheet:formats:v1'

interface FormatBounds {
  rowCount: number
  colCount: number
}

const validFormatKey = (key: string, bounds?: FormatBounds): boolean => {
  const ref = parseA1(key)
  if (!ref) return false
  if (!bounds) return true
  const col = colIndex(ref.col)
  return ref.row >= 0 && ref.row < bounds.rowCount && col >= 0 && col < bounds.colCount
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const coerceLegacyFormats = (raw: unknown, bounds?: FormatBounds): Record<string, Format> | undefined => {
  if (!isRecord(raw)) return undefined
  const out: Record<string, Format> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!validFormatKey(key, bounds)) continue
    const format = normalizeStoredFormat(value)
    if (format !== undefined) out[key] = format
  }
  return Object.keys(out).length > 0 ? out : undefined
}

const migrateLegacy = (formats: Record<string, Format>, ops: SheetOps, bounds?: FormatBounds) =>
  migrateLegacyKey(LEGACY_KEY, Object.keys(formats).length === 0, ops,
    (raw) => coerceLegacyFormats(raw, bounds),
    (o, v) => o.replace('/formats', v),
  )

export function useFormats(formats: Record<string, Format>, ops: SheetOps, bounds?: FormatBounds) {
  const rowCount = bounds?.rowCount
  const colCount = bounds?.colCount
  useEffect(() => {
    migrateLegacy(formats, ops, rowCount !== undefined && colCount !== undefined ? { rowCount, colCount } : undefined)
  }, [formats, ops, rowCount, colCount])

  const setFormat = (keys: string[], fmt: Format) => {
    const value = normalizeStoredFormat(fmt)
    upsertKeys(ops, '/formats', formats, keys.filter((key) => validFormatKey(key, bounds)).map((k) => [k, value]))
  }

  return { setFormat, formatOf: (k: string): Format => formats[k] ?? 'plain' }
}

const CURRENCY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
const KRW = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })
const SHEET_EPOCH_UTC = Date.UTC(1899, 11, 30)
const DAY_MS = 24 * 60 * 60 * 1000
const DAY_SECONDS = 24 * 60 * 60

function dateFromNumber(n: number): Date {
  if (n > 1e10) return new Date(n)
  if (n > 1e8) return new Date(n * 1000)
  return new Date(SHEET_EPOCH_UTC + n * DAY_MS)
}

function timeFromNumber(n: number): string {
  const total = Math.round((((n % 1) + 1) % 1) * DAY_SECONDS)
  const wrapped = total % DAY_SECONDS
  const h = Math.floor(wrapped / 3600)
  const m = Math.floor(wrapped / 60) % 60
  const s = wrapped % 60
  const pad = (x: number) => String(x).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

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
  if (fmt === 'time') return timeFromNumber(n)
  if (fmt === 'date') {
    const d = dateFromNumber(n)
    if (isNaN(d.getTime())) return value
    const pad = (x: number) => String(x).padStart(2, '0')
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
  }
  return value
}
