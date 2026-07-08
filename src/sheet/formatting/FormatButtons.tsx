import type { Format } from './formatTypes'
import { stopToolbarActivationKeyDown } from '../toolbarKeyEvents'

const FORMATS: Array<[Format, string, string, string?, string?]> = [
  ['currency', '$', 'USD', 'Control+Shift+4 Meta+Shift+4', 'Ctrl/⌘+Shift+4'],
  ['eur', '€', 'EUR'],
  ['krw', '₩', 'KRW'],
  ['percent', '%', '백분율', 'Control+Shift+5 Meta+Shift+5', 'Ctrl/⌘+Shift+5'],
  ['integer', '.0', '정수'],
  ['thousand', '1,K', '1,000 천단위'],
  ['scientific', '1E', '과학 표기'],
  ['date', '📅', 'epoch → 날짜', 'Control+Shift+3 Meta+Shift+3', 'Ctrl/⌘+Shift+3'],
  ['time', '⏱', '시간'],
  ['plain', '123', '일반', 'Control+Shift+1 Meta+Shift+1', 'Ctrl/⌘+Shift+1'],
]

interface Props {
  apply: (f: Format) => void
  current: Format
  targetLabel: string
  disabled?: boolean
}

export function FormatButtons({ apply, current, targetLabel, disabled = false }: Props) {
  return (
    <>
      {FORMATS.map(([f, label, title, keyShortcuts, shortcutLabel]) => {
        const pressed = current === f
        const stateLabel = pressed ? '켜짐' : '꺼짐'
        const accessibleLabel = disabled ? `숫자 형식: ${title} 적용할 셀 없음` : `${targetLabel} 숫자 형식: ${title} ${stateLabel}`
        const titleLabel = disabled ? `${title} 적용할 셀 없음` : `${targetLabel} ${title} ${stateLabel}`
        const activeKeyShortcuts = disabled ? undefined : keyShortcuts
        const activeShortcutLabel = disabled ? undefined : shortcutLabel
        return (
          <button type="button" key={f} onKeyDown={stopToolbarActivationKeyDown} onClick={() => apply(f)} disabled={disabled} aria-pressed={pressed} title={activeShortcutLabel ? `${titleLabel} (${activeShortcutLabel})` : titleLabel} aria-label={accessibleLabel} aria-keyshortcuts={activeKeyShortcuts}>{label}</button>
        )
      })}
    </>
  )
}
