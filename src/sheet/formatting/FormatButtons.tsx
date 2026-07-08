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

export function FormatButtons({ apply, current, disabled = false }: { apply: (f: Format) => void; current: Format; disabled?: boolean }) {
  return (
    <>
      {FORMATS.map(([f, label, title, keyShortcuts, shortcutLabel]) => {
        const accessibleLabel = disabled ? `숫자 형식: ${title} 적용할 셀 없음` : `숫자 형식: ${title}`
        const titleLabel = disabled ? `${title} 적용할 셀 없음` : title
        return (
          <button type="button" key={f} onKeyDown={stopToolbarActivationKeyDown} onClick={() => apply(f)} disabled={disabled} aria-pressed={current === f} title={shortcutLabel ? `${titleLabel} (${shortcutLabel})` : titleLabel} aria-label={accessibleLabel} aria-keyshortcuts={keyShortcuts}>{label}</button>
        )
      })}
    </>
  )
}
