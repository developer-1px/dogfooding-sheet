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
  const draftRef = useRef(edit.draft)
  const editingRef = useRef(edit.editing)

  const clearFormulaPick = useCallback(() => {
    anchorRef.current = null
    targetRef.current = null
  }, [])

  const pickFormulaRef = useCallback((id: string, opts: { extend?: boolean } = {}) => {
    const draft = draftRef.current
    if (!editingRef.current || !draft.startsWith('=')) return
    const anchor = opts.extend && anchorRef.current ? anchorRef.current : id
    const ref = refForFormulaPick(anchor, id)
    if (!ref) return
    const nextDraft = replaceTrailingFormulaRef(draft, ref)
    anchorRef.current = anchor
    targetRef.current = id
    draftRef.current = nextDraft
    setSelectedIds(idsForFormulaPick(anchor, id))
    setSelectAnchor(anchor)
    edit.setDraft(nextDraft)
  }, [edit, setSelectAnchor, setSelectedIds])

  const moveFormulaPick = useCallback((delta: { dRow: number; dCol: number }, extend = false) => {
    const editing = editingRef.current
    if (!editing || !draftRef.current.startsWith('=')) return
    const base = targetRef.current ?? anchorRef.current ?? editing
    const next = moveCellId(base, delta.dRow, delta.dCol, rowCount, colLetters)
    if (next) pickFormulaRef(next, { extend })
  }, [colLetters, pickFormulaRef, rowCount])

  const cycleFormulaRef = useCallback(() => {
    if (!editingRef.current || !draftRef.current.startsWith('=')) return
    const nextDraft = cycleTrailingFormulaRef(draftRef.current)
    draftRef.current = nextDraft
    edit.setDraft(nextDraft)
  }, [edit])

  useEffect(() => {
    if (editingRef.current !== edit.editing) clearFormulaPick()
    editingRef.current = edit.editing
    draftRef.current = edit.draft
  }, [clearFormulaPick, edit.draft, edit.editing])

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
