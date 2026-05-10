import { useEffect, useRef } from 'react'

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

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div ref={ref} className="ctx-menu" style={{ left: x, top: y }} role="menu">
      {items.map((it, i) => it === 'separator' ? (
        <div key={i} className="ctx-sep" />
      ) : (
        <button
          key={i}
          className="ctx-item"
          disabled={it.disabled}
          onClick={() => { it.onClick(); onClose() }}
          role="menuitem"
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}
