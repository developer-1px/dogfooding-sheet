import { exportCsvBounded, importCsvRowsInto, MAX_CSV_EXPORT_LENGTH, parseCsv } from '../lib/csv'
import type { Confirm } from './useConfirm'
import { SheetSchema, colLettersFor, type Cells, type Display, type Sheet, type WriteCell, type WriteMany } from './schema'

export type OverflowMenuItemId =
  | 'help'
  | 'show-formulas'
  | 'show-gridlines'
  | 'link'
  | 'print'
  | 'csv-export'
  | 'csv-import'
  | 'json-export'
  | 'json-import'
  | 'clear-values'
  | 'clear-formats'

export interface OverflowMenuItem {
  id: OverflowMenuItemId
  label: string
}

export interface DownloadFile {
  (name: string, content: string): boolean
}

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

export const overflowMenuItems = (state: { showFormulas: boolean; showGridlines: boolean }): OverflowMenuItem[] => [
  { id: 'help', label: '도움말 (F1)' },
  { id: 'show-formulas', label: `${state.showFormulas ? '✓ ' : ''}수식 표시 (Ctrl/⌘+\`)` },
  { id: 'show-gridlines', label: `${state.showGridlines ? '✓ ' : ''}격자선 표시` },
  { id: 'link', label: '하이퍼링크 삽입 (Ctrl/⌘+K)' },
  { id: 'print', label: '인쇄 (Ctrl/⌘+P)' },
  { id: 'csv-export', label: 'CSV 내보내기' },
  { id: 'csv-import', label: 'CSV 가져오기' },
  { id: 'json-export', label: 'JSON 내보내기' },
  { id: 'json-import', label: 'JSON 가져오기' },
  { id: 'clear-values', label: '전체 값 지우기' },
  { id: 'clear-formats', label: '전체 서식 지우기' },
]

export const overflowMenuItemId = (id: string): OverflowMenuItemId | null =>
  overflowMenuItems({ showFormulas: false, showGridlines: false }).some((item) => item.id === id)
    ? id as OverflowMenuItemId
    : null

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
    return downloadFile('sheet.json', JSON.stringify(sheet, null, 2))
  } catch {
    return false
  }
}

export async function importOverflowJson({
  file,
  confirm,
  resetSheet,
}: {
  file: File
  confirm: Confirm
  resetSheet: (sheet: Sheet) => void
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
    resetSheet(parsed.data)
  } catch {
    return false
  }
  return true
}

export interface OverflowMenuCommands {
  openHelp: () => void
  toggleShowFormulas: () => void
  toggleShowGridlines: () => void
  insertLink: () => void
  print: () => void
  exportCsv: () => boolean
  openCsvImport: () => void
  exportJson: () => boolean
  openJsonImport: () => void
  confirm: Confirm
  clearCellValues: (cells: Cells) => void
  clearAllFormats: () => void
}

export async function runOverflowMenuCommand(id: OverflowMenuItemId, commands: OverflowMenuCommands): Promise<boolean> {
  try {
    if (id === 'help') commands.openHelp()
    else if (id === 'show-formulas') commands.toggleShowFormulas()
    else if (id === 'show-gridlines') commands.toggleShowGridlines()
    else if (id === 'link') commands.insertLink()
    else if (id === 'print') commands.print()
    else if (id === 'csv-export') return commands.exportCsv()
    else if (id === 'csv-import') commands.openCsvImport()
    else if (id === 'json-export') return commands.exportJson()
    else if (id === 'json-import') commands.openJsonImport()
    else if (id === 'clear-values') {
      const ok = await commands.confirm({
        message: '모든 셀 값을 지우시겠습니까? (실행 취소 가능)',
        confirmLabel: '지우기',
      })
      if (!ok) return false
      commands.clearCellValues({})
    } else if (id === 'clear-formats') {
      const ok = await commands.confirm({
        message: '모든 셀 서식·스타일·조건부 서식을 지우시겠습니까? (실행 취소 가능)',
        confirmLabel: '지우기',
      })
      if (!ok) return false
      commands.clearAllFormats()
    }
    return true
  } catch {
    return false
  }
}
