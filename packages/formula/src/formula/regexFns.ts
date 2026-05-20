import { wrap } from './marker'
import { compileSafeRegex, isSafeRegexText } from './regexSafety'

export function dispatchRegex(F: string, argsT: string[]): string | null {
  if (F === 'REGEXMATCH') {
    const text = argsT[0] ?? ''
    const re = isSafeRegexText(text) ? compileSafeRegex(argsT[1] ?? '') : null
    return re ? (re.test(text) ? '1' : '0') : wrap('#VALUE!')
  }
  if (F === 'REGEXEXTRACT') {
    const text = argsT[0] ?? ''
    const re = isSafeRegexText(text) ? compileSafeRegex(argsT[1] ?? '') : null
    if (!re) return wrap('#VALUE!')
    const m = re.exec(text)
    return wrap(m ? (m[1] ?? m[0]) : '#N/A')
  }
  if (F === 'REGEXREPLACE') {
    const text = argsT[0] ?? ''
    const re = isSafeRegexText(text) ? compileSafeRegex(argsT[1] ?? '', 'g') : null
    if (!re) return wrap('#VALUE!')
    const replaced = text.replace(re, argsT[2] ?? '')
    return wrap(isSafeRegexText(replaced) ? replaced : '#VALUE!')
  }
  if (F === 'REGEXCOUNT') {
    const text = argsT[0] ?? ''
    const re = isSafeRegexText(text) ? compileSafeRegex(argsT[1] ?? '', 'g') : null
    return re ? String((text.match(re) ?? []).length) : wrap('#VALUE!')
  }
  return null
}
