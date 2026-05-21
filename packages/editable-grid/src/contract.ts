import type { ZodType } from 'zod'

export const EDITABLE_GRID_CONTRACT = 'interactive-os.editable-grid.v1' as const
export const EDITABLE_GRID_KIND = 'editable-grid' as const

export type JsonPointer = '' | `/${string}`
export type EditableGridColumnId = string

export const EDITABLE_GRID_PROFILES = [
  'record-table',
  'database-table',
  'document-table',
  'spreadsheet-grid',
] as const

export type EditableGridCoreProfile = typeof EDITABLE_GRID_PROFILES[number]

export type EditableGridProfile =
  | EditableGridCoreProfile
  | (string & { readonly __editableGridProfile?: never })

export type EditableGridCoreCapability =
  | 'cell-edit'
  | 'selection'
  | 'keyboard'
  | 'clipboard'
  | 'validation'
  | 'patch-output'

export type EditableGridCapability =
  | EditableGridCoreCapability
  | (string & { readonly __editableGridCapability?: never })

export type EditableGridFieldType =
  | 'text'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'multi-select'
  | 'date'
  | 'person'
  | 'relation'
  | 'formula'
  | 'rollup'
  | (string & { readonly __editableGridFieldType?: never })

export interface EditableGridFieldOption {
  readonly value: string
  readonly label?: string
  readonly color?: string
}

export interface EditableGridField<TMeta = unknown> {
  readonly type?: EditableGridFieldType
  readonly options?: readonly EditableGridFieldOption[]
  readonly formula?: string
  readonly relation?: string
  readonly meta?: TMeta
}

export interface EditableGridColumn<TMeta = unknown> {
  readonly id: EditableGridColumnId
  readonly path: JsonPointer
  readonly label?: string
  readonly component?: string
  readonly readonly?: boolean
  readonly field?: EditableGridField<TMeta>
  readonly meta?: TMeta
}

export interface EditableGridRowIdentity {
  readonly path: JsonPointer
}

export interface EditableGridSurface<TMeta = unknown> {
  readonly contract: typeof EDITABLE_GRID_CONTRACT
  readonly kind: typeof EDITABLE_GRID_KIND
  readonly profile?: EditableGridProfile
  readonly schema: ZodType<unknown>
  readonly dataPath: JsonPointer
  readonly rowIdentity?: EditableGridRowIdentity
  readonly columns: readonly EditableGridColumn<TMeta>[]
  readonly capabilities?: readonly EditableGridCapability[]
  readonly meta?: TMeta
}

export interface EditableGridAddress {
  readonly rowIndex: number
  readonly columnId: EditableGridColumnId
}

export interface EditableGridRange {
  readonly anchor: EditableGridAddress
  readonly focus: EditableGridAddress
}

export interface EditableGridSelection {
  readonly focus?: EditableGridAddress
  readonly ranges?: readonly EditableGridRange[]
}

export type EditableGridPatch =
  | { readonly op: 'add'; readonly path: JsonPointer; readonly value: unknown }
  | { readonly op: 'replace'; readonly path: JsonPointer; readonly value: unknown }
  | { readonly op: 'remove'; readonly path: JsonPointer }

export type EditableGridCoreChangeSource =
  | 'cell-edit'
  | 'paste'
  | 'fill'
  | 'clear'
  | 'programmatic'

export type EditableGridChangeSource =
  | EditableGridCoreChangeSource
  | (string & { readonly __editableGridChangeSource?: never })

export interface EditableGridChange {
  readonly patches: readonly EditableGridPatch[]
  readonly source: EditableGridChangeSource
  readonly selection?: EditableGridSelection
}

export interface EditableGridHostContract<TValue = unknown, TMeta = unknown> {
  readonly surface: EditableGridSurface<TMeta>
  readonly value: TValue
  readonly selection?: EditableGridSelection
  readonly readonly?: boolean
  readonly onChange: (change: EditableGridChange) => void
  readonly onSelectionChange?: (selection: EditableGridSelection) => void
}

export const defineEditableGridSurface = <TMeta = unknown>(
  surface: EditableGridSurface<TMeta>,
): EditableGridSurface<TMeta> => surface

export const editableGridProfileOf = (surface: EditableGridSurface): EditableGridProfile =>
  surface.profile ?? 'record-table'

export const escapeJsonPointerSegment = (segment: string): string =>
  segment.replace(/~/g, '~0').replace(/\//g, '~1')

export const unescapeJsonPointerSegment = (segment: string): string =>
  segment.replace(/~1/g, '/').replace(/~0/g, '~')

export const splitJsonPointer = (pointer: JsonPointer): readonly string[] =>
  pointer === '' ? [] : pointer.slice(1).split('/').map(unescapeJsonPointerSegment)

export const joinJsonPointer = (...segments: readonly (string | number)[]): JsonPointer =>
  segments.length === 0 ? '' : `/${segments.map((segment) => escapeJsonPointerSegment(String(segment))).join('/')}`

export const readJsonPointer = (value: unknown, pointer: JsonPointer): unknown => {
  let current = value
  for (const segment of splitJsonPointer(pointer)) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

export const editableGridRows = (value: unknown, dataPath: JsonPointer): readonly unknown[] => {
  const rows = readJsonPointer(value, dataPath)
  return Array.isArray(rows) ? rows : []
}

export const editableGridCellPath = (
  dataPath: JsonPointer,
  rowIndex: number,
  columnPath: JsonPointer,
): JsonPointer => {
  const rowPath = joinJsonPointer(rowIndex)
  if (dataPath === '') return `${rowPath}${columnPath}` as JsonPointer
  return `${dataPath}${rowPath}${columnPath}` as JsonPointer
}
