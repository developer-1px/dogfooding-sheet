import * as z from 'zod'

export const COL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const
export const ROW_COUNT = 20

export const SheetSchema = z.object({
  cells: z.record(z.string(), z.string()),
})
export type Sheet = z.infer<typeof SheetSchema>

export const cellKey = (col: string, row: number) => `${col}${row + 1}`

export const parseCellId = (id: string): { col: string; row: number } | null => {
  const m = /^r(\d+)-([A-J])$/.exec(id)
  return m ? { row: Number(m[1]), col: m[2] } : null
}

export const initialSheet: Sheet = {
  cells: {
    A1: 'Item', B1: 'Qty', C1: 'Price', D1: 'Total',
    A2: 'Apple', B2: '3', C2: '1.50', D2: '=B2*C2',
    A3: 'Bread', B3: '2', C3: '2.25', D3: '=B3*C3',
    A4: 'Milk', B4: '1', C4: '3.00', D4: '=B4*C4',
    A6: 'Sum', D6: '=SUM(D2:D4)',
  },
}
