import { useEffect, useMemo } from 'react'
import { useJSONDocument } from 'zod-crud/react'
import { SheetSchema, type Writes } from './schema'
import { loadInitial, saveSheet } from './storage'
import { writeCellsBatch, writeSingleCell } from './writeCells'

export function useSheetDocument() {
  const initial = useMemo(() => loadInitial(), [])
  const doc = useJSONDocument(SheetSchema, initial, { history: 100 })
  const { value: sheet } = doc
  const ops = useMemo(() => ({
    ...doc.ops,
    undo: () => doc.commands.undo(),
    redo: () => doc.commands.redo(),
    canUndo: () => doc.history.canUndo,
    canRedo: () => doc.history.canRedo,
  }), [doc.commands, doc.history, doc.ops])

  useEffect(() => { saveSheet(sheet) }, [sheet])

  const bounds = { rowCount: sheet.rowCount, colCount: sheet.colCount }
  const writeCell = (key: string, value: string) => writeSingleCell(ops, sheet.cells, key, value, bounds)
  const writeCells = (writes: Writes) => writeCellsBatch(ops, sheet.cells, writes, bounds)

  return { sheet, ops, writeCell, writeCells }
}
