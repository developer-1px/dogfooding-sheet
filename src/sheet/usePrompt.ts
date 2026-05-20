import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import { createElement } from 'react'
import { PromptDialog } from './PromptDialog'

export interface PromptOptions {
  label: string
  initial?: string
  placeholder?: string
  submitLabel?: string
}

export type Ask = (opts: PromptOptions) => Promise<string | null>

interface State {
  id: number
  opts: PromptOptions
  resolve: (value: string | null) => void
}

export function usePrompt(): { ask: (opts: PromptOptions) => Promise<string | null>; dialog: ReactElement } {
  const [state, setState] = useState<State | null>(null)
  const nextId = useRef(0)
  const resolveRef = useRef<((value: string | null) => void) | null>(null)
  const close = useCallback((value: string | null) => {
    state?.resolve(value)
    setState(null)
  }, [state])
  const ask = useCallback((opts: PromptOptions) =>
    new Promise<string | null>((resolve) => {
      resolveRef.current?.(null)
      resolveRef.current = resolve
      setState({ id: nextId.current++, opts, resolve })
    }), [])
  useEffect(() => {
    if (state === null) resolveRef.current = null
  }, [state])
  useEffect(() => () => {
    resolveRef.current?.(null)
    resolveRef.current = null
  }, [])
  const dialog = createElement(PromptDialog, {
    key: state?.id ?? 'closed',
    open: state !== null,
    label: state?.opts.label ?? '',
    initial: state?.opts.initial,
    placeholder: state?.opts.placeholder,
    submitLabel: state?.opts.submitLabel,
    onSubmit: (v: string) => close(v),
    onCancel: () => close(null),
  })
  return { ask, dialog }
}
