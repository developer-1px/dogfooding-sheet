# spredsheet

Browser-only spreadsheet built on top of two local packages — used as their dogfood:

- **[`@p/aria-kernel`](https://github.com/developer-1px/aria-kernel)** — APG-conformant ARIA primitives (grid / dialog / menu / tabs / alertdialog).
- **[`zod-crud`](https://github.com/developer-1px/zod-crud)** — single-document JSON-Patch CRUD with undo/redo over a Zod schema.

A 10-column × 20-row sheet with 200+ formulas, conditional formatting, validation, multiple tabs, and end-to-end undo. ~5k LOC under `src/`.

## Architecture

```
src/sheet/useSheet.ts          ← root hook, exposes ctx
src/sheet/schema.ts            ← single SSOT TabBundle + Sheet (zod)
src/sheet/use{Notes,Styles,…}  ← thin readers/writers over ops.replace
src/sheet/Tabs / Grid / …      ← consume aria-kernel patterns
src/lib/formula/               ← formula parser + ~200 functions
```

### SSOT (single source of truth)

Everything persisted lives in **one** `useJsonDocument(SheetSchema)`:
`cells / notes / styles / formats / validation / condFormat / freeze / hidden / colWidths / tabs`.

Consequence: **undo/redo covers every state change** — bold a cell, add a note, drag a column, switch tabs — all reverse via Cmd+Z.

### Multi-sheet

Each tab owns its own `TabBundle` (cells + notes + styles + …). `tabActions.switchTab` snapshots the active bundle into `tabs.saved[active]` and hydrates the target's bundle in a single `ops.reset`.

### Native modal-free

No `window.prompt` / `window.confirm` / `window.alert`. All interactions route through `usePrompt` / `useConfirm` hooks built on aria-kernel's `useDialogPattern` and `useAlertDialogPattern`.

## Dev

```sh
pnpm install
pnpm dev          # vite dev server
pnpm build        # tsc -b && vite build
pnpm test         # vitest run
```

## Open issues filed during dogfooding

- aria-kernel#137 — `useDialogPattern` controlled-mode Escape doesn't reach parent (added `onOpenChange`)
- zod-crud#57 — `ops.replace` invalidates references for unrelated paths (structural-sharing proposal)
- zod-crud#58 — expose `undoDepth` / `redoDepth` for indicator UIs
- zod-crud#59 — coalesce rapid ops into a single undo entry (drag interactions)
