import { useState, type ReactElement } from 'react'
import { createElement } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

export interface ConfirmOptions {
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

interface State {
  opts: ConfirmOptions
  resolve: (ok: boolean) => void
}

export function useConfirm(): { confirm: (opts: ConfirmOptions) => Promise<boolean>; dialog: ReactElement } {
  const [state, setState] = useState<State | null>(null)
  const close = (ok: boolean) => {
    state?.resolve(ok)
    setState(null)
  }
  const confirm = (opts: ConfirmOptions) =>
    new Promise<boolean>((resolve) => setState({ opts, resolve }))
  const dialog = createElement(ConfirmDialog, {
    open: state !== null,
    message: state?.opts.message ?? '',
    confirmLabel: state?.opts.confirmLabel,
    cancelLabel: state?.opts.cancelLabel,
    onConfirm: () => close(true),
    onCancel: () => close(false),
  })
  return { confirm, dialog }
}
