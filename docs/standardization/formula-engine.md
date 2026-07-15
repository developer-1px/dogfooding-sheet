# Formula Engine Standardization Registration

## Status

Internal package candidate.

The evaluator has been split into the private `@spredsheet/formula` workspace
package. It should be promoted to `@interactive-os/formula-engine` only after a
second non-spreadsheet consumer exists.

## Decision

Register the current spreadsheet formula evaluator as the seed for an
interactive-os formula engine standard.

The public concept is not "spreadsheet formulas for a spreadsheet app." The
public concept is:

> Excel-like formulas for interactive state, documents, grids, and generated UI.

Spreadsheet A1 references are one dialect of the engine, not the whole engine.

## Why This Belongs In Interactive OS

Formula languages are already used outside spreadsheets as a user-facing way to
bind derived values, visibility, validation, automation, and document fields.
The important primitive is a headless expression engine that can:

- evaluate a formula against external state,
- list the references a formula depends on,
- support dependency graph construction,
- allow host apps to resolve references,
- allow host apps to register functions,
- keep UI, storage, and document schema out of the engine.

This matches the interactive-os package bar: headless behavior, plain data,
stable semantics, and no app-specific UI.

## External References

- Microsoft Power Fx: Excel-like formulas used as a low-code language for apps
  and UI properties.
- OASIS OpenFormula: formal spreadsheet formula syntax and semantics.
- HyperFormula: headless TypeScript spreadsheet calculation engine.
- Airtable formulas: formula fields over table records.
- AppSheet expressions: formulas for app behavior, validation, virtual columns,
  and initial values.
- Coda formulas: formulas over documents and tables.
- Notion formulas: formulas over database properties.
- Smartsheet formulas: spreadsheet-style functions in a work management product.

These references support Excel-like formula syntax as a broader interaction
language, not only as spreadsheet implementation detail.

## Package Name

Target public package:

```txt
@interactive-os/formula-engine
```

Rejected names:

- `@interactive-os/spreadsheet-formula`: too narrow for A2UI, editor, document,
  and state binding use cases.
- `@interactive-os/expression`: too broad and easy to confuse with JavaScript
  expressions.
- `@interactive-os/reference-expression`: accurate but weaker than the existing
  Excel-like formula mental model.

## Scope

The public engine owns:

- parsing Excel-like formula syntax,
- evaluating formulas through a host-provided resolver,
- extracting references,
- compiling formulas for repeated evaluation,
- representing evaluation errors,
- registering functions,
- spreadsheet-compatible functions where semantics are documented,
- optional adapters for spreadsheet references and ranges.

The public engine does not own:

- React hooks or components,
- spreadsheet grid UI,
- localStorage,
- file download behavior,
- json-document document operations,
- app-specific schema,
- complete Excel compatibility.

## Core API Shape

The initial public shape should be resolver-first:

```ts
type FormulaValue = string | number | boolean | null

type FormulaEngine = {
  evaluate(expr: string): FormulaValue
  references(expr: string): string[]
  compile(expr: string): CompiledFormula
}

type CompiledFormula = {
  references: string[]
  evaluate(resolve: (ref: string) => FormulaValue | undefined): FormulaValue
}

function createFormulaEngine(options: {
  resolve: (ref: string) => FormulaValue | undefined
  functions?: Record<string, FormulaFunction>
  onError?: 'value' | 'throw'
}): FormulaEngine
```

Spreadsheet support should be an adapter:

```ts
function createSpreadsheetFormulaEngine(options: {
  cells: Record<string, string>
  columns?: readonly string[]
  rowCount?: number
}): FormulaEngine
```

## Dialect Policy

The standard syntax is Excel-like formula syntax.

The standard should not claim full Excel compatibility. It should document a
compatible subset and grow intentionally.

Core formula syntax should support non-A1 references so A2UI-style state can use
the same language:

```txt
=IF(user.role="admin", "show", "hide")
=CONCAT(firstName, " ", lastName)
=AND(isLoggedIn, plan="pro")
=IF(width>720, "desktop", "mobile")
```

Spreadsheet dialect support remains:

```txt
=SUM(A1:A10)
=IF(B2>100, "high", "low")
=D2*C2
```

## Split Plan

### Phase 0: Registration

Track this document as the standardization record.

### Phase 1: Internal Package

Done. The evaluator now lives in an internal workspace package:

```txt
packages/formula
```

Keep the current app API working:

```ts
evaluateCell(cells, raw)
refsInFormula(raw)
```

### Phase 2: Engine Boundary

Inside `packages/formula`, separate:

```txt
src/core
src/spreadsheet
```

`src/core` must not know about A1 cells, sheets, React, DOM, zod, or json-document.
`src/spreadsheet` may own A1 parsing, range expansion, and cell-map adapters.

### Phase 3: Second Consumer

Add a non-spreadsheet consumer before public promotion. Preferred candidates:

- A2UI formula-bound UI properties,
- editor inline calculation blocks,
- document table calculations.

### Phase 4: Public Promotion

Promote to `@interactive-os/formula-engine` after:

- core API is resolver-first,
- error semantics are documented,
- reference extraction is stable,
- at least two consumers use the engine,
- tests cover core and spreadsheet dialect separately,
- package has README, SPEC, build, test, and `sideEffects: false`.

## Acceptance Criteria

The internal package split is accepted when:

- `packages/formula` imports no React, DOM, zod, or json-document,
- current spreadsheet tests continue to pass,
- `spredsheet` imports formula through a package boundary,
- README explains that this is Excel-like, not Excel-complete.

The candidate is ready for public interactive-os promotion when:

- spreadsheet is not the only consumer,
- A1 references are adapter behavior,
- state/property references are supported or explicitly planned,
- reference extraction can drive dependency graphs,
- the package exposes no app-specific schema or UI.
