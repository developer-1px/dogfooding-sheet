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

  it('delegates checkbox value cycling to zod-crud for existing cells', () => {
    let doc!: ReturnType<typeof useSheetDocument>

    function Harness() {
      doc = useSheetDocument()
      return createElement('output', null, doc.sheet.cells.A1 ?? '')
    }

    act(() => root!.render(createElement(Harness)))

    act(() => doc.writeCell('A1', 'FALSE'))
    expect(document.querySelector('output')?.textContent).toBe('FALSE')

    act(() => { expect(doc.toggleCheckboxCell('A1')).toBe(true) })
    expect(document.querySelector('output')?.textContent).toBe('TRUE')

    act(() => { expect(doc.toggleCheckboxCell('A1')).toBe(true) })
    expect(document.querySelector('output')?.textContent).toBe('FALSE')
  })

  it('delegates sparse checkbox creation to zod-crud defaults', () => {
    let doc!: ReturnType<typeof useSheetDocument>

    function Harness() {
      doc = useSheetDocument()
      return createElement('output', null, doc.sheet.cells.E5 ?? '')
    }

    act(() => root!.render(createElement(Harness)))

    act(() => { expect(doc.toggleCheckboxCell('E5')).toBe(true) })
    expect(document.querySelector('output')?.textContent).toBe('TRUE')
  })

  it('delegates fill handle series application to zod-crud grid-range', () => {
    let doc!: ReturnType<typeof useSheetDocument>

    function Harness() {
      doc = useSheetDocument()
      return createElement('output', null, JSON.stringify(doc.sheet.cells))
    }

    act(() => root!.render(createElement(Harness)))

    act(() => {
      doc.writeCell('A1', '1')
      doc.writeCell('A2', '2')
    })
    act(() => {
      expect(doc.fillCellRange(
        { rMin: 0, rMax: 1, cMin: 0, cMax: 0 },
        { rMin: 0, rMax: 4, cMin: 0, cMax: 0 },
      )).toBe(true)
    })

    expect(doc.sheet.cells.A3).toBe('3')
    expect(doc.sheet.cells.A4).toBe('4')
    expect(doc.sheet.cells.A5).toBe('5')
  })

  it('delegates rightward fill handle series application to zod-crud grid-range', () => {
    let doc!: ReturnType<typeof useSheetDocument>

    function Harness() {
      doc = useSheetDocument()
      return createElement('output', null, JSON.stringify(doc.sheet.cells))
    }

    act(() => root!.render(createElement(Harness)))

    act(() => {
      doc.writeCell('A1', '10')
      doc.writeCell('B1', '20')
    })
    act(() => {
      expect(doc.fillCellRange(
        { rMin: 0, rMax: 0, cMin: 0, cMax: 1 },
        { rMin: 0, rMax: 0, cMin: 0, cMax: 3 },
      )).toBe(true)
    })

    expect(doc.sheet.cells.C1).toBe('30')
    expect(doc.sheet.cells.D1).toBe('40')
  })

})
