import { fromList, type UiEvent } from '@interactive-os/aria-kernel'
import { useMenuPattern } from '@interactive-os/aria-kernel/patterns'
import type { KeyboardEvent } from 'react'
import { runMenuItemAction, type MenuAction } from './contextMenuActions'

export interface MenuItem {
  label: string
  onClick: MenuAction
  disabled?: boolean
  disabledLabel?: string
  keyShortcuts?: string
}

interface Props {
  x: number
  y: number
  label?: string
  items: Array<MenuItem | 'separator'>
  onClose: () => void
}

const isActivationKey = (key: string): boolean => key === 'Enter' || key === ' '

const keepActivationKeysLocal = <T extends { onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void }>(props: T) => ({
  ...props,
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
    props.onKeyDown?.(event)
    if (isActivationKey(event.key)) event.stopPropagation()
  },
})

export function ContextMenu({ x, y, label = '셀 컨텍스트 메뉴', items, onClose }: Props) {
  const itemList = items.flatMap((it, i) =>
    it === 'separator' ? [] : [{ id: `m${i}`, label: it.label, disabled: it.disabled, action: it.onClick }],
  )
  const data = fromList(itemList.map(({ id, label, disabled }) => ({ id, label, disabled })))

  const onEvent = (e: UiEvent) => {
    if (e.type === 'activate' && e.id) {
      const item = itemList.find((it) => it.id === e.id)
      if (!item || item.disabled) return
      runMenuItemAction(item?.action)
      onClose()
    }
  }

  const { rootProps, menuitemProps } = useMenuPattern(data, onEvent, {
    label,
    autoFocus: true,
    defaultOpen: true,
    onEscape: onClose,
    onInteractOutside: onClose,
  })

  return (
    <div
      {...rootProps}
      className="ctx-menu"
      style={{ left: x, top: y }}
    >
      {items.map((it, i) => {
        if (it === 'separator') return <div key={`s${i}`} className="ctx-sep" role="separator" />
        const patternProps = it.disabled
          ? { role: 'menuitem' as const, 'aria-disabled': true, tabIndex: -1 }
          : menuitemProps(`m${i}`)
        const onClick = () => {
          if (it.disabled) return
          runMenuItemAction(it.onClick)
          onClose()
        }
        const itemLabel = it.disabled ? it.disabledLabel ?? `${it.label} 사용할 수 없음` : it.label
        const keyShortcuts = it.disabled ? undefined : it.keyShortcuts
        return (
          <button
            key={`m${i}`}
            {...keepActivationKeysLocal(patternProps)}
            type="button"
            className="ctx-item"
            disabled={it.disabled}
            title={itemLabel}
            aria-label={itemLabel}
            aria-keyshortcuts={keyShortcuts}
            onClick={onClick}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
