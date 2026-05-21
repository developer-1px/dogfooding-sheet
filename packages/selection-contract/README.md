# @spredsheet/selection-contract

Zod-backed stable contracts for selectable descendants.

Scope:

- selectable descendant ids
- selected ids
- single-selection and multiple-selection capability
- selection anchor/focus interaction boundaries

Naming contract:

- `selectedIds` follows WAI-ARIA `aria-selected`.
- `multiselectable` follows WAI-ARIA `aria-multiselectable`.
- `anchorId` and `focusId` follow the W3C Selection API anchor/focus terms.
- `selectableId` follows WAI-ARIA selectable descendant language.

Non-scope:

- grid rows and columns
- DOM focus restoration
- `aria-activedescendant` adapter state
- editor draft/caret state
- persistence and history
