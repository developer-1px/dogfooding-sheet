import { wrap } from './marker'

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
    const t = Math.max(0, Math.min(1, Number(argsT[2] ?? '0.5')))
    const mix = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t).toString(16).padStart(2, '0')
    return wrap('#' + mix(0) + mix(1) + mix(2))
  }
  if (F === 'HSL') {
    const h = Number(argsT[0]) / 360, s = Number(argsT[1]) / 100, l = Number(argsT[2]) / 100
    if ([h, s, l].some((v) => !Number.isFinite(v))) return wrap('#VALUE!')
    const hue = (n: number) => { const k = (n + h * 12) % 12; return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)) }
    const hex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0')
    return wrap('#' + hex(hue(0)) + hex(hue(8)) + hex(hue(4)))
  }
  if (F === 'RANDCOLOR') return wrap('#' + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0'))
  if (F === 'RGB') {
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
    const hex = (n: number) => clamp(n).toString(16).padStart(2, '0')
    return wrap('#' + hex(Number(argsT[0])) + hex(Number(argsT[1])) + hex(Number(argsT[2])))
  }
  return null
}
