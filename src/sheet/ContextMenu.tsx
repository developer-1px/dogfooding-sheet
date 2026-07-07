import { fromList, type UiEvent } from '@interactive-os/aria-kernel'
import { useMenuPattern } from '@interactive-os/aria-kernel/patterns'
import { runMenuItemAction, type MenuAction } from './contextMenuActions'

export interface MenuItem {
  label: string
  onClick: MenuAction
  disabled?: boolean
}

interface Props {
  x: number
  y: number
  label?: string
  items: Array<MenuItem | 'separator'>
  onClose: () => void
}

export function ContextMenu({ x, y, label = '셀 컨텍스트 메뉴', items, onClose }: Props) {
  const itemList = items.flatMap((it, i) =>
    it === 'separator' ? [] : [{ id: `m${i}`, label: it.label, disabled: it.disabled, action: it.onClick }],
  )
  const data = fromList(itemList.map(({ id, label, disabled }) => ({ id, label, disabled })))

  const onEvent = (e: UiEvent) => {
    if (e.type === 'activate' && e.id) {
      const item = itemList.find((it) => it.id === e.id)
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
        return (
          <button
            key={`m${i}`}
            {...patternProps}
            type="button"
            className="ctx-item"
            disabled={it.disabled}
            onClick={() => { runMenuItemAction(it.onClick); onClose() }}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
