# Editable Grid Interface Contract

## Status

Internal contract seed.

This document defines the interface that should survive renderer rewrites,
spreadsheet demo changes, and future `@interactive-os/*` promotion.

## Decision

The reusable unit is not a spreadsheet clone. It is:

> a Zod-backed editable grid island that generated UI can place inside a larger
> surface and drive through declarative descriptors plus patch output.

The same contract must cover multiple table families:

- `record-table`: plain rows and fields.
- `database-table`: Airtable-like records, typed fields, options, relations,
  formulas, and rollups.
- `document-table`: Notion-like document tables embedded in block surfaces.
- `spreadsheet-grid`: spreadsheet-style dense cells when that behavior is
  actually needed.

Typed field intent is part of the table contract, not app-specific decoration.
`select`, `checkbox`, `number`, `person`, `relation`, `formula`, and `rollup`
describe how generated UI should render and patch table cells.

## Stable Interface

The stable boundary is the one exported from `@spredsheet/editable-grid`:

- `EditableGridSurface`
- `EditableGrid`
- `EditableGridHostContract`
- `EditableGridPatch`
- `EditableGridSelection`
- `EditableGridProfile`
- `JsonPointer`

Everything else is allowed to evolve behind this boundary.

## Invariants

- Schema and view intent are separate.
- Zod validates the data shape; it does not carry layout.
- Descriptors are declarative and contain no event handlers.
- State changes leave the grid as grouped JSON Pointer patches.
- The grid does not own persistence, undo history, network calls, localStorage,
  tabs, toolbars, or spreadsheet-specific menus.
- Selection state is serializable; rectangular ranges preserve a distinct
  anchor and focus while the renderer keeps one DOM focus cell.
- Capabilities are negotiated by string identifiers, not by new callback props.
- Table family is declared by `profile`; it is not inferred from styling.
- Field type is declared by `column.field.type`; renderers must not infer table
  semantics from display text.

## Why This Matches Gen UI

Generated UI should not invent grid behavior. It should choose a trusted island,
provide a schema, describe the visible columns, and route patches back to the
host document.

This makes the AI responsible for composition, not low-level interaction code.

## Promotion Bar

The contract can move toward `@interactive-os/editable-grid` after:

- a renderer consumes `EditableGridHostContract`,
- the spreadsheet demo uses that renderer for at least one grid,
- validation errors flow from Zod to cell state,
- edits produce grouped `EditableGridPatch` values,
- at least one non-spreadsheet surface uses the same contract.
