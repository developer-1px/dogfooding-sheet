import { MAX_GENERATED_TEXT_LENGTH } from './textLimit'

export const MAX_REGEX_PATTERN_LENGTH = 256

const isQuantifierStart = (ch: string | undefined): boolean =>
  ch === '*' || ch === '+' || ch === '?' || ch === '{'

interface GroupInfo {
  hasAlternation: boolean
  hasQuantifier: boolean
}

export function isSafeRegexPattern(pattern: string): boolean {
  if (pattern.length > MAX_REGEX_PATTERN_LENGTH) return false

  const stack: GroupInfo[] = []
  let closedGroup: GroupInfo | null = null
  let inClass = false

  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]
    if (ch === '\\') {
      i++
      closedGroup = null
      continue
    }
    if (inClass) {
      if (ch === ']') inClass = false
      continue
    }
    if (ch === '[') {
      inClass = true
      closedGroup = null
      continue
    }
    if (ch === '(') {
      stack.push({ hasAlternation: false, hasQuantifier: false })
      closedGroup = null
      continue
    }
    if (ch === ')') {
      const group = stack.pop()
      if (!group) return false
      const parent = stack[stack.length - 1]
      if (parent) {
        parent.hasAlternation ||= group.hasAlternation
        parent.hasQuantifier ||= group.hasQuantifier
      }
      closedGroup = group
      continue
    }
    if (ch === '|') {
      const group = stack[stack.length - 1]
      if (group) group.hasAlternation = true
      closedGroup = null
      continue
    }
    if (isQuantifierStart(ch)) {
      if (closedGroup && (closedGroup.hasAlternation || closedGroup.hasQuantifier)) return false
      const group = stack[stack.length - 1]
      if (group) group.hasQuantifier = true
      if (ch === '{') {
        const close = pattern.indexOf('}', i + 1)
        if (close < 0) return false
        i = close
      }
      closedGroup = null
      continue
    }
    closedGroup = null
  }

  return stack.length === 0 && !inClass
}

export const compileSafeRegex = (pattern: string, flags = ''): RegExp | null => {
  if (!isSafeRegexPattern(pattern)) return null
  try {
    return new RegExp(pattern, flags)
  } catch {
    return null
  }
}

export const isSafeRegexText = (text: string): boolean =>
  text.length <= MAX_GENERATED_TEXT_LENGTH
