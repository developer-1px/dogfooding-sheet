import { useEffect, useRef, useState } from 'react'
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
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [value, setValue] = useState(initial)
  useEffect(() => { if (open) setValue(initial) }, [open, initial])
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
        <label>{label}</label>
        <input
          ref={inputRef}
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
        />
        <div className="confirm-actions">
          <button onClick={onCancel}>취소</button>
          <button className="primary" onClick={submit}>{submitLabel}</button>
        </div>
      </div>
    </>
  )
}
