# json-document update notes

Date: 2026-07-16

## Current State

`spredsheet` uses `useJSONDocument` and wraps it with a local `SheetOps`.

- Good: document state and undo/redo are already backed by json-document.
- Good: `dictOps` now favors surgical key patches instead of whole-dict replacement.
- Good: `useSheetDocument` composes official and lab json-document extensions for autosave/persistence, collection movement, text replace, sparse record entry edits, rectangular sparse-grid paste/import/fill application, keyboard fillDown/fillRight application, tab color record edits, tab state/sheet diff apply, structural sheet diff apply, conditional-format item edits, merge append/delete edits, bounded count increments, freeze count updates/toggles, whole-record clear contents, import patch preview/diff apply, browser text clipboard access, hidden row/column option toggles, and checkbox value toggles.
- Good: `@interactive-os/json-document-sparse-record` now owns add/replace/remove/no-op patch planning for cells, notes, formats, styles, validation, row heights, column widths, tab colors, and checkbox conversion entry writes.
- Good: `@interactive-os/json-document-grid-range` now owns rectangular external TSV/CSV paste/import and fill application over sparse `/cells/{A1}` records.
- App-owned: visual grid selection, DOM focus, keyboard policy, TSV/CSV parsing, formula semantics, checkbox normalization semantics, overlapping merge normalization, auto-fill series inference, and structural row/column shift calculations.

Current usage is broadly valid.

## Changelog Impact

The current json-document shape is document-facade based:

- `doc.patch`
- `doc.load`
- `doc.undo()/redo()`
- `doc.canUndo()/canRedo()`
- `JSONPatchOperation`
- `JSONResult`

`doc.ops` is not public. A local `SheetOps` wrapper is acceptable if it only wraps public API.

The local integration now targets `@interactive-os/json-document@1.1.0-rc.0`:

- `SheetOps` derives high-level failure branches from `JSONDocumentEditResult<Sheet>` while intentionally narrowing success to `{ ok: true }` for app commands.
- Core mutation success values follow `{ ok, value, applied, target }`; the adapter does not leak those unused details into UI command ports.
- Published `doc.value` snapshots are treated as transitively immutable and caller-owned initial values cannot mutate document state.
- `query` and `canQuery` are the canonical JSONPath names. This app does not call the deprecated `find` aliases directly.
- Low-level `patch` and `commit` continue to return `JSONResult`.
- Persistence writes `json-document.persistence+json` while still reading the legacy `zod-crud.persistence+json` envelope.

Unreleased local json-document changes already reflected here:

- Lab package renames used by `spredsheet`: `clear-values` -> `clear-contents`, `cycle` -> `toggle-value`, `number-step` -> `increment-number`, and `set-membership` -> `toggle-option`.
- Other renamed labs are not currently imported by the app: `batch-set` -> `batch-update`, `coerce` -> `convert-type`, `collection-sort` -> `sort-items`, `computed-fields` -> `calculated-fields`, `convert-node-kind` -> `convert-block-type`, `ensure-fields` -> `apply-defaults`, `fill-empty` -> `fill-blanks`, `forward-fill` -> `fill-down`, `grid-paste` -> `paste-cells`, `limit` -> `limit-items`, `move-selection` -> `move-selected`, `pad` -> `pad-text`, `paste-compatible` -> `paste-special`, `presence-cursors` -> `live-cursors`, `reindex` -> `renumber-items`, `slugify` -> `generate-slug`, `swap` -> `swap-items`, `text-transform` -> `change-case`, `truncate` -> `trim-text`, and `wrap-unwrap` -> `wrap-selection`.
- Default document error execution is now non-throwing (`strict: false`); this app already consumes result objects.
- Extension failure diagnostics use result-level `reason`; this app reads `.reason` for persistence/autosave failures.
- New lab packages adopted after the sparse/grid gap follow-up: `@interactive-os/json-document-sparse-record` and `@interactive-os/json-document-grid-range`.

## Improvement Direction

1. Keep `SheetOps` app-local.
   Spreadsheet commands need domain vocabulary. Do not wait for json-document to expose `doc.ops`.

2. Keep grid selection outside json-document.
   Translate grid selection to JSON Pointers only when applying document mutations or model clipboard operations.

3. Keep TSV/CSV parsing outside json-document.
   json-document clipboard-web owns browser text clipboard access, and grid-range owns rectangular sparse record application after the app parses table text.

4. Keep auto-fill series inference app-owned, while delegating sparse fill application through `grid-range.fill`.

5. Consider `doc.commit(..., { selection })` later only if sheet model selection needs to be stored with history.

6. Track upstream support type exports and result shapes.
   `doc.undo()` and `doc.redo()` now return capability-style Results at the top-level document surface; local boolean UI contracts should read `.ok`.

## Dogfood Issue Map

- Tracking: https://github.com/developer-1px/json-document/issues/140
- Sparse record upsert gap, now adopted through `@interactive-os/json-document-sparse-record`: https://github.com/developer-1px/json-document/issues/141
- Sparse-record grid paste/import gap, now adopted through `@interactive-os/json-document-grid-range`: https://github.com/developer-1px/json-document/issues/142
- Regex search-replace pressure: https://github.com/developer-1px/json-document/issues/143
- Feature-level package naming pressure: https://github.com/developer-1px/json-document/issues/144
- Feature rename invalid identifier blocker: https://github.com/developer-1px/json-document/issues/145
- Sparse grid fill series semantics: https://github.com/developer-1px/json-document/issues/146

## Suggested Local Work Items

- Keep moving app-owned patch helpers behind json-document extension commands where a matching feature concept exists.
- Keep checkbox normalization semantics app-owned, but keep sparse cell/validation entry writes delegated through `sparse-record`.
- Keep rectangular parsed table data and sparse fill application delegated through `grid-range`; TSV/CSV parsing and series inference remain app-owned.
- Keep undo tests that prove one cell/metadata edit reverts only that intended edit.
- Avoid imports from json-document private subpaths.

## Additional Lab Audit

Follow-up audit on 2026-06-02 checked whether more json-document labs can replace the remaining app-owned grid edit code. The initial audit found real gaps; subsequent json-document updates added `sparse-record` and `grid-range`, and this app now adopts both.

- `@interactive-os/json-document-sparse-record` now fits this app's sparse record roots directly. It replaced the app-owned next-parent-record construction for mixed sparse record edits.
- `@interactive-os/json-document-grid-range` now fits rectangular external TSV/CSV paste/import application and sparse fill application over sparse `/cells/{A1}` records.
- `@interactive-os/json-document-fill-series`, `@interactive-os/json-document-fill-down`, and `@interactive-os/json-document-paste-cells` remain real delegation candidates for array-of-record editors, but they still do not directly fit this app's sparse `cells: Record<A1, string>` model.
- `@interactive-os/json-document-fill-blanks` fills existing empty slots and explicitly does not add absent fields. That is adjacent to sparse cell editing but does not cover sparse record upsert.
- `@interactive-os/json-document-form-draft` fits temporary invalid form input, not the current cell patch planning gap. The active cell editor already delegates draft/commit/cancel behavior to `@spredsheet/grid`.
- Sparse grid fill no longer needs app-owned sparse patch application. `grid-range.fill` accepts a host generator, so `spredsheet` keeps product-owned series derivation while json-document owns sparse add/replace/remove/no-op application.

Latest upstream updates:

- Sparse record adoption: https://github.com/developer-1px/json-document/issues/141#issuecomment-4599083285
- Grid range paste/import adoption: https://github.com/developer-1px/json-document/issues/142#issuecomment-4599193191
- Fill series semantics proposal: https://github.com/developer-1px/json-document/issues/146

## Verification

```sh
pnpm exec tsc -b --pretty false
pnpm test
```
