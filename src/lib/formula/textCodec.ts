import { wrap } from './marker'

export function dispatchTextCodec(F: string, argsT: string[]): string | null {
  if (F === 'ENCODEURL') return wrap(encodeURIComponent(argsT[0] ?? ''))
  if (F === 'DECODEURL') { try { return wrap(decodeURIComponent(argsT[0] ?? '')) } catch { return wrap('#VALUE!') } }
  if (F === 'JSONESCAPE') return wrap(JSON.stringify(argsT[0] ?? '').slice(1, -1))
  if (F === 'BASE64ENCODE') { try { return wrap(btoa(unescape(encodeURIComponent(argsT[0] ?? '')))) } catch { return wrap('#VALUE!') } }
  if (F === 'BASE64DECODE') { try { return wrap(decodeURIComponent(escape(atob(argsT[0] ?? '')))) } catch { return wrap('#VALUE!') } }
  if (F === 'UNICHAR') {
    const n = Number(argsT[0])
    return Number.isFinite(n) && n > 0 ? wrap(String.fromCodePoint(n)) : wrap('#VALUE!')
  }
  if (F === 'UNICODE') {
    const cp = argsT[0].codePointAt(0)
    return cp !== undefined ? String(cp) : wrap('#VALUE!')
  }
  if (F === 'CHAR') {
    const n = Number(argsT[0])
    return Number.isFinite(n) ? wrap(String.fromCharCode(n)) : wrap('#VALUE!')
  }
  if (F === 'CODE') return argsT[0].length > 0 ? String(argsT[0].charCodeAt(0)) : wrap('#VALUE!')
  return null
}
