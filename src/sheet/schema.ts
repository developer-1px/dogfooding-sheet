import * as z from 'zod'
import type { JSONOps } from 'zod-crud'
import { COL_LETTERS as COLS } from '@spredsheet/grid'
import { FORMAT_KEYS } from './formatting/formatTypes'

export { COL_LETTERS, cellKey, cellId, parseCellId, parseA1, cellIdToKey, colIndex, moveCellIdByDelta, A1_RE, type Cells, type Writes, type WriteCell, type WriteMany, type Display, type CellRef } from '@spredsheet/grid'

export const DEFAULT_ROW_COUNT = 20
export const DEFAULT_COL_COUNT = 10
export const MAX_ROW_COUNT = 1000
export const MAX_COL_COUNT = COLS.length
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

const TabBundleSchema = z.object({
  cells: z.record(z.string(), z.string()).default({}),
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
export type TabBundle = z.infer<typeof TabBundleSchema>

const SheetNameSchema = z.string().refine((name) => name.trim().length > 0)

const TabsSchema = z.object({
  order: z.array(SheetNameSchema).min(1),
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
})

export const SheetSchema = TabBundleSchema.extend({
  tabs: TabsSchema.default({ order: ['Sheet1'], active: 'Sheet1', saved: {}, colors: {} }),
})
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
