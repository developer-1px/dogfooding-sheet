import { cellIdToKey, parseA1 } from '../../../entities/Sheet/schema'

export const targetCellKeys = (selectedIds: readonly string[], focusKey: string | null): string[] => {
  const rawKeys = selectedIds.length > 0 ? selectedIds.map(cellIdToKey) : focusKey ? [focusKey] : []
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
