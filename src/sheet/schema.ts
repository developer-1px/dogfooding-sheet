import * as z from 'zod'
import type { JSONOps } from 'zod-crud'
import { COL_LETTERS as COLS, colIndex, parseA1 } from '@spredsheet/grid'
import { FORMAT_KEYS } from './formatting/formatTypes'
import { isSafeCellText, sanitizeCellRecord } from './cellValue'
import { normalizeNoteText } from './noteText'
import { COLUMN_WIDTH_BOUNDS, ROW_HEIGHT_BOUNDS, storedResizeValue } from './grid-view/resizeRules'

export { COL_LETTERS, cellKey, cellId, parseCellId, parseA1, cellIdToKey, colIndex, moveCellIdByDelta, A1_RE, type Cells, type Writes, type WriteCell, type WriteMany, type Display, type CellRef } from '@spredsheet/grid'

export const DEFAULT_ROW_COUNT = 20
export const DEFAULT_COL_COUNT = 10
export const MAX_ROW_COUNT = 1000
export const MAX_COL_COUNT = COLS.length
export const MAX_SHEET_TABS = 50
export const MAX_SHEET_NAME_LENGTH = 64
export const ROW_COUNT = DEFAULT_ROW_COUNT

export const colLettersFor = (colCount: number): string[] =>
  COLS.slice(0, Math.max(1, Math.min(MAX_COL_COUNT, colCount)))

const CellStyleSchema = z.object({
  b: z.boolean().optional(),
  i: z.boolean().optional(),
  u: z.boolean().optional(),
  s: z.boolean().optional(),
  w: z.boolean().optional(),
  bd: z.boolean().optional(),
  a: z.enum(['left', 'center', 'right']).optional(),
  bg: z.string().optional(),
  fg: z.string().optional(),
})

const COLOR_RE = /^#[0-9a-fA-F]{3,8}$/
const MAX_VALIDATION_OPTIONS = 100

export const normalizeSheetName = (name: string): string | null => {
  const trimmed = name.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_SHEET_NAME_LENGTH ? trimmed : null
}

export const isSafeSheetName = (name: string): boolean =>
  name === normalizeSheetName(name)

export const isSafeTabColor = (color: string): boolean =>
  COLOR_RE.test(color)

const CellsSchema = z.record(z.string(), z.string())

const RawTabBundleSchema = z.object({
  cells: CellsSchema.default({}),
  notes: z.record(z.string(), z.string()).default({}),
  styles: z.record(z.string(), CellStyleSchema).default({}),
  formats: z.record(z.string(), z.enum(FORMAT_KEYS)).default({}),
  validation: z.record(z.string(), z.discriminatedUnion('type', [
    z.object({ type: z.literal('list'), options: z.array(z.string()) }),
    z.object({ type: z.literal('checkbox') }),
  ])).default({}),
  condFormat: z.array(z.object({
    col: z.string(),
    op: z.enum(['>', '<', '=', '!=', 'contains']),
    value: z.string(),
    color: z.string(),
  })).default([]),
  freeze: z.object({
    rows: z.number().int().min(0).max(MAX_ROW_COUNT),
    cols: z.number().int().min(0).max(MAX_COL_COUNT),
  }).default({ rows: 0, cols: 0 }),
  hidden: z.object({
    rows: z.array(z.number()),
    cols: z.array(z.string()),
  }).default({ rows: [], cols: [] }),
  colWidths: z.record(z.string(), z.number()).default({}),
  rowHeights: z.record(z.string(), z.number()).default({}),
  merges: z.array(z.tuple([z.number(), z.number(), z.number(), z.number()])).default([]),
  rowCount: z.number().int().min(1).max(MAX_ROW_COUNT).default(DEFAULT_ROW_COUNT),
  colCount: z.number().int().min(1).max(MAX_COL_COUNT).default(DEFAULT_COL_COUNT),
})

type RawTabBundle = z.infer<typeof RawTabBundleSchema>

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
): Record<string, V> =>
  Object.fromEntries(Object.entries(record).flatMap(([key, value]) => {
    if (!isCellKeyInBounds(key, bundle)) return []
    const next = normalize(value)
    return next === undefined ? [] : [[key, next]]
  }))

const uniqueSafeStrings = (values: readonly string[]): string[] => {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of values) {
    const value = raw.trim()
    if (value === '' || !isSafeCellText(value) || seen.has(value)) continue
    seen.add(value)
    out.push(value)
    if (out.length >= MAX_VALIDATION_OPTIONS) break
  }
  return out
}

const sanitizeValidation = (
  rules: RawTabBundle['validation'],
  bundle: Pick<RawTabBundle, 'rowCount' | 'colCount'>,
): RawTabBundle['validation'] =>
  sanitizeCellScopedRecord(rules, bundle, (rule) => {
    if (rule.type === 'checkbox') return rule
    const options = uniqueSafeStrings(rule.options)
    return options.length > 0 ? { type: 'list', options } : undefined
  })

const sanitizeCondFormat = (
  rules: RawTabBundle['condFormat'],
  bundle: Pick<RawTabBundle, 'colCount'>,
): RawTabBundle['condFormat'] => {
  const byCol = new Map<string, RawTabBundle['condFormat'][number]>()
  for (const rule of rules) {
    if (!isColInBounds(rule.col, bundle.colCount)) continue
    if (rule.value === '' || !isSafeCellText(rule.value) || !COLOR_RE.test(rule.color)) continue
    byCol.set(rule.col, rule)
  }
  return [...byCol.values()]
}

const sanitizeHidden = (hidden: RawTabBundle['hidden'], bundle: Pick<RawTabBundle, 'rowCount' | 'colCount'>): RawTabBundle['hidden'] => ({
  rows: [...new Set(hidden.rows.filter((row) => isRowInBounds(row, bundle.rowCount)))].sort((a, b) => a - b),
  cols: [...new Set(hidden.cols.filter((col) => isColInBounds(col, bundle.colCount)))],
})

const sanitizeColWidths = (widths: RawTabBundle['colWidths'], bundle: Pick<RawTabBundle, 'colCount'>): RawTabBundle['colWidths'] =>
  Object.fromEntries(Object.entries(widths).flatMap(([col, width]) =>
    isColInBounds(col, bundle.colCount) && Number.isFinite(width)
      ? [[col, storedResizeValue(width, COLUMN_WIDTH_BOUNDS)]]
      : [],
  ))

const sanitizeRowHeights = (heights: RawTabBundle['rowHeights'], bundle: Pick<RawTabBundle, 'rowCount'>): RawTabBundle['rowHeights'] =>
  Object.fromEntries(Object.entries(heights).flatMap(([rowKey, height]) => {
    const row = /^\d+$/.test(rowKey) ? Number(rowKey) : NaN
    return isRowInBounds(row, bundle.rowCount) && Number.isFinite(height)
      ? [[rowKey, storedResizeValue(height, ROW_HEIGHT_BOUNDS)]]
      : []
  }))

const sanitizeMerges = (merges: RawTabBundle['merges'], bundle: Pick<RawTabBundle, 'rowCount' | 'colCount'>): RawTabBundle['merges'] =>
  merges.filter(([rMin, rMax, cMin, cMax]) =>
    [rMin, rMax, cMin, cMax].every(Number.isInteger) &&
    rMin <= rMax && cMin <= cMax &&
    !(rMin === rMax && cMin === cMax) &&
    isRowInBounds(rMin, bundle.rowCount) &&
    isRowInBounds(rMax, bundle.rowCount) &&
    cMin >= 0 && cMax < bundle.colCount,
  )

const sanitizeTabBundle = <T extends RawTabBundle>(bundle: T): T => ({
  ...bundle,
  cells: sanitizeCellScopedRecord(sanitizeCellRecord(bundle.cells), bundle),
  notes: sanitizeCellScopedRecord(bundle.notes, bundle, (note) => {
    const normalized = normalizeNoteText(note)
    return normalized !== '' && isSafeCellText(normalized) ? normalized : undefined
  }),
  styles: sanitizeCellScopedRecord(bundle.styles, bundle),
  formats: sanitizeCellScopedRecord(bundle.formats, bundle),
  validation: sanitizeValidation(bundle.validation, bundle),
  condFormat: sanitizeCondFormat(bundle.condFormat, bundle),
  hidden: sanitizeHidden(bundle.hidden, bundle),
  colWidths: sanitizeColWidths(bundle.colWidths, bundle),
  rowHeights: sanitizeRowHeights(bundle.rowHeights, bundle),
  merges: sanitizeMerges(bundle.merges, bundle),
})

const TabBundleSchema = RawTabBundleSchema.transform(sanitizeTabBundle)
export type TabBundle = z.infer<typeof TabBundleSchema>

const SheetNameSchema = z.string().refine(isSafeSheetName)

const TabsSchema = z.object({
  order: z.array(SheetNameSchema).min(1).max(MAX_SHEET_TABS),
  active: SheetNameSchema,
  saved: z.record(z.string(), TabBundleSchema),
  colors: z.record(z.string(), z.string()).default({}),
}).superRefine((tabs, ctx) => {
  const names = new Set<string>()
  tabs.order.forEach((name, index) => {
    if (names.has(name)) ctx.addIssue({ code: 'custom', path: ['order', index], message: 'Duplicate sheet name' })
    names.add(name)
  })
  if (!names.has(tabs.active)) {
    ctx.addIssue({ code: 'custom', path: ['active'], message: 'Active sheet must be present in tab order' })
  }
  Object.keys(tabs.saved).forEach((name) => {
    if (!names.has(name)) ctx.addIssue({ code: 'custom', path: ['saved', name], message: 'Saved sheet must be present in tab order' })
  })
  Object.entries(tabs.colors).forEach(([name, color]) => {
    if (!names.has(name)) ctx.addIssue({ code: 'custom', path: ['colors', name], message: 'Tab color must be present in tab order' })
    if (!isSafeTabColor(color)) ctx.addIssue({ code: 'custom', path: ['colors', name], message: 'Invalid tab color' })
  })
  tabs.order.forEach((name, index) => {
    if (name !== tabs.active && tabs.saved[name] === undefined) {
      ctx.addIssue({ code: 'custom', path: ['saved', name], message: `Inactive sheet at index ${index} must have a saved bundle` })
    }
  })
})

const RawSheetSchema = RawTabBundleSchema.extend({
  tabs: TabsSchema.default({ order: ['Sheet1'], active: 'Sheet1', saved: {}, colors: {} }),
})

export const SheetSchema = RawSheetSchema.transform(({ tabs, ...bundle }) => ({
  ...sanitizeTabBundle(bundle),
  tabs,
}))
export type Sheet = z.infer<typeof SheetSchema>
export type SheetOps = JSONOps<Sheet> & {
  undo(): boolean
  redo(): boolean
  canUndo(): boolean
  canRedo(): boolean
}

export const bundleOf = (sheet: Sheet): TabBundle => ({
  cells: sheet.cells, notes: sheet.notes, styles: sheet.styles, formats: sheet.formats,
  validation: sheet.validation, condFormat: sheet.condFormat,
  freeze: sheet.freeze, hidden: sheet.hidden, colWidths: sheet.colWidths, rowHeights: sheet.rowHeights, merges: sheet.merges,
  rowCount: sheet.rowCount, colCount: sheet.colCount,
})

export const withBundle = (sheet: Sheet, b: TabBundle): Sheet => ({ ...sheet, ...b })

export const blankBundle = (): TabBundle => ({
  cells: {},
  notes: {},
  styles: {},
  formats: {},
  validation: {},
  condFormat: [],
  freeze: { rows: 0, cols: 0 },
  hidden: { rows: [], cols: [] },
  colWidths: {},
  rowHeights: {},
  merges: [],
  rowCount: DEFAULT_ROW_COUNT,
  colCount: DEFAULT_COL_COUNT,
})

export const cloneBundle = (bundle: TabBundle): TabBundle => ({
  cells: { ...bundle.cells },
  notes: { ...bundle.notes },
  styles: Object.fromEntries(Object.entries(bundle.styles).map(([key, style]) => [key, { ...style }])),
  formats: { ...bundle.formats },
  validation: Object.fromEntries(Object.entries(bundle.validation).map(([key, rule]) => [
    key,
    rule.type === 'list' ? { ...rule, options: [...rule.options] } : { ...rule },
  ])),
  condFormat: bundle.condFormat.map((rule) => ({ ...rule })),
  freeze: { ...bundle.freeze },
  hidden: { rows: [...bundle.hidden.rows], cols: [...bundle.hidden.cols] },
  colWidths: { ...bundle.colWidths },
  rowHeights: { ...bundle.rowHeights },
  merges: bundle.merges.map(([r0, c0, r1, c1]) => [r0, c0, r1, c1]),
  rowCount: bundle.rowCount,
  colCount: bundle.colCount,
})

export const initialSheet: Sheet = {
  ...blankBundle(),
  cells: {
    A1: 'Item', B1: 'Qty', C1: 'Price', D1: 'Total',
    A2: 'Apple', B2: '3', C2: '1.50', D2: '=B2*C2',
    A3: 'Bread', B3: '2', C3: '2.25', D3: '=B3*C3',
    A4: 'Milk', B4: '1', C4: '3.00', D4: '=B4*C4',
    A6: 'Sum', D6: '=SUM(D2:D4)',
  },
  tabs: { order: ['Sheet1'], active: 'Sheet1', saved: {}, colors: {} },
}
