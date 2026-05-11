import * as z from 'zod'
import type { JsonOps } from 'zod-crud'

export { COL_LETTERS, cellKey, parseCellId, parseA1, cellIdToKey, colIndex, A1_RE, type Cells, type Writes, type WriteCell, type WriteMany, type Display, type CellRef } from '../lib/a1'

export const ROW_COUNT = 20

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
  formats: z.record(z.string(), z.enum(['plain', 'currency', 'eur', 'krw', 'percent', 'integer', 'thousand', 'scientific', 'date'])).default({}),
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
    rows: z.number().int().min(0).max(ROW_COUNT),
    cols: z.number().int().min(0).max(10),
  }).default({ rows: 0, cols: 0 }),
  hidden: z.object({
    rows: z.array(z.number()),
    cols: z.array(z.string()),
  }).default({ rows: [], cols: [] }),
  colWidths: z.record(z.string(), z.number()).default({}),
  rowHeights: z.record(z.string(), z.number()).default({}),
  merges: z.array(z.tuple([z.number(), z.number(), z.number(), z.number()])).default([]),
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
export type SheetOps = JsonOps<Sheet>

const emptyBundle: TabBundle = {
  cells: {}, notes: {}, styles: {}, formats: {}, validation: {}, condFormat: [],
  freeze: { rows: 0, cols: 0 }, hidden: { rows: [], cols: [] }, colWidths: {}, rowHeights: {}, merges: [],
}

export const bundleOf = (sheet: Sheet): TabBundle => ({
  cells: sheet.cells, notes: sheet.notes, styles: sheet.styles, formats: sheet.formats,
  validation: sheet.validation, condFormat: sheet.condFormat,
  freeze: sheet.freeze, hidden: sheet.hidden, colWidths: sheet.colWidths, rowHeights: sheet.rowHeights, merges: sheet.merges,
})

export const withBundle = (sheet: Sheet, b: TabBundle): Sheet => ({ ...sheet, ...b })

export const blankBundle = (): TabBundle => ({ ...emptyBundle, freeze: { ...emptyBundle.freeze }, hidden: { rows: [], cols: [] } })

export const initialSheet: Sheet = {
  cells: {
    A1: 'Item', B1: 'Qty', C1: 'Price', D1: 'Total',
    A2: 'Apple', B2: '3', C2: '1.50', D2: '=B2*C2',
    A3: 'Bread', B3: '2', C3: '2.25', D3: '=B3*C3',
    A4: 'Milk', B4: '1', C4: '3.00', D4: '=B4*C4',
    A6: 'Sum', D6: '=SUM(D2:D4)',
  },
  notes: {}, styles: {}, formats: {}, validation: {}, condFormat: [],
  freeze: { rows: 0, cols: 0 }, hidden: { rows: [], cols: [] }, colWidths: {}, rowHeights: {}, merges: [],
  tabs: { order: ['Sheet1'], active: 'Sheet1', saved: {}, colors: {} },
}
