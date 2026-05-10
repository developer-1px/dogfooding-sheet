import { useEffect, useState } from 'react'

const STORAGE_KEY = 'spreadsheet:validation:v1'

export interface ListRule { type: 'list'; options: string[] }
export interface CheckboxRule { type: 'checkbox' }
export type Rule = ListRule | CheckboxRule

const load = (): Record<string, Rule> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw)
    if (!obj || typeof obj !== 'object') return {}
    const out: Record<string, Rule> = {}
    for (const [k, v] of Object.entries(obj)) {
      const r = v as Partial<ListRule & CheckboxRule>
      if (r?.type === 'list' && Array.isArray(r.options)) out[k] = { type: 'list', options: r.options.map(String) }
      else if (r?.type === 'checkbox') out[k] = { type: 'checkbox' }
    }
    return out
  } catch { return {} }
}

export function useValidation() {
  const [rules, setRules] = useState<Record<string, Rule>>(load)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rules)) } catch { /* quota */ }
  }, [rules])

  const setListRule = (keys: string[], options: string[]) => {
    setRules((prev) => {
      const next = { ...prev }
      for (const k of keys) {
        if (options.length === 0) delete next[k]
        else next[k] = { type: 'list', options }
      }
      return next
    })
  }

  const clearRule = (keys: string[]) => {
    setRules((prev) => {
      const next = { ...prev }
      for (const k of keys) delete next[k]
      return next
    })
  }

  const setCheckboxRule = (keys: string[]) => {
    setRules((prev) => { const next = { ...prev }; for (const k of keys) next[k] = { type: 'checkbox' }; return next })
  }

  const ruleOf = (k: string): Rule | undefined => rules[k]

  return { rules, setListRule, setCheckboxRule, clearRule, ruleOf }
}
