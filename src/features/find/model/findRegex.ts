import { compileSafeRegex, isSafeRegexText } from '@spredsheet/formula'

interface FindTextOptions {
  caseSensitive?: boolean
  regex?: boolean
}

export const makeFindMatcher = (
  query: string,
  { caseSensitive = false, regex = false }: FindTextOptions = {},
): ((text: string) => boolean) => {
  if (!query) return () => false
  if (regex) {
    const re = compileSafeRegex(query, caseSensitive ? '' : 'i')
    return re ? (text) => isSafeRegexText(text) && re.test(text) : () => false
  }

  const needle = caseSensitive ? query : query.toLowerCase()
  return (text) => {
    const haystack = caseSensitive ? text : text.toLowerCase()
    return haystack.includes(needle)
  }
}

const escapeRegexLiteral = (text: string): string =>
  text.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')

export const rawCellTextJsonPath = (
  query: string,
  { caseSensitive = false, regex = false }: FindTextOptions = {},
): string | null => {
  if (!query || !caseSensitive) return null
  const pattern = regex ? query : escapeRegexLiteral(query)
  if (!compileSafeRegex(pattern, '')) return null
  return `$.cells[?search(@, ${JSON.stringify(pattern)})]`
}

const replaceLiteral = (text: string, query: string, replacement: string, caseSensitive: boolean): string | null => {
  const haystack = caseSensitive ? text : text.toLowerCase()
  const needle = caseSensitive ? query : query.toLowerCase()
  let out = ''
  let from = 0

  for (;;) {
    const at = haystack.indexOf(needle, from)
    if (at < 0) {
      out += text.slice(from)
      return isSafeRegexText(out) ? out : null
    }
    out += text.slice(from, at) + replacement
    if (!isSafeRegexText(out)) return null
    from = at + query.length
  }
}

export const replaceFindText = (
  text: string,
  query: string,
  replacement: string,
  { caseSensitive = false, regex = false }: FindTextOptions = {},
): string => {
  if (!query || !isSafeRegexText(replacement)) return text

  if (regex) {
    if (!isSafeRegexText(text)) return text
    const re = compileSafeRegex(query, caseSensitive ? 'g' : 'gi')
    if (!re) return text
    const next = text.replace(re, replacement)
    return isSafeRegexText(next) ? next : text
  }

  return replaceLiteral(text, query, replacement, caseSensitive) ?? text
}
