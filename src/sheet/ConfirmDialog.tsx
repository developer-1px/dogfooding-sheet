import { useId, useRef, type KeyboardEvent } from 'react'
import { useAlertdialogPattern } from '@interactive-os/aria-kernel/patterns'

interface Props {
  open: boolean
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

const stopButtonActivationKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
  if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
}

export function ConfirmDialog({ open, message, confirmLabel = '확인', cancelLabel = '취소', onConfirm, onCancel }: Props) {
  const messageId = useId()
  const cancelRef = useRef<HTMLButtonElement | null>(null)
  const { rootProps } = useAlertdialogPattern({
    open, label: '확인',
    cancelRef,
    onOpenChange: (next) => { if (!next) onCancel() },
  })
  if (!open) return null
  return (
    <>
      <div className="dialog-backdrop" onClick={onCancel} />
      <div {...rootProps} aria-describedby={messageId} className="confirm-dialog">
        <p id={messageId}>{message}</p>
        <div className="confirm-actions">
          <button type="button" ref={cancelRef} onClick={onCancel} onKeyDown={stopButtonActivationKeyDown} title={`${cancelLabel} (Esc)`} aria-keyshortcuts="Escape">{cancelLabel}</button>
          <button type="button" className="danger" onClick={onConfirm} onKeyDown={stopButtonActivationKeyDown} title={confirmLabel}>{confirmLabel}</button>
        </div>
      </div>
    </>
  )
}
