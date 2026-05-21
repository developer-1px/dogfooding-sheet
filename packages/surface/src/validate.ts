import {
  SURFACE_CONTRACT,
  type SurfaceDescriptor,
  type SurfaceValidationIssue,
} from './contract'
import {
  defaultSurfaceRegistry,
  type SurfaceRegistry,
} from './registry'

export const validateSurface = (
  surface: SurfaceDescriptor,
  registry: SurfaceRegistry = defaultSurfaceRegistry,
): readonly SurfaceValidationIssue[] => {
  const issues: SurfaceValidationIssue[] = []
  if (surface.contract !== SURFACE_CONTRACT) {
    issues.push({
      code: 'invalid-contract',
      message: `Expected ${SURFACE_CONTRACT}`,
    })
  }
  const ids = new Set<string>()
  for (const view of surface.views) {
    if (ids.has(view.id)) {
      issues.push({
        code: 'duplicate-view-id',
        message: `Duplicate view id ${view.id}`,
        viewId: view.id,
      })
    }
    ids.add(view.id)
    if (!registry.has(view.kind)) {
      issues.push({
        code: 'unregistered-view-kind',
        message: `No renderer registered for ${view.kind}`,
        viewId: view.id,
        kind: view.kind,
      })
    }
  }
  return issues
}
