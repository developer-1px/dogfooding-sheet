import {
  type SurfaceHostContract,
} from './contract'
import {
  defaultSurfaceRegistry,
  type SurfaceRegistry,
} from './registry'
import { validateSurface } from './validate'

export interface SurfaceProps<TValue = unknown, TMeta = unknown>
  extends SurfaceHostContract<TValue, TMeta> {
  readonly registry?: SurfaceRegistry
  readonly className?: string
}

export function Surface<TValue = unknown, TMeta = unknown>({
  surface,
  value,
  selections = {},
  readonly,
  onChange,
  onSelectionChange,
  registry = defaultSurfaceRegistry,
  className,
}: SurfaceProps<TValue, TMeta>) {
  const issues = validateSurface(surface, registry)
  if (issues.length > 0) return null

  return (
    <div
      className={['surface', className].filter(Boolean).join(' ')}
      data-surface-contract={surface.contract}
    >
      {surface.views.map((view) => {
        const render = registry.get(view.kind)
        if (!render) return null
        return (
          <div key={view.id} className="surface-view" data-surface-view={view.id} data-surface-kind={view.kind}>
            {render({
              view,
              value,
              selection: selections[view.id],
              readonly,
              onChange,
              onSelectionChange,
            })}
          </div>
        )
      })}
    </div>
  )
}
