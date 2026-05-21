# spredsheet

Browser-only spreadsheet built on top of two local packages — used as their dogfood:

- **`@interactive-os/aria`** — current APG pattern runtime; grid focus/navigation uses this.
- **`@interactive-os/aria-kernel`** — legacy gestures and remaining dialog/menu/tabs adapters during migration.
- **[`zod-crud`](https://github.com/developer-1px/zod-crud)** — single-document JSON-Patch CRUD with undo/redo over a Zod schema.

A 10-column × 20-row sheet with 200+ formulas, conditional formatting, validation, multiple tabs, and end-to-end undo. ~5k LOC under `src/`.

## Architecture

```
src/sheet/useSheet.ts          ← root hook, exposes ctx
src/sheet/schema.ts            ← single SSOT TabBundle + Sheet (zod)
src/sheet/use{Notes,Styles,…}  ← thin readers/writers over ops.replace
src/sheet/Grid                 ← consumes @interactive-os/aria grid pattern
src/sheet/Tabs / dialogs / …   ← consume aria-kernel legacy adapters
packages/formula/              ← internal formula package + standardization seed
```

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
pnpm check        # lint + production build + all tests
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
| `<div className="dialog-backdrop" onClick={close}/>` | `useDialogPattern` `backdropProps` (self-target guard) | `src/sheet/HelpDialog.tsx` |
| `data.entities[name].selected = name === active` mutation | `useTabsPattern({ active })` | `src/sheet/Tabs.tsx` |
| `useEffect(()=>document.addEventListener('mousedown',...))` | `useMenuPattern({ onInteractOutside })` | `src/sheet/ContextMenu.tsx` |
| `<input onKeyDown={...Enter/Shift+Enter}>` | `useDialogPattern({ on: { Enter, 'shift+Enter' } })` | `src/sheet/Find.tsx` |
| F2/Enter handler in `useShortcuts` | `useGridPattern` emits `editStart` (GRID_EDIT_CHORDS = [F2, Enter]) | `src/sheet/useSheetGrid.ts` |
