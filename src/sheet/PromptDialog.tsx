import { useId, useRef, useState } from 'react'
import { useDialogModalPattern } from '@interactive-os/aria-kernel/patterns'

interface Props {
  open: boolean
  label: string
  placeholder?: string
  initial?: string
  submitLabel?: string
  onSubmit: (value: string) => void
  onCancel: () => void
}

export function PromptDialog({ open, label, placeholder, initial = '', submitLabel = '확인', onSubmit, onCancel }: Props) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [value, setValue] = useState(initial)
  const { rootProps } = useDialogModalPattern({
    open, label,
    initialFocusRef: inputRef,
    onOpenChange: (next) => { if (!next) onCancel() },
  })
  if (!open) return null
  const submit = () => onSubmit(value)
  return (
    <>
      <div className="dialog-backdrop" onClick={onCancel} />
      <div {...rootProps} className="prompt-dialog">
        <label htmlFor={inputId}>{label}</label>
        <input
          id={inputId}
          ref={inputRef}
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
          aria-keyshortcuts="Enter"
        />
        <div className="confirm-actions">
          <button type="button" onClick={onCancel} aria-keyshortcuts="Escape">취소</button>
          <button type="button" className="primary" onClick={submit}>{submitLabel}</button>
        </div>
      </div>
    </>
  )
}
