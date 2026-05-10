import { wrap } from './marker'
import { dispatchTextCodec } from './textCodec'
import { dispatchTextCase } from './textCase'
import { dispatchTextAlgo } from './textAlgo'

export function dispatchText(F: string, argsT: string[]): string | null {
  const codec = dispatchTextCodec(F, argsT); if (codec !== null) return codec
  const cas = dispatchTextCase(F, argsT); if (cas !== null) return cas
  const alg = dispatchTextAlgo(F, argsT); if (alg !== null) return alg
  if (F === 'CONCAT' || F === 'CONCATENATE') return wrap(argsT.join(''))
  if (F === 'HYPERLINK') return wrap(argsT[1] ? argsT[1] : argsT[0])
  if (F === 'LEN') return String(argsT[0].length)
  if (F === 'LEFT') return wrap(argsT[0].slice(0, Number(argsT[1] ?? '1')))
  if (F === 'RIGHT') return wrap(argsT[0].slice(-Number(argsT[1] ?? '1')))
  if (F === 'MID') return wrap(argsT[0].slice(Number(argsT[1]) - 1, Number(argsT[1]) - 1 + Number(argsT[2])))
  if (F === 'TRIM') return wrap(argsT[0].trim())
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
  if (F === 'LINECOUNT') return String((argsT[0] ?? '') === '' ? 0 : (argsT[0].split(/\r?\n/).length))
  if (F === 'CHARCOUNT') return String([...(argsT[0] ?? '')].length)
  if (F === 'WORDCOUNT') {
    const m = (argsT[0] ?? '').trim().match(/\S+/g)
    return String(m ? m.length : 0)
  }
  if (F === 'LPAD') return wrap(argsT[0].padStart(Number(argsT[1] ?? '0'), argsT[2] || ' '))
  if (F === 'RPAD') return wrap(argsT[0].padEnd(Number(argsT[1] ?? '0'), argsT[2] || ' '))
  if (F === 'REVERSE') return wrap([...argsT[0]].reverse().join(''))
  if (F === 'STARTSWITH') return argsT[0].startsWith(argsT[1] ?? '') ? '1' : '0'
  if (F === 'ENDSWITH') return argsT[0].endsWith(argsT[1] ?? '') ? '1' : '0'
  if (F === 'CONTAINS') return argsT[0].includes(argsT[1] ?? '') ? '1' : '0'
  if (F === 'SPLITN') {
    const parts = (argsT[0] ?? '').split(argsT[1] ?? '')
    const n = Math.floor(Number(argsT[2] ?? '1'))
    return wrap(n >= 1 && n <= parts.length ? parts[n - 1] : '#N/A')
  }
  if (F === 'TEXTBEFORE') {
    const i = argsT[0].indexOf(argsT[1] ?? '')
    return wrap(i < 0 ? argsT[0] : argsT[0].slice(0, i))
  }
  if (F === 'TEXTAFTER') {
    const i = argsT[0].indexOf(argsT[1] ?? '')
    return wrap(i < 0 ? '' : argsT[0].slice(i + (argsT[1] ?? '').length))
  }
  if (F === 'FIND') {
    const pos = argsT[1].indexOf(argsT[0])
    return pos < 0 ? wrap('#VALUE!') : String(pos + 1)
  }
  if (F === 'SEARCH') {
    const pos = argsT[1].toLowerCase().indexOf(argsT[0].toLowerCase())
    return pos < 0 ? wrap('#VALUE!') : String(pos + 1)
  }
  if (F === 'REPT') return wrap(argsT[0].repeat(Math.max(0, Number(argsT[1] ?? '0'))))
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
