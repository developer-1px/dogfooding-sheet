import type { Format } from './formatTypes'

const FORMATS: Array<[Format, string, string]> = [
  ['currency', '$', 'USD'],
  ['eur', '€', 'EUR'],
  ['krw', '₩', 'KRW'],
  ['percent', '%', '백분율'],
  ['integer', '.0', '정수'],
  ['thousand', '1,K', '1,000 천단위'],
  ['scientific', '1E', '과학 표기'],
  ['date', '📅', 'epoch → 날짜'],
  ['time', '⏱', '시간'],
  ['plain', '123', '일반'],
]

export function FormatButtons({ apply, current }: { apply: (f: Format) => void; current: Format }) {
  return (
    <>
      {FORMATS.map(([f, label, title]) => (
        <button key={f} onClick={() => apply(f)} aria-pressed={current === f} title={title} aria-label={`숫자 형식: ${title}`}>{label}</button>
      ))}
    </>
  )
}
