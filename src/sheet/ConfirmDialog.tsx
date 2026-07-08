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
const dialogActionLabel = (dialogLabel: string, actionLabel: string): string =>
  dialogLabel === actionLabel ? actionLabel : `${dialogLabel}: ${actionLabel}`

export function ConfirmDialog({ open, message, confirmLabel = '확인', cancelLabel = '취소', onConfirm, onCancel }: Props) {
  const messageId = useId()
  const cancelRef = useRef<HTMLButtonElement | null>(null)
  const dialogLabel = confirmLabel === '확인' ? '확인' : `${confirmLabel} 확인`
  const { rootProps } = useAlertdialogPattern({
    open, label: dialogLabel,
    cancelRef,
    onOpenChange: (next) => { if (!next) onCancel() },
  })
  if (!open) return null
  const cancelActionLabel = dialogActionLabel(dialogLabel, cancelLabel)
  const confirmActionLabel = dialogActionLabel(dialogLabel, confirmLabel)
  return (
    <>
      <div className="dialog-backdrop" aria-hidden="true" onClick={onCancel} />
      <div {...rootProps} aria-describedby={messageId} className="confirm-dialog">
        <p id={messageId}>{message}</p>
        <div className="confirm-actions">
          <button type="button" ref={cancelRef} onClick={onCancel} onKeyDown={stopButtonActivationKeyDown} title={`${cancelActionLabel} (Esc)`} aria-label={cancelActionLabel} aria-keyshortcuts="Escape">{cancelLabel}</button>
          <button type="button" className="danger" onClick={onConfirm} onKeyDown={stopButtonActivationKeyDown} title={`${confirmActionLabel} (Enter)`} aria-label={confirmActionLabel} aria-keyshortcuts="Enter">{confirmLabel}</button>
        </div>
      </div>
    </>
  )
}
