import { useCallback, useMemo, useState } from 'react'
import {
  createSelectionBoundary,
  createSelectionState,
  setSelectedIds as setContractSelectedIds,
  setSelectionAnchor,
  setSelectionFocus,
  type SelectedIdsUpdate,
} from '@spredsheet/selection-contract'
import { cellIdToKey } from '../../../entities/Sheet/schema'

interface FocusState {
  focusId: string | null
  setFocusId: (id: string | null) => void
}

export function useSheetSelection(focus: FocusState) {
  const { focusId, setFocusId: setEditFocusId } = focus
  const [selectionState, setSelectionState] = useState(() =>
    createSelectionState<string>({ multiselectable: true }))
  const [selectionBoundary, setSelectionBoundary] = useState(() =>
    createSelectionBoundary<string>('r0-A'))

  const boundary = useMemo(
    () => selectionBoundary.focusId === focusId
      ? selectionBoundary
      : setSelectionFocus(selectionBoundary, focusId),
    [focusId, selectionBoundary],
  )

  const setSelectedIds = useCallback((update: SelectedIdsUpdate<string>) => {
    setSelectionState((state) => setContractSelectedIds(state, update))
  }, [])

  const setSelectAnchor = useCallback((id: string | null) => {
    setSelectionBoundary((boundary) => setSelectionAnchor(boundary, id))
  }, [])

  const setFocusId = useCallback((id: string | null) => {
    setEditFocusId(id)
    setSelectionBoundary((boundary) => setSelectionFocus(boundary, id))
  }, [setEditFocusId])

  const selectedIds = useMemo(() => [...selectionState.selectedIds], [selectionState.selectedIds])
  const targetIds = () =>
    selectedIds.length > 0 ? selectedIds : boundary.focusId ? [boundary.focusId] : []
  const targetKeys = () => targetIds().map(cellIdToKey)

  return {
    selectedIds,
    selectAnchor: boundary.anchorId,
    setSelectedIds,
    setSelectAnchor,
    setFocusId,
    targetIds,
    targetKeys,
  }
}
