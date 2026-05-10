import { useEffect, useState } from 'react'

const STORAGE_KEY = 'spreadsheet:validation:v1'

export interface ListRule {
  type: 'list'
  options: string[]
}

const load = (): Record<string, ListRule> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw)
    if (!obj || typeof obj !== 'object') return {}
    const out: Record<string, ListRule> = {}
    for (const [k, v] of Object.entries(obj)) {
      const r = v as Partial<ListRule>
      if (r?.type === 'list' && Array.isArray(r.options)) out[k] = { type: 'list', options: r.options.map(String) }
    }
    return out
  } catch { return {} }
}

export function useValidation() {
  const [rules, setRules] = useState<Record<string, ListRule>>(load)

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

  const ruleOf = (k: string): ListRule | undefined => rules[k]

  return { rules, setListRule, clearRule, ruleOf }
}
