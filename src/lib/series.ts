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

  const dateRe = /^(\d{4})-(\d{2})-(\d{2})$/
  if (source.every((s) => dateRe.test(s))) {
    const days = source.map((s) => Math.floor(new Date(s + 'T00:00:00Z').getTime() / 86400000))
    let step = 1
    if (days.length >= 2) {
      step = days[1] - days[0]
      for (let i = 2; i < days.length; i++) if (days[i] - days[i - 1] !== step) { step = NaN; break }
    }
    if (Number.isFinite(step)) {
      const out = [...source]
      const pad = (n: number) => String(n).padStart(2, '0')
      for (let i = source.length; i < targetLen; i++) {
        const d = new Date((days[days.length - 1] + step * (i - days.length + 1)) * 86400000)
        out.push(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`)
      }
      return out
    }
  }

  // Named cycles: weekday / month names — continue the cycle past source end
  const cycles: string[][] = [
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ['월', '화', '수', '목', '금', '토', '일'],
    ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  ]
  for (const cyc of cycles) {
    const idx = cyc.indexOf(source[0])
    if (idx >= 0 && source.every((s, i) => s === cyc[(idx + i) % cyc.length])) {
      const out = [...source]
      for (let i = source.length; i < targetLen; i++) out.push(cyc[(idx + i) % cyc.length])
      return out
    }
  }

  // Prefix + integer pattern: "Item 1", "Item 2" → "Item 3"...
  const prefRe = /^(.*?)(-?\d+)$/
  const parsed = source.map((s) => prefRe.exec(s))
  if (parsed.every((p) => !!p) && parsed.every((p) => p![1] === parsed[0]![1])) {
    const ns = parsed.map((p) => Number(p![2]))
    let step = 1
    if (ns.length >= 2) {
      step = ns[1] - ns[0]
      for (let i = 2; i < ns.length; i++) if (ns[i] - ns[i - 1] !== step) { step = NaN; break }
    }
    if (Number.isFinite(step)) {
      const out = [...source]
      const prefix = parsed[0]![1]
      for (let i = source.length; i < targetLen; i++) out.push(prefix + (ns[ns.length - 1] + step * (i - ns.length + 1)))
      return out
    }
  }

  // Cyclic repeat
  const out: string[] = []
  for (let i = 0; i < targetLen; i++) out.push(source[i % source.length])
  return out
}
