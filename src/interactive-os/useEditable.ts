import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type NavDir = 'up' | 'down' | 'left' | 'right'
type CaretMode = 'start' | 'end' | 'select-all'
export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onKeyDown'> & {
  ref?: React.Ref<HTMLInputElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>
}
export type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onKeyDown'> & {
  ref?: React.Ref<HTMLSelectElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>
}

interface UseEditableOptions<TId extends string> {
  getValue: (id: TId) => string
  onCommit: (id: TId, next: string) => void
  onNavigate?: (id: TId, dir: NavDir) => TId | null | undefined
  initialFocus?: TId
}

export function useEditable<TId extends string>(options: UseEditableOptions<TId>) {
  const [focusId, setFocusId] = useState<TId | null>(options.initialFocus ?? null)
  const [editing, setEditing] = useState<TId | null>(null)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const selectRef = useRef<HTMLSelectElement | null>(null)

  useEffect(() => {
    if (editing === null) return
    const el = inputRef.current ?? selectRef.current
    el?.focus()
    if (el instanceof HTMLInputElement) el.select()
  }, [editing])

  const startEdit = useCallback((id: TId, initial?: string, opts?: { caret?: CaretMode }) => {
    setFocusId(id)
    setEditing(id)
    setDraft(initial ?? options.getValue(id))
    queueMicrotask(() => {
      const input = inputRef.current
      if (!input) return
      if (opts?.caret === 'select-all') input.select()
      else if (opts?.caret === 'start') input.setSelectionRange(0, 0)
      else if (opts?.caret === 'end') input.setSelectionRange(input.value.length, input.value.length)
    })
  }, [options])

  const cancelEdit = useCallback(() => {
    setEditing(null)
    setDraft('')
  }, [])

  const commitEdit = useCallback((dir?: NavDir) => {
    if (editing === null) return
    options.onCommit(editing, draft)
    const nextFocus = dir ? options.onNavigate?.(editing, dir) : undefined
    setEditing(null)
    setDraft('')
    if (nextFocus) setFocusId(nextFocus)
  }, [draft, editing, options])

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }, [cancelEdit, commitEdit])

  const inputProps = useMemo<InputProps>(() => ({
    ref: inputRef,
    value: draft,
    onChange: (e) => setDraft(e.currentTarget.value),
    onKeyDown,
    onBlur: () => commitEdit(),
  }), [commitEdit, draft, onKeyDown])

  const selectProps = useMemo<SelectProps>(() => ({
    ref: selectRef,
    value: draft,
    onChange: (e) => setDraft(e.currentTarget.value),
    onKeyDown,
    onBlur: () => commitEdit(),
  }), [commitEdit, draft, onKeyDown])

  return {
    focusId,
    setFocusId,
    editing,
    draft,
    setDraft,
    startEdit,
    commitEdit,
    cancelEdit,
    inputProps,
    selectProps,
  }
}
