import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initialSheet, type WriteCell } from './schema'
import { SHEET_STORAGE_KEY } from './storage'
import { useSheetDocument } from './useSheetDocument'

describe('useSheetDocument', () => {
  let host: HTMLDivElement
  let root: ReturnType<typeof createRoot> | null

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    localStorage.clear()
    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
  })

  afterEach(() => {
    if (root) act(() => root?.unmount())
    root = null
    host.remove()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('reads persisted sheet state only during hook initialization', () => {
    localStorage.setItem(SHEET_STORAGE_KEY, JSON.stringify({
      ...initialSheet,
      cells: { A1: 'Saved' },
    }))
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    let writeCell!: WriteCell

    function Harness() {
      const doc = useSheetDocument()
      writeCell = doc.writeCell
      return createElement('output', null, doc.sheet.cells.A1 ?? '')
    }

    act(() => root!.render(createElement(Harness)))
    expect(document.querySelector('output')?.textContent).toBe('Saved')

    act(() => writeCell('A1', 'Changed'))
    expect(document.querySelector('output')?.textContent).toBe('Changed')

    expect(getItem.mock.calls.filter(([key]) => key === SHEET_STORAGE_KEY)).toHaveLength(1)
  })

})
