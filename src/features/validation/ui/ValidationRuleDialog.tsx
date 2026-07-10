import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { useDialogModalPattern } from '@interactive-os/aria-kernel/patterns'
import type { Rule, ValidationActions } from '../hooks/useValidation'
import {
  initialValidationEditorDraft,
  validationOptionsFromText,
  type ValidationEditorDraft,
  type ValidationEditorMode,
} from '../model/validationEditor'
import './validationRuleDialog.css'

interface Props extends ValidationActions {
  readonly open: boolean
  readonly targetLabel: string
  readonly targetKeys: readonly string[]
  readonly rules: Readonly<Record<string, Rule>>
  readonly onClose: () => void
}

interface OpenDialogProps extends Omit<Props, 'open' | 'rules'> {
  readonly initialDraft: ValidationEditorDraft
}

const modes: ReadonlyArray<{ value: Exclude<ValidationEditorMode, 'mixed'>; label: string }> = [
  { value: 'none', label: '없음' },
  { value: 'list', label: '드롭다운' },
  { value: 'checkbox', label: '체크박스' },
]

const stopButtonActivationKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
  if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
}

function OpenValidationRuleDialog({
  targetLabel,
  targetKeys,
  initialDraft,
  setListRule,
  setCheckboxRule,
  clearRule,
  onClose,
}: OpenDialogProps) {
  const optionsId = useId()
  const optionsErrorId = useId()
  const [mode, setMode] = useState<ValidationEditorMode>(initialDraft.mode)
  const [optionsText, setOptionsText] = useState(initialDraft.optionsText)
  const initialFocusRef = useRef<HTMLInputElement | null>(null)
  const dialogLabel = `${targetLabel} 데이터 유효성`
  const options = validationOptionsFromText(optionsText)
  const listInvalid = mode === 'list' && options.length === 0
  const canApply = mode !== 'mixed' && !listInvalid
  const initialMode = initialDraft.mode === 'mixed' ? 'list' : initialDraft.mode
  const { rootProps } = useDialogModalPattern({
    open: true,
    label: dialogLabel,
    initialFocusRef,
    onOpenChange: (next) => { if (!next) onClose() },
  })

  const apply = () => {
    if (!canApply) return
    const keys = [...targetKeys]
    if (mode === 'list') setListRule(keys, options)
    else if (mode === 'checkbox') setCheckboxRule(keys)
    else clearRule(keys)
    onClose()
  }

  return (
    <>
      <div className="dialog-backdrop" aria-hidden="true" onClick={onClose} />
      <div {...rootProps} className="prompt-dialog validation-rule-dialog">
        <h2>데이터 유효성</h2>
        <p className="validation-target">{targetLabel}</p>
        {mode === 'mixed' && (
          <p className="validation-mixed" role="status">선택 영역에 여러 검증 규칙이 있습니다.</p>
        )}
        <div className="validation-mode-picker" role="radiogroup" aria-label="검증 유형">
          {modes.map((item) => (
            <label key={item.value}>
              <input
                ref={item.value === initialMode ? initialFocusRef : undefined}
                type="radio"
                name="validation-mode"
                value={item.value}
                checked={mode === item.value}
                onChange={() => setMode(item.value)}
                onKeyDown={(event) => event.stopPropagation()}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
        {mode === 'list' && (
          <div className="validation-options-field">
            <label htmlFor={optionsId}>드롭다운 항목</label>
            <textarea
              id={optionsId}
              aria-label="드롭다운 항목"
              aria-invalid={listInvalid || undefined}
              aria-describedby={listInvalid ? optionsErrorId : undefined}
              value={optionsText}
              onChange={(event) => setOptionsText(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
              rows={6}
            />
            {listInvalid && <p id={optionsErrorId} className="validation-error">항목을 한 개 이상 입력하세요.</p>}
          </div>
        )}
        <div className="confirm-actions">
          <button
            type="button"
            onClick={onClose}
            onKeyDown={stopButtonActivationKeyDown}
            title={`${dialogLabel} 취소 (Esc)`}
            aria-label={`${dialogLabel} 취소`}
            aria-keyshortcuts="Escape"
          >취소</button>
          <button
            type="button"
            className="primary"
            onClick={apply}
            onKeyDown={stopButtonActivationKeyDown}
            disabled={!canApply}
            title={`${dialogLabel} 적용`}
            aria-label={`${dialogLabel} 적용`}
          >적용</button>
        </div>
      </div>
    </>
  )
}

export function ValidationRuleDialog({ open, targetKeys, rules, ...props }: Props) {
  if (!open) return null
  const initialDraft = initialValidationEditorDraft(targetKeys, rules)
  const signature = `${targetKeys.join('\u0000')}\u0001${initialDraft.mode}\u0001${initialDraft.optionsText}`
  return (
    <OpenValidationRuleDialog
      key={signature}
      {...props}
      targetKeys={targetKeys}
      initialDraft={initialDraft}
    />
  )
}
