import { useEffect, useMemo, useState } from 'react'
import { createAutoSave, type AutoSaveSnapshot } from '@zod-crud/autosave'
import { createApplyDefaults } from '@zod-crud/apply-defaults'
import { createBatchUpdate } from '@zod-crud/batch-update'
import { createBulkEdit } from '@zod-crud/bulk-edit'
import { createClearContents } from '@zod-crud/clear-contents'
import { createWebClipboard, type WebClipboardCodec } from '@zod-crud/clipboard-web'
import { createCollection } from '@zod-crud/collection'
import { createDocumentDiff } from '@zod-crud/document-diff'
import { createPatchPreview } from '@zod-crud/patch-preview'
import { createDocumentPersistence } from '@zod-crud/persist-web'
import { createSearchReplace } from '@zod-crud/search-replace'
import { createToggleOption } from '@zod-crud/toggle-option'
import { createToggleValue } from '@zod-crud/toggle-value'
import { useJSONDocument } from 'zod-crud/react'
import { appendSegment, type Pointer } from 'zod-crud'
import { SheetSchema, type Sheet, type SheetOps, type Writes } from './schema'
import { loadInitial, SHEET_STORAGE_KEY, sheetPersistenceCodec } from './storage'
import { writeCellsBatch, writeSingleCell } from './writeCells'
import type { ClipboardTextBridge } from './clipboard/clipboardActions'
import type { HiddenMutationCommands } from './visibility/useHidden'

export type SheetPersistenceStatus = 'saving' | 'saved' | 'error'

export interface SheetPersistenceState {
  status: SheetPersistenceStatus
  dirty: boolean
  savedAt: string | null
  error: string | null
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
  const preview = useMemo(() => createPatchPreview(SheetSchema, doc), [doc])
  const toggleOption = useMemo(() => createToggleOption(doc), [doc])
  const toggleValue = useMemo(() => createToggleValue(doc), [doc])
  const text = useMemo(() => createSearchReplace(doc), [doc])
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
  const replaceExistingCells = (entries: Array<[string, string]>): boolean => {
    const result = batchUpdate.batchUpdate(entries.map(([key]) => cellValuePointer(key)), {
      compute: (_current, _pointer, index) => entries[index]?.[1] ?? '',
    })
    return result.ok
  }
  const writeCell = (key: string, value: string) => writeSingleCell(ops, sheet.cells, key, value, bounds, replaceExistingCells)
  const writeCells = (writes: Writes) => writeCellsBatch(ops, sheet.cells, writes, bounds, replaceExistingCells)
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
    if (sheet.cells[key] === undefined) return defaults.ensure('/cells' as Pointer, { [key]: 'TRUE' }).ok
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
  const applySheetReplacement = (next: Sheet): boolean =>
    diff.apply(next, { label: 'json-import', origin: 'programmatic' }).ok
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
    toggleCheckboxCell,
    replaceCellsByQuery,
    replaceCellText,
    moveCollectionBefore,
    moveCollectionAfter,
    previewSheetReplacement,
    applySheetReplacement,
    clearCellValues,
    clearAllFormats,
    hiddenMutations,
    clipboardText,
    persistence,
  }
}
