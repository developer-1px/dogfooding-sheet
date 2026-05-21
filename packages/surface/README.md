# @spredsheet/surface

Schema-driven surface runtime for generated UI composition.

This package is the assembly layer. AI should generate a `SurfaceDescriptor`,
not ad-hoc React event logic. The runtime validates the descriptor, looks up
registered interaction islands, and routes patch output back to the host.

## Minimal Shape

```tsx
import { Surface, SURFACE_CONTRACT, defineSurface } from '@spredsheet/surface'

const surface = defineSurface({
  contract: SURFACE_CONTRACT,
  intent: 'database-table',
  schema: InvoiceSchema,
  views: [
    { id: 'lines', kind: 'editable-grid', grid: lineGrid },
  ],
})

<Surface surface={surface} value={invoice} onChange={applyChange} />
```

Surface intent is explicit. A generated UI can choose `record-table`,
`database-table`, `document-table`, `spreadsheet-grid`, or a custom intent
without changing the renderer protocol.

## Rules

- Zod owns data shape and validation.
- Surface descriptors own layout and component choice.
- Renderers are registered by `kind`.
- Views emit grouped patches through `SurfaceChange`.
- The surface runtime does not own persistence, network, undo history, or app state.
