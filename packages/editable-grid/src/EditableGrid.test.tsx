import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { EDITABLE_GRID_CONTRACT, EDITABLE_GRID_KIND, defineEditableGridSurface } from './contract'
import { EditableGrid } from './EditableGrid'

const surface = defineEditableGridSurface({
  contract: EDITABLE_GRID_CONTRACT,
  kind: EDITABLE_GRID_KIND,
  schema: z.object({
    lines: z.array(z.object({
      name: z.string(),
      qty: z.number(),
      total: z.string().optional(),
    })),
  }),
  dataPath: '/lines',
  columns: [
    { id: 'name', path: '/name', label: 'Name' },
    { id: 'qty', path: '/qty', label: 'Qty' },
    { id: 'total', path: '/total', label: 'Total', readonly: true },
  ],
  capabilities: ['cell-edit', 'selection', 'keyboard', 'validation', 'patch-output'],
})

const value = {
  lines: [
    { name: 'Apple', qty: 3, total: '3.00' },
    { name: 'Bread', qty: 2, total: '4.00' },
  ],
}

function setup(onChange = vi.fn(), onSelectionChange = vi.fn()) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  act(() => {
    root.render(createElement(EditableGrid, { surface, value, onChange, onSelectionChange }))
  })
  return { host, root, onChange, onSelectionChange }
}

const cleanup = (root: Root, host: HTMLElement) => {
  act(() => root.unmount())
  host.remove()
}

const gridCells = () => [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')]
const keyDown = (target: HTMLElement, key: string) => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}
const setInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('EditableGrid', () => {
  it('renders a schema-described editable grid island', () => {
    const { host, root } = setup()
    try {
      expect(document.querySelector('[role="grid"]')?.getAttribute('aria-rowcount')).toBe('3')
      expect(document.querySelector('[role="grid"]')?.getAttribute('aria-colcount')).toBe('3')
      expect([...document.querySelectorAll('[role="columnheader"]')].map((cell) => cell.textContent)).toEqual(['Name', 'Qty', 'Total'])
      expect(gridCells().map((cell) => cell.textContent)).toEqual(['Apple', '3', '3.00', 'Bread', '2', '4.00'])
    } finally {
      cleanup(root, host)
    }
  })

  it('moves serializable selection with keyboard navigation', () => {
    const { host, root, onSelectionChange } = setup()
    try {
      const [first] = gridCells()
      act(() => first.focus())
      act(() => keyDown(first, 'ArrowRight'))

      expect(onSelectionChange).toHaveBeenLastCalledWith({
        focus: { rowIndex: 0, columnId: 'qty' },
        ranges: [{
          anchor: { rowIndex: 0, columnId: 'qty' },
          focus: { rowIndex: 0, columnId: 'qty' },
        }],
      })
    } finally {
      cleanup(root, host)
    }
  })

  it('emits grouped JSON Pointer patches when a cell edit commits', () => {
    const { host, root, onChange } = setup()
    try {
      const [first] = gridCells()
      act(() => first.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))
      const input = document.querySelector<HTMLInputElement>('.editable-grid-input')
      expect(input?.value).toBe('Apple')

      act(() => {
        setInputValue(input!, 'Apples')
      })
      act(() => keyDown(input!, 'Enter'))

      expect(onChange).toHaveBeenCalledWith({
        patches: [{ op: 'replace', path: '/lines/0/name', value: 'Apples' }],
        source: 'cell-edit',
        selection: {
          focus: { rowIndex: 0, columnId: 'name' },
          ranges: [{
            anchor: { rowIndex: 0, columnId: 'name' },
            focus: { rowIndex: 0, columnId: 'name' },
          }],
        },
      })
    } finally {
      cleanup(root, host)
    }
  })

  it('does not start edits for readonly columns', () => {
    const { host, root, onChange } = setup()
    try {
      const totalCell = gridCells()[2]
      act(() => totalCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))

      expect(document.querySelector('.editable-grid-input')).toBeNull()
      expect(onChange).not.toHaveBeenCalled()
    } finally {
      cleanup(root, host)
    }
  })
})
