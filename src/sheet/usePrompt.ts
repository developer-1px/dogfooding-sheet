import { useState, type ReactElement } from 'react'
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
  opts: PromptOptions
  resolve: (value: string | null) => void
}

export function usePrompt(): { ask: (opts: PromptOptions) => Promise<string | null>; dialog: ReactElement } {
  const [state, setState] = useState<State | null>(null)
  const close = (value: string | null) => {
    state?.resolve(value)
    setState(null)
  }
  const ask = (opts: PromptOptions) =>
    new Promise<string | null>((resolve) => setState({ opts, resolve }))
  const dialog = createElement(PromptDialog, {
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
