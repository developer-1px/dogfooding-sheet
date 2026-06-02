import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cellId } from '../schema'
import { useAutoFill } from './useAutoFill'

describe('useAutoFill', () => {
  let host: HTMLDivElement
  let root: ReturnType<typeof createRoot> | null
  let restoreWindowListeners: (() => void) | null

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
    restoreWindowListeners = null
  })

  afterEach(() => {
    if (root) act(() => root?.unmount())
    root = null
    host.remove()
    restoreWindowListeners?.()
  })

  it('removes the pending mouseup listener when unmounted mid-drag', () => {
    const activeMouseup = new Set<EventListenerOrEventListenerObject>()
    const originalAdd = window.addEventListener.bind(window)
    const originalRemove = window.removeEventListener.bind(window)
    const add = vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
      if (type === 'mouseup') activeMouseup.add(listener)
      return originalAdd(type, listener, options)
    })
    const remove = vi.spyOn(window, 'removeEventListener').mockImplementation((type, listener, options) => {
      if (type === 'mouseup') activeMouseup.delete(listener)
      return originalRemove(type, listener, options)
    })
    restoreWindowListeners = () => {
      add.mockRestore()
      remove.mockRestore()
    }

    function Harness() {
      const fill = useAutoFill({
        selectedIds: [],
        focusId: cellId('A', 0),
        fillCellRange: () => { throw new Error('fillCellRange should not run') },
        setSelectedIds: () => {},
        rowCount: 3,
        colLetters: ['A'],
      })
      return createElement('button', { onMouseDown: fill.onHandleMouseDown }, 'fill')
    }

    act(() => root!.render(createElement(Harness)))
    const button = document.querySelector('button')
    expect(button).not.toBeNull()

    act(() => {
      button!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })
    expect(activeMouseup.size).toBe(1)

    act(() => {
      root!.unmount()
      root = null
    })

    expect(activeMouseup.size).toBe(0)
  })

  it('does not move the selection when fill writes fail', () => {
    const selected: string[][] = []

    function Harness() {
      const fill = useAutoFill({
        selectedIds: [],
        focusId: cellId('A', 0),
        fillCellRange: () => false,
        setSelectedIds: (ids) => { selected.push(ids) },
        rowCount: 3,
        colLetters: ['A'],
      })
      return createElement('div', null,
        createElement('button', { className: 'handle', onMouseDown: fill.onHandleMouseDown }, 'fill'),
        createElement('button', { className: 'target', onMouseEnter: () => fill.onCellEnterDuringFill(cellId('A', 1)) }, 'target'),
      )
    }

    act(() => root!.render(createElement(Harness)))
    const handle = document.querySelector<HTMLButtonElement>('.handle')
    const target = document.querySelector<HTMLButtonElement>('.target')
    expect(handle).not.toBeNull()
    expect(target).not.toBeNull()

    act(() => {
      handle!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      target!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    })

    expect(selected).toEqual([])
  })
})
