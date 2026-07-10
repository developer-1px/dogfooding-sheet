import type { PatternData } from '@interactive-os/aria'
import type { SelectedIdsUpdate } from '@spredsheet/selection-contract'
import type { InputProps, SelectProps } from '../../../shared/hooks/useEditable'
import type { Display, FillCellRange, Sheet, SheetOps, WriteCell, WriteMany } from '../../../entities/Sheet/schema'
import type { StyleLookup } from '../../../features/formatting/hooks/useStyles'
import type { NoteLookup } from '../../../features/notes/hooks/useNotes'
import type { RuleLookup } from '../../../features/validation/hooks/useValidation'
import type { Filter } from '../../../features/visibility/hooks/useFilter'
import type { FreezeActions, FreezeState } from '../../../features/visibility/hooks/useFreeze'
import type { HiddenActions } from '../../../features/visibility/hooks/useHidden'
import type { SheetMutations } from '../../../features/structure/model/sheetMutations'
import type { ClipboardTextBridge } from '../../../features/clipboard/model/clipboardActions'
import type { RecordMutationCommands } from '../../../shared/lib/dictOps'
import type { FormulaReferenceCellDecoration, FormulaReferenceTextDecoration } from '../../../features/selection/model/formulaReferenceDecorations'

interface CommitOptions {
  readonly restoreFocus?: boolean
  readonly draft?: string
}

export interface GridContextMenuController
  extends SheetMutations,
  Pick<FreezeActions, 'setFreezeRows' | 'setFreezeCols'>,
  Pick<HiddenActions, 'hideRow' | 'hideCol' | 'showRow' | 'showCol'> {
  sheet: Pick<Sheet, 'cells' | 'merges'>
  colLetters: readonly string[]
  hiddenRows: Set<number>
  hiddenCols: Set<string>
  filter: Filter | null
  clearFilter: () => void
  focusId: string | null
  selectedIds: string[]
  setFocusId: (id: string) => void
  setSelectedIds: (ids: SelectedIdsUpdate<string>) => void
  setSelectAnchor: (id: string | null) => void
  rowCount: number
  writeCell: WriteCell
  clipboardText?: ClipboardTextBridge
  noteOf: NoteLookup
  setNote: (k: string, text: string) => void
  editNote: (key?: string) => void
  insertLink: () => void
  promptRowHeight: (row: number) => void
  promptColWidth: (col: string) => void
  promptFilter: (col: string) => void
  freeze: FreezeState
  mergeSelection: () => void
}

export interface GridController extends GridContextMenuController {
  data: PatternData
  sheet: Sheet
  ops: SheetOps
  recordMutations: { colWidths: RecordMutationCommands<number> }
  display: Display
  writeCells: WriteMany
  fillCellRange: FillCellRange
  toggleCheckboxCell: (key: string) => void
  showGridlines: boolean
  rowHeightOf: (row: number) => number
  onRowResize: (row: number, height: number) => void
  onRowResizeEnd: (row: number, height: number) => void
  resetRowHeight: (row: number) => void
  editing: string | null
  draft: string
  setDraft: (draft: string) => void
  startEdit: (id: string, initial?: string, opts?: { caret?: 'end' | 'start' | 'select-all' }) => void
  commitEdit: (move?: { dRow: number; dCol: number }, opts?: CommitOptions) => void
  cancelEdit: (opts?: { restoreFocus?: boolean }) => void
  inputProps: InputProps
  selectProps: SelectProps
  highlightedIds: string[]
  formulaReferenceById: ReadonlyMap<string, FormulaReferenceCellDecoration>
  formulaReferenceText: readonly FormulaReferenceTextDecoration[]
  styleOf: StyleLookup
  ruleOf: RuleLookup
  condBgOf: (col: string, displayed: string) => string | undefined
  hiddenRowSet: Set<number>
  merges: Sheet['merges']
  formulaPickActive: boolean
  pickFormulaRef: (id: string, opts?: { extend?: boolean }) => void
  moveFormulaPick: (delta: { dRow: number; dCol: number }, extend?: boolean) => void
  cycleFormulaRef: () => void
}
