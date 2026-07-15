# @spredsheet/grid

Headless grid editing engine with no runtime dependencies.

Scope:

- A1 keys, column labels, and stable cell ids
- rectangular ranges and id sets
- goto/address parsing and selection address formatting
- keyboard navigation target calculation
- pure focus/anchor/selection state transitions
- pure fill and auto-fill write generation
- fill handle source/target calculation
- pure formula reference picking
- formula freeze write generation
- row and column structural transforms
- merge action and merge map calculation
- focus-based row and column action calculation
- pure TSV read/write conversion
- internal clipboard paste write generation
- pure edit state transitions
- pure sorting and aggregate helpers

Independence contract:

- no runtime dependencies
- no React or DOM access
- no system clipboard access
- no app-specific imports
- no validation, schema, persistence, or history ownership

Adapters own rendering, events, validation, persistence, and undo/redo. The engine only returns pure state transitions and cell writes.

Internal responsibility groups:

- `coordinates`: cell coordinate language and ids
- `geometry`: rectangles and rectangular id coverage
- `selection`: row, column, and full-grid id ranges; address parsing, formatting, and navigation targets
- `selection/selectionEngine`: focus, anchor, and selected id state transitions
- `clipboard`: grid-shaped payload conversion and internal clipboard write generation
- `editing`: focus/editing/draft state transitions, fill handle calculation, series extension, formula reference picking/freezing, and fill write generation
- `structure`: row/column transforms, focus actions, merge calculations, and formula reference repair
- `compute`: numeric parsing, sorting, and aggregate helpers

Non-scope:

- React
- DOM events
- system clipboard calls
- aria-kernel/APG behavior
- json-document patches/history
