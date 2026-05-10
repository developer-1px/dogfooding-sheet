export const A1_RE = /([A-J])(\d+)/g
export const RANGE_RE = /([A-J])(\d+):([A-J])(\d+)/g
const FUNC_NAMES = 'SUMPRODUCT|MINIFS|MAXIFS|COUNTIFS|SUMIFS|SUMIF|COUNTIF|COUNTBLANK|COUNTUNIQUE|AVERAGEIF|COUNTA|SUM|AVERAGE|MIN|MAX|COUNT|MEDIAN|MODE|PRODUCT|LARGE|SMALL|RANK|STDEVP|STDEV|VARP|VAR|ROUNDUP|ROUNDDOWN|ROUND|ABS|FLOOR|CEIL|SQRT|IF|POWER|MOD|INT|LN|LOG|EXP|CONCATENATE|CONCAT|HYPERLINK|LEN|UPPER|LOWER|LEFT|RIGHT|MID|TRIM|CLEAN|REGEXMATCH|REGEXEXTRACT|REGEXREPLACE|T|SUBSTITUTE|FIND|SEARCH|REPT|PROPER|TEXTJOIN|EXACT|REPLACE|DOLLAR|TEXT|TODAY|NOW|DATE|YEAR|MONTH|DAY|DAYS|HOUR|MINUTE|SECOND|TIME|WEEKDAY|EDATE|EOMONTH|NETWORKDAYS|DATEDIF|AND|OR|XOR|NOT|TRUE|FALSE|ISBLANK|ISNUMBER|ISTEXT|ISERROR|ISEVEN|ISODD|IFS|SWITCH|VLOOKUP|HLOOKUP|XLOOKUP|OFFSET|INDIRECT|ADDRESS|ROW|COLUMN|INDEX|MATCH|IFERROR|IFNA|CHAR|CODE|VALUE|N|TRUNC|SIGN|PI|EVEN|ODD|RANDBETWEEN|RAND|GCD|LCM|BITAND|BITOR|BITXOR|BITLSHIFT|BITRSHIFT|MROUND|QUOTIENT|SQRTPI|ASIN|ACOS|ATAN2|ATAN|SIN|COS|TAN|DEGREES|RADIANS'
export const FUNC_RE = new RegExp(`(${FUNC_NAMES})\\(([^()]*)\\)`, 'gi')

export const expandRange = (a: string, ar: string, b: string, br: string): string[] => {
  const c1 = a.charCodeAt(0), c2 = b.charCodeAt(0)
  const r1 = Number(ar), r2 = Number(br)
  const refs: string[] = []
  for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
      refs.push(String.fromCharCode(c) + r)
    }
  }
  return refs
}

export const collectRefs = (args: string): string[] => {
  const refs: string[] = []
  args.replace(RANGE_RE, (_x, a, ar, b, br) => {
    refs.push(...expandRange(a, ar, b, br))
    return ''
  })
  args.replace(A1_RE, (_x, c, r) => {
    const ref = `${c}${r}`
    if (!refs.includes(ref)) refs.push(ref)
    return ''
  })
  return refs
}

export function refsInFormula(raw: string): string[] {
  if (!raw.startsWith('=')) return []
  return collectRefs(raw.slice(1))
}
