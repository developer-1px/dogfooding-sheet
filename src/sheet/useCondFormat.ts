import { useEffect } from 'react'
import type { SheetOps } from './schema'
import { migrateLegacyKey } from '../lib/legacyMigrate'

const LEGACY_KEY = 'spreadsheet:condfmt:v1'

export type CondOp = '>' | '<' | '=' | '!=' | 'contains'
export interface CondRule { col: string; op: CondOp; value: string; color: string }

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

const migrateLegacy = (rules: CondRule[], ops: SheetOps) =>
  migrateLegacyKey(LEGACY_KEY, rules.length === 0, ops,
    (raw) => Array.isArray(raw) && raw.length > 0 ? raw as CondRule[] : undefined,
    (o, v) => o.replace('/condFormat', v),
  )

export function useCondFormat(rules: CondRule[], ops: SheetOps) {
  useEffect(() => { migrateLegacy(rules, ops) }, [])

  const addRule = (r: CondRule) => {
    const idx = rules.findIndex((x) => x.col === r.col)
    if (idx >= 0) ops.replace(`/condFormat/${idx}` as never, r as never)
    else ops.add('/condFormat/-' as never, r as never)
  }
  const clearRule = (col: string) => {
    const idx = rules.findIndex((x) => x.col === col)
    if (idx >= 0) ops.remove(`/condFormat/${idx}` as never)
  }
  const clearAll = () => { if (rules.length) ops.replace('/condFormat', []) }

  const bgFor = (col: string, displayed: string): string | undefined => {
    for (const r of rules) {
      if (r.col === col && matchRule(r, displayed)) return r.color
    }
    return undefined
  }

  return { addRule, clearRule, clearAll, bgFor }
}
