import { useEffect, useRef } from 'react'
import { fromList, type UiEvent } from '@p/aria-kernel'
import { useMenuPattern } from '@p/aria-kernel/patterns'

export interface MenuItem {
  label: string
  onClick: () => void
  disabled?: boolean
}

interface Props {
  x: number
  y: number
  items: Array<MenuItem | 'separator'>
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)

  // Outside click closes (escape is handled by useMenuPattern.onEscape).
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [onClose])

  const itemList = items.flatMap((it, i) =>
    it === 'separator' ? [] : [{ id: `m${i}`, label: it.label, disabled: it.disabled, action: it.onClick }],
  )
  const data = fromList(itemList.map(({ id, label, disabled }) => ({ id, label, disabled })))

  const onEvent = (e: UiEvent) => {
    if (e.type === 'activate' && e.id) {
      const item = itemList.find((it) => it.id === e.id)
      item?.action?.()
      onClose()
    }
  }

  const { rootProps, menuitemProps } = useMenuPattern(data, onEvent, {
    label: '셀 컨텍스트 메뉴',
    autoFocus: true,
    defaultOpen: true,
    onEscape: onClose,
  })

  return (
    <div
      {...rootProps}
      ref={(el) => { ref.current = el; const r = (rootProps as { ref?: (e: HTMLDivElement | null) => void }).ref; if (typeof r === 'function') r(el) }}
      className="ctx-menu"
      style={{ left: x, top: y }}
    >
      {items.map((it, i) => {
        if (it === 'separator') return <div key={`s${i}`} className="ctx-sep" />
        return (
          <button
            key={`m${i}`}
            {...menuitemProps(`m${i}`)}
            className="ctx-item"
            disabled={it.disabled}
            onClick={() => { it.onClick(); onClose() }}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
