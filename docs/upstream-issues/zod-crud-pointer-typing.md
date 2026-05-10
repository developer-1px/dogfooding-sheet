# zod-crud issue draft

**Target repo**: developer-1px/zod-crud
**Title**: `JsonOps` path type rejects `Record<string, ...>` keys — every `add/remove/replace` requires `as never`

## Context

Building a spreadsheet whose schema is `{ cells: z.record(z.string(), z.string()) }`, every cell write looks like:

```ts
const writeCell = (k: string, v: string) => {
  if (v === '') {
    if (sheet.cells[k] !== undefined) ops.remove(`/cells/${k}` as never)
  } else if (sheet.cells[k] === undefined) {
    ops.add(`/cells/${k}` as never, v as never)
  } else if (sheet.cells[k] !== v) {
    ops.replace(`/cells/${k}` as never, v as never)
  }
}
```

The `as never` casts are required because `PointerOf<T>` rejects dynamic record keys at the type level. The runtime accepts and operates on `/cells/A1` correctly — only the static type is unhappy.

## Suggested fix

`PointerOf<T>` should expand `Record<K, V>` into the union `\`/${parentPath}/${string}\`` for the value type `V`. Specifically:

```ts
type PointerOf<T> = T extends Record<string, infer V>
  ? `/${string}` | (V extends object ? `/${string}${PointerOf<V>}` : never)
  : ...
```

(rough sketch — actual impl needs to thread the parent path).

## Why this matters

Anyone using zod-crud for a "flat dictionary" schema (lookup tables, sparse maps, A1 cells, settings dicts) hits this on every operation. `as never` casting:

- defeats the type safety the library promises
- spreads through every call site
- makes refactors riskier (TS won't catch path typos)

## Repro

```ts
const Schema = z.object({ items: z.record(z.string(), z.string()) })
const [data, ops] = useJson(Schema, { items: {} })

ops.add('/items/foo', 'bar')        // ❌ TS error: Argument of type '"/items/foo"' is not assignable to type 'never'
ops.add('/items/foo' as never, 'bar' as never) // ✅ works at runtime
```

## Related

`refactor(zod-crud): JsonOps contract type 를 jsonOps.ts boundary 모듈로 분리` (155a5b4) — might be a good place to address this.
