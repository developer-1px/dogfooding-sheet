import { wrap } from './marker'
import { dispatchTextCodec } from './textCodec'
import { dispatchTextCase } from './textCase'
import { dispatchTextAlgo } from './textAlgo'
import { dispatchTextOps } from './textOps'
import { MAX_GENERATED_TEXT_LENGTH, boundedJoin, boundedLength, boundedText } from './textLimit'
import { dispatchTextSplit } from './textSplitFns'

const wrapBounded = (value: string): string => wrap(boundedText(value) ?? '#VALUE!')
const missingArg = (...values: readonly (string | undefined)[]): boolean =>
  values.some((value) => value === undefined)

const optionalCount = (value: string | undefined, fallback: number): number | null =>
  boundedLength(Number(value ?? String(fallback)))

const requiredCount = (value: string | undefined): number | null =>
  value === undefined ? null : boundedLength(Number(value))

const requiredPosition = (value: string | undefined): number | null => {
  const n = requiredCount(value)
  return n !== null && n >= 1 ? n : null
}

const boundedSubstituteAll = (text: string, find: string, repl: string): string | null => {
  if (find === '') {
    const length = text.length === 0 ? 0 : text.length + (text.length - 1) * repl.length
    return length <= MAX_GENERATED_TEXT_LENGTH ? text.split('').join(repl) : null
  }
  let from = 0
  let count = 0
  for (;;) {
    const index = text.indexOf(find, from)
    if (index < 0) break
    count++
    from = index + find.length
  }
  const length = text.length + count * (repl.length - find.length)
  return length <= MAX_GENERATED_TEXT_LENGTH ? text.split(find).join(repl) : null
}

const boundedSubstituteNth = (text: string, find: string, repl: string, occurrence: number): string | null => {
  if (occurrence < 1) return boundedSubstituteAll(text, find, repl)
  if (find === '') {
    const index = occurrence - 1
    return index > text.length ? text : boundedJoin([text.slice(0, index), repl, text.slice(index)])
  }
  let from = 0
  let count = 0
  for (;;) {
    const index = text.indexOf(find, from)
    if (index < 0) return text
    if (++count === occurrence) return boundedJoin([text.slice(0, index), repl, text.slice(index + find.length)])
    from = index + find.length
  }
}

export function dispatchText(F: string, argsT: string[]): string | null {
  const codec = dispatchTextCodec(F, argsT); if (codec !== null) return codec
  const cas = dispatchTextCase(F, argsT); if (cas !== null) return cas
  const alg = dispatchTextAlgo(F, argsT); if (alg !== null) return alg
  const ops = dispatchTextOps(F, argsT); if (ops !== null) return ops
  const split = dispatchTextSplit(F, argsT); if (split !== null) return split
  if (F === 'CONCAT' || F === 'CONCATENATE') return wrap(boundedJoin(argsT) ?? '#VALUE!')
  if (F === 'HYPERLINK') return wrapBounded(argsT[1] ? argsT[1] : (argsT[0] ?? ''))
  if (F === 'IMAGE') return wrapBounded(argsT[0] ?? '')
  if (F === 'LEN') return missingArg(argsT[0]) ? wrap('#VALUE!') : String(argsT[0].length)
  if (F === 'LEFT') {
    const count = optionalCount(argsT[1], 1)
    return missingArg(argsT[0]) || count === null ? wrap('#VALUE!') : wrap(argsT[0].slice(0, count))
  }
  if (F === 'RIGHT') {
    const count = optionalCount(argsT[1], 1)
    return missingArg(argsT[0]) || count === null ? wrap('#VALUE!') : wrap(argsT[0].slice(-count))
  }
  if (F === 'LASTCHAR') { const s = [...(argsT[0] ?? '')]; return wrap(s.length ? s[s.length - 1] : '') }
  if (F === 'FIRSTCHAR') { const s = [...(argsT[0] ?? '')]; return wrap(s.length ? s[0] : '') }
  if (F === 'CHARAT') return wrap([...(argsT[0] ?? '')][Math.floor(Number(argsT[1] ?? '0'))] ?? '')
  if (F === 'MID') {
    if (missingArg(argsT[0], argsT[1], argsT[2])) return wrap('#VALUE!')
    const start = requiredPosition(argsT[1])
    const count = requiredCount(argsT[2])
    return start === null || count === null
      ? wrap('#VALUE!')
      : wrap(argsT[0].slice(start - 1, start - 1 + count))
  }
  if (F === 'TRIM') return missingArg(argsT[0]) ? wrap('#VALUE!') : wrap(argsT[0].trim())
  if (F === 'NORMALIZE') {
    if (missingArg(argsT[0])) return wrap('#VALUE!')
    try { return wrapBounded(argsT[0].normalize(argsT[1] || 'NFC')) } catch { return wrap('#VALUE!') }
  }
  if (F === 'CLEAN') {
    if (missingArg(argsT[0])) return wrap('#VALUE!')
    return wrap([...argsT[0]].filter((ch) => {
    const code = ch.charCodeAt(0)
    return code > 0x1f && code !== 0x7f
  }).join(''))
  }
  if (F === 'T') return missingArg(argsT[0]) ? wrap('#VALUE!') : (/^-?\d/.test(argsT[0]) ? wrap('') : wrapBounded(argsT[0]))
  if (F === 'SUBSTITUTE') {
    const [rawText, find, repl, occStr] = argsT
    const text = rawText ?? ''
    const occ = occStr ? Number(occStr) : 0
    return wrap(boundedSubstituteNth(text, find ?? '', repl ?? '', occ) ?? '#VALUE!')
  }
  if (F === 'STARTSWITH') return missingArg(argsT[0], argsT[1]) ? wrap('#VALUE!') : (argsT[0].startsWith(argsT[1]) ? '1' : '0')
  if (F === 'ENDSWITH') return missingArg(argsT[0], argsT[1]) ? wrap('#VALUE!') : (argsT[0].endsWith(argsT[1]) ? '1' : '0')
  if (F === 'CONTAINS') return missingArg(argsT[0], argsT[1]) ? wrap('#VALUE!') : (argsT[0].includes(argsT[1]) ? '1' : '0')
  if (F === 'JOIN') return wrap(boundedJoin(argsT.slice(1), argsT[0] ?? '') ?? '#VALUE!')
  if (F === 'TEXTJOIN') {
    const sep = argsT[0] ?? ''
    const ignoreEmpty = (argsT[1] ?? '1') !== '0'
    const parts = argsT.slice(2)
    return wrap(boundedJoin(ignoreEmpty ? parts.filter((p) => p !== '') : parts, sep) ?? '#VALUE!')
  }
  if (F === 'EXACT') return argsT[0] === argsT[1] ? '1' : '0'
  if (F === 'EQUALCI') return (argsT[0] ?? '').toLowerCase() === (argsT[1] ?? '').toLowerCase() ? '1' : '0'
  if (F === 'REPLACE') {
    if (missingArg(argsT[0], argsT[1], argsT[2])) return wrap('#VALUE!')
    const start = requiredPosition(argsT[1])
    const len = requiredCount(argsT[2])
    if (start === null || len === null) return wrap('#VALUE!')
    const offset = start - 1
    return wrap(boundedJoin([argsT[0].slice(0, offset), argsT[3] ?? '', argsT[0].slice(offset + len)]) ?? '#VALUE!')
  }
  return null
}
