import { tryArith, tryDate, tryNamedCycle, tryPrefixInt } from './seriesPatterns'

export function extendSeries(source: string[], targetLen: number): string[] {
  if (source.length === 0) return Array(targetLen).fill('')
  if (targetLen <= source.length) return source.slice(0, targetLen)

  for (const detect of [tryArith, tryDate, tryNamedCycle, tryPrefixInt]) {
    const out = detect(source, targetLen)
    if (out) return out
  }

  const out: string[] = []
  for (let i = 0; i < targetLen; i++) out.push(source[i % source.length])
  return out
}

