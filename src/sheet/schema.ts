import * as z from 'zod'

export { COL_LETTERS, cellKey, parseCellId } from '../lib/a1'

export const ROW_COUNT = 20

const CellStyleSchema = z.object({
  b: z.boolean().optional(),
  i: z.boolean().optional(),
  u: z.boolean().optional(),
  w: z.boolean().optional(),
  a: z.enum(['left', 'center', 'right']).optional(),
  bg: z.string().optional(),
  fg: z.string().optional(),
})

export const SheetSchema = z.object({
  cells: z.record(z.string(), z.string()),
  notes: z.record(z.string(), z.string()).default({}),
  styles: z.record(z.string(), CellStyleSchema).default({}),
  formats: z.record(z.string(), z.enum(['plain', 'currency', 'eur', 'krw', 'percent', 'integer', 'thousand', 'scientific', 'date'])).default({}),
})
export type Sheet = z.infer<typeof SheetSchema>

export const initialSheet: Sheet = {
  cells: {
    A1: 'Item', B1: 'Qty', C1: 'Price', D1: 'Total',
    A2: 'Apple', B2: '3', C2: '1.50', D2: '=B2*C2',
    A3: 'Bread', B3: '2', C3: '2.25', D3: '=B3*C3',
    A4: 'Milk', B4: '1', C4: '3.00', D4: '=B4*C4',
    A6: 'Sum', D6: '=SUM(D2:D4)',
  },
  notes: {},
  styles: {},
  formats: {},
}
