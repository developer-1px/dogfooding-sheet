import type { PatternData } from '@interactive-os/aria'
import type { SelectedIdsUpdate } from '@spredsheet/selection-contract'
import type { InputProps, SelectProps } from '../../interactive-os/useEditable'
import type { Display, Sheet, SheetOps, WriteCell, WriteMany } from '../schema'
import type { StyleLookup } from '../formatting/useStyles'
import type { NoteLookup } from '../useNotes'
import type { RuleLookup } from '../validation/useValidation'
import type { Filter } from '../visibility/useFilter'
import type { FreezeActions, FreezeState } from '../visibility/useFreeze'
import type { HiddenActions } from '../visibility/useHidden'
import type { SheetMutations } from '../structure/sheetMutations'
import type { ClipboardTextBridge } from '../clipboard/clipboardActions'

export interface GridContextMenuController
  extends SheetMutations,
  Pick<FreezeActions, 'setFreezeRows' | 'setFreezeCols'>,
  Pick<HiddenActions, 'hideRow' | 'hideCol' | 'showRow' | 'showCol'> {
  sheet: Pick<Sheet, 'cells'>
  colLetters: readonly string[]
  hiddenRows: Set<number>
  hiddenCols: Set<string>
  filter: Filter | null
  clearFilter: () => void
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
  display: Display
  writeCells: WriteMany
  showGridlines: boolean
  rowHeightOf: (row: number) => number
  onRowResize: (row: number, height: number) => void
  onRowResizeEnd: (row: number, height: number) => void
  resetRowHeight: (row: number) => void
  focusId: string | null
  selectedIds: string[]
  editing: string | null
  draft: string
  setDraft: (draft: string) => void
  startEdit: (id: string, initial?: string, opts?: { caret?: 'end' | 'start' | 'select-all' }) => void
  commitEdit: (move?: { dRow: number; dCol: number }) => void
  cancelEdit: () => void
  inputProps: InputProps
  selectProps: SelectProps
  highlightedIds: string[]
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
