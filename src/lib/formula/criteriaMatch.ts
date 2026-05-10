const wildcardToRegex = (s: string): RegExp =>
  new RegExp('^' + s.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$')

/** Match a value against a criteria string like ">5", "<=10", "<>x", "a*b", or a literal. */
export const matchCriteria = (value: string, criteria: string): boolean => {
  const c = criteria.trim()
  if (/[*?]/.test(c) && !/^[<>=]/.test(c)) return wildcardToRegex(c).test(value)
  for (const op of ['>=', '<=', '<>', '>', '<', '='] as const) {
    if (c.startsWith(op)) {
      const rest = c.slice(op.length).trim()
      const a = Number(value), b = Number(rest)
      const numeric = Number.isFinite(a) && Number.isFinite(b)
      if (op === '<>') return value !== rest
      if (op === '=') return value === rest
      if (!numeric) return false
      if (op === '>=') return a >= b
      if (op === '<=') return a <= b
      if (op === '>') return a > b
      if (op === '<') return a < b
    }
  }
  return value === c
}
