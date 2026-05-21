# @spredsheet/editable-grid

Stable contract for a schema-driven editable grid island.

This package does not define a spreadsheet product. It defines the public
surface that a generated UI can assemble without writing custom grid behavior.

## Non-Negotiable Interface

The contract is intentionally small:

- `EditableGridSurface`: Zod schema + declarative grid descriptor.
- `EditableGridHostContract`: host value + callbacks a renderer must consume.
- `EditableGridPatch`: RFC 6901/6902-compatible patch output.
- `EditableGridSelection`: serializable focus and rectangular selection state.

These names are the stable boundary. Renderers, themes, adapters, and app
features can change behind them.

## Design Rules

- Zod owns data shape and validation.
- The descriptor owns view intent.
- The grid emits grouped patches; it does not own persistence, history, network,
  or storage.
- Paths are JSON Pointer paths, never dot paths.
- The descriptor contains no event handlers.
- Capabilities are declared as strings so hosts can negotiate features without
  changing the core interface.

## Minimal Shape

```ts
import { z } from 'zod'
import {
  EDITABLE_GRID_CONTRACT,
  EDITABLE_GRID_KIND,
  defineEditableGridSurface,
} from '@spredsheet/editable-grid'

const LineSchema = z.object({
  name: z.string(),
  qty: z.number().min(0),
  price: z.number().min(0),
})

const surface = defineEditableGridSurface({
  contract: EDITABLE_GRID_CONTRACT,
  kind: EDITABLE_GRID_KIND,
  schema: z.array(LineSchema),
  dataPath: '/lines',
  rowIdentity: { path: '/id' },
  columns: [
    { id: 'name', path: '/name', label: 'Name' },
    { id: 'qty', path: '/qty', label: 'Qty' },
    { id: 'price', path: '/price', label: 'Price' },
  ],
  capabilities: ['cell-edit', 'selection', 'keyboard', 'clipboard', 'validation', 'patch-output'],
})
```

