# spredsheet

Browser-only spreadsheet built on top of two local packages — used as their dogfood:

- **`@interactive-os/aria`** — current APG pattern runtime; grid focus/navigation uses this.
- **`@interactive-os/aria-kernel`** — legacy gestures and remaining dialog/menu/tabs adapters during migration.
- **[`zod-crud`](https://github.com/developer-1px/zod-crud)** — single-document JSON-Patch CRUD with undo/redo over a Zod schema.

A 10-column × 20-row sheet with 200+ formulas, conditional formatting, validation, multiple tabs, and end-to-end undo. ~5k LOC under `src/`.

## Architecture

```
src/app/                       ← entry, app shell, previews, and devtools wiring
src/shared/                    ← domain-free utilities, hooks, and test support
src/entities/                  ← stable sheet data interfaces and pure transforms
src/features/                  ← spreadsheet use cases grouped by slice and role
src/widgets/                   ← visible spreadsheet composition surfaces
packages/                      ← reusable headless engines and contracts
```

App-owned code follows `layer > slice > segment(role)`. For example,
`src/features/validation/hooks` owns the validation runtime hook, while
`src/widgets/sheet-grid/ui` owns the visible grid surface. Packages never import
from `src/`. `pnpm check:boundaries` enforces package isolation, feature-slice
independence, and downward-only layer imports.

### Standardization candidates

- `packages/formula/` is registered as the seed for an Excel-like interactive
  formula engine candidate. See
  [`docs/standardization/formula-engine.md`](docs/standardization/formula-engine.md).

### SSOT (single source of truth)

Everything persisted lives in **one** `useJSONDocument(SheetSchema)`:
`cells / notes / styles / formats / validation / condFormat / freeze / hidden / colWidths / tabs`.

Consequence: **undo/redo covers every state change** — bold a cell, add a note, drag a column, switch tabs — all reverse via Cmd+Z.

### Multi-sheet

Each tab owns its own `TabBundle` (cells + notes + styles + …). `tabActions.switchTab` snapshots the active bundle into `tabs.saved[active]` and hydrates the target's bundle in a single `ops.reset`.

### Native modal-free

No `window.prompt` / `window.confirm` / `window.alert`. All interactions route through `usePrompt` / `useConfirm` hooks built on aria-kernel legacy dialog adapters.

## Dev

```sh
pnpm install
pnpm dev          # vite dev server
pnpm check        # lint + boundaries + production build + all tests
pnpm check:boundaries
pnpm build        # package builds + tsc -b + vite build
pnpm test         # app + grid + formula tests
```

## Open issues filed during dogfooding

- aria-kernel#137 — `useDialogPattern` controlled-mode Escape doesn't reach parent (added `onOpenChange`)
- zod-crud#57 — `ops.replace` invalidates references for unrelated paths (structural-sharing proposal)
- zod-crud#58 — expose `undoDepth` / `redoDepth` for indicator UIs
- zod-crud#59 — coalesce rapid ops into a single undo entry (drag interactions)

## ARIA-punt absorption (kernel ↔ spredsheet)

Ad-hoc 코드를 kernel 책임선 아래로 옮긴 5건. 각 1대1 매핑이 ds repo `/lab` 라우트에 PoC + 25 black-box test 로 가시화돼 있다.

| Was (ad-hoc) | Now (kernel API) | File |
|---|---|---|
| `<div className="dialog-backdrop" onClick={close}/>` | `useDialogPattern` `backdropProps` (self-target guard) | `src/widgets/dialogs/ui/HelpDialog.tsx` |
| `data.entities[name].selected = name === active` mutation | `useTabsPattern({ active })` | `src/features/tabs/ui/Tabs.tsx` |
| `useEffect(()=>document.addEventListener('mousedown',...))` | `useMenuPattern({ onInteractOutside })` | `src/widgets/context-menu/ui/ContextMenu.tsx` |
| `<input onKeyDown={...Enter/Shift+Enter}>` | `useDialogPattern({ on: { Enter, 'shift+Enter' } })` | `src/features/find/ui/Find.tsx` |
| F2/Enter handler in `useShortcuts` | `useGridPattern` emits `editStart` (GRID_EDIT_CHORDS = [F2, Enter]) | `src/widgets/sheet-grid/hooks/useSheetGrid.ts` |
