/** Pattern detectors for extendSeries. Each returns an extended array or null. */

const pad = (n: number) => String(n).padStart(2, '0')

export function tryArith(source: string[], target: number): string[] | null {
  if (!source.every((s) => s !== '' && Number.isFinite(Number(s)))) return null
  const nums = source.map(Number)
  let step = 0
  if (nums.length >= 2) {
    step = nums[1] - nums[0]
    for (let i = 2; i < nums.length; i++) if (Math.abs((nums[i] - nums[i - 1]) - step) > 1e-9) { step = NaN; break }
  }
  if (!Number.isFinite(step)) return null
  const out = [...source]
  for (let i = source.length; i < target; i++) {
    const v = nums[nums.length - 1] + step * (i - nums.length + 1)
    out.push(String(Math.round(v * 1e10) / 1e10))
  }
  return out
}

export function tryDate(source: string[], target: number): string[] | null {
  if (!source.every((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))) return null
  const days = source.map((s) => Math.floor(new Date(s + 'T00:00:00Z').getTime() / 86400000))
  let step = 1
  if (days.length >= 2) {
    step = days[1] - days[0]
    for (let i = 2; i < days.length; i++) if (days[i] - days[i - 1] !== step) { step = NaN; break }
  }
  if (!Number.isFinite(step)) return null
  const out = [...source]
  for (let i = source.length; i < target; i++) {
    const d = new Date((days[days.length - 1] + step * (i - days.length + 1)) * 86400000)
    out.push(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`)
  }
  return out
}

const CYCLES: string[][] = [
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ['월', '화', '수', '목', '금', '토', '일'],
  ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
]

export function tryNamedCycle(source: string[], target: number): string[] | null {
  for (const cyc of CYCLES) {
    const idx = cyc.indexOf(source[0])
    if (idx >= 0 && source.every((s, i) => s === cyc[(idx + i) % cyc.length])) {
      const out = [...source]
      for (let i = source.length; i < target; i++) out.push(cyc[(idx + i) % cyc.length])
      return out
    }
  }
  return null
}

export function tryPrefixInt(source: string[], target: number): string[] | null {
  const re = /^(.*?)(-?\d+)$/
  const parsed = source.map((s) => re.exec(s))
  if (!parsed.every((p) => !!p) || !parsed.every((p) => p![1] === parsed[0]![1])) return null
  const ns = parsed.map((p) => Number(p![2]))
  let step = 1
  if (ns.length >= 2) {
    step = ns[1] - ns[0]
    for (let i = 2; i < ns.length; i++) if (ns[i] - ns[i - 1] !== step) { step = NaN; break }
  }
  if (!Number.isFinite(step)) return null
  const out = [...source]
  const prefix = parsed[0]![1]
  for (let i = source.length; i < target; i++) out.push(prefix + (ns[ns.length - 1] + step * (i - ns.length + 1)))
  return out
}
