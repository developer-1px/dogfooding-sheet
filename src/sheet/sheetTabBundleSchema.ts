import * as z from 'zod'
import { FORMAT_KEYS } from './formatting/formatTypes'
import { DEFAULT_COL_COUNT, DEFAULT_ROW_COUNT, MAX_COL_COUNT, MAX_ROW_COUNT } from './sheetLimits'
import { COND_FORMAT_OPS } from './sheetStyleModel'
import { sanitizeTabBundle } from './sheetTabBundleSanitizer'

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

const CellsSchema = z.record(z.string(), z.string())
const ValidationRuleSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('list'), options: z.array(z.string()) }),
  z.object({ type: z.literal('checkbox') }),
])
const CondFormatRuleSchema = z.object({
  col: z.string(),
  op: z.enum(COND_FORMAT_OPS),
  value: z.string(),
  color: z.string(),
})
const MergeSchema = z.tuple([z.number(), z.number(), z.number(), z.number()])

export const RawTabBundleSchema = z.object({
  cells: CellsSchema.default({}),
  notes: z.record(z.string(), z.string()).default({}),
  styles: z.record(z.string(), CellStyleSchema).default({}),
  formats: z.record(z.string(), z.enum(FORMAT_KEYS)).default({}),
  validation: z.record(z.string(), ValidationRuleSchema).default({}),
  condFormat: z.array(CondFormatRuleSchema).default([]),
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
  merges: z.array(MergeSchema).default([]),
  rowCount: z.number().int().min(1).max(MAX_ROW_COUNT).default(DEFAULT_ROW_COUNT),
  colCount: z.number().int().min(1).max(MAX_COL_COUNT).default(DEFAULT_COL_COUNT),
})

export type RawTabBundle = z.infer<typeof RawTabBundleSchema>

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : []

const parsedRecord = <T>(value: unknown, schema: z.ZodType<T>): Record<string, T> => {
  const out: Record<string, T> = {}
  for (const [key, raw] of Object.entries(asRecord(value))) {
    const parsed = schema.safeParse(raw)
    if (parsed.success) out[key] = parsed.data
  }
  return out
}

const parsedArray = <T>(value: unknown, schema: z.ZodType<T>): T[] => {
  const out: T[] = []
  for (const raw of asArray(value)) {
    const parsed = schema.safeParse(raw)
    if (parsed.success) out.push(parsed.data)
  }
  return out
}

const stringRecord = (value: unknown): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const [key, raw] of Object.entries(asRecord(value))) {
    if (typeof raw === 'string') out[key] = raw
  }
  return out
}

const numberRecord = (value: unknown): Record<string, number> => {
  const out: Record<string, number> = {}
  for (const [key, raw] of Object.entries(asRecord(value))) {
    if (typeof raw === 'number' && Number.isFinite(raw)) out[key] = raw
  }
  return out
}

const boundedRawCount = (value: unknown, max: number): number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? Math.min(value, max) : 0

const sanitizeRawFreeze = (value: unknown): RawTabBundle['freeze'] => {
  const freeze = asRecord(value)
  return {
    rows: boundedRawCount(freeze.rows, MAX_ROW_COUNT),
    cols: boundedRawCount(freeze.cols, MAX_COL_COUNT),
  }
}

const sanitizeRawHidden = (value: unknown): RawTabBundle['hidden'] => {
  const hidden = asRecord(value)
  return {
    rows: asArray(hidden.rows).filter((row): row is number => typeof row === 'number' && Number.isFinite(row)),
    cols: asArray(hidden.cols).filter((col): col is string => typeof col === 'string'),
  }
}

export const sanitizeRawTabBundleInput = (value: unknown): unknown => {
  const bundle = asRecord(value)
  return {
    ...bundle,
    cells: stringRecord(bundle.cells),
    notes: stringRecord(bundle.notes),
    styles: parsedRecord(bundle.styles, CellStyleSchema),
    formats: parsedRecord(bundle.formats, z.enum(FORMAT_KEYS)),
    validation: parsedRecord(bundle.validation, ValidationRuleSchema),
    condFormat: parsedArray(bundle.condFormat, CondFormatRuleSchema),
    freeze: sanitizeRawFreeze(bundle.freeze),
    hidden: sanitizeRawHidden(bundle.hidden),
    colWidths: numberRecord(bundle.colWidths),
    rowHeights: numberRecord(bundle.rowHeights),
    merges: parsedArray(bundle.merges, MergeSchema),
  }
}

export const TabBundleSchema = z.preprocess(sanitizeRawTabBundleInput, RawTabBundleSchema).transform(sanitizeTabBundle)
export type TabBundle = z.infer<typeof TabBundleSchema>
