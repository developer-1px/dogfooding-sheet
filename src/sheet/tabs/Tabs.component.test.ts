import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { blankBundle } from '../schema'
import { Tabs } from './Tabs'
import type { Confirm } from '../useConfirm'

const flush = () => Promise.resolve()

describe('Tabs component', () => {
  let host: HTMLDivElement
  let root: Root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
  })

  afterEach(() => {
    act(() => root.unmount())
    host.remove()
  })

  it('does not leak a rejected delete confirmation', async () => {
    const calls: string[] = []
    const confirm: Confirm = () => Promise.reject(new Error('closed'))

    act(() => root.render(createElement(Tabs, {
      state: {
        order: ['Sheet1', 'Sheet2'],
        active: 'Sheet1',
        saved: { Sheet2: blankBundle() },
        colors: {},
      },
      switchTab: (name) => calls.push(`switch:${name}`),
      addSheet: () => calls.push('add'),
      deleteSheet: (name) => calls.push(`delete:${name}`),
      renameSheet: (oldName, newName) => calls.push(`rename:${oldName}:${newName}`),
      duplicateSheet: (name) => calls.push(`duplicate:${name}`),
      setTabColor: (name, color) => calls.push(`color:${name}:${color}`),
      reorderTab: (from, to) => calls.push(`reorder:${from}:${to}`),
      confirm,
    })))

    const close = document.querySelector<HTMLButtonElement>('.tab-close')
    expect(close).not.toBeNull()
    act(() => close!.click())
    await flush()
    await flush()

    expect(calls).toEqual([])
  })
})
