# aria-kernel issue draft

**Target repo**: developer-1px/aria-kernel
**Title**: `useGridPattern.rows` silently filters out childless entities — needs explicit documentation

## Context

While dogfooding `useGridPattern` to build a Google-Sheets-like grid, the consumer lost ~30 iterations of work to a silent filter inside the hook.

## What happened

The grid is built by feeding a tree like:

```ts
const tree = [
  ...COL_LETTERS.map((c) => ({ id: `h-${c}`, label: c })),                       // childless header entities
  ...Array.from({ length: 20 }, (_, r) => ({ id: `r${r}`, children: [/*cells*/] })) // data rows with children
]
return fromTree(tree)
```

The natural mental model is "rows includes everything I put at the top level". So the consumer wrote:

```tsx
const dataRows = rows.slice(COL_LETTERS.length) // skip headers, keep data
```

But internally `useGridPattern` already filters:

```ts
const rowIds = getCollectionChildren(data, containerId)
  .filter((id) => getChildren(data, id).length > 0)
```

→ Column-header entities (no children) are **already absent** from `rows`. The consumer's `slice(10)` therefore dropped the **first 10 data rows**. The seed data at rows 1-10 was invisible.

The mistake was silent — no error, no console warning, half the grid missing.

## Suggested fix

1. **Documentation patch** on `useGridPattern.rows` (and on the `GridCell[]` / row return type docstring):
   > `rows` only contains entities that have children. Childless top-level entities (e.g. column headers fed into the tree) are filtered out. Pass column headers separately and render them via `columnHeaderProps`.

2. **Optional dev-mode warning**: if a top-level childless entity is detected in `data`, log a warning suggesting it be rendered via `columnHeaderProps` rather than expected in `rows`.

## Why this matters

This mistake is structurally hard to catch without an integration test that asserts on visible cell content. The expected mental model ("what I put in is what I get out") doesn't match the actual filter.

## Repro

The `gridSortable` demo in `apps/site/src/demos/gridSortable.tsx` follows the correct pattern (no slice), but doesn't document why. Anyone implementing a fresh consumer who looks at `useGridPattern`'s d.ts alone will not learn this.
