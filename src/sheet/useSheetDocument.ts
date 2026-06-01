import { useEffect, useMemo, useState } from 'react'
import { createBatchSet } from '@zod-crud/batch-set'
import { createBulkEdit } from '@zod-crud/bulk-edit'
import { createClearValues } from '@zod-crud/clear-values'
import { createWebClipboard, type WebClipboardCodec } from '@zod-crud/clipboard-web'
import { createCollection } from '@zod-crud/collection'
import { createDirtyState } from '@zod-crud/dirty-state'
import { createPatchPreview } from '@zod-crud/patch-preview'
import { createDocumentPersistence } from '@zod-crud/persist-web'
import { createSearchReplace } from '@zod-crud/search-replace'
import { useJSONDocument } from 'zod-crud/react'
import { appendSegment, type Pointer } from 'zod-crud'
import { SheetSchema, type Sheet, type SheetOps, type Writes } from './schema'
import { loadInitial, SHEET_STORAGE_KEY, sheetPersistenceCodec } from './storage'
import { writeCellsBatch, writeSingleCell } from './writeCells'
import type { ClipboardTextBridge } from './clipboard/clipboardActions'

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

export function useSheetDocument() {
  const initial = useMemo(() => loadInitial(), [])
  const doc = useJSONDocument(SheetSchema, initial, { history: 100 })
  const { value: sheet } = doc
  const [persistence, setPersistence] = useState<SheetPersistenceState>(initialPersistenceState)
  const batchSet = useMemo(() => createBatchSet(doc), [doc])
  const bulk = useMemo(() => createBulkEdit(doc), [doc])
  const clear = useMemo(() => createClearValues(doc), [doc])
  const webClipboard = useMemo(() => createWebClipboard(doc, { codec: rawTextClipboardCodec }), [doc])
  const collection = useMemo(() => createCollection(doc), [doc])
  const preview = useMemo(() => createPatchPreview(SheetSchema, doc), [doc])
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
    const dirty = createDirtyState(doc)
    const store = createDocumentPersistence(doc, {
      key: SHEET_STORAGE_KEY,
      codec: sheetPersistenceCodec,
    })
    const stopDirty = dirty.subscribe((snapshot) => {
      setPersistence((current) => ({
        ...current,
        dirty: snapshot.dirty,
        status: snapshot.dirty ? 'saving' : current.status,
        error: snapshot.dirty ? null : current.error,
      }))
    })
    const stopStore = store.watch({
      immediate: true,
      onSave(result) {
        if (result.ok) {
          const snapshot = dirty.markClean()
          setPersistence({
            status: 'saved',
            dirty: snapshot.dirty,
            savedAt: result.savedAt,
            error: null,
          })
        } else {
          setPersistence((current) => ({
            ...current,
            status: 'error',
            dirty: dirty.isDirty(),
            error: result.reason,
          }))
        }
      },
    })
    return () => {
      stopStore()
      stopDirty()
      dirty.dispose()
    }
  }, [doc])

  const bounds = { rowCount: sheet.rowCount, colCount: sheet.colCount }
  const replaceExistingCells = (entries: Array<[string, string]>): boolean => {
    const result = batchSet.batchSet(entries.map(([key]) => cellValuePointer(key)), {
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
  const moveCollectionBefore = (source: string, target: string): boolean =>
    collection.moveBefore(source as Pointer, target as Pointer).ok
  const moveCollectionAfter = (source: string, target: string): boolean =>
    collection.moveAfter(source as Pointer, target as Pointer).ok
  const previewSheetReplacement = (next: Sheet): Sheet | null => {
    const result = preview.preview([{ op: 'replace', path: '' as Pointer, value: next }])
    return result.ok ? result.value : null
  }
  const clearCellValues = (): boolean =>
    clear.clearValues(['/cells' as Pointer]).ok
  const clearAllFormats = (): boolean =>
    clear.clearValues(['/styles' as Pointer, '/formats' as Pointer, '/condFormat' as Pointer]).ok
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
    replaceCellsByQuery,
    replaceCellText,
    moveCollectionBefore,
    moveCollectionAfter,
    previewSheetReplacement,
    clearCellValues,
    clearAllFormats,
    clipboardText,
    persistence,
  }
}
