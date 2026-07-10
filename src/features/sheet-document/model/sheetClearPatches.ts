import type { Patch } from '../../../shared/lib/dictOps'
import type { Cells, Sheet } from '../../../entities/Sheet/schema'

const hasRecordEntries = (record: Record<string, unknown>): boolean =>
  Object.keys(record).length > 0

export const clearCellValuesPatch = (cells: Cells): Patch =>
  hasRecordEntries(cells) ? [{ op: 'replace', path: '/cells', value: {} }] : []

export const clearAllFormatsPatch = (
  sheet: Pick<Sheet, 'styles' | 'formats' | 'condFormat'>,
): Patch => {
  const patch: Patch = []
  if (hasRecordEntries(sheet.styles)) patch.push({ op: 'replace', path: '/styles', value: {} })
  if (hasRecordEntries(sheet.formats)) patch.push({ op: 'replace', path: '/formats', value: {} })
  if (sheet.condFormat.length > 0) patch.push({ op: 'replace', path: '/condFormat', value: [] })
  return patch
}
