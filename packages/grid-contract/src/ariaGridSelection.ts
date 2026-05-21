import {
  appendIdsForCol,
  appendIdsForRow,
  cellId,
  idsBetween,
} from '@spredsheet/grid'
import { z } from 'zod'

export const gridcellIdSchema = z
  .string()
  .regex(/^r(?:0|[1-9]\d*)-[A-Z]+$/, 'Expected a gridcell id like r0-A')

export const selectedIdsSchema = z.array(gridcellIdSchema).readonly()

export const ariaGridSelectionSchema = z
  .object({
    activeDescendantId: gridcellIdSchema.nullable(),
    selectionAnchorId: gridcellIdSchema.nullable(),
    selectedIds: selectedIdsSchema,
  })
  .strict()
  .readonly()

export type GridcellId = z.infer<typeof gridcellIdSchema>

export interface AriaGridSelection<TGridcellId extends string = GridcellId> {
  readonly activeDescendantId: TGridcellId | null
  readonly selectionAnchorId: TGridcellId | null
  readonly selectedIds: readonly TGridcellId[]
}

export type ParsedAriaGridSelection = z.infer<typeof ariaGridSelectionSchema>

export type SelectedIdsUpdate<TGridcellId extends string = GridcellId> =
  | readonly TGridcellId[]
  | ((selectedIds: readonly TGridcellId[]) => readonly TGridcellId[])

export interface AriaGridBounds {
  readonly rowCount: number
  readonly colLetters: readonly string[]
}

export interface SetActiveDescendantOptions<TGridcellId extends string = GridcellId> {
  readonly selectionAnchorId?: TGridcellId | null
  readonly clearSelection?: boolean
}

const freezeSelection = <TGridcellId extends string>(
  selection: AriaGridSelection<TGridcellId>,
): AriaGridSelection<TGridcellId> => Object.freeze({
    activeDescendantId: selection.activeDescendantId,
    selectionAnchorId: selection.selectionAnchorId,
    selectedIds: Object.freeze([...selection.selectedIds]),
  })

const asGridcellIds = <TGridcellId extends string>(ids: string[]): readonly TGridcellId[] =>
  ids as unknown as readonly TGridcellId[]

const idsForColumn = <TGridcellId extends string>(column: string, rowCount: number): readonly TGridcellId[] => {
  const selectedIds: string[] = []
  appendIdsForCol(selectedIds, column, rowCount)
  return asGridcellIds<TGridcellId>(selectedIds)
}

const idsForRow = <TGridcellId extends string>(
  rowIndex: number,
  colLetters: readonly string[],
): readonly TGridcellId[] => {
  const selectedIds: string[] = []
  appendIdsForRow(selectedIds, rowIndex, colLetters)
  return asGridcellIds<TGridcellId>(selectedIds)
}

export const parseAriaGridSelection = (value: unknown): ParsedAriaGridSelection =>
  ariaGridSelectionSchema.parse(value)

export const createAriaGridSelection = <TGridcellId extends string = GridcellId>(
  activeDescendantId: TGridcellId | null = null,
): AriaGridSelection<TGridcellId> => freezeSelection({
    activeDescendantId,
    selectionAnchorId: activeDescendantId,
    selectedIds: [],
  })

export const setActiveDescendant = <TGridcellId extends string>(
  selection: AriaGridSelection<TGridcellId>,
  activeDescendantId: TGridcellId | null,
  opts: SetActiveDescendantOptions<TGridcellId> = {},
): AriaGridSelection<TGridcellId> => freezeSelection({
    activeDescendantId,
    selectionAnchorId: opts.selectionAnchorId === undefined
      ? selection.selectionAnchorId
      : opts.selectionAnchorId,
    selectedIds: opts.clearSelection ? [] : selection.selectedIds,
  })

export const setSelectionAnchor = <TGridcellId extends string>(
  selection: AriaGridSelection<TGridcellId>,
  selectionAnchorId: TGridcellId | null,
): AriaGridSelection<TGridcellId> => freezeSelection({
    ...selection,
    selectionAnchorId,
  })

export const setSelectedIds = <TGridcellId extends string>(
  selection: AriaGridSelection<TGridcellId>,
  update: SelectedIdsUpdate<TGridcellId>,
): AriaGridSelection<TGridcellId> => freezeSelection({
    ...selection,
    selectedIds: typeof update === 'function' ? update(selection.selectedIds) : update,
  })

export const clearSelectedIds = <TGridcellId extends string>(
  selection: AriaGridSelection<TGridcellId>,
): AriaGridSelection<TGridcellId> => setSelectedIds(selection, [])

export const replaceAriaGridSelection = <TGridcellId extends string>(
  selection: AriaGridSelection<TGridcellId>,
  selectedIds: readonly TGridcellId[],
  opts: {
    readonly activeDescendantId?: TGridcellId | null
    readonly selectionAnchorId?: TGridcellId | null
  } = {},
): AriaGridSelection<TGridcellId> => freezeSelection({
    activeDescendantId: opts.activeDescendantId === undefined
      ? selection.activeDescendantId
      : opts.activeDescendantId,
    selectionAnchorId: opts.selectionAnchorId === undefined
      ? selection.selectionAnchorId
      : opts.selectionAnchorId,
    selectedIds,
  })

export const targetSelectedIds = <TGridcellId extends string>(
  selection: Pick<AriaGridSelection<TGridcellId>, 'activeDescendantId' | 'selectedIds'>,
): readonly TGridcellId[] =>
  selection.selectedIds.length > 0
    ? selection.selectedIds
    : selection.activeDescendantId
      ? [selection.activeDescendantId]
      : []

export const selectGridcell = <TGridcellId extends string>(
  _selection: AriaGridSelection<TGridcellId>,
  gridcellId: TGridcellId,
): AriaGridSelection<TGridcellId> => freezeSelection({
    activeDescendantId: gridcellId,
    selectionAnchorId: gridcellId,
    selectedIds: [gridcellId],
  })

export const selectGridcellRange = <TGridcellId extends string>(
  selection: AriaGridSelection<TGridcellId>,
  gridcellId: TGridcellId,
  selectionAnchorId: TGridcellId = selection.selectionAnchorId ?? selection.activeDescendantId ?? gridcellId,
): AriaGridSelection<TGridcellId> => freezeSelection({
    activeDescendantId: gridcellId,
    selectionAnchorId,
    selectedIds: asGridcellIds<TGridcellId>(idsBetween(selectionAnchorId, gridcellId)),
  })

export const selectColumn = <TGridcellId extends string>(
  _selection: AriaGridSelection<TGridcellId>,
  column: string,
  bounds: Pick<AriaGridBounds, 'rowCount'>,
): AriaGridSelection<TGridcellId> => {
  const activeDescendantId = cellId(column, 0) as TGridcellId
  return freezeSelection({
    activeDescendantId,
    selectionAnchorId: activeDescendantId,
    selectedIds: idsForColumn<TGridcellId>(column, bounds.rowCount),
  })
}

export const selectRow = <TGridcellId extends string>(
  _selection: AriaGridSelection<TGridcellId>,
  rowIndex: number,
  bounds: Pick<AriaGridBounds, 'colLetters'>,
): AriaGridSelection<TGridcellId> => {
  const firstColumn = bounds.colLetters[0] ?? 'A'
  const activeDescendantId = cellId(firstColumn, rowIndex) as TGridcellId
  return freezeSelection({
    activeDescendantId,
    selectionAnchorId: activeDescendantId,
    selectedIds: idsForRow<TGridcellId>(rowIndex, bounds.colLetters),
  })
}

export const selectAllGridcells = <TGridcellId extends string>(
  _selection: AriaGridSelection<TGridcellId>,
  bounds: AriaGridBounds,
): AriaGridSelection<TGridcellId> => {
  const firstColumn = bounds.colLetters[0] ?? 'A'
  const activeDescendantId = cellId(firstColumn, 0) as TGridcellId
  const selectedIds: string[] = []
  for (let rowIndex = 0; rowIndex < bounds.rowCount; rowIndex++) {
    appendIdsForRow(selectedIds, rowIndex, bounds.colLetters)
  }
  return freezeSelection({
    activeDescendantId,
    selectionAnchorId: activeDescendantId,
    selectedIds: asGridcellIds<TGridcellId>(selectedIds),
  })
}
