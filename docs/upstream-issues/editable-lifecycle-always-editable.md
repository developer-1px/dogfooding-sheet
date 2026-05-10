# editable-lifecycle issue draft

**Target repo**: developer-1px/editable-lifecycle
**Title**: `useEditable` doesn't fit always-editable inputs (FormulaBar / form-field use cases)

## Context

While dogfooding `useEditable` at every inline-edit site of a Google-Sheets-like grid, one site failed to fit: the **formula bar**. A formula bar is a single text `<input>` that's *always* editable — there's no enter/exit "edit mode," no per-row focus axis, and no commit-target id distinct from the focus cell.

## What broke

Wiring `useEditable` to FormulaBar required:

```ts
const ed = useEditable<string>({ getValue: () => value, onCommit: (_, d) => onCommit(d) })
useEffect(() => { if (addr) ed.startEdit(addr, value, { caret: 'preserve' }) }, [addr, value])
```

Two real problems:

1. **Auto-focus steals from grid.** `startEdit` (per v0.1.1) auto-focuses the input. So whenever the focused cell changes (e.g. user clicks A2 in the grid), the formula bar grabs focus instead, breaking grid keyboard navigation. The grid's per-cell auto-focus is the right behavior; FormulaBar's auto-focus is wrong.

2. **`{ caret: 'preserve' }` still triggers a focus.** Even with preserve mode, the underlying ref-attach assigns `el.focus()`. There's no opt-out.

The result: replacing 8 lines of plain `useState + useEffect + onChange/onKeyDown/onBlur` with `useEditable` introduced a regression. Reverted to plain state.

## Suggested fix

Either:

- Add `autoFocus: false` option that suppresses ref-side `focus()` while still owning caret/composition/commit.
- Or, document that `useEditable` is for **modal edit** (toggle-on with focus, toggle-off on commit) and **not** for always-editable text fields.

A clearer mental model: `useEditable` ≈ inline cell editor; ordinary `useState`+handlers ≈ form input. The distinction is the focus axis (transient vs persistent).

## Why this matters

Anyone wiring `useEditable` into a non-grid context (formula bar, search box that should reflect external value, settings field) will hit this. The library could either explicitly scope itself to grid-style editors or grow a focus-policy escape hatch.
