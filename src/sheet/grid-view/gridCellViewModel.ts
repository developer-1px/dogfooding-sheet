import type { CSSProperties } from 'react'
import { colIndex, isNumeric, type Rect } from '@spredsheet/grid'
import { cellKey, parseCellId } from '../schema'
import { styleToProps, type StyleLookup } from '../formatting/useStyles'
import type { NoteLookup } from '../useNotes'
import type { RuleLookup } from '../validation/useValidation'
import type { FormulaReferenceCellDecoration } from '../selection/formulaReferenceDecorations'
import type { SheetGridCell } from './gridTypes'

export interface MergeAnchor {
  rows: number
  cols: number
}

interface GridCellViewModelArgs {
  rowIndex: number
  colIndex: number
  cell: SheetGridCell
  colLetters: readonly string[]
  hiddenCols: ReadonlySet<string>
  mergeAnchors: ReadonlyMap<string, MergeAnchor>
  mergeHidden: ReadonlySet<string>
  freezeCols: number
  freezeLefts: readonly number[]
  focusId: string | null
  fillSourceRect: Rect | null
  styleOf: StyleLookup
  noteOf: NoteLookup
  rawOf: NoteLookup
  ruleOf: RuleLookup
  condBgOf: (col: string, displayed: string) => string | undefined
  highlightedIds: ReadonlySet<string>
  formulaReferenceById: ReadonlyMap<string, FormulaReferenceCellDecoration>
  previewIds: ReadonlySet<string>
}

export interface GridCellViewModel {
  id: string
  address: string
  label: string
  selected: boolean
  focused: boolean
  highlighted: boolean
  numeric: boolean
  mergeRange?: string
  mergeRows?: number
  mergeCols?: number
  styleClass: string
  styleInline: CSSProperties
  formulaReference?: FormulaReferenceCellDecoration
  note?: string
  tooltip?: string
  validationOptions?: string[]
  checkbox: boolean
  fillCorner: boolean
  previewing: boolean
}

export const mergeRangeLabel = (
  rowIndex: number,
  colIndex: number,
  anchor: MergeAnchor,
  colLetters: readonly string[],
): string => {
  const start = cellKey(colLetters[colIndex], rowIndex)
  const end = cellKey(colLetters[colIndex + anchor.cols - 1] ?? colLetters[colIndex], rowIndex + anchor.rows - 1)
  return start === end ? start : `${start}:${end}`
}

export function createGridCellViewModel(args: GridCellViewModelArgs): GridCellViewModel | null {
  const column = args.colLetters[args.colIndex]
  if (args.hiddenCols.has(column)) return null

  const mergeKey = `${args.rowIndex},${args.colIndex}`
  if (args.mergeHidden.has(mergeKey)) return null

  const anchor = args.mergeAnchors.get(mergeKey)
  const parsed = parseCellId(args.cell.id)
  const address = parsed ? cellKey(parsed.col, parsed.row) : ''
  const raw = args.rawOf(address)
  const styleProps = styleToProps(args.styleOf(address))
  const condBg = parsed ? args.condBgOf(parsed.col, args.cell.label) : undefined
  const baseStyle = condBg ? { ...styleProps.style, background: condBg } : styleProps.style
  const freezeStyle = args.colIndex < args.freezeCols ? { ...baseStyle, left: args.freezeLefts[args.colIndex] } : baseStyle
  const mergeStyle = anchor ? { gridColumn: `${args.colIndex + 2} / span ${anchor.cols}`, zIndex: 4 } : {}
  const rule = args.ruleOf(address)
  const frozenClass = args.colIndex < args.freezeCols ? 'freeze-col' : ''
  const styleClass = [styleProps.className, frozenClass].filter(Boolean).join(' ')

  return {
    id: args.cell.id,
    address,
    label: args.cell.label,
    selected: args.cell.selected,
    focused: args.focusId === args.cell.id,
    highlighted: args.highlightedIds.has(args.cell.id),
    numeric: args.cell.label !== '' && (isNumeric(args.cell.label) || isNumeric(raw ?? '')),
    mergeRange: anchor ? mergeRangeLabel(args.rowIndex, args.colIndex, anchor, args.colLetters) : undefined,
    mergeRows: anchor?.rows,
    mergeCols: anchor?.cols,
    styleClass,
    styleInline: { ...freezeStyle, ...mergeStyle },
    formulaReference: args.formulaReferenceById.get(args.cell.id),
    note: args.noteOf(address),
    tooltip: raw?.startsWith('=') ? raw : undefined,
    validationOptions: rule?.type === 'list' ? rule.options : undefined,
    checkbox: rule?.type === 'checkbox',
    fillCorner: !!parsed && !!args.fillSourceRect && parsed.row === args.fillSourceRect.rMax && colIndex(parsed.col) === args.fillSourceRect.cMax,
    previewing: args.previewIds.has(args.cell.id),
  }
}
