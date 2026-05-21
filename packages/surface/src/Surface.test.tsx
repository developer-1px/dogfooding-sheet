import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import {
  EDITABLE_GRID_CONTRACT,
  EDITABLE_GRID_KIND,
  defineEditableGridSurface,
} from '@spredsheet/editable-grid/contract'
import {
  SURFACE_CONTRACT,
  Surface,
  defineSurface,
  validateSurface,
} from './index'

const lineGrid = defineEditableGridSurface({
  contract: EDITABLE_GRID_CONTRACT,
  kind: EDITABLE_GRID_KIND,
  schema: z.object({
    lines: z.array(z.object({
      name: z.string(),
      qty: z.number(),
    })),
  }),
  dataPath: '/lines',
  columns: [
    { id: 'name', path: '/name', label: 'Name' },
    { id: 'qty', path: '/qty', label: 'Qty' },
  ],
})

const invoiceSurface = defineSurface({
  contract: SURFACE_CONTRACT,
  schema: z.object({
    lines: z.array(z.object({
      name: z.string(),
      qty: z.number(),
    })),
  }),
  views: [
    { id: 'lines', kind: EDITABLE_GRID_KIND, grid: lineGrid },
  ],
})

const value = {
  lines: [
    { name: 'Apple', qty: 3 },
    { name: 'Bread', qty: 2 },
  ],
}

function setup(onChange = vi.fn(), onSelectionChange = vi.fn()) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  act(() => {
    root.render(createElement(Surface, {
      surface: invoiceSurface,
      value,
      onChange,
      onSelectionChange,
    }))
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
const setInputValue = (input: HTMLInputElement, next: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, next)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('Surface', () => {
  it('validates duplicate and unregistered descriptor views', () => {
    const invalid = defineSurface({
      contract: SURFACE_CONTRACT,
      schema: z.object({}),
      views: [
        { id: 'a', kind: 'missing-kind' },
        { id: 'a', kind: EDITABLE_GRID_KIND, grid: lineGrid },
      ],
    })

    expect(validateSurface(invalid)).toEqual([
      {
        code: 'unregistered-view-kind',
        message: 'No renderer registered for missing-kind',
        viewId: 'a',
        kind: 'missing-kind',
      },
      {
        code: 'duplicate-view-id',
        message: 'Duplicate view id a',
        viewId: 'a',
      },
    ])
  })

  it('renders a registered editable-grid view from a descriptor', () => {
    const { host, root } = setup()
    try {
      expect(document.querySelector('.surface')?.getAttribute('data-surface-contract')).toBe(SURFACE_CONTRACT)
      expect(document.querySelector('[data-surface-view="lines"]')).toBeDefined()
      expect(gridCells().map((cell) => cell.textContent)).toEqual(['Apple', '3', 'Bread', '2'])
    } finally {
      cleanup(root, host)
    }
  })

  it('tags child grid patches with the surface view id', () => {
    const { host, root, onChange } = setup()
    try {
      const [first] = gridCells()
      act(() => first.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))
      const input = document.querySelector<HTMLInputElement>('.editable-grid-input')
      expect(input?.value).toBe('Apple')

      act(() => setInputValue(input!, 'Apples'))
      act(() => keyDown(input!, 'Enter'))

      expect(onChange).toHaveBeenCalledWith({
        viewId: 'lines',
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

  it('routes child selection changes with the surface view id', () => {
    const { host, root, onSelectionChange } = setup()
    try {
      const [first] = gridCells()
      act(() => first.focus())
      act(() => keyDown(first, 'ArrowRight'))

      expect(onSelectionChange).toHaveBeenLastCalledWith({
        viewId: 'lines',
        selection: {
          focus: { rowIndex: 0, columnId: 'qty' },
          ranges: [{
            anchor: { rowIndex: 0, columnId: 'qty' },
            focus: { rowIndex: 0, columnId: 'qty' },
          }],
        },
      })
    } finally {
      cleanup(root, host)
    }
  })
})
