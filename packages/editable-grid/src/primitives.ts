import { useCallback, useEffect, useRef } from 'react'
import type { RefCallback } from 'react'
export * from './domPrimitives'

export type EditableGridCaretMode = 'start' | 'end' | 'select-all'
export type EditableGridEditorElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

export interface UseEditableGridDomFocusOptions<TId extends string = string> {
  readonly editingId: TId | null
  readonly activeId?: TId | null
  readonly cellSelector?: string
  readonly getCellId?: (element: HTMLElement) => TId | null | undefined
}

export interface EditableGridDomFocus<TId extends string = string> {
  readonly editorRef: RefCallback<EditableGridEditorElement>
  readonly requestEditorCaret: (caret?: EditableGridCaretMode) => void
  readonly requestCellFocusRestore: (id: TId | null | undefined) => void
}

const defaultCellSelector = '[role="gridcell"]'

const defaultGetCellId = <TId extends string>(element: HTMLElement): TId | null =>
  (element.dataset.id as TId | undefined) ?? null

const selectionLengthOf = (element: HTMLInputElement | HTMLTextAreaElement): number =>
  element.value.length

const setCaret = (element: EditableGridEditorElement, caret: EditableGridCaretMode): void => {
  if (caret === 'select-all' && 'select' in element) {
    element.select()
    return
  }
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return
  const position = caret === 'start' ? 0 : selectionLengthOf(element)
  try {
    element.setSelectionRange(position, position)
  } catch {
    // Some input types, such as number/date, do not support text selection.
  }
}

export function useEditableGridDomFocus<TId extends string = string>({
  editingId,
  activeId,
  cellSelector = defaultCellSelector,
  getCellId = defaultGetCellId,
}: UseEditableGridDomFocusOptions<TId>): EditableGridDomFocus<TId> {
  const editorElement = useRef<EditableGridEditorElement | null>(null)
  const pendingCaretMode = useRef<EditableGridCaretMode | null>(null)
  const pendingFocusRestoreId = useRef<TId | null>(null)

  const editorRef = useCallback<RefCallback<EditableGridEditorElement>>((element) => {
    editorElement.current = element
  }, [])

  const requestEditorCaret = useCallback((caret?: EditableGridCaretMode) => {
    pendingCaretMode.current = caret ?? null
  }, [])

  const requestCellFocusRestore = useCallback((id: TId | null | undefined) => {
    pendingFocusRestoreId.current = id ?? null
  }, [])

  useEffect(() => {
    if (editingId === null) {
      pendingCaretMode.current = null
      return
    }
    const element = editorElement.current
    element?.focus()
    const caret = pendingCaretMode.current
    pendingCaretMode.current = null
    if (element && caret) setCaret(element, caret)
  }, [editingId])

  useEffect(() => {
    if (editingId !== null) return
    const id = pendingFocusRestoreId.current
    if (!id || typeof document === 'undefined') return
    pendingFocusRestoreId.current = null
    const cell = [...document.querySelectorAll<HTMLElement>(cellSelector)]
      .find((element) => getCellId(element) === id)
    cell?.focus()
  }, [activeId, cellSelector, editingId, getCellId])

  return {
    editorRef,
    requestEditorCaret,
    requestCellFocusRestore,
  }
}
