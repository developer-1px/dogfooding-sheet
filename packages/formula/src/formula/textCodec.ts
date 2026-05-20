import { wrap } from './marker'
import { MAX_GENERATED_TEXT_LENGTH, boundedText } from './textLimit'

type URLLike = {
  hostname: string
  pathname: string
  searchParams: { get(name: string): string | null }
}
type URLCtor = new (input: string) => URLLike

const parseURL = (input: string): URLLike => {
  const Ctor = (globalThis as { URL?: URLCtor }).URL
  if (!Ctor) throw new Error('URL unavailable')
  return new Ctor(input)
}

const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

const utf8Bytes = (text: string): number[] => {
  const bytes: number[] = []
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp <= 0x7f) bytes.push(cp)
    else if (cp <= 0x7ff) bytes.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f))
    else if (cp <= 0xffff) bytes.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f))
    else bytes.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f))
  }
  return bytes
}

const fromUtf8Bytes = (bytes: number[]): string => {
  let out = ''
  for (let i = 0; i < bytes.length;) {
    const b = bytes[i++]
    if (b < 0x80) out += String.fromCodePoint(b)
    else if (b < 0xe0) out += String.fromCodePoint(((b & 0x1f) << 6) | (bytes[i++] & 0x3f))
    else if (b < 0xf0) out += String.fromCodePoint(((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f))
    else out += String.fromCodePoint(((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f))
  }
  return out
}

const base64Encode = (text: string): string => {
  const bytes = utf8Bytes(text)
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1] ?? 0, c = bytes[i + 2] ?? 0
    const n = (a << 16) | (b << 8) | c
    out += base64Chars[(n >> 18) & 63]
    out += base64Chars[(n >> 12) & 63]
    out += i + 1 < bytes.length ? base64Chars[(n >> 6) & 63] : '='
    out += i + 2 < bytes.length ? base64Chars[n & 63] : '='
  }
  return out
}

const base64Decode = (encoded: string): string => {
  const clean = encoded.replace(/\s/g, '')
  if (clean.length % 4 !== 0) throw new Error('invalid base64')
  const decodedLength = Math.floor(clean.length / 4) * 3
    - (clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0)
  if (decodedLength > MAX_GENERATED_TEXT_LENGTH) throw new Error('base64 too large')
  const bytes: number[] = []
  for (let i = 0; i < clean.length; i += 4) {
    const c1 = base64Chars.indexOf(clean[i])
    const c2 = base64Chars.indexOf(clean[i + 1])
    const c3 = clean[i + 2] === '=' ? -1 : base64Chars.indexOf(clean[i + 2])
    const c4 = clean[i + 3] === '=' ? -1 : base64Chars.indexOf(clean[i + 3])
    if (c1 < 0 || c2 < 0 || (c3 < 0 && clean[i + 2] !== '=') || (c4 < 0 && clean[i + 3] !== '=')) throw new Error('invalid base64')
    const n = (c1 << 18) | (c2 << 12) | ((c3 < 0 ? 0 : c3) << 6) | (c4 < 0 ? 0 : c4)
    bytes.push((n >> 16) & 255)
    if (c3 >= 0) bytes.push((n >> 8) & 255)
    if (c4 >= 0) bytes.push(n & 255)
  }
  return fromUtf8Bytes(bytes)
}

const wrapBounded = (value: string): string => wrap(boundedText(value) ?? '#VALUE!')

export function dispatchTextCodec(F: string, argsT: string[]): string | null {
  if (F === 'URLHOST') { try { return wrap(parseURL(argsT[0]).hostname) } catch { return wrap('#VALUE!') } }
  if (F === 'URLPATH') { try { return wrap(parseURL(argsT[0]).pathname) } catch { return wrap('#VALUE!') } }
  if (F === 'URLQUERY') {
    try { const url = parseURL(argsT[0]); return wrap(url.searchParams.get(argsT[1] ?? '') ?? '') } catch { return wrap('#VALUE!') }
  }
  if (F === 'ENCODEURL') return wrapBounded(encodeURIComponent(argsT[0] ?? ''))
  if (F === 'DECODEURL') { try { return wrapBounded(decodeURIComponent(argsT[0] ?? '')) } catch { return wrap('#VALUE!') } }
  if (F === 'JSONESCAPE') return wrapBounded(JSON.stringify(argsT[0] ?? '').slice(1, -1))
  if (F === 'BASE64ENCODE') { try { return wrapBounded(base64Encode(argsT[0] ?? '')) } catch { return wrap('#VALUE!') } }
  if (F === 'BASE64DECODE') { try { return wrapBounded(base64Decode(argsT[0] ?? '')) } catch { return wrap('#VALUE!') } }
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
