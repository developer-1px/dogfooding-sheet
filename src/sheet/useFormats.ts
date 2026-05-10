import { useEffect, useState } from 'react'

export type Format = 'plain' | 'currency' | 'eur' | 'krw' | 'percent' | 'integer' | 'thousand' | 'scientific' | 'date'
const STORAGE_KEY = 'spreadsheet:formats:v1'

const load = (): Record<string, Format> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw)
    return obj && typeof obj === 'object' ? obj : {}
  } catch { return {} }
}

export function useFormats() {
  const [formats, setFormats] = useState<Record<string, Format>>(load)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(formats)) } catch { /* quota */ }
  }, [formats])

  const setFormat = (keys: string[], fmt: Format) => {
    setFormats((prev) => {
      const next = { ...prev }
      for (const k of keys) {
        if (fmt === 'plain') delete next[k]
        else next[k] = fmt
      }
      return next
    })
  }

  const formatOf = (k: string): Format => formats[k] ?? 'plain'

  return { formats, setFormat, formatOf }
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
    // Treat numbers > 10^10 as JS milliseconds, else assume epoch seconds.
    const ms = n > 1e10 ? n : n * 1000
    const d = new Date(ms)
    if (isNaN(d.getTime())) return value
    const pad = (x: number) => String(x).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
  return value
}
