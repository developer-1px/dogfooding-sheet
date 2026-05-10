import { wrap } from './marker'

export function dispatchColor(F: string, argsT: string[]): string | null {
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
