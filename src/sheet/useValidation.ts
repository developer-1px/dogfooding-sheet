import { useEffect } from 'react'
import type { SheetOps } from './schema'
import { upsertKeys } from '../lib/dictOps'
import { migrateLegacyKey } from '../lib/legacyMigrate'

export interface ListRule { type: 'list'; options: string[] }
export interface CheckboxRule { type: 'checkbox' }
export type Rule = ListRule | CheckboxRule
export type RuleLookup = (k: string) => Rule | undefined

export interface ValidationActions {
  setListRule: (keys: string[], options: string[]) => void
  setCheckboxRule: (keys: string[]) => void
  clearRule: (keys: string[]) => void
}

const LEGACY_KEY = 'spreadsheet:validation:v1'

const migrateLegacy = (rules: Record<string, Rule>, ops: SheetOps) =>
  migrateLegacyKey(LEGACY_KEY, Object.keys(rules).length === 0, ops,
    (raw) => {
      if (!raw || typeof raw !== 'object') return undefined
      const out: Record<string, Rule> = {}
      for (const [k, v] of Object.entries(raw)) {
        const r = v as { type?: string; options?: unknown }
        if (r?.type === 'list' && Array.isArray(r.options)) out[k] = { type: 'list', options: r.options.map(String) }
        else if (r?.type === 'checkbox') out[k] = { type: 'checkbox' }
      }
      return Object.keys(out).length > 0 ? out : undefined
    },
    (o, v) => o.replace('/validation', v),
  )

export function useValidation(rules: Record<string, Rule>, ops: SheetOps) {
  useEffect(() => { migrateLegacy(rules, ops) }, [])

  const setListRule = (keys: string[], options: string[]) => {
    const value: Rule | undefined = options.length === 0 ? undefined : { type: 'list', options }
    upsertKeys(ops, '/validation', rules, keys.map((k) => [k, value]))
  }
  const clearRule = (keys: string[]) => upsertKeys(ops, '/validation', rules, keys.map((k) => [k, undefined]))
  const setCheckboxRule = (keys: string[]) => upsertKeys(ops, '/validation', rules, keys.map((k) => [k, { type: 'checkbox' as const }]))

  return { setListRule, setCheckboxRule, clearRule, ruleOf: (k: string): Rule | undefined => rules[k] }
}
