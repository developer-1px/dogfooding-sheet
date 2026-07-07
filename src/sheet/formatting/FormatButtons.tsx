import type { Format } from './formatTypes'

const FORMATS: Array<[Format, string, string, string?]> = [
  ['currency', '$', 'USD', 'Control+Shift+4 Meta+Shift+4'],
  ['eur', '€', 'EUR'],
  ['krw', '₩', 'KRW'],
  ['percent', '%', '백분율', 'Control+Shift+5 Meta+Shift+5'],
  ['integer', '.0', '정수'],
  ['thousand', '1,K', '1,000 천단위'],
  ['scientific', '1E', '과학 표기'],
  ['date', '📅', 'epoch → 날짜', 'Control+Shift+3 Meta+Shift+3'],
  ['time', '⏱', '시간'],
  ['plain', '123', '일반', 'Control+Shift+1 Meta+Shift+1'],
]

export function FormatButtons({ apply, current }: { apply: (f: Format) => void; current: Format }) {
  return (
    <>
      {FORMATS.map(([f, label, title, keyShortcuts]) => (
        <button type="button" key={f} onClick={() => apply(f)} aria-pressed={current === f} title={title} aria-label={`숫자 형식: ${title}`} aria-keyshortcuts={keyShortcuts}>{label}</button>
      ))}
    </>
  )
}
