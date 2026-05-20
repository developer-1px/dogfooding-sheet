import { useCallback, useState } from 'react'
import {
  createGridSelectionState,
  setGridSelectedIds,
  setGridSelectionAnchor,
  setGridSelectionFocus,
  targetGridIds,
  type GridSelectionUpdate,
} from '@spredsheet/grid'
import { cellIdToKey } from './schema'

interface FocusState {
  focusId: string | null
  setFocusId: (id: string | null) => void
}

export function useSheetSelection(focus: FocusState) {
  const { focusId, setFocusId: setEditFocusId } = focus
  const [selection, setSelection] = useState(() => createGridSelectionState<string>('r0-A'))

  const setSelectedIds = useCallback((ids: GridSelectionUpdate<string>) => {
    setSelection((s) => setGridSelectedIds(s, ids))
  }, [])

  const setSelectAnchor = useCallback((id: string | null) => {
    setSelection((s) => setGridSelectionAnchor(s, id))
  }, [])

  const setFocusId = useCallback((id: string | null) => {
    setEditFocusId(id)
    setSelection((s) => setGridSelectionFocus(s, id))
  }, [setEditFocusId])

  const targetIds = () => targetGridIds({ focusId, selectedIds: selection.selectedIds })
  const targetKeys = () => targetIds().map(cellIdToKey)

  return {
    selectedIds: selection.selectedIds,
    selectAnchor: selection.anchorId,
    setSelectedIds,
    setSelectAnchor,
    setFocusId,
    targetIds,
    targetKeys,
  }
}
