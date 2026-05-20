import { useEffect, useMemo } from 'react'
import { useJSONDocument } from 'zod-crud/react'
import { upsertKey } from '../lib/dictOps'
import { SheetSchema, type Writes } from './schema'
import { loadInitial, saveSheet } from './storage'
import { writeCellsBatch } from './writeCells'

export function useSheetDocument() {
  const doc = useJSONDocument(SheetSchema, loadInitial(), { history: 100 })
  const { value: sheet } = doc
  const ops = useMemo(() => ({
    ...doc.ops,
    undo: () => doc.commands.undo(),
    redo: () => doc.commands.redo(),
    canUndo: () => doc.history.canUndo,
    canRedo: () => doc.history.canRedo,
  }), [doc.commands, doc.history, doc.ops])

  useEffect(() => { saveSheet(sheet) }, [sheet])

  const writeCell = (key: string, value: string) => {
    upsertKey(ops, '/cells', sheet.cells, key, value === '' ? undefined : value)
  }
  const writeCells = (writes: Writes) => writeCellsBatch(ops, sheet.cells, writes)

  return { sheet, ops, writeCell, writeCells }
}
