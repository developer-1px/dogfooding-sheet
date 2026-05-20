type WildcardToken =
  | { kind: 'any' }
  | { kind: 'literal', value: string }
  | { kind: 'star' }

export type CriteriaMatcher = (value: string) => boolean

const hasWildcardSyntax = (criteria: string): boolean => /[*?~]/.test(criteria)

const isComparisonCriteria = (criteria: string): boolean => /^[<>=]/.test(criteria)

const canWildcardConsume = (ch: string | undefined): boolean =>
  ch !== undefined && ch !== '\n' && ch !== '\r' && ch !== '\u2028' && ch !== '\u2029'

const wildcardTokens = (pattern: string): WildcardToken[] => {
  const tokens: WildcardToken[] = []

  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]
    const next = pattern[i + 1]

    if (ch === '~' && (next === '*' || next === '?' || next === '~')) {
      tokens.push({ kind: 'literal', value: next })
      i++
    } else if (ch === '*') {
      tokens.push({ kind: 'star' })
    } else if (ch === '?') {
      tokens.push({ kind: 'any' })
    } else {
      tokens.push({ kind: 'literal', value: ch })
    }
  }

  return tokens
}

const matchesWildcardTokens = (value: string, tokens: WildcardToken[]): boolean => {
  let valueIndex = 0
  let tokenIndex = 0
  let starIndex = -1
  let afterStar = 0

  while (valueIndex < value.length) {
    const token = tokens[tokenIndex]
    const ch = value[valueIndex]

    if (token?.kind === 'literal' && token.value === ch) {
      valueIndex++
      tokenIndex++
    } else if (token?.kind === 'any' && canWildcardConsume(ch)) {
      valueIndex++
      tokenIndex++
    } else if (token?.kind === 'star') {
      starIndex = tokenIndex
      afterStar = valueIndex
      tokenIndex++
    } else if (starIndex >= 0 && canWildcardConsume(value[afterStar])) {
      tokenIndex = starIndex + 1
      afterStar++
      valueIndex = afterStar
    } else {
      return false
    }
  }

  while (tokens[tokenIndex]?.kind === 'star') tokenIndex++

  return tokenIndex === tokens.length
}

export const compileWildcardMatcher = (pattern: string): CriteriaMatcher => {
  const tokens = wildcardTokens(pattern)
  return (value: string): boolean => matchesWildcardTokens(value, tokens)
}

export const compileCriteria = (criteria: string): CriteriaMatcher => {
  const c = criteria.trim()
  if (hasWildcardSyntax(c) && !isComparisonCriteria(c)) return compileWildcardMatcher(c)

  for (const op of ['>=', '<=', '<>', '>', '<', '='] as const) {
    if (c.startsWith(op)) {
      const rest = c.slice(op.length).trim()
      const b = Number(rest)

      return (value: string): boolean => {
        const a = Number(value)
        const numeric = Number.isFinite(a) && Number.isFinite(b)

        if (op === '<>') return value !== rest
        if (op === '=') return value === rest
        if (!numeric) return false
        if (op === '>=') return a >= b
        if (op === '<=') return a <= b
        if (op === '>') return a > b
        return a < b
      }
    }
  }

  return (value: string): boolean => value === c
}

/** Match a value against a criteria string like ">5", "<=10", "<>x", "a*b", or a literal. */
export const matchCriteria = (value: string, criteria: string): boolean =>
  compileCriteria(criteria)(value)
