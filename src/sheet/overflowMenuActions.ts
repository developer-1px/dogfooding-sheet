import type { Confirm } from './useConfirm'

export {
  MAX_IMPORT_FILE_BYTES,
  exportOverflowCsv,
  exportOverflowJson,
  importOverflowCsv,
  importOverflowJson,
} from './overflowImportExport'

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
  clearCellValues: () => boolean
  clearAllFormats: () => boolean
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
      return commands.clearCellValues()
    } else if (id === 'clear-formats') {
      const ok = await commands.confirm({
        message: '모든 셀 서식·스타일·조건부 서식을 지우시겠습니까? (실행 취소 가능)',
        confirmLabel: '지우기',
      })
      if (!ok) return false
      return commands.clearAllFormats()
    }
    return true
  } catch {
    return false
  }
}
