import { DEFAULT_COL_COUNT, DEFAULT_ROW_COUNT } from './sheetLimits'
import type { Sheet, TabBundle } from './schema'

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
