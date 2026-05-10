import { useEffect } from 'react'
import type { JsonOps } from 'zod-crud'
import type { Sheet } from './schema'

const LEGACY_KEY = 'spreadsheet:condfmt:v1'

export type CondOp = '>' | '<' | '=' | '!=' | 'contains'
export interface CondRule { col: string; op: CondOp; value: string; color: string }

export const matchRule = (rule: CondRule, displayed: string): boolean => {
  if (rule.op === 'contains') return displayed.toLowerCase().includes(rule.value.toLowerCase())
  if (rule.op === '=') return displayed === rule.value
  if (rule.op === '!=') return displayed !== rule.value
  const a = Number(displayed), b = Number(rule.value)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false
  return rule.op === '>' ? a > b : a < b
}

function migrateLegacy(rules: CondRule[], ops: JsonOps<Sheet>) {
  if (rules.length > 0) return
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    const a = JSON.parse(raw)
    if (Array.isArray(a) && a.length > 0) ops.replace('/condFormat', a as CondRule[])
    localStorage.removeItem(LEGACY_KEY)
  } catch { /* ignore */ }
}

export function useCondFormat(rules: CondRule[], ops: JsonOps<Sheet>) {
  useEffect(() => { migrateLegacy(rules, ops) }, [])

  const addRule = (r: CondRule) => ops.replace('/condFormat', [...rules.filter((x) => x.col !== r.col), r])
  const clearRule = (col: string) => ops.replace('/condFormat', rules.filter((x) => x.col !== col))
  const clearAll = () => ops.replace('/condFormat', [])

  const bgFor = (col: string, displayed: string): string | undefined => {
    for (const r of rules) {
      if (r.col === col && matchRule(r, displayed)) return r.color
    }
    return undefined
  }

  return { addRule, clearRule, clearAll, bgFor }
}
