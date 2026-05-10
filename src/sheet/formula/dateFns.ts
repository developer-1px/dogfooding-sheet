const pad = (n: number) => String(n).padStart(2, '0')

export const today = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const now = (): string => {
  const d = new Date()
  return `${today()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const date = (y: number, m: number, d: number): string =>
  `${y}-${pad(m)}-${pad(d)}`

const parseDate = (s: string): Date | null => {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s.trim())
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return isNaN(d.getTime()) ? null : d
}

export const year = (s: string) => parseDate(s)?.getUTCFullYear() ?? NaN
export const month = (s: string) => (parseDate(s)?.getUTCMonth() ?? -1) + 1 || NaN
export const day = (s: string) => parseDate(s)?.getUTCDate() ?? NaN

export const days = (end: string, start: string): number => {
  const a = parseDate(start), b = parseDate(end)
  if (!a || !b) return NaN
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}
