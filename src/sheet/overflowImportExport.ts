import { exportCsvBounded, importCsvRowsInto, MAX_CSV_EXPORT_LENGTH, parseCsv } from '../lib/csv'
import { MAX_JSON_STRINGIFY_LENGTH, stringifyJsonBounded } from '../lib/jsonStringify'
import type { Confirm } from './useConfirm'
import { SheetSchema, colLettersFor, type Display, type Sheet, type WriteCell, type WriteMany } from './schema'
import type { DownloadFile } from './overflowMenuActions'

export const MAX_IMPORT_FILE_BYTES = 5_000_000

const readImportText = async (file: File): Promise<string | null> => {
  if (typeof file.size === 'number' && file.size > MAX_IMPORT_FILE_BYTES) return null
  try {
    const text = await file.text()
    return text.length <= MAX_IMPORT_FILE_BYTES ? text : null
  } catch {
    return null
  }
}

export function exportOverflowCsv({
  display,
  sheet,
  downloadFile,
}: {
  display: Display
  sheet: Pick<Sheet, 'rowCount' | 'colCount'>
  downloadFile: DownloadFile
}): boolean {
  try {
    const csv = exportCsvBounded((key) => display(key), {
      rowCount: sheet.rowCount,
      colLetters: colLettersFor(sheet.colCount),
      maxLength: MAX_CSV_EXPORT_LENGTH,
    })
    return csv !== null && downloadFile('sheet.csv', csv)
  } catch {
    return false
  }
}

export async function importOverflowCsv({
  file,
  confirm,
  sheet,
  writeCell,
  writeCells,
}: {
  file: File
  confirm: Confirm
  sheet: Pick<Sheet, 'rowCount' | 'colCount'>
  writeCell: WriteCell
  writeCells: WriteMany
}): Promise<boolean> {
  const text = await readImportText(file)
  if (text === null) return false
  let rows: string[][]
  try {
    rows = parseCsv(text, { maxRows: sheet.rowCount, maxCols: sheet.colCount })
  } catch {
    return false
  }
  let ok: boolean
  try {
    ok = await confirm({
      message: 'CSV 내용으로 셀을 채우시겠습니까? 기존 셀이 덮어써집니다. (실행 취소 가능)',
      confirmLabel: '가져오기',
    })
  } catch {
    return false
  }
  if (!ok) return false
  try {
    importCsvRowsInto(rows, writeCell, {
      rowCount: sheet.rowCount,
      colLetters: colLettersFor(sheet.colCount),
      writeMany: writeCells,
    })
  } catch {
    return false
  }
  return true
}

export function exportOverflowJson({
  sheet,
  downloadFile,
}: {
  sheet: Sheet
  downloadFile: DownloadFile
}): boolean {
  try {
    const json = stringifyJsonBounded(sheet, { maxLength: MAX_JSON_STRINGIFY_LENGTH, space: 2 })
    return json !== null && downloadFile('sheet.json', json)
  } catch {
    return false
  }
}

export async function importOverflowJson({
  file,
  confirm,
  previewSheetReplacement,
  applySheetReplacement,
  resetSheet,
}: {
  file: File
  confirm: Confirm
  previewSheetReplacement?: (sheet: Sheet) => Sheet | null
  applySheetReplacement?: (sheet: Sheet) => boolean
  resetSheet?: (sheet: Sheet) => void
}): Promise<boolean> {
  const text = await readImportText(file)
  if (text === null) return false
  let parsed
  try {
    parsed = SheetSchema.safeParse(JSON.parse(text))
  } catch {
    return false
  }
  if (!parsed.success) return false
  const replacement = previewSheetReplacement ? previewSheetReplacement(parsed.data) : parsed.data
  if (replacement === null) return false
  let ok: boolean
  try {
    ok = await confirm({
      message: '현재 시트를 가져온 JSON으로 교체하시겠습니까? (실행 취소 가능)',
      confirmLabel: '교체',
    })
  } catch {
    return false
  }
  if (!ok) return false
  try {
    if (applySheetReplacement) return applySheetReplacement(replacement)
    if (!resetSheet) return false
    resetSheet(replacement)
  } catch {
    return false
  }
  return true
}
