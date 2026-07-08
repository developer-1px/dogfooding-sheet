import { act, createElement, type KeyboardEventHandler } from 'react'
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
  profile: 'database-table',
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

const databaseSurface = defineEditableGridSurface({
  contract: EDITABLE_GRID_CONTRACT,
  kind: EDITABLE_GRID_KIND,
  profile: 'database-table',
  schema: z.object({
    records: z.array(z.object({
      title: z.string(),
      status: z.string(),
      done: z.boolean(),
      score: z.number(),
      summary: z.string(),
      aggregate: z.string(),
    })),
  }),
  dataPath: '/records',
  columns: [
    { id: 'title', path: '/title', label: 'Title', field: { type: 'text' } },
    {
      id: 'status',
      path: '/status',
      label: 'Status',
      field: {
        type: 'select',
        options: [
          { value: 'todo', label: 'Todo' },
          { value: 'done', label: 'Done' },
        ],
      },
    },
    { id: 'done', path: '/done', label: 'Done', field: { type: 'checkbox' } },
    { id: 'score', path: '/score', label: 'Score', field: { type: 'number' } },
    { id: 'summary', path: '/summary', label: 'Summary', field: { type: 'formula', formula: '=title' } },
    { id: 'aggregate', path: '/aggregate', label: 'Aggregate', field: { type: 'rollup' } },
  ],
})

const databaseValue = {
  records: [
    { title: 'Spec', status: 'todo', done: false, score: 3, summary: 'Spec / Todo', aggregate: '1 linked' },
  ],
}

function setup(onChange = vi.fn(), onSelectionChange = vi.fn(), onKeyDown?: KeyboardEventHandler<HTMLDivElement>) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  act(() => {
    const grid = createElement(EditableGrid, { surface, value, onChange, onSelectionChange })
    root.render(onKeyDown ? createElement('div', { onKeyDown }, grid) : grid)
  })
  return { host, root, onChange, onSelectionChange }
}

function setupDatabase(onChange = vi.fn(), onKeyDown?: KeyboardEventHandler<HTMLDivElement>, onSelectionChange = vi.fn()) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  act(() => {
    const grid = createElement(EditableGrid, { surface: databaseSurface, value: databaseValue, onChange, onSelectionChange })
    root.render(onKeyDown ? createElement('div', { onKeyDown }, grid) : grid)
  })
  return { host, root, onChange, onSelectionChange }
}

const cleanup = (root: Root, host: HTMLElement) => {
  act(() => root.unmount())
  host.remove()
}

const gridCells = () => [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')]
const expectFocusedGridCell = (cells: readonly HTMLElement[], focusedCell: HTMLElement) => {
  expect(document.activeElement).toBe(focusedCell)
  expect(cells.filter((cell) => cell.tabIndex === 0)).toEqual([focusedCell])
}
const keyDown = (target: HTMLElement, key: string) => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}
const setInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}
const setSelectValue = (select: HTMLSelectElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
  setter?.call(select, value)
  select.dispatchEvent(new Event('change', { bubbles: true }))
}

describe('EditableGrid', () => {
  it('renders a schema-described editable grid island', () => {
    const { host, root } = setup()
    try {
      expect(document.querySelector('[role="grid"]')?.getAttribute('aria-rowcount')).toBe('3')
      expect(document.querySelector('[role="grid"]')?.getAttribute('aria-colcount')).toBe('3')
      expect(document.querySelector('[role="grid"]')?.getAttribute('aria-label')).toBe('Editable grid')
      expect(document.querySelector('[role="grid"]')?.getAttribute('data-editable-grid-profile')).toBe('database-table')
      expect([...document.querySelectorAll('[role="row"]')].map((row) => row.getAttribute('aria-rowindex'))).toEqual(['1', '2', '3'])
      expect([...document.querySelectorAll('[role="columnheader"]')].map((cell) => cell.textContent)).toEqual(['Name', 'Qty', 'Total'])
      const cells = gridCells()
      const [nameCell, qtyCell, totalCell] = cells
      expect(cells.map((cell) => cell.textContent)).toEqual(['Apple', '3', '3.00', 'Bread', '2', '4.00'])
      expect(nameCell.getAttribute('aria-readonly')).toBeNull()
      expect(qtyCell.getAttribute('aria-readonly')).toBeNull()
      expect(totalCell.getAttribute('aria-readonly')).toBe('true')
    } finally {
      cleanup(root, host)
    }
  })

  it('allows host apps to provide a specific grid label', () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    act(() => {
      root.render(createElement(EditableGrid, {
        surface,
        value,
        onChange: vi.fn(),
        ariaLabel: 'Invoice line items',
      }))
    })
    try {
      expect(document.querySelector('[role="grid"]')?.getAttribute('aria-label')).toBe('Invoice line items')
      expect(document.querySelector('[role="grid"]')?.getAttribute('aria-rowcount')).toBe('3')
      expect(document.querySelector('[role="grid"]')?.getAttribute('aria-colcount')).toBe('3')
      expect(document.querySelector('[role="grid"]')?.getAttribute('data-editable-grid-profile')).toBe('database-table')
    } finally {
      cleanup(root, host)
    }
  })

  it('moves serializable selection and DOM focus with keyboard navigation', () => {
    const { host, root, onSelectionChange } = setup()
    try {
      const cells = gridCells()
      const [first, qtyCell] = cells
      act(() => first.focus())
      act(() => keyDown(first, 'ArrowRight'))

      expect(onSelectionChange).toHaveBeenLastCalledWith({
        focus: { rowIndex: 0, columnId: 'qty' },
        ranges: [{
          anchor: { rowIndex: 0, columnId: 'qty' },
          focus: { rowIndex: 0, columnId: 'qty' },
        }],
      })
      expectFocusedGridCell(cells, qtyCell)

      act(() => keyDown(qtyCell, 'ArrowDown'))
      expectFocusedGridCell(cells, cells[4])

      act(() => keyDown(cells[4], 'ArrowLeft'))
      expectFocusedGridCell(cells, cells[3])

      act(() => keyDown(cells[3], 'ArrowUp'))
      expectFocusedGridCell(cells, first)
    } finally {
      cleanup(root, host)
    }
  })

  it('keeps keyboard navigation at grid bounds without redundant selection changes', () => {
    const { host, root, onSelectionChange } = setup()
    try {
      const cells = gridCells()
      const [first] = cells
      act(() => first.focus())
      onSelectionChange.mockClear()

      act(() => keyDown(first, 'ArrowLeft'))
      act(() => keyDown(first, 'ArrowUp'))

      expect(onSelectionChange).not.toHaveBeenCalled()
      expectFocusedGridCell(cells, first)

      act(() => keyDown(first, 'ArrowRight'))
      const qtyCell = cells[1]
      expect(onSelectionChange).toHaveBeenCalledTimes(1)
      expectFocusedGridCell(cells, qtyCell)

      act(() => keyDown(qtyCell, 'ArrowRight'))
      const lastColumnCell = cells[2]
      act(() => keyDown(lastColumnCell, 'ArrowRight'))

      expect(onSelectionChange).toHaveBeenCalledTimes(2)
      expectFocusedGridCell(cells, lastColumnCell)

      act(() => keyDown(lastColumnCell, 'ArrowDown'))
      const lastCell = cells[5]
      act(() => keyDown(lastCell, 'ArrowDown'))
      act(() => keyDown(lastCell, 'ArrowRight'))

      expect(onSelectionChange).toHaveBeenCalledTimes(3)
      expectFocusedGridCell(cells, lastCell)
    } finally {
      cleanup(root, host)
    }
  })

  it('moves serializable selection and DOM focus with pointer selection', () => {
    const { host, root, onSelectionChange } = setup()
    try {
      const cells = gridCells()
      const qtyCell = cells[1]
      act(() => qtyCell.dispatchEvent(new MouseEvent('click', { bubbles: true })))

      expect(onSelectionChange).toHaveBeenLastCalledWith({
        focus: { rowIndex: 0, columnId: 'qty' },
        ranges: [{
          anchor: { rowIndex: 0, columnId: 'qty' },
          focus: { rowIndex: 0, columnId: 'qty' },
        }],
      })
      expectFocusedGridCell(cells, qtyCell)
    } finally {
      cleanup(root, host)
    }
  })

  it('restores DOM focus when pointer reselects the active cell', () => {
    const { host, root, onSelectionChange } = setup()
    const outsideButton = document.createElement('button')
    document.body.append(outsideButton)
    try {
      const cells = gridCells()
      const qtyCell = cells[1]
      act(() => qtyCell.dispatchEvent(new MouseEvent('click', { bubbles: true })))
      expectFocusedGridCell(cells, qtyCell)

      act(() => outsideButton.focus())
      expect(document.activeElement).not.toBe(qtyCell)
      onSelectionChange.mockClear()

      act(() => qtyCell.dispatchEvent(new MouseEvent('click', { bubbles: true })))

      expect(onSelectionChange).not.toHaveBeenCalled()
      expectFocusedGridCell(cells, qtyCell)
    } finally {
      outsideButton.remove()
      cleanup(root, host)
    }
  })

  it('emits grouped JSON Pointer patches when a cell edit commits', () => {
    const { host, root, onChange, onSelectionChange } = setup()
    try {
      const [first] = gridCells()
      act(() => first.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))
      const input = document.querySelector<HTMLInputElement>('.editable-grid-input')
      expect(input?.value).toBe('Apple')
      onSelectionChange.mockClear()

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
      expect(onSelectionChange).not.toHaveBeenCalled()
    } finally {
      cleanup(root, host)
    }
  })

  it('skips change patches for unchanged text edits while closing the editor', () => {
    const { host, root, onChange, onSelectionChange } = setup()
    try {
      const cells = gridCells()
      const [first] = cells
      act(() => first.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))
      const input = document.querySelector<HTMLInputElement>('.editable-grid-input')
      expect(input?.value).toBe('Apple')
      onSelectionChange.mockClear()

      act(() => keyDown(input!, 'Enter'))

      expect(onChange).not.toHaveBeenCalled()
      expect(onSelectionChange).not.toHaveBeenCalled()
      expect(document.querySelector<HTMLInputElement>('.editable-grid-input')).toBeNull()
      expectFocusedGridCell(cells, first)
    } finally {
      cleanup(root, host)
    }
  })

  it('skips change patches for unchanged number edits while closing the editor', () => {
    const { host, root, onChange, onSelectionChange } = setupDatabase()
    try {
      const cells = gridCells()
      const scoreCell = cells[3]
      act(() => scoreCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))
      const input = document.querySelector<HTMLInputElement>('input.editable-grid-input')
      expect(input?.type).toBe('number')
      expect(input?.value).toBe('3')
      onSelectionChange.mockClear()

      act(() => keyDown(input!, 'Enter'))

      expect(onChange).not.toHaveBeenCalled()
      expect(onSelectionChange).not.toHaveBeenCalled()
      expect(document.querySelector<HTMLInputElement>('input.editable-grid-input')).toBeNull()
      expectFocusedGridCell(cells, scoreCell)
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

  it('renders database-table select fields by option label and commits option values', () => {
    const { host, root, onChange } = setupDatabase()
    try {
      const statusCell = gridCells()[1]
      expect(statusCell.textContent).toBe('Todo')

      act(() => statusCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))
      const select = document.querySelector<HTMLSelectElement>('select.editable-grid-input')
      expect(select?.value).toBe('todo')

      act(() => setSelectValue(select!, 'done'))
      act(() => keyDown(select!, 'Enter'))

      expect(onChange).toHaveBeenCalledWith({
        patches: [{ op: 'replace', path: '/records/0/status', value: 'done' }],
        source: 'cell-edit',
        selection: {
          focus: { rowIndex: 0, columnId: 'status' },
          ranges: [{
            anchor: { rowIndex: 0, columnId: 'status' },
            focus: { rowIndex: 0, columnId: 'status' },
          }],
        },
      })
    } finally {
      cleanup(root, host)
    }
  })

  it('keeps text editor keys inside the inline editor while preserving Enter commit', () => {
    const parentKeys: string[] = []
    const { host, root, onChange } = setupDatabase(vi.fn(), (event) => parentKeys.push(event.key))
    try {
      const titleCell = gridCells()[0]
      act(() => titleCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))

      const input = document.querySelector<HTMLInputElement>('input.editable-grid-input')
      expect(input?.getAttribute('aria-label')).toBe('Title 편집')
      expect(input?.value).toBe('Spec')

      act(() => keyDown(input!, 'ArrowLeft'))
      act(() => keyDown(input!, 'S'))

      expect(parentKeys).toEqual([])
      expect(onChange).not.toHaveBeenCalled()

      act(() => setInputValue(input!, 'Spec v2'))
      act(() => keyDown(input!, 'Enter'))

      expect(parentKeys).toEqual([])
      expect(onChange).toHaveBeenCalledWith({
        patches: [{ op: 'replace', path: '/records/0/title', value: 'Spec v2' }],
        source: 'cell-edit',
        selection: {
          focus: { rowIndex: 0, columnId: 'title' },
          ranges: [{
            anchor: { rowIndex: 0, columnId: 'title' },
            focus: { rowIndex: 0, columnId: 'title' },
          }],
        },
      })
    } finally {
      cleanup(root, host)
    }
  })

  it('keeps select editor keys inside the inline editor while preserving Escape cancel', () => {
    const parentKeys: string[] = []
    const { host, root, onChange } = setupDatabase(vi.fn(), (event) => parentKeys.push(event.key))
    try {
      const statusCell = gridCells()[1]
      act(() => statusCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))

      const select = document.querySelector<HTMLSelectElement>('select.editable-grid-input')
      expect(select?.getAttribute('aria-label')).toBe('Status 편집')
      expect(select?.value).toBe('todo')

      act(() => keyDown(select!, 'ArrowDown'))
      act(() => keyDown(select!, 'd'))

      expect(parentKeys).toEqual([])
      expect(onChange).not.toHaveBeenCalled()

      act(() => setSelectValue(select!, 'done'))
      act(() => keyDown(select!, 'Escape'))

      expect(parentKeys).toEqual([])
      expect(onChange).not.toHaveBeenCalled()
      expect(document.querySelector<HTMLSelectElement>('select.editable-grid-input')).toBeNull()
    } finally {
      cleanup(root, host)
    }
  })

  it('commits checkbox and number fields with typed patch values', () => {
    const onSelectionChange = vi.fn()
    const { host, root, onChange } = setupDatabase(vi.fn(), undefined, onSelectionChange)
    try {
      const doneCell = gridCells()[2]
      const checkbox = doneCell.querySelector<HTMLInputElement>('input[type="checkbox"]')
      expect(checkbox?.checked).toBe(false)
      act(() => doneCell.dispatchEvent(new MouseEvent('click', { bubbles: true })))
      onSelectionChange.mockClear()

      act(() => checkbox!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
      expect(onChange).toHaveBeenCalledWith({
        patches: [{ op: 'replace', path: '/records/0/done', value: true }],
        source: 'cell-edit',
        selection: {
          focus: { rowIndex: 0, columnId: 'done' },
          ranges: [{
            anchor: { rowIndex: 0, columnId: 'done' },
            focus: { rowIndex: 0, columnId: 'done' },
          }],
        },
      })
      expect(onSelectionChange).not.toHaveBeenCalled()

      const scoreCell = gridCells()[3]
      act(() => scoreCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))
      const input = document.querySelector<HTMLInputElement>('input.editable-grid-input')
      expect(input?.type).toBe('number')
      act(() => setInputValue(input!, '5'))
      act(() => keyDown(input!, 'Enter'))

      expect(onChange).toHaveBeenCalledWith({
        patches: [{ op: 'replace', path: '/records/0/score', value: 5 }],
        source: 'cell-edit',
        selection: {
          focus: { rowIndex: 0, columnId: 'score' },
          ranges: [{
            anchor: { rowIndex: 0, columnId: 'score' },
            focus: { rowIndex: 0, columnId: 'score' },
          }],
        },
      })
    } finally {
      cleanup(root, host)
    }
  })

  it('toggles checkbox cells from gridcell keyboard activation', () => {
    const parentKeys: string[] = []
    const onSelectionChange = vi.fn()
    const { host, root, onChange } = setupDatabase(
      vi.fn(),
      (event) => parentKeys.push(event.key),
      onSelectionChange,
    )
    try {
      const cells = gridCells()
      const doneCell = cells[2]
      act(() => doneCell.focus())
      onSelectionChange.mockClear()

      act(() => keyDown(doneCell, ' '))

      expect(onSelectionChange).not.toHaveBeenCalled()
      expectFocusedGridCell(cells, doneCell)
      expect(onChange).toHaveBeenLastCalledWith({
        patches: [{ op: 'replace', path: '/records/0/done', value: true }],
        source: 'cell-edit',
        selection: {
          focus: { rowIndex: 0, columnId: 'done' },
          ranges: [{
            anchor: { rowIndex: 0, columnId: 'done' },
            focus: { rowIndex: 0, columnId: 'done' },
          }],
        },
      })
      expect(parentKeys).toEqual([])

      act(() => keyDown(doneCell, 'Enter'))

      expect(onSelectionChange).not.toHaveBeenCalled()
      expectFocusedGridCell(cells, doneCell)
      expect(onChange).toHaveBeenLastCalledWith({
        patches: [{ op: 'replace', path: '/records/0/done', value: true }],
        source: 'cell-edit',
        selection: {
          focus: { rowIndex: 0, columnId: 'done' },
          ranges: [{
            anchor: { rowIndex: 0, columnId: 'done' },
            focus: { rowIndex: 0, columnId: 'done' },
          }],
        },
      })
      expect(parentKeys).toEqual([])
    } finally {
      cleanup(root, host)
    }
  })

  it('keeps checkbox cell keys inside the checkbox control', () => {
    const parentKeys: string[] = []
    const onSelectionChange = vi.fn()
    const { host, root, onChange } = setupDatabase(
      vi.fn(),
      (event) => parentKeys.push(event.key),
      onSelectionChange,
    )
    try {
      const doneCell = gridCells()[2]
      const checkbox = doneCell.querySelector<HTMLInputElement>('input[type="checkbox"]')

      expect(checkbox?.getAttribute('aria-label')).toBe('Done')
      expect(checkbox?.disabled).toBe(false)
      expect(checkbox?.checked).toBe(false)

      act(() => keyDown(checkbox!, 'ArrowRight'))
      act(() => keyDown(checkbox!, ' '))

      expect(parentKeys).toEqual([])
      expect(onSelectionChange).not.toHaveBeenCalled()
      expect(onChange).not.toHaveBeenCalled()

      act(() => checkbox!.dispatchEvent(new MouseEvent('click', { bubbles: true })))

      expect(parentKeys).toEqual([])
      expect(onSelectionChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith({
        patches: [{ op: 'replace', path: '/records/0/done', value: true }],
        source: 'cell-edit',
        selection: {
          focus: { rowIndex: 0, columnId: 'done' },
          ranges: [{
            anchor: { rowIndex: 0, columnId: 'done' },
            focus: { rowIndex: 0, columnId: 'done' },
          }],
        },
      })
    } finally {
      cleanup(root, host)
    }
  })

  it('treats formula and rollup fields as readonly table fields', () => {
    const { host, root, onChange } = setupDatabase()
    try {
      const summaryCell = gridCells()[4]
      const aggregateCell = gridCells()[5]
      expect(summaryCell.getAttribute('aria-readonly')).toBe('true')
      expect(aggregateCell.getAttribute('aria-readonly')).toBe('true')

      act(() => summaryCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))
      act(() => aggregateCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))

      expect(document.querySelector('.editable-grid-input')).toBeNull()
      expect(onChange).not.toHaveBeenCalled()
    } finally {
      cleanup(root, host)
    }
  })
})
