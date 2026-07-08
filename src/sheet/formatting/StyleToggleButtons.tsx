import type { StyleLookup } from './useStyles'
import { stopToolbarActivationKeyDown } from '../toolbarKeyEvents'

type Flag = 'b' | 'i' | 'u' | 's' | 'w' | 'bd'
const TOGGLES: Array<[Flag, string, string, React.ReactNode, string?, string?]> = [
  ['b', 'b', '굵게', <b key="b">B</b>, 'Control+B Meta+B', 'Ctrl/⌘+B'],
  ['i', 'i', '기울임', <i key="i">I</i>, 'Control+I Meta+I', 'Ctrl/⌘+I'],
  ['u', 'u', '밑줄', <u key="u">U</u>, 'Control+U Meta+U', 'Ctrl/⌘+U'],
  ['s', 's', '취소선', <s key="s">S</s>, 'Alt+Shift+5', 'Alt+Shift+5'],
  ['w', 'w', '텍스트 줄바꿈', '↵줄'],
  ['bd', 'bd', '셀 테두리', '▢'],
]

const DISABLED_TOGGLE_LABELS: Record<string, string> = {
  '굵게': '굵게 적용할 셀 없음',
  '기울임': '기울임 적용할 셀 없음',
  '밑줄': '밑줄 적용할 셀 없음',
  '취소선': '취소선 적용할 셀 없음',
  '텍스트 줄바꿈': '텍스트 줄바꿈할 셀 없음',
  '셀 테두리': '셀 테두리 설정할 셀 없음',
}

interface Props {
  toggle: (k: Flag) => void
  styleOf: StyleLookup
  focusKey: string | null
  targetLabel: string
  disabled?: boolean
}

export function StyleToggleButtons({ toggle, styleOf, focusKey, targetLabel, disabled = false }: Props) {
  return (
    <>
      {TOGGLES.map(([k, , title, node, keyShortcuts, shortcutLabel]) => {
        const pressed = !!(focusKey && styleOf(focusKey)?.[k])
        const label = disabled ? DISABLED_TOGGLE_LABELS[title] : `${targetLabel} ${title} ${pressed ? '켜짐' : '꺼짐'}`
        return (
          <button type="button" key={k} onKeyDown={stopToolbarActivationKeyDown} onClick={() => toggle(k)} disabled={disabled} aria-pressed={pressed} title={shortcutLabel ? `${label} (${shortcutLabel})` : label} aria-label={label} aria-keyshortcuts={keyShortcuts}>{node}</button>
        )
      })}
    </>
  )
}
