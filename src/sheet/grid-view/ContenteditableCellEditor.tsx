import { useEffect, useRef } from 'react'
import {
  createContenteditableScalarEdit,
  type ContenteditableScalarEditHandle,
} from 'nano-edit/inline-edit'

interface CommitOptions {
  readonly restoreFocus?: boolean
}

interface Props {
  readonly ariaLabel: string
  readonly draft: string
  readonly setDraft: (draft: string) => void
  readonly onCommit: (draft: string, opts?: CommitOptions) => void
  readonly onCancel: (opts?: CommitOptions) => void
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLElement>
}

interface EditorCallbacks {
  readonly setDraft: (draft: string) => void
  readonly onCommit: (draft: string, opts?: CommitOptions) => void
  readonly onCancel: (opts?: CommitOptions) => void
}

export function ContenteditableCellEditor({
  ariaLabel,
  draft,
  setDraft,
  onCommit,
  onCancel,
  onKeyDown,
}: Props) {
  const formulaMode = draft.startsWith('=')
  const elementRef = useRef<HTMLSpanElement | null>(null)
  const handleRef = useRef<ContenteditableScalarEditHandle | null>(null)
  const completedRef = useRef(false)
  const initialDraftRef = useRef(draft)
  const initialAriaLabelRef = useRef(ariaLabel)
  const callbacksRef = useRef<EditorCallbacks>({ setDraft, onCommit, onCancel })

  useEffect(() => {
    callbacksRef.current = { setDraft, onCommit, onCancel }
  }, [onCancel, onCommit, setDraft])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    const handle = createContenteditableScalarEdit({
      ariaLabel: initialAriaLabelRef.current,
      element,
      initialSelection: { kind: 'end' },
      initialText: initialDraftRef.current,
      lineBreak: 'single-line',
      onDraftChange: (snapshot) => callbacksRef.current.setDraft(snapshot.text),
      onHistoryIntent: () => undefined,
      onCommit: (commit) => {
        if (completedRef.current) return
        completedRef.current = true
        callbacksRef.current.onCommit(commit.text, { restoreFocus: true })
      },
      onCancel: () => {
        if (completedRef.current) return
        completedRef.current = true
        callbacksRef.current.onCancel({ restoreFocus: true })
      },
    })
    handleRef.current = handle
    return () => {
      handleRef.current = null
      handle.destroy()
    }
  }, [])

  useEffect(() => {
    const handle = handleRef.current
    if (!handle) return
    const current = handle.snapshot().text
    if (current === draft) return
    handle.replaceText(0, current.length, draft)
  }, [draft])

  return (
    <span
      ref={elementRef}
      className={`cell-input${formulaMode ? ' formula-input' : ''}`}
      data-formula-editor={formulaMode || undefined}
      tabIndex={0}
      onBlur={() => {
        if (completedRef.current) return
        const text = handleRef.current?.snapshot().text ?? draft
        completedRef.current = true
        callbacksRef.current.onCommit(text)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (event.key === 'Backspace' || event.key === 'Delete') event.stopPropagation()
      }}
    />
  )
}
