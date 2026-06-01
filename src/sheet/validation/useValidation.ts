import { useEffect } from 'react'
import { colIndex, normalizeValidationOptions, parseA1, type Cells, type SheetOps } from '../schema'
import { applyPatch, upsertKeys, type Patch, type RecordMutationCommands } from '../../lib/dictOps'
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

interface ValidationBounds {
  rowCount: number
  colCount: number
}

const validCellKey = (key: string, bounds?: ValidationBounds): boolean => {
  const ref = parseA1(key)
  if (!ref) return false
  if (!bounds) return true
  const col = colIndex(ref.col)
  return ref.row >= 0 && ref.row < bounds.rowCount && col >= 0 && col < bounds.colCount
}

const validKeys = (keys: readonly string[], bounds?: ValidationBounds): string[] => {
  const out: string[] = []
  const seen = new Set<string>()
  for (const key of keys) {
    if (!validCellKey(key, bounds) || seen.has(key)) continue
    seen.add(key)
    out.push(key)
  }
  return out
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const coerceLegacyValidationRules = (raw: unknown, bounds?: ValidationBounds): Record<string, Rule> | undefined => {
  if (!isRecord(raw)) return undefined
  const out: Record<string, Rule> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!validCellKey(key, bounds) || !isRecord(value) || typeof value.type !== 'string') continue
    if (value.type === 'checkbox') out[key] = { type: 'checkbox' }
    else if (value.type === 'list' && Array.isArray(value.options)) {
      const options = normalizeValidationOptions(value.options)
      if (options.length > 0) out[key] = { type: 'list', options }
    }
  }
  return Object.keys(out).length > 0 ? out : undefined
}

const migrateLegacy = (rules: Record<string, Rule>, ops: SheetOps, bounds?: ValidationBounds) =>
  migrateLegacyKey(LEGACY_KEY, Object.keys(rules).length === 0, ops,
    (raw) => coerceLegacyValidationRules(raw, bounds),
    (o, v) => o.replace('/validation', v),
  )

export const sameValidationRule = (a: Rule, b: Rule): boolean => {
  if (a.type !== b.type) return false
  if (a.type === 'checkbox' || b.type === 'checkbox') return true
  return a.options.length === b.options.length && a.options.every((option, index) => option === b.options[index])
}

export const setListValidationRule = (
  rules: Record<string, Rule>,
  ops: SheetOps,
  keys: string[],
  options: string[],
  bounds?: ValidationBounds,
  commands?: RecordMutationCommands<Rule>,
): void => {
  const targetKeys = validKeys(keys, bounds)
  const normalized = normalizeValidationOptions(options)
  const value: Rule | undefined = normalized.length === 0 ? undefined : { type: 'list', options: normalized }
  upsertKeys(ops, '/validation', rules, targetKeys.map((k) => [k, value]), sameValidationRule, commands)
}

export function useValidation(rules: Record<string, Rule>, cells: Cells, ops: SheetOps, bounds?: ValidationBounds, commands?: RecordMutationCommands<Rule>) {
  const rowCount = bounds?.rowCount
  const colCount = bounds?.colCount
  useEffect(() => {
    migrateLegacy(rules, ops, rowCount !== undefined && colCount !== undefined ? { rowCount, colCount } : undefined)
  }, [rules, ops, rowCount, colCount])

  const setListRule = (keys: string[], options: string[]) => setListValidationRule(rules, ops, keys, options, bounds, commands)
  const clearRule = (keys: string[]) => upsertKeys(ops, '/validation', rules, validKeys(keys, bounds).map((k) => [k, undefined]), undefined, commands)
  const setCheckboxRule = (keys: string[]) => {
    const patch = checkboxConversionPatch(rules, cells, validKeys(keys, bounds))
    applyPatch(ops, patch)
  }

  return { setListRule, setCheckboxRule, clearRule, ruleOf: (k: string): Rule | undefined => rules[k] }
}
