# @spredsheet/grid-contract

Zod-backed stable contracts for ARIA grid state exchanged between renderers, tools, and storage boundaries.

Scope:

- `gridcell` ids
- active descendant state
- selection anchor state
- selected gridcell ids
- row, column, range, and full-grid selection commands

Naming contract:

- `activeDescendantId` follows WAI-ARIA `aria-activedescendant`.
- `selectedIds` follows WAI-ARIA `aria-selected`.
- `selectionAnchorId` follows the W3C Selection API anchor concept.
- `gridcell` follows the WAI-ARIA `gridcell` role.

Non-scope:

- React state ownership
- DOM focus restoration
- editor draft/caret state
- persistence and history
