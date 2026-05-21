import { colIndex, normalizeMergeList, parseA1 } from '@spredsheet/grid'
import { COLUMN_WIDTH_BOUNDS, DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT, ROW_HEIGHT_BOUNDS, storedResizeValue } from '@spredsheet/editable-grid/resize-rules'
import { normalizeStoredFormat } from './formatting/formatTypes'
import { isSafeCellText, sanitizeCellRecord } from './cellValue'
import { normalizeNoteText } from './noteText'
import {
  normalizeCellStyle,
  normalizeCondRule,
  normalizeFreeze,
  normalizeValidationOptions,
} from './sheetStyleModel'
import type { RawTabBundle } from './sheetTabBundleSchema'

const isColInBounds = (col: string, colCount: number): boolean => {
  const index = colIndex(col)
  return index >= 0 && index < colCount
}

const isRowInBounds = (row: number, rowCount: number): boolean =>
  Number.isInteger(row) && row >= 0 && row < rowCount

const isCellKeyInBounds = (key: string, bundle: Pick<RawTabBundle, 'rowCount' | 'colCount'>): boolean => {
  const ref = parseA1(key)
  return !!ref && isRowInBounds(ref.row, bundle.rowCount) && isColInBounds(ref.col, bundle.colCount)
}

const sanitizeCellScopedRecord = <V>(
  record: Record<string, V>,
  bundle: Pick<RawTabBundle, 'rowCount' | 'colCount'>,
  normalize: (value: V) => V | undefined = (value) => value,
): Record<string, V> => {
  const out: Record<string, V> = {}
  for (const [key, value] of Object.entries(record)) {
    if (!isCellKeyInBounds(key, bundle)) continue
    const next = normalize(value)
    if (next !== undefined) out[key] = next
  }
  return out
}

const sanitizeValidation = (
  rules: RawTabBundle['validation'],
  bundle: Pick<RawTabBundle, 'rowCount' | 'colCount'>,
): RawTabBundle['validation'] =>
  sanitizeCellScopedRecord(rules, bundle, (rule) => {
    if (rule.type === 'checkbox') return rule
    const options = normalizeValidationOptions(rule.options)
    return options.length > 0 ? { type: 'list', options } : undefined
  })

const sanitizeCondFormat = (
  rules: RawTabBundle['condFormat'],
  bundle: Pick<RawTabBundle, 'colCount'>,
): RawTabBundle['condFormat'] => {
  const byCol = new Map<string, RawTabBundle['condFormat'][number]>()
  for (const rule of rules) {
    const normalized = normalizeCondRule(rule, bundle)
    if (normalized) byCol.set(normalized.col, normalized)
  }
  return [...byCol.values()]
}

const sanitizeHidden = (hidden: RawTabBundle['hidden'], bundle: Pick<RawTabBundle, 'rowCount' | 'colCount'>): RawTabBundle['hidden'] => {
  const rows = new Set<number>()
  const cols = new Set<string>()
  for (const row of hidden.rows) {
    if (isRowInBounds(row, bundle.rowCount)) rows.add(row)
  }
  for (const col of hidden.cols) {
    if (isColInBounds(col, bundle.colCount)) cols.add(col)
  }
  return { rows: [...rows].sort((a, b) => a - b), cols: [...cols] }
}

const sanitizeColWidths = (widths: RawTabBundle['colWidths'], bundle: Pick<RawTabBundle, 'colCount'>): RawTabBundle['colWidths'] => {
  const out: RawTabBundle['colWidths'] = {}
  for (const [col, width] of Object.entries(widths)) {
    if (isColInBounds(col, bundle.colCount) && Number.isFinite(width)) {
      const stored = storedResizeValue(width, COLUMN_WIDTH_BOUNDS)
      if (stored !== DEFAULT_COLUMN_WIDTH) out[col] = stored
    }
  }
  return out
}

const sanitizeRowHeights = (heights: RawTabBundle['rowHeights'], bundle: Pick<RawTabBundle, 'rowCount'>): RawTabBundle['rowHeights'] => {
  const out: RawTabBundle['rowHeights'] = {}
  for (const [rowKey, height] of Object.entries(heights)) {
    const row = /^\d+$/.test(rowKey) ? Number(rowKey) : NaN
    if (isRowInBounds(row, bundle.rowCount) && Number.isFinite(height)) {
      const stored = storedResizeValue(height, ROW_HEIGHT_BOUNDS)
      if (stored !== DEFAULT_ROW_HEIGHT) out[rowKey] = stored
    }
  }
  return out
}

const sanitizeMerges = (merges: RawTabBundle['merges'], bundle: Pick<RawTabBundle, 'rowCount' | 'colCount'>): RawTabBundle['merges'] =>
  normalizeMergeList(merges, bundle)

export const sanitizeTabBundle = <T extends RawTabBundle>(bundle: T): T => ({
  ...bundle,
  cells: sanitizeCellScopedRecord(sanitizeCellRecord(bundle.cells), bundle),
  notes: sanitizeCellScopedRecord(bundle.notes, bundle, (note) => {
    const normalized = normalizeNoteText(note)
    return normalized !== '' && isSafeCellText(normalized) ? normalized : undefined
  }),
  styles: sanitizeCellScopedRecord(bundle.styles, bundle, normalizeCellStyle),
  formats: sanitizeCellScopedRecord(bundle.formats, bundle, normalizeStoredFormat),
  validation: sanitizeValidation(bundle.validation, bundle),
  condFormat: sanitizeCondFormat(bundle.condFormat, bundle),
  freeze: normalizeFreeze(bundle.freeze, bundle),
  hidden: sanitizeHidden(bundle.hidden, bundle),
  colWidths: sanitizeColWidths(bundle.colWidths, bundle),
  rowHeights: sanitizeRowHeights(bundle.rowHeights, bundle),
  merges: sanitizeMerges(bundle.merges, bundle),
})
