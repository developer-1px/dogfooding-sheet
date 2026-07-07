import type { StyleLookup } from './useStyles'

type Flag = 'b' | 'i' | 'u' | 's' | 'w' | 'bd'
const TOGGLES: Array<[Flag, string, string, React.ReactNode, string?, string?]> = [
  ['b', 'b', '굵게', <b key="b">B</b>, 'Control+B Meta+B', 'Ctrl/⌘+B'],
  ['i', 'i', '기울임', <i key="i">I</i>, 'Control+I Meta+I', 'Ctrl/⌘+I'],
  ['u', 'u', '밑줄', <u key="u">U</u>, 'Control+U Meta+U', 'Ctrl/⌘+U'],
  ['s', 's', '취소선', <s key="s">S</s>, 'Alt+Shift+5', 'Alt+Shift+5'],
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
      {TOGGLES.map(([k, , title, node, keyShortcuts, shortcutLabel]) => (
        <button type="button" key={k} onClick={() => toggle(k)} aria-pressed={!!(focusKey && styleOf(focusKey)?.[k])} title={shortcutLabel ? `${title} (${shortcutLabel})` : title} aria-label={title} aria-keyshortcuts={keyShortcuts}>{node}</button>
      ))}
    </>
  )
}
