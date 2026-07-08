import { fromList, type UiEvent } from '@interactive-os/aria-kernel'
import { useMenuPattern } from '@interactive-os/aria-kernel/patterns'
import type { CSSProperties, KeyboardEvent } from 'react'
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

const contextMenuStyle = (x: number, y: number): CSSProperties => {
  const left = Math.max(0, x)
  const top = Math.max(0, y)
  return {
    left: `max(var(--sheet-space-1, 4px), min(${left}px, calc(100vw - 180px - var(--sheet-space-8, 24px))))`,
    top: `max(var(--sheet-space-1, 4px), min(${top}px, calc(100vh - var(--sheet-space-8, 24px))))`,
    maxWidth: `max(180px, calc(100vw - ${left}px - var(--sheet-space-8, 24px)))`,
    maxHeight: `max(var(--sheet-space-8, 24px), calc(100vh - ${top}px - var(--sheet-space-8, 24px)))`,
  }
}

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
      style={contextMenuStyle(x, y)}
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
        const visibleLabel = it.disabled && it.keyShortcuts ? it.label.replace(/\s+\([^)]*\)$/, '') : it.label
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
            {visibleLabel}
          </button>
        )
      })}
    </div>
  )
}
