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

export const SheetSchema = TabBundleSchema.extend({
  tabs: z.object({
    order: z.array(z.string()),
    active: z.string(),
    saved: z.record(z.string(), TabBundleSchema),
    colors: z.record(z.string(), z.string()).default({}),
  }).default({ order: ['Sheet1'], active: 'Sheet1', saved: {}, colors: {} }),
})
export type Sheet = z.infer<typeof SheetSchema>
export type SheetOps = JSONOps<Sheet> & {
  undo(): boolean
  redo(): boolean
  canUndo(): boolean
  canRedo(): boolean
}

const emptyBundle: TabBundle = {
  cells: {}, notes: {}, styles: {}, formats: {}, validation: {}, condFormat: [],
  freeze: { rows: 0, cols: 0 }, hidden: { rows: [], cols: [] }, colWidths: {}, rowHeights: {}, merges: [],
  rowCount: DEFAULT_ROW_COUNT, colCount: DEFAULT_COL_COUNT,
}

export const bundleOf = (sheet: Sheet): TabBundle => ({
  cells: sheet.cells, notes: sheet.notes, styles: sheet.styles, formats: sheet.formats,
  validation: sheet.validation, condFormat: sheet.condFormat,
  freeze: sheet.freeze, hidden: sheet.hidden, colWidths: sheet.colWidths, rowHeights: sheet.rowHeights, merges: sheet.merges,
  rowCount: sheet.rowCount, colCount: sheet.colCount,
})

export const withBundle = (sheet: Sheet, b: TabBundle): Sheet => ({ ...sheet, ...b })

export const blankBundle = (): TabBundle => ({ ...emptyBundle, freeze: { ...emptyBundle.freeze }, hidden: { rows: [], cols: [] } })

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
