import * as z from 'zod'
import type { JSONCapabilityResult, JSONPatchOperation, JSONResult } from 'zod-crud'
import { MAX_SHEET_TABS } from './sheetLimits'
import { isSafeSheetName, isSafeTabColor } from './sheetStyleModel'
import {
  RawTabBundleSchema,
  TabBundleSchema,
  sanitizeRawTabBundleInput,
} from './sheetTabBundleSchema'
import { sanitizeTabBundle } from './sheetTabBundleSanitizer'

export { COL_LETTERS, cellKey, cellId, parseCellId, parseA1, cellIdToKey, colIndex, moveCellIdByDelta, A1_RE, type Cells, type Writes, type WriteCell, type WriteMany, type Display, type CellRef } from '@spredsheet/grid'
export * from './sheetLimits'
export * from './sheetStyleModel'
export { RawTabBundleSchema, TabBundleSchema, sanitizeRawTabBundleInput } from './sheetTabBundleSchema'
export { sanitizeTabBundle } from './sheetTabBundleSanitizer'
export type { RawTabBundle, TabBundle } from './sheetTabBundleSchema'

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

const RawSheetShapeSchema = RawTabBundleSchema.extend({
  tabs: TabsSchema.default({ order: ['Sheet1'], active: 'Sheet1', saved: {}, colors: {} }),
})

export const SheetSchema = z.preprocess(sanitizeRawTabBundleInput, RawSheetShapeSchema).transform(({ tabs, ...bundle }) => ({
  ...sanitizeTabBundle(bundle),
  tabs,
}))
export type Sheet = z.infer<typeof SheetSchema>
type SheetEditResult = JSONResult | Exclude<JSONCapabilityResult, { ok: true }>
export interface SheetOps {
  add(path: string, value: unknown): SheetEditResult
  remove(path: string): SheetEditResult
  replace(path: string, value: unknown): SheetEditResult
  patch(patch: ReadonlyArray<JSONPatchOperation>): JSONResult
  undo(): boolean
  redo(): boolean
  canUndo(): boolean
  canRedo(): boolean
}

export { blankBundle, bundleOf, cloneBundle, initialSheet, withBundle } from './sheetBundle'
