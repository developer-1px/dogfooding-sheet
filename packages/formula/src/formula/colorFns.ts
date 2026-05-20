import { wrap } from './marker'

const numericArg = (value: string | undefined): number | null => {
  if (value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const byteHex = (value: number): string =>
  Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')

export function dispatchColor(F: string, argsT: string[]): string | null {
  if (F === 'LUMA') {
    const m = /^#?([0-9a-f]{6})$/i.exec((argsT[0] ?? '').trim())
    if (!m) return wrap('#VALUE!')
    const v = parseInt(m[1], 16)
    const r = ((v >> 16) & 0xff) / 255, g = ((v >> 8) & 0xff) / 255, b = (v & 0xff) / 255
    const lin = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    return String(0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b))
  }
  if (F === 'INVERTCOLOR') {
    const m = /^#?([0-9a-f]{6})$/i.exec((argsT[0] ?? '').trim())
    if (!m) return wrap('#VALUE!')
    const v = parseInt(m[1], 16)
    return wrap('#' + (0xffffff ^ v).toString(16).padStart(6, '0'))
  }
  if (F === 'MIX') {
    const parse = (s: string): [number, number, number] | null => {
      const m = /^#?([0-9a-f]{6})$/i.exec(s.trim())
      if (!m) return null
      const v = parseInt(m[1], 16)
      return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]
    }
    const a = parse(argsT[0]), b = parse(argsT[1])
    if (!a || !b) return wrap('#VALUE!')
    const rawT = argsT[2] === undefined ? 0.5 : numericArg(argsT[2])
    if (rawT === null) return wrap('#VALUE!')
    const t = Math.max(0, Math.min(1, rawT))
    const mix = (i: number) => byteHex(a[i] + (b[i] - a[i]) * t)
    return wrap('#' + mix(0) + mix(1) + mix(2))
  }
  if (F === 'HSL') {
    const rawH = numericArg(argsT[0]), rawS = numericArg(argsT[1]), rawL = numericArg(argsT[2])
    if (rawH === null || rawS === null || rawL === null) return wrap('#VALUE!')
    const h = rawH / 360, s = rawS / 100, l = rawL / 100
    const hue = (n: number) => { const k = (n + h * 12) % 12; return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)) }
    return wrap('#' + byteHex(hue(0) * 255) + byteHex(hue(8) * 255) + byteHex(hue(4) * 255))
  }
  if (F === 'RANDCOLOR') return wrap('#' + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0'))
  if (F === 'RGB') {
    const r = numericArg(argsT[0]), g = numericArg(argsT[1]), b = numericArg(argsT[2])
    return r === null || g === null || b === null
      ? wrap('#VALUE!')
      : wrap('#' + byteHex(r) + byteHex(g) + byteHex(b))
  }
  return null
}
