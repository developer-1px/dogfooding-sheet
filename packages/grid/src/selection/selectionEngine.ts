export interface GridSelectionState<TId extends string = string> {
  focusId: TId | null
  anchorId: TId | null
  selectedIds: TId[]
}

export type GridSelectionUpdate<TId extends string = string> =
  | TId[]
  | ((selectedIds: TId[]) => TId[])

export const createGridSelectionState = <TId extends string>(focusId: TId | null = null): GridSelectionState<TId> => ({
  focusId,
  anchorId: focusId,
  selectedIds: [],
})

export const setGridSelectionFocus = <TId extends string>(
  state: GridSelectionState<TId>,
  focusId: TId | null,
  opts: { anchor?: TId | null; clearSelection?: boolean } = {},
): GridSelectionState<TId> => ({
  focusId,
  anchorId: opts.anchor === undefined ? state.anchorId : opts.anchor,
  selectedIds: opts.clearSelection ? [] : state.selectedIds,
})

export const setGridSelectionAnchor = <TId extends string>(
  state: GridSelectionState<TId>,
  anchorId: TId | null,
): GridSelectionState<TId> => ({
  ...state,
  anchorId,
})

export const setGridSelectedIds = <TId extends string>(
  state: GridSelectionState<TId>,
  update: GridSelectionUpdate<TId>,
): GridSelectionState<TId> => ({
  ...state,
  selectedIds: typeof update === 'function' ? update(state.selectedIds) : update,
})

export const clearGridSelection = <TId extends string>(state: GridSelectionState<TId>): GridSelectionState<TId> => ({
  ...state,
  selectedIds: [],
})

export const replaceGridSelection = <TId extends string>(
  state: GridSelectionState<TId>,
  selectedIds: TId[],
  opts: { focusId?: TId | null; anchorId?: TId | null } = {},
): GridSelectionState<TId> => ({
  focusId: opts.focusId === undefined ? state.focusId : opts.focusId,
  anchorId: opts.anchorId === undefined ? state.anchorId : opts.anchorId,
  selectedIds,
})

export const targetGridIds = <TId extends string>(
  state: Pick<GridSelectionState<TId>, 'focusId' | 'selectedIds'>,
): TId[] => state.selectedIds.length > 0 ? state.selectedIds : state.focusId ? [state.focusId] : []

