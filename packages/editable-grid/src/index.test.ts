import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  EDITABLE_GRID_CONTRACT,
  EDITABLE_GRID_KIND,
  defineEditableGridSurface,
  editableGridCellPath,
  editableGridRows,
  escapeJsonPointerSegment,
  joinJsonPointer,
  readJsonPointer,
  classifyCellContent,
  createCellDisplayModel,
  isErrorLabel,
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
    expect(surface.columns[0]?.path).toBe('/name')
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
    expect(model.ariaLabel).toBe('A1 #N/A 오류 병합 셀 A1:B1 선택됨 현재 셀 편집 중')
    expect(model.className).toBe('cell selected focused merged errcell ref-hi preview bold')
  })
})
