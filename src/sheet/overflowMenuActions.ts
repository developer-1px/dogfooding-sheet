import { exportCsv, importCsvRowsInto, parseCsv } from '../lib/csv'
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
  | 'clear-all'
  | 'clear-formats'

export interface OverflowMenuItem {
  id: OverflowMenuItemId
  label: string
}

export interface DownloadFile {
  (name: string, content: string): void
}

export const MAX_IMPORT_FILE_BYTES = 5_000_000

const readImportText = async (file: File): Promise<string | null> => {
  if (typeof file.size === 'number' && file.size > MAX_IMPORT_FILE_BYTES) return null
  const text = await file.text()
  return text.length <= MAX_IMPORT_FILE_BYTES ? text : null
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
  { id: 'clear-all', label: '전체 셀 지우기' },
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
}) {
  downloadFile('sheet.csv', exportCsv((key) => display(key), {
    rowCount: sheet.rowCount,
    colLetters: colLettersFor(sheet.colCount),
  }))
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
  try { rows = parseCsv(text) } catch { return false }
  const ok = await confirm({
    message: 'CSV 내용으로 셀을 채우시겠습니까? 기존 셀이 덮어써집니다. (실행 취소 가능)',
    confirmLabel: '가져오기',
  })
  if (!ok) return false
  importCsvRowsInto(rows, writeCell, {
    rowCount: sheet.rowCount,
    colLetters: colLettersFor(sheet.colCount),
    writeMany: writeCells,
  })
  return true
}

export function exportOverflowJson({
  sheet,
  downloadFile,
}: {
  sheet: Sheet
  downloadFile: DownloadFile
}) {
  downloadFile('sheet.json', JSON.stringify(sheet, null, 2))
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
  const ok = await confirm({
    message: '현재 시트를 가져온 JSON으로 교체하시겠습니까? (실행 취소 가능)',
    confirmLabel: '교체',
  })
  if (!ok) return false
  resetSheet(parsed.data)
  return true
}

export interface OverflowMenuCommands {
  openHelp: () => void
  toggleShowFormulas: () => void
  toggleShowGridlines: () => void
  insertLink: () => void
  print: () => void
  exportCsv: () => void
  openCsvImport: () => void
  exportJson: () => void
  openJsonImport: () => void
  confirm: Confirm
  resetCells: (cells: Cells) => void
  clearAllFormats: () => void
}

export async function runOverflowMenuCommand(id: OverflowMenuItemId, commands: OverflowMenuCommands): Promise<boolean> {
  if (id === 'help') commands.openHelp()
  else if (id === 'show-formulas') commands.toggleShowFormulas()
  else if (id === 'show-gridlines') commands.toggleShowGridlines()
  else if (id === 'link') commands.insertLink()
  else if (id === 'print') commands.print()
  else if (id === 'csv-export') commands.exportCsv()
  else if (id === 'csv-import') commands.openCsvImport()
  else if (id === 'json-export') commands.exportJson()
  else if (id === 'json-import') commands.openJsonImport()
  else if (id === 'clear-all') {
    const ok = await commands.confirm({
      message: '모든 셀을 지우시겠습니까? (실행 취소 가능)',
      confirmLabel: '지우기',
    })
    if (!ok) return false
    commands.resetCells({})
  } else if (id === 'clear-formats') {
    const ok = await commands.confirm({
      message: '모든 셀 서식·스타일·조건부 서식을 지우시겠습니까? (실행 취소 가능)',
      confirmLabel: '지우기',
    })
    if (!ok) return false
    commands.clearAllFormats()
  }
  return true
}
