import { useEffect } from 'react'
import type { JsonOps } from 'zod-crud'
import type { Sheet } from './schema'
import { upsertKey } from './lib/dictOps'

export interface ListRule { type: 'list'; options: string[] }
export interface CheckboxRule { type: 'checkbox' }
export type Rule = ListRule | CheckboxRule

const LEGACY_KEY = 'spreadsheet:validation:v1'

function migrateLegacy(rules: Record<string, Rule>, ops: JsonOps<Sheet>) {
  if (Object.keys(rules).length > 0) return
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    const obj = JSON.parse(raw)
    if (!obj || typeof obj !== 'object') return
    const out: Record<string, Rule> = {}
    for (const [k, v] of Object.entries(obj)) {
      const r = v as { type?: string; options?: unknown }
      if (r?.type === 'list' && Array.isArray(r.options)) out[k] = { type: 'list', options: r.options.map(String) }
      else if (r?.type === 'checkbox') out[k] = { type: 'checkbox' }
    }
    if (Object.keys(out).length > 0) ops.replace('/validation', out)
    localStorage.removeItem(LEGACY_KEY)
  } catch { /* ignore */ }
}

export function useValidation(rules: Record<string, Rule>, ops: JsonOps<Sheet>) {
  useEffect(() => { migrateLegacy(rules, ops) }, [])

  const setListRule = (keys: string[], options: string[]) => {
    const value: Rule | undefined = options.length === 0 ? undefined : { type: 'list', options }
    for (const k of keys) upsertKey(ops, '/validation', rules, k, value)
  }

  const clearRule = (keys: string[]) => {
    for (const k of keys) upsertKey(ops, '/validation', rules, k, undefined)
  }

  const setCheckboxRule = (keys: string[]) => {
    for (const k of keys) upsertKey(ops, '/validation', rules, k, { type: 'checkbox' })
  }

  return { setListRule, setCheckboxRule, clearRule, ruleOf: (k: string): Rule | undefined => rules[k] }
}
