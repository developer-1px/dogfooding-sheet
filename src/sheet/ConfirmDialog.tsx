import { useRef } from 'react'
import { useAlertDialogPattern } from '@p/aria-kernel/patterns'

interface Props {
  open: boolean
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, message, confirmLabel = '확인', cancelLabel = '취소', onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement | null>(null)
  const { rootProps } = useAlertDialogPattern({
    open, label: '확인',
    cancelRef,
    onOpenChange: (next) => { if (!next) onCancel() },
  })
  if (!open) return null
  return (
    <>
      <div className="dialog-backdrop" onClick={onCancel} />
      <div {...rootProps} className="confirm-dialog">
        <p>{message}</p>
        <div className="confirm-actions">
          <button ref={cancelRef} onClick={onCancel}>{cancelLabel}</button>
          <button className="danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </>
  )
}
