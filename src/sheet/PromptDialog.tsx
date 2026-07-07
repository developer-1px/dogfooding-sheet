import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
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

const stopButtonActivationKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
  if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
}

export function PromptDialog({ open, label, placeholder, initial = '', submitLabel = '확인', onSubmit, onCancel }: Props) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [value, setValue] = useState(initial)
  useEffect(() => {
    if (open) setValue(initial)
  }, [initial, open])
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
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); submit() } }}
          aria-keyshortcuts="Enter"
        />
        <div className="confirm-actions">
          <button type="button" onClick={onCancel} onKeyDown={stopButtonActivationKeyDown} title="취소 (Esc)" aria-keyshortcuts="Escape">취소</button>
          <button type="button" className="primary" onClick={submit} onKeyDown={stopButtonActivationKeyDown} title={`${submitLabel} (Enter)`} aria-keyshortcuts="Enter">{submitLabel}</button>
        </div>
      </div>
    </>
  )
}
