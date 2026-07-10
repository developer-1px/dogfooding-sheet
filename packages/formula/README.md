# @spredsheet/formula

Internal package for the spreadsheet formula evaluator.

This is the staging package for the `@interactive-os/formula-engine`
standardization candidate registered in
[`../../docs/standardization/formula-engine.md`](../../docs/standardization/formula-engine.md).

Current public API:

```ts
import {
  applyFormulaFunctionCompletion,
  evaluateCell,
  formulaFunctionCompletions,
  refsInFormula,
} from '@spredsheet/formula'
```

`formulaFunctionCompletions(formula, caretOffset)` derives capped function-name
suggestions from the evaluator's supported function registry. Apply a selected
result with `applyFormulaFunctionCompletion(formula, completion)` to receive the
next formula and caret offset.

This package is intentionally private until the engine boundary is split into a
generic Excel-like formula core and spreadsheet-specific A1/range adapters.
