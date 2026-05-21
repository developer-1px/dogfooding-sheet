import { wrap } from './marker'
import { isSafeArrayShape, stringifyFormulaArray } from './arraySafety'

const splitLiteral = (text: string, delimiter: string): string[] =>
  delimiter === '' ? [text] : text.split(delimiter)

const missingArg = (...values: readonly (string | undefined)[]): boolean =>
  values.some((value) => value === undefined)

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

export function dispatchTextSplit(F: string, argsT: string[]): string | null {
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
  if (F === 'TEXTBEFORE' || F === 'TEXTAFTER') {
    const text = argsT[0] ?? ''
    const delimiter = argsT[1] ?? ''
    const instance = Math.trunc(Number(argsT[2] ?? '1'))
    const caseInsensitive = (argsT[3] ?? '0') === '1'
    const ifNotFound = argsT[5] ?? (F === 'TEXTBEFORE' ? text : '')
    const i = delimiterIndex(text, delimiter, instance, caseInsensitive)
    return wrap(i < 0 ? ifNotFound : F === 'TEXTBEFORE' ? text.slice(0, i) : text.slice(i + delimiter.length))
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
  return null
}
