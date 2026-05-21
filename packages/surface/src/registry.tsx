import type { ReactNode } from 'react'
import { EDITABLE_GRID_KIND } from '@spredsheet/editable-grid/contract'
import { EditableGrid } from '@spredsheet/editable-grid'
import {
  editableGridSelectionFromSurface,
  surfaceChangeFromEditableGrid,
  type EditableGridSurfaceView,
  type SurfaceChange,
  type SurfaceSelectionChange,
  type SurfaceView,
} from './contract'

export interface SurfaceRendererProps<TView extends SurfaceView = SurfaceView> {
  readonly view: TView
  readonly value: unknown
  readonly selection?: unknown
  readonly readonly?: boolean
  readonly onChange: (change: SurfaceChange) => void
  readonly onSelectionChange?: (change: SurfaceSelectionChange) => void
}

export type SurfaceRenderer<TView extends SurfaceView = SurfaceView> =
  (props: SurfaceRendererProps<TView>) => ReactNode

export type SurfaceRegistry = ReadonlyMap<string, SurfaceRenderer>

export const createSurfaceRegistry = (
  entries: readonly (readonly [string, SurfaceRenderer])[] = [],
): SurfaceRegistry => new Map(entries)

export const editableGridSurfaceRenderer: SurfaceRenderer<EditableGridSurfaceView> = ({
  view,
  value,
  selection,
  readonly,
  onChange,
  onSelectionChange,
}) => (
  <EditableGrid
    surface={view.grid}
    value={value}
    selection={editableGridSelectionFromSurface(selection)}
    readonly={readonly}
    className={view.className}
    onChange={(change) => onChange(surfaceChangeFromEditableGrid(view.id, change))}
    onSelectionChange={(next) => onSelectionChange?.({ viewId: view.id, selection: next })}
  />
)

export const defaultSurfaceRegistry = createSurfaceRegistry([
  [EDITABLE_GRID_KIND, editableGridSurfaceRenderer as SurfaceRenderer],
])
