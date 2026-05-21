import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  EDITABLE_GRID_CONTRACT,
  EDITABLE_GRID_KIND,
  defineEditableGridSurface,
  editableGridCellPath,
  escapeJsonPointerSegment,
  joinJsonPointer,
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
})
