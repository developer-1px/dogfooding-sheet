/**
 * Extend a series of source values to `targetLen` items.
 * Numeric arithmetic progressions extrapolate by their step.
 * Otherwise the source values repeat cyclically.
 */
export function extendSeries(source: string[], targetLen: number): string[] {
  if (source.length === 0) return Array(targetLen).fill('')
  if (targetLen <= source.length) return source.slice(0, targetLen)

  const nums = source.map((s) => Number(s))
  const allNumeric = source.every((s) => s !== '' && Number.isFinite(Number(s)))

  if (allNumeric) {
    // Compute step. Single value → step 0. Multi → require uniform diff.
    let step = 0
    if (nums.length >= 2) {
      step = nums[1] - nums[0]
      for (let i = 2; i < nums.length; i++) {
        if (Math.abs((nums[i] - nums[i - 1]) - step) > 1e-9) {
          step = NaN
          break
        }
      }
    }
    if (Number.isFinite(step)) {
      const out = [...source]
      for (let i = source.length; i < targetLen; i++) {
        const v = nums[nums.length - 1] + step * (i - nums.length + 1)
        out.push(String(Math.round(v * 1e10) / 1e10))
      }
      return out
    }
  }

  // Cyclic repeat
  const out: string[] = []
  for (let i = 0; i < targetLen; i++) out.push(source[i % source.length])
  return out
}
