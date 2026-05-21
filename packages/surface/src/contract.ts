import type { ZodType } from 'zod'
import type {
  EditableGridChange,
  EditableGridSelection,
  EditableGridSurface,
  JsonPointer,
} from '@spredsheet/editable-grid/contract'
import { EDITABLE_GRID_KIND } from '@spredsheet/editable-grid/contract'

export const SURFACE_CONTRACT = 'interactive-os.surface.v1' as const

export type SurfaceViewKind =
  | typeof EDITABLE_GRID_KIND
  | (string & { readonly __surfaceViewKind?: never })

export const SURFACE_INTENTS = [
  'record-table',
  'database-table',
  'document-table',
  'spreadsheet-grid',
  'mixed-surface',
] as const

export type SurfaceCoreIntent = typeof SURFACE_INTENTS[number]

export type SurfaceIntent =
  | SurfaceCoreIntent
  | (string & { readonly __surfaceIntent?: never })

export interface SurfaceViewBase<TKind extends SurfaceViewKind = SurfaceViewKind, TMeta = unknown> {
  readonly id: string
  readonly kind: TKind
  readonly title?: string
  readonly meta?: TMeta
}

export interface EditableGridSurfaceView<TMeta = unknown>
  extends SurfaceViewBase<typeof EDITABLE_GRID_KIND, TMeta> {
  readonly grid: EditableGridSurface<TMeta>
  readonly className?: string
}

export type SurfaceView<TMeta = unknown> =
  | EditableGridSurfaceView<TMeta>
  | SurfaceViewBase<SurfaceViewKind, TMeta>

export interface SurfaceDescriptor<TMeta = unknown> {
  readonly contract: typeof SURFACE_CONTRACT
  readonly intent?: SurfaceIntent
  readonly schema: ZodType<unknown>
  readonly views: readonly SurfaceView<TMeta>[]
  readonly capabilities?: readonly string[]
  readonly meta?: TMeta
}

export type SurfacePatch =
  | { readonly op: 'add'; readonly path: JsonPointer; readonly value: unknown }
  | { readonly op: 'replace'; readonly path: JsonPointer; readonly value: unknown }
  | { readonly op: 'remove'; readonly path: JsonPointer }

export interface SurfaceChange {
  readonly viewId: string
  readonly patches: readonly SurfacePatch[]
  readonly source: string
  readonly selection?: unknown
}

export interface SurfaceSelectionChange {
  readonly viewId: string
  readonly selection: unknown
}

export type SurfaceSelections = Readonly<Record<string, unknown>>

export interface SurfaceHostContract<TValue = unknown, TMeta = unknown> {
  readonly surface: SurfaceDescriptor<TMeta>
  readonly value: TValue
  readonly selections?: SurfaceSelections
  readonly readonly?: boolean
  readonly onChange: (change: SurfaceChange) => void
  readonly onSelectionChange?: (change: SurfaceSelectionChange) => void
}

export interface SurfaceValidationIssue {
  readonly code: 'invalid-contract' | 'duplicate-view-id' | 'unregistered-view-kind'
  readonly message: string
  readonly viewId?: string
  readonly kind?: string
}

export const defineSurface = <TMeta = unknown>(
  surface: SurfaceDescriptor<TMeta>,
): SurfaceDescriptor<TMeta> => surface

export const surfaceIntentOf = (surface: SurfaceDescriptor): SurfaceIntent =>
  surface.intent ?? 'mixed-surface'

export const surfaceChangeFromEditableGrid = (
  viewId: string,
  change: EditableGridChange,
): SurfaceChange => ({
  viewId,
  patches: change.patches,
  source: change.source,
  selection: change.selection,
})

export const editableGridSelectionFromSurface = (
  selection: unknown,
): EditableGridSelection | undefined =>
  typeof selection === 'object' && selection !== null ? selection as EditableGridSelection : undefined
