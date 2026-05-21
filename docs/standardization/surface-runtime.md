# Surface Runtime Interface Contract

## Status

Internal contract seed.

## Decision

The generated UI assembly layer is `@spredsheet/surface`.

The reusable concept is:

> a Zod-backed surface descriptor that chooses registered interaction islands
> and routes their patch output back to the host document.

## Stable Interface

- `SurfaceDescriptor`
- `Surface`
- `SurfaceHostContract`
- `SurfaceChange`
- `SurfaceRegistry`
- `defineSurface`

## Invariants

- AI generates descriptors, not arbitrary React handlers.
- Registered renderers own low-level interaction behavior.
- The surface runtime owns registry dispatch and view-level change routing.
- State changes leave the surface as grouped patches tagged with `viewId`.
- Persistence, undo history, network, and storage remain host responsibilities.

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
