import { wrap } from './marker'

export function dispatchRegex(F: string, argsT: string[]): string | null {
  if (F === 'REGEXMATCH') {
    try { return new RegExp(argsT[1] ?? '').test(argsT[0]) ? '1' : '0' } catch { return wrap('#VALUE!') }
  }
  if (F === 'REGEXEXTRACT') {
    try { const m = new RegExp(argsT[1] ?? '').exec(argsT[0]); return wrap(m ? (m[1] ?? m[0]) : '#N/A') } catch { return wrap('#VALUE!') }
  }
  if (F === 'REGEXREPLACE') {
    try { return wrap(argsT[0].replace(new RegExp(argsT[1] ?? '', 'g'), argsT[2] ?? '')) } catch { return wrap('#VALUE!') }
  }
  return null
}
