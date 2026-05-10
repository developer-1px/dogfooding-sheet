import { useEffect, useState } from 'react'

const KEY = 'spreadsheet:condfmt:v1'

export type CondOp = '>' | '<' | '=' | '!=' | 'contains'
export interface CondRule { col: string; op: CondOp; value: string; color: string }

const load = (): CondRule[] => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const a = JSON.parse(raw)
    return Array.isArray(a) ? a : []
  } catch { return [] }
}

const matches = (rule: CondRule, displayed: string): boolean => {
  if (rule.op === 'contains') return displayed.toLowerCase().includes(rule.value.toLowerCase())
  if (rule.op === '=') return displayed === rule.value
  if (rule.op === '!=') return displayed !== rule.value
  const a = Number(displayed), b = Number(rule.value)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false
  return rule.op === '>' ? a > b : a < b
}

export function useCondFormat() {
  const [rules, setRules] = useState<CondRule[]>(load)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(rules)) } catch { /* quota */ } }, [rules])

  const addRule = (r: CondRule) => setRules((prev) => [...prev.filter((x) => x.col !== r.col), r])
  const clearRule = (col: string) => setRules((prev) => prev.filter((x) => x.col !== col))
  const clearAll = () => setRules([])

  const bgFor = (col: string, displayed: string): string | undefined => {
    for (const r of rules) {
      if (r.col === col && matches(r, displayed)) return r.color
    }
    return undefined
  }

  return { rules, addRule, clearRule, clearAll, bgFor }
}
