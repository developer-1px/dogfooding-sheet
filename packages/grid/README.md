# @spredsheet/grid

Internal grid data engine for `spredsheet`.

Scope:

- A1 keys and DOM cell ids
- rectangular ranges and id sets
- row and column structural transforms
- pure TSV read/write conversion
- pure edit state transitions
- pure sorting and aggregate helpers

Internal responsibility groups:

- `coordinates`: cell coordinate language and ids
- `geometry`: rectangles and rectangular id coverage
- `selection`: row, column, and full-grid id ranges
- `clipboard`: grid-shaped payload conversion
- `editing`: focus/editing/draft state transitions
- `structure`: row/column transforms and formula reference repair
- `compute`: numeric parsing, sorting, and aggregate helpers

Non-scope:

- React
- DOM events
- system clipboard calls
- aria-kernel/APG behavior
- zod-crud patches/history
