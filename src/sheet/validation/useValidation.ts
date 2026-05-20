import { useEffect } from 'react'
import type { Cells, SheetOps } from '../schema'
import { upsertKeys } from '../../lib/dictOps'
import type { Patch } from '../../lib/dictOps'
import { migrateLegacyKey } from '../../lib/legacyMigrate'

export interface ListRule { type: 'list'; options: string[] }
export interface CheckboxRule { type: 'checkbox' }
export type Rule = ListRule | CheckboxRule
export type RuleLookup = (k: string) => Rule | undefined

export interface ValidationActions {
  setListRule: (keys: string[], options: string[]) => void
  setCheckboxRule: (keys: string[]) => void
  clearRule: (keys: string[]) => void
}

export const normalizeCheckboxValue = (value: string | undefined): 'TRUE' | 'FALSE' => {
  const s = (value ?? '').trim().toLowerCase()
  if (s === 'true' || s === '1' || s === 'yes' || s === 'y' || s === 'on' || s === 'checked') return 'TRUE'
  return 'FALSE'
}

export function checkboxConversionPatch(rules: Record<string, Rule>, cells: Cells, keys: string[]): Patch {
  const patch: Patch = []
  for (const key of keys) {
    const rulePath = `/validation/${key}`
    if (rules[key] === undefined) patch.push({ op: 'add', path: rulePath, value: { type: 'checkbox' } })
    else if (rules[key]?.type !== 'checkbox') patch.push({ op: 'replace', path: rulePath, value: { type: 'checkbox' } })

    const value = normalizeCheckboxValue(cells[key])
    const cellPath = `/cells/${key}`
    if (cells[key] === undefined) patch.push({ op: 'add', path: cellPath, value })
    else if (cells[key] !== value) patch.push({ op: 'replace', path: cellPath, value })
  }
  return patch
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

export function useValidation(rules: Record<string, Rule>, cells: Cells, ops: SheetOps) {
  useEffect(() => { migrateLegacy(rules, ops) }, [rules, ops])

  const setListRule = (keys: string[], options: string[]) => {
    const value: Rule | undefined = options.length === 0 ? undefined : { type: 'list', options }
    upsertKeys(ops, '/validation', rules, keys.map((k) => [k, value]))
  }
  const clearRule = (keys: string[]) => upsertKeys(ops, '/validation', rules, keys.map((k) => [k, undefined]))
  const setCheckboxRule = (keys: string[]) => {
    const patch = checkboxConversionPatch(rules, cells, keys)
    if (patch.length) ops.patch(patch as never)
  }

  return { setListRule, setCheckboxRule, clearRule, ruleOf: (k: string): Rule | undefined => rules[k] }
}
