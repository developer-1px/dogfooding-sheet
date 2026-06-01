# zod-crud update notes

Date: 2026-06-02

## Current State

`spredsheet` uses `useJSONDocument` and wraps it with a local `SheetOps`.

- Good: document state and undo/redo are already backed by zod-crud.
- Good: `dictOps` now favors surgical key patches instead of whole-dict replacement.
- Good: `useSheetDocument` composes official and lab zod-crud extensions for autosave/persistence, collection movement, text replace, existing-value batch update, sparse default insertion, sparse record replacements, whole-record clear contents, import patch preview/diff apply, browser text clipboard access, hidden row/column option toggles, freeze count toggles, and checkbox value toggles.
- App-owned: visual grid selection, DOM focus, keyboard policy, TSV parsing, formula semantics, mixed sparse record upsert/remove fallback, and structural row/column shifts.

Current usage is broadly valid.

## Changelog Impact

The final zod-crud shape is document-facade based:

- `doc.patch`
- `doc.load`
- `doc.history.undo/redo`
- `doc.canUndo()/canRedo()`
- `JSONPatchOperation`
- `JSONResult`

`doc.ops` is not public. A local `SheetOps` wrapper is acceptable if it only wraps public API.

## Improvement Direction

1. Keep `SheetOps` app-local.
   Spreadsheet commands need domain vocabulary. Do not wait for zod-crud to expose `doc.ops`.

2. Keep grid selection outside zod-crud.
   Translate grid selection to JSON Pointers only when applying document mutations or model clipboard operations.

3. Keep TSV parsing outside zod-crud unless a dedicated grid clipboard adapter appears.
   zod-crud clipboard-web owns browser text clipboard access; table text/html formats are spreadsheet adapters.

4. Consider `doc.commit(..., { selection })` later only if sheet model selection needs to be stored with history.

5. Track upstream support type exports and result shapes.
   `doc.undo()` and `doc.redo()` now return capability-style Results at the top-level document surface; local boolean UI contracts should read `.ok`.

## Dogfood Issue Map

- Tracking: https://github.com/developer-1px/zod-crud/issues/140
- Sparse record upsert gap: https://github.com/developer-1px/zod-crud/issues/141
- Sparse-record grid paste/fill gap: https://github.com/developer-1px/zod-crud/issues/142
- Regex search-replace pressure: https://github.com/developer-1px/zod-crud/issues/143
- Feature-level package naming pressure: https://github.com/developer-1px/zod-crud/issues/144
- Feature rename invalid identifier blocker: https://github.com/developer-1px/zod-crud/issues/145

## Suggested Local Work Items

- Keep moving app-owned patch helpers behind zod-crud extension commands where a matching feature concept exists.
- Keep mixed sparse record write fallback app-owned until sparse record upsert support exists.
- Keep undo tests that prove one cell/metadata edit reverts only that intended edit.
- Avoid imports from zod-crud private subpaths.

## Verification

```sh
pnpm exec tsc -b --pretty false
pnpm test
```
