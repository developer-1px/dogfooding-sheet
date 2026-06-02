import { useEffect, useMemo, useState } from 'react'
import { createAutoSave, type AutoSaveSnapshot } from '@zod-crud/autosave'
import { createApplyDefaults } from '@zod-crud/apply-defaults'
import { createBatchUpdate } from '@zod-crud/batch-update'
import { createBulkEdit } from '@zod-crud/bulk-edit'
import { createClearContents } from '@zod-crud/clear-contents'
import { createWebClipboard, type WebClipboardCodec } from '@zod-crud/clipboard-web'
import { createCollection } from '@zod-crud/collection'
import { createDocumentDiff } from '@zod-crud/document-diff'
import { createGridRange } from '@zod-crud/grid-range'
import { createIncrementNumber } from '@zod-crud/increment-number'
import { createPatchPreview } from '@zod-crud/patch-preview'
import { createDocumentPersistence } from '@zod-crud/persist-web'
import { createSearchReplace } from '@zod-crud/search-replace'
import { createSparseRecord } from '@zod-crud/sparse-record'
import { createToggleOption } from '@zod-crud/toggle-option'
import { createToggleValue } from '@zod-crud/toggle-value'
import { useJSONDocument } from 'zod-crud/react'
import { appendSegment, type Pointer } from 'zod-crud'
import { columnLabel } from '@spredsheet/grid'
import { MAX_COL_COUNT, MAX_ROW_COUNT, SheetSchema, cellKey, type Rect, type Sheet, type SheetOps, type WriteCellRange, type Writes } from './schema'
import { loadInitial, SHEET_STORAGE_KEY, sheetPersistenceCodec } from './storage'
import { writeCellsBatch, writeSingleCell } from './writeCells'
import { normalizeCellWrite } from './cellValue'
import type { RecordMutationCommands } from '../lib/dictOps'
import type { ClipboardTextBridge } from './clipboard/clipboardActions'
import type { Format } from './formatting/useFormats'
import type { CellStyle } from './formatting/useStyles'
import type { CondMutationCommands, CondRule } from './formatting/useCondFormat'
import type { MergeMutationCommands } from './structure/useMerges'
import type { SheetCountMutationCommands } from './structure/sheetMutations'
import type { Rule, ValidationMutationCommands } from './validation/useValidation'
import type { FreezeMutationCommands } from './visibility/useFreeze'
import type { HiddenMutationCommands } from './visibility/useHidden'

export type SheetPersistenceStatus = 'saving' | 'saved' | 'error'

export interface SheetPersistenceState {
  status: SheetPersistenceStatus
  dirty: boolean
  savedAt: string | null
  error: string | null
}

export interface SheetRecordMutationCommands {
  cells: RecordMutationCommands<string>
  notes: RecordMutationCommands<string>
  formats: RecordMutationCommands<Format>
  styles: RecordMutationCommands<CellStyle>
  validation: ValidationMutationCommands
  rowHeights: RecordMutationCommands<number>
  colWidths: RecordMutationCommands<number>
}

export type ReplaceCellValue = (value: string) => string
export interface ReplaceCellTextOptions {
  keys: readonly string[]
  search: string
  replacement: string
  caseSensitive?: boolean
}

const initialPersistenceState: SheetPersistenceState = {
  status: 'saved',
  dirty: false,
  savedAt: null,
  error: null,
}

const cellValuePointer = (key: string): Pointer =>
  appendSegment('/cells' as Pointer, key)

const rectRowCount = (range: Rect): number => range.rMax - range.rMin + 1
const rectColumnCount = (range: Rect): number => range.cMax - range.cMin + 1
const gridCellIntent = (value: string): { intent: 'set'; value: string } | { intent: 'remove' } | null => {
  const normalized = normalizeCellWrite(value)
  if (normalized.type === 'reject') return null
  return normalized.type === 'remove'
    ? { intent: 'remove' }
    : { intent: 'set', value: normalized.value }
}

const rawTextClipboardCodec: WebClipboardCodec = {
  encode: ({ payload }) => typeof payload === 'string' ? payload : JSON.stringify(payload),
  decode: (text) => ({ payload: text, source: null, sources: null }),
}

const persistenceErrorMessage = (error: unknown): string | null => {
  if (error == null) return null
  return error instanceof Error ? error.message : String(error)
}

const persistenceFromAutoSave = (snapshot: AutoSaveSnapshot): SheetPersistenceState => ({
  status: snapshot.state === 'error'
    ? 'error'
    : snapshot.pending || snapshot.saving
      ? 'saving'
      : 'saved',
  dirty: snapshot.pending || snapshot.saving || snapshot.state === 'error',
  savedAt: snapshot.lastSavedAt,
  error: persistenceErrorMessage(snapshot.error),
})

export function useSheetDocument() {
  const initial = useMemo(() => loadInitial(), [])
  const doc = useJSONDocument(SheetSchema, initial, { history: 100 })
  const { value: sheet } = doc
  const [persistence, setPersistence] = useState<SheetPersistenceState>(initialPersistenceState)
  const defaults = useMemo(() => createApplyDefaults(doc), [doc])
  const batchUpdate = useMemo(() => createBatchUpdate(doc), [doc])
  const bulk = useMemo(() => createBulkEdit(doc), [doc])
  const clear = useMemo(() => createClearContents(doc), [doc])
  const webClipboard = useMemo(() => createWebClipboard(doc, { codec: rawTextClipboardCodec }), [doc])
  const collection = useMemo(() => createCollection(doc), [doc])
  const diff = useMemo(() => createDocumentDiff(doc), [doc])
  const gridRange = useMemo(() => createGridRange(doc), [doc])
  const incrementNumber = useMemo(() => createIncrementNumber(doc), [doc])
  const preview = useMemo(() => createPatchPreview(SheetSchema, doc), [doc])
  const sparseRecord = useMemo(() => createSparseRecord(doc), [doc])
  const toggleOption = useMemo(() => createToggleOption(doc), [doc])
  const toggleValue = useMemo(() => createToggleValue(doc), [doc])
  const text = useMemo(() => createSearchReplace(doc), [doc])
  const recordMutations = useMemo<SheetRecordMutationCommands>(() => {
    const commandsFor = <V,>(base: Pointer): RecordMutationCommands<V> => ({
      editEntries(entries, equal) {
        const field = base.slice(1) as keyof Sheet
        const set: Record<string, unknown> = {}
        const remove: string[] = []
        for (const [key, value] of entries) {
          if (value === undefined) remove.push(key)
          else set[key] = value
        }
        return sparseRecord.edit({
          root: base,
          set,
          remove,
        }, {
          equals: equal
            ? (current, next) => equal(current as V, next as V)
            : undefined,
        }, { label: `sparse-record:${String(field)}`, origin: 'programmatic' }).ok
      },
      replaceExisting(entries) {
        return batchUpdate.batchUpdate(entries.map(([key]) => appendSegment(base, key)), {
          compute: (_current, _pointer, index) => entries[index]?.[1] as V,
        }).ok
      },
      ensureMissing(entries) {
        return defaults.ensure(base, Object.fromEntries(entries)).ok
      },
      applyRecordDiff(next) {
        const field = base.slice(1) as keyof Sheet
        return diff.apply({ ...sheet, [field]: next } as Sheet, { label: `record-diff:${String(field)}`, origin: 'programmatic' }).ok
      },
    })
    return {
      cells: commandsFor('/cells' as Pointer),
      notes: commandsFor('/notes' as Pointer),
      formats: commandsFor('/formats' as Pointer),
      styles: commandsFor('/styles' as Pointer),
      validation: {
        ...commandsFor<Rule>('/validation' as Pointer),
        applyCheckboxConversion(edit) {
          return sparseRecord.edit([
            { root: '/cells' as Pointer, set: edit.cells },
            { root: '/validation' as Pointer, set: edit.validation },
          ], undefined, { label: 'checkbox-conversion', origin: 'programmatic' }).ok
        },
      },
      rowHeights: commandsFor('/rowHeights' as Pointer),
      colWidths: commandsFor('/colWidths' as Pointer),
    }
  }, [batchUpdate, defaults, diff, sheet, sparseRecord])
  const ops = useMemo<SheetOps>(() => ({
    add: (path, value) => doc.insert(path as Pointer, value),
    remove: (path) => doc.delete(path as Pointer),
    replace: (path, value) => doc.replace(path as Pointer, value),
    patch: (patch) => doc.patch(patch),
    undo: () => doc.undo().ok,
    redo: () => doc.redo().ok,
    canUndo: () => doc.canUndo().ok,
    canRedo: () => doc.canRedo().ok,
  }), [doc])

  useEffect(() => {
    const store = createDocumentPersistence(doc, {
      key: SHEET_STORAGE_KEY,
      codec: sheetPersistenceCodec,
    })
    const autosave = createAutoSave(doc, {
      immediate: true,
      async save() {
        const result = await store.save()
        if (!result.ok) throw new Error(result.reason)
        return { savedAt: result.savedAt }
      },
    })
    setPersistence(persistenceFromAutoSave(autosave.current()))
    const stopAutoSave = autosave.subscribe((snapshot) => {
      setPersistence(persistenceFromAutoSave(snapshot))
    })
    return () => {
      stopAutoSave()
      autosave.dispose()
    }
  }, [doc])

  const bounds = { rowCount: sheet.rowCount, colCount: sheet.colCount }
  const writeCell = (key: string, value: string) => writeSingleCell(ops, sheet.cells, key, value, bounds, recordMutations.cells.replaceExisting, recordMutations.cells.ensureMissing, recordMutations.cells.editEntries)
  const writeCells = (writes: Writes) => writeCellsBatch(ops, sheet.cells, writes, bounds, recordMutations.cells.replaceExisting, recordMutations.cells.ensureMissing, recordMutations.cells.applyRecordDiff, recordMutations.cells.editEntries)
  const writeCellRange: WriteCellRange = (range, matrix) => {
    for (const row of matrix) {
      for (const value of row) {
        if (gridCellIntent(value) === null) return false
      }
    }
    return gridRange.paste({
      root: '/cells' as Pointer,
      range: {
        row: range.rMin,
        column: range.cMin,
        rowCount: rectRowCount(range),
        columnCount: rectColumnCount(range),
      },
      matrix,
      keyForCell: ({ row, column }) => cellKey(columnLabel(column), row),
      bounds: { rowCount: sheet.rowCount, columnCount: sheet.colCount },
    }, {
      valueToIntent(value) {
        return gridCellIntent(String(value)) ?? { intent: 'set', value: String(value) }
      },
    }, { label: 'grid-range:paste', origin: 'programmatic' }).ok
  }
  const replaceCellsByQuery = (jsonPath: string, replace: ReplaceCellValue): boolean =>
    bulk.replaceAll<string>(jsonPath, ({ value }) => replace(value)).ok
  const replaceCellText = ({ keys, search, replacement, caseSensitive = false }: ReplaceCellTextOptions): boolean => {
    if (keys.length === 0) return false
    const pointers = new Set(keys.map(cellValuePointer))
    return text.replaceAll(search, replacement, {
      root: '/cells' as Pointer,
      caseSensitive,
      include: ({ pointer }) => pointers.has(pointer),
    }).ok
  }
  const toggleCheckboxCell = (key: string): boolean => {
    if (sheet.cells[key] === undefined) {
      if (recordMutations.cells.editEntries?.([[key, 'TRUE']])) return true
      return defaults.ensure('/cells' as Pointer, { [key]: 'TRUE' }).ok
    }
    return toggleValue.toggleValue(cellValuePointer(key), { values: ['TRUE', 'FALSE'] }).ok
  }
  const moveCollectionBefore = (source: string, target: string): boolean =>
    collection.moveBefore(source as Pointer, target as Pointer).ok
  const moveCollectionAfter = (source: string, target: string): boolean =>
    collection.moveAfter(source as Pointer, target as Pointer).ok
  const previewSheetReplacement = (next: Sheet): Sheet | null => {
    const result = preview.preview([{ op: 'replace', path: '' as Pointer, value: next }])
    return result.ok ? result.value : null
  }
  const applySheetReplacement = (next: Sheet, label = 'json-import'): boolean =>
    diff.apply(next, { label, origin: 'programmatic' }).ok
  const writeTabColor = (name: string, color: string): boolean => {
    const pointer = appendSegment('/tabs/colors' as Pointer, name)
    if (sparseRecord.edit({ root: '/tabs/colors' as Pointer, set: { [name]: color } }, undefined, { label: 'tab-color', origin: 'programmatic' }).ok) return true
    if (sheet.tabs.colors[name] === undefined) return defaults.ensure('/tabs/colors' as Pointer, { [name]: color }).ok
    return batchUpdate.batchUpdate([pointer], { value: color }).ok
  }
  const clearTabColor = (name: string): boolean =>
    sparseRecord.edit({ root: '/tabs/colors' as Pointer, remove: [name] }, undefined, { label: 'tab-color:clear', origin: 'programmatic' }).ok ||
    doc.delete(appendSegment('/tabs/colors' as Pointer, name)).ok
  const clearCellValues = (): boolean =>
    clear.clearContents(['/cells' as Pointer]).ok
  const clearAllFormats = (): boolean =>
    clear.clearContents(['/styles' as Pointer, '/formats' as Pointer, '/condFormat' as Pointer]).ok
  const hiddenMutations = useMemo<HiddenMutationCommands>(() => ({
    hideRow: (row) => toggleOption.add('/hidden/rows' as Pointer, row).ok,
    hideCol: (col) => toggleOption.add('/hidden/cols' as Pointer, col).ok,
    showRow: (row) => toggleOption.remove('/hidden/rows' as Pointer, row).ok,
    showCol: (col) => toggleOption.remove('/hidden/cols' as Pointer, col).ok,
    showAll: () => clear.clearContents(['/hidden/rows' as Pointer, '/hidden/cols' as Pointer]).ok,
  }), [clear, toggleOption])
  const freezeMutations = useMemo<FreezeMutationCommands>(() => ({
    toggleRows: () => toggleValue.toggleValue('/freeze/rows' as Pointer, { values: [0, 1] }).ok,
    toggleCols: () => toggleValue.toggleValue('/freeze/cols' as Pointer, { values: [0, 1] }).ok,
    setRows: (rows) => batchUpdate.batchUpdate(['/freeze/rows' as Pointer], { value: rows }).ok,
    setCols: (cols) => batchUpdate.batchUpdate(['/freeze/cols' as Pointer], { value: cols }).ok,
  }), [batchUpdate, toggleValue])
  const condFormatMutations = useMemo<CondMutationCommands>(() => ({
    addRule: (rule) => doc.insert('/condFormat/-' as Pointer, rule).ok,
    replaceRule: (index, rule: CondRule) => batchUpdate.batchUpdate([appendSegment('/condFormat' as Pointer, index)], { value: rule }).ok,
    removeRule: (index) => collection.deleteItems(appendSegment('/condFormat' as Pointer, index)).ok,
    clearAll: () => clear.clearContents(['/condFormat' as Pointer]).ok,
  }), [batchUpdate, clear, collection, doc])
  const mergeMutations = useMemo<MergeMutationCommands>(() => ({
    addMerge: (merge) => doc.insert('/merges/-' as Pointer, merge).ok,
    removeMerge: (index) => collection.deleteItems(appendSegment('/merges' as Pointer, index)).ok,
  }), [collection, doc])
  const countMutations = useMemo<SheetCountMutationCommands>(() => ({
    appendRows: (count) => incrementNumber.step('/rowCount' as Pointer, { step: count, max: MAX_ROW_COUNT }).ok,
    appendCols: (count) => incrementNumber.step('/colCount' as Pointer, { step: count, max: MAX_COL_COUNT }).ok,
    applySheetDiff: (next) => diff.apply(next, { label: 'sheet-structure', origin: 'programmatic' }).ok,
  }), [diff, incrementNumber])
  const clipboardText = useMemo<ClipboardTextBridge>(() => ({
    async readText() {
      const result = await webClipboard.read()
      return result.ok && typeof result.payload === 'string' ? result.payload : null
    },
    async writeText(value) {
      return (await webClipboard.writePayload(value)).ok
    },
  }), [webClipboard])

  return {
    sheet,
    ops,
    writeCell,
    writeCells,
    writeCellRange,
    toggleCheckboxCell,
    replaceCellsByQuery,
    replaceCellText,
    moveCollectionBefore,
    moveCollectionAfter,
    previewSheetReplacement,
    applySheetReplacement,
    writeTabColor,
    clearTabColor,
    clearCellValues,
    clearAllFormats,
    recordMutations,
    condFormatMutations,
    mergeMutations,
    countMutations,
    freezeMutations,
    hiddenMutations,
    clipboardText,
    persistence,
  }
}
