import type { Confirm } from '../../../shared/ports/dialog'

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
  keyShortcuts?: string
  disabled?: boolean
  disabledLabel?: string
  kind?: 'menuitemcheckbox'
  checked?: boolean
}

interface OverflowMenuState {
  showFormulas: boolean
  showGridlines: boolean
  canInsertLink?: boolean
  canClearValues?: boolean
  cellValueCount?: number
  canClearFormats?: boolean
  formatEntryCount?: number
}

export interface DownloadFile {
  (name: string, content: string): boolean
}

const clearValuesLabel = (count?: number): string =>
  count !== undefined && count > 0 ? `전체 값 ${count}개 지우기` : '전체 값 지우기'

const clearFormatsLabel = (count?: number): string =>
  count !== undefined && count > 0 ? `전체 서식 ${count}개 지우기` : '전체 서식 지우기'

export const overflowMenuItems = (state: OverflowMenuState): OverflowMenuItem[] => [
  { id: 'help', label: '도움말 (F1)', keyShortcuts: 'F1' },
  { id: 'show-formulas', label: `${state.showFormulas ? '✓ ' : ''}수식 표시 (Ctrl/⌘+\`)`, keyShortcuts: 'Control+` Meta+`', kind: 'menuitemcheckbox', checked: state.showFormulas },
  { id: 'show-gridlines', label: `${state.showGridlines ? '✓ ' : ''}격자선 표시`, kind: 'menuitemcheckbox', checked: state.showGridlines },
  { id: 'link', label: '하이퍼링크 삽입 (Ctrl/⌘+K)', keyShortcuts: 'Control+K Meta+K', disabled: state.canInsertLink === false, disabledLabel: '하이퍼링크를 삽입할 셀 없음' },
  { id: 'print', label: '인쇄 (Ctrl/⌘+P)', keyShortcuts: 'Control+P Meta+P' },
  { id: 'csv-export', label: 'CSV 내보내기 (Ctrl/⌘+S)', keyShortcuts: 'Control+S Meta+S' },
  { id: 'csv-import', label: 'CSV 가져오기' },
  { id: 'json-export', label: 'JSON 내보내기' },
  { id: 'json-import', label: 'JSON 가져오기' },
  { id: 'clear-values', label: clearValuesLabel(state.cellValueCount), disabled: state.canClearValues === false, disabledLabel: '지울 셀 값 없음' },
  { id: 'clear-formats', label: clearFormatsLabel(state.formatEntryCount), disabled: state.canClearFormats === false, disabledLabel: '지울 서식 없음' },
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
