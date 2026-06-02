# zod-crud update notes

Date: 2026-06-02

## Current State

`spredsheet` uses `useJSONDocument` and wraps it with a local `SheetOps`.

- Good: document state and undo/redo are already backed by zod-crud.
- Good: `dictOps` now favors surgical key patches instead of whole-dict replacement.
- Good: `useSheetDocument` composes official and lab zod-crud extensions for autosave/persistence, collection movement, text replace, sparse record entry edits, rectangular sparse-grid paste/import application, tab color record edits, tab state/sheet diff apply, structural sheet diff apply, conditional-format item edits, merge append/delete edits, bounded count increments, freeze count updates/toggles, whole-record clear contents, import patch preview/diff apply, browser text clipboard access, hidden row/column option toggles, and checkbox value toggles.
- Good: `@zod-crud/sparse-record` now owns add/replace/remove/no-op patch planning for cells, notes, formats, styles, validation, row heights, column widths, tab colors, and checkbox conversion entry writes.
- Good: `@zod-crud/grid-range` now owns rectangular external TSV/CSV paste application over sparse `/cells/{A1}` records.
- App-owned: visual grid selection, DOM focus, keyboard policy, TSV/CSV parsing, formula semantics, checkbox normalization semantics, overlapping merge normalization, auto-fill series inference, and structural row/column shift calculations.

Current usage is broadly valid.

## Changelog Impact

The current zod-crud shape is document-facade based:

- `doc.patch`
- `doc.load`
- `doc.undo()/redo()`
- `doc.canUndo()/canRedo()`
- `JSONPatchOperation`
- `JSONResult`

`doc.ops` is not public. A local `SheetOps` wrapper is acceptable if it only wraps public API.

Unreleased local zod-crud changes already reflected here:

- Lab package renames used by `spredsheet`: `clear-values` -> `clear-contents`, `cycle` -> `toggle-value`, `number-step` -> `increment-number`, and `set-membership` -> `toggle-option`.
- Other renamed labs are not currently imported by the app: `batch-set` -> `batch-update`, `coerce` -> `convert-type`, `collection-sort` -> `sort-items`, `computed-fields` -> `calculated-fields`, `convert-node-kind` -> `convert-block-type`, `ensure-fields` -> `apply-defaults`, `fill-empty` -> `fill-blanks`, `forward-fill` -> `fill-down`, `grid-paste` -> `paste-cells`, `limit` -> `limit-items`, `move-selection` -> `move-selected`, `pad` -> `pad-text`, `paste-compatible` -> `paste-special`, `presence-cursors` -> `live-cursors`, `reindex` -> `renumber-items`, `slugify` -> `generate-slug`, `swap` -> `swap-items`, `text-transform` -> `change-case`, `truncate` -> `trim-text`, and `wrap-unwrap` -> `wrap-selection`.
- Default document error execution is now non-throwing (`strict: false`); this app already consumes result objects.
- Extension failure diagnostics use result-level `reason`; this app reads `.reason` for persistence/autosave failures.
- New lab packages adopted after the sparse/grid gap follow-up: `@zod-crud/sparse-record` and `@zod-crud/grid-range`.

## Improvement Direction

1. Keep `SheetOps` app-local.
   Spreadsheet commands need domain vocabulary. Do not wait for zod-crud to expose `doc.ops`.

2. Keep grid selection outside zod-crud.
   Translate grid selection to JSON Pointers only when applying document mutations or model clipboard operations.

3. Keep TSV/CSV parsing outside zod-crud.
   zod-crud clipboard-web owns browser text clipboard access, and grid-range owns rectangular sparse record application after the app parses table text.

4. Keep auto-fill series inference app-owned until zod-crud can accept host-owned fill semantics for sparse grid fill.

5. Consider `doc.commit(..., { selection })` later only if sheet model selection needs to be stored with history.

6. Track upstream support type exports and result shapes.
   `doc.undo()` and `doc.redo()` now return capability-style Results at the top-level document surface; local boolean UI contracts should read `.ok`.

## Dogfood Issue Map

- Tracking: https://github.com/developer-1px/zod-crud/issues/140
- Sparse record upsert gap, now adopted through `@zod-crud/sparse-record`: https://github.com/developer-1px/zod-crud/issues/141
- Sparse-record grid paste/import gap, now adopted through `@zod-crud/grid-range`: https://github.com/developer-1px/zod-crud/issues/142
- Regex search-replace pressure: https://github.com/developer-1px/zod-crud/issues/143
- Feature-level package naming pressure: https://github.com/developer-1px/zod-crud/issues/144
- Feature rename invalid identifier blocker: https://github.com/developer-1px/zod-crud/issues/145
- Sparse grid fill series semantics: https://github.com/developer-1px/zod-crud/issues/146

## Suggested Local Work Items

- Keep moving app-owned patch helpers behind zod-crud extension commands where a matching feature concept exists.
- Keep checkbox normalization semantics app-owned, but keep sparse cell/validation entry writes delegated through `sparse-record`.
- Keep rectangular parsed table data application delegated through `grid-range`; TSV/CSV parsing remains app-owned.
- Keep undo tests that prove one cell/metadata edit reverts only that intended edit.
- Avoid imports from zod-crud private subpaths.

## Additional Lab Audit

Follow-up audit on 2026-06-02 checked whether more zod-crud labs can replace the remaining app-owned grid edit code. The initial audit found real gaps; subsequent zod-crud updates added `sparse-record` and `grid-range`, and this app now adopts both.

- `@zod-crud/sparse-record` now fits this app's sparse record roots directly. It replaced the app-owned next-parent-record construction for mixed sparse record edits.
- `@zod-crud/grid-range` now fits rectangular external TSV/CSV paste/import application over sparse `/cells/{A1}` records.
- `@zod-crud/fill-series`, `@zod-crud/fill-down`, and `@zod-crud/paste-cells` remain real delegation candidates for array-of-record editors, but they still do not directly fit this app's sparse `cells: Record<A1, string>` model.
- `@zod-crud/fill-blanks` fills existing empty slots and explicitly does not add absent fields. That is adjacent to sparse cell editing but does not cover sparse record upsert.
- `@zod-crud/form-draft` fits temporary invalid form input, not the current cell patch planning gap. The active cell editor already delegates draft/commit/cancel behavior to `@spredsheet/grid`.
- The remaining upstream gap is sparse grid fill with product-owned series semantics. `grid-range.fill` repeats source patterns; `spredsheet` also needs arithmetic series behavior such as `1, 2 -> 3, 4`.

Latest upstream updates:

- Sparse record adoption: https://github.com/developer-1px/zod-crud/issues/141#issuecomment-4599083285
- Grid range paste/import adoption: https://github.com/developer-1px/zod-crud/issues/142#issuecomment-4599193191
- Fill series semantics proposal: https://github.com/developer-1px/zod-crud/issues/146

## Verification

```sh
pnpm exec tsc -b --pretty false
pnpm test
```
