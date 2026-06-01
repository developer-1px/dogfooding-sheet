# zod-crud update notes

Date: 2026-05-22

## Current State

`spredsheet` uses `useJSONDocument` and wraps it with a local `SheetOps`.

- Good: document state and undo/redo are already backed by zod-crud.
- Good: `dictOps` now favors surgical key patches instead of whole-dict replacement.
- App-owned: grid selection, TSV/browser clipboard, formulas, visibility, and sheet UI commands.

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

3. Keep TSV/system clipboard outside zod-crud.
   zod-crud clipboard is a headless JSON payload buffer; table text/html formats are spreadsheet adapters.

4. Consider `doc.commit(..., { selection })` later only if sheet model selection needs to be stored with history.

5. Track upstream support type exports.
   Once zod-crud exports all public support types, `SheetOps` typing can become cleaner.

## Suggested Local Work Items

- Keep expanding surgical patch helpers for styles, formats, validation, hidden rows/cols, and cell metadata.
- Add undo tests that prove one cell/metadata edit reverts only that intended edit.
- Avoid imports from zod-crud private subpaths.

## Verification

```sh
npm -C ../spredsheet run typecheck
npm -C ../spredsheet test
```
