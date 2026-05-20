# formula

Stand-alone spreadsheet formula evaluator. No dependencies on React, Zod, or any
spreadsheet domain code — only requires a `Record<string, string>` cell map keyed
by A1 notation (e.g. `{ A1: '5', B2: '=A1*2' }`).

## API

```ts
import { evaluateCell, refsInFormula } from './lib/formula'

evaluateCell(cells, '=SUM(A1:A3)')        // → "10"
refsInFormula('=A1+B2:B4')                  // → ['A1', 'B2', 'B3', 'B4']
```

`evaluateCell(cells, raw)` — Returns the evaluated value as a string. Plain
values pass through unchanged. Formulas (starting with `=`) are recursively
evaluated with circular-reference protection (returns `#CYCLE!` for cycles).
Errors return `#ERR`, `#REF!`, or `#N/A`.

`refsInFormula(raw)` — Extracts cell references from a formula string. Useful
for highlighting referenced cells while editing, or for dependency tracking.

## Supported functions

- **Aggregates**: SUM, AVERAGE, MIN, MAX, COUNT, MEDIAN, STDEV, VAR
- **Conditional aggregates**: COUNTIF, SUMIF, COUNTA
- **Math**: ROUND, ROUNDUP, ROUNDDOWN, ABS, FLOOR, CEIL, INT, SQRT, POWER, MOD, LN, LOG, EXP
- **Logic**: IF, AND, OR, NOT, ISBLANK, ISNUMBER, ISTEXT
- **Text**: CONCAT, LEN, UPPER, LOWER, LEFT, RIGHT, MID, TRIM
- **Date**: TODAY, NOW, DATE, YEAR, MONTH, DAY, DAYS
- **Lookup**: VLOOKUP, INDEX, MATCH

## Cell ID grammar

Cells are addressed in A1 notation: column letters `A-J` (10 columns) followed by
1-based row number. Ranges use `A1:C3`. Adjust `A-J` regex constants in `parse.ts`
to widen the column space.

## Layout

- `parse.ts` — A1 / range regex, ref extraction
- `eval.ts` — main evaluator + arithmetic fallback
- `dispatch.ts` — function dispatcher (router only)
- `args.ts` — argument splitter, evaluator, Ctx
- `marker.ts` — text/numeric return policy
- `aggregates.ts`, `condAggregates.ts`, `dateFns.ts`, `textFns.ts`, `mathFns.ts`, `logicFns.ts`, `lookup.ts` — function families

## Tests

`pnpm test` runs vitest. ~50 tests cover function categories and edge cases
(circular refs, `#REF!`, boolean coercion, text marker preservation).
