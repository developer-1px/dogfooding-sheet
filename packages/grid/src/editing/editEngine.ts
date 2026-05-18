export type GridNavDir = 'up' | 'down' | 'left' | 'right'

export type GridCaretMode = 'start' | 'end' | 'select-all'

export interface GridEditState<TId extends string = string> {
  focusId: TId | null
  editing: TId | null
  draft: string
}

export interface StartGridEditOptions {
  caret?: GridCaretMode
}

export interface GridEditStart<TId extends string = string> {
  state: GridEditState<TId>
  caret?: GridCaretMode
}

export interface GridEditCommit<TId extends string = string> {
  state: GridEditState<TId>
  write?: { id: TId; value: string }
}

export const createGridEditState = <TId extends string>(initialFocus: TId | null = null): GridEditState<TId> => ({
  focusId: initialFocus,
  editing: null,
  draft: '',
})

export const setGridFocus = <TId extends string>(state: GridEditState<TId>, focusId: TId | null): GridEditState<TId> => ({
  ...state,
  focusId,
})

export const setGridDraft = <TId extends string>(state: GridEditState<TId>, draft: string): GridEditState<TId> => ({
  ...state,
  draft,
})

export const startGridEdit = <TId extends string>(
  _state: GridEditState<TId>,
  id: TId,
  value: string,
  opts: StartGridEditOptions = {},
): GridEditStart<TId> => ({
  state: {
    focusId: id,
    editing: id,
    draft: value,
  },
  caret: opts.caret,
})

export const cancelGridEdit = <TId extends string>(state: GridEditState<TId>): GridEditState<TId> => ({
  ...state,
  editing: null,
  draft: '',
})

export const commitGridEdit = <TId extends string>(
  state: GridEditState<TId>,
  navigate?: (id: TId) => TId | null | undefined,
): GridEditCommit<TId> => {
  if (state.editing === null) return { state }
  const nextFocus = navigate?.(state.editing)
  return {
    state: {
      focusId: nextFocus ?? state.focusId,
      editing: null,
      draft: '',
    },
    write: { id: state.editing, value: state.draft },
  }
}
