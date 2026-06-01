import { useEffect, useMemo, useState } from 'react'
import { createBulkEdit } from '@zod-crud/bulk-edit'
import { createCollection } from '@zod-crud/collection'
import { createDirtyState } from '@zod-crud/dirty-state'
import { createDocumentPersistence } from '@zod-crud/persist-web'
import { useJSONDocument } from 'zod-crud/react'
import type { Pointer } from 'zod-crud'
import { SheetSchema, type SheetOps, type Writes } from './schema'
import { loadInitial, SHEET_STORAGE_KEY, sheetPersistenceCodec } from './storage'
import { writeCellsBatch, writeSingleCell } from './writeCells'

export type SheetPersistenceStatus = 'saving' | 'saved' | 'error'

export interface SheetPersistenceState {
  status: SheetPersistenceStatus
  dirty: boolean
  savedAt: string | null
  error: string | null
}

export type ReplaceCellValue = (value: string) => string

const initialPersistenceState: SheetPersistenceState = {
  status: 'saved',
  dirty: false,
  savedAt: null,
  error: null,
}

export function useSheetDocument() {
  const initial = useMemo(() => loadInitial(), [])
  const doc = useJSONDocument(SheetSchema, initial, { history: 100 })
  const { value: sheet } = doc
  const [persistence, setPersistence] = useState<SheetPersistenceState>(initialPersistenceState)
  const bulk = useMemo(() => createBulkEdit(doc), [doc])
  const collection = useMemo(() => createCollection(doc), [doc])
  const ops = useMemo<SheetOps>(() => ({
    add: (path, value) => doc.insert(path as Pointer, value),
    remove: (path) => doc.delete(path as Pointer),
    replace: (path, value) => doc.replace(path as Pointer, value),
    patch: (patch) => doc.patch(patch),
    undo: () => doc.undo(),
    redo: () => doc.redo(),
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
  const writeCell = (key: string, value: string) => writeSingleCell(ops, sheet.cells, key, value, bounds)
  const writeCells = (writes: Writes) => writeCellsBatch(ops, sheet.cells, writes, bounds)
  const replaceCellsByQuery = (jsonPath: string, replace: ReplaceCellValue): boolean =>
    bulk.replaceAll<string>(jsonPath, ({ value }) => replace(value)).ok
  const moveCollectionBefore = (source: string, target: string): boolean =>
    collection.moveBefore(source as Pointer, target as Pointer).ok
  const moveCollectionAfter = (source: string, target: string): boolean =>
    collection.moveAfter(source as Pointer, target as Pointer).ok

  return {
    sheet,
    ops,
    writeCell,
    writeCells,
    replaceCellsByQuery,
    moveCollectionBefore,
    moveCollectionAfter,
    persistence,
  }
}
