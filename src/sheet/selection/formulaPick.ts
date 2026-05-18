import { cellKey, parseCellId } from '../schema'
import { formatRect, idsInRect, rectFromRefs } from '@spredsheet/grid'

const TRAILING_REF_RE = /\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?$/i
const REF_RE = /^(\$?)([A-Z]{1,3})(\$?)(\d+)$/i

export function replaceTrailingFormulaRef(draft: string, ref: string): string {
  if (!draft.startsWith('=')) return draft
  return TRAILING_REF_RE.test(draft)
    ? draft.replace(TRAILING_REF_RE, ref)
    : `${draft}${ref}`
}

function cycleAbs(ref: string): string {
  const m = REF_RE.exec(ref)
  if (!m) return ref
  const [, absCol, col, absRow, row] = m
  const next =
    !absCol && !absRow ? ['$', '$']
      : absCol && absRow ? ['', '$']
        : !absCol && absRow ? ['$', '']
          : ['', '']
  return `${next[0]}${col.toUpperCase()}${next[1]}${row}`
}

export function cycleTrailingFormulaRef(draft: string): string {
  if (!draft.startsWith('=')) return draft
  return draft.replace(TRAILING_REF_RE, (ref) => ref.split(':').map(cycleAbs).join(':'))
}

export function refForFormulaPick(anchorId: string, targetId: string): string | null {
  const anchor = parseCellId(anchorId)
  const target = parseCellId(targetId)
  if (!anchor || !target) return null
  return anchorId === targetId
    ? cellKey(target.col, target.row)
    : formatRect(rectFromRefs(anchor, target))
}

export function idsForFormulaPick(anchorId: string, targetId: string): string[] {
  const anchor = parseCellId(anchorId)
  const target = parseCellId(targetId)
  return anchor && target ? idsInRect(rectFromRefs(anchor, target)) : []
}
