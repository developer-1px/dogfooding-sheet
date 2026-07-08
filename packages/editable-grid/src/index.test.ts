import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  EDITABLE_GRID_CONTRACT,
  EDITABLE_GRID_KIND,
  defineEditableGridSurface,
  editableGridCellPath,
  editableGridProfileOf,
  editableGridRows,
  escapeJsonPointerSegment,
  joinJsonPointer,
  readJsonPointer,
  classifyCellContent,
  createCellDisplayModel,
  isErrorLabel,
  COLUMN_WIDTH_BOUNDS,
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_ROW_HEIGHT,
  ROW_HEIGHT_BOUNDS,
  clampResizeValue,
  resizeValueForKey,
  storedResizeValue,
  useEditableGridDomFocus,
} from './index'

describe('editable grid contract', () => {
  it('keeps the public descriptor identity explicit', () => {
    const surface = defineEditableGridSurface({
      contract: EDITABLE_GRID_CONTRACT,
      kind: EDITABLE_GRID_KIND,
      schema: z.array(z.object({ name: z.string() })),
      dataPath: '/lines',
      columns: [{ id: 'name', path: '/name' }],
      capabilities: ['cell-edit', 'selection', 'patch-output'],
    })

    expect(surface.contract).toBe('interactive-os.editable-grid.v1')
    expect(surface.kind).toBe('editable-grid')
    expect(editableGridProfileOf(surface)).toBe('record-table')
    expect(surface.columns[0]?.path).toBe('/name')
    expect(typeof useEditableGridDomFocus).toBe('function')
  })

  it('captures database and document table field intent without changing the renderer contract', () => {
    const database = defineEditableGridSurface({
      contract: EDITABLE_GRID_CONTRACT,
      kind: EDITABLE_GRID_KIND,
      profile: 'database-table',
      schema: z.array(z.object({ status: z.string(), owner: z.string() })),
      dataPath: '/records',
      columns: [
        {
          id: 'status',
          path: '/status',
          field: {
            type: 'select',
            options: [
              { value: 'todo', label: 'Todo' },
              { value: 'done', label: 'Done' },
            ],
          },
        },
        { id: 'owner', path: '/owner', field: { type: 'person' } },
      ],
    })
    const documentTable = defineEditableGridSurface({
      contract: EDITABLE_GRID_CONTRACT,
      kind: EDITABLE_GRID_KIND,
      profile: 'document-table',
      schema: z.array(z.object({ title: z.string() })),
      dataPath: '/blocks',
      columns: [{ id: 'title', path: '/title', field: { type: 'text' } }],
    })

    expect(editableGridProfileOf(database)).toBe('database-table')
    expect(database.columns[0]?.field?.type).toBe('select')
    expect(database.columns[0]?.field?.options?.[1]?.value).toBe('done')
    expect(editableGridProfileOf(documentTable)).toBe('document-table')
  })

  it('uses RFC 6901 JSON Pointer paths for patch output', () => {
    expect(escapeJsonPointerSegment('a/b~c')).toBe('a~1b~0c')
    expect(joinJsonPointer('lines', 0, 'a/b~c')).toBe('/lines/0/a~1b~0c')
    expect(editableGridCellPath('/lines', 2, '/price')).toBe('/lines/2/price')
    expect(editableGridCellPath('', 0, '/name')).toBe('/0/name')
  })

  it('reads row and cell values through JSON Pointer', () => {
    const value = { lines: [{ name: 'A' }, { name: 'B/C', '~meta': true }] }
    expect(editableGridRows(value, '/lines')).toEqual([{ name: 'A' }, { name: 'B/C', '~meta': true }])
    expect(readJsonPointer(value, '/lines/1/name')).toBe('B/C')
    expect(readJsonPointer(value, '/lines/1/~0meta')).toBe(true)
    expect(editableGridRows(value, '/missing')).toEqual([])
  })
})

describe('resize rules', () => {
  it('clamps and stores reusable grid resize values', () => {
    expect(clampResizeValue(1, COLUMN_WIDTH_BOUNDS)).toBe(40)
    expect(clampResizeValue(999, COLUMN_WIDTH_BOUNDS)).toBe(400)
    expect(clampResizeValue(1, ROW_HEIGHT_BOUNDS)).toBe(18)
    expect(clampResizeValue(999, ROW_HEIGHT_BOUNDS)).toBe(999)
    expect(clampResizeValue(1001, ROW_HEIGHT_BOUNDS)).toBe(1000)
    expect(storedResizeValue(120.6, COLUMN_WIDTH_BOUNDS)).toBe(121)
    expect(DEFAULT_COLUMN_WIDTH).toBe(100)
    expect(DEFAULT_ROW_HEIGHT).toBe(28)
  })

  it('maps keyboard resize keys by axis', () => {
    expect(resizeValueForKey(100, 'ArrowLeft', false, 'x', COLUMN_WIDTH_BOUNDS)).toBe(90)
    expect(resizeValueForKey(100, 'ArrowRight', true, 'x', COLUMN_WIDTH_BOUNDS)).toBe(150)
    expect(resizeValueForKey(28, 'ArrowUp', false, 'y', ROW_HEIGHT_BOUNDS)).toBe(18)
    expect(resizeValueForKey(990, 'ArrowDown', true, 'y', ROW_HEIGHT_BOUNDS)).toBe(1000)
    expect(resizeValueForKey(28, 'ArrowRight', false, 'y', ROW_HEIGHT_BOUNDS)).toBeNull()
  })
})

describe('cell display model', () => {
  it('classifies safe cell links and rejects unsafe URLs', () => {
    expect(classifyCellContent('https://example.com/a.png?size=1')).toEqual({
      kind: 'image',
      src: 'https://example.com/a.png?size=1',
    })
    expect(classifyCellContent('https://example.com')).toEqual({
      kind: 'link',
      href: 'https://example.com/',
      label: 'https://example.com',
    })
    expect(classifyCellContent('https://user:pass@example.com/a.png')).toEqual({
      kind: 'text',
      text: 'https://user:pass@example.com/a.png',
    })
  })

  it('builds reusable cell aria labels and classes', () => {
    const model = createCellDisplayModel({
      address: 'A1',
      label: '#N/A',
      selected: true,
      focused: true,
      editing: true,
      mergeRange: 'A1:B1',
      numeric: false,
      highlighted: true,
      previewing: true,
      styleClass: 'bold',
    })

    expect(isErrorLabel('#DIV/0!')).toBe(true)
    expect(model.error).toBe(true)
    expect(model.ariaLabel).toBe('A1 #N/A 오류 병합 셀 A1:B1 수식 참조 강조됨 선택됨 현재 셀 편집 중')
    expect(model.className).toBe('cell selected focused merged errcell ref-hi preview bold')
  })
})
