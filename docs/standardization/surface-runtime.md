# Surface Runtime Interface Contract

## Status

Internal contract seed.

## Decision

The generated UI assembly layer is `@spredsheet/surface`.

The reusable concept is:

> a Zod-backed surface descriptor that chooses registered interaction islands
> and routes their patch output back to the host document.

The target is not a Google Sheets clone. The runtime must compose table families
such as record tables, Airtable-like database tables, Notion-like document
tables, and spreadsheet grids through the same descriptor system.

## Stable Interface

- `SurfaceDescriptor`
- `Surface`
- `SurfaceHostContract`
- `SurfaceChange`
- `SurfaceRegistry`
- `SurfaceIntent`
- `defineSurface`

## Invariants

- AI generates descriptors, not arbitrary React handlers.
- Registered renderers own low-level interaction behavior.
- The surface runtime owns registry dispatch and view-level change routing.
- State changes leave the surface as grouped patches tagged with `viewId`.
- Persistence, undo history, network, and storage remain host responsibilities.
- Surface intent is declared explicitly; table family is not derived from brand
  names or visual styling.

## First Renderer

The first built-in registry entry is `editable-grid`, backed by
`@spredsheet/editable-grid`.

## Promotion Bar

Move toward `@interactive-os/surface` after:

- a spreadsheet view is rendered through `Surface`,
- at least one non-spreadsheet descriptor uses the same runtime,
- formula-bound derived fields are represented in descriptors,
- registry validation catches unknown view kinds and duplicate view ids,
- host patch routing is covered by tests.
