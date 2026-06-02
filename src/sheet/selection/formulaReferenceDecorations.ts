import { ABS_A1_RE, resolveCellRef, resolveRange } from '@spredsheet/grid'

export interface FormulaReferenceCellDecoration {
  readonly index: number
  readonly token: string
  readonly className: string
}

export interface FormulaReferenceDecorations {
  readonly highlightedIds: string[]
  readonly byId: Map<string, FormulaReferenceCellDecoration>
}

interface FormulaReferenceBounds {
  readonly rowCount: number
  readonly colLetters: readonly string[]
}

interface FormulaReferenceToken {
  readonly token: string
  readonly start: number
  readonly end: number
  readonly ids: readonly string[]
}

const FORMULA_REF_CLASS_COUNT = 6
const FORMULA_RANGE_RE = /(?<![A-Z0-9_])\$?[A-Z]+\$?\d+:\$?[A-Z]+\$?\d+(?![A-Z0-9_])/g

const rangeOf = (match: RegExpExecArray): { start: number; end: number } => ({
  start: match.index,
  end: match.index + match[0].length,
})

const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }): boolean =>
  a.start < b.end && b.start < a.end

export function formulaReferenceDecorationsFor(
  editing: string | null,
  draft: string,
  bounds: FormulaReferenceBounds,
): FormulaReferenceDecorations {
  if (!editing || !draft.startsWith('=')) return { highlightedIds: [], byId: new Map() }

  const body = draft.slice(1).toUpperCase()
  const gridBounds = { rowCount: bounds.rowCount, colCount: bounds.colLetters.length }
  const tokens: FormulaReferenceToken[] = []
  const occupied: Array<{ start: number; end: number }> = []

  FORMULA_RANGE_RE.lastIndex = 0
  for (let match = FORMULA_RANGE_RE.exec(body); match; match = FORMULA_RANGE_RE.exec(body)) {
    const ids = resolveRange(match[0], gridBounds, bounds.colLetters)
    if (!ids?.length) continue
    const range = rangeOf(match)
    occupied.push(range)
    tokens.push({ token: match[0], ...range, ids })
  }

  ABS_A1_RE.lastIndex = 0
  for (let match = ABS_A1_RE.exec(body); match; match = ABS_A1_RE.exec(body)) {
    const range = rangeOf(match)
    if (occupied.some((taken) => overlaps(range, taken))) continue
    const id = resolveCellRef(match[0], gridBounds)
    if (!id) continue
    tokens.push({ token: match[0], ...range, ids: [id] })
  }

  tokens.sort((a, b) => a.start - b.start)
  const byId = new Map<string, FormulaReferenceCellDecoration>()
  const highlightedIds: string[] = []
  tokens.forEach((token, index) => {
    const decoration = {
      index,
      token: token.token,
      className: `formula-ref formula-ref-${index % FORMULA_REF_CLASS_COUNT}`,
    }
    token.ids.forEach((id) => {
      if (byId.has(id)) return
      byId.set(id, decoration)
      highlightedIds.push(id)
    })
  })

  return { highlightedIds, byId }
}
