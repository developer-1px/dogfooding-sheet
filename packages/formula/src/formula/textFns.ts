import { wrap } from './marker'
import { dispatchTextCodec } from './textCodec'
import { dispatchTextCase } from './textCase'
import { dispatchTextAlgo } from './textAlgo'
import { dispatchTextOps } from './textOps'
import { isSafeArrayShape, stringifyFormulaArray } from './arraySafety'
import { MAX_GENERATED_TEXT_LENGTH, boundedJoin, boundedLength, boundedText } from './textLimit'

const splitLiteral = (text: string, delimiter: string): string[] =>
  delimiter === '' ? [text] : text.split(delimiter)

const textSplitRows = (
  text: string,
  colDelimiter: string,
  rowDelimiter: string,
  ignoreEmpty: boolean,
  pad: string,
): string[][] | null => {
  const rawRows = splitLiteral(text, rowDelimiter)
  const rows: string[][] = []
  let width = 0

  for (const rawRow of rawRows) {
    const rawCells = splitLiteral(rawRow, colDelimiter)
    const row: string[] = []

    for (const cell of rawCells) {
      if (ignoreEmpty && cell === '') continue
      row.push(cell)
    }

    if (ignoreEmpty && row.length === 0) continue
    if (row.length > width) width = row.length
    rows.push(row)
    if (!isSafeArrayShape(rows.length, width)) return null
  }

  for (const row of rows) {
    while (row.length < width) row.push(pad)
  }

  return rows
}

const splitByAnyChar = (text: string, delimiters: string): string[] => {
  const delimiterChars = new Set<string>()
  for (let i = 0; i < delimiters.length; i++) delimiterChars.add(delimiters[i])

  const parts: string[] = []
  let start = 0

  for (let i = 0; i < text.length; i++) {
    if (delimiterChars.has(text[i])) {
      parts.push(text.slice(start, i))
      start = i + 1
    }
  }

  parts.push(text.slice(start))
  return parts
}

const delimiterIndex = (text: string, delimiter: string, instance: number, caseInsensitive: boolean): number => {
  if (delimiter === '' || instance === 0) return -1
  const source = caseInsensitive ? text.toLowerCase() : text
  const needle = caseInsensitive ? delimiter.toLowerCase() : delimiter
  if (instance > 0) {
    let from = 0
    for (let count = 1; ; count++) {
      const index = source.indexOf(needle, from)
      if (index < 0) return -1
      if (count === instance) return index
      from = index + needle.length
    }
  }
  let from = source.length
  for (let count = -1; ; count--) {
    const index = source.lastIndexOf(needle, from - 1)
    if (index < 0) return -1
    if (count === instance) return index
    from = index
  }
}

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
  if (F === 'SPLITN') {
    const parts = (argsT[0] ?? '').split(argsT[1] ?? '')
    const n = Math.floor(Number(argsT[2] ?? '1'))
    return wrap(n >= 1 && n <= parts.length ? parts[n - 1] : '#N/A')
  }
  if (F === 'SPLIT') {
    const text = argsT[0] ?? ''
    const delimiter = argsT[1] ?? ''
    if (delimiter === '') return wrap('#VALUE!')
    const splitByEach = (argsT[2] ?? '1') !== '0'
    const removeEmpty = (argsT[3] ?? '1') !== '0'
    const parts = splitByEach
      ? splitByAnyChar(text, delimiter)
      : text.split(delimiter)
    return wrap(stringifyFormulaArray([removeEmpty ? parts.filter(part => part !== '') : parts]))
  }
  if (F === 'TEXTSPLIT') {
    const text = argsT[0] ?? ''
    const colDelimiter = argsT[1] ?? ''
    const rowDelimiter = argsT[2] ?? ''
    const ignoreEmpty = (argsT[3] ?? '0') !== '0'
    const pad = argsT[5] ?? '#N/A'
    if (colDelimiter === '' && rowDelimiter === '') return wrap('#VALUE!')
    const rows = textSplitRows(text, colDelimiter, rowDelimiter, ignoreEmpty, pad)
    return wrap(rows ? stringifyFormulaArray(rows) : '#VALUE!')
  }
  if (F === 'TEXTBEFORE') {
    const text = argsT[0] ?? ''
    const delimiter = argsT[1] ?? ''
    const instance = Math.trunc(Number(argsT[2] ?? '1'))
    const caseInsensitive = (argsT[3] ?? '0') === '1'
    const ifNotFound = argsT[5] ?? text
    const i = delimiterIndex(text, delimiter, instance, caseInsensitive)
    return wrap(i < 0 ? ifNotFound : text.slice(0, i))
  }
  if (F === 'TEXTAFTER') {
    const text = argsT[0] ?? ''
    const delimiter = argsT[1] ?? ''
    const instance = Math.trunc(Number(argsT[2] ?? '1'))
    const caseInsensitive = (argsT[3] ?? '0') === '1'
    const ifNotFound = argsT[5] ?? ''
    const i = delimiterIndex(text, delimiter, instance, caseInsensitive)
    return wrap(i < 0 ? ifNotFound : text.slice(i + delimiter.length))
  }
  if (F === 'FIND') {
    if (missingArg(argsT[0], argsT[1])) return wrap('#VALUE!')
    const pos = argsT[1].indexOf(argsT[0])
    return pos < 0 ? wrap('#VALUE!') : String(pos + 1)
  }
  if (F === 'SEARCH') {
    if (missingArg(argsT[0], argsT[1])) return wrap('#VALUE!')
    const pos = argsT[1].toLowerCase().indexOf(argsT[0].toLowerCase())
    return pos < 0 ? wrap('#VALUE!') : String(pos + 1)
  }
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
