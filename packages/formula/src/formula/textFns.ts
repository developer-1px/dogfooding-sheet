import { wrap } from './marker'
import { dispatchTextCodec } from './textCodec'
import { dispatchTextCase } from './textCase'
import { dispatchTextAlgo } from './textAlgo'
import { dispatchTextOps } from './textOps'

const splitLiteral = (text: string, delimiter: string): string[] =>
  delimiter === '' ? [text] : text.split(delimiter)

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

export function dispatchText(F: string, argsT: string[]): string | null {
  const codec = dispatchTextCodec(F, argsT); if (codec !== null) return codec
  const cas = dispatchTextCase(F, argsT); if (cas !== null) return cas
  const alg = dispatchTextAlgo(F, argsT); if (alg !== null) return alg
  const ops = dispatchTextOps(F, argsT); if (ops !== null) return ops
  if (F === 'CONCAT' || F === 'CONCATENATE') return wrap(argsT.join(''))
  if (F === 'HYPERLINK') return wrap(argsT[1] ? argsT[1] : argsT[0])
  if (F === 'IMAGE') return wrap(argsT[0] ?? '')
  if (F === 'LEN') return String(argsT[0].length)
  if (F === 'LEFT') return wrap(argsT[0].slice(0, Number(argsT[1] ?? '1')))
  if (F === 'RIGHT') return wrap(argsT[0].slice(-Number(argsT[1] ?? '1')))
  if (F === 'LASTCHAR') { const s = [...(argsT[0] ?? '')]; return wrap(s.length ? s[s.length - 1] : '') }
  if (F === 'FIRSTCHAR') { const s = [...(argsT[0] ?? '')]; return wrap(s.length ? s[0] : '') }
  if (F === 'CHARAT') return wrap([...(argsT[0] ?? '')][Math.floor(Number(argsT[1] ?? '0'))] ?? '')
  if (F === 'MID') return wrap(argsT[0].slice(Number(argsT[1]) - 1, Number(argsT[1]) - 1 + Number(argsT[2])))
  if (F === 'TRIM') return wrap(argsT[0].trim())
  if (F === 'NORMALIZE') { try { return wrap(argsT[0].normalize(argsT[1] || 'NFC')) } catch { return wrap('#VALUE!') } }
  if (F === 'CLEAN') return wrap(argsT[0].replace(/[\x00-\x1F\x7F]/g, ''))
  if (F === 'T') return /^-?\d/.test(argsT[0]) ? wrap('') : wrap(argsT[0])
  if (F === 'SUBSTITUTE') {
    const [text, find, repl, occStr] = argsT
    const occ = occStr ? Number(occStr) : 0
    if (occ <= 0) return wrap(text.split(find ?? '').join(repl ?? ''))
    let i = -1, count = 0
    while ((i = text.indexOf(find ?? '', i + 1)) !== -1) {
      if (++count === occ) return wrap(text.slice(0, i) + (repl ?? '') + text.slice(i + (find ?? '').length))
    }
    return wrap(text)
  }
  if (F === 'STARTSWITH') return argsT[0].startsWith(argsT[1] ?? '') ? '1' : '0'
  if (F === 'ENDSWITH') return argsT[0].endsWith(argsT[1] ?? '') ? '1' : '0'
  if (F === 'CONTAINS') return argsT[0].includes(argsT[1] ?? '') ? '1' : '0'
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
      ? text.split(new RegExp(`[${delimiter.replace(/[\\^$.*+?()[\]{}|/-]/g, '\\$&')}]`))
      : text.split(delimiter)
    return wrap(JSON.stringify([removeEmpty ? parts.filter(part => part !== '') : parts]))
  }
  if (F === 'TEXTSPLIT') {
    const text = argsT[0] ?? ''
    const colDelimiter = argsT[1] ?? ''
    const rowDelimiter = argsT[2] ?? ''
    const ignoreEmpty = (argsT[3] ?? '0') !== '0'
    const pad = argsT[5] ?? '#N/A'
    if (colDelimiter === '' && rowDelimiter === '') return wrap('#VALUE!')
    const rawRows = splitLiteral(text, rowDelimiter)
    const rows = rawRows.map(row => splitLiteral(row, colDelimiter))
    const filtered = ignoreEmpty ? rows.map(row => row.filter(cell => cell !== '')).filter(row => row.length > 0) : rows
    const width = Math.max(0, ...filtered.map(row => row.length))
    return wrap(JSON.stringify(filtered.map(row => row.concat(Array.from({ length: width - row.length }, () => pad)))))
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
    const pos = argsT[1].indexOf(argsT[0])
    return pos < 0 ? wrap('#VALUE!') : String(pos + 1)
  }
  if (F === 'SEARCH') {
    const pos = argsT[1].toLowerCase().indexOf(argsT[0].toLowerCase())
    return pos < 0 ? wrap('#VALUE!') : String(pos + 1)
  }
  if (F === 'JOIN') return wrap(argsT.slice(1).join(argsT[0] ?? ''))
  if (F === 'TEXTJOIN') {
    const sep = argsT[0] ?? ''
    const ignoreEmpty = (argsT[1] ?? '1') !== '0'
    const parts = argsT.slice(2)
    return wrap((ignoreEmpty ? parts.filter((p) => p !== '') : parts).join(sep))
  }
  if (F === 'EXACT') return argsT[0] === argsT[1] ? '1' : '0'
  if (F === 'EQUALCI') return (argsT[0] ?? '').toLowerCase() === (argsT[1] ?? '').toLowerCase() ? '1' : '0'
  if (F === 'REPLACE') {
    const start = Number(argsT[1]) - 1
    const len = Number(argsT[2])
    return wrap(argsT[0].slice(0, start) + (argsT[3] ?? '') + argsT[0].slice(start + len))
  }
  return null
}
