import { useCallback, useEffect, useRef } from 'react'
import { moveCellId } from './storage'
import { cycleTrailingFormulaRef, idsForFormulaPick, refForFormulaPick, replaceTrailingFormulaRef } from './selection/formulaPick'

interface EditState {
  editing: string | null
  draft: string
  setDraft: (draft: string) => void
}

interface Args {
  edit: EditState
  rowCount: number
  colLetters: readonly string[]
  setSelectedIds: (ids: string[]) => void
  setSelectAnchor: (id: string | null) => void
}

export function useFormulaPick({ edit, rowCount, colLetters, setSelectedIds, setSelectAnchor }: Args) {
  const formulaPickActive = edit.editing !== null && edit.draft.startsWith('=')
  const anchorRef = useRef<string | null>(null)
  const targetRef = useRef<string | null>(null)

  const clearFormulaPick = useCallback(() => {
    anchorRef.current = null
    targetRef.current = null
  }, [])

  const pickFormulaRef = useCallback((id: string, opts: { extend?: boolean } = {}) => {
    if (!formulaPickActive) return
    const anchor = opts.extend && anchorRef.current ? anchorRef.current : id
    const ref = refForFormulaPick(anchor, id)
    if (!ref) return
    anchorRef.current = anchor
    targetRef.current = id
    setSelectedIds(idsForFormulaPick(anchor, id))
    setSelectAnchor(anchor)
    edit.setDraft(replaceTrailingFormulaRef(edit.draft, ref))
  }, [edit, formulaPickActive, setSelectAnchor, setSelectedIds])

  const moveFormulaPick = useCallback((delta: { dRow: number; dCol: number }, extend = false) => {
    if (!formulaPickActive || !edit.editing) return
    const base = targetRef.current ?? anchorRef.current ?? edit.editing
    const next = moveCellId(base, delta.dRow, delta.dCol, rowCount, colLetters)
    if (next) pickFormulaRef(next, { extend })
  }, [colLetters, edit.editing, formulaPickActive, pickFormulaRef, rowCount])

  const cycleFormulaRef = useCallback(() => {
    if (formulaPickActive) edit.setDraft(cycleTrailingFormulaRef(edit.draft))
  }, [edit, formulaPickActive])

  useEffect(() => {
    if (!formulaPickActive) clearFormulaPick()
  }, [clearFormulaPick, formulaPickActive])

  return {
    formulaPickActive,
    pickFormulaRef,
    moveFormulaPick,
    cycleFormulaRef,
    clearFormulaPick,
  }
}
