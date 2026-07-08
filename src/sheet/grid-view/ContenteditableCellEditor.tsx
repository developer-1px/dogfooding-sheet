import { useEffect, useRef } from 'react'
import {
  collapseInlineEditSelection,
  createContenteditableScalarEdit,
  inlineEditSelectionOffset,
  type ContenteditableScalarEditHandle,
} from 'nano-edit/inline-edit'
import type { FormulaReferenceTextDecoration } from '../selection/formulaReferenceDecorations'

interface CommitOptions {
  readonly restoreFocus?: boolean
}

interface Props {
  readonly ariaLabel: string
  readonly draft: string
  readonly setDraft: (draft: string) => void
  readonly textDecorations: readonly FormulaReferenceTextDecoration[]
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
  textDecorations,
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

  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    const signature = formulaMode
      ? `${draft}\n${textDecorations.map((decoration) => `${decoration.from}:${decoration.to}:${decoration.className}`).join('|')}`
      : draft
    if (element.dataset.formulaDecorationSignature === signature && element.textContent === draft) return

    const offset = inlineEditSelectionOffset(element)
    if (!formulaMode || textDecorations.length === 0) {
      if (element.childElementCount > 0 || element.textContent !== draft) element.textContent = draft
      element.dataset.formulaDecorationSignature = signature
      if (offset !== null && document.activeElement === element) collapseInlineEditSelection(element, Math.min(offset, draft.length))
      return
    }

    element.replaceChildren(decoratedFormulaText(draft, textDecorations))
    element.dataset.formulaDecorationSignature = signature
    if (offset !== null && document.activeElement === element) collapseInlineEditSelection(element, Math.min(offset, draft.length))
  }, [draft, formulaMode, textDecorations])

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
        event.stopPropagation()
      }}
    />
  )
}

function decoratedFormulaText(text: string, decorations: readonly FormulaReferenceTextDecoration[]): DocumentFragment {
  const fragment = document.createDocumentFragment()
  let offset = 0
  decorations
    .filter((decoration) => decoration.from >= 0 && decoration.to > decoration.from && decoration.to <= text.length)
    .sort((a, b) => a.from - b.from)
    .forEach((decoration) => {
      if (decoration.from < offset) return
      if (offset < decoration.from) fragment.append(document.createTextNode(text.slice(offset, decoration.from)))
      const token = document.createElement('span')
      token.className = `formula-token ${decoration.className}`
      token.dataset.formulaToken = decoration.token
      token.textContent = text.slice(decoration.from, decoration.to)
      fragment.append(token)
      offset = decoration.to
    })
  if (offset < text.length) fragment.append(document.createTextNode(text.slice(offset)))
  return fragment
}
