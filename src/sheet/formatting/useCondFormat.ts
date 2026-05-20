import { useEffect } from 'react'
import { MAX_COL_COUNT, normalizeCondRule, type CondFormatOp, type NormalizedCondRule, type SheetOps } from '../schema'
import { addValue, removeValue, replaceValue } from '../../lib/dictOps'
import { migrateLegacyKey } from '../../lib/legacyMigrate'

const LEGACY_KEY = 'spreadsheet:condfmt:v1'

export type CondOp = CondFormatOp
export type CondRule = NormalizedCondRule

interface CondBounds {
  colCount: number
}

export interface CondActions {
  addCondRule: (r: CondRule) => void
  clearCondRules: () => void
}

export const matchRule = (rule: CondRule, displayed: string): boolean => {
  if (rule.op === 'contains') return displayed.toLowerCase().includes(rule.value.toLowerCase())
  if (rule.op === '=') return displayed === rule.value
  if (rule.op === '!=') return displayed !== rule.value
  const a = Number(displayed), b = Number(rule.value)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false
  return rule.op === '>' ? a > b : a < b
}

export const coerceLegacyCondRules = (raw: unknown, bounds?: CondBounds): CondRule[] | undefined => {
  if (!Array.isArray(raw)) return undefined
  const byCol = new Map<string, CondRule>()
  const colCount = bounds?.colCount ?? MAX_COL_COUNT
  for (const rule of raw) {
    if (!rule || typeof rule !== 'object') continue
    const normalized = normalizeCondRule(rule, { colCount })
    if (normalized) byCol.set(normalized.col, normalized)
  }
  const rules = [...byCol.values()]
  return rules.length > 0 ? rules : undefined
}

const migrateLegacy = (rules: CondRule[], ops: SheetOps, bounds?: CondBounds) =>
  migrateLegacyKey(LEGACY_KEY, rules.length === 0, ops,
    (raw) => coerceLegacyCondRules(raw, bounds),
    (o, v) => o.replace('/condFormat', v),
  )

export function useCondFormat(rules: CondRule[], ops: SheetOps, bounds?: CondBounds) {
  const colCount = bounds?.colCount ?? MAX_COL_COUNT

  useEffect(() => { migrateLegacy(rules, ops, { colCount }) }, [rules, ops, colCount])

  const addRule = (r: CondRule) => {
    const normalized = normalizeCondRule(r, { colCount })
    if (!normalized) return
    const idx = rules.findIndex((x) => x.col === normalized.col)
    if (idx >= 0) replaceValue(ops, `/condFormat/${idx}`, normalized)
    else addValue(ops, '/condFormat/-', normalized)
  }
  const clearRule = (col: string) => {
    const idx = rules.findIndex((x) => x.col === col)
    if (idx >= 0) removeValue(ops, `/condFormat/${idx}`)
  }
  const clearAll = () => { if (rules.length) ops.replace('/condFormat', []) }

  const bgFor = (col: string, displayed: string): string | undefined => {
    for (const r of rules) {
      const normalized = normalizeCondRule(r, { colCount })
      if (normalized?.col === col && matchRule(normalized, displayed)) return normalized.color
    }
    return undefined
  }

  return { addRule, clearRule, clearAll, bgFor }
}
