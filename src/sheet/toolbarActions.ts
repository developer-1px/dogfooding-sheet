import { autoSumFormula } from '@spredsheet/grid'
import type { Format } from './formatting/formatTypes'
import { CLEAR_STYLE, type CellStyle, type StyleLookup } from './formatting/useStyles'
import { normalizeFilterText, type Filter } from './visibility/useFilter'
import type { ValidationActions } from './validation/useValidation'
import type { Ask } from './usePrompt'
import { cellIdToKey, cellKey, isSafeColor, normalizeValidationOptions, parseA1, type Display, type WriteCell } from './schema'

export type ToolbarActionResult = 'applied' | 'cleared' | 'cancelled' | 'invalid' | 'no-target'
export type ToolbarStyleFlag = 'b' | 'i' | 'u' | 's' | 'w' | 'bd'
export type ToolbarAlignment = CellStyle['a']

export const targetCellKeys = (selectedIds: readonly string[], focusKey: string | null): string[] => {
  const rawKeys = (selectedIds.length > 0 ? selectedIds.map(cellIdToKey) : focusKey ? [focusKey] : [])
  const keys: string[] = []
  const seen = new Set<string>()
  for (const key of rawKeys) {
    const parsed = parseA1(key)
    if (!parsed || parsed.row < 0 || seen.has(key)) continue
    seen.add(key)
    keys.push(key)
  }
  return keys
}

export const validationOptionsFromCsv = (csv: string): string[] =>
  normalizeValidationOptions(csv.split(','))

export function applyToolbarAutoSum({
  focusKey,
  display,
  writeCell,
}: {
  focusKey: string | null
  display: Display
  writeCell: WriteCell
}): boolean {
  const focus = focusKey ? parseA1(focusKey) : null
  if (!focus) return false
  const formula = autoSumFormula(focus.col, focus.row, display)
  if (!formula) return false
  writeCell(cellKey(focus.col, focus.row), formula)
  return true
}

export async function promptToolbarFilter({
  ask,
  focusKey,
  filter,
  applyFilter,
  clearFilter,
}: {
  ask: Ask
  focusKey: string | null
  filter: Filter | null
  applyFilter: (col: string, text: string) => void
  clearFilter: () => void
}): Promise<ToolbarActionResult> {
  const focus = focusKey ? parseA1(focusKey) : null
  if (!focus) return 'no-target'

  let text: string | null
  try {
    text = await ask({ label: `${focus.col}열에서 찾을 값`, initial: filter?.text ?? '', submitLabel: '필터' })
  } catch {
    return 'cancelled'
  }
  if (text === null) return 'cancelled'
  const normalized = normalizeFilterText(text)
  if (normalized === null) return 'invalid'
  if (normalized === '') {
    clearFilter()
    return 'cleared'
  }
  applyFilter(focus.col, normalized)
  return 'applied'
}

export async function promptListValidation({
  ask,
  selectedIds,
  focusKey,
  setListRule,
  clearRule,
}: {
  ask: Ask
  selectedIds: readonly string[]
  focusKey: string | null
  setListRule: ValidationActions['setListRule']
  clearRule: ValidationActions['clearRule']
}): Promise<ToolbarActionResult> {
  const keys = targetCellKeys(selectedIds, focusKey)
  if (keys.length === 0) return 'no-target'

  let csv: string | null
  try {
    csv = await ask({ label: '허용 값 (쉼표 구분, 비우면 해제)', submitLabel: '적용' })
  } catch {
    return 'cancelled'
  }
  if (csv === null) return 'cancelled'

  const options = validationOptionsFromCsv(csv)
  if (options.length === 0) {
    clearRule(keys)
    return 'cleared'
  }
  setListRule(keys, options)
  return 'applied'
}

export function applyCheckboxValidation({
  selectedIds,
  focusKey,
  setCheckboxRule,
}: {
  selectedIds: readonly string[]
  focusKey: string | null
  setCheckboxRule: ValidationActions['setCheckboxRule']
}): boolean {
  const keys = targetCellKeys(selectedIds, focusKey)
  if (keys.length === 0) return false
  setCheckboxRule(keys)
  return true
}

export function applyToolbarFormat({
  selectedIds,
  focusKey,
  format,
  setFormat,
}: {
  selectedIds: readonly string[]
  focusKey: string | null
  format: Format
  setFormat: (keys: string[], format: Format) => void
}): boolean {
  const keys = targetCellKeys(selectedIds, focusKey)
  if (keys.length === 0) return false
  setFormat(keys, format)
  return true
}

export function toggleToolbarStyle({
  selectedIds,
  focusKey,
  flag,
  styleOf,
  updateStyle,
}: {
  selectedIds: readonly string[]
  focusKey: string | null
  flag: ToolbarStyleFlag
  styleOf: StyleLookup
  updateStyle: (keys: string[], patch: Partial<CellStyle>) => void
}): boolean {
  const keys = targetCellKeys(selectedIds, focusKey)
  if (keys.length === 0) return false
  updateStyle(keys, { [flag]: !(focusKey && styleOf(focusKey)?.[flag]) })
  return true
}

export function setToolbarAlignment({
  selectedIds,
  focusKey,
  alignment,
  updateStyle,
}: {
  selectedIds: readonly string[]
  focusKey: string | null
  alignment: ToolbarAlignment
  updateStyle: (keys: string[], patch: Partial<CellStyle>) => void
}): boolean {
  const keys = targetCellKeys(selectedIds, focusKey)
  if (keys.length === 0) return false
  updateStyle(keys, { a: alignment })
  return true
}

export function setToolbarColor({
  selectedIds,
  focusKey,
  target,
  color,
  updateStyle,
}: {
  selectedIds: readonly string[]
  focusKey: string | null
  target: 'bg' | 'fg'
  color: string
  updateStyle: (keys: string[], patch: Partial<CellStyle>) => void
}): boolean {
  const keys = targetCellKeys(selectedIds, focusKey)
  if (keys.length === 0) return false
  if (!isSafeColor(color)) return false
  updateStyle(keys, { [target]: color })
  return true
}

export function clearToolbarStyle({
  selectedIds,
  focusKey,
  updateStyle,
}: {
  selectedIds: readonly string[]
  focusKey: string | null
  updateStyle: (keys: string[], patch: Partial<CellStyle>) => void
}): boolean {
  const keys = targetCellKeys(selectedIds, focusKey)
  if (keys.length === 0) return false
  updateStyle(keys, CLEAR_STYLE)
  return true
}
