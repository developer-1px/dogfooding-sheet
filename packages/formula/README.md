# @spredsheet/formula

Internal package for the spreadsheet formula evaluator.

This is the staging package for the `@interactive-os/formula-engine`
standardization candidate registered in
[`../../docs/standardization/formula-engine.md`](../../docs/standardization/formula-engine.md).

Current public API:

```ts
import { evaluateCell, refsInFormula } from '@spredsheet/formula'
```

This package is intentionally private until the engine boundary is split into a
generic Excel-like formula core and spreadsheet-specific A1/range adapters.

