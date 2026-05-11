import type { CellStyle, StyleLookup } from './useStyles'

type Flag = 'b' | 'i' | 'u' | 's' | 'w' | 'bd'
const TOGGLES: Array<[Flag, string, string, React.ReactNode]> = [
  ['b', 'b', '굵게', <b key="b">B</b>],
  ['i', 'i', '기울임', <i key="i">I</i>],
  ['u', 'u', '밑줄', <u key="u">U</u>],
  ['s', 's', '취소선', <s key="s">S</s>],
  ['w', 'w', '텍스트 줄바꿈', '↵줄'],
  ['bd', 'bd', '셀 테두리', '▢'],
]

interface Props {
  toggle: (k: Flag) => void
  styleOf: StyleLookup
  focusKey: string | null
}

export function StyleToggleButtons({ toggle, styleOf, focusKey }: Props) {
  return (
    <>
      {TOGGLES.map(([k, , title, node]) => (
        <button key={k} onClick={() => toggle(k)} aria-pressed={!!(focusKey && styleOf(focusKey)?.[k])} title={title}>{node}</button>
      ))}
    </>
  )
}
