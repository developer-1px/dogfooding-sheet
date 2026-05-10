import type { Format } from './useFormats'

const FORMATS: Array<[Format, string, string]> = [
  ['currency', '$', 'USD'],
  ['eur', '€', 'EUR'],
  ['krw', '₩', 'KRW'],
  ['percent', '%', '백분율'],
  ['integer', '.0', '정수'],
  ['thousand', '1,K', '1,000 천단위'],
  ['scientific', '1E', '과학 표기'],
  ['date', '📅', 'epoch → 날짜'],
  ['plain', '123', '일반'],
]

export function FormatButtons({ apply }: { apply: (f: Format) => void }) {
  return (
    <>
      {FORMATS.map(([f, label, title]) => (
        <button key={f} onClick={() => apply(f)} title={title}>{label}</button>
      ))}
    </>
  )
}
