import { useEffect } from 'react'
import { MAX_COL_COUNT, normalizeCondRule, type CondFormatOp, type NormalizedCondRule, type SheetOps } from '../../../entities/Sheet/schema'
import { addValue, removeValue, replaceValue } from '../../../shared/lib/dictOps'
import { migrateLegacyKey } from '../../../shared/lib/legacyMigrate'

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

export interface CondMutationCommands {
  addRule: (rule: CondRule) => boolean
  replaceRule: (index: number, rule: CondRule) => boolean
  removeRule: (index: number) => boolean
  clearAll: () => boolean
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

const sameCondRule = (a: CondRule, b: CondRule): boolean =>
  a.col === b.col && a.op === b.op && a.value === b.value && a.color === b.color

export const setCondRule = (rules: readonly CondRule[], ops: SheetOps, rule: CondRule, bounds?: CondBounds, commands?: CondMutationCommands): boolean => {
  const normalized = normalizeCondRule(rule, { colCount: bounds?.colCount ?? MAX_COL_COUNT })
  if (!normalized) return false
  const idx = rules.findIndex((x) => x.col === normalized.col)
  if (idx >= 0) {
    if (sameCondRule(rules[idx], normalized)) return false
    if (commands?.replaceRule(idx, normalized)) return true
    replaceValue(ops, `/condFormat/${idx}`, normalized)
  } else {
    if (commands?.addRule(normalized)) return true
    addValue(ops, '/condFormat/-', normalized)
  }
  return true
}

export function useCondFormat(rules: CondRule[], ops: SheetOps, bounds?: CondBounds, commands?: CondMutationCommands) {
  const colCount = bounds?.colCount ?? MAX_COL_COUNT

  useEffect(() => { migrateLegacy(rules, ops, { colCount }) }, [rules, ops, colCount])

  const addRule = (r: CondRule) => { setCondRule(rules, ops, r, { colCount }, commands) }
  const clearRule = (col: string) => {
    const idx = rules.findIndex((x) => x.col === col)
    if (idx >= 0 && !commands?.removeRule(idx)) removeValue(ops, `/condFormat/${idx}`)
  }
  const clearAll = () => { if (rules.length && !commands?.clearAll()) ops.replace('/condFormat', []) }

  const bgFor = (col: string, displayed: string): string | undefined => {
    for (const r of rules) {
      const normalized = normalizeCondRule(r, { colCount })
      if (normalized?.col === col && matchRule(normalized, displayed)) return normalized.color
    }
    return undefined
  }

  return { addRule, clearRule, clearAll, bgFor }
}
