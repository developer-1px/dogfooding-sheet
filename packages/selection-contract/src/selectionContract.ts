import { z } from 'zod'

export const selectableIdSchema = z.string().min(1)

export const selectedIdsSchema = z.array(selectableIdSchema).readonly()

export const selectionStateSchema = z
  .object({
    selectedIds: selectedIdsSchema,
    multiselectable: z.boolean().default(false),
  })
  .strict()
  .readonly()
  .superRefine((state, ctx) => {
    if (!state.multiselectable && state.selectedIds.length > 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['selectedIds'],
        message: 'Single-selection state cannot contain more than one selected id',
      })
    }
  })

export const selectionBoundarySchema = z
  .object({
    anchorId: selectableIdSchema.nullable(),
    focusId: selectableIdSchema.nullable(),
  })
  .strict()
  .readonly()

export type SelectableId = z.infer<typeof selectableIdSchema>

export interface SelectionState<TSelectableId extends string = SelectableId> {
  readonly selectedIds: readonly TSelectableId[]
  readonly multiselectable: boolean
}

export interface SelectionBoundary<TSelectableId extends string = SelectableId> {
  readonly anchorId: TSelectableId | null
  readonly focusId: TSelectableId | null
}

export type ParsedSelectionState = z.infer<typeof selectionStateSchema>
export type ParsedSelectionBoundary = z.infer<typeof selectionBoundarySchema>

export type SelectedIdsUpdate<TSelectableId extends string = SelectableId> =
  | readonly TSelectableId[]
  | ((selectedIds: readonly TSelectableId[]) => readonly TSelectableId[])

export interface CreateSelectionStateOptions<TSelectableId extends string = SelectableId> {
  readonly selectedIds?: readonly TSelectableId[]
  readonly multiselectable?: boolean
}

const freezeSelectionState = <TSelectableId extends string>(
  state: SelectionState<TSelectableId>,
): SelectionState<TSelectableId> => Object.freeze({
    selectedIds: Object.freeze([...state.selectedIds]),
    multiselectable: state.multiselectable,
  })

const freezeSelectionBoundary = <TSelectableId extends string>(
  boundary: SelectionBoundary<TSelectableId>,
): SelectionBoundary<TSelectableId> => Object.freeze({
    anchorId: boundary.anchorId,
    focusId: boundary.focusId,
  })

const enforceSelectionState = <TSelectableId extends string>(
  state: SelectionState<TSelectableId>,
): SelectionState<TSelectableId> => {
  const selectedIds = state.multiselectable ? state.selectedIds : state.selectedIds.slice(0, 1)
  return freezeSelectionState({
    selectedIds,
    multiselectable: state.multiselectable,
  })
}

export const parseSelectionState = (value: unknown): ParsedSelectionState =>
  selectionStateSchema.parse(value)

export const parseSelectionBoundary = (value: unknown): ParsedSelectionBoundary =>
  selectionBoundarySchema.parse(value)

export const createSelectionState = <TSelectableId extends string = SelectableId>(
  opts: CreateSelectionStateOptions<TSelectableId> = {},
): SelectionState<TSelectableId> => enforceSelectionState({
    selectedIds: opts.selectedIds ?? [],
    multiselectable: opts.multiselectable ?? false,
  })

export const createSelectionBoundary = <TSelectableId extends string = SelectableId>(
  focusId: TSelectableId | null = null,
): SelectionBoundary<TSelectableId> => freezeSelectionBoundary({
    anchorId: focusId,
    focusId,
  })

export const setSelectedIds = <TSelectableId extends string>(
  state: SelectionState<TSelectableId>,
  update: SelectedIdsUpdate<TSelectableId>,
): SelectionState<TSelectableId> => enforceSelectionState({
    ...state,
    selectedIds: typeof update === 'function' ? update(state.selectedIds) : update,
  })

export const clearSelection = <TSelectableId extends string>(
  state: SelectionState<TSelectableId>,
): SelectionState<TSelectableId> => setSelectedIds(state, [])

export const replaceSelection = <TSelectableId extends string>(
  state: SelectionState<TSelectableId>,
  selectedIds: readonly TSelectableId[],
): SelectionState<TSelectableId> => setSelectedIds(state, selectedIds)

export const setSelected = <TSelectableId extends string>(
  state: SelectionState<TSelectableId>,
  id: TSelectableId,
  selected: boolean,
): SelectionState<TSelectableId> => {
  if (!selected) return setSelectedIds(state, state.selectedIds.filter((selectedId) => selectedId !== id))
  if (!state.multiselectable) return setSelectedIds(state, [id])
  return state.selectedIds.includes(id) ? state : setSelectedIds(state, [...state.selectedIds, id])
}

export const toggleSelected = <TSelectableId extends string>(
  state: SelectionState<TSelectableId>,
  id: TSelectableId,
): SelectionState<TSelectableId> => setSelected(state, id, !state.selectedIds.includes(id))

export const setSelectionFocus = <TSelectableId extends string>(
  boundary: SelectionBoundary<TSelectableId>,
  focusId: TSelectableId | null,
  opts: { readonly anchorId?: TSelectableId | null } = {},
): SelectionBoundary<TSelectableId> => freezeSelectionBoundary({
    anchorId: opts.anchorId === undefined ? boundary.anchorId : opts.anchorId,
    focusId,
  })

export const setSelectionAnchor = <TSelectableId extends string>(
  boundary: SelectionBoundary<TSelectableId>,
  anchorId: TSelectableId | null,
): SelectionBoundary<TSelectableId> => freezeSelectionBoundary({
    ...boundary,
    anchorId,
  })
