import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import { createElement } from 'react'
import type { Confirm, ConfirmOptions } from '../../../shared/ports/dialog'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface State {
  opts: ConfirmOptions
  resolve: (ok: boolean) => void
}

export function useConfirm(): { confirm: Confirm; dialog: ReactElement } {
  const [state, setState] = useState<State | null>(null)
  const resolveRef = useRef<((ok: boolean) => void) | null>(null)
  const close = useCallback((ok: boolean) => {
    state?.resolve(ok)
    setState(null)
  }, [state])
  const confirm = useCallback((opts: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      resolveRef.current?.(false)
      resolveRef.current = resolve
      setState({ opts, resolve })
    }), [])
  useEffect(() => {
    if (state === null) resolveRef.current = null
  }, [state])
  useEffect(() => () => {
    resolveRef.current?.(false)
    resolveRef.current = null
  }, [])
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
